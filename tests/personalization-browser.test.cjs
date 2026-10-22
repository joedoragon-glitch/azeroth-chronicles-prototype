'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require('playwright'),
  root = path.resolve(__dirname, '..'),
  engine = process.env.BROWSER_ENGINE || 'chromium';
const out = path.join(root, 'test-results', 'personalization-' + engine);
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'),
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
    }[path.extname(file)] || 'text/html',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser, page;
  try {
    browser = await pw[engine].launch(
      engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {},
    );
    for (const [width, height, phone] of [
      [1280, 800, false],
      [375, 800, true],
      [393, 852, true],
      [800, 375, true],
      [844, 390, true],
    ].filter((_, i) => !process.env.PERSONALIZATION_SMOKE || i === 0)) {
      page = await browser.newPage({
        viewport: { width, height },
        isMobile: phone,
        hasTouch: phone,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html'),
      );
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page
        .getByRole('button', { name: 'Standard death and refuge recovery', exact: true })
        .click();
      const field = page.locator('#character-name');
      await field.fill('Kirito');
      await page.getByRole('button', { name: /paladin/ }).click();
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      assert.equal(await page.evaluate(() => Prototype.game.hero.customName), 'Kirito');
      await page.evaluate(() => {
        const c = Prototype.game;
        c.tick = () => {};
        c.zone().enemies = [];
        c.hero.skills = [1, 0, 1, 0, 0, 0, 0, 0];
        Prototype.updateHUD();
      });
      await page.keyboard.press('x');
      assert.equal(await page.locator('#modal-title').textContent(), 'Skill journal');
      const journal = await page.locator('#modal-actions button').allTextContents();
      assert(journal.some((x) => /Skill 1 ·/.test(x)) && journal.some((x) => /Skill 3 ·/.test(x)));
      assert(!journal.some((x) => /Skill [245678] ·/.test(x)), 'only learned skills appear');
      await page.evaluate(() => {
        const c = Prototype.game;
        Prototype.closeMenu();
        c.s.keys.crypt = true;
        c.rescue('crypt');
        c.refreshNPCs();
        const n = c.zone().npcs.find((n) => n.kind === 'smith' && n.family === 'crypt');
        Object.assign(c.hero, { x: n.x, y: n.y });
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      await page.getByRole('button', { name: /^Name weapon\b/ }).click();
      await field.fill('Elucidator');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm · Elucidator', exact: true }).click();
      assert.equal(await page.evaluate(() => Prototype.game.hero.customWeaponName), 'Elucidator');
      await page.getByRole('button', { name: /^Name armor\b/ }).click();
      await field.fill('Blackwyrm Coat');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm · Blackwyrm Coat', exact: true }).click();
      await page.evaluate(() => {
        const c = Prototype.game;
        Prototype.closeMenu();
        const p = c.safe(1450, 1450);
        const b = {
          id: 'names-barracks',
          ...p,
          kind: 'barracks',
          name: 'Barracks',
          theme: 'vale',
          progress: 4,
          full: true,
          upgradeProgress: 4,
          upgradePaid: true,
          queue: 0,
          queueType: null,
        };
        c.zone().buildings.push(b);
        c.s.normal.thorn = c.s.true.thorn = true;
        const pet = c.unit('pet', p.x + 30, p.y, 'thorn');
        pet.active = false;
        c.s.party.push(pet);
        Object.assign(c.hero, p);
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      await page.getByRole('button', { name: /^Company\b/ }).click();
      await page.getByRole('button', { name: /^Name companions\b/ }).click();
      const row = page.locator('#modal-actions button').first();
      await row.click();
      await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
      assert(
        await page.locator('#modal-actions button').first().isEnabled(),
        'skipping does not consume naming',
      );
      await page.locator('#modal-actions button').first().click();
      await field.fill('Asuna');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm · Asuna', exact: true }).click();
      assert(
        await page.locator('#modal-actions button').first().isDisabled(),
        'confirmed companion name is permanent',
      );
      await page.locator('#modal-actions button').last().click();
      await field.fill('Little Star');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm · Little Star', exact: true }).click();
      assert(
        await page.locator('#modal-actions button').last().isDisabled(),
        'pet is named once too',
      );
      // The same smith service must be reachable through the rescued-specialist hub.
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /^Rescued specialists\b/ }).click();
      await page.getByRole('button', { name: /Borin the Village Smith/ }).click();
      assert(await page.getByRole('button', { name: /^Name weapon\b/ }).isVisible());
      // Stage legitimately earned ending facts, then use the actual physical throne and shell prompt.
      await page.evaluate(() => {
        const c = Prototype.game;
        Prototype.closeMenu();
        c.s.normal.darklord = c.s.true.darklord = true;
        c.s.phase = 'awakening';
        c.s.awakeningAck = true;
        c.enter('crown');
        c.zone().enemies = [];
        const t = c.zone().npcs.find((n) => n.id === 'dark-crown-throne');
        Object.assign(c.hero, { x: t.x, y: t.y });
        Prototype.updateHUD();
      });
      await page.keyboard.press('f');
      await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
      await page.locator('#menu-button').click();
      await page.getByRole('button', { name: /^Character\b/ }).click();
      await page.getByRole('button', { name: /^Choose your Dark Lord name\b/ }).click();
      await field.fill('Lord Noctis');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm · Lord Noctis', exact: true }).click();
      assert.equal(await page.evaluate(() => Prototype.game.heroDisplayName()), 'Lord Noctis');
      const saved = await page.evaluate(() => {
        const state = Prototype.game.snapshot();
        Campaign.restore(structuredClone(state));
        Prototype.save();
        return state;
      });
      assert.equal(saved.hero.customName, 'Kirito');
      assert.equal(saved.hero.customArmorName, 'Blackwyrm Coat');
      assert(saved.party.some((u) => u.customName === 'Little Star'));
      await page.screenshot({ path: path.join(out, 'identity-' + width + 'x' + height + '.png') });
      await page.reload();
      await page.waitForFunction(() => !!window.Prototype);
      assert.equal(
        await page.evaluate(() => Prototype.game.heroDisplayName()),
        'Lord Noctis',
        'real persisted shell restores names',
      );
      await require('./helpers/roaming-interception-browser.cjs').verifyRoamingInterception(page);
      await require('./helpers/maps-browser.cjs').verifyMaps(page, out, width + 'x' + height);
      if (width === 1280 || width === 375)
        await require('./helpers/true-aura-browser.cjs').verifyTrueAuras(
          page,
          out,
          width + 'x' + height,
        );
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          engine +
          ' optional identity, smith/barracks, one-time pet/troop names, journal and throne ' +
          width +
          'x' +
          height,
      );
      await page.close();
    }
  } catch (e) {
    await page?.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    throw e;
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
