'use strict';
// #748: one Campaign, actual GPU + Canvas composition, deterministic presentation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.PARITY_OUT || path.join(root, 'test-artifacts/parity-748'));
const scripts = require('../scripts/site-assets.cjs').scripts.filter((p) => !p.endsWith('/app.js'));
const html =
  '<meta charset="utf-8"><style>body{margin:0;background:#000}canvas{position:fixed;inset:0}#world{z-index:2}</style><canvas id="world" width="912" height="600"></canvas>' +
  scripts.map((p) => '<script src="/' + p + '"></script>').join('');
const server = http.createServer((req, res) => {
  const rel = new URL(req.url, 'http://local').pathname;
  if (rel === '/') {
    res.setHeader('Content-Type', 'text/html');
    return res.end(html);
  }
  const file = path.resolve(root, '.' + decodeURIComponent(rel));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404;
    return res.end();
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
async function changedPixels(a, b, crop) {
  const ctx = createCanvas(crop.width, crop.height).getContext('2d'),
    data = [];
  for (const file of [a, b]) {
    ctx.clearRect(0, 0, crop.width, crop.height);
    ctx.drawImage(
      await loadImage(file),
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );
    data.push(ctx.getImageData(0, 0, crop.width, crop.height).data);
  }
  let changed = 0;
  for (let i = 0; i < data[0].length; i += 4)
    if ([0, 1, 2].some((j) => Math.abs(data[0][i + j] - data[1][i + j]) > 5)) changed++;
  return changed;
}
async function main() {
  fs.mkdirSync(out, { recursive: true });
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({
      ...(process.env.CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
        : {}),
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--enable-webgl',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    });
    const viewport =
      process.env.PARITY_PHONE === '1' ? { width: 844, height: 390 } : { width: 912, height: 600 };
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    await page.evaluate(
      async (config) => {
        window.optimized = config.optimized;
        window.g = new Campaign('normal', 'paladin', () => 0.73);
        window.clock = 0;
        PrototypeSprites.timeMs = () => window.clock;
        window.originalCampaign = g;
        const canvas = document.querySelector('#world');
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        window.platform = {
          cameraZoom: config.zoom,
          cameraAnchor: () => ({ x: innerWidth * 0.5, y: innerHeight * 0.55 }),
        };
        window.opts = {
          canvas,
          ctx: canvas.getContext('2d'),
          getGame: () => g,
          platform,
          chargePresentation: () => null,
          isPaused: () => false,
          Campaign,
          PrototypeVisuals,
          PrototypeCombatVisuals,
          PrototypeSprites,
          PrototypeMaterials,
          now: () => clock,
        };
        window.painter = PrototypeRenderer.create(opts);
        painter.setOptimizationMode(optimized);
        await PrototypeSprites.preload();
        await PrototypeSprites.warm(
          Object.keys((await (await fetch('/assets/sprites/manifest.json')).json()).sprites),
          { variants: true, clips: true },
        );
      },
      {
        zoom: Number(process.env.PARITY_ZOOM || 1.5),
        optimized: process.env.PARITY_OPTIMIZED !== '0',
      },
    );
    const rows = [],
      lifecycle = [],
      benchmarks = [];
    for (const fixture of (
      process.env.PARITY_FIXTURES ||
      'warlord,ridge,regalia,cover,registered,wildlife,lamp,flight,bundle,keeper,pursuit,idle'
    ).split(',')) {
      await page.evaluate((name) => {
        const family = name === 'ridge' ? 'ridge' : 'warlord';
        g.enter(g.boss(family).region);
        const z = g.zone(),
          b = z.enemies.find((e) => e.family === family && e.type === 'boss');
        if (!b && ['warlord', 'ridge', 'regalia'].includes(name))
          throw Error('Native boss missing: ' + family);
        z.props = [];
        z.buildings = [];
        z.npcs = [];
        z.enemies = [];
        g.s.party = [];
        g.s.loot = [];
        g.s.projectiles = [];
        g.s.clock = 120;
        g.s.time = 100;
        Object.assign(g.hero, { x: 1000, y: 1000, path: [], order: null });
        if (['warlord', 'ridge', 'regalia'].includes(name)) {
          Object.assign(b, { x: 1080, y: 960, hp: b.maxHp, aggro: true });
          z.enemies = [b];
          b.ashCloud = null;
          b.ledgerMarkUntil = 0;
          if (name === 'warlord') b.ashCloud = { x: 1000, y: 1000, expires: 106 };
          if (name === 'ridge') {
            b.ledgerMarkedId = 'hero';
            b.ledgerMarkUntil = 106;
            b.ledgerOpen = true;
          }
          if (name === 'regalia') {
            b.form = 'true';
            b.rangedAim = true;
          }
        }
        if (name === 'registered') {
          g.enter('vale');
          Object.assign(g.hero, { x: 1000, y: 1000, path: [], order: null });
          const v = g.zone();
          const e = v.enemies.find((e) =>
            PrototypeSprites.definitionFor({ ...e, renderKind: 'enemy' }, 0, false),
          );
          if (!e) throw Error('No native registered enemy');
          v.enemies = [e];
          v.props = [];
          v.buildings = [];
          v.npcs = [];
          Object.assign(e, {
            x: 1080,
            y: 960,
            form: 'true',
            rangedAim: { x: 1000, y: 1000 },
            frenzy: true,
          });
        }
        if (name === 'cover')
          z.props = [
            {
              id: 'parity-cover',
              structure: 'dead-tree',
              x: 1020,
              y: 1020,
              r: 28,
              decorative: true,
            },
          ];
        if (name === 'wildlife')
          z.props = [
            { id: 'parity-sheep', structure: 'pasture-sheep', x: 1040, y: 1000, decorative: true },
          ];
        if (name === 'lamp') {
          g.s.clock = 480;
          z.props = [
            {
              id: 'parity-lamp',
              structure: 'roadside-lantern',
              x: 1040,
              y: 1000,
              decorative: true,
            },
          ];
        }
        if (name === 'flight') {
          g.enter('abyss');
          const room = g.zone(),
            dragon = room.enemies.find((e) => e.family === 'abyss' && e.type === 'boss');
          if (!dragon) throw Error('Native Abyss boss missing');
          Object.assign(g.hero, { x: 750, y: 750 });
          Object.assign(dragon, {
            x: 800,
            y: 750,
            hp: dragon.maxHp,
            motion: { aerial: true, flightPath: [{ x: 900, y: 700 }] },
          });
          room.buildings = [];
          room.npcs = [];
          room.enemies = [dragon];
        }
        if (name === 'bundle') {
          g.enter('supply-vale');
          const room = g.zone(),
            bundle = g.visibleNPCs().find((e) => e.kind === 'bundle');
          if (!bundle) throw Error('Native uncollected supply bundle missing');
          Object.assign(g.hero, { x: bundle.x - 20, y: bundle.y });
          room.enemies = [];
          room.buildings = [];
          room.npcs = [bundle];
        }
        if (name === 'keeper') {
          // Explicit authored visual fixture: normal/TRUE defeat eligibility is
          // covered by the native Archive suite, never bypassed by production.
          g.enter('archive');
          g.s.normal.archive = true;
          const room = g.zone(),
            keeper = room.npcs.find((e) => e.kind === 'keeper');
          if (!keeper) throw Error('Native Keeper missing');
          Object.assign(g.hero, { x: keeper.x - 90, y: keeper.y });
          room.enemies = [];
          room.buildings = [];
          room.npcs = [keeper];
          if (!g.visibleNPCs().includes(keeper)) throw Error('Keeper fixture eligibility failed');
        }
        if (name === 'idle') {
          // Only a stationary hero remains: presentation motion is visible
          // while the actual world position and gameplay clock stay unchanged.
          g.enter('archive');
          const room = g.zone();
          room.props = [];
          room.buildings = [];
          room.npcs = [];
          room.enemies = [];
          room.escort = null;
          Object.assign(g.hero, { x: 1000, y: 1000, path: [], order: null });
        }
        if (name === 'pursuit') {
          g.enter('vale');
          const room = g.zone(),
            enemy = room.enemies.find((e) => e.type === 'mob');
          if (!enemy) throw Error('Native pursuit actor missing');
          Object.assign(g.hero, { x: 1000, y: 1000 });
          Object.assign(enemy, { x: 1080, y: 960, pursuitBurst: 0.8 });
          room.enemies = [enemy];
          room.props = [];
          room.buildings = [];
          room.npcs = [];
        }
        if (['march', 'crown'].includes(name)) g.enter(name);
        window.clock = 0;
      }, fixture);
      console.log('PREPARE ' + fixture);
      await page.evaluate(async () => {
        window.gpu = PrototypePixiExperimental.create({
          worldCanvas: opts.canvas,
          viewport: opts.canvas,
          platform,
          getGame: () => g,
          canvasRenderer: painter,
          getOptimizationMode: () => optimized,
          getRendererOptions: () => opts,
          onFailure: (e) => {
            throw Error(JSON.stringify(e));
          },
        });
        if (!(await gpu.prepare())) {
          const e = g.zone().props.find((e) => e.id === 'treasury-1'),
            surface = document.createElement('canvas');
          surface.width = surface.height = 864;
          const c = surface.getContext('2d');
          c.scale(1.5, 1.5);
          const visual = e ? painter.presentEntity(e, 'prop') : null;
          if (visual) PrototypeVisuals.draw(c, visual, { x: 288, y: 460 }, g.regionIndex(), false);
          let pixels = 0;
          for (const a of c.getImageData(0, 0, 864, 864).data.filter((v, i) => i % 4 === 3))
            if (a) pixels++;
          throw Error(
            JSON.stringify({ status: gpu.status(), visual, region: g.regionIndex(), pixels }),
          );
        }
      });
      for (const mode of ['canvas', 'pixi']) {
        await page.evaluate((mode) => {
          if (mode === 'canvas') {
            gpu.deactivate();
            painter.setRenderLayer('full');
          } else {
            gpu.activate();
            painter.setRenderLayer('overlay');
          }
        }, mode);
        for (const time of [0, 7000]) {
          const status = await page.evaluate(
            ({ mode, time }) => {
              window.clock = time;
              // Time changes presentation only; gameplay expiration is a separate state fixture.
              const saved = JSON.stringify(g.s);
              if (mode === 'pixi') gpu.draw();
              painter.draw();
              if (g !== originalCampaign || JSON.stringify(g.s) !== saved)
                throw Error('Rendering mutated Campaign state');
              return {
                zone: g.zoneId,
                hero: { x: g.hero.x, y: g.hero.y },
                time: g.s.time,
                clock,
                zoom: platform.cameraZoom,
                renderer: mode,
                gpu: gpu.status(),
                canvas: painter.metrics(),
              };
            },
            { mode, time },
          );
          if (mode === 'pixi')
            assert(status.gpu.active && !status.gpu.lastError, 'No GPU fallback');
          const name = fixture + '-' + mode + '-' + time + '.png';
          await page.screenshot({ path: path.join(out, name) });
          rows.push({ fixture, mode, time, file: name, status });
          if (mode === 'pixi' && process.env.PARITY_ASSERT !== '0') {
            const m = status.gpu.sceneMetrics;
            if (fixture === 'warlord') assert.equal(m.worldIndicators, 1);
            if (fixture === 'ridge') assert.equal(m.groundMarks, 1);
            if (fixture === 'registered') assert.equal(m.accessoryActors, 1);
            if (fixture === 'cover')
              assert(
                status.canvas.outlineMasks > 0,
                'Concealed hero receives an alpha-clipped contour',
              );
            if (fixture === 'lamp')
              assert(m.lightFixtures > 0, 'Night fixtures are painted separately from glows');
            if (['regalia', 'flight', 'bundle', 'pursuit'].includes(fixture))
              assert(m.actorUnderlays > 0, fixture + ' native underlay');
            if (['ridge', 'keeper'].includes(fixture))
              assert(m.actorOverlays > 0, fixture + ' native attachment');
          }
        }
        await page.evaluate(() => {
          window.clock = 0;
        });
      }
      if (process.env.PARITY_ASSERT !== '0') {
        const pixi = rows.filter((r) => r.fixture === fixture && r.mode === 'pixi');
        assert.equal(
          pixi[0].status.gpu.proceduralBakes,
          pixi[1].status.gpu.proceduralBakes,
          'Presentation time must not rebake bodies',
        );
        assert.equal(
          pixi[0].status.gpu.sceneMetrics.textureSources,
          pixi[1].status.gpu.sceneMetrics.textureSources,
          'Stable GPU texture count',
        );
        if (fixture === 'idle') {
          const crop = {
            x: Math.round(viewport.width * 0.5 - 75),
            y: Math.round(viewport.height * 0.55 - 105),
            width: 150,
            height: 120,
          };
          for (const mode of ['canvas', 'pixi']) {
            const n = await changedPixels(
              path.join(out, fixture + '-' + mode + '-0.png'),
              path.join(out, fixture + '-' + mode + '-7000.png'),
              crop,
            );
            assert(n > 15, mode + ' idle body must visibly move without simulation or texture rebake');
            lifecycle.push({ fixture, mode, changedPixels: n, crop });
          }
        }
        if (fixture === 'wildlife') {
          const crop = {
            x: Math.round(viewport.width * 0.5 - 55),
            y: Math.round(viewport.height * 0.55 - 45),
            width: 180,
            height: 130,
          };
          for (const mode of ['canvas', 'pixi']) {
            const n = await changedPixels(
              path.join(out, fixture + '-' + mode + '-0.png'),
              path.join(out, fixture + '-' + mode + '-7000.png'),
              crop,
            );
            assert(n > 100, mode + ' wildlife must visibly move');
            lifecycle.push({ fixture, mode, changedPixels: n, crop });
          }
        }
        if (['warlord', 'ridge', 'registered', 'lamp'].includes(fixture)) {
          const negative = await page.evaluate((name) => {
            if (name === 'lamp') g.s.clock = 120;
            else if (name === 'registered')
              Object.assign(g.zone().enemies[0], {
                form: 'normal',
                frenzy: false,
                rangedAim: null,
              });
            else g.s.time = 106;
            gpu.draw();
            painter.draw();
            return gpu.status();
          }, fixture);
          if (fixture === 'warlord')
            assert.equal(negative.sceneMetrics.worldIndicators, 0, 'Ash expires at exact boundary');
          if (fixture === 'ridge')
            assert.equal(negative.sceneMetrics.groundMarks, 0, 'Mark expires at exact boundary');
          if (fixture === 'registered')
            assert.equal(
              negative.sceneMetrics.accessoryActors,
              0,
              'Normal actor has no stale accessories',
            );
          if (fixture === 'lamp')
            assert.equal(
              negative.sceneMetrics.lightFixtures,
              0,
              'Daylight removes luminous fixture overlay',
            );
          lifecycle.push({ fixture, negative });
          await page.screenshot({ path: path.join(out, fixture + '-inactive.png') });
        }
      }
      if (fixture === 'cover' && process.env.PARITY_PERF === '1') {
        benchmarks.push(
          ...(await page.evaluate(() => {
            const room = g.zone(),
              base = structuredClone(g.hero),
              result = [];
            for (const count of [1, 8, 24, 48]) {
              room.enemies = Array.from({ length: count - 1 }, (_, i) => ({
                ...base,
                id: 'benchmark-' + i,
                renderKind: 'enemy',
                species: 'goblin',
                type: 'mob',
                form: 'normal',
                x: 1000 + (i % 6) * 3,
                y: 1000 + Math.floor(i / 6) * 3,
                neutral: false,
              }));
              gpu.draw();
              painter.draw();
              const before = gpu.status(),
                samples = [];
              for (let j = 0; j < 24; j++) {
                const start = performance.now();
                gpu.draw();
                painter.draw();
                samples.push(performance.now() - start);
              }
              samples.sort((a, b) => a - b);
              const after = gpu.status();
              if (after.proceduralBakes !== before.proceduralBakes)
                throw Error('Steady crowd rerasterized bodies');
              result.push({
                count,
                p50: samples[12],
                p95: samples[22],
                outline: painter.metrics().outlineBuffers,
                masks: painter.metrics().outlineMasks,
                before,
                after,
              });
            }
            return result;
          })),
        );
      }
      await page.evaluate(() => gpu.dispose());
      console.log('CAPTURED ' + fixture);
      fs.writeFileSync(
        path.join(out, 'checkpoint.json'),
        JSON.stringify({ rows, lifecycle, benchmarks, errors }, null, 2),
      );
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, 'evidence.json'),
      JSON.stringify(
        {
          head: cp
            .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
            .trim(),
          engine: await browser.version(),
          viewport,
          zoom: process.env.PARITY_ZOOM || 1.5,
          optimized: process.env.PARITY_OPTIMIZED !== '0',
          rows,
          lifecycle,
          benchmarks,
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
