'use strict';
// A5 focused Archive-only browser check; never launches another game suite.
// Example: QUEST_BROWSER_ENGINE=chromium node tests/archive-a5-browser.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const approved = require('../src/prototype/narration.js').approved;
const out = path.join(root, 'test-results', 'archive-a5');
fs.mkdirSync(out, { recursive: true });
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
      { width: 393, height: 852 },
      { width: 800, height: 375 },
    ]) for (const lang of ['en', 'es']) {
      const phone = viewport.width < 1000;
      const page = await browser.newPage({ viewport, isMobile: phone, hasTouch: phone });
      const errors = [];
      page.setDefaultTimeout(10000);
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
        // A genuinely long approved history, not only the short armor answer.
        await page.getByRole('button', { name: new RegExp(lang === 'es'
          ? 'La Corona y sus instituciones' : 'The Crown and its institutions') }).click();
        const longButton = page.getByRole('button', { name: lang === 'es'
          ? 'Garun — los caminos antiguos' : 'Garun — the old roads', exact: true });
        await longButton.scrollIntoViewIfNeeded();
        const shelfScroll = await content.evaluate((n) => n.scrollTop);
        await longButton.click();
        assert.equal(await reader.textContent(), lang === 'es' ? approved.K10.es : approved.K10.en);
        assert((await content.evaluate((n) => n.scrollTop)) <= 5);
        await page.screenshot({ path: path.join(out, engine + '-' + lang + '-' +
          viewport.width + 'x' + viewport.height + '-top.png') });
        await reader.focus();
        await page.keyboard.press('PageDown');
        await page.waitForFunction(() => document.querySelector('#modal-content').scrollTop > 5);
        await page.keyboard.press('Enter');
        assert.equal(await reader.textContent(), lang === 'es' ? approved.K10.es : approved.K10.en,
          'Reading Enter never activates an action');
        await page.keyboard.press('Shift+Tab');
        assert(await page.locator('#modal').evaluate((n) => n.contains(document.activeElement)),
          'Reverse Tab stays inside the dialog');
        await reader.focus();
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BUTTON');
        const bounds = await page.locator('#modal').boundingBox();
        assert(bounds.x >= -1 && bounds.y >= -1 &&
          bounds.x + bounds.width <= viewport.width + 1 &&
          bounds.y + bounds.height <= viewport.height + 1, 'Dialog stays inside viewport');
        assert((await reader.evaluate((n) => parseFloat(getComputedStyle(n).fontSize))) >= 15,
          'Archive text remains at least 15 CSS pixels');
        assert(await content.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
          'Long reading needs no horizontal scrolling');
        await page.screenshot({ path: path.join(out, engine + '-' + lang + '-' +
          viewport.width + 'x' + viewport.height + '.png') });
        await page.keyboard.press('Escape');
        assert(Math.abs((await content.evaluate((n) => n.scrollTop)) - shelfScroll) <= 1,
          'Back restores long shelf scroll');
        await page.keyboard.press('Escape');
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
        assert.equal(await reader.textContent(), lang === 'es' ? approved.P05.es : approved.P05.en);
        await page.evaluate(() => Prototype.save());
        await page.reload();
        await page.waitForFunction(() => !!window.Prototype && Prototype.game.s.keeperEvidence);
        const facts = await page.evaluate(() => {
          Prototype.game.tick = () => {};
          const c = Campaign.restore(Prototype.game.snapshot());
          return { pact: c.s.keeperPact, evidence: c.s.keeperEvidence, throne: !!c.s.throneClaimed };
        });
        assert.deepEqual(facts, { pact: true, evidence: true, throne: false },
          'Existing v4 facts survive reload without revealing throne lore');
        // Native world interaction → Basic and Full Barracks → Training → Keeper.
        for (const full of [false, true]) {
          await page.evaluate((full) => {
            const g = Prototype.game;
            g.enter('vale');
            const p = g.safe(450, 450);
            const b = { id: 'a5-counsel', kind: 'barracks', name: 'Barracks',
              ...p, progress: 4, full, upgradeProgress: full ? 4 : 0, queue: 0 };
            g.zone().buildings = g.zone().buildings.filter((x) => x.id !== b.id);
            g.zone().buildings.push(b);
            Object.assign(g.hero, p);
            Prototype.closeMenu();
            Prototype.updateHUD();
          }, full);
          await page.keyboard.press('f');
          await page.getByRole('button', { name: lang === 'es' ? /^Entrenamiento/ : /^Training/ }).click();
          await page.getByRole('button', { name: lang === 'es'
            ? /^Especialistas rescatados/ : /^Rescued specialists/ }).click();
          const specialistTitle = await page.locator('#modal-title').textContent();
          await page.getByRole('button', { name: /Drowned Keeper.*(Archive|Archivo)/ }).click();
          assert.equal(await page.locator('#modal-title').textContent(), rootTitle);
          await page.getByRole('button', { name: new RegExp(label) }).click();
          await page.getByRole('button', { name: lang === 'es'
            ? 'Acero, heridas y armadura' : 'Steel, wounds and armor', exact: true }).click();
          await page.keyboard.press('Escape');
          await page.keyboard.press('Escape');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#modal-title').textContent(), specialistTitle,
            'Back returns to the actual Basic/Full entry route');
        }
        assert.deepEqual(errors, [], 'No browser JavaScript errors');
      } finally {
        await page.close();
      }
    }
    console.log('PASS A5 browser Archive EN/ES navigation, gate, answer, figures and four viewports, long-copy scrolling/focus, v4 reload and Basic/Full routes');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
