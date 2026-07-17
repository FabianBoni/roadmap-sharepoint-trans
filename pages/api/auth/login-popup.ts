import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Removed legacy endpoint. The former browser-driven SharePoint login trusted identity and group
 * data that were later posted back to the server. Interactive login now uses Microsoft Entra SSO.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).send('Legacy SharePoint login has been removed. Use Microsoft Entra SSO.');
}
