import { useCallback, useEffect, useState } from 'react';
import { FiMessageCircle, FiMinimize2, FiShield } from 'react-icons/fi';
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import type { SupportChatConversation } from '@/types/supportChat';
import { buildInstanceAwareUrl } from '@/utils/auth';

type ApiResponse = { conversation: SupportChatConversation | null; error?: string };

type SupportChatWidgetProps = {
  onClose: () => void;
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

/**
 * The heavy chat UI is mounted only after the launcher is clicked. While it is
 * mounted, polling pauses automatically in background tabs.
 */
const SupportChatWidget = ({ onClose }: SupportChatWidgetProps) => {
  const [conversation, setConversation] = useState<SupportChatConversation | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

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
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadConversation(true);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [loadConversation]);

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

  return (
    <div className="support-chat-root [position:relative] [z-index:1200]">
      <section
        className="support-chat-panel [position:fixed] [right:max(22px,_env(safe-area-inset-right))] [bottom:max(94px,_calc(env(safe-area-inset-bottom)_+_82px))] [z-index:1200] [width:min(410px,_calc(100vw_-_28px))] [height:min(640px,_calc(100dvh_-_122px))] [overflow:hidden] [border:1px_solid_var(--ds-border-strong)] [border-radius:24px] [background:var(--ds-bg-elevated)] [box-shadow:0_28px_78px_rgba(0,_0,_0,_0.5),_var(--ds-shadow-glow)] [&_.cs-main-container]:[height:100%] [&_.cs-main-container]:[border:0] [&_.cs-main-container]:[background:var(--ds-bg-elevated)] [&_.cs-main-container]:[color:var(--ds-text-default)] [&_.cs-chat-container]:[background:var(--ds-bg-elevated)] [&_.cs-conversation-header]:[border-color:var(--ds-border-default)] [&_.cs-conversation-header]:![background-color:var(--ds-bg-elevated-strong)] [&_.cs-conversation-header]:[color:var(--ds-text-default)] [&_.cs-conversation-header]:[font-family:var(--ds-font-sans)] [&_.cs-conversation-header__content]:![background-color:transparent] [&_.cs-conversation-header__user-name]:![background-color:transparent] [&_.cs-conversation-header__info]:![background-color:transparent] [&_.cs-conversation-header__actions]:![background-color:transparent] [&_.cs-conversation-header__user-name]:[color:var(--ds-text-strong)] [&_.cs-conversation-header__user-name]:[font-weight:850] [&_.cs-conversation-header__info]:![color:inherit] [&_.cs-message-list]:[background:color-mix(in_srgb,_var(--ds-bg-page)_80%,_var(--ds-bg-elevated))] [&_.cs-message--incoming_.cs-message__content]:[border:1px_solid_var(--ds-border-default)] [&_.cs-message--incoming_.cs-message__content]:[background:var(--ds-bg-elevated-strong)] [&_.cs-message--incoming_.cs-message__content]:[color:var(--ds-text-default)] [&_.cs-message--outgoing_.cs-message__content]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&_.cs-message--outgoing_.cs-message__content]:[color:var(--ds-text-inverse)] [&_.cs-message__footer]:[color:var(--ds-text-muted)] [&_.cs-message-input]:[padding:8px] [&_.cs-message-input]:[border-color:var(--ds-border-default)] [&_.cs-message-input]:![background-color:var(--ds-bg-elevated-strong)] [&_.cs-message-input]:[color:var(--ds-text-default)] [&_.cs-message-input]:[font-family:var(--ds-font-sans)] [&_.cs-message-input__content-editor-wrapper]:[border:1px_solid_var(--ds-border-default)] [&_.cs-message-input__content-editor-wrapper]:![background-color:var(--ds-bg-soft)] [&_.cs-message-input__content-editor-wrapper]:[color:var(--ds-text-strong)] [&_.cs-message-input__content-editor-wrapper]:[transition:border-color_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-fast)_var(--ds-ease-out)] [&_.cs-message-input__content-editor-wrapper:focus-within]:[border-color:var(--ds-accent-strong)] [&_.cs-message-input__content-editor-wrapper:focus-within]:[box-shadow:0_0_0_3px_var(--ds-accent-soft)] [&_.cs-message-input__content-editor]:![background-color:transparent] [&_.cs-message-input__content-editor]:[color:var(--ds-text-strong)] [&_.cs-message-input__content-editor]:[caret-color:var(--ds-accent-strong)] [&_.cs-message-input__content-editor]:[font-family:var(--ds-font-sans)] [&_.cs-message-input__tools]:![background-color:transparent] [&_.cs-button--send]:![color:var(--ds-accent-strong)] [&_.cs-button--send]:[transition:color_var(--ds-duration-fast)_var(--ds-ease-out),_background-color_var(--ds-duration-fast)_var(--ds-ease-out)] [&_.cs-button--send:hover:not(:disabled)]:[background-color:var(--ds-accent-soft)] [&_.cs-button--send:hover:not(:disabled)]:![color:var(--ds-text-strong)] [&_.cs-button--send:hover:not(:disabled)]:[opacity:1] max-[520px]:[right:10px] max-[520px]:[bottom:max(82px,_calc(env(safe-area-inset-bottom)_+_72px))] max-[520px]:[width:calc(100vw_-_20px)] max-[520px]:[height:min(650px,_calc(100dvh_-_100px))] max-[520px]:[border-radius:20px]"
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
                  className="support-chat-header-button [display:grid] [width:40px] [height:40px] [place-items:center] [border:1px_solid_var(--ds-border-default)] [border-radius:12px] [background:var(--ds-bg-soft)] [color:var(--ds-text-strong)]"
                  onClick={onClose}
                  aria-label="Chat minimieren"
                >
                  <FiMinimize2 />
                </button>
              </ConversationHeader.Actions>
            </ConversationHeader>

            <MessageList loading={loading} loadingMore={false}>
              {!conversation && (
                <MessageList.Content className="support-chat-welcome [display:grid] [justify-items:center] [gap:12px] [padding:28px_22px] [color:var(--ds-text-default)] [text-align:center] [&_h2]:[margin:0] [&_p]:[margin:0] [&_h2]:[color:var(--ds-text-strong)] [&_h2]:[font-size:1.25rem] [&_p]:[max-width:310px] [&_p]:[font-size:0.875rem] [&_p]:[line-height:1.55]">
                  <div
                    className="support-chat-welcome-icon [display:grid] [width:54px] [height:54px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:18px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)] [font-size:1.5rem]"
                    aria-hidden="true"
                  >
                    <FiMessageCircle />
                  </div>
                  <h2>Wie können wir helfen?</h2>
                  <p>
                    Schreiben Sie Ihre Frage möglichst konkret. Der Verlauf bleibt auf diesem
                    Roadmap-Server gespeichert.
                  </p>
                  <label className="support-chat-name-field [display:grid] [width:min(100%,_300px)] [gap:7px] [margin-top:4px] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750] [text-align:left] [&_input]:[width:100%] [&_input]:[padding:11px_13px] [&_input]:[border:1px_solid_var(--ds-border-default)] [&_input]:[border-radius:12px] [&_input]:[outline:none] [&_input]:[background:var(--ds-bg-elevated-strong)] [&_input]:[color:var(--ds-text-strong)] [&_input:focus]:[border-color:var(--ds-accent-strong)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--ds-accent-soft)]">
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
                <MessageList.Content className="support-chat-status-note [padding:9px_14px] [font-size:0.75rem] [line-height:1.45] [color:var(--ds-text-muted)] [text-align:center]">
                  Dieser Chat wurde abgeschlossen. Eine neue Nachricht öffnet ihn wieder.
                </MessageList.Content>
              )}
            </MessageList>

            {error && (
              <div className="support-chat-error [padding:9px_14px] [font-size:0.75rem] [line-height:1.45] [border-top:1px_solid_color-mix(in_srgb,_var(--ds-danger)_42%,_transparent)] [background:color-mix(in_srgb,_var(--ds-danger)_12%,_var(--ds-bg-elevated))] [color:var(--ds-danger)]">
                {error}
              </div>
            )}
            <div className="support-chat-privacy-note [padding:9px_14px] [font-size:0.75rem] [line-height:1.45] [display:flex] [align-items:center] [gap:7px] [border-top:1px_solid_var(--ds-border-default)] [background:var(--ds-bg-elevated-strong)] [color:var(--ds-text-muted)]">
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
    </div>
  );
};

export default SupportChatWidget;
