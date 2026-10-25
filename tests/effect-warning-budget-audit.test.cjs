'use strict';
// Presentation-only Stage 5 follow-up: quantify warning canvas coverage and
// primitive projection demand relative to a real hero effect. No style changes.
// These are CI/native Canvas measurements, NEVER device benchmarks or perceptual proof.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Warnings = require('../src/prototype/combat-visuals.js');
const HeroArt = require('../src/prototype/hero-presentation.js');

const WIDTH = 900;
const HEIGHT = 600;
function coverage(canvas) {
  const data = canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data;
  let visible = 0, bright = 0, alphaSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (!a) continue;
    visible++;
    if (a >= 128) bright++;
    alphaSum += a;
  }
  return { visible, bright, alphaSum, percent: +(100 * visible / (WIDTH * HEIGHT)).toFixed(3) };
}
function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return +ordered[Math.floor(ordered.length / 2)].toFixed(3);
}
function warningScene(id) {
  const g = new Campaign('developer', 'paladin', () => 0.5);
  const zone = g.zone();
  zone.enemies = [];
  g.s.party = [];
  Object.assign(g.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
  g.line = () => true;
  const boss = g.bossEnemy(g.boss(id), 'normal', { x: 1400, y: 1700 });
  boss.aggro = true;
  zone.enemies = [boss];
  g.startAttack(boss, g.hero, 0);
  assert(boss.telegraph, id + ' real boss attack produced no telegraph');
  const snapshot = JSON.stringify(g.snapshot());
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  let projected = 0, patches = 0;
  const project = ({ x, y }) => {
    projected++;
    return { x: 450 + (x - 1400) * 0.6 - (y - 1700) * 0.3,
      y: 315 + (x - 1400) * 0.19 + (y - 1700) * 0.32 };
  };
  const originalPatches = g.attackPatches;
  g.attackPatches = function (...args) {
    patches++;
    return originalPatches.apply(this, args);
  };
  // These are the two passes used by the production renderer, unaltered.
  const sample = (pass) => {
    let n = 0;
    const times = [];
    for (let j = 0; j < 5; j++) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const start = performance.now();
      Warnings.ground(ctx, project, g, pass, g.s.time);
      times.push(performance.now() - start);
      n++;
    }
    return { area: coverage(canvas), medianMs: median(times), samples: n };
  };
  const fill = sample('fill');
  const border = sample('underlay-cue');
  assert.equal(JSON.stringify(g.snapshot()), snapshot,
    id + ' drawing warnings mutated simulation/save state');
  assert.equal(g.zone().enemies[0], boss);
  return { id, kind: boss.telegraph.kind, fill: fill.area, cue: border.area,
    fillMs: fill.medianMs, cueMs: border.medianMs, projections: projected,
    attackPatchCalls: patches };
}

const results = [];
for (const id of ['thorn', 'crypt', 'mire', 'archive', 'ridge', 'mine',
  'warlord', 'abyss', 'citadel', 'cindermaw', 'darklord']) results.push(warningScene(id));
assert.equal(results.length, 11);
assert(results.some((r) => r.fill.visible > 0 && r.cue.visible > 0),
  'real boss warning footprints have no Canvas pixels');
assert(results.some((r) => r.projections > 0),
  'real warning geometry was not projected');
assert(results.every((r) => Number.isFinite(r.fillMs + r.cueMs)));

// Controlled real hero cast sample; independent scene/position but same
// Canvas resolution. Area measurements are diagnostics, not a contrast rating.
const g = new Campaign('developer', 'paladin', () => 0.9);
const z = g.zone();
z.props = []; z.buildings = []; z.npcs = []; z.nodes = [];
Object.assign(g.hero, { x: 600, y: 900, hp: 50, maxHp: 1000,
  skills: Array(8).fill(4), cd: Array(8).fill(0), order: null });
g.s.mercyTime = 0;
const target = g.makeEnemy({ species: 'goblin', name: 'Real spell target',
  level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 }, { x: 670, y: 900 });
z.enemies = [target];
g.s.party = [g.unit('soldier', 580, 930)];
g.effects = [];
assert(g.cast(1, target.id, false));
const events = g.effects.splice(0);
const cue = Warnings.queue(events, g, []).find((e) =>
  e.type === 'heroSkill' && e.stage === 'cast');
assert(cue, 'natural hero cast produced no queued identity');
const art = createCanvas(WIDTH, HEIGHT);
const ps = ({ x, y }) => ({ x: 450 + (x - 600) * 0.68 - (y - 900) * 0.3,
  y: 315 + (x - 600) * 0.17 + (y - 900) * 0.3 });
const original = JSON.stringify(g.snapshot());
const timings = [];
for (let i = 0; i < 5; i++) {
  const ctx = art.getContext('2d');
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const start = performance.now();
  HeroArt.draw(ctx, ps, cue, { width: WIDTH, height: HEIGHT, reduced: false, optimized: false });
  timings.push(performance.now() - start);
}
const hero = { area: coverage(art), medianMs: median(timings) };
assert(hero.area.visible > 0, 'real Paladin effect has no visible Canvas pixels');
assert.equal(JSON.stringify(g.snapshot()), original, 'hero effect rendering changed gameplay');
console.log('STAGE5 WARNINGS measured native Canvas, no perceptual or device claim: ' +
  JSON.stringify({ bossWarnings: results, hero }));
console.log('PASS 11 real boss warning surfaces, fill/outline instrumentation and natural hero painter; no gameplay mutation');
