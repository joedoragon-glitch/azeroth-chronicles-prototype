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
      await page.evaluate(() => {
        const c = Prototype.game;
        c.tick = () => {};
        c.hero.level = 20;
        c.hero.xp = 0;
        for (const id of ['quest-1', 'quest-5']) {
          const q = c.questDefs().find((q) => q.id === id);
          c.s.quests[id].done = true;
          c.payQuest(q, c.s.quests[id]);
        }
        Prototype.updateHUD();
      });
      await page.waitForFunction(
        () => document.querySelectorAll('#message .notice-card .notice-detail').length === 2,
      );
      const cards = await page.locator('#message .notice-card').allTextContents();
      assert(cards[0].includes('road is a little quieter') && cards[1].includes('Fields, camps'));
      assert.equal(await page.locator('#message .notice-detail').count(), 2);
      const bounds = await page.locator('#message').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1);
      if (phone) {
        await page.evaluate(
          () => (document.querySelector('#status').textContent = 'Need 70 crowns.'),
        );
        await page.waitForTimeout(40);
        const b = await page.locator('#status').boundingBox();
        assert(b.y >= bounds.y + bounds.height, 'long narration and status remain separate');
      }
      await page.screenshot({ path: path.join(out, 'quest-narration-' + tag + '.png') });
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
          ' two narrative cards, status spacing, practical controls, cage, bargain, optional knowledge, evidence, save and TRUE escape',
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
