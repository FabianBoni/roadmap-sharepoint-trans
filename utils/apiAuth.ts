import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import {
  getJwtSecret,
  getSessionAudience,
  getSessionIssuer,
  getSessionTtlSeconds,
  getSessionVersion,
  isSafeCookieRequest,
} from '@/utils/sessionSecurity';

export interface AdminSessionPayload {
  username?: string;
  displayName?: string;
  department?: string;
  isAdmin?: boolean;
  source?: string;
  groups?: unknown;
  entra?: {
    id?: string;
    tenantId?: string;
    upn?: string;
    mail?: string;
    department?: string;
    onPremisesSamAccountName?: string;
    onPremisesDomainName?: string;
    onPremisesUserPrincipalName?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const ADMIN_TOKEN_COOKIE_KEY = 'roadmap-admin-token';

const parseCookieHeader = (cookieHeader: string | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = value;
  }
  return out;
};

const readTokenFromCookie = (cookieHeader: string | undefined): string | null => {
  try {
    const parsed = parseCookieHeader(cookieHeader);
    const raw = parsed[ADMIN_TOKEN_COOKIE_KEY];
    if (!raw) return null;
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
};

export function decodeAdminSessionFromHeaders(headers: {
  authorization?: string | string[];
  cookie?: string;
}): AdminSessionPayload | null {
  const authHeader = Array.isArray(headers.authorization)
    ? headers.authorization[0]
    : headers.authorization;
  const token =
    authHeader && authHeader.toLowerCase().startsWith('bearer ') ? authHeader.substring(7) : null;
  const cookieToken = readTokenFromCookie(headers.cookie);
  const finalToken = token || cookieToken;
  if (!finalToken) return null;
  try {
    const payload = jwt.verify(finalToken, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: getSessionIssuer(),
      audience: getSessionAudience(),
      maxAge: getSessionTtlSeconds(),
      clockTolerance: 5,
    }) as AdminSessionPayload;
    if (
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      payload.sessionVersion !== getSessionVersion()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function extractAdminSessionFromHeaders(headers: {
  authorization?: string | string[];
  cookie?: string;
}): Promise<AdminSessionPayload | null> {
  const payload = decodeAdminSessionFromHeaders(headers);
  if (!payload || typeof payload.jti !== 'string') return null;
  try {
    const activeSession = await prisma.authSession.findUnique({
      where: { id: payload.jti },
      select: { expiresAt: true, revokedAt: true },
    });
    if (!activeSession || activeSession.revokedAt || activeSession.expiresAt <= new Date()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function extractAdminSession(
  req: NextApiRequest
): Promise<AdminSessionPayload | null> {
  const hasBearer =
    typeof req.headers.authorization === 'string' &&
    req.headers.authorization.toLowerCase().startsWith('bearer ');
  if (!hasBearer && !isSafeCookieRequest(req)) return null;
  return await extractAdminSessionFromHeaders({
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
  });
}

export async function requireUserSession(req: NextApiRequest): Promise<AdminSessionPayload> {
  const payload = await extractAdminSession(req);
  if (!payload) {
    throw new Error('Unauthorized');
  }
  return payload;
}

export async function requireAdminSession(req: NextApiRequest): Promise<AdminSessionPayload> {
  const payload = await extractAdminSession(req);
  if (!payload || payload.isAdmin !== true) {
    throw new Error('Unauthorized');
  }
  return payload;
}

const normalize = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const normalizeGroups = (groups: unknown): string[] => {
  if (!Array.isArray(groups)) return [];
  return Array.from(
    new Set(
      groups
        .map((g) => (typeof g === 'string' ? g : g != null ? String(g) : ''))
        .map((g) => normalize(g))
        .filter(Boolean)
    )
  );
};

export function isSuperAdminSession(session: AdminSessionPayload | null | undefined): boolean {
  const groups = normalizeGroups(session?.groups);
  return groups.includes('superadmin');
}

export async function requireSuperAdminSession(req: NextApiRequest): Promise<AdminSessionPayload> {
  const payload = await requireAdminSession(req);
  if (!isSuperAdminSession(payload)) {
    throw new Error('Forbidden');
  }
  return payload;
}
