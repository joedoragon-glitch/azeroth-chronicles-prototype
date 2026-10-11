'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  { createRequire } = require('node:module'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  FX = require('../src/prototype/combat-visuals'),
  Candidate = require('../src/prototype/renderer'),
  Baseline = require('./helpers/perf-ws2-baseline.cjs'),
  Scenarios = require('./helpers/perf-ws2-scenarios.cjs');
const project = (e) => ({ x: e.sx ?? (e.x - e.y) * 0.76, y: e.sy ?? (e.x + e.y) * 0.27 }),
  height = (e) => e.height ?? 85;
let seed = 218;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
function equivalent(entities, label) {
  const before = JSON.stringify(entities),
    expected = Baseline.occlusionPairs(entities, project, height),
    actual = Candidate.occlusionPairs(entities, project, height);
  assert.deepEqual(actual, expected, label);
  assert.equal(JSON.stringify(entities), before, label + ' input stays unchanged');
}
for (let trial = 0; trial < 600; trial++) {
  const entities = [];
  for (let i = 0, n = Math.floor(random() * 160); i < n; i++)
    entities.push(
      Object.freeze({
        id: 'entity-' + i,
        renderKind: ['hero', 'ally', 'enemy', 'prop', 'npc', 'building', 'node'][
          Math.floor(random() * 7)
        ],
        x: Math.floor(random() * 900),
        y: Math.floor(random() * 900),
        sx: Math.floor(random() * 900),
        sy: Math.floor(random() * 650),
        height: Math.floor(random() * 170),
        structure: ['house', 'dead-tree', 'stonewall', 'sapling', 'grass', 'crate', 'rock-cluster'][
          Math.floor(random() * 7)
        ],
        kind: ['rest', 'supplier', 'teacher', 'mini', 'exit'][Math.floor(random() * 5)],
        hp: random() < 0.15 ? 0 : 100,
        neutral: random() < 0.15,
        interactionOnly: random() < 0.15,
      }),
    );
  // Check both exact painter order and deliberately unsorted caller inputs.
  equivalent(entities, 'fuzz-unsorted-' + trial);
  equivalent(
    entities.slice().sort((a, b) => a.x + a.y - b.x - b.y),
    'fuzz-sorted-' + trial,
  );
}
for (const dy of [-0.001, 0, 100, 129, 129.001])
  for (const dx of [-155.001, -155, 0, 155, 155.001])
    equivalent(
      [
        { id: 'hero', renderKind: 'hero', x: 1, y: 1, sx: 0, sy: 0 },
        { id: 'cover', renderKind: 'prop', structure: 'house', x: 2, y: 2, sx: dx, sy: dy },
      ],
      'boundary-' + dx + '-' + dy,
    );
for (const scenario of [...Scenarios.scenes(), ...Scenarios.edgeScenes()]) {
  const { entities, project, height } = scenario;
  assert.deepEqual(
    Candidate.occlusionPairs(entities, project, height),
    Baseline.occlusionPairs(entities, project, height),
    scenario.name,
  );
}
const stress = Scenarios.crowded('memo-proof', 61, 100, 64);
function calls(helper) {
  let projections = 0,
    heights = 0;
  const result = helper(
    stress.entities,
    (e) => {
      projections++;
      return stress.project(e);
    },
    (e) => {
      heights++;
      return stress.height(e);
    },
  );
  return { projections, heights, result };
}
const oldCalls = calls(Baseline.occlusionPairs),
  newCalls = calls(Candidate.occlusionPairs);
assert.deepEqual(newCalls.result, oldCalls.result);
assert(newCalls.projections < oldCalls.projections, 'same-frame cover projections are reused');
assert(newCalls.heights < oldCalls.heights, 'same-frame cover heights are reused');
console.log(
  'PASS 1,200 differential fuzz scenes, exact boundaries, 21 authored/stress/zero-actor scenes and reduced repeated projections/heights',
);

// Execute the complete candidate painter with only its broad phase replaced by
// the exact old helper. This checks resulting pixels, not just pair membership.
const rendererPath = path.resolve(__dirname, '../src/prototype/renderer.js'),
  source = fs.readFileSync(rendererPath, 'utf8'),
  start = source.indexOf('  function occlusionPairs('),
  end = source.indexOf('\n  function create(', start),
  sandbox = { module: { exports: {} }, require: createRequire(rendererPath), performance, console };
vm.runInNewContext(
  source.slice(0, start) + Baseline.occlusionPairs.toString() + '\n' + source.slice(end),
  sandbox,
  { filename: 'perf-ws2-baseline-renderer.js' },
);
const OldRenderer = sandbox.module.exports;
function painter(renderer, game, width, height) {
  const surface = { width, height },
    ctx = new Proxy(
      {
        measureText: (text) => ({ width: String(text).length * 6 }),
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
      },
      {
        get: (target, key) => (key in target ? target[key] : () => {}),
        set: (target, key, value) => {
          target[key] = value;
          return true;
        },
      },
    ),
    result = renderer.create({
      canvas: surface,
      ctx,
      getGame: () => game,
      platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: width * 0.5, y: height * 0.58 }) },
      chargePresentation: () => null,
      isPaused: () => false,
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      PrototypeGroundCache: null,
      PrototypeSprites: null,
      PrototypeMaterials: null,
      now: () => 16000,
    });
  return { surface, ctx, result };
}
const previousDocument = global.document;
global.document = { createElement: () => createCanvas(384, 384) };
sandbox.document = global.document;
let pixelScenes = 0,
  behavioralFrames = 0;
try {
  for (const actorKind of ['hero', 'ally', 'enemy']) {
    for (const front of [false, true])
      for (const coverCount of [1, 4, 10]) {
        const actor = {
            id: 'actor',
            name: 'Actor',
            renderKind: actorKind,
            class: 'paladin',
            x: 200,
            y: 200,
            hp: 100,
            maxHp: 100,
          },
          props = Array.from({ length: coverCount }, (_, i) => ({
            id: 'cover-' + i,
            structure: i % 3 ? 'house' : 'dead-tree',
            x: front ? 220 + i : 180 - i,
            y: front ? 220 + i : 180 - i,
            decorative: true,
          })),
          game = {
            hero: actorKind === 'hero' ? actor : { ...actor, id: 'camera', x: 250, y: 250 },
            zoneId: 'vale',
            s: { rescued: {}, projectiles: [], loot: [], party: [] },
            regionIndex: () => 0,
            zone: () => ({
              props,
              buildings: [],
              enemies: actorKind === 'enemy' ? [actor] : [],
              roads: [],
            }),
            supplyRoom: () => null,
            isDungeon: () => false,
            zoneSize: () => 450,
            visibleNPCs: () => [],
            visibleResourceNodes: () => [],
            activeLivingParty: () => (actorKind === 'ally' ? [actor] : []),
            night: () => false,
            manaCombatActive: () => false,
            selectedHeroTarget: () => null,
            peace: false,
          },
          visuals = {
            height: (e) => (e.renderKind === 'prop' ? 85 : 65),
            draw(ctx, e, p) {
              ctx.save();
              if (e.renderKind === 'prop') {
                ctx.fillStyle = '#405d45';
                ctx.fillRect(p.x - 40, p.y - 75, 80, 90);
              } else {
                ctx.fillStyle = '#496593';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y - 36, 17, 24, 0, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            },
            floor() {},
            terrain() {},
            roads() {},
            bridges() {},
            atmosphere() {},
          };
        function make(renderer) {
          const surface = createCanvas(400, 330),
            ctx = surface.getContext('2d');
          const result = renderer.create({
            canvas: surface,
            ctx,
            getGame: () => game,
            platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 190, y: 210 }) },
            chargePresentation: () => null,
            isPaused: () => false,
            Campaign: { dungeonIds: [] },
            PrototypeVisuals: visuals,
            PrototypeCombatVisuals: { ground() {} },
            PrototypeGroundCache: null,
            PrototypeSprites: null,
            PrototypeMaterials: null,
            now: () => 16000,
          });
          return { ctx, result };
        }
        const old = make(OldRenderer),
          candidate = make(Candidate),
          before = JSON.stringify(game);
        old.result.draw();
        candidate.result.draw();
        assert.equal(JSON.stringify(game), before, 'mask scene state invariance');
        const a = old.ctx.getImageData(0, 0, 400, 330).data,
          b = candidate.ctx.getImageData(0, 0, 400, 330).data;
        assert(
          Buffer.from(a).equals(Buffer.from(b)),
          actorKind + ' foreground ' + front + ' covers ' + coverCount + ' exact pixels',
        );
        pixelScenes++;
      }
  }
  // Independent restored campaigns retain the same deterministic simulation and
  // event trace across renderer calls, including party and enemy engagement.
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const game = new C('normal', cls, () => 0.7);
    game.enter('crypt');
    const snapshot = game.snapshot(),
      left = C.restore(JSON.parse(JSON.stringify(snapshot)), () => 0.7),
      right = C.restore(JSON.parse(JSON.stringify(snapshot)), () => 0.7),
      old = painter(OldRenderer, left, 375, 812),
      candidate = painter(Candidate, right, 375, 812);
    for (const c of [left, right]) {
      c.hero.hp = c.hero.maxHp = 100000;
      const e = c.zone().enemies.find((e) => e.hp > 0);
      Object.assign(c.hero, c.safe(e.x - 70, e.y));
      c.engage(e, true, false);
    }
    for (let frame = 0; frame < 120; frame++) {
      if (frame % 10 === 0) {
        old.result.draw();
        candidate.result.draw();
      }
      left.tick(1 / 60, { x: frame < 30 ? 0.25 : 0, y: 0 });
      right.tick(1 / 60, { x: frame < 30 ? 0.25 : 0, y: 0 });
      assert.equal(
        JSON.stringify(right),
        JSON.stringify(left),
        cls + ' behavioral state/events frame ' + frame,
      );
      behavioralFrames++;
    }
  }
} finally {
  if (previousDocument === undefined) delete global.document;
  else global.document = previousDocument;
}
console.log(
  'PASS ' +
    pixelScenes +
    ' byte-identical actual occlusion-mask renderings; ' +
    behavioralFrames +
    ' deterministic combat/companion frames preserve all state and events',
);
