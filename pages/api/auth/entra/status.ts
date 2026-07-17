import type { NextApiRequest, NextApiResponse } from 'next';
import { getEntraRedirectUri, type EntraRedirectEnv } from '@roadmap/entra-sso/next';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const override = String(process.env.ENTRA_REDIRECT_URI || '').trim();
  const overrideValid = override ? override.includes('/api/auth/entra/callback') : null;

  return res.status(200).json({
    enabled: entraSsoEnabled(),
    tenantIdConfigured: Boolean(process.env.ENTRA_TENANT_ID),
    clientIdConfigured: Boolean(process.env.ENTRA_CLIENT_ID),
    jwtSecretConfigured: (() => {
      try {
        getJwtSecret();
        return true;
      } catch {
        return false;
      }
    })(),
    redirectUriConfigured: Boolean(
      process.env.ENTRA_REDIRECT_URI && process.env.ENTRA_REDIRECT_URI.trim()
    ),
    redirectUriOverride: override || null,
    redirectUriOverrideValid: overrideValid,
    computedRedirectUri: getEntraRedirectUri({ req, env: process.env as EntraRedirectEnv }),
    allowlistConfigured: true,
  });
}
