'use strict';

/**
 * Narrow, real-browser acceptance on the published game. Uses a generated
 * Level 17 Mage, NEVER the owner's private JSON export.
 * Checks the actual trusted file chooser, persistence, Continue and live HUD.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const site = 'https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/';
const output = path.join(process.cwd(), 'test-results', 'live-save-import');
fs.mkdirSync(output, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    for (const target of [
      { name: 'desktop', page: 'index.html', width: 1280, height: 800, touch: false },
      { name: 'mobile', page: 'phone.html', width: 390, height: 844, touch: true },
    ]) {
      const context = await browser.newContext({
        viewport: { width: target.width, height: target.height },
        isMobile: target.touch,
        hasTouch: target.touch,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(20000);
      try {
        const response = await page.goto(site + target.page, { waitUntil: 'domcontentloaded', timeout: 40000 });
        assert(response?.ok(), 'published game must be reachable: ' + response?.status());
        await page.waitForFunction(() => !!window.Prototype && !document.querySelector('#title-screen')?.hidden);
        assert(await page.locator('#title-saves').isVisible(), 'saved-games menu must be present');

        // Generate an authentic Campaign export entirely inside the game's
        // own engine. This is deliberately not the owner's personal save.
        const json = await page.evaluate(() => {
          const mage = new Campaign('normal', 'mage', () => 0.5);
          mage.enter('march');
          mage.hero.level = 17;
          mage.hero.gold = 659;
          return JSON.stringify(mage.snapshot());
        });

        await page.locator('#title-saves').click();
        const input = page.locator('#modal-actions .menu-import-picker #import-file');
        assert(await input.isVisible(), 'Import Save must be a visible native file input');

        const opened = page.waitForEvent('filechooser');
        await input.click();
        const chooser = await opened;
        assert.equal(await (await chooser.element()).evaluate(el => el.id), 'import-file',
          'native chooser must target the save input itself');
        await chooser.setFiles({
          name: 'synthetic_level17_mage_normal.json',
          mimeType: 'application/json',
          buffer: Buffer.from(json, 'utf8'),
        });

        await page.waitForFunction(() =>
          !document.querySelector('#title-import-feedback')?.hidden &&
          document.querySelector('#title-import-feedback')?.textContent?.includes('Continue Adventure'));
        assert.match(await page.locator('#title-preview').textContent(), /Level 17/);
        assert(await page.locator('#title-continue').isEnabled(),
          'Continue must be available after successful import');

        await page.locator('#title-continue').click();
        await page.waitForFunction(() =>
          window.Prototype?.started === true &&
          document.querySelector('#title-screen')?.hidden === true,
          null, { timeout: 55000 });

        const state = await page.evaluate(() => ({
          class: Prototype.game.hero.class,
          level: Prototype.game.hero.level,
          gold: Prototype.game.hero.gold,
          zone: Prototype.game.zoneId,
          started: Prototype.started,
          sceneWidth: document.getElementById('world').width,
          persisted: !!localStorage.getItem('azeroth-v4-normal'),
        }));
        assert.equal(state.class, 'mage');
        assert.equal(state.level, 17);
        assert.equal(state.gold, 659);
        assert.equal(state.zone, 'march');
        assert(state.sceneWidth > 0 && state.started && state.persisted,
          'gameplay must have rendered a scene and stored the campaign');

        // Actual player-facing interaction after resuming, not only an internal
        // "started" flag. Confirm the menu still opens and closes normally.
        await page.locator('#menu-button').click();
        assert(await page.locator('#modal').isVisible(), 'in-game menu must open');
        await page.locator('#close-button').click();
        assert(await page.locator('#modal').isHidden(), 'in-game menu must close');
        assert(await page.locator('#world').isVisible(), 'world canvas stays visible');
        assert.equal(errors.length, 0, 'uncaught browser errors: ' + errors.join('; '));
        console.log('PASS live published browser import + Continue + interactive gameplay ' +
          target.name + ' ' + JSON.stringify(state));
      } catch (e) {
        await page.screenshot({ path: path.join(output, target.name + '-failure.png'), fullPage: true }).catch(() => {});
        console.error('FAIL ' + target.name + ' browser acceptance, page errors: ' + errors.join('; '));
        throw e;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
