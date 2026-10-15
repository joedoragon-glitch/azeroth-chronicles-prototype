'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
function arena(cls = 'paladin', mode = 'normal') {
  const c = new C(mode, cls, () => 0.9);
  c.enter('supply-vale');
  const e = c.zone().enemies.find((e) => e.roomCaptain);
  const point = Array.from({ length: 32 }, (_, i) => ({
    x: e.x + 110 * Math.cos((i * Math.PI) / 16),
    y: e.y + 110 * Math.sin((i * Math.PI) / 16),
  })).find((p) => !c.blocked(p.x, p.y) && c.line(e, p));
  assert(point, 'real open firing lane');
  Object.assign(c.hero, point);
  c.hero.hp = c.hero.maxHp = 10000;
  c.s.party = [];
  c.zone().enemies = [e];
  c.s.mercyTime = 0;
  c.engage(e);
  return { c, e };
}
function select(c, e, index) {
  for (let i = 0; i < 100; i++) {
    e.lastCaptainAttack = -1;
    c.random = () => (i + 0.5) / 100;
    c.startCaptainAttack(e, c.hero);
    if (e.telegraph.index === index) return;
  }
  throw Error('Scornfang slot unavailable: ' + index);
}
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare']) {
    {
      const { c, e } = arena(cls, mode);
      select(c, e, 3);
      assert.equal(e.telegraph.shotNumber, 1);
      assert.equal(e.sequence.length, 3);
      const { createCanvas } = require('@napi-rs/canvas');
      const canvas = createCanvas(375, 800),
        ctx = canvas.getContext('2d');
      const screen = (p) => ({ x: 188 + (p.x - c.hero.x) * 0.4, y: 330 + (p.y - c.hero.y) * 0.4 });
      require('../src/prototype/combat-visuals.js').ground(ctx, screen, c, 'cue', 0);
      const tag = ctx.getImageData(178, 345, 1, 1).data;
      assert(
        tag[3] > 240 && tag[0] < 60 && tag[1] < 60,
        'number tag remains visible below the target, outside the caption',
      );
      const digits = ctx.getImageData(176, 345, 24, 16).data;
      let lit = 0;
      for (let i = 0; i < digits.length; i += 4)
        if (digits[i] > 180 && digits[i + 1] > 160 && digits[i + 3] > 240) lit++;
      assert(lit >= 10, 'actual counter glyphs survive the caption/aim lane rendering');
      assert.deepEqual(
        e.sequence.map((a) => a.shotNumber),
        [2, 3, 4],
      );
      const launches = [];
      for (let shot = 1; shot <= 4; shot++) {
        assert.equal(e.telegraph.shotNumber, shot);
        assert.equal(c.s.projectiles.length, shot - 1);
        c.resolveAttack(e);
        const p = c.s.projectiles.at(-1);
        assert.equal(p.damage, e.damage * 0.45);
        assert.equal(p.speed, 400);
        assert.equal(p.style, 'stone');
        launches.push(p);
        e.telegraph = c.advanceQueuedAttack(e);
      }
      assert.equal(launches.length, 4);
      assert.equal(e.telegraph, null);
      const hp = c.hero.hp;
      c.updateProjectiles(0.3);
      assert(c.hero.hp < hp, 'real sling projectiles hit through an open lane');
      select(c, e, 3);
      c.hero.hp = 0;
      c.resolveAttack(e);
      assert.equal(e.sequence.length, 0, 'target death cancels remaining volley');
    }
    {
      const { c, e } = arena(cls, mode);
      select(c, e, 4);
      const first = c.attackPatches(e.telegraph),
        second = c.attackPatches(e.sequence[0]);
      assert.equal(first.length, 2);
      assert.equal(second.length, 2);
      const all = [...first, ...second];
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++)
          assert(
            Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y) > all[i].radius + all[j].radius,
            'Hot Zone keeps safe gaps',
          );
      c.resolveAttack(e);
      assert.equal(c.s.hazards.length, 2);
      e.telegraph = c.advanceQueuedAttack(e);
      assert.equal(e.telegraph.timer, 0.65, 'second pair gets a distinct warning');
      c.resolveAttack(e);
      assert.equal(c.s.hazards.length, 4);
      c.disengage(e, 0.1);
      assert.equal(c.s.hazards.length, 0);
      assert.equal(e.sequence.length, 0);
    }
    {
      const { c, e } = arena(cls, mode);
      for (const phase of [false, true]) {
        e.captainPhase = phase;
        c.hero.slow = 0;
        const plan = {
          ...C.rules.roomCaptains['supply-vale'].attacks[1],
          captainSkill: true,
          captainProfile: 'supply-vale',
          index: 1,
          x: c.hero.x,
          y: c.hero.y,
          fromX: e.x,
          fromY: e.y,
          radius: 100,
          count: 1,
        };
        c.resolveArea(e, plan);
        assert.equal(c.hero.slow, phase ? 4.8 : 4.4, 'regular slow duration scales once');
        assert.equal(
          c.regularSlowDuration(e, { ...plan, rogueMove: true }, 2),
          2,
          'rogue slow never inherits passive',
        );
      }
    }
  }
{
  let state = 91;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const { c, e } = arena();
  c.random = random;
  c.hero.hp = c.hero.maxHp = 100000;
  const slots = new Set();
  for (let i = 0; i < 1400; i++) {
    c.tick(0.1);
    for (const ev of c.s.statistics.events)
      if (ev.type === 'warning' && ev.captain === 'supply-vale') slots.add(ev.index);
  }
  for (let i = 0; i < 5; i++) assert(slots.has(i), 'natural captain AI uses slot ' + i);
}
// Intrinsic wolf movement is owner/form scoped, without mutating base stats.
for (const form of ['normal', 'true']) {
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('vale');
  const owner = c.bossEnemy(c.boss('thorn'), form, c.safe(900, 1100));
  const wolf = c.makeEnemy(
    { species: 'wolf', hp: 100, damage: 1, level: 1, name: 'Owned wolf' },
    c.safe(960, 1100),
  );
  wolf.summon = true;
  wolf.owner = owner.id;
  c.zone().enemies = [owner, wolf];
  c.zone(); // Settle the existing population/night migration before measuring the passive.
  const base = wolf.baseHp;
  for (let i = 0; i < 20; i++)
    assert.equal(c.ownedSummonMovementFactor(wolf), form === 'true' ? 1.15 : 1.08);
  assert.equal(wolf.baseHp, base);
  assert.equal(c.ownedSummonMovementFactor({ ...wolf, summon: false }), 1);
  assert.equal(c.ownedSummonMovementFactor({ ...wolf, owner: 'another-owner' }), 1);
  assert.equal(c.ownedSummonMovementFactor(owner), 1);
}
console.log(
  'PASS Scornfang five real slots, four sling shots, two-pair Hot Zone, regular-only Slow, natural AI and scoped wolf passive',
);
