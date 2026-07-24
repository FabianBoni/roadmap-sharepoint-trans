import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const testRoot = join(process.cwd(), 'tests', 'security');

const collectTests = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTests(path);
    return entry.isFile() && entry.name.endsWith('.test.ts') ? [path] : [];
  });

const tests = collectTests(testRoot).sort();
if (tests.length === 0) {
  console.error('No security tests found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [require.resolve('tsx/cli'), '--test', ...tests], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SP_ALLOW_SELF_SIGNED: 'false',
    SP_TLS_FALLBACK_INSECURE: 'false',
    NODE_TLS_REJECT_UNAUTHORIZED: '1',
  },
});
process.exit(result.status ?? 1);
