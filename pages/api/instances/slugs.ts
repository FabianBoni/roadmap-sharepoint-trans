import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { extractAdminSession } from '@/utils/apiAuth';
import { getInstanceBadge } from '@/utils/instanceMirroring';
import {
  isReadSessionAllowedForInstance,
  resolveSessionDepartmentAcrossInstances,
} from '@/utils/instanceAccessServer';
import { isDbSuperAdminSession } from '@/utils/superAdminAccessServer';

const HTTP_URL_REGEX = /^https?:\/\//i;

type MetadataRecord = Record<string, unknown>;

const isRecord = (value: unknown): MetadataRecord | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as MetadataRecord;
  }
  return undefined;
};

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const firstStringFromArray = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    const candidate = toTrimmedString(entry);
    if (candidate) return candidate;
  }
  return null;
};

const parseMetadata = (settingsJson?: string | null): MetadataRecord | undefined => {
  if (!settingsJson) return undefined;
  try {
    const parsed = JSON.parse(settingsJson);
    const parsedRecord = isRecord(parsed);
    const metadataCandidate = parsedRecord?.metadata;
    return isRecord(metadataCandidate);
  } catch {
    return undefined;
  }
};

const buildTargetFromHost = (hostValue: string | null, path?: string | null): string | null => {
  if (!hostValue) return null;
  const trimmed = hostValue.trim();
  if (!trimmed) return null;
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  if (HTTP_URL_REGEX.test(trimmed)) {
    return `${trimmed.replace(/\/$/, '')}${normalizedPath}`;
  }
  if (trimmed.startsWith('//')) {
    return `${trimmed.replace(/\/$/, '')}${normalizedPath}`;
  }
  if (trimmed.startsWith('/')) {
    const base = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    return `${base}${normalizedPath}`;
  }
  const sanitizedHost = trimmed.replace(/\/+$/, '');
  return `//${sanitizedHost}${normalizedPath}`;
};

const resolveFrontendTarget = (settingsJson: string | null, hosts: string[]): string | null => {
  const metadata = parseMetadata(settingsJson);
  const frontendConfig = isRecord(metadata?.frontend);
  const directUrl = toTrimmedString(metadata?.frontendUrl) || toTrimmedString(frontendConfig?.url);
  if (directUrl) {
    return directUrl;
  }
  const hostCandidate =
    toTrimmedString(metadata?.frontendHost) ||
    firstStringFromArray(metadata?.frontendHosts) ||
    toTrimmedString(frontendConfig?.host) ||
    hosts[0] ||
    null;
  if (!hostCandidate) return null;
  const pathCandidate =
    toTrimmedString(metadata?.frontendPath) || toTrimmedString(frontendConfig?.path) || null;
  return buildTargetFromHost(hostCandidate, pathCandidate);
};

type InstanceOptionRecord = {
  slug: string;
  displayName: string | null;
  settingsJson?: string | null;
};

const toInstanceOption = (record: InstanceOptionRecord) => ({
  slug: record.slug,
  displayName: record.displayName || record.slug,
  badge: getInstanceBadge(parseMetadata(record.settingsJson ?? null)),
});

export const buildInstanceBadgeOptions = (records: InstanceOptionRecord[]) =>
  records
    .map((record) => toInstanceOption(record))
    .filter(
      (option): option is ReturnType<typeof toInstanceOption> & { badge: string } =>
        typeof option.badge === 'string' && option.badge.trim().length > 0
    );

const toLandingInstance = (record: {
  slug: string;
  displayName: string | null;
  department: string | null;
  description: string | null;
  sharePointSiteUrlProd: string | null;
  sharePointSiteUrlDev: string;
  sharePointStrategy: string | null;
  settingsJson: string | null;
  landingPage: string | null;
  hosts: Array<{ host: string }>;
}) => {
  const hosts = record.hosts.map((host) => host.host);
  return {
    slug: record.slug,
    displayName: record.displayName || record.slug,
    department: record.department ?? null,
    description: record.description ?? null,
    sharePointUrl: (record.sharePointSiteUrlProd || record.sharePointSiteUrlDev).replace(/\/$/, ''),
    strategy: record.sharePointStrategy || 'kerberos',
    hosts,
    frontendTarget: resolveFrontendTarget(record.settingsJson ?? null, hosts),
    landingPage: record.landingPage ?? null,
  };
};

const instanceQuery = {
  select: {
    slug: true,
    displayName: true,
    department: true,
    description: true,
    sharePointSiteUrlProd: true,
    sharePointSiteUrlDev: true,
    sharePointStrategy: true,
    settingsJson: true,
    landingPage: true,
    hosts: {
      select: {
        host: true,
      },
    },
  },
} as const;

/**
 * Authenticated endpoint: returns authorized instances for navigation plus all configured
 * instance badges for project mirroring. Badge visibility does not grant instance access.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const details = String(req.query.details || '').toLowerCase() === 'landing';
    const session = await extractAdminSession(req);
    if (!session) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const forwardedHeaders = {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    };
    const isSuperAdmin = await isDbSuperAdminSession(session);

    const allRecords = await prisma.roadmapInstance.findMany({
      ...instanceQuery,
      orderBy: { slug: 'asc' },
    });
    const badgeOptions = buildInstanceBadgeOptions(allRecords);

    if (isSuperAdmin) {
      const instances = details
        ? allRecords.map((r) => toLandingInstance(r))
        : allRecords.map((r) => toInstanceOption(r));
      return res.status(200).json({ instances, badgeOptions });
    }

    const resolvedDepartment = await resolveSessionDepartmentAcrossInstances({
      session,
      instanceSlugs: allRecords.map((record) => record.slug),
      requestHeaders: forwardedHeaders,
    });

    const checks = await Promise.all(
      allRecords.map(async (r) => ({
        record: r,
        allowed: await isReadSessionAllowedForInstance({
          session,
          instance: { slug: r.slug },
          requestHeaders: forwardedHeaders,
          knownSuperAdmin: false,
          resolvedDepartment,
          allowSharePointFallback: false,
        }),
      }))
    );

    const instances = checks
      .filter((c) => c.allowed)
      .map((c) => (details ? toLandingInstance(c.record) : toInstanceOption(c.record)));

    return res.status(200).json({ instances, badgeOptions });
  } catch (error) {
    console.error('[instances:slugs] failed to load slugs', error);
    return res.status(500).json({ error: 'Failed to load instances' });
  }
}
