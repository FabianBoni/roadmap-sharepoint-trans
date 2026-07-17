import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextApiRequest } from 'next';
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

test('JWT secret rejects missing, short and known fallback values', () => {
  withEnv({ JWT_SECRET: undefined }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'too-short' }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'roadmap-secret-change-in-production' }, () => assert.throws(getJwtSecret));
  withEnv({ JWT_SECRET: 'a-secure-random-value-with-more-than-32-characters' }, () =>
    assert.equal(getJwtSecret(), 'a-secure-random-value-with-more-than-32-characters')
  );
});

test('session TTL parser creates one canonical positive duration', () => {
  withEnv({ JWT_EXPIRES_IN: undefined }, () => assert.equal(getSessionTtlSeconds(), 86400));
  withEnv({ JWT_EXPIRES_IN: '30m' }, () => assert.equal(getSessionTtlSeconds(), 1800));
  withEnv({ JWT_EXPIRES_IN: '8h' }, () => assert.equal(getSessionTtlSeconds(), 28800));
  withEnv({ JWT_EXPIRES_IN: '0' }, () => assert.throws(getSessionTtlSeconds));
  withEnv({ JWT_EXPIRES_IN: 'tomorrow' }, () => assert.throws(getSessionTtlSeconds));
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
  assert.equal(
    isSafeCookieRequest(
      request({
        method: 'POST',
        origin: 'https://roadmap.example',
        proto: 'https',
        host: 'roadmap.example',
      })
    ),
    true
  );
  assert.equal(
    isSafeCookieRequest(
      request({
        method: 'POST',
        origin: 'https://evil.example',
        proto: 'https',
        host: 'roadmap.example',
      })
    ),
    false
  );
  assert.equal(
    isSafeCookieRequest(request({ method: 'POST', proto: 'https', host: 'roadmap.example' })),
    false
  );
});
