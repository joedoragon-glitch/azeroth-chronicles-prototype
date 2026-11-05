'use strict';
// Two viewport real-Chromium smoke checks, not the broad browser matrix or
// physical-iPhone / WebKit acceptance. No build, publication or saved data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'test-artifacts', 'strategist-priority4');
fs.mkdirSync(artifacts, { recursive: true });
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\/+/, '') || 'index.html');
  const file = path.resolve(root, rel);
  if ((!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) ||
      !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
const intersects = (a, b) => a && b &&
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 3 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 3;
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const base = 'http://127.0.0.1:' + server.address().port + '/index.html?developer=1';
    for (const v of [
      { name: 'desktop', width: 1280, height: 800, touch: false },
      { name: 'landscape-phone', width: 800, height: 375, touch: true },
    ]) {
      const context = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        hasTouch: v.touch, isMobile: v.touch,
        // No PWA update/reload acceptance in this two-viewport input test.
        serviceWorkers: 'block',
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base);
      // A fresh browser opens the mandatory bilingual first-run chooser.
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      try {
        await page.locator('#title-new').waitFor({ state: 'visible', timeout: 15000 });
      } catch (error) {
        console.error('Startup diagnosis', await page.evaluate(() => ({
          prototype: typeof window.Prototype,
          started: window.Prototype?.started,
          titleHidden: document.querySelector('#title-screen')?.hidden,
          loadingHidden: document.querySelector('#startup-update')?.hidden,
          loadingText: document.querySelector('#startup-update-text')?.textContent,
          pageLanguage: document.documentElement.lang,
        })), errors);
        throw error;
      }
      await page.locator('#title-new').click();
      await page.locator('#modal-actions button').filter({ hasText: 'New Developer Mode run' }).click();
      await page.locator('#modal-actions button').filter({ hasText: 'Strategist (Playtest)' }).click();
      await page.waitForFunction(() => window.Prototype?.started &&
        window.Prototype.game?.hero.class === 'strategist');
      assert.equal(await page.evaluate(() => Prototype.game.s.mode), 'developer');
      const reversed = page.locator('#developer-reversal');
      assert(await reversed.isVisible(), 'independent Reversal visible: ' + v.name);
      const reversalBox = await reversed.boundingBox();
      assert(reversalBox && reversalBox.width >= 44 && reversalBox.height >= 44,
        'Reversal has touch-friendly size: ' + v.name);
      if (v.touch) {
        const joystick = await page.locator('#joystick').boundingBox();
        assert(!intersects(reversalBox, joystick),
          'Reversal must not overlap movement joystick');
        assert(reversalBox.x >= 0 && reversalBox.y >= 0 &&
          reversalBox.x + reversalBox.width <= v.width + 1 &&
          reversalBox.y + reversalBox.height <= v.height + 1,
          'Reversal must remain within dev.255 frame');
      }
      for (let i = 1; i <= 3; i++) {
        const button = page.locator('#skill-' + i);
        assert(await button.isVisible(), 'real starter skill visible ' + i);
      }
      await page.keyboard.press('x');
      assert.equal(await page.locator('#modal-title').textContent(), 'Skill journal');
      await page.locator('#modal-actions button').filter({ hasText: 'Rinsing Cut' }).click();
      assert((await page.locator('#modal-description').textContent()).includes('Water'),
        'actual skill detail displays source-backed information');
      await page.evaluate(() => Prototype.closeMenu());
      await page.evaluate(() => {
        for (const u of Prototype.game.s.party) { u.hp = 0; u.active = false; }
        Prototype.updateHUD();
        window.__reversalCalls = 0;
        Prototype.game.attemptStrategistReversalCommand = () => {
          window.__reversalCalls++; return true;
        };
      });
      assert(await reversed.isVisible(), 'Reversal remains visible after Archer falls');
      await reversed.click();
      assert.equal(await page.evaluate(() => window.__reversalCalls), 1,
        'touch/mouse action reaches native guarded command');
      if (!v.touch) {
        await page.keyboard.press('t');
        assert.equal(await page.evaluate(() => window.__reversalCalls), 2,
          'unbound T key independently triggers Reversal');
        await page.evaluate(() => Prototype.input.rebind('skill1', 'KeyT'));
        await page.keyboard.press('t');
        assert.equal(await page.evaluate(() => window.__reversalCalls), 2,
          'custom bound T is never stolen');
      }
      await page.screenshot({ path: path.join(artifacts, v.name + '.png') });
      assert.deepEqual(errors, [], 'browser errors: ' + v.name);
      console.log('PASS Strategist Priority 4 Chromium ' + v.name +
        ' · input, menu, visible touch target and native command');
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
