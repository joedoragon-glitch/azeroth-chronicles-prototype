'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  cp = require('node:child_process'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..'),
  out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
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
    const errors = [],
      results = {};
    const open = async () => {
      const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      });
      p.on('pageerror', (e) => errors.push(e.message));

      await p.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
      await p.waitForFunction(() => window.Prototype?.game);
      await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
      await p.keyboard.press('f');
      await p.keyboard.press('f');
      await p.waitForFunction(() => document.getElementById('modal').hidden);
      return p;
    };
    const p = await open();
    await p.evaluate(
      (baseline) => {
        const current = PrototypeCombatVisuals;
        (0, eval)(baseline);
        window.baselineWarningGround = PrototypeCombatVisuals.ground;
        window.PrototypeCombatVisuals = current;
        window.finalWarningGround = current.ground;
        const g = Prototype.game;
        Object.defineProperty(performance, 'now', { value: () => 5000 });
        g.tick = () => {};
        Prototype.renderer.update(100000);
        Prototype.renderer.update = () => {};
        g.effects = [];
        g.enter('vale');
        g.s.party = [];
        g.s.mercyTime = 0;
        g.s.clock = 120;
        g.line = () => true;
        g.clearSegment = () => true;
        g.blocked = () => false;
        g.tacticalAutoRogue = () => false;
        Object.assign(g.hero, { x: 1580, y: 1700, hp: 1e8, maxHp: 1e8, immune: 999, order: null });
        const e = g.bossEnemy(g.boss('warlord'), 'normal', { x: 1400, y: 1700 });
        e.home = { x: e.x, y: e.y };
        g.zone().enemies = [e];
        g.engage(e);
        g.startAttack(e, g.hero, 0);
        window.oldEnemyUpdate = g.updateEnemies;
        const ground = PrototypeCombatVisuals.ground,
          probe = document.createElement('canvas'),
          world = document.querySelector('#world');
        probe.width = world.width;
        probe.height = world.height;
        window.useFinalWarning = true;
        window.auditGround = ground;
        PrototypeCombatVisuals.ground = function (ctx, ...args) {
          const ink = probe.getContext('2d');
          if (args[2] === 'fill') {
            ink.setTransform(1, 0, 0, 1, 0, 0);
            ink.clearRect(0, 0, probe.width, probe.height);
          }
          ink.setTransform(ctx.getTransform());
          ink.globalAlpha = ctx.globalAlpha;
          const selected = useFinalWarning ? ground : baselineWarningGround;
          selected.call(this, ink, ...args);
          if (args[2] === 'underlay-cue')
            window.warningPixels = ink.getImageData(0, 0, probe.width, probe.height).data;
          return selected.call(this, ctx, ...args);
        };
      },
      cp.execFileSync('git', ['show', 'f203801:src/prototype/combat-visuals.js'], {
        cwd: root,
        encoding: 'utf8',
      }),
    );
    results.warnings = await p.evaluate(() => {
      const r = Prototype.renderer;
      window.useFinalWarning = false;
      r.draw();
      const before = warningPixels.slice();
      window.useFinalWarning = true;
      r.draw();
      let faded = 0,
        increased = 0,
        maxIncrease = 0,
        beforeAlpha = 0,
        afterAlpha = 0;
      for (let i = 3; i < before.length; i += 4) {
        if (warningPixels[i] < before[i]) faded++;
        if (warningPixels[i] > before[i]) increased++;
        maxIncrease = Math.max(maxIncrease, warningPixels[i] - before[i]);
        beforeAlpha += before[i];
        afterAlpha += warningPixels[i];
      }
      return {
        faded,
        increased,
        maxIncrease,
        alphaRatio: afterAlpha / beforeAlpha,
        fillOpacity: 0.8,
      };
    });
    assert(results.warnings.faded > 0);
    console.log('Warning alpha', JSON.stringify(results.warnings));
    assert(results.warnings.maxIncrease <= 1, 'only one-alpha antialias rounding is tolerated');
    assert(results.warnings.alphaRatio > 0.75 && results.warnings.alphaRatio < 1);
    results.overlap = await p.evaluate(() => {
      const g = Prototype.game,
        r = Prototype.renderer;
      let impact = false;
      for (let i = 0; i < 400 && !impact; i++) {
        g.s.time += 0.02;
        oldEnemyUpdate.call(g, 0.02);
        g.updateProjectiles(0.02);
        const events = g.effects.splice(0);
        impact = events.some((f) => f.type === 'enemyVfx' && f.stage === 'impact');
        r.queue(events);
      }
      const before = JSON.stringify(g.s);
      r.draw();
      return {
        impact,
        nextWarning: !!g.zone().enemies[0].telegraph,
        pure: before === JSON.stringify(g.s),
      };
    });
    assert(results.overlap.impact && results.overlap.nextWarning && results.overlap.pure);
    await p.evaluate(() => {
      window.useFinalWarning = false;
      Prototype.renderer.draw();
    });
    await p.screenshot({ path: path.join(out, 'overlap-before.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(() => {
      window.useFinalWarning = true;
      Prototype.renderer.draw();
    });
    await p.screenshot({ path: path.join(out, 'overlap-after.jpg'), type: 'jpeg', quality: 85 });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForFunction(
      () => document.querySelector('#world').height > document.querySelector('#world').width,
    );
    results.portrait = await p.evaluate(() => ({
      width: document.querySelector('#world').width,
      height: document.querySelector('#world').height,
      fillOpacity: 0.8,
    }));
    await p.close();
    if (process.env.WARNING_ONLY) {
      const file = __dirname + '/checks.json';
      const previous = JSON.parse(fs.readFileSync(file));
      fs.writeFileSync(file, JSON.stringify({ ...previous, ...results }, null, 2) + '\n');
      console.log(JSON.stringify(results));
      assert.deepEqual(errors, []);
      return;
    }
    const q = await open();
    await q.evaluate(() => {
      const g = Prototype.game;
      g.zone().props = [];
      g.zone().npcs = [];
      g.zone().nodes = [];
      g.zone().buildings = [];
      g.s.party = [];
      g.s.mercyTime = 0;
      g.s.clock = 120;
      g.updateEnemies = () => {};
      g.updatePacks = () => {};
      g.updateNight = () => {};
      g.updateElites = () => {};
      g.blocked = () => false;
      g.line = () => true;
      window.casts = [];
      const cast = g.cast;
      g.cast = function (slot, target, charged, ...rest) {
        const result = cast.call(this, slot, target, charged, ...rest);
        if (result) casts.push({ slot, charged: !!charged, at: performance.now() });
        return result;
      };
      window.setupCharge = (cls = 'mage', cooldown = 0.4) => {
        const h = g.hero;
        g.clearPartyCharges();
        h.class = cls;
        h.skills = [1, 1, 1, 1, 1, 1, 1, 1];
        h.cd = [0, cooldown, 0, 0, 0, 0, 0, 0];
        h.order = null;
        h.x = 600;
        h.y = 900;
        h.hp = h.maxHp = 1000;
        h.mp = h.maxMp = 1000;
        const e = g.makeEnemy(
          {
            species: 'goblin',
            name: 'Queue fixture',
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
        window.casts = [];
        Prototype.updateHUD();
      };
    });
    const tap = async (slot = 2) => {
      await q.locator('#skill-' + slot).evaluate((el) => {
        el.setPointerCapture = () => {};
        el.onpointerdown({ pointerId: 91, preventDefault() {} });
        el.onpointerup({ pointerId: 91 });
        el.onlostpointercapture({ pointerId: 91 });
      });
    };
    results.queued = [];
    for (const cls of ['paladin', 'mage', 'ranger']) {
      await q.evaluate((cls) => setupCharge(cls), cls);
      await tap();
      const waiting = await q.evaluate(() => Prototype.chargePresentation());
      assert.equal(waiting.state, 'waiting');
      await q.waitForFunction(() => Prototype.chargePresentation()?.state === 'charging');
      assert.equal(await q.evaluate(() => casts.length), 0, 'cooldown ending must not skip charge');
      await q.waitForFunction(() => casts.length === 1);
      const cast = await q.evaluate(() => casts[0]);
      assert(cast.charged && cast.slot === 2);
      results.queued.push({ cls, ...cast });
      await q.waitForTimeout(150);
      assert.equal(await q.evaluate(() => casts.length), 1);
    }
    // A ready manual skill does not discard another skill's cooldown request.
    await q.evaluate(() => setupCharge('mage', 0.6));
    await tap(2);
    await tap(4);
    await q.waitForFunction(() => casts.some((c) => c.slot === 2 && c.charged));
    const otherSkill = await q.evaluate(() => casts);
    assert(otherSkill.some((c) => c.slot === 4 && !c.charged));
    assert.equal(otherSkill.filter((c) => c.slot === 2).length, 1);
    results.otherSkillPreservesRequest = true;
    // Independent cooldowns: the first ready skill charges, then the other.
    await q.evaluate(() => {
      setupCharge('mage', 0.35);
      Prototype.game.hero.cd[0] = 0.2;
    });
    await tap(2);
    await tap(1);
    await q.waitForFunction(
      () =>
        casts.some((c) => c.slot === 1 && c.charged) &&
        casts.some((c) => c.slot === 2 && c.charged),
    );
    const independent = await q.evaluate(() => casts.filter((c) => c.charged).map((c) => c.slot));
    assert.deepEqual(independent, [1, 2]);
    results.independentRequests = independent;
    // Visible stored requests beside the hero: outlined during cooldown, filled at charge.
    await q.evaluate(() => setupCharge('mage', 1));
    await tap(2);
    let stored = await q.evaluate(() => Prototype.queuedChargePresentation());
    assert.equal(stored.length, 1);
    assert.equal(stored[0].slot, 2);
    assert(!stored[0].ready && !stored[0].charging);
    await q.screenshot({ path: path.join(out, 'queued-waiting.jpg'), type: 'jpeg', quality: 85 });
    await q.waitForFunction(() => Prototype.queuedChargePresentation()[0]?.charging);
    stored = await q.evaluate(() => Prototype.queuedChargePresentation());
    assert(stored[0].ready && stored[0].charging);
    await q.screenshot({ path: path.join(out, 'queued-charging.jpg'), type: 'jpeg', quality: 85 });
    await q.waitForFunction(() => casts.length === 1);
    assert.deepEqual(await q.evaluate(() => Prototype.queuedChargePresentation()), []);
    results.visibleQueuedState = true;
    // Repeated input for an already-pending skill does not reset its charge.
    await q.evaluate(() => setupCharge('mage', 0.2));
    await tap(2);
    await q.waitForFunction(() => Prototype.chargePresentation()?.state === 'charging');
    await q.waitForTimeout(200);
    const progress = await q.evaluate(() => Prototype.chargePresentation().progress);
    await tap(2);
    assert((await q.evaluate(() => Prototype.chargePresentation().progress)) >= progress);
    await q.waitForFunction(() => casts.length === 1);
    assert(await q.evaluate(() => casts[0].charged));
    results.repeatDoesNotReset = true;
    await q.evaluate(() => setupCharge('mage', 1));
    await q.keyboard.press('2');
    assert.equal((await q.evaluate(() => Prototype.chargePresentation())).state, 'waiting');
    await q.locator('#recall-button').click();
    assert.equal(await q.evaluate(() => Prototype.chargePresentation()), null);
    results.recallCancels = true;
    await q.evaluate(() => setupCharge('mage', 1));
    await tap();
    await q.evaluate(() => Prototype.openMenu('Queue test', '', []));
    assert.equal(await q.evaluate(() => Prototype.chargePresentation()), null);
    await q.evaluate(() => Prototype.closeMenu());
    results.menuCancels = true;
    await q.evaluate(() => setupCharge('mage', 0.4));
    await tap();
    await q.evaluate(() => {
      const g = Prototype.game;
      g.hero.x = 200;
      g.hero.y = 500;
    });
    await q.waitForFunction(() => Prototype.chargePresentation() === null);
    assert.equal(await q.evaluate(() => casts.length), 0);
    assert.equal(await q.evaluate(() => Prototype.game.hero.order), null);
    results.retreatDoesNotChase = true;
    await q.evaluate(() => setupCharge('mage', 0.2));
    await tap();
    await q.waitForFunction(() => Prototype.chargePresentation()?.state === 'charging');
    await q.waitForTimeout(230);
    await q.evaluate(() => {
      const g = Prototype.game;
      g.hitParty(g.hero, 100, 0, null, true);
    });
    await q.waitForFunction(() => Prototype.chargePresentation() === null);
    assert.equal(await q.evaluate(() => casts.length), 0);
    results.interruptionCancels = true;
    await q.evaluate(() => setupCharge('mage', 0));
    await tap();
    assert.equal(await q.evaluate(() => casts.length), 1);
    assert.equal(await q.evaluate(() => casts[0].charged), false);
    results.readyTapUnchanged = true;
    await q.locator('#menu-button').click();
    const top = await q.locator('#modal-actions > button').allTextContents();
    assert(top[0].startsWith('Establish Basic Barracks'));
    assert(top[1].startsWith('Screen and performance'));
    await q.locator('#modal-actions > button').nth(1).click();
    assert.equal(await q.locator('#modal-title').textContent(), 'Screen and performance');
    await q.locator('#close-button').click();
    assert.equal(await q.locator('#modal-title').textContent(), 'Adventure menu');
    await q.screenshot({
      path: path.join(out, 'adventure-priorities.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    results.menuShortcuts = true;
    await q.close();
    assert.deepEqual(errors, []);
    results.errors = errors;
    fs.writeFileSync(__dirname + '/checks.json', JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
