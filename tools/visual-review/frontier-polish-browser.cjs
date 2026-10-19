const fs = require('fs'),
  path = require('path'),
  assert = require('assert/strict');
const root = path.resolve(__dirname, '../..'),
  pw = require(root + '/node_modules/playwright'),
  out = process.argv[2] || root + '/test-results/frontier-polish';
fs.mkdirSync(out, { recursive: true });
const baseline = process.env.FRONTIER_VISUAL_BASELINE || 'e6ea987aded7b441bdedf51e1fc29b38b1ed2f02';
const before = require('./source-baselines.cjs')(baseline);
const server = require('http').createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://local').pathname);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch({
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const reports = [];
  try {
    for (const device of [
      { width: 1280, height: 800, touch: false },
      { width: 375, height: 800, touch: true },
    ]) {
      for (const stage of ['before', 'after']) {
        const context = await b.newContext({
          viewport: { width: device.width, height: device.height },
          hasTouch: device.touch,
          isMobile: device.touch,
          deviceScaleFactor: 1,
          serviceWorkers: 'block',
        });
        const page = await context.newPage(),
          errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        if (stage === 'before')
          await page.route('**/src/prototype/visuals.js', (r) =>
            r.fulfill({ contentType: 'text/javascript', body: before }),
          );
        await page.goto(base + (device.touch ? 'phone.html' : 'index.html'));
        await page.waitForFunction(() => !!window.Prototype);
        await require(root + '/tests/helpers/language-browser.cjs').selectEnglish(page);
        await page.keyboard.press('f');
        await page.keyboard.press('f');
        await page.waitForFunction(() => document.querySelector('#modal').hidden);
        await page.evaluate(() => {
          Prototype.game.tick = () => {};
          Prototype.closeMenu();
          Prototype.game.notice = () => {};
        });
        for (const scene of (
          process.env.FRONTIER_VISUAL_SCENES || 'lineage,orc-fort,raider-redoubt'
        ).split(','))
          for (const night of [false, true]) {
            const report = await page.evaluate(
              ({ scene, night }) => {
                const c = Prototype.game;
                c.s = new Campaign('normal', 'paladin', () => 0.9).s;
                c.enter('frontier');
                c.random = () => 0.9;
                c.s.party = [];
                c.effects = [];
                c.s.clock = night ? 450 : 200;
                c.s.mercyTime = 0;
                c.hero.hp = c.hero.maxHp = 1e6;
                c.hero.immune = 1e6;
                c.hero.order = null;
                const z = c.zone();
                let target;
                if (scene === 'lineage') {
                  const boss = z.enemies.find((e) => e.family === 'warlord'),
                    captain = z.enemies.find((e) => e.captainProfile === 'frontier-overseer'),
                    orc = z.enemies.find(
                      (e) => e.species === 'orc' && !e.captain && !e.ranged && !e.crownTroop,
                    );
                  // Controlled side-by-side fixture at the real checkpoint: no source spawn edits.
                  for (const [e, delta] of [
                    [orc, -45],
                    [captain, 0],
                    [boss, 45],
                  ])
                    Object.assign(e, { x: 2600 + delta, y: 1650 - delta, aggro: true });
                  z.enemies = [orc, captain, boss];
                  target = captain;
                  Object.assign(c.hero, { x: target.x + 105, y: target.y + 105 });
                  c.engage(captain, true, false);
                  c.startCaptainAttack(captain, c.hero);
                } else if (scene === 'marksman') {
                  target = z.enemies.find((e) => e.species === 'archer' && e.crownTroop);
                  if (!target) throw Error('Missing authored Frontier Crown marksman');
                  Object.assign(c.hero, c.safe(target.x + 100, target.y + 100));
                  for (const e of z.enemies.filter(
                    (e) =>
                      e.species === 'archer' && Math.hypot(e.x - target.x, e.y - target.y) < 240,
                  ))
                    e.aggro = true;
                  c.engage(target, true, false);
                } else {
                  const species = scene === 'orc-fort' ? 'orc' : 'archer';
                  const hold = Campaign.rules.creatureStrongholds.find(
                    (h) => h.region === 'frontier' && h.species === species,
                  );
                  target =
                    z.enemies.find((e) => e.stronghold === hold.id && e.form === 'ringleader') ||
                    z.enemies.find((e) => e.stronghold === hold.id);
                  if (!target) throw Error('Missing stronghold ' + species);
                  Object.assign(c.hero, c.safe(target.x + 100, target.y + 100));
                  for (const e of z.enemies.filter((e) => e.stronghold === hold.id)) {
                    e.aggro = true;
                  }
                  c.engage(target, true, false);
                }
                Prototype.updateHUD();
                Prototype.renderer.draw();
                window.__reviewSnapshot = JSON.stringify(c.snapshot());
                const actors = z.enemies
                  .filter((e) => Math.hypot(e.x - target.x, e.y - target.y) < 260)
                  .map((e) => ({
                    id: e.id,
                    name: e.name,
                    species: e.species,
                    crownTroop: !!e.crownTroop,
                    form: e.form,
                    ranged: !!e.ranged,
                    guard: !!e.guard,
                    screen: Prototype.renderer.screen(e),
                    sprite:
                      PrototypeSprites.definitionFor({ ...e, renderKind: 'enemy' }, 3, false)
                        ?.key || null,
                  }));
                return {
                  scene,
                  night: c.night(),
                  zoom: Prototype.renderer.metrics().cameraZoom,
                  experience: document.body.dataset.experience,
                  actors,
                };
              },
              { scene, night },
            );
            await page.evaluate(() => Prototype.renderer.draw());
            assert(
              await page.evaluate(
                () => __reviewSnapshot === JSON.stringify(Prototype.game.snapshot()),
              ),
              'Renderer changed campaign state',
            );
            assert.equal(report.zoom, 1.5);
            const file = `${stage}-${scene}-${device.width}-${night ? 'night' : 'day'}.png`;
            await page.screenshot({ path: path.join(out, file) });
            reports.push({ file, ...report });
          }
        assert.deepEqual(errors, []);
        console.log('PASS', device.width, stage);
        await context.close();
      }
    }
    fs.writeFileSync(
      out + '/native-capture-report.json',
      JSON.stringify(
        {
          browser: await b.version(),
          baseline,
          deviceScaleFactor: 1,
          notes: [
            'Lineage scene repositions three real actor records at the checkpoint for comparison.',
            'Stronghold scenes retain authored positions and local props.',
            'Before overrides only visuals.js with the baseline; shell is candidate dev.80.',
            'Chromium phone emulation, not a physical device or WebKit certificate.',
          ],
          captures: reports,
        },
        null,
        2,
      ) + '\n',
    );
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
