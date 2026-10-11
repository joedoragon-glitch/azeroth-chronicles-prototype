'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const fresh = () => new Campaign('normal', 'paladin', () => 0);
const captain = (zone, name) => {
  const c = fresh();
  c.enter(zone);
  const e = c.zone().enemies.find((x) => x.name === name);
  assert(e, name + ' present');
  c.s.party = [];
  c.line = () => true;
  return { c, e };
};
const near = (u, e, degrees, distance = 100) => {
  const a = (degrees * Math.PI) / 180;
  u.x = e.x + distance * Math.cos(a);
  u.y = e.y + distance * Math.sin(a);
};
{
  const { c, e } = captain('supply-march', 'Direjaw');
  c.hero.hp = c.hero.maxHp = 10000;
  const a = {
    kind: 'cone', angleDegrees: 196, x: e.x, y: e.y, fromX: e.x, fromY: e.y,
    angle: 0, radius: 165, coefficient: .8, count: 1,
  };
  near(c.hero, e, 90);
  const before = c.hero.hp;
  c.resolveArea(e, a);
  assert(c.hero.hp < before, '196-degree Spatter Fan covers an off-axis target at 90 degrees');
  near(c.hero, e, 105);
  const outside = c.hero.hp;
  c.resolveArea(e, a);
  assert.equal(c.hero.hp, outside, 'Spatter Fan does not hit outside its 98-degree half-angle');
}
{
  const { c, e } = captain('supply-highlands', 'Crag Tyrant');
  c.random = () => 0;
  const target = { x: e.x + 70, y: e.y };
  e.lastCaptainAttack = -1;
  assert(c.startCaptainAttack(e, target));
  assert.equal(e.telegraph.name, 'Hostile Takeover');
  assert.equal(e.telegraph.timer, 0, 'Broker gives no initial warning above 550 HP');
  e.hp = 550;
  e.lastCaptainAttack = -1;
  assert(c.startCaptainAttack(e, target));
  assert.equal(e.telegraph.timer, .95, 'Broker restores original warnings in final 550 HP');
  c.hero.hp = c.hero.maxHp = 10000;
  near(c.hero, e, 180);
  const a = {kind: 'cone', angleDegrees: 360, x: e.x, y: e.y,
    fromX: e.x, fromY: e.y, angle: 0, radius: 165, coefficient: .85, count: 1};
  const before = c.hero.hp;
  c.resolveArea(e, a);
  assert(c.hero.hp < before, 'Bad Deal hits behind the captain with 360-degree coverage');
}
{
  const { c, e } = captain('supply-crown', 'Dreadmaw');
  c.hero.hp = c.hero.maxHp = 10000;
  near(c.hero, e, 0, 70);
  c.tacticalDirectTargetable = () => true;
  c.tacticalRogueLeashAllows = () => true;
  const spawned = [];
  for (let i = 0; i < 4; i++) {
    const u = c.makeEnemy({ species: 'ashbeast', name: 'Audit broodling',
      hp: 100, damage: 1, level: e.level, gold: 0, xp: 0 },
      { x: e.x + 120 + i * 25, y: e.y + 120 });
    u.summon = true;
    u.owner = e.id;
    c.zone().enemies.push(u);
    spawned.push(u);
  }
  assert.equal(c.captainOwnedSummons(e).length, 4);
  e.captainReflect = 8;
  const hp = e.hp, heroHp = c.hero.hp;
  assert(c.damage(e, 100, 'hero'));
  assert.equal(e.hp, hp, 'four broodlings make Dreadmaw immune');
  assert.equal(c.hero.hp, heroHp, 'zero actual damage cannot reflect');
  spawned[0].hp = 0;
  assert(c.damage(e, 100, 'hero'));
  assert(e.hp < hp, 'one fallen broodling exposes Dreadmaw');
  assert(c.hero.hp < heroHp, 'damage taken is reflected during carapace');
}
{
  const { c, e } = captain('frontier', 'Cinder Warlord');
  const worker = c.makeEnemy({
    species: 'orc', name: 'Overtime audit worker', hp: 100, damage: 5,
    level: e.level, gold: 0, xp: 0,
  }, { x: e.x + 120, y: e.y });
  c.zone().enemies.push(worker);
  e.hp = e.maxHp * .59;
  assert(c.triggerCaptainPhase(e), 'overtime activates at 60 percent health');
  assert(worker.quotaOvertime > 0, 'initial order recruits eligible worker');
  worker.quotaOvertime = 0;
  e.captainOvertimeCd = .1;
  e.aggro = true;
  c.updateEnemies(.2);
  assert(worker.quotaOvertime > 0, 'overtime order repeats after timer expires');
  assert.equal(e.captainOvertimeCd, 12, 'next recruitment repeats after 12 seconds');
}
{
  const { c, e } = captain('supply-march', 'Direjaw');
  c.hero.hp = c.hero.maxHp = 10000;
  c.s.hazards = [];
  const plan = Campaign.rules.roomCaptains['supply-march'].attacks[2];
  const a = {
    ...plan, fromX: e.x, fromY: e.y, x: c.hero.x, y: c.hero.y,
    radius: plan.radius * Campaign.rules.bossCadence.areaRangeMultiplier,
    captainSkill: true,
  };
  c.resolveArea(e, a);
  assert.equal(c.s.hazards.length, 4, 'Silt Slick creates four real hazard actors');
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const x = c.s.hazards[i], y = c.s.hazards[j];
      assert(Math.hypot(x.x - y.x, x.y - y.y) > x.radius + y.radius,
        'persistent Silt Slick patches never overlap');
    }
}
{
  const { c, e } = captain('supply-highlands', 'Crag Tyrant');
  const plan = Campaign.rules.roomCaptains['supply-highlands'].attacks[1];
  const a = {
    ...plan, x: e.x, y: e.y, fromX: e.x, fromY: e.y,
    radius: plan.radius * Campaign.rules.bossCadence.areaRangeMultiplier,
    captainSkill: true,
  };
  const patches = c.attackPatches(a);
  assert.equal(patches.length, 5, 'Margin Call creates all five impact areas');
  assert(patches.some(p => p.x === a.x && p.y === a.y),
    'Margin Call retains the targeted impact zone');
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++)
    assert(Math.hypot(patches[i].x-patches[j].x,patches[i].y-patches[j].y) >
      patches[i].radius+patches[j].radius, 'Margin Call areas must not overlap');
}
{
  const { c, e } = captain('supply-crown', 'Dreadmaw');
  c.hero.hp = c.hero.maxHp = 10000;
  c.tacticalDirectTargetable = () => true;
  c.tacticalRogueLeashAllows = () => true;
  c.hero.x = e.x + 70;
  c.hero.y = e.y;
  e.captainReflect = 8;
  const hp = e.hp, hero = c.hero.hp;
  assert(c.damage(e, 100, 'hero'));
  assert(e.hp < hp && c.hero.hp < hero,
    'unshielded Ash Carapace reflects damage through normal party defenses');
  e.captainReflect = 0;
  const after = c.hero.hp;
  assert(c.damage(e, 100, 'hero'));
  assert.equal(c.hero.hp, after, 'reflection stops after its eight-second window');
}
console.log('PASS captain attack angles, zero-warning fatigue, brood shield/reflection, and overtime repeat');
