'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Renderer = require('../src/prototype/renderer.js');
const { shell } = require('./helpers/production-shell.cjs');

// Exercise the real HUD target selection on a standard Millhaven save.
const { scope, elements } = shell('en', 'ranger');
const game = scope.Prototype.game;
const z = game.zone();
const initialSave = game.snapshot();
Object.assign(game.hero, { x: 300, y: 300 });
z.npcs = [
  { id: 'mill-pond', kind: 'landmark', name: 'Mill pond', x: 370, y: 300 },
  { id: 'recruiter', kind: 'recruiter', name: 'Millhaven Captain', x: 352, y: 300 },
];
z.nodes = [];
z.buildings = [];
scope.Prototype.updateHUD();
const button = elements.get('touch-interact-button');
const label = elements.get('interaction-target-label');
assert.equal(button.hidden, false);
assert.equal(label.hidden, false);
assert.equal(label.textContent, 'Interact · Millhaven Captain');
assert.equal(button.getAttribute('aria-label'), 'Interact: Millhaven Captain');
assert.equal(button.title, 'Millhaven Captain');
assert.equal(Renderer.smallInteractionTarget(z.npcs[1]), true);
for (const kind of ['rest', 'dungeon', 'transport', 'landmark', 'barracks', 'fountain'])
  assert.equal(Renderer.smallInteractionTarget({ kind }), false, kind + ' is not outlined');
for (const kind of ['recruiter', 'quests', 'bundle', 'cage', 'resource'])
  assert.equal(Renderer.smallInteractionTarget({ kind }), true, kind + ' gets a subdued cue');
assert.equal(Renderer.smallInteractionTarget({ kind: 'bundle', interactionOnly: true }), false);

// The site uses existing source-authored description rather than invented prose.
z.npcs[1].x = 520;
scope.Prototype.updateHUD();
assert.equal(label.textContent, 'Interact · Mill pond');
button.click();
assert.equal(elements.get('modal-title').textContent, 'Mill pond');
const description = elements.get('modal-description');
assert.match(String(description.textContent || description.innerHTML), /Mill pond/i);
assert.equal(game.s.discovered['vale:mill-pond'], true);

// Out-of-range targets disappear; no changed interaction radius or save version.
Object.assign(game.hero, { x: 900, y: 900 });
scope.Prototype.updateHUD();
assert.equal(label.hidden, true);
assert.equal(button.hidden, true);
assert.equal(game.interactionDistance(z.npcs[0]) >= 115, true);
assert.equal(initialSave.version, game.snapshot().version);

const source = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert.equal((source.match(/drawInteractionCue\(\);/g) || []).length, 2,
  'Canvas world and Pixi Canvas overlay paint the same corner cue');
for (const file of ['index.html', 'phone.html', 'prototype.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert(html.includes('id="interaction-target-label"'), file + ' shows the named target');
}
console.log('PASS Vale target identity, 115-unit reach, site inspection, small-only selection, Canvas/Pixi cues and save integrity');
