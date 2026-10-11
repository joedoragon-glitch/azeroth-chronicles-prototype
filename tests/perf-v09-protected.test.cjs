'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./fixtures/perf-v09-protected.json');
const revision = manifest.renderingRevision;
assert.deepEqual(Object.keys(revision.files).sort(), [
  'src/prototype/app.js',
  'src/prototype/runtime.js',
]);
for (const [file, expected] of Object.entries(manifest.files)) {
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
    ' exact protected simulation/scheduling/save/UI/art hashes',
);
