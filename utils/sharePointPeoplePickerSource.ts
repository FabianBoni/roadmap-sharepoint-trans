import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { normalizeSharePointStrategy } from '@/utils/sharePointStrategy';

type PeoplePickerEnvironment = Record<string, string | undefined>;

const INSTANCE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

export const SHAREPOINT_PEOPLE_PICKER_SCOPE_PARAM = 'sharePointDirectory';
export const SHAREPOINT_PEOPLE_PICKER_GLOBAL_SCOPE = 'global';
export const SHAREPOINT_PEOPLE_PICKER_API_PATH =
  '/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser';

export const buildGlobalSharePointPeoplePickerProxyUrl = (webUrl: string): string => {
  const scope = new URLSearchParams({
    [SHAREPOINT_PEOPLE_PICKER_SCOPE_PARAM]: SHAREPOINT_PEOPLE_PICKER_GLOBAL_SCOPE,
  });
  return `${webUrl.replace(/\/+$/, '')}${SHAREPOINT_PEOPLE_PICKER_API_PATH}?${scope}`;
};

export const isSharePointPeoplePickerPath = (path: string): boolean =>
  /^\/_api\/SP\.UI\.ApplicationPages\.ClientPeoplePickerWebServiceInterface\.clientPeoplePickerSearchUser$/i.test(
    path
  );

/**
 * Resolve the roadmap instance whose SharePoint web is used solely as the directory API entry
 * point. Authorization continues to use the active roadmap instance in the proxy handler.
 */
export const resolveSharePointPeoplePickerSourceSlug = (
  currentInstanceSlug: string,
  environment: PeoplePickerEnvironment = process.env
): string => {
  const configured = String(
    environment.SP_PEOPLE_PICKER_INSTANCE_SLUG ||
      environment.DEFAULT_ROADMAP_INSTANCE ||
      currentInstanceSlug
  )
    .trim()
    .toLowerCase();
  if (!INSTANCE_SLUG_PATTERN.test(configured)) {
    throw new Error('SharePoint People Picker source instance slug is invalid.');
  }
  return configured;
};

const isProductionEnvironment = (value: string): boolean =>
  ['production', 'prod', 'live'].includes(value.trim().toLowerCase());

const resolveGlobalPeoplePickerSiteUrl = (
  currentInstance: RoadmapInstanceConfig,
  environment: PeoplePickerEnvironment
): { siteUrl: string; usesInstanceConnection: boolean } => {
  const explicit = String(environment.SP_PEOPLE_PICKER_SITE_URL || '').trim();
  if (explicit) {
    return { siteUrl: explicit.replace(/\/+$/, ''), usesInstanceConnection: false };
  }

  const deploymentEnv = String(
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV || environment.NODE_ENV || 'development'
  );
  const configured = isProductionEnvironment(deploymentEnv)
    ? environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD ||
      environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV
    : environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV ||
      environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD;
  const configuredSiteUrl = String(configured || '').trim();
  if (configuredSiteUrl) {
    return {
      siteUrl: configuredSiteUrl.replace(/\/+$/, ''),
      usesInstanceConnection: false,
    };
  }

  const instanceSiteUrl = isProductionEnvironment(deploymentEnv)
    ? currentInstance.sharePoint.siteUrlProd || currentInstance.sharePoint.siteUrlDev
    : currentInstance.sharePoint.siteUrlDev || currentInstance.sharePoint.siteUrlProd;
  const siteUrl = String(instanceSiteUrl || '').trim();
  if (!siteUrl) {
    throw new Error(
      'SharePoint People Picker URL is missing. Configure the instance site or SP_PEOPLE_PICKER_SITE_URL.'
    );
  }
  return { siteUrl: siteUrl.replace(/\/+$/, ''), usesInstanceConnection: true };
};

/**
 * Build a SharePoint connection for tenant-wide directory search. A dedicated picker site
 * takes precedence; otherwise the active instance site is only used as the API entry point.
 */
export const buildGlobalSharePointPeoplePickerInstance = (
  currentInstance: RoadmapInstanceConfig,
  environment: PeoplePickerEnvironment = process.env
): RoadmapInstanceConfig => {
  const { siteUrl, usesInstanceConnection } = resolveGlobalPeoplePickerSiteUrl(
    currentInstance,
    environment
  );
  const deploymentEnv = String(
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV || environment.NODE_ENV || 'development'
  );
  const trustedCaPath = String(
    environment.SP_PEOPLE_PICKER_TRUSTED_CA_PATH ||
      environment.SP_TRUSTED_CA_PATH ||
      (usesInstanceConnection ? currentInstance.sharePoint.trustedCaPath : '') ||
      ''
  ).trim();
  const allowSelfSigned =
    environment.SP_PEOPLE_PICKER_ALLOW_SELF_SIGNED !== undefined
      ? environment.SP_PEOPLE_PICKER_ALLOW_SELF_SIGNED === 'true'
      : environment.SP_ALLOW_SELF_SIGNED !== undefined
        ? environment.SP_ALLOW_SELF_SIGNED === 'true'
        : usesInstanceConnection
          ? Boolean(currentInstance.sharePoint.allowSelfSigned)
          : false;

  return {
    id: currentInstance.id,
    slug: '__sharepoint-people-picker__',
    displayName: 'Global SharePoint People Picker',
    deploymentEnv,
    hosts: [],
    sharePoint: {
      siteUrlDev: siteUrl,
      siteUrlProd: siteUrl,
      strategy: normalizeSharePointStrategy(
        environment.SP_PEOPLE_PICKER_STRATEGY || environment.SP_STRATEGY,
        usesInstanceConnection ? currentInstance.sharePoint.strategy : undefined
      ),
      allowSelfSigned,
      trustedCaPath: trustedCaPath || null,
    },
  };
};
