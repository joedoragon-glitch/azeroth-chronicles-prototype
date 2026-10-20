'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
let cases = 0;
for (const name of ['soldier', 'archer', ...Object.keys(C.rules.petCompanions)]) {
  const g = new C('normal', 'paladin', () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  Object.assign(g.hero, { x: 900, y: 900 });
  g.s.mercyTime = 0;
  const pet = Object.hasOwn(C.rules.petCompanions, name),
    u = g.unit(pet ? 'pet' : name, 900, 900, pet ? name : null);
  g.s.party = [u];
  Object.assign(u, g.partyFollowPoint(u));
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: u.x + 60, y: u.y },
  );
  z.enemies = [e];
  g.engage(e);
  g._tacticalPartyTargets = new Map([[u.id, e.id]]);
  // The normal navigation owner rejects an unsupported pursuit destination.
  g.followCompanion(u, { x: 1600, y: 900 }, 255, 0.05, 0);
  assert(g.companionPursuitDetour(u));
  assert(g.companionCautiousCombat(u, e, [u], 0.05));
  // Already at formation: no movement call would previously clear the flag.
  for (let i = 0; i < 80; i++) {
    g.s.time += 0.05;
    g.companionCautiousCombat(u, e, [u], 0.05);
  }
  assert(!g.companionPursuitDetour(u), name + ' rejected route cleared on regroup arrival');
  assert(!g.companionCautiousCombat(u, e, [u], 0.05), name + ' safely resumes');
  // Recovery of the route flag must never override a fresh critical-wound veto.
  u.hp = u.maxHp * 0.1;
  g.s.time += 1;
  assert(g.companionCautiousCombat(u, e, [u], 0.05));
  g.s.time += 4;
  assert(g.companionCautiousCombat(u, e, [u], 0.05), name + ' fresh danger still holds');
  cases++;
}
console.log(
  'PASS regroup arrival clears stale pursuit refusal without bypassing fresh danger: ' +
    cases +
    ' roles',
);
