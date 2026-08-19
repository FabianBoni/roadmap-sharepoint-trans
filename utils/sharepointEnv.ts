import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';

export function normalizeSharePointSiteUrl(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) throw new Error('SharePoint site URL is missing');

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error('SharePoint site URL is invalid');
  }
  if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error('SharePoint site URL must use HTTP or HTTPS');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('SharePoint site URL must not contain credentials, a query or a fragment');
  }
  return parsed.toString().replace(/\/+$/, '');
}

// Utility to resolve the correct SharePoint Site URL based on the active roadmap instance.
// Falls back to the global environment configuration if no instance is supplied.
export function resolveSharePointSiteUrl(instance?: RoadmapInstanceConfig | null): string {
  const rawEnv =
    instance?.deploymentEnv ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ||
    process.env.NODE_ENV ||
    'development';
  const env = String(rawEnv).toLowerCase();
  const isProd = env === 'production' || env === 'prod' || env === 'live';

  const defaultDev =
    process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV || 'https://spi.intranet.bs.ch/JSD/Digital';
  const dev = instance?.sharePoint.siteUrlDev || defaultDev;
  const prod =
    instance?.sharePoint.siteUrlProd || process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD || dev;

  const chosen = isProd ? prod : dev;
  return normalizeSharePointSiteUrl(chosen);
}
