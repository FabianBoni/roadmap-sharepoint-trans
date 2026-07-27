import type { NextApiRequest, NextApiResponse } from 'next';
import { extractAdminSession } from '@/utils/apiAuth';
import { isAdminSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import {
  isDbSuperAdminSession,
  isSuperAdminSessionWithSharePointFallback,
} from '@/utils/superAdminAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';

/**
 * Check if the current session has a valid JWT token
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await extractAdminSession(req);
    if (!session) {
      return res
        .status(403)
        .json({ authenticated: false, isAdmin: false, error: 'No token provided' });
    }

    const requestHeaders = {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    };

    const groups = Array.isArray(session.groups)
      ? session.groups.filter((g): g is string => typeof g === 'string')
      : [];
    const entra =
      session.entra && typeof session.entra === 'object'
        ? (session.entra as Record<string, unknown>)
        : null;
    const department =
      (entra && typeof entra.department === 'string' ? entra.department : null) ||
      (typeof session.department === 'string' ? session.department : null);

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
      authenticated: true,
      isAdmin,
      username: session.displayName || session.username,
      department,
      groups,
      isSuperAdmin,
    });
  } catch (error) {
    console.error('[check-admin-session] request failed', {
      type: error instanceof Error ? error.name : 'UnknownError',
    });
    return res.status(500).json({
      authenticated: false,
      isAdmin: false,
      error: 'Internal server error',
    });
  }
}
