import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { requireUserSession } from '@/utils/apiAuth';
import { isReadSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const readLimit = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw || '', 10);
  return Number.isFinite(parsed) ? Math.min(MAX_LIMIT, Math.max(1, parsed)) : DEFAULT_LIMIT;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie, Authorization');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let session;
  try {
    session = await requireUserSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const instance = await getInstanceConfigFromRequest(req).catch(() => null);
  if (!instance) {
    return res.status(404).json({ error: 'No roadmap instance configured' });
  }

  const forwardedHeaders = {
    authorization:
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
  };
  const readable = await isReadSessionAllowedForInstance({
    session,
    instance,
    requestHeaders: forwardedHeaders,
  });
  if (!readable) return res.status(403).json({ error: 'Forbidden' });

  try {
    const events = await prisma.auditEvent.findMany({
      where: { instanceSlug: instance.slug, visibility: 'instance' },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: readLimit(req.query.limit),
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        actorDisplayName: true,
        instanceSlug: true,
        occurredAt: true,
      },
    });

    return res.status(200).json({
      items: events.map((event) => ({
        id: event.id,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        entityLabel: event.entityLabel,
        actorName: event.actorDisplayName,
        instanceSlug: event.instanceSlug,
        createdAt: event.occurredAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[activity:recent] failed to load activity', error);
    return res.status(500).json({ error: 'Failed to load activity' });
  }
}
