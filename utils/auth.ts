/**
 * Admin authentication utilities for roadmap application
 * The signed JWT lives only in the server-issued HttpOnly cookie. sessionStorage contains at most
 * non-sensitive display metadata such as the current username.
 */

const USERNAME_KEY = 'adminUsername';
const INSTANCE_COOKIE_KEY = 'roadmap-instance';
export const ADMIN_SESSION_CHANGED_EVENT = 'roadmap-admin-session-changed';

type AdminSessionState = {
  authenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  username?: string;
  department?: string | null;
  groups: string[];
};

const ADMIN_SESSION_STATE_TTL_MS = 30_000;
const INSTANCE_ADMIN_ACCESS_TTL_MS = 30_000;

let adminSessionStateCache: {
  token: string;
  expiresAt: number;
  value: AdminSessionState | null;
} | null = null;
let adminSessionStateInFlight: {
  token: string;
  promise: Promise<AdminSessionState | null>;
} | null = null;
const instanceAdminAccessCache = new Map<string, { expiresAt: number; allowed: boolean }>();
const instanceAdminAccessInFlight = new Map<string, Promise<boolean>>();

function clearAdminSessionStateCache() {
  adminSessionStateCache = null;
  adminSessionStateInFlight = null;
  instanceAdminAccessCache.clear();
  instanceAdminAccessInFlight.clear();
}

function dispatchAdminSessionChanged() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

// Lightweight debug switch for verbose console logs around auth/admin flows
function debugAuthEnabled(): boolean {
  try {
    if (
      typeof process !== 'undefined' &&
      process.env &&
      process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'
    )
      return true;
    if (typeof window !== 'undefined') {
      if (/([?&])debug=auth(?![\w-])/i.test(window.location.search)) return true;
      const ls = window.localStorage?.getItem('debugAuth');
      if (ls && ls !== '0' && ls.toLowerCase() !== 'false') return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function log(...args: unknown[]) {
  if (debugAuthEnabled()) {
    // eslint-disable-next-line no-console
    console.log('[admin-auth]', ...args);
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  clearAdminSessionStateCache();
  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.removeItem(USERNAME_KEY);
    } catch {
      // ignore
    }
  }
  dispatchAdminSessionChanged();
}

function setStoredSession(username: string) {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(USERNAME_KEY, username);
  } catch (error) {
    log('setStoredSession failed', error);
  }
}

export function persistAdminSession(_token: string | null | undefined, username: string) {
  clearAdminSessionStateCache();
  setStoredSession(username);
  dispatchAdminSessionChanged();
}

function getBrowserInstanceSlug(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('roadmapInstance');
    if (fromQuery) return fromQuery.trim().toLowerCase();
    const cookies = document.cookie.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.toLowerCase().startsWith(`${INSTANCE_COOKIE_KEY}=`)) {
        return decodeURIComponent(cookie.substring(INSTANCE_COOKIE_KEY.length + 1)).trim();
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getCurrentBrowserInstanceSlug(): string | null {
  return getBrowserInstanceSlug();
}

/**
 * For JWT-based admin sessions, enforce per-instance allowlists.
 * Returns false only for explicit 403 (Forbidden). Other failures are treated as "don't block".
 */
export async function hasAdminAccessToCurrentInstance(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return true;

    const slug = getBrowserInstanceSlug();
    if (!slug) return true;

    const cached = instanceAdminAccessCache.get(slug);
    if (cached && cached.expiresAt > Date.now()) return cached.allowed;
    if (cached) instanceAdminAccessCache.delete(slug);

    const existing = instanceAdminAccessInFlight.get(slug);
    if (existing) return existing;

    const request = fetch(
      buildInstanceAwareUrl(`/api/instances/select?slug=${encodeURIComponent(slug)}&mode=admin`),
      { credentials: 'same-origin' }
    )
      .then((resp) => resp.status !== 403 && resp.ok)
      .then((allowed) => {
        instanceAdminAccessCache.set(slug, {
          allowed,
          expiresAt: Date.now() + INSTANCE_ADMIN_ACCESS_TTL_MS,
        });
        return allowed;
      });
    instanceAdminAccessInFlight.set(slug, request);
    try {
      return await request;
    } finally {
      if (instanceAdminAccessInFlight.get(slug) === request) {
        instanceAdminAccessInFlight.delete(slug);
      }
    }
  } catch {
    return true;
  }
}

export function buildInstanceAwareUrl(path: string): string {
  // When Next.js basePath is configured (reverse proxy subdir), API routes live under it.
  const basePath = (() => {
    try {
      const deploymentEnv =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || process.env.NODE_ENV || 'development';
      const rawBasePath =
        deploymentEnv === 'production'
          ? process.env.NEXT_PUBLIC_BASE_PATH_PROD || ''
          : process.env.NEXT_PUBLIC_BASE_PATH_DEV || '';
      const trimmed = String(rawBasePath || '').trim();
      if (!trimmed || trimmed === '/') return '';
      const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return withLeading.replace(/\/+$/, '');
    } catch {
      return '';
    }
  })();

  const shouldPrefixBasePath = path.startsWith('/api/');
  const withBasePath =
    shouldPrefixBasePath &&
    basePath &&
    path.startsWith('/') &&
    !path.startsWith(basePath + '/') &&
    path !== basePath
      ? `${basePath}${path}`
      : path;

  const slug = getBrowserInstanceSlug();
  if (!slug) return withBasePath;

  const hashIndex = withBasePath.indexOf('#');
  const base = hashIndex >= 0 ? withBasePath.slice(0, hashIndex) : withBasePath;
  const hash = hashIndex >= 0 ? withBasePath.slice(hashIndex) : '';

  if (/(^|[?&])roadmapInstance=/.test(base)) {
    return withBasePath;
  }

  const hasQuery = base.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${base}${separator}roadmapInstance=${encodeURIComponent(slug)}${hash}`;
}

function normalizeAdminSessionState(raw: unknown): AdminSessionState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const groups = Array.isArray(record.groups)
    ? record.groups.filter((group): group is string => typeof group === 'string')
    : [];

  return {
    authenticated:
      typeof record.authenticated === 'boolean' ? record.authenticated : Boolean(record),
    isAdmin: Boolean(record.isAdmin),
    isSuperAdmin: Boolean(record.isSuperAdmin),
    username: typeof record.username === 'string' ? record.username : undefined,
    department:
      typeof record.department === 'string'
        ? record.department
        : record.department === null
          ? null
          : undefined,
    groups,
  };
}

export async function getAdminSessionState(
  forceRefresh = false
): Promise<AdminSessionState | null> {
  try {
    if (typeof window === 'undefined') return null;

    const token = 'http-only-cookie-session';

    if (!forceRefresh && adminSessionStateCache) {
      if (adminSessionStateCache.token === token && adminSessionStateCache.expiresAt > Date.now()) {
        return adminSessionStateCache.value;
      }
      adminSessionStateCache = null;
    }

    if (adminSessionStateInFlight?.token === token) {
      return adminSessionStateInFlight.promise;
    }

    const request = (async () => {
      const response = await fetch(buildInstanceAwareUrl('/api/auth/check-admin-session'), {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        clearStoredSession();
        return null;
      }

      const state = normalizeAdminSessionState(await response.json().catch(() => null));
      if (!state?.authenticated) {
        clearStoredSession();
        return null;
      }

      adminSessionStateCache = {
        token,
        value: state,
        expiresAt: Date.now() + ADMIN_SESSION_STATE_TTL_MS,
      };

      return state;
    })();

    adminSessionStateInFlight = { token, promise: request };

    try {
      return await request;
    } finally {
      if (adminSessionStateInFlight?.promise === request) {
        adminSessionStateInFlight = null;
      }
    }
  } catch {
    return null;
  }
}

export async function hasValidUserSession(): Promise<boolean> {
  const state = await getAdminSessionState();
  return Boolean(state?.authenticated);
}

/**
 * Strict session check: returns true ONLY when a JWT admin session token exists and is valid.
 * Does not fall back to the SharePoint service-account permission check.
 */
export async function hasValidAdminSession(): Promise<boolean> {
  const state = await getAdminSessionState();
  return Boolean(state?.isAdmin);
}

export async function hasValidSuperAdminSession(): Promise<boolean> {
  const state = await getAdminSessionState();
  return Boolean(state?.isSuperAdmin);
}

// Check if the current browser session has admin access
export async function hasAdminAccess(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    log('hasAdminAccess: verifying cookie session');
    try {
      const response = await fetch(buildInstanceAwareUrl('/api/auth/check-admin-session'), {
        credentials: 'same-origin',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.isAdmin) {
          log('hasAdminAccess: session valid');
          return true;
        }
      }
      log('hasAdminAccess: session invalid, clearing local metadata');
      clearStoredSession();
    } catch (error) {
      log('hasAdminAccess: error verifying session', error);
    }

    return false;
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

/**
 * Logout (no-op for service account based auth)
 * Kept for backwards compatibility
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    log('logout: clearing stored session');
    clearStoredSession();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = buildInstanceAwareUrl('/api/auth/entra/logout');
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();
  }
}

/**
 * Get current admin username (returns service account info)
 */
export function getAdminUsername(): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    return storage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}
