import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUserSession } from '@/utils/apiAuth';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import { isAdminSessionAllowedForInstance } from '@/utils/instanceAccessServer';

type CheckAdminResponse = {
  isAdmin: boolean;
  requiresUserSession: true;
  instanceSlug: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckAdminResponse | { error: string }>
) {
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
    return res.status(400).json({ error: 'A valid roadmap instance is required' });
  }

  const isAdmin = await isAdminSessionAllowedForInstance({
    session,
    instance,
    requestHeaders: {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    },
  });

  return res.status(200).json({
    isAdmin,
    requiresUserSession: true,
    instanceSlug: instance.slug,
  });
}
