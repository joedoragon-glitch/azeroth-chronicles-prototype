'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Inventory = require('../scripts/enemy-vfx-inventory.cjs');
const VFX = require('../src/prototype/enemy-vfx.js');

const rulesBefore = JSON.stringify({
  attacks: Campaign.rules.attacks,
  captains: Campaign.rules.roomCaptains,
  rogue: Campaign.rules.tacticalFoundation,
});

const report = Inventory.audit();
assert.equal(report.counts.boss, 46, 'all currently authored boss actions are inventoried');
assert.equal(report.counts.captain, 16, 'all five captain movesets are inventoried');
assert.equal(report.counts['captain-phase'], 5, 'captain second phases are independently listed');
assert.equal(report.counts.night, 2);
assert.equal(report.counts.ranged, 7);
assert.equal(new Set(report.rows.map((r) => r.id)).size, report.rows.length);
assert(report.rows.every((r) => r.stages.every((stage) => VFX.STAGES.includes(stage))));
assert.equal(
  JSON.stringify({
    attacks: Campaign.rules.attacks,
    captains: Campaign.rules.roomCaptains,
    rogue: Campaign.rules.tacticalFoundation,
  }),
  rulesBefore,
  'inventory may not mutate mechanics',
);

for (const row of report.rows) {
  assert(!row.stages.includes('unknown'));
  if (row.kind === 'summon') {
    assert.deepEqual(
      row.stages,
      ['windup', 'release', 'spawn'],
      'summoning never declares a damage impact',
    );
    assert(!row.stages.includes('impact'), 'no misleading damage circle for summons');
  }
}
assert.equal(Inventory.expectedStages({ kind: 'ring' }).join(','), 'windup,release,travel');
assert.deepEqual(Inventory.expectedStages({ kind: 'circle', persistent: true }), [
  'windup',
  'release',
  'impact',
  'linger',
]);
assert.deepEqual(Inventory.expectedStages({ kind: 'line', charge: true }), [
  'windup',
  'release',
  'travel',
  'impact',
]);

const species = new Set([
  ...Campaign.data.species.flat().map((entry) => entry[0]),
  ...Object.keys(Campaign.rules.nightEnemyCombat),
]);
const rangedSpecies = new Set([
  ...Object.keys(Campaign.rules.rangedProfiles),
  'archer',
  'crownguard',
  'wraith',
]);
const expectedBasics =
  species.size * 4 +
  [...rangedSpecies].filter((speciesId) => species.has(speciesId)).length * 2 +
  Object.keys(Campaign.rules.tacticalFoundation.rogueMoves.bosses || {}).length +
  Object.keys(Campaign.rules.tacticalFoundation.rogueMoves.captains || {}).length;
assert.equal(
  report.counts['rogue-basic'],
  expectedBasics,
  'all appropriate species, role and tier basic maneuvers',
);
assert(report.rows.some((r) => r.id === 'rogue/guardian/ranged/ogre/basic'));
assert(report.rows.some((r) => r.id === 'rogue/ringleader/ranged/wolf/basic'));
assert(report.rows.some((r) => r.id === 'rogue/boss/thorn/basic'));

const T = Campaign.rules.tacticalFoundation;
const signatures =
  Object.values(T.rogueRingleaderSignatures || {}).reduce(
    (n, family) => n + Object.keys(family).length,
    0,
  ) +
  Object.values(T.rogueSignatures || {}).reduce((n, family) => n + Object.keys(family).length, 0);
assert.equal(report.counts['rogue-signature'] || 0, signatures);
const draft = Inventory.markdown(report);
assert(draft.includes('boss/thorn/0'));
assert(draft.includes('captain/supply-vale/0'));
assert(draft.includes('captain/supply-crown/phase'));
assert(draft.includes('night/wraith/drain'));
assert(draft.includes('projectile/ogre/stone'));
assert(draft.includes('not** claim implementation'));

console.log(
  'PASS enemy VFX housekeeping: ' +
    report.total +
    ' stable inventory entries; accurate non-damage summon stages; rogue expansion ready',
);
