'use strict';
// Stage 5.5: One natural Paladin cast and one player heal must retain a
// first-draw opportunity when deliberately synthetic tier-5 skill receipts
// exceed the existing 40-slot transient limit. This is a queue-only test,
// not natural encounter incidence, graphics timing or device FPS evidence.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');
const Renderer = require('../src/prototype/renderer.js');

const game = new Campaign('normal', 'paladin', () => 0.5);
const zone = game.zone();
zone.enemies = []; zone.props = []; zone.buildings = [];
zone.npcs = []; zone.nodes = []; game.s.party = [];
Object.assign(game.hero, {
  x: 1480, y: 1700, hp: 400, maxHp: 1000,
  skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
});
game.s.mercyTime = 0;
game.line = () => true;
const target = game.makeEnemy({
  species: 'goblin', name: 'Queue saturation target',
  level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
}, { x: 1494, y: 1690 });
zone.enemies.push(target);
game.effects = [];
assert(game.cast(1, target.id, false), 'natural Paladin cast was not admitted');
game.event('heal', {
  actor: 'hero', target: 'hero', resource: 'health',
  x: game.hero.x, y: game.hero.y,
});
const receipts = game.effects.splice(0);
assert(receipts.some(e => e.type === 'heroSkillCast'));
assert(receipts.some(e => e.type === 'heal'));
const snapshot = JSON.stringify(game.snapshot());

// These are deliberately SYNTHETIC input receipts, not 60 real pet casts.
// Enter the genuine queue producer that assigns pet slot 2 priority 5, so
// the optional developer observer can track admission and all overflow drops.
const high = Array.from({ length: 60 }, (_, i) => ({
  type: 'petSkill', slot: 2, stage: 'impact', petFamily: 'thorn',
  actor: 'pet', source: 'synthetic-high-' + i,
  x: 1350 + i, y: 1700, fromX: 1350, fromY: 1700,
}));
const petSources = (items) => items.filter(f => f.type === 'petSkill').map(f => f.source);
const check = (events, heroExpected, healExpected, label) => {
  const observer = Renderer.createEffectDiagnostics();
  observer.receipts(events);
  const out = Combat.queue(events, game, [], observer);
  assert.equal(out.length, 40, label + ' changed the 40-transient ceiling');
  assert.equal(out.some(f => f.type === 'heroSkill' && f.class === 'paladin' &&
    f.slot === 1 && f.stage === 'cast'), heroExpected, label + ': hero admission');
  assert.equal(out.some(f => f.type === 'heal' && f.actor === 'hero'), healExpected,
    label + ': player recovery admission');
  const report = observer.report(true);
  const queued = report.identities.reduce((sum, row) => sum + row.queued, 0);
  const discarded = report.identities.reduce((sum, row) => sum + row.overflowDropped, 0);
  assert.equal(discarded, queued - 40,
    label + ': developer overflow accounting must cover all newly queued candidates');
  assert.equal(JSON.stringify(game.snapshot()), snapshot,
    'presentation queue mutated campaign or save state');
  return out;
};

const both = check([...receipts, ...high], true, true,
  'real cast and player recovery against synthetic high-priority burst');
assert.equal(petSources(both).length, 38,
  'no more than two high-priority transient slots may be displaced');
assert.deepEqual(petSources(both), high.slice(-38).map(e => e.source),
  'high-priority queue must otherwise retain newest entries in stable order');

const heroOnly = check([...receipts.filter(e => e.type !== 'heal'), ...high],
  true, false, 'hero-only admission');
assert.equal(petSources(heroOnly).length, 39);
const healOnly = check([...receipts.filter(e => e.type === 'heal'), ...high],
  false, true, 'recovery-only admission');
assert.equal(petSources(healOnly).length, 39);

// No reserved cue: exact original priority and earliest-entry eviction order.
const ordinary = check(high, false, false, 'no player feedback');
assert.deepEqual(petSources(ordinary), high.slice(-40).map(e => e.source),
  'original priority-5 admission changed outside protected player feedback');

// A normal Paladin Skill 5 cast-stage is intentionally silent; its area
// material owns visible presentation. This valid receipt must NOT displace
// a stronger cue just because the event owner is the hero.
const silentCast = {
  type: 'heroSkillCast', class: 'paladin', slot: 5, charged: false,
  actor: 'hero', x: game.hero.x, y: game.hero.y,
};
const silentResult = check([silentCast, ...high], false, false,
  'deliberately silent normal hero cast');
assert.equal(silentResult.some(f => f.type === 'heroSkill'), false);
assert.deepEqual(petSources(silentResult), high.slice(-40).map(e => e.source));

// Hostile recovery is still a legitimate receipt but does NOT borrow the
// protected player-recovery slot. Override eligibility in this queue fixture
// only, to exercise accepted enemy heals rather than an invalid skipped one.
const enemyHealingActor = game.enemyHealingActor;
try {
  game.enemyHealingActor = (u) => u.id === target.id;
  const hostile = {
    type: 'heal', actor: 'enemy', target: target.id,
    x: target.x, y: target.y, resource: 'health',
  };
  const hostileResult = check([hostile, ...high], false, false,
    'accepted hostile recovery is not protected as player healing');
  assert.equal(hostileResult.some(f => f.type === 'heal'), false);
} finally {
  game.enemyHealingActor = enemyHealingActor;
}

// Low-priority hit overload already preserved cast/heal feedback in Stage 5.2.
const low = Array.from({ length: 100 }, (_, i) => ({
  type: 'hit', x: 1400 + i, y: 1700,
}));
const lowResult = check([...receipts, ...low], true, true,
  'low-priority hit overload regression');
assert.equal(lowResult.filter(f => f.type === 'impact').length, 38);
console.log('PASS Stage 5.5 queue: real Paladin cast+hero heal retained against ' +
  '60 synthetic priority-5 pet receipts without raising 40 slots; ' +
  'silent cast/hostile heal get no reserved slot, ordinary priority order ' +
  'and opt-in developer overflow counts preserved; game state unchanged. ' +
  'No natural fight/device graphics-performance claim.');
