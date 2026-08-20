import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_SESSION_CHANGED_EVENT, getAdminSessionState } from '../../utils/auth';

test('missing sessions are cached and stale metadata cannot trigger a refresh loop', async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalFetch = globalThis.fetch;
  const events = new EventTarget();
  const values = new Map<string, string>();
  let requests = 0;
  let changeEvents = 0;
  const eventRefreshes: Array<Promise<unknown>> = [];

  const sessionStorage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const windowMock = Object.assign(events, {
    location: { search: '' },
    sessionStorage,
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowMock,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { cookie: '' },
  });
  globalThis.fetch = async () => {
    requests += 1;
    return new Response(
      JSON.stringify({ authenticated: false, isAdmin: false, error: 'No token provided' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  };
  events.addEventListener(ADMIN_SESSION_CHANGED_EVENT, () => {
    changeEvents += 1;
    eventRefreshes.push(getAdminSessionState(true));
  });

  try {
    // A normal anonymous visit is cached without announcing a state change.
    assert.equal(await getAdminSessionState(), null);
    assert.equal(await getAdminSessionState(), null);
    assert.equal(requests, 1);
    assert.equal(changeEvents, 0);

    // If stale display metadata exists, it is removed and announced exactly once. The listener's
    // forced refresh reuses the request that emitted the event instead of starting a loop.
    sessionStorage.setItem('adminUsername', 'Stale User');
    assert.equal(await getAdminSessionState(true), null);
    await Promise.all(eventRefreshes);
    assert.equal(sessionStorage.getItem('adminUsername'), null);
    assert.equal(requests, 2);
    assert.equal(changeEvents, 1);
    assert.equal(await getAdminSessionState(), null);
    assert.equal(requests, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as { window?: unknown }).window;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete (globalThis as { document?: unknown }).document;
  }
});
