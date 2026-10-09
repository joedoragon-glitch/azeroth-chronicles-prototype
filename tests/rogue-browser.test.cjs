'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.ROGUE_BROWSER_ENGINE || 'chromium';
const root = path.resolve(__dirname, '..'),
  results = path.join(root, 'test-results');
fs.mkdirSync(results, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, '')) || 'index.html',
  );
  if (
    !file.startsWith(root + path.sep) ||
    !fs.existsSync(file) ||
    fs.statSync(file).isDirectory()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.webmanifest': 'application/manifest+json',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const options = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE)
      Object.assign(options, {
        executablePath: process.env.CHROMIUM_EXECUTABLE,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
    browser = await pw[engine].launch(options);
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
      { width: 393, height: 852 },
      { width: 844, height: 390 },
    ]) {
      const phone = viewport.width !== 1280;
      const page = await browser.newPage({
        viewport,
        hasTouch: phone,
        isMobile: phone,
        deviceScaleFactor: phone ? 3 : 1,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html'),
      );
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {
        Prototype.game.tick = () => {};
      });
      for (const night of [false, true]) {
        const probe = await page.evaluate((night) => {
          const p = Prototype,
            c = p.game;
          c.enter('vale');
          c.zone().props = [];
          c.s.party = [];
          c.s.clock = night ? 500 : 200;
          Object.assign(c.hero, { x: 1470, y: 1700, hp: 10000, maxHp: 10000 });
          const e = c.bossEnemy(c.boss('warlord'), 'normal', { x: 1400, y: 1700 });
          e.aggro = true;
          c.zone().enemies = [e];
          c.tacticalRogueMove(e, c.hero, true);
          const canvas = document.querySelector('#world'),
            ctx = canvas.getContext('2d'),
            labels = [];
          const fillText = ctx.fillText;
          ctx.fillText = function (text, x, y, ...rest) {
            if (
              String(text).includes('Warlord’s') ||
              String(text).includes('Withdrawal') ||
              String(text).includes('SIGNATURE')
            ) {
              const t = this.getTransform(),
                width = this.measureText(text).width;
              labels.push({
                text,
                left: t.a * (x - width / 2) + t.e,
                right: t.a * (x + width / 2) + t.e,
                top: t.d * (y - 12) + t.f,
                bottom: t.d * y + t.f,
              });
            }
            return fillText.call(this, text, x, y, ...rest);
          };
          try {
            p.renderer.draw();
          } finally {
            ctx.fillText = fillText;
          }
          return { labels, width: canvas.width, height: canvas.height, name: e.telegraph.name };
        }, night);
        assert.equal(probe.name, 'Ashen Warlord’s Shielded Withdrawal');
        assert(
          probe.labels.some((x) => x.text.includes('SIGNATURE')),
          'signature countdown rendered',
        );
        assert(
          probe.labels.some((x) => x.text.includes('Withdrawal')),
          'full move name survives wrapping',
        );
        for (const label of probe.labels)
          assert(
            label.left >= 0 &&
              label.right <= probe.width &&
              label.top >= 0 &&
              label.bottom <= probe.height,
            'rogue text fits physical DPR canvas: ' +
              JSON.stringify({ label, width: probe.width, height: probe.height }),
          );
        await page.screenshot({
          path: path.join(
            results,
            'rogue-' +
              engine +
              '-' +
              viewport.width +
              'x' +
              viewport.height +
              '-' +
              (night ? 'night' : 'day') +
              '.png',
          ),
        });
      }
      const mechanics = await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('vale');
        c.zone().props = [];
        c.s.party = [];
        Object.assign(c.hero, { x: 1470, y: 1700, hp: 10000, maxHp: 10000 });
        const g = c.makeEnemy(
          {
            species: 'goblin',
            name: 'Dust slinger',
            level: 1,
            hp: 3000,
            damage: 10,
            gold: 0,
            xp: 0,
          },
          { x: 1400, y: 1700 },
        );
        g.aggro = true;
        c.zone().enemies = [g];
        c.holdHeroTarget(() => true, g.id);
        c.tacticalRogueMove(g, c.hero);
        c.tacticalResolveRogueMove(g, g.telegraph);
        const dust =
          !c.tacticalDirectTargetable(g) && !c.manualHeroTargetLocked && !c.selectedHeroTarget();
        const b = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 });
        c.zone().enemies = [b];
        b.aggro = true;
        const before = { x: c.hero.x, y: c.hero.y };
        c.tacticalRogueMove(b, c.hero, true);
        c.tacticalResolveRogueMove(b, b.telegraph);
        const interrupted = !!c.tacticalScatterState(c.hero) && !c.cast(1, b.id);
        for (let i = 0; i < 7; i++) c.tacticalAdvanceScatter(c.hero, 0.1);
        return {
          dust,
          interrupted,
          recovered: !c.tacticalScatterState(c.hero),
          moved: Math.hypot(c.hero.x - before.x, c.hero.y - before.y) > 1,
        };
      });
      assert.deepEqual(mechanics, { dust: true, interrupted: true, recovered: true, moved: true });
      assert.deepEqual(errors, [], 'actual browser rendering and combat have no errors');
      console.log(
        'PASS ' +
          engine +
          ' rogue warning/DPR day/night, dust locks and scatter recovery ' +
          viewport.width +
          'x' +
          viewport.height,
      );
      await page.close();
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
