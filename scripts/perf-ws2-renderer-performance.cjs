'use strict';
// Compare the unchanged baseline directory with the complete candidate tree.
// Both pages have no app shell, rAF, simulation ticks or audio; this is a warmed
// frozen full-painter benchmark with forced Canvas readback, not active-play FPS.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const candidateRoot = path.resolve(
    process.env.PERF_WS2_CANDIDATE_ROOT || path.join(__dirname, '..'),
  ),
  baselineRoot = path.resolve(process.env.PERF_WS2_BASELINE_ROOT || '/tmp/perf-v09-baseline'),
  engine = process.env.PERF_WS2_BROWSER_ENGINE || 'webkit',
  rounds = Number(process.env.PERF_WS2_RENDER_ROUNDS || 8),
  iterations = Number(process.env.PERF_WS2_RENDER_ITERATIONS || 4);
assert(
  fs.existsSync(path.join(baselineRoot, 'src/prototype/renderer.js')),
  'Provide the unchanged baseline root',
);
const roots = { baseline: baselineRoot, candidate: candidateRoot },
  hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const server = http.createServer((req, res) => {
  const bits = decodeURIComponent((req.url || '/').split('?')[0]).split('/'),
    which = bits[1],
    name = bits.slice(2).join('/');
  if (!roots[which]) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (!name) {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>Frozen full renderer benchmark</title>');
    return;
  }
  const file = path.resolve(roots[which], name);
  if (
    !file.startsWith(roots[which] + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  ) {
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
function prepare({ zone, width, height }) {
  const game = new Campaign('normal', 'paladin', () => 0.7);
  game.enter(zone === 'crowd' ? 'vale' : zone);
  game.s.clock = 200;
  if (zone === 'crowd') {
    game.zone().enemies = [];
    game.s.party = [];
    for (let i = 0; i < 6; i++)
      game.s.party.push(
        game.unit(i % 2 ? 'archer' : 'soldier', game.hero.x + (i - 3) * 18, game.hero.y - 30),
      );
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24,
        p = { x: game.hero.x + Math.cos(a) * 105, y: game.hero.y + Math.sin(a) * 105 },
        e = game.makeEnemy(
          {
            species: i % 3 ? 'goblin' : 'archer',
            name: 'Audit ' + i,
            level: 1,
            hp: 1000,
            damage: 8,
            gold: 0,
            xp: 0,
          },
          p,
        );
      e.aggro = true;
      game.zone().enemies.push(e);
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d'),
    renderer = PrototypeRenderer.create({
      canvas,
      ctx,
      getGame: () => game,
      platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: width * 0.5, y: height * 0.58 }) },
      Campaign,
      PrototypeVisuals,
      PrototypeCombatVisuals,
      PrototypeEnemyVfxArt,
      PrototypeSprites,
      PrototypeMaterials,
      PrototypeGroundCache,
      chargePresentation: () => null,
      isPaused: () => false,
      now: () => 16000,
    });
  window.__perfWs2 = { game, canvas, ctx, renderer };
}
function sampledDraw(iterations) {
  const s = window.__perfWs2,
    start = performance.now();
  let alpha = 0;
  for (let i = 0; i < iterations; i++) {
    s.renderer.draw();
    const pixels = s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height).data;
    alpha += pixels[3];
  }
  return { ms: (performance.now() - start) / iterations, alpha };
}
async function proof() {
  const s = window.__perfWs2;
  s.renderer.draw();
  const bytes = s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height).data,
    digest = async (data) =>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), (n) =>
        n.toString(16).padStart(2, '0'),
      ).join('');
  return {
    pixels: await digest(bytes),
    state: await digest(new TextEncoder().encode(JSON.stringify(s.game))),
    render: s.renderer.metrics(),
    sprites: PrototypeSprites.status(),
    materials: PrototypeMaterials.status(),
  };
}
function summarize(samples) {
  const x = samples.slice().sort((a, b) => a - b);
  return {
    n: x.length,
    medianMs: x[Math.floor(x.length / 2)],
    p95Ms: x[Math.floor((x.length - 1) * 0.95)],
    meanMs: x.reduce((a, b) => a + b, 0) / x.length,
    samplesMs: samples,
  };
}
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
    const pages = {},
      errors = [];
    for (const which of ['baseline', 'candidate']) {
      const page = await browser.newPage();
      pages[which] = page;
      page.on('pageerror', (e) => errors.push(which + ': ' + e.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/' + which + '/');
      const inventory = require(path.join(roots[which], 'scripts/site-assets.cjs')).scripts,
        files = inventory
          .slice(1, inventory.indexOf('src/prototype/engine.js') + 1)
          .concat(
            [
              'visuals',
              'combat-visuals',
              'enemy-vfx-art',
              'sprite-format',
              'sprites',
              'material-contract',
              'materials',
              'ground-cache',
              'renderer',
            ].map((n) => 'src/prototype/' + n + '.js'),
          );
      for (const file of files)
        await page.addScriptTag({
          url: 'http://127.0.0.1:' + server.address().port + '/' + which + '/' + file,
        });
      await page.evaluate(async () => {
        await PrototypeSprites.preload();
        await PrototypeMaterials.load();
        await PrototypeSprites.warm(['hero:paladin'], { clips: true });
      });
    }
    const report = {
      baselineCommit: 'c6ce1af236bddd7ca881903499c4cf5de175f9e2',
      baselineRoot,
      candidateRoot,
      engine,
      browserVersion: browser.version(),
      measuredAt: new Date().toISOString(),
      rounds,
      iterations,
      scope:
        'Paired warmed frozen full renderer.draw plus full Canvas getImageData readback at 150% camera; no app/simulation/audio or physical-device FPS claim.',
      sourceHashes: Object.fromEntries(
        Object.entries(roots).map(([which, root]) => [
          which,
          Object.fromEntries(
            ['renderer', 'visuals', 'ground-cache', 'sprites', 'materials'].map((name) => [
              name,
              hash(fs.readFileSync(path.join(root, 'src/prototype/' + name + '.js'))),
            ]),
          ),
        ]),
      ),
      rows: [],
    };
    for (const zone of ['vale', 'highlands', 'crypt', 'crowd'])
      for (const [width, height] of [
        [1280, 800],
        [375, 812],
      ]) {
        const spec = { zone, width, height },
          initial = {};
        for (const which of ['baseline', 'candidate']) {
          const page = pages[which];
          await page.evaluate(prepare, spec);
          await page.evaluate(async () => {
            const region = ['vale', 'march', 'highlands', 'frontier', 'crown'][
              __perfWs2.game.regionIndex()
            ];
            await Promise.all(
              ['terrain:ground:' + region, 'terrain:road:' + region].map((key) =>
                PrototypeMaterials.ensure(key),
              ),
            );
            __perfWs2.renderer.draw();
          });
          await page.waitForFunction(
            () =>
              PrototypeSprites.status().queued === 0 &&
              PrototypeSprites.status().loading === 0 &&
              PrototypeMaterials.status().queued === 0 &&
              PrototypeMaterials.status().decoding === 0,
          );
          await page.evaluate(() => __perfWs2.renderer.draw());
          initial[which] = await page.evaluate(proof);
          await page.evaluate(sampledDraw, 2);
        }
        assert.equal(
          initial.candidate.pixels,
          initial.baseline.pixels,
          'Full baseline/candidate pixels ' + JSON.stringify(spec),
        );
        assert.equal(
          initial.candidate.state,
          initial.baseline.state,
          'Identical starting campaign ' + JSON.stringify(spec),
        );
        const samples = { baseline: [], candidate: [] };
        for (let round = 0; round < rounds; round++)
          for (const which of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
            const sample = await pages[which].evaluate(sampledDraw, iterations);
            samples[which].push(sample.ms);
          }
        const final = {};
        for (const which of ['baseline', 'candidate'])
          final[which] = await pages[which].evaluate(proof);
        for (const which of ['baseline', 'candidate']) {
          assert.equal(final[which].pixels, initial[which].pixels, 'Stable pixels ' + which);
          assert.equal(final[which].state, initial[which].state, 'State invariant ' + which);
        }
        const baseline = summarize(samples.baseline),
          candidate = summarize(samples.candidate);
        const row = {
          ...spec,
          baseline,
          candidate,
          medianReductionPercent: 100 * (1 - candidate.medianMs / baseline.medianMs),
          initial,
          final,
        };
        report.rows.push(row);
        console.log(
          JSON.stringify({
            zone,
            width,
            beforeMs: baseline.medianMs,
            afterMs: candidate.medianMs,
            reductionPercent: row.medianReductionPercent,
            pixelsIdentical: true,
            stateInvariant: true,
          }),
        );
        for (const page of Object.values(pages))
          await page.evaluate(() => {
            __perfWs2.canvas.width = 0;
            __perfWs2 = null;
          });
      }
    assert.deepEqual(errors, []);
    report.errors = errors;
    const target = path.resolve(
      process.argv[2] ||
        path.join(candidateRoot, 'test-results', 'perf-ws2-full-renderer-' + engine + '.json'),
    );
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
    console.log('PASS paired full-source painter benchmark and exact pixels/state: ' + target);
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
