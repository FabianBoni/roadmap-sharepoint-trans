import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import type { NextApiRequest } from 'next';
import { generatePkcePair, generateRandomBase64Url } from '../../packages/entra-sso/src/core/pkce';
import { buildSetCookie, parseCookies } from '../../packages/entra-sso/src/next/cookies';
import {
  getJwtSecret,
  getSessionTtlSeconds,
  isSafeCookieRequest,
  normalizeLocalReturnUrl,
} from '../../utils/sessionSecurity';

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

test('OIDC random values and PKCE challenge use Base64URL and SHA-256', () => {
  const first = generateRandomBase64Url(32);
  const second = generateRandomBase64Url(32);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.match(second, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);

  const { verifier, challenge } = generatePkcePair();
  const expected = createHash('sha256').update(verifier).digest('base64url');
  assert.match(verifier, /^[A-Za-z0-9_-]{64}$/);
  assert.equal(challenge, expected);
});

test('cookie serialization enforces the SSO cookie contract', () => {
  const cookie = buildSetCookie('entra_state', 'value', {
    maxAgeSeconds: 600,
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
  });
  for (const attribute of [
    'entra_state=value',
    'Path=/',
    'Max-Age=600',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ]) {
    assert.ok(cookie.split('; ').includes(attribute), attribute);
  }

  assert.deepEqual(parseCookies('valid=hello%20world; malformed=%E0%A4%A; second=ok'), {
    valid: 'hello world',
    second: 'ok',
  });
});

test('JWT secret rejects missing, short and known fallback values', () => {
  withEnv({ JWT_SECRET: undefined }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'too-short' }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'roadmap-secret-change-in-production' }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'a-secure-random-value-with-more-than-32-characters' }, () =>
    assert.equal(getJwtSecret(), 'a-secure-random-value-with-more-than-32-characters')
  );
});

test('session TTL parser creates one canonical bounded duration', () => {
  withEnv({ JWT_EXPIRES_IN: undefined }, () => assert.equal(getSessionTtlSeconds(), 28800));
  withEnv({ JWT_EXPIRES_IN: '30m' }, () => assert.equal(getSessionTtlSeconds(), 1800));
  withEnv({ JWT_EXPIRES_IN: '8h' }, () => assert.equal(getSessionTtlSeconds(), 28800));
  withEnv({ JWT_EXPIRES_IN: '0' }, () => assert.throws(getSessionTtlSeconds));
  withEnv({ JWT_EXPIRES_IN: 'tomorrow' }, () => assert.throws(getSessionTtlSeconds));
  withEnv({ JWT_EXPIRES_IN: '13h' }, () => assert.throws(getSessionTtlSeconds));
});

test('local return URLs preserve query/hash and reject redirect bypasses', () => {
  assert.equal(
    normalizeLocalReturnUrl('/admin/projects?filter=active#result'),
    '/admin/projects?filter=active#result'
  );
  for (const unsafe of [
    'https://evil.example/path',
    '//evil.example/path',
    '/\\evil.example/path',
    '/%5cevil.example/path',
    '/%2f%2fevil.example/path',
    '/bad%0d%0aLocation:https://evil.example',
    '/bad%encoding',
  ]) {
    assert.equal(normalizeLocalReturnUrl(unsafe, '/admin'), '/admin', unsafe);
  }
});

const request = (args: {
  method: string;
  origin?: string;
  proto?: string;
  host?: string;
}): NextApiRequest =>
  ({
    method: args.method,
    headers: {
      ...(args.origin ? { origin: args.origin } : {}),
      ...(args.proto ? { 'x-forwarded-proto': args.proto } : {}),
      ...(args.host ? { 'x-forwarded-host': args.host } : {}),
    },
  }) as NextApiRequest;

test('cookie CSRF policy permits safe methods and matching origins only', () => {
  assert.equal(isSafeCookieRequest(request({ method: 'GET' })), true);
  withEnv({ APP_ORIGIN: 'https://roadmap.example', NODE_ENV: 'production' }, () => {
    assert.equal(
      isSafeCookieRequest(request({ method: 'POST', origin: 'https://roadmap.example' })),
      true
    );
    assert.equal(
      isSafeCookieRequest(
        request({ method: 'POST', origin: 'https://evil.example', host: 'evil.example' })
      ),
      false
    );
    assert.equal(isSafeCookieRequest(request({ method: 'POST' })), false);
  });
});
