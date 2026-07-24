import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import {
  SUPPORT_CHAT_MESSAGE_MAX_LENGTH,
  consumeSupportChatRateLimit,
  disableSupportChatCache,
  getSupportAgentName,
  getSupportChatRateLimitKey,
  mapSupportChatConversation,
  normalizeSupportChatText,
} from '@/lib/supportChat';
import type { SupportChatConversation } from '@/types/supportChat';
import { requireSuperAdminAccess } from '@/utils/superAdminAccessServer';

type ApiResponse =
  { conversation: SupportChatConversation } | { success: true } | { error: string };

const parseConversationId = (raw: string | string[] | undefined): string => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && /^[a-z0-9]{10,40}$/i.test(value) ? value : '';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  disableSupportChatCache(res);

  let session;
  try {
    session = await requireSuperAdminAccess(req);
  } catch (error) {
    const status = error instanceof Error && error.message === 'Unauthorized' ? 401 : 403;
    return res
      .status(status)
      .json({ error: status === 401 ? 'Unauthorized' : 'Superadmin access required' });
  }

  const id = parseConversationId(req.query.id);
  if (!id) return res.status(400).json({ error: 'Ungültige Chat-ID.' });

  const existing = await prisma.supportConversation.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Chat nicht gefunden.' });

  if (req.method === 'GET') {
    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 250 } },
    });
    if (!conversation) return res.status(404).json({ error: 'Chat nicht gefunden.' });
    const latestVisitorMessage = [...conversation.messages]
      .reverse()
      .find((message) => message.senderRole === 'VISITOR');
    if (
      latestVisitorMessage &&
      (!conversation.supportLastReadAt ||
        latestVisitorMessage.createdAt > conversation.supportLastReadAt)
    ) {
      await prisma.supportConversation.update({
        where: { id },
        data: { supportLastReadAt: new Date() },
      });
    }
    return res.status(200).json({ conversation: mapSupportChatConversation(conversation) });
  }

  if (req.method === 'POST') {
    const rateLimit = await consumeSupportChatRateLimit(
      getSupportChatRateLimitKey(req, `support-message:${id}`),
      30,
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
    const now = new Date();
    const conversation = await prisma.supportConversation.update({
      where: { id },
      data: {
        status: 'OPEN',
        supportLastReadAt: now,
        lastMessageAt: now,
        messages: {
          create: { senderRole: 'SUPPORT', senderName: getSupportAgentName(session), body },
        },
      },
      include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 250 } },
    });
    return res.status(201).json({ conversation: mapSupportChatConversation(conversation) });
  }

  if (req.method === 'PATCH') {
    const requestedStatus = req.body?.status === 'CLOSED' ? 'CLOSED' : 'OPEN';
    const conversation = await prisma.supportConversation.update({
      where: { id },
      data: { status: requestedStatus, supportLastReadAt: new Date() },
      include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 250 } },
    });
    return res.status(200).json({ conversation: mapSupportChatConversation(conversation) });
  }

  if (req.method === 'DELETE') {
    await prisma.supportConversation.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
