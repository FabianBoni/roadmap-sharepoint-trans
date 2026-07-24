import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { getInstanceConfigBySlug } from '@/utils/instanceConfig';
import type { Project } from '@/types';
import { getSampleProjects, isSampleDataInstance } from '@/utils/sampleInstanceData';
import {
  extractHeaderApiKey,
  getConfiguredPublicApiKeys,
  isConfiguredApiKey,
} from '@/utils/apiKeyAuth';
import { consumePersistentRateLimit } from '@/utils/rateLimit';

const RATE_LIMIT = 500; // requests per window
const WINDOW_MS = 60_000;

const disableCache = (res: NextApiResponse) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

const normalizeCategory = (value: unknown): string => {
  if (value == null) return '';
  const text = String(value).trim();
  if (/^\d+\.0$/.test(text)) return String(parseInt(text, 10));
  return text;
};

const toLower = (v: string | undefined) => (v ? v.toLowerCase() : '');

const isTruthyFlag = (value: unknown): boolean => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'all'
    );
  }
  if (Array.isArray(value)) return value.some((entry) => isTruthyFlag(entry));
  return false;
};

const filterProjects = (list: Project[], query: NextApiRequest['query']): Project[] => {
  const categoryFilter = normalizeCategory(query.category || '').toLowerCase();
  const statusFilterRaw =
    typeof query.status === 'string'
      ? query.status
      : Array.isArray(query.status)
        ? query.status.join(',')
        : '';
  const statusFilters = statusFilterRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const badgeFilterRaw =
    typeof query.badges === 'string'
      ? query.badges
      : Array.isArray(query.badges)
        ? query.badges.join(',')
        : '';
  const badgeFilters = badgeFilterRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';

  return list.filter((p) => {
    if (categoryFilter) {
      const cat = normalizeCategory(p.category).toLowerCase();
      if (cat !== categoryFilter) return false;
    }
    if (statusFilters.length) {
      const status = toLower(p.status);
      if (!statusFilters.includes(status)) return false;
    }
    if (badgeFilters.length) {
      const badges = (p.badges || []).map((badge) => String(badge).trim().toLowerCase());
      if (!badgeFilters.some((badge) => badges.includes(badge))) return false;
    }
    if (q) {
      const haystack = [
        p.title,
        p.description,
        p.bisher,
        p.zukunft,
        p.geplante_umsetzung,
        ...(p.badges || []),
      ]
        .filter(Boolean)
        .map((s) => s!.toLowerCase())
        .join(' \n ');
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  disableCache(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const allowedKeys = getConfiguredPublicApiKeys();
  if (!allowedKeys.length) {
    return res.status(503).json({ error: 'Public API unavailable' });
  }
  const apiKey = extractHeaderApiKey(req);
  if (!isConfiguredApiKey(apiKey, allowedKeys)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const instanceParam = req.query.instance || req.query.roadmapInstance;
  const slug = Array.isArray(instanceParam) ? instanceParam[0] : instanceParam;
  const instanceSlug = typeof slug === 'string' && slug.trim() ? slug.trim().toLowerCase() : null;

  try {
    if (!instanceSlug) {
      return res.status(400).json({
        error: 'instance query parameter is required',
      });
    }

    const instance = await getInstanceConfigBySlug(instanceSlug);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const rateLimit = await consumePersistentRateLimit({
      scope: 'public-projects',
      key: apiKey as string,
      limit: RATE_LIMIT,
      windowMs: WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({ error: 'Rate limit exceeded (500/min)' });
    }

    const projects = isSampleDataInstance(instance)
      ? getSampleProjects()
      : await clientDataService.withInstance(instance.slug, () =>
          clientDataService.getAllProjects()
        );

    const normalized = Array.isArray(projects)
      ? projects.map((p) => ({ ...p, category: normalizeCategory(p.category) }))
      : [];

    const skipFilters = isTruthyFlag(req.query.all);
    const filtered = skipFilters ? normalized : filterProjects(normalized, req.query);
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
    res.setHeader('X-RateLimit-Remaining', 'n/a');
    res.setHeader('X-RateLimit-Window', `${WINDOW_MS / 1000}s`);

    return res.status(200).json({
      projects: filtered,
      count: filtered.length,
      instance: instance.slug,
    });
  } catch (error) {
    console.error('[api/public/projects] failed', {
      type: error instanceof Error ? error.name : 'UnknownError',
    });
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}
