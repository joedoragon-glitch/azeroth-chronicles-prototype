'use strict';
// Focused Chromium check of the affected Archive formatting, not a game suite.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  out = path.join(root, 'test-results/archive-reading');
fs.mkdirSync(out, { recursive: true });
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
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const normalize = (s) => s.replace(/[\s:;·—]/g, '');
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await pw.chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] }
        : {}),
    });
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 393, height: 852 },
      { width: 800, height: 375 },
    ])
      for (const language of ['en', 'es']) {
        const phone = viewport.width < 1000,
          page = await browser.newPage({ viewport, isMobile: phone, hasTouch: phone });
        page.setDefaultTimeout(12000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        try {
          await page.goto(
            'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
          );
          await page.waitForFunction(() => !!window.Prototype);
          if (
            /Choose your language|Elige tu idioma/.test(
              await page.locator('#modal-title').textContent(),
            )
          )
            await page
              .getByRole('button', { name: language === 'en' ? /^English/ : /^Español/ })
              .click();
          await page.evaluate(() => {
            const g = Prototype.game;
            g.tick = () => {};
            g.enter('archive');
            g.s.normal.archive = true;
            g.s.rescued.archive = true;
            g.s.keeperPact = true;
            g.s.true.crypt = true;
            for (const e of g.zone().enemies) if (e.family === 'archive') e.hp = 0;
            g.refreshNPCs();
            const keeper = g.zone().npcs.find((n) => n.id === 'keeper-captive');
            Object.assign(g.hero, { x: keeper.x, y: keeper.y });
            Prototype.closeMenu();
            Prototype.updateHUD();
          });
          await page.keyboard.press('f');
          const button = (en, es, exact = true) =>
            page.getByRole('button', { name: language === 'es' ? es : en, exact });
          const reader = page.locator('#modal-description'),
            content = page.locator('#modal-content');
          async function assertCopy(title, figures) {
            const source = await page.evaluate(
              ({ title, figures, language }) => {
                const g = Prototype.game,
                  topic = PrototypeArchive.sections(g, { D: Campaign.data, R: Campaign.rules })
                    .flatMap((s) => s.topics)
                    .find((t) => t[0] === title);
                const raw = topic[figures ? 2 : 1];
                return language === 'es'
                  ? PrototypeArchive.translateArchive(
                      raw,
                      PrototypeArchive.translationNames(g, { D: Campaign.data, R: Campaign.rules }),
                    )
                  : raw;
              },
              { title, figures, language },
            );
            const shown = await reader.evaluate((node) => {
              const copy = node.cloneNode(true);
              copy.querySelectorAll('summary').forEach((n) => n.remove());
              return copy.textContent;
            });
            assert.equal(
              normalize(shown),
              normalize(source),
              'Visible DOM keeps exact audited copy and numbers',
            );
            assert(
              await content.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
              'No horizontal overflow',
            );
            assert((await reader.evaluate((n) => parseFloat(getComputedStyle(n).fontSize))) >= 15);
          }
          await button(/Battle and protection/, /Combate y protección/, false).click();
          await button('Steel, wounds and armor', 'Acero, heridas y armadura').click();
          await button('Show me the figures', 'Muéstrame las cifras').click();
          assert(await reader.locator('dl').count());
          await assertCopy('Steel, wounds and armor', true);
          const summary = reader.locator('summary').first();
          assert.equal(
            await summary.textContent(),
            language === 'es' ? 'Cálculo exacto' : 'Exact calculation',
          );
          assert.equal(await reader.locator('details').first().getAttribute('open'), null);
          await summary.focus();
          await page.keyboard.press('Enter');
          assert(
            await reader
              .locator('details')
              .first()
              .evaluate((n) => n.open),
          );
          await page.keyboard.press('Space');
          assert.equal(
            await reader
              .locator('details')
              .first()
              .evaluate((n) => n.open),
            false,
          );
          await page.keyboard.press('f');
          assert(
            await reader
              .locator('details')
              .first()
              .evaluate((n) => n.open),
            'Normal Confirm opens the selected formula',
          );
          await page.keyboard.press('f');
          assert.equal(
            await reader
              .locator('details')
              .first()
              .evaluate((n) => n.open),
            false,
          );
          assert.equal(await page.locator('#modal').getAttribute('data-view'), 'archive-reading');
          await content.evaluate((n) => {
            n.scrollTop = 0;
          });
          await page.screenshot({
            path: path.join(
              out,
              language + '-' + viewport.width + 'x' + viewport.height + '-armor.png',
            ),
          });
          await page.keyboard.press('Escape');
          await page.keyboard.press('Escape');
          await button(
            'Why a great volley loses force',
            'Por qué una gran descarga pierde fuerza',
          ).click();
          await button('Show me the figures', 'Muéstrame las cifras').click();
          await assertCopy('Why a great volley loses force', true);
          assert(await reader.locator('details').count());
          await content.evaluate((n) => {
            n.scrollTop = 0;
          });
          await page.screenshot({
            path: path.join(
              out,
              language + '-' + viewport.width + 'x' + viewport.height + '-volley.png',
            ),
          });
          await button('All shelves', 'Todos los estantes').click();
          await button(/Adversaries and their attacks/, /Adversarios y sus ataques/, false).click();
          await button('Drowned Keeper', 'Drowned Keeper').click();
          await assertCopy('Drowned Keeper', false);
          await button('Show me the figures', 'Muéstrame las cifras').click();
          await assertCopy('Drowned Keeper', true);
          await content.evaluate((n) => {
            n.scrollTop = 0;
          });
          await page.screenshot({
            path: path.join(
              out,
              language + '-' + viewport.width + 'x' + viewport.height + '-boss.png',
            ),
          });
          await button('Another question', 'Otra pregunta').click();
          await button('Creatures encountered', 'Criaturas encontradas').click();
          await assertCopy('Creatures encountered', false);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#modal').getAttribute('data-view'), 'archive-shelf');
          assert.deepEqual(errors, []);
        } finally {
          await page.close();
        }
      }
    console.log(
      'PASS focused Archive layout browser: EN/ES, desktop/portrait/landscape, exact original DOM copy, aligned figures, native formula toggle and Back',
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
