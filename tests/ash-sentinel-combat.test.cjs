'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const c = new C();
c.enter('citadel');
assert.equal(c.sentinelPatternPath(c.zone().enemies.find(e => e.family === 'citadel')).length, 5);
const boss = c.zone().enemies.find(e => e.family === 'citadel');
boss.aggro = true;
boss.telegraph = c.buildBossAttack(boss, 3, c.hero).first;
c.resolveAttack(boss);
assert.equal(c.sentinelBoardCells(boss).length, 16);
assert.equal(c.sentinelBoardCells(boss).filter(cell => cell.selected).length, 2);
c.sentinelUpdateBoard(boss, 1.5);
assert.equal(boss.board.phase, 'rest');
c.sentinelUpdateBoard(boss, 0.5);
assert.equal(boss.board.phase, 'warn');
assert.equal(c.bossAttackWeights(boss, c.hero)[3], 0);
boss.telegraph = c.buildBossAttack(boss, 0, c.hero).first;
c.resolveAttack(boss);
assert.equal(c.s.projectiles.length, 9);
boss.telegraph = c.buildBossAttack(boss, 1, c.hero).first;
c.resolveAttack(boss);
assert(boss.dressUntil > c.s.time);
assert(C.restore(c.snapshot()).zone().enemies.some(e => e.family === 'citadel' && e.board));
// Full cast warns a fixed route without retargeting after the first leg.
const charge = c.buildBossAttack(boss, 2, c.hero).first;
assert.equal(charge.path.length, 5);
assert.equal(charge.opening, 0);
assert.equal(c.buildBossAttack(boss, 0, c.hero).first.opening, 0);
assert.deepEqual(charge.path, c.buildBossAttack(boss, 2, { x: c.hero.x + 80, y: c.hero.y }).first.path);
// Each marked square has its own safe alternative, and the warning precedes impact.
boss.board = { x: boss.home.x, y: boss.home.y, size: 112, beat: 0, phase: 'warn', timer: 1.45 };
c.s.party = [];
c.hero.maxHp = c.hero.hp = 100000;
c.hero.immune = 0;
const threatened = c.sentinelBoardCells(boss).find(cell => cell.selected);
Object.assign(c.hero, { x: threatened.x, y: threatened.y });
c.sentinelUpdateBoard(boss, 0.8);
assert.equal(c.hero.hp, 100000, 'the glowing square is only a warning');
c.sentinelUpdateBoard(boss, 0.7);
assert(c.hero.hp < 100000, 'marked square strikes after warning');
const afterHit = c.hero.hp;
boss.board = { ...boss.board, beat: 0, phase: 'warn', timer: 1.45 };
const refuge = c.sentinelBoardCells(boss).find(cell => !cell.selected);
Object.assign(c.hero, { x: refuge.x, y: refuge.y });
c.sentinelUpdateBoard(boss, 1.46);
assert.equal(c.hero.hp, afterHit, 'unmarked square is safe');
// The fully warned maneuver physically completes all five legs, not five recasts.
boss.telegraph = c.buildBossAttack(boss, 2, c.hero).first;
c.resolveAttack(boss);
assert(boss.motion && boss.motion.kind === 'pattern-charge');
const visited = new Set();
for (let i = 0; i < 500 && boss.motion; i++) {
  visited.add(boss.motion.leg);
  c.advanceMotion(boss, 0.016);
}
assert.deepEqual([...visited].sort(), [0, 1, 2, 3, 4], 'all five charge legs execute');
assert.equal(boss.motion, null, 'the patterned attack ends without a new cast');
boss.hp = 0;
const frozenBeat = boss.board.beat;
c.sentinelUpdateBoard(boss, 5);
assert.equal(boss.board.beat, frozenBeat, 'board stops when Veyra dies');
// A mid-fight save preserves the live board; a normal exit resets the encounter.
const exitCase = new C();
exitCase.enter('citadel');
const exitBoss = exitCase.zone().enemies.find(e => e.family === 'citadel');
exitBoss.board = { x: exitBoss.home.x, y: exitBoss.home.y, size: 112,
  beat: 3, phase: 'warn', timer: 0.9 };
exitBoss.dressUntil = exitCase.s.time + 5;
const reloaded = C.restore(exitCase.snapshot());
assert.equal(reloaded.zone().enemies.find(e => e.family === 'citadel').board.beat, 3);
exitCase.enter('crown');
exitCase.enter('citadel');
const resetBoss = exitCase.zone().enemies.find(e => e.family === 'citadel');
assert.equal(resetBoss.board, undefined, 'leaving a fight clears persistent board state');
assert.equal(resetBoss.dressUntil, undefined, 'leaving a fight clears the formation order');
console.log('PASS Sentinel mechanics');
