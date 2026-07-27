import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FiMessageCircle } from 'react-icons/fi';

type SupportChatWidgetProps = { onClose: () => void };

const SupportChatWidget = dynamic<SupportChatWidgetProps>(
  // Next/Webpack resolves this extensionless request; NodeNext's standalone
  // checker does not model that bundler behavior.
  // @ts-expect-error bundler-resolved dynamic component
  () => import('./SupportChatWidget').then((module) => module.default),
  {
    ssr: false,
    loading: () => null,
  }
);

const SupportChatLauncher = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (router.pathname === '/admin/support-chat') return null;

  if (open) {
    return <SupportChatWidget onClose={() => setOpen(false)} />;
  }

  return (
    <div className="support-chat-root">
      <button
        type="button"
        className="support-chat-launcher"
        onClick={() => setOpen(true)}
        aria-label="Live-Chat öffnen"
      >
        <FiMessageCircle aria-hidden="true" />
        <span className="support-chat-launcher-label">Live-Chat</span>
      </button>
    </div>
  );
};

export default SupportChatLauncher;
