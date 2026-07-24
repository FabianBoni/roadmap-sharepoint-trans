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

test('production deployment maps standalone application and malware scanner secrets', () => {
  const workflow = read('.github/workflows/deploy.yml');
  for (const secret of ['APP_ORIGIN', 'CLAMAV_HOST', 'CLAMAV_PORT', 'CLAMAV_TIMEOUT_MS']) {
    assert.match(workflow, new RegExp(`${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`), secret);
    assert.match(workflow, new RegExp(`'${secret}'`), `${secret} runtime override`);
  }
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
