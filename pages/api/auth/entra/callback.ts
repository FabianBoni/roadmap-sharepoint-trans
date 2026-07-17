import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import {
  exchangeCodeForTokens,
  fetchGraphMe,
  fetchGraphMyGroupDisplayNames,
  validateEntraIdToken,
} from '@roadmap/entra-sso/core';
import {
  buildSetCookie,
  getEntraRedirectUri,
  parseCookies,
  shouldUseSecureCookies,
  type EntraRedirectEnv,
} from '@roadmap/entra-sso/next';
import { isEntraUserAllowed } from '@/utils/entraSso';
import {
  getJwtSecret,
  getSessionTtlSeconds,
  normalizeLocalReturnUrl,
} from '@/utils/sessionSecurity';

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

const COOKIE_STATE = 'entra_state';
const COOKIE_NONCE = 'entra_nonce';
const COOKIE_VERIFIER = 'entra_pkce_verifier';
const COOKIE_RETURN_URL = 'entra_return_url';
const COOKIE_POPUP = 'entra_popup';
const COOKIE_ADMIN_TOKEN = 'roadmap-admin-token';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPopupResultHtml(args: { ok: boolean; username?: string; error?: string }) {
  const payload = args.ok
    ? `({ type: 'AUTH_SUCCESS', username: '${escapeHtml(args.username || '')}' })`
    : `({ type: 'AUTH_ERROR', error: '${escapeHtml(args.error || 'SSO fehlgeschlagen')}' })`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SSO</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
  <p>${args.ok ? 'Anmeldung erfolgreich. Fenster wird geschlossen …' : 'Anmeldung fehlgeschlagen. Fenster wird geschlossen …'}</p>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage(${payload}, window.location.origin);
      }
    } catch (e) {
      // ignore
    }
    setTimeout(() => window.close(), 600);
  </script>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!entraSsoEnabled()) {
    return res.status(400).send('Entra SSO is not configured');
  }

  const cookies = parseCookies(req.headers.cookie);
  const secure = shouldUseSecureCookies(req);

  const clearCookies = [
    buildSetCookie(COOKIE_STATE, '', { maxAgeSeconds: 0, httpOnly: true, sameSite: 'Lax', secure }),
    buildSetCookie(COOKIE_NONCE, '', { maxAgeSeconds: 0, httpOnly: true, sameSite: 'Lax', secure }),
    buildSetCookie(COOKIE_VERIFIER, '', {
      maxAgeSeconds: 0,
      httpOnly: true,
      sameSite: 'Lax',
      secure,
    }),
    buildSetCookie(COOKIE_RETURN_URL, '', {
      maxAgeSeconds: 0,
      httpOnly: false,
      sameSite: 'Lax',
      secure,
    }),
    buildSetCookie(COOKIE_POPUP, '', {
      maxAgeSeconds: 0,
      httpOnly: false,
      sameSite: 'Lax',
      secure,
    }),
  ];

  const popup = cookies[COOKIE_POPUP] === '1';
  const returnUrl = normalizeLocalReturnUrl(cookies[COOKIE_RETURN_URL], '/admin');

  const error = typeof req.query.error === 'string' ? req.query.error : '';
  const errorDesc =
    typeof req.query.error_description === 'string' ? req.query.error_description : '';
  if (error) {
    res.setHeader('Set-Cookie', clearCookies);
    if (popup) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(renderPopupResultHtml({ ok: false, error: errorDesc || error }));
    }
    const target = `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(
      errorDesc || error
    )}`;
    return res.redirect(302, target);
  }

  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const state = typeof req.query.state === 'string' ? req.query.state : null;

  const expectedState = cookies[COOKIE_STATE] || null;
  const expectedNonce = cookies[COOKIE_NONCE] || null;
  const verifier = cookies[COOKIE_VERIFIER] || null;

  if (!code || !state || !expectedState || state !== expectedState || !expectedNonce || !verifier) {
    res.setHeader('Set-Cookie', clearCookies);
    const msg = 'Ungültiger Login-Callback (state/code)';
    if (popup) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(renderPopupResultHtml({ ok: false, error: msg }));
    }
    return res.redirect(
      302,
      `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`
    );
  }

  try {
    const tenantId = String(process.env.ENTRA_TENANT_ID);
    const clientId = String(process.env.ENTRA_CLIENT_ID);
    const clientSecret = String(process.env.ENTRA_CLIENT_SECRET);

    const redirectUri = getEntraRedirectUri({ req, env: process.env as EntraRedirectEnv });

    const tokens = await exchangeCodeForTokens({
      tenantId,
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: verifier,
    });

    if (!tokens.idToken) {
      throw new Error('Kein id_token erhalten');
    }
    const idTokenClaims = await validateEntraIdToken({
      idToken: tokens.idToken,
      tenantId,
      clientId,
      nonce: expectedNonce,
    });

    if (!tokens.accessToken) {
      throw new Error('Kein access_token erhalten (prüfe Scope User.Read)');
    }

    const me = await fetchGraphMe(tokens.accessToken);

    let groupNames: string[] = [];
    try {
      groupNames = await fetchGraphMyGroupDisplayNames(tokens.accessToken);
    } catch (e: unknown) {
      // Not fatal: many tenants don't grant GroupMember.Read.All.
      const msg = e instanceof Error ? e.message : 'unknown';
      // eslint-disable-next-line no-console
      console.warn('[entra] group fetch skipped/failed:', msg);
      groupNames = [];
    }

    if (groupNames.length === 0 && idTokenClaims) {
      const claimGroups = idTokenClaims.groups;
      if (Array.isArray(claimGroups)) {
        groupNames = claimGroups.filter(
          (g): g is string => typeof g === 'string' && g.trim().length > 0
        );
      }
    }

    const allowed = isEntraUserAllowed(me);

    if (!allowed) {
      throw new Error(
        'Nicht berechtigt. Der Entra-Benutzer konnte nicht eindeutig bestimmt werden.'
      );
    }

    const username = me.userPrincipalName || me.mail || 'unknown';
    const displayName = me.displayName || username;
    const departmentFromClaims =
      typeof idTokenClaims?.department === 'string' ? idTokenClaims.department : null;
    const resolvedDepartment =
      (typeof me.department === 'string' && me.department.trim() ? me.department : null) ||
      departmentFromClaims;

    const appToken = jwt.sign(
      {
        username,
        displayName,
        isAdmin: false,
        source: 'entra',
        groups: groupNames,
        entra: {
          id: me.id,
          upn: me.userPrincipalName,
          mail: me.mail,
          department: resolvedDepartment,
        },
      },
      getJwtSecret(),
      { expiresIn: getSessionTtlSeconds() }
    );

    res.setHeader('Set-Cookie', [
      ...clearCookies,
      buildSetCookie(COOKIE_ADMIN_TOKEN, appToken, {
        maxAgeSeconds: getSessionTtlSeconds(),
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
    ]);

    if (popup) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(renderPopupResultHtml({ ok: true, username: displayName }));
    }

    // Non-popup: the admin JWT is already set as a cookie, so return with a normal redirect.
    // This guarantees a full page load on the target route and avoids client-side hash timing.
    return res.redirect(302, returnUrl);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'SSO fehlgeschlagen';
    res.setHeader('Set-Cookie', clearCookies);
    if (popup) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(renderPopupResultHtml({ ok: false, error: msg }));
    }
    return res.redirect(
      302,
      `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`
    );
  }
}
