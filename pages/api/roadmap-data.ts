import { performance } from 'node:perf_hooks';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUserSession } from '@/utils/apiAuth';
import {
  isAdminSessionAllowedForInstance,
  isReadSessionAllowedForInstance,
} from '@/utils/instanceAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import { getRoadmapDataSnapshot } from '@/utils/roadmapData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startedAt = performance.now();
  const marks: string[] = [];
  const mark = (name: string, since: number) => {
    marks.push(`${name};dur=${Math.max(0, performance.now() - since).toFixed(1)}`);
  };

  const instance = await getInstanceConfigFromRequest(req).catch(() => null);
  if (!instance) return res.status(404).json({ error: 'No roadmap instance configured' });

  let session;
  try {
    session = await requireUserSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const forwardedHeaders = {
    authorization:
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
  };

  const accessStartedAt = performance.now();
  const readable = await isReadSessionAllowedForInstance({
    session,
    instance,
    requestHeaders: forwardedHeaders,
  });
  mark('access', accessStartedAt);
  if (!readable) return res.status(403).json({ error: 'Forbidden' });

  const dataStartedAt = performance.now();
  const [{ snapshot, cacheStatus }, isAdmin] = await Promise.all([
    getRoadmapDataSnapshot({ instance, forwardedHeaders }),
    isAdminSessionAllowedForInstance({ session, instance, requestHeaders: forwardedHeaders }),
  ]);
  mark('roadmap-data', dataStartedAt);
  mark('total', startedAt);

  res.setHeader('Server-Timing', marks.join(', '));
  res.setHeader('X-Roadmap-Data-Cache', cacheStatus);
  res.setHeader('X-Roadmap-Instance', instance.slug);
  res.setHeader('Vary', 'Cookie, Authorization');
  res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=45');
  return res.status(200).json({
    ...snapshot,
    resolvedInstanceSlug: instance.slug,
    access: { authenticated: true, isAdmin },
  });
}
