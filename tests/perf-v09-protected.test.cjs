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
// Keep the v0.9 baseline immutable; review exactly the four files changed
// for the owner's generic hidden-geometry Stalker cast-bar decision.
const castRevision = manifest.ashStalkerAnonymousCastRevision;
assert.deepEqual(Object.keys(castRevision.gitBlobSha1).sort(), [
  'src/prototype/combat-visuals.js',
  'src/prototype/engine.js',
  'src/prototype/renderer.js',
  'src/prototype/rules.js',
]);
function actualBlob(file) {
  const bytes = fs.readFileSync(path.resolve(__dirname, '..', file));
  return crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}
for (const [file, expected] of Object.entries(manifest.files)) {
  const approved = castRevision.gitBlobSha1[file];
  const actual = approved
    ? actualBlob(file)
    : crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex');
  assert.equal(
    actual,
    approved || revision.files[file] || expected,
    file + ' is protected against baseline / reviewed anonymous-cast revision ' + manifest.baseline,
  );
}
// Renderer and VFX owner files were not in the old protected list, but are
// explicitly pinned as part of this new player-visible mechanic.
for (const file of ['src/prototype/combat-visuals.js', 'src/prototype/renderer.js'])
  assert.equal(actualBlob(file), castRevision.gitBlobSha1[file], file + ' exact cast UI revision');

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
