'use strict';
// Every future balance number must flow through native rules without manually
// editing unrelated enemy/companion combat owners or changing fixed 90 assertions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const workbench = require('../scripts/tune-melee-reach.cjs');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/prototype/rules.js'), 'utf8');
const evidence = JSON.parse(fs.readFileSync(
  path.join(root, 'docs/evidence/SPRITE_SCOPE_RECONCILIATION.json'), 'utf8',
));
const hash = crypto.createHash('sha256').update(source).digest('hex');
assert.equal(evidence.sources['src/prototype/rules.js'], hash,
  'every committed tuning edit refreshes the exact rules source fingerprint');

const original = workbench.parseTable(source);
const resolved = workbench.resolve(original);
const live = require('../src/prototype/rules.js');
for (const role of ['enemy', 'elite', 'soldier', 'pet', 'ringleaderHybridStance'])
  assert.equal(live.meleeReach[role], resolved[role], 'source table feeds ' + role);
assert.equal(live.balance.meleeBasicRange, resolved.enemy);
assert.equal(live.balance.eliteMeleeBasicRange, resolved.elite);
assert.equal(live.balance.companions.soldierMeleeBasicRange, resolved.soldier);
assert.equal(live.balance.companions.petMeleeBasicRange, resolved.pet);
assert.equal(live.balance.pursuit.valeRecoverySeconds, 0.5, 'native Greenwood pursuit remains intact');
assert.equal(live.rangedEnemyCombat.ringleaderHybridMeleeRange, resolved.ringleaderHybridStance);

const variants = [
  { shared: 70, enemy: null, elite: null, soldier: null, pet: null },
  { shared: 110, enemy: null, elite: null, soldier: null, pet: null },
  { shared: 85, enemy: 65, elite: 110, soldier: 90, pet: 75 },
  { shared: 90, enemy: null, elite: 100, soldier: null, pet: 60 },
];
let cases = 0;
for (const variant of variants) {
  const values = { ...original, ...variant };
  const updated = workbench.replaceTable(source, values);
  assert.deepEqual(workbench.parseTable(updated), values, 'serialized knobs preserve exact overrides');
  assert.equal(workbench.replaceTable(updated, values), updated, 'same change is idempotent');
  const module = { exports: {} };
  // rules.js legitimately imports sibling modules when loaded in Node.
  // Provide the same relative resolver in the isolated variation check.
  const siblingRequire = (id) => id.startsWith('./')
    ? require(path.join(root, 'src/prototype', id)) : require(id);
  vm.runInNewContext(updated, { module, require: siblingRequire }, { timeout: 3000 });
  const R = module.exports, tuned = workbench.resolve(values);
  for (const key of ['enemy', 'elite', 'soldier', 'pet', 'ringleaderHybridStance'])
    assert.equal(R.meleeReach[key], tuned[key], key + ' resolves variant');
  assert.equal(R.balance.meleeBasicRange, tuned.enemy);
  assert.equal(R.balance.eliteMeleeBasicRange, tuned.elite);
  assert.equal(R.balance.pursuit.valeRecoverySeconds, live.balance.pursuit.valeRecoverySeconds);
  assert.equal(R.rangedEnemyCombat.ringleaderHybridMeleeRange, tuned.ringleaderHybridStance);
  assert.equal(R.balance.companions.soldierMeleeBasicRange, tuned.soldier);
  assert.equal(R.balance.companions.petMeleeBasicRange, tuned.pet);
  assert.equal(R.balance.companions.petBasicRange, 280, 'ranged pet basic isolated');
  assert.equal(R.bossCadence.specialRange, live.bossCadence.specialRange, 'boss skill preserved');
  assert.equal(R.rangedEnemyCombat.aimTime, live.rangedEnemyCombat.aimTime, 'ranged attacks preserved');
  cases++;
}
// Default is read from source: no permanent fixed-value assertion blocks retuning.
assert.equal(workbench.parseCli(['--all', '80', '--pet', '100']).changes.pet, 100);
assert.deepEqual(workbench.parseCli(['--all', '80']).changes,
  { enemy: null, elite: null, soldier: null, pet: null, shared: 80 },
  '--all overwrites prior overrides by returning everyone to shared');
assert.deepEqual(workbench.parseCli(['--enemy', 'inherit']).changes, { enemy: null });
assert.deepEqual(workbench.parseCli(['--shared=80']).changes, { shared: 80 });
assert.throws(() => workbench.parseCli(['--enemy', '-4']), /Invalid/);
assert.throws(() => workbench.parseCli(['--elite', 'unknown']), /Invalid/);
assert.throws(() => workbench.validate({ ...original, shared: 0 }), /shared/);
assert.throws(() => workbench.validate({ ...original, pet: 250 }), /pet/);
assert.deepEqual(workbench.parseTable(workbench.replaceTable(source, original)), original);
console.log('PASS ' + cases +
  ' shared/override scenarios, unchanged ranged/specials, source fingerprint, CLI validation and serialized table');
