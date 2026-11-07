'use strict';
const fs = require('node:fs'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const Campaign = require('../src/prototype/engine');
const base = process.env.PERF_BASE_SHA || '6ac2f4f3dd4e6f8e34075971f653ee5d8b069692';
const source = fs.readFileSync('src/prototype/pixi-experimental.js', 'utf8');
const baseline = cp.execFileSync('git', ['show', base + ':src/prototype/pixi-experimental.js'], {
  encoding: 'utf8',
});
function bakeCode(s) {
  return s.slice(
    s.indexOf('  function proceduralBoundsContext(') >= 0
      ? s.indexOf('  function proceduralBoundsContext(')
      : s.indexOf('  function bake('),
    s.indexOf('  function create(options)'),
  );
}
const fixtures = [];
for (const zone of ['march', 'vale', 'highlands', 'frontier', 'crown']) {
  const g = new Campaign('normal', 'paladin', () => 0.73);
  g.enter(zone);
  const seen = new Set();
  for (const [entities, kind] of [
    [g.zone().props, 'prop'],
    [g.visibleNPCs(), 'npc'],
    [g.zone().enemies, 'enemy'],
    [g.zone().buildings, 'building'],
    [[g.hero], 'hero'],
  ])
    for (const e of entities) {
      const key =
        kind +
        ':' +
        [
          e.structure,
          e.species,
          e.type,
          e.family,
          e.kind,
          e.greenwoodFacility,
          e.highlandsNature,
        ].join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      fixtures.push({ zone, region: g.regionIndex(), visual: { ...e, renderKind: kind } });
    }
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const scripts = require('../scripts/site-assets.cjs').scripts;
    for (const file of scripts
      .slice(1, scripts.indexOf('src/prototype/engine.js') + 1)
      .concat(['src/prototype/visuals.js']))
      await page.addScriptTag({ path: require('node:path').resolve(file) });
    const report = await page.evaluate(
      ({ oldCode, newCode, fixtures }) => {
        function make(code) {
          return new Function('root', 'makeCanvas', 'requireValue', code + ';return bake;')(
            window,
            (w, h) => {
              const c = document.createElement('canvas');
              c.width = w;
              c.height = h;
              return c;
            },
            (v, msg) => {
              if (!v) throw Error(msg);
              return v;
            },
          );
        }
        const oldBake = make(oldCode),
          newBake = make(newCode),
          rows = [];
        let reads = 0,
          readPixels = 0;
        const get = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function (...args) {
          reads++;
          readPixels += args[2] * args[3];
          return get.apply(this, args);
        };
        function capture(body, density) {
          const c = document.createElement('canvas'),
            n = Math.round(576 * density);
          c.width = c.height = n;
          const ctx = c.getContext('2d');
          if (body)
            ctx.drawImage(
              body.image,
              Math.round((body.dx + 288) * density),
              Math.round((body.dy + 460) * density),
            );
          return get.call(ctx, 0, 0, n, n).data;
        }
        for (const f of fixtures)
          for (const density of [1, 2.25]) {
            const game = { regionIndex: () => f.region, s: { rescued: {} } },
              before = JSON.stringify(f.visual);
            const a = oldBake(f.visual, game, density);
            const ap = capture(a, density);
            const count = reads,
              beforePixels = readPixels;
            const b = newBake(f.visual, game, density);
            const avoided = reads === count,
              pixels = readPixels - beforePixels,
              bp = capture(b, density);
            let max = 0,
              changed = 0;
            for (let i = 0; i < ap.length; i++) {
              const d = Math.abs(ap[i] - bp[i]);
              max = Math.max(max, d);
              if (d) changed++;
            }
            rows.push({
              zone: f.zone,
              id: f.visual.id,
              kind: f.visual.renderKind,
              density,
              avoided,
              readPixels: pixels,
              fullReadPixels: Math.round(576 * density) ** 2,
              changed,
              max,
              bytesBefore: a ? a.image.width * a.image.height * 4 : 0,
              bytesAfter: b ? b.image.width * b.image.height * 4 : 0,
              stateUnchanged: before === JSON.stringify(f.visual),
              partsBefore: a?.ambientParts || [],
              partsAfter: b?.ambientParts || [],
            });
          }
        // Unsupported paint/effects must retain the full legacy readback.
        const artist = PrototypeVisuals, fallback = [];
        for (const effect of ['text','shadow','external-path','arc-to','direct-context']) {
          window.PrototypeVisuals = {draw(c,e,p) {
            c.fillStyle='#fff'; c.beginPath();
            if(effect==='text') c.fillText('GRAIN',p.x,p.y);
            if(effect==='shadow') {c.shadowBlur=6;c.fillRect(p.x,p.y,10,10);}
            if(effect==='external-path') {const path=new Path2D();path.rect(p.x,p.y,10,10);c.fill(path);}
            if(effect==='arc-to') {c.moveTo(p.x,p.y);c.arcTo(p.x+30,p.y,p.x+30,p.y+30,8);c.stroke();}
            if(effect==='direct-context') c.canvas.getContext('2d').fillRect(p.x,p.y,10,10);
          }};
          const old=oldBake({}, {regionIndex:()=>0,s:{rescued:{}}},1),a=capture(old,1),before=readPixels;
          const next=newBake({}, {regionIndex:()=>0,s:{rescued:{}}},1),pixels=readPixels-before,b=capture(next,1);
          let changed=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])changed++;
          fallback.push({effect,changed,pixels});
        }
        window.PrototypeVisuals=artist;
        const times = { baseline: [], candidate: [] },
          selected = fixtures
            .filter((f) => f.zone === 'march' && f.visual.renderKind === 'prop')
            .slice(0, 12);
        for (let round = 0; round < 12; round++)
          for (const method of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
            const start = performance.now();
            for (const f of selected) {
              const b = (method === 'baseline' ? oldBake : newBake)(
                f.visual,
                { regionIndex: () => f.region, s: { rescued: {} } },
                2.25,
              );
              if (b) {
                const ctx = b.image.getContext('2d');
                get.call(ctx, 0, 0, 1, 1);
              }
            }
            if (round >= 2) times[method].push((performance.now() - start) / selected.length);
          }
        CanvasRenderingContext2D.prototype.getImageData = get;
        const summary = (v) => {
          const s = v.slice().sort((a, b) => a - b);
          return { median: s[Math.floor(s.length / 2)], p95: s.at(-1) };
        };
        return {
          rows, fallback,
          timing: {
            baseline: summary(times.baseline),
            candidate: summary(times.candidate),
            bakesPerSample: selected.length,
            samples: 10,
            density: 2.25,
          },
        };
      },
      { oldCode: bakeCode(baseline), newCode: bakeCode(source), fixtures },
    );
    report.baseline = base;
    report.browser = browser.version();
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(
      'test-results/pixi-procedural-bounds.json',
      JSON.stringify(report, null, 2) + '\n',
    );
    assert(
      report.rows.every((r) => r.changed === 0),
      JSON.stringify(report.rows.filter((r) => r.changed)),
    );
    assert(report.rows.every((r) => r.stateUnchanged));
    assert(report.fallback.every(r=>r.changed===0 && r.pixels===576*576),JSON.stringify(report.fallback));
    assert(
      report.rows.every((r) => r.bytesBefore === r.bytesAfter),
      'exact resident crop byte parity',
    );
    assert(
      report.rows.every((r) => JSON.stringify(r.partsBefore) === JSON.stringify(r.partsAfter)),
      'ambient decomposition unchanged',
    );
    console.log(
      'PASS original procedural pixel parity',
      JSON.stringify({
        cases: report.rows.length,
        readPixels: report.rows.reduce((s, r) => s + r.readPixels, 0),
        fullReadPixels: report.rows.reduce((s, r) => s + r.fullReadPixels, 0),
        beforeBytes: report.rows.reduce((s, r) => s + r.bytesBefore, 0),
        afterBytes: report.rows.reduce((s, r) => s + r.bytesAfter, 0),
        timing: report.timing,
        browser: report.browser,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
