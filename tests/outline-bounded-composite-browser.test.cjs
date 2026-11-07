'use strict';
// Executes the production closure against an immutable git baseline, rather
// than a rewritten approximation of either compositor. Chromium is intentional:
// synchronous submission and completed raster timings are reported separately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const { chromium } = require('playwright');
const base = process.env.PERF_BASE_SHA || '6ac2f4f3dd4e6f8e34075971f653ee5d8b069692';
const source = fs.readFileSync('src/prototype/renderer.js', 'utf8');
const original = cp.execFileSync('git', ['show', base + ':src/prototype/renderer.js'], {
  encoding: 'utf8',
});
function closure(text) {
  return text.slice(
    text.indexOf('    function drawOcclusionOutlines('),
    text.indexOf('    // Shared Canvas/Pixi presentation geometry.'),
  );
}
(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const report = await page.evaluate(
      ({ oldCode, newCode }) => {
        function fixture(
          code,
          size,
          translucent,
          optimized,
          flipX,
          fraction,
          retainedBody = true,
          zoom = 1.5,
        ) {
          const art = document.createElement('canvas');
          art.width = 80;
          art.height = 112;
          const brush = art.getContext('2d');
          brush.globalAlpha = translucent ? 0.57 : 1;
          brush.fillStyle = '#895fa3';
          brush.beginPath();
          brush.ellipse(39, 55, 31, 51, 0.18, 0, Math.PI * 2);
          brush.fill();
          const actor = { renderKind: 'enemy' };
          const retained = {
            image: art,
            dx: -40 + fraction,
            dy: -109 + fraction,
            width: 80,
            height: 112,
            flipX,
          };
          const pairs = [
            {
              actor,
              position: { x: 240.3, y: 300.7 },
              front: [{ entity: { renderKind: 'prop' }, position: { x: 251.3, y: 308.7 } }],
            },
          ];
          const target = document.createElement('canvas');
          target.width = 800;
          target.height = 600;
          const ctx = target.getContext('2d');
          ctx.scale(zoom, zoom);
          const stats = { outlineMasks: 0, outlineMaskPixels: 0 },
            outlineLayers = new Map();
          function sprite(e, p, c) {
            if (e === actor) {
              c.save();
              c.translate(p.x + retained.dx + (flipX ? 80 : 0), p.y + retained.dy);
              if (flipX) c.scale(-1, 1);
              c.drawImage(art, 0, 0, 80, 112);
              c.restore();
            } else {
              c.fillStyle = translucent ? '#467a6399' : '#467a63';
              c.fillRect(p.x - 60, p.y - 100, 110, 100);
            }
          }
          const draw = new Function(
            'occlusionPairs',
            'screen',
            'spriteHeight',
            'outlineSize',
            'outlineLayers',
            'stats',
            'optimized',
            'compactOutlines',
            'silhouetteFrames',
            'visualPosition',
            'sprite',
            'ctx',
            'now',
            code + '; return drawOcclusionOutlines;',
          )(
            () => pairs,
            () => {},
            () => {},
            () => size,
            outlineLayers,
            stats,
            optimized,
            true,
            retainedBody ? new WeakMap([[actor, retained]]) : null,
            (e, p) => ({ x: p.x + 0.23, y: p.y - 0.61 }),
            sprite,
            ctx,
            () => performance.now(),
          );
          function paint(detail = null) {
            ctx.clearRect(0, 0, 800 / zoom, 600 / zoom);
            draw([], detail);
          }
          const pixels = () => ctx.getImageData(0, 0, 800, 600).data;
          return { paint, pixels, stats };
        }
        const cases = [];
        for (const size of [256, 384])
          for (const translucent of [false, true])
            for (const optimized of [false, true])
              for (const flip of [false, true])
                for (const fraction of [0, 0.37])
                  for (const retained of [false, true]) {
                    const a = fixture(
                      oldCode,
                      size,
                      translucent,
                      optimized,
                      flip,
                      fraction,
                      retained,
                    );
                    const b = fixture(
                      newCode,
                      size,
                      translucent,
                      optimized,
                      flip,
                      fraction,
                      retained,
                    );
                    a.paint();
                    const ap = a.pixels();
                    b.paint();
                    const bp = b.pixels();
                    let changed = 0,
                      max = 0;
                    for (let i = 0; i < ap.length; i++) {
                      if (ap[i] !== bp[i]) changed++;
                      max = Math.max(max, Math.abs(ap[i] - bp[i]));
                    }
                    cases.push({
                      size,
                      translucent,
                      optimized,
                      flip,
                      fraction,
                      retained,
                      changed,
                      max,
                    });
                  }
        const timings = [];
        for (const size of [256, 384]) {
          const methods = {
            baseline: fixture(oldCode, size, true, false, true, 0.37),
            candidate: fixture(newCode, size, true, false, true, 0.37),
          };
          const times = { baseline: [], candidate: [] },
            complete = { baseline: [], candidate: [] },
            composite = { baseline: [], candidate: [] };
          for (let i = 0; i < 12; i++)
            for (const m of Object.values(methods)) {
              m.paint();
              m.pixels();
            }
          // Alternate order; the same ten-mask workload per sample and drain.
          for (let i = 0; i < 40; i++)
            for (const key of i % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
              const m = methods[key],
                detail = {};
              const t = performance.now();
              for (let j = 0; j < 10; j++) m.paint(detail);
              const submitted = performance.now();
              m.pixels();
              const done = performance.now();
              times[key].push((submitted - t) / 10);
              complete[key].push((done - t) / 10);
              composite[key].push(detail.outlineCompositeMs);
            }
          const summary = (v) => {
            const s = v.slice().sort((a, b) => a - b);
            return { median: s[20], p95: s[37] };
          };
          timings.push({
            size,
            submission: Object.fromEntries(Object.entries(times).map(([k, v]) => [k, summary(v)])),
            rasterComplete: Object.fromEntries(
              Object.entries(complete).map(([k, v]) => [k, summary(v)]),
            ),
            finalComposite: Object.fromEntries(
              Object.entries(composite).map(([k, v]) => [k, summary(v)]),
            ),
          });
        }
        return { cases, timings };
      },
      { oldCode: closure(original), newCode: closure(source) },
    );
    report.baseline = base;
    report.browser = browser.version();
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(
      'test-results/outline-bounded-composite.json',
      JSON.stringify(report, null, 2) + '\n',
    );
    assert(
      report.cases.every((c) => c.changed === 0),
      JSON.stringify(report.cases.filter((c) => c.changed)),
    );
    console.log(
      'PASS exact production outline parity:',
      report.cases.length,
      'cases; Chromium',
      report.browser,
    );
    console.log(JSON.stringify(report.timings));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
