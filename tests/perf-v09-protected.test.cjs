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
// Explicitly audited UX-only hashes supersede the original protected baseline
// only for the three reviewed keyboard/HUD source files.
const keyboardRevision = manifest.approvedKeyboardRevision;
if (keyboardRevision) {
  assert.deepEqual(Object.keys(keyboardRevision.files).sort(), [
    'src/prototype/app.js',
    'src/prototype/input.js',
    'templates/game.html',
  ]);
  assert.match(keyboardRevision.source, /PR #269/);
}
// Preserve all previous hashes and allow only the exact reviewed batch source.
const snapshotRevision = manifest.approvedSnapshotPreparationRevision;
if (snapshotRevision) {
  assert.deepEqual(Object.keys(snapshotRevision.files).sort(), [
    'src/prototype/app.js',
    'src/prototype/rules.js',
    'src/prototype/world.js',
    'templates/game.html',
  ]);
  assert.match(snapshotRevision.source, /#298.*#282.*#284.*#286.*#287/);
}
const encounterRevision = manifest.approvedSnapshotEncounterRevision;
if (encounterRevision) {
  assert.deepEqual(Object.keys(encounterRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/combat.js',
    'src/prototype/data.js',
    'src/prototype/engine.js',
    'src/prototype/hero-combat.js',
    'src/prototype/party.js',
    'src/prototype/rules.js',
    'src/prototype/save.js',
  ]);
  assert.match(encounterRevision.source, /#298.*#230.*#231.*#280/);
}
const greenwoodRevision = manifest.approvedSnapshotGreenwoodRevision;
if (greenwoodRevision) {
  assert.deepEqual(Object.keys(greenwoodRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/combat.js',
    'src/prototype/data.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
  ]);
  assert.match(greenwoodRevision.source, /#289.*#298/);
}
const marchesRevision = manifest.approvedSnapshotMarchesRevision;
if (marchesRevision) {
  assert.deepEqual(Object.keys(marchesRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/combat.js',
    'src/prototype/data.js',
    'src/prototype/rules.js',
  ]);
  assert.match(marchesRevision.source, /#290.*#298/);
}
const thornRevision = manifest.approvedSnapshotThornRevision;
if (thornRevision) assert.match(thornRevision.source, /#289.*#298/);
const garunRevision = manifest.approvedSnapshotGarunRevision;
if (garunRevision) {
  assert.deepEqual(Object.keys(garunRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/combat.js',
    'src/prototype/data.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
    'src/prototype/save.js',
  ]);
  assert.match(garunRevision.source, /#298.*#293.*#253.*#264.*#279/);
}
const aviationRevision = manifest.approvedSnapshotAviationRevision;
if (aviationRevision) {
  assert.deepEqual(Object.keys(aviationRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/data.js',
    'src/prototype/rules.js',
  ]);
  assert.match(aviationRevision.source, /#298.*#291.*#254.*#283/);
}
const cinderSupportRevision = manifest.approvedSnapshotCinderSupportRevision;
if (cinderSupportRevision) {
  assert.deepEqual(Object.keys(cinderSupportRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/data.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
  ]);
  assert.match(cinderSupportRevision.source, /#298.*#288/);
}
const institutionRevision = manifest.approvedSnapshotInstitutionsRevision;
if (institutionRevision) {
  assert.match(institutionRevision.source, /#298.*#288/);
  assert.deepEqual(Object.keys(institutionRevision.files).sort(), [
    'src/prototype/archive.js',
    'src/prototype/data.js',
    'src/prototype/menus.js',
    'src/prototype/rules.js',
  ]);
  for (const [file, expected] of Object.entries(institutionRevision.files))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex'),
      expected,
      file,
    );
}
const cinderLifecycleRevision = manifest.approvedSnapshotCinderSupportLifecycleRevision;
if (cinderLifecycleRevision) {
  assert.match(cinderLifecycleRevision.source, /#298.*#288/);
  assert.deepEqual(Object.keys(cinderLifecycleRevision.files), ['src/prototype/engine.js']);
}
const cinderRallyRevision = manifest.approvedSnapshotCinderRallyRetentionRevision;
if (cinderRallyRevision) {
  assert.match(cinderRallyRevision.source, /#298.*#288/);
  assert.deepEqual(Object.keys(cinderRallyRevision.files), ['src/prototype/engine.js']);
}
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
    .digest('hex');
  assert.equal(
    actual,
    cinderRallyRevision?.files[file] ||
      cinderLifecycleRevision?.files[file] ||
      institutionRevision?.files[file] ||
      cinderSupportRevision?.files[file] ||
      aviationRevision?.files[file] ||
      garunRevision?.files[file] ||
      thornRevision?.files[file] ||
      marchesRevision?.files[file] ||
      greenwoodRevision?.files[file] ||
      encounterRevision?.files[file] ||
      snapshotRevision?.files[file] ||
      keyboardRevision?.files[file] ||
      revision.files[file] ||
      expected,
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
