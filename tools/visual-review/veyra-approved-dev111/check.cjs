'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  cp = require('child_process'),
  assert = require('node:assert/strict'),
  crypto = require('crypto'),
  { createCanvas } = require('@napi-rs/canvas'),
  sharp = require('sharp');
const root = path.resolve(__dirname, '../../..'),
  R = require(root + '/src/prototype/rules'),
  candidate = require('../veyra-ivory-correction-20261020/candidate.json');
const source = cp.execFileSync('git', ['show', 'a6364ea7b2db5fc8dc03e7eaeab4f931bf0560b6'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(crypto.createHash('sha256').update(source).digest('hex'), candidate.sourceSha256);
const accepted = source
  .replace(
    candidate.originalBranch,
    "        case 'citadel':\n          veyraPreview('B');\n          break;\n",
  )
  .replace('    function mageHead(', candidate.revisedHelper + '\n    function mageHead(')
  .replace(
    '        bossFinish(e.family);\n        bossPolish(e.family);',
    "        if (e.family !== 'citadel') { bossFinish(e.family); bossPolish(e.family); } else bossPolish('veyra-preview');",
  );
function load(s) {
  const box = { PrototypeRules: R };
  vm.runInNewContext(s, box);
  return box.PrototypeVisuals;
}
const expected = load(accepted),
  actual = load(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'));
function draw(v, e, scale) {
  const c = createCanvas(650, 650),
    ctx = c.getContext('2d');
  ctx.translate(325, 430);
  ctx.scale(scale, scale);
  v.draw(ctx, e, { x: 0, y: 0 }, 4);
  return c;
}
let matched = 0;
for (const form of ['normal', 'true'])
  for (const scale of [1, 1.5, 3.8])
    for (const open of [0, 1]) {
      const e = {
        id: 'veyra-correction',
        renderKind: 'enemy',
        type: 'boss',
        family: 'citadel',
        form,
        open,
      };
      const a = draw(actual, e, scale),
        b = draw(expected, e, scale),
        hash = (c) =>
          crypto
            .createHash('sha256')
            .update(Buffer.from(c.getContext('2d').getImageData(0, 0, 650, 650).data))
            .digest('hex');
      if (hash(a) !== hash(b)) {
        fs.writeFileSync(path.join(__dirname, 'actual.png'), a.toBuffer('image/png'));
        fs.writeFileSync(path.join(__dirname, 'expected.png'), b.toBuffer('image/png'));
        throw Error('Approved mismatch ' + form + ' ' + scale + ' ' + open);
      }
      matched++;
    }
(async () => {
  const c = createCanvas(840, 490),
    ctx = c.getContext('2d');
  ctx.fillStyle = '#35434a';
  ctx.fillRect(0, 0, 840, 490);
  for (const [form, x] of [
    ['normal', 210],
    ['true', 630],
  ]) {
    ctx.fillStyle = '#f3ead8';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(form === 'true' ? 'TRUE' : 'Normal', x, 40);
    ctx.save();
    ctx.translate(x, 350);
    ctx.scale(3, 3);
    actual.draw(
      ctx,
      { id: 'veyra-correction', renderKind: 'enemy', type: 'boss', family: 'citadel', form },
      { x: 0, y: 0 },
      4,
    );
    ctx.restore();
  }
  fs.writeFileSync(path.join(__dirname, 'approved-normal-true.png'), c.toBuffer('image/png'));
  const C = require(root + '/src/prototype/engine'),
    Renderer = require(root + '/src/prototype/renderer'),
    FX = require(root + '/src/prototype/combat-visuals'),
    V = require(root + '/src/prototype/visuals');
  const g = new C('developer', 'mage', () => 0.9);
  g.s.zone = 'citadel';
  const z = g.zone();
  g.zone();
  const boss = z.enemies.find((e) => e.family === 'citadel' && e.type === 'boss');
  assert(boss);
  Object.assign(g.hero, g.safe(boss.x - 240, boss.y + 100));
  g.s.clock = 120;
  const native = createCanvas(1250, 900);
  g.zone();
  const before = JSON.stringify(g.s);
  Renderer.create({
    canvas: native,
    ctx: native.getContext('2d'),
    getGame: () => g,
    platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 625, y: 486 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  }).draw();
  assert.equal(JSON.stringify(g.s), before, 'context rendering is state pure');
  await sharp(native.toBuffer('image/png'))
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, 'citadel-native.webp'));
  fs.writeFileSync(
    path.join(__dirname, 'checks.json'),
    JSON.stringify(
      {
        passed: true,
        exactApprovedPixelCases: matched,
        normalAndTrue: true,
        scales: [1, 1.5, 3.8],
        nativeSceneStatePure: true,
        sourceSha256: crypto
          .createHash('sha256')
          .update(fs.readFileSync(root + '/src/prototype/visuals.js'))
          .digest('hex'),
      },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS', matched, 'exact approved Veyra draws; native Citadel/state purity');
})();
