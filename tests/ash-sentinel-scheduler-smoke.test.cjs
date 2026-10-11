'use strict';

// The previous mechanics test invokes each attack explicitly. This smoke test
// checks that the ordinary attack selector and Campaign.tick can reach them.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.5);
  assert(c.enter('citadel'));
  const z = c.zone();
  const boss = z.enemies.find((e) => e.family === 'citadel' && e.type === 'boss');
  assert(boss);
  z.enemies = [boss]; // Preserve the production boss and arena, isolate scheduling.
  c.s.party = [];
  c.s.mercyTime = 0;
  c.hero.maxHp = c.hero.hp = 1000000;
  Object.assign(c.hero, c.safe(boss.home.x - 105, boss.home.y - 45, 'citadel'));
  boss.aggro = true;
  boss.cd = 0;
  boss.lastAttackIndex = -1;
  boss.summonCd = 0;
  const seen = new Set();
  // Sweep deterministic selector rolls, without passing a forced attack index.
  for (let n = 0; n <= 100; n++) {
    c.random = () => (n + 0.001) / 101;
    boss.lastAttackIndex = -1;
    const chosen = c.chooseBossAttack(boss, c.hero);
    if (chosen >= 0) {
      assert(c.startAttack(boss, c.hero), 'normal selector starts chosen attack');
      assert.equal(boss.lastAttackIndex, chosen, 'selected attack reaches live start');
      assert(boss.telegraph && boss.telegraph.family === 'citadel');
      seen.add(chosen);
      boss.telegraph = null;
      boss.sequence = [];
    }
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4],
    mode + ' selector must reach all five specified attacks');

  c.random = () => 0.5;
  boss.lastAttackIndex = -1;
  boss.cd = 0;
  c.s.statistics.events = [];
  const start = c.s.time;
  for (let i = 0; i < 800; i++) {
    c.tick(0.05);
    if (c.s.statistics.events.some((e) => e.type === 'warning' && e.family === 'citadel'))
      break;
  }
  assert(c.s.time > start, 'actual campaign time advanced');
  assert(c.s.statistics.events.some((e) => e.type === 'warning' && e.family === 'citadel'),
    mode + ' live Campaign.tick schedules Citadel boss skills');
}
console.log('PASS Ash Sentinel natural attack selection and active-tick warning smoke');
