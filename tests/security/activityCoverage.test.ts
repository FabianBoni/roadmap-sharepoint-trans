import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const apiRoot = join(process.cwd(), 'pages', 'api');
const mutationPattern =
  /req\.method\s*(?:===|!==)\s*['"](?:POST|PUT|PATCH|DELETE)['"]|method\s*===\s*['"](?:POST|PUT|PATCH|DELETE)['"]/;
const exemptions = new Map([
  [
    'pages/api/auth/create-token.ts',
    'The removed legacy endpoint always returns 410 and performs no mutation.',
  ],
  [
    'pages/api/sharepoint/[...sp].ts',
    'The technical SharePoint proxy is covered at the domain API boundary to avoid duplicate events.',
  ],
]);

const collectTypeScriptFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });

test('every mutating domain API route is covered by the activity audit wrapper', () => {
  const mutationRoutes = collectTypeScriptFiles(apiRoot)
    .map((path) => ({
      path,
      relativePath: relative(process.cwd(), path).replaceAll('\\', '/'),
      source: readFileSync(path, 'utf8'),
    }))
    .filter(({ source }) => mutationPattern.test(source));

  assert.ok(mutationRoutes.length >= 20, 'mutation inventory unexpectedly small');

  for (const route of mutationRoutes) {
    if (exemptions.has(route.relativePath)) continue;
    assert.match(
      route.source,
      /import \{ withActivityAudit \} from '@\/utils\/auditLog';/,
      route.relativePath
    );
    assert.match(route.source, /export default withActivityAudit\(handler\);/, route.relativePath);
  }

  for (const [exemptedPath, reason] of exemptions) {
    assert.ok(reason.length >= 20, `missing exemption rationale for ${exemptedPath}`);
    assert.ok(
      mutationRoutes.some((route) => route.relativePath === exemptedPath),
      `stale activity-audit exemption: ${exemptedPath}`
    );
  }
});

test('the public activity feed is authenticated and isolated to one instance', () => {
  const source = readFileSync(join(apiRoot, 'activity', 'recent.ts'), 'utf8');

  assert.match(source, /requireUserSession\(req\)/);
  assert.match(source, /isReadSessionAllowedForInstance\(/);
  assert.match(
    source,
    /where:\s*\{\s*instanceSlug:\s*instance\.slug,\s*visibility:\s*'instance'\s*\}/
  );
  assert.match(source, /Cache-Control',\s*'private, no-store'/);
  assert.doesNotMatch(source, /actorKey:\s*true/);
});
