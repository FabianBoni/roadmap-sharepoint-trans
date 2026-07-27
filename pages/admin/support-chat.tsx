import Head from 'next/head';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiMessageCircle, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import AdminSubpageLayout from '@/components/AdminSubpageLayout';
import JSDoITLoader from '@/components/JSDoITLoader';
import withSuperAdminAuth from '@/components/withSuperAdminAuth';
import type {
  SupportChatConversation,
  SupportChatMessage,
  SupportChatSummary,
} from '@/types/supportChat';
import { buildInstanceAwareUrl } from '@/utils/auth';

type ListResponse = { conversations?: SupportChatSummary[]; error?: string };
type DetailResponse = { conversation?: SupportChatConversation; error?: string };

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const messageDirection = (message: SupportChatMessage) =>
  message.senderRole === 'SUPPORT' ? 'outgoing' : 'incoming';

const SupportChatAdminPage = () => {
  const [conversations, setConversations] = useState<SupportChatSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<SupportChatConversation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedSummary = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const loadList = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const response = await fetch(buildInstanceAwareUrl('/api/admin/support-chat/conversations'), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = (await response.json().catch(() => null)) as ListResponse | null;
      if (!response.ok)
        throw new Error(data?.error || 'Support-Chats konnten nicht geladen werden.');
      const items = data?.conversations ?? [];
      setConversations(items);
      setSelectedId((current) => current || items[0]?.id || null);
      setError('');
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Support-Chats konnten nicht geladen werden.'
        );
      }
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingChat(true);
    try {
      const response = await fetch(
        buildInstanceAwareUrl(`/api/admin/support-chat/conversations/${encodeURIComponent(id)}`),
        { credentials: 'same-origin', headers: { Accept: 'application/json' } }
      );
      const data = (await response.json().catch(() => null)) as DetailResponse | null;
      if (!response.ok || !data?.conversation) {
        throw new Error(data?.error || 'Chat konnte nicht geladen werden.');
      }
      setConversation(data.conversation);
      setError('');
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error ? loadError.message : 'Chat konnte nicht geladen werden.'
        );
      }
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
    const interval = window.setInterval(() => void loadList(true), 5000);
    return () => window.clearInterval(interval);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setConversation(null);
      return;
    }
    void loadConversation(selectedId);
    const interval = window.setInterval(() => void loadConversation(selectedId, true), 3000);
    return () => window.clearInterval(interval);
  }, [loadConversation, selectedId]);

  const sendMessage = async (message: string) => {
    const normalized = message.trim();
    if (!selectedId || !normalized || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(
        buildInstanceAwareUrl(
          `/api/admin/support-chat/conversations/${encodeURIComponent(selectedId)}`
        ),
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ message: normalized }),
        }
      );
      const data = (await response.json().catch(() => null)) as DetailResponse | null;
      if (!response.ok || !data?.conversation) {
        throw new Error(data?.error || 'Antwort konnte nicht gesendet werden.');
      }
      setConversation(data.conversation);
      await loadList(true);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : 'Antwort konnte nicht gesendet werden.'
      );
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: 'OPEN' | 'CLOSED') => {
    if (!selectedId) return;
    setError('');
    try {
      const response = await fetch(
        buildInstanceAwareUrl(
          `/api/admin/support-chat/conversations/${encodeURIComponent(selectedId)}`
        ),
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      const data = (await response.json().catch(() => null)) as DetailResponse | null;
      if (!response.ok || !data?.conversation) {
        throw new Error(data?.error || 'Chatstatus konnte nicht geändert werden.');
      }
      setConversation(data.conversation);
      await loadList(true);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'Chatstatus konnte nicht geändert werden.'
      );
    }
  };

  return (
    <>
      <Head>
        <title>Support-Postfach | JSDoIT Roadmap</title>
      </Head>
      <AdminSubpageLayout
        title="Support-Postfach"
        eyebrow="Superadmin · Lokaler Live-Chat"
        description={
          <>
            Beantworten Sie Supportanfragen direkt in der Anwendung. Gespräche und Nachrichten
            werden ausschließlich in der lokalen Roadmap-Datenbank gespeichert.
          </>
        }
        breadcrumbs={[
          { label: 'Superadmin', href: '/admin/instances' },
          { label: 'Support-Postfach' },
        ]}
        maxWidthClassName="max-w-6xl"
        actions={
          <button
            type="button"
            className="ds-button ds-button-secondary"
            onClick={() => void loadList()}
            disabled={loadingList}
          >
            <FiRefreshCw className="ds-icon-sm" />
            Aktualisieren
          </button>
        }
      >
        {error && <div className="ds-message ds-message-danger">{error}</div>}

        <section className="ds-card support-chat-admin-layout" aria-label="Support-Chats">
          <aside className="support-chat-admin-sidebar">
            <div className="support-chat-admin-sidebar-header">
              <div>
                <p className="ds-panel-label">Postfach</p>
                <h2>Unterhaltungen</h2>
              </div>
              <span className="support-chat-admin-count">
                {conversations.filter((item) => item.status === 'OPEN').length} offen
              </span>
            </div>

            {loadingList && conversations.length === 0 ? (
              <div className="support-chat-admin-loading">
                <JSDoITLoader sizeRem={2} message="Chats werden geladen …" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="support-chat-admin-empty">
                <FiMessageCircle aria-hidden="true" />
                <p>Noch keine Supportanfragen vorhanden.</p>
              </div>
            ) : (
              <div className="support-chat-admin-conversations">
                {conversations.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`support-chat-admin-conversation${selectedId === item.id ? ' is-active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="support-chat-admin-conversation-topline">
                      <strong>{item.visitorName || 'Roadmap-Nutzer'}</strong>
                      <time dateTime={item.lastMessageAt}>
                        {formatDateTime(item.lastMessageAt)}
                      </time>
                    </span>
                    <span className="support-chat-admin-conversation-meta">
                      {item.instanceSlug || 'Keine Instanz'} ·{' '}
                      {item.status === 'OPEN' ? 'Offen' : 'Abgeschlossen'}
                    </span>
                    <span className="support-chat-admin-preview">
                      {item.lastMessage?.body || 'Noch keine Nachricht'}
                    </span>
                    {item.unreadCount > 0 && (
                      <span className="support-chat-admin-unread">{item.unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="support-chat-admin-chat">
            {!selectedId ? (
              <div className="support-chat-admin-placeholder">
                <FiMessageCircle aria-hidden="true" />
                <h2>Unterhaltung auswählen</h2>
                <p>Wählen Sie links eine Supportanfrage aus.</p>
              </div>
            ) : loadingChat && !conversation ? (
              <div className="support-chat-admin-loading">
                <JSDoITLoader sizeRem={2.4} message="Unterhaltung wird geladen …" />
              </div>
            ) : conversation ? (
              <MainContainer>
                <ChatContainer>
                  <ConversationHeader>
                    <ConversationHeader.Content
                      userName={conversation.visitorName || 'Roadmap-Nutzer'}
                      info={`${conversation.instanceSlug || 'Keine Instanz'} · ${conversation.status === 'OPEN' ? 'Offen' : 'Abgeschlossen'}`}
                    />
                    <ConversationHeader.Actions>
                      {conversation.status === 'OPEN' ? (
                        <button
                          type="button"
                          className="support-chat-admin-status-button"
                          onClick={() => void updateStatus('CLOSED')}
                        >
                          <FiCheck /> Abschließen
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="support-chat-admin-status-button"
                          onClick={() => void updateStatus('OPEN')}
                        >
                          <FiRotateCcw /> Wieder öffnen
                        </button>
                      )}
                    </ConversationHeader.Actions>
                  </ConversationHeader>
                  <MessageList loading={loadingChat} loadingMore={false}>
                    {conversation.messages.map((message) => (
                      <Message
                        key={message.id}
                        model={{
                          message: message.body,
                          sentTime: formatDateTime(message.createdAt),
                          sender:
                            message.senderName ||
                            (message.senderRole === 'SUPPORT' ? 'Support' : 'Roadmap-Nutzer'),
                          direction: messageDirection(message),
                          position: 'single',
                          type: 'text',
                        }}
                      >
                        <Message.Footer
                          sender={
                            message.senderName ||
                            (message.senderRole === 'SUPPORT' ? 'Support' : 'Roadmap-Nutzer')
                          }
                          sentTime={formatDateTime(message.createdAt)}
                        />
                      </Message>
                    ))}
                  </MessageList>
                  <MessageInput
                    placeholder="Antwort schreiben …"
                    attachButton={false}
                    disabled={sending}
                    sendDisabled={sending}
                    onSend={(_html, textContent) => void sendMessage(textContent)}
                  />
                </ChatContainer>
              </MainContainer>
            ) : null}
          </div>
        </section>
        {selectedSummary && (
          <p className="support-chat-admin-storage-note">
            Chat-ID {selectedSummary.id} · Speicherung in der PostgreSQL-Datenbank
          </p>
        )}
      </AdminSubpageLayout>
    </>
  );
};

export default withSuperAdminAuth(SupportChatAdminPage);
