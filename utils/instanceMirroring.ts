import prisma from '@/lib/prisma';
import type { Category, InstanceBadgeOption, MirroringSourceFailure, Project } from '@/types';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { clientDataService } from '@/utils/clientDataService';
import { mapInstanceRecord, type PrismaInstanceWithHosts } from '@/utils/instanceConfig';
import { isSampleDataInstance, getSampleProjects } from '@/utils/sampleInstanceData';

type ForwardedRequestHeaders = { authorization?: string; cookie?: string };

type MirroredProjectsResult = {
  mirroredProjects: Project[];
  mirroredCategories: Category[];
  badgeOptions: InstanceBadgeOption[];
  mirroringFailures: MirroringSourceFailure[];
};

type MirroringIndexEntry = {
  sourceInstance: RoadmapInstanceConfig;
  project: Project;
};

type MirroringIndex = {
  badgeOptions: InstanceBadgeOption[];
  projectsByTargetSlug: Map<string, MirroringIndexEntry[]>;
  projectsByBadge: Map<string, MirroringIndexEntry[]>;
  mirroringFailures: MirroringSourceFailure[];
};

let mirroringIndexCache: { expiresAt: number; value: MirroringIndex } | null = null;
let mirroringIndexInFlight: Promise<MirroringIndex> | null = null;
const MIRRORING_INDEX_TTL_MS = Math.max(
  5_000,
  Number.parseInt(process.env.ROADMAP_MIRRORING_CACHE_TTL_MS || '60000', 10) || 60_000
);

const MIRROR_PROJECT_PREFIX = 'mirror:';
const MIRROR_CATEGORY_PREFIX = 'instance:';
const DEFAULT_MIRROR_CATEGORY_COLOR = '#475569';
const DEFAULT_MIRROR_CATEGORY_ICON = 'FiLayers';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const normalizeInstanceBadge = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getInstanceBadge = (
  instanceOrMetadata:
    Pick<RoadmapInstanceConfig, 'metadata'> | Record<string, unknown> | null | undefined
): string | null => {
  const source =
    instanceOrMetadata && 'metadata' in instanceOrMetadata
      ? asRecord(instanceOrMetadata.metadata)
      : asRecord(instanceOrMetadata);
  if (!source) return null;

  const badges = [source.instanceBadge, source.badge, asRecord(source.mirroring)?.badge];

  for (const candidate of badges) {
    const normalized = normalizeInstanceBadge(candidate);
    if (normalized) return normalized;
  }

  return null;
};

export const setInstanceBadgeMetadata = (
  metadata: Record<string, unknown> | null | undefined,
  badge: string | null
): Record<string, unknown> => {
  const next = asRecord(metadata) ? { ...(metadata as Record<string, unknown>) } : {};
  const normalized = normalizeInstanceBadge(badge);
  if (normalized) {
    next.instanceBadge = normalized;
  } else {
    delete next.instanceBadge;
  }
  return next;
};

export const buildMirroredProjectId = (sourceSlug: string, sourceProjectId: string): string =>
  `${MIRROR_PROJECT_PREFIX}${encodeURIComponent(sourceSlug)}:${encodeURIComponent(sourceProjectId)}`;

export const parseMirroredProjectId = (
  value: string | null | undefined
): { sourceSlug: string; sourceProjectId: string } | null => {
  if (!value || !value.startsWith(MIRROR_PROJECT_PREFIX)) return null;
  const payload = value.slice(MIRROR_PROJECT_PREFIX.length);
  const separatorIndex = payload.indexOf(':');
  if (separatorIndex <= 0) return null;

  try {
    const sourceSlug = decodeURIComponent(payload.slice(0, separatorIndex)).trim().toLowerCase();
    const sourceProjectId = decodeURIComponent(payload.slice(separatorIndex + 1)).trim();
    if (!sourceSlug || !sourceProjectId) return null;
    return { sourceSlug, sourceProjectId };
  } catch {
    return null;
  }
};

export const buildMirrorCategoryId = (sourceSlug: string): string =>
  `${MIRROR_CATEGORY_PREFIX}${String(sourceSlug || '')
    .trim()
    .toLowerCase()}`;

const buildMirrorCategory = (
  instance: Pick<RoadmapInstanceConfig, 'slug' | 'displayName'>
): Category => ({
  id: buildMirrorCategoryId(instance.slug),
  name: instance.displayName,
  color: DEFAULT_MIRROR_CATEGORY_COLOR,
  icon: DEFAULT_MIRROR_CATEGORY_ICON,
});

const normalizeBadgeList = (badges: unknown): string[] => {
  if (!Array.isArray(badges)) return [];
  return badges
    .map((badge) => normalizeInstanceBadge(badge))
    .filter((badge): badge is string => Boolean(badge));
};

export const normalizeMirrorTargetInstanceSlugs = (slugs: unknown): string[] => {
  if (!Array.isArray(slugs)) return [];
  return slugs
    .filter((slug): slug is string => typeof slug === 'string')
    .map((slug) => slug.trim().toLowerCase())
    .filter(Boolean)
    .filter((slug, index, list) => list.indexOf(slug) === index);
};

/**
 * Explicit target slugs are authoritative. Badge matching is only used for projects
 * created before MirrorTargetInstanceSlugs existed.
 */
export const isProjectMirroredToInstance = (opts: {
  project: Pick<Project, 'badges' | 'mirrorTargetInstanceSlugs'>;
  targetSlug: string;
  targetBadge?: string | null;
}): boolean => {
  const explicitTargets = normalizeMirrorTargetInstanceSlugs(
    opts.project.mirrorTargetInstanceSlugs
  );
  const targetSlug = String(opts.targetSlug || '')
    .trim()
    .toLowerCase();
  if (explicitTargets.length > 0)
    return Boolean(targetSlug) && explicitTargets.includes(targetSlug);

  const normalizedTargetBadge = normalizeInstanceBadge(opts.targetBadge)?.toLowerCase();
  return (
    Boolean(normalizedTargetBadge) &&
    normalizeBadgeList(opts.project.badges).some(
      (badge) => badge.toLowerCase() === normalizedTargetBadge
    )
  );
};

const mapMirroredProject = (
  project: Project,
  sourceInstance: Pick<RoadmapInstanceConfig, 'slug' | 'displayName'>
): Project => ({
  ...project,
  id: buildMirroredProjectId(sourceInstance.slug, project.id),
  sourceProjectId: project.id,
  category: buildMirrorCategoryId(sourceInstance.slug),
  categoryLabel: sourceInstance.displayName,
  isReadOnlyMirror: true,
  mirrorSourceInstanceSlug: sourceInstance.slug,
  mirrorSourceInstanceName: sourceInstance.displayName,
});

const loadProjectsForInstance = async (
  instance: RoadmapInstanceConfig,
  forwardedHeaders?: ForwardedRequestHeaders
): Promise<Project[]> => {
  if (isSampleDataInstance(instance)) {
    return getSampleProjects();
  }

  return clientDataService.withRequestHeaders(forwardedHeaders, () =>
    clientDataService.withInstance(instance.slug, () => clientDataService.getAllProjects())
  );
};

export async function getInstanceBadgeOptions(): Promise<InstanceBadgeOption[]> {
  const records = (await prisma.roadmapInstance.findMany({
    include: { hosts: true },
    orderBy: { slug: 'asc' },
  })) as PrismaInstanceWithHosts[];

  return records
    .map((record) => mapInstanceRecord(record))
    .map((instance) => ({
      slug: instance.slug,
      displayName: instance.displayName,
      badge: getInstanceBadge(instance),
    }))
    .filter((entry): entry is InstanceBadgeOption => Boolean(entry.badge));
}

export function invalidateInstanceMirroringCache(): void {
  mirroringIndexCache = null;
  mirroringIndexInFlight = null;
}

const buildMirroringIndex = async (
  forwardedHeaders?: ForwardedRequestHeaders
): Promise<MirroringIndex> => {
  const records = (await prisma.roadmapInstance.findMany({
    include: { hosts: true },
    orderBy: { slug: 'asc' },
  })) as PrismaInstanceWithHosts[];
  const instances = records.map((record) => mapInstanceRecord(record));
  const badgeOptions = instances
    .map((instance) => ({
      slug: instance.slug,
      displayName: instance.displayName,
      badge: getInstanceBadge(instance),
    }))
    .filter((entry): entry is InstanceBadgeOption => Boolean(entry.badge));

  const projectsByBadge = new Map<string, MirroringIndexEntry[]>();
  const projectsByTargetSlug = new Map<string, MirroringIndexEntry[]>();
  const mirroringFailures: MirroringSourceFailure[] = [];
  const concurrency = Math.min(
    4,
    Math.max(1, Number.parseInt(process.env.ROADMAP_MIRRORING_CONCURRENCY || '3', 10) || 3)
  );
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, instances.length) }, async () => {
    while (cursor < instances.length) {
      const sourceInstance = instances[cursor++];
      try {
        const projects = await loadProjectsForInstance(sourceInstance, forwardedHeaders);
        for (const project of projects) {
          const targetSlugs = normalizeMirrorTargetInstanceSlugs(project.mirrorTargetInstanceSlugs);
          if (targetSlugs.length > 0) {
            for (const targetSlug of targetSlugs) {
              const entries = projectsByTargetSlug.get(targetSlug) || [];
              entries.push({ sourceInstance, project });
              projectsByTargetSlug.set(targetSlug, entries);
            }
          } else {
            for (const badge of normalizeBadgeList(project.badges)) {
              const key = badge.toLowerCase();
              const entries = projectsByBadge.get(key) || [];
              entries.push({ sourceInstance, project });
              projectsByBadge.set(key, entries);
            }
          }
        }
      } catch {
        mirroringFailures.push({
          slug: sourceInstance.slug,
          displayName: sourceInstance.displayName,
        });
        console.warn('[instanceMirroring] failed to index source projects', {
          slug: sourceInstance.slug,
        });
      }
    }
  });
  await Promise.all(workers);
  return { badgeOptions, projectsByTargetSlug, projectsByBadge, mirroringFailures };
};

const getMirroringIndex = async (
  forwardedHeaders?: ForwardedRequestHeaders
): Promise<MirroringIndex> => {
  if (mirroringIndexCache && mirroringIndexCache.expiresAt > Date.now()) {
    return mirroringIndexCache.value;
  }
  if (mirroringIndexInFlight) return mirroringIndexInFlight;
  mirroringIndexInFlight = buildMirroringIndex(forwardedHeaders).then((value) => {
    mirroringIndexCache = {
      value,
      expiresAt: Date.now() + MIRRORING_INDEX_TTL_MS,
    };
    return value;
  });
  try {
    return await mirroringIndexInFlight;
  } finally {
    mirroringIndexInFlight = null;
  }
};

export async function getMirroredProjectsForInstance(opts: {
  instance: RoadmapInstanceConfig;
  forwardedHeaders?: ForwardedRequestHeaders;
}): Promise<MirroredProjectsResult> {
  const targetBadge = getInstanceBadge(opts.instance);
  const index = await getMirroringIndex(opts.forwardedHeaders);
  const explicitMatches = index.projectsByTargetSlug.get(opts.instance.slug.toLowerCase()) || [];
  const legacyMatches = targetBadge
    ? index.projectsByBadge.get(targetBadge.toLowerCase()) || []
    : [];
  const matches = [...explicitMatches, ...legacyMatches].filter(
    (entry) => entry.sourceInstance.slug !== opts.instance.slug
  );
  const mirroredProjects = matches.map(({ project, sourceInstance }) =>
    mapMirroredProject(project, sourceInstance)
  );
  const sourceInstances = Array.from(
    new Map(matches.map((entry) => [entry.sourceInstance.slug, entry.sourceInstance])).values()
  );
  const mirroredCategories = sourceInstances.map(buildMirrorCategory);
  return {
    mirroredProjects,
    mirroredCategories,
    badgeOptions: index.badgeOptions,
    mirroringFailures: index.mirroringFailures.filter(
      (failure) => failure.slug !== opts.instance.slug
    ),
  };
}

export async function getMirroredProjectById(opts: {
  targetInstance: RoadmapInstanceConfig;
  mirroredId: string;
  forwardedHeaders?: ForwardedRequestHeaders;
}): Promise<Project | null> {
  const parsed = parseMirroredProjectId(opts.mirroredId);
  const targetBadge = getInstanceBadge(opts.targetInstance);
  if (!parsed) return null;

  const sourceRecord = await prisma.roadmapInstance.findUnique({
    where: { slug: parsed.sourceSlug },
    include: { hosts: true },
  });
  if (!sourceRecord) return null;

  const sourceInstance = mapInstanceRecord(sourceRecord as PrismaInstanceWithHosts);
  const sourceProject = isSampleDataInstance(sourceInstance)
    ? getSampleProjects().find((project) => project.id === parsed.sourceProjectId) || null
    : await clientDataService.withRequestHeaders(opts.forwardedHeaders, () =>
        clientDataService.withInstance(sourceInstance.slug, () =>
          clientDataService.getProjectById(parsed.sourceProjectId)
        )
      );

  if (!sourceProject) return null;

  if (
    !isProjectMirroredToInstance({
      project: sourceProject,
      targetSlug: opts.targetInstance.slug,
      targetBadge,
    })
  )
    return null;

  return mapMirroredProject(sourceProject, sourceInstance);
}
