import { createHash, randomBytes } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminSessionPayload } from '@/utils/apiAuth';
import { extractAdminSession } from '@/utils/apiAuth';
import type {
  SupportChatConversation,
  SupportChatMessage,
  SupportChatRole,
  SupportChatStatus,
} from '@/types/supportChat';

export const SUPPORT_CHAT_COOKIE = 'roadmap-support-chat';
export const SUPPORT_CHAT_MESSAGE_MAX_LENGTH = 2000;
export const SUPPORT_CHAT_NAME_MAX_LENGTH = 80;
const SUPPORT_CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type RateLimitBucket = { count: number; resetAt: number };
type GlobalRateLimits = typeof globalThis & {
  supportChatRateLimits?: Map<string, RateLimitBucket>;
};

const globalForRateLimits = globalThis as GlobalRateLimits;
const rateLimits = globalForRateLimits.supportChatRateLimits ?? new Map<string, RateLimitBucket>();
globalForRateLimits.supportChatRateLimits = rateLimits;

export const disableSupportChatCache = (res: NextApiResponse) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

export const hashSupportChatToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const createSupportChatToken = (): string => randomBytes(32).toString('base64url');

export const readSupportChatToken = (req: NextApiRequest): string | null => {
  const raw = req.cookies?.[SUPPORT_CHAT_COOKIE];
  if (typeof raw !== 'string' || raw.length < 32 || raw.length > 128) return null;
  return raw;
};

export const setSupportChatCookie = (res: NextApiResponse, token: string) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SUPPORT_CHAT_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SUPPORT_CHAT_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`
  );
};

export const normalizeSupportChatText = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

export const getSupportChatInstanceSlug = (req: NextApiRequest): string | null => {
  const raw = Array.isArray(req.query.roadmapInstance)
    ? req.query.roadmapInstance[0]
    : req.query.roadmapInstance;
  if (typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ? slug : null;
};

const normalizeIdentityValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const getSupportChatIdentity = (
  req: NextApiRequest
): { userKey: string | null; displayName: string | null } => {
  let session: AdminSessionPayload | null = null;
  try {
    session = extractAdminSession(req);
  } catch {
    session = null;
  }

  if (!session) return { userKey: null, displayName: null };
  const entra = session.entra && typeof session.entra === 'object' ? session.entra : null;
  const userKey =
    normalizeIdentityValue(entra?.upn) ||
    normalizeIdentityValue(entra?.mail) ||
    normalizeIdentityValue(session.username) ||
    null;
  const displayName =
    normalizeIdentityValue(session.displayName) || normalizeIdentityValue(session.username) || null;
  return { userKey: userKey?.toLowerCase() ?? null, displayName };
};

export const getSupportAgentName = (session: AdminSessionPayload): string =>
  normalizeIdentityValue(session.displayName) ||
  normalizeIdentityValue(session.username) ||
  'Roadmap-Support';

export const getSupportChatRateLimitKey = (req: NextApiRequest, scope: string): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const address = forwardedValue?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  return `${scope}:${address}`;
};

export const consumeSupportChatRateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } => {
  const now = Date.now();
  if (rateLimits.size > 1000) {
    for (const [bucketKey, bucket] of rateLimits) {
      if (bucket.resetAt <= now) rateLimits.delete(bucketKey);
    }
  }
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
};

export const mapSupportChatMessage = (message: {
  id: number;
  senderRole: string;
  senderName: string | null;
  body: string;
  createdAt: Date;
}): SupportChatMessage => ({
  id: message.id,
  senderRole: (message.senderRole === 'SUPPORT' ? 'SUPPORT' : 'VISITOR') as SupportChatRole,
  senderName: message.senderName,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
});

export const mapSupportChatConversation = (conversation: {
  id: string;
  visitorName: string | null;
  instanceSlug: string | null;
  status: string;
  lastMessageAt: Date;
  createdAt: Date;
  messages: Array<{
    id: number;
    senderRole: string;
    senderName: string | null;
    body: string;
    createdAt: Date;
  }>;
}): SupportChatConversation => ({
  id: conversation.id,
  visitorName: conversation.visitorName,
  instanceSlug: conversation.instanceSlug,
  status: (conversation.status === 'CLOSED' ? 'CLOSED' : 'OPEN') as SupportChatStatus,
  lastMessageAt: conversation.lastMessageAt.toISOString(),
  createdAt: conversation.createdAt.toISOString(),
  messages: conversation.messages.map(mapSupportChatMessage),
});
