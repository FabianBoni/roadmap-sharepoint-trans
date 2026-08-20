import type { NextApiHandler, NextApiRequest } from 'next';
import prisma from '@/lib/prisma';
import { extractAdminSession, type AdminSessionPayload } from '@/utils/apiAuth';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const AUDIT_VISIBILITIES = new Set(['instance', 'admin', 'support', 'security', 'system']);
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_.:-]*$/;

export type AuditEventDescriptor = {
  action: string;
  entityType: string;
  entityId?: string | number | null;
  entityLabel?: string | null;
  instanceSlug?: string | null;
  visibility?: 'instance' | 'admin' | 'support' | 'security' | 'system';
};

type AuditEventCreateInput = {
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  actorKey: string;
  actorDisplayName: string | null;
  actorSource: string | null;
  instanceSlug: string | null;
  visibility: string;
  requestMethod: string;
  requestPath: string | null;
};

export type AuditEventWriter = (data: AuditEventCreateInput) => Promise<unknown>;

type AuditContext = {
  req: Pick<NextApiRequest, 'method' | 'url'>;
  session: AdminSessionPayload;
};

type RunWithAuditOptions<T> = AuditContext & {
  event: AuditEventDescriptor | ((result: T) => AuditEventDescriptor);
  writer?: AuditEventWriter;
};

export type ActivityAuditOptions = {
  resolveEvent?: (context: {
    req: NextApiRequest;
    session: AdminSessionPayload;
    statusCode: number;
  }) => AuditEventDescriptor | null | undefined;
  writer?: AuditEventWriter;
  sessionResolver?: (req: NextApiRequest) => Promise<AdminSessionPayload | null>;
  instanceSlugResolver?: (req: NextApiRequest) => Promise<string | null>;
};

const cleanText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const cleaned = String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
};

const cleanIdentifier = (value: unknown, field: string): string => {
  const normalized = cleanText(value, 80)?.toLowerCase() ?? '';
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(`Invalid audit ${field}`);
  }
  return normalized;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const resolveAuditActor = (
  session: AdminSessionPayload
): {
  actorKey: string;
  actorDisplayName: string | null;
  actorSource: string | null;
} => {
  const entra = asRecord(session.entra);
  const tenantId = cleanText(entra?.tenantId, 80);
  const objectId = cleanText(entra?.id, 80);
  const upn = cleanText(entra?.upn, 320);
  const mail = cleanText(entra?.mail, 320);
  const username = cleanText(session.username, 320);
  const displayName = cleanText(session.displayName, 160) || username || upn || mail;
  const actorKey = cleanText(
    tenantId && objectId ? `${tenantId}:${objectId}` : upn || mail || username,
    320
  )?.toLowerCase();

  if (!actorKey) throw new Error('Cannot audit an unidentified session');

  return {
    actorKey,
    actorDisplayName: displayName,
    actorSource: cleanText(session.source, 40)?.toLowerCase() ?? null,
  };
};

const requestPathWithoutQuery = (url: string | undefined): string | null => {
  if (!url) return null;
  // Query strings commonly contain instance selectors and may contain tokens.
  // Persist only the bounded route path, never the query or URL fragment.
  const path = url.split(/[?#]/, 1)[0];
  return cleanText(path, 240);
};

const inferEventFromRequest = (
  req: NextApiRequest,
  resolvedInstanceSlug: string | null
): AuditEventDescriptor => {
  const method = String(req.method || '').toUpperCase();
  const verb = method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated';
  const path = requestPathWithoutQuery(req.url) || '';
  const segments = path
    .split('/')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
  const apiIndex = segments.indexOf('api');
  const resourceSegment = segments[apiIndex >= 0 ? apiIndex + 1 : 0] || 'resource';
  let entityType =
    resourceSegment.length > 3 && resourceSegment.endsWith('ies')
      ? `${resourceSegment.slice(0, -3)}y`
      : resourceSegment.length > 1 && resourceSegment.endsWith('s')
        ? resourceSegment.slice(0, -1)
        : resourceSegment;
  const possibleId = segments[apiIndex >= 0 ? apiIndex + 2 : 1];
  const entityId =
    possibleId && (/^\d+$/.test(possibleId) || /^[0-9a-f-]{16,}$/i.test(possibleId))
      ? possibleId
      : null;
  let action = `${entityType}.${verb}`;
  if (segments.includes('reorder')) {
    entityType = `${entityType}_order`;
    action = `${entityType}.reordered`;
  } else if (resourceSegment === 'feedback' && segments.includes('vote')) {
    entityType = 'feedback_vote';
    action = 'feedback_vote.vote_set';
  } else if (resourceSegment === 'attachments' && method === 'POST') {
    entityType = 'attachment';
    action = 'attachment.uploaded';
  }
  const visibility: AuditEventDescriptor['visibility'] =
    resourceSegment === 'auth'
      ? 'security'
      : resourceSegment === 'support-chat' || segments.includes('support-chat')
        ? 'support'
        : resourceSegment === 'admin' ||
            resourceSegment === 'superadmins' ||
            resourceSegment === 'instances' ||
            resourceSegment === 'instance-admin-users'
          ? 'admin'
          : 'instance';

  return {
    action,
    entityType,
    entityId,
    visibility,
    instanceSlug: resolvedInstanceSlug,
  };
};

export const buildAuditEventData = (
  context: AuditContext,
  event: AuditEventDescriptor
): AuditEventCreateInput => {
  const requestMethod = cleanText(context.req.method, 10)?.toUpperCase() ?? '';
  if (!MUTATING_METHODS.has(requestMethod)) {
    throw new Error(
      `Audit events require a mutating HTTP method, received ${requestMethod || 'none'}`
    );
  }

  const actor = resolveAuditActor(context.session);
  const visibility = cleanText(event.visibility || 'instance', 20)?.toLowerCase() ?? '';
  if (!AUDIT_VISIBILITIES.has(visibility)) throw new Error('Invalid audit visibility');
  return {
    action: cleanIdentifier(event.action, 'action'),
    entityType: cleanIdentifier(event.entityType, 'entity type'),
    entityId: cleanText(event.entityId, 160),
    entityLabel: cleanText(event.entityLabel, 240),
    ...actor,
    instanceSlug: cleanText(event.instanceSlug, 120)?.toLowerCase() ?? null,
    visibility,
    requestMethod,
    requestPath: requestPathWithoutQuery(context.req.url),
  };
};

const defaultWriter: AuditEventWriter = (data) => prisma.auditEvent.create({ data });

/**
 * Persists a deliberately small audit record. Callers can only pass explicit
 * display metadata; request bodies, cookies, authorization headers, IPs and
 * query values are neither accepted nor read by this function.
 */
export async function recordAuditEvent(
  context: AuditContext,
  event: AuditEventDescriptor,
  writer: AuditEventWriter = defaultWriter
): Promise<void> {
  await writer(buildAuditEventData(context, event));
}

/**
 * Runs a mutation first and records it only after it succeeds. The descriptor
 * callback may derive safe identifiers/labels from the operation result.
 * Audit persistence is awaited so a successful API response cannot overtake it.
 */
export async function runWithAudit<T>(
  options: RunWithAuditOptions<T>,
  mutation: () => Promise<T>
): Promise<T> {
  const result = await mutation();
  const event = typeof options.event === 'function' ? options.event(result) : options.event;
  await recordAuditEvent(options, event, options.writer);
  return result;
}

/**
 * Wraps an existing Pages API handler without changing its response contract.
 * The user session is captured before the handler runs (important for logout),
 * but persistence only happens after a 2xx/3xx mutating response. Audit storage
 * errors are deliberately fail-open and never turn a completed business action
 * into an apparent API failure.
 */
export function withActivityAudit(
  handler: NextApiHandler,
  options: ActivityAuditOptions = {}
): NextApiHandler {
  return async (req, res) => {
    const method = String(req.method || '').toUpperCase();
    const isMutation = MUTATING_METHODS.has(method);
    const resolveSession = options.sessionResolver ?? extractAdminSession;
    const resolveInstanceSlug =
      options.instanceSlugResolver ??
      (async (request: NextApiRequest) =>
        (await getInstanceConfigFromRequest(request).catch(() => null))?.slug ?? null);
    const [session, instanceSlug] = isMutation
      ? await Promise.all([
          resolveSession(req).catch(() => null),
          resolveInstanceSlug(req).catch(() => null),
        ])
      : [null, null];

    const result = await handler(req, res);
    if (!isMutation || !session || res.statusCode < 200 || res.statusCode >= 400) {
      return result;
    }

    try {
      const event = options.resolveEvent
        ? options.resolveEvent({ req, session, statusCode: res.statusCode })
        : inferEventFromRequest(req, instanceSlug);
      if (event) await recordAuditEvent({ req, session }, event, options.writer);
    } catch (error) {
      console.error('[activity:audit] failed to persist successful mutation', {
        method,
        path: requestPathWithoutQuery(req.url),
        error,
      });
    }

    return result;
  };
}
