'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const V = require('../src/prototype/enemy-vfx.js');
const P = require('../src/prototype/enemy-presentation.js');
const Art = require('../src/prototype/enemy-vfx-art.js');
const Inventory = require('../scripts/enemy-vfx-inventory.cjs');
const kinds = ['canister', 'formation', 'pattern-charge', 'checkerboard', 'summon'];
const recipes = ['fan', 'command', 'rush', 'seal', 'call'];
const stages = [
  ['windup','release','travel','impact'],
  ['windup','release'],
  ['windup','release','travel','impact'],
  ['windup','release'],
  ['windup','release','spawn']
];
const rows = Inventory.audit().rows;
for (let i = 0; i < 5; i++) {
  const plan = C.rules.attacks.citadel[i];
  assert.equal(plan.kind, kinds[i], 'authoritative Citadel move');
  const a = V.describe({ type: 'boss', family: 'citadel', form: 'normal' }, { ...plan, index: i });
  const b = V.describe({ type: 'boss', family: 'citadel', form: 'true' }, { ...plan, index: i });
  assert.equal(a.id, 'boss/citadel/' + i);
  assert.equal(a.id, b.id, 'normal/TRUE attack ID stable');
  assert.equal(a.presentation?.action, kinds[i], 'shared AV presentation exists');
  assert.equal(Art.recipe(a)?.action, recipes[i], 'procedure-specific effect');
  const row = rows.find(x => x.id === a.id);
  assert(row, 'inventory row exists');
  assert.deepEqual(row.stages, stages[i], 'truthful actual effect stages');
  for (const stage of stages[i]) {
    const event = { skillId: a.id, identity: a, stage, contact: stage === 'impact',
      target: stage === 'spawn' ? 'real-soldier' : undefined };
    assert(P.route(event), 'audio route for ' + a.id + '/' + stage);
  }
  if (kinds[i] === 'formation' || kinds[i] === 'checkerboard')
    assert(!row.stages.includes('impact'), 'non-damaging order/board start has no fictitious hit');
}
console.log('PASS Veyra five stable AV IDs, true forms, truthful stages and procedural recipes');
