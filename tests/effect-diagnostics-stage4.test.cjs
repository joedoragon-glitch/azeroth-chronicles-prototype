'use strict';
// Stage 4 regression: bounded essential first-paint protection does not cause
// extra draw requests, new tasks or fake projectile/area feedback.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const FX = require('../src/prototype/combat-visuals.js');
const HeroArt = require('../src/prototype/hero-presentation.js');

function scene(cls = 'paladin', slot = 1, charged = false, mode = 'developer') {
  const g = new Campaign(mode, cls, () => 0.9);
  const z = g.zone();
  z.props = []; z.npcs = []; z.buildings = []; z.nodes = [];
  Object.assign(g.hero, { x: 600, y: 900, hp: 50,
    skills: Array(8).fill(4), cd: Array(8).fill(0), order: null });
  g.s.mercyTime = 0;
  const e = g.makeEnemy({
    species: 'goblin', name: 'First paint target',
    level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 670, y: 900 });
  z.enemies = [e];
  g.s.party = [g.unit('soldier', 580, 930)];
  const surface = createCanvas(800, 600);
  const r = Renderer.create({
    canvas: surface, ctx: surface.getContext('2d'), getGame: () => g,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 400, y: 300 }) },
    chargePresentation: () => null, isPaused: () => false,
    Campaign, PrototypeVisuals: Visuals, PrototypeCombatVisuals: FX,
    PrototypeSprites: null, PrototypeMaterials: null, now: () => 1000,
  });
  r.setGroundReuse(false);
  assert(g.cast(slot, e.id, charged), 'real cast failed admission');
  const events = g.effects.splice(0);
  r.queue(events);
  return { g, r, surface };
}
function identity(report, slot, charged) {
  return report.identities.find((row) =>
    row.id === 'hero/paladin/' + slot + '/' +
      (charged ? 'charged' : 'normal') + ':cast');
}
let rescued = 0, gaveUp = 0, noExtraDraws = true;
for (const rate of [20, 30, 60]) {
  for (const charged of [false, true]) {
    const { g, r } = scene('paladin', 1, charged);
    assert(r.setEffectDiagnostics(true));
    // Enable BEFORE the queue event when identity counters are needed;
    // a new natural cast after enabling is the observed subject.
    const before = g.snapshot();
    // Initial queued cast happened before recorder; create another real cast.
    g.hero.cd.fill(0);
    g.hero.chargedCd.fill(0);
    assert(g.cast(1, g.zone().enemies[0].id, charged));
    r.queue(g.effects.splice(0));
    const baseline = r.effectDiagnosticsReport().drawFrames;
    // First-paint grace is 120ms beyond the existing effect lifetime.
    const seconds = charged ? 0.35 : 0.25;
    for (let i = 0; i < Math.ceil(seconds * rate); i++) {
      r.noteEffectDrawDecision(false, false);
      r.update(1 / rate);
    }
    r.draw();
    const report = r.effectDiagnosticsReport();
    const row = identity(report, 1, charged);
    assert(row && row.painted >= 1 && row.expiredWithoutDraw === 0,
      rate + 'Hz charged=' + charged + ' first paint not retained');
    assert.equal(report.drawFrames, baseline + 1, 'forced extra draw');
    noExtraDraws &&= report.drawFrames === baseline + 1;
    const afterDraw = r.metrics().transientEffects;
    r.update(1 / rate);
    assert(r.metrics().transientEffects < afterDraw,
      'cue must not linger after first permitted draw');
    assert.equal(JSON.stringify(g.snapshot()), JSON.stringify(before),
      'render-only protections cannot mutate campaign state');
    rescued++;
  }
  const { g, r } = scene();
  r.setEffectDiagnostics(true);
  g.hero.cd.fill(0);
  assert(g.cast(1, g.zone().enemies[0].id));
  r.queue(g.effects.splice(0));
  // Extended starvation exceeds the hard grace; no late deceptive flash.
  for (let i = 0; i < Math.ceil(0.55 * rate); i++) r.update(1 / rate);
  r.draw();
  const row = identity(r.effectDiagnosticsReport(), 1, false);
  assert(row && row.expiredWithoutDraw >= 1 && row.painted === 0,
    rate + 'Hz indefinite starvation must expire');
  gaveUp++;
}
{
  // This cast-stage is intentionally blank: its AREA owns the visible cue.
  const { g, r } = scene('paladin', 5);
  r.setEffectDiagnostics(true);
  g.hero.cd.fill(0);
  assert(g.cast(5, g.zone().enemies[0].id));
  r.queue(g.effects.splice(0));
  for (let i = 0; i < 6; i++) r.update(0.05);
  const row = identity(r.effectDiagnosticsReport(), 5, false);
  assert(row && row.expiredWithoutDraw >= 1,
    'do not extend intentionally silent area-skill cast stages');
}
{
  // No first-paint extension or recording engine is constructed for
  // normal-mode players. Existing ordinary queue ceiling is unchanged.
  const { g, r } = scene('paladin', 1, false, 'normal');
  assert.equal(r.setEffectDiagnostics(true), false);
  assert.equal(r.effectDiagnosticsReport().captured, false);
  g.effects = [];
  for (let i = 0; i < 100; i++) g.event('hit', { x: 600 + i, y: 900 + i });
  r.queue(g.effects.splice(0));
  assert.equal(r.metrics().transientEffects, 40, 'unchanged transient cap');
}
console.log('PASS Stage 4 essential first paint ' + rescued +
  ' rescued, ' + gaveUp + ' bounded expiries, no extra draws=' + noExtraDraws +
  '; intentionally silent cast and production queue limit remain intact');
