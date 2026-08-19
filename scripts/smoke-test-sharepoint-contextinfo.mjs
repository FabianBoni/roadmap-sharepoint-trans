import { createHmac } from 'node:crypto';

const secret = String(process.env.INTERNAL_API_SECRET || '');
if (secret.length < 32) {
  throw new Error('INTERNAL_API_SECRET is missing or too short for the contextinfo smoke test.');
}

const instanceSlug = String(process.env.SP_CONTEXTINFO_SMOKE_INSTANCE || '')
  .trim()
  .toLowerCase();
if (instanceSlug && !/^[a-z0-9][a-z0-9-]{0,62}$/.test(instanceSlug)) {
  throw new Error('SP_CONTEXTINFO_SMOKE_INSTANCE is invalid.');
}
const instanceHost = String(process.env.SP_CONTEXTINFO_SMOKE_HOST || 'roadmap.bs.ch')
  .trim()
  .toLowerCase();
if (!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(instanceHost)) {
  throw new Error('SP_CONTEXTINFO_SMOKE_HOST is invalid.');
}

const apiPath = '/api/sharepoint/_api/contextinfo';
const target = instanceSlug
  ? `${apiPath}?roadmapInstance=${encodeURIComponent(instanceSlug)}`
  : apiPath;
const timestamp = String(Date.now());
const signature = createHmac('sha256', secret).update(`${timestamp}.POST.${target}`).digest('hex');

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

const findDigest = (payload) => {
  const candidates = [
    payload,
    payload?.d,
    payload?.GetContextWebInformation,
    payload?.d?.GetContextWebInformation,
  ];
  return candidates.find((candidate) => candidate && typeof candidate.FormDigestValue === 'string');
};

try {
  const headers = {
    Accept: 'application/json;odata=nometadata',
    'x-forwarded-host': instanceHost,
    'x-roadmap-internal-timestamp': timestamp,
    'x-roadmap-internal-signature': signature,
  };
  if (instanceSlug) headers['x-roadmap-instance'] = instanceSlug;

  const response = await fetch(`http://127.0.0.1:3000${target}`, {
    method: 'POST',
    headers,
    signal: controller.signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = typeof payload?.reason === 'string' ? ` reason=${payload.reason}` : '';
    const upstream = Number.isFinite(Number(payload?.upstreamStatus))
      ? ` upstream=${Number(payload.upstreamStatus)}`
      : '';
    throw new Error(`Contextinfo returned HTTP ${response.status}.${upstream}${reason}`);
  }
  if (!findDigest(payload)) throw new Error('Contextinfo returned no valid digest.');
  // eslint-disable-next-line no-console
  console.log(
    `SharePoint contextinfo smoke test passed for ${instanceSlug || `host ${instanceHost}`}.`
  );
} finally {
  clearTimeout(timeout);
}
