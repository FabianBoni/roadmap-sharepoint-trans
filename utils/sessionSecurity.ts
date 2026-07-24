import type { NextApiRequest } from 'next';

const DEFAULT_SESSION_TTL = '8h';
const MAX_SESSION_TTL_SECONDS = 12 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRETS = new Set([
  'roadmap-secret-change-in-production',
  'your-secure-random-string-here-minimum-32-characters',
]);

export function getJwtSecret(): string {
  const secret = String(process.env.JWT_SECRET || '');
  if (!secret || secret.length < MIN_SECRET_LENGTH || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET must be configured with at least ${MIN_SECRET_LENGTH} non-placeholder characters`
    );
  }
  return secret;
}

export function getSessionTtlSeconds(): number {
  const raw = String(process.env.JWT_EXPIRES_IN || DEFAULT_SESSION_TTL)
    .trim()
    .toLowerCase();
  const match = raw.match(/^(\d+)(s|m|h|d)?$/);
  if (!match) {
    throw new Error('JWT_EXPIRES_IN must be a positive duration such as 3600, 30m, 8h or 1d');
  }

  const value = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] || 's'];
  const seconds = value * multiplier;
  if (!Number.isSafeInteger(seconds) || seconds <= 0 || seconds > MAX_SESSION_TTL_SECONDS) {
    throw new Error('JWT_EXPIRES_IN must resolve to between 1 second and 12 hours');
  }
  return seconds;
}

export const getSessionIssuer = (): string =>
  String(process.env.JWT_ISSUER || 'roadmap-sharepoint').trim() || 'roadmap-sharepoint';

export const getSessionAudience = (): string =>
  String(process.env.JWT_AUDIENCE || 'roadmap-web').trim() || 'roadmap-web';

export const getSessionVersion = (): string => {
  const version = String(process.env.JWT_SESSION_VERSION || '1').trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(version)) {
    throw new Error('JWT_SESSION_VERSION must be 1-64 safe characters');
  }
  return version;
};

export function normalizeLocalReturnUrl(
  input: string | undefined | null,
  fallback = '/admin'
): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (
    !raw ||
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(raw);
    if (
      decoded.startsWith('//') ||
      decoded.includes('\\') ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return fallback;
    }
    const base = new URL('https://roadmap.invalid');
    const parsed = new URL(raw, base);
    if (parsed.origin !== base.origin || !parsed.pathname.startsWith('/')) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export function isSafeCookieRequest(req: NextApiRequest): boolean {
  const method = String(req.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  const origin = firstHeader(req.headers.origin);
  if (!origin) return false;

  try {
    const allowedOrigins = new Set<string>();
    for (const raw of String(process.env.APP_ORIGIN || '').split(',')) {
      if (raw.trim()) allowedOrigins.add(new URL(raw.trim()).origin);
    }
    const redirectUri = String(process.env.ENTRA_REDIRECT_URI || '').trim();
    if (redirectUri) allowedOrigins.add(new URL(redirectUri).origin);
    if (process.env.NODE_ENV !== 'production') {
      const port = /^\d{1,5}$/.test(process.env.PORT || '') ? process.env.PORT : '3000';
      allowedOrigins.add(`http://localhost:${port}`);
      allowedOrigins.add(`http://127.0.0.1:${port}`);
    }
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}
