'use strict';
const assert = require('node:assert/strict');
const C = require('../../src/prototype/engine');
const fixture = require('../../tests/helpers/specialist-night-context.cjs');

function sling(step) {
  const c = fixture.campaign('normal', 'paladin');
  c.enter('supply-vale');
  const e = c.zone().enemies.find((u) => u.roomCaptain);
  const point = Array.from({ length: 32 }, (_, i) => ({
    x: e.x + 110 * Math.cos((i * Math.PI) / 16),
    y: e.y + 110 * Math.sin((i * Math.PI) / 16),
  })).find((p) => !c.blocked(p.x, p.y) && c.line(e, p));
  assert(point);
  c.s.party = [];
  c.s.mercyTime = 0;
  c.zone().enemies = [e];
  Object.assign(c.hero, point, { hp: 10000, maxHp: 10000 });
  c.engage(e);
  for (let i = 0; i < 100; i++) {
    e.lastCaptainAttack = -1;
    c.random = () => (i + 0.5) / 100;
    c.startCaptainAttack(e, c.hero);
    if (e.telegraph.index === 3) break;
  }
  assert.equal(e.telegraph.index, 3);
  for (let shot = 0; shot < 4; shot++) {
    c.resolveAttack(e);
    e.telegraph = c.advanceQueuedAttack(e);
  }
  const shots = c.s.projectiles.map((p) => ({ ...p }));
  for (let i = 0; i < Math.round(0.3 / step); i++) c.updateProjectiles(step);
  return {
    step,
    origin: { x: e.x, y: e.y },
    target: point,
    shots: shots.length,
    hpLost: 10000 - c.hero.hp,
    remaining: c.s.projectiles.length,
  };
}

const coarse = sling(0.3),
  fine = sling(0.05);
assert.equal(coarse.hpLost, 0, 'reproduce the old out-of-contract fixture failure');
assert(fine.hpLost > 0, 'real-sized steps preserve actual sling contact');
assert.equal(coarse.shots, 4);
assert.equal(fine.shots, 4);

const c = fixture.campaign('normal');
c.enter('crypt');
const old = c.zone().enemies.find((u) => u.family === 'crypt' && u.type === 'boss');
old.anastylosis = 4;
c.enter('vale');
const active = c.s.zones.crypt.enemies.find((u) => u.id === old.id);
assert(active && active !== old);
assert.equal(old.anastylosis, 4, 'the detached object can retain obsolete fields');
assert(!active.anastylosis, 'the actual defender has no stale buff');

const grace = fixture.campaign('nightmare-grace');
grace.s.party = [];
grace.zone().enemies = [];
for (let i = 0; i < 50; i++) grace.updateEnemies(0.1);
assert.equal(grace.s.nightmareIntroRemaining, 30);
assert.equal(grace.night(), false);
grace.advanceDaylight(30);
assert.equal(grace.night(), true);
const phases = fixture.contexts.map((context) => {
  const game = fixture.campaign(context);
  return {
    context,
    mode: game.s.mode,
    intro: game.s.nightmareIntroRemaining,
    phase: game.daylightPhase().phase,
    multipliers: game.multipliers(),
    tempo: game.nightTempo(),
  };
});
console.log(
  JSON.stringify(
    {
      coarse,
      fine,
      defenderReset: {
        sameId: active.id === old.id,
        replaced: active !== old,
        detachedBuff: old.anastylosis,
        activeBuff: active.anastylosis || 0,
      },
      enemyOnlyIntroAfterFiveSeconds: 30,
      phases,
    },
    null,
    2,
  ),
);
