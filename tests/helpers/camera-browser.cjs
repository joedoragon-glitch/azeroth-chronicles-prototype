'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

exports.verifyCamera = async function (page, results, tag, touch, capture = false) {
  await page.evaluate(() => {
    const p = Prototype;
    window.__cameraAudit = {
      tick: p.game.tick,
      snapshot: p.game.snapshot(),
      zoom: p.platform.cameraZoom,
      input: { ...p.input.preferences },
    };
    p.game.tick = () => {};
    p.closeMenu();
    p.game.enter('vale');
    Object.assign(p.game.hero, { x: 600, y: 900, order: null });
    p.input.select('mouseMove', true);
    p.input.select('touchMove', true);
  });
  try {
    const hud = await page.locator('#hud').boundingBox();
    for (const scale of [1, 1.5, 1.75]) {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Game and settings', exact: true }).click();
      await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
      await page
        .getByRole('button', {
          name: 'Camera ' + Math.round(scale * 100) + '%' + (scale === 1 ? ' · original' : ''),
          exact: true,
        })
        .click();
      assert(await page.locator('#modal').isHidden());
      const probe = await page.evaluate(() => {
        const p = Prototype,
          canvas = document.querySelector('#world'),
          ctx = canvas.getContext('2d');
        const before = JSON.stringify(p.game.snapshot()),
          transform = [...Object.values(ctx.getTransform().toJSON())];
        p.renderer.draw();
        const anchor = p.platform.cameraAnchor(innerWidth, innerHeight),
          hero = p.renderer.screen(p.game.hero);
        const target = p.game.safe(660, 1040),
          screen = p.renderer.screen(target),
          world = p.renderer.world(screen.x, screen.y);
        return {
          zoom: p.platform.cameraZoom,
          unchanged: before === JSON.stringify(p.game.snapshot()),
          restored:
            JSON.stringify(transform) ===
            JSON.stringify([...Object.values(ctx.getTransform().toJSON())]),
          anchor,
          hero,
          target,
          screen,
          world,
          hit: document.elementFromPoint(screen.x, screen.y)?.id,
        };
      });
      assert.equal(probe.zoom, scale);
      assert(probe.unchanged, 'Drawing does not change campaign state');
      assert(probe.restored, 'Camera restores the existing device-pixel-ratio transform');
      for (const key of ['x', 'y']) {
        assert(Math.abs(probe.hero[key] - probe.anchor[key]) < 1e-7, 'Hero anchor stays fixed');
        assert(Math.abs(probe.world[key] - probe.target[key]) < 1e-7, 'Screen input round-trips');
      }
      assert.deepEqual(
        await page.locator('#hud').boundingBox(),
        hud,
        'Camera leaves HUD geometry unchanged',
      );
      assert.equal(probe.hit, 'world', 'Test destination is unobstructed');
      // Native touch dispatch can quantize fractional CSS coordinates. Verify
      // the actual event position, rather than the ideal floating-point tap.
      await page.evaluate(() => {
        document.querySelector('#world').addEventListener(
          'pointerdown',
          (event) => {
            window.__cameraPointerExpected = Prototype.renderer.world(event.clientX, event.clientY);
          },
          { once: true, capture: true },
        );
      });
      if (touch) await page.touchscreen.tap(probe.screen.x, probe.screen.y);
      else await page.mouse.click(probe.screen.x, probe.screen.y);
      const { order, expected } = await page.evaluate(() => ({
        order: Prototype.game.hero.order,
        expected: __cameraPointerExpected,
      }));
      assert(order, 'Native pointer creates travel at the zoomed destination');
      assert(
        Math.hypot(order.x - expected.x, order.y - expected.y) < 1e-7,
        'Pointer movement uses world coordinates',
      );
      if (capture)
        await page.screenshot({
          path: path.join(results, 'camera-' + Math.round(scale * 100) + '-' + tag + '.png'),
        });
    }
  } finally {
    await page.evaluate(() => {
      const p = Prototype,
        previous = __cameraAudit;
      p.closeMenu();
      p.game.s = previous.snapshot;
      p.game.tick = previous.tick;
      p.platform.selectCameraZoom(previous.zoom);
      for (const key of ['mouseMove', 'touchMove', 'phoneLayout'])
        p.input.select(key, previous.input[key]);
      p.updateHUD();
      delete window.__cameraAudit;
      delete window.__cameraPointerExpected;
    });
  }
};
