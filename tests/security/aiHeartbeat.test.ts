import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAiHeartbeatEndpoints, probeAiHeartbeatEndpoint } from '../../utils/aiHeartbeat';
import aiHealthHandler from '../../pages/api/health/ai.js';

test('AI heartbeat parses server-only endpoint and auth configuration', () => {
  const endpoints = parseAiHeartbeatEndpoints({
    NODE_ENV: 'production',
    AI_HEARTBEAT_ENDPOINTS: JSON.stringify([
      {
        id: 'primary-ai',
        label: 'Primary AI',
        url: 'https://ai.example.test/health',
        auth: { header: 'api-key', tokenEnv: 'PRIMARY_AI_KEY', scheme: '' },
      },
    ]),
  });

  assert.equal(endpoints.length, 1);
  assert.equal(endpoints[0].url, 'https://ai.example.test/health');
  assert.deepEqual(endpoints[0].auth, {
    header: 'api-key',
    tokenEnv: 'PRIMARY_AI_KEY',
    scheme: '',
  });
});

test('AI heartbeat rejects unsafe production protocols and billable POST probes', () => {
  assert.throws(
    () =>
      parseAiHeartbeatEndpoints({
        NODE_ENV: 'production',
        AI_HEARTBEAT_ENDPOINTS: JSON.stringify([
          { id: 'insecure', url: 'http://ai.example.test/health' },
        ]),
      }),
    /must use HTTPS/
  );
  assert.throws(
    () =>
      parseAiHeartbeatEndpoints({
        NODE_ENV: 'production',
        AI_HEARTBEAT_ENDPOINTS: JSON.stringify([
          { id: 'completion', url: 'https://ai.example.test/chat', method: 'POST' },
        ]),
      }),
    /only supports GET or HEAD/
  );
});

test('AI heartbeat sends auth only on the server and accepts configured statuses', async () => {
  const [endpoint] = parseAiHeartbeatEndpoints({
    NODE_ENV: 'production',
    AI_HEARTBEAT_ENDPOINTS: JSON.stringify([
      {
        id: 'primary',
        url: 'https://ai.example.test/health',
        acceptedStatuses: [204],
        auth: { tokenEnv: 'PRIMARY_AI_KEY' },
      },
    ]),
  });
  let authorization = '';
  const result = await probeAiHeartbeatEndpoint(
    endpoint,
    { PRIMARY_AI_KEY: 'secret-token' },
    async (_url, init) => {
      authorization = new Headers(init?.headers).get('authorization') || '';
      return new Response(null, { status: 204 });
    }
  );

  assert.equal(authorization, 'Bearer secret-token');
  assert.equal(result.ok, true);
  assert.equal(result.status, 204);
});

test('AI heartbeat reports missing credentials without contacting the endpoint', async () => {
  const [endpoint] = parseAiHeartbeatEndpoints({
    NODE_ENV: 'production',
    AI_HEARTBEAT_ENDPOINTS: JSON.stringify([
      {
        id: 'primary',
        url: 'https://ai.example.test/health',
        auth: { tokenEnv: 'PRIMARY_AI_KEY' },
      },
    ]),
  });
  let called = false;
  const result = await probeAiHeartbeatEndpoint(endpoint, {}, async () => {
    called = true;
    return new Response(null, { status: 200 });
  });

  assert.equal(called, false);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'configuration');
});

test('AI heartbeat API returns 503 without exposing the configured URL', async () => {
  const originalEndpoints = process.env.AI_HEARTBEAT_ENDPOINTS;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFetch = global.fetch;
  process.env.NODE_ENV = 'production';
  process.env.AI_HEARTBEAT_ENDPOINTS = JSON.stringify([
    {
      id: 'offline-ai',
      label: 'Offline AI',
      url: 'https://secret-ai-host.example.test/health',
    },
  ]);
  global.fetch = async () => new Response(null, { status: 503 });

  try {
    let statusCode = 0;
    let payload: unknown = null;
    const response = {
      setHeader() {
        return undefined;
      },
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(value: unknown) {
        payload = value;
        return this;
      },
      end() {
        return this;
      },
    };

    await aiHealthHandler({ method: 'GET' } as never, response as never);

    assert.equal(statusCode, 503);
    assert.equal((payload as { ok: boolean }).ok, false);
    assert.equal(JSON.stringify(payload).includes('secret-ai-host'), false);
  } finally {
    if (originalEndpoints === undefined) delete process.env.AI_HEARTBEAT_ENDPOINTS;
    else process.env.AI_HEARTBEAT_ENDPOINTS = originalEndpoints;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    global.fetch = originalFetch;
  }
});
