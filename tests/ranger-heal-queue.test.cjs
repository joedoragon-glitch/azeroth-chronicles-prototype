'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
function scene(cls = 'mage') {
  const g = new C('normal', cls, () => 0.9);
  g.s.mercyTime = 0;
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) g.zone()[key] = [];
  Object.assign(g.hero, { x: 600, y: 900, order: null });
  g.hero.hp = g.hero.maxHp * 0.85;
  const ranger = g.unit('archer', 610, 900),
    soldier = g.unit('soldier', 620, 900);
  soldier.hp = soldier.maxHp * 0.2;
  ranger.healCd = 0.2;
  g.s.party = [ranger, soldier];
  g.manaCombatActive = () => true;
  return { g, ranger, soldier };
}
const heals = (g) =>
  g.effects.filter((e) => e.type === 'heal' && e.resource === 'health' && e.target === 'hero');
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, ranger, soldier } = scene(cls);
  const cd = ranger.healCd;
  assert(g.healCompanionCasters().includes(ranger), 'conventional Ranger remains an eligible healer');
  assert(g.requestRangerHeal());
  assert(g.queuedRangerHeal());
  assert.equal(heals(g).length, 0);
  assert.equal(ranger.healCd, cd);
  assert(g.requestRangerHeal());
  assert(g.requestRangerHeal());
  assert.equal(ranger.healCd, cd);
  g.tick(0.1);
  assert(g.queuedRangerHeal());
  assert.equal(heals(g).length, 0);
  g.tick(0.11);
  assert.equal(g.queuedRangerHeal(), null);
  assert.equal(heals(g).length, 1);
  assert(g.hasSupportEffect(g.hero, 'health'));
  assert(
    !g.hasSupportEffect(soldier, 'health'),
    'explicit hero request precedes automatic ally triage',
  );
  assert.equal(ranger.healCd, C.rules.rangerSupport.cooldown);
  g.tick(0.1);
  assert.equal(heals(g).length, 1);
}
console.log(
  'PASS three hero classes: real tick cooldown expiry, one hero heal, manual priority and no repeated-tap stack',
);
for (const mode of ['absent', 'dead', 'resting']) {
  const { g, ranger } = scene();
  if (mode === 'absent') g.s.party = [];
  if (mode === 'dead') ranger.hp = 0;
  if (mode === 'resting') ranger.active = false;
  assert(!g.requestRangerHeal());
  assert.equal(g.queuedRangerHeal(), null);
}
for (const mode of [
  'recall',
  'death',
  'zone',
  'rest',
  'caster-death',
  'hero-change',
  'challenge',
]) {
  const { g, ranger } = scene();
  assert(g.requestRangerHeal());
  if (mode === 'recall') g.recallParty();
  if (mode === 'death') {
    g.hero.hp = 5;
    g.hitParty(g.hero, 999999, 0, null, true);
  }
  if (mode === 'zone') assert(g.enter('march'));
  if (mode === 'rest') ranger.active = false;
  if (mode === 'caster-death') ranger.hp = 0;
  if (mode === 'hero-change') g.s.hero = { ...g.hero };
  if (mode === 'challenge') g.s.challenge.pending = true;
  assert.equal(g.queuedRangerHeal(), null, mode);
  ranger.healCd = 0;
  assert(!g.resolveQueuedRangerHeal());
  assert.equal(heals(g).length, 0, mode);
}
console.log(
  'PASS unavailable/fallen/reserve casters, Recall, real defeat/recovery, zone, hero and challenge lifecycle',
);
{
  const { g, ranger } = scene();
  assert(g.requestRangerHeal());
  const before = g.snapshot();
  const loaded = C.restore(before);
  assert(loaded);
  assert.equal(loaded.queuedRangerHeal(), null);
  assert(!JSON.stringify(before).includes('rangerHealRequests'));
  ranger.healCd = 0;
  assert(g.resolveQueuedRangerHeal());
  assert.equal(heals(g).length, 1);
  assert.equal(ranger.healCd, 10);
}
for (const covered of [false, true]) {
  const { g, ranger } = scene();
  assert(g.requestRangerHeal());
  if (covered) g.addSupportEffect(g.hero, 'health', 50);
  else g.hero.hp = g.hero.maxHp;
  ranger.healCd = 0;
  assert(!g.resolveQueuedRangerHeal());
  assert.equal(g.queuedRangerHeal(), null);
  assert.equal(ranger.healCd, 0);
  assert.equal(heals(g).length, 0);
}
{
  const { g, ranger } = scene();
  let silenced = true;
  g.mageSilenceActive = (u) => u === ranger && silenced;
  assert(g.requestRangerHeal());
  ranger.healCd = 0;
  assert(!g.resolveQueuedRangerHeal());
  assert(g.queuedRangerHeal());
  assert.equal(ranger.healCd, 0);
  silenced = false;
  assert(g.resolveQueuedRangerHeal());
  assert.equal(heals(g).length, 1);
  assert.equal(g.queuedRangerHeal(), null);
}
{
  const { g, ranger } = scene();
  const other = g.unit('archer', 630, 900);
  other.healCd = 0.1;
  g.s.party.push(other);
  assert(g.requestRangerHeal());
  other.healCd = 0;
  assert(g.resolveQueuedRangerHeal());
  assert.equal(ranger.healCd, 0.2);
  assert.equal(other.healCd, 10);
  assert.equal(heals(g).length, 1);
}
{
  const { g, ranger } = scene();
  ranger.healCd = 0;
  assert(g.requestRangerHeal());
  assert.equal(g.queuedRangerHeal(), null);
  assert.equal(heals(g).length, 1);
}
console.log(
  'PASS transient save boundary, healthy/covered hero, Silence waiting, first eligible caster and unchanged ready Heal',
);
