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
            className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)]"
            onClick={() => void loadList()}
            disabled={loadingList}
          >
            <FiRefreshCw className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
            Aktualisieren
          </button>
        }
      >
        {error && (
          <div className="ds-message [margin-bottom:var(--ds-space-6)] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-elevated)] [color:var(--ds-text-default)] [font-size:0.875rem] ds-message-danger [border-color:color-mix(in_srgb,_var(--ds-danger)_38%,_transparent)] [background:color-mix(in_srgb,_var(--ds-danger)_12%,_transparent)] [color:var(--ds-danger)]">
            {error}
          </div>
        )}

        <section
          className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] support-chat-admin-layout [display:grid] [min-height:680px] [grid-template-columns:minmax(260px,_0.35fr)_minmax(0,_0.65fr)] [overflow:hidden] max-[820px]:[grid-template-columns:1fr]"
          aria-label="Support-Chats"
        >
          <aside className="support-chat-admin-sidebar [min-width:0] [border-right:1px_solid_var(--ds-border-default)] [background:var(--ds-bg-elevated-strong)] max-[820px]:[border-right:0] max-[820px]:[border-bottom:1px_solid_var(--ds-border-default)]">
            <div className="support-chat-admin-sidebar-header [display:flex] [align-items:center] [justify-content:space-between] [gap:14px] [padding:22px] [border-bottom:1px_solid_var(--ds-border-default)] [&_h2]:[margin:0] [&_h2]:[color:var(--ds-text-strong)] [&_h2]:[font-size:1.15rem]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Postfach
                </p>
                <h2>Unterhaltungen</h2>
              </div>
              <span className="support-chat-admin-count [flex:0_0_auto] [padding:6px_9px] [border-radius:999px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:850]">
                {conversations.filter((item) => item.status === 'OPEN').length} offen
              </span>
            </div>

            {loadingList && conversations.length === 0 ? (
              <div className="support-chat-admin-loading [display:grid] [min-height:260px] [place-content:center] [justify-items:center] [gap:12px] [padding:32px] [color:var(--ds-text-muted)] [text-align:center]">
                <JSDoITLoader sizeRem={2} message="Chats werden geladen …" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="support-chat-admin-empty [display:grid] [min-height:260px] [place-content:center] [justify-items:center] [gap:12px] [padding:32px] [color:var(--ds-text-muted)] [text-align:center] [&>svg]:[width:38px] [&>svg]:[height:38px] [&>svg]:[color:var(--ds-accent-strong)] [&_p]:[margin:0]">
                <FiMessageCircle aria-hidden="true" />
                <p>Noch keine Supportanfragen vorhanden.</p>
              </div>
            ) : (
              <div className="support-chat-admin-conversations [max-height:612px] [overflow-y:auto] max-[820px]:[max-height:300px]">
                {conversations.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`support-chat-admin-conversation [position:relative] [display:grid] [width:100%] [gap:7px] [padding:17px_20px] [border:0] [border-bottom:1px_solid_var(--ds-border-default)] [background:transparent] [color:var(--ds-text-default)] [text-align:left] hover:[background:var(--ds-accent-soft)] [&.is-active]:[background:var(--ds-accent-soft)] [&.is-active]:[box-shadow:inset_3px_0_0_var(--ds-accent-strong)]${selectedId === item.id ? ' is-active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="support-chat-admin-conversation-topline [display:flex] [justify-content:space-between] [gap:10px] [&_strong]:[overflow:hidden] [&_strong]:[color:var(--ds-text-strong)] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_time]:[color:var(--ds-text-muted)] [&_time]:[font-size:0.7rem]">
                      <strong>{item.visitorName || 'Roadmap-Nutzer'}</strong>
                      <time dateTime={item.lastMessageAt}>
                        {formatDateTime(item.lastMessageAt)}
                      </time>
                    </span>
                    <span className="support-chat-admin-conversation-meta [color:var(--ds-text-muted)] [font-size:0.7rem]">
                      {item.instanceSlug || 'Keine Instanz'} ·{' '}
                      {item.status === 'OPEN' ? 'Offen' : 'Abgeschlossen'}
                    </span>
                    <span className="support-chat-admin-preview [overflow:hidden] [font-size:0.8rem] [text-overflow:ellipsis] [white-space:nowrap]">
                      {item.lastMessage?.body || 'Noch keine Nachricht'}
                    </span>
                    {item.unreadCount > 0 && (
                      <span className="support-chat-admin-unread [position:absolute] [right:18px] [bottom:13px] [display:grid] [min-width:20px] [height:20px] [place-items:center] [padding-inline:5px] [border-radius:999px] [background:var(--ds-accent-strong)] [color:var(--ds-text-inverse)] [font-size:0.7rem] [font-weight:900]">
                        {item.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="support-chat-admin-chat [&_.cs-main-container]:[height:100%] [&_.cs-main-container]:[border:0] [&_.cs-main-container]:[background:var(--ds-bg-elevated)] [&_.cs-main-container]:[color:var(--ds-text-default)] [&_.cs-chat-container]:[background:var(--ds-bg-elevated)] [&_.cs-conversation-header]:[border-color:var(--ds-border-default)] [&_.cs-conversation-header]:![background-color:var(--ds-bg-elevated-strong)] [&_.cs-conversation-header]:[color:var(--ds-text-default)] [&_.cs-conversation-header]:[font-family:var(--ds-font-sans)] [&_.cs-conversation-header__content]:![background-color:transparent] [&_.cs-conversation-header__user-name]:![background-color:transparent] [&_.cs-conversation-header__info]:![background-color:transparent] [&_.cs-conversation-header__actions]:![background-color:transparent] [&_.cs-conversation-header__user-name]:[color:var(--ds-text-strong)] [&_.cs-conversation-header__user-name]:[font-weight:850] [&_.cs-conversation-header__info]:![color:inherit] [&_.cs-message-list]:[background:color-mix(in_srgb,_var(--ds-bg-page)_80%,_var(--ds-bg-elevated))] [&_.cs-message--incoming_.cs-message__content]:[border:1px_solid_var(--ds-border-default)] [&_.cs-message--incoming_.cs-message__content]:[background:var(--ds-bg-elevated-strong)] [&_.cs-message--incoming_.cs-message__content]:[color:var(--ds-text-default)] [&_.cs-message--outgoing_.cs-message__content]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&_.cs-message--outgoing_.cs-message__content]:[color:var(--ds-text-inverse)] [&_.cs-message__footer]:[color:var(--ds-text-muted)] [&_.cs-message-input]:[padding:8px] [&_.cs-message-input]:[border-color:var(--ds-border-default)] [&_.cs-message-input]:![background-color:var(--ds-bg-elevated-strong)] [&_.cs-message-input]:[color:var(--ds-text-default)] [&_.cs-message-input]:[font-family:var(--ds-font-sans)] [&_.cs-message-input__content-editor-wrapper]:[border:1px_solid_var(--ds-border-default)] [&_.cs-message-input__content-editor-wrapper]:![background-color:var(--ds-bg-soft)] [&_.cs-message-input__content-editor-wrapper]:[color:var(--ds-text-strong)] [&_.cs-message-input__content-editor-wrapper]:[transition:border-color_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-fast)_var(--ds-ease-out)] [&_.cs-message-input__content-editor-wrapper:focus-within]:[border-color:var(--ds-accent-strong)] [&_.cs-message-input__content-editor-wrapper:focus-within]:[box-shadow:0_0_0_3px_var(--ds-accent-soft)] [&_.cs-message-input__content-editor]:![background-color:transparent] [&_.cs-message-input__content-editor]:[color:var(--ds-text-strong)] [&_.cs-message-input__content-editor]:[caret-color:var(--ds-accent-strong)] [&_.cs-message-input__content-editor]:[font-family:var(--ds-font-sans)] [&_.cs-message-input__tools]:![background-color:transparent] [&_.cs-button--send]:![color:var(--ds-accent-strong)] [&_.cs-button--send]:[transition:color_var(--ds-duration-fast)_var(--ds-ease-out),_background-color_var(--ds-duration-fast)_var(--ds-ease-out)] [&_.cs-button--send:hover:not(:disabled)]:[background-color:var(--ds-accent-soft)] [&_.cs-button--send:hover:not(:disabled)]:![color:var(--ds-text-strong)] [&_.cs-button--send:hover:not(:disabled)]:[opacity:1] [min-width:0] [height:680px] [background:var(--ds-bg-elevated)]">
            {!selectedId ? (
              <div className="support-chat-admin-placeholder [display:grid] [min-height:260px] [place-content:center] [justify-items:center] [gap:12px] [padding:32px] [color:var(--ds-text-muted)] [text-align:center] [height:100%] [&>svg]:[width:38px] [&>svg]:[height:38px] [&>svg]:[color:var(--ds-accent-strong)] [&_h2]:[margin:0] [&_p]:[margin:0] [&_h2]:[color:var(--ds-text-strong)]">
                <FiMessageCircle aria-hidden="true" />
                <h2>Unterhaltung auswählen</h2>
                <p>Wählen Sie links eine Supportanfrage aus.</p>
              </div>
            ) : loadingChat && !conversation ? (
              <div className="support-chat-admin-loading [display:grid] [min-height:260px] [place-content:center] [justify-items:center] [gap:12px] [padding:32px] [color:var(--ds-text-muted)] [text-align:center]">
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
                          className="support-chat-admin-status-button [display:inline-flex] [align-items:center] [gap:7px] [padding:8px_11px] [border:1px_solid_var(--ds-border-default)] [border-radius:10px] [background:var(--ds-bg-soft)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:800]"
                          onClick={() => void updateStatus('CLOSED')}
                        >
                          <FiCheck /> Abschließen
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="support-chat-admin-status-button [display:inline-flex] [align-items:center] [gap:7px] [padding:8px_11px] [border:1px_solid_var(--ds-border-default)] [border-radius:10px] [background:var(--ds-bg-soft)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:800]"
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
          <p className="support-chat-admin-storage-note [margin:14px_0_0] [color:var(--ds-text-muted)] [font-size:0.75rem]">
            Chat-ID {selectedSummary.id} · Speicherung in der PostgreSQL-Datenbank
          </p>
        )}
      </AdminSubpageLayout>
    </>
  );
};

export default withSuperAdminAuth(SupportChatAdminPage);
