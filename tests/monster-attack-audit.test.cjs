'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Existing = require('../scripts/enemy-vfx-inventory.cjs');
const Audit = require('../scripts/monster-attack-audit.cjs');

const before = JSON.stringify({
  rules: Campaign.rules.attacks,
  captains: Campaign.rules.roomCaptains,
  tactical: Campaign.rules.tacticalFoundation,
  traps: Campaign.rules.dungeonTraps,
  recovery: Campaign.rules.bossRecovery,
});
const baseline = Existing.audit();
const report = Audit.report();
assert.equal(report.totalVisualIdentities, baseline.total);
assert.equal(report.counts.boss, 46);
assert.equal(report.counts.captain, 16);
assert.equal(report.counts['captain-phase'], 5);
assert.equal(report.counts.night, 2);
assert.equal(report.counts.ranged, 18);
assert.equal(report.counts['rogue-basic'], 84);
assert.equal(report.counts['rogue-signature'], 40);
assert.equal(report.counts['basic-attack'], 28);
assert.equal(report.counts.frenzy, 12);
assert.equal(report.counts['environment-trap'], 3);
assert.equal(
  report.counts['boss-recovery'],
  Object.values(Campaign.rules.bossRecovery).filter(
    (value) => value && typeof value === 'object' && typeof value.name === 'string',
  ).length,
);
assert.equal(new Set(report.rows.map((row) => row.id)).size, report.rows.length);
assert(report.rows.every((row) => row.source && row.mechanic));
assert.equal(report.rows.length, 256, '251 presentation IDs + three trap kinds + two recoveries');
assert(
  report.rows
    .filter((row) => baseline.rows.some((item) => item.id === row.id))
    .every((row) => row.visualRecipe?.action && row.visualRecipe?.material),
  'every VFX identity resolves a real authored procedural action and material',
);
assert.equal(report.rows.find((row) => row.id === 'boss/mine/3').visualRecipe.action, 'rush');
assert.equal(
  report.rows.find((row) => row.id === 'rogue/ringleader/ranged/orc/signature').visualRecipe
    .material,
  'steel',
);
for (const region of Campaign.data.regions) {
  const profiles = report.rows.find((row) => row.id === 'trap/jet').mechanic.regionalProfiles[
    region.id
  ];
  assert(profiles?.main && profiles?.side && profiles?.outdoor, region.id);
  assert.deepEqual(profiles.main, profiles.side, region.id + ' main/side parity');
  assert.deepEqual(profiles.main, profiles.outdoor, region.id + ' main/outdoor parity');
}

assert(report.rows.every((row) => row.review.mechanics === 'unreviewed'));
assert(
  report.rows.every((row) =>
    ['unreviewed', 'not-applicable'].includes(row.review.telegraphAndVisuals),
  ),
);
for (const original of baseline.rows) {
  const row = report.rows.find((entry) => entry.id === original.id);
  assert(row, original.id + ' must remain in v0.9 audit');
  assert.equal(row.name, original.name, original.id + ' must retain its authored label');
  assert.deepEqual(
    row.proposedStages,
    original.stages,
    original.id + ' must retain stage inventory',
  );
}
assert.equal(
  report.rows.find((row) => row.id === 'boss/thorn/1').authoredDescription,
  Campaign.data.bosses.find((boss) => boss.id === 'thorn').attacks[1],
);
assert.equal(report.rows.find((row) => row.id === 'boss/darklord/3').mechanic.kind, 'sector');
assert.equal(
  report.rows.find((row) => row.id === 'rogue/boss/darklord/signature').name,
  Campaign.rules.tacticalFoundation.rogueSignatures.bosses.darklord.name,
);
assert(
  report.rows.some((row) => row.id === 'trap/jet' && row.kind === 'capsule'),
  'trap geometry is separately inventoried',
);
assert(report.rows.some((row) => row.id === 'boss/abyss/recovery' && row.kind === 'self-heal'));
const markdown = Audit.markdown(report);
assert(markdown.includes('boss/darklord/3'));
assert(markdown.includes('trap/jet'));
assert(markdown.includes('unreviewed'));
assert.equal(JSON.stringify(report), JSON.stringify(Audit.report()), 'generation is deterministic');
assert.equal(
  JSON.stringify({
    rules: Campaign.rules.attacks,
    captains: Campaign.rules.roomCaptains,
    tactical: Campaign.rules.tacticalFoundation,
    traps: Campaign.rules.dungeonTraps,
    recovery: Campaign.rules.bossRecovery,
  }),
  before,
  'generator cannot mutate the simulation authoring tables',
);

console.log(
  'PASS v0.9 monster attack housekeeping: ' +
    report.totalVisualIdentities +
    ' visual identities and separate traps/recovery, source-linked and unreviewed',
);
