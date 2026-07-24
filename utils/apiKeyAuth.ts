import crypto from 'crypto';
import type { NextApiRequest } from 'next';

const parseKeys = (raw: string | undefined): string[] =>
  (raw || '')
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length >= 32);

const digest = (value: string): Buffer => crypto.createHash('sha256').update(value).digest();

export const getConfiguredPublicApiKeys = (): string[] => [
  ...parseKeys(process.env.PUBLIC_PROJECTS_API_KEYS),
  ...parseKeys(process.env.ROADMAP_API_KEY),
];

export const extractHeaderApiKey = (req: NextApiRequest): string | null => {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
};

export const isConfiguredApiKey = (candidate: string | null, configured: string[]): boolean => {
  if (!candidate || configured.length === 0) return false;
  const candidateDigest = digest(candidate);
  let match = false;
  for (const key of configured) {
    match =
      crypto.timingSafeEqual(new Uint8Array(candidateDigest), new Uint8Array(digest(key))) || match;
  }
  return match;
};
