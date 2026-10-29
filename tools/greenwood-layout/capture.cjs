'use strict';
// Real production Canvas renderer on a native software Canvas. No browser HUD,
// registered bitmap/material loading, physical device, or GPU claim.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas'),
  sharp = require('sharp');
const { rng, candidate } = require('./fixtures.cjs');
const revised = process.argv.includes('--revised');
const out = path.resolve(
  __dirname,
  '../../docs/evidence/' + (revised ? 'greenwood-revised-20261028' : 'greenwood-gva-20261028'),
);
fs.mkdirSync(out, { recursive: true });
if (!process.argv.includes('--size')) {
  for (const size of [2700, 3200, 3400])
    cp.execFileSync(process.execPath, [__filename, '--size', String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]);
const C = require('./fixtures.cjs').loadRuntime(size, revised),
  V = require('../../src/prototype/visuals'),
  FX = require('../../src/prototype/combat-visuals'),
  Renderer = require('../../src/prototype/renderer');
const plan = revised
    ? (() => {
        const G = require('../../src/prototype/greenwood');
        // Tables already configured by loadRuntime before native installation.
        G.install(C, { D: C.data, R: C.rules });
        return { proposal: 'revised reserved-parcel comparison' };
      })()
    : candidate(C, size),
  g = new C('normal', 'paladin', rng(0x47564101));
for (let j = 0; j < 120; j++) g.tick(0.1);
const z = g.zone(),
  by = (id) => z.npcs.find((n) => n.id === id),
  p = (id) => by(id).servicePoint || by(id);
const scenes = [
  ['start', { x: 300, y: 350 }],
  ['refuge', p('rest')],
  ['hamlet', p('minor')],
  ['orchard', p('orchard')],
  ['mill', p('mill-pond')],
  ['north-bridge', p('bridge-north')],
  ['south-bridge', p('bridge-south')],
  ['eastern-pond', C.rules.terrain[0][1]],
  ['cache', p('cache')],
  ['treasury', p('supply-entrance')],
  ['crypt', p('entrance')],
  ['old-cellars', p('den-ruins')],
  ['thorn-den', g.fieldCenter(0)],
  ['goblin-camp', p('goblin-camp')],
  [
    'skeleton-watch',
    {
      x: C.rules.creatureStrongholds.find((h) => h.id === 'skeleton-watch').center[0],
      y: C.rules.creatureStrongholds.find((h) => h.id === 'skeleton-watch').center[1],
    },
  ],
];
const receipts = [],
  images = [];
async function capture(name, target, width, height, clock) {
  const hero = { ...g.hero },
    oldClock = g.s.clock,
    actual = g.safe(target.x, target.y);
  Object.assign(g.hero, actual);
  g.s.clock = clock;
  g.updateNight();
  const before = JSON.stringify(g.snapshot()),
    canvas = createCanvas(width, height),
    ctx = canvas.getContext('2d');
  const renderer = Renderer.create({
    canvas,
    ctx,
    getGame: () => g,
    platform: { cameraZoom: 1.5, cameraAnchor: (w, h) => ({ x: w * 0.5, y: h * 0.58 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  });
  const times = [];
  for (let j = 0; j < 6; j++) {
    const t = performance.now();
    renderer.draw();
    times.push(performance.now() - t);
  }
  assert.equal(
    JSON.stringify(g.snapshot()),
    before,
    'production rendering must not change saved campaign state',
  );
  const file = `native-${size}-${name}-${width}x${height}-${clock === 120 ? 'day' : 'night'}.webp`;
  await sharp(canvas.toBuffer('image/png')).webp({ quality: 86 }).toFile(path.join(out, file));
  receipts.push({
    file,
    size,
    seed: 0x47564101,
    cameraZoom: 1.5,
    width,
    height,
    dpr: 1,
    clock,
    requestedScene: { x: target.x, y: target.y },
    actualHero: actual,
    layer:
      'production Canvas renderer with procedural fallback; native @napi-rs/canvas; actors retained, simulation frozen during capture; NO shell/browser/bitmap/material/device acceptance',
    drawCpuMs: times.map((x) => Math.round(x * 100) / 100),
    stateUnchanged: true,
  });
  if (width === 1280) images.push(file);
  Object.assign(g.hero, hero);
  g.s.clock = oldClock;
  g.updateNight();
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, target] of scenes) await capture(name, target, 1280, 800, 120);
  for (const [name, target] of scenes.filter(([name]) =>
    ['start', 'hamlet', 'orchard', 'mill', 'north-bridge', 'crypt'].includes(name),
  )) {
    await capture(name, target, 393, 852, 120);
    await capture(name, target, 852, 393, 500);
  }
  // Annotated coordinate overview is a diagnostic, never represented as native scene evidence.
  const canvas = createCanvas(1000, 1100),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3f0e7';
  ctx.fillRect(0, 0, 1000, 1100);
  ctx.fillStyle = '#192f28';
  ctx.font = 'bold 23px sans-serif';
  ctx.fillText(`${size} candidate — coordinate diagnostic`, 35, 35);
  ctx.font = '14px sans-serif';
  ctx.fillText(
    'Actual generated objects; top-down diagram, not a game screenshot. Native captures separate.',
    35,
    62,
  );
  const scale = 900 / size,
    pt = (p) => ({ x: 50 + p.x * scale, y: 110 + p.y * scale });
  ctx.strokeStyle = '#737e68';
  ctx.strokeRect(50, 110, 900, 900);
  for (let y = 0; y <= size; y += 20) {
    const [a, b] = C.rules.channelBanks(0, y),
      p = pt({ x: a, y });
    ctx.fillStyle = '#5a93a7';
    ctx.fillRect(p.x, p.y, (b - a) * scale, 21 * scale);
  }
  for (const w of C.rules.terrain[0]) {
    const p = pt(w);
    ctx.beginPath();
    ctx.arc(p.x, p.y, w.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const road of z.roads) {
    ctx.strokeStyle = '#ad815c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const [j, p] of road.entries()) {
      const q = pt(p);
      j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    }
    ctx.stroke();
  }
  for (const p of z.props) {
    const q = pt(p);
    ctx.fillStyle = p.roadBlocker
      ? '#875c38'
      : /tree|forest|sapling/.test(p.structure || p.id)
        ? '#3b6949'
        : '#aaa366';
    ctx.beginPath();
    ctx.arc(q.x, q.y, p.roadBlocker ? 5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of z.enemies.filter((e) => e.hp > 0)) {
    const p = pt(e.home || e);
    ctx.fillStyle = '#a54b4b';
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  for (const n of z.npcs.filter((n) => !/^thorn-trail|mini-field|thorn-local/.test(n.id))) {
    const p = pt(n);
    ctx.fillStyle = '#28344c';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px sans-serif';
    ctx.fillText(n.id, p.x + 6, p.y - 5);
  }
  ctx.font = '14px sans-serif';
  ctx.fillText(
    'Brown: structural props / green: nature / ochre: life / red: living enemy homes',
    50,
    1050,
  );
  await sharp(canvas.toBuffer('image/png'))
    .webp({ quality: 86 })
    .toFile(path.join(out, `overview-${size}.webp`));
  // Review thumbnails retain captions and links to complete readable source images.
  // Keep composition indexing independent of the two overlay entries per scene.
  const composite = [];
  for (let i = 0; i < images.length; i++) {
    composite.push({
      input: await sharp(path.join(out, images[i])).resize(400, 250).png().toBuffer(),
      left: (i % 3) * 400,
      top: Math.floor(i / 3) * 282 + 32,
    });
    composite.push({
      input: Buffer.from(
        `<svg width="400" height="32"><rect width="400" height="32" fill="#f3f0e7"/><text x="8" y="21" font-size="14" fill="#192f28">${images[i].replace(`native-${size}-`, '').replace('-1280x800-day.webp', '')}</text></svg>`,
      ),
      left: (i % 3) * 400,
      top: Math.floor(i / 3) * 282,
    });
  }
  await sharp({
    create: {
      width: 1200,
      height: Math.ceil(images.length / 3) * 282,
      channels: 4,
      background: '#f3f0e7',
    },
  })
    .composite(composite)
    .webp({ quality: 86 })
    .toFile(path.join(out, `native-contact-${size}.webp`));
  fs.writeFileSync(
    path.join(out, `captures-${size}.json`),
    JSON.stringify(
      {
        sourceSha: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        size,
        sources: Object.fromEntries(
          ['engine', 'greenwood', 'data', 'rules', 'world', 'save', 'visuals', 'renderer'].map(
            (f) => [
              f,
              require('node:crypto')
                .createHash('sha256')
                .update(fs.readFileSync(path.join(__dirname, '../../src/prototype/' + f + '.js')))
                .digest('hex'),
            ],
          ),
        ),
        receipts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Captured', size, receipts.length, 'native scenes + diagnostic overview');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
