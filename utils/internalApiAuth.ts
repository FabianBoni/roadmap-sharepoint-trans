import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextApiRequest } from 'next';

export const INTERNAL_API_TIMESTAMP_HEADER = 'x-roadmap-internal-timestamp';
export const INTERNAL_API_SIGNATURE_HEADER = 'x-roadmap-internal-signature';
const MAX_SIGNATURE_AGE_MS = 15_000;

const getInternalApiSecret = (): string | null => {
  const secret = String(process.env.INTERNAL_API_SECRET || '');
  return secret.length >= 32 ? secret : null;
};

export const canonicalizeInternalApiTarget = (value: string): string => {
  try {
    const parsed = new URL(value, 'http://internal.invalid');
    const apiIndex = parsed.pathname.indexOf('/api/');
    const pathname = apiIndex >= 0 ? parsed.pathname.slice(apiIndex) : parsed.pathname;
    return `${pathname}${parsed.search}`;
  } catch {
    return '';
  }
};

const payloadFor = (timestamp: string, method: string, target: string): string =>
  `${timestamp}.${method.toUpperCase()}.${canonicalizeInternalApiTarget(target)}`;

export const createInternalApiSignature = (
  timestamp: string,
  method: string,
  target = '',
  secret = getInternalApiSecret()
): string | null => {
  if (!secret) return null;
  return createHmac('sha256', secret)
    .update(payloadFor(timestamp, method, target))
    .digest('hex');
};

const firstHeader = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || '' : value || '';

export const isTrustedInternalApiRequest = (req: NextApiRequest): boolean => {
  const secret = getInternalApiSecret();
  if (!secret) return false;

  const timestamp = firstHeader(req.headers[INTERNAL_API_TIMESTAMP_HEADER]).trim();
  const suppliedSignature = firstHeader(req.headers[INTERNAL_API_SIGNATURE_HEADER]).trim();
  if (!/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) return false;

  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_MS) return false;

  const expected = createInternalApiSignature(
    timestamp,
    String(req.method || 'GET'),
    req.url || '',
    secret
  );
  if (!expected) return false;

  const suppliedBuffer = Buffer.from(suppliedSignature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(new Uint8Array(suppliedBuffer), new Uint8Array(expectedBuffer))
  );
};
