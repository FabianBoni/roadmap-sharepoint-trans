const normalizeInternalBaseUrl = (raw: string): string => {
  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('INTERNAL_API_BASE_URL must use http or https');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('INTERNAL_API_BASE_URL must not contain credentials, query, or fragment');
  }
  return parsed.toString().replace(/\/$/, '');
};

export const getInternalApiBaseUrl = (): string => {
  const configured = process.env.INTERNAL_API_BASE_URL?.trim();
  if (configured) return normalizeInternalBaseUrl(configured);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('INTERNAL_API_BASE_URL is required in production');
  }
  const port = /^\d{1,5}$/.test(process.env.PORT || '') ? process.env.PORT : '3000';
  return `http://127.0.0.1:${port}`;
};
