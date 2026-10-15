'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const succession of [false, true])
    for (const kind of ['area', 'projectile', 'hazard', 'drain']) {
      const c = new C('normal', cls, () => 0.9, { succession });
      c.s.party = [];
      c.s.mercyTime = 0;
      const e = c.bossEnemy(c.boss('thorn'), 'normal', c.safe(900, 1100));
      const p = c.safe(e.x + 50, e.y);
      Object.assign(c.hero, p, { hp: 1, immune: 0, slow: 0 });
      c.zone().enemies = [e];
      c.engage(e);
      if (kind === 'area')
        c.resolveArea(e, {
          kind: 'circle',
          persistent: true,
          x: p.x,
          y: p.y,
          fromX: e.x,
          fromY: e.y,
          radius: 100,
          count: 1,
          coefficient: 100,
          slow: true,
        });
      if (kind === 'projectile') {
        c.s.projectiles = Array.from({ length: 3 }, () => ({
          x: p.x - 10,
          y: p.y,
          dx: 1,
          dy: 0,
          speed: 100,
          life: 1,
          damage: 100000,
          source: 'enemy',
          sourceId: e.id,
          slow: 3,
        }));
        c.updateProjectiles(0.1);
      }
      if (kind === 'hazard') {
        c.s.hazards = Array.from({ length: 3 }, () => ({
          x: p.x,
          y: p.y,
          fromX: e.x,
          fromY: e.y,
          radius: 100,
          kind: 'circle',
          life: 4,
          tick: 0,
          damage: 100000,
          sourceId: e.id,
          slow: true,
        }));
        c.updateProjectiles(0.1);
      }
      if (kind === 'drain') {
        e.telegraph = { nightSkill: 'drain', radius: 200, coefficient: 10000, slowDuration: 3 };
        c.resolveAttack(e);
      }
      assert.equal(c.s.statistics.deaths, 1, kind + ': no stale second fatal hit');
      assert.equal(c.hero.slow || 0, 0, kind + ': no stale Slow on revived/pending hero');
      assert.equal(c.s.projectiles.length, 0);
      assert.equal(c.s.hazards.length, 0, kind + ': no beds created after death');
      assert(!c.hero.keeperHeld && !c.hero.deathRollHeld);
    }
// A lethal received hit remains part of the reflection budget exactly once.
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('supply-crown');
  const e = c.zone().enemies.find((e) => e.roomCaptain);
  c.zone().enemies = [e];
  c.s.party = [];
  Object.assign(c.hero, c.safe(e.x + 50, e.y), { hp: 10000, maxHp: 10000 });
  e.xp = 0;
  e.gold = 0;
  c.engage(e);
  e.hp = 2;
  e.captainReflect = 8;
  const before = c.hero.hp;
  c.damage(e, 100, 'hero');
  assert.equal(e.hp, 0);
  assert(Math.abs(before - c.hero.hp - 0.6) < 1e-7, '30% of actual lethal two-HP loss');
  const after = c.hero.hp;
  assert(!c.damage(e, 100, 'hero'));
  assert.equal(c.hero.hp, after);
}
console.log(
  'PASS 24 fatal area/projectile/hazard/drain boundaries across classes/Succession and exact lethal reflection',
);
