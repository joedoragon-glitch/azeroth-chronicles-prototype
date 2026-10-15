'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const game = new Campaign('normal', 'paladin', () => 0.5);
game.enter('citadel');
const boss = game.zone().enemies.find(e => e.family === 'citadel' && e.type === 'boss');
assert(boss, 'canonical Citadel boss remains present');
assert.equal(boss.name.includes('Veyra'), true);
// Natural board-first selection applies when the hero is within combat range.
game.hero.x=boss.home.x-130;
game.hero.y=boss.home.y;
const authoritative = Campaign.rules.attacks.citadel;
assert.deepEqual(authoritative.map(plan=>plan.kind),
  ['canister','formation','pattern-charge','checkerboard','summon'],
  'authoritative rules must use the implemented five mechanics, not just display substitutions');
assert.equal(authoritative[0].coefficient,1,'canister has no obsolete armor-slam multiplier');
assert.equal(authoritative[2].coefficient,1,'five-leg charge uses approved one-hit coefficient');
assert(!('opening' in authoritative[0]),'no inherited three-second canister opening');
assert(!('manaDrain' in authoritative[1]) && !('manaDrain' in authoritative[3]),
  'formation and board must not inherit obsolete mana drain');
assert(!authoritative[3].sequential && !authoritative[3].persistent,
  'board persistence belongs exclusively to its real active board lifecycle');
const patterns = Array.from({length:5}, (_,i) => game.buildBossAttack(boss,i,game.hero).first);
assert.deepEqual(patterns.map(a=>a.kind), ['canister','formation','pattern-charge','checkerboard','summon']);
assert.equal(patterns[2].path.length,5,'continuous five-leg Contouring');
assert.equal(game.chooseBossAttack(boss,game.hero), 3,'board established first');
game.startAttack(boss,game.hero,3);
game.resolveAttack(boss);
assert(boss.board && boss.board.beat === 0,'persistent board exists');
const cells = game.sentinelBoardCells(boss);
assert.equal(cells.length,16);
assert.equal(cells.filter(cell=>cell.selected).length,2);
for (const cell of cells)
  assert(!game.blocked(cell.x,cell.y,'citadel',10),'court center blocked at '+cell.x+','+cell.y);
boss.board.beat=3;
boss.board.timer=0.55;
const saved=game.snapshot();
const fromSave = saved.zones.citadel.enemies.find(e => e.family === 'citadel' && e.type === 'boss');
assert.equal(fromSave.board.beat,3,'saved beat survives encounter cancellation');
assert(!fromSave.telegraph && !fromSave.motion && !fromSave.aggro,'no live attack receipts on saved boss');
const copy=Campaign.restore(saved);
const restored=copy.zone().enemies.find(e => e.family === 'citadel' && e.type === 'boss');
assert.equal(restored.board.beat,3,'v4 restoration retains validated paused board');
assert.equal(restored.board.timer,0.55);
copy.enter('crown');
assert(!restored.board,'travel cancels court effect');
const reset=Campaign.restore(saved);
reset.zone().enemies.find(e=>e.family==='citadel').board.timer=Infinity;
const invalid=reset.snapshot();
assert(!invalid.zones.citadel.enemies.find(e=>e.family==='citadel').board,'malformed beat not persisted');
console.log('PASS snapshot Veyra 5 mechanics, 16 court centers, v4 board and travel');
