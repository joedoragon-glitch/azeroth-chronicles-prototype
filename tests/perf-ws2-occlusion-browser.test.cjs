'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  crypto = require('node:crypto'),
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
  const errors = [],
    warmupFrames = 4,
    measuredSnapshots = 2;
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
    const page = await browser.newPage();
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
    const comparisons = await page.evaluate(
      async ({ warmupFrames, measuredSnapshots, sceneFilter }) => {
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
              if (
                sceneFilter &&
                !new RegExp(sceneFilter).test(zone + '-' + width + '-' + cameraZoom)
              )
                continue;
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
                control = make(PerfWs2BaselineRenderer),
                before = JSON.stringify(game),
                painters = [old, next, control];
              // Finish each canvas draw with readback before another context draws.
              // Batched draws are not a reproducible WebKit comparison even between
              // two baseline painters (see the retained diagnostic controls).
              function capture(item) {
                item.painter.draw();
                return item.ctx.getImageData(0, 0, width, height).data;
              }
              async function drainSprites() {
                const deadline = Date.now() + 10000;
                while (PrototypeSprites.status().queued || PrototypeSprites.status().loading) {
                  if (Date.now() > deadline) throw new Error('Sprite readiness timeout');
                  await new Promise((resolve) => setTimeout(resolve, 10));
                }
              }
              for (let frame = 0; frame < warmupFrames; frame++) {
                for (const item of painters) capture(item);
                await drainSprites();
                // Let fulfilled decode promises and browser presentation work finish.
                await new Promise((resolve) => setTimeout(resolve, 0));
              }
              const digest = async (bytes) =>
                Array.from(
                  new Uint8Array(await window.crypto.subtle.digest('SHA-256', bytes)),
                  (n) => n.toString(16).padStart(2, '0'),
                ).join('');
              const checkpoints = [];
              for (let snapshot = 0; snapshot < measuredSnapshots; snapshot++) {
                const frames = [],
                  states = [],
                  sprites = [];
                for (const item of painters) {
                  frames.push(capture(item));
                  states.push(JSON.stringify(game));
                  sprites.push(PrototypeSprites.status());
                }
                let changed = 0,
                  controlChanged = 0,
                  candidateControlChanged = 0,
                  max = 0;
                const deltas = [];
                for (let i = 0; i < frames[0].length; i++) {
                  const delta = Math.abs(frames[0][i] - frames[1][i]);
                  if (delta) changed++;
                  if (frames[0][i] !== frames[2][i]) controlChanged++;
                  if (frames[1][i] !== frames[2][i]) candidateControlChanged++;
                  max = Math.max(max, delta);
                  if ((delta || frames[0][i] !== frames[2][i]) && deltas.length < 20)
                    deltas.push({
                      x: Math.floor(i / 4) % width,
                      y: Math.floor(i / 4 / width),
                      channel: i % 4,
                      baseline: frames[0][i],
                      candidate: frames[1][i],
                      control: frames[2][i],
                    });
                }
                checkpoints.push({
                  snapshot,
                  changed,
                  controlChanged,
                  candidateControlChanged,
                  max,
                  deltas,
                  pixels: Object.fromEntries(
                    await Promise.all(
                      ['baseline', 'candidate', 'control'].map(async (key, i) => [
                        key,
                        await digest(frames[i]),
                      ]),
                    ),
                  ),
                  state: Object.fromEntries(
                    await Promise.all(
                      ['baseline', 'candidate', 'control'].map(async (key, i) => [
                        key,
                        await digest(new TextEncoder().encode(states[i])),
                      ]),
                    ),
                  ),
                  stateUnchanged: states.every((state) => state === before),
                  sprites,
                  ...(changed || controlChanged || candidateControlChanged
                    ? {
                        failurePngs: painters.map(
                          (item) => item.canvas.toDataURL('image/png').split(',')[1],
                        ),
                      }
                    : {}),
                });
              }
              results.push({ zone, width, height, cameraZoom, checkpoints });
              for (const item of painters) item.canvas.width = 0;
            }
        }
        return results;
      },
      {
        warmupFrames,
        measuredSnapshots,
        sceneFilter: process.env.PERF_WS2_OCCLUSION_SCENE_FILTER || '',
      },
    );
    const target = path.join(root, 'test-results', 'perf-ws2-occlusion-' + engine + '.json');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const report = {
      engine,
      browserVersion: browser.version(),
      warmupFrames,
      measuredSnapshots,
      presentationTimeMs: 16000,
      baselineControl:
        'independent canvas/painter using the unchanged occlusion function and the same scene/sprite subsystem',
      sourceHashes: {
        renderer: crypto.createHash('sha256').update(source).digest('hex'),
        modules: Object.fromEntries(
          names.map((file) => [
            file,
            crypto
              .createHash('sha256')
              .update(fs.readFileSync(path.join(root, file)))
              .digest('hex'),
          ]),
        ),
        baselineOcclusion: crypto
          .createHash('sha256')
          .update(Baseline.occlusionPairs.toString())
          .digest('hex'),
      },
      comparisons,
      errors,
    };
    // Retain failing pixel controls and resource status before any exact assertion.
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
    for (const row of comparisons) {
      assert.equal(
        row.checkpoints.length,
        measuredSnapshots,
        JSON.stringify({
          zone: row.zone,
          width: row.width,
          height: row.height,
          cameraZoom: row.cameraZoom,
        }),
      );
      for (const checkpoint of row.checkpoints) {
        if (checkpoint.failurePngs)
          for (const [i, png] of checkpoint.failurePngs.entries())
            fs.writeFileSync(
              target.replace(
                '.json',
                '-' +
                  row.zone +
                  '-' +
                  row.width +
                  '-' +
                  row.cameraZoom +
                  '-' +
                  checkpoint.snapshot +
                  '-' +
                  i +
                  '.png',
              ),
              Buffer.from(png, 'base64'),
            );
        const { failurePngs, ...summary } = checkpoint;
        const diagnostic = JSON.stringify({ ...row, checkpoints: [summary] });
        assert.equal(checkpoint.changed, 0, diagnostic);
        assert.equal(checkpoint.controlChanged, 0, diagnostic);
        assert.equal(checkpoint.candidateControlChanged, 0, diagnostic);
        assert(checkpoint.stateUnchanged, diagnostic);
        for (const status of checkpoint.sprites) {
          assert.equal(status.queued, 0, diagnostic);
          assert.equal(status.loading, 0, diagnostic);
        }
      }
    }
    assert(comparisons.length > 0, 'At least one scene must be compared');
    if (!process.env.PERF_WS2_OCCLUSION_SCENE_FILTER) assert.equal(comparisons.length, 54);
    assert.deepEqual(errors, []);
    console.log(
      'PASS WS2 ' +
        engine +
        ' ' +
        comparisons.length +
        ' scenes with ' +
        measuredSnapshots +
        ' exact baseline/candidate/control desktop/phone snapshots each; all campaign state unchanged; report ' +
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
