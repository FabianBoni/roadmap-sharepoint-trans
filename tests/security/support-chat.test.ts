import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORT_CHAT_COOKIE,
  consumeSupportChatRateLimit,
  createSupportChatToken,
  hashSupportChatToken,
  normalizeSupportChatText,
  setSupportChatCookie,
} from '../../lib/supportChat';

test('support chat tokens are random and stored only as hashes', () => {
  const first = createSupportChatToken();
  const second = createSupportChatToken();
  assert.notEqual(first, second);
  assert.ok(first.length >= 40);
  assert.match(hashSupportChatToken(first), /^[a-f0-9]{64}$/);
  assert.ok(!hashSupportChatToken(first).includes(first));
});

test('support chat cookie is HttpOnly and SameSite protected', () => {
  const headers = new Map<string, string>();
  const response = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
  };
  setSupportChatCookie(response as never, createSupportChatToken());
  const cookie = headers.get('Set-Cookie') || '';
  assert.match(cookie, new RegExp(`^${SUPPORT_CHAT_COOKIE}=`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test('support chat text normalization preserves plain text and normalizes line endings', () => {
  assert.equal(
    normalizeSupportChatText('  Erste Zeile\r\nZweite Zeile  '),
    'Erste Zeile\nZweite Zeile'
  );
  assert.equal(normalizeSupportChatText(null), '');
});

test('support chat rate limiter rejects requests after the configured limit', () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(consumeSupportChatRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(consumeSupportChatRateLimit(key, 2, 60_000).allowed, true);
  const rejected = consumeSupportChatRateLimit(key, 2, 60_000);
  assert.equal(rejected.allowed, false);
  assert.ok(rejected.retryAfterSeconds > 0);
});
