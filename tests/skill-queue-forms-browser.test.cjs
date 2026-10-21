'use strict';
// Focused real-shell input, dispatch and visible-form checks. No game/device matrix.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const relative = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
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
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
    await page.waitForFunction(() => window.Prototype?.game);
    await require('./helpers/language-browser.cjs').selectEnglish(page);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.getElementById('modal').hidden);
    await page.evaluate(() => {
      const g = Prototype.game;
      window.queueClock = 100;
      g.setPartyChargeClock(() => queueClock);
      g.tick = () => {};
      g.blocked = () => false;
      g.line = () => true;
      g.clearSegment = () => true;
      window.queueCasts = [];
      const cast = g.cast;
      g.cast = function (slot, target, charged, ...rest) {
        const ok = cast.call(this, slot, target, charged, ...rest);
        if (ok)
          queueCasts.push({
            slot,
            charged: !!charged,
            time: queueClock,
            cd: this.hero.cd[slot - 1],
          });
        return ok;
      };
      window.queueReset = (cls = 'mage', cd = 1, slot = 2) => {
        Prototype.openMenu('Input reset', '', []);
        Prototype.closeMenu();
        g.clearPartyCharges();
        g.enter('vale');
        g.s.mercyTime = 0;
        Object.assign(g.hero, {
          class: cls,
          x: 600,
          y: 900,
          hp: 50,
          maxHp: 1000,
          mp: 1000,
          maxMp: 1000,
          order: null,
          shieldStance: 0,
          shieldRank: 0,
          deathRollHeld: false,
          keeperHeld: false,
        });
        delete g.hero.silenceField;
        g.hero.skills = Array(8).fill(1);
        g.hero.talents = [0, 0, 0, 0];
        g.hero.cd = Array(8).fill(0);
        g.hero.cd[slot - 1] = cd;
        g.s.party = [g.unit('soldier', 620, 900)];
        g.zone().props = [];
        g.zone().npcs = [];
        g.zone().nodes = [];
        g.zone().buildings = [];
        const e = g.makeEnemy(
          {
            species: 'goblin',
            name: 'Input target',
            level: 1,
            hp: 100000,
            damage: 0,
            gold: 0,
            xp: 0,
          },
          { x: 680, y: 900 },
        );
        g.zone().enemies = [e];
        g.engage(e);
        g.manualHeroTargetId = e.id;
        g.manualHeroTargetLocked = true;
        g.s.heroTarget = e.id;
        g.s.projectiles = [];
        g.effects = [];
        queueCasts = [];
        Prototype.updateHUD();
      };
    });
    const reset = (cls = 'mage', cd = 1, slot = 2) =>
      page.evaluate((a) => queueReset(...a), [cls, cd, slot]);
    const down = (slot = 2, id = 91) =>
      page.locator('#skill-' + slot).evaluate((el, id) => {
        el.setPointerCapture = () => {};
        el.onpointerdown({ pointerId: id, button: 0, preventDefault() {} });
      }, id);
    const up = (slot = 2, id = 91) =>
      page.locator('#skill-' + slot).evaluate((el, id) => {
        el.onpointerup({ pointerId: id, button: 0 });
        el.onlostpointercapture({ pointerId: id });
      }, id);
    const tap = async (slot = 2, id = 91) => {
      await down(slot, id);
      await up(slot, id);
    };
    const step = (dt) =>
      page.evaluate(async (dt) => {
        queueClock += dt;
        Prototype.game.hero.cd = Prototype.game.hero.cd.map((x) => Math.max(0, x - dt));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        Prototype.updateHUD();
      }, dt);
    const state = () =>
      page.evaluate(() => ({
        queue: Prototype.queuedChargePresentation(),
        charge: Prototype.chargePresentation(),
        casts: queueCasts,
        order: Prototype.game.hero.order,
        label: document.querySelector('#skill-2 small').textContent,
        form: document.querySelector('#skill-2').dataset.queuedForm,
      }));
    let cases = 0;
    const hold = async (slot = 2, seconds = 0.27, id = 91) => {
      await down(slot, id);
      await step(seconds);
      await up(slot, id);
    };
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (const seconds of [0, 0.27, 0.7]) {
        await reset(cls);
        if (seconds) await hold(2, seconds);
        else await tap();
        let s = await state();
        const charged = seconds > 0;
        assert.equal(s.queue.length, 1);
        assert.equal(s.queue[0].charged, charged);
        assert.equal(s.form, charged ? 'charged' : 'normal');
        assert(s.label.includes(charged ? 'CHARGED\nQUEUED' : 'NORMAL\nQUEUED'));
        assert.equal(s.queue[0].color, charged ? '#f6d77a' : '#9dc6dd');
        await step(1);
        s = await state();
        if (charged) {
          assert.equal(s.casts.length, 0);
          assert.equal(s.charge.state, 'charging');
          await step(0.64);
          assert.equal((await state()).casts.length, 0);
          await step(0.02);
          s = await state();
        }
        assert.equal(s.casts.length, 1);
        assert.equal(s.casts[0].charged, charged);
        assert.equal(
          s.casts[0].cd,
          await page.evaluate((charged) => Prototype.game.skillCooldown(2, charged), charged),
        );
        await step(0.8);
        assert.equal((await state()).casts.length, 1);
        cases++;
      }
    for (let slot = 1; slot <= 8; slot++)
      for (const charged of [false, true]) {
        await reset('ranger', 1, slot);
        if (charged) await hold(slot);
        else await tap(slot);
        await step(1);
        if (charged) await step(0.66);
        const casts = (await state()).casts;
        assert.equal(casts.length, 1, `slot ${slot}`);
        assert.equal(casts[0].charged, charged);
        cases++;
      }
    // No second-tap delay: normal fires at cooldown expiry after release.
    await reset('mage', 0.05);
    await tap();
    await step(0.06);
    assert.equal((await state()).casts.length, 1);
    assert(!(await state()).casts[0].charged);
    cases++;
    // Hold across expiry: no normal release or charge preload.
    await reset('mage', 0.05);
    await down();
    await step(0.24);
    assert.equal((await state()).casts.length, 0);
    await step(0.02);
    assert((await state()).queue[0].charged);
    assert.equal((await state()).charge.state, 'charging');
    await up();
    await step(0.66);
    assert((await state()).casts[0].charged);
    cases++;
    await reset('mage', 0.05);
    await down();
    await step(0.24);
    await up();
    await step(0.01);
    assert.equal((await state()).casts.length, 1);
    assert(!(await state()).casts[0].charged);
    cases++;
    // Boundaries and forgiving long holds select exactly one matching form.
    for (const seconds of [0.1, 0.2, 0.249, 0.25, 0.251, 0.4, 0.65, 0.9]) {
      await reset('mage', 2);
      await hold(2, seconds);
      const charged = seconds >= 0.25;
      assert.equal((await state()).queue[0].charged, charged, `hold ${seconds}`);
      await step(2);
      if (charged) await step(0.66);
      const casts = (await state()).casts;
      assert.equal(casts.length, 1);
      assert.equal(casts[0].charged, charged);
      cases++;
    }
    // Double/repeated taps always remain normal. No hidden alternate gesture.
    await reset('mage', 2);
    for (const dt of [0, 0.05, 0.1, 0.3]) {
      await step(dt);
      await tap();
      assert(!(await state()).queue[0].charged);
    }
    await step(2);
    assert.equal((await state()).casts.length, 1);
    assert(!(await state()).casts[0].charged);
    cases++;
    // Ready-skill manual tap/hold behavior remains unchanged.
    await reset('mage', 0);
    await tap();
    assert.equal((await state()).casts.length, 1);
    assert(!(await state()).casts[0].charged);
    await reset('mage', 0);
    await hold(2, 0.26);
    assert.equal((await state()).casts.length, 0);
    await reset('mage', 0);
    await down();
    await step(0.66);
    assert.equal((await state()).casts.length, 0);
    await up();
    assert((await state()).casts[0].charged);
    cases++;
    // Mixed forms are independent; a longer unrelated cooldown never blocks readiness.
    await reset('mage', 2);
    await tap();
    await page.evaluate(() => (Prototype.game.hero.cd[0] = 0.5));
    await hold(1);
    await step(0.5);
    await step(0.66);
    assert.deepEqual(
      (await state()).casts.map((c) => [c.slot, c.charged]),
      [[1, true]],
    );
    await step(1);
    assert.deepEqual(
      (await state()).casts.map((c) => [c.slot, c.charged]),
      [
        [1, true],
        [2, false],
      ],
    );
    cases++;
    // Already-charged requests cannot be downgraded/restarted by repeated taps.
    await reset();
    await hold();
    await step(1);
    await step(0.3);
    const before = (await state()).charge.progress;
    await tap(2, 93);
    assert((await state()).charge.progress >= before);
    assert((await state()).queue[0].charged);
    await step(0.36);
    assert.equal((await state()).casts.length, 1);
    cases++;
    // Ready manual skills preserve pending requests.
    await reset();
    await tap();
    await tap(4, 92);
    assert((await state()).queue.some((x) => x.slot === 2 && !x.charged));
    await step(1);
    assert.deepEqual(
      (await state()).casts.map((c) => [c.slot, c.charged]),
      [
        [4, false],
        [2, false],
      ],
    );
    cases++;
    // Wrong or second finger cannot finish or alter another contact.
    await reset();
    await down(2, 91);
    await down(2, 92);
    await up(2, 92);
    await step(0.27);
    assert((await state()).queue[0].charged);
    await up(2, 91);
    cases++;
    await reset();
    await down();
    await page.locator('#skill-2').evaluate((el) => el.onpointercancel({ pointerId: 91 }));
    assert.equal((await state()).queue.length, 0);
    cases++;
    for (const charged of [false, true]) {
      await reset();
      if (charged) await hold();
      else await tap();
      await page.locator('#recall-button').click();
      assert.equal((await state()).queue.length, 0);
      await reset();
      if (charged) await hold();
      else await tap();
      await page.evaluate(() => Prototype.openMenu('Cancel', '', []));
      assert.equal((await state()).queue.length, 0);
      await page.evaluate(() => Prototype.closeMenu());
      await reset();
      if (charged) await hold();
      else await tap();
      await page.evaluate(() => {
        Prototype.game.hero.x = 200;
        Prototype.game.hero.y = 500;
      });
      await step(1);
      if (charged) await step(0.66);
      assert.equal((await state()).casts.length, 0);
      assert.equal((await state()).order, null);
      cases += 3;
    }
    await reset();
    await hold();
    await step(1);
    await step(0.3);
    await page.evaluate(() => {
      Prototype.game.hero.hp = 500;
      Prototype.game.hitParty(Prototype.game.hero, 100, 0, null, true);
    });
    await step(0.02);
    assert.equal((await state()).queue.length, 0);
    assert.equal((await state()).casts.length, 0);
    assert(
      await page.evaluate(
        () =>
          Prototype.game.hero.hp > 0 && Prototype.game.partyChargeRecovery(Prototype.game.hero) > 0,
      ),
    );
    cases++;
    // Genuine keyboard input follows the same tap/hold path.
    await reset();
    await page.keyboard.press('2');
    await step(0.1);
    await page.keyboard.press('2');
    assert(!(await state()).queue[0].charged);
    cases++;
    await reset();
    await page.keyboard.down('2');
    await step(0.26);
    await page.keyboard.up('2');
    assert((await state()).queue[0].charged);
    cases++;
    // Genuine touch double taps remain normal; native mouse hold selects charged.
    await reset('mage', 2);
    let box = await page.locator('#skill-2').boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await step(0.15);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    assert(!(await state()).queue[0].charged);
    cases++;
    await reset();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await step(0.27);
    await page.mouse.up();
    assert((await state()).queue[0].charged);
    cases++;
    // Long frame / low cadence cannot turn a held request into an ordinary cast.
    await reset('mage', 0.05);
    await down();
    await step(2);
    assert((await state()).queue[0].charged);
    assert.equal((await state()).casts.length, 0);
    await up();
    await step(0.66);
    assert((await state()).casts[0].charged);
    cases++;
    for (const kind of ['death', 'zone']) {
      await reset();
      await tap();
      await page.evaluate((kind) => {
        if (kind === 'death') Prototype.game.hero.hp = 0;
        else Prototype.game.enter('march');
      }, kind);
      await step(0.02);
      assert.equal((await state()).queue.length, 0, kind);
      cases++;
    }
    // Real defeat/recovery may reuse the same hero and region.
    await reset();
    await tap();
    await page.evaluate(() => {
      Prototype.game.hero.hp = 5;
      Prototype.game.hitParty(Prototype.game.hero, 999999, 0, null, true);
    });
    await step(0.02);
    assert.equal((await state()).queue.length, 0);
    cases++;
    // Capture English and Spanish feedback at phone dimensions.
    const out = path.join(root, 'tools/visual-review/skill-queue-dev139');
    fs.mkdirSync(out, { recursive: true });
    await reset('ranger', 3);
    await tap();
    await page.evaluate(() => (Prototype.game.hero.cd[3] = 3));
    await down(4);
    await step(0.27);
    await up(4);
    await page.screenshot({
      path: path.join(out, 'phone-queued-en.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    const bounds = await page.locator('#skills > button').evaluateAll((els) =>
      els
        .filter((e) => !e.classList.contains('locked'))
        .map((e) => ({
          width: e.querySelector('small').clientWidth,
          scroll: e.querySelector('small').scrollWidth,
          text: e.querySelector('small').textContent,
        })),
    );
    assert(
      bounds.every((e) => e.scroll <= e.width + 1),
      JSON.stringify(bounds),
    );
    await page.locator('#menu-button').click();
    await page.getByRole('button', { name: /^Game and settings/ }).click();
    await page.getByRole('button', { name: /^Language/ }).click();
    await page.getByRole('button', { name: /^Español/ }).click();
    await page.evaluate(() => Prototype.closeMenu());
    await reset('ranger', 3);
    await tap();
    await page.evaluate(() => (Prototype.game.hero.cd[3] = 3));
    await down(4);
    await step(0.27);
    await up(4);
    assert((await state()).label.includes('NORMAL\nCOLA'));
    assert((await page.locator('#skill-4 small').textContent()).includes('CARGADA\nCOLA'));
    await page.screenshot({
      path: path.join(out, 'phone-queued-es.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => (document.body.dataset.experience = 'desktop'));
    await page.screenshot({
      path: path.join(out, 'desktop-queued-es.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    const desktopBounds = await page.locator('#skills > button.skill-queued').evaluateAll((els) =>
      els.map((e) => ({
        width: e.querySelector('small').clientWidth,
        scroll: e.querySelector('small').scrollWidth,
        text: e.querySelector('small').textContent,
      })),
    );
    assert(
      desktopBounds.every((e) => e.scroll <= e.width + 1),
      JSON.stringify(desktopBounds),
    );
    await page.reload();
    await page.waitForFunction(() => Prototype?.game);
    assert.equal((await page.evaluate(() => Prototype.queuedChargePresentation())).length, 0);
    cases++;
    // End on a real phone startup; all exceptions are failures.
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, 'checks.json'),
      JSON.stringify(
        {
          cases,
          desktopBounds,
          errors,
          bounds,
          scope:
            'Focused Chromium phone shell; deterministic active clock, actual dispatch and selected physical inputs. No broad CI or device/FPS certification.',
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'PASS ' + cases + ' focused skill queue input/dispatch/lifecycle cases; no page errors.',
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
