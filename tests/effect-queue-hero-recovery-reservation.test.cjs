'use strict';
// Stage 5.5: A natural hero execution and player recovery must retain a
// chance to paint when synthetic, higher-priority transient cues saturate
// the existing 40-item budget. This does NOT claim such a burst is a natural
// fight or change non-transient warnings/projectiles, draw gating or FPS.
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
assert(game.cast(1, target.id, false), 'real Paladin cast was not admitted');
game.event('heal', {
  actor: 'hero', target: 'hero', resource: 'health',
  x: game.hero.x, y: game.hero.y,
});
const receipts = game.effects.splice(0);
assert(receipts.some(e => e.type === 'heroSkillCast'));
assert(receipts.some(e => e.type === 'heal'));
const snapshot = JSON.stringify(game.snapshot());
const high = Array.from({ length: 60 }, (_, i) => ({
  type: 'ability', slot: 7, source: 'synthetic-burst-' + i,
  x: 1350 + i, y: 1700, life: 0.65, max: 0.65, priority: 5,
}));
const check = (events, current, heroExpected, healExpected, label) => {
  const rec = Renderer.createEffectDiagnostics();
  rec.receipts(events);
  const out = Combat.queue(events, game, current, rec);
  assert.equal(out.length, 40, label + ' changed the 40-transient ceiling');
  assert.equal(out.some(f => f.type === 'heroSkill' && f.class === 'paladin' &&
    f.slot === 1 && f.stage === 'cast'), heroExpected, label + ': hero admission');
  assert.equal(out.some(f => f.type === 'heal' && f.actor === 'hero'), healExpected,
    label + ': player healing admission');
  assert.equal(new Set(out).size, 40, label + ': duplicate queue object');
  const result = rec.report(true);
  const discarded = result.identities.reduce((sum, row) =>
    sum + row.overflowDropped, 0);
  assert.equal(discarded, current.length + (heroExpected ? 1 : 0) +
    (healExpected ? 1 : 0) - 40, label + ': inaccurate overflow accounting');
  assert.equal(JSON.stringify(game.snapshot()), snapshot,
    'presentation queue mutated campaign state');
  return out;
};
const both = check(receipts, high, true, true, 'real hero + healing under high-priority burst');
assert.equal(both.filter(f => f.type === 'ability').length, 38,
  'only two player feedback slots may be reserved under overload');
assert.deepEqual(both.filter(f => f.type === 'ability').map(f => f.source),
  high.slice(-38).map(f => f.source),
  'high-priority queue must otherwise keep original stable eviction order');

const heroOnly = check(receipts.filter(e => e.type !== 'heal'),
  high, true, false, 'hero-only saturation');
assert.equal(heroOnly.filter(f => f.type === 'ability').length, 39);
const healOnly = check(receipts.filter(e => e.type === 'heal'),
  high, false, true, 'healing-only saturation');
assert.equal(healOnly.filter(f => f.type === 'ability').length, 39);

// With NO protected player feedback, retain the original strict priority
// ordering. The newest 40 high-priority items survive with no new rules.
const withoutProtected = check([], high, false, false, 'no player feedback');
assert.deepEqual(withoutProtected.map(f => f.source),
  high.slice(-40).map(f => f.source),
  'existing non-player overflow semantics changed');

// Stage 4 established that this NORMAL Paladin area-skill cast stage is
// deliberately blank: the state/area owner paints it later. A saturated
// queue should never sacrifice meaningful high-priority work just to hold
// that silent cast-stage receipt.
const silent = {
  type: 'heroSkill', class: 'paladin', slot: 5, charged: false,
  stage: 'cast', life: 0.22, max: 0.22, priority: 4,
};
const silentBurst = check([], [...high, silent], false, false,
  'deliberately silent area cast under high-priority pressure');
assert.equal(silentBurst.some(f => f === silent), false,
  'intentionally silent cast stole a reserved hero slot');
assert.deepEqual(silentBurst.map(f => f.source),
  high.slice(-40).map(f => f.source),
  'silence guard changed baseline high-priority survival');

// Hostile healing already has its own recipient/cue treatment; do not
// prioritize it as PLAYER recovery under a high-priority burst.
const hostile = {
  type: 'heal', actor: 'enemy', target: 'hostile',
  x: 1400, y: 1700, life: 0.55, max: 0.55, priority: 4,
};
const hostileBurst = check([], [...high, hostile], false, false,
  'hostile recovery retains ordinary priority');
assert.equal(hostileBurst.some(f => f === hostile), false,
  'hostile recovery was incorrectly given the protected player slot');

// Low-priority hit bursts already preserved real hero/heal; no regression.
const low = Array.from({ length: 100 }, (_, i) => ({
  type: 'impact', source: 'low-' + i, x: 1400 + i, y: 1700,
  life: 0.2, max: 0.2, priority: 1,
}));
const lowResult = check(receipts, low, true, true, 'low-priority burst');
assert.equal(lowResult.filter(f => f.type === 'impact').length, 38);
console.log('PASS Stage 5.5 40-slot overload with one real hero cast and ' +
  'player heal: both admitted against 60 synthetic priority-5 transients, ' +
  'stable pre-existing priority/eviction without protected receipts, ' +
  'observer drop accounting and campaign snapshot unchanged. ' +
  'No quality modes, FPS override or natural encounter frequency claimed.');
