import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { performance } from 'node:perf_hooks';
import Roadmap from '../components/Roadmap';
import SiteHeader from '@/components/SiteHeader';
import { extractAdminSessionFromHeaders } from '@/utils/apiAuth';
import {
  isAdminSessionAllowedForInstance,
  isReadSessionAllowedForInstance,
} from '@/utils/instanceAccessServer';
import { INSTANCE_QUERY_PARAM, setInstanceCookieHeader } from '@/utils/instanceConfig';
import { buildInstanceAwareUrl } from '@/utils/auth';
import {
  resolveFirstAllowedInstanceForAdminSession,
  resolveInstanceForAdminSession,
} from '@/utils/instanceSelection';
import { getRoadmapDataSnapshot } from '@/utils/roadmapData';
import { DEFAULT_THEME, type ThemeSettings } from '@/utils/theme';
import type { Category, Project, ProjectOrderByCategory } from '../types';

const INSTANCE_CONTEXT_CHANGED_EVENT = 'roadmap-instance-changed';

type RoadmapPageProps = {
  projects: Project[];
  categories: Category[];
  projectOrderByCategory: ProjectOrderByCategory;
  theme: ThemeSettings;
  isAdmin: boolean;
  resolvedInstanceSlug: string;
  accessDenied?: boolean;
};

const RoadmapPage: React.FC<RoadmapPageProps> = ({
  projects,
  categories,
  projectOrderByCategory,
  theme,
  isAdmin,
  resolvedInstanceSlug,
  accessDenied,
}) => {
  const router = useRouter();
  const fetchRequestIdRef = useRef(0);
  const currentInstanceSlug = useMemo(() => {
    const raw = router.query?.[INSTANCE_QUERY_PARAM];
    if (!router.isReady) return resolvedInstanceSlug;
    if (Array.isArray(raw)) return raw[0] ?? '';
    if (typeof raw === 'string' && raw) return raw;
    if (resolvedInstanceSlug) return resolvedInstanceSlug;
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)roadmap-instance=([^;\\s]+)`, 'i')
      );
      if (match?.[1]) {
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return match[1];
        }
      }
    }
    return '';
  }, [resolvedInstanceSlug, router.isReady, router.query]);

  const [projectsState, setProjectsState] = useState<Project[]>(projects);
  const [categoriesState, setCategoriesState] = useState<Category[]>(categories);
  const [projectOrderByCategoryState, setProjectOrderByCategoryState] =
    useState<ProjectOrderByCategory>(projectOrderByCategory);
  const [themeState, setThemeState] = useState(theme);
  const [isAdminState, setIsAdminState] = useState(isAdmin);
  const [accessDeniedState, setAccessDeniedState] = useState(Boolean(accessDenied));
  const [activeInstanceSlug, setActiveInstanceSlug] = useState(resolvedInstanceSlug);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProjectsState(projects);
    setCategoriesState(categories);
    setProjectOrderByCategoryState(projectOrderByCategory);
    setThemeState(theme);
    setIsAdminState(isAdmin);
    setAccessDeniedState(Boolean(accessDenied));
    setActiveInstanceSlug(resolvedInstanceSlug);
    setLoading(false);
  }, [
    accessDenied,
    categories,
    isAdmin,
    projectOrderByCategory,
    projects,
    resolvedInstanceSlug,
    theme,
  ]);

  useEffect(() => {
    if (!currentInstanceSlug || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    try {
      const desired = encodeURIComponent(currentInstanceSlug);
      const cookies = document.cookie || '';
      const match = cookies.match(new RegExp('(?:^|;\\s*)roadmap-instance=([^;\\s]+)', 'i'));
      const current = match?.[1] ?? '';
      if (current !== desired) {
        document.cookie = `roadmap-instance=${desired}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
        window.dispatchEvent(new Event(INSTANCE_CONTEXT_CHANGED_EVENT));
      }
    } catch {
      // ignore cookie sync issues and keep page functional
    }
  }, [currentInstanceSlug]);

  useEffect(() => {
    if (!router.isReady) return;
    if (currentInstanceSlug === activeInstanceSlug) return;

    const requestId = ++fetchRequestIdRef.current;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);

      const roadmapDataUrl = buildInstanceAwareUrl(
        currentInstanceSlug
          ? `/api/roadmap-data?${INSTANCE_QUERY_PARAM}=${encodeURIComponent(currentInstanceSlug)}`
          : '/api/roadmap-data'
      );

      try {
        const response = await fetch(roadmapDataUrl, {
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (response.status === 401) {
          if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return;
          const returnUrl = typeof router.asPath === 'string' ? router.asPath : '/roadmap';
          void router.push(`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }

        if (response.status === 403) {
          if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return;
          setProjectsState([]);
          setCategoriesState([]);
          setProjectOrderByCategoryState({});
          setAccessDeniedState(true);
          setActiveInstanceSlug(currentInstanceSlug);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(
            errorPayload?.error || `Failed to fetch roadmap data (${response.status})`
          );
        }

        const payload = await response.json();

        if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return;

        setProjectsState(Array.isArray(payload.projects) ? payload.projects : []);
        setCategoriesState(Array.isArray(payload.categories) ? payload.categories : []);
        setProjectOrderByCategoryState(payload.projectOrderByCategory || {});
        setThemeState(payload.theme || DEFAULT_THEME);
        setIsAdminState(Boolean(payload.access?.isAdmin));
        setAccessDeniedState(false);
        setActiveInstanceSlug(currentInstanceSlug);
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return;
        console.error('[roadmap] client recovery fetch failed', error);
      } finally {
        if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return;
        setLoading(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [activeInstanceSlug, currentInstanceSlug, router, router.isReady]);

  return (
    <>
      <Head>
        <title>Roadmap | JSDoIT Roadmap</title>
      </Head>
      <div className="ds-page-shell">
        <SiteHeader activeRoute="roadmap" authenticated initialIsAdmin={isAdminState} />

        <main className="ds-page-main ds-roadmap-page-main">
          {loading ? (
            <div className="ds-container ds-roadmap-state">
              <div className="ds-card ds-roadmap-state-card">
                <h1>Lade Roadmap ...</h1>
                <p>Projekte werden für die ausgewählte Instanz geladen.</p>
              </div>
            </div>
          ) : accessDeniedState ? (
            <div className="ds-container ds-roadmap-state">
              <div className="ds-card ds-roadmap-state-card is-warning">
                <h1>Kein Zugriff</h1>
                <p>
                  Du hast keinen Zugriff auf diese Roadmap-Instanz. Sichtbarkeit wird pro Instanz
                  anhand deiner Abteilung oder expliziter Admin-Berechtigungen gesteuert.
                </p>
              </div>
            </div>
          ) : (
            <Roadmap
              key={activeInstanceSlug || resolvedInstanceSlug || 'default'}
              initialProjects={projectsState}
              initialCategories={categoriesState}
              initialProjectOrderByCategory={projectOrderByCategoryState}
              initialTheme={themeState}
              initialIsAdmin={isAdminState}
            />
          )}
        </main>

        <footer className="ds-footer">
          <div className="ds-container ds-footer-inner">
            <span>JSDoIT Roadmap Center</span>
            <div className="ds-footer-links">
              <Link className="ds-footer-link" href="/instances">
                Instanzen
              </Link>
              <Link className="ds-footer-link" href="/help">
                Hilfe
              </Link>
              <Link className="ds-footer-link" href="/feedback">
                Feedback
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RoadmapPage;

export const getServerSideProps: GetServerSideProps<RoadmapPageProps> = async (ctx) => {
  const startedAt = performance.now();
  const timingMarks: string[] = [];
  const markTiming = (name: string, since: number) => {
    timingMarks.push(`${name};dur=${Math.max(0, performance.now() - since).toFixed(1)}`);
    ctx.res?.setHeader('Server-Timing', timingMarks.join(', '));
  };

  try {
    if (ctx.res) {
      ctx.res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      ctx.res.setHeader('Pragma', 'no-cache');
      ctx.res.setHeader('Expires', '0');
      ctx.res.setHeader('Surrogate-Control', 'no-store');
      const existingVary = ctx.res.getHeader('Vary');
      const varyValues = new Set(
        String(existingVary || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      );
      varyValues.add('Cookie');
      varyValues.add('Authorization');
      ctx.res.setHeader('Vary', Array.from(varyValues).join(', '));
    }

    const session = await extractAdminSessionFromHeaders({
      authorization: ctx.req.headers.authorization,
      cookie: ctx.req.headers.cookie,
    });
    const forwardedHeaders = {
      authorization:
        typeof ctx.req.headers.authorization === 'string'
          ? ctx.req.headers.authorization
          : undefined,
      cookie: typeof ctx.req.headers.cookie === 'string' ? ctx.req.headers.cookie : undefined,
    };
    if (!session) {
      const returnUrl = typeof ctx.resolvedUrl === 'string' ? ctx.resolvedUrl : '/roadmap';
      return {
        redirect: {
          destination: `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`,
          permanent: false,
        },
      };
    }

    const instance = await resolveInstanceForAdminSession(ctx.req, session);
    if (!instance) {
      return {
        redirect: { destination: '/', permanent: false },
      };
    }

    // Persist cookie early so subsequent reloads keep the same instance
    if (ctx.res) {
      ctx.res.setHeader('Set-Cookie', setInstanceCookieHeader(instance.slug));
    }

    const accessStartedAt = performance.now();
    const canRead = await isReadSessionAllowedForInstance({
      session,
      instance,
      requestHeaders: forwardedHeaders,
    });
    markTiming('access', accessStartedAt);
    if (!canRead) {
      const fallback = await resolveFirstAllowedInstanceForAdminSession(session, ctx.req);
      if (fallback && fallback.slug && fallback.slug !== instance.slug) {
        if (ctx.res) {
          ctx.res.setHeader('Set-Cookie', setInstanceCookieHeader(fallback.slug));
        }
        return {
          redirect: {
            destination: `/roadmap?${INSTANCE_QUERY_PARAM}=${encodeURIComponent(fallback.slug)}`,
            permanent: false,
          },
        };
      }
      return {
        props: {
          projects: [],
          categories: [],
          projectOrderByCategory: {},
          theme: DEFAULT_THEME,
          isAdmin: false,
          resolvedInstanceSlug: instance.slug,
          accessDenied: true,
        },
      };
    }

    const dataStartedAt = performance.now();
    const [{ snapshot, cacheStatus }, isAdmin] = await Promise.all([
      getRoadmapDataSnapshot({ instance, forwardedHeaders }),
      isAdminSessionAllowedForInstance({ session, instance, requestHeaders: forwardedHeaders }),
    ]);
    markTiming('roadmap-data', dataStartedAt);
    markTiming('total', startedAt);
    ctx.res?.setHeader('X-Roadmap-Data-Cache', cacheStatus);

    return {
      props: {
        projects: snapshot.projects,
        categories: snapshot.categories,
        projectOrderByCategory: snapshot.projectOrderByCategory,
        theme: snapshot.theme,
        isAdmin,
        resolvedInstanceSlug: instance.slug,
      },
    };
  } catch (error) {
    console.error('[roadmap] getServerSideProps failed', error);
    return {
      props: {
        projects: [],
        categories: [],
        projectOrderByCategory: {},
        theme: DEFAULT_THEME,
        isAdmin: false,
        resolvedInstanceSlug: '',
        accessDenied: false,
      },
    };
  }
};
