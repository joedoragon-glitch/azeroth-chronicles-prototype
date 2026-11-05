'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assets = require('../scripts/site-assets.cjs');
const app = read('src/prototype/app.js');
const pixi = read('src/prototype/pixi-experimental.js');
const canvas = read('src/prototype/renderer.js');
assert(assets.scripts.includes('src/prototype/pixi-experimental.js'));
for (const pilot of [
  'tools/webgl-pilot/native-webgl2-core.js',
  'tools/webgl-pilot/native-sprite-adapter.js',
  'tools/webgl-pilot/pixi-scene-bridge.js',
  'tools/webgl-pilot/renderer-switch-guard.js',
]) assert(assets.core.includes(pilot), 'Missing staging asset: '+pilot);
assert(app.includes('graphicsController.requestWebGL()'));
assert(app.includes("renderer.setRenderLayer('overlay')"));
assert(app.includes("renderer.setRenderLayer('full')"));
assert(app.includes('function drawWorld()'));
assert(canvas.includes("renderLayer === 'background'"));
assert(canvas.includes("renderLayer === 'overlay'"));
assert(pixi.includes('getGame()'), 'GPU path must use live Campaign');
assert(pixi.includes('scene.syncActors(records)'));
assert(pixi.includes('syncBackground()'));
assert(!pixi.includes('new Campaign('));
assert(pixi.includes('./assets/vendor/pixi-8.22.0.min.js'));
assert(!pixi.includes('cdn.jsdelivr.net'));
assert(assets.core.includes('assets/vendor/pixi-8.22.0.min.js'));
console.log('PixiJS Step 2 source contract passes (not a browser test)');

// Execute the actual health-plate painter in isolation, with live native fort
// membership. Source-string assertions alone cannot prove shield/bar output.
{
  const vm = require('node:vm');
  const Campaign = require('../src/prototype/engine');
  const game = new Campaign('developer', 'paladin', () => 0.9);
  game.s.zone = 'vale';
  const z = game.zone();
  const skeleton = z.enemies.find(
    (enemy) => enemy.hp > 0 && enemy.stronghold === 'skeleton-watch' && game.enemyFort(enemy),
  );
  assert(skeleton, 'Skeleton Watch must have a living, position-fortified native resident');
  assert.equal(skeleton.renderKind, undefined, 'the Pixi overlay receives raw Campaign actors');
  assert.equal(game.enemyFort(skeleton).id, 'skeleton-watch');
  const start = canvas.indexOf('    function healthPlate(');
  const end = canvas.indexOf('    function projectileVector(', start);
  assert(start >= 0 && end > start, 'extract the exact shared painter implementation');
  const operations = [];
  const brush = {
    fillStyle: '#000',
    save() {},
    restore() {},
    translate() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    closePath() {},
    fill() { operations.push(['fill', this.fillStyle]); },
    stroke() {},
    fillRect(x, y, w, h) { operations.push(['rect', this.fillStyle, x, y, w, h]); },
  };
  const paint = vm.runInNewContext(
    canvas.slice(start, end) + '\nhealthPlate;',
    {
      ctx: brush,
      spriteHeight: () => 64,
      game,
      chargePresentation: () => null,
    },
  );
  const render = (actor, kind) => {
    operations.length = 0;
    if (kind === undefined) paint(actor, { x: 180, y: 140 });
    else paint(actor, { x: 180, y: 140 }, kind);
    return operations.slice();
  };
  const hasShield = (ops) => ops.some(([action, color]) => action === 'fill' && color === '#9dbfcb');
  const hasBar = (ops, color) => ops.some(([action, fill]) => action === 'rect' && fill === color);
  const before = JSON.stringify(game.s);
  const defended = render(skeleton, 'enemy');
  assert(hasShield(defended), 'raw fortified skeleton receives the Pixi shield');
  assert(hasBar(defended, '#e87966'), 'raw hostile HP is red');
  // The original Canvas path supplies renderKind and omits the new argument.
  assert(
    hasShield(render({ ...skeleton, renderKind: 'enemy' })),
    'Canvas-presented enemy keeps the same shield',
  );
  const home = { x: skeleton.x, y: skeleton.y };
  Object.assign(skeleton, { x: 80, y: 80 });
  assert.equal(game.enemyFort(skeleton), null, 'the same skeleton loses fort protection outside');
  const exposed = render(skeleton, 'enemy');
  assert(!hasShield(exposed), 'Pixi must remove the shield immediately outside the fort');
  assert(hasBar(exposed, '#e87966'), 'unfortified hostile HP remains red');
  Object.assign(skeleton, home);
  const ally = render({ id: 'test-ally', type: 'soldier', hp: 90, maxHp: 100 }, 'ally');
  assert(!hasShield(ally), 'allied companion does not acquire a hostile shield');
  assert(hasBar(ally, '#91d59c'), 'companion HP remains green');
  const hero = render({ id: 'hero', hp: 100, maxHp: 100 }, 'hero');
  assert(!hasShield(hero), 'hero does not acquire an enemy-fort shield');
  assert(hasBar(hero, '#91d59c'), 'hero HP remains green');
  assert.equal(JSON.stringify(game.s), before, 'health painting and fort queries never mutate saves');
  console.log('PASS native Skeleton Watch shield, loss outside, enemy/ally/hero colors, Canvas parity, state purity');
}

