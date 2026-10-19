const fs = require('fs'),
  vm = require('vm');
const path = require('path'),
  root = path.resolve(__dirname, '../..');
const C = require(root + '/src/prototype/engine.js');
const { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const c = new C('normal', 'paladin', () => 0.9);
c.enter('frontier');
const enemies = c.zone().enemies;
const cases = [
  ['Orc', enemies.find((e) => e.species === 'orc' && !e.captain && !e.ranged && !e.crownTroop)],
  ['Axe thrower', enemies.find((e) => e.species === 'orc' && e.ranged && !e.crownTroop)],
  ['Orc guardian', { ...enemies.find((e) => e.species === 'orc' && !e.captain), guard: true }],
  [
    'Orc ringleader',
    { ...enemies.find((e) => e.species === 'orc' && !e.captain), form: 'ringleader' },
  ],
  ['Cinder Warlord', enemies.find((e) => e.captainProfile === 'frontier-overseer')],
  ['Ashen Warlord', enemies.find((e) => e.family === 'warlord')],
  ['TRUE Warlord', { ...enemies.find((e) => e.family === 'warlord'), form: 'true' }],
  ['Crown Orc', enemies.find((e) => e.species === 'orc' && e.crownTroop)],
  ['Raider', enemies.find((e) => e.species === 'archer' && !e.guard && !e.crownTroop)],
  ['Raider guardian', enemies.find((e) => e.species === 'archer' && e.guard)],
  [
    'Raider officer',
    { ...enemies.find((e) => e.species === 'archer' && !e.guard), form: 'ringleader' },
  ],
  ['Crown marksman', enemies.find((e) => e.species === 'archer' && e.crownTroop)],
];
const stage = process.argv[2] || 'after';
let V;
if (stage === 'before') {
  const ctx = { PrototypeRules: C.rules, require: () => C.rules };
  vm.createContext(ctx);
  vm.runInContext(
    require('./source-baselines.cjs')(
      process.env.FRONTIER_VISUAL_BASELINE || 'e6ea987aded7b441bdedf51e1fc29b38b1ed2f02',
    ),
    ctx,
  );
  V = ctx.PrototypeVisuals;
} else V = require(root + '/src/prototype/visuals.js');
const out = process.argv[3] || root + '/test-results/frontier-polish';
fs.mkdirSync(out, { recursive: true });
const canvas = createCanvas(1040, 550),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#302c2b';
ctx.fillRect(0, 0, 1040, 550);
ctx.font = '14px sans-serif';
cases.forEach(([label, e], i) => {
  if (!e) throw Error('Missing ' + label);
  let x = 85 + (i % 6) * 173,
    y = 185 + Math.floor(i / 6) * 230;
  ctx.fillStyle = '#54453d';
  ctx.fillRect(x - 82, y - 142, 164, 170);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  V.draw(ctx, { ...e, renderKind: 'enemy' }, { x: 0, y: 0 }, 3);
  ctx.restore();
  ctx.fillStyle = '#ead8bb';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 72);
});
fs.writeFileSync(out + '/' + stage + '-lineage.png', canvas.toBuffer('image/png'));
cases.forEach(([label, e], i) => {
  const solo = createCanvas(288, 288),
    ctx = solo.getContext('2d');
  ctx.scale(1.5, 1.5);
  V.draw(ctx, { ...e, renderKind: 'enemy' }, { x: 96, y: 130 }, 3);
  fs.writeFileSync(out + '/' + stage + '-body-' + i + '.png', solo.toBuffer('image/png'));
});
fs.writeFileSync(out + '/body-cases.json', JSON.stringify(cases, null, 2));
