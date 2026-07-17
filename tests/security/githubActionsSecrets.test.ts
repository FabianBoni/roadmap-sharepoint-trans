import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflows = ['.github/workflows/deploy.yml', '.github/workflows/branch-build.yml'];

for (const workflowPath of workflows) {
  test(`${workflowPath} injects and validates JWT_SECRET`, () => {
    const workflow = readFileSync(resolve(process.cwd(), workflowPath), 'utf8');

    assert.match(workflow, /JWT_SECRET: \$\{\{ secrets\.JWT_SECRET \}\}/);
    assert.match(workflow, /grep -v -E '[^']*JWT_SECRET=/);
    assert.match(workflow, /\$\{#JWT_SECRET\}[^\n]*-lt 32/);
    assert.match(workflow, /roadmap-secret-change-in-production/);
    assert.match(workflow, /your-secure-random-string-here-minimum-32-characters/);
    assert.match(workflow, /write_quoted_env_value "JWT_SECRET" "\$JWT_SECRET"/);
    assert.doesNotMatch(workflow, /echo "\$JWT_SECRET"/);
  });
}
