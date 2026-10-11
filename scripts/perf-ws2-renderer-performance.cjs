'use strict';
// Compare the unchanged baseline directory with the complete candidate tree.
// Both pages have no app shell, rAF, simulation ticks or audio; this is a warmed
// frozen full-painter benchmark with forced Canvas readback, not active-play FPS.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  sharp = require('sharp');
const candidateRoot = path.resolve(
    process.env.PERF_WS2_CANDIDATE_ROOT || path.join(__dirname, '..'),
  ),
  baselineRoot = path.resolve(process.env.PERF_WS2_BASELINE_ROOT || '/tmp/perf-v09-baseline'),
  engine = process.env.PERF_WS2_BROWSER_ENGINE || 'webkit',
  rounds = Number(process.env.PERF_WS2_RENDER_ROUNDS || 8),
  iterations = Number(process.env.PERF_WS2_RENDER_ITERATIONS || 4),
  warmupFrames = Number(process.env.PERF_WS2_RENDER_WARMUP || 12);
assert(
  fs.existsSync(path.join(baselineRoot, 'src/prototype/renderer.js')),
  'Provide the unchanged baseline root',
);
const roots = { baseline: baselineRoot, candidate: candidateRoot, control: baselineRoot },
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
    start = window.__perfWs2WallNow();
  let alpha = 0;
  for (let i = 0; i < iterations; i++) {
    s.renderer.draw();
    const pixels = s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height).data;
    alpha += pixels[3];
  }
  return { ms: (window.__perfWs2WallNow() - start) / iterations, alpha };
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
    ...(window.__perfWs2Diagnostic ? { png: s.canvas.toDataURL('image/png').split(',')[1] } : {}),
  };
}
function summarize(samples) {
  if (!samples.length) return { n: 0, samplesMs: [] };
  const x = samples.slice().sort((a, b) => a - b);
  return {
    n: x.length,
    medianConvention: 'upper median (sorted samples[Math.floor(n / 2)])',
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
    for (const which of ['baseline', 'candidate', 'control']) {
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
        window.__perfWs2WallNow = performance.now.bind(performance);
        performance.now = () => 16000;
        window.__perfWs2Diagnostic = true;
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
      warmupFrames,
      diagnosticOnly: Boolean(process.env.PERF_WS2_RENDER_DIAGNOSTIC),
      presentationTimeMs: 16000,
      baselineControlRoot: baselineRoot,
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
        if (
          process.env.PERF_WS2_SCENE_FILTER &&
          !new RegExp(process.env.PERF_WS2_SCENE_FILTER).test(zone + '-' + width)
        )
          continue;
        const spec = { zone, width, height },
          initial = {};
        for (const which of ['baseline', 'candidate', 'control']) {
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
          await page.evaluate(async (frames) => {
            for (let i = 0; i < frames; i++) {
              __perfWs2.renderer.draw();
              __perfWs2.ctx.getImageData(0, 0, __perfWs2.canvas.width, __perfWs2.canvas.height);
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }, warmupFrames);
          initial[which] = await page.evaluate(proof);
          const initialDir = path.join(
            candidateRoot,
            'test-results',
            'perf-ws2-diagnostic',
            zone + '-' + width,
          );
          fs.mkdirSync(initialDir, { recursive: true });
          fs.writeFileSync(
            path.join(initialDir, which + '-initial.png'),
            Buffer.from(initial[which].png, 'base64'),
          );
          delete initial[which].png;
          await page.evaluate(sampledDraw, 2);
        }
        if (
          process.env.PERF_WS2_RENDER_DIAGNOSTIC ||
          initial.control.pixels !== initial.baseline.pixels ||
          initial.candidate.pixels !== initial.baseline.pixels
        ) {
          const dir = path.join(
            candidateRoot,
            'test-results',
            'perf-ws2-diagnostic',
            zone + '-' + width,
          );
          fs.mkdirSync(dir, { recursive: true });
          const images = {};
          for (const which of ['baseline', 'candidate', 'control']) {
            const base64 = await pages[which].evaluate(
              () => __perfWs2.canvas.toDataURL('image/png').split(',')[1],
            );
            const png = Buffer.from(base64, 'base64');
            fs.writeFileSync(path.join(dir, which + '.png'), png);
            images[which] = await sharp(png).ensureAlpha().raw().toBuffer();
          }
          const differences = {};
          for (const which of ['candidate', 'control']) {
            const a = images.baseline,
              b = images[which];
            let changedPixels = 0,
              maxDelta = 0,
              minX = width,
              minY = height,
              maxX = -1,
              maxY = -1;
            for (let i = 0; i < a.length; i += 4) {
              let changed = false;
              for (let c = 0; c < 4; c++) {
                const d = Math.abs(a[i + c] - b[i + c]);
                maxDelta = Math.max(maxDelta, d);
                if (d) changed = true;
              }
              if (changed) {
                changedPixels++;
                const x = (i / 4) % width,
                  y = Math.floor(i / 4 / width);
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
            differences[which] = {
              changedPixels,
              maxDelta,
              bounds: changedPixels ? { minX, minY, maxX, maxY } : null,
            };
          }
          fs.writeFileSync(
            path.join(dir, 'comparison.json'),
            JSON.stringify(
              { spec, initial, differences, browserVersion: browser.version() },
              null,
              2,
            ) + '\n',
          );
          console.log(
            JSON.stringify({
              diagnostics: dir,
              differences,
              stateEqual: initial.candidate.state === initial.baseline.state,
              baselineControlStateEqual: initial.control.state === initial.baseline.state,
            }),
          );
        }
        assert.equal(
          initial.control.pixels,
          initial.baseline.pixels,
          'Baseline-versus-baseline negative control pixels ' + JSON.stringify(spec),
        );
        assert.equal(
          initial.control.state,
          initial.baseline.state,
          'Baseline-versus-baseline negative control state ' + JSON.stringify(spec),
        );
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
        const samples = { baseline: [], candidate: [], control: [] },
          checkpoints = [];
        for (
          let round = 0;
          round < (process.env.PERF_WS2_RENDER_DIAGNOSTIC ? 0 : rounds);
          round++
        ) {
          for (const which of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
            const sample = await pages[which].evaluate(sampledDraw, iterations);
            samples[which].push(sample.ms);
          }
          // Advance the independent baseline control by the same draw count,
          // then compare all three exact outputs at each measured checkpoint.
          const controlSample = await pages.control.evaluate(sampledDraw, iterations);
          samples.control.push(controlSample.ms);
          const checkpoint = { round };
          for (const which of ['baseline', 'candidate', 'control']) {
            await pages[which].evaluate(() => (window.__perfWs2Diagnostic = false));
            checkpoint[which] = await pages[which].evaluate(proof);
            await pages[which].evaluate(() => (window.__perfWs2Diagnostic = true));
            assert.equal(
              checkpoint[which].state,
              initial[which].state,
              'State invariant ' + which + ' round ' + round,
            );
          }
          assert.equal(
            checkpoint.candidate.pixels,
            checkpoint.baseline.pixels,
            'Exact paired pixels round ' + round + ' ' + JSON.stringify(spec),
          );
          assert.equal(
            checkpoint.control.pixels,
            checkpoint.baseline.pixels,
            'Exact independent baseline control pixels round ' + round + ' ' + JSON.stringify(spec),
          );
          checkpoints.push(checkpoint);
        }
        const final = {};
        for (const which of ['baseline', 'candidate', 'control'])
          final[which] = await pages[which].evaluate(proof);
        const finalDir = path.join(
          candidateRoot,
          'test-results',
          'perf-ws2-diagnostic',
          zone + '-' + width,
        );
        fs.mkdirSync(finalDir, { recursive: true });
        for (const which of ['baseline', 'candidate', 'control']) {
          fs.writeFileSync(
            path.join(finalDir, which + '-final.png'),
            Buffer.from(final[which].png, 'base64'),
          );
          delete final[which].png;
        }
        fs.writeFileSync(
          path.join(finalDir, 'final-comparison.json'),
          JSON.stringify({ spec, initial, final }, null, 2) + '\n',
        );
        for (const which of ['baseline', 'candidate', 'control']) {
          assert.equal(final[which].state, initial[which].state, 'State invariant ' + which);
        }
        assert.equal(
          final.candidate.pixels,
          final.baseline.pixels,
          'Exact paired final pixels ' + JSON.stringify(spec),
        );
        assert.equal(
          final.control.pixels,
          final.baseline.pixels,
          'Exact independent baseline final pixels ' + JSON.stringify(spec),
        );
        const baseline = summarize(samples.baseline),
          candidate = summarize(samples.candidate),
          control = summarize(samples.control);
        const row = {
          ...spec,
          baseline,
          candidate,
          control,
          sameSourceControlDifferencePercent: 100 * (control.medianMs / baseline.medianMs - 1),
          medianReductionPercent: 100 * (1 - candidate.medianMs / baseline.medianMs),
          initial,
          final,
          checkpoints,
          rasterStableAcrossDraws: Object.fromEntries(
            ['baseline', 'candidate', 'control'].map((which) => [
              which,
              initial[which].pixels === final[which].pixels,
            ]),
          ),
        };
        report.rows.push(row);
        console.log(
          JSON.stringify({
            zone,
            width,
            beforeMs: baseline.medianMs,
            afterMs: candidate.medianMs,
            independentBaselineControlMs: control.medianMs,
            sameSourceControlDifferencePercent: row.sameSourceControlDifferencePercent,
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
