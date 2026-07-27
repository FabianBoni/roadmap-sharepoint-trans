import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUserSession } from '@/utils/apiAuth';
import { isAdminSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import {
  isDbSuperAdminSession,
  isSuperAdminSessionWithSharePointFallback,
} from '@/utils/superAdminAccessServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const session = await requireUserSession(req);
    const groups = Array.isArray(session.groups)
      ? session.groups.filter((g): g is string => typeof g === 'string')
      : [];
    const requestHeaders = {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    };
    const instance = await getInstanceConfigFromRequest(req).catch(() => null);
    const dbSuperAdmin = await isDbSuperAdminSession(session);
    const isSuperAdmin =
      dbSuperAdmin ||
      Boolean(
        instance &&
          (await isSuperAdminSessionWithSharePointFallback(session, {
            candidateInstanceSlugs: [instance.slug],
            requestHeaders,
          }))
      );
    const isAdmin =
      isSuperAdmin ||
      Boolean(
        instance &&
          (await isAdminSessionAllowedForInstance({
            session,
            instance,
            requestHeaders,
            knownSuperAdmin: false,
          }))
      );

    return res.status(200).json({
      username: session.username ?? null,
      displayName: session.displayName ?? null,
      source: session.source ?? null,
      isAdmin,
      isSuperAdmin,
      groups,
      entra: session.entra ?? null,
    });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
