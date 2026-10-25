'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

// These are the real strict command-line validators, not mock approvals or
// compatibility bypasses. Keep every audit gate exercised by future art edits.
for (const [name, file, args] of [
  ['sprite pipeline', 'scripts/sprite-pipeline.cjs', ['check']],
  ['sprite scope', 'scripts/sprite-scope-audit.cjs', ['--check']],
  ['material pipeline', 'scripts/material-pipeline.cjs', ['check']],
]) {
  const output = cp.execFileSync(process.execPath, [file, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120000,
  });
  assert(output.trim(), name + ' returned no result');
  console.log('PASS ' + name + ' strict CLI check');
}
