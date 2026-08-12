import type { NextApiRequest, NextApiResponse } from 'next';
import {
  parseAiHeartbeatEndpoints,
  probeAiHeartbeatEndpoint,
  type AiHeartbeatEndpointResult,
} from '@/utils/aiHeartbeat';

type AiHeartbeatResponse = {
  ok: boolean;
  enabled: boolean;
  checkedAt: string;
  endpoints: AiHeartbeatEndpointResult[];
  error?: 'not_configured' | 'invalid_configuration';
};

type CachedHeartbeat = {
  expiresAt: number;
  response: AiHeartbeatResponse;
};

let cachedHeartbeat: CachedHeartbeat | null = null;
let heartbeatInFlight: Promise<AiHeartbeatResponse> | null = null;

const cacheTtlMs = (): number => {
  const parsed = Number.parseInt(String(process.env.AI_HEARTBEAT_CACHE_TTL_MS || ''), 10);
  return Number.isFinite(parsed) ? Math.min(60_000, Math.max(1_000, parsed)) : 15_000;
};

const runHeartbeat = async (): Promise<AiHeartbeatResponse> => {
  const required = process.env.AI_HEARTBEAT_REQUIRED === 'true';
  try {
    const endpoints = parseAiHeartbeatEndpoints();
    if (endpoints.length === 0) {
      return {
        ok: !required,
        enabled: false,
        checkedAt: new Date().toISOString(),
        endpoints: [],
        ...(required ? { error: 'not_configured' as const } : {}),
      };
    }

    const results = await Promise.all(
      endpoints.map((endpoint) => probeAiHeartbeatEndpoint(endpoint))
    );
    return {
      ok: results.every((result) => result.ok),
      enabled: true,
      checkedAt: new Date().toISOString(),
      endpoints: results,
    };
  } catch (error) {
    console.error('[ai-heartbeat] invalid server configuration', {
      error: error instanceof Error ? error.message : 'Unknown configuration error',
    });
    return {
      ok: false,
      enabled: true,
      checkedAt: new Date().toISOString(),
      endpoints: [],
      error: 'invalid_configuration',
    };
  }
};

const getHeartbeat = async (): Promise<AiHeartbeatResponse> => {
  const now = Date.now();
  if (cachedHeartbeat && cachedHeartbeat.expiresAt > now) return cachedHeartbeat.response;
  if (heartbeatInFlight) return heartbeatInFlight;

  heartbeatInFlight = runHeartbeat()
    .then((response) => {
      cachedHeartbeat = { response, expiresAt: Date.now() + cacheTtlMs() };
      return response;
    })
    .finally(() => {
      heartbeatInFlight = null;
    });
  return heartbeatInFlight;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const heartbeat = await getHeartbeat();
  const status = heartbeat.ok ? 200 : 503;
  if (req.method === 'HEAD') return res.status(status).end();
  return res.status(status).json(heartbeat);
}
