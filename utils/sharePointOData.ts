type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getCollection = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return null;

  if (Array.isArray(payload.value)) return payload.value;
  if (Array.isArray(payload.d)) return payload.d;
  if (isObject(payload.d) && Array.isArray(payload.d.results)) return payload.d.results;

  return null;
};

/**
 * Converts the OData envelopes used by different SharePoint versions to the
 * shape requested by the proxy client. Single verbose entities become flat in
 * nometadata mode; collections use `value` (nometadata) or `d.results` (verbose).
 */
export function normalizeSharePointODataPayload(
  payload: unknown,
  wantsNoMetadata: boolean
): unknown {
  if (wantsNoMetadata && isObject(payload)) {
    if (Array.isArray(payload.value)) return payload;
    if (isObject(payload.GetContextWebInformation)) {
      return payload.GetContextWebInformation;
    }
    if (isObject(payload.d) && isObject(payload.d.GetContextWebInformation)) {
      return payload.d.GetContextWebInformation;
    }
  }

  if (
    !wantsNoMetadata &&
    isObject(payload) &&
    isObject(payload.d) &&
    Array.isArray(payload.d.results)
  ) {
    return payload;
  }

  const collection = getCollection(payload);
  if (collection) {
    return wantsNoMetadata ? { value: collection } : { d: { results: collection } };
  }

  if (wantsNoMetadata && isObject(payload) && isObject(payload.d)) {
    return payload.d;
  }

  return payload;
}

const findDigestContainer = (payload: unknown): JsonObject | null => {
  if (!isObject(payload)) return null;
  if (typeof payload.FormDigestValue === 'string') return payload;

  const directCandidates = [payload.GetContextWebInformation, payload.d];
  for (const candidate of directCandidates) {
    if (!isObject(candidate)) continue;
    if (typeof candidate.FormDigestValue === 'string') return candidate;
    if (
      isObject(candidate.GetContextWebInformation) &&
      typeof candidate.GetContextWebInformation.FormDigestValue === 'string'
    ) {
      return candidate.GetContextWebInformation;
    }
    if (Array.isArray(candidate.results)) {
      const found = candidate.results.find(
        (entry) => isObject(entry) && typeof entry.FormDigestValue === 'string'
      );
      if (isObject(found)) return found;
    }
  }

  if (Array.isArray(payload.value)) {
    const found = payload.value.find(
      (entry) => isObject(entry) && typeof entry.FormDigestValue === 'string'
    );
    if (isObject(found)) return found;
  }

  return null;
};

export interface SharePointDigestInfo {
  value: string;
  timeoutSeconds: number;
}

export interface SharePointWriteFailure {
  reason: 'invalid-status' | 'redirect' | 'http-error' | 'error-payload';
  upstreamStatus: number;
}

/** Only real HTTP authentication statuses may trigger an authentication fallback. */
export function getSharePointAuthFailureStatus(upstreamStatus: number): 401 | 403 | null {
  if (upstreamStatus === 401 || upstreamStatus === 403) return upstreamStatus;
  return null;
}

const containsODataError = (payload: unknown): boolean => {
  if (typeof payload === 'string') {
    const value = payload.trim();
    return (
      /<(?:m:)?error(?:\s|>)/i.test(value) ||
      /"(?:odata\.)?error"\s*:/i.test(value) ||
      (/<html/i.test(value) && /(login|sign[ -]?in|authenticate)/i.test(value))
    );
  }
  if (!isObject(payload)) return false;
  if (payload.error != null || payload['odata.error'] != null) return true;
  return isObject(payload.d) && (payload.d.error != null || payload.d['odata.error'] != null);
};

/**
 * Classifies upstream write responses before the proxy turns them into a local
 * response. Redirects, malformed status markers and OData errors in a 2xx body
 * must not be reported as successful mutations.
 */
export function getSharePointWriteFailure(
  upstreamStatus: number,
  payload: unknown
): SharePointWriteFailure | null {
  if (!Number.isInteger(upstreamStatus) || upstreamStatus < 100) {
    return { reason: 'invalid-status', upstreamStatus };
  }
  if (upstreamStatus >= 300 && upstreamStatus < 400) {
    return { reason: 'redirect', upstreamStatus };
  }
  if (upstreamStatus < 200 || upstreamStatus >= 400) {
    return { reason: 'http-error', upstreamStatus };
  }
  if (containsODataError(payload)) {
    return { reason: 'error-payload', upstreamStatus };
  }
  return null;
}

/** Extracts contextinfo from flat, verbose and collection-style OData envelopes. */
export function extractSharePointDigest(payload: unknown): SharePointDigestInfo | null {
  const container = findDigestContainer(payload);
  if (!container) return null;

  const value = String(container.FormDigestValue || '').trim();
  if (!value) return null;

  const parsedTimeout = Number(container.FormDigestTimeoutSeconds);
  return {
    value,
    timeoutSeconds: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 1800,
  };
}

/** Curl can occasionally omit its appended status marker while retaining a valid contextinfo body. */
export function isUsableSharePointContextInfoResponse(
  upstreamStatus: number,
  payload: unknown
): boolean {
  const statusIsUsable = upstreamStatus === 0 || (upstreamStatus >= 200 && upstreamStatus < 300);
  return statusIsUsable && Boolean(extractSharePointDigest(payload));
}

/** Returns a curl/fetch-safe incoming digest header, or null for malformed input. */
export function getSafeRequestDigest(header: string | string[] | undefined): string | null {
  const candidate = Array.isArray(header) ? header[0] : header;
  if (typeof candidate !== 'string') return null;

  const value = candidate.trim();
  if (!value || value.length > 16_384 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}
