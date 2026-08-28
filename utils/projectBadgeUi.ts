import type { InstanceBadgeOption } from '@/types';

export type MirrorTargetGroup = {
  badge: string;
  targets: InstanceBadgeOption[];
};

const normalize = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase();

export const buildMirrorTargetGroups = (
  options: InstanceBadgeOption[],
  currentInstanceSlug?: string | null
): MirrorTargetGroup[] => {
  const currentSlug = normalize(currentInstanceSlug);
  const groups = new Map<string, MirrorTargetGroup>();

  for (const option of options) {
    if (normalize(option.slug) === currentSlug) continue;
    const key = normalize(option.badge);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) existing.targets.push(option);
    else groups.set(key, { badge: option.badge.trim(), targets: [option] });
  }

  return Array.from(groups.values());
};

export const removeBadgeCaseInsensitive = (badges: string[], badgeToRemove: string): string[] => {
  const key = normalize(badgeToRemove);
  return badges.filter((badge) => normalize(badge) !== key);
};

export const toggleBadgeCaseInsensitive = (badges: string[], badgeToToggle: string): string[] => {
  const normalized = String(badgeToToggle || '').trim();
  if (!normalized) return badges;
  const selected = badges.some((badge) => normalize(badge) === normalize(normalized));
  return selected ? removeBadgeCaseInsensitive(badges, normalized) : [...badges, normalized];
};
