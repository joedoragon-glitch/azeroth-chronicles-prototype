'use strict';
const nightContext = require('./helpers/specialist-night-context.cjs');
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const FX = require('../src/prototype/combat-visuals.js');
function arena(cls = 'paladin', mode = 'normal', form = 'normal') {
  const c = nightContext.campaign(mode, cls, () => 0.9);
  c.enter('crypt');
  const e = c.bossEnemy(c.boss('crypt'), form, c.safe(850, 850));
  c.zone().enemies = [e];
  Object.assign(c.hero, c.safe(e.x + 80, e.y));
  c.s.party = [c.unit('soldier', c.hero.x, c.hero.y), c.unit('archer', c.hero.x, c.hero.y)];
  c.hero.hp = c.hero.maxHp = 10000;
  c.s.mercyTime = 0;
  c.engage(e);
  return { c, e };
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of nightContext.contexts)
    for (const form of ['normal', 'true']) {
      {
        const { c, e } = arena(cls, mode, form);
        const targets = c.combatTargets();
        for (const u of targets) {
          u.hp = 1;
          u.slow = 0;
          u.immune = 0;
        }
        c.startAttack(e, c.hero, 4);
        assert.equal(c.s.hazards.length, 0, 'wave cannot resolve during preparation');
        assert.equal(c.hero.hp, 1);
        assert.equal(FX.warningShapes(e.telegraph, []).length, 1);
        c.resolveAttack(e);
        e.telegraph = null;
        const wave = c.s.hazards[0];
        assert.equal(wave.damage, 0);
        assert.equal(wave.radius, 0);
        c.updateProjectiles(0.25);
        for (const u of targets) {
          assert.equal(u.hp, 1, 'zero-damage wave bypasses armor/minimum damage entirely');
          assert.equal(u.slow, 2, 'real swept contact applies exactly two seconds');
        }
        assert.equal(c.s.statistics.deaths, 0);
        c.disengage(e, 0.1);
        assert.equal(c.s.hazards.length, 0);
        cases++;
      }
      {
        const { c, e } = arena(cls, mode, form);
        const received = form === 'true' ? 0.88 : 0.94;
        c.s.party = [];
        c.tacticalDirectTargetable = () => true;
        c.tacticalRogueLeashAllows = () => true;
        let hp = e.hp;
        c.damage(e, 40, 'hero');
        assert(Math.abs(hp - e.hp - 40 * received) < 1e-7);
        const heroHp = c.hero.hp;
        c.startAttack(e, c.hero, 5);
        assert.equal(
          FX.warningShapes(e.telegraph, []).length,
          0,
          'assembly has no hostile floor footprint',
        );
        assert(!e.anastylosis);
        c.resolveAttack(e);
        e.telegraph = null;
        assert.equal(e.anastylosis, 4);
        assert.equal(c.hero.hp, heroHp, 'self defense has no attack damage');
        assert.equal(c.s.hazards.length, 0);
        assert.equal(c.s.projectiles.length, 0);
        assert(
          !c.effects.some((f) => f.type === 'enemyVfx' && f.stage === 'impact'),
          'assembly has no fake hit event',
        );
        hp = e.hp;
        c.damage(e, 40, 'hero');
        assert(
          Math.abs(hp - e.hp - 40 * received * 0.8) < 1e-7,
          'multiplicative .752/.704 defense',
        );
        for (let i = 0; i < 39; i++) c.updateEnemies(0.1);
        assert(e.anastylosis > 0, 'buff survives 3.9 seconds');
        c.updateEnemies(0.101);
        assert.equal(e.anastylosis, 0, 'four-second buff expires');
        hp = e.hp;
        c.damage(e, 40, 'hero');
        assert(Math.abs(hp - e.hp - 40 * received) < 1e-7);
        c.startAttack(e, c.hero, 5);
        c.resolveAttack(e);
        const raw = c.snapshot();
        assert(!raw.zones.crypt.enemies.find((u) => u.id === e.id).anastylosis);
        c.enter('vale');
        const reset = c.s.zones.crypt.enemies.find((u) => u.id === e.id);
        assert(reset, 'the actual Crypt roster retains the same-ID Lifebinder');
        assert.notStrictEqual(reset, e, 'door travel replaces the encounter actor');
        assert(!reset.anastylosis, 'replacement has no stale self-defense');
        assert(!reset.telegraph && !reset.motion && !reset.aggro);
        cases++;
      }
      {
        const { c, e } = arena(cls, mode, form);
        c.startAttack(e, c.hero, 3);
        const first = c.attackPatches(e.telegraph),
          next = c.attackPatches(e.sequence[0]);
        assert.equal(first.length, 2);
        assert.equal(next.length, 2);
        assert.equal(new Set([...first, ...next].map((p) => p.x + '/' + p.y)).size, 4);
        c.resolveAttack(e);
        assert.equal(c.s.hazards.length, 2, 'first pair creates exactly two beds');
        e.telegraph = e.sequence.shift();
        c.resolveAttack(e);
        assert.equal(c.s.hazards.length, 4, 'second pair adds exactly two beds');
        assert(c.s.hazards.every((h) => h.life === 4 && h.damage === e.damage * 0.25));
        c.s.projectiles = [];
        c.startAttack(e, c.hero, 1);
        c.resolveAttack(e);
        assert.equal(c.s.projectiles.length, 3);
        assert.deepEqual(
          c.s.projectiles.map((p) => p.delay),
          form === 'true' ? [0, 0.28, 0.56] : [0, 0.55, 1.1],
        );
        c.disengage(e, 0.1);
        assert.equal(c.s.projectiles.length, 0);
        cases++;
      }
    }
// Immunity, real cover and missing/fallen targets retain the standard status contract.
{
  const { c, e } = arena();
  c.s.party[0].hp = 0;
  c.hero.immune = 2;
  c.s.party[1].immune = 0;
  c.startAttack(e, c.hero, 4);
  c.resolveAttack(e);
  c.line = () => false;
  c.updateProjectiles(0.25);
  assert.equal(c.s.party[1].slow || 0, 0);
  c.line = () => true;
  c.updateProjectiles(0.25);
  assert.equal(c.hero.slow || 0, 0);
  assert.equal(c.s.party[0].hp, 0);
}
// Natural selection/ticking executes every approved slot without force-selecting it.
{
  let state = 1701;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const { c, e } = arena();
  c.random = random;
  c.s.party = [];
  c.hero.hp = c.hero.maxHp = 100000;
  const slots = new Set();
  for (let i = 0; i < 1800; i++) {
    c.tick(0.1);
    for (const ev of c.s.statistics.events)
      if (ev.type === 'warning' && ev.family === 'crypt') slots.add(ev.index);
  }
  for (let i = 0; i < 6; i++) assert(slots.has(i), 'natural AI uses Lifebinder slot ' + i);
  assert(c.s.statistics.deaths === 0);
  assert(e.hp > 0);
}
console.log(
  'PASS six-slot Lifebinder: ' +
    cases +
    ' class/mode/form outcomes, real status/mitigation/scheduling, immunity/cover and natural AI',
);
