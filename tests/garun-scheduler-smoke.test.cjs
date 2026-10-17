'use strict';

// Exercise the unforced boss selector and a real Campaign.tick, complementing
// garun-mechanics.test.cjs (which explicitly invokes the seven mechanics).
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.5);
  assert(c.enter('mine'));
  const z = c.zone();
  const boss = z.enemies.find((e) => e.family === 'mine' && e.type === 'boss');
  assert(boss);
  z.enemies = [boss]; // Keep real layout; remove incidental enemies from the probe.
  c.s.party = [];
  c.s.mercyTime = 0;
  c.hero.hp = c.hero.maxHp = 1000000;
  Object.assign(c.hero, c.safe(boss.home.x - 105, boss.home.y - 45, 'mine'));
  boss.aggro = true;
  boss.cd = 0;
  boss.lastAttackIndex = -1;
  boss.summonCd = 0;

  const seen = new Set();
  // Sweep deterministic RNG quantiles with the production weighted chooser.
  // The two separately defined rogue-tactical moves are not attack indices.
  for (let n = 0; n <= 100; n++) {
    c.random = () => (n + 0.001) / 101;
    boss.lastAttackIndex = -1;
    boss.summonCd = 0;
    const selected = c.chooseBossAttack(boss, c.hero);
    if (selected < 0) continue;
    assert(c.startAttack(boss, c.hero));
    assert.equal(boss.lastAttackIndex, selected);
    assert(boss.telegraph && boss.telegraph.index === selected);
    seen.add(selected);
    boss.telegraph = null;
    boss.sequence = [];
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4],
    mode + ' all five standard Garun attack slots are reachable');

  c.random = () => 0.5;
  boss.cd = 0;
  boss.lastAttackIndex = -1;
  c.s.statistics.events = [];
  const originalTime = c.s.time;
  for (let i = 0; i < 800; i++) {
    c.tick(0.05);
    if (c.s.statistics.events.some((e) => e.type === 'warning' && e.family === 'mine'))
      break;
  }
  assert(c.s.time > originalTime);
  assert(c.s.statistics.events.some((e) => e.type === 'warning' && e.family === 'mine'),
    mode + ' live Campaign.tick schedules a Mine boss warning');
  
  // At low health, Compaction may chain into Collapse. The follow-up must
  // telegraph its actual reserved support positions before any wall appears.
  const combo = new C(mode, 'paladin', () => 0);
  assert(combo.enter('mine'));
  combo.s.party = [];
  const colossus = combo.zone().enemies.find((e) => e.family === 'mine' && e.type === 'boss');
  combo.zone().enemies = [colossus];
  combo.hero.hp = combo.hero.maxHp = 1000000;
  Object.assign(combo.hero, combo.safe(1290, 1200, 'mine'));
  colossus.aggro = true;
  colossus.hp = colossus.maxHp * 0.4;
  combo.random = () => 0;
  assert(combo.startAttack(colossus, combo.hero, 2));
  assert(colossus.sequence.some((stage) => stage.index === 1),
    mode + ' low-HP compaction queues its approved Collapse follow-up');
  assert(!combo.zone().props.some((p) => p.garunPreview),
    'later combo construction should not appear before its own warning');
  for (let i = 0; i < 80 && colossus.telegraph?.index !== 1; i++) combo.tick(0.1);
  assert.equal(colossus.telegraph?.index, 1, 'live scheduler enters Collapse');
  const marks = combo.zone().props.filter((p) => p.garunPreview)
    .map((p) => ({ x: p.x, y: p.y }));
  assert(marks.length, 'combo Collapse must display advance construction warnings');
  for (let i = 0; i < 110 && colossus.telegraph?.index === 1; i++) combo.tick(0.1);
  assert.notEqual(colossus.telegraph?.index, 1, 'combo Collapse eventually completes');
  const walls = combo.zone().props.filter((p) => p.garunTemporary);
  assert(walls.length > 0 && walls.length <= 2, 'combo constructs bounded real supports');
  assert(walls.every((p) => marks.some((m) => m.x === p.x && m.y === p.y)),
    'combo supports must agree with their displayed warning geometry');

}
console.log('PASS Garun natural attack selection and active-tick warning smoke');
