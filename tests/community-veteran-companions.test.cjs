'use strict';
// Focused live veteran skill and AI checks.
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
// Actual projectile contact, defensive regroup AI and activation boundaries.
{
  const { g, u, e } = scenario('archer', 4, 90);
  assert(g.companionCoveringShot(u, e));
  const hp = e.hp;
  g.updateProjectiles(0.18);
  assert(e.hp < hp);
  assert.equal(e.slow, 1, 'first arrow applies real Slow');
  assert(!g.companionCoveringShot(u, e), 'normal eight-second recovery prevents reuse');
}
{
  const { g, u, e } = scenario('archer', 4, 90);
  assert(g.companionCoveringShot(u, e));
  e.y += 90;
  g.updateProjectiles(0.25);
  assert.equal(e.slow || 0, 0, 'dodged covering shot applies no Slow');
}
for (const reason of [
  'rank',
  'distance',
  'cooldown',
  'global',
  'silence',
  'wall',
  'dead',
  'dust',
]) {
  const { g, u, e } = scenario('archer', 4, 90);
  if (reason === 'rank') g.s.expeditionRank = 3;
  if (reason === 'distance') e.x = u.x + 150;
  if (reason === 'cooldown') u.skill1Cd = 1;
  if (reason === 'global') u.skillGlobalCd = 1;
  if (reason === 'silence')
    g.s.hazards.push({ type: 'silence', x: u.x, y: u.y, radius: 100, life: 3 });
  if (reason === 'wall') g.zone().props.push({ id: 'wall', x: u.x + 45, y: u.y, r: 22 });
  if (reason === 'dead') e.hp = 0;
  if (reason === 'dust') e.rogueDustCoverUntil = g.s.time + 3;
  if (reason === 'silence') {
    // Use the same live status predicate exercised by the companion AI.
    const original = g.mageSilenceActive;
    g.mageSilenceActive = (a) => a === u || original.call(g, a);
  }
  assert(!g.companionCoveringShot(u, e), reason);
  assert.equal(g.s.projectiles.length, 0, reason);
}
{
  const { g, u, e } = scenario('archer', 4, 90);
  u.hp = u.maxHp * 0.2;
  g.hero.x = 300;
  for (let i = 0; i < 3; i++) {
    const foe = g.makeEnemy(
      { species: 'goblin', name: 'Pressure', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: e.x, y: e.y + 30 * (i + 1) },
    );
    foe.aggro = true;
    g.zone().enemies.push(foe);
  }
  const before = { x: u.x, y: u.y };
  g.updateParty(0.1);
  assert.equal(
    g.s.projectiles.filter((p) => p.companionSkill === 'triple-shot').length,
    3,
    'regroup AI uses existing veteran skill',
  );
  assert(Math.hypot(u.x - before.x, u.y - before.y) > 0, 'regroup keeps moving');
}
{
  const { g, u, e } = scenario('soldier', 4);
  g.companionUseFirstSkill(u, e);
  g.s.time += 2.01;
  const hp = u.hp;
  g.hitParty(u, 20, 0, null, true);
  assert.equal(hp - u.hp, 20, 'ward expires after two seconds');
}
{
  const { g, u } = scenario('archer', 4, 90);
  const restored = C.restore(g.snapshot(), () => 0.9);
  const archer = restored.s.party.find((p) => p.id === u.id);
  restored.engage(restored.zone().enemies[0]);
  restored.updateParty(0.1);
  assert(
    restored.s.projectiles.some((p) => p.source === archer.id && p.slow === 1),
    'existing roster has veteran skill after reload',
  );
}
console.log(
  'PASS Expedition IV real hit/miss Slow, retreat AI, gates, ward expiry and existing roster',
);
