import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { FiMessageCircle, FiMinimize2, FiShield } from 'react-icons/fi';
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import type { SupportChatConversation, SupportChatMessage } from '@/types/supportChat';
import { buildInstanceAwareUrl } from '@/utils/auth';

type ApiResponse = { conversation: SupportChatConversation | null; error?: string };

const LAST_SEEN_KEY = 'roadmap-support-chat-last-seen';

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const getLatestSupportMessageId = (messages: SupportChatMessage[]): number =>
  messages.reduce(
    (latest, message) => (message.senderRole === 'SUPPORT' ? Math.max(latest, message.id) : latest),
    0
  );

const SupportChatWidget = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportChatConversation | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(false);

  const latestSupportMessageId = useMemo(
    () => getLatestSupportMessageId(conversation?.messages ?? []),
    [conversation]
  );

  const markRead = useCallback((messageId: number) => {
    if (messageId <= 0 || typeof window === 'undefined') return;
    window.localStorage.setItem(LAST_SEEN_KEY, String(messageId));
    setUnread(false);
  }, []);

  const loadConversation = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(buildInstanceAwareUrl('/api/support-chat/messages'), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok) throw new Error(data?.error || 'Chat konnte nicht geladen werden.');
      setConversation(data?.conversation ?? null);
      setError('');
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error ? loadError.message : 'Chat konnte nicht geladen werden.'
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversation(true);
  }, [loadConversation]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadConversation(true), open ? 3000 : 12000);
    return () => window.clearInterval(interval);
  }, [loadConversation, open]);

  useEffect(() => {
    if (!latestSupportMessageId || typeof window === 'undefined') return;
    const seen = Number(window.localStorage.getItem(LAST_SEEN_KEY) || 0);
    if (open) markRead(latestSupportMessageId);
    else if (latestSupportMessageId > seen) setUnread(true);
  }, [latestSupportMessageId, markRead, open]);

  const sendMessage = async (message: string) => {
    const normalized = message.trim();
    if (!normalized || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(buildInstanceAwareUrl('/api/support-chat/messages'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: normalized, visitorName: visitorName.trim() || undefined }),
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !data?.conversation) {
        throw new Error(data?.error || 'Nachricht konnte nicht gesendet werden.');
      }
      setConversation(data.conversation);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : 'Nachricht konnte nicht gesendet werden.'
      );
    } finally {
      setSending(false);
    }
  };

  const openChat = () => {
    setOpen(true);
    markRead(latestSupportMessageId);
    void loadConversation();
  };

  if (router.pathname === '/admin/support-chat') return null;

  return (
    <div className="support-chat-root">
      {open && (
        <section
          className="support-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Live-Chat mit dem Roadmap-Support"
        >
          <MainContainer>
            <ChatContainer>
              <ConversationHeader>
                <ConversationHeader.Content
                  userName="Roadmap-Support"
                  info="Antwortzeit ca. 5 min."
                />
                <ConversationHeader.Actions>
                  <button
                    type="button"
                    className="support-chat-header-button"
                    onClick={() => setOpen(false)}
                    aria-label="Chat minimieren"
                  >
                    <FiMinimize2 />
                  </button>
                </ConversationHeader.Actions>
              </ConversationHeader>

              <MessageList loading={loading} loadingMore={false}>
                {!conversation && (
                  <MessageList.Content className="support-chat-welcome">
                    <div className="support-chat-welcome-icon" aria-hidden="true">
                      <FiMessageCircle />
                    </div>
                    <h2>Wie können wir helfen?</h2>
                    <p>
                      Schreiben Sie Ihre Frage möglichst konkret. Der Verlauf bleibt auf diesem
                      Roadmap-Server gespeichert.
                    </p>
                    <label className="support-chat-name-field">
                      <span>Ihr Name (optional)</span>
                      <input
                        value={visitorName}
                        onChange={(event) => setVisitorName(event.target.value.slice(0, 80))}
                        autoComplete="name"
                        maxLength={80}
                        placeholder="Name"
                      />
                    </label>
                  </MessageList.Content>
                )}

                {conversation?.messages.map((message) => (
                  <Message
                    key={message.id}
                    model={{
                      message: message.body,
                      sentTime: formatTime(message.createdAt),
                      sender:
                        message.senderName ||
                        (message.senderRole === 'SUPPORT' ? 'Roadmap-Support' : 'Sie'),
                      direction: message.senderRole === 'VISITOR' ? 'outgoing' : 'incoming',
                      position: 'single',
                      type: 'text',
                    }}
                  >
                    <Message.Footer
                      sender={
                        message.senderRole === 'SUPPORT' ? message.senderName || 'Support' : 'Sie'
                      }
                      sentTime={formatTime(message.createdAt)}
                    />
                  </Message>
                ))}

                {conversation?.status === 'CLOSED' && (
                  <MessageList.Content className="support-chat-status-note">
                    Dieser Chat wurde abgeschlossen. Eine neue Nachricht öffnet ihn wieder.
                  </MessageList.Content>
                )}
              </MessageList>

              {error && <div className="support-chat-error">{error}</div>}
              <div className="support-chat-privacy-note">
                <FiShield aria-hidden="true" /> Keine Passwörter oder Zugangstokens senden.
              </div>
              <MessageInput
                placeholder="Nachricht schreiben …"
                attachButton={false}
                disabled={sending}
                sendDisabled={sending}
                sendOnReturnDisabled={false}
                onSend={(_html, textContent) => void sendMessage(textContent)}
              />
            </ChatContainer>
          </MainContainer>
        </section>
      )}

      {!open && (
        <button
          type="button"
          className="support-chat-launcher"
          onClick={openChat}
          aria-label={unread ? 'Live-Chat öffnen, neue Antwort vorhanden' : 'Live-Chat öffnen'}
        >
          <FiMessageCircle aria-hidden="true" />
          <span className="support-chat-launcher-label">Live-Chat</span>
          {unread && <span className="support-chat-unread" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
};

export default SupportChatWidget;
