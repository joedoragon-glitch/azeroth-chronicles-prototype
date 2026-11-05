'use strict';
// Focused real-browser Pixi + Canvas scene capture for Greenwood's roads.
// Uses the established direct GPU harness from pixi-parity-browser.test.cjs,
// avoiding the 15-second user-facing graphics trial and its full-game preload.
// This is actual native renderer evidence, NOT an installed-device test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(process.env.GREENWOOD_PREVIEW_OUT || 'test-artifacts/greenwood-road-bridge/pixi');
const phone = process.argv.includes('--phone');
const viewport = phone ? { width: 852, height: 393 } : { width: 1280, height: 800 };
const watermillReview = process.env.GITHUB_HEAD_REF ===
  'design/greenwood-watermill-district-20261105' || process.argv.includes('--watermill');
const mill = watermillReview
  ? require('../../src/prototype/engine').rules.greenwoodLayout : null;
const mid = (deck) => ({
  x: (deck.from.x + deck.to.x) / 2, y: (deck.from.y + deck.to.y) / 2,
});
const targets = [
  ['millhaven-west-junction', 650, 600],
  ['millhaven-east-junction', 810, 635],
  ['carriage-turn', 1190, 840],
  ['north-bridge-west', 1420, 1000],
  ['north-bridge', 1670, 1000],
  ['north-bridge-east', 1940, 1000],
  ['south-bridge-west', 1520, 2280],
  ['south-bridge', 1740, 2280],
  ['south-bridge-east', 1940, 2280],
  // #814-only real WebGL2 + Canvas-overlay review: hero camera deliberately
  // off the door/deck, rather than obscuring the feature being inspected.
  ...(mill ? [
    ['watermill-entrance-day', mill.millEntrance.x + 95, mill.millEntrance.y + 20, 120],
    ['watermill-entrance-night', mill.millEntrance.x + 95, mill.millEntrance.y + 20, 500],
    ['watermillrace-bridge-day', mid(mill.millBridge).x - 95, mid(mill.millBridge).y + 90, 120],
    ['watermillrace-bridge-night', mid(mill.millBridge).x - 95, mid(mill.millBridge).y + 90, 500],
    ['upstream-creek-culvert-day', mid(mill.creekCulvert).x + 85,
      mid(mill.creekCulvert).y + 100, 120],
  ] : []),
];
const scripts = require('../../scripts/site-assets.cjs').scripts.filter((s) => !s.endsWith('/app.js'));
const html =
  '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#173123}canvas{position:fixed;inset:0}#world{z-index:2}</style>' +
  '<canvas id="world"></canvas>' +
  scripts.map((s) => '<script src="/' + s + '"></script>').join('');
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (rel === '/') {
    res.setHeader('Content-Type', 'text/html');
    return res.end(html);
  }
  const file = path.resolve(root, '.' + rel);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404;
    return res.end();
  }
  res.setHeader('Content-Type', {
    '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp',
    '.png': 'image/png',
  }[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    const initialization = await page.evaluate(async ({ width, height }) => {
      window.g = new Campaign('normal', 'paladin', () => 0.73);
      g.enter('vale');
      const worldCanvas = document.querySelector('#world');
      worldCanvas.width = width;
      worldCanvas.height = height;
      const ctx = worldCanvas.getContext('2d');
      window.platform = {
        cameraZoom: 1.5,
        cameraAnchor: () => ({ x: innerWidth * 0.5, y: innerHeight * 0.55 }),
      };
      window.opts = {
        canvas: worldCanvas, ctx,
        getGame: () => g, platform,
        chargePresentation: () => null,
        isPaused: () => false,
        Campaign, PrototypeVisuals, PrototypeCombatVisuals,
        PrototypeSprites, PrototypeMaterials,
        now: () => 0,
      };
      window.painter = PrototypeRenderer.create(opts);
      painter.setOptimizationMode(true);
      await PrototypeSprites.preload();
      await PrototypeSprites.warm(
        Object.keys((await (await fetch('/assets/sprites/manifest.json')).json()).sprites),
        { variants: true, clips: true },
      );
      window.gpu = PrototypePixiExperimental.create({
        worldCanvas,
        viewport: { width: innerWidth, height: innerHeight },
        platform, getGame: () => g, canvasRenderer: painter,
        getOptimizationMode: () => true,
        getRendererOptions: () => opts,
        onFailure: (e) => { throw Error('Pixi GPU failure: ' + JSON.stringify(e)); },
      });
      const success = await gpu.prepare();
      if (!success) throw Error('Pixi prepare failed: ' + JSON.stringify(gpu.status()));
      return { success, mode: gpu.status().active ? 'active' : 'prepared', zoom: platform.cameraZoom,
        mapVersion: g.zone().greenwoodRoadBridgeVersion,
        roads: g.zone().roads.length,
        footpaths: g.zone().footpaths.length };
    }, viewport);
    assert.equal(initialization.success, true);
    assert.equal(initialization.zoom, 1.5);
    assert.equal(initialization.mapVersion, 1);
    const receipts = [];
    for (const [name, x, y, clock = 120] of targets) {
      const receipt = await page.evaluate(({ x, y, clock }) => {
        const before = JSON.stringify(g.s);
        Object.assign(g.hero, { x, y, path: [], order: null });
        g.s.clock = clock;
        g.updateNight();
        const frozen = JSON.stringify(g.s);
        painter.setRenderLayer('overlay');
        gpu.activate();
        gpu.draw();
        painter.draw();
        const s = gpu.status();
        return {
          x, y, clock,
          hero: { x: g.hero.x, y: g.hero.y },
          renderer: 'pixi-webgl2', zoom: platform.cameraZoom,
          gpuActive: s.active, gpuError: s.lastError || null,
          stateUnchanged: JSON.stringify(g.s) === frozen,
          zone: g.zoneId, bridgeWidths: g.zone().bridgeApproaches.map((b) => b.width),
          snapshotPrepared: before.length > 0,
          sceneMetrics: s.sceneMetrics || null,
        };
      }, { x, y, clock });
      assert(receipt.gpuActive && !receipt.gpuError, name + ': not active WebGL2');
      assert(receipt.stateUnchanged, name + ': renderer mutated native game state');
      const file = name + '-' + viewport.width + 'x' + viewport.height + '.png';
      await page.screenshot({ path: path.join(out, file) });
      receipts.push({ scene: name, file, ...receipt });
    }
    assert.deepEqual(errors, [], 'No browser JS errors');
    const { execFileSync } = require('node:child_process');
    const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    fs.writeFileSync(path.join(out, 'receipt.json'),
      JSON.stringify({ sourceSha, viewport, initialization, receipts, browser: browser.version(),
        renderer: 'native PixiJS direct WebGL2 + original Canvas overlay',
        qualifier: 'headless Chromium SwiftShader, not real-device FPS or owner visual signoff',
      }, null, 2) + '\n');
    console.log('PASS Greenwood Pixi 150% ' + receipts.length + ' scene views; WebGL2 active');
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
