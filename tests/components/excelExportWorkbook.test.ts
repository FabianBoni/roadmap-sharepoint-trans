import assert from 'node:assert/strict';
import test from 'node:test';
import { Workbook } from '@mui/x-internal-exceljs-fork';

test('Excel export dependency writes and reads a valid XLSX workbook', async () => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Roadmap');
  worksheet.addRow(['Projekt', 'Status']);
  worksheet.addRow(['Testprojekt', 'Geplant']);

  const output = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(output);

  assert.deepEqual(Array.from(bytes.subarray(0, 2)), [0x50, 0x4b]);

  const reloaded = new Workbook();
  await reloaded.xlsx.load(output);
  assert.equal(reloaded.getWorksheet('Roadmap')?.getCell('A2').value, 'Testprojekt');
});
