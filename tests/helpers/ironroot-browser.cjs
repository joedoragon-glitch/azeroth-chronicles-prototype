'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
async function verifyIronroot(page, results, tag, capture = false) {
  const saved = await page.evaluate(() => {
    const c = Prototype.game;
    window.__ironrootRender = {
      tick: c.tick,
      draw: PrototypeVisuals.draw,
      spriteDraw: PrototypeSprites.draw,
      seen: {},
    };
    c.tick = () => {};
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      __ironrootRender.seen[e.workstation || e.structure || ''] = true;
      return __ironrootRender.draw(ctx, e, ...args);
    };
    PrototypeSprites.draw = function (ctx, e, ...args) {
      const drawn = __ironrootRender.spriteDraw.call(this, ctx, e, ...args);
      if (drawn) __ironrootRender.seen[e.workstation || e.structure || ''] = 'sprite';
      return drawn;
    };
    return c.snapshot();
  });
  try {
    for (const [label, zone, target] of [
      ['stonecross', 'highlands', 'mint-workbench'],
      ['quarry', 'highlands', 'ore-sorting-bay'],
      ['home', 'supply-highlands', 'ridge-game-corner'],
      ['mine', 'mine', 'equipment-repair'],
    ]) {
      await page.evaluate(
        ({ zone, target }) => {
          const c = Prototype.game;
          c.enter(zone);
          c.s.clock = 600;
          c.s.party = [];
          const z = c.zone();
          const e = [...z.props, ...z.npcs].find(
            (e) => e.structure === target || e.workstation === target,
          );
          if (!e) throw Error('Missing Ironroot scene: ' + target);
          Object.assign(c.hero, c.safe(e.x + 35, e.y + 55, zone), { order: null });
          __ironrootRender.seen = {};
          Prototype.updateHUD();
        },
        { zone, target },
      );
      await page.waitForFunction((target) => !!__ironrootRender.seen[target], target);
      if (capture)
        await page.screenshot({
          path: path.join(results, 'ironroot-' + label + '-' + tag + '.png'),
        });
    }
    const state = await page.evaluate(() => {
      const c = Prototype.game,
        dara = c.zone().npcs.find((n) => n.family === 'mine');
      return {
        family: dara.family,
        kind: dara.kind,
        blocked: c.blocked(dara.x, dara.y, 'mine', 12),
        rescued: !!c.s.rescued.mine,
      };
    });
    assert.deepEqual(state, { family: 'mine', kind: 'cage', blocked: false, rescued: false });
  } finally {
    await page.evaluate((saved) => {
      Prototype.game.s = saved;
      Prototype.game.tick = __ironrootRender.tick;
      PrototypeVisuals.draw = __ironrootRender.draw;
      PrototypeSprites.draw = __ironrootRender.spriteDraw;
      delete window.__ironrootRender;
      Prototype.updateHUD();
    }, saved);
  }
}
module.exports = { verifyIronroot };
