'use strict';
const assert = require('assert/strict'),
  fs = require('fs'),
  path = require('path'),
  http = require('http'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..'),
  out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const p = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (!p.startsWith(root) || !fs.existsSync(p) || !fs.statSync(p).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[path.extname(p)] || 'application/octet-stream',
  );
  fs.createReadStream(p).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    let cases = 0;
    for (const phone of [false, true]) {
      const context = await browser.newContext({
          viewport: phone ? { width: 844, height: 390 } : { width: 1280, height: 800 },
          isMobile: phone,
          hasTouch: phone,
          serviceWorkers: 'block',
        }),
        p = await context.newPage(),
        errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(
        'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
      );
      await p.waitForFunction(() => window.Prototype?.game);
      await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
      await p.keyboard.press('f');
      await p.keyboard.press('f');
      await p.waitForFunction(() => document.getElementById('modal').hidden);
      await p.evaluate(() => {
        const c = Prototype.game;
        window.__realTwilightTick = c.tick;
        c.tick = () => {};
        c.zone().enemies = [];
        c.s.party = [];
        c.s.projectiles = [];
        c.s.hazards = [];
        c.notices = [];
        Prototype.closeMenu();
      });
      for (const phase of ['day', 'sunset', 'night', 'sunrise', 'victory-sunrise']) {
        const result = await p.evaluate((phase) => {
          const c = Prototype.game;
          c.s.mode = 'normal';
          c.s.phase = 'adventure';
          c.s.nightmareIntroRemaining = 0;
          c.s.victoryDawnRemaining = 0;
          c.s.clock = { day: 120, sunset: 345, night: 450, sunrise: 585, 'victory-sunrise': 585 }[
            phase
          ];
          if (phase === 'victory-sunrise') {
            c.s.mode = 'nightmare';
            c.s.phase = 'peace';
            c.s.victoryDawnRemaining = 15;
          }
          Prototype.updateHUD();
          const before = JSON.stringify(c.snapshot());
          Prototype.renderer.draw();
          const after = JSON.stringify(c.snapshot());
          return { phase: c.daylightPhase().phase, night: c.night(), pure: before === after };
        }, phase);
        assert.equal(result.phase, phase);
        assert(result.pure, 'render is observation-only');
        cases++;
        if (phone || phase === 'sunset')
          await p.screenshot({
            path: path.join(out, (phone ? 'phone-' : 'desktop-') + phase + '.jpg'),
            type: 'jpeg',
            quality: 80,
          });
      }
      for (const region of ['march', 'highlands', 'frontier', 'crown']) {
        await p.evaluate((region) => {
          const c = Prototype.game;
          c.s.mode = 'normal';
          c.s.phase = 'adventure';
          c.s.victoryDawnRemaining = 0;
          c.enter(region);
          c.s.clock = 345;
          c.effects = [];
          Prototype.renderer.draw();
        }, region);
        cases++;
      }
      for (const room of ['crypt', 'archive']) {
        await p.evaluate((room) => {
          const c = Prototype.game;
          c.enter(room);
          c.s.clock = 345;
          Prototype.renderer.draw();
        }, room);
        cases++;
      }
      await p.evaluate(() => {
        Prototype.renderer.setOptimizationMode(true);
        Prototype.game.enter('vale');
        Prototype.game.s.clock = 585;
        Prototype.renderer.draw();
      });
      cases++;
      // An actual shell menu must freeze the saved opening timer.
      await p.evaluate(() => {
        const c = Prototype.game;
        c.tick = __realTwilightTick;
        c.s.mode = 'nightmare';
        c.s.phase = 'adventure';
        c.s.nightmareIntroRemaining = 20;
        Prototype.openMenu('Pause probe', '', []);
      });
      await p.waitForTimeout(220);
      assert.equal(
        await p.evaluate(() => Prototype.game.s.nightmareIntroRemaining),
        20,
        'menu does not consume the grace period',
      );
      await p.evaluate(() => {
        Prototype.game.tick = () => {};
        Prototype.closeMenu();
      });
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(
      path.join(__dirname, 'browser-results.json'),
      JSON.stringify(
        {
          cases,
          nativeStartup: ['desktop', 'phone landscape'],
          renderPurity: true,
          pauseTimer: true,
          errors: [],
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'PASS ' +
        cases +
        ' focused native phase/region/interior/Optimization render cases, pure state and paused timer',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
