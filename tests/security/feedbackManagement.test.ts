import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

test('feedback management mutations are restricted to superadmins', () => {
  const managementApi = read('pages/api/feedback/[id]/index.ts');

  assert.match(managementApi, /await requireSuperAdminAccess\(req\)/);
  assert.match(managementApi, /req\.method !== 'PATCH' && req\.method !== 'DELETE'/);
  assert.doesNotMatch(managementApi, /requireAdminSession/);
});

test('completed feedback is persisted and cannot receive additional votes', () => {
  const schema = read('prisma/schema.prisma');
  const voteApi = read('pages/api/feedback/[id]/vote.ts');
  const page = read('pages/feedback.tsx');

  assert.match(schema, /status\s+String\s+@default\("OPEN"\)/);
  assert.match(schema, /completedAt\s+DateTime\?/);
  assert.match(voteApi, /existingRequest\.status === 'COMPLETED'/);
  assert.match(page, />\s*Neue Features\s*</);
  assert.match(page, /Als erledigt markieren/);
  assert.match(page, /Bearbeiten/);
  assert.match(page, /Löschen/);
});

test('development seeds include open feedback and a completed feature', () => {
  const prismaSeed = read('prisma/seed.mjs');
  const dockerSeed = read('docker/postgres/002-seed.sql');
  const dockerfile = read('docker/postgres/Dockerfile');

  for (const source of [prismaSeed, dockerSeed]) {
    assert.match(source, /Roadmap als PDF exportieren/);
    assert.match(source, /Direkter Excel-Export der Roadmap/);
    assert.match(source, /COMPLETED/);
  }
  assert.match(dockerfile, /20260828120000_add_feedback_completion\/migration\.sql/);
  assert.match(dockerfile, /004-seed\.sql/);
});
