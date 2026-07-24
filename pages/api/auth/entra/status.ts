import type { NextApiRequest, NextApiResponse } from 'next';
import { getJwtSecret } from '@/utils/sessionSecurity';

function entraSsoEnabled(): boolean {
  try {
    getJwtSecret();
    return Boolean(
      process.env.ENTRA_TENANT_ID && process.env.ENTRA_CLIENT_ID && process.env.ENTRA_CLIENT_SECRET
    );
  } catch {
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ enabled: entraSsoEnabled() });
}
