import { createHmac } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const secret = String(process.env.INTERNAL_API_SECRET || '');
if (secret.length < 32) {
  throw new Error('INTERNAL_API_SECRET is missing or too short for the People Picker smoke test.');
}

const instanceSlug = String(process.env.SP_PEOPLE_PICKER_SMOKE_INSTANCE || 'sanitaet')
  .trim()
  .toLowerCase();
const query = String(process.env.SP_PEOPLE_PICKER_SMOKE_QUERY || 'fabian').trim();
const hasConfiguredSite = Boolean(String(process.env.SP_PEOPLE_PICKER_SITE_URL || '').trim());
const expectedSource = hasConfiguredSite
  ? 'configured-site'
  : String(process.env.SP_PEOPLE_PICKER_INSTANCE_SLUG || '')
      .trim()
      .toLowerCase();
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(instanceSlug)) {
  throw new Error('SP_PEOPLE_PICKER_SMOKE_INSTANCE is invalid.');
}
if (query.length < 2 || query.length > 100) {
  throw new Error('SP_PEOPLE_PICKER_SMOKE_QUERY must contain 2 to 100 characters.');
}
if (expectedSource && !/^[a-z0-9][a-z0-9-]{0,62}$/.test(expectedSource)) {
  throw new Error('SP_PEOPLE_PICKER_INSTANCE_SLUG is invalid.');
}

const apiPath =
  '/api/sharepoint/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser';
const search = new URLSearchParams({
  sharePointDirectory: 'global',
  roadmapInstance: instanceSlug,
});
const target = `${apiPath}?${search}`;
const timestamp = String(Date.now());
const signature = createHmac('sha256', secret).update(`${timestamp}.POST.${target}`).digest('hex');

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

const parseEntities = (payload) => {
  const raw =
    payload?.d?.ClientPeoplePickerSearchUser ??
    payload?.ClientPeoplePickerSearchUser ??
    payload?.value ??
    payload;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

try {
  const response = await fetch(`http://127.0.0.1:3000${target}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose',
      'x-roadmap-internal-timestamp': timestamp,
      'x-roadmap-internal-signature': signature,
    },
    body: JSON.stringify({
      queryParams: {
        AllowEmailAddresses: true,
        AllowMultipleEntities: false,
        AllUrlZones: true,
        MaximumEntitySuggestions: 20,
        PrincipalSource: 15,
        PrincipalType: 1,
        QueryString: query,
      },
    }),
    signal: controller.signal,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const safeError =
      payload && typeof payload.error === 'string' ? payload.error : 'SharePoint request failed';
    throw new Error(`People Picker smoke test returned HTTP ${response.status}: ${safeError}`);
  }

  const context = response.headers.get('x-sharepoint-people-picker-context');
  if (context !== 'global') {
    throw new Error(`People Picker smoke test used unexpected context: ${context || 'missing'}`);
  }
  const source = response.headers.get('x-sharepoint-people-picker-source');
  if (!source || (expectedSource && source !== expectedSource)) {
    throw new Error(
      `People Picker smoke test used unexpected source: ${source || 'missing'} (expected ${expectedSource || 'configured source'}).`
    );
  }

  const entities = parseEntities(payload).filter(
    (entity) => entity && typeof entity === 'object' && String(entity.DisplayText || '').trim()
  );
  if (entities.length === 0) {
    throw new Error('People Picker smoke test returned no named users.');
  }

  // eslint-disable-next-line no-console
  console.log(
    `People Picker smoke test passed for ${instanceSlug}: ${entities.length} result(s), context=${context}, source=${source}.`
  );
} finally {
  clearTimeout(timeout);
}
