'use strict';
// PR #511: exercise the real procedural draw dispatcher, not concept images.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Visuals = require('../src/prototype/visuals.js');
const Sprites = require('../src/prototype/sprites.js');

function traceContext() {
  const events = [];
  const style = { globalAlpha: 1 };
  const ctx = new Proxy({}, {
    set(_target, key, value) {
      style[key] = value;
      events.push(['style', key, value]);
      return true;
    },
    get(_target, key) {
      if (Object.hasOwn(style, key)) return style[key];
      if (key === 'canvas') return { width: 256, height: 256 };
      return (...args) => {
        events.push([key, ...args]);
        if (key === 'measureText') return { width: 0 };
        if (key === 'createLinearGradient' || key === 'createRadialGradient')
          return { addColorStop() {} };
        return undefined;
      };
    },
  });
  return { ctx, events };
}
function draw(heroClass, crowned = false) {
  const e = { id: 'hero-test', renderKind: 'hero', class: heroClass, crowned },
    position = { x: 92, y: 106 },
    before = JSON.stringify({ e, position }),
    { ctx, events } = traceContext();
  assert.doesNotThrow(() => Visuals.draw(ctx, e, position));
  assert.equal(JSON.stringify({ e, position }), before,
    'art must not mutate campaign actor or position');
  assert.equal(events.filter((v) => v[0] === 'save').length,
    events.filter((v) => v[0] === 'restore').length,
    'canvas save/restore ownership remains balanced');
  return events;
}
const colors = (events) => events
  .filter((e) => e[0] === 'style' && e[1] === 'fillStyle').map((e) => e[2]);
const bell = (events) => events.some((e) =>
  e[0] === 'ellipse' && e[1] === 28 && e[2] === -35 &&
  e[3] === 8 && e[4] === 8);
const regular = draw('rogue');
const crowned = draw('rogue', true);
assert.deepEqual(draw('rogue'), regular, 'static normal drawing is deterministic');
assert.deepEqual(draw('rogue', true), crowned, 'static crown drawing is deterministic');
for (const e of [regular, crowned]) {
  assert(bell(e), 'bell has a suspended spherical 8x8 drawing, not a guitar');
  for (const c of ['#986548', '#1b1723', '#ba6e42'])
    assert(colors(e).includes(c), 'Rogue visual identity needs ' + c);
}
assert(colors(regular).includes('#614163'));
assert(colors(regular).includes('#382b4e'));
assert(colors(regular).includes('#d6b16b'));
assert(colors(crowned).includes('#2b2039'));
assert(colors(crowned).includes('#ad79c6'), 'crowned Rogue has her purple jewel');
assert(colors(crowned).includes('#7d3345'), 'crowned Rogue has royal crimson lining');
for (const original of ['paladin', 'mage', 'ranger']) {
  assert(!bell(draw(original)), original + ' must not inherit the Rogue bell');
  assert(!bell(draw(original, true)), original + ' crowned art must stay independent');
}
const keys = Sprites.candidateKeys({ renderKind: 'hero', class: 'rogue' });
assert.deepEqual(keys, ['hero:rogue']);
assert.deepEqual(Sprites.candidateKeys({
  renderKind: 'hero', class: 'rogue', crowned: true,
}), [], 'crowned appearance is always the procedural fallback');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,
  '../assets/sprites/manifest.json'), 'utf8'));
assert(!Object.hasOwn(manifest.sprites, 'hero:rogue'),
  'unapproved raster must not silently replace the reviewed procedural art');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes("en: 'Rogue', es: 'Pícara'"), 'one-word class selection');
assert(!app.includes("rogue: 'Rogue Bard'"), 'no old player-facing class label');
const visuals = fs.readFileSync(path.join(__dirname, '../src/prototype/visuals.js'), 'utf8');
const source = visuals.slice(visuals.indexOf('function rogueBellStaff('),
  visuals.indexOf('function hero(role)'));
assert(!/guitar|lute|stringed|animation clock|requestAnimationFrame/.test(source),
  'this is static bell-staff art, not old instrument or an animation system');
console.log('PASS Rogue/Crowned static procedural art, fallback, original-class isolation and naming');
