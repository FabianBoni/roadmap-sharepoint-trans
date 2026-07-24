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
import { consumePersistentRateLimit } from '@/utils/rateLimit';
import prisma from '@/lib/prisma';

export const SUPPORT_CHAT_COOKIE = 'roadmap-support-chat';
export const SUPPORT_CHAT_MESSAGE_MAX_LENGTH = 2000;
export const SUPPORT_CHAT_NAME_MAX_LENGTH = 80;
const SUPPORT_CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const DEFAULT_RETENTION_DAYS = 90;
let lastRetentionCleanupAt = 0;

export const cleanupExpiredSupportChats = async (): Promise<number> => {
  const now = Date.now();
  if (now - lastRetentionCleanupAt < 60 * 60 * 1000) return 0;
  lastRetentionCleanupAt = now;
  const configured = Number.parseInt(process.env.SUPPORT_CHAT_RETENTION_DAYS || '', 10);
  const retentionDays =
    Number.isSafeInteger(configured) && configured >= 1 ? configured : DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(now - retentionDays * 24 * 60 * 60 * 1000);
  const deleted = await prisma.supportConversation.deleteMany({
    where: { lastMessageAt: { lt: cutoff } },
  });
  return deleted.count;
};

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

export const getSupportChatIdentity = async (
  req: NextApiRequest
): Promise<{ userKey: string | null; displayName: string | null }> => {
  let session: AdminSessionPayload | null = null;
  try {
    session = await extractAdminSession(req);
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
  const remoteAddress = req.socket.remoteAddress || 'unknown';
  const trustedProxies = new Set(
    String(process.env.TRUSTED_PROXY_ADDRESSES || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const address = trustedProxies.has(remoteAddress)
    ? forwardedValue?.split(',')[0]?.trim() || remoteAddress
    : remoteAddress;
  return `${scope}:${address}`;
};

export const consumeSupportChatRateLimit = async (key: string, limit: number, windowMs: number) =>
  consumePersistentRateLimit({ scope: 'support-chat', key, limit, windowMs });

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
