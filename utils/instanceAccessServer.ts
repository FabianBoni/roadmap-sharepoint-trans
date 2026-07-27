import { createHash } from 'node:crypto';
import type { AdminSessionPayload } from '@/utils/apiAuth';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { clientDataService } from '@/utils/clientDataService';
import { getInstanceConfigBySlug } from '@/utils/instanceConfig';
import {
  isAdminPrincipalAllowedForInstance,
  isAdminUserAllowedForInstance,
} from '@/utils/instanceAccess';
import {
  isAnyDepartmentCandidateAllowedForInstance,
  normalizeDepartment,
} from '@/utils/instanceDepartmentAccess';
import {
  isDbSuperAdminSession,
  isSuperAdminSessionWithSharePointFallback,
} from '@/utils/superAdminAccessServer';

type Principal = { username: string | null; groups?: unknown };
type ForwardedRequestHeaders = { authorization?: string; cookie?: string };
type InstanceAccessHints = {
  knownSuperAdmin?: boolean;
  resolvedDepartment?: string | null;
  allowSharePointFallback?: boolean;
};

type InstanceAccessMode = 'read' | 'admin';

type AccessDecisionCacheEntry = { expiresAt: number; allowed: boolean };
const accessDecisionCache = new Map<string, AccessDecisionCacheEntry>();
const accessDecisionInFlight = new Map<string, Promise<boolean>>();
const ACCESS_DECISION_CACHE_MAX_ENTRIES = 5_000;
const ACCESS_DECISION_TTL_MS = Math.max(
  5_000,
  Number.parseInt(process.env.ROADMAP_ACCESS_CACHE_TTL_MS || '60000', 10) || 60_000
);
const ACCESS_DENIAL_TTL_MS = Math.min(
  ACCESS_DECISION_TTL_MS,
  Math.max(
    1_000,
    Number.parseInt(process.env.ROADMAP_ACCESS_DENIED_CACHE_TTL_MS || '15000', 10) || 15_000
  )
);

const buildAccessDecisionKey = (opts: {
  session: AdminSessionPayload;
  instanceSlug: string;
  mode: InstanceAccessMode;
  knownSuperAdmin?: boolean;
  resolvedDepartment?: string | null;
  allowSharePointFallback?: boolean;
}) => {
  const sessionKey =
    typeof opts.session.jti === 'string'
      ? opts.session.jti
      : JSON.stringify({
          username: opts.session.username,
          entra: opts.session.entra,
          groups: opts.session.groups,
        });
  return createHash('sha256')
    .update(
      JSON.stringify({
        sessionKey,
        instanceSlug: opts.instanceSlug,
        mode: opts.mode,
        knownSuperAdmin: opts.knownSuperAdmin,
        resolvedDepartment: opts.resolvedDepartment,
        allowSharePointFallback: opts.allowSharePointFallback,
      })
    )
    .digest('base64url');
};

export function clearInstanceAccessDecisionCache(instanceSlug?: string): void {
  // Cache keys are intentionally opaque. Per-instance invalidation is uncommon,
  // so a bounded full clear is safer than retaining a second key index.
  void instanceSlug;
  accessDecisionCache.clear();
  accessDecisionInFlight.clear();
}

const pruneAccessDecisionCache = (now: number): void => {
  for (const [key, entry] of accessDecisionCache) {
    if (entry.expiresAt <= now) accessDecisionCache.delete(key);
  }
  while (accessDecisionCache.size >= ACCESS_DECISION_CACHE_MAX_ENTRIES) {
    const oldestKey = accessDecisionCache.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    accessDecisionCache.delete(oldestKey);
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const extractIdentifiers = (session: AdminSessionPayload | null | undefined) => {
  const username = typeof session?.username === 'string' ? session.username : null;
  const sessionRecord = asRecord(session);
  const entra = asRecord(session?.entra);
  const objectId = entra && typeof entra.id === 'string' ? entra.id : null;
  const tenantId = entra && typeof entra.tenantId === 'string' ? entra.tenantId : null;
  const upn = entra && typeof entra.upn === 'string' ? entra.upn : null;
  const mail = entra && typeof entra.mail === 'string' ? entra.mail : null;
  const onPremisesUserPrincipalName =
    entra && typeof entra.onPremisesUserPrincipalName === 'string'
      ? entra.onPremisesUserPrincipalName
      : null;
  const onPremisesSamAccountName =
    entra && typeof entra.onPremisesSamAccountName === 'string'
      ? entra.onPremisesSamAccountName
      : null;
  const onPremisesDomainName =
    entra && typeof entra.onPremisesDomainName === 'string' ? entra.onPremisesDomainName : null;
  const onPremisesAccountName =
    onPremisesDomainName && onPremisesSamAccountName
      ? `${onPremisesDomainName}\\${onPremisesSamAccountName}`
      : null;
  const department =
    (entra && typeof entra.department === 'string' ? entra.department : null) ||
    (sessionRecord && typeof sessionRecord.department === 'string'
      ? sessionRecord.department
      : null);
  const groups = Array.isArray(session?.groups)
    ? session.groups.filter((g): g is string => typeof g === 'string')
    : [];
  return {
    username,
    objectId,
    tenantId,
    upn,
    mail,
    onPremisesUserPrincipalName,
    onPremisesAccountName,
    department,
    groups,
  };
};

async function resolveDepartmentForIdentifiers(opts: {
  identifiers: ReturnType<typeof extractIdentifiers>;
  instanceSlug: string;
  requestHeaders?: ForwardedRequestHeaders;
}): Promise<string | null> {
  return clientDataService.withRequestHeaders(opts.requestHeaders, () =>
    clientDataService.withInstance(opts.instanceSlug, () =>
      clientDataService.resolveUserDepartmentFromSharePoint({
        username: opts.identifiers.username,
        upn: opts.identifiers.upn,
        mail: opts.identifiers.mail,
        onPremisesUserPrincipalName: opts.identifiers.onPremisesUserPrincipalName,
        onPremisesAccountName: opts.identifiers.onPremisesAccountName,
      })
    )
  );
}

export async function resolveSessionDepartmentAcrossInstances(opts: {
  session: AdminSessionPayload;
  instanceSlugs: string[];
  requestHeaders?: ForwardedRequestHeaders;
}): Promise<string | null> {
  const identifiers = extractIdentifiers(opts.session);
  if (identifiers.department) {
    return identifiers.department;
  }

  const candidateSlugs = Array.from(
    new Set(opts.instanceSlugs.map((slug) => String(slug || '').trim()).filter(Boolean))
  );
  const lookupSlug = candidateSlugs[0];
  if (!lookupSlug) return null;
  return resolveDepartmentForIdentifiers({
    identifiers,
    instanceSlug: lookupSlug,
    requestHeaders: opts.requestHeaders,
  });
}

async function isSessionAllowedForInstanceUncached(
  opts: {
    session: AdminSessionPayload;
    instance: Pick<RoadmapInstanceConfig, 'slug' | 'metadata'>;
    requestHeaders?: ForwardedRequestHeaders;
    mode: InstanceAccessMode;
  } & InstanceAccessHints
): Promise<boolean> {
  const { session, instance } = opts;

  const effectiveInstance =
    instance.metadata !== undefined
      ? instance
      : ((await getInstanceConfigBySlug(String(instance.slug || ''))) ?? instance);

  if (opts.knownSuperAdmin === true) {
    return true;
  }

  const principal: Principal = {
    username: (typeof session?.username === 'string' && session.username) || null,
    groups: session?.groups,
  };

  const ids = extractIdentifiers(session);
  const directUserCandidates = [
    ids.tenantId && ids.objectId ? `${ids.tenantId}:${ids.objectId}` : null,
    ids.username,
    ids.upn,
    ids.mail,
    ids.onPremisesUserPrincipalName,
    ids.onPremisesAccountName,
  ];
  if (
    directUserCandidates.some((candidate) =>
      isAdminUserAllowedForInstance(candidate, effectiveInstance)
    )
  ) {
    return true;
  }

  // Token-derived implicit admin groups can be stale until the next login.
  // They are acceptable as a read hint, but admin access must be revalidated live.
  if (opts.mode === 'read' && isAdminPrincipalAllowedForInstance(principal, effectiveInstance)) {
    return true;
  }

  if (opts.mode === 'read') {
    // Department-linked users may view an instance but never gain admin rights from that alone.
    const hasResolvedDepartmentHint = Object.prototype.hasOwnProperty.call(
      opts,
      'resolvedDepartment'
    );

    if (hasResolvedDepartmentHint) {
      ids.department = opts.resolvedDepartment ?? null;
    } else if (!ids.department) {
      const resolvedOnPremDepartment = await resolveDepartmentForIdentifiers({
        identifiers: ids,
        instanceSlug: String(effectiveInstance.slug || ''),
        requestHeaders: opts.requestHeaders,
      });
      if (resolvedOnPremDepartment) {
        ids.department = resolvedOnPremDepartment;
      }
    }

    const departmentCandidates = Array.from(
      new Set(
        [ids.department, ...ids.groups].map((value) => normalizeDepartment(value)).filter(Boolean)
      )
    );
    if (departmentCandidates.length > 0) {
      const allowedByDepartment = await isAnyDepartmentCandidateAllowedForInstance({
        instanceSlug: String(effectiveInstance.slug || ''),
        candidates: departmentCandidates,
      });
      if (allowedByDepartment) return true;
    }
  }

  // Database authorization is cheap and authoritative. SharePoint is a last
  // resort and is deliberately limited to the current instance.
  if (opts.knownSuperAdmin !== false && (await isDbSuperAdminSession(session))) {
    return true;
  }

  if (
    opts.allowSharePointFallback !== false &&
    opts.knownSuperAdmin !== false &&
    (await isSuperAdminSessionWithSharePointFallback(session, {
      candidateInstanceSlugs: [String(effectiveInstance.slug || '')],
      requestHeaders: opts.requestHeaders,
    }))
  ) {
    return true;
  }

  if (opts.allowSharePointFallback === false) return false;

  // Final fallback: verify the instance-specific SharePoint admin group.
  const groupTitle = `admin-${String(instance.slug || '').toLowerCase()}`;

  try {
    return await clientDataService.withRequestHeaders(opts.requestHeaders, () =>
      clientDataService.withInstance(String(effectiveInstance.slug || ''), () =>
        clientDataService.isUserInSharePointGroupByTitle(groupTitle, ids)
      )
    );
  } catch (error) {
    console.warn('[instanceAccess] SharePoint membership fallback failed', {
      slug: String(effectiveInstance.slug || ''),
      error,
    });
    return false;
  }
}

async function isSessionAllowedForInstance(
  opts: {
    session: AdminSessionPayload;
    instance: Pick<RoadmapInstanceConfig, 'slug' | 'metadata'>;
    requestHeaders?: ForwardedRequestHeaders;
    mode: InstanceAccessMode;
  } & InstanceAccessHints
): Promise<boolean> {
  const key = buildAccessDecisionKey({
    session: opts.session,
    instanceSlug: String(opts.instance.slug || ''),
    mode: opts.mode,
    knownSuperAdmin: opts.knownSuperAdmin,
    resolvedDepartment: opts.resolvedDepartment,
    allowSharePointFallback: opts.allowSharePointFallback,
  });
  const cached = accessDecisionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.allowed;
  if (cached) accessDecisionCache.delete(key);

  const existing = accessDecisionInFlight.get(key);
  if (existing) return existing;

  const request = isSessionAllowedForInstanceUncached(opts).then((allowed) => {
    const now = Date.now();
    pruneAccessDecisionCache(now);
    accessDecisionCache.set(key, {
      allowed,
      expiresAt: now + (allowed ? ACCESS_DECISION_TTL_MS : ACCESS_DENIAL_TTL_MS),
    });
    return allowed;
  });
  accessDecisionInFlight.set(key, request);
  try {
    return await request;
  } finally {
    if (accessDecisionInFlight.get(key) === request) accessDecisionInFlight.delete(key);
  }
}

export async function isSessionExplicitlyAllowedByDepartmentForInstance(
  opts: {
    session: AdminSessionPayload;
    instance: Pick<RoadmapInstanceConfig, 'slug' | 'metadata'>;
    requestHeaders?: ForwardedRequestHeaders;
  } & InstanceAccessHints
): Promise<boolean> {
  const effectiveInstance =
    opts.instance.metadata !== undefined
      ? opts.instance
      : ((await getInstanceConfigBySlug(String(opts.instance.slug || ''))) ?? opts.instance);

  if (opts.knownSuperAdmin === true) {
    return true;
  }

  if (opts.knownSuperAdmin !== false && (await isDbSuperAdminSession(opts.session))) {
    return true;
  }

  const ids = extractIdentifiers(opts.session);
  const hasResolvedDepartmentHint = Object.prototype.hasOwnProperty.call(
    opts,
    'resolvedDepartment'
  );
  if (hasResolvedDepartmentHint) {
    ids.department = opts.resolvedDepartment ?? null;
  } else if (!ids.department) {
    const resolvedOnPremDepartment = await resolveDepartmentForIdentifiers({
      identifiers: ids,
      instanceSlug: String(effectiveInstance.slug || ''),
      requestHeaders: opts.requestHeaders,
    });
    if (resolvedOnPremDepartment) {
      ids.department = resolvedOnPremDepartment;
    }
  }

  const departmentCandidates = Array.from(
    new Set([ids.department].map((value) => normalizeDepartment(value)).filter(Boolean))
  );
  if (departmentCandidates.length === 0) return false;

  const allowedByDepartment = await isAnyDepartmentCandidateAllowedForInstance({
    instanceSlug: String(effectiveInstance.slug || ''),
    candidates: departmentCandidates,
  });
  if (allowedByDepartment) return true;

  return (
    opts.allowSharePointFallback !== false &&
    opts.knownSuperAdmin !== false &&
    (await isSuperAdminSessionWithSharePointFallback(opts.session, {
      candidateInstanceSlugs: [String(effectiveInstance.slug || '')],
      requestHeaders: opts.requestHeaders,
    }))
  );
}

export async function isAdminSessionAllowedForInstance(
  opts: {
    session: AdminSessionPayload;
    instance: Pick<RoadmapInstanceConfig, 'slug' | 'metadata'>;
    requestHeaders?: ForwardedRequestHeaders;
  } & InstanceAccessHints
): Promise<boolean> {
  return isSessionAllowedForInstance({ ...opts, mode: 'admin' });
}

export async function isReadSessionAllowedForInstance(
  opts: {
    session: AdminSessionPayload;
    instance: Pick<RoadmapInstanceConfig, 'slug' | 'metadata'>;
    requestHeaders?: ForwardedRequestHeaders;
  } & InstanceAccessHints
): Promise<boolean> {
  return isSessionAllowedForInstance({ ...opts, mode: 'read' });
}
