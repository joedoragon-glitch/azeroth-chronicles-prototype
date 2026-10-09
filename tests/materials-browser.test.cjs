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
