'use strict';
// Focused Chromium UI acceptance for class learning (not the full-game browser suite).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const results = path.join(root, 'test-results');
const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)
    .replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
async function dimensions(page) {
  return page.locator('#modal').evaluate((modal) => {
    const panel = modal.querySelector('#modal-content');
    const caption = modal.querySelector('#modal-description');
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      panel: box(panel),
      dialog: box(modal),
      bodyScroll: document.documentElement.scrollWidth - window.innerWidth,
      horizontalOverflow: panel.scrollWidth - panel.clientWidth,
      scrollable: panel.scrollHeight > panel.clientHeight,
      desc: box(caption),
      font: parseFloat(getComputedStyle(caption).fontSize),
    };
  });
}
(async () => {
  fs.mkdirSync(results, { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const [language, phone] of [
      ['en', false], ['es', false], ['en', true], ['es', true],
    ]) {
      const context = await browser.newContext({
        viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        hasTouch: phone, isMobile: phone, serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const errors = [];
      const label = language + (phone ? '-phone' : '-desktop');
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('dialog', (d) => d.accept());
      try {
        await page.goto(base + (phone ? 'phone.html' : 'index.html'));
        await page.waitForFunction(() => !!window.Prototype && !!document.querySelector('#modal-title'));
        if ((await page.locator('#modal-title').textContent()).includes('language') ||
            (await page.locator('#modal-title').textContent()).includes('idioma'))
          await page.getByRole('button', { name: language === 'en' ? /^English/ : /^Español/ }).click();
        await page.waitForFunction(() => document.querySelector('#modal-title').textContent.includes('Challenge') ||
          document.querySelector('#modal-title').textContent.includes('desafío') ||
          document.querySelector('#modal-title').textContent.includes('condición'));
        await page.locator('#modal-actions button').first().click();
        await page.waitForFunction(() => document.querySelector('#modal').getAttribute('data-view') === 'class-select');
        const cards = page.locator('#modal-actions button');
        assert.equal(await cards.count(), 3, 'three original class actions');
        const chosenClassTitle = await cards.first().textContent();
        assert(chosenClassTitle.includes(language === 'en' ? 'Paladin' : 'Paladín'),
          label + ' class title uses proper casing');
        const nameField = await page.locator('.character-name-field').textContent();
        assert(nameField.includes(language === 'en' ? 'Optional name' : 'Nombre opcional'),
          label + ' naming field localized');
        assert.equal(await page.locator('#modal-actions .class-role').count(), 3);
        assert.equal(await page.locator('#modal-actions .class-growth').count(), 3);
        for (const name of (language === 'en'
          ? ['Fortitude', 'Arcane Power', 'Agility']
          : ['Fortaleza', 'Poder arcano', 'Agilidad']))
          assert((await page.locator('#modal-actions').textContent()).includes(name), name);
        const layout = await dimensions(page);
        assert(layout.horizontalOverflow <= 1, label + ' class selection horizontal overflow');
        assert(layout.bodyScroll <= 1, label + ' body overflow');
        assert(layout.font >= 11, label + ' class instruction text too small');
        if (!phone) {
          const last = await cards.last().boundingBox();
          assert(last.y + last.height <= layout.panel.y + layout.panel.height + 2,
            label + ' all three class cards must be immediately visible');
        }
        const cardMetrics = await cards.evaluateAll((elements) =>
          elements.map((el) => ({
            height: el.getBoundingClientRect().height,
            growthSize: parseFloat(getComputedStyle(el.querySelector('.class-growth')).fontSize),
            roleSize: parseFloat(getComputedStyle(el.querySelector('.class-role')).fontSize),
          }))
        );
        assert(cardMetrics.every((c) => c.height >= (phone ? 58 : 44)), label + ' class tap targets');
        assert(cardMetrics.every((c) => c.roleSize >= 12 && c.growthSize >= 12),
          label + ' readable role and growth copy');
        await page.locator('#modal-content').evaluate((el) => { el.scrollTop = 0; });
        await page.locator('#modal').screenshot({ path: path.join(results, 'class-choices-' + label + '.png') });
        // Open the first class through the normal player workflow.
        await cards.first().click();
        await page.waitForFunction(() => document.querySelector('#modal').hidden);
        await page.locator('#menu-button').click();
        await page.locator('#modal-actions button').filter({ hasText: language === 'en' ? 'Character' : 'Personaje' }).first().click();
        await page.waitForFunction(() => document.querySelector('#modal').getAttribute('data-view') === 'character');
        const stats = page.locator('#modal-description.skill-reference section');
        assert.equal(await stats.count(), 2, 'only growth and current stats sections');
        assert.equal(await stats.nth(1).locator('dl dt').count(), 7);
        assert.equal(await stats.nth(1).locator('dl dd').count(), 7);
        assert.equal(await page.locator('#modal-actions button').count(), 4, 'original Character actions retained');
        const charLayout = await dimensions(page);
        assert(charLayout.horizontalOverflow <= 1, label + ' Character horizontal overflow');
        assert(charLayout.bodyScroll <= 1, label + ' Character body overflow');
        assert(charLayout.font >= 12, label + ' current stats font');
        const terms = await stats.nth(1).locator('dl dt').allTextContents();
        assert(terms.includes(language === 'en' ? 'Cooldown reduction' : 'Reducción de recuperación'));
        const values = await stats.nth(1).locator('dl dd').allTextContents();
        assert(values.includes('125'), 'Paladin passive HP visible');
        assert(values.some((v) => v.includes('0.36') || v.includes('0,36')), 'Armor effect visible');
        const minStatText = await stats.nth(1).locator('dl dt, dl dd').evaluateAll((items) =>
          Math.min(...items.map((node) => parseFloat(getComputedStyle(node).fontSize)))
        );
        assert(minStatText >= 12, label + ' stat labels and values too small');
        const buttons = await page.locator('#modal-actions button').evaluateAll((items) =>
          items.map((el) => el.getBoundingClientRect().height)
        );
        assert(buttons.every((height) => height >= (phone ? 44 : 40)), label + ' action targets');
        await page.locator('#modal-content').evaluate((el) => { el.scrollTop = 0; });
        await page.locator('#modal').screenshot({ path: path.join(results, 'character-' + label + '.png') });
        await page.getByRole('button', { name: language === 'en' ? /Skill journal/ : /Diario de habilidades/ }).click();
        assert((await page.locator('#modal-title').textContent()).length > 0, 'skill navigation still works');
        assert.deepEqual(errors, [], label + ' browser errors');
        console.log('PASS class visual UI ' + label + ': scan hierarchy, readable sizes, scroll, touch and navigation');
      } catch (error) {
        await page.screenshot({ path: path.join(results, 'failure-' + label + '.png') }).catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
