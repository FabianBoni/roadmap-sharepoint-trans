import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

test('support chat uses the persistent rate limiter and explicit trusted proxy list', () => {
  assert.equal(typeof consumeSupportChatRateLimit, 'function');
  const source = readFileSync(resolve(process.cwd(), 'lib/supportChat.ts'), 'utf8');
  assert.match(source, /consumePersistentRateLimit/);
  assert.match(source, /TRUSTED_PROXY_ADDRESSES/);
  assert.doesNotMatch(source, /supportChatRateLimits|new Map<string, RateLimitBucket>/);
});

test('support inbox is restricted to superadmins in UI and API', () => {
  const page = readFileSync(resolve(process.cwd(), 'pages/admin/support-chat.tsx'), 'utf8');
  const listApi = readFileSync(
    resolve(process.cwd(), 'pages/api/admin/support-chat/conversations/index.ts'),
    'utf8'
  );
  const detailApi = readFileSync(
    resolve(process.cwd(), 'pages/api/admin/support-chat/conversations/[id].ts'),
    'utf8'
  );
  const adminDashboard = readFileSync(resolve(process.cwd(), 'pages/admin/index.tsx'), 'utf8');
  const superAdminDashboard = readFileSync(
    resolve(process.cwd(), 'pages/admin/instances.tsx'),
    'utf8'
  );

  assert.match(page, /withSuperAdminAuth\(SupportChatAdminPage\)/);
  assert.match(page, /type:\s*'text'/);
  const widget = readFileSync(resolve(process.cwd(), 'components/SupportChatWidget.tsx'), 'utf8');
  assert.match(widget, /type:\s*'text'/);
  for (const apiSource of [listApi, detailApi]) {
    assert.match(apiSource, /await requireSuperAdminAccess\(req\)/);
    assert.doesNotMatch(apiSource, /requireAdminSession/);
  }
  assert.doesNotMatch(adminDashboard, /href="\/admin\/support-chat"/);
  assert.match(superAdminDashboard, /href="\/admin\/support-chat"/);
});
