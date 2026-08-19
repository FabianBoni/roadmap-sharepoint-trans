import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractSharePointDigest,
  getSharePointAuthFailureStatus,
  getSharePointWriteFailure,
  getSafeRequestDigest,
  isUsableSharePointContextInfoResponse,
  normalizeSharePointODataPayload,
} from '../../utils/sharePointOData';

test('classifies only 401 and 403 as HTTP authentication failures', () => {
  assert.equal(getSharePointAuthFailureStatus(400), null);
  assert.equal(getSharePointAuthFailureStatus(404), null);
  assert.equal(getSharePointAuthFailureStatus(401), 401);
  assert.equal(getSharePointAuthFailureStatus(403), 403);
});

test('normalizes flat and verbose list entities for nometadata clients', () => {
  const list = { Title: 'Projects', ItemCount: 7 };

  assert.deepEqual(normalizeSharePointODataPayload(list, true), list);
  assert.deepEqual(normalizeSharePointODataPayload({ d: list }, true), list);
});

test('write responses reject redirects, missing statuses and OData error payloads', () => {
  assert.deepEqual(getSharePointWriteFailure(302, '<html>login</html>'), {
    reason: 'redirect',
    upstreamStatus: 302,
  });
  assert.deepEqual(getSharePointWriteFailure(0, ''), {
    reason: 'invalid-status',
    upstreamStatus: 0,
  });
  assert.deepEqual(getSharePointWriteFailure(200, { error: { message: 'not deleted' } }), {
    reason: 'error-payload',
    upstreamStatus: 200,
  });
  assert.equal(getSharePointWriteFailure(204, ''), null);
  assert.equal(getSharePointWriteFailure(200, { d: { Id: 'created' } }), null);
});

test('normalizes d.results, d arrays, value arrays and raw arrays', () => {
  const lists = [{ Title: 'Projects' }, { Title: 'Tasks' }];

  assert.deepEqual(normalizeSharePointODataPayload({ d: { results: lists } }, true), {
    value: lists,
  });
  assert.deepEqual(normalizeSharePointODataPayload({ d: lists }, true), { value: lists });
  assert.deepEqual(normalizeSharePointODataPayload({ value: lists }, true), { value: lists });
  assert.deepEqual(normalizeSharePointODataPayload(lists, false), { d: { results: lists } });
  assert.deepEqual(normalizeSharePointODataPayload({ value: lists }, false), {
    d: { results: lists },
  });
});

test('extracts contextinfo digests from current and old SharePoint envelopes', () => {
  const expected = { value: '0xDIGEST', timeoutSeconds: 900 };
  const context = { FormDigestValue: expected.value, FormDigestTimeoutSeconds: 900 };

  assert.deepEqual(extractSharePointDigest(context), expected);
  assert.deepEqual(extractSharePointDigest({ d: context }), expected);
  assert.deepEqual(extractSharePointDigest({ d: { GetContextWebInformation: context } }), expected);
  assert.deepEqual(extractSharePointDigest({ d: { results: [context] } }), expected);
  assert.deepEqual(extractSharePointDigest({ value: [context] }), expected);
  assert.deepEqual(
    normalizeSharePointODataPayload({ d: { GetContextWebInformation: context } }, true),
    context
  );
  assert.equal(isUsableSharePointContextInfoResponse(0, { d: context }), true);
  assert.equal(isUsableSharePointContextInfoResponse(200, context), true);
  assert.equal(isUsableSharePointContextInfoResponse(302, context), false);
  assert.equal(isUsableSharePointContextInfoResponse(0, { error: 'missing digest' }), false);
});

test('accepts safe incoming digests and rejects header injection or oversized values', () => {
  assert.equal(
    getSafeRequestDigest(' 0xDIGEST,19 Aug 2026 12:00:00 GMT,-1 '),
    '0xDIGEST,19 Aug 2026 12:00:00 GMT,-1'
  );
  assert.equal(getSafeRequestDigest('0xGOOD\r\nX-Evil: yes'), null);
  assert.equal(getSafeRequestDigest('x'.repeat(16_385)), null);
  assert.equal(getSafeRequestDigest(undefined), null);
});
