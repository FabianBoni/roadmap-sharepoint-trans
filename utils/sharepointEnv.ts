import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';

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
  return chosen.replace(/\/$/, '');
}

type SharePointUrlEnvironment = Record<string, string | undefined>;

// People Picker is a web-application directory service. Keep its lookup context
// independent from the site collection that stores a roadmap instance's lists.
export function resolveSharePointPeoplePickerSiteUrl(
  instance?: RoadmapInstanceConfig | null,
  environment: SharePointUrlEnvironment = process.env
): string {
  const explicit = environment.SP_PEOPLE_PICKER_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const rawEnv =
    instance?.deploymentEnv ||
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV ||
    environment.NODE_ENV ||
    'development';
  const deploymentEnv = String(rawEnv).toLowerCase();
  const isProd =
    deploymentEnv === 'production' || deploymentEnv === 'prod' || deploymentEnv === 'live';
  const globalSiteUrl = (
    isProd
      ? environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD ||
        environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV
      : environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV ||
        environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD
  )?.trim();

  return globalSiteUrl ? globalSiteUrl.replace(/\/$/, '') : resolveSharePointSiteUrl(instance);
}
