'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  Baseline = require('./helpers/perf-ws2-baseline.cjs');
const root = path.resolve(__dirname, '..'),
  engine = process.env.PERF_WS2_BROWSER_ENGINE || 'webkit';
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0]);
  if (name === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>WS2 exact rendering proof</title>');
    return;
  }
  const file = path.resolve(root, name.slice(1));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await pw[engine].launch({
      headless: true,
      ...(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {}),
    });
    const page = await browser.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    const inventory = require('../scripts/site-assets.cjs').scripts,
      names = inventory
        .slice(1, inventory.indexOf('src/prototype/engine.js') + 1)
        .concat(
          [
            'visuals',
            'combat-visuals',
            'enemy-vfx-art',
            'sprite-format',
            'sprites',
            'renderer',
          ].map((n) => 'src/prototype/' + n + '.js'),
        );
    for (const file of names) await page.addScriptTag({ path: path.join(root, file) });
    const source = fs.readFileSync(path.join(root, 'src/prototype/renderer.js'), 'utf8'),
      start = source.indexOf('  function occlusionPairs('),
      end = source.indexOf('\n  function create(', start);
    await page.addScriptTag({
      content: (
        source.slice(0, start) +
        Baseline.occlusionPairs.toString() +
        '\n' +
        source.slice(end)
      ).replace('root.PrototypeRenderer = api', 'root.PerfWs2BaselineRenderer = api'),
    });
    const comparisons = await page.evaluate(async () => {
      performance.now = () => 16000;
      await PrototypeSprites.preload();
      await PrototypeSprites.warm(['hero:paladin'], { clips: true });
      const results = [];
      for (const zone of [
        'vale',
        'march',
        'highlands',
        'frontier',
        'crown',
        'crypt',
        'mine',
        'archive',
        'abyss',
      ]) {
        const game = new Campaign('normal', 'paladin', () => 0.7);
        game.enter(zone);
        game.zone().props.push({
          id: 'test-cover',
          structure: 'house',
          decorative: true,
          x: game.hero.x + 20,
          y: game.hero.y + 20,
          r: 26,
        });
        const keys = game
          .zone()
          .props.flatMap((e) =>
            PrototypeSprites.candidateKeys({ ...e, renderKind: 'prop' }, game.regionIndex()),
          );
        await PrototypeSprites.warm([...new Set(keys)], { variants: true });
        for (const [width, height] of [
          [1280, 800],
          [375, 812],
        ])
          for (const cameraZoom of [1, 1.5, 1.75]) {
            function make(renderer) {
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d'),
                painter = renderer.create({
                  canvas,
                  ctx,
                  getGame: () => game,
                  platform: {
                    cameraZoom,
                    cameraAnchor: () => ({ x: width * 0.5, y: height * 0.58 }),
                  },
                  Campaign,
                  PrototypeVisuals,
                  PrototypeCombatVisuals,
                  PrototypeEnemyVfxArt,
                  PrototypeSprites,
                  PrototypeGroundCache: null,
                  PrototypeMaterials: null,
                  chargePresentation: () => null,
                  isPaused: () => false,
                  now: () => 16000,
                });
              return { canvas, ctx, painter };
            }
            const old = make(PerfWs2BaselineRenderer),
              next = make(PrototypeRenderer),
              before = JSON.stringify(game);
            old.painter.draw();
            next.painter.draw();
            const a = old.ctx.getImageData(0, 0, width, height).data,
              b = next.ctx.getImageData(0, 0, width, height).data;
            let changed = 0,
              max = 0;
            for (let i = 0; i < a.length; i++) {
              const delta = Math.abs(a[i] - b[i]);
              if (delta) changed++;
              max = Math.max(max, delta);
            }
            results.push({
              zone,
              width,
              height,
              cameraZoom,
              changed,
              max,
              stateUnchanged: JSON.stringify(game) === before,
              spriteLoaded: PrototypeSprites.status().loaded,
            });
            old.canvas.width = 0;
            next.canvas.width = 0;
          }
      }
      return results;
    });
    for (const row of comparisons) {
      assert.equal(row.changed, 0, JSON.stringify(row));
      assert(row.stateUnchanged, JSON.stringify(row));
    }
    assert.deepEqual(errors, []);
    const target = path.join(root, 'test-results', 'perf-ws2-occlusion-' + engine + '.json');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify({ engine, comparisons, errors }, null, 2) + '\n');
    console.log(
      'PASS WS2 ' +
        engine +
        ' ' +
        comparisons.length +
        ' exact desktop/phone real-art Canvas comparisons; all campaign state unchanged; report ' +
        target,
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
