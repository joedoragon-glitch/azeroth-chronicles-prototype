'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyMaps(page, out, tag) {
  await page.evaluate(() => {
    window.__mapAudit = { state: Prototype.game.s, tick: Prototype.game.tick };
    Prototype.game.s = new Campaign('normal', 'ranger', () => 0.73).s;
    Prototype.game.tick = () => {};
    Prototype.closeMenu();
  });
  try {
    for (const id of ['vale', 'march', 'highlands', 'frontier', 'crown']) {
      const expected = await page.evaluate((id) => {
        const g = Prototype.game;
        Prototype.closeMenu();
        g.enter(id);
        g.zone().enemies = [];
        const town = g.zone().npcs.find((n) => n.kind === 'rest' && n.id === 'rest');
        Object.assign(g.hero, g.safe(town.x + 150, town.y + 120));
        Prototype.updateHUD();
        return {
          name: g.definition().name,
          town: g.definition().town,
          anchor: town.servicePoint || town,
          roads: g.zone().roads.length,
        };
      }, id);
      await page.keyboard.press('m');
      assert.equal(await page.locator('#modal-title').textContent(), expected.name + ' map');
      assert(await page.locator('#modal-description canvas').isVisible());
      assert(expected.roads > 0, 'current road network is present');
      const town = page.locator('#modal-actions button').filter({ hasText: expected.town }).first();
      await town.click();
      await page.screenshot({ path: path.join(out, 'map-' + id + '-' + tag + '.png') });
      const go = page.locator('#modal-actions button').first();
      assert(await go.isEnabled());
      await go.click();
      assert(await page.locator('#modal').isHidden(), 'navigation closes map');
      const order = await page.evaluate(() => ({
        order: Prototype.game.hero.order,
        path: Prototype.game.hero.path,
      }));
      assert.equal(order.order?.type, 'move');
      assert(order.path.length > 0);
      assert(
        Math.hypot(order.order.x - expected.anchor.x, order.order.y - expected.anchor.y) < 115,
        'native map chooses current service frontage',
      );
      await page.evaluate(() => Prototype.closeMenu());
    }
  } finally {
    await page.evaluate(() => {
      Prototype.closeMenu();
      Prototype.game.s = __mapAudit.state;
      Prototype.game.tick = __mapAudit.tick;
      delete window.__mapAudit;
      Prototype.updateHUD();
    });
  }
}
module.exports = { verifyMaps };
