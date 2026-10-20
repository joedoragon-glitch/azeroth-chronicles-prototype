'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  const result = {
    limits:
      'Three frozen scenes, headless software Chromium draw+forced readback. Timings are local draw costs, not physical-device FPS.',
    cases: [],
  };
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_EXECUTABLE ||
        '/root/.cache/ms-playwright/chromium_headless_shell-1161/chrome-linux/headless_shell',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    for (const phone of [false, true]) {
      const page = await browser.newPage({
        viewport: phone ? { width: 393, height: 852 } : { width: 1600, height: 831 },
        deviceScaleFactor: phone ? 3 : 1.6,
        isMobile: phone,
        hasTouch: phone,
        serviceWorkers: 'block',
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
      );
      await page.waitForFunction(() => !!window.Prototype);
      await page.evaluate(async () => {
        Prototype.openMenu('Performance audit', '', []);
        const manifest = await (await fetch('./assets/sprites/manifest.json')).json(),
          keys = Object.keys(manifest.sprites);
        await PrototypeSprites.preload(undefined, keys);
        await PrototypeSprites.warm(keys, { variants: true, clips: true });
        window.auditNow = performance.now.bind(performance);
        performance.now = () => 16000;
        PrototypeSprites.timeMs = () => 16000;
      });
      for (const zone of phone ? ['citadel'] : ['frontier', 'crown']) {
        const out = await page.evaluate(async (zone) => {
          const P = Prototype,
            G = P.game,
            R = P.renderer,
            S = P.renderResolution,
            M = PrototypeMaterials,
            c = document.getElementById('world'),
            q = c.getContext('2d');
          G.s.zone = zone;
          G.zone();
          G.zone();
          G.s.clock = 500;
          Object.assign(
            G.hero,
            G.safe(zone === 'citadel' ? 850 : 650, zone === 'citadel' ? 850 : 730),
          );
          P.platform.selectCameraZoom(1.75);
          const state = JSON.stringify(G.s),
            anchor = R.screen(G.hero),
            cases = [];
          for (const optimized of [false, true]) {
            M.setOptimizationMode(optimized);
            R.setOptimizationMode(optimized);
            P.audio.setOptimizationMode(optimized);
            if (!optimized) {
              await M.load();
              await Promise.all(Object.keys(M.entries).map((key) => M.ensure(key)));
            }
            const times = { maximum: [], adaptive: [] },
              stats = {};
            for (let round = 0; round < 4; round++)
              for (const setting of round % 2 ? ['adaptive', 'maximum'] : ['maximum', 'adaptive']) {
                S.select(setting === 'maximum' ? 'native' : 'auto');
                if (setting === 'adaptive')
                  for (let i = 0; i <= 8; i++) S.observe(i * 1000, 80, 30, 8);
                window.dispatchEvent(new Event('resize'));
                // The renderer/material/audio modes above are injected diagnostic
                // controls. app's persisted Optimization Mode is not modified.
                R.draw();
                q.getImageData(0, 0, 1, 1);
                const warm = R.metrics().groundCache;
                const at = auditNow();
                R.draw();
                q.getImageData(0, 0, 1, 1);
                const ms = auditNow() - at;
                if (round) times[setting].push(ms);
                const metrics = R.metrics();
                if (
                  zone !== 'citadel' &&
                  (metrics.floorTilesPainted !== 0 || metrics.groundCache.builds !== warm.builds)
                )
                  throw Error('Warm floor repainted');
                if (JSON.stringify(G.s) !== state) throw Error('Draw changed game state');
                const point = R.screen(G.hero),
                  back = R.world(point.x, point.y);
                if (
                  Math.hypot(point.x - anchor.x, point.y - anchor.y) > 1e-7 ||
                  Math.hypot(back.x - G.hero.x, back.y - G.hero.y) > 1e-7
                )
                  throw Error('Camera/input changed');
                stats[setting] = {
                  backing: [c.width, c.height],
                  resolution: S.status(),
                  ...metrics,
                  materials: M.status(),
                  sprites: PrototypeSprites.status(),
                };
              }
            const old = { x: G.hero.x, y: G.hero.y };
            G.hero.x += 10;
            G.hero.y += 5;
            const builds = R.metrics().groundCache.builds;
            R.draw();
            if (zone !== 'citadel' && R.metrics().groundCache.builds !== builds)
              throw Error('Small movement lost cache');
            Object.assign(G.hero, old);
            if (optimized && M.status().decodedBytes !== 0)
              throw Error('Optional textures retained');
            cases.push({
              optimized,
              times,
              stats,
              stateAndInputPreserved: true,
              smallMovementReused: zone !== 'citadel',
            });
          }
          return { zone, cases };
        }, zone);
        assert.deepEqual(errors, []);
        result.cases.push({ phone, ...out, errors });
      }
      await page.close();
    }
    fs.writeFileSync(path.join(__dirname, 'browser.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(
      'PASS three frozen scenes: warm/moving caches, graphics transitions, texture release, state/input isolation and bounded render timings',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
