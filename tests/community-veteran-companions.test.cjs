'use strict';
// Authored, NOT RUN. Validate with the complete integrated candidate only.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
function scenario(type, rank, distance = 55) {
  const g = new C('normal', 'paladin', () => 0.9);
  g.zone().props = [];
  g.zone().npcs = [];
  g.zone().buildings = [];
  Object.assign(g.hero, { x: 500, y: 500 });
  g.s.expeditionRank = rank;
  const u = g.unit(type, 520, 500);
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Pursuer', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: u.x + distance, y: u.y },
  );
  g.zone().enemies = [e];
  g.engage(e);
  return { g, u, e };
}
for (const rank of [3, 4, 6]) {
  const { g, u, e } = scenario('soldier', rank);
  assert(g.companionUseFirstSkill(u, e));
  assert.equal(u.wardReduction || 0, rank >= 4 ? 0.2 : 0);
  assert.equal(u.skill1Cd, 8);
  if (rank >= 4) {
    assert.equal(u.wardUntil, g.s.time + 2);
    const hp = u.hp;
    g.hitParty(u, 20, 0, null, true);
    assert.equal(hp - u.hp, 16);
  }
}
{
  const { g, u, e } = scenario('soldier', 4);
  u.wardUntil = 10;
  u.wardReduction = 0.5;
  g.companionUseFirstSkill(u, e);
  assert.equal(u.wardReduction, 0.5);
  assert.equal(u.wardUntil, 10);
}
for (const rank of [3, 4]) {
  const { g, u } = scenario('archer', rank, 90);
  const before = { x: u.x, y: u.y };
  g.updateParty(0.1);
  const arrows = g.s.projectiles.filter((p) => p.source === u.id);
  assert.equal(arrows.length, rank >= 4 ? 3 : 0);
  if (rank >= 4) {
    assert.equal(arrows[0].slow, 1);
    assert(arrows.slice(1).every((p) => !p.slow));
    assert.equal(u.skill1Cd, 8);
  }
  assert(
    Math.hypot(u.x - before.x, u.y - before.y) > 0,
    'covering fire never cancels fallback movement',
  );
}
console.log(
  'PASS veteran troop techniques preserve original cooldowns, stronger wards and retreat movement',
);
