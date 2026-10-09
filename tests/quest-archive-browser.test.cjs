'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  root = path.resolve(__dirname, '..');
const engine = process.env.QUEST_BROWSER_ENGINE || 'chromium';
const out = path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\//, '') || 'index.html',
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
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser, page;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const opts = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE) {
      opts.executablePath = process.env.CHROMIUM_EXECUTABLE;
      opts.args = ['--no-sandbox'];
    }
    if (engine === 'webkit' && process.env.WEBKIT_EXECUTABLE) {
      opts.executablePath = process.env.WEBKIT_EXECUTABLE;
    }
    browser = await pw[engine].launch(opts);
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
      { width: 393, height: 852 },
      { width: 800, height: 375 },
    ]) {
      const phone = viewport.width < 1000,
        tag = engine + '-' + viewport.width + 'x' + viewport.height,
        errors = [];
      page = await browser.newPage({ viewport, hasTouch: phone, isMobile: phone });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        (process.env.PLAYTEST_URL || 'http://127.0.0.1:' + server.address().port + '/') +
          (phone ? 'phone.html' : 'index.html'),
      );
      await page.waitForFunction(() => !!window.Prototype);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      const cuePlacement = await page.evaluate(() => {
        const c = Prototype.game,
          ctx = document.querySelector('canvas').getContext('2d');
        const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
        c.tick = () => {};
        Object.assign(c.hero, { x: recruiter.x, y: recruiter.y + 80 });
        const arc = ctx.arc,
          fillText = ctx.fillText,
          glyphs = [];
        let circle;
        try {
          ctx.arc = function (x, y, radius, ...args) {
            if (radius === 16) circle = { x, y, radius };
            return arc.call(this, x, y, radius, ...args);
          };
          ctx.fillText = function (text, x, y, ...args) {
            if (text === '!') glyphs.push({ x, y, circle });
            return fillText.call(this, text, x, y, ...args);
          };
          Prototype.renderer.draw();
        } finally {
          ctx.arc = arc;
          ctx.fillText = fillText;
        }
        return glyphs;
      });
      assert(cuePlacement.length, 'Recruiter cue is rendered near the hero');
      for (const glyph of cuePlacement) {
        assert(glyph.circle && Math.abs(glyph.x - glyph.circle.x) < 1);
        assert(
          Math.abs(glyph.y - glyph.circle.y) < glyph.circle.radius,
          'Recruiter glyph remains inside its marker circle',
        );
      }
      await page.evaluate(() => {
        const c = Prototype.game;
        c.tick = () => {};
        c.hero.level = 20;
        c.hero.xp = 0;
        c.notice('BOSS VANQUISHED · The Drowned Keeper', 7, 'The Archive is open to exploration.');
        c.notice('Sunken Archive · halls secured', 7, 'First clear reward delivered.');
        Prototype.updateHUD();
      });
      await page.waitForFunction(
        () => document.querySelectorAll('#message .notice-card .notice-detail').length === 2,
      );
      const cards = await page.locator('#message .notice-card').allTextContents();
      assert(cards[0].includes('BOSS VANQUISHED') && cards[1].includes('halls secured'));
      assert.equal(await page.locator('#message .notice-detail').count(), 2);
      const bounds = await page.locator('#message').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1);
      if (phone) {
        const separate = await page.evaluate(() => {
          document.querySelector('#status').textContent = 'Need 70 crowns.';
          Prototype.updateHUD();
          const status = document.querySelector('#status').getBoundingClientRect();
          const notices = document.querySelector('#message').getBoundingClientRect();
          return (
            document.querySelectorAll('#message .notice-card').length === 2 &&
            status.top >= notices.bottom
          );
        });
        assert(separate, 'stacked milestones and status remain separate');
      }
      await page.screenshot({ path: path.join(out, 'archive-milestones-' + tag + '.png') });
      await page.evaluate(() => (document.querySelector('#status').textContent = ''));
      await page.waitForFunction(
        () => !document.querySelector('#message').classList.contains('visible'),
        null,
        { timeout: 15000 },
      );
      await page.keyboard.press('g');
      assert(
        (await page.locator('#modal-description').textContent()).includes(
          'Fallen companions need Barracks',
        ),
      );
      assert((await page.locator('#modal-description').textContent()).includes('charged Skill 3'));
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('archive');
        const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.family === 'archive');
        boss.hp = 0;
        c.kill(boss);
        c.notices.length = 0;
        const n = c.zone().npcs.find((n) => n.id === 'keeper-captive');
        Object.assign(c.hero, { x: n.x, y: n.y + 80 });
        Prototype.updateHUD();
      });
      await page.waitForTimeout(80);
      await page.screenshot({ path: path.join(out, 'keeper-captive-' + tag + '.png') });
      await page.keyboard.press('e');
      assert.equal(await page.locator('#modal-title').textContent(), 'The Drowned Keeper');
      assert((await page.locator('#modal-description').textContent()).includes('Free Neri'));
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const c = Prototype.game;
        c.rescue('archive');
        c.notices.length = 0;
        Prototype.updateHUD();
      });
      await page.keyboard.press('e');
      await page
        .getByRole('button', { name: 'Promise to protect the Archive', exact: true })
        .click();
      assert.equal(await page.locator('#modal-title').textContent(), 'The Keeper’s shelves');
      assert(
        !(await page
          .getByRole('button', { name: 'The orders among the shelves', exact: false })
          .count()),
      );
      await page.getByRole('button', { name: 'Your skills', exact: false }).click();
      await page.getByRole('button', { name: /Skill 3 ·/ }).click();
      assert(
        (await page.locator('#modal-description').textContent()).includes(
          'wounded living companions',
        ),
      );
      await page.screenshot({ path: path.join(out, 'keeper-counsel-' + tag + '.png') });
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const c = Prototype.game;
        const n = c.zone().npcs.find((n) => n.id === 'archive-ledger');
        Object.assign(c.hero, { x: n.x, y: n.y });
        Prototype.updateHUD();
      });
      await page.keyboard.press('e');
      assert.equal(await page.locator('#modal-title').textContent(), 'The Keeper’s ledger');
      assert(await page.evaluate(() => Prototype.game.s.keeperEvidence));
      await page.keyboard.press('Escape');
      await page.evaluate(() => Prototype.save());
      const restored = await page.evaluate(() => {
        const c = Campaign.restore(Prototype.game.snapshot());
        return { pact: c.s.keeperPact, evidence: c.s.keeperEvidence };
      });
      assert.deepEqual(restored, { pact: true, evidence: true });
      await page.evaluate(() => {
        const c = Prototype.game;
        c.s.pending.archive = { kind: 'dungeon', count: 1 };
        c.activatePending();
        Prototype.updateHUD();
      });
      assert(
        !(await page.evaluate(() => Prototype.game.visibleNPCs().some((n) => n.kind === 'keeper'))),
      );
      assert.equal(
        await page.evaluate(
          () =>
            Prototype.game
              .zone()
              .enemies.filter((e) => e.family === 'archive' && e.form === 'true' && e.hp > 0)
              .length,
        ),
        1,
      );
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          tag +
          ' two milestone cards, status spacing, practical controls, cage, bargain, optional knowledge, evidence, save and TRUE escape',
      );
      await page.close();
    }
  } catch (e) {
    await page
      ?.screenshot({ path: path.join(out, 'quest-archive-failure-' + engine + '.png') })
      .catch(() => {});
    throw e;
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
