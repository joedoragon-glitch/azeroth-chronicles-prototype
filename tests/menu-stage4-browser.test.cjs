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
        localStorage.setItem('azeroth-pixi-settings-baseline-v1', 'applied');
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
        await measure(frame, '#modal-title', { minFont: 16 });
        await measure(frame, '#modal-description', { minFont: 13 });
        await measure(frame, '#modal-actions .detail', { minFont: 11.5 });
        const newGameFit = await assertDialogGeometry(frame, 'New Adventure', { noScroll: true });
        await frame
          .getByRole('button', { name: language === 'es' ? /^Elegir héroe/ : /^Choose Hero/ })
          .tap();
        const cards = await measure(frame, '#modal-actions button', { targets: true, minFont: 13 });
        assert.equal(cards.length, 4);
        cards.forEach(contrast);
        await measure(frame, '#modal-actions .detail', { minFont: 11.5 });
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
        const graphicsFit = await assertDialogGeometry(frame, 'Screen and performance');
        assert.equal(
          await frame.locator('#modal-actions .menu-section')
            .filter({ hasText: language === 'es' ? 'Gráficos de Canvas' : 'Canvas graphics' })
            .count(),
          0,
          'redundant Canvas graphics heading was removed',
        );
        assert.equal(
          await frame.getByRole('combobox', {
            name: language === 'es' ? 'Modo de optimización' : 'Optimization Mode',
            exact: true,
          }).count(),
          1,
          'Canvas optimization remains an inline working control',
        );
        assert.equal(
          await frame.getByRole('combobox', {
            name: language === 'es' ? 'Objetivo de dibujo (FPS)' : 'Drawing target (FPS)',
            exact: true,
          }).count(),
          1,
          'frame pacing remains reachable on the same page',
        );
        await frame.locator('#close-button').tap();
        await frame.getByRole('button', { name: language === 'es' ? 'Herramientas de prueba' : 'Playtest tools', exact: true }).tap();
        await assertDialogGeometry(frame, 'Playtest tools');
        const readout = frame.locator('#modal-actions .menu-section-detail').first();
        assert(await readout.isVisible(), 'Performance details is visible without opening another page');
        assert(await readout.evaluate((row) =>
          row.getBoundingClientRect().bottom <= document.querySelector('#modal-content').getBoundingClientRect().bottom),
          'The entire initial quick readout fits without scrolling');
        await page.screenshot({ path: path.join(output, language + '-playtest-tools.png') });
        await frame.getByRole('button', { name: language === 'es' ? 'Ayuda y privacidad' : 'Help and privacy', exact: true }).tap();
        await frame.locator('#close-button').tap();
        assert(await readout.isVisible(), 'Back returns to the working page');
        await frame.locator('#close-button').tap();
        await frame.locator('#close-button').tap();
        await frame.locator('#title-help').tap();
        const helpFit = await assertDialogGeometry(frame, 'Help index', { noScroll: true });
        await frame
          .getByRole('button', { name: language === 'es' ? /^Primeros pasos/ : /^Quick Start/ })
          .tap();
        await measure(frame, '#modal-description', { minFont: 13 });
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
          name: language === 'es' ? /Ajustes|Configuración/i : /Settings/,
        }).tap();
        const gameSettingsFit = await assertDialogGeometry(frame, 'In-game Settings', { noScroll: true });
        await frame.getByRole('button', { name: language === 'es' ? 'Herramientas de prueba' : 'Playtest tools', exact: true }).tap();
        assert(await readout.evaluate((row) =>
          row.getBoundingClientRect().bottom <= document.querySelector('#modal-content').getBoundingClientRect().bottom),
          'The in-game quick readout fits before scrolling');
        await frame.getByRole('button', { name: language === 'es' ? /^Iniciar registro del renderizador/ : /^Start renderer profiling/ }).tap();
        const stopProfiler = frame.getByRole('button', { name: language === 'es' ? /^Detener registro del renderizador/ : /^Stop renderer profiling/ });
        assert(await stopProfiler.evaluate((button) => document.activeElement === button),
          'Profiler toggle retains focus across its label change');
        await stopProfiler.tap();
        await frame.locator('#close-button').tap();
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
          ['npc-service-catalog', 9, 2],
          ['archive-index', 8, 2],
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
          if (view === 'archive-reading')
            assert(
              familyFit[view].content.scrollHeight > familyFit[view].content.clientHeight,
              'full Keeper prose should scroll without clipping',
            );
          const trackCount = await frame.locator('#modal-actions').evaluate((node) =>
            getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
          );
          assert.equal(trackCount, columns, view + ': peer choice vs reading layout');
          await frame.locator('#close-button').tap();
        }
        // Engineering edge case: shorter landscape and a long NPC catalog.
        // The real phone frame still owns safe-area mapping and Back handling.
        await page.setViewportSize({ width: 740, height: 340 });
        await frame.waitForFunction(() => innerWidth >= 700 && innerHeight <= 350);
        await frame.evaluate(() => {
          const items = Array.from({ length: 20 }, (_, i) => ({
            label: 'Service ' + (i + 1),
            detail: 'Crowns, requirements and consequences stay readable.',
            action() {},
          }));
          window.Prototype.openMenu(
            'Specialist services',
            'Choose a service; opening the catalog never purchases anything.',
            items,
            window.Prototype.closeMenu,
            { view: 'npc-service-catalog' },
          );
        });
        const shortLandscapeFit = await assertDialogGeometry(frame, 'short landscape specialist');
        assert(
          shortLandscapeFit.content.scrollHeight > shortLandscapeFit.content.clientHeight,
          'long service lists must scroll instead of being clipped',
        );
        await frame.locator('#modal-content').evaluate((node) => { node.scrollTop = node.scrollHeight; });
        const shortLandscapeScrolled = await assertDialogGeometry(frame, 'short landscape after scroll');
        await frame.locator('#close-button').tap();
        await page.setViewportSize({ width: 800, height: 375 });
        // An iPhone Air-size logical landscape viewport has more room than
        // the small 740x340 probe; grid choice must follow CSS pixels, not DPR.
        await page.setViewportSize({ width: 912, height: 420 });
        await frame.waitForFunction(() => innerWidth >= 900 && innerHeight >= 410);
        const roomyFit = {};
        for (const [view, amount] of [
          ['npc-service-catalog', 6],
          ['archive-index', 8],
          ['archive-shelf', 10],
          ['barracks-hub', 4],
          ['npc-training-hub', 5],
        ]) {
          await frame.evaluate(({ view, amount }) => {
            const actions = Array.from({ length: amount }, (_, i) => ({
              label: 'Menu choice ' + (i + 1),
              detail: 'Requirements and costs remain readable.',
              action() {},
            }));
            window.Prototype.openMenu(
              'Responsive navigation',
              view === 'archive-index' ? 'Choose one of the Keeper’s shelves.' : 'Choose a service.',
              actions,
              window.Prototype.closeMenu,
              { view },
            );
          }, { view, amount });
          roomyFit[view] = await assertDialogGeometry(frame, 'roomy ' + view, {
            noScroll: true,
          });
          const columns = await frame.locator('#modal-actions').evaluate((node) =>
            getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
          );
          assert.equal(columns, 2, view + ': roomy landscape uses two columns');
          await frame.locator('#close-button').tap();
        }
        // A tiny supplier or a one-control form must not inherit the
        // full-width 760px presentation of a busy smith/instructor catalog.
        await frame.evaluate(() => {
          window.Prototype.openMenu(
            'Village supplies',
            'Town delivery and support services.',
            [
              { label: 'Collect cargo', detail: 'No payment without selection.', action() {} },
              { label: 'Field support', detail: 'Current Ranger support rules.', action() {} },
            ],
            window.Prototype.closeMenu,
            { view: 'npc-service-catalog' },
          );
        });
        const smallCatalog = await assertDialogGeometry(frame, 'small supplier', { noScroll: true });
        assert(
          smallCatalog.modal.right - smallCatalog.modal.left <= 530,
          'a two-service supplier must keep a content-sized panel',
        );
        assert.equal(
          await frame.locator('#modal-actions').evaluate((node) =>
            getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length),
          1,
          'small supplier options stay in one readable column',
        );
        await frame.locator('#close-button').tap();
        await frame.evaluate(() => {
          window.Prototype.openMenu('Single option', 'Change the current setting.', [
            { kind: 'select', label: 'Graphics', value: 'normal',
              options: [{ value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }],
              onChange() {} },
          ], window.Prototype.closeMenu);
        });
        const smallForm = await assertDialogGeometry(frame, 'small settings form', { noScroll: true });
        assert(
          smallForm.modal.right - smallForm.modal.left <= 560,
          'one native select does not require a full-screen settings form',
        );
        assert.equal(
          await frame.locator('#modal-actions').evaluate((node) =>
            getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length),
          1,
          'single form control stays one column',
        );
        await frame.locator('#close-button').tap();
        await frame.evaluate(() => {
          window.Prototype.openMenu(
            'Screen settings',
            'Two settings share the wider viewport without shrinking their inputs.',
            [
              { kind: 'select', label: 'Graphics', value: 'normal',
                options: [{value: 'normal', label: 'Normal'}, {value: 'low', label: 'Low'}],
                onChange() {} },
              { kind: 'select', label: 'Camera', value: '150',
                options: [{value: '150', label: '150%'}, {value: '100', label: '100%'}],
                onChange() {} },
              { kind: 'select', label: 'Language', value: 'en',
                options: [{value: 'en', label: 'English'}, {value: 'es', label: 'Español'}],
                onChange() {} },
              { kind: 'select', label: 'FPS', value: '30',
                options: [{value: '30', label: '30'}, {value: '60', label: '60'}],
                onChange() {} },
            ],
            window.Prototype.closeMenu,
          );
        });
        const roomyForms = await assertDialogGeometry(frame, 'roomy settings controls');
        assert.equal(
          await frame.locator('#modal').getAttribute('data-menu-layout'),
          'form',
          'selects must use a form layout, not unlabelled choice tiles',
        );
        const formColumns = await frame.locator('#modal-actions').evaluate((node) =>
          getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
        );
        assert.equal(formColumns, 2, 'roomy settings use two paired setting columns');
        await frame.locator('#close-button').tap();
        await page.setViewportSize({ width: 800, height: 375 });
        assert.deepEqual(errors, []);
        fs.writeFileSync(
          path.join(output, language + '-measurements.json'),
          JSON.stringify({ title, cards, ratios, titleBounds, newGameFit, heroFit, savesFit, settingsFit, graphicsFit, helpFit, readingFit, adventureFit, characterFit, gameSettingsFit, mapFit, familyFit, shortLandscapeFit, shortLandscapeScrolled, roomyFit, roomyForms, smallCatalog, smallForm }, null, 2),
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
