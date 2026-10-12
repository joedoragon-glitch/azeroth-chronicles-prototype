'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const dragon = C.data.bosses.find((b) => b.id === 'abyss');
assert.deepEqual(dragon.attacks.map((s) => s.split(':')[0]),
  ['Compressor Surge', 'Wake Vortex', 'Lazy Eight', 'Scramble Order']);
assert.equal(C.rules.bossRecovery.abyss.name, 'Go-Around');
assert.equal(C.rules.tacticalFoundation.rogueMoves.bosses.abyss.name, 'Abyss Dragon’s High Yo-Yo');
assert.equal(C.rules.tacticalFoundation.rogueSignatures.bosses.abyss.name, 'Abyss Dragon’s Wingover');

for (const mode of ['normal', 'nightmare']) for (const form of ['normal', 'true']) {
  const c = new C(mode, 'paladin', () => 0.9);
  c.enter('abyss');
  c.s.party = [];
  const boss = c.bossEnemy(c.boss('abyss'), form, { x: 1150, y: 1120 });
  c.zone().enemies = [boss];
  Object.assign(c.hero, { x: 980, y: 1040, immune: 100, hp: c.hero.maxHp });
  assert.equal(c.bossSummonCap(boss), form === 'true' ? 6 : 3);
  assert.equal(c.startAttack(boss, c.hero, 2), true);
  assert.equal(boss.telegraph.name, 'Lazy Eight');
  assert(boss.telegraph.flightPath?.length >= 1);
  const first = { x: boss.x, y: boss.y };
  c.resolveAttack(boss);
  assert(boss.motion && boss.motion.flightPath);
  boss.telegraph = null;
  for (let n = 0; n < 380 && boss.motion; n++) {
    c.advanceMotion(boss, 0.02);
    assert(!c.blocked(boss.x, boss.y, 'abyss', 15), 'flight remains on valid arena floor');
  }
  assert.equal(boss.motion, null, 'first landing terminates');
  assert(Math.hypot(first.x - boss.x, first.y - boss.y) > 0, 'boss physically moves');
  assert(boss.telegraph && boss.telegraph.name === 'Lazy Eight',
    'second landing retains its separate warning');

  // The real rogue AI requires sight; place the test hero in an unobstructed lane.
  Object.assign(c.hero, { x: boss.x, y: boss.y });
  assert(c.line(boss, c.hero));
  const strike = { rogueMove: true, rogueSignature: false, style: 'dash',
    targetId: 'hero', x: c.hero.x, y: c.hero.y, radius: 105,
    coefficient: 0.25, recovery: 0.8 };
  boss.telegraph = null;
  c.tacticalResolveRogueMove(boss, strike);
  assert.equal(boss.motion?.aerial, 'high-yo-yo');
  for (let n = 0; n < 300 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'High Yo-Yo finishes');

  const wing = { rogueMove: true, rogueSignature: true, effect: 'scatter',
    kind: 'circle', targetId: 'hero', x: boss.x, y: boss.y, angle: 0,
    radius: 205, coefficient: 0.09, push: 110, sidestep: 90, recovery: 1.05 };
  c.tacticalResolveRogueMove(boss, wing);
  assert.equal(boss.motion?.aerial, 'wingover');
  for (let n = 0; n < 300 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'Wingover finishes');

  boss.hp = boss.maxHp * 0.3;
  boss.telegraph = null;
  boss.healCd = 0;
  assert(c.startBossRecovery(boss));
  assert.equal(boss.telegraph.name, 'Go-Around');
  const beforeHeal = boss.hp;
  c.resolveAttack(boss);
  boss.telegraph = null;
  assert.equal(boss.motion?.aerial, 'go-around');
  for (let n = 0; n < 160 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'Go-Around terminates');
  assert(boss.hp > beforeHeal && boss.hp <= boss.maxHp,
    'withdrawal completes before bounded recovery');
  // A blocked retreat is not a completed maneuver and cannot heal for free.
  const retryHp = boss.maxHp * 0.3;
  boss.hp = retryHp;
  boss.healCd = 0;
  const originalSegment = c.clearSegment.bind(c);
  c.clearSegment = () => false;
  assert.equal(c.startBossRecovery(boss), false,
    'AI must not initiate a recovery without any navigable retreat');
  assert.equal(boss.healCd, 0, 'rejected recovery does not consume cooldown');
  c.clearSegment = originalSegment;
  assert(c.startBossRecovery(boss), 'recovery becomes available once retreat is clear');
  c.resolveAttack(boss);
  assert.equal(boss.motion?.aerial, 'go-around');
  const originalMove = c.move.bind(c);
  c.move = () => false;
  c.advanceMotion(boss, 0.02);
  c.move = originalMove;
  assert.equal(boss.motion, null, 'blocked withdrawal terminates safely');
  assert.equal(boss.hp, retryHp, 'blocked or unfinished Go-Around never grants healing');

  console.log('PASS ' + mode + '/' + form + ' aviation paths, warnings, capped summons and recovery');
}
