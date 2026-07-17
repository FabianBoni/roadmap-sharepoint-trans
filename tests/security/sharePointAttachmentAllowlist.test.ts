import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import type { NextApiRequest } from 'next';
import { isAllowedPath, readRawBodyBuffer } from '../../pages/api/sharepoint/[...sp]';

const projectFolder =
  "/_api/web/GetFolderByServerRelativeUrl('/sites/roadmap/Roadmap%20Documents/42')";
const file =
  "/_api/web/GetFileByServerRelativeUrl('/sites/roadmap/Roadmap%20Documents/42/9db7b1b2-0c81-4c26-a9a5-1519d3ac8ed3__Bericht.pdf')";

test('document-library listing and upload paths are allowed', () => {
  assert.equal(isAllowedPath(`${projectFolder}/Files`), true);
  assert.equal(
    isAllowedPath(`${projectFolder}/Files/add(url='document.pdf',overwrite=false)`),
    true
  );
  assert.equal(isAllowedPath(`${file}/ListItemAllFields`), true);
  assert.equal(isAllowedPath(`${file}/$value`), true);
});

test('the same operations remain limited to Roadmap Documents', () => {
  const otherFolder = "/_api/web/GetFolderByServerRelativeUrl('/sites/roadmap/Shared%20Documents')";
  assert.equal(isAllowedPath(`${otherFolder}/Files`), false);
  assert.equal(
    isAllowedPath(`${otherFolder}/Files/add(url='document.pdf',overwrite=false)`),
    false
  );
});

test('the SharePoint proxy preserves binary upload bytes and enforces its limit', async () => {
  const binary = Buffer.from([0x00, 0xff, 0x80, 0x25, 0x50, 0x44, 0x46]);
  const request = Readable.from([binary]) as unknown as NextApiRequest;
  const result = await readRawBodyBuffer(request, binary.length);
  assert.deepEqual(result, binary);

  const oversized = Readable.from([binary]) as unknown as NextApiRequest;
  await assert.rejects(() => readRawBodyBuffer(oversized, binary.length - 1), {
    message: 'sharepoint-proxy-body-too-large',
  });
});
