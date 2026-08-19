import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSharePointSiteUrl } from '../../utils/sharepointEnv';

test('normalizes a scheme-less SharePoint host and path to HTTPS', () => {
  assert.equal(
    normalizeSharePointSiteUrl('spi.intranet.bs.ch/jsd/rettung/sanitaet'),
    'https://spi.intranet.bs.ch/jsd/rettung/sanitaet'
  );
});

test('preserves explicit HTTP schemes and removes trailing slashes', () => {
  assert.equal(
    normalizeSharePointSiteUrl('http://sharepoint.example/sites/roadmap///'),
    'http://sharepoint.example/sites/roadmap'
  );
});

test('rejects unsafe or ambiguous SharePoint site URLs', () => {
  assert.throws(() => normalizeSharePointSiteUrl('javascript://example'), /HTTP or HTTPS/);
  assert.throws(
    () => normalizeSharePointSiteUrl('https://user:secret@example.test/sites/roadmap'),
    /must not contain credentials/
  );
  assert.throws(
    () => normalizeSharePointSiteUrl('https://example.test/sites/roadmap?redirect=other'),
    /must not contain credentials/
  );
});
