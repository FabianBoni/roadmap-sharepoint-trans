import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const manifestPath = join(process.cwd(), '.next', 'build-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const budgets = [
  {
    route: '/roadmap',
    gzipBytes: Number(process.env.ROADMAP_JS_GZIP_BUDGET_BYTES || 300_000),
    rawBytes: Number(process.env.ROADMAP_JS_RAW_BUDGET_BYTES || 1_000_000),
  },
];

let failed = false;
for (const budget of budgets) {
  const files = new Set([
    ...(manifest.pages?.['/_app'] || []),
    ...(manifest.pages?.[budget.route] || []),
  ]);
  const javascriptFiles = [...files].filter((file) => file.endsWith('.js'));
  if (javascriptFiles.length === 0) {
    throw new Error(`No JavaScript assets found for ${budget.route}`);
  }

  let rawBytes = 0;
  let gzipBytes = 0;
  for (const file of javascriptFiles) {
    const absolutePath = join(process.cwd(), '.next', file);
    const contents = readFileSync(absolutePath);
    rawBytes += statSync(absolutePath).size;
    gzipBytes += gzipSync(contents, { level: 9 }).length;
  }

  const format = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
  process.stdout.write(
    `[performance-budget] ${budget.route}: ${format(rawBytes)} raw, ${format(gzipBytes)} gzip, ${javascriptFiles.length} assets\n`
  );

  if (rawBytes > budget.rawBytes) {
    console.error(`[performance-budget] raw JavaScript exceeds ${format(budget.rawBytes)}`);
    failed = true;
  }
  if (gzipBytes > budget.gzipBytes) {
    console.error(`[performance-budget] gzip JavaScript exceeds ${format(budget.gzipBytes)}`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
}
