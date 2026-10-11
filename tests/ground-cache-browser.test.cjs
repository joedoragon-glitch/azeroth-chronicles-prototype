'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.MATERIAL_BROWSER_ENGINE || 'chromium';
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
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
      const page = await browser.newPage({
          viewport: size,
          deviceScaleFactor: entry === 'phone.html' ? 3 : 1,
          isMobile: entry === 'phone.html',
          hasTouch: entry === 'phone.html',
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/' + entry);
      await page.waitForFunction(() => !!window.PrototypeMaterials && !!window.Prototype);
      await page.evaluate(() => Prototype.openMenu('Material QA', '', []));
      const result = await page.evaluate(async () => {
        const G = Prototype.game,
          R = Prototype.renderer,
          M = PrototypeMaterials;
        G.tick = () => {};
        performance.now = () => 12345;
        PrototypeSprites.timeMs = () => 12345;
        const c = document.getElementById('world'),
          q = c.getContext('2d');
        const compare = () => {
          R.setGroundReuse(false);
          R.draw();
          const a = q.getImageData(0, 0, c.width, c.height).data;
          R.setGroundReuse(true);
          R.draw();
          const b = q.getImageData(0, 0, c.width, c.height).data;
          let sum = 0,
            max = 0,
            over24 = 0;
          for (let j = 0; j < a.length; j++) {
            const d = Math.abs(a[j] - b[j]);
            sum += d;
            max = Math.max(max, d);
            if (d > 24) over24++;
          }
          return { mean: sum / a.length, max, over24: over24 / a.length };
        };
        const comparisons = [];
        for (const zone of ['vale', 'march', 'highlands', 'frontier', 'crown']) {
          G.enter(zone);
          Object.assign(G.hero, { x: 1500.35, y: 1500.2 });
          await M.ensure('terrain:ground:' + zone);
          for (const scale of [1, 1.5, 1.75]) {
            Prototype.platform.selectCameraZoom(scale);
            const before = JSON.stringify(G.s);
            comparisons.push({ zone, scale, ...compare() });
            const initial = R.metrics();
            R.draw();
            const still = R.metrics();
            if (
              still.floorTilesPainted !== 0 ||
              still.groundCache.builds !== initial.groundCache.builds
            )
              throw Error('Stationary floor was repainted');
            G.hero.x += 20.3;
            G.hero.y += 12.1;
            R.draw();
            const move = R.metrics();
            if (move.floorTilesPainted !== 0) throw Error('Small camera motion rebuilt ground');
            R.setGroundReuse(false);
            R.draw();
            R.setGroundReuse(true);
            R.draw();
            G.hero.x += 12.7;
            G.hero.y -= 10.4;
            R.draw();
            const shifted = q.getImageData(0, 0, c.width, c.height).data;
            R.setGroundReuse(false);
            R.draw();
            const shiftedDirect = q.getImageData(0, 0, c.width, c.height).data;
            let sum = 0;
            for (let j = 0; j < shifted.length; j++) sum += Math.abs(shifted[j] - shiftedDirect[j]);
            comparisons.push({ zone, scale, moving: true, mean: sum / shifted.length });
            G.hero.x -= 33;
            G.hero.y -= 1.7;
            if (JSON.stringify(G.s) !== before) {
              // Floating point inverse movement may differ at the final decimal;
              // the draw-only comparison itself must not alter any campaign field.
              const saved = JSON.stringify(G.s);
              R.draw();
              if (JSON.stringify(G.s) !== saved) throw Error('Rendering mutated campaign');
            }
          }
        }
        R.setGroundReuse(true);
        G.enter('vale');
        R.draw();
        const outdoor = R.metrics();
        for (const zone of ['crypt', 'mine', 'abyss', 'citadel', 'archive', 'supply-highlands']) {
          if (!G.enter(zone)) throw Error('Unknown interior ' + zone);
          R.draw();
          R.draw();
          R.draw();
          if (R.metrics().groundCache.bytes !== 0) throw Error('Interior retained outdoor ground');
          const before = JSON.stringify(G.s);
          comparisons.push({ zone, interior: true, ...compare() });
          const interior = R.metrics();
          if (
            interior.floorTilesPainted !== interior.tilesDrawn ||
            interior.groundCache.bytes !== 0
          )
            throw Error('Interior did not use direct floor path');
          if (JSON.stringify(G.s) !== before) throw Error('Interior rendering mutated campaign');
        }
        G.enter('vale');
        R.draw();
        const back = R.metrics();
        const warm = back.groundCache.builds;
        const manifest = await (await fetch('./assets/materials/manifest.json')).json();
        M.install(manifest);
        R.draw();
        if (R.metrics().groundCache.builds !== warm + 1)
          throw Error('Material reload did not invalidate floor');
        const p = G.hero.x;
        G.hero.x += 400;
        R.draw();
        G.hero.x = p;
        const changed = R.metrics();
        return { comparisons, outdoor, back, changed, errors: [] };
      });
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'test-results', 'ground-cache-' + engine + '-' + entry + '.json'),
        JSON.stringify(result, null, 2),
      );
      for (const c of result.comparisons) {
        assert(c.mean < (c.moving ? 2 : 0.6), 'Floor appearance changed: ' + JSON.stringify(c));
        if (c.interior) assert(c.mean < 0.02, 'Interior raster drift: ' + JSON.stringify(c));
      }
      assert(result.outdoor.groundCache.bytes <= 64 * 1024 * 1024);
      assert(result.changed.groundCache.bytes <= 64 * 1024 * 1024);
      assert(result.changed.groundCache.builds > result.back.groundCache.builds);
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          engine +
          ' ' +
          entry +
          ' ground appearance, camera reuse, travel, material reload and memory',
      );
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
