import type { NextApiRequest, NextApiResponse } from 'next';
import {
  buildAuthorizeUrl,
  generatePkcePair,
  generateRandomBase64Url,
} from '@roadmap/entra-sso/core';
import {
  buildSetCookie,
  getEntraRedirectUri,
  shouldUseSecureCookies,
  type EntraRedirectEnv,
} from '@roadmap/entra-sso/next';
import { getJwtSecret, normalizeLocalReturnUrl } from '@/utils/sessionSecurity';

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

function isRedirectUriLikelyMisconfigured(envRedirectUri: string): boolean {
  try {
    const u = new URL(envRedirectUri);
    // We expect the callback route, not an app page like /admin.
    return !u.pathname.includes('/api/auth/entra/callback');
  } catch {
    return true;
  }
}

const COOKIE_STATE = 'entra_state';
const COOKIE_NONCE = 'entra_nonce';
const COOKIE_VERIFIER = 'entra_pkce_verifier';
const COOKIE_RETURN_URL = 'entra_return_url';
const COOKIE_POPUP = 'entra_popup';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!entraSsoEnabled()) {
    res.status(400).json({ error: 'Entra SSO is not configured' });
    return;
  }

  const tenantId = String(process.env.ENTRA_TENANT_ID);
  const clientId = String(process.env.ENTRA_CLIENT_ID);

  const redirectUri = getEntraRedirectUri({ req, env: process.env as EntraRedirectEnv });
  if (!redirectUri || !/^https?:\/\//i.test(redirectUri)) {
    res.status(500).json({ error: 'Invalid SSO redirect configuration' });
    return;
  }

  const envRedirectUri = String(process.env.ENTRA_REDIRECT_URI || '').trim();
  if (envRedirectUri && isRedirectUriLikelyMisconfigured(envRedirectUri)) {
    const returnUrl = normalizeLocalReturnUrl(
      typeof req.query.returnUrl === 'string' ? req.query.returnUrl : null,
      '/admin'
    );

    const msg = 'SSO redirect configuration is invalid. Contact an administrator.';

    res.redirect(
      302,
      `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`
    );
    return;
  }

  const returnUrlRaw = normalizeLocalReturnUrl(
    typeof req.query.returnUrl === 'string' ? req.query.returnUrl : null,
    '/admin'
  );
  const popup = String(req.query.popup || '') === '1';

  const state = generateRandomBase64Url(32);
  const nonce = generateRandomBase64Url(32);
  const { verifier, challenge } = generatePkcePair();

  const scopes = [
    'openid',
    'profile',
    'email',
    // Using Graph to resolve the signed-in user profile (no extra deps).
    // Requires delegated permission: User.Read
    'User.Read',
  ];

  const authorizeUrl = buildAuthorizeUrl({
    tenantId,
    clientId,
    redirectUri,
    state,
    nonce,
    codeChallenge: challenge,
    scopes,
    prompt: 'select_account',
  });

  const secure = shouldUseSecureCookies(req);
  const common = { maxAgeSeconds: 10 * 60, httpOnly: true, sameSite: 'Lax' as const, secure };

  res.setHeader('Set-Cookie', [
    buildSetCookie(COOKIE_STATE, state, common),
    buildSetCookie(COOKIE_NONCE, nonce, common),
    buildSetCookie(COOKIE_VERIFIER, verifier, common),
    buildSetCookie(COOKIE_RETURN_URL, returnUrlRaw, common),
    buildSetCookie(COOKIE_POPUP, popup ? '1' : '0', common),
  ]);

  res.redirect(302, authorizeUrl);
  return;
}
