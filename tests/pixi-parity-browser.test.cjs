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
  '<meta charset="utf-8"><style>body{margin:0;background:#000}canvas{position:fixed;inset:0}#world{z-index:2;width:100vw;height:100vh}</style><canvas id="world" width="912" height="600"></canvas>' +
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
    const viewportText =
      process.env.PARITY_VIEWPORT || (process.env.PARITY_PHONE === '1' ? '844x390' : '912x600');
    if (!/^\d+x\d+$/.test(viewportText)) throw Error('Invalid PARITY_VIEWPORT: '+viewportText);
    const [width, height] = viewportText.split('x').map(Number);
    const deviceScaleFactor = Number(process.env.PARITY_DPR || 1);
    const backingRatio = Number(process.env.PARITY_BACKING_RATIO || 1);
    if (![width, height, deviceScaleFactor, backingRatio].every((v) => Number.isFinite(v) && v > 0))
      throw Error('Invalid PARITY_VIEWPORT, PARITY_DPR or PARITY_BACKING_RATIO');
    const viewport = { width, height };
    const page = await browser.newPage({ viewport, deviceScaleFactor });
    if (process.env.PARITY_REDUCED_MOTION === '1')
      await page.emulateMedia({ reducedMotion: 'reduce' });
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
        canvas.width = Math.round(innerWidth * config.backingRatio);
        canvas.height = Math.round(innerHeight * config.backingRatio);
        const paintContext = canvas.getContext('2d');
        paintContext.setTransform(config.backingRatio, 0, 0, config.backingRatio, 0, 0);
        window.platform = {
          cameraZoom: config.zoom,
          cameraAnchor: () => ({ x: innerWidth * 0.5, y: innerHeight * 0.55 }),
        };
        window.opts = {
          canvas,
          ctx: paintContext,
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
        backingRatio,
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
        if (['registered', 'ringleader'].includes(name)) {
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
            form: name === 'ringleader' ? 'ringleader' : 'true',
            rangedAim: { x: 1000, y: 1000 },
            frenzy: true,
          });
        }
        if (name === 'cover' || name === 'occlusion-idle')
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
        if (name === 'ferry') {
          // The real Highlands ferry is reachable at its boarding point
          // but painted at the separately authored hull position.
          g.enter('highlands');
          const harbor = Campaign.rules.harbors.highlands;
          const room = g.zone();
          const ferry = room.npcs.find((n) => n.id === 'return' && n.harbor);
          if (!ferry || !harbor?.vessel) throw Error('Native Highlands ferry not admitted');
          window.parityFerry = ferry;
          Object.assign(g.hero, {
            x: ferry.x + 145,
            y: ferry.y + 35,
            path: [],
            order: null,
          });
          room.props = [];
          room.buildings = [];
          room.enemies = [];
          room.npcs = [ferry];
          room.escort = null;
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
        const crownView = {
          'crown-courtyard-day': [880, 2000, 245],
          'crown-courtyard-night': [880, 2000, 480],
          'crown-fortress-freight': [3085, 2325, 245],
          'crown-fortress-checkpoint': [3160, 2910, 480],
          'crown-fortress-gate': [3060, 3040, 480],
        }[name];
        if (crownView) {
          if (!g.enter('crown') || g.zone().id !== 'crown') {
            throw Error('Crown fixture did not enter Dark Crown: ' + name);
          }
          Object.assign(g.hero, g.safe(crownView[0], crownView[1], 'crown'));
          g.s.clock = crownView[2];
        }
        window.clock = 0;
      }, fixture);
      console.log('PREPARE ' + fixture);
      await page.evaluate(async () => {
        window.gpu = PrototypePixiExperimental.create({
          worldCanvas: opts.canvas,
          // Logical CSS viewport is distinct from high-DPI Canvas backing.
          // Using the backing canvas here would force effectiveRatio() to 1x.
          viewport: { width: innerWidth, height: innerHeight },
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
            ({ mode, time, fixture }) => {
              window.clock = time;
              // Time changes presentation only; gameplay expiration is a separate state fixture.
              const saved = JSON.stringify(g.s);
              if (mode === 'pixi') gpu.draw();
              // Intercept the real retained-mask canvas translation in this
              // deterministic Pixi+Canvas composite, not the production path.
              const watchMask = fixture === 'occlusion-idle' && mode === 'pixi';
              const maskMoves = [], maskDestinations = [];
              const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
              if (watchMask) CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
                if (this.canvas === opts.canvas && image instanceof HTMLCanvasElement &&
                    image.width <= 384 && image.height <= 384)
                  maskDestinations.push({ x: args[0], y: args[1] });
                return originalDrawImage.call(this, image, ...args);
              };
              const originalTranslate = CanvasRenderingContext2D.prototype.translate;
              if (watchMask)
                CanvasRenderingContext2D.prototype.translate = function (x, y) {
                  if (this.canvas !== opts.canvas && this.canvas.width <= 384 && this.canvas.height <= 384)
                    maskMoves.push({ x, y, canvasWidth: this.canvas.width });
                  return originalTranslate.call(this, x, y);
                };
              try {
                painter.draw();
              } finally {
                if (watchMask) {
                  CanvasRenderingContext2D.prototype.translate = originalTranslate;
                  CanvasRenderingContext2D.prototype.drawImage = originalDrawImage;
                }
              }
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
                occlusion: watchMask
                  ? {
                      mask: maskMoves[0] && maskDestinations[0] ? {
                        ...maskMoves[0],
                        x: maskMoves[0].x + maskDestinations[0].x,
                        y: maskMoves[0].y + maskDestinations[0].y,
                      } : null,
                      maskCount: maskMoves.length,
                      ground: painter.screen(g.hero),
                      body: painter.visualPositionFor(painter.presentEntity(g.hero, 'hero')),
                    }
                  : null,
              };
            },
            { mode, time, fixture },
          );
          if (mode === 'pixi') {
            assert(status.gpu.active && !status.gpu.lastError, 'No GPU fallback');
            assert(Math.abs(status.gpu.pixelRatio - backingRatio) < 0.01,
              'Pixi effective backing ratio ' + status.gpu.pixelRatio +
              ' must match Canvas ratio ' + backingRatio);
          }
          const name = fixture + '-' + mode + '-' + time + '.png';
          await page.screenshot({ path: path.join(out, name) });
          rows.push({ fixture, mode, time, file: name, status });
          if (mode === 'pixi' && process.env.PARITY_ASSERT !== '0') {
            const m = status.gpu.sceneMetrics;
            if (fixture === 'ferry')
              assert(m.actors >= 2, 'Pixi includes the original ferry hull beside the hero');
            if (fixture === 'warlord') assert.equal(m.worldIndicators, 1);
            if (fixture === 'ridge') assert.equal(m.groundMarks, 1);
            if (['registered', 'ringleader'].includes(fixture))
              assert.equal(m.accessoryActors, 1);
            if (fixture === 'cover' || fixture === 'occlusion-idle')
              assert(
                status.canvas.outlineMasks > 0,
                'Concealed hero receives an alpha-clipped contour',
              );
            if (fixture === 'occlusion-idle')
              assert(
                status.occlusion?.mask,
                'Real Pixi overlay draws a retained moving body mask behind cover',
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
        if (fixture === 'ferry') {
          const projected = await page.evaluate(() => {
            const ferry = window.parityFerry;
            const visual = painter.presentEntity(ferry, 'npc');
            const point = painter.screen(visual);
            const boarding = painter.screen(ferry);
            return {
              point,
              boarding,
              world: [ferry.x, ferry.y],
              vessel: [visual.x, visual.y],
            };
          });
          assert.deepEqual(projected.world, [300, 1995], 'Ferry boarding coordinates are unchanged');
          assert.deepEqual(projected.vessel, [260, 2020], 'Ferry uses authored Highlands vessel');
          assert(
            Math.abs(projected.point.x - projected.boarding.x) > 30,
            'The fixture actually exercises distinct ferry render and boarding coordinates',
          );
          const crop = {
            x: Math.max(0, Math.round(projected.point.x - 125)),
            y: Math.max(0, Math.round(projected.point.y - 160)),
            width: 250,
            height: 175,
          };
          for (const mode of ['canvas', 'pixi']) {
            await page.evaluate((mode) => {
              if (mode === 'canvas') {
                gpu.deactivate();
                painter.setRenderLayer('full');
              } else {
                gpu.activate();
                painter.setRenderLayer('overlay');
              }
              g.zone().npcs = [];
              if (mode === 'pixi') gpu.draw();
              painter.draw();
            }, mode);
            const absent = path.join(out, 'ferry-' + mode + '-absent.png');
            await page.screenshot({ path: absent });
            await page.evaluate((mode) => {
              g.zone().npcs = [window.parityFerry];
              if (mode === 'pixi') gpu.draw();
              painter.draw();
            }, mode);
            const changed = await changedPixels(
              path.join(out, 'ferry-' + mode + '-0.png'),
              absent,
              crop,
            );
            assert(changed > 200, mode + ' visible ferry must paint at authored hull position');
            lifecycle.push({ fixture, mode, changedPixels: changed, crop });
          }
        }
        if (fixture === 'occlusion-idle') {
          const [a, b] = pixi.map((r) => r.status.occlusion);
          const zoom = Number(process.env.PARITY_ZOOM || 1.5);
          assert.equal(a.mask.canvasWidth, b.mask.canvasWidth, 'retained mask buffer reused');
          const expectedX = ((b.body.x - b.ground.x) - (a.body.x - a.ground.x)) / zoom,
            expectedY = ((b.body.y - b.ground.y) - (a.body.y - a.ground.y)) / zoom;
          assert(
            Math.abs(b.mask.x - a.mask.x) < 0.001 &&
            Math.abs(b.mask.y - a.mask.y) < 0.001,
            'real Pixi contour must stay anchored during cosmetic idle motion: ' +
              JSON.stringify({ a, b, expectedX, expectedY, measuredX: b.mask.x - a.mask.x, measuredY: b.mask.y - a.mask.y }),
          );
          assert(
            Math.hypot(expectedX, expectedY) > 0.1,
            'the two frozen times actually exercise different idle poses',
          );
          const crop = {
            x: Math.max(0, Math.round(viewport.width * 0.5 - 105)),
            y: Math.max(0, Math.round(viewport.height * 0.55 - 125)),
            width: 210,
            height: 180,
          };
          for (const mode of ['canvas', 'pixi']) {
            const pixels = await changedPixels(
              path.join(out, fixture + '-' + mode + '-0.png'),
              path.join(out, fixture + '-' + mode + '-7000.png'),
              crop,
            );
            assert(pixels > 5, mode + ' retains real visible idle motion behind cover');
            lifecycle.push({ fixture, mode, pixels, crop, maskShift: mode === 'pixi' ? { x: b.mask.x - a.mask.x, y: b.mask.y - a.mask.y } : null });
          }
        }
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
        if (['warlord', 'ridge', 'registered', 'ringleader', 'lamp'].includes(fixture)) {
          const negative = await page.evaluate((name) => {
            if (name === 'lamp') g.s.clock = 120;
            else if (['registered', 'ringleader'].includes(name))
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
          if (['registered', 'ringleader'].includes(fixture))
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
        const perfSamples = Number(process.env.PARITY_PERF_SAMPLES || 96);
        const perfWarmup = Number(process.env.PARITY_PERF_WARMUP || 16);
        const injectedDelayMs = Number(process.env.PARITY_PERF_DELAY_MS || 0);
        if (!Number.isInteger(perfSamples) || perfSamples < 64 ||
            !Number.isInteger(perfWarmup) || perfWarmup < 12 ||
            !Number.isFinite(injectedDelayMs) || injectedDelayMs < 0)
          throw Error('Invalid paired performance sampling parameters');
        benchmarks.push(...(await page.evaluate(({ perfSamples, perfWarmup, injectedDelayMs }) => {
          const room = g.zone(),
            base = structuredClone(g.hero),
            result = [];
          const quantile = (sorted, q) => sorted[Math.ceil(q * sorted.length) - 1];
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
            // First fixture draw is separate from prepared steady measurements.
            // It is NOT a cold application start or a real-device first encounter.
            const initial = gpu.status();
            const firstStart = performance.now();
            gpu.draw();
            painter.draw();
            const firstFixtureDrawMs = performance.now() - firstStart;
            const afterFirst = gpu.status();
            for (let j = 0; j < perfWarmup; j++) {
              gpu.draw();
              painter.draw();
            }
            const before = gpu.status(), samples = [];
            for (let j = 0; j < perfSamples; j++) {
              const start = performance.now();
              gpu.draw();
              painter.draw();
              // Test-only injection verifies that the timing guard detects a
              // deliberately slow fixture; never used in acceptance samples.
              if (injectedDelayMs) {
                const until = performance.now() + injectedDelayMs;
                while (performance.now() < until) {}
              }
              samples.push(performance.now() - start);
            }
            samples.sort((x, y) => x - y);
            const after = gpu.status();
            const bakesDelta = after.proceduralBakes - before.proceduralBakes;
            if (!after.active || after.lastError) throw Error('Pixi fallback in steady crowd');
            if (bakesDelta !== 0) throw Error('Steady crowd rerasterized bodies');
            result.push({
              count,
              sampleCount: samples.length,
              warmupDraws: perfWarmup,
              firstFixtureDrawMs,
              firstFixtureBakes: afterFirst.proceduralBakes - initial.proceduralBakes,
              firstFixtureTextureSources: afterFirst.sceneMetrics?.textureSources ?? null,
              p50: quantile(samples, 0.5),
              p95: quantile(samples, 0.95),
              minMs: samples[0],
              maxMs: samples.at(-1),
              bakesDelta,
              textureSourcesBefore: before.sceneMetrics?.textureSources ?? null,
              textureSourcesAfter: after.sceneMetrics?.textureSources ?? null,
              active: after.active && !after.lastError,
              outline: painter.metrics().outlineBuffers,
              masks: painter.metrics().outlineMasks,
              before, after,
            });
          }
          return result;
        }, { perfSamples, perfWarmup, injectedDelayMs })));
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
          deviceScaleFactor,
          backingRatio,
          zoom: Number(process.env.PARITY_ZOOM || 1.5),
          optimized: process.env.PARITY_OPTIMIZED !== '0',
          benchmarkVersion: 'pixi-755-steady-v2',
          injectedDelayMs: process.env.PARITY_PERF === '1' ? Number(process.env.PARITY_PERF_DELAY_MS || 0) : 0,
          perfSamples: process.env.PARITY_PERF === '1' ? Number(process.env.PARITY_PERF_SAMPLES || 96) : null,
          perfWarmup: process.env.PARITY_PERF === '1' ? Number(process.env.PARITY_PERF_WARMUP || 16) : null,
          runner: { platform: process.platform, arch: process.arch, node: process.version,
            imageOS: process.env.ImageOS || null, imageVersion: process.env.ImageVersion || null,
            chromiumMode: 'ANGLE SwiftShader (software WebGL)' },
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
