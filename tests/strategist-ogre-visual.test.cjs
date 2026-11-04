'use strict';
// Gate 0 visual regression: the original renderer, not a concept redraw.
const assert = require('node:assert/strict');
const V = require('../src/prototype/visuals.js');
const C = require('../src/prototype/engine.js');
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
for (const c of ['#b2a684', '#8b8063', '#c8bb96'])
  assert(paints(hero).includes(c) && paints(enemy).includes(c),
    'Strategist must inherit existing Ogre hide/anatomical palette: ' + c);
for (const c of ['#679c9a', '#be8c5b', '#67523e'])
  assert(paints(hero).includes(c), 'Hero needs restrained material-kit identity: ' + c);
assert(!paints(enemy).includes('#679c9a'), 'Enemy Ogre stays unchanged');
assert(!paints(enemy).includes('#67523e'), 'No hero pouch on enemy Ogre');
assert(paints(crown).includes('#c7ad71'), 'Crowned presentation remains distinct');
assert.deepEqual(trace(originalEnemy), enemy, 'Enemy Ogre deterministic and unchanged');
assert.deepEqual(trace({ renderKind: 'hero', class: 'strategist' }),
  trace({ renderKind: 'hero', class: 'strategist' }), 'Hero rendering deterministic');
for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
  const existing = trace({ renderKind: 'hero', class: cls });
  assert(!paints(existing).includes('#679c9a'), cls + ' art remains separate');
}
assert.equal(V.height({ renderKind: 'hero', class: 'strategist' }), 70);
assert.equal(V.height({ renderKind: 'hero', class: 'paladin' }), 54);
assert.equal(C.classes.strategist, undefined, 'visual-only Gate 0 cannot expose fifth class');
const sprites = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/sprites/manifest.json'), 'utf8'));
assert(!Object.hasOwn(sprites.sprites, 'hero:strategist'),
  'unapproved raster must not override procedural candidate');
console.log('PASS Gate 0 real Ogre anatomical reuse, separate dual-dagger art, deterministic Canvas and four-class isolation');
