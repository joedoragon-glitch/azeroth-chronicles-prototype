'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
// Native projectile collisions and hitParty are never mocked.
function world() {
  const g = new Campaign('developer', 'paladin', () => 0.73), z = g.zone();
  z.enemies = []; z.props = []; z.npcs = []; z.nodes = []; z.buildings = [];
  g.s.projectiles = []; g.s.hazards = []; g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 400, y: 400, hp: 10000, maxHp: 10000 });
  g.s.party = Array.from({ length: 5 }, (_, i) => {
    const u = g.unit(i % 2 ? 'archer' : 'soldier', 450 + i * 10, 460);
    u.hp = 10000; u.maxHp = 10000; return u;
  });
  return g;
}
function shot(i) {
  return { id: 'roster-shot-' + i, source: 'enemy', sourceId: 'untracked-foe',
    fortChecked: true, x: 1420, y: 1300, dx: 1, dy: 0,
    speed: 180, damage: 2, life: 3, hitRadius: 18, style: 'arrow' };
}
for (const n of [1, 24, 96]) {
  const g = world(), original = g.combatTargets;
  for (let i = 0; i < n; i++) g.s.projectiles.push(shot(i));
  let rosterBuilds = 0;
  g.combatTargets = function (...args) {
    rosterBuilds++;
    return original.apply(this, args);
  };
  g.updateProjectiles(0.05);
  assert.equal(g.s.projectiles.length, n, 'clear-flight shots survive');
  assert.equal(g.hero.hp, 10000, 'no distant hero hit');
  assert(g.s.party.every(u => u.hp === 10000), 'no distant companion hit');
  assert.equal(rosterBuilds, 1, 'all missed shots reuse one ordered roster');
  console.log('PROJECTILE_ROSTER_REUSE ' + JSON.stringify({
    shots: n, rosterBuilds, formerBuilds: n, avoided: n - rosterBuilds,
  }));
}
// A lethal first hit removes the dead companion from next-shot eligibility.
{
  const g = world();
  g.s.party = [g.unit('soldier', 1424, 1300), g.unit('archer', 1424, 1300)];
  for (const u of g.s.party) { u.hp = 1; u.maxHp = 1; }
  g.s.projectiles = [shot(0), shot(1)];
  for (const p of g.s.projectiles) p.damage = 100000;
  const original = g.combatTargets, hit = g.hitParty;
  let builds = 0;
  const hitIds = [];
  g.combatTargets = function (...args) {
    builds++; return original.apply(this, args);
  };
  g.hitParty = function (u, ...args) {
    hitIds.push(u.id); return hit.call(this, u, ...args);
  };
  g.updateProjectiles(0.05);
  assert.deepEqual(hitIds, g.s.party.map(u => u.id),
    'second shot must hit next living companion, not the defeated one');
  assert(g.s.party.every(u => u.hp === 0), 'both companions hit separately');
  assert.equal(builds, 2, 'native hit invalidates earlier roster');
  console.log('PROJECTILE_ROSTER_HIT_INVALIDATION ' + JSON.stringify({ builds, hitIds }));
}
console.log('PASS authoritative projectile target roster reuse');
