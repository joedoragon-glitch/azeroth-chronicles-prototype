'use strict';
// A5 opt-in browser matrix. Never run from the automatic focused workflow.
// Example: QUEST_BROWSER_ENGINE=chromium node tests/archive-a5-browser.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const target = path.resolve(root, decodeURIComponent((req.url || '/').split('?')[0])
    .replace(/^\//, '') || 'index.html');
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) ||
      fs.statSync(target).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const engine = process.env.QUEST_BROWSER_ENGINE || 'chromium';
    const options = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE) {
      options.executablePath = process.env.CHROMIUM_EXECUTABLE;
      options.args = ['--no-sandbox'];
    }
    if (engine === 'webkit' && process.env.WEBKIT_EXECUTABLE)
      options.executablePath = process.env.WEBKIT_EXECUTABLE;
    browser = await pw[engine].launch(options);
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
      { width: 844, height: 390 },
    ]) for (const lang of ['en', 'es']) {
      const phone = viewport.width < 1000;
      const page = await browser.newPage({ viewport, isMobile: phone, hasTouch: phone });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        await page.goto('http://127.0.0.1:' + server.address().port +
          (phone ? '/phone.html' : '/index.html'));
        await page.waitForFunction(() => !!window.Prototype);
        const picker = await page.locator('#modal-title').textContent();
        if (/Choose your language|Elige tu idioma/.test(picker))
          await page.getByRole('button', { name: lang === 'en' ? /^English/ : /^Español/ }).click();
        await page.evaluate(() => {
          const g = Prototype.game;
          g.tick = () => {};
          g.enter('archive');
          g.s.normal.archive = true;
          g.s.rescued.archive = true;
          g.s.keeperPact = true;
          for (const e of g.zone().enemies)
            if (e.family === 'archive') e.hp = 0;
          g.refreshNPCs();
          const keeper = g.zone().npcs.find((n) => n.id === 'keeper-captive');
          if (!keeper) throw Error('Keeper missing in real dungeon scene');
          Object.assign(g.hero, { x: keeper.x, y: keeper.y });
          Prototype.closeMenu();
          Prototype.updateHUD();
        });
        await page.keyboard.press('f');
        await page.waitForFunction(() => {
          const heading = document.querySelector('#modal-title').textContent;
          return /Keeper’s shelves|estantes del Guardián/.test(heading);
        });
        const rootTitle = await page.locator('#modal-title').textContent();
        assert.equal(rootTitle, lang === 'es' ? 'Los estantes del Guardián' : 'The Keeper’s shelves');
        const shelves = await page.locator('#modal-actions button').allTextContents();
        assert(shelves.some((t) => t.includes(lang === 'es' ? 'Combate y protección' : 'Battle and protection')));
        assert(!shelves.some((t) => /órdenes entre los estantes|orders among the shelves/i.test(t)),
          'Pact cannot unlock signed ledger record');
        const label = lang === 'es' ? 'Combate y protección' : 'Battle and protection';
        await page.getByRole('button', { name: new RegExp(label) }).click();
        assert.equal(await page.locator('#modal').getAttribute('data-view'), 'archive-shelf');
        await page.getByRole('button', {
          name: lang === 'es' ? 'Acero, heridas y armadura' : 'Steel, wounds and armor', exact: true,
        }).click();
        assert.equal(await page.locator('#modal').getAttribute('data-view'), 'archive-reading');
        const reader = page.locator('#modal-description');
        assert.equal(await reader.getAttribute('role'), 'document',
          'Complete Archive answer has an assistive-technology document landmark');
        assert.equal(await reader.getAttribute('tabindex'), '0',
          'Keyboard users can focus the full answer separately from its actions');
        assert.equal(await reader.getAttribute('aria-label'),
          lang === 'es' ? 'Lectura del Archivo' : 'Archive reading');
        const answer = await reader.textContent();
        assert(answer.length > 95);
        if (lang === 'es') assert(answer.includes('La armadura amortigua los golpes'));
        const content = page.locator('#modal-content');
        const scroll = await content.evaluate((node) => node.scrollTop);
        assert(scroll <= 5, 'Answer starts at its beginning, never at action buttons');
        await page.getByRole('button', {
          name: lang === 'es' ? 'Muéstrame las cifras' : 'Show me the figures', exact: true,
        }).click();
        const figures = await page.locator('#modal-description').textContent();
        assert(figures.includes('0.35'), 'Live armor rule remains visible');
        await page.getByRole('button', {
          name: lang === 'es' ? 'Volver a la respuesta' : 'Return to the answer', exact: true,
        }).click();
        assert.equal(await page.locator('#modal-description').textContent(), answer);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#modal').getAttribute('data-view'), 'archive-shelf');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#modal-title').textContent(), rootTitle);
        await page.evaluate(() => {
          Prototype.game.s.keeperEvidence = true;
          Prototype.closeMenu();
        });
        await page.keyboard.press('f');
        await page.getByRole('button', {
          name: new RegExp(lang === 'es' ? 'Las órdenes entre los estantes' : 'The orders among the shelves'),
        }).click();
        await page.getByRole('button', {
          name: lang === 'es' ? 'Un prisionero para el Archivo' : 'A prisoner for the Archive', exact: true,
        }).click();
        assert((await page.locator('#modal-description').textContent()).length > 100);
        assert.deepEqual(errors, [], 'No browser JavaScript errors');
      } finally {
        await page.close();
      }
    }
    console.log('PASS A5 browser Archive EN/ES navigation, gate, answer, figures and three viewport modes');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
