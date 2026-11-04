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
  "const hide = '#b2a684'",
  "const tunic = '#635747', trousers = '#555044'",
  "ctx.moveTo(13, -31)",  // separate cape behind body
  "ctx.moveTo(-18, -7)",  // anatomically separate near trouser
  "ctx.moveTo(0, -8)",  // far trouser, independent hem
  "ctx.moveTo(-25, 29)",  // near boot
  "ctx.moveTo(8, 33)",  // far boot
  "ctx.moveTo(-20, -30)",  // closed chest tunic
  "ctx.moveTo(-20, -29)",  // attached near shoulder/arm
  "ctx.moveTo(11, -29)",  // far shoulder/arm
  "ctx.moveTo(-16, -44)",  // preserved Ogre face
  "ctx.moveTo(4, -55)",  // curved bound-hair knot
]) assert(art.includes(part), 'missing independently authored anatomy: ' + part);
assert(!art.includes('ctx.scale(0.88, 0.88)'), 'avoid face-only size tricks breaking joined neck silhouette');
// Explicit editorial intent: real hair coil and continuous garment owners.
assert(art.includes('ctx.bezierCurveTo(0, -65, 12, -65, 13, -59)'),
  'historical tied coil must be organic hair, not a stick or flag');
assert(!art.includes('ctx.moveTo(-7, -55)') && !art.includes("poly([[9, -57]"),
  'old hat-and-banner silhouette must not return');
assert(art.includes('ctx.moveTo(12, -30)') && art.includes('ctx.lineTo(27, -14)'),
  'far shoulder must be dressed in joined tunic sleeve, not a bare round mass');
assert(art.includes("[-11, 4]], '#332c28', 4.6"),
  'joined harness must be a restrained cross-body strap, not a wide unrelated sash');
assert(art.includes('ctx.moveTo(-22, -1)') && art.includes('ctx.lineTo(18, 6)'),
  'belt must wrap the full waist');
assert(art.includes('ctx.quadraticCurveTo(-20, 43, -34, 41)') &&
  art.includes('ctx.quadraticCurveTo(3, 47, -8, 43)'),
  'both boot toes point left in the same three-quarter stance');
assert(art.includes('ctx.quadraticCurveTo(14, 32, 20, 34)') &&
  art.includes('ctx.lineTo(6, 36)'),
  'right shin must meet a tapered ankle and joined boot, not float over its shoe');

for (const c of ['#b2a684', '#8b8063', '#c8bb96'])
  assert(paints(hero).includes(c) && paints(enemy).includes(c),
    'Strategist must inherit existing Ogre hide/anatomical palette: ' + c);
for (const c of ['#679c9a', '#be8c5b', '#70583e'])
  assert(paints(hero).includes(c), 'Hero needs restrained material-kit identity: ' + c);
assert(!paints(enemy).includes('#679c9a'), 'Enemy Ogre stays unchanged');
// New direction must read from major forms, not the previous copied body.
for (const swatch of ['#394c42', '#35332e', '#46574b', '#635747', '#555044', '#acbab8'])
  assert(paints(hero).includes(swatch), 'New silhouette/face/equipment color absent: ' + swatch);
for (const swatch of ['#394c42', '#35332e', '#46574b'])
  assert(!paints(enemy).includes(swatch), 'Original Ogre inherited Strategist outfit: ' + swatch);
const contour = (t) => t.filter((x) =>
  ['moveTo', 'bezierCurveTo', 'quadraticCurveTo', 'lineTo'].includes(x[0]));
assert.notDeepEqual(contour(hero), contour(enemy),
  'Strategist must have independently drawn anatomy and silhouette');
assert(contour(hero).length > contour(enemy).length,
  'new hero owns more facial and costume geometry than a stock Ogre');
// Regress the reported defect: hands must grasp the weapons, not have
// exposed long sticks, detached blades, or an off-hand crossing the shin.
const daggerOwner = art.slice(art.indexOf('function carriedDagger('),
  art.indexOf('if (crowned) {'));
assert(daggerOwner.includes('const gripEnd = p(4.8), pommel = p(-4.4)'),
  'the entire dagger hilt must be a bounded, hand-sized grip');
assert(daggerOwner.includes('poly([p(5.3, -2.1), p(7.8, -2.6)'),
  'blade heel must share its centerline with the guard and hilt');
assert(daggerOwner.includes('line([p(4.9, -4.1), p(4.9, 4.1)]'),
  'guard must join the real metal heel with no floating gap');
assert(daggerOwner.indexOf('line([p(4.9, -4.1)') <
  daggerOwner.indexOf('poly([p(-4.2, -2.8)'),
  'fist must paint over the dagger grip instead of behind a protruding stick');
assert(daggerOwner.includes('carriedDagger(-30, 9, -0.65, -0.76, 16, hide)'),
  'near fist must grasp an up-left dagger from its actual wrist');
assert(daggerOwner.includes('carriedDagger(29, 8, 0.76, 0.65, 15, shadow)'),
  'off-hand must grip a short reverse dagger clear of the shin');
assert(art.includes('ctx.lineTo(31, 5)') && art.includes('ctx.quadraticCurveTo(32, 11, 26, 12)'),
  'right forearm must connect into the new hand pivot');
const heroOps = trace({ renderKind: 'hero', class: 'strategist' });
assert(heroOps.filter((x) => x[0] === 'fillStyle' && x[1] === '#acbab8').length === 2,
  'native artist must paint exactly two clearly attached steel blades');
assert(trace({ renderKind: 'hero', class: 'strategist' }).some((x) =>
  x[0] === 'translate' && x[1] === 0 && x[2] === -19),
  'existing native Canvas painter must see the entire left-facing character');

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
console.log('PASS Gate 0 Ogre short wrapped dagger grips, connected blades, wrist continuity and ankle/boot alignment; Canvas/public class isolation');
