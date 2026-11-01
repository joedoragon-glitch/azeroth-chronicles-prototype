'use strict';
// This suite checks authored hits independently of skill evasion. Dedicated
// skill-evasion suites verify the new probability and missed-contact rules.
require('./helpers/legacy-skill-evasion.cjs')();
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function scene(family = 'crypt') {
  const shiftX = C.rules.barriers[0].bounds[1] + 450 - 1400;
  const g = new C('normal', 'paladin', () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.mercyTime = 0;
  completeFieldOpening(g);
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  g.hero.level = 20;
  g.hero.maxHp = g.hero.hp = g.heroNaturalMaxHp();
  Object.assign(g.hero, { x: 1380 + shiftX, y: 1700 });
  g.s.normal[family] = g.s.true[family] = true;
  const u = g.unit('pet', 1400 + shiftX, 1700, family),
    ally = g.unit('soldier', 1450 + shiftX, 1730),
    other = g.unit('archer', 1440 + shiftX, 1750);
  g.s.party = [u, ally, other];
  const e = g.makeEnemy(
    { species: 'goblin', level: 20, hp: 100000, damage: 0, xp: 0, gold: 0 },
    { x: 1630 + shiftX, y: 1700 },
  );
  assert(g.clearSegment(u,e,15,true), 'pet fixture uses dry same-bank ground at unchanged separation');
  z.enemies = [e];
  g.engage(e);
  const events = [],
    event = g.event;
  g.event = function (type, detail) {
    events.push({ type, ...detail });
    return event.call(this, type, detail);
  };
  return { g, u, ally, other, e, events };
}
const fly = (g) => {
  for (let i = 0; i < 65; i++) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
};
for (const mode of [
  'contact',
  'miss',
  'dead-source',
  'resting-source',
  'blocked-ally',
  'far-ally',
  'dead-ally',
  'resting-ally',
  'full-pet',
  'overheal',
  'hero',
  'edge',
]) {
  const { g, u, ally, other, e, events } = scene();
  u.hp = u.maxHp * 0.5;
  ally.hp = ally.maxHp * 0.1;
  other.hp = other.maxHp * 0.4;
  if (['blocked-ally', 'far-ally', 'dead-ally', 'resting-ally'].includes(mode))
    other.hp = other.maxHp;
  if (mode === 'blocked-ally') {
    const line = g.line;
    g.line = (a, b) => (b === ally ? false : line.call(g, a, b));
  }
  if (mode === 'far-ally') ally.x = u.x + 280.01;
  if (mode === 'dead-ally') ally.hp = 0;
  if (mode === 'resting-ally') ally.active = false;
  if (mode === 'full-pet') u.hp = u.maxHp;
  if (mode === 'overheal') {
    u.hp = u.maxHp - 1;
    ally.hp = ally.maxHp - 1;
    other.hp = other.maxHp;
  }
  if (mode === 'hero') {
    ally.hp = ally.maxHp;
    other.hp = other.maxHp;
    g.hero.maxHp = g.hero.hp = 10000;
    g.hero.hp = 1000;
  }
  if (mode === 'edge') Object.assign(ally, { x: u.x + 280, y: u.y });
  const before = { pet: u.hp, ally: ally.hp, other: other.hp, hero: g.hero.hp };
  assert(g.companionUseFirstSkill(u, e));
  assert.equal(u.skill1Cd, 8);
  assert.equal(u.hp, before.pet);
  assert.equal(ally.hp, before.ally, 'heal waits for actual contact');
  if (mode === 'miss') e.y += 180;
  if (mode === 'dead-source') u.hp = 0;
  if (mode === 'resting-source') u.active = false;
  fly(g);
  const noContact = ['miss', 'dead-source', 'resting-source'].includes(mode);
  if (noContact) {
    assert.equal(ally.hp, before.ally);
    assert.equal(other.hp, before.other);
    assert.equal(g.hero.hp, before.hero);
    if (mode !== 'dead-source') assert.equal(u.hp, before.pet);
  } else {
    assert(
      Math.abs(u.hp - Math.min(u.maxHp, before.pet + u.maxHp * 0.1)) < 1e-7,
      'self heal is 10% pet HP',
    );
    const excluded = ['blocked-ally', 'far-ally', 'dead-ally', 'resting-ally'].includes(mode);
    const allyGain =
      mode === 'hero' || excluded ? 0 : Math.min(ally.maxHp - before.ally, u.maxHp * 0.1);
    assert(Math.abs(ally.hp - before.ally - allyGain) < 1e-7, mode + ' eligible ally healing');
    assert.equal(other.hp, before.other, 'one ally only; no extra area heal');
    if (mode === 'hero') {
      assert(Math.abs(g.hero.hp - before.hero - u.maxHp * 0.1) < 1e-7);
      assert(events.some((e) => e.type === 'heal' && e.target === 'hero' && e.fromX === u.x));
    }
  }
}
// Current roster updates are definition-driven and retain identity/progression.
for (const family of ['crypt', 'archive', 'abyss', 'citadel']) {
  const { g, u } = scene(family),
    id = u.id;
  const restored = C.restore(g.snapshot(), () => 0.9),
    pet = restored.s.party.find((x) => x.id === id);
  assert.equal(pet.petFamily, family);
  assert.equal(pet.active, true);
  assert.equal(
    restored.petSkillDefinition(pet, 1).multiplier,
    C.rules.petCompanions[family].first.multiplier,
  );
  assert.equal(restored.petSkillDefinition(pet, 2).cap, C.rules.petCompanions[family].second.cap);
}
for (const family of ['archive', 'abyss']) {
  const { g, u, e, events } = scene(family),
    def = g.petSkillDefinition(u, 2);
  // Position targets inside the enlarged footprint, including a newly covered edge.
  Object.assign(e, { x: u.x + 200, y: u.y });
  e.home = { x: e.x, y: e.y };
  for (let i = 1; i < def.cap + 2; i++) {
    const p =
      def.shape === 'line'
        ? { x: u.x + 210 + i * 8, y: u.y + (i === 1 ? 45 : i * 3) }
        : { x: e.x + (i === 1 ? 105 : i * 12), y: e.y + i * 2 };
    const add = g.makeEnemy(
      { species: 'goblin', level: 20, hp: 10000, damage: 0, xp: 0, gold: 0 },
      p,
    );
    g.zone().enemies.push(add);
    g.engage(add);
  }
  const before = g.zone().enemies.map((e) => e.hp);
  assert(g.companionUseSecondSkill(u, e));
  assert(events.some((e) => e.type === 'companionChargeStart'));
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  const hits = g.zone().enemies.filter((e, i) => e.hp < before[i]);
  assert.equal(hits.length, def.cap, 'bounded expanded area hits the authored cap');
  assert(
    hits.every((e) => e.slow === { archive: 2.25, abyss: 1.25 }[family]),
    'contact Slow includes the shared duration bonus',
  );
  const event = events.find((e) => e.type === 'petSkill' && e.stage === 'release' && e.slot === 2);
  assert.equal(event.range, def.range);
  assert.equal(event.halfWidth, def.halfWidth || 0);
  assert.equal(event.radius, def.radius || 0);
}
console.log(
  'PASS ranged pet contact healing, recipient safety/caps/LOS, existing-roster updates and expanded charged damage/Slow/effect geometry',
);
