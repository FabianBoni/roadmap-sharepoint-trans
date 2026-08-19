import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { requireSuperAdminAccess } from '@/utils/superAdminAccessServer';
import { mapInstanceRecord, toInstanceSummary } from '@/utils/instanceConfig';
import {
  deleteSharePointListForInstance,
  ensureSharePointListForInstance,
  getSharePointListOverview,
  provisionSharePointForInstance,
  type SharePointListEnsureResult,
  type SharePointListOverviewEntry,
} from '@/utils/sharePointProvisioning';
import type { RoadmapInstanceConfig, RoadmapInstanceHealth } from '@/types/roadmapInstance';
import { SHAREPOINT_LIST_DEFINITIONS } from '@/utils/sharePointLists';
import { sanitizeSlug } from '../helpers';

const healthIssues = (health: RoadmapInstanceHealth): string[] => {
  const issues: string[] = [];
  if (health.compatibility?.status === 'error') {
    issues.push(
      ...(health.compatibility.errors ?? ['SharePoint-Kompatibilitätsprüfung fehlgeschlagen'])
    );
  }
  if (health.permissions.status !== 'ok') {
    issues.push(
      health.permissions.message ||
        `Berechtigungsprüfung nicht erfolgreich (${health.permissions.status})`
    );
  }
  Object.entries(health.lists.errors).forEach(([key, message]) => {
    issues.push(`${key}: ${message}`);
  });
  if (health.lists.missing.length > 0) {
    issues.push(`Fehlende Listen: ${health.lists.missing.join(', ')}`);
  }
  Object.entries(health.lists.schemaMismatches ?? {}).forEach(([list, mismatch]) => {
    if (mismatch.missing.length > 0) {
      issues.push(`${list}: fehlende Spalten: ${mismatch.missing.join(', ')}`);
    }
    mismatch.typeMismatches.forEach((field) => {
      issues.push(`${list}.${field.field}: Typ ${field.actual}, erwartet ${field.expected}`);
    });
    if (mismatch.unexpected.length > 0) {
      issues.push(`${list}: unerwartete Spalten: ${mismatch.unexpected.join(', ')}`);
    }
  });
  return issues;
};

const listIssues = (result: SharePointListEnsureResult): string[] => {
  const health: RoadmapInstanceHealth = {
    permissions: { status: 'ok' },
    lists: result.lists,
  };
  return healthIssues(health).filter((message) => !message.startsWith('Fehlende Listen:'));
};

const overviewErrors = (overview: SharePointListOverviewEntry[]): Record<string, string> => {
  const errors: Record<string, string> = {};
  overview.forEach((entry) => {
    if (entry.errors?.length) errors[`overview:${entry.key}`] = entry.errors.join('; ');
  });
  return errors;
};

const buildOverviewHealth = (
  instance: RoadmapInstanceConfig,
  overview: SharePointListOverviewEntry[],
  operation?: SharePointListEnsureResult,
  actionError?: { key: string; message: string }
): RoadmapInstanceHealth => {
  const created = new Set(operation?.lists.created ?? []);
  const errors = {
    ...overviewErrors(overview),
    ...(operation?.lists.errors ?? {}),
    ...(actionError ? { [`action:${actionError.key}`]: actionError.message } : {}),
  };
  const previousPermission = instance.health?.permissions;
  const permissions = actionError
    ? (previousPermission ?? { status: 'unknown' as const })
    : previousPermission?.status === 'ok'
      ? previousPermission
      : {
          status: 'unknown' as const,
          message: 'Listenstatus aktualisiert; Berechtigungsprüfung nicht ausgeführt.',
        };

  return {
    checkedAt: new Date().toISOString(),
    compatibility: instance.health?.compatibility ?? { status: 'unknown' },
    permissions,
    lists: {
      ensured: overview
        .filter((entry) => entry.exists && !created.has(entry.resolvedTitle ?? entry.title))
        .map((entry) => entry.resolvedTitle ?? entry.title),
      created: Array.from(created),
      missing: overview.filter((entry) => !entry.exists).map((entry) => entry.title),
      fieldsCreated: operation?.lists.fieldsCreated ?? {},
      fieldsUpdated: operation?.lists.fieldsUpdated ?? {},
      overwriteRequired: operation?.lists.overwriteRequired ?? {},
      errors,
      schemaMismatches: operation?.lists.schemaMismatches ?? {},
    },
  };
};

const persistHealth = async (recordId: number, health: RoadmapInstanceHealth) => {
  const updated = await prisma.roadmapInstance.update({
    where: { id: recordId },
    data: {
      spHealthJson: JSON.stringify(health),
      spHealthCheckedAt: new Date(),
    },
    include: { hosts: true },
  });
  return toInstanceSummary(mapInstanceRecord(updated));
};

const refreshOverviewHealth = async (
  recordId: number,
  instance: RoadmapInstanceConfig,
  operation?: SharePointListEnsureResult,
  actionError?: { key: string; message: string }
) => {
  const overview = await getSharePointListOverview(instance);
  const health = buildOverviewHealth(instance, overview, operation, actionError);
  const updatedInstance = await persistHealth(recordId, health);
  return { health, overview, instance: updatedInstance };
};

const persistActionFailure = async (
  recordId: number,
  instance: RoadmapInstanceConfig,
  key: string,
  message: string
) => {
  try {
    return await refreshOverviewHealth(recordId, instance, undefined, { key, message });
  } catch (overviewError) {
    const overviewMessage =
      overviewError instanceof Error ? overviewError.message : 'Listenübersicht fehlgeschlagen';
    const health: RoadmapInstanceHealth = {
      checkedAt: new Date().toISOString(),
      compatibility: instance.health?.compatibility ?? { status: 'unknown' },
      permissions: instance.health?.permissions ?? { status: 'unknown' },
      lists: {
        ensured: instance.health?.lists.ensured ?? [],
        created: instance.health?.lists.created ?? [],
        missing: instance.health?.lists.missing ?? [],
        fieldsCreated: {},
        fieldsUpdated: {},
        errors: {
          [`action:${key}`]: message,
          __overview: overviewMessage,
        },
        schemaMismatches: {},
      },
    };
    const updatedInstance = await persistHealth(recordId, health);
    return { health, overview: [] as SharePointListOverviewEntry[], instance: updatedInstance };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug;
  const slug =
    typeof slugParam === 'string'
      ? sanitizeSlug(slugParam)
      : Array.isArray(slugParam) && slugParam.length > 0
        ? sanitizeSlug(slugParam[0])
        : null;

  if (!slug) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  try {
    await requireSuperAdminAccess(req);
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const record = await prisma.roadmapInstance.findUnique({
    where: { slug },
    include: { hosts: true },
  });
  if (!record) {
    return res.status(404).json({ error: 'Instance not found' });
  }

  const instance = mapInstanceRecord(record);

  if (req.method === 'GET') {
    try {
      const lists = await getSharePointListOverview(instance);
      return res.status(200).json({ lists });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('[instances:lists] overview failed', error);
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    const { key } = req.body ?? {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'key is required' });
    }

    if (key === '__all__') {
      try {
        const result = await provisionSharePointForInstance(instance);
        const updatedInstance = await persistHealth(record.id, result);
        const issues = healthIssues(result);
        if (issues.length > 0) {
          return res.status(502).json({
            error: 'Provisionierung nicht vollständig erfolgreich',
            details: { phase: 'provision', messages: issues, health: result },
            result,
            instance: updatedInstance,
            mode: 'all',
          });
        }
        return res.status(200).json({ ok: true, result, instance: updatedInstance, mode: 'all' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        const details = (error as Error & { details?: unknown })?.details;
        let refreshed: Awaited<ReturnType<typeof persistActionFailure>> | null = null;
        try {
          refreshed = await persistActionFailure(record.id, instance, '__all__', message);
        } catch (persistError) {
          console.error('[instances:lists] failed to persist ensure-all health', persistError);
        }
        console.error('[instances:lists] ensure all failed', error);
        return res.status(502).json({
          error: message,
          details: details ?? {
            phase: 'provision',
            messages: [message],
            health: refreshed?.health,
          },
          instance: refreshed?.instance,
          mode: 'all',
        });
      }
    }

    const definition = SHAREPOINT_LIST_DEFINITIONS.find((candidate) => candidate.key === key);
    if (!definition) {
      return res.status(400).json({ error: `Unbekannter Listen-Schlüssel "${key}"` });
    }

    try {
      const result = await ensureSharePointListForInstance(instance, key);
      const refreshed = await refreshOverviewHealth(record.id, instance, result);
      const target = refreshed.overview.find((entry) => entry.key === key);
      const issues = listIssues(result);
      if (!target?.exists)
        issues.push(`${definition.title}: Liste ist nach der Aktion nicht vorhanden`);
      if (target?.errors?.length) issues.push(...target.errors);
      if (issues.length > 0) {
        return res.status(502).json({
          error: `Liste "${definition.title}" konnte nicht vollständig abgeglichen werden`,
          details: { phase: 'ensure', listKey: key, messages: issues, health: refreshed.health },
          result,
          instance: refreshed.instance,
        });
      }
      return res.status(200).json({
        ok: true,
        result,
        health: refreshed.health,
        instance: refreshed.instance,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      const details = (error as Error & { details?: unknown })?.details;
      let refreshed: Awaited<ReturnType<typeof persistActionFailure>> | null = null;
      try {
        refreshed = await persistActionFailure(record.id, instance, key, message);
      } catch (persistError) {
        console.error('[instances:lists] failed to persist ensure health', persistError);
      }
      console.error('[instances:lists] ensure failed', error);
      return res.status(502).json({
        error: message,
        details: details ?? {
          phase: 'ensure',
          listKey: key,
          messages: [message],
          health: refreshed?.health,
        },
        instance: refreshed?.instance,
      });
    }
  }

  if (req.method === 'DELETE') {
    const { key } = req.body ?? {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'key is required' });
    }
    const definition = SHAREPOINT_LIST_DEFINITIONS.find((candidate) => candidate.key === key);
    if (!definition) {
      return res.status(400).json({ error: `Unbekannter Listen-Schlüssel "${key}"` });
    }
    try {
      const result = await deleteSharePointListForInstance(instance, key);
      const refreshed = await refreshOverviewHealth(record.id, instance);
      const target = refreshed.overview.find((entry) => entry.key === key);
      const issues = [...(result.errors ?? [])];
      if (target?.exists) {
        issues.push(`${definition.title}: Liste ist nach dem Löschen weiterhin vorhanden`);
      }
      if (target?.errors?.length) issues.push(...target.errors);
      if (issues.length > 0) {
        return res.status(502).json({
          error: `Liste "${definition.title}" konnte nicht verlässlich gelöscht werden`,
          details: { phase: 'delete', listKey: key, messages: issues, health: refreshed.health },
          result,
          instance: refreshed.instance,
        });
      }
      return res.status(200).json({
        ok: true,
        result,
        health: refreshed.health,
        instance: refreshed.instance,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      const details = (error as Error & { details?: unknown })?.details;
      let refreshed: Awaited<ReturnType<typeof persistActionFailure>> | null = null;
      try {
        refreshed = await persistActionFailure(record.id, instance, key, message);
      } catch (persistError) {
        console.error('[instances:lists] failed to persist delete health', persistError);
      }
      console.error('[instances:lists] delete failed', error);
      return res.status(502).json({
        error: message,
        details: details ?? {
          phase: 'delete',
          listKey: key,
          messages: [message],
          health: refreshed?.health,
        },
        instance: refreshed?.instance,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
