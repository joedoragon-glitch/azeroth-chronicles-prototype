'use strict';

// P0 #839 / draft #840: CI-only Phase 1 instrumentation readiness gate.
// Run existing narrow regression tests unchanged; never load a full game suite,
// browser matrix, gameplay-modifying harness or release/deployment path.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const files = [
  'performance-report-diagnostics.test.cjs',
  'frame-profile.test.cjs',
  'party-playtest-diagnostics.test.cjs',
  'crowd-diagnostics.test.cjs',
  'frame-rate.test.cjs',
  'frame-skip.test.cjs',
  'auto-fps-adaptive-coupling.test.cjs',
  'performance-default-upgrade.test.cjs',
];
let failures = 0;
for (const file of files) {
  const fullPath = path.join(root, 'tests', file);
  const began = Date.now();
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: root,
    stdio: 'inherit',
    timeout: 120000,
    env: process.env,
  });
  const ok = result.status === 0 && !result.error;
  console.log(
    '[Phase 1] ' + (ok ? 'PASS' : 'FAIL') + ' ' + file +
    ' (' + (Date.now() - began) + ' ms)'
  );
  if (!ok) {
    failures++;
    if (result.error) console.error(result.error);
    if (result.signal) console.error('signal: ' + result.signal);
  }
}
assert.equal(failures, 0, failures + ' / ' + files.length + ' diagnostic readiness tests failed');
console.log('[Phase 1] PASS: ' + files.length + ' targeted diagnostic and cadence tests. ' +
  'This is synthetic Node evidence only, not a physical-PC FPS claim.');
