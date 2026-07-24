import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import { requireSuperAdminAccess } from '@/utils/superAdminAccessServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSuperAdminAccess(req);
  } catch (error) {
    const status = error instanceof Error && error.message === 'Unauthorized' ? 401 : 403;
    return res.status(status).json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' });
  }

  const instance = await getInstanceConfigFromRequest(req).catch(() => null);
  if (!instance) return res.status(404).json({ ok: false });

  try {
    await clientDataService.withInstance(instance.slug, () => clientDataService.getAllCategories());
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({ ok: true });
  } catch {
    if (req.method === 'HEAD') return res.status(503).end();
    return res.status(503).json({ ok: false });
  }
}
