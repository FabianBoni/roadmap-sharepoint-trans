import { createHmac } from 'node:crypto';

const secret = String(process.env.INTERNAL_API_SECRET || '');
if (secret.length < 32) {
  throw new Error('INTERNAL_API_SECRET is missing or too short for the contextinfo smoke test.');
}

const instanceSlug = String(process.env.SP_CONTEXTINFO_SMOKE_INSTANCE || 'bdm-projekte')
  .trim()
  .toLowerCase();
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(instanceSlug)) {
  throw new Error('SP_CONTEXTINFO_SMOKE_INSTANCE is invalid.');
}

const apiPath = '/api/sharepoint/_api/contextinfo';
const target = `${apiPath}?roadmapInstance=${encodeURIComponent(instanceSlug)}`;
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
  const response = await fetch(`http://127.0.0.1:3000${target}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json;odata=nometadata',
      'x-roadmap-internal-timestamp': timestamp,
      'x-roadmap-internal-signature': signature,
    },
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
  console.log(`SharePoint contextinfo smoke test passed for ${instanceSlug}.`);
} finally {
  clearTimeout(timeout);
}
