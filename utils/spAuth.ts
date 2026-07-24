import https from 'https';
import crypto from 'crypto';
import { Buffer } from 'buffer';

import { resolveSharePointSiteUrl } from './sharepointEnv';
import { normalizeSharePointStrategy } from './sharePointStrategy';
import { getPrimaryCredentials } from './userCredentials';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { assertInstanceTlsPolicy } from './tlsPolicy';

export interface SharePointAuthContext {
  headers: Record<string, string>;
  agent?: https.Agent;
}

type CacheEntry = SharePointAuthContext & { expires: number };
const cache = new Map<string, CacheEntry>();

function debugLog(...args: unknown[]) {
  if (process.env.SP_PROXY_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.debug('[spAuth]', ...args);
  }
}

const buildCacheKey = (params: { siteUrl: string; strategy: string; username?: string }) => {
  // No passwords in cache keys.
  return crypto
    .createHash('sha256')
    .update([params.siteUrl, params.strategy, params.username || ''].join('::'))
    .digest('hex');
};

export async function getSharePointAuthHeaders(
  instance?: RoadmapInstanceConfig | null
): Promise<SharePointAuthContext> {
  const inst = instance || null;
  assertInstanceTlsPolicy(inst);

  const siteUrl = resolveSharePointSiteUrl(inst || undefined);
  const strategy = normalizeSharePointStrategy(inst?.sharePoint?.strategy, process.env.SP_STRATEGY);

  if (strategy === 'kerberos') {
    return { headers: { Accept: 'application/json;odata=nometadata' } };
  }

  if (strategy === 'delegated') {
    return { headers: { Accept: 'application/json;odata=nometadata' } };
  }

  const credentials = getPrimaryCredentials();
  if (!credentials) {
    throw new Error('No credentials found. Set SP_KERBEROS_SERVICE_* or SP_USERNAME/SP_PASSWORD.');
  }

  const username = credentials.username;
  const password = credentials.password;
  const cacheKey = buildCacheKey({ siteUrl, strategy, username });
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached;
  if (cached) cache.delete(cacheKey);

  if (strategy === 'basic') {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const entry: CacheEntry = {
      headers: {
        Accept: 'application/json;odata=nometadata',
        Authorization: `Basic ${auth}`,
      },
      expires: Date.now() + 60 * 60 * 1000,
    };
    cache.set(cacheKey, entry);
    return entry;
  }

  throw new Error(`Unsupported SharePoint auth strategy: ${strategy}.`);
}
