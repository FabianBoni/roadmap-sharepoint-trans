import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AttachmentValidationError,
  buildStorageFileName,
  parseStorageFileName,
  toAttachmentDocument,
  validateAttachmentName,
  validateDeclaredSize,
  validateInitialFileContent,
  validateProjectId,
} from '../../utils/attachmentDocuments';

const documentId = '9db7b1b2-0c81-4c26-a9a5-1519d3ac8ed3';

test('project IDs are constrained to SharePoint item IDs', () => {
  assert.equal(validateProjectId('42'), '42');
  for (const invalid of ['', '0', '-1', '../42', 'mirror:other:42', '42/other']) {
    assert.throws(() => validateProjectId(invalid), AttachmentValidationError);
  }
});

test('file names are normalized and constrained to the allowlist', () => {
  assert.equal(validateAttachmentName(' Bericht.pdf '), 'Bericht.pdf');
  for (const invalid of [
    '../Bericht.pdf',
    'Unterordner/Bericht.pdf',
    'script.svg',
    'seite.html',
    'Bericht.pdf.',
  ]) {
    assert.throws(() => validateAttachmentName(invalid), AttachmentValidationError);
  }
});

test('physical storage names use a stable ID while preserving the display name', () => {
  const storageName = buildStorageFileName(documentId, 'Projektauftrag.pdf');
  assert.equal(storageName, `${documentId}__Projektauftrag.pdf`);
  assert.deepEqual(parseStorageFileName(storageName), {
    documentId,
    originalName: 'Projektauftrag.pdf',
  });
  assert.deepEqual(toAttachmentDocument(storageName, '/Roadmap Documents/42/file'), {
    DocumentId: documentId,
    FileName: 'Projektauftrag.pdf',
    ServerRelativeUrl: '/Roadmap Documents/42/file',
  });
});

test('legacy files remain listable and addressable', () => {
  assert.deepEqual(parseStorageFileName('Bestehend.pdf'), {
    documentId: 'Bestehend.pdf',
    originalName: 'Bestehend.pdf',
  });
});

test('declared size is required and bounded', () => {
  assert.equal(validateDeclaredSize('1024'), 1024);
  assert.throws(() => validateDeclaredSize('0'), AttachmentValidationError);
  assert.throws(() => validateDeclaredSize('not-a-size'), AttachmentValidationError);
  assert.throws(() => validateDeclaredSize(String(101 * 1024 * 1024)), AttachmentValidationError);
});

test('initial content must match the declared extension', () => {
  validateInitialFileContent(
    'Dokument.pdf',
    new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])
  );
  validateInitialFileContent(
    'Bild.png',
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  assert.throws(
    () => validateInitialFileContent('Bild.png', new TextEncoder().encode('<svg></svg>')),
    AttachmentValidationError
  );
});
