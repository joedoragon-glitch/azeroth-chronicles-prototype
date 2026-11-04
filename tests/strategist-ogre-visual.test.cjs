'use strict';
// Gate 0 visual regression: the original renderer, not a concept redraw.
const assert = require('node:assert/strict');
const V = require('../src/prototype/visuals.js');
const C = require('../src/prototype/engine.js');
const visualSource = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/prototype/visuals.js'), 'utf8');
const fs = require('node:fs');
const path = require('node:path');
function trace(e) {
  const events = [], style = { globalAlpha: 1 };
  const ctx = new Proxy({}, {
    set(_obj, key, value) { style[key] = value; events.push([key, value]); return true; },
    get(_obj, key) {
      if (Object.hasOwn(style, key)) return style[key];
      if (key === 'canvas') return { width: 256, height: 256 };
      return (...args) => {
        events.push([key, ...args]);
        if (key === 'measureText') return { width: 0 };
        if (key === 'createRadialGradient' || key === 'createLinearGradient')
          return { addColorStop() {} };
      };
    },
  });
  const before = JSON.stringify(e);
  V.draw(ctx, e, { x: 90, y: 110 }, 2);
  assert.equal(JSON.stringify(e), before, 'render must not change the entity');
  assert.equal(events.filter((x) => x[0] === 'save').length,
    events.filter((x) => x[0] === 'restore').length, 'balanced Canvas state');
  return events;
}
const originalEnemy = { id: 'ogre', renderKind: 'enemy', species: 'ogre', type: 'mob' };
const enemy = trace(originalEnemy);
const hero = trace({ id: 'hero', renderKind: 'hero', class: 'strategist' });
const crown = trace({ id: 'hero', renderKind: 'hero', class: 'strategist', crowned: true });
const paints = (t) => t.filter((x) => x[0] === 'fillStyle').map((x) => x[1]);
const art = visualSource.split('function strategistHero(crowned = false) {')[1]
  ?.split('function hero(role) {')[0] || '';
assert(art.length > 5000, 'hero needs independently authored anatomical and costume geometry');
assert(!/ogreBody\s*\(/.test(art), 'no repaint of stock Ogre anatomy masquerading as a new class');
// Keep recognizable Ogre hide and paired tusks, but own eyes, jaw, crest,
// torso/leg stance and actual clothing shapes in this hero's procedural code.
for (const part of [
  "const hide = '#b2a684'", "const hideFold",
  "ctx.moveTo(-15, -43)", "ctx.moveTo(-7, -24)",
  "ctx.moveTo(9, -23)", "ctx.moveTo(-13, -8)",
  "ctx.moveTo(-18, -31)", "ctx.moveTo(-19, -34)",
  "ctx.moveTo(-7, -55)",
]) assert(art.includes(part), 'missing distinct Ogre anatomical / silhouette owner: ' + part);

for (const c of ['#b2a684', '#8b8063', '#c8bb96'])
  assert(paints(hero).includes(c) && paints(enemy).includes(c),
    'Strategist must inherit existing Ogre hide/anatomical palette: ' + c);
for (const c of ['#679c9a', '#be8c5b', '#70583e'])
  assert(paints(hero).includes(c), 'Hero needs restrained material-kit identity: ' + c);
assert(!paints(enemy).includes('#679c9a'), 'Enemy Ogre stays unchanged');
// New direction must read from major forms, not the previous copied body.
for (const swatch of ['#394c42', '#35332e', '#46574b', '#b4a079', '#aeb9b3'])
  assert(paints(hero).includes(swatch), 'New silhouette/face/equipment color absent: ' + swatch);
for (const swatch of ['#394c42', '#35332e', '#46574b'])
  assert(!paints(enemy).includes(swatch), 'Original Ogre inherited Strategist outfit: ' + swatch);
const contour = (t) => t.filter((x) =>
  ['moveTo', 'bezierCurveTo', 'quadraticCurveTo', 'lineTo'].includes(x[0]));
assert.notDeepEqual(contour(hero), contour(enemy),
  'Strategist must have independently drawn anatomy and silhouette');
assert(contour(hero).length > contour(enemy).length,
  'new hero owns more facial and costume geometry than a stock Ogre');
assert(art.includes('ctx.scale(0.88, 0.88)'), 'head-to-torso proportion correction');
assert(art.includes('ctx.lineTo(-24, 32)') && art.includes('ctx.lineTo(21, 35)'),
 'both thighs extend into independently drawn calves, not straight into boots');
assert(art.includes('ctx.translate(0, -19)'), 'raised pose allows articulated shins and boots');
assert(art.includes('ctx.moveTo(-24, 29)') && art.includes('ctx.moveTo(11, 32)'),
  'both lower legs have distinct grounded boots');
assert(trace({ renderKind: 'hero', class: 'strategist' }).some((x) =>
  x[0] === 'scale' && x[1] === 0.88 && x[2] === 0.88),
  'the existing Canvas renderer must see the corrected head proportions');

assert(paints(crown).includes('#c7ad71'), 'Crowned presentation remains distinct');
assert.deepEqual(trace(originalEnemy), enemy, 'Enemy Ogre deterministic and unchanged');
assert.deepEqual(trace({ renderKind: 'hero', class: 'strategist' }),
  trace({ renderKind: 'hero', class: 'strategist' }), 'Hero rendering deterministic');
for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
  const existing = trace({ renderKind: 'hero', class: cls });
  assert(!paints(existing).includes('#679c9a'), cls + ' art remains separate');
}
assert.equal(V.height({ renderKind: 'hero', class: 'strategist' }), 88);
assert.equal(V.height({ renderKind: 'hero', class: 'paladin' }), 54);
assert.equal(C.classes.strategist, undefined, 'visual-only Gate 0 cannot expose fifth class');
const sprites = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/sprites/manifest.json'), 'utf8'));
assert(!Object.hasOwn(sprites.sprites, 'hero:strategist'),
  'unapproved raster must not override procedural candidate');
console.log('PASS Gate 0 independently drawn Ogre character, distinct face/silhouette/posture, deterministic Canvas and four-class isolation');
