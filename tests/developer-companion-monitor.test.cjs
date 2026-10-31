'use strict';
// Developer telemetry contracts: actual settled HP, per-actor multi-projectile
// move grouping, five-second decay, save isolation and hero monitor separation.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
function fresh() {
  const g = new Campaign('developer', 'paladin', () => 0.9);
  g.s.time = 1;
  g.s.party = [g.unit('soldier', 500, 500), g.unit('archer', 520, 500)];
  return g;
}
const g = fresh(), [soldier, archer] = g.s.party;
assert.equal(g.developerCompanionSnapshot().length, 2);
assert.equal(g.developerCompanionSnapshot()[0].dps, 0);
assert.equal(g.developerCombatSnapshot().outgoing.dps, 0, 'hero history is separate');
g.recordDeveloperCompanionDamage(soldier.id, 17);
g.recordDeveloperCompanionDamage(soldier.id, 9);
let first = g.developerCompanionSnapshot().find((r) => r.id === soldier.id);
assert.equal(first.last.length, 1, 'same instant area contacts aggregate as one move');
assert.equal(first.last[0].damage, 26);
assert.equal(first.dps, 26);
assert.equal(g.developerCombatSnapshot().outgoing.dps, 0,
  'companion hits cannot inflate hero outgoing DPS');
const a = { id: 'test-arrow-1' }, b = { id: 'test-arrow-2' };
g.s.projectiles = [a,b];
g.developerCompanionTrackProjectile(archer, 'Triple Shot', a);
g.developerCompanionTrackProjectile(archer, 'Triple Shot', b);
g._developerCompanionProjectileInFlight = a.id;
g.recordDeveloperCompanionDamage(archer.id, 8);
g._developerCompanionProjectileInFlight = b.id;
g.recordDeveloperCompanionDamage(archer.id, 12);
g._developerCompanionProjectileInFlight = null;
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).last.length, 0,
  'unfinished flight does not count as a resolved move');
g.s.projectiles = [];
const resolved = g.developerCompanionSnapshot().find((r) => r.id === archer.id);
assert.equal(resolved.last.length, 1);
assert.equal(resolved.last[0].name, 'Triple Shot');
assert.equal(resolved.last[0].damage, 20, 'two impacts from one move accumulate once');
assert.equal(resolved.dps, 20);
assert.equal(g.developerCompanions.projectiles.size, 0, 'finished shot links evicted');
g.s.time = 1.5;
g.developerCompanionTrackProjectile(archer, 'Basic attack', { id: 'miss' });
g.s.projectiles = [];
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).last[0].damage, 0,
  'a released miss is a resolved move with zero HP damage');
g.s.time = 7.5;
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).dps, 0,
  'moving five-second window expires old hits');
assert(!JSON.stringify(g.snapshot()).includes('developerCompanions'),
  'developer-only telemetry never enters version-4 saves');
const ordinary = new Campaign('normal', 'paladin', () => 0.9);
assert.equal(ordinary.developerCompanions, undefined);
assert.equal(ordinary.developerCompanionSnapshot(), null);
ordinary.developerCompanionTrackProjectile(ordinary.s.party[0], 'Basic attack', {id:'skip'});
assert.equal(ordinary.developerCompanions, undefined);
console.log('PASS #620 developer companion ledger, move grouping, DPS, and save isolation');
