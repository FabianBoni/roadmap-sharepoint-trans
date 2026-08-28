import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInstanceBadgeOptions } from '../../pages/api/instances/slugs';

test('all configured instance badges are exposed independently of instance access filtering', () => {
  const badgeOptions = buildInstanceBadgeOptions([
    {
      slug: 'visible-roadmap',
      displayName: 'Visible Roadmap',
      settingsJson: JSON.stringify({ metadata: { instanceBadge: 'roadmap-visible' } }),
    },
    {
      slug: 'restricted-roadmap',
      displayName: 'Restricted Roadmap',
      settingsJson: JSON.stringify({ metadata: { instanceBadge: 'roadmap-restricted' } }),
    },
    {
      slug: 'without-badge',
      displayName: 'Without Badge',
      settingsJson: JSON.stringify({ metadata: {} }),
    },
  ]);

  assert.deepEqual(badgeOptions, [
    {
      slug: 'visible-roadmap',
      displayName: 'Visible Roadmap',
      badge: 'roadmap-visible',
    },
    {
      slug: 'restricted-roadmap',
      displayName: 'Restricted Roadmap',
      badge: 'roadmap-restricted',
    },
  ]);
});

test('legacy instance badge metadata remains available in the complete badge list', () => {
  const badgeOptions = buildInstanceBadgeOptions([
    {
      slug: 'legacy-roadmap',
      displayName: null,
      settingsJson: JSON.stringify({ metadata: { mirroring: { badge: 'legacy-badge' } } }),
    },
  ]);

  assert.deepEqual(badgeOptions, [
    {
      slug: 'legacy-roadmap',
      displayName: 'legacy-roadmap',
      badge: 'legacy-badge',
    },
  ]);
});
