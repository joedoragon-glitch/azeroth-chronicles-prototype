'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../..'),
  out = __dirname;
const { createCanvas, Image, loadImage } = require(root + '/node_modules/@napi-rs/canvas'),
  sharp = require(root + '/node_modules/sharp');
class FileImage extends Image {
  set src(v) {
    super.src = typeof v === 'string' ? fs.readFileSync(path.resolve(root, v)) : v;
  }
}
global.Image = FileImage;
const R = require(root + '/src/prototype/rules'),
  S = require(root + '/src/prototype/sprites');
global.PrototypeRules = R;
const manifest = require(root + '/assets/sprites/manifest.json');
const box = { PrototypeRules: R, performance: { now: () => 16000 } };
const visualSource = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
vm.runInNewContext(visualSource, box);
const V = box.PrototypeVisuals;
// Review-only isolated copy: show retained registrations even when the owner
// selected procedural art. Production resolver and manifest remain untouched.
const spriteSource = fs.readFileSync(root + '/src/prototype/sprites.js', 'utf8');
const marker = '  function definitionFor(e, region = 0, rescued = false) {';
assert.equal(spriteSource.split(marker).length, 2);
const reviewSource = spriteSource.replace(
  marker,
  marker +
    `
    if(e?.reviewKey) {
      const original=manifest.sprites[e.reviewKey];
      const entry={...original,clips:{}};
      if(e.reviewFrame) entry.clips={idle:{loop:true,frames:[original.clips[e.reviewFrame.clip].frames[e.reviewFrame.index]]}};
      return {key:e.reviewKey,entry};
    }
`,
);
const sb = {
  Image: FileImage,
  PrototypeRules: R,
  require: createRequire(root + '/src/prototype/sprites.js'),
  performance: { now: () => 16000 },
  setTimeout,
  clearTimeout,
  queueMicrotask,
  console,
};
vm.runInNewContext(reviewSource, sb);
const Review = sb.PrototypeSprites;
const groups = [
  [
    'characters',
    'Characters',
    ['hero:paladin', 'hero:mage', 'hero:ranger', 'ally:soldier', 'ally:archer', 'enemy:goblin'],
  ],
  [
    'greenwood',
    'Greenwood Vale',
    [
      'prop:vale-cottage:vale',
      'prop:bush:vale',
      'prop:wildflowers:vale',
      'prop:sapling:vale',
      'prop:stump:vale',
      'prop:fallen-log:vale',
      'prop:rock:vale',
    ],
  ],
  [
    'wetlands',
    'Wetlands',
    ['prop:cattails:march', 'prop:driftwood:march', 'prop:mangrove:march', 'prop:marsh-bush:march'],
  ],
  [
    'highlands',
    'Highlands',
    [
      'prop:pine-sapling:highlands',
      'prop:alpine-scrub:highlands',
      'prop:rock-cluster:highlands',
      'prop:heather:highlands',
      'prop:rock:highlands',
      'prop:mint-workbench:highlands',
      'prop:ore-sorting-bay:highlands',
      'prop:caravan-loading-bay:highlands',
    ],
  ],
  [
    'frontier',
    'Frontier',
    [
      'prop:dead-tree:frontier',
      'prop:charred-stump:frontier',
      'prop:dry-scrub:frontier',
      'prop:burned-log:frontier',
    ],
  ],
  [
    'crown',
    'Crown',
    [
      'prop:black-rock:crown',
      'prop:crystal-cluster:crown',
      'prop:dead-shrub:crown',
      'prop:obsidian:crown',
    ],
  ],
];
const labels = {
  'hero:paladin': 'Paladin',
  'hero:mage': 'Mage',
  'hero:ranger': 'Hero Ranger',
  'ally:soldier': 'Companion Soldier',
  'ally:archer': 'Companion Archer',
  'enemy:goblin': 'Goblin — melee',
};
const entries = groups.flatMap(([group, groupName, keys]) =>
  keys.map((key) => ({ key, group, groupName })),
);
assert.equal(entries.length, 33);
assert.deepEqual(entries.map((x) => x.key).sort(), Object.keys(manifest.sprites).sort());
for (const [key, e] of Object.entries(manifest.sprites))
  for (const [clip, c] of Object.entries(e.clips || {}))
    c.frames.forEach((f, index) =>
      entries.push({
        key,
        group: 'animation',
        groupName: 'Retained idle frames',
        frame: { clip, index },
        frameResource: f,
      }),
    );
assert.equal(entries.length, 37);
function pixels(c) {
  return Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
}
function bounds(c) {
  const d = pixels(c);
  let l = c.width,
    t = c.height,
    r = -1,
    b = -1;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (d[(y * c.width + x) * 4 + 3] >= 24) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
      }
  assert(r >= l, 'empty render');
  assert(l > 0 && t > 0 && r < c.width - 1 && b < c.height - 1, 'clipped source render');
  return { l, t, r, b };
}
function layer(paint) {
  const c = createCanvas(1200, 1200),
    q = c.getContext('2d');
  q.translate(600, 850);
  q.scale(4, 4);
  paint(q);
  return c;
}
function plainEntity(key) {
  const file =
    root +
    '/tools/sprites/design-handoffs/approved-art-raster-' +
    key.replaceAll(':', '-') +
    '.json';
  assert(fs.existsSync(file), key + ' lacks entity reference');
  const d = JSON.parse(fs.readFileSync(file));
  const s =
    d.reference.exactEntityState.find((x) => x.mode === 'procedural') ||
    d.reference.exactEntityState[0];
  return { entity: { ...s.entity }, region: s.region || 0, reference: path.relative(root, file) };
}
function title(key) {
  return (
    labels[key] ||
    key
      .split(':')[1]
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
function text(q, s, x, y, size = 22, color = '#f3e6cc') {
  q.font = `${size}px sans-serif`;
  q.fillStyle = color;
  q.textAlign = 'center';
  q.fillText(s, x, y);
}
function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
(async () => {
  assert(S.installManifest(manifest));
  assert(Review.installManifest(manifest));
  await Promise.all([
    S.warm(Object.keys(manifest.sprites), { clips: true, variants: true }),
    Review.warm(Object.keys(manifest.sprites), { clips: true, variants: true }),
  ]);
  assert.equal(S.status().failed, 0);
  assert.equal(Review.status().failed, 0);
  let exactProductionPairs = 0;
  const records = [];
  fs.mkdirSync(out + '/cards', { recursive: true });
  for (let i = 0; i < entries.length; i++) {
    const row = entries[i],
      { entity: e, region, reference } = plainEntity(row.key);
    const chosen = S.definitionFor(e, region, false),
      entry = manifest.sprites[row.key];
    e.visualScale = V.assetSafeScale(e, entry);
    assert(
      S.candidateKeys(e, region, false).includes(row.key),
      row.key + ' mismatches entity reference',
    );
    const initial = JSON.stringify(e),
      reviewEntity = { ...e, reviewKey: row.key, ...(row.frame ? { reviewFrame: row.frame } : {}) };
    const proc = layer((q) => V.draw(q, e, { x: 0, y: 0 }, region, false));
    const raster = layer((q) => {
      assert(Review.draw(q, reviewEntity, { x: 0, y: 0 }, region, false));
      V.frontierTreeShoots?.(q, e, { x: 0, y: 0 }, region, true);
    });
    assert.equal(JSON.stringify(e), initial);
    assert.equal(
      JSON.stringify(reviewEntity),
      JSON.stringify({
        ...e,
        reviewKey: row.key,
        ...(row.frame ? { reviewFrame: row.frame } : {}),
      }),
    );
    if (chosen && !row.frame && !entry.clips) {
      const actual = layer((q) => {
        assert(S.draw(q, e, { x: 0, y: 0 }, region, false));
        V.frontierTreeShoots?.(q, e, { x: 0, y: 0 }, region, true);
      });
      assert.deepEqual(pixels(actual), pixels(raster));
      exactProductionPairs++;
    }
    const a = bounds(proc),
      b = bounds(raster),
      l = Math.min(a.l, b.l) - 12,
      t = Math.min(a.t, b.t) - 12,
      r = Math.max(a.r, b.r) + 12,
      bot = Math.max(a.b, b.b) + 12,
      w = r - l + 1,
      h = bot - t + 1;
    const c = createCanvas(1200, 700),
      q = c.getContext('2d');
    q.fillStyle = '#263e35';
    q.fillRect(0, 0, 1200, 700);
    const number = String(i + 1).padStart(2, '0'),
      name =
        title(row.key) +
        (row.frame ? ' · ' + row.frame.clip + ' frame ' + (row.frame.index + 1) : '');
    text(q, number + ' · ' + name, 600, 42, 29);
    const live = chosen
      ? 'LIVE: SPRITE' + (entry.clips ? ' / IDLE CLIP' : '')
      : 'LIVE: PROCEDURAL · retained sprite shown for reference';
    text(q, live, 600, 78, 19, chosen ? '#c3d7bb' : '#e4c487');
    text(q, 'CURRENT PROCEDURAL', 300, 124, 23);
    text(q, 'REGISTERED SPRITE' + (row.frame ? ' · FRAME' : ' · BASE'), 900, 124, 23);
    const scale = Math.min(530 / w, 470 / h);
    for (const [x, img] of [
      [300, proc],
      [900, raster],
    ])
      q.drawImage(
        img,
        l,
        t,
        w,
        h,
        x - (w * scale) / 2,
        155 + (470 - h * scale) / 2,
        w * scale,
        h * scale,
      );
    q.strokeStyle = '#607265';
    q.beginPath();
    q.moveTo(600, 145);
    q.lineTo(600, 635);
    q.stroke();
    text(
      q,
      'Same magnification and ground anchor within each pair · original artwork unchanged',
      600,
      665,
      17,
      '#bed1bc',
    );
    const file =
      'cards/' +
      number +
      '-' +
      row.key.replaceAll(':', '-') +
      (row.frame ? '-' + row.frame.clip + '-' + row.frame.index : '') +
      '.webp';
    const buf = await sharp(c.toBuffer('image/png')).webp({ quality: 95 }).toBuffer();
    fs.writeFileSync(out + '/' + file, buf);
    records.push({
      number: i + 1,
      key: row.key,
      title: name,
      group: row.group,
      groupName: row.groupName,
      file,
      frame: row.frame || null,
      liveSelection: chosen ? 'sprite' : 'procedural',
      entity: e,
      region,
      reference,
      sourceBounds: { procedural: a, sprite: b },
      sharedView: { crop: { l, t, w, h }, scale },
      imageData: 'data:image/webp;base64,' + buf.toString('base64'),
    });
  }
  const pages = [];
  for (const group of [
    ...groups.map(([id, name]) => [id, name]),
    ['animation', 'Retained idle frames'],
  ]) {
    const rows = records.filter((r) => r.group === group[0]);
    if (!rows.length) continue;
    const cols = 2,
      cw = 780,
      ch = 455,
      c = createCanvas(1600, 110 + Math.ceil(rows.length / cols) * ch),
      q = c.getContext('2d');
    q.fillStyle = '#172d27';
    q.fillRect(0, 0, c.width, c.height);
    text(q, group[1] + ' · PROCEDURAL / SPRITE', 800, 44, 32);
    text(
      q,
      'Left in each pair: current procedural · Right: registered sprite',
      800,
      80,
      20,
      '#bed1bc',
    );
    for (let j = 0; j < rows.length; j++) {
      const img = await loadImage(fs.readFileSync(out + '/' + rows[j].file));
      q.drawImage(img, 20 + (j % cols) * cw, 105 + Math.floor(j / cols) * ch, cw, ch);
    }
    const file = 'comparison-' + group[0] + '.png';
    fs.writeFileSync(out + '/' + file, c.toBuffer('image/png'));
    pages.push({ group: group[0], name: group[1], file, numbers: rows.map((x) => x.number) });
  }
  const safe = records.map(({ imageData, ...r }) => r);
  const audit = {
    version: require(root + '/package.json').version,
    baseRegistrations: 33,
    idleFrames: records.filter((r) => r.frame).length,
    baseSelections: {
      sprite: records.filter((r) => !r.frame && r.liveSelection === 'sprite').length,
      procedural: records.filter((r) => !r.frame && r.liveSelection === 'procedural').length,
    },
    variantCount: 0,
    exactProductionPairs,
    visibleBoundsAlphaThreshold: 24,
    sourcePixelClippingFailures: 0,
    emptyRenders: 0,
    entityStateMutations: 0,
    allBaseKeysCovered: true,
    worldAnchorsAndPairMagnificationEqual: true,
    frontierRegrowthIncluded: true,
    reviewOnlyResolverCopy: true,
    productionSourceUnmodified: true,
    proceduralSourceSha256: crypto.createHash('sha256').update(visualSource).digest('hex'),
    spriteSourceSha256: crypto.createHash('sha256').update(spriteSource).digest('hex'),
    pages,
    records: safe,
  };
  fs.writeFileSync(out + '/audit.json', JSON.stringify(audit, null, 2) + '\n');
  const payload = JSON.stringify(records).replaceAll('<', '\\u003c');
  const options = [
    ['all', 'All 37 comparisons'],
    ...groups.map(([a, b]) => [a, b]),
    ['animation', 'Idle frames'],
  ]
    .map(([a, b]) => `<option value="${a}">${b}</option>`)
    .join('');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game artwork comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#172d27;color:#f3e6cc;font:17px system-ui}header{position:sticky;top:0;padding:15px;background:#172d27;z-index:1;box-shadow:0 2px 8px #0005}h1{font-size:22px;margin:0 0 12px}nav{display:flex;gap:8px;flex-wrap:wrap;align-items:center}button,select{font:inherit;border:1px solid #8d9b78;border-radius:7px;padding:9px;background:#2b483d;color:inherit}button:disabled{opacity:.4}main{max-width:1200px;margin:auto}img{display:block;width:100%;height:auto}#caption{padding:8px 16px}footer{max-width:1200px;margin:0 auto;padding:16px;color:#bcd0bb;line-height:1.5}#jump{max-width:260px}</style><header><h1>33 registered sprites + 4 idle frames · exact game artwork</h1><nav><select id="group">${options}</select><button id="prev">← Previous</button><button id="next">Next →</button><select id="jump"></select><span id="count"></span></nav></header><main><img id="art" alt="Procedural and sprite comparison"><p id="caption"></p></main><footer>Left: current procedural design. Right: retained registered sprite. Four base registrations already use procedural art in the live game: Paladin, Mage, Soldier and Greenwood cottage. Every other asset remains unchanged. Both sides use the same entity, world anchor and magnification within each pair. Frontier regrowth is included. No AI generation or repainting.<br>Use the numbered cards to tell me which versions you prefer. Arrow keys also move between comparisons.</footer><script>const rows=${payload};let list=rows,index=0;const $=id=>document.getElementById(id);function show(){const r=list[index];$('art').src=r.imageData;$('art').alt=r.number+' '+r.title+' — procedural left, sprite right';$('caption').textContent=r.key+' · '+(r.liveSelection==='procedural'?'Already procedural in game; retained sprite shown.':'Sprite currently selected in game.')+(r.frame?' Idle animation frame '+(r.frame.index+1)+'.':'');$('count').textContent=(index+1)+' / '+list.length;$('prev').disabled=!index;$('next').disabled=index===list.length-1;$('jump').value=r.number;}function menu(){$('jump').innerHTML=list.map(r=>'<option value="'+r.number+'">'+String(r.number).padStart(2,'0')+' · '+r.title+'</option>').join('');show();}$('group').onchange=()=>{list=rows.filter(r=>$('group').value==='all'||r.group===$('group').value);index=0;menu();};$('prev').onclick=()=>{if(index){index--;show();}};$('next').onclick=()=>{if(index<list.length-1){index++;show();}};$('jump').onchange=()=>{index=list.findIndex(r=>r.number===Number($('jump').value));show();};onkeydown=e=>{if(e.target.tagName==='SELECT')return;if(e.key==='ArrowRight')$('next').click();if(e.key==='ArrowLeft')$('prev').click();};menu();</script></html>`;
  fs.writeFileSync(out + '/review.html', html);
  assert.equal((html.match(/data:image\/webp;base64,/g) || []).length, 37);
  console.log(
    JSON.stringify({
      baseRegistrations: audit.baseRegistrations,
      idleFrames: audit.idleFrames,
      live: audit.baseSelections,
      exactProductionPairs,
      pages: pages.map((x) => x.file),
      htmlBytes: Buffer.byteLength(html),
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
