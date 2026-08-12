import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

test('untrusted branch builds use an isolated runner without deployment secrets', () => {
  const workflow = read('.github/workflows/branch-build.yml');
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.doesNotMatch(workflow, /self-hosted|secrets\.|sudo|\bpm2\b/i);
  assert.doesNotMatch(workflow, /deploy|SP_KERBEROS_SERVICE_PASSWORD/i);
});

test('deployment is scoped to the protected production environment and a non-root app user', () => {
  const workflow = read('.github/workflows/deploy.yml');
  assert.match(workflow, /branches: \['main'\]/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /test "\$\(id -un\)" = 'roadmap'/);
  assert.match(workflow, /Deployment refuses to run as root/);
  assert.match(workflow, /working-directory: \$\{\{ github\.workspace \}\}\/source/);
  assert.match(workflow, /path: source/);
  assert.doesNotMatch(workflow, /\bsudo\b|--accept-data-loss|PM2_RUN_AS_USER: root/);
});

test('production PM2 service survives self-hosted runner process cleanup', () => {
  const workflow = read('.github/workflows/deploy.yml');
  assert.match(
    workflow,
    /- name: Restart only the roadmap service[\s\S]*?RUNNER_TRACKING_ID: ''[\s\S]*?pm2 startOrRestart/
  );
});

test('production deployment verifies the global SharePoint People Picker after restart', () => {
  const workflow = read('.github/workflows/deploy.yml');
  const smokeTest = read('scripts/smoke-test-sharepoint-people-picker.mjs');
  assert.match(
    workflow,
    /- name: Verify local readiness[\s\S]*?- name: Verify SharePoint People Picker[\s\S]*?yarn smoke:people-picker/
  );
  assert.match(smokeTest, /sharePointDirectory: 'global'/);
  assert.match(smokeTest, /roadmapInstance: instanceSlug/);
  assert.match(smokeTest, /x-sharepoint-people-picker-source/);
  assert.match(
    workflow,
    /SP_PEOPLE_PICKER_INSTANCE_SLUG: \$\{\{ vars\.SP_PEOPLE_PICKER_INSTANCE_SLUG \}\}/
  );
  assert.match(workflow, /'SP_PEOPLE_PICKER_INSTANCE_SLUG'/);
  assert.match(smokeTest, /x-roadmap-internal-signature/);
  assert.match(smokeTest, /People Picker smoke test returned no named users/);
});

test('production deployment maps every SSO GitHub Environment secret explicitly', () => {
  const workflow = read('.github/workflows/deploy.yml');
  for (const secret of [
    'ENTRA_TENANT_ID',
    'ENTRA_CLIENT_ID',
    'ENTRA_CLIENT_SECRET',
    'ENTRA_REDIRECT_URI',
    'ENTRA_POST_LOGOUT_REDIRECT_URI',
    'JWT_SECRET',
  ]) {
    assert.match(workflow, new RegExp(`${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`), secret);
    assert.match(workflow, new RegExp(`'${secret}'`), `${secret} runtime override`);
  }
});

test('production deployment maps standalone runtime and malware scanner secrets', () => {
  const workflow = read('.github/workflows/deploy.yml');
  for (const secret of [
    'APP_ORIGIN',
    'DATABASE_URL',
    'INTERNAL_API_BASE_URL',
    'CLAMAV_HOST',
    'CLAMAV_PORT',
    'CLAMAV_TIMEOUT_MS',
  ]) {
    assert.match(workflow, new RegExp(`${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`), secret);
    assert.match(workflow, new RegExp(`'${secret}'`), `${secret} runtime override`);
  }
});

test('database schema, baseline and deployment target PostgreSQL only', () => {
  const schema = read('prisma/schema.prisma');
  const lock = read('prisma/migrations/migration_lock.toml');
  const migration = read('prisma/migrations/20260724130000_postgresql_baseline/migration.sql');
  const workflow = read('.github/workflows/deploy.yml');
  const superadmins = read('pages/api/superadmins/index.ts');
  const superAdminAccess = read('utils/superAdminAccessServer.ts');

  assert.match(schema, /provider\s*=\s*"postgresql"/);
  assert.match(lock, /provider\s*=\s*"postgresql"/);
  assert.match(migration, /"id" SERIAL NOT NULL/);
  assert.match(migration, /ADD CONSTRAINT "SupportMessage_conversationId_fkey"/);
  assert.doesNotMatch(migration, /PRAGMA|AUTOINCREMENT|\bDATETIME\b/);
  assert.match(workflow, /\['postgres:', 'postgresql:'\]/);
  assert.match(workflow, /Production PostgreSQL requires a database host/);
  assert.doesNotMatch(workflow, /must run locally|127\.0\.0\.1.*localhost/);
  assert.doesNotMatch(workflow, /Production SQLite|file:\.\//);
  assert.doesNotMatch(superadmins, /isActive \? 1 : 0/);
  assert.match(superAdminAccess, /WHERE "isActive" IS TRUE/);
  assert.doesNotMatch(superAdminAccess, /"isActive"\s*=\s*[01]\b/);
});

test('deployment normalizes one database URL for migrations, verification and PM2', () => {
  const workflow = read('.github/workflows/deploy.yml');
  assert.match(
    workflow,
    /- name: Align Prisma target schema[\s\S]*?DATABASE_URL: \$\{\{ secrets\.DATABASE_URL \}\}[\s\S]*?schema=\$\{encodeURIComponent\(targetSchema\)\}[\s\S]*?process\.env\.GITHUB_ENV/
  );
  assert.match(
    workflow,
    /- name: Inspect PostgreSQL migration access[\s\S]*?'_prisma_migrations'[\s\S]*?'AuthSession'/
  );
  assert.match(workflow, /- name: Verify PostgreSQL schema[\s\S]*?'AuthSession'/);
  assert.match(workflow, /PostgreSQL schema is incomplete/);
  assert.match(workflow, /- name: Restart only the roadmap service[\s\S]*?pm2 startOrRestart/);
});

test('mirror publishes a history-free snapshot and never mirrors historical refs', () => {
  const workflow = read('.github/workflows/mirror.yml');
  assert.match(workflow, /git archive HEAD/);
  assert.match(workflow, /sanitized-snapshot/);
  assert.doesNotMatch(workflow, /git push --mirror|filter-branch/);
});

test('third-party actions are pinned to immutable commit hashes', () => {
  for (const path of [
    '.github/workflows/branch-build.yml',
    '.github/workflows/deploy.yml',
    '.github/workflows/mirror.yml',
    '.github/workflows/security.yml',
  ]) {
    const workflow = read(path);
    for (const line of workflow.split(/\r?\n/).filter((value) => /\buses:/.test(value))) {
      assert.match(line, /uses:\s+[^@]+@[a-f0-9]{40}\b/, `${path}: ${line}`);
    }
  }
});
