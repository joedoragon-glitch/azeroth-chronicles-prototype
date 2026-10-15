'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');

// Render all four visible regional travel types through the actual art owner.
// Inspect actual display pixels and font wrapping separately in the final browser audit.
const cases = [
  ['Greenwood merchant wagon', '🐎', 0, 18],
  ['Marches return merchant wagon', '🐎', 1, 18],
  ['Reedport ferry', '⛵', 1, 11],
  ['Stonecross ferry', '⛵', 2, 11],
  ['Ironroot pack caravan', '🐫', 2, 15],
  ['Frontier inbound caravan', '🐫', 3, 15],
  ['Frontier civilian dragon', '🐉', 3, 12],
];
for (const [name, icon, region, minimumFills] of cases) {
  const npc = { id: name, name, kind: 'transport', renderKind: 'npc', icon, visualScale: 1.35 };
  const original = JSON.stringify(npc);
  const calls = { fills: 0, strokes: 0, paths: 0 };
  const ctx = {
    save() {}, restore() {}, translate() {}, scale() {},
    beginPath() { calls.paths++; }, moveTo() {}, lineTo() {}, closePath() {},
    fill() { calls.fills++; }, stroke() { calls.strokes++; },
    ellipse() {}, arc() {},
  };
  Visuals.draw(ctx, npc, { x: 140, y: 160 }, region);
  assert(calls.fills >= minimumFills, name + ' should render a layered vehicle silhouette');
  assert(calls.strokes >= 15 && calls.paths >= 20, name + ' retains useful construction details');
  assert(Visuals.height(npc) >= 90, name + ' reserves room for the taller art and label');
  assert.equal(JSON.stringify(npc), original, name + ' art may not change transport state');
}
const actualIcons = new Set();
for (const region of Campaign.data.regions) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter(region.id);
  for (const npc of game.zone().npcs.filter(n => n.kind === 'transport' && !n.interactionOnly))
    actualIcons.add(npc.icon);
}
for (const icon of ['🐎', '⛵', '🐫', '🐉'])
  assert(actualIcons.has(icon), 'existing route still exposes ' + icon);

const css = fs.readFileSync(path.join(__dirname, '../styles/phone.css'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(css.includes('width: min(252px, calc(100vw - 16px));'),
  'portrait corner HUD reclaims unused MP width');
assert(css.includes('width: min(252px, 44vw);'),
  'landscape corner HUD also reclaims unused MP width');
assert(css.includes('grid-template-columns: minmax(0, 1fr);\n  gap: 2px;'),
  'HP bar uses the whole stats column without a reserved MP column');
assert(app.includes("(manaEnabled\n        ? '<div class=\"resource-line mana\">"),
  'original MP restoration switch remains available');
console.log('PASS seven transport art identities, regional route coverage, state purity and compact HP-only phone HUD');
