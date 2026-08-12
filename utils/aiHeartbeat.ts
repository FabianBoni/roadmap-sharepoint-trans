export type AiHeartbeatAuthConfig = {
  header: string;
  tokenEnv: string;
  scheme: string;
};

export type AiHeartbeatEndpointConfig = {
  id: string;
  label: string;
  url: string;
  method: 'GET' | 'HEAD';
  timeoutMs: number;
  acceptedStatuses: number[] | null;
  headers: Record<string, string>;
  auth: AiHeartbeatAuthConfig | null;
};

export type AiHeartbeatEndpointResult = {
  id: string;
  label: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error?: 'configuration' | 'timeout' | 'network' | 'unexpected_status';
};

type Environment = Record<string, string | undefined>;
type FetchLike = typeof fetch;

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 30_000;
const MAX_ENDPOINTS = 10;
const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const ENV_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,62}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readBoundedInteger = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
};

const readHeaders = (value: unknown, endpointId: string): Record<string, string> => {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`AI heartbeat endpoint ${endpointId} has invalid headers.`);

  return Object.fromEntries(
    Object.entries(value).map(([name, rawValue]) => {
      if (!HEADER_NAME_PATTERN.test(name)) {
        throw new Error(`AI heartbeat endpoint ${endpointId} has an invalid header name.`);
      }
      if (typeof rawValue !== 'string' || /[\r\n]/.test(rawValue)) {
        throw new Error(`AI heartbeat endpoint ${endpointId} has an invalid header value.`);
      }
      return [name, rawValue];
    })
  );
};

const readAuth = (value: unknown, endpointId: string): AiHeartbeatAuthConfig | null => {
  if (value === undefined) return null;
  if (!isRecord(value)) throw new Error(`AI heartbeat endpoint ${endpointId} has invalid auth.`);

  const header = String(value.header || 'Authorization').trim();
  const tokenEnv = String(value.tokenEnv || '').trim();
  const scheme = value.scheme === undefined ? 'Bearer' : String(value.scheme).trim();
  if (!HEADER_NAME_PATTERN.test(header) || !ENV_NAME_PATTERN.test(tokenEnv)) {
    throw new Error(`AI heartbeat endpoint ${endpointId} has invalid auth settings.`);
  }
  if (/[^\x20-\x7e]/.test(scheme)) {
    throw new Error(`AI heartbeat endpoint ${endpointId} has an invalid auth scheme.`);
  }
  return { header, tokenEnv, scheme };
};

const readAcceptedStatuses = (value: unknown, endpointId: string): number[] | null => {
  if (value === undefined) return null;
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((status) => !Number.isInteger(status) || status < 100 || status > 599)
  ) {
    throw new Error(`AI heartbeat endpoint ${endpointId} has invalid acceptedStatuses.`);
  }
  return Array.from(new Set(value as number[]));
};

export const parseAiHeartbeatEndpoints = (
  environment: Environment = process.env
): AiHeartbeatEndpointConfig[] => {
  const raw = String(environment.AI_HEARTBEAT_ENDPOINTS || '').trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI_HEARTBEAT_ENDPOINTS must be valid JSON.');
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_ENDPOINTS) {
    throw new Error(`AI_HEARTBEAT_ENDPOINTS must contain at most ${MAX_ENDPOINTS} endpoints.`);
  }

  const seenIds = new Set<string>();
  return parsed.map((value, index) => {
    if (!isRecord(value)) throw new Error(`AI heartbeat endpoint ${index + 1} is invalid.`);

    const id = String(value.id || '')
      .trim()
      .toLowerCase();
    if (!ID_PATTERN.test(id) || seenIds.has(id)) {
      throw new Error(`AI heartbeat endpoint ${index + 1} has an invalid or duplicate id.`);
    }
    seenIds.add(id);

    const label = String(value.label || id).trim();
    if (!label || label.length > 80 || /[\r\n]/.test(label)) {
      throw new Error(`AI heartbeat endpoint ${id} has an invalid label.`);
    }

    const urlValue = String(value.url || '').trim();
    let url: URL;
    try {
      url = new URL(urlValue);
    } catch {
      throw new Error(`AI heartbeat endpoint ${id} has an invalid URL.`);
    }
    const allowHttp =
      environment.NODE_ENV !== 'production' || environment.AI_HEARTBEAT_ALLOW_HTTP === 'true';
    if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
      throw new Error(`AI heartbeat endpoint ${id} must use HTTPS.`);
    }
    if (url.username || url.password || url.hash) {
      throw new Error(`AI heartbeat endpoint ${id} URL must not contain credentials or a hash.`);
    }

    const method = String(value.method || 'GET')
      .trim()
      .toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      throw new Error(`AI heartbeat endpoint ${id} only supports GET or HEAD.`);
    }

    return {
      id,
      label,
      url: url.toString(),
      method,
      timeoutMs: readBoundedInteger(value.timeoutMs, DEFAULT_TIMEOUT_MS, 500, MAX_TIMEOUT_MS),
      acceptedStatuses: readAcceptedStatuses(value.acceptedStatuses, id),
      headers: readHeaders(value.headers, id),
      auth: readAuth(value.auth, id),
    };
  });
};

const isAcceptedStatus = (endpoint: AiHeartbeatEndpointConfig, status: number): boolean =>
  endpoint.acceptedStatuses
    ? endpoint.acceptedStatuses.includes(status)
    : status >= 200 && status < 300;

export const probeAiHeartbeatEndpoint = async (
  endpoint: AiHeartbeatEndpointConfig,
  environment: Environment = process.env,
  fetchImplementation: FetchLike = fetch
): Promise<AiHeartbeatEndpointResult> => {
  const startedAt = Date.now();
  const headers = new Headers({
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.1',
    ...endpoint.headers,
  });

  if (endpoint.auth) {
    const token = String(environment[endpoint.auth.tokenEnv] || '').trim();
    if (!token) {
      return {
        id: endpoint.id,
        label: endpoint.label,
        ok: false,
        status: null,
        latencyMs: Date.now() - startedAt,
        error: 'configuration',
      };
    }
    headers.set(
      endpoint.auth.header,
      endpoint.auth.scheme ? `${endpoint.auth.scheme} ${token}` : token
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), endpoint.timeoutMs);
  try {
    const response = await fetchImplementation(endpoint.url, {
      method: endpoint.method,
      headers,
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
    const ok = isAcceptedStatus(endpoint, response.status);
    if (response.body) await response.body.cancel().catch(() => undefined);
    return {
      id: endpoint.id,
      label: endpoint.label,
      ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      ...(ok ? {} : { error: 'unexpected_status' as const }),
    };
  } catch (error) {
    const timedOut =
      controller.signal.aborted || (error as { name?: string })?.name === 'AbortError';
    return {
      id: endpoint.id,
      label: endpoint.label,
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      error: timedOut ? 'timeout' : 'network',
    };
  } finally {
    clearTimeout(timeout);
  }
};
