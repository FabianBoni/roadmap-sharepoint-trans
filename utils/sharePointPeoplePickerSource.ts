import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { normalizeSharePointStrategy } from '@/utils/sharePointStrategy';

type PeoplePickerEnvironment = Record<string, string | undefined>;

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

const isProductionEnvironment = (value: string): boolean =>
  ['production', 'prod', 'live'].includes(value.trim().toLowerCase());

const resolveGlobalPeoplePickerSiteUrl = (environment: PeoplePickerEnvironment): string => {
  const explicit = String(environment.SP_PEOPLE_PICKER_SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const deploymentEnv = String(
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV || environment.NODE_ENV || 'development'
  );
  const configured = isProductionEnvironment(deploymentEnv)
    ? environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD ||
      environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV
    : environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV ||
      environment.NEXT_PUBLIC_SHAREPOINT_SITE_URL_PROD;
  const siteUrl = String(configured || '').trim();
  if (!siteUrl) {
    throw new Error(
      'Global SharePoint People Picker URL is missing. Set SP_PEOPLE_PICKER_SITE_URL.'
    );
  }
  return siteUrl.replace(/\/+$/, '');
};

/**
 * Build a complete, site-independent SharePoint connection for directory search.
 * No value is inherited from the active roadmap instance except inert identity fields.
 */
export const buildGlobalSharePointPeoplePickerInstance = (
  currentInstance: RoadmapInstanceConfig,
  environment: PeoplePickerEnvironment = process.env
): RoadmapInstanceConfig => {
  const siteUrl = resolveGlobalPeoplePickerSiteUrl(environment);
  const deploymentEnv = String(
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV || environment.NODE_ENV || 'development'
  );
  const trustedCaPath = String(
    environment.SP_PEOPLE_PICKER_TRUSTED_CA_PATH || environment.SP_TRUSTED_CA_PATH || ''
  ).trim();

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
        environment.SP_PEOPLE_PICKER_STRATEGY,
        environment.SP_STRATEGY
      ),
      allowSelfSigned:
        environment.SP_PEOPLE_PICKER_ALLOW_SELF_SIGNED === 'true' ||
        environment.SP_ALLOW_SELF_SIGNED === 'true',
      trustedCaPath: trustedCaPath || null,
    },
  };
};
