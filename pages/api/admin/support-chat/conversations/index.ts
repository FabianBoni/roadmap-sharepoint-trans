import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { disableSupportChatCache, mapSupportChatMessage } from '@/lib/supportChat';
import type { SupportChatSummary } from '@/types/supportChat';
import { requireAdminSession } from '@/utils/apiAuth';

type ApiResponse = { conversations: SupportChatSummary[] } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  disableSupportChatCache(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    requireAdminSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rows = await prisma.supportConversation.findMany({
    orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }],
    take: 100,
    include: { messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 } },
  });

  const visitorMessages = rows.length
    ? await prisma.supportMessage.findMany({
        where: { conversationId: { in: rows.map((row) => row.id) }, senderRole: 'VISITOR' },
        select: { conversationId: true, createdAt: true },
      })
    : [];
  const unreadCounts = new Map<string, number>();
  const readAtByConversation = new Map(
    rows.map((row) => [row.id, row.supportLastReadAt?.getTime() ?? 0])
  );
  for (const message of visitorMessages) {
    if (message.createdAt.getTime() > (readAtByConversation.get(message.conversationId) ?? 0)) {
      unreadCounts.set(message.conversationId, (unreadCounts.get(message.conversationId) ?? 0) + 1);
    }
  }

  const conversations = rows.map((row) => ({
    id: row.id,
    visitorName: row.visitorName,
    instanceSlug: row.instanceSlug,
    status: row.status === 'CLOSED' ? ('CLOSED' as const) : ('OPEN' as const),
    lastMessageAt: row.lastMessageAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    lastMessage: row.messages[0] ? mapSupportChatMessage(row.messages[0]) : null,
    unreadCount: unreadCounts.get(row.id) ?? 0,
  }));

  return res.status(200).json({ conversations });
}
