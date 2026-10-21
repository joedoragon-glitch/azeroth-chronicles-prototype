'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..'),
  out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost'),
    p = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
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
      '.webmanifest': 'application/manifest+json',
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
    const samples = [];
    for (const v of [
      { width: 844, height: 390, phone: true },
      { width: 667, height: 375, phone: true },
      { width: 375, height: 812, phone: true },
      { width: 390, height: 600, phone: true },
      { width: 1280, height: 800, phone: false },
      { width: 768, height: 600, phone: false },
    ]) {
      const context = await browser.newContext({
          viewport: { width: v.width, height: v.height },
          isMobile: v.phone,
          hasTouch: v.phone,
          serviceWorkers: 'block',
        }),
        p = await context.newPage(),
        errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(
        'http://127.0.0.1:' + server.address().port + (v.phone ? '/phone.html' : '/index.html'),
      );
      await p.waitForFunction(() => window.Prototype?.game);
      if (v.width === 390) await p.getByRole('button', { name: /^Español/ }).click();
      else await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
      await p.addStyleTag({ content: '#message{transition:none!important}' });
      await p.keyboard.press('f');
      await p.keyboard.press('f');
      await p.waitForFunction(() => document.getElementById('modal').hidden);
      await p.evaluate(() => {
        const c = Prototype.game;
        c.tick = () => {};
        c.zone().enemies = [];
        c.s.party = [];
        c.s.projectiles = [];
        c.s.hazards = [];
        c.notices = [];
        Prototype.closeMenu();
        Prototype.updateHUD();
      });
      for (const kind of ['feedback', 'milestone', 'warning', 'narration']) {
        await p.evaluate((kind) => {
          const c = Prototype.game;
          c.notices = [];
          c.notice(
            kind === 'feedback'
              ? 'Companions recalled · retreat protection active.'
              : kind === 'milestone'
                ? 'BOSS VANQUISHED · The Ashen Warlord'
                : kind === 'warning'
                  ? 'Cindermaw TRUE will emerge in 5 seconds'
                  : 'Silver and copper arrive separately at Stonecross. They leave as crowns stamped with the Dark Lord’s face, while armed guards count the sealed crates.',
            0.4,
            '',
            kind,
          );
          Prototype.updateHUD();
        }, kind);
        await p.waitForFunction((kind) => document.querySelector('#message .notice-' + kind), kind);
        const geo = await p.evaluate(() => {
          const r = (id) => {
            const b = document.getElementById(id).getBoundingClientRect();
            return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
          };
          return {
            message: r('message'),
            hud: r('hud'),
            skills: r('skills'),
            text: document.querySelector('#message').textContent,
            overflow:
              document.querySelector('#message .notice-card').scrollWidth >
              document.querySelector('#message .notice-card').clientWidth,
            font: getComputedStyle(document.querySelector('#message .notice-card')).fontSize,
            cards: document.querySelectorAll('#message .notice-card').length,
          };
        });
        assert(geo.message.x >= 0 && geo.message.right <= v.width + 1, 'within viewport');
        assert(!geo.overflow, 'text wraps');
        assert(Number.parseFloat(geo.font) >= 12, 'readable font');
        assert(
          geo.message.h <= (v.phone ? (v.width > v.height ? 82 : 115) : 150),
          'bounded card height',
        );
        const overlap = (a, b) =>
          a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        assert(!overlap(geo.message, geo.hud), 'notice clears vitals');
        assert(!overlap(geo.message, geo.skills), 'notice clears skills');
        if (v.phone) assert.equal(geo.cards, 1);
        samples.push({ viewport: v, kind, ...geo });
        if (kind === 'narration' || kind === 'feedback')
          await p.screenshot({
            path: path.join(out, [v.width, v.height, kind].join('-') + '.png'),
          });
        await p.waitForFunction(() => !document.querySelector('#message .notice-card'));
        console.log(v.width + 'x' + v.height + ' ' + kind + ' passed');
      }
      // Direct travel with pending old-region lore and local warnings.
      await p.evaluate(() => {
        const c = Prototype.game;
        c.notice('Old Greenwood story', 6.8, '', 'narration', {
          scope: 'region',
          region: 'vale',
          zone: null,
          visit: null,
        });
        c.notice('Old location warning', 4, '', 'warning');
        c.enter('march');
        c.zone().enemies = [];
        c.notices = c.notices.filter((n) => n.text.startsWith('Old '));
        Prototype.updateHUD();
      });
      assert.equal(
        await p.locator('#message .notice-card').count(),
        0,
        'old-region notices stay hidden after travel',
      );
      await p.evaluate(() => {
        Prototype.game.notice('LEVEL UP', 0.4);
        Prototype.updateHUD();
      });
      await p.waitForFunction(() => document.querySelector('#message .notice-milestone'));
      // Full text is reachable via actual menu at the selected device layout.
      await p.keyboard.press('Escape');
      const btn = p.getByRole('button', { name: /^(Announcements|Anuncios)$/, exact: true });
      await btn.click();
      assert(
        (await p.locator('#modal').textContent()).includes('Old Greenwood story'),
        'history retains complete hidden story',
      );
      await p.evaluate(() => Prototype.closeMenu());
      await p.keyboard.press('e');
      assert(
        (await p.locator('#status').textContent()).length > 0,
        'native target action supplies short status',
      );
      await p.evaluate(() => {
        const c = Prototype.game;
        c.enter('highlands');
        c.zone().enemies = [];
        Prototype.updateHUD();
      });
      assert.equal(await p.locator('#status').textContent(), '', 'short status clears on travel');
      if (v.phone && v.width === 844) {
        await p.evaluate(() => {
          Prototype.game.notice('Long narration during rotation. '.repeat(9), 4, '', 'narration');
          Prototype.updateHUD();
        });
        await p.setViewportSize({ width: 390, height: 844 });
        await p.evaluate(() => Prototype.updateHUD());
        let rect = await p.locator('#message').boundingBox();
        assert(rect.x >= 0 && rect.x + rect.width <= 391, 'rotation recomputes portrait bounds');
        await p.setViewportSize({ width: 844, height: 390 });
        await p.evaluate(() => Prototype.updateHUD());
        rect = await p.locator('#message').boundingBox();
        assert(rect.x >= 0 && rect.x + rect.width <= 845, 'rotation recomputes landscape bounds');
      }
      assert.deepEqual(errors, [], 'no native shell/render errors');
      await context.close();
    }
    fs.writeFileSync(
      path.join(__dirname, 'browser-results.json'),
      JSON.stringify({ samples }, null, 2) + '\n',
    );
    console.log(
      'PASS 24 category/device layouts, notice bounds/vitals/skills/readability, region travel and actual full-text menu',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
