import type { NextApiRequest, NextApiResponse } from 'next';
import { isInternalApiAuthConfigured } from '@/utils/internalApiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const internalApiAuth = isInternalApiAuthConfigured();
  const ready = process.env.NODE_ENV !== 'production' || internalApiAuth;

  if (req.method === 'HEAD') {
    return res.status(ready ? 200 : 503).end();
  }

  return res.status(ready ? 200 : 503).json({ ok: ready, internalApiAuth });
}
