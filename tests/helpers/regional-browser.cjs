'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
async function verifyRegional(page, results, tag, capture = false) {
  await verifySnapshotScenery(page, results, tag, capture);
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

// Exercise the combined approved scenery with the real renderer on every existing
// Chromium/WebKit device profile. Use fresh engine states because earlier UI
// fixtures deliberately clear props. Restore the player's state and draw owner.
async function verifySnapshotScenery(page, results, tag, capture) {
  assert.equal(await page.title(), "So I Became the Dark Lord's Problem");
  assert.equal(await page.locator('#hud h1').textContent(), "So I Became the Dark Lord's Problem");
  const saved = await page.evaluate(() => Prototype.game.snapshot());
  await page.evaluate(() => {
    const c = Prototype.game,
      original = PrototypeVisuals.draw;
    window.__snapshotSceneryProbe = {
      seen: [],
      tick: c.tick,
      restore() {
        c.tick = this.tick;
        PrototypeVisuals.draw = original;
      },
    };
    c.tick = () => {};
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      if (e.regionalDistrict) __snapshotSceneryProbe.seen.push(e.id);
      return original.call(this, ctx, e, ...args);
    };
  });
  try {
    for (const [region, district, count] of [
      ['vale', 'hamlet-orchard', 5],
      ['vale', 'millhaven-carpentry', 2],
      ['march', 'reedport-catch', 2],
      ['march', 'camp-work', 2],
      ['frontier', 'burned-hamlet-home', 2],
    ]) {
      const probe = await page.evaluate(
        ({ region, district }) => {
          let seed = 73129;
          const rng = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
          const sample = new Prototype.game.constructor('normal', 'paladin', rng);
          sample.enter(region);
          const z = sample.zone(),
            props = z.props.filter((p) => p.regionalDistrict === district);
          z.enemies = [];
          sample.s.party = [];
          sample.s.clock = 120;
          const x = props.reduce((n, p) => n + p.x, 0) / props.length,
            y = props.reduce((n, p) => n + p.y, 0) / props.length;
          Object.assign(sample.hero, sample.safe(x, y + 90));
          Prototype.game.s = sample.s;
          __snapshotSceneryProbe.seen = [];
          Prototype.updateHUD();
          Prototype.renderer.draw();
          const painted = props.filter((p) => __snapshotSceneryProbe.seen.includes(p.id)).length;
          const center = { x: sample.hero.x, y: sample.hero.y };
          const individuallyPainted = [];
          // Inspect each actual prop through the running camera/renderer, so a
          // district cannot pass merely because one furnishing happens to draw.
          for (const p of props) {
            Object.assign(sample.hero, sample.safe(p.x, p.y + 120));
            __snapshotSceneryProbe.seen = [];
            Prototype.renderer.draw();
            if (__snapshotSceneryProbe.seen.includes(p.id)) individuallyPainted.push(p.id);
          }
          Object.assign(sample.hero, center);
          Prototype.renderer.draw();
          return {
            count: props.length,
            decorative: props.every((p) => p.r === 0 && p.decorative),
            painted,
            individuallyPainted: individuallyPainted.length,
          };
        },
        { region, district },
      );
      assert.equal(probe.count, count, region + '/' + district + ' precise prop count');
      assert(probe.decorative, 'new scenery is nonblocking');
      assert.equal(probe.individuallyPainted, count, district + ' every prop actually paints');
      assert(
        probe.painted > 0,
        region + '/' + district + ' actually paints through procedural fallback',
      );
      if (capture)
        await page.screenshot({
          path: path.join(results, 'snapshot-' + district + '-' + tag + '.png'),
        });
    }
  } finally {
    await page.evaluate((state) => {
      __snapshotSceneryProbe.restore();
      delete window.__snapshotSceneryProbe;
      Prototype.game.s = state;
      Prototype.updateHUD();
    }, saved);
  }
}

module.exports = { verifyRegional };
