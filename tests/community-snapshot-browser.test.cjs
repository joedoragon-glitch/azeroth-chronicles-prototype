'use strict';
// Native Canvas/device fixture. Authored only: do not run before owner validation authorization.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER_ENGINE || 'chromium',
  root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results', 'community-' + engine);
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'),
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.webmanifest': 'application/manifest+json',
      '.png': 'image/png',
      '.mp3': 'audio/mpeg',
    }[path.extname(file)] || 'text/html',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await pw[engine].launch(
      engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {},
    );
    const reports = [];
    for (const [width, height, phone] of [
      [1280, 800, false],
      [375, 800, true],
      [393, 852, true],
      [800, 375, true],
      [844, 390, true],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: phone,
        isMobile: phone,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      // Leave the title menu open so the shell simulation stays paused.
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html'),
      );
      await page.waitForFunction(
        () => window.Campaign && window.PrototypeRenderer && window.PrototypePartyPets,
      );
      for (const motion of ['reduce', 'no-preference']) {
        await page.emulateMedia({ reducedMotion: motion });
        for (const zoom of [1, 1.5, 1.75]) {
          const report = await page.evaluate(
            async ({ width, height, zoom }) => {
              const need = (v, s) => {
                if (!v) throw Error(s);
              };
              document.querySelector('#community-canvas')?.remove();
              const canvas = document.createElement('canvas');
              canvas.id = 'community-canvas';
              canvas.width = width;
              canvas.height = height;
              Object.assign(canvas.style, {
                position: 'fixed',
                inset: '0',
                zIndex: '999999',
                background: '#20332e',
              });
              document.body.append(canvas);
              const ctx = canvas.getContext('2d'),
                C = window.Campaign;
              let game = new C('normal', 'paladin', () => 0.9);
              const makePainter = (sprites) =>
                PrototypeRenderer.create({
                  canvas: { width, height },
                  ctx,
                  getGame: () => game,
                  platform: {
                    cameraZoom: zoom,
                    cameraAnchor: () => ({ x: width / 2, y: height / 2 }),
                  },
                  chargePresentation: () => null,
                  isPaused: () => true,
                  Campaign: C,
                  PrototypeVisuals,
                  PrototypeCombatVisuals,
                  PrototypeSprites: sprites ? PrototypeSprites : null,
                  PrototypeMaterials,
                  now: () => 16000,
                });
              // Exercise procedural fallbacks and loaded illustrations in separate passes.
              const results = [];
              for (const sprites of [false, true]) {
                if (sprites) {
                  const manifest = await PrototypeSprites.preload();
                  await PrototypeSprites.warm(Object.keys(manifest.sprites));
                }
                const painter = makePainter(sprites);
                for (const region of C.data.regions) {
                  game = new C('normal', 'paladin', () => 0.9);
                  game.enter(region.id);
                  const h = game.hero;
                  // Place the mixed party using the actual unit factory and existing navigation.
                  game.s.expeditionRank = 6;
                  game.s.party = [];
                  const families = C.data.bosses.map((b) => b.id);
                  for (let i = 0; i < 6; i++) {
                    const u = game.unit(
                      'pet',
                      h.x + (i % 2 ? 50 : -50),
                      h.y + Math.floor(i / 2) * 30,
                      families[(i + results.length) % families.length],
                    );
                    game.s.party.push(u);
                  }
                  for (const clock of [0, 500]) {
                    game.s.clock = clock;
                    const before = JSON.stringify(game.s);
                    painter.draw();
                    const pixels = ctx.getImageData(0, 0, width, height).data;
                    need(
                      pixels.some((v, i) => i % 4 !== 3 && v > 0),
                      'scene paints actual pixels',
                    );
                    need(JSON.stringify(game.s) === before, 'renderer never mutates campaign');
                    need(painter.metrics().transientEffects <= 40, 'bounded presentation queue');
                    results.push({ region: region.id, clock, sprites, metrics: painter.metrics() });
                  }
                }
              }
              // Native-scale gallery of all eleven individuals, including both facing sides.
              ctx.fillStyle = '#20332e';
              ctx.fillRect(0, 0, width, height);
              const columns = width < 600 ? 2 : 6,
                cellW = width / columns,
                cellH = Math.min(125, height / Math.ceil(11 / columns));
              for (const [i, boss] of C.data.bosses.entries()) {
                const x = ((i % columns) + 0.5) * cellW,
                  y = (Math.floor(i / columns) + 0.82) * cellH;
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(zoom, zoom);
                if (i % 2) ctx.scale(-1, 1);
                PrototypeVisuals.draw(
                  ctx,
                  { renderKind: 'ally', type: 'pet', petFamily: boss.id, id: 'gallery-' + boss.id },
                  { x: 0, y: 0 },
                  0,
                );
                ctx.restore();
                ctx.fillStyle = '#e6d9b8';
                ctx.font = '11px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(game.petDefinition(boss.id).name, x, y + 17, cellW - 6);
              }
              need(
                C.data.bosses.every(
                  (b) =>
                    PrototypeSprites.candidateKeys(
                      { renderKind: 'ally', type: 'pet', petFamily: b.id },
                      0,
                    ).length === 0,
                ),
                'pets always keep procedural identity',
              );
              return { width, height, zoom, cases: results.length, results };
            },
            { width, height, zoom },
          );
          reports.push({ ...report, motion });
          await page
            .locator('#community-canvas')
            .screenshot({ path: path.join(out, `${width}x${height}-${motion}-${zoom}.png`) });
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(reports, null, 2) + '\n');
    console.log(
      'PASS Community native procedural/illustrated scenes and eleven-pet galleries: ' +
        reports.length +
        ' device/motion/zoom contexts',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
