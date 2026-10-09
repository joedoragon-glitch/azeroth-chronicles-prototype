'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { createCanvas } = require('@napi-rs/canvas');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.MATERIAL_BROWSER_ENGINE || 'chromium';
const tile = createCanvas(256, 256),
  q = tile.getContext('2d');
q.fillStyle = '#294b36';
q.fillRect(0, 0, 256, 256);
for (let x = 0; x < 256; x += 16) {
  q.fillStyle = x % 32 ? '#31583e' : '#203e30';
  q.fillRect(x, 0, 8, 256);
}
const bytes = tile.toBuffer('image/png');
let requests = 0;
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (/^\/assets\/materials\/qa-\d+\.png$/.test(url)) {
    requests++;
    res.setHeader('Content-Type', 'image/png');
    res.end(bytes);
    return;
  }
  const file = path.resolve(root, decodeURIComponent(url.slice(1)) || 'index.html');
  if (
    !file.startsWith(root + path.sep) ||
    !fs.existsSync(file) ||
    fs.statSync(file).isDirectory()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const options =
      engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
        : {};
    browser = await pw[engine].launch(options);
    for (const [entry, size] of [
      ['index.html', { width: 1280, height: 800 }],
      ['phone.html', { width: 375, height: 812 }],
    ]) {
      const page = await browser.newPage({ viewport: size }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/' + entry);
      await page.waitForFunction(() => !!window.PrototypeMaterials && !!window.Prototype);
      await page.evaluate(() => Prototype.openMenu('Material QA', '', []));
      const production = await page.evaluate(async () => {
        const M = PrototypeMaterials;
        await M.load();
        const keys = Object.keys(M.entries);
        const decoded = await Promise.all(keys.map((key) => M.ensure(key)));
        return { count: keys.length, successful: decoded.filter(Boolean).length, ...M.status() };
      });
      assert.equal(production.successful, production.count, 'Published material images decode');
      assert.equal(production.failures, 0);
      assert(production.decodedBytes <= production.decodedBudget);
      const projection = await page.evaluate(async () => {
        const M = PrototypeMaterials,
          cached = M.projectedPattern;
        const comparison = [];
        const screen = (p) => ({ x: (p.x - p.y) * 0.76 + 500.35, y: (p.x + p.y) * 0.27 - 300.2 });
        const points = [
          { x: 320, y: 800 },
          { x: 1000, y: 800 },
          { x: 1000, y: 1500 },
          { x: 320, y: 1500 },
        ];
        const draw = (key, scale, fast, dx = 0) => {
          const c = document.createElement('canvas');
          c.width = 600 * scale;
          c.height = 400 * scale;
          const q = c.getContext('2d');
          q.scale(scale, scale);
          q.fillStyle = '#284f30';
          q.fillRect(0, 0, 600, 400);
          M.projectedPattern = fast ? cached : () => null;
          M.paint(
            q,
            key,
            (p) => {
              const v = screen(p);
              return { x: v.x + dx, y: v.y };
            },
            points,
          );
          return q.getImageData(0, 0, c.width, c.height).data;
        };
        try {
          for (const key of Object.keys(M.entries)) {
            await M.ensure(key);
            for (const scale of [1, 1.5, 2.25, 3, 3.5]) {
              const a = draw(key, scale, false),
                b = draw(key, scale, true);
              let sum = 0,
                max = 0;
              for (let i = 0; i < a.length; i++) {
                const difference = Math.abs(a[i] - b[i]);
                sum += difference;
                max = Math.max(max, difference);
              }
              const xShift = 20 * scale,
                shifted = draw(key, scale, true, 20);
              let phaseMax = 0;
              // Integer physical camera shifts preserve grain and both repeat
              // boundaries within one channel of browser sampling quantization.
              for (let y = 60 * scale; y < 210 * scale; y++)
                for (let x = 240 * scale; x < 340 * scale; x++)
                  for (let ch = 0; ch < 4; ch++)
                    phaseMax = Math.max(
                      phaseMax,
                      Math.abs(
                        b[(y * 600 * scale + x) * 4 + ch] -
                          shifted[(y * 600 * scale + x + xShift) * 4 + ch],
                      ),
                    );
              comparison.push({
                key,
                scale,
                mean: sum / a.length,
                max,
                phaseMax,
                outside: [...b.slice(0, 4)],
                bytes: M.projectedBytes,
              });
            }
          }
          const canvases = [...M.projected.values()].map((item) => item.canvas);
          const before = M.projectedBytes;
          M.install({ version: 1, materials: M.entries });
          const q = document.createElement('canvas').getContext('2d');
          const key = Object.keys(M.entries)[0],
            entry = M.entries[key],
            item = M.cache.get(M.identity(entry));
          q.scale(64, 64);
          const oversizedFallback = cached.call(M, q, entry, item, { x: 0, y: 0 }) === null;
          q.resetTransform();
          q.rotate(0.2);
          const rotatedFallback = cached.call(M, q, entry, item, { x: 0, y: 0 }) === null;
          return {
            comparison,
            before,
            after: M.projectedBytes,
            evictions: M.stats.projectedEvictions,
            oversizedFallback,
            rotatedFallback,
            released: canvases.every((c) => c.width === 0 && c.height === 0),
          };
        } finally {
          M.projectedPattern = cached;
        }
      });
      for (const sample of projection.comparison) {
        assert(
          sample.mean < 0.85,
          'same production grain within sub-channel sampling tolerance: ' + JSON.stringify(sample),
        );
        assert(sample.max <= 24, 'no strong seam/phase differences');
        assert(
          sample.phaseMax <= 1,
          'projected grain follows fractional camera origin: ' + JSON.stringify(sample),
        );
        assert.deepEqual(sample.outside, [40, 79, 48, 255], 'ground clip preserves exterior');
        assert(sample.bytes <= 8 * 1024 * 1024, 'projected raster budget is bounded');
      }
      assert(projection.before > 0);
      assert(projection.evictions > 0, 'region/scale churn exercises bounded LRU eviction');
      assert.equal(projection.after, 0, 'manifest changes invalidate projected grain');
      assert(projection.released, 'retirement releases canvas backing stores');
      assert(
        projection.oversizedFallback && projection.rotatedFallback,
        'unsupported projections keep original path',
      );
      const status = await page.evaluate(async () => {
        const M = PrototypeMaterials;
        const materials = Object.fromEntries(
          Array.from({ length: 28 }, (_, i) => [
            'terrain:floor:qa-' + i,
            {
              src: './assets/materials/qa-' + i + '.png',
              width: 256,
              height: 256,
              hash: (i + 1).toString(16).padStart(64, '0'),
              revision: (i + 1).toString(16).padStart(64, '0'),
              worldSpan: 320,
              opacity: 0.28,
            },
          ]),
        );
        M.install({ version: 1, materials });
        await Promise.all(Object.keys(materials).map((k) => M.ensure(k)));
        const key = 'terrain:floor:qa-27';
        const draw = (dx) => {
          const c = document.createElement('canvas');
          c.width = 320;
          c.height = 220;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#112233';
          ctx.fillRect(0, 0, 320, 220);
          M.paint(
            ctx,
            key,
            (p) => ({ x: (p.x - p.y) * 0.76 + 100 + dx, y: (p.x + p.y) * 0.27 + 20 }),
            [
              { x: 0, y: 0 },
              { x: 120, y: 0 },
              { x: 120, y: 120 },
              { x: 0, y: 120 },
            ],
          );
          return ctx.getImageData(0, 0, 320, 220).data;
        };
        const a = draw(0),
          b = draw(20);
        let equal = true;
        for (let y = 30; y < 80; y++)
          for (let x = 80; x < 120; x++)
            for (let ch = 0; ch < 4; ch++)
              if (a[(y * 320 + x) * 4 + ch] !== b[(y * 320 + x + 20) * 4 + ch]) equal = false;
        const result = { ...M.status(), worldPhaseEqual: equal, outside: [...a.slice(0, 4)] };
        M.install({ version: 1, materials: {} });
        result.retiredBytes = M.status().decodedBytes;
        return result;
      });
      assert(status.decodedBytes <= 2097152);
      assert(status.peakConcurrent <= 2);
      assert(status.evictions >= 20);
      assert(status.worldPhaseEqual, 'world grain remains stable when camera moves');
      assert.deepEqual(status.outside, [17, 34, 51, 255]);
      assert.equal(status.retiredBytes, 0);
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          engine +
          ' ' +
          entry +
          ' bounded 28-material loading, camera phase, clipping and retirement',
      );
      await page.close();
    }
    assert(requests >= 56);
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
