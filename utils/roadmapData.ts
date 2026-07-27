import type { Category, Project, ProjectOrderByCategory } from '@/types';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { clientDataService } from '@/utils/clientDataService';
import {
  getSampleCategories,
  getSampleProjects,
  isSampleDataInstance,
} from '@/utils/sampleInstanceData';
import {
  getMirroredProjectsForInstance,
  invalidateInstanceMirroringCache,
} from '@/utils/instanceMirroring';
import { buildThemeSettings, DEFAULT_THEME, type ThemeSettings } from '@/utils/theme';

type ForwardedRequestHeaders = { authorization?: string; cookie?: string };

export type RoadmapDataSnapshot = {
  projects: Project[];
  categories: Category[];
  projectOrderByCategory: ProjectOrderByCategory;
  theme: ThemeSettings;
  generatedAt: string;
};

type SnapshotCacheEntry = {
  value: RoadmapDataSnapshot;
  freshUntil: number;
  staleUntil: number;
};

const snapshotCache = new Map<string, SnapshotCacheEntry>();
const snapshotInFlight = new Map<string, Promise<RoadmapDataSnapshot>>();
const FRESH_TTL_MS = Math.max(
  5_000,
  Number.parseInt(process.env.ROADMAP_DATA_CACHE_TTL_MS || '60000', 10) || 60_000
);
const STALE_TTL_MS = Math.max(
  FRESH_TTL_MS,
  Number.parseInt(process.env.ROADMAP_DATA_STALE_TTL_MS || '300000', 10) || 300_000
);

const loadRoadmapDataSnapshot = async (opts: {
  instance: RoadmapInstanceConfig;
  forwardedHeaders?: ForwardedRequestHeaders;
}): Promise<RoadmapDataSnapshot> => {
  const { instance, forwardedHeaders } = opts;
  const [projects, categories, projectOrderByCategory, appSettings] = isSampleDataInstance(instance)
    ? [getSampleProjects(), getSampleCategories(), {}, []]
    : await clientDataService.withRequestHeaders(forwardedHeaders, () =>
        clientDataService.withInstance(instance.slug, () =>
          Promise.all([
            clientDataService.getAllProjects(),
            clientDataService.getAllCategories(),
            clientDataService.getProjectOrderByCategory(),
            clientDataService.getAppSettings(),
          ])
        )
      );

  const { mirroredProjects, mirroredCategories } = await getMirroredProjectsForInstance({
    instance,
    forwardedHeaders,
  });

  return {
    projects: [...(Array.isArray(projects) ? projects : []), ...mirroredProjects],
    categories: [...(Array.isArray(categories) ? categories : []), ...mirroredCategories],
    projectOrderByCategory:
      projectOrderByCategory && typeof projectOrderByCategory === 'object'
        ? projectOrderByCategory
        : {},
    theme: appSettings.length > 0 ? buildThemeSettings(appSettings) : DEFAULT_THEME,
    generatedAt: new Date().toISOString(),
  };
};

const refreshSnapshot = (opts: {
  instance: RoadmapInstanceConfig;
  forwardedHeaders?: ForwardedRequestHeaders;
}): Promise<RoadmapDataSnapshot> => {
  const key = opts.instance.slug;
  const existing = snapshotInFlight.get(key);
  if (existing) return existing;

  const request = loadRoadmapDataSnapshot(opts).then((value) => {
    const now = Date.now();
    snapshotCache.set(key, {
      value,
      freshUntil: now + FRESH_TTL_MS,
      staleUntil: now + STALE_TTL_MS,
    });
    return value;
  });
  snapshotInFlight.set(key, request);
  void request.finally(() => {
    if (snapshotInFlight.get(key) === request) snapshotInFlight.delete(key);
  });
  return request;
};

export async function getRoadmapDataSnapshot(opts: {
  instance: RoadmapInstanceConfig;
  forwardedHeaders?: ForwardedRequestHeaders;
  forceRefresh?: boolean;
}): Promise<{ snapshot: RoadmapDataSnapshot; cacheStatus: 'hit' | 'stale' | 'miss' }> {
  const key = opts.instance.slug;
  const cached = snapshotCache.get(key);
  const now = Date.now();

  if (!opts.forceRefresh && cached?.freshUntil && cached.freshUntil > now) {
    return { snapshot: cached.value, cacheStatus: 'hit' };
  }
  if (!opts.forceRefresh && cached?.staleUntil && cached.staleUntil > now) {
    void refreshSnapshot(opts).catch(() => undefined);
    return { snapshot: cached.value, cacheStatus: 'stale' };
  }
  if (cached) snapshotCache.delete(key);
  return { snapshot: await refreshSnapshot(opts), cacheStatus: 'miss' };
}

export function invalidateRoadmapDataCache(instanceSlug?: string): void {
  if (instanceSlug) {
    snapshotCache.delete(instanceSlug);
  } else {
    snapshotCache.clear();
    invalidateInstanceMirroringCache();
  }
}
