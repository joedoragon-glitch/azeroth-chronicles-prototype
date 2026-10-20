'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { createCanvas } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../../..'),
  R = require(root + '/src/prototype/rules');
const baseline = 'b2cc002f9883a93758ab1a747a87f87d44e2cc62';
const oldSource = cp.execFileSync('git', ['show', baseline + ':src/prototype/visuals.js'], {
  cwd: root,
  encoding: 'utf8',
});
const newSource = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
function load(s) {
  const b = { PrototypeRules: R, performance: { now: () => 16000 } };
  vm.runInNewContext(s, b);
  return b.PrototypeVisuals;
}
const before = load(oldSource),
  after = load(newSource);
function render(v, e, scale = 3) {
  const c = createCanvas(700, 700),
    q = c.getContext('2d');
  q.translate(350, 450);
  q.scale(scale, scale);
  const state = JSON.stringify(e);
  v.draw(q, e, { x: 0, y: 0 }, 4);
  assert.equal(JSON.stringify(e), state);
  return Buffer.from(q.getImageData(0, 0, 700, 700).data);
}
const changed = new Set(['citadel', 'ridge', 'warlord']);
let unchangedCases = 0,
  changedCases = 0;
for (const family of Object.keys(R.petCompanions))
  for (const scale of [1, 1.5, 3.8]) {
    const e = { id: 'pet-' + family, renderKind: 'ally', type: 'pet', petFamily: family };
    if (changed.has(family)) {
      assert.notDeepEqual(render(before, e, scale), render(after, e, scale));
      changedCases++;
    } else {
      assert.deepEqual(render(after, e, scale), render(before, e, scale));
      unchangedCases++;
    }
  }
for (const family of Object.keys(R.petCompanions))
  for (const form of ['normal', 'true'])
    for (const scale of [1, 1.5, 3.8]) {
      const e = { id: 'boss-' + family, renderKind: 'enemy', type: 'boss', family, form };
      assert.deepEqual(render(after, e, scale), render(before, e, scale));
      unchangedCases++;
    }
// Treasurer/Cadet body, face and arm commands before the weapon are untouched.
const body = (s) =>
  s.slice(
    s.indexOf('      const [cloth, skinColor] = colors;'),
    s.indexOf("      if (family === 'crypt')", s.indexOf('    function craftedPet')),
  );
assert.equal(body(newSource), body(oldSource));
const branch = (s, f, next) =>
  s.slice(
    s.indexOf("      } else if (family === '" + f + "')", s.indexOf('    function craftedPet')),
    s.indexOf(
      next,
      s.indexOf("      } else if (family === '" + f + "')", s.indexOf('    function craftedPet')),
    ),
  );
for (const f of ['ridge', 'warlord']) {
  const needle = '        grip(19, -1, skinColor);';
  assert.equal(branch(newSource, f, needle).includes('humanoid('), false);
}
const c = createCanvas(1500, 980),
  q = c.getContext('2d');
q.fillStyle = '#203936';
q.fillRect(0, 0, c.width, c.height);
q.textAlign = 'center';
q.fillStyle = '#f4e6c8';
q.font = 'bold 32px sans-serif';
q.fillText('LITTLE MARSHAL · FIDELIDAD A VEYRA', 750, 49);
function cell(v, e, x, y, scale, title) {
  q.save();
  q.translate(x, y);
  q.scale(scale, scale);
  v.draw(q, e, { x: 0, y: 0 }, 4);
  q.restore();
  q.fillStyle = '#f4e6c8';
  q.font = '22px sans-serif';
  q.fillText(title, x, y + 110);
}
const pet = (f) => ({ id: 'preview-' + f, renderKind: 'ally', type: 'pet', petFamily: f });
cell(
  after,
  { id: 'reference', renderKind: 'enemy', type: 'boss', family: 'citadel', form: 'normal' },
  260,
  340,
  3.4,
  'Veyra actual · referencia',
);
cell(before, pet('citadel'), 750, 340, 4.7, 'Little Marshal · antes');
cell(after, pet('citadel'), 1240, 340, 4.7, 'Little Marshal · corregida');
q.strokeStyle = '#526863';
q.beginPath();
q.moveTo(50, 475);
q.lineTo(1450, 475);
q.stroke();
q.fillStyle = '#f4e6c8';
q.font = 'bold 28px sans-serif';
q.fillText('ARMAS DE LOS JEFES · MISMOS BRAZOS Y POSTURAS', 750, 534);
for (const [v, f, x, label] of [
  [before, 'ridge', 210, 'Treasurer · antes'],
  [after, 'ridge', 570, 'Treasurer · corregido'],
  [before, 'warlord', 930, 'Cadet · antes'],
  [after, 'warlord', 1290, 'Cadet · corregido'],
])
  cell(v, pet(f), x, 805, 4.5, label);
fs.writeFileSync(__dirname + '/comparacion.png', c.toBuffer('image/png'));
const checks = {
  baseline,
  unchangedPixelCases: unchangedCases,
  changedPetCases: changedCases,
  allRenderStatesPure: true,
  sharedArmsAndBodyUnchanged: true,
  sourceSha256: crypto.createHash('sha256').update(newSource).digest('hex'),
};
fs.writeFileSync(__dirname + '/checks.json', JSON.stringify(checks, null, 2) + '\n');
console.log(checks);
