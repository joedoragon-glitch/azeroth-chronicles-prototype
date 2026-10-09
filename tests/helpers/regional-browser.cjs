'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
async function verifyRegional(page, results, tag, capture = false) {
  const saved = await page.evaluate(() => Prototype.game.snapshot());
  await page.evaluate(() => {
    const c = Prototype.game;
    // Intercept the real Canvas API; keep the normal renderer and camera running.
    const api = CanvasRenderingContext2D.prototype,
      fill = api.fillText,
      wall = PrototypeVisuals.dungeonArchitecture;
    window.__regionalProbe = {
      labels: [],
      walls: [],
      tick: c.tick,
      restore() {
        c.tick = this.tick;
        api.fillText = fill;
        PrototypeVisuals.dungeonArchitecture = wall;
      },
    };
    c.tick = () => {};
    api.fillText = function (text, x, y, maxWidth) {
      if (
        ['Borin the Village Smith', 'Neri the Alchemist', 'Dara the Highland Smith'].includes(text)
      ) {
        const width = Math.min(this.measureText(text).width, maxWidth || Infinity);
        const transform = this.getTransform();
        __regionalProbe.labels.push({
          text,
          left: transform.a * (x - width / 2) + transform.c * y + transform.e,
          right: transform.a * (x + width / 2) + transform.c * y + transform.e,
          canvas: this.canvas.width,
        });
      }
      return fill.apply(this, arguments);
    };
    PrototypeVisuals.dungeonArchitecture = function (...args) {
      __regionalProbe.walls.push(args[2]);
      return wall(...args);
    };
  });
  try {
    for (const id of ['crypt', 'archive', 'mine', 'supply-highlands']) {
      const state = await page.evaluate((id) => {
        const c = Prototype.game;
        c.enter(id);
        c.s.party = [];
        c.zone().enemies = [];
        c.s.clock = 120;
        c.s.mercyTime = 10;
        const n = c.zone().npcs.find((n) => n.kind === 'cage');
        Object.assign(c.hero, n ? c.safe(n.x - 70, n.y + 90) : c.safe(400, 450));
        __regionalProbe.labels = [];
        __regionalProbe.walls = [];
        Prototype.renderer.draw();
        return {
          station: n && { presentation: n.presentation, key: c.s.keys[n.family] },
          labels: __regionalProbe.labels,
          walls: __regionalProbe.walls,
        };
      }, id);
      assert(state.walls.includes(id), 'actual geometry is drawn for ' + id);
      if (id !== 'supply-highlands') {
        assert.equal(state.station.presentation, 'workstation');
        assert(!state.station.key);
        assert(state.labels.length > 0, 'working specialist label is visible ' + id);
        assert(
          state.labels.every((l) => l.left >= 11 && l.right <= l.canvas - 11),
          'specialist label fits narrow viewport ' + id,
        );
      }
      if (capture)
        await page.screenshot({ path: path.join(results, 'regional-' + id + '-' + tag + '.png') });
    }
  } finally {
    await page.evaluate((state) => {
      __regionalProbe.restore();
      delete window.__regionalProbe;
      Prototype.game.s = state;
    }, saved);
  }
}
module.exports = { verifyRegional };
