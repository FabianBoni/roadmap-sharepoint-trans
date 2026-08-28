import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMirrorTargetGroups,
  removeBadgeCaseInsensitive,
  toggleBadgeCaseInsensitive,
} from '../../utils/projectBadgeUi';

test('mirror targets hide the current roadmap and group duplicate routing badges', () => {
  const groups = buildMirrorTargetGroups(
    [
      { slug: 'source', displayName: 'Source', badge: 'source-badge' },
      { slug: 'finance', displayName: 'Finance', badge: 'shared-target' },
      { slug: 'hr', displayName: 'HR', badge: 'SHARED-TARGET' },
      { slug: 'it', displayName: 'IT', badge: 'it-target' },
    ],
    'source'
  );

  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((group) => ({
      badge: group.badge,
      targets: group.targets.map((target) => target.slug),
    })),
    [
      { badge: 'shared-target', targets: ['finance', 'hr'] },
      { badge: 'it-target', targets: ['it'] },
    ]
  );
});

test('mirror target chips toggle and remove badges case-insensitively', () => {
  assert.deepEqual(toggleBadgeCaseInsensitive(['Pilot'], 'roadmap-finance'), [
    'Pilot',
    'roadmap-finance',
  ]);
  assert.deepEqual(toggleBadgeCaseInsensitive(['Pilot', 'Roadmap-Finance'], 'roadmap-finance'), [
    'Pilot',
  ]);
  assert.deepEqual(removeBadgeCaseInsensitive(['KI', 'Priorität'], 'ki'), ['Priorität']);
});
