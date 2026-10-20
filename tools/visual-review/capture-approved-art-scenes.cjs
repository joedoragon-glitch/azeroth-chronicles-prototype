const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('assert/strict'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..'),
  out = path.join(__dirname, 'approved-art-pass/native-scenes');
fs.mkdirSync(out, { recursive: true });
const before = require('child_process').execFileSync(
  'git',
  ['show', '0a1030b0771670752ae3b6a454daf423787881b7:src/prototype/visuals.js'],
  { cwd: root, encoding: 'utf8' },
);
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const launch = () =>
    chromium.launch({
      ...(process.env.ART_REVIEW_CHROMIUM
        ? { executablePath: process.env.ART_REVIEW_CHROMIUM }
        : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process'],
    });
  const afterOnly = process.env.ART_REVIEW_AFTER_ONLY === '1';
  let receipt = afterOnly
    ? JSON.parse(fs.readFileSync(out + '/capture-receipt.json')).captures.filter(
        (r) => r.stage === 'before',
      )
    : [];
  try {
    for (const device of [
      { width: 1280, height: 800, touch: false },
      { width: 375, height: 800, touch: true },
    ])
      for (const stage of afterOnly ? ['after'] : ['before', 'after']) {
        const b = await launch();
        const context = await b.newContext({
            viewport: { width: device.width, height: device.height },
            hasTouch: device.touch,
            isMobile: device.touch,
            deviceScaleFactor: 1,
            serviceWorkers: 'block',
          }),
          page = await context.newPage(),
          errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        if (stage === 'before')
          await page.route('**/src/prototype/visuals.js*', (r) =>
            r.fulfill({ contentType: 'text/javascript', body: before }),
          );
        await page.goto(
          'http://127.0.0.1:' +
            server.address().port +
            '/' +
            (device.touch ? 'phone.html' : 'index.html'),
        );
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
        const scenes = [
          'vale-town',
          'march-mire',
          'highlands-town',
          'frontier-orcs',
          'crown-lineages',
          'captive-forge',
          'royal-mage',
          'royal-ranger',
          'crown-night',
        ];
        for (const scene of scenes) {
          const report = await page.evaluate(
            ({ scene }) => {
              const c = Prototype.game,
                royal = scene.startsWith('royal'),
                cls =
                  scene === 'royal-mage' ? 'mage' : scene === 'royal-ranger' ? 'ranger' : 'paladin';
              c.s = new Campaign('normal', cls, () => 0.9).s;
              let region = scene.startsWith('vale')
                ? 'vale'
                : scene.startsWith('march')
                  ? 'march'
                  : scene.startsWith('highlands')
                    ? 'highlands'
                    : scene.startsWith('frontier')
                      ? 'frontier'
                      : 'crown';
              c.enter(region);
              c.random = () => 0.9;
              c.s.party = [];
              c.effects = [];
              c.s.clock = scene === 'crown-night' ? 450 : 200;
              c.s.mercyTime = 0;
              c.s.throneClaimed = royal || scene === 'crown-lineages';
              c.hero.hp = c.hero.maxHp = 1e6;
              c.hero.immune = 0;
              c.hero.order = null;
              const z = c.zone();
              let target;
              if (scene.endsWith('town') || royal || scene === 'crown-night')
                target = z.npcs.find((n) => n.kind === 'supplier');
              else if (scene === 'march-mire') target = z.enemies.find((e) => e.family === 'mire');
              else if (scene === 'captive-forge')
                target = z.npcs.find((n) => n.kind === 'cage' && n.family === 'cindermaw');
              else if (scene === 'frontier-orcs') {
                const group = [
                  z.enemies.find((e) => e.family === 'warlord'),
                  z.enemies.find((e) => e.captainProfile === 'frontier-overseer'),
                  z.enemies.find((e) => e.species === 'orc' && !e.captain && !e.crownTroop),
                ];
                for (let i = 0; i < group.length; i++)
                  Object.assign(group[i], {
                    x: 2600 + (i - 1) * 55,
                    y: 1650 - (i - 1) * 55,
                    aggro: false,
                  });
                z.enemies = group;
                target = group[1];
              } else {
                const group = ['crownguard', 'goblin', 'orc', 'archer', 'ogre'].map((a) =>
                  z.enemies.find((e) => e.crownTroop && e.crownAncestry === a),
                );
                if (group.some((e) => !e)) throw Error('Missing Crown ancestry');
                for (let i = 0; i < group.length; i++)
                  Object.assign(group[i], {
                    x: 2400 + (i - 2) * 48,
                    y: 1750 - (i - 2) * 48,
                    aggro: false,
                  });
                z.enemies = group;
                target = group[2];
              }
              if (!target) throw Error('Missing scene ' + scene);
              Object.assign(c.hero, { x: target.x + 85, y: target.y + 85 });
              Prototype.updateHUD();
              Prototype.renderer.draw();
              window.__visualState = JSON.stringify(c.snapshot());
              return {
                scene,
                region,
                zoom: Prototype.renderer.metrics().cameraZoom,
                night: c.night(),
                experience: document.body.dataset.experience,
                target: { id: target.id, kind: target.kind, family: target.family },
              };
            },
            { scene },
          );
          await page.evaluate(() => Prototype.renderer.draw());
          assert(
            await page.evaluate(() => __visualState === JSON.stringify(Prototype.game.snapshot())),
            'Rendering mutated campaign',
          );
          assert.equal(report.zoom, 1.5);
          const file = `${stage}-${scene}-${device.width}.png`;
          await page.screenshot({ path: path.join(out, file) });
          receipt.push({ file, stage, ...report });
        }
        assert.deepEqual(errors, []);
        await b.close();
        fs.writeFileSync(
          out + '/capture-receipt.json',
          JSON.stringify(
            {
              camera: 1.5,
              afterSourceSHA256: require('crypto')
                .createHash('sha256')
                .update(fs.readFileSync(root + '/src/prototype/visuals.js'))
                .digest('hex'),
              captures: receipt,
            },
            null,
            2,
          ),
        );
        console.log('PASS native visual captures', device.width, stage);
      }
    fs.writeFileSync(
      out + '/capture-receipt.json',
      JSON.stringify(
        {
          camera: 1.5,
          scope:
            'Nine bounded visual contexts on desktop and phone, before and after; not a gameplay regression pass.',
          afterSourceSHA256: require('crypto')
            .createHash('sha256')
            .update(fs.readFileSync(root + '/src/prototype/visuals.js'))
            .digest('hex'),
          captures: receipt,
        },
        null,
        2,
      ),
    );
  } finally {
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
