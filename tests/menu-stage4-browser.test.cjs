'use strict';
// Bounded menu-only acceptance; no combat, GPU certification or full browser journey.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const playwright = require('playwright');
const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const output = path.join(root, 'test-artifacts', 'menu-stage4', engine);
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const filename = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (
    !filename.startsWith(root + path.sep) ||
    !fs.existsSync(filename) ||
    !fs.statSync(filename).isFile()
  ) {
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
    }[path.extname(filename)] || 'application/octet-stream',
  );
  fs.createReadStream(filename).pipe(res);
});
async function measure(frame, selector, { minFont = 15, targets = false } = {}) {
  const items = await frame.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node) => node.getClientRects().length)
      .map((node) => {
        const rect = node.getBoundingClientRect(),
          css = getComputedStyle(node);
        return {
          text: node.textContent.slice(0, 80),
          font: parseFloat(css.fontSize),
          width: rect.width,
          height: rect.height,
          color: css.color,
          background: css.backgroundColor,
          opacity: css.opacity,
        };
      }),
  );
  assert(items.length, selector);
  for (const item of items) {
    assert(item.font >= minFont, selector + ': ' + JSON.stringify(item));
    if (targets) assert(item.width >= 44 && item.height >= 44, JSON.stringify(item));
  }
  return items;
}
// A common geometry contract protects every menu family, not just the
// five pictured title submenus. The dedicated title and gameplay DOM menu
// surfaces share this CSS regardless of a menu's data-view.
async function assertDialogGeometry(frame, label, { noScroll = false } = {}) {
  const bounds = await frame.locator('#modal').evaluate((dialog) => {
    const r = dialog.getBoundingClientRect(),
      content = dialog.querySelector('#modal-content'),
      back = dialog.querySelector('#close-button'),
      c = content.getBoundingClientRect(),
      b = back.getBoundingClientRect();
    const controls = [...dialog.querySelectorAll('#modal-actions button, #modal-actions input, #modal-actions select')].filter(
      (node) => node.getClientRects().length && !node.disabled,
    );
    return {
      view: dialog.dataset.view,
      viewport: [innerWidth, innerHeight],
      modal: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height },
      content: { top: c.top, bottom: c.bottom, clientHeight: content.clientHeight, scrollHeight: content.scrollHeight },
      back: { top: b.top, bottom: b.bottom, width: b.width, height: b.height },
      targetMinimums: controls.every((node) => {
        const x = node.getBoundingClientRect();
        return x.height >= 44 && x.width >= 44;
      }),
    };
  });
  const { modal, content, back, viewport } = bounds;
  assert(modal.left >= -1 && modal.top >= -1, label + ': ' + JSON.stringify(bounds));
  assert(modal.right <= viewport[0] + 1 && modal.bottom <= viewport[1] + 1, label + ': ' + JSON.stringify(bounds));
  assert(back.top >= content.bottom - 2 && back.bottom <= modal.bottom + 1, label + ': ' + JSON.stringify(bounds));
  assert(back.width >= 44 && back.height >= 44, label + ': ' + JSON.stringify(bounds));
  assert(bounds.targetMinimums, label + ': undersized action ' + JSON.stringify(bounds));
  if (noScroll)
    assert(content.scrollHeight <= content.clientHeight + 3, label + ': unnecessary scrolling ' + JSON.stringify(bounds));
  return bounds;
}
const luminance = (rgb) =>
  rgb
    .slice(0, 3)
    .map((x) => x / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
function contrast(item) {
  const rgb = (s) => s.match(/[\d.]+/g).map(Number);
  const fg = rgb(item.color),
    bg = rgb(item.background);
  assert(bg.length === 3 || bg[3] === 1, 'measured button background is opaque');
  assert.equal(Number(item.opacity), 1);
  const a = luminance(fg),
    b = luminance(bg);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  assert(ratio >= 4.5, 'button contrast ' + ratio + ': ' + JSON.stringify(item));
  return ratio;
}
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await playwright[engine].launch({
      ...(engine === 'chromium' ? { args: ['--no-sandbox'] } : {}),
    });
    for (const language of ['en', 'es']) {
      const context = await browser.newContext({
        viewport: { width: 800, height: 375 },
        hasTouch: true,
        isMobile: true,
      });
      await context.addInitScript((lang) => {
        localStorage.setItem('azeroth-display-language-v1', lang);
        localStorage.setItem('azeroth-renderer-webgl-primary-v1', 'applied');
        localStorage.setItem('azeroth-renderer-choice-v1', 'canvas2d');
      }, language);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
        await page
          .frameLocator('#phone-game-frame')
          .locator('#title-screen')
          .waitFor({ state: 'attached' });
        const frame = page.frame({ url: /phone-game\.html/ });
        await frame.waitForFunction(
          () => !!window.Prototype?.renderer && document.querySelector('#startup-update')?.hidden,
        );
        await page.evaluate(() => {
          document.querySelector('#phone-safe-probe').style.padding = '8px 28px 10px 30px';
          dispatchEvent(new Event('resize'));
        });
        const title = await measure(frame, '#title-screen nav button', { targets: true });
        assert.equal(title.length, 5);
        const ratios = title.map(contrast);
        assert(await frame.locator('#title-continue').isDisabled());
        const titleBounds = await frame.locator('#title-screen nav button').evaluateAll((nodes) =>
          nodes.map((x) => {
            const r = x.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
          }),
        );
        for (const r of titleBounds)
          assert(
            r.top >= 8 && r.bottom <= 365 && r.left >= 30 && r.right <= 772,
            JSON.stringify(r),
          );
        await page.screenshot({ path: path.join(output, language + '-title.png') });
        await frame.locator('#title-new').tap();
        assert.equal(
          await frame.locator('#modal-title').textContent(),
          language === 'es' ? 'Nueva aventura' : 'New Adventure',
        );
        await measure(frame, '#modal-title', { minFont: 20 });
        await measure(frame, '#modal-description');
        await measure(frame, '#modal-actions .detail', { minFont: 13 });
        const newGameFit = await assertDialogGeometry(frame, 'New Adventure', { noScroll: true });
        await frame
          .getByRole('button', { name: language === 'es' ? /^Elegir héroe/ : /^Choose Hero/ })
          .tap();
        const cards = await measure(frame, '#modal-actions button', { targets: true });
        assert.equal(cards.length, 4);
        cards.forEach(contrast);
        await measure(frame, '#modal-actions .detail', { minFont: 13 });
        const heroFit = await assertDialogGeometry(frame, 'Choose Hero', { noScroll: true });
        const back = await frame.locator('#close-button').boundingBox();
        assert(back.height >= 44 && back.y + back.height <= 365);
        assert.equal(
          await frame.locator('#character-name').evaluate((x) => x === document.activeElement),
          false,
        );
        await page.screenshot({ path: path.join(output, language + '-heroes.png') });
        await frame.locator('#close-button').tap();
        assert.equal(
          await frame.locator('#modal-title').textContent(),
          language === 'es' ? 'Nueva aventura' : 'New Adventure',
        );
        await frame.locator('#close-button').tap();
        assert(await frame.locator('#modal').isHidden());
        await frame.locator('#title-saves').tap();
        const savesFit = await assertDialogGeometry(frame, 'Saved Games');
        assert.equal(await frame.locator('#import-file').getAttribute('type'), 'file');
        assert(await frame.locator('#import-file').isVisible());
        await frame.locator('#modal-content').evaluate((x) => (x.scrollTop = x.scrollHeight));
        const close = await frame.locator('#close-button').boundingBox();
        assert(close.y >= 8 && close.y + close.height <= 365);
        await frame.locator('#close-button').tap();
        await frame.locator('#title-settings').tap();
        const settingsFit = await assertDialogGeometry(frame, 'Settings', { noScroll: true });
        await frame.getByRole('button', { name: language === 'es' ? /Pantalla y rendimiento/ : /Screen and performance/ }).tap();
        const graphicsFit = await assertDialogGeometry(frame, 'Graphics settings');
        await frame.locator('#close-button').tap();
        await frame.locator('#close-button').tap();
        await frame.locator('#title-help').tap();
        const helpFit = await assertDialogGeometry(frame, 'Help index', { noScroll: true });
        await frame
          .getByRole('button', { name: language === 'es' ? /^Primeros pasos/ : /^Quick Start/ })
          .tap();
        await measure(frame, '#modal-description');
        const readingFit = await assertDialogGeometry(frame, 'Help reading');
        await page.screenshot({ path: path.join(output, language + '-help.png') });
        await page.keyboard.press('Escape');
        assert.equal(
          await frame.locator('#modal-title').textContent(),
          language === 'es' ? 'Ayuda y créditos' : 'Help & Credits',
        );
        // The screenshots show title submenus, but the owner's acceptance
        // scope also includes gameplay menus. Exercise the same shared
        // surface after entering a real, non-diagnostic Paladin campaign.
        await frame.locator('#close-button').tap();
        await frame.locator('#title-new').tap();
        await frame.getByRole('button', {
          name: language === 'es' ? /^Elegir héroe/ : /^Choose Hero/,
        }).tap();
        await frame.getByRole('button', { name: /Palad/i }).tap();
        await frame.waitForFunction(
          () => !!window.Prototype?.started &&
            document.querySelector('#title-screen')?.hidden &&
            document.querySelector('#scene-loading')?.hidden !== false,
          null,
          { timeout: 90000 },
        );
        await frame.locator('#menu-button').tap();
        const adventureFit = await assertDialogGeometry(frame, 'In-game Adventure index');
        await frame.getByRole('button', { name: language === 'es' ? /Personaje/ : /^Character$/ }).tap();
        const characterFit = await assertDialogGeometry(frame, 'In-game Character');
        await frame.locator('#close-button').tap();
        await frame.getByRole('button', {
          name: language === 'es' ? /Juego y ajustes|Configuración|Ajustes/i : /Game and settings/,
        }).tap();
        const gameSettingsFit = await assertDialogGeometry(frame, 'In-game Settings', { noScroll: true });
        await frame.locator('#close-button').tap();
        await frame.getByRole('button', {
          name: language === 'es' ? /Mapa|rutas/i : /Map and travel routes/,
        }).tap();
        const mapFit = await assertDialogGeometry(frame, 'In-game map');
        await frame.locator('#close-button').tap();
        // Isolated *presentation* probes for the additional real game menu
        // families; authoritative Barracks/NPC actions are exercised by the
        // native menu tests, while Keeper prose retains its separate suite.
        const familyFit = {};
        for (const [view, count, columns] of [
          ['barracks-hub', 6, 2],
          ['npc-training-hub', 5, 2],
          ['npc-service-catalog', 9, 1],
          ['archive-index', 8, 1],
          ['archive-reading', 3, 1],
        ]) {
          await frame.evaluate(({ view, count }) => {
            const actions = Array.from({ length: count }, (_, i) => ({
              label: 'Option ' + (i + 1),
              detail: 'Explanatory text about requirements, effects and crowns.',
              action() {},
            }));
            const description =
              view === 'archive-reading'
                ? Array(28).fill('A Keeper passage remains readable without altering or truncating its text.').join(' ')
                : 'A complete description is retained when the panel is scrollable.';
            window.Prototype.openMenu('Menu presentation probe', description, actions,
              window.Prototype.closeMenu, { view });
          }, { view, count });
          familyFit[view] = await assertDialogGeometry(frame, view);
          const trackCount = await frame.locator('#modal-actions').evaluate((node) =>
            getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
          );
          assert.equal(trackCount, columns, view + ': peer choice vs reading layout');
          await frame.locator('#close-button').tap();
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(
          path.join(output, language + '-measurements.json'),
          JSON.stringify({ title, cards, ratios, titleBounds, newGameFit, heroFit, savesFit, settingsFit, graphicsFit, helpFit, readingFit, adventureFit, characterFit, gameSettingsFit, mapFit, familyFit }, null, 2),
        );
        console.log(
          'PASS ' +
            engine +
            ' ' +
            language +
            ' real phone-frame menu geometry, contrast, native import and touch/Back/Escape',
        );
      } catch (error) {
        await page
          .screenshot({ path: path.join(output, language + '-failure.png') })
          .catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
