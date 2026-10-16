'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./fixtures/perf-v09-protected.json');
// Append-only source-development receipts supersede only explicitly listed paths.
// Historical receipt values below remain immutable and are checked for lineage.
const workFiles = {};
for (const batch of manifest.issue312WorkRevisions || []) {
  assert.equal(batch.canonicalIssue, 312);
  assert.match(batch.source, /PR #313.*SOURCE ONLY.*NOT TESTED/);
  for (const [file, hash] of Object.entries(batch.files)) {
    assert.match(hash, /^[a-f0-9]{64}$/);
    if (workFiles[file]) assert.equal(batch.previousFiles[file], workFiles[file], file + ' append-only work lineage');
    else if (batch.previousFiles[file]) {
      const receipts = Object.values(manifest).filter((v) => v?.files).map((v) => v.files[file]);
      receipts.push(manifest.authorizedCommunitySnapshotRevision?.untouchedFiles[file]);
      assert(receipts.includes(batch.previousFiles[file]), file + ' exact pre-work receipt');
    }
    workFiles[file] = hash;
  }
}
for (const [file, hash] of Object.entries(workFiles))
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), hash,
    file + ' exact current PR313 source receipt');
const revision = manifest.renderingRevision;
const originalPlaytestRevision = manifest.authorizedPostReleasePlaytestRevision;
const passiveRevision = manifest.authorizedPassiveConsolidationRevision;
if (passiveRevision) {
  assert.match(passiveRevision.source, /PR #307.*PR #308/);
  assert.deepEqual(Object.keys(passiveRevision.files).sort(), [
    'src/prototype/archive.js', 'src/prototype/boss-combat.js',
    'src/prototype/combat.js', 'src/prototype/engine.js', 'src/prototype/rules.js',
  ]);
  assert.equal(passiveRevision.previousAuditSha256, originalPlaytestRevision.auditSha256);
  for (const [file, expected] of Object.entries(passiveRevision.previousFiles))
    assert.equal(expected, originalPlaytestRevision.files[file] ||
      manifest.approvedOvernightCertificationRevision.files[file], file + ' retained pre-consolidation receipt');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', passiveRevision.ledger))).digest('hex'), passiveRevision.ledgerSha256, 'exact passive consolidation ledger');
}
const healingRevision = manifest.authorizedHealingConsolidationRevision;
if (healingRevision) {
  assert.match(healingRevision.source, /PR #306.*PR #308/);
  assert.match(manifest.candidateEnemyHealing306Revision.source, /PR #306.*PR #300/);
  assert.deepEqual(Object.keys(healingRevision.files).sort(), Object.keys(manifest.candidateEnemyHealing306Revision.files).sort());
  assert.equal(healingRevision.previousAuditSha256, passiveRevision.auditSha256);
  for (const [file, expected] of Object.entries(healingRevision.previousFiles))
    assert.equal(expected, passiveRevision.files[file] || originalPlaytestRevision.files[file] ||
      manifest.approvedOvernightCertificationRevision.files[file], file + ' retained pre-healing receipt');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', healingRevision.ledger))).digest('hex'), healingRevision.ledgerSha256, 'exact healing consolidation ledger');
}
const timingRevision = manifest.authorizedChargeSlowConsolidationRevision;
if (timingRevision) {
  assert.match(timingRevision.source, /PR #310.*Slow.*PR #308/);
  assert.deepEqual(Object.keys(timingRevision.newlyGuardedPreviousFiles).sort(), ['src/prototype/audio-catalog.js', 'src/prototype/audio-effects.js']);
  assert.equal(timingRevision.previousAuditSha256, healingRevision.auditSha256);
  for (const [file, expected] of Object.entries(timingRevision.previousFiles))
    assert.equal(expected, healingRevision.files[file] || passiveRevision.files[file] ||
      originalPlaytestRevision.files[file] || manifest.approvedOvernightCertificationRevision.files[file], file + ' retained pre-timing receipt');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', timingRevision.ledger))).digest('hex'), timingRevision.ledgerSha256, 'exact combined charge/Slow source audit');
}
const heroRevision = manifest.authorizedHeroSkillsConsolidationRevision;
if (heroRevision) {
  assert.match(heroRevision.source, /hero gameplay and AV.*PR #308/);
  assert.equal(heroRevision.previousAuditSha256, timingRevision.auditSha256);
  assert.equal(heroRevision.previousActiveFrameBodySha256, timingRevision.activeFrameBodySha256);
  for (const [file, expected] of Object.entries(heroRevision.previousFiles))
    assert.equal(expected, timingRevision.files[file] || healingRevision.files[file] ||
      passiveRevision.files[file] || originalPlaytestRevision.files[file] ||
      manifest.approvedOvernightCertificationRevision.files[file], file + ' retained pre-hero receipt');
  assert.deepEqual(heroRevision.introducedFiles.sort(), ['src/prototype/audio-hero.js', 'src/prototype/hero-presentation.js']);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', heroRevision.ledger))).digest('hex'), heroRevision.ledgerSha256, 'exact combined hero source ledger');
}
const validationRepairs = manifest.authorizedCombinedValidationRepairsRevision;
if (validationRepairs) {
  assert.match(validationRepairs.source, /combined validation repairs in PR #308/);
  for (const [file, hash] of Object.entries(validationRepairs.previousFiles))
    assert.equal(hash, heroRevision.files[file] || timingRevision.files[file], file + ' retained original combined source');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', validationRepairs.ledger))).digest('hex'), validationRepairs.ledgerSha256);
}
// The new combined work is a separate exact-source authorization layer.
// Historical SHA-256 receipts remain immutable; only paths listed here
// may supersede their predecessor hash, with full SHA-256 equality below.
const issue312Stage1 = manifest.authorizedIssue312Stage1Revision;
if (issue312Stage1) {
  assert.equal(issue312Stage1.canonicalIssue, 312);
  assert.equal(issue312Stage1.baseline, 'f0e08ba7341a557dcb6ba9eb33d652a9e03dd339');
  assert.match(issue312Stage1.source, /Issue #312.*NOT TESTED/);
  assert.deepEqual(Object.keys(issue312Stage1.files).sort(), [
    'src/prototype/economy.js','src/prototype/engine.js','src/prototype/app.js',
    'src/prototype/audio-effects.js','src/prototype/boss-combat.js',
    'src/prototype/combat.js',
    'docs/PRE_SNAPSHOT_TEN_ISSUES_IMPLEMENTATION_AUDIT_20261015.md',
    'tests/pt312-early-integration.test.cjs',
    'docs/ISSUE_312_CONSOLIDATED_IMPLEMENTATION_LEDGER_20261016.md',
  ].sort(), 'exact nine Stage-1 protected paths');
  for (const [file, hash] of Object.entries(issue312Stage1.files))
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), workFiles[file] || hash,
      file + ' exact Issue #312 Stage 1 authorized receipt');
}
const community311 = manifest.authorizedCommunity311IntegrationRevision;
if (community311) {
  assert.equal(community311.baselineCommunity, 'ca33acb14d92cbce12633eaab702318343dce509');
  assert.equal(community311.inboundHead, 'b91347f863d68d6b7beca76e23f625ddd7ff1293');
  assert.match(community311.source, /PR #311.*NOT TESTED/);
  assert.deepEqual(Object.keys(community311.files).sort(), [
    'docs/PRE_SNAPSHOT_TEN_ISSUES_IMPLEMENTATION_AUDIT_20261015.md',
    'package-lock.json', 'package.json', 'src/prototype/app.js',
    'src/prototype/boss-combat.js', 'src/prototype/build-info.js',
    'src/prototype/engine.js', 'src/prototype/hero-combat.js',
    'src/prototype/party-pets.js', 'src/prototype/party.js',
    'src/prototype/renderer.js', 'src/prototype/rules.js',
    'src/prototype/save.js', 'src/prototype/visuals.js', 'sw.js',
    'tests/captain-review.test.cjs',
    'tests/enemy-support-healing.test.cjs', 'tests/occlusion.test.cjs',
    'tests/perf-ws2-occlusion-browser.test.cjs',
    'tests/perf-ws2-occlusion.test.cjs',
    'tests/pre-snapshot-ten-issues.test.cjs',
    'tests/snapshot-sixth-companion-reveal.test.cjs',
  ].sort());
  for (const [file, expected] of Object.entries(community311.files))
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), workFiles[file] || issue312Stage1?.files[file] || expected,
      file + ' exact Community + PR311 or Issue312 receipt');
}
const communityRevision = manifest.authorizedCommunitySnapshotRevision;
if (communityRevision) {
  assert.equal(communityRevision.baseline, '6bc27be31792b1c38147d61e98ceed6acf3e2560');
  assert.match(communityRevision.source, /Community Snapshot.*PR #308.*NOT TESTED/);
  assert.deepEqual(Object.keys(communityRevision.files).sort(), [
  "scripts/site-assets.cjs",
  "src/prototype/archive.js",
  "src/prototype/audio-catalog.js",
  "src/prototype/audio-effects.js",
  "src/prototype/boss-combat.js",
  "src/prototype/combat-visuals.js",
  "src/prototype/combat.js",
  "src/prototype/engine.js",
  "src/prototype/menus.js",
  "src/prototype/party-pets.js",
  "src/prototype/party.js",
  "src/prototype/progression.js",
  "src/prototype/renderer.js",
  "src/prototype/rules.js",
  "src/prototype/save.js",
  "src/prototype/sprites.js",
  "src/prototype/visuals.js",
  "tools/audio/index.html"
]);
  assert.deepEqual(Object.keys(communityRevision.files).sort(), Object.keys(communityRevision.previousFiles).sort());
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', communityRevision.ledger))).digest('hex'), communityRevision.ledgerSha256, 'exact authorized Community source ledger');
  const prior = { ...manifest.approvedOvernightCertificationRevision.files, ...originalPlaytestRevision.files,
    ...passiveRevision?.files, ...healingRevision?.files, ...timingRevision?.files, ...heroRevision?.files, ...validationRepairs?.files };
  for (const [file, hash] of Object.entries(communityRevision.previousFiles))
    if (prior[file]) assert.equal(hash, prior[file], file + ' retains the exact final #308 predecessor receipt');
  for (const [file, hash] of Object.entries(communityRevision.untouchedFiles))
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex'), workFiles[file] || issue312Stage1?.files[file] || community311?.files[file] || hash, file + ' matches an exact authorized receipt');
}
const communityRepairs = manifest.authorizedCommunitySourceAuditRepairsRevision;
if (communityRepairs) {
  assert.equal(communityRepairs.predecessorCommit, '7581ed12d57e70e42bbaed6b8223bc8d4c709b22');
  assert.equal(communityRepairs.checkpointHistory[0].commit, '06edf70470c507b5da5246fa27e3b779e64382f1');
  for (const file of ['src/prototype/renderer.js', 'src/prototype/rules.js'])
    assert.equal(communityRepairs.files[file], communityRepairs.checkpointHistory[0].files[file], file + ' preserves first repair art/rules/presentation receipt');
  assert.match(communityRepairs.source, /Owner-authorized A01–A07.*NOT TESTED/);
  assert.deepEqual(Object.keys(communityRepairs.files).sort(), ['src/prototype/archive.js', 'src/prototype/party-pets.js', 'src/prototype/renderer.js', 'src/prototype/rules.js', 'src/prototype/visuals.js']);
  assert.deepEqual(Object.keys(communityRepairs.previousFiles).sort(), Object.keys(communityRepairs.files).sort());
  for (const [file, hash] of Object.entries(communityRepairs.previousFiles))
    assert.equal(hash, communityRevision.files[file], file + ' preserves initial Community source receipt');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', communityRepairs.ledger))).digest('hex'), communityRepairs.ledgerSha256, 'exact owner-authorized source audit repair ledger');
}
const playtestRevision = originalPlaytestRevision && {
  ...originalPlaytestRevision,
  auditSha256: heroRevision?.auditSha256 || timingRevision?.auditSha256 || healingRevision?.auditSha256 || passiveRevision?.auditSha256 || originalPlaytestRevision.auditSha256,
  files: { ...originalPlaytestRevision.files, ...passiveRevision?.files, ...healingRevision?.files, ...timingRevision?.files, ...heroRevision?.files, ...validationRepairs?.files, ...communityRevision?.files, ...communityRepairs?.files, ...community311?.files, ...issue312Stage1?.files, ...workFiles },
};
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
  for (const file of Object.keys(workFiles)) guarded.add(file);
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
if (timingRevision)
  assert.equal(timingRevision.previousActiveFrameBodySha256, combinedRevision?.activeFrameBodySha256 || revision.activeFrameBodySha256, 'retained pre-timing frame receipt');
const app = fs.readFileSync(path.resolve(__dirname, '../src/prototype/app.js'), 'utf8');
const frame = app.slice(app.indexOf('  function frame(now)'));
const activeBody = frame.slice(
  frame.indexOf('    const frameStart = performance.now();'),
  frame.indexOf('    if (!frozen) {\n      const draw = fps.shouldDraw'),
);
assert.equal(
  crypto.createHash('sha256').update(activeBody).digest('hex'),
  heroRevision?.activeFrameBodySha256 || timingRevision?.activeFrameBodySha256 || combinedRevision?.activeFrameBodySha256 || revision.activeFrameBodySha256,
  'Exact original or explicitly authorized combined simulation/input/audio/effects/save/HUD callback body',
);
console.log(
  'PASS ' +
    Object.keys(manifest.files).length +
    ' exact protected simulation/scheduling/save/UI/art hashes',
);
