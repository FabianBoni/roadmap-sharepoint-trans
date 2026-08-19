import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import type { NextApiRequest } from 'next';
import {
  createInternalApiSignature,
  INTERNAL_API_SIGNATURE_HEADER,
  INTERNAL_API_TIMESTAMP_HEADER,
  isTrustedInternalApiRequest,
} from '../../utils/internalApiAuth';
import { normalizeAllowedExternalUrl } from '../../utils/safeUrl';
import { escapeODataStringLiteral } from '../../utils/odata';
import {
  isStableAuthorizationIdentifier,
  normalizeAuthorizationIdentifier,
} from '../../utils/authorizationIdentity';
import { assertGlobalTlsPolicy, assertSubmittedTlsPolicy } from '../../utils/tlsPolicy';
import { isAllowedPath } from '../../pages/api/sharepoint/[...sp]';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const withEnv = (values: Record<string, string | undefined>, run: () => void) => {
  const original = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('internal API signatures bind timestamp, method and exact target', () => {
  withEnv({ INTERNAL_API_SECRET: 's'.repeat(48) }, () => {
    const timestamp = String(Date.now());
    const target = '/api/sharepoint/_api/web?roadmapInstance=finance';
    const signature = createInternalApiSignature(timestamp, 'GET', target);
    assert.ok(signature);
    const request = {
      method: 'GET',
      url: target,
      headers: {
        [INTERNAL_API_TIMESTAMP_HEADER]: timestamp,
        [INTERNAL_API_SIGNATURE_HEADER]: signature,
      },
    } as unknown as NextApiRequest;
    assert.equal(isTrustedInternalApiRequest(request), true);
    request.url = '/api/sharepoint/_api/web/lists?roadmapInstance=finance';
    assert.equal(isTrustedInternalApiRequest(request), false);
  });
});

test('internal API authentication requires a dedicated secret', () => {
  withEnv({ INTERNAL_API_SECRET: undefined, JWT_SECRET: 'j'.repeat(48) }, () =>
    assert.equal(createInternalApiSignature(String(Date.now()), 'GET', '/api/sharepoint'), null)
  );
});

test('project links reject executable, embedded and relative URL schemes', () => {
  for (const unsafe of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example/path',
    '/relative/path',
    'https://user:password@example.com/',
  ]) {
    assert.equal(normalizeAllowedExternalUrl(unsafe), null, unsafe);
  }
  assert.equal(normalizeAllowedExternalUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(
    normalizeAllowedExternalUrl('mailto:security@example.com'),
    'mailto:security@example.com'
  );
});

test('authorization identifiers require globally exact identities', () => {
  assert.equal(isStableAuthorizationIdentifier('alice'), false);
  assert.equal(isStableAuthorizationIdentifier('Alice Example'), false);
  assert.equal(isStableAuthorizationIdentifier('alice@example.com'), true);
  assert.equal(isStableAuthorizationIdentifier('DOMAIN\\alice'), true);
  assert.equal(
    isStableAuthorizationIdentifier(
      '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222'
    ),
    true
  );
  assert.equal(
    normalizeAuthorizationIdentifier('i:0#.f|membership|Alice@Example.com'),
    'alice@example.com'
  );
});

test('OData literals are escaped and public keys are syntactically bounded', () => {
  assert.equal(
    escapeODataStringLiteral("x' or 1 eq 1 or Title eq 'x"),
    "x'' or 1 eq 1 or Title eq ''x"
  );
  const route = read('pages/api/settings/key/[key].ts');
  assert.match(route, /PUBLIC_SETTING_KEYS/);
  assert.match(route, /\^\[A-Za-z\]/);
  assert.match(route, /isReadSessionAllowedForInstance/);
  assert.match(read('pages/api/settings/[id].ts'), /isReadSessionAllowedForInstance/);
  assert.match(route, /\{ key: setting\.key, value: setting\.value \}/);
});

test('insecure TLS switches are rejected and no insecure transport primitive remains', () => {
  withEnv(
    {
      NODE_TLS_REJECT_UNAUTHORIZED: undefined,
      SP_ALLOW_SELF_SIGNED: 'true',
      SP_TLS_FALLBACK_INSECURE: undefined,
    },
    () => assert.throws(assertGlobalTlsPolicy)
  );
  withEnv(
    {
      NODE_ENV: 'production',
      NODE_TLS_REJECT_UNAUTHORIZED: '1',
      SP_ALLOW_SELF_SIGNED: 'false',
      SP_TLS_FALLBACK_INSECURE: 'false',
      SP_PROXY_DEBUG: 'true',
    },
    () => assert.throws(assertGlobalTlsPolicy)
  );
  withEnv(
    {
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      SP_ALLOW_SELF_SIGNED: undefined,
      SP_TLS_FALLBACK_INSECURE: undefined,
    },
    () => assert.throws(assertGlobalTlsPolicy)
  );
  assert.throws(() => assertSubmittedTlsPolicy(true));
  for (const path of [
    'utils/spAuth.ts',
    'utils/httpsAgent.ts',
    'pages/api/sharepoint/[...sp].ts',
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /rejectUnauthorized:\s*false|\.unshift\(['"]-k['"]\)/);
  }
});

test('SharePoint operation allowlist rejects arbitrary list subresources', () => {
  const list = "/_api/web/lists/getByTitle('Roadmap Projects')";
  assert.equal(isAllowedPath(`${list}/items`), true);
  assert.equal(isAllowedPath(`${list}/items(42)`), true);
  assert.equal(isAllowedPath(`${list}/RoleAssignments`), false);
  assert.equal(isAllowedPath('/_api/web/lists', 'GET', true), false);
  assert.equal(isAllowedPath('/_api/web/lists', 'POST', false), false);
  assert.equal(isAllowedPath('/_api/web/lists', 'POST', true), true);
  const listByGuid = "/_api/web/lists(guid'11111111-2222-4333-8444-555555555555')";
  assert.equal(isAllowedPath(listByGuid, 'GET', true), false);
  assert.equal(isAllowedPath(listByGuid, 'POST', false), false);
  assert.equal(isAllowedPath(listByGuid, 'POST', true), true);
  const probe = "/_api/web/lists/getByTitle('RoadmapHealthProbe_mszx62ep')";
  assert.equal(isAllowedPath(probe, 'POST', false), false);
  assert.equal(isAllowedPath(probe, 'POST', true), true);
  assert.equal(isAllowedPath(`${probe}/items`, 'POST', true), false);
  const proxy = read('pages/api/sharepoint/[...sp].ts');
  assert.match(proxy, /trustedProxyAddresses\.has\(req\.socket\.remoteAddress/);
  assert.match(proxy, /redirectFailure\?\.reason === 'redirect'/);
  assert.match(proxy, /secondaryWriteAuthScheme/);
  assert.match(proxy, /authScheme === 'negotiate' \? ':' : ntlmCredentials/);
  assert.doesNotMatch(proxy, /kerberosIdentity,/);
});

test('sensitive diagnostics, logout and uploads are fail-closed', () => {
  assert.match(
    read('pages/api/instances/[slug]/access-debug.ts'),
    /ENABLE_SECURITY_DEBUG_ENDPOINTS/
  );
  assert.doesNotMatch(
    read('pages/api/instances/[slug]/access-debug.ts'),
    /DATABASE_URL|databaseUrl|cwd/
  );
  const logout = read('pages/api/auth/entra/logout.ts');
  assert.match(logout, /req\.method !== 'POST'/);
  assert.match(logout, /isSafeCookieRequest/);
  const upload = read('pages/api/attachments/[id].ts');
  assert.match(upload, /scanBufferForMalware\(binary\)/);
  assert.match(upload, /Chunked uploads are disabled/);
  assert.doesNotMatch(upload, /json\(\{\s*error:[^}]+(?:payload|body)\s*:/s);
  assert.doesNotMatch(upload, /Details:\s*\$\{|detail:\s*detail\.slice/);
});

test('browser defenses and production-safe internal origin are configured', () => {
  const config = read('next.config.mjs');
  const document = read('pages/_document.tsx');
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /Permissions-Policy/);
  assert.match(document, /Content-Security-Policy/);
  assert.match(document, /nonce=/);
  assert.doesNotMatch(read('pages/_app.tsx'), /RoadmapApp\.getInitialProps/);
  assert.match(read('utils/serverRendering.ts'), /forceServerSideRendering/);
  assert.match(read('pages/feedback.tsx'), /getServerSideProps/);
  assert.doesNotMatch(read('pages/landing/[slug].tsx'), /getStaticProps|getStaticPaths/);
  assert.match(
    read('utils/internalApiBaseUrl.ts'),
    /INTERNAL_API_BASE_URL is required in production/
  );
});

test('application sessions are server-side, revocable and fail closed', () => {
  const auth = read('utils/apiAuth.ts');
  const callback = read('pages/api/auth/entra/callback.ts');
  const logout = read('pages/api/auth/entra/logout.ts');
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /model AuthSession/);
  assert.match(auth, /prisma\.authSession\.findUnique/);
  assert.match(auth, /activeSession\.revokedAt/);
  assert.match(callback, /prisma\.authSession\.create/);
  assert.match(logout, /revokedAt: new Date\(\)/);
  assert.match(logout, /Session revocation is temporarily unavailable/);
});
