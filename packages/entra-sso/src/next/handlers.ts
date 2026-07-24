import type { NextApiRequest, NextApiResponse } from 'next';
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchGraphMe,
  generatePkcePair,
  generateRandomBase64Url,
  validateEntraIdToken,
  type EntraUserProfile,
} from '../core/index';
import { buildSetCookie, parseCookies, shouldUseSecureCookies } from './cookies';
import { getEntraRedirectUri, type EntraRedirectEnv } from './redirectUri';

const serializeInlineJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

function normalizeLocalReturnUrl(input: unknown, fallback: string): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('//') || decoded.includes('\\')) return fallback;
    const base = new URL('https://roadmap.invalid');
    const parsed = new URL(raw, base);
    return parsed.origin === base.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

function renderPopupResultHtml(args: {
  ok: boolean;
  username?: string;
  error?: string;
  origin: string;
}) {
  const payload = args.ok
    ? { type: 'AUTH_SUCCESS', username: args.username || '' }
    : { type: 'AUTH_ERROR', error: args.error || 'SSO fehlgeschlagen' };

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
        window.opener.postMessage(${serializeInlineJson(payload)}, ${serializeInlineJson(args.origin)});
      }
    } catch (e) {
      // ignore
    }
    setTimeout(() => window.close(), 600);
  </script>
</body>
</html>`;
}

export type EntraNextCookieNames = {
  state: string;
  nonce: string;
  verifier: string;
  returnUrl: string;
  popup: string;
};

export function defaultCookieNames(prefix = 'entra_'): EntraNextCookieNames {
  return {
    state: `${prefix}state`,
    nonce: `${prefix}nonce`,
    verifier: `${prefix}pkce_verifier`,
    returnUrl: `${prefix}return_url`,
    popup: `${prefix}popup`,
  };
}

export function createEntraLoginHandler(config: {
  tenantId: string;
  clientId: string;
  env: EntraRedirectEnv;
  cookiePrefix?: string;
  scopes?: string[];
  prompt?: string;
  callbackPath?: string;
  defaultReturnUrl?: string;
}): (req: NextApiRequest, res: NextApiResponse) => void {
  const cookies = defaultCookieNames(config.cookiePrefix);

  return (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const redirectUri = getEntraRedirectUri({
      req,
      env: config.env,
      callbackPath: config.callbackPath,
    });
    if (!redirectUri || !/^https?:\/\//i.test(redirectUri)) {
      res.status(500).json({
        error: 'SSO redirect configuration is invalid.',
      });
      return;
    }

    const returnUrlRaw = normalizeLocalReturnUrl(
      req.query.returnUrl,
      config.defaultReturnUrl || '/admin'
    );
    const popup = String(req.query.popup || '') === '1';

    const state = generateRandomBase64Url(32);
    const nonce = generateRandomBase64Url(32);
    const { verifier, challenge } = generatePkcePair();

    const scopes = config.scopes || ['openid', 'profile', 'email', 'User.Read'];

    const authorizeUrl = buildAuthorizeUrl({
      tenantId: config.tenantId,
      clientId: config.clientId,
      redirectUri,
      state,
      nonce,
      codeChallenge: challenge,
      scopes,
      prompt: config.prompt || 'select_account',
    });

    const secure = shouldUseSecureCookies(req);
    const common = { maxAgeSeconds: 10 * 60, httpOnly: true, sameSite: 'Lax' as const, secure };

    res.setHeader('Set-Cookie', [
      buildSetCookie(cookies.state, state, common),
      buildSetCookie(cookies.nonce, nonce, common),
      buildSetCookie(cookies.verifier, verifier, common),
      buildSetCookie(cookies.returnUrl, returnUrlRaw, common),
      buildSetCookie(cookies.popup, popup ? '1' : '0', common),
    ]);

    res.redirect(302, authorizeUrl);
  };
}

export function createEntraCallbackHandler(config: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  env: EntraRedirectEnv;
  cookiePrefix?: string;
  callbackPath?: string;
  resolveUser?: (accessToken: string) => Promise<EntraUserProfile>;
  isAllowed: (profile: EntraUserProfile) => boolean;
  issueAppToken: (profile: EntraUserProfile) => {
    token: string;
    username: string;
    maxAgeSeconds: number;
  };
  appTokenCookieName?: string;
  onErrorRedirect?: (args: { returnUrl: string; error: string }) => string;
}): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  const cookies = defaultCookieNames(config.cookiePrefix);

  return async (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const cookieValues = parseCookies(req.headers.cookie);
    const secure = shouldUseSecureCookies(req);

    let callbackRedirectUri: string;
    let origin: string;
    try {
      callbackRedirectUri = getEntraRedirectUri({
        req,
        env: config.env,
        callbackPath: config.callbackPath,
      });
      origin = new URL(callbackRedirectUri).origin;
    } catch {
      res.status(500).json({ error: 'SSO redirect configuration is invalid.' });
      return;
    }

    const clearCookies = [
      buildSetCookie(cookies.state, '', {
        maxAgeSeconds: 0,
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
      buildSetCookie(cookies.nonce, '', {
        maxAgeSeconds: 0,
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
      buildSetCookie(cookies.verifier, '', {
        maxAgeSeconds: 0,
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
      buildSetCookie(cookies.returnUrl, '', {
        maxAgeSeconds: 0,
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
      buildSetCookie(cookies.popup, '', {
        maxAgeSeconds: 0,
        httpOnly: true,
        sameSite: 'Lax',
        secure,
      }),
    ];

    const popup = cookieValues[cookies.popup] === '1';
    const returnUrl = normalizeLocalReturnUrl(cookieValues[cookies.returnUrl], '/admin');

    const error = typeof req.query.error === 'string' ? req.query.error : '';
    if (error) {
      res.setHeader('Set-Cookie', clearCookies);
      const msg = 'SSO-Anmeldung fehlgeschlagen';
      if (popup) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(renderPopupResultHtml({ ok: false, error: msg, origin }));
        return;
      }
      const target = config.onErrorRedirect
        ? config.onErrorRedirect({ returnUrl, error: msg })
        : `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`;
      res.redirect(302, target);
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;

    const expectedState = cookieValues[cookies.state] || null;
    const expectedNonce = cookieValues[cookies.nonce] || null;
    const verifier = cookieValues[cookies.verifier] || null;

    if (
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState ||
      !expectedNonce ||
      !verifier
    ) {
      res.setHeader('Set-Cookie', clearCookies);
      const msg = 'Ungültiger Login-Callback (state/code)';
      if (popup) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(renderPopupResultHtml({ ok: false, error: msg, origin }));
        return;
      }
      res.redirect(
        302,
        `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`
      );
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens({
        tenantId: config.tenantId,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: callbackRedirectUri,
        code,
        codeVerifier: verifier,
      });

      if (!tokens.accessToken) {
        throw new Error('Kein access_token erhalten (prüfe Scope User.Read)');
      }
      if (!tokens.idToken) {
        throw new Error('Kein id_token erhalten');
      }
      await validateEntraIdToken({
        idToken: tokens.idToken,
        tenantId: config.tenantId,
        clientId: config.clientId,
        nonce: expectedNonce,
      });

      const resolveUser = config.resolveUser || fetchGraphMe;
      const me = await resolveUser(tokens.accessToken);

      if (!config.isAllowed(me)) {
        throw new Error('Nicht berechtigt');
      }

      const issued = config.issueAppToken(me);

      res.setHeader('Set-Cookie', [
        ...clearCookies,
        buildSetCookie(config.appTokenCookieName || 'roadmap-admin-token', issued.token, {
          maxAgeSeconds: issued.maxAgeSeconds,
          httpOnly: true,
          sameSite: 'Lax',
          secure,
        }),
      ]);

      if (popup) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(
          renderPopupResultHtml({
            ok: true,
            username: issued.username,
            origin,
          })
        );
        return;
      }

      res.redirect(302, returnUrl);
    } catch {
      const msg = 'SSO-Anmeldung fehlgeschlagen';
      res.setHeader('Set-Cookie', clearCookies);
      if (popup) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(renderPopupResultHtml({ ok: false, error: msg, origin }));
        return;
      }
      res.redirect(
        302,
        `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(msg)}`
      );
    }
  };
}
