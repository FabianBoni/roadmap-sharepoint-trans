type PeoplePickerRecord = Record<string, unknown>;

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
    AllUrlZones: true,
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
