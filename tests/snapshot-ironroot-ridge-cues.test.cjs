'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/combat-visuals.js');

const ridge = C.data.bosses.find((boss) => boss.id === 'ridge');
assert(ridge.attacks[1].includes('moving cargo'));
assert(ridge.attacks[1].includes('lane'));
assert(C.rules.attacks.ridge[1].cargo, 'Rolling Cargo remains a physical projectile');
assert.equal(C.rules.attacks.ridge[1].warning, 1.5);

function renderWarning(ledgerOpen, rogueMove = false) {
  const operations = [];
  const ctx = new Proxy({
    canvas: { width: 1200, height: 720 },
    getTransform: () => ({ a: 1 }),
    measureText: (value) => ({ width: String(value).length * 7 }),
  }, {
    get: (o, key) => key in o ? o[key] : (...args) => operations.push({ key, args }),
    set: (o, key, value) => { o[key] = value; return true; },
  });
  const e = {
    family: 'ridge', type: 'boss', hp: 2400, ledgerOpen, x: 550, y: 430,
    telegraph: {
      name: rogueMove ? 'Stone Feint' : 'Rolling Cargo',
      kind: 'line', timer: 0.6, total: 1.5, index: 1,
      angle: 0, x: 700, y: 430, fromX: 550, fromY: 430,
      radius: 90, rogueMove,
    },
  };
  const zone = { props: [], enemies: [e] },
    game = {
      traps: () => [],
      zone: () => zone,
      s: { time: 0, hazards: [], projectiles: [] },
      attackPatches: () => [],
    };
  Visuals.ground(ctx, (point) => point, game, 'cue', 0);
  return operations;
}

for (const rogue of [false, true]) {
  const open = renderWarning(true, rogue);
  assert(open.some((op) => op.key === 'fillText' && op.args[0] === 'LEDGER CAST'),
    'visible actor-attached preparation while the Ledger is open');
  assert(open.some((op) => op.key === 'strokeRect'),
    'high-contrast readable timer bar exists even for rogue attacks');
  assert(!open.some((op) => op.key === 'lineTo'),
    'Ledger open must still suppress only the ground-footprint shape');
}
const closed = renderWarning(false);
assert(!closed.some((op) => op.key === 'fillText' && op.args[0] === 'LEDGER CAST'));
assert(closed.some((op) => op.key === 'lineTo'),
  'normal warning ground geometry returns when Ledger is closed');

console.log('PASS Ridge moving Cargo text, on-actor normal/rogue Ledger cast and hidden-only-ground cues');
