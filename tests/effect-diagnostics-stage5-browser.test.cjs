'use strict';
// Stage 5: focused Chromium Canvas acceptance of the real Stage 4 changes.
// Phone dimensions are emulated; this is NOT actual device/thermal certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER_ENGINE || 'chromium';
function installedChromium() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    try { return cp.execFileSync('which', [name], { encoding: 'utf8' }).trim(); }
    catch (_) { /* use Playwright's managed browser */ }
  }
  return null;
}
const mime = { '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const binary = engine === 'chromium' ? installedChromium() : null;
    browser = await pw[engine].launch(engine === 'chromium'
      ? { ...(binary ? { executablePath: binary } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] }
      : {});
    for (const phone of [false, true]) {
      const viewport = phone ? { width: 393, height: 852 } : { width: 1280, height: 800 };
      const page = await browser.newPage({ viewport, isMobile: phone, hasTouch: phone });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        await page.goto('http://127.0.0.1:' + server.address().port +
          (phone ? '/phone.html' : '/index.html'));
        await page.waitForFunction(() => !!window.PrototypeRenderer && !!window.Prototype?.game &&
          !!window.PrototypeCombatVisuals && !!window.PrototypeHeroPresentation);
        for (const reduced of [false, true]) {
          await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
          const result = await page.evaluate(({ width, height }) => {
            const C = Prototype.game.constructor;
            const fx = PrototypeCombatVisuals;
            const raster = (canvas) => canvas.getContext('2d').getImageData(
              0, 0, canvas.width, canvas.height).data;
            const changed = (a, b) => {
              let n = 0;
              for (let i = 0; i < a.length; i += 4)
                if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
                    Math.abs(a[i + 2] - b[i + 2]) > 15) n++;
              return n;
            };
            const make = (mode = 'developer') => {
              const g = new C(mode, 'paladin', () => 0.9);
              const z = g.zone();
              z.props = []; z.npcs = []; z.buildings = []; z.nodes = [];
              Object.assign(g.hero, { x: 600, y: 900, hp: 50, maxHp: 1000,
                skills: Array(8).fill(4), cd: Array(8).fill(0), order: null });
              g.s.mercyTime = 0;
              const e = g.makeEnemy({ species: 'goblin', name: 'Stage 5 target',
                level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
              { x: 670, y: 900 });
              z.enemies = [e];
              g.s.party = [g.unit('soldier', 580, 930)];
              g.effects = [];
              const canvas = document.createElement('canvas');
              canvas.width = width; canvas.height = height;
              const r = PrototypeRenderer.create({ canvas, ctx: canvas.getContext('2d'),
                getGame: () => g,
                platform: { cameraZoom: 1,
                  cameraAnchor: () => ({ x: width / 2, y: height / 2 }) },
                chargePresentation: () => null, isPaused: () => false,
                Campaign: C, PrototypeVisuals, PrototypeCombatVisuals: fx,
                PrototypeSprites: null, PrototypeMaterials: null, now: () => 1000 });
              r.setGroundReuse(false);
              return { g, e, r, canvas };
            };
            const firstPaint = [];
            for (const rate of [20, 30, 60]) {
              const { g, e, r, canvas } = make();
              if (!r.setEffectDiagnostics(true)) throw Error('Developer-only opt-in rejected');
              if (!g.cast(1, e.id, false)) throw Error('Real Paladin cast rejected');
              const receipts = g.effects.splice(0);
              if (!receipts.some((f) => f.type === 'heroSkillCast')) throw Error('No real cast receipt');
              // Same post-cast game state, without its transient, is the pixel comparator.
              r.draw();
              const base = new Uint8ClampedArray(raster(canvas));
              const snapshot = JSON.stringify(g.snapshot());
              r.queue(receipts);
              const earlier = r.effectDiagnosticsReport().drawFrames;
              for (let step = 0; step < Math.ceil(rate * 0.25); step++) {
                r.noteEffectDrawDecision(false, false);
                r.update(1 / rate);
              }
              r.draw(); // one existing eligible draw; no forced request
              const difference = changed(base, raster(canvas));
              const report = r.effectDiagnosticsReport();
              const cast = report.identities.find((row) =>
                row.id === 'hero/paladin/1/normal:cast');
              if (!cast || cast.painted !== 1 || cast.expiredWithoutDraw !== 0)
                throw Error('Protected painter missed: ' + rate + 'Hz ' + JSON.stringify(cast));
              if (difference <= 0) throw Error('No actual changed RGB pixels at ' + rate + 'Hz');
              if (report.drawFrames !== earlier + 1) throw Error('Additional draw requested');
              if (JSON.stringify(g.snapshot()) !== snapshot) throw Error('Drawing changed gameplay');
              const beforeExpiry = r.metrics().transientEffects;
              r.update(1 / rate);
              if (r.metrics().transientEffects >= beforeExpiry)
                throw Error('Protected cue lingered after first paint');
              firstPaint.push({ rate, changedPixels: difference, painted: cast.painted });
            }
            const { g, e } = make();
            g.s.time = 5;
            Object.assign(e, { weakenUntil: 10, fractureUntil: 10, tauntUntil: 10,
              slow: 0 });
            g.mageSilenceActive = (u) => u === e && !!e.testSilenced;
            const statusCanvas = document.createElement('canvas');
            statusCanvas.width = width; statusCanvas.height = height;
            const project = ({ x, y }) => ({ x: width / 2 + (x - 600) * 0.68 - (y - 900) * 0.3,
              y: height / 2 + (x - 600) * 0.17 + (y - 900) * 0.3 });
            const statuses = () => {
              const ctx = statusCanvas.getContext('2d');
              ctx.clearRect(0, 0, width, height);
              PrototypeHeroPresentation.statuses(ctx, project, g, width, height);
              return new Uint8ClampedArray(raster(statusCanvas));
            };
            const firstThree = statuses();
            e.slow = 3; e.testSilenced = true;
            const fullStack = statuses();
            const statusDifference = changed(firstThree, fullStack);
            if (statusDifference <= 0) throw Error('Silence/Slow and +N invisible');
            const ordinary = make('normal');
            if (ordinary.r.setEffectDiagnostics(true) !== false ||
                ordinary.r.effectDiagnosticsReport().captured !== false)
              throw Error('Normal player unexpectedly enabled recorder');
            ordinary.g.effects = [];
            for (let i = 0; i < 100; i++)
              ordinary.g.event('hit', { x: 600 + i, y: 900 });
            ordinary.r.queue(ordinary.g.effects.splice(0));
            if (ordinary.r.metrics().transientEffects !== 40)
              throw Error('40 visual-effect budget was changed');
            // Software-browser timing is observational, not a threshold or device FPS.
            ordinary.r.draw();
            const samples = [];
            for (let i = 0; i < 5; i++) {
              const begin = performance.now();
              ordinary.r.draw();
              samples.push(performance.now() - begin);
            }
            samples.sort((a, b) => a - b);
            return { firstPaint, statusChangedPixels: statusDifference,
              queue: ordinary.r.metrics().transientEffects,
              drawMedianMs: Number(samples[2].toFixed(3)) };
          }, viewport);
          assert.equal(result.firstPaint.length, 3);
          assert(result.firstPaint.every((p) => p.changedPixels > 0 && p.painted === 1));
          assert(result.statusChangedPixels > 0);
          assert.equal(result.queue, 40);
          assert.deepEqual(errors, []);
          console.log('STAGE5 ' + engine + '/' + (phone ? 'phone-emulation' : 'desktop') +
            '/' + (reduced ? 'reduced-motion' : 'normal-motion') + ': ' + JSON.stringify(result));
        }
      } finally {
        await page.close();
      }
    }
    console.log('PASS Stage 5 focused browser Canvas pixels and budgets; physical devices NOT certified');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
