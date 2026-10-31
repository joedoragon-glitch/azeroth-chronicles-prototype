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
const areaRelease = g.developerCompanionBeginDirect(soldier, 'Area sweep');
g.recordDeveloperCompanionDamage(soldier.id, 17);
g.recordDeveloperCompanionDamage(soldier.id, 9);
g.developerCompanionEndDirect(areaRelease);
let first = g.developerCompanionSnapshot().find((r) => r.id === soldier.id);
assert.equal(first.last.length, 1, 'two contacts from one explicit area release group once');
assert.equal(first.last[0].name, 'Area sweep');
assert.equal(first.last[0].damage, 26);
assert.equal(first.dps, 26);
assert.equal(g.developerCombatSnapshot().outgoing.dps, 0,
  'companion hits cannot inflate hero outgoing DPS');
const a = { id: 'test-arrow-1' }, b = { id: 'test-arrow-2' };
g.s.projectiles = [a,b];
const volley = g.developerCompanionNewMove(archer.id, 'Triple Shot');
g.developerCompanionTrackProjectile(archer, 'Triple Shot', a, volley);
g.developerCompanionTrackProjectile(archer, 'Triple Shot', b, volley);
g._developerCompanionProjectileInFlight = a.id;
g.recordDeveloperCompanionDamage(archer.id, 8);
g._developerCompanionProjectileInFlight = b.id;
g.recordDeveloperCompanionDamage(archer.id, 12);
g._developerCompanionProjectileInFlight = null;
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).last.length, 0,
  'unfinished flight does not count as a resolved move');
g.s.projectiles = [b];
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).last.length, 0,
  'partial projectile resolution is not a completed multi-shot move');
g.s.projectiles = [];
const resolved = g.developerCompanionSnapshot().find((r) => r.id === archer.id);
assert.equal(resolved.last.length, 1);
assert.equal(resolved.last[0].name, 'Triple Shot');
assert.equal(resolved.last[0].damage, 20, 'two impacts from one move accumulate once');
assert.equal(resolved.dps, 20);
const separate = g.developerCompanionBeginDirect(soldier, 'Another attack');
g.recordDeveloperCompanionDamage(soldier.id, 3);
g.developerCompanionEndDirect(separate);
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === soldier.id).last.length, 2,
  'distinct moves in the exact same game tick stay distinct');
assert.equal(g.developerCompanions.projectiles.size, 0, 'finished shot links evicted');
g.s.time = 1.5;
g.developerCompanionTrackProjectile(archer, 'Basic attack', { id: 'miss' });
g.s.projectiles = [];
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).last[0].damage, 0,
  'a released miss is a resolved move with zero HP damage');
g.s.time = 7.5;
assert.equal(g.developerCompanionSnapshot().find((r) => r.id === archer.id).dps, 0,
  'moving five-second window expires old hits');
// Active/living roster changes must remove stale rows and their telemetry.
soldier.hp = 0;
assert.equal(g.developerCompanionSnapshot().length, 1);
soldier.hp = soldier.maxHp;
archer.active = false;
assert.equal(g.developerCompanionSnapshot().length, 1);
archer.active = true;
g.s.party = [];
assert.equal(g.developerCompanionSnapshot().length, 0);
g.s.party = Array.from({length: 7},
  (_, i) => g.unit(i % 2 ? 'archer' : 'soldier', 500 + i, 500));
assert.equal(g.developerCompanionSnapshot().length, 7,
  'a large party is shown as seven separate rows');
const busy = g.s.party[0];
for (let i = 0; i < 70; i++) g.developerCompanionNewMove(busy.id, 'Hit ' + i);
assert(g.developerCompanions.moves.get(busy.id).length <= 48,
  'long combat cannot keep an unbounded list of move records');
assert.equal(g.developerCompanionSnapshot()[0].last.length, 3);
assert(!JSON.stringify(g.snapshot()).includes('developerCompanions'),
  'developer-only telemetry never enters version-4 saves');
const ordinary = new Campaign('normal', 'paladin', () => 0.9);
assert.equal(ordinary.developerCompanions, undefined);
assert.equal(ordinary.developerCompanionSnapshot(), null);
ordinary.developerCompanionTrackProjectile(ordinary.s.party[0], 'Basic attack', {id:'skip'});
assert.equal(ordinary.developerCompanions, undefined);
console.log('PASS #620 developer companion ledger, move grouping, DPS, and save isolation');
