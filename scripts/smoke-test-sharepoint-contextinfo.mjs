import { createHmac } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const secret = String(process.env.INTERNAL_API_SECRET || '');
if (secret.length < 32) {
  throw new Error('INTERNAL_API_SECRET is missing or too short for the contextinfo smoke test.');
}

const configuredSlug = String(process.env.SP_CONTEXTINFO_SMOKE_INSTANCE || '')
  .trim()
  .toLowerCase();
if (configuredSlug && !/^[a-z0-9][a-z0-9-]{0,62}$/.test(configuredSlug)) {
  throw new Error('SP_CONTEXTINFO_SMOKE_INSTANCE is invalid.');
}

const apiPath = '/api/sharepoint/_api/contextinfo';
const prisma = new PrismaClient();

const findDigest = (payload) => {
  const candidates = [
    payload,
    payload?.d,
    payload?.GetContextWebInformation,
    payload?.d?.GetContextWebInformation,
  ];
  return candidates.some(
    (candidate) =>
      candidate &&
      typeof candidate.FormDigestValue === 'string' &&
      candidate.FormDigestValue.length > 0
  );
};

const getInstanceSlugs = async () => {
  if (configuredSlug) return [configuredSlug];
  const instances = await prisma.roadmapInstance.findMany({
    orderBy: { slug: 'asc' },
    select: { slug: true },
  });
  if (instances.length === 0)
    throw new Error('No roadmap instances exist for the contextinfo test.');
  return instances.map(({ slug }) => slug);
};

const verifyInstance = async (instanceSlug) => {
  const target = `${apiPath}?roadmapInstance=${encodeURIComponent(instanceSlug)}`;
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.POST.${target}`)
    .digest('hex');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`http://127.0.0.1:3000${target}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=nometadata',
        'x-roadmap-instance': instanceSlug,
        'x-roadmap-internal-timestamp': timestamp,
        'x-roadmap-internal-signature': signature,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const upstream = Number.isFinite(Number(payload?.upstreamStatus))
        ? ` upstream=${Number(payload.upstreamStatus)}`
        : '';
      const reason =
        typeof payload?.reason === 'string' && payload.reason ? ` reason=${payload.reason}` : '';
      throw new Error(
        `Contextinfo for ${instanceSlug} returned HTTP ${response.status}.${upstream}${reason}`
      );
    }
    if (!findDigest(payload)) {
      throw new Error(`Contextinfo for ${instanceSlug} returned no valid digest.`);
    }
    // eslint-disable-next-line no-console
    console.log(`SharePoint contextinfo smoke test passed for ${instanceSlug}.`);
  } finally {
    clearTimeout(timeout);
  }
};

try {
  const instanceSlugs = await getInstanceSlugs();
  for (const instanceSlug of instanceSlugs) await verifyInstance(instanceSlug);
} finally {
  await prisma.$disconnect();
}
