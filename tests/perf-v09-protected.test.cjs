'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const candidate = require('./fixtures/ash-sentinel-protected-candidate.json');
const manifest = require('./fixtures/perf-v09-protected.json');
const revision = manifest.renderingRevision;
const candidateFiles = Object.keys(candidate.changedFiles).sort();
assert.deepEqual(candidateFiles, [
  'src/prototype/boss-combat.js',
  'src/prototype/combat.js',
  'src/prototype/engine.js',
]);
assert.equal(candidate.issue, 244);
assert.equal(candidate.status, 'draft-only');
assert.deepEqual(Object.keys(revision.files).sort(), [
  'src/prototype/app.js',
  'src/prototype/runtime.js',
]);
for (const [file, expected] of Object.entries(manifest.files)) {
  if (candidate.changedFiles[file]) {
    const gitBlob = cp.execFileSync('git', ['hash-object', '--', file], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
    }).trim();
    assert.equal(
      gitBlob,
      candidate.changedFiles[file],
      file + ' must match the exact #244 candidate, not a blanket exception',
    );
    continue;
  }
  const actual = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
    .digest('hex');
  assert.equal(
    actual,
    revision.files[file] || expected,
    file + ' is protected against baseline / reviewed rendering revision ' + manifest.baseline,
  );
}
const app = fs.readFileSync(path.resolve(__dirname, '../src/prototype/app.js'), 'utf8');
const frame = app.slice(app.indexOf('  function frame(now)'));
const activeBody = frame.slice(
  frame.indexOf('    const frameStart = performance.now();'),
  frame.indexOf('    if (!frozen) {\n      const draw = fps.shouldDraw'),
);
assert.equal(
  crypto.createHash('sha256').update(activeBody).digest('hex'),
  revision.activeFrameBodySha256,
  'Original simulation/input/audio/effects/save/HUD callback body remains byte-for-byte intact',
);
console.log(
  'PASS ' +
    Object.keys(manifest.files).length +
    ' exact legacy protected entries (three specifically pinned to #244 draft); no generic bypass',
);
