import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';

export const isInstanceInsecureTlsRequested = (instance?: RoadmapInstanceConfig | null): boolean =>
  instance?.sharePoint?.allowSelfSigned === true ||
  process.env.SP_ALLOW_SELF_SIGNED === 'true' ||
  process.env.SP_TLS_FALLBACK_INSECURE === 'true';

export const assertGlobalTlsPolicy = (): void => {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error(
      'Refusing to start with NODE_TLS_REJECT_UNAUTHORIZED=0. Configure SP_TRUSTED_CA_PATH instead.'
    );
  }
  if (
    process.env.SP_ALLOW_SELF_SIGNED === 'true' ||
    process.env.SP_TLS_FALLBACK_INSECURE === 'true'
  ) {
    throw new Error('Insecure SharePoint TLS is forbidden. Configure SP_TRUSTED_CA_PATH instead.');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    (process.env.SP_PROXY_DEBUG === 'true' ||
      process.env.SP_CURL_VERBOSE === 'true' ||
      process.env.ENABLE_SECURITY_DEBUG_ENDPOINTS === 'true')
  ) {
    throw new Error('Verbose SharePoint and security diagnostics are forbidden in production.');
  }
};

export const assertInstanceTlsPolicy = (instance?: RoadmapInstanceConfig | null): void => {
  assertGlobalTlsPolicy();
  if (instance?.sharePoint?.allowSelfSigned === true) {
    throw new Error(`Insecure SharePoint TLS is forbidden for instance "${instance.slug}".`);
  }
};

export const assertSubmittedTlsPolicy = (allowSelfSigned: boolean): void => {
  assertGlobalTlsPolicy();
  if (allowSelfSigned) {
    throw new Error('allowSelfSigned cannot be enabled. Configure a trusted CA.');
  }
};
