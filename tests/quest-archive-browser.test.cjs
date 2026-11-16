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
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
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
  res.setHeader('Content-Length', fs.statSync(file).size);
  fs.createReadStream(file).pipe(res);
});
// A restored campaign is title-owned until the real Continue gesture.
async function resumeLoadedCampaign(page) {
  await page.locator('#title-continue').click();
  await page.waitForFunction(
    () =>
      window.Prototype.started &&
      document.querySelector('#title-screen').hidden &&
      document.querySelector('#scene-loading')?.hidden !== false,
    null,
    { timeout: 90000 },
  );
}
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
      { width: 844, height: 390 },
    ]) {
      const phone = viewport.width < 1000,
        tag = engine + '-' + viewport.width + 'x' + viewport.height,
        errors = [];
      const shell = await browser.newPage({ viewport, hasTouch: phone, isMobile: phone });
      shell.on('pageerror', (e) => errors.push(e.message));
      // The first-run language welcome is covered elsewhere; use a genuine
      // persisted English preference so this exercise enters the title.
      await shell.addInitScript(() => localStorage.setItem('azeroth-display-language-v1', 'en'));
      await shell.goto(
        (process.env.PLAYTEST_URL || 'http://127.0.0.1:' + server.address().port + '/') +
          (phone ? 'phone.html' : 'index.html'),
      );
      // phone.html hosts the actual game inside its landscape-safe iframe.
      // Route gameplay queries there, while screenshots and key presses belong
      // to the outer browser page. Preserve the real phone entry route.
      if (phone)
        await shell
          .frameLocator('#phone-game-frame')
          .locator('#title-screen')
          .waitFor({ state: 'attached' });
      const gameFrame = phone ? shell.frame({ url: /phone-game\.html/ }) : shell;
      assert(gameFrame, 'the playable game frame is available');
      page = {
        locator: (...args) => gameFrame.locator(...args),
        getByRole: (...args) => gameFrame.getByRole(...args),
        evaluate: (...args) => gameFrame.evaluate(...args),
        waitForFunction: (...args) => gameFrame.waitForFunction(...args),
        waitForTimeout: (...args) => shell.waitForTimeout(...args),
        keyboard: shell.keyboard,
        screenshot: (...args) => shell.screenshot(...args),
        reload: () => gameFrame.goto(gameFrame.url()),
        close: () => shell.close(),
      };
      await page.waitForFunction(() => !!window.Prototype);
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      // This browser exercise must enter a real playable campaign. Prior
      // double-F presses merely dismissed the title dialogs while "started"
      // remained false; gameplay-only F/G input then silently did nothing.
      await page.locator('#title-new').click();
      await page.getByRole('button', { name: /^Choose Hero/ }).click();
      await page.locator('#modal-actions button.class-character-choice').first().click();
      await page.waitForFunction(
        () => window.Prototype.started && document.querySelector('#modal').hidden,
        null,
        { timeout: 90000 },
      );
      // Validate geometry in the actual game CSS viewport. In portrait,
      // phone.html rotates its landscape game frame, so outer width differs.
      const gameViewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      await require('./helpers/notice-browser.cjs').verifyNoticeStrip(
        page,
        out,
        tag,
        phone,
        gameViewport,
      );
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
      await page.evaluate((isPhone) => {
        const c = Prototype.game;
        c.tick = () => {};
        c.hero.level = 20;
        c.hero.xp = 0;
        const duration = isPhone ? 2.5 : 7;
        c.notice(
          'BOSS VANQUISHED · The Drowned Keeper',
          duration,
          'The Archive is open to exploration.',
        );
        c.notice('Sunken Archive · halls secured', duration, 'First clear reward delivered.');
        Prototype.updateHUD();
      }, phone);
      await page.waitForFunction((isPhone) => {
        Prototype.updateHUD();
        const cards = document.querySelectorAll('#message .notice-card');
        return (
          cards.length === (isPhone ? 1 : 2) && cards[0].textContent.includes('BOSS VANQUISHED')
        );
      }, phone);
      const firstCards = await page.locator('#message .notice-card').allTextContents();
      assert(firstCards[0].includes('BOSS VANQUISHED'));
      assert.equal(await page.locator('#message .notice-detail').count(), phone ? 1 : 2);
      if (phone) {
        // The production phone HUD has one narrative slot. Both events must
        // still be delivered sequentially rather than discarded or stacked.
        const firstFits = await page.evaluate(() => {
          const status = document.querySelector('#status');
          status.textContent = 'Need 70 crowns.';
          Prototype.updateHUD();
          const routineDeferred =
            status.classList.contains('notice-deferred') &&
            getComputedStyle(status).visibility === 'hidden';
          // An important status stays visible and moves below the notice.
          status.dataset.noticeTier = 'important';
          Prototype.updateHUD();
          const message = document.querySelector('#message').getBoundingClientRect();
          const important = status.getBoundingClientRect();
          const importantSeparated =
            getComputedStyle(status).visibility !== 'hidden' && important.top >= message.bottom;
          delete status.dataset.noticeTier;
          Prototype.updateHUD();
          return routineDeferred && importantSeparated;
        });
        assert(
          firstFits,
          'phone routine receipts defer and important status remains below the milestone',
        );
        await page.waitForFunction(
          () => {
            Prototype.updateHUD();
            const cards = document.querySelectorAll('#message .notice-card');
            return (
              cards.length === 1 &&
              cards[0].textContent.includes('halls secured') &&
              cards[0].querySelector('.notice-detail')?.textContent.includes('First clear reward')
            );
          },
          null,
          { timeout: 12000 },
        );
        const secondCard = await page.locator('#message .notice-card').allTextContents();
        assert(secondCard[0].includes('halls secured'));
      } else {
        assert(firstCards[1].includes('halls secured'));
      }
      const bounds = await page.evaluate(() => {
        const rect = document.querySelector('#message').getBoundingClientRect();
        return { x: rect.x, right: rect.right, viewportWidth: innerWidth };
      });
      assert(bounds.x >= 0 && bounds.right <= bounds.viewportWidth + 1);
      await page.screenshot({ path: path.join(out, 'archive-milestones-' + tag + '.png') });
      await page.evaluate(() => (document.querySelector('#status').textContent = ''));
      await page.waitForFunction(
        () => !document.querySelector('#message').classList.contains('visible'),
        null,
        { timeout: 15000 },
      );
      // G is the live, remappable Controls shortcut; technical skill and
      // combat detail now belongs to the separate X Skill journal.
      await page.keyboard.press('g');
      assert.equal(await page.locator('#modal-title').textContent(), 'Controls');
      await page.getByRole('button', { name: /^Customize keyboard/ }).click();
      assert.equal(await page.locator('#modal-title').textContent(), 'Customize keyboard');
      await page.getByRole('button', { name: /^Movement and menu keys/ }).click();
      assert(
        await page.getByRole('button', { name: /Confirm \/ interact · F/ }).count(),
        'the real interaction binding remains visible in Controls',
      );
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      assert(await page.locator('#modal').isHidden(), 'Controls return to live gameplay');
      await page.keyboard.press('x');
      assert.equal(await page.locator('#modal-title').textContent(), 'Skill journal');
      await page.getByRole('button', { name: /^Skill 1 ·/ }).click();
      assert(
        (await page.locator('#modal-description').textContent()).length > 50,
        'a learned skill has a real technical description',
      );
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /^Combat conditions/ }).click();
      await page.getByRole('button', { name: 'Slow', exact: true }).click();
      assert((await page.locator('#modal-description').textContent()).includes('cooldown'));
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      assert(await page.locator('#modal').isHidden(), 'journal Back restores field input');
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
      await page.keyboard.press('f');
      assert.equal(await page.locator('#modal-title').textContent(), 'The Drowned Keeper');
      const captiveCopy = await page.locator('#modal-description').textContent();
      assert(
        captiveCopy.includes('Neri knows how to preserve them') &&
          captiveCopy.includes('Free her; then we can speak'),
        'the captive Keeper retains the approved Neri rescue prerequisite',
      );
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const c = Prototype.game;
        c.rescue('archive');
        c.notices.length = 0;
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
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
      assert((await page.locator('#modal-description').textContent()).includes('Shield Bash'));
      await page.screenshot({ path: path.join(out, 'keeper-counsel-' + tag + '.png') });
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('f');
      await page
        .getByRole('button', { name: 'Adversaries and their attacks', exact: false })
        .click();
      await page.getByRole('button', { name: 'Drowned Keeper', exact: true }).click();
      await page.getByRole('button', { name: 'Show me the figures', exact: true }).click();
      assert(
        (await page.locator('#modal-description').textContent()).includes(
          'draws back 15% of HP actually taken',
        ),
      );
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const c = Prototype.game;
        const n = c.zone().npcs.find((n) => n.id === 'archive-ledger');
        Object.assign(c.hero, { x: n.x, y: n.y });
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      assert.equal(await page.locator('#modal-title').textContent(), 'The Keeper’s ledger');
      assert(await page.evaluate(() => Prototype.game.s.keeperEvidence));
      await page.keyboard.press('Escape');
      assert(
        await page.evaluate(() => Prototype.save()),
        'Keeper evidence saves during active play',
      );
      await page.reload();
      await page.waitForFunction(() => !!window.Prototype && Prototype.game.s.keeperPact);
      assert(
        await page.evaluate(
          () => Prototype.game.s.keeperEvidence && Prototype.game.keeperAvailable(),
        ),
      );
      assert.equal(
        await page.locator('#modal').isVisible(),
        false,
        'Knowledge reload does not force dialogue',
      );
      const restored = await page.evaluate(() => {
        const c = Campaign.restore(Prototype.game.snapshot());
        return { pact: c.s.keeperPact, evidence: c.s.keeperEvidence };
      });
      assert.deepEqual(restored, { pact: true, evidence: true });
      await resumeLoadedCampaign(page);
      await page.evaluate(() => {
        const c = Prototype.game;
        if (c.zoneId !== 'archive') c.enter('archive');
        c.tick = () => {};
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
      assert(await page.evaluate(() => Prototype.save()), 'The active TRUE encounter saves');
      await page.reload();
      await page.waitForFunction(
        () => !!window.Prototype && Prototype.game.s.pending.archive?.active,
        null,
        { timeout: 20000 },
      );
      assert(
        !(await page.evaluate(() => Prototype.game.keeperAvailable())),
        'Reload preserves escape',
      );
      await resumeLoadedCampaign(page);
      await page.evaluate(() => {
        const c = Prototype.game;
        if (c.zoneId !== 'archive') c.enter('archive');
        c.tick = () => {};
        const boss = c
          .zone()
          .enemies.find((e) => e.family === 'archive' && e.form === 'true' && e.hp > 0);
        boss.hp = 0;
        c.kill(boss);
        c.notices.length = 0;
        const n = c.visibleNPCs().find((n) => n.kind === 'keeper');
        Object.assign(c.hero, { x: n.x, y: n.y + 80 });
        if (!Prototype.save()) throw Error('TRUE Keeper recapture must save');
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      assert.equal(
        await page.locator('#modal-title').textContent(),
        'The Keeper’s shelves',
        'Recapture preserves the promise',
      );
      await page.keyboard.press('Escape');
      await page.reload();
      await page.waitForFunction(() => !!window.Prototype && Prototype.game.s.true.archive);
      await resumeLoadedCampaign(page);
      await page.evaluate(() => {
        const c = Prototype.game;
        c.tick = () => {};
        c.enter('vale');
        const base = {
          id: 'keeper-browser-base',
          kind: 'barracks',
          name: 'Barracks',
          progress: 4,
          full: false,
          upgradeProgress: 0,
          upgradePaid: false,
          queue: 0,
          ...c.safe(800, 800),
        };
        c.zone().buildings.push(base);
        Object.assign(c.hero, { x: base.x, y: base.y });
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      assert.equal(await page.locator('#modal-title').textContent(), 'Basic Barracks');
      await page.getByRole('button', { name: /^Training/ }).click();
      assert.equal(await page.locator('#modal-title').textContent(), 'Training');
      await page.getByRole('button', { name: /^Rescued specialists/ }).click();
      assert.equal(await page.locator('#modal-title').textContent(), 'Rescued specialists');
      const remoteKeeper = await page.evaluate(() => {
        const c = Prototype.game;
        return {
          pact: c.s.keeperPact,
          rescued: c.s.rescued.archive,
          normal: c.s.normal.archive,
          true: c.s.true.archive,
          pending: c.s.pending.archive || null,
          available: c.keeperAvailable(),
          zone: c.zoneId,
          bosses: c.s.zones.archive.enemies
            .filter((e) => e.type === 'boss' && e.family === 'archive')
            .map((e) => ({ form: e.form, hp: e.hp, respawn: e.respawn })),
          options: Array.from(document.querySelectorAll('#modal-actions button')).map((b) =>
            b.textContent.trim(),
          ),
        };
      });
      assert(
        remoteKeeper.available && remoteKeeper.pact,
        'remote Keeper prerequisite after saved TRUE victory: ' + JSON.stringify(remoteKeeper),
      );
      assert(
        remoteKeeper.options.some((label) => label.includes('Drowned Keeper · The Archive')),
        'remote Keeper menu option remains accessible: ' + JSON.stringify(remoteKeeper),
      );
      await page
        .getByRole('button', { name: 'Drowned Keeper · The Archive', exact: false })
        .click();
      assert.equal(
        await page.locator('#modal-title').textContent(),
        'The Keeper’s shelves',
        'Basic Barracks grants genuine remote consultation',
      );
      await page.screenshot({ path: path.join(out, 'keeper-barracks-' + tag + '.png') });
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
