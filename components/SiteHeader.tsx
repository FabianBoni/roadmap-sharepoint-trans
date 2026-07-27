import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useEffect, useState } from 'react';
import {
  ADMIN_SESSION_CHANGED_EVENT,
  getAdminSessionState,
  hasAdminAccessToCurrentInstance,
  hasValidAdminSession,
} from '@/utils/auth';
import ColorModeToggle from '@/components/ColorModeToggle';
import { INSTANCE_QUERY_PARAM, INSTANCE_COOKIE_NAME } from '@/utils/instanceConfig';
import Image from 'next/image';

type RouteKey = 'home' | 'instances' | 'roadmap' | 'help' | 'docs' | 'admin' | 'feedback';

type SiteHeaderProps = {
  activeRoute?: RouteKey;
  brandLabel?: string;
  authenticated?: boolean;
  initialIsAdmin?: boolean;
};

const INSTANCE_CONTEXT_CHANGED_EVENT = 'roadmap-instance-changed';

const NAV_ITEMS: Array<{
  key: RouteKey;
  href: string;
  label: string;
}> = [
  { key: 'home', href: '/landing', label: 'Start' },
  { key: 'instances', href: '/instances', label: 'Instanzübersicht' },
  { key: 'roadmap', href: '/roadmap', label: 'Roadmap' },
  { key: 'help', href: '/help', label: 'Hilfe' },
  { key: 'feedback', href: '/feedback', label: 'Feedback' },
];

const deriveRouteKey = (pathname: string): RouteKey => {
  if (pathname === '/' || pathname.startsWith('/landing')) return 'home';
  if (pathname.startsWith('/instances')) return 'instances';
  if (pathname.startsWith('/roadmap')) return 'roadmap';
  if (pathname.startsWith('/help')) return 'help';
  if (pathname.startsWith('/feedback')) return 'feedback';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'home';
};

const SiteHeader: React.FC<SiteHeaderProps> = ({
  activeRoute,
  brandLabel = 'Kantonale Roadmap',
  authenticated,
  initialIsAdmin,
}) => {
  const router = useRouter();
  const pathname = router.pathname || '';
  const currentRoute = activeRoute ?? deriveRouteKey(pathname);
  const querySlug = useMemo(() => {
    const raw = router.query?.[INSTANCE_QUERY_PARAM];
    return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  }, [router.query]);

  const [cookieSlug, setCookieSlug] = useState<string>('');
  const [showAdminLink, setShowAdminLink] = useState(Boolean(initialIsAdmin));
  const [showFeedbackLink, setShowFeedbackLink] = useState(Boolean(authenticated));

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const updateCookieSlug = () => {
      try {
        const cookies = document.cookie || '';
        const match = cookies.match(
          new RegExp(`(?:^|;\\s*)${INSTANCE_COOKIE_NAME}=([^;\\s]+)`, 'i')
        );
        setCookieSlug(match?.[1] ? decodeURIComponent(match[1]) : '');
      } catch {
        setCookieSlug('');
      }
    };

    updateCookieSlug();
    window.addEventListener('focus', updateCookieSlug);
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, updateCookieSlug);
    window.addEventListener(INSTANCE_CONTEXT_CHANGED_EVENT, updateCookieSlug);

    return () => {
      window.removeEventListener('focus', updateCookieSlug);
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, updateCookieSlug);
      window.removeEventListener(INSTANCE_CONTEXT_CHANGED_EVENT, updateCookieSlug);
    };
  }, [router.asPath]);

  const instanceSlug = querySlug || cookieSlug || '';
  const maybeQuery = instanceSlug ? { [INSTANCE_QUERY_PARAM]: instanceSlug } : undefined;
  const adminLinkSlug = querySlug || cookieSlug;
  const hasAdminHref = Boolean(adminLinkSlug);
  const brandHref = maybeQuery ? { pathname: '/landing', query: maybeQuery } : '/landing';

  useEffect(() => {
    if (authenticated !== undefined) {
      setShowFeedbackLink(authenticated);
      return;
    }
    if (typeof window === 'undefined') return;
    const updateFeedbackLink = () => {
      void getAdminSessionState(true).then((session) =>
        setShowFeedbackLink(Boolean(session?.authenticated))
      );
    };
    void updateFeedbackLink();
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, updateFeedbackLink);
    return () => window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, updateFeedbackLink);
  }, [authenticated, router.asPath]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (initialIsAdmin !== undefined) {
        if (!cancelled) setShowAdminLink(initialIsAdmin);
        return;
      }
      if (currentRoute === 'admin') {
        if (!cancelled) setShowAdminLink(hasAdminHref);
        return;
      }

      if (!hasAdminHref) {
        if (!cancelled) setShowAdminLink(false);
        return;
      }

      try {
        const [hasSession, hasInstanceAdminAccess] = await Promise.all([
          hasValidAdminSession(),
          hasAdminAccessToCurrentInstance(),
        ]);
        if (!cancelled) setShowAdminLink(Boolean(hasSession && hasInstanceAdminAccess));
      } catch {
        if (!cancelled) setShowAdminLink(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [currentRoute, hasAdminHref, initialIsAdmin]);

  return (
    <header className="ds-topbar [position:sticky] [top:0] [z-index:10] [display:flex] [min-height:78px] [align-items:center] [justify-content:space-between] [gap:var(--ds-space-5)] [padding-inline:clamp(24px,_5vw,_96px)] [border-bottom:1px_solid_var(--ds-border-default)] [background:color-mix(in_srgb,_var(--ds-bg-page)_76%,_transparent)] [backdrop-filter:blur(18px)] max-[760px]:[align-items:flex-start] max-[760px]:[flex-direction:column] max-[760px]:[padding:18px_24px]">
      <Link className="ds-brand [display:flex] [align-items:center] [gap:14px]" href={brandHref}>
        <Image src="/logo.png" alt="Roadmap Logo" width={32} height={32} />
        <span className="ds-brand-name [color:var(--ds-text-strong)] [font-size:1.125rem] [font-weight:750] [letter-spacing:-0.02em]">
          {brandLabel}
        </span>
      </Link>

      <nav
        className="ds-nav [display:flex] [align-items:center] [gap:14px] max-[760px]:[width:100%] max-[760px]:[overflow-x:auto] max-[760px]:[padding-bottom:8px]"
        aria-label="Hauptnavigation"
      >
        {NAV_ITEMS.filter((item) => item.key !== 'roadmap' || currentRoute === 'roadmap')
          .filter((item) => item.key !== 'feedback' || showFeedbackLink)
          .map((item) => {
            const isActive = currentRoute === item.key;
            return (
              <Link
                key={item.href}
                href={maybeQuery ? { pathname: item.href, query: maybeQuery } : item.href}
                className={clsx(
                  'ds-nav-link [position:relative] [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:11px_15px] [border-radius:var(--ds-radius-pill)] [color:var(--ds-text-muted)] [font-size:0.875rem] [font-weight:650] [transition:color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[background:var(--ds-bg-soft)] hover:[color:var(--ds-text-strong)] data-[active=true]:[background:var(--ds-accent-soft)] data-[active=true]:[box-shadow:inset_0_0_0_1px_var(--ds-border-default)] data-[active=true]:[color:var(--ds-text-strong)] [&.is-active]:[background:var(--ds-accent-soft)] [&.is-active]:[box-shadow:inset_0_0_0_1px_var(--ds-border-default)] [&.is-active]:[color:var(--ds-text-strong)] data-[active=true]:after:[position:absolute] data-[active=true]:after:[right:18px] data-[active=true]:after:[bottom:-15px] data-[active=true]:after:[left:18px] data-[active=true]:after:[height:2px] data-[active=true]:after:[background:linear-gradient(90deg,_transparent,_var(--ds-accent),_transparent)] data-[active=true]:after:[box-shadow:0_0_18px_var(--ds-accent)] [&.is-active]:after:[position:absolute] [&.is-active]:after:[right:18px] [&.is-active]:after:[bottom:-15px] [&.is-active]:after:[left:18px] [&.is-active]:after:[height:2px] [&.is-active]:after:[background:linear-gradient(90deg,_transparent,_var(--ds-accent),_transparent)] [&.is-active]:after:[box-shadow:0_0_18px_var(--ds-accent)]',
                  isActive && 'is-active'
                )}
                data-active={isActive ? 'true' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="ds-topbar-actions [display:flex] [align-items:center] [gap:var(--ds-space-3)]">
        <ColorModeToggle className="ds-color-mode-toggle [flex:0_0_auto]" />
        {hasAdminHref && showAdminLink ? (
          <Link
            href={{ pathname: '/admin', query: { [INSTANCE_QUERY_PARAM]: adminLinkSlug } }}
            className={clsx(
              'ds-nav-link [position:relative] [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:11px_15px] [border-radius:var(--ds-radius-pill)] [color:var(--ds-text-muted)] [font-size:0.875rem] [font-weight:650] [transition:color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[background:var(--ds-bg-soft)] hover:[color:var(--ds-text-strong)] data-[active=true]:[background:var(--ds-accent-soft)] data-[active=true]:[box-shadow:inset_0_0_0_1px_var(--ds-border-default)] data-[active=true]:[color:var(--ds-text-strong)] [&.is-active]:[background:var(--ds-accent-soft)] [&.is-active]:[box-shadow:inset_0_0_0_1px_var(--ds-border-default)] [&.is-active]:[color:var(--ds-text-strong)] data-[active=true]:after:[position:absolute] data-[active=true]:after:[right:18px] data-[active=true]:after:[bottom:-15px] data-[active=true]:after:[left:18px] data-[active=true]:after:[height:2px] data-[active=true]:after:[background:linear-gradient(90deg,_transparent,_var(--ds-accent),_transparent)] data-[active=true]:after:[box-shadow:0_0_18px_var(--ds-accent)] [&.is-active]:after:[position:absolute] [&.is-active]:after:[right:18px] [&.is-active]:after:[bottom:-15px] [&.is-active]:after:[left:18px] [&.is-active]:after:[height:2px] [&.is-active]:after:[background:linear-gradient(90deg,_transparent,_var(--ds-accent),_transparent)] [&.is-active]:after:[box-shadow:0_0_18px_var(--ds-accent)]',
              currentRoute === 'admin' && 'is-active'
            )}
            data-active={currentRoute === 'admin' ? 'true' : undefined}
          >
            Adminbereich
          </Link>
        ) : null}
      </div>
    </header>
  );
};

export default SiteHeader;
