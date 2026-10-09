const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
function instrument() {
  const a = (window.__audit = {
    frames: [],
    parts: { tick: [], draw: [], rendererUpdate: [], audioUpdate: [] },
    longTasks: [],
    counts: {},
    last: null,
  });
  const wrap = (o, k, label) => {
    const fn = o[k];
    o[k] = function (...args) {
      const t = performance.now();
      try {
        return fn.apply(this, args);
      } finally {
        const ms = performance.now() - t;
        if (a.parts[label].length < 40000) a.parts[label].push(ms);
        a.counts[label] = (a.counts[label] || 0) + 1;
      }
    };
  };
  wrap(Prototype.game, 'tick', 'tick');
  wrap(Prototype.renderer, 'draw', 'draw');
  wrap(Prototype.renderer, 'update', 'rendererUpdate');
  wrap(Prototype.audio, 'update', 'audioUpdate');
  const record = Prototype.runtime.record;
  Prototype.runtime.record = function (now, start, draw) {
    record(now, start, draw);
    if (a.frames.length < 40000)
      a.frames.push({
        work: performance.now() - start,
        interval: a.last === null ? 0 : now - a.last,
      });
    a.last = now;
  };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (a.longTasks.length < 1000) a.longTasks.push({ start: e.startTime, duration: e.duration });
  }).observe({ type: 'longtask', buffered: false });
  a.reset = () => {
    a.frames = [];
    Object.keys(a.parts).forEach((k) => (a.parts[k] = []));
    a.longTasks = [];
    a.counts = {};
    a.last = null;
  };
  a.report = () => {
    const stat = (x) => {
      const n = x.length;
      if (!n) return { n: 0 };
      const s = x.slice().sort((a, b) => a - b),
        p = (q) => s[Math.floor((n - 1) * q)];
      return {
        n,
        mean: x.reduce((a, b) => a + b, 0) / n,
        p50: p(0.5),
        p95: p(0.95),
        p99: p(0.99),
        max: s[n - 1],
      };
    };
    const work = a.frames.map((f) => f.work),
      intervals = a.frames.map((f) => f.interval).filter((x) => x > 0),
      cadence = stat(intervals);
    const c = Prototype.game;
    return {
      frames: a.frames.length,
      workMs: stat(work),
      frameIntervalMs: cadence,
      fps: cadence.mean ? 1000 / cadence.mean : 0,
      intervalsOver25Ms: intervals.filter((x) => x > 25).length,
      intervalsOver50Ms: intervals.filter((x) => x > 50).length,
      workOver16_67Ms: work.filter((x) => x > 1000 / 60).length,
      parts: Object.fromEntries(Object.entries(a.parts).map(([k, v]) => [k, stat(v)])),
      calls: { ...a.counts },
      longTasks: a.longTasks.slice(),
      engineTime: c.s.time,
      paused: Prototype.paused,
      hero: { x: c.hero.x, y: c.hero.y, hp: c.hero.hp, class: c.hero.class },
      enemies: {
        total: c.zone().enemies.length,
        alive: c.zone().enemies.filter((e) => e.hp > 0).length,
        engaged: c.zone().enemies.filter((e) => e.aggro && e.hp > 0).length,
      },
      party: c.activeLivingParty().length,
      projectiles: c.s.projectiles.length,
      hazards: c.s.hazards.length,
      render: Prototype.renderer.metrics(),
      sprites: PrototypeSprites.status(),
      audio: Prototype.audio.status(),
    };
  };
}
function setupScene(kind) {
  const c = Prototype.game;
  c.random = () => 0.5;
  c.enter('vale');
  Prototype.closeMenu();
  c.s.clock = kind.includes('true') ? 600 : 200;
  c.s.mercyTime = 0;
  c.s.projectiles = [];
  c.s.hazards = [];
  c.effects = [];
  c.s.party = [];
  Object.assign(c.hero, {
    ...c.safe(1400, 1700),
    hp: 10000000,
    maxHp: 10000000,
    skills: Array(8).fill(1),
    cd: Array(8).fill(0),
    order: null,
  });
  if (kind === 'exploration') {
    c.s.party = [
      c.unit('soldier', c.hero.x + 25, c.hero.y),
      c.unit('archer', c.hero.x - 25, c.hero.y),
    ];
    return;
  }
  const z = c.zone();
  z.enemies = [];
  for (let i = 0; i < 6; i++) {
    const u = c.unit(i % 2 ? 'archer' : 'soldier', c.hero.x + (i - 3) * 22, c.hero.y - 35);
    u.hp = u.maxHp = 10000000;
    u.immune = 100000;
    c.s.party.push(u);
  }
  if (kind === 'crowd') {
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24,
        p = c.safe(
          c.hero.x + Math.cos(angle) * (90 + (i % 4) * 25),
          c.hero.y + Math.sin(angle) * (90 + (i % 4) * 25),
        );
      const e = c.makeEnemy(
        {
          species: i % 3 === 2 ? 'archer' : 'goblin',
          name: 'Audit ' + i,
          level: 12,
          hp: 10000000,
          damage: 12,
          gold: 0,
          xp: 0,
        },
        p,
      );
      c.configureEnemy(e, i);
      z.enemies.push(e);
      c.engage(e, true, false);
    }
  } else {
    const family = kind.includes('true') ? 'mine' : 'crypt',
      e = c.bossEnemy(
        c.boss(family),
        kind.includes('true') ? 'true' : 'normal',
        c.safe(c.hero.x + 95, c.hero.y - 30),
      );
    e.hp = e.maxHp = e.baseHp = 10000000;
    z.enemies.push(e);
    c.engage(e, true, false);
  }
}

// Development-only matched A/B: per-tile v124 floor versus ground-window reuse.
// Software raster readback is relative work evidence; actual RAF samples are separate.
const root = path.resolve(__dirname, '..'),
  results = {
    version: require('../package.json').version,
    groundSourceHash: require('crypto')
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, 'src/prototype/ground-cache.js')))
      .digest('hex'),
    rendererSourceHash: require('crypto')
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, 'src/prototype/renderer.js')))
      .digest('hex'),
    browser: null,
    errors: [],
    raster: [],
    frames: [],
    pixels: [],
  };
fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
const server = http.createServer((req, res) => {
  const f = path.resolve(root, req.url.split('?')[0].slice(1) || 'index.html');
  if (!f.startsWith(root + path.sep) || !fs.existsSync(f)) return res.writeHead(404).end();
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
    }[path.extname(f)] || 'application/octet-stream',
  );
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await pw.chromium.launch({
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  results.browser = browser.version();
  try {
    for (const phone of [false, true]) {
      const context = await browser.newContext({
          viewport: phone ? { width: 393, height: 852 } : { width: 1280, height: 800 },
          deviceScaleFactor: phone ? 3 : 1,
          hasTouch: phone,
          isMobile: phone,
          serviceWorkers: 'block',
        }),
        page = await context.newPage();
      page.on('pageerror', (e) => results.errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : ''),
      );
      await page.waitForFunction(() => window.Prototype);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.evaluate(setupScene, 'crowd');
      await page.evaluate(async () => {
        await PrototypeMaterials.ensure('terrain:ground:vale');
        window.cachedProjection = PrototypeMaterials.projectedPattern;
      });
      await page.waitForTimeout(1500);
      results.raster.push({
        phone,
        ...(await page.evaluate(() => {
          const game = Prototype.game,
            tick = game.tick,
            q = document.querySelector('canvas').getContext('2d');
          game.tick = () => {};
          const data = { old: [], cached: [] };
          try {
            for (let i = 0; i < 14; i++)
              for (const mode of i % 2 ? ['cached', 'old'] : ['old', 'cached']) {
                Prototype.renderer.setGroundReuse(mode === 'cached');
                Prototype.renderer.draw();
                q.getImageData(0, 0, 1, 1);
                const start = performance.now();
                Prototype.renderer.draw();
                q.getImageData(0, 0, 1, 1);
                if (i > 1) data[mode].push(performance.now() - start);
              }
          } finally {
            game.tick = tick;
            Prototype.renderer.setGroundReuse(true);
          }
          return Object.fromEntries(
            Object.entries(data).map(([k, v]) => [
              k,
              { median: v.slice().sort((a, b) => a - b)[6], values: v },
            ]),
          );
        })),
      });
      console.log('RASTER', JSON.stringify(results.raster.at(-1)));
      await page.evaluate(instrument);
      await page.evaluate(() => {
        const game = Prototype.game,
          tick = game.tick;
        game.tick = function (...args) {
          tick.apply(this, args);
          if (window.groundAuditMoving) {
            this.hero.x =
              1400 + Math.sin((performance.now() - window.groundAuditStart) / 1500) * 350;
            this.hero.y =
              1700 + Math.cos((performance.now() - window.groundAuditStart) / 1800) * 200;
          }
        };
      });
      for (const sample of [
        { mode: 'old', moving: false },
        { mode: 'cached', moving: false },
        { mode: 'cached', moving: false },
        { mode: 'old', moving: false },
        { mode: 'old', moving: true },
        { mode: 'cached', moving: true },
        { mode: 'cached', moving: true },
        { mode: 'old', moving: true },
      ]) {
        const { mode, moving } = sample;
        await page.evaluate(setupScene, 'crowd');
        await page.evaluate(
          ({ mode, moving }) => {
            window.groundAuditMoving = moving;
            window.groundAuditStart = performance.now();
            Prototype.renderer.setGroundReuse(mode === 'cached');
          },
          { mode, moving },
        );
        await page.waitForTimeout(500);
        await page.evaluate(() => __audit.reset());
        await page.waitForTimeout(7000);
        const r = await page.evaluate(() => __audit.report());
        results.frames.push({
          phone,
          mode,
          moving,
          fps: r.fps,
          work: r.workMs,
          materials: await page.evaluate(() => PrototypeMaterials.status()),
          renderer: r.render,
        });
        console.log('FRAMES', JSON.stringify(results.frames.at(-1)));
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
    fs.writeFileSync(
      process.env.PERFORMANCE_OUT || path.join(root, 'test-results', 'ground-performance.json'),
      JSON.stringify(results, null, 2),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  server.close();
});
