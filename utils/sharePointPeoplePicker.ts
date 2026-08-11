type PeoplePickerRecord = Record<string, unknown>;

export type SharePointSiteUserMatch = {
  id: string;
  displayName: string;
  email: string;
  loginName: string;
};

export type SharePointPeoplePickerRequest = {
  queryParams: {
    AllowEmailAddresses: boolean;
    AllowMultipleEntities: boolean;
    AllUrlZones: boolean;
    MaximumEntitySuggestions: number;
    PrincipalSource: number;
    PrincipalType: number;
    QueryString: string;
  };
};

const isRecord = (value: unknown): value is PeoplePickerRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const buildSharePointPeoplePickerRequest = (
  query: string
): SharePointPeoplePickerRequest => ({
  queryParams: {
    AllowEmailAddresses: true,
    AllowMultipleEntities: false,
    AllUrlZones: false,
    MaximumEntitySuggestions: 20,
    PrincipalSource: 15,
    PrincipalType: 1,
    QueryString: query,
  },
});

const parseValue = (value: unknown, depth: number): PeoplePickerRecord[] | null => {
  if (depth > 4) return null;

  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (typeof value === 'string') {
    const trimmed = value.replace(/^\uFEFF/, '').trim();
    if (!trimmed) return [];

    try {
      return parseValue(JSON.parse(trimmed), depth + 1);
    } catch {
      return null;
    }
  }

  if (!isRecord(value)) return null;

  for (const candidate of [value.ClientPeoplePickerSearchUser, value.value, value.d]) {
    if (candidate === undefined || candidate === null) continue;
    const parsed = parseValue(candidate, depth + 1);
    if (parsed !== null) return parsed;
  }

  return null;
};

/**
 * SharePoint returns People Picker results in different OData envelopes:
 * verbose (`d.ClientPeoplePickerSearchUser`), minimal/no-metadata (`value`),
 * or, through some proxies, as a directly encoded JSON string.
 */
export const parseSharePointPeoplePickerResponse = (value: unknown): PeoplePickerRecord[] | null =>
  parseValue(value, 0);

const readString = (record: PeoplePickerRecord, key: string): string => {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeDisplayName = (value: string): string => {
  if (!value.includes(',')) return value;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : value;
};

/**
 * Some SharePoint web applications return no tenant-wide People Picker matches
 * even though the user is already known to the current site collection. Search
 * those site users locally as a bounded fallback.
 */
export const searchSharePointSiteUsers = (
  records: PeoplePickerRecord[],
  query: string,
  maximumSuggestions = 20
): SharePointSiteUserMatch[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2 || maximumSuggestions <= 0) return [];

  const matches = new Map<string, SharePointSiteUserMatch>();
  for (const record of records) {
    const principalType = record.PrincipalType;
    if (principalType !== undefined && Number(principalType) !== 1) continue;

    const title = readString(record, 'Title');
    const email = readString(record, 'Email');
    const loginName = readString(record, 'LoginName');
    if (![title, email, loginName].some((value) => value.toLowerCase().includes(normalizedQuery))) {
      continue;
    }

    const displayName = normalizeDisplayName(title || email || loginName);
    if (!displayName) continue;
    const idValue = record.Id;
    const id = idValue === undefined || idValue === null ? '' : String(idValue);
    const key = (email || loginName || id || displayName).toLowerCase();
    if (!matches.has(key)) {
      matches.set(key, { id, displayName, email, loginName });
    }
    if (matches.size >= maximumSuggestions) break;
  }

  return Array.from(matches.values());
};
