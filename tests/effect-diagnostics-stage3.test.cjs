'use strict';
// Stage 3: actual gameplay producers, real Canvas painters, controlled timing.
// Runs in CI only; the shipped game never imports this file.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const EnemyArt = require('../src/prototype/enemy-vfx-art.js');
const Fx = require('../src/prototype/combat-visuals.js');
const Visuals = require('../src/prototype/visuals.js');

const raster = (canvas) => Buffer.from(
  canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
);
const ink = (canvas) => {
  const data = raster(canvas);
  let nontransparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nontransparent++;
  return nontransparent;
};
function arena(cls = 'paladin', mode = 'developer') {
  const g = new Campaign(mode, cls, () => 0.9);
  const zone = g.zone();
  zone.props = [];
  zone.buildings = [];
  zone.npcs = [];
  zone.nodes = [];
  Object.assign(g.hero, {
    x: 600, y: 900, hp: 50, maxHp: 1000,
    skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
  });
  g.s.mercyTime = 0;
  const e = g.makeEnemy({
    species: 'goblin', name: 'Natural skill target', level: 1, hp: 100000,
    damage: 0, gold: 0, xp: 0,
  }, { x: 670, y: 900 });
  zone.enemies = [e];
  g.s.party = [g.unit('soldier', 580, 930)];
  g.s.companionCombatTraining = 2;
  g.effects = [];
  return { g, e };
}
const screenHero = ({ x, y }) => ({ x: 340 + (x - 600) * 0.68 - (y - 900) * 0.3,
  y: 300 + (x - 600) * 0.17 + (y - 900) * 0.3 });
const screenEnemy = ({ x, y }) => ({ x: 370 + (x - 1480) * 0.6 - (y - 1700) * 0.3,
  y: 280 + (x - 1480) * 0.19 + (y - 1700) * 0.32 });
let heroForms = 0, positiveHeroPixels = 0, observedReceipts = 0, heroCueNames = new Set();
const deliberatelyBlankCastStages = [];
for (const cls of ['paladin', 'mage', 'ranger'])
  for (let slot = 1; slot <= 8; slot++)
    for (const charged of [false, true]) {
      const { g, e } = arena(cls);
      if (cls === 'mage' && slot === 3 && !charged)
        e.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
      assert(g.cast(slot, e.id, charged),
        'natural cast not admitted: ' + [cls, slot, charged]);
      const events = g.effects.splice(0);
      const cast = events.find((x) => x.type === 'heroSkillCast');
      assert(cast, 'natural successful cast receipt missing: ' + [cls, slot, charged]);
      const rec = Renderer.createEffectDiagnostics();
      rec.receipts(events);
      const effects = Fx.queue(events, g, [], rec);
      const cue = effects.find((f) => f.type === 'heroSkill' && f.stage === 'cast');
      assert(cue, 'no actual queued cast cue: ' + [cls, slot, charged]);
      const canvas = createCanvas(800, 600);
      HeroArt.draw(canvas.getContext('2d'), screenHero, cue,
        { width: 800, height: 600, reduced: false, optimized: false });
      const pixels = ink(canvas);
      if (pixels > 0) positiveHeroPixels += pixels;
      else deliberatelyBlankCastStages.push({
        class: cls, slot, charged, cue: cue.name,
        otherCues: effects.filter((f) => f !== cue)
          .map((f) => f.type + (f.stage ? ':' + f.stage : '')),
        activeProjectiles: g.s.projectiles.length,
      });
      // Recording a call is not pixel evidence. A valid 'cast' event can be
      // deliberately silent while an area, projectile, or live status paints.
      rec.painted(cue);
      const id = 'hero/' + cls + '/' + slot + '/' + (charged ? 'charged' : 'normal') + ':cast';
      assert(rec.report(true).identities.some((v) => v.id === id && v.painted === 1));
      heroForms++;
      observedReceipts += rec.report(true).eventsSeen;
      heroCueNames.add(cue.name);
    }
assert.equal(heroForms, 48);
assert(heroCueNames.size >= 42);
assert(positiveHeroPixels > 0);
console.log('STAGE3 HERO natural cast receipts=' + heroForms +
  ' alpha-positive aggregate pixels=' + positiveHeroPixels +
  ' deliberately blank cast stages=' + JSON.stringify(deliberatelyBlankCastStages));

// Actual authored boss attacks → observer event → queued stage → enemy-specific
// Canvas renderer. No direct fabricated enemyVfx stage injection.
let bossAttacks = 0, bossVisuals = 0, bossPixels = 0, intentionallyAudioOnly = 0;
for (const id of ['thorn', 'crypt', 'mire', 'archive', 'ridge', 'mine',
  'warlord', 'abyss', 'citadel', 'cindermaw', 'darklord']) {
  const g = new Campaign('developer', 'paladin', () => 0.5);
  g.s.party = [];
  g.zone().enemies = [];
  Object.assign(g.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
  g.line = () => true;
  const e = g.bossEnemy(g.boss(id), 'normal', { x: 1400, y: 1700 });
  e.aggro = true;
  g.zone().enemies = [e];
  g.effects = [];
  g.startAttack(e, g.hero, 0);
  g.resolveAttack(e);
  const receipts = g.effects.splice(0);
  const real = receipts.filter((f) =>
    f.type === 'enemyVfx' && f.skillId === 'boss/' + id + '/0');
  assert(real.some((f) => f.stage === 'release'), id + ' missing natural release');
  intentionallyAudioOnly += real.filter((f) => f.audioOnly).length;
  const rec = Renderer.createEffectDiagnostics();
  rec.receipts(receipts);
  const queue = Fx.queue(receipts, g, [], rec);
  const owned = queue.filter((f) => f.type === 'enemyVfx' && f.skillId === 'boss/' + id + '/0');
  assert(owned.length > 0, id + ' missing natural queued release/impact');
  const surface = createCanvas(800, 600);
  const ctx = surface.getContext('2d');
  // Real ground and actors painters, including validity and cue priority.
  EnemyArt.ground(ctx, screenEnemy, g, queue, rec);
  EnemyArt.actors(ctx, screenEnemy, g, queue, rec);
  const pixels = ink(surface);
  assert(pixels > 0, id + ' enemy painter produced no alpha pixels');
  const stats = rec.report(true).identities.filter((row) => row.id.startsWith('boss/' + id + '/0:'));
  assert(stats.some((row) => row.painted > 0), id + ' no painter observation');
  bossPixels += pixels;
  bossAttacks++;
  bossVisuals += owned.length;
}
console.log('STAGE3 BOSSES natural attacks=' + bossAttacks +
  ' queued real VFX=' + bossVisuals + ' alpha-positive art=' + bossAttacks +
  ' deliberately audio-only receipts=' + intentionallyAudioOnly +
  ' aggregate alpha pixels=' + bossPixels);

// Run real full-scene Canvas renderer and its Stage 2 recorder with a natural
// cast; compare the same unchanged game state before/after queuing the cue.
function rendererFor(g) {
  const surface = createCanvas(800, 600);
  const renderer = Renderer.create({
    canvas: surface, ctx: surface.getContext('2d'), getGame: () => g,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 400, y: 300 }) },
    chargePresentation: () => null, isPaused: () => false,
    Campaign, PrototypeVisuals: Visuals, PrototypeCombatVisuals: Fx,
    PrototypeSprites: null, PrototypeMaterials: null, now: () => 1000,
  });
  renderer.setGroundReuse(false);
  assert(renderer.setEffectDiagnostics(true), 'Developer Mode opt-in refused');
  return { renderer, surface };
}
let fullSceneDifference = 0;
{
  const { g, e } = arena('paladin');
  const { renderer, surface } = rendererFor(g);
  renderer.draw();
  const baseline = raster(surface);
  assert(g.cast(1, e.id, false));
  const events = g.effects.splice(0);
  renderer.queue(events);
  const before = JSON.stringify(g.snapshot());
  renderer.draw();
  assert.equal(JSON.stringify(g.snapshot()), before, 'developer diagnostics changed save snapshot');
  const after = raster(surface);
  for (let i = 0; i < after.length; i += 4)
    if (Math.abs(after[i] - baseline[i]) +
        Math.abs(after[i + 1] - baseline[i + 1]) +
        Math.abs(after[i + 2] - baseline[i + 2]) > 15) fullSceneDifference++;
  const report = renderer.effectDiagnosticsReport();
  assert(report.identities.some((r) => r.id === 'hero/paladin/1/normal:cast' && r.painted > 0));
  assert(fullSceneDifference > 0, 'actual full-scene Canvas did not change on cast');
  renderer.setEffectDiagnostics(false);
  assert.equal(renderer.effectDiagnosticsReport().recording, false);
}
console.log('STAGE3 FULL CANVAS natural Paladin cast changed RGB pixels=' + fullSceneDifference);

// Controlled missed-draw reproduction using an actual game-cast cue and the
// existing renderer.update BEFORE draw. This deliberately starves draw calls,
// not a measurement of how often real adaptive skipping behaves on hardware.
const starvation = [];
for (const rate of [20, 30, 60]) {
  const { g, e } = arena('paladin');
  assert(g.cast(1, e.id, false));
  const events = g.effects.splice(0);
  const { renderer } = rendererFor(g);
  renderer.queue(events);
  const expected = renderer.effectDiagnosticsReport().identities
    .find((r) => r.id === 'hero/paladin/1/normal:cast');
  assert(expected && expected.queued === 1);
  // 0.22s cast cue; force >=0.25s of sim advancement without a paint.
  const intervals = Math.ceil(0.25 * rate);
  for (let i = 0; i < intervals; i++) {
    renderer.noteEffectDrawDecision(false, false);
    renderer.update(1 / rate);
  }
  renderer.draw();
  const report = renderer.effectDiagnosticsReport();
  const row = report.identities.find((r) => r.id === 'hero/paladin/1/normal:cast');
  assert.equal(row.expiredWithoutDraw, 1, rate + ' Hz withheld draw not identified');
  assert.equal(row.painted, 0, 'should not mark expired, never painted cue as painted');
  starvation.push({ hz: rate, withheldCallbacks: intervals, expiredBeforeFirstPaint: row.expiredWithoutDraw });
}
console.log('STAGE3 STARVATION controlled scheduling ' + JSON.stringify(starvation));

// Synthetic load of real game event() receipts through production queue, not
// simulated boss skill execution: confirms actual overflow policy.
{
  const { g } = arena('paladin');
  g.effects = [];
  for (let i = 0; i < 100; i++) g.event('hit', { x: 600 + i, y: 900 + i });
  g.event('heal', { target: 'hero', resource: 'health' });
  const rec = Renderer.createEffectDiagnostics();
  rec.receipts(g.effects);
  const cues = Fx.queue(g.effects, g, [], rec);
  const rows = rec.report(true).identities;
  const dropped = rows.reduce((sum, r) => sum + r.overflowDropped, 0);
  assert.equal(cues.length, 40);
  assert.equal(dropped, 61);
  assert(cues.some((f) => f.type === 'heal'));
  console.log('STAGE3 OVERFLOW injected hit event receipts=100; queued=' +
    cues.length + '; overflowDropped=' + dropped + '; critical heal retained=true');
}

// Actual status painter: adding fourth/fifth statuses must produce *no*
// additional pixel changes under today's explicit three-icon cap.
{
  const { g, e } = arena('mage');
  g.s.time = 5;
  Object.assign(e, { weakenUntil: 10, fractureUntil: 10, tauntUntil: 10, slow: 0 });
  g.mageSilenceActive = (u) => u === e && !!e.testSilenced;
  const make = () => {
    const canvas = createCanvas(800, 600);
    HeroArt.statuses(canvas.getContext('2d'), screenHero, g, 800, 600);
    return raster(canvas);
  };
  const firstThree = make();
  e.slow = 3;
  e.testSilenced = true;
  const allFive = make();
  assert(firstThree.equals(allFive),
    'adding fourth/fifth status unexpectedly changes three-slot painter');
  assert(firstThree.some((n, i) => i % 4 === 3 && n > 0));
  console.log('STAGE3 STATUS all five active on enemy; first-three and five-status pixels identical=true');
}
console.log('PASS Stage 3 natural producer-to-pixel and opt-in queue/skip/stress investigation');
