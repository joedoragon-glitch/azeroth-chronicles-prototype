'use strict';
// Greenwood Vale overworld / Millhaven: verify the live Interact owner rather
// than inventing a second selection algorithm or new gameplay tutorial flow.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');
const g = new Campaign('normal', 'paladin', () => 0.63);
assert.equal(g.zoneId, 'vale');
const allowed = new Set([
  'rest', 'supplier', 'recruiter', 'quests', 'transport', 'dungeon', 'cage',
  'bundle', 'landmark', 'mini', 'resource', 'smith', 'teacher', 'alchemist',
  'keeper', 'archive-record', 'patrol-report', 'barracks', 'fountain',
  'appointment', 'dungeon-master', 'scene-detail', 'critical-codex',
]);
for (const n of [...g.visibleNPCs(), ...g.visibleResourceNodes()])
  assert(allowed.has(n.kind), 'unreviewed Greenwood interactable: ' + n.kind + '/' + n.id);
assert(g.visibleNPCs().some(n => n.kind === 'landmark'), 'real outdoor landmarks');
assert(g.visibleNPCs().some(n => n.kind === 'quests'), 'real Millhaven quest board');
assert(g.visibleNPCs().some(n => n.kind === 'recruiter'), 'real Millhaven captain');
const app = shell('en');
const game = app.scope.Prototype.game;
assert.equal(game.zoneId, 'vale');
const btn = app.elements.get('touch-interact-button');
const captain = game.visibleNPCs().find(n => n.kind === 'recruiter');
Object.assign(game.hero, { x: captain.x, y: captain.y });
for (const t of [20, 50, 80, 120, 160, 200]) app.frame(t);
assert.equal(btn.title, captain.name, 'target identity displayed on interact control');
assert(btn.getAttribute('aria-label').includes(captain.name), 'assistive target identity');
assert(btn.children.some(x => x.textContent === 'Captain'), 'narrow mobile button caption');
const source = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(source.includes('function drawInteractionCue()') &&
  source.includes("game.zoneId !== 'vale'") &&
  source.includes('renderer.screen(n)') &&
  source.includes('smallInteractionKinds.has(n.kind)'),
  'Vale-only cue uses actual target, world projection and small-kind allowlist');
assert(source.includes("drawInteractionCue();") &&
  !source.includes("ctx.scale(zoom(), zoom());\n    drawInteractionCue();"),
  'cue is emitted on permitted drawn frames after the existing Canvas/Pixi layer');
for (const banned of ['rest', 'transport', 'dungeon', 'barracks', 'landmark', 'fountain'])
  assert(!source.split('const smallInteractionKinds = new Set([')[1]
    .split(']);')[0].includes("'" + banned + "'"),
    'no broad building/monument outlining: ' + banned);
// A real overworld landmark has meaningful authored information; pressing
// Interact must make the description visible rather than only calling say().
const landmark = game.visibleNPCs().find(n => n.kind === 'landmark');
assert(landmark);
Object.assign(game.hero, { x: landmark.x, y: landmark.y });
app.frame(250);
app.elements.get('touch-interact-button').click();
assert.equal(app.elements.get('modal').hidden, false, 'landmark opens inspect UI');
const description = app.elements.get('modal-description').textContent;
assert(description.includes(landmark.name), 'inspect UI names the selected landmark');
assert(description.length > landmark.name.length + 15, 'authored site explanation is visible');
assert(game.messages.at(-1)?.includes(landmark.name), 'original engine log still receives narrative');
assert(game.s.discovered[game.definition().id + ':' + landmark.id],
  'original discovery mechanics preserved');
assert(source.includes("status((n.name || n.kind) + ': no available interaction right now.')"),
  'unknown/unsupported interactions are no longer silent');
console.log('PASS Vale-only small interaction cue, target identity, real landmark inspection, discovery and large-building exclusion');
