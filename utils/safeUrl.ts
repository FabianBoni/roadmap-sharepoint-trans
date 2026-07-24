const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);
const MAX_EXTERNAL_URL_LENGTH = 2048;

export class UnsafeExternalUrlError extends Error {
  constructor() {
    super('Project links must use http, https or mailto');
    this.name = 'UnsafeExternalUrlError';
  }
}

export const normalizeAllowedExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EXTERNAL_URL_LENGTH) return null;

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol.toLowerCase())) return null;
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname)
      return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.protocol === 'mailto:' && !parsed.pathname.includes('@')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const requireAllowedExternalUrl = (value: unknown): string => {
  const normalized = normalizeAllowedExternalUrl(value);
  if (!normalized) throw new UnsafeExternalUrlError();
  return normalized;
};
