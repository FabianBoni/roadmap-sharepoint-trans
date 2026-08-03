import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  FiArrowRight,
  FiCompass,
  FiExternalLink,
  FiGlobe,
  FiLayers,
  FiLock,
  FiMapPin,
  FiShield,
  FiStar,
} from 'react-icons/fi';
import prisma from '@/lib/prisma';
import JSDoITLoader from '@/components/JSDoITLoader';
import SiteHeader from '@/components/SiteHeader';
import {
  ADMIN_SESSION_CHANGED_EVENT,
  buildInstanceAwareUrl,
  getAdminSessionState,
} from '@/utils/auth';
import { extractAdminSessionFromHeaders } from '@/utils/apiAuth';
import {
  isReadSessionAllowedForInstance,
  resolveSessionDepartmentAcrossInstances,
} from '@/utils/instanceAccessServer';
import { isDbSuperAdminSession } from '@/utils/superAdminAccessServer';

const HTTP_URL_REGEX = /^https?:\/\//i;

type LandingInstance = {
  slug: string;
  displayName: string;
  department: string | null;
  description: string | null;
  sharePointUrl: string;
  strategy: string;
  hosts: string[];
  frontendTarget: string | null;
  landingPage: string | null;
};

type LandingPageProps = {
  instances: LandingInstance[];
};

type MetadataRecord = Record<string, unknown>;

const isRecord = (value: unknown): MetadataRecord | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as MetadataRecord;
  }
  return undefined;
};

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const firstStringFromArray = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    const candidate = toTrimmedString(entry);
    if (candidate) return candidate;
  }
  return null;
};

const parseMetadata = (settingsJson?: string | null): MetadataRecord | undefined => {
  if (!settingsJson) return undefined;
  try {
    const parsed = JSON.parse(settingsJson);
    const parsedRecord = isRecord(parsed);
    const metadataCandidate = parsedRecord?.metadata;
    return isRecord(metadataCandidate);
  } catch {
    return undefined;
  }
};

const joinNormalizedPaths = (basePath: string, extraPath?: string | null): string => {
  const baseSegments = String(basePath || '')
    .split('/')
    .filter(Boolean);
  const extraSegments = String(extraPath || '')
    .split('/')
    .filter(Boolean);

  if (!extraSegments.length) {
    return baseSegments.length ? `/${baseSegments.join('/')}` : '';
  }

  let overlap = 0;
  for (let size = Math.min(baseSegments.length, extraSegments.length); size > 0; size -= 1) {
    const baseTail = baseSegments.slice(-size).map((segment) => segment.toLowerCase());
    const extraHead = extraSegments.slice(0, size).map((segment) => segment.toLowerCase());
    if (baseTail.every((segment, index) => segment === extraHead[index])) {
      overlap = size;
      break;
    }
  }

  const joinedSegments = [...baseSegments, ...extraSegments.slice(overlap)];
  return joinedSegments.length ? `/${joinedSegments.join('/')}` : '';
};

const buildTargetFromHost = (hostValue: string | null, path?: string | null): string | null => {
  if (!hostValue) return null;
  const trimmed = hostValue.trim();
  if (!trimmed) return null;
  if (HTTP_URL_REGEX.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const joinedPath = joinNormalizedPaths(parsed.pathname, path);
      return `${parsed.origin}${joinedPath}${parsed.search}${parsed.hash}`;
    } catch {
      const sanitized = trimmed.replace(/\/+$/, '');
      return `${sanitized}${joinNormalizedPaths('', path)}`;
    }
  }
  if (trimmed.startsWith('//')) {
    try {
      const parsed = new URL(`https:${trimmed}`);
      const joinedPath = joinNormalizedPaths(parsed.pathname, path);
      return `//${parsed.host}${joinedPath}${parsed.search}${parsed.hash}`;
    } catch {
      const sanitized = trimmed.replace(/\/+$/, '');
      return `${sanitized}${joinNormalizedPaths('', path)}`;
    }
  }
  if (trimmed.startsWith('/')) {
    return joinNormalizedPaths(trimmed, path);
  }
  try {
    const parsed = new URL(`https://${trimmed}`);
    const joinedPath = joinNormalizedPaths(parsed.pathname, path);
    return `//${parsed.host}${joinedPath}${parsed.search}${parsed.hash}`;
  } catch {
    const sanitizedHost = trimmed.replace(/\/+$/, '');
    return `//${sanitizedHost}${joinNormalizedPaths('', path)}`;
  }
};

const resolveFrontendTarget = (settingsJson: string | null, hosts: string[]): string | null => {
  const metadata = parseMetadata(settingsJson);
  const frontendConfig = isRecord(metadata?.frontend);
  const directUrl = toTrimmedString(metadata?.frontendUrl) || toTrimmedString(frontendConfig?.url);
  if (directUrl) {
    return directUrl;
  }
  const hostCandidate =
    toTrimmedString(metadata?.frontendHost) ||
    firstStringFromArray(metadata?.frontendHosts) ||
    toTrimmedString(frontendConfig?.host) ||
    hosts[0] ||
    null;
  if (!hostCandidate) return null;
  const pathCandidate =
    toTrimmedString(metadata?.frontendPath) || toTrimmedString(frontendConfig?.path) || null;
  return buildTargetFromHost(hostCandidate, pathCandidate);
};

const highlightCards = [
  {
    title: 'Klarer Projektüberblick',
    icon: FiLayers,
    description:
      'Visualisiere Initiativen, Status und Verantwortliche in einer konsistenten Roadmap für alle Teams.',
  },
  {
    title: 'Vertrauenswürdige Datenquelle',
    icon: FiShield,
    description:
      'Die Roadmap synchronisiert sich direkt mit SharePoint. Berechtigungen und Rollen bleiben erhalten.',
  },
  {
    title: 'Gemeinsame Steuerung',
    icon: FiCompass,
    description:
      'Stakeholder, Projektleitungen und Management finden auf einen Blick Kennzahlen und nächste Schritte.',
  },
];

const InstancesPage = ({ instances }: LandingPageProps) => {
  const router = useRouter();
  const [selectingSlug, setSelectingSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleInstances, setVisibleInstances] = useState<LandingInstance[]>(instances);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [canManageInstances, setCanManageInstances] = useState(false);
  const [entraEnabled, setEntraEnabled] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('');
  const [sessionRevision, setSessionRevision] = useState(0);

  const defaultInstance = useMemo(() => visibleInstances[0], [visibleInstances]);
  const departmentCount = useMemo(
    () => new Set(visibleInstances.map((instance) => instance.department).filter(Boolean)).size,
    [visibleInstances]
  );
  const hostCount = useMemo(
    () => new Set(visibleInstances.flatMap((instance) => instance.hosts)).size,
    [visibleInstances]
  );

  const returnUrl = useMemo(() => {
    const raw = typeof router.asPath === 'string' ? router.asPath : '/instances';
    return raw.split('#')[0] || '/instances';
  }, [router.asPath]);

  const autoEntraSso =
    String(process.env.NEXT_PUBLIC_ENTRA_AUTO_LOGIN || '').toLowerCase() === 'true' ||
    String(router.query.autoSso || '') === '1';

  useEffect(() => {
    setVisibleInstances(instances);
  }, [instances]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSessionChanged = () => {
      setSessionRevision((prev) => prev + 1);
    };
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('focus', handleSessionChanged);
    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('focus', handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;

    const run = async () => {
      try {
        try {
          const resp = await fetch(buildInstanceAwareUrl('/api/auth/entra/status'));
          if (resp.ok) {
            const data = await resp.json();
            if (!cancelled) setEntraEnabled(Boolean(data.enabled));
          }
        } catch {
          // ignore
        }

        const sessionState = await getAdminSessionState();
        if (!cancelled) {
          setAuthed(Boolean(sessionState?.authenticated));
          setCanManageInstances(Boolean(sessionState?.isSuperAdmin));
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, sessionRevision]);

  useEffect(() => {
    if (!authChecked || !authed) return;
    let cancelled = false;

    const run = async () => {
      setInstancesLoading(true);
      try {
        const resp = await fetch(buildInstanceAwareUrl('/api/instances/slugs?details=landing'), {
          credentials: 'same-origin',
        });
        const payload = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(payload?.error || 'Instanzen konnten nicht geladen werden');
        }
        if (!cancelled) {
          setVisibleInstances(Array.isArray(payload?.instances) ? payload.instances : []);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Instanzen konnten nicht geladen werden';
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) setInstancesLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authChecked, authed, sessionRevision]);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof window === 'undefined') return;
    if (!authChecked) return;
    if (authed) return;
    if (!entraEnabled) return;
    if (!autoEntraSso) return;

    if (
      typeof router.query.error === 'string' ||
      typeof router.query.error_description === 'string'
    ) {
      return;
    }

    setAuthStatus('Weiterleitung zu Microsoft SSO ...');
    const loginUrl = buildInstanceAwareUrl(
      `/api/auth/entra/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    window.location.assign(loginUrl);
  }, [router.isReady, authChecked, authed, entraEnabled, autoEntraSso, returnUrl, router.query]);

  const startSso = () => {
    const loginUrl = buildInstanceAwareUrl(
      `/api/auth/entra/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    window.location.assign(loginUrl);
  };

  const buildClientRedirectUrl = (target?: string | null): string | null => {
    if (!target) return null;
    if (HTTP_URL_REGEX.test(target) || target.startsWith('/')) {
      return target;
    }
    if (target.startsWith('//')) {
      const protocol =
        typeof window !== 'undefined' && window.location?.protocol
          ? window.location.protocol
          : 'https:';
      return `${protocol}${target}`;
    }
    return `https://${target}`;
  };

  const appendInstanceQuery = (url: string, slug: string) => {
    if (!slug) return url;
    const [base, hash] = url.split('#');
    const separator = base.includes('?') ? '&' : '?';
    const withQuery = `${base}${separator}roadmapInstance=${encodeURIComponent(slug)}`;
    return hash ? `${withQuery}#${hash}` : withQuery;
  };

  const openInstance = async (instance?: LandingInstance) => {
    if (typeof window === 'undefined' || !instance?.slug) return;
    if (!authed) return;
    setSelectingSlug(instance.slug);
    setErrorMessage(null);
    try {
      document.cookie = `roadmap-instance=${encodeURIComponent(instance.slug)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;

      try {
        await fetch('/api/instances/select', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: instance.slug }),
        });
      } catch {
        // ignore and continue with client-side redirect + cookie fallback
      }

      const target = buildClientRedirectUrl(instance.frontendTarget) || '/roadmap';
      const redirectTarget = appendInstanceQuery(target, instance.slug);
      window.location.assign(redirectTarget);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setErrorMessage(message);
      setSelectingSlug(null);
    }
  };

  return (
    <>
      <Head>
        <title>JSDoIT Instanzübersicht</title>
      </Head>
      <div className="ds-page-shell before:[position:absolute] before:[inset:0] before:[z-index:0] before:[pointer-events:none] before:[background-image:linear-gradient(var(--ds-grid-line)_1px,_transparent_1px),_linear-gradient(90deg,_var(--ds-grid-line)_1px,_transparent_1px)] before:[background-size:56px_56px] before:[mask-image:linear-gradient(to_bottom,_black,_rgba(0,_0,_0,_0.72),_transparent_98%)] after:[position:absolute] after:[right:-10%] after:[bottom:-25%] after:[left:-10%] after:[z-index:0] after:[height:38vh] after:[pointer-events:none] after:[background:radial-gradient(ellipse_at_center,_var(--ds-hero-glow-a),_transparent_62%)] after:[filter:blur(12px)] [position:relative] [isolation:isolate] [display:flex] [min-height:100vh] [flex-direction:column] [overflow:hidden] [background:radial-gradient(circle_at_7%_18%,_var(--ds-hero-glow-a),_transparent_31%),_radial-gradient(circle_at_70%_8%,_var(--ds-hero-glow-b),_transparent_28%),_radial-gradient(circle_at_48%_86%,_var(--ds-hero-glow-c),_transparent_26%),_linear-gradient(135deg,_var(--ds-bg-page),_var(--ds-bg-page-2))] [color:var(--ds-text-default)] [font-family:var(--ds-font-sans)] [&>*]:[position:relative] [&>*]:[z-index:1]">
        <SiteHeader activeRoute="instances" />

        <main className="ds-page-main [flex:1]">
          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-hero [display:grid] [min-height:calc(100vh_-_78px)] [grid-template-columns:minmax(0,_1.08fr)_minmax(420px,_0.92fr)] [align-items:center] [gap:clamp(40px,_6vw,_86px)] [padding-block:clamp(56px,_7vw,_96px)] max-[1100px]:[grid-template-columns:1fr] max-[760px]:[padding-block:42px] ds-instance-hero [align-items:center]">
            <div className="ds-hero-content [max-width:760px]">
              <div className="ds-eyebrow [display:inline-flex] [width:fit-content] [align-items:center] [gap:10px] [padding:9px_15px] [border:1px_solid_var(--ds-border-strong)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.22em] [text-transform:uppercase] [&_svg]:[color:var(--ds-accent-strong)]">
                <FiStar className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                Instanzübersicht
              </div>

              <h1 className="ds-hero-title [max-width:760px] [margin:28px_0_22px] [color:var(--ds-text-strong)] [font-size:clamp(2.625rem,_5.8vw,_4.75rem)] [font-weight:860] [letter-spacing:-0.06em] [line-height:0.98] [text-wrap:balance]">
                Verbinde dich mit der passenden{' '}
                <span className="ds-accent-text bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [background-image:linear-gradient(_90deg,_var(--ds-text-strong),_var(--ds-accent-strong),_var(--ds-accent-2)_)]">
                  Roadmap-Instanz
                </span>
              </h1>
              <p className="ds-hero-copy [max-width:660px] [margin:0] [color:var(--ds-text-default)] [font-size:1.0625rem] [line-height:1.75]">
                Wähle deine Organisationseinheit, öffne die passende Roadmap und behalte
                gleichzeitig Zugriff, Herkunft und Betriebsmodell jeder Instanz im Blick.
              </p>

              <div className="ds-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)] [margin-top:30px] max-[760px]:[&_.ds-button]:[width:100%]">
                {authed ? (
                  <button
                    type="button"
                    onClick={() => openInstance(defaultInstance)}
                    disabled={!visibleInstances.length || selectingSlug !== null}
                    className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)]"
                  >
                    {!visibleInstances.length
                      ? 'Keine Instanzen vorhanden'
                      : selectingSlug
                        ? 'Weiterleitung wird vorbereitet ...'
                        : 'Roadmap starten'}
                    {visibleInstances.length ? (
                      <FiArrowRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                    ) : null}
                  </button>
                ) : entraEnabled ? (
                  <button
                    type="button"
                    onClick={startSso}
                    className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)]"
                  >
                    Anmelden
                  </button>
                ) : (
                  <span className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)] ds-button-disabled">
                    Microsoft SSO ist nicht konfiguriert
                  </span>
                )}
                <Link
                  href="/help"
                  className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)]"
                >
                  Hilfe entdecken
                </Link>
              </div>
            </div>

            <aside
              className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-logic-panel [padding:30px] [border-color:var(--ds-border-strong)] [border-radius:var(--ds-radius-xl)] [box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow),_inset_0_1px_0_rgba(255,_255,_255,_0.06)] max-[1100px]:[max-width:760px]"
              aria-label="Zugriff und Orientierung"
            >
              <div className="ds-panel-header [display:flex] [justify-content:space-between] [gap:var(--ds-space-5)] [margin-bottom:24px] max-[760px]:[flex-direction:column-reverse]">
                <div>
                  <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                    Zugriff & Orientierung
                  </p>
                  <h2 className="ds-panel-title [margin:0] [color:var(--ds-text-strong)] [font-size:clamp(1.5rem,_3vw,_2.125rem)] [letter-spacing:-0.04em] [line-height:1.15]">
                    Welche Instanzen du hier erwarten kannst
                  </h2>
                </div>
                <div
                  className="ds-panel-icon [display:grid] [flex:0_0_auto] [width:68px] [height:68px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:24px] [background:radial-gradient(circle,_var(--ds-accent-soft),_transparent_74%)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)]"
                  aria-hidden="true"
                >
                  <FiLock className="ds-icon-md [flex:0_0_auto] [width:1.5rem] [height:1.5rem]" />
                </div>
              </div>

              <div className="ds-info-list [display:grid] [gap:var(--ds-space-3)]">
                <p className="ds-info-item [margin:0] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_72%,_transparent)] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.6]">
                  Nur freigegebene Instanzen werden angezeigt. Rollen und Berechtigungen bleiben aus
                  SharePoint und Admin-Konfiguration ableitbar.
                </p>
                <p className="ds-info-item [margin:0] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_72%,_transparent)] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.6]">
                  Jede Karte zeigt Name, Bereich, SharePoint-Ziel und verfügbare Hosts, damit die
                  Auswahl nachvollziehbar bleibt.
                </p>
                <p className="ds-note [display:grid] [grid-template-columns:48px_1fr] [align-items:center] [gap:var(--ds-space-4)] [margin-top:18px] [padding:18px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(_135deg,_var(--ds-accent-soft),_color-mix(in_srgb,_var(--ds-bg-elevated)_86%,_transparent)_)] ds-info-note [grid-template-columns:1fr] [margin-top:0]">
                  Der Schnellstart oben öffnet direkt die erste verfügbare Instanz. Einzelne Karten
                  geben dir mehr Kontext vor dem Wechsel.
                </p>
              </div>
            </aside>
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
            <div className="ds-section-header [display:flex] [align-items:end] [justify-content:space-between] [gap:var(--ds-space-6)] [margin-bottom:24px]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Warum diese Übersicht hilft
                </p>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Orientierung für Teams und Stakeholder
                </h2>
              </div>
              <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                Die Roadmap vereint Status, Aufgaben und Ansprechpersonen. Die folgenden Highlights
                zeigen, wie du schnell ans Ziel kommst.
              </p>
            </div>
            <div className="ds-value-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:var(--ds-space-6)] [margin-top:48px] max-[1100px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[760px]:[grid-template-columns:1fr]">
              {highlightCards.map((card) => (
                <article
                  key={card.title}
                  className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-value-card [padding:24px] [transition:transform_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out)] hover:[border-color:var(--ds-border-strong)] hover:[box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow)] hover:[transform:translateY(-2px)]"
                >
                  <div className="ds-value-icon [display:grid] [width:48px] [height:48px] [place-items:center] [margin-bottom:22px] [border:1px_solid_var(--ds-border-default)] [border-radius:16px] [background:linear-gradient(135deg,_var(--ds-accent-soft),_var(--ds-bg-muted))] [color:var(--ds-accent-strong)]">
                    <card.icon className="ds-icon [flex:0_0_auto] [width:1.125rem] [height:1.125rem]" />
                  </div>
                  <h3 className="ds-value-title [margin:0] [color:var(--ds-text-strong)] [font-size:1.125rem] [font-weight:800]">
                    {card.title}
                  </h3>
                  <p className="ds-value-copy [margin:14px_0_0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.7]">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {!authChecked ? (
            <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
              <div className="ds-centered-state [display:flex] [justify-content:center] [padding-block:var(--ds-space-8)]">
                <JSDoITLoader sizeRem={2.2} message={authStatus || 'Anmeldung wird geprüft ...'} />
              </div>
            </section>
          ) : authed ? (
            <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
              <div className="ds-section-header [display:flex] [align-items:end] [justify-content:space-between] [gap:var(--ds-space-6)] [margin-bottom:24px]">
                <div>
                  <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                    Auswahlbereich
                  </p>
                  <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                    Aktive Instanzen
                  </h2>
                  <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                    {visibleInstances.length
                      ? 'Wähle eine Instanz, um dich mit der passenden Roadmap zu verbinden.'
                      : canManageInstances
                        ? 'Noch keine Instanzen angelegt. Lege die erste in der Instanzverwaltung an.'
                        : 'Für dein Konto ist aktuell keine Roadmap-Instanz freigegeben.'}
                  </p>
                </div>
                {canManageInstances ? (
                  <Link
                    href="/admin/instances"
                    className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)] ds-section-action [flex:0_0_auto]"
                  >
                    Instanzen verwalten
                    <FiExternalLink className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                  </Link>
                ) : null}
              </div>

              {errorMessage && (
                <div className="ds-message [margin-bottom:var(--ds-space-6)] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-elevated)] [color:var(--ds-text-default)] [font-size:0.875rem] ds-message-danger [border-color:color-mix(in_srgb,_var(--ds-danger)_38%,_transparent)] [background:color-mix(in_srgb,_var(--ds-danger)_12%,_transparent)] [color:var(--ds-danger)]">
                  {errorMessage}
                </div>
              )}

              <div className="ds-instance-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:var(--ds-space-6)] max-[1100px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[760px]:[grid-template-columns:1fr]">
                {visibleInstances.map((instance, index) => (
                  <article
                    key={instance.slug}
                    className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-instance-card [display:grid] [gap:var(--ds-space-5)] [padding:24px] [border-radius:var(--ds-radius-xl)] [transition:transform_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out)] hover:[border-color:var(--ds-border-strong)] hover:[box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow)] hover:[transform:translateY(-2px)]"
                  >
                    <div className="ds-instance-card-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:var(--ds-space-4)] max-[760px]:[flex-direction:column]">
                      <div>
                        <p className="ds-kicker [margin:0_0_9px] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.18em] [text-transform:uppercase]">
                          Instanz {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="ds-instance-title [margin:0] [color:var(--ds-text-strong)] [font-size:1.25rem] [font-weight:850]">
                          {instance.displayName}
                        </h3>
                        {instance.department && (
                          <p className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750] ds-instance-department [margin-top:10px]">
                            <FiMapPin className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                            {instance.department}
                          </p>
                        )}
                      </div>
                      <span className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750]">
                        {instance.strategy}
                      </span>
                    </div>

                    {instance.description && (
                      <p className="ds-instance-description [margin:0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.7]">
                        {instance.description}
                      </p>
                    )}

                    <dl className="ds-instance-details [display:grid] [gap:var(--ds-space-3)] [margin:0]">
                      <div className="ds-instance-detail [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_74%,_transparent)]">
                        <div className="ds-instance-detail-label [display:flex] [align-items:center] [gap:var(--ds-space-2)] [color:var(--ds-text-strong)] [font-size:0.875rem] [font-weight:800] [&_svg]:[color:var(--ds-accent-strong)]">
                          <FiGlobe className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                          <span>SharePoint</span>
                        </div>
                        <dd className="ds-instance-detail-value [display:block] [margin:10px_0_0] [overflow:hidden] [color:var(--ds-text-muted)] [font-size:0.875rem] [text-overflow:ellipsis] [white-space:nowrap]">
                          {instance.sharePointUrl}
                        </dd>
                      </div>
                      {instance.hosts.length > 0 && (
                        <div className="ds-instance-detail [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_74%,_transparent)]">
                          <div className="ds-instance-detail-label [display:flex] [align-items:center] [gap:var(--ds-space-2)] [color:var(--ds-text-strong)] [font-size:0.875rem] [font-weight:800] [&_svg]:[color:var(--ds-accent-strong)]">
                            <FiExternalLink className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                            <span>Hosts</span>
                          </div>
                          <dd className="ds-instance-detail-value [display:block] [margin:10px_0_0] [overflow:hidden] [color:var(--ds-text-muted)] [font-size:0.875rem] [text-overflow:ellipsis] [white-space:nowrap]">
                            {instance.hosts.join(', ')}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="ds-instance-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-3)]">
                      <button
                        type="button"
                        onClick={() => openInstance(instance)}
                        disabled={selectingSlug === instance.slug}
                        className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] ds-instance-open [flex:1_1_220px]"
                      >
                        {selectingSlug === instance.slug ? 'Öffne Roadmap ...' : 'Roadmap öffnen'}
                        <FiArrowRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                      </button>
                      <div className="ds-instance-slug [padding:14px_16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-soft)] [color:var(--ds-text-muted)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.08em] [text-transform:uppercase]">
                        {instance.slug}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!visibleInstances.length && !instancesLoading && (
                <div className="ds-empty-state [margin-top:48px] [padding:32px] [border:1px_dashed_var(--ds-border-default)] [border-radius:var(--ds-radius-xl)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_72%,_transparent)] [color:var(--ds-text-default)] [text-align:center]">
                  <p className="ds-empty-title [margin:0] [color:var(--ds-text-strong)] [font-size:1.125rem] [font-weight:800]">
                    {canManageInstances
                      ? 'Noch keine Instanzen vorhanden'
                      : 'Keine freigegebenen Instanzen'}
                  </p>
                  <p className="ds-empty-copy [max-width:680px] [margin:10px_auto_0] [color:var(--ds-text-muted)] [font-size:0.875rem] [line-height:1.6]">
                    {canManageInstances
                      ? 'Erstelle in der Instanzverwaltung eine neue Roadmap-Instanz und verknüpfe den passenden SharePoint-Endpunkt.'
                      : 'Dir ist aktuell keine Roadmap-Instanz über die explizit freigegebenen Abteilungen zugeordnet.'}
                  </p>
                </div>
              )}

              {!visibleInstances.length && instancesLoading && (
                <div className="ds-centered-state [display:flex] [justify-content:center] [padding-block:var(--ds-space-8)]">
                  <JSDoITLoader sizeRem={2} message="Instanzen werden geladen ..." />
                </div>
              )}
            </section>
          ) : (
            <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
              <div className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-auth-panel [display:grid] [gap:var(--ds-space-4)] [padding:32px] [border-radius:var(--ds-radius-xl)]">
                <div>
                  <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                    Anmeldung erforderlich
                  </p>
                  <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                    Instanzzugriff freischalten
                  </h2>
                </div>
                <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                  Die Instanzübersicht ist erst nach Anmeldung sichtbar.
                </p>
                <div className="ds-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)] [margin-top:30px] max-[760px]:[&_.ds-button]:[width:100%]">
                  {entraEnabled ? (
                    <button
                      type="button"
                      onClick={startSso}
                      className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)]"
                    >
                      Anmelden
                    </button>
                  ) : (
                    <span className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)] ds-button-disabled">
                      Microsoft SSO ist nicht konfiguriert
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="ds-footer [border-top:1px_solid_var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-page)_82%,_transparent)] [backdrop-filter:blur(18px)]">
          <div className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-footer-inner [display:flex] [align-items:center] [justify-content:space-between] [gap:var(--ds-space-4)] [padding-block:24px] [color:var(--ds-text-muted)] [font-size:0.875rem] max-[760px]:[align-items:flex-start] max-[760px]:[flex-direction:column]">
            <span>JSDoIT Roadmap Center</span>
            <div className="ds-footer-links [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)]">
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/landing"
              >
                Start
              </Link>
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/help"
              >
                Hilfe
              </Link>
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/feedback"
              >
                Feedback
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<LandingPageProps> = async (ctx) => {
  const session = await extractAdminSessionFromHeaders({
    authorization: ctx.req.headers.authorization,
    cookie: ctx.req.headers.cookie,
  });
  const forwardedHeaders = {
    authorization:
      typeof ctx.req.headers.authorization === 'string' ? ctx.req.headers.authorization : undefined,
    cookie: typeof ctx.req.headers.cookie === 'string' ? ctx.req.headers.cookie : undefined,
  };

  const records = await prisma.roadmapInstance.findMany({
    include: { hosts: true },
    orderBy: { displayName: 'asc' },
  });

  if (!session) {
    return {
      props: { instances: [] },
    };
  }

  if (await isDbSuperAdminSession(session)) {
    const instances: LandingInstance[] = records.map((record) => {
      const hosts = record.hosts.map((host) => host.host);
      return {
        slug: record.slug,
        displayName: record.displayName,
        department: record.department ?? null,
        description: record.description ?? null,
        sharePointUrl: (record.sharePointSiteUrlProd || record.sharePointSiteUrlDev).replace(
          /\/$/,
          ''
        ),
        strategy: record.sharePointStrategy || 'kerberos',
        hosts,
        frontendTarget: resolveFrontendTarget(record.settingsJson ?? null, hosts),
        landingPage: record.landingPage ?? null,
      };
    });

    return {
      props: { instances },
    };
  }

  const resolvedDepartment = await resolveSessionDepartmentAcrossInstances({
    session,
    instanceSlugs: records.map((record) => record.slug),
    requestHeaders: forwardedHeaders,
  });

  const checks = await Promise.all(
    records.map(async (r) => {
      try {
        const allowed = await isReadSessionAllowedForInstance({
          session,
          instance: { slug: r.slug },
          requestHeaders: forwardedHeaders,
          knownSuperAdmin: false,
          resolvedDepartment,
          allowSharePointFallback: false,
        });
        return { record: r, allowed };
      } catch {
        return { record: r, allowed: false };
      }
    })
  );

  const filtered = checks.filter((c) => c.allowed).map((c) => c.record);

  const instances: LandingInstance[] = filtered.map((record) => {
    const hosts = record.hosts.map((host) => host.host);
    return {
      slug: record.slug,
      displayName: record.displayName,
      department: record.department ?? null,
      description: record.description ?? null,
      sharePointUrl: (record.sharePointSiteUrlProd || record.sharePointSiteUrlDev).replace(
        /\/$/,
        ''
      ),
      strategy: record.sharePointStrategy || 'kerberos',
      hosts,
      frontendTarget: resolveFrontendTarget(record.settingsJson ?? null, hosts),
      landingPage: record.landingPage ?? null,
    };
  });

  return {
    props: { instances },
  };
};

export default InstancesPage;
