'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyTrueAuras(page, out, tag) {
  await page.evaluate(() => {
    window.__auraAudit = { state: Prototype.game.s, tick: Prototype.game.tick };
    Prototype.game.s = new Campaign('normal', 'mage', () => 0.73).s;
    Prototype.game.tick = () => {};
    Prototype.closeMenu();
  });
  try {
    const families = await page.evaluate(() => Campaign.data.bosses.map((b) => b.id));
    for (const family of families) {
      await page.evaluate((family) => {
        const g = Prototype.game,
          b = g.boss(family);
        g.enter(Campaign.dungeonIds.includes(family) ? family : b.region);
        const z = g.zone();
        z.props = [];
        z.npcs = [];
        z.buildings = [];
        z.nodes = [];
        g.s.party = [];
        const p = g.safe(1100, 1050);
        Object.assign(g.hero, p);
        // Keep the full aura/body in the portrait camera as well as desktop.
        const offset = innerWidth < 500 ? { x: 40, y: 40 } : { x: 130, y: -30 };
        const e = g.bossEnemy(b, 'true', g.safe(p.x + offset.x, p.y + offset.y));
        z.enemies = [e];
        g.engage(e, true, false);
        g.startAttack(e, g.hero, 0);
        g.zone();
        Prototype.updateHUD();
        const before = JSON.stringify(g.snapshot());
        Prototype.renderer.draw();
        if (JSON.stringify(g.snapshot()) !== before) throw Error('Aura scene draw mutated state');
      }, family);
      await page.screenshot({ path: path.join(out, 'true-aura-' + family + '-' + tag + '.png') });
    }
    const alpha = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = c.height = 240;
      const x = c.getContext('2d');
      x.fillStyle = '#123456';
      x.globalAlpha = 0.77;
      PrototypeRenderer.drawTrueAura(x, {}, { x: 120, y: 190 }, 100, 1, true);
      const center = x.getImageData(120, 148, 1, 1).data[3],
        edge = x.getImageData(160, 148, 1, 1).data[3];
      return { center, edge, paint: x.fillStyle, alpha: x.globalAlpha };
    });
    assert.equal(alpha.center, 0);
    assert(alpha.edge > 0 && alpha.edge < 70);
    assert.equal(alpha.paint, '#123456');
    assert.equal(alpha.alpha, 0.77);
  } finally {
    await page.evaluate(() => {
      Prototype.closeMenu();
      Prototype.game.s = __auraAudit.state;
      Prototype.game.tick = __auraAudit.tick;
      delete window.__auraAudit;
      Prototype.updateHUD();
    });
  }
}
module.exports = { verifyTrueAuras };
