'use strict';
// Execute the actual label identity and fixed-placement branches from the
// shipping renderer without spinning up a world, changing saves or GPU state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');

function between(startText, endText) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  assert(start >= 0 && end > start, 'missing renderer label contract: ' + startText);
  return source.slice(start, end);
}
const identitySource = between('    function companionWorldLabel(e) {',
  '    function worldLabelVisible(e) {');
const names = new Function('game', 'canvas', 'ctx',
  identitySource + '\nreturn { companionWorldLabel, charmedCompanion, namedCompanion, worldLabelWidth };')(
  { companionDisplayName: e => e.customName || e.name },
  { width: 360 },
  {});
const charm = { renderKind: 'ally', charmOrigin: 'goblin', customName: 'Stinkums' };
const standard = { renderKind: 'ally', customName: 'Stinkums' };
const hostile = { renderKind: 'enemy', name: 'Goblin' };
assert.equal(names.companionWorldLabel(charm), '♫ Stinkums');
assert.equal(names.charmedCompanion(charm), true);
assert.equal(names.charmedCompanion(standard), false);
assert.equal(names.charmedCompanion(hostile), false);
assert.equal(names.namedCompanion(charm), false, 'charmed creatures must not use opaque name panels');
assert.equal(names.namedCompanion(standard), true, 'conventional named allies retain existing panels');
assert(names.worldLabelWidth('♫ Stinkums', charm) <
  names.worldLabelWidth('♫ Stinkums', standard), 'charm nameplate must be compact');

// These branch bodies are taken verbatim from the two production nameplate
// allocators. A collision must not shift a Charmed label in either renderer.
const canvasBranch = between('        if (charmedCompanion(e)) {\n          // A Charmed nickname',
  '        } else for (const dy of [0, -20, -40, -60');
const pixiBranch = between('        if (name && charmedCompanion(e)) {\n          // The nickname',
  '        } else if (name) for (const dy of [0,-20,-40');
const canvasSlot = new Function('e', 'anchor', 'baseY', 'w', 'h', 'canvas',
  'claimedLabels', 'charmedCompanion', 'let slot = null;\n' + canvasBranch +
  '        }\nreturn slot;');
const pixiSlot = new Function('e', 'name', 'p', 'baseY', 'width', 'canvas',
  'claimed', 'charmedCompanion', 'let slot = null;\n' + pixiBranch +
  '        }\nreturn slot;');
const canvas = { width: 360, height: 250 }, w = names.worldLabelWidth('♫ Stinkums', charm);
const blocked = { l: 0, r: 360, t: 0, b: 250 };
function checkAnchored(label, allocate) {
  const clear = [];
  const crowd = [blocked];
  const first = allocate(clear, 130, 104);
  const surrounded = allocate(crowd, 130, 104);
  assert.deepEqual(surrounded, first, label + ' must not jump when another name occupies its anchor');
  assert.equal(first.x, 130);
  assert.equal(first.y, 104);
  assert.equal(clear.length, 1, label + ' should reserve the anchor for later labels');
  const moved = allocate(crowd, 137, 108);
  assert.equal(moved.x, 137);
  assert.equal(moved.y, 108);
  assert.equal(allocate([], 130, 5), null, 'offscreen names hide instead of moving to another lane');
}
checkAnchored('Canvas', (claimed, x, y) =>
  canvasSlot(charm, { x }, y, w, 17, canvas, claimed, names.charmedCompanion));
checkAnchored('Pixi overlay', (claimed, x, y) =>
  pixiSlot(charm, '♫ Stinkums', { x }, y, w, canvas, claimed, names.charmedCompanion));
assert.match(source, /ctx\.font = charmedCompanion\(e\) \? 'bold 10px system-ui' : '10px system-ui'/,
  'Pixi renders compact named allies rather than the old bold 12px panel');
assert.match(source, /ctx\.fillStyle = charmedCompanion\(e\) \? '#99efcf' : '#dcebcf'/,
  'Pixi ally distinction');
assert.match(source, /ctx\.fillStyle = charmedCompanion\(e\)\s*\? '#99efcf'/,
  'Canvas ally distinction');
assert.match(source, /if \(slot && namedCompanion\(e\)\)/,
  'only conventional named companions may get a Canvas background');
console.log('PASS Charmed nickname, stable Canvas/Pixi position, tint, compact style and non-Charm isolation');
