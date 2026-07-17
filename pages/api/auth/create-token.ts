import type { NextApiRequest, NextApiResponse } from 'next';
/**
 * Removed legacy endpoint. It previously trusted identity and group data supplied by the browser,
 * which is not a valid authentication boundary. Interactive login is handled by Entra SSO.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(410).json({
    error: 'Legacy token creation has been removed. Use Microsoft Entra SSO.',
  });
}
