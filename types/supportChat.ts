export type SupportChatRole = 'VISITOR' | 'SUPPORT';
export type SupportChatStatus = 'OPEN' | 'CLOSED';

export type SupportChatMessage = {
  id: number;
  senderRole: SupportChatRole;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type SupportChatConversation = {
  id: string;
  visitorName: string | null;
  instanceSlug: string | null;
  status: SupportChatStatus;
  lastMessageAt: string;
  createdAt: string;
  messages: SupportChatMessage[];
};

export type SupportChatSummary = Omit<SupportChatConversation, 'messages'> & {
  lastMessage: SupportChatMessage | null;
  unreadCount: number;
};
