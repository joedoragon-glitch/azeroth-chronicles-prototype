'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../../..'),
  out = __dirname;
const { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const R = require(root + '/src/prototype/rules'),
  C = require(root + '/src/prototype/engine');
const sandbox = { PrototypeRules: R, performance: { now: () => 16000 } };
vm.runInNewContext(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'), sandbox);
const V = sandbox.PrototypeVisuals,
  c = createCanvas(1800, 1000),
  q = c.getContext('2d');
const bg = q.createLinearGradient(0, 0, 1800, 1000);
bg.addColorStop(0, '#203d3b');
bg.addColorStop(1, '#11292b');
q.fillStyle = bg;
q.fillRect(0, 0, 1800, 1000);
q.textAlign = 'center';
q.fillStyle = '#f4e6c8';
q.font = 'bold 52px sans-serif';
q.fillText('11 MASCOTAS · HABILIDADES ÚNICAS', 900, 86);
q.font = '23px sans-serif';
q.fillStyle = '#bbd1c3';
q.fillText('Conoce a tus próximos compañeros', 900, 130);
const families = Object.keys(R.petCompanions);
const labels = {
  thorn: 'Control de grupos',
  crypt: 'Curación',
  mire: 'Inundaciones',
  archive: 'Control en línea',
  ridge: 'Golpes contundentes',
  mine: 'Protección',
  warlord: 'Barridos de área',
  abyss: 'Daño explosivo',
  citadel: 'Precisión',
  cindermaw: 'Daño y protección',
  darklord: 'Remate de heridos',
};
families.forEach((f, i) => {
  const row = i < 6 ? 0 : 1,
    col = i < 6 ? i : i - 6,
    n = row ? 5 : 6,
    span = 1650 / n,
    x = 75 + span * (col + 0.5),
    y = row ? 784 : 414;
  q.save();
  q.globalAlpha = 0.24;
  q.fillStyle = '#7b9a76';
  q.beginPath();
  q.ellipse(x, y + 15, 104, 27, 0, 0, Math.PI * 2);
  q.fill();
  q.restore();
  q.save();
  q.translate(x, y);
  q.scale(3.35, 3.35);
  V.draw(
    q,
    { ...new C('normal', 'mage', () => 0.9).unit('pet', 0, 0, f), renderKind: 'ally' },
    { x: 0, y: 0 },
    0,
  );
  q.restore();
  q.font = 'bold 24px sans-serif';
  q.fillStyle = '#f4e6c8';
  q.fillText(R.petCompanions[f].name, x, y + 79);
  q.font = '20px sans-serif';
  q.fillStyle = '#bbd1c3';
  q.fillText(labels[f], x, y + 111);
});
fs.writeFileSync(out + '/mascotas-del-juego.png', c.toBuffer('image/png'));
