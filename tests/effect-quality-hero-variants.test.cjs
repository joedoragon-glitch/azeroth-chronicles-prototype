'use strict';
// Stage 5.2 Phase B — 48 naturally admitted hero cast receipts x existing
// rendering flags. Native software Canvas only, no graphics tiers, simulated
// device FPS, Pixi GPU parity or gameplay mechanic changes.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const Combat = require('../src/prototype/combat-visuals.js');

const WIDTH = 800, HEIGHT = 600;
const variants = [
  { optimized: false, reduced: false },
  { optimized: true, reduced: false },
  { optimized: false, reduced: true },
  { optimized: true, reduced: true },
];
const project = ({ x, y }) => ({
  x: 340 + (x - 600) * 0.68 - (y - 900) * 0.3,
  y: 300 + (x - 600) * 0.17 + (y - 900) * 0.3,
});

function actualCast(cls, slot, charged) {
  const game = new Campaign('developer', cls, () => 0.9);
  const zone = game.zone();
  zone.props = []; zone.buildings = []; zone.npcs = []; zone.nodes = [];
  Object.assign(game.hero, {
    x: 600, y: 900, hp: 50, maxHp: 1000,
    skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
  });
  game.s.mercyTime = 0;
  const target = game.makeEnemy({
    species: 'goblin', name: 'Quality cast target',
    level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 670, y: 900 });
  zone.enemies = [target];
  game.s.party = [game.unit('soldier', 580, 930)];
  if (cls === 'mage' && slot === 3 && !charged)
    target.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
  game.effects = [];
  assert(game.cast(slot, target.id, charged),
    'real cast was not admitted: ' + [cls, slot, charged]);
  const events = game.effects.splice(0);
  assert(events.some(e => e.type === 'heroSkillCast'),
    'successful cast did not produce a heroSkillCast receipt');
  const cues = Combat.queue(events, game, []);
  const cast = cues.find(f => f.type === 'heroSkill' && f.stage === 'cast');
  assert(cast, 'real admitted cast did not create a presentation receipt');
  return { game, cast, cues, sourceProjectiles: game.s.projectiles.length };
}
function sample(ctx, canvas, cast, opts) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  HeroArt.draw(ctx, project, cast, { width: WIDTH, height: HEIGHT, ...opts });
  const data = Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data);
  let pixels = 0;
  for (let i = 3; i < data.length; i += 4)
    if (data[i] > 0) pixels++;
  return { data, pixels };
}

const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
let forms = 0, visibleForms = 0, silentForms = 0;
let detailChanged = 0, motionChanged = 0, protectedDraws = 0;
const silent = [];
for (const cls of ['paladin', 'mage', 'ranger']) {
  for (let slot = 1; slot <= 8; slot++) {
    for (const charged of [false, true]) {
      const { game, cast, cues, sourceProjectiles } = actualCast(cls, slot, charged);
      const before = JSON.stringify(game.snapshot());
      const samples = variants.map(v => sample(ctx, canvas, cast, v));
      const baseline = samples[0];
      if (baseline.pixels) {
        visibleForms++;
        for (let i = 1; i < samples.length; i++) {
          assert(samples[i].pixels > 0,
            'previously visible hero cast vanished under presentation ' +
            JSON.stringify({ cls, slot, charged, ...variants[i] }));
          protectedDraws++;
        }
      } else {
        silentForms++;
        silent.push(cls + '/' + slot + '/' + (charged ? 'charged' : 'normal'));
        // Deliberately silent cast receipts are NOT permission to inject a
        // fake cast flash. Another event or live projectile owns the action.
        assert(cues.some(f => f !== cast && f.type === 'heroSkill') ||
          sourceProjectiles > 0,
          'silent cast lost its area/impact/flight owner: ' + [cls, slot, charged]);
      }
      if (!samples[0].data.equals(samples[1].data)) detailChanged++;
      if (!samples[0].data.equals(samples[2].data)) motionChanged++;
      assert.equal(JSON.stringify(game.snapshot()), before,
        'presentation flags changed authoritative game/save state');
      forms++;
    }
  }
}
assert.equal(forms, 48);
assert(visibleForms > 0 && silentForms > 0,
  'hero cast inventory no longer distinguishes visible and silent stages');
assert.equal(visibleForms + silentForms, 48);
assert.equal(protectedDraws, visibleForms * 3);
console.log('PASS Stage 5.2 natural hero cast detail/motion Canvas matrix ' +
  JSON.stringify({
    forms,
    variantsPerForm: variants.length,
    positiveNormalCasts: visibleForms,
    intentionallySilentBaseCasts: silentForms,
    previouslyVisibleSurvivals: protectedDraws,
    optimizedPixelDifferences: detailChanged,
    reducedMotionPixelDifferences: motionChanged,
    silentBaseIdentities: silent,
  }) + '. No false hit flash, new quality mode, Pixi/device FPS or ' +
  'whole-game acceptance claim.');
