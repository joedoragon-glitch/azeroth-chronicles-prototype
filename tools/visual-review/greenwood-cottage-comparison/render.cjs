'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { createCanvas, Image } = require(root + '/node_modules/@napi-rs/canvas');
class FileImage extends Image {
  set src(value) {
    super.src = typeof value === 'string' ? fs.readFileSync(path.resolve(root, value)) : value;
  }
}
global.Image = FileImage;
const C = require(root + '/src/prototype/engine'),
  S = require(root + '/src/prototype/sprites');
const box = { PrototypeRules: C.rules, performance: { now: () => 16000 } };
vm.runInNewContext(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'), box);
const V = box.PrototypeVisuals;
(async () => {
  const manifest = require(root + '/assets/sprites/manifest.json');
  assert(S.installManifest(manifest));
  await S.warm(['prop:vale-cottage:vale']);
  const g = new C('normal', 'mage', () => 0.9);
  g.enter('vale');
  const prop = g.zone().props.find((e) => e.structure === 'vale-cottage');
  assert(prop);
  const e = { ...prop, renderKind: 'prop' };
  const found = S.definitionFor(e, 0, false);
  assert.equal(found.key, 'prop:vale-cottage:vale');
  e.visualScale = V.assetSafeScale(e, found.entry);
  const state = JSON.stringify(e),
    c = createCanvas(1500, 900),
    q = c.getContext('2d');
  q.fillStyle = '#314b3b';
  q.fillRect(0, 0, c.width, c.height);
  q.textAlign = 'center';
  q.fillStyle = '#f4e6c8';
  q.font = 'bold 34px sans-serif';
  q.fillText('GREENWOOD VALE · COTTAGE', 750, 58);
  q.font = '24px sans-serif';
  q.fillText('PROCEDURAL ACTUAL', 375, 115);
  q.fillText('SPRITE USADO EN EL JUEGO', 1125, 115);
  q.strokeStyle = '#70806a';
  q.beginPath();
  q.moveTo(750, 140);
  q.lineTo(750, 830);
  q.stroke();
  for (const [x, mode] of [
    [375, 'procedural'],
    [1125, 'sprite'],
  ]) {
    q.save();
    q.translate(x, 480);
    q.scale(4, 4);
    if (mode === 'sprite') assert(S.draw(q, e, { x: 0, y: 0 }, 0, false));
    else V.draw(q, e, { x: 0, y: 0 }, 0, false);
    q.restore();
    q.save();
    q.translate(x, 755);
    q.scale(1.5, 1.5);
    if (mode === 'sprite') assert(S.draw(q, e, { x: 0, y: 0 }, 0, false));
    else V.draw(q, e, { x: 0, y: 0 }, 0, false);
    q.restore();
  }
  q.font = '19px sans-serif';
  q.fillStyle = '#c4d1ba';
  q.fillText('Arriba: mismo aumento para comparar detalles · Abajo: cámara al 150%', 750, 856);
  assert.equal(JSON.stringify(e), state);
  fs.writeFileSync(__dirname + '/comparacion-casas.png', c.toBuffer('image/png'));
  fs.writeFileSync(
    __dirname + '/evidence.json',
    JSON.stringify(
      {
        entity: e,
        region: 0,
        registeredKey: found.key,
        entry: found.entry,
        proceduralSourceSha256: crypto
          .createHash('sha256')
          .update(fs.readFileSync(root + '/src/prototype/visuals.js'))
          .digest('hex'),
        sameCameraScale: true,
        renderStatePure: true,
        gameplayChanges: false,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Rendered exact procedural and registered cottage at 4x and 150%; state pure.');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
