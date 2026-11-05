'use strict';
// Bounded native (software-Canvas) visual evidence for PR #814. Real world
// generator/renderer, 150% camera, no gameplay mutations. Not a browser,
// WebGL or iPhone acceptance test.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict'),
  sharp = require('sharp'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../../src/prototype/engine'),
  V = require('../../src/prototype/visuals'),
  FX = require('../../src/prototype/combat-visuals'),
  Renderer = require('../../src/prototype/renderer'),
  { rng } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..'),
  out = path.join(root, 'test-artifacts/greenwood-mill-river'),
  g = new C('normal', 'paladin', rng(0x47564101)),
  cfg = C.rules.greenwoodLayout,
  receipts = [];
fs.mkdirSync(out, { recursive: true });
// The bridge camera follows the actual configured crossing after geometry
// adjustments; historical hard-coded coordinates would miss later repairs.
const bridge = {
  x: (cfg.millBridge.from.x + cfg.millBridge.to.x) / 2,
  y: (cfg.millBridge.from.y + cfg.millBridge.to.y) / 2,
};
const culvert = {
  x: (cfg.creekCulvert.from.x + cfg.creekCulvert.to.x) / 2,
  y: (cfg.creekCulvert.from.y + cfg.creekCulvert.to.y) / 2,
};
const views = [
  ['mill-day', cfg.mill, 120],
  ['mill-night', cfg.mill, 500],
  ['race-bridge-day', bridge, 120],
  ['race-bridge-night', bridge, 500],
  ['headwater-culvert-day', culvert, 120],
  ['mill-entrance-day', cfg.millEntrance, 120],
  ['mill-entrance-night', cfg.millEntrance, 500],
];
// Sample screen center, not the label and browser frame; this catches a
// duplicate/blank night or a camera missing the natural district altogether.
function centerLuma(ctx) {
  const { width, height } = ctx.canvas,
    { data } = ctx.getImageData(0, 0, width, height);
  let sum = 0, n = 0, variation = 0, previous = -1;
  for (let y = Math.floor(height * .24); y < height * .79; y += 13)
    for (let x = Math.floor(width * .22); x < width * .79; x += 13) {
      const idx = (y * width + x) * 4;
      const luma = (data[idx] * .2126 + data[idx+1] * .7152 + data[idx+2] * .0722);
      sum += luma;
      if (previous >= 0 && Math.abs(luma - previous) >= 7) variation++;
      previous = luma;
      n++;
    }
  return { mean: Math.round(sum / Math.max(1,n)*100)/100, variations: variation, count:n };
}
for (const [name, target, clock] of views) {
  const originalHero = { x: g.hero.x, y: g.hero.y },
    originalClock = g.s.clock,
    // Frame the entire mill roof at actual 150% camera scale.
    cameraTarget = g.safe(target.x - 65, target.y - 55, 'vale'),
    canvas = createCanvas(852, 393),
    ctx = canvas.getContext('2d');
  Object.assign(g.hero, cameraTarget);
  g.s.clock = clock;
  g.updateNight();
  const before = JSON.stringify(g.snapshot()),
    renderer = Renderer.create({
      canvas,
      ctx,
      getGame: () => g,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: (w, h) => ({ x: w * 0.5, y: h * 0.58 }),
      },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    }),
    t0 = performance.now();
  renderer.draw();
  renderer.draw();
  const drawMs = Math.round((performance.now()-t0)*100)/100;
  const after = JSON.stringify(g.snapshot());
  const snapshotUnchanged = before === after;
  // Preserve the actual images even on a failing render, so an engineer can
  // inspect the scene while the save-mutation defect remains a hard blocker.
  const beforeState = JSON.parse(before), afterState = JSON.parse(after);
  const changedFields = snapshotUnchanged ? [] :
    Object.keys(afterState).filter((key) =>
      JSON.stringify(beforeState[key]) !== JSON.stringify(afterState[key]));
  const metrics = centerLuma(ctx),
    bytes = canvas.toBuffer('image/png');
  if (bytes.length < 1024 || metrics.variations < 15)
    throw Error(name + ': empty or visually uniform central scene (' +
      JSON.stringify(metrics) + ')');
  const file = name+'.png';
  fs.writeFileSync(path.join(out, file), bytes);
  receipts.push({
    file, name, clock, width:852, height:393, zoom:1.5,
    hero: cameraTarget, drawMs,
    centerLuma: metrics,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sourceSha:process.env.GITHUB_SHA || null,
    rendering:'native software Canvas with procedural fallback; not Pixi/real-device acceptance',
    snapshotUnchanged, changedFields,
  });
  Object.assign(g.hero, originalHero);
  g.s.clock = originalClock;
  g.updateNight();
}
for (const place of ['mill','race-bridge','mill-entrance']) {
  const day=receipts.find((r)=>r.name===place+'-day'),
    night=receipts.find((r)=>r.name===place+'-night');
  assert(day && night);
  assert.notEqual(day.sha256,night.sha256,place+' day/night must render differently');
  assert(day.centerLuma.mean > night.centerLuma.mean + 5,
    place+' night scene must be meaningfully darker than day');
}
const report = {
  status:'native-software-Canvas generated; human visual inspection and Pixi parity still required',
  views:receipts,
};
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(report,null,2)+'\n');
// One review sheet makes foreground, scene overlap, water seams, decking
// and practical night light easy to inspect together after the artifact runs.
(async () => {
  const columns=2, width=852, height=393, label=32,
    rows=Math.ceil(receipts.length/columns), panels=[];
  for (const [i,r] of receipts.entries()) {
    const left=(i%columns)*width, top=Math.floor(i/columns)*(height+label);
    panels.push({ input: fs.readFileSync(path.join(out,r.file)), left, top:top+label });
    panels.push({
      input: Buffer.from('<svg width="852" height="32">'+
        '<rect width="852" height="32" fill="#e8e2d3"/>'+
        '<text x="13" y="22" font-family="sans-serif" font-size="16" fill="#27342e">'+
        r.name+' — 150% native Canvas, '+r.clock+'s</text></svg>'),
      left, top,
    });
  }
  await sharp({create:{width:columns*width,height:rows*(height+label),channels:4,
    background:'#e8e2d3'}})
    .composite(panels)
    .png().toFile(path.join(out,'watermill-day-night-contact-sheet.png'));
  const changed = receipts.filter((view) => !view.snapshotUnchanged);
  if (changed.length)
    throw Error('Render changed saved campaign in '+JSON.stringify(changed.map((v)=>({
      name:v.name,changedFields:v.changedFields,
    }))));
  console.log('PASS 7 focused Greenwood watermill 150% native frames; paired day/night contrast and immutable saves. Human scene review pending.');
})().catch(e => { console.error(e); process.exitCode=1; });
