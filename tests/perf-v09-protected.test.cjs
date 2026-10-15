'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./fixtures/perf-v09-protected.json');
const revision = manifest.renderingRevision;
const playtestRevision = manifest.authorizedPostReleasePlaytestRevision;
if (playtestRevision) {
  assert.match(playtestRevision.source, /PR #308/);
  assert.equal(playtestRevision.audit, 'docs/POST_SNAPSHOT_PLAYTEST_FIXES_20261015.md');
  assert.match(playtestRevision.auditSha256, /^[a-f0-9]{64}$/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', playtestRevision.audit))).digest('hex'), playtestRevision.auditSha256, 'exact playtest audit receipt');
  for (const [file, expected] of Object.entries(playtestRevision.files))
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), expected, file + ' exact authorized playtest source');
}
// Keep the historical receipts intact; the explicit authorized post-release
// correction supersedes only its listed files in current-source comparisons.
const certificationRevision = manifest.approvedOvernightCertificationRevision && {
  ...manifest.approvedOvernightCertificationRevision,
  files: { ...manifest.approvedOvernightCertificationRevision.files, ...playtestRevision?.files },
};
if (certificationRevision) {
  assert.match(certificationRevision.source, /PR #300.*e5893fbd45cf/);
  const guarded = new Set(Object.keys(manifest.files));
  for (const [name, value] of Object.entries(manifest))
    if (name !== 'approvedOvernightCertificationRevision' && value?.files)
      for (const file of Object.keys(value.files)) guarded.add(file);
  assert.deepEqual(Object.keys(certificationRevision.files).sort(), [...guarded].sort());
  for (const [file, receipt] of Object.entries(certificationRevision.provenance)) {
    assert.match(receipt.handoffSha256, /^[a-f0-9]{64}$/);
    assert.equal(receipt.candidateSha256, manifest.approvedOvernightCertificationRevision.files[file]);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), playtestRevision?.files[file] || receipt.candidateSha256, file + ' exact final source receipt');
  }
}
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
// Audited PR #304 Developer Mode layered onto PR #300's existing owners.
const combinedRevision = manifest.approvedSnapshotDeveloperIntegrationRevision;
if (combinedRevision) {
  assert.deepEqual(Object.keys(combinedRevision.files).sort(), ["src/prototype/app.js","src/prototype/combat.js","src/prototype/engine.js","src/prototype/hero-combat.js","src/prototype/persistence.js","src/prototype/save.js","styles/phone.css","styles/prototype.css"]);
  assert.match(combinedRevision.source, /PR #304.*PR #300/);
}
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
const veyraRevision = manifest.approvedSnapshotVeyraRevision;
if (veyraRevision) {
  assert.match(veyraRevision.source, /#298.*#255.*#263.*#281/);
  assert.deepEqual(Object.keys(veyraRevision.files).sort(), [
    'src/prototype/boss-combat.js',
    'src/prototype/combat-visuals.js',
    'src/prototype/data.js',
    'src/prototype/enemy-presentation.js',
    'src/prototype/enemy-vfx-art.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
    'src/prototype/save.js',
  ]);
}
const chargedRetargetRevision = manifest.approvedChargedRetargetRevision;
const expansionRevision = manifest.approvedSnapshotTreasuryExpansionRevision;
if (expansionRevision) {
  assert.match(expansionRevision.source, /Director14October.*expansion.*#298.*#288/);
  assert.deepEqual(Object.keys(expansionRevision.files).sort(), [
    'src/prototype/dreadmaw-combat.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
  ]);
  for (const [file, expected] of Object.entries(expansionRevision.files))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex'),
      certificationRevision?.files[file] || chargedRetargetRevision?.files[file] ||
    certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] || expected,
      file,
    );
}
const agricultureRevision = manifest.approvedSnapshotDreadAgricultureRevision;
if (agricultureRevision) {
  assert.match(agricultureRevision.source, /#298.*#288.*#231/);
  assert.deepEqual(Object.keys(agricultureRevision.files).sort(), [
    'src/prototype/combat-visuals.js',
    'src/prototype/dreadmaw-combat.js',
    'src/prototype/enemy-vfx-art.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
    'templates/game.html',
  ]);
  for (const [file, expected] of Object.entries(agricultureRevision.files))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex'),
      certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] || expansionRevision?.files[file] || expected,
      file,
    );
}
const veraRevision = manifest.approvedSnapshotVeraInspectionRevision;
if (veraRevision) {
  assert.match(veraRevision.source, /#298.*28C.*29B.*30C.*#288/);
  assert.deepEqual(Object.keys(veraRevision.files).sort(), [
    'src/prototype/cindermaw-combat.js',
    'src/prototype/combat.js',
    'src/prototype/engine.js',
    'src/prototype/renderer.js',
    'src/prototype/rules.js',
    'src/prototype/save.js',
    'src/prototype/sprites.js',
    'src/prototype/visuals.js',
    'src/prototype/world.js',
  ]);
  for (const [file, expected] of Object.entries(veraRevision.files))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex'),
      certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] ||
        expansionRevision?.files[file] ||
        agricultureRevision?.files[file] ||
        expected,
      file,
    );
}
const institutionRevision = manifest.approvedSnapshotInstitutionsRevision;
const ministryRevision = manifest.approvedSnapshotCinderMinistryRevision;
const ministryPresentation = manifest.approvedSnapshotCinderMinistryPresentationRevision;
const ministryAV = manifest.approvedSnapshotCinderMinistryAVRevision;
if (ministryAV) {
  assert.match(ministryAV.source, /#298.*#288/);
  assert.deepEqual(Object.keys(ministryAV.files), ['src/prototype/enemy-vfx-art.js']);
  assert.equal(
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.resolve(__dirname, '..', 'src/prototype/enemy-vfx-art.js')))
      .digest('hex'),
    certificationRevision?.files['src/prototype/enemy-vfx-art.js'] || veyraRevision?.files['src/prototype/enemy-vfx-art.js'] ||
      agricultureRevision?.files['src/prototype/enemy-vfx-art.js'] ||
      ministryAV.files['src/prototype/enemy-vfx-art.js'],
  );
}
if (ministryPresentation) {
  assert.match(ministryPresentation.source, /#298.*#288/);
  assert.deepEqual(Object.keys(ministryPresentation.files), ['src/prototype/combat-visuals.js']);
}
if (ministryRevision) {
  assert.match(ministryRevision.source, /#298.*#288/);
  assert.deepEqual(Object.keys(ministryRevision.files).sort(), [
    'src/prototype/cindermaw-combat.js',
    'src/prototype/combat-visuals.js',
    'src/prototype/data.js',
    'src/prototype/enemy-vfx-events.js',
    'src/prototype/enemy-vfx.js',
    'src/prototype/engine.js',
    'src/prototype/rules.js',
    'templates/game.html',
  ]);
  for (const [file, expected] of Object.entries(ministryRevision.files))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
        .digest('hex'),
      certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] ||
        expansionRevision?.files[file] ||
        agricultureRevision?.files[file] ||
        veraRevision?.files[file] ||
        ministryPresentation?.files[file] ||
        expected,
      file,
    );
}
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
      certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] ||
        expansionRevision?.files[file] ||
        agricultureRevision?.files[file] ||
        veraRevision?.files[file] ||
        ministryRevision?.files[file] ||
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
// PR #295 integrates the manually released charged-skill retargeting into the
// Community Snapshot without replacing the snapshot's prior revision history.
// Charged retarget receipt declared above the expansion guards.
if (chargedRetargetRevision) {
  assert.deepEqual(Object.keys(chargedRetargetRevision.files).sort(), ['src/prototype/app.js']);
  assert.match(chargedRetargetRevision.source, /PR #295.*PR #300/);
  assert.match(chargedRetargetRevision.previousAppSha256, /^[a-f0-9]{64}$/);
}
// Snapshot #300 integrates the reviewed PR #301 joystick handler while preserving
// other snapshot source guards and the protected frame-body hash below.
const joystickSnapshotReceipt = manifest.snapshotMobileJoystick301Integration;
if (joystickSnapshotReceipt) {
  assert.deepEqual(Object.keys(joystickSnapshotReceipt.files), ['src/prototype/app.js']);
  assert.match(joystickSnapshotReceipt.source, /PR #301.*PR #300/);
}
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
    .digest('hex');
  assert.equal(
    actual,
    certificationRevision?.files[file] || combinedRevision?.files[file] ||
    joystickSnapshotReceipt?.files[file] ||
      certificationRevision?.files[file] || combinedRevision?.files[file] ||
      veyraRevision?.files[file] ||
      expansionRevision?.files[file] ||
      agricultureRevision?.files[file] ||
      veraRevision?.files[file] ||
      ministryRevision?.files[file] ||
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
  combinedRevision?.activeFrameBodySha256 || revision.activeFrameBodySha256,
  'Original simulation/input/audio/effects/save/HUD callback body remains byte-for-byte intact',
);
console.log(
  'PASS ' +
    Object.keys(manifest.files).length +
    ' exact protected simulation/scheduling/save/UI/art hashes',
);
