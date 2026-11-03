'use strict';
// Native overlay owns a bounded, transient Block label even when Pixi draws the world.
const assert = require('node:assert/strict');
const Renderer = require('../src/prototype/renderer.js');
const fs = require('node:fs');
const rendererSource = fs.readFileSync(require('node:path').join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert.match(rendererSource, /ctx\.strokeText\(label, x, y\)/, 'cue outline uses injected locale');
assert.match(rendererSource, /ctx\.fillText\(label, x, y\)/, 'cue text uses injected locale');
assert.match(rendererSource, /getBlockLabel = \(\) => 'Blocked!'/, 'English defaults without app shell');
let now = 1000;
const game = {
  zoneId: 'vale',
  hero: { id: 'hero', hp: 100, x: 100, y: 100 },
  s: { statistics: { deaths: 0 }, party: [] },
  zone() { return { enemies: [{ id: 'foe', hp: 100, x: 120, y: 120 }] }; },
};
const renderer = Renderer.create({
  canvas: { width: 400, height: 300 }, ctx: {}, getGame: () => game,
  platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 200, y: 150 }) },
  chargePresentation: () => null, isPaused: () => false,
  Campaign: {}, PrototypeVisuals: {},
  PrototypeCombatVisuals: { queue(_events, _game, current) { return current; } },
  PrototypeGroundCache: null, PrototypeEnemyVfxArt: null,
  renderLayer: 'overlay', now: () => now,
});
function queueBlock(target = 'foe') {
  renderer.queue([{ type: 'skillBlocked', target,
    zone: game.zoneId, deaths: game.s.statistics.deaths }]);
}
queueBlock();
assert.equal(renderer.metrics().blockCues, 1);
renderer.queue([{ type: 'criticalExecutionRelease', source: 'hero',
  zone: game.zoneId, deaths: game.s.statistics.deaths }]);
assert.equal(renderer.metrics().blockCues, 1, 'critical cue is independent');
now += 450;
renderer.update(0);
assert.equal(renderer.metrics().blockCues, 1, 'skipped paint preserves pending cue');
queueBlock();
assert.equal(renderer.metrics().blockCues, 1, 'same target refreshes');
for (let i = 0; i < 12; i++) queueBlock('enemy-' + i);
assert(renderer.metrics().blockCues <= 8, 'crowd cap is enforced');
now += 1500;
renderer.update(0);
assert.equal(renderer.metrics().blockCues, 0, 'unpainted cues expire by wall clock');
queueBlock();
game.zoneId = 'march';
renderer.queue([]);
assert.equal(renderer.metrics().blockCues, 0, 'zone transitions clear pending labels');
// Exercise the actual native painter with a tiny Canvas context. No GPU or game
// mutation is required to verify a mid-session display-language switch.
const blockPainter = rendererSource.match(/    function drawBlockCues\(\) \{[\s\S]*?\n    \}\n    function drawCriticalCues/);
assert(blockPainter, 'native block painter stays present in both overlay paths');
const painterFactory = new Function('blockCues', 'game', 'ctx', 'now', 'screen',
  'canvas', 'reducedMotion', 'spriteHeight', 'getBlockLabel',
  blockPainter[0].replace(/\n    function drawCriticalCues$/, '') + '\nreturn drawBlockCues;');
let language = 'en';
const paints = [];
const context = {
  save() {}, restore() {},
  measureText(text) { return { width: text.length * 7 }; },
  strokeText(text, x) { paints.push({ text, x, mode: 'outline' }); },
  fillText(text, x) { paints.push({ text, x, mode: 'fill' }); },
};
const paintingGame = {
  ...game, zoneId: 'vale',
  zone() { return { enemies: [{ id: 'foe', hp: 100, x: 3, y: 60 }] }; },
};
const painter = painterFactory(
  [{ target: 'foe', life: 0.65, drawn: false, expiresAt: 2000 }],
  paintingGame, context, () => 1000, (actor) => actor, { width: 100, height: 100 },
  () => false, () => 12, () => language === 'es' ? '¡Bloqueado!' : 'Blocked!',
);
painter();
assert(paints.some((p) => p.mode === 'fill' && p.text === 'Blocked!'));
language = 'es';
painter();
assert(paints.some((p) => p.mode === 'fill' && p.text === '¡Bloqueado!'));
const spanishCue = paints.find((p) => p.mode === 'fill' && p.text === '¡Bloqueado!');
assert(spanishCue.x >= 40 && spanishCue.x <= 60, 'Spanish cue is clamped within narrow viewport');
console.log('PASS localized Skill Block Canvas/Pixi overlay, switch, bounds and expiry');
