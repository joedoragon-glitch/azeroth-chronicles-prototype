'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.SESSION_BROWSER_ENGINE || 'chromium';
const out = path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html',
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
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
    browser = await pw[engine].launch(opts);
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
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
        const original = Prototype.game;
        const before = JSON.stringify(original.s);
        const tick = Campaign.prototype.tick;
        const roster = PrototypeCooperative.create({ Campaign, source: original });
        const require = (condition, message) => {
          if (!condition) throw Error(message);
        };
        require(!roster.join({ playerId: 'guest', heroClass: 'ranger' })
          .ok, 'Full party must refuse admission');
        require(roster.restCompanion(
          'host',
          roster.campaign.activeParty()[0].id,
        ), 'Host can rest an AI companion');
        require(roster.join({ playerId: 'guest', heroClass: 'ranger' })
          .ok, 'Freed companion slot admits guest');
        roster.awardExperience('guest', roster.campaign.xpRequired());
        require(roster.character('guest').level === 2 &&
          roster.character('host').level === 1, 'Progression is individual');
        require(Prototype.game === original &&
          JSON.stringify(original.s) === before, 'Live single-player campaign must stay untouched');
        require(Campaign.prototype.tick === tick &&
          Prototype.sessionMode === 'single-player', 'No runtime integration or prototype patch');
        require(!Array.from(document.querySelectorAll('button')).some((b) =>
          /^(Multiplayer|Host game|Join game)$/i.test(b.textContent.trim()),
        ), 'No multiplayer menu option');
      });
      console.log('PASS isolated cooperative roster leaves live single-player unchanged ' + tag);
      await page.evaluate(() => {
        const c = Prototype.game;
        c.s.party = [];
        c.zone().enemies = [];
        c.s.mercyTime = 0;
      });
      const click = async (selector) =>
        phone
          ? page.locator(selector).tap()
          : selector === '#touch-interact-button'
            ? page.keyboard.press('e')
            : page.locator(selector).click();
      const choose = async (name) =>
        phone
          ? page.getByRole('button', { name: new RegExp('^' + name) }).tap()
          : page.getByRole('button', { name: new RegExp('^' + name) }).click();

      // Original single-player behavior stays intact.
      await page.keyboard.press('j');
      const stopped = await page.evaluate(() => ({
        time: Prototype.game.s.time,
        paused: Prototype.paused,
        mode: Prototype.sessionMode,
      }));
      assert(stopped.paused);
      assert.equal(stopped.mode, 'single-player');
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => Prototype.game.s.time), stopped.time);
      const localSave = await page.evaluate(() => {
        Prototype.save();
        return localStorage.getItem('azeroth-v4-normal');
      });

      // Selecting cooperative policy immediately clears a paused local menu.
      await page.evaluate(() => Prototype.setSessionMode('cooperative'));
      assert(await page.locator('#modal').isHidden());
      await page.keyboard.press('j');
      const running = await page.evaluate(() => ({
        time: Prototype.game.s.time,
        x: Prototype.game.hero.x,
        y: Prototype.game.hero.y,
        blocked: Prototype.inputBlocked,
        paused: Prototype.paused,
      }));
      assert(running.blocked && !running.paused);
      await page.keyboard.press('s');
      await page.waitForFunction((time) => Prototype.game.s.time > time + 0.1, running.time);
      assert.deepEqual(
        await page.evaluate(() => ({ x: Prototype.game.hero.x, y: Prototype.game.hero.y })),
        { x: running.x, y: running.y },
        'menu navigation cannot move the hero',
      );
      assert.equal(
        await page.evaluate(() => {
          Prototype.save();
          return localStorage.getItem('azeroth-v4-normal');
        }),
        localSave,
        'co-op policy cannot overwrite the single-player save',
      );
      await page.evaluate(() => Prototype.game.enter('march'));
      assert(await page.locator('#modal').isVisible(), 'global journal survives travel');
      await page.keyboard.press('Escape');

      // Real combat continues underneath a local menu.
      await page.evaluate(() => {
        const c = Prototype.game;
        c.zone().props = [];
        c.s.party = [];
        c.s.mercyTime = 0;
        Object.assign(c.hero, { x: 900, y: 900, hp: c.hero.maxHp });
        const e = c.makeEnemy(
          {
            species: 'goblin',
            name: 'Menu combat fixture',
            level: 1,
            hp: 100000,
            damage: 2,
            gold: 0,
            xp: 0,
          },
          { x: 940, y: 900 },
        );
        e.aggro = true;
        c.zone().enemies = [e];
      });
      await page.keyboard.press('j');
      const hp = await page.evaluate(() => Prototype.game.hero.hp);
      await page.waitForFunction((before) => Prototype.game.hero.hp < before, hp);
      assert(await page.locator('#modal').isVisible());
      await page.evaluate(() => {
        Prototype.game.zone().enemies = [];
        Prototype.closeMenu();
      });

      // Local control pause does not freeze the cooperative world.
      await page.keyboard.press('p');
      const pausedControls = await page.evaluate(() => ({
        time: Prototype.game.s.time,
        input: Prototype.inputBlocked,
        world: Prototype.paused,
      }));
      assert(pausedControls.input && !pausedControls.world);
      await page.waitForFunction((time) => Prototype.game.s.time > time + 0.1, pausedControls.time);
      await page.keyboard.press('p');

      async function openTonicShop() {
        await page.evaluate(() => {
          const c = Prototype.game;
          c.enter('vale');
          c.zone().enemies = [];
          c.s.rescued.archive = true;
          c.hero.gold = 1000;
          const n = {
            id: 'session-neri',
            name: 'Neri',
            kind: 'alchemist',
            family: 'archive',
            x: c.hero.x,
            y: c.hero.y,
          };
          c.zone().npcs = [n];
          Prototype.updateHUD();
        });
        await click('#touch-interact-button');
        await page.waitForFunction(
          () => document.querySelector('#modal-title').textContent === 'Neri',
        );
      }
      await openTonicShop();
      await page.evaluate(() => {
        window.__staleBuy = [...document.querySelectorAll('#modal-actions button')].find((b) =>
          b.textContent.startsWith('Buy Preparation Tonic'),
        );
        Prototype.game.hero.gold = 0;
      });
      await page.evaluate(() => __staleBuy.click());
      assert.equal(
        await page.evaluate(() => Prototype.game.preparationTonicStock()),
        0,
        'purchase rechecks money',
      );
      assert.equal(await page.evaluate(() => Prototype.game.hero.gold), 0);

      await openTonicShop();
      const staleResult = await page.evaluate(() => {
        const buy = [...document.querySelectorAll('#modal-actions button')].find((b) =>
          b.textContent.startsWith('Buy Preparation Tonic'),
        );
        Prototype.game.enter('march');
        const before = Prototype.game.hero.gold;
        buy.click();
        return {
          hidden: document.querySelector('#modal').hidden,
          before,
          after: Prototype.game.hero.gold,
          stock: Prototype.game.preparationTonicStock(),
        };
      });
      assert(
        staleResult.hidden && staleResult.before === staleResult.after && staleResult.stock === 0,
        'travel rejects a captured old shop button before the next frame',
      );

      await openTonicShop();
      await page.evaluate(() => {
        Prototype.game.hero.x += 116;
      });
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await openTonicShop();
      await page.evaluate(() => {
        Prototype.game.zone().npcs = [];
      });
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await openTonicShop();
      await page.evaluate(() => Prototype.game.die());
      await page.waitForFunction(() => document.querySelector('#modal').hidden);

      // Nested Barracks specialists retain the Barracks lease, not a remote NPC lease.
      await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('vale');
        c.zone().enemies = [];
        c.zone().npcs = [];
        c.s.rescued.thorn = true;
        c.zone().buildings = [
          {
            id: 'session-barracks',
            name: 'Barracks',
            x: c.hero.x,
            y: c.hero.y,
            progress: 4,
            full: true,
          },
        ];
        Prototype.updateHUD();
      });
      await click('#touch-interact-button');
      await choose('Rescued specialists');
      const specialist = page.getByRole('button', { name: /Mira the Village Instructor/ });
      if (phone) await specialist.tap();
      else await specialist.click();
      assert(await page.locator('#modal').isVisible());
      await page.evaluate(() => Prototype.game.enter('march'));
      await page.waitForFunction(() => document.querySelector('#modal').hidden);

      // Two travel selections cannot act on different departure contexts.
      await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('vale');
        c.zone().enemies = [];
        c.hero.gold = 1000;
        c.zone().npcs = new Campaign().zone().npcs;
        const n = c.visibleNPCs().find((n) => n.kind === 'transport');
        Object.assign(c.hero, { x: n.x, y: n.y });
        Prototype.updateHUD();
      });
      await click('#touch-interact-button');
      const trip = await page.evaluate(() => {
        const old = [...document.querySelectorAll('#modal-actions button')].find((b) =>
          b.textContent.startsWith('Travel to'),
        );
        old.click();
        const zone = Prototype.game.zoneId,
          gold = Prototype.game.hero.gold;
        old.click();
        return {
          zone,
          gold,
          afterZone: Prototype.game.zoneId,
          afterGold: Prototype.game.hero.gold,
          hidden: document.querySelector('#modal').hidden,
        };
      });
      assert.equal(trip.zone, 'march');
      assert.equal(trip.afterZone, trip.zone);
      assert.equal(trip.afterGold, trip.gold);
      assert(trip.hidden);

      await click('#menu-button');
      await choose('Game and settings');
      await choose('Save and game management');
      for (const name of [
        'Save run',
        'Export save',
        'Import save',
        'New Normal game',
        'Load other mode run',
      ])
        assert(await page.getByRole('button', { name: new RegExp('^' + name) }).isDisabled(), name);
      await page.evaluate(() => Prototype.setSessionMode('single-player'));
      await page.keyboard.press('j');
      const restoredTime = await page.evaluate(() => Prototype.game.s.time);
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => Prototype.game.s.time), restoredTime);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(out, 'session-menu-' + tag + '.png') });
      console.log(
        'PASS ' +
          tag +
          ' single-player pause, co-op simulation/input, real combat, money, stale shop/Barracks/travel, death and save protection',
      );
      await page.close();
    }
  } catch (error) {
    await page
      ?.screenshot({ path: path.join(out, 'session-menu-failure-' + engine + '.png') })
      .catch(() => {});
    throw error;
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
