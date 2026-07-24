const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const TENANT_OBJECT_ID = new RegExp(`^${UUID}:${UUID}$`, 'i');

export const normalizeAuthorizationIdentifier = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  const pipeParts = normalized
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  return pipeParts.length > 1 ? pipeParts[pipeParts.length - 1] : normalized;
};

export const isStableAuthorizationIdentifier = (value: unknown): boolean => {
  const normalized = normalizeAuthorizationIdentifier(value);
  if (!normalized || normalized.length > 320) return false;
  if (TENANT_OBJECT_ID.test(normalized)) return true;
  if (/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(normalized)) return true;
  if (/^[^\\\s]+\\[^\\\s]+$/.test(normalized)) return true;
  return false;
};
