'use strict';
// Stage 5.4: Ledger of Losses is a REAL Ridge combat state in which ground
// warning silhouettes are deliberately withheld but the boss' cast clock
// remains visible. Preserve that separation under one-draw geometry reuse.
// This is a native software Canvas regression, not a hardware readability test.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const game = new Campaign('normal', 'paladin', () => 0.5);
// Spawn in the boss's authored region. Vale's level-1 first-contact shield
// intentionally forbids engagement even when the test uses a foreign boss.
game.enter(game.boss('ridge').region, { x: 1480, y: 1700 });
assert.equal(game.zoneId, game.boss('ridge').region,
  'fixture did not enter the real Ridge region');
const zone = game.zone();
zone.enemies = []; zone.props = []; zone.buildings = [];
zone.npcs = []; zone.nodes = []; game.s.party = [];
game.s.mercyTime = 0;
// A fresh Normal campaign begins with Vale's first-hero-hit admission gate.
// Enter the naturally reachable post-first-kill field state before attempting
// to ENGAGE this unrelated Ridge boss; never bypass engage() or fake aggro.
game.s.valeFieldAwakened = true;
Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
game.line = () => true;
// Earn the actual native opening admission before invoking engage(); direct
// boss.aggro assignment would bypass the Ridge Ledger phase transition.
completeFieldOpening(game);
const boss = game.bossEnemy(game.boss('ridge'), 'normal', { x: 1400, y: 1700 });
zone.enemies.push(boss);
game.engage(boss, true);
assert(boss.aggro, 'real Ridge engagement did not start');
assert(boss.ledgerOpen, 'engagement did not enter its real Ledger of Losses phase');
assert(game.startAttack(boss, game.hero, 0),
  'authored Ridge attack did not start inside the Ledger phase');
assert(boss.telegraph && !boss.telegraph.anonymousCast,
  'Ledger must be tested with an active normal ground-warning attack');
const initial = JSON.stringify(game.snapshot());

function sample(width, height, zoom, ledger, attack, reuse, cues) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  const labels = [], originalText = ctx.fillText;
  ctx.fillText = function (text, ...rest) {
    labels.push(String(text));
    return originalText.call(this, text, ...rest);
  };
  const screen = ({ x, y }) => ({
    x: width / 2 + ((x - 1400) * 0.6 - (y - 1700) * 0.3) * zoom,
    y: height / 2 + ((x - 1400) * 0.19 + (y - 1700) * 0.32) * zoom,
  });
  const originalLedger = boss.ledgerOpen, originalAttack = boss.telegraph;
  const originalPatches = game.attackPatches;
  let patchCalls = 0;
  const shapes = reuse ? new Map() : null;
  try {
    boss.ledgerOpen = ledger;
    if (!attack) boss.telegraph = null;
    game.attackPatches = function (...args) {
      patchCalls++;
      return originalPatches.apply(this, args);
    };
    Combat.ground(ctx, screen, game, 'fill', game.s.time, shapes);
    Combat.ground(ctx, screen, game, 'underlay-cue', game.s.time, shapes);
    if (cues) Combat.actorCues(ctx, screen, game);
    return {
      labels, patchCalls, cacheSize: shapes?.size ?? 0,
      pixels: Buffer.from(ctx.getImageData(0, 0, width, height).data),
    };
  } finally {
    boss.ledgerOpen = originalLedger;
    boss.telegraph = originalAttack;
    game.attackPatches = originalPatches;
    ctx.fillText = originalText;
  }
}
const report = [];
for (const [width, height, zoom] of [
  [900, 600, 1], [900, 600, 1.5],
  [393, 852, 1], [393, 852, 1.5],
]) {
  // A real active Ledger must conceal the dangerous geometry, including
  // in the per-draw-cache branch. This omission is intentional gameplay info.
  const noCast = sample(width, height, zoom, true, false, false, false);
  const hidden = sample(width, height, zoom, true, true, false, false);
  const hiddenCached = sample(width, height, zoom, true, true, true, false);
  assert.deepEqual(hidden.pixels, noCast.pixels,
    'Ledger unexpectedly displayed a ground danger silhouette');
  assert.deepEqual(hiddenCached.pixels, noCast.pixels,
    'same-frame polygon optimization exposed hidden Ledger warning geometry');
  assert.equal(hiddenCached.cacheSize, 0,
    'a concealed Ledger warning consumed the visible-telegraph cache');
  assert.equal(hiddenCached.patchCalls, 0,
    'concealed Ledger phase spent ordinary warning-polygon computation');

  const readable = sample(width, height, zoom, true, true, true, true);
  const withoutCast = sample(width, height, zoom, true, false, true, true);
  assert(readable.labels.includes('LEDGER CAST'),
    'real Ledger attack lacks its protected actor cast label');
  assert(!withoutCast.labels.includes('LEDGER CAST'),
    'Ledger cast label persisted with no active attack');
  assert.notDeepEqual(readable.pixels, hiddenCached.pixels,
    'Ledger cast countdown has no real Canvas pixels');

  // Remove the concealment FOR COMPARISON ONLY to prove this is a real
  // warning-bearing authored attack and not a naturally blank cast.
  const afterLedger = sample(width, height, zoom, false, true, true, false);
  assert.notDeepEqual(afterLedger.pixels, hiddenCached.pixels,
    'the authored Ridge attack has no ground warning when Ledger closes');
  assert.equal(afterLedger.cacheSize, 1,
    'same real warning did not enter one-draw caching when Ledger closed');

  // Cast time is owned by the combat action; no synthetic effect/timer added.
  const originalTimer = boss.telegraph.timer;
  try {
    boss.telegraph.timer = originalTimer * 0.5;
    const progressed = sample(width, height, zoom, true, true, true, true);
    assert(progressed.labels.includes('LEDGER CAST'));
    assert.notDeepEqual(progressed.pixels, readable.pixels,
      'Ledger cast clock did not progress with its live warning timer');
  } finally {
    boss.telegraph.timer = originalTimer;
  }
  assert.equal(JSON.stringify(game.snapshot()), initial,
    'testing the real Ridge Ledger cast mutated campaign/save state');
  report.push({ viewport: width + 'x' + height, zoom,
    hiddenPatchCalls: hiddenCached.patchCalls,
    visibleCacheEntriesWithoutLedger: afterLedger.cacheSize });
}
console.log('STAGE5.4 RIDGE Ledger native Canvas only: ' + JSON.stringify(report));
console.log('PASS real Ridge engagement, Ledger hides the authored ground attack ' +
  'but not its progressing LEDGER CAST bar; 4 viewport/zoom variants, ' +
  'no added render work, no gameplay mutation or claimed hardware fidelity');
