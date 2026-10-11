const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
function setupScene(kind) {
  const c = Prototype.game;
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

const roots = JSON.parse(process.env.HISTORY_ROOTS || '[]').map((p) => path.resolve(p)),
  reports = [];
if (roots.length < 2)
  throw Error('Set HISTORY_ROOTS to a JSON array of candidate and historical worktree paths.');
const server = http.createServer((req, res) => {
  const parts = req.url.split('?')[0].split('/').filter(Boolean),
    root = roots[Number(parts.shift())];
  if (!root) return res.writeHead(404).end();
  const f = path.resolve(root, parts.join('/') || 'index.html');
  if (!root || !f.startsWith(root + path.sep) || !fs.existsSync(f)) return res.writeHead(404).end();
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
  const b = await pw.chromium.launch({
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    let state;
    for (const [index, dir] of roots.entries()) {
      const p = await b.newPage({
        viewport: { width: 1280, height: 800 },
        serviceWorkers: 'block',
      });
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto('http://127.0.0.1:' + server.address().port + '/' + index + '/');
      await p.waitForFunction(() => window.Prototype);
      await p.keyboard.press('f');
      await p.keyboard.press('f');
      if (!state) {
        await p.evaluate(setupScene, 'crowd');
        state = await p.evaluate(() => Prototype.game.snapshot());
      }
      await p.evaluate((s) => {
        Prototype.game.s = s;
        Prototype.game.tick = () => {};
      }, state);
      await p.evaluate(async () => {
        await PrototypeMaterials.load();
        await PrototypeMaterials.ensure('terrain:ground:vale');
      });
      const result = await p.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 1280;
        c.height = 800;
        const q = c.getContext('2d');
        const r = PrototypeRenderer.create({
          canvas: { width: 1280, height: 800 },
          ctx: q,
          getGame: () => Prototype.game,
          platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 520, y: 350 }) },
          chargePresentation: () => null,
          isPaused: () => false,
          Campaign,
          PrototypeVisuals,
          PrototypeCombatVisuals,
          PrototypeSprites,
          PrototypeMaterials,
          now: () => 1000,
        });
        const projected = PrototypeMaterials.projectedPattern;
        if (projected) PrototypeMaterials.projectedPattern = () => null;
        const data = [];
        try {
          for (let i = 0; i < 16; i++) {
            const t = performance.now();
            r.draw();
            q.getImageData(0, 0, 1, 1);
            if (i > 3) data.push(performance.now() - t);
          }
        } finally {
          if (projected) PrototypeMaterials.projectedPattern = projected;
        }
        return {
          version: PrototypeBuild.version,
          median: data.slice().sort((a, b) => a - b)[6],
          data,
          render: r.metrics(),
          definitions: PrototypeMaterials.status().definitions,
        };
      });
      reports.push({ dir, ...result, errors });
      console.log(JSON.stringify(reports.at(-1)));
      await p.close();
    }
  } finally {
    await b.close();
    server.close();
    fs.writeFileSync(
      process.env.HISTORY_OUT || 'material-history-performance.json',
      JSON.stringify(reports, null, 2),
    );
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
