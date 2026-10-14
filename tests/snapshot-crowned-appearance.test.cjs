'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Sprites = require('../src/prototype/sprites.js');
for (const role of Object.keys(C.classes)) {
  assert.deepEqual(Sprites.candidateKeys({ renderKind: 'hero', class: role }),
    ['hero:' + role], 'uncrowned base sprite remains unchanged');
  assert.deepEqual(Sprites.candidateKeys({ renderKind: 'hero', class: role, crowned: true }),
    [], 'crowned procedural class outfit overrides all ordinary sprite assets');
}
const c = new C();
assert.equal(c.s.throneClaimed, false);
assert.equal(C.restore(c.snapshot()).s.throneClaimed, false);
console.log('PASS all three crowned procedural presentation overrides and ordinary hero sprite preservation');