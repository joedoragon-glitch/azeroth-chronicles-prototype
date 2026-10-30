'use strict';
// Focused production-page scene review. No broad browser matrix or device claim.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const { chromium } = require('playwright'),
  sharp = require('sharp'),
  C = process.argv.includes('--landscape')
    ? require('./fixtures.cjs').loadRedesign(3200)
    : require('../../src/prototype/engine');
const root = path.resolve(__dirname, '../..'),
  out = process.argv.includes('--out')
    ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
    : path.join(root, 'docs/evidence/greenwood-revised-20261028/browser');
const pixi = process.argv.includes('--pixi'),
  landscape = process.argv.includes('--landscape');
const executable = process.env.CHROMIUM_EXECUTABLE;
if (!executable)
  throw Error('Set CHROMIUM_EXECUTABLE to an available official Chromium/headless-shell runtime');
const { rng } = require('./fixtures.cjs'),
  seed = new C('normal', 'paladin', rng(0x47564101)).snapshot();
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json',
};
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(
        /^\/+/,
        '',
      ),
      file = path.resolve(root, relative || 'index.html');
    if (!file.startsWith(root + path.sep) || relative.split('/').some((p) => p.startsWith('.'))) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (landscape && relative === 'src/prototype/engine.js')
      return res.end(
        'PrototypeGreenwoodLandscape.configure(PrototypeData,PrototypeRules,3200);\n' +
          fs.readFileSync(file, 'utf8'),
      );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: executable,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
        '--font-render-hinting=none',
      ],
    });
    const receipts = [];
    for (const viewport of [
      { width: 1280, height: 800, touch: false, clock: 120 },
      { width: 393, height: 852, touch: true, clock: 120 },
      { width: 852, height: 393, touch: true, clock: 500 },
    ].filter((v, i) => !process.argv.includes('--desktop-only') || i === 0)) {
      const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
          deviceScaleFactor: 1,
        }),
        page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript((state) => {
        localStorage.setItem('azeroth-display-language-v1', 'en');
        localStorage.setItem('azeroth-v4-normal', JSON.stringify(state));
      }, seed);
      await page.goto(
        'http://127.0.0.1:' +
          server.address().port +
          (viewport.touch ? '/phone.html' : '/index.html'),
      );
      const resume = page.getByRole('button', { name: 'Continue Adventure', exact: true });
      await resume.waitFor({ state: 'visible' });
      assert(await resume.isEnabled());
      await resume.click();
      await page.waitForFunction(() => window.Prototype?.started && !Prototype.sceneLoading);
      if (pixi) {
        await page.locator('#menu-button').click();
        await page.getByRole('button', { name: 'Game and settings', exact: true }).click();
        await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
        await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
        await page.waitForFunction(
          () =>
            Prototype.experimentalGraphics.phase === 'trial' ||
            (Prototype.experimentalGraphics.phase === 'canvas' &&
              Prototype.experimentalGraphics.lastError),
          null,
          { timeout: 240000 },
        );
        const graphics = await page.evaluate(() => Prototype.experimentalGraphics);
        assert.equal(graphics.phase, 'trial', JSON.stringify(graphics));
        await page.getByRole('button', { name: 'Keep WebGL2', exact: true }).click();
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.phase), 'confirmed');
      }
      await page.evaluate(async () => {
        await PrototypeSprites.preload();
        Prototype.game.tick = () => {};
        Prototype.game.hero.order = null;
        Prototype.closeMenu();
      });
      const names = process.argv.includes('--interiors')
        ? ['treasury-interior', 'crypt-interior', 'cellars-interior']
        : viewport.touch
          ? ['start', 'hamlet', 'orchard', 'mill', 'north-bridge', 'crypt']
          : [
              'start',
              'refuge',
              'hamlet',
              'orchard',
              'mill',
              'north-bridge',
              'south-bridge',
              'eastern-pond',
              'cache',
              'treasury',
              'crypt',
              'old-cellars',
              'thorn-den',
              'goblin-camp',
              'skeleton-watch',
              'wagon',
              'north-smallholds',
            ];
      for (const name of names.filter(
        (name) =>
          !process.argv.includes('--scenes') ||
          process.argv[process.argv.indexOf('--scenes') + 1].split(',').includes(name),
      )) {
        const receipt = await page.evaluate(
          ({ name, clock }) => {
            const g = Prototype.game;
            const interiors = {
              'treasury-interior': 'supply-vale',
              'crypt-interior': 'crypt',
              'cellars-interior': 'side-vale-cellars',
            };
            if (interiors[name]) g.enter(interiors[name]);
            else if (g.zoneId !== 'vale') g.enter('vale');
            const z = g.zone(),
              n = (id) => z.npcs.find((n) => n.id === id),
              p = (id) => n(id)?.servicePoint || n(id);
            const hold = PrototypeRules.creatureStrongholds.find((h) => h.id === 'skeleton-watch');
            const targets = {
              'treasury-interior': { x: 570, y: 480 },
              'crypt-interior': { x: 1070, y: 1160 },
              'cellars-interior': { x: 550, y: 540 },
              start: PrototypeRules.greenwoodLayout?.start || {
                x: Campaign.data.towns[0][0],
                y: Campaign.data.towns[0][1],
              },
              wagon: p('outbound'),
              'north-smallholds': { x: 700, y: 170 },
              refuge: p('rest'),
              hamlet: p('minor'),
              orchard: p('orchard'),
              mill: p('mill-pond'),
              'north-bridge': p('bridge-north'),
              'south-bridge': p('bridge-south'),
              'eastern-pond': PrototypeRules.terrain[0][1],
              cache: p('cache'),
              treasury: p('supply-entrance'),
              crypt: p('entrance'),
              'old-cellars': p('den-ruins'),
              'thorn-den': g.fieldCenter(0),
              'goblin-camp': p('goblin-camp'),
              'skeleton-watch': { x: hold.center[0], y: hold.center[1] },
            };
            Object.assign(g.hero, g.safe(targets[name].x, targets[name].y));
            g.s.clock = clock;
            g.updateNight();
            Prototype.updateHUD();
            const before = JSON.stringify(g.snapshot());
            Prototype.renderer.draw();
            Prototype.renderer.draw();
            return {
              scene: name,
              hero: { x: g.hero.x, y: g.hero.y },
              zoom: Prototype.platform.cameraZoom,
              version: PrototypeBuild.version,
              snapshotUnchanged: before === JSON.stringify(g.snapshot()),
              frameSkip: Prototype.frameSkip.status(),
              sprites: PrototypeSprites.status(),
              graphics: Prototype.experimentalGraphics,
              frameProfile: Prototype.frameProfile.report(),
              materials:
                typeof PrototypeMaterials !== 'undefined' ? PrototypeMaterials.status() : null,
            };
          },
          { name, clock: viewport.clock },
        );
        assert.equal(receipt.zoom, 1.5);
        assert(receipt.snapshotUnchanged);
        assert.equal(receipt.version, require('../../package.json').version);
        assert.deepEqual(errors, []);
        if (pixi) assert.equal(receipt.graphics.mode, 'webgl2');
        await page.waitForTimeout(180);
        const file = `browser-${name}-${viewport.width}x${viewport.height}-${viewport.clock === 120 ? 'day' : 'night'}.webp`;
        await sharp(await page.screenshot())
          .webp({ quality: 88 })
          .toFile(path.join(out, file));
        receipts.push({
          file,
          ...viewport,
          dpr: 1,
          ...receipt,
          layer:
            'Actual production HTML/HUD with normal registered sprites/materials, ' +
            (pixi ? 'confirmed Pixi WebGL2' : 'Canvas fallback') +
            '; scoped seeded fixture, simulation frozen during capture; Chromium 153 with software SwiftShader, not physical-device or hardware FPS evidence',
        });
      }
      await context.close();
    }
    fs.writeFileSync(
      path.join(out, 'receipt.json'),
      JSON.stringify(
        {
          browserVersion: browser.version(),
          sourceSha: require('node:child_process')
            .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
            .trim(),
          sources: Object.fromEntries(
            [
              'app',
              'engine',
              'greenwood',
              'greenwood-landscape',
              'greenwood-interiors',
              'world',
              'save',
              'visuals',
              'renderer',
              'sprites',
              'materials',
            ].map((f) => [
              f,
              crypto
                .createHash('sha256')
                .update(fs.readFileSync(path.join(root, 'src/prototype/' + f + '.js')))
                .digest('hex'),
            ]),
          ),
          receipts,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'PASS ' +
        receipts.length +
        ' focused production-page 150% captures: desktop/portrait/landscape, day/night, live actors retained, native registered assets, no page errors and no render-state mutation',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
