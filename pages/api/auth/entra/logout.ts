import type { NextApiRequest, NextApiResponse } from 'next';
import { withActivityAudit } from '@/utils/auditLog';
import { buildSetCookie, shouldUseSecureCookies } from '@roadmap/entra-sso/next';
import { resolveNextBasePath } from '@/utils/entraSso';
import { isSafeCookieRequest } from '@/utils/sessionSecurity';
import { decodeAdminSessionFromHeaders } from '@/utils/apiAuth';
import prisma from '@/lib/prisma';

const COOKIE_ADMIN_TOKEN = 'roadmap-admin-token';

function getPostLogoutRedirectUri(): string {
  const configured = String(process.env.ENTRA_POST_LOGOUT_REDIRECT_URI || '').trim();
  if (configured) {
    const parsed = new URL(configured);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('ENTRA_POST_LOGOUT_REDIRECT_URI must use http or https');
    }
    return parsed.toString();
  }

  const callback = new URL(String(process.env.ENTRA_REDIRECT_URI || ''));
  return `${callback.origin}${resolveNextBasePath()}/admin/login`;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSafeCookieRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const session = decodeAdminSessionFromHeaders({
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
  });
  if (session && typeof session.jti === 'string') {
    try {
      await prisma.authSession.updateMany({
        where: { id: session.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      return res.status(503).json({ error: 'Session revocation is temporarily unavailable' });
    }
  }

  const secure = shouldUseSecureCookies(req);
  res.setHeader(
    'Set-Cookie',
    buildSetCookie(COOKIE_ADMIN_TOKEN, '', {
      maxAgeSeconds: 0,
      httpOnly: true,
      sameSite: 'Lax',
      secure,
    })
  );
  res.setHeader('Cache-Control', 'no-store');

  try {
    const postLogoutRedirectUri = getPostLogoutRedirectUri();
    const tenantId = String(process.env.ENTRA_TENANT_ID || '').trim();
    if (!tenantId) return res.redirect(302, postLogoutRedirectUri);

    const url = new URL(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/logout`
    );
    url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
    return res.redirect(302, url.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid logout configuration';
    return res.status(500).json({ error: message });
  }
}

export default withActivityAudit(handler);
