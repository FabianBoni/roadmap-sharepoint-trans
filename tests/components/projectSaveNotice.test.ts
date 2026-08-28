import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProjectSaveNoticeQuery,
  countUniqueMirrorTargets,
  getProjectSaveNoticeMessage,
  parseProjectSaveNotice,
  PROJECT_SAVE_NOTICE_PARAM,
  PROJECT_SAVE_PUBLISHED_PARAM,
} from '../../utils/projectSaveNotice';

test('counts unique mirror target ids and excludes the current instance', () => {
  assert.equal(
    countUniqueMirrorTargets([' Finance ', 'finance', 'SOURCE', 'hr', '', null], 'source'),
    2
  );
  assert.equal(countUniqueMirrorTargets(undefined, 'source'), 0);
});

test('builds and parses a constrained save notice without dropping existing query values', () => {
  const query = buildProjectSaveNoticeQuery(
    { instance: 'source', tab: 'projects' },
    { action: 'created', publishedCount: 3 }
  );

  assert.equal(query.instance, 'source');
  assert.equal(query.tab, 'projects');
  assert.equal(query[PROJECT_SAVE_NOTICE_PARAM], 'created');
  assert.equal(query[PROJECT_SAVE_PUBLISHED_PARAM], '3');
  assert.deepEqual(parseProjectSaveNotice(query), { action: 'created', publishedCount: 3 });
});

test('rejects manipulated notice parameters and formats accessible messages', () => {
  assert.equal(parseProjectSaveNotice({ projectSave: '<script>', projectPublished: '3' }), null);
  assert.equal(parseProjectSaveNotice({ projectSave: 'updated', projectPublished: '-1' }), null);
  assert.equal(
    getProjectSaveNoticeMessage({ action: 'created', publishedCount: 3 }),
    'Projekt erstellt und in 3 Roadmaps veröffentlicht.'
  );
  assert.equal(
    getProjectSaveNoticeMessage({ action: 'updated', publishedCount: 1 }),
    'Projekt aktualisiert und in 1 Roadmap veröffentlicht.'
  );
  assert.equal(
    getProjectSaveNoticeMessage({ action: 'updated', publishedCount: 0 }),
    'Projekt aktualisiert.'
  );
});
