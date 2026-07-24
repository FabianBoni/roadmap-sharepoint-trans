import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const specPath = resolve(root, 'docs/SSO_PORTING_SPEC.md');
const spec = readFileSync(specPath, 'utf8');

test('SSO porting specification covers the implementation and security contract', () => {
  for (const requiredSection of [
    '## 3. Externe Microsoft-Entra-Konfiguration',
    '## 6. Verbindliche Datenverträge',
    '## 8. Exakter Login-Flow',
    '## 10. Session-Verifikation und CSRF',
    '## 11. Authentifizierung ist nicht Autorisierung',
    '## 15. Portierungsreihenfolge',
    '## 17. Verbindliche Testmatrix',
    '## 20. Abschlusskriterien für eine implementierende KI',
  ]) {
    assert.ok(spec.includes(requiredSection), requiredSection);
  }

  for (const invariant of [
    'Authorization Code Flow mit PKCE',
    '`HttpOnly`-Cookie',
    '`SameSite=Lax`',
    '`RS256`',
    '`requireUserSession(req)`',
    '`requireSuperAdminAccess(req)`',
    '`isAdmin: false`',
  ]) {
    assert.ok(spec.includes(invariant), invariant);
  }
});

test('SSO specification links point to existing repository paths', () => {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of spec.matchAll(linkPattern)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    const decodedTarget = decodeURIComponent(target);
    assert.equal(
      existsSync(resolve(dirname(specPath), decodedTarget)),
      true,
      `Missing documentation target: ${target}`
    );
  }
});

test('documented SSO invariants are present in the current implementation', () => {
  const login = readFileSync(resolve(root, 'pages/api/auth/entra/login.ts'), 'utf8');
  const callback = readFileSync(resolve(root, 'pages/api/auth/entra/callback.ts'), 'utf8');
  const apiAuth = readFileSync(resolve(root, 'utils/apiAuth.ts'), 'utf8');
  const sessionSecurity = readFileSync(resolve(root, 'utils/sessionSecurity.ts'), 'utf8');

  for (const cookieName of [
    'entra_state',
    'entra_nonce',
    'entra_pkce_verifier',
    'entra_return_url',
    'entra_popup',
  ]) {
    assert.ok(login.includes(`'${cookieName}'`), cookieName);
  }

  assert.match(callback, /validateEntraIdToken\s*\(/);
  assert.match(callback, /fetchGraphMe\s*\(/);
  assert.match(callback, /fetchGraphMyGroupDisplayNames\s*\(/);
  assert.match(callback, /isAdmin:\s*false/);
  assert.match(callback, /httpOnly:\s*true/);
  assert.match(apiAuth, /if \(!hasBearer && !isSafeCookieRequest\(req\)\) return null/);
  assert.match(sessionSecurity, /MIN_SECRET_LENGTH = 32/);
});
