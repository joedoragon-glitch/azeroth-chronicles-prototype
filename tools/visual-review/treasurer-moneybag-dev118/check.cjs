'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  R = require(root + '/src/prototype/rules');
const { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const baseline = '3c0a2b13ce6fa48981d99158623012bea35252c1';
const localBaseline =
  cp.spawnSync('git', ['cat-file', '-e', baseline], { cwd: root }).status === 0
    ? baseline
    : 'e906e98';
const oldSource = cp.execFileSync('git', ['show', localBaseline + ':src/prototype/visuals.js'], {
    cwd: root,
    encoding: 'utf8',
  }),
  source = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
function load(s) {
  const b = { PrototypeRules: R, performance: { now: () => 16000 } };
  vm.runInNewContext(s, b);
  return b.PrototypeVisuals;
}
const before = load(oldSource),
  after = load(source);
const pet = (f) => ({ id: 'pet-' + f, renderKind: 'ally', type: 'pet', petFamily: f });
const boss = (f, form = 'normal') => ({
  id: 'boss-' + f,
  renderKind: 'enemy',
  type: 'boss',
  family: f,
  form,
});
function render(v, e, scale) {
  const c = createCanvas(650, 650),
    q = c.getContext('2d');
  q.translate(325, 400);
  q.scale(scale, scale);
  const state = JSON.stringify(e);
  v.draw(q, e, { x: 0, y: 0 }, 4);
  assert.equal(JSON.stringify(e), state);
  return Buffer.from(q.getImageData(0, 0, 650, 650).data);
}
let unchanged = 0,
  changed = 0;
const differences = [];
for (const family of Object.keys(R.petCompanions))
  for (const e of [pet(family), boss(family), boss(family, 'true')])
    for (const scale of [1, 1.5, 3.8]) {
      const a = render(before, e, scale),
        b = render(after, e, scale);
      if (family === 'ridge') {
        assert.notDeepEqual(a, b);
        let x1 = 650,
          y1 = 650,
          x2 = 0,
          y2 = 0;
        for (let i = 0; i < a.length; i += 4)
          if (!a.subarray(i, i + 4).equals(b.subarray(i, i + 4))) {
            const x = (i / 4) % 650,
              y = Math.floor(i / 4 / 650);
            x1 = Math.min(x1, x);
            x2 = Math.max(x2, x);
            y1 = Math.min(y1, y);
            y2 = Math.max(y2, y);
          }
        assert(x2 < 325, 'only existing left hand region changes');
        assert(y1 > 400 - scale * 14, 'changes remain below the head and upper torso');
        assert(x2 - x1 < scale * 35 && y2 - y1 < scale * 30, 'bounded held-item correction');
        differences.push({
          type: e.type,
          form: e.form || 'pet',
          scale,
          bounds: { x1, y1, x2, y2 },
        });
        changed++;
      } else {
        assert.deepEqual(a, b);
        unchanged++;
      }
    }
const extract = (s, start, end) => s.slice(s.indexOf(start), s.indexOf(end, s.indexOf(start)));
assert.equal(
  extract(source, '    function mountainBody()', '    function spectralScholar()').replace(
    '      craftAt(-23, -1, 1, treasuryMoneyBag);\n',
    '',
  ),
  extract(oldSource, '    function mountainBody()', '    function spectralScholar()'),
);
assert.equal(
  extract(source, '    function treasuryHammer()', '    function governorAxe('),
  extract(oldSource, '    function treasuryHammer()', '    function governorAxe('),
);
assert.equal(
  extract(source, '      const [cloth, skinColor] = colors;', "      if (family === 'crypt')"),
  extract(oldSource, '      const [cloth, skinColor] = colors;', "      if (family === 'crypt')"),
);
const c = createCanvas(1100, 790),
  q = c.getContext('2d');
q.fillStyle = '#223b35';
q.fillRect(0, 0, c.width, c.height);
q.textAlign = 'center';
q.fillStyle = '#eee5cf';
q.font = 'bold 27px sans-serif';
q.fillText('TREASURER · SILVER CROWN MONEY BAG', 550, 43);
q.font = '20px sans-serif';
q.fillText('BEFORE', 290, 82);
q.fillText('MONEY BAG', 810, 82);
for (const [row, e, label] of [
  [0, boss('ridge'), 'Treasurer boss'],
  [1, pet('ridge'), 'Little Treasurer'],
]) {
  const y = row === 0 ? 335 : 650;
  for (const [v, x] of [
    [before, 290],
    [after, 810],
  ]) {
    q.save();
    q.translate(x, y);
    q.scale(3.3, 3.3);
    v.draw(q, e, { x: 0, y: 0 }, 4);
    q.restore();
  }
  q.fillStyle = '#eee5cf';
  q.font = '19px sans-serif';
  q.fillText(label, 550, y + 67);
}
fs.writeFileSync(__dirname + '/comparison.png', c.toBuffer('image/png'));
const result = {
  baseline,
  changedTreasurerCases: changed,
  unchangedOtherPetAndBossCases: unchanged,
  onlyLeftHandItemChanged: true,
  bossArmBodyAndHammerSourceUnchanged: true,
  sharedPetBodyArmsUnchanged: true,
  statePure: true,
  sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  differences,
};
fs.writeFileSync(__dirname + '/audit.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, differences: undefined }));
