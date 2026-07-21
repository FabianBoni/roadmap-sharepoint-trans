import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import {
  SUPPORT_CHAT_MESSAGE_MAX_LENGTH,
  SUPPORT_CHAT_NAME_MAX_LENGTH,
  consumeSupportChatRateLimit,
  createSupportChatToken,
  disableSupportChatCache,
  getSupportChatIdentity,
  getSupportChatInstanceSlug,
  getSupportChatRateLimitKey,
  hashSupportChatToken,
  mapSupportChatConversation,
  normalizeSupportChatText,
  readSupportChatToken,
  setSupportChatCookie,
} from '@/lib/supportChat';
import type { SupportChatConversation } from '@/types/supportChat';
import { isSafeCookieRequest } from '@/utils/sessionSecurity';

type ApiResponse = { conversation: SupportChatConversation | null } | { error: string };

const loadConversation = async (token: string | null) => {
  if (!token) return null;
  return prisma.supportConversation.findUnique({
    where: { visitorTokenHash: hashSupportChatToken(token) },
    include: { messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100 } },
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  disableSupportChatCache(res);

  if (req.method === 'GET') {
    const conversation = await loadConversation(readSupportChatToken(req));
    if (!conversation) return res.status(200).json({ conversation: null });
    conversation.messages.reverse();
    return res.status(200).json({ conversation: mapSupportChatConversation(conversation) });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!isSafeCookieRequest(req)) {
    return res.status(403).json({ error: 'Ungültiger Ursprung der Anfrage.' });
  }

  const existingToken = readSupportChatToken(req);
  const rateLimit = consumeSupportChatRateLimit(
    getSupportChatRateLimitKey(
      req,
      existingToken
        ? `visitor-message:${hashSupportChatToken(existingToken).slice(0, 16)}`
        : 'visitor-message:new'
    ),
    existingToken ? 12 : 60,
    60_000
  );
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Zu viele Nachrichten. Bitte warten Sie kurz.' });
  }

  const body = normalizeSupportChatText(req.body?.message);
  if (!body) return res.status(400).json({ error: 'Bitte geben Sie eine Nachricht ein.' });
  if (body.length > SUPPORT_CHAT_MESSAGE_MAX_LENGTH) {
    return res.status(400).json({ error: 'Die Nachricht ist zu lang.' });
  }

  const identity = getSupportChatIdentity(req);
  const requestedName = normalizeSupportChatText(req.body?.visitorName);
  if (requestedName.length > SUPPORT_CHAT_NAME_MAX_LENGTH) {
    return res.status(400).json({ error: 'Der Name ist zu lang.' });
  }
  const visitorName = identity.displayName || requestedName || 'Roadmap-Nutzer';
  const instanceSlug = getSupportChatInstanceSlug(req);
  const existing = await loadConversation(existingToken);
  const now = new Date();

  if (existing) {
    const effectiveVisitorName = existing.visitorName || visitorName;
    const conversation = await prisma.supportConversation.update({
      where: { id: existing.id },
      data: {
        visitorName: effectiveVisitorName,
        visitorUserKey: existing.visitorUserKey || identity.userKey,
        instanceSlug: existing.instanceSlug || instanceSlug,
        status: 'OPEN',
        lastMessageAt: now,
        messages: {
          create: { senderRole: 'VISITOR', senderName: effectiveVisitorName, body },
        },
      },
      include: { messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100 } },
    });
    conversation.messages.reverse();
    return res.status(201).json({ conversation: mapSupportChatConversation(conversation) });
  }

  const token = createSupportChatToken();
  const conversation = await prisma.supportConversation.create({
    data: {
      visitorTokenHash: hashSupportChatToken(token),
      visitorName,
      visitorUserKey: identity.userKey,
      instanceSlug,
      status: 'OPEN',
      lastMessageAt: now,
      messages: { create: { senderRole: 'VISITOR', senderName: visitorName, body } },
    },
    include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
  });
  setSupportChatCookie(res, token);
  return res.status(201).json({ conversation: mapSupportChatConversation(conversation) });
}
