import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractSharePointDigest,
  getSafeRequestDigest,
  normalizeSharePointODataPayload,
} from '../../utils/sharePointOData';

test('normalizes flat and verbose list entities for nometadata clients', () => {
  const list = { Title: 'Projects', ItemCount: 7 };

  assert.deepEqual(normalizeSharePointODataPayload(list, true), list);
  assert.deepEqual(normalizeSharePointODataPayload({ d: list }, true), list);
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
