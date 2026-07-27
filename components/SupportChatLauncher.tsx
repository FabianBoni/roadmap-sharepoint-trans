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
    <div className="support-chat-root [position:relative] [z-index:1200]">
      <button
        type="button"
        className="support-chat-launcher [position:fixed] [right:max(22px,_env(safe-area-inset-right))] [bottom:max(22px,_env(safe-area-inset-bottom))] [z-index:1200] [display:inline-flex] [min-height:58px] [align-items:center] [gap:10px] [padding:0_20px] [border:1px_solid_color-mix(in_srgb,_var(--ds-accent-strong)_54%,_transparent)] [border-radius:999px] [background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [box-shadow:0_18px_48px_rgba(0,_0,_0,_0.34),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-weight:850] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out)] hover:[box-shadow:0_22px_58px_rgba(0,_0,_0,_0.42),_var(--ds-shadow-glow)] hover:[transform:translateY(-2px)] [&>svg]:[width:22px] [&>svg]:[height:22px] max-[520px]:[width:58px] max-[520px]:[padding:0] max-[520px]:[justify-content:center]"
        onClick={() => setOpen(true)}
        aria-label="Live-Chat öffnen"
      >
        <FiMessageCircle aria-hidden="true" />
        <span className="support-chat-launcher-label max-[520px]:[display:none]">Live-Chat</span>
      </button>
    </div>
  );
};

export default SupportChatLauncher;
