import assert from 'node:assert/strict';
import test from 'node:test';
import { createLatestRequestManager } from '../../utils/latestRequest';

test('starting a newer request cancels and invalidates the previous request', () => {
  const manager = createLatestRequestManager();
  const first = manager.start();
  const second = manager.start();

  assert.equal(first.signal.aborted, true);
  assert.equal(first.isCurrent(), false);
  assert.equal(second.signal.aborted, false);
  assert.equal(second.isCurrent(), true);
});

test('late cleanup from an older request does not cancel the current request', () => {
  const manager = createLatestRequestManager();
  const first = manager.start();
  const second = manager.start();

  first.cancel();

  assert.equal(second.signal.aborted, false);
  assert.equal(second.isCurrent(), true);
});

test('explicit cancellation prevents the current request from updating state', () => {
  const manager = createLatestRequestManager();
  const request = manager.start();

  manager.cancel();

  assert.equal(request.signal.aborted, true);
  assert.equal(request.isCurrent(), false);
});
