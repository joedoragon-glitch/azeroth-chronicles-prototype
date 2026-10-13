'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
async function verifySnapshotEncounters(page, results, tag, capture = false) {
  const saved = await page.evaluate(() => {
    const c = Prototype.game;
    window.__snapshotEncounter = {
      tick: c.tick,
      draw: PrototypeVisuals.draw,
      fillText: CanvasRenderingContext2D.prototype.fillText,
      seen: {},
      text: [],
    };
    c.tick = () => {};
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      __snapshotEncounter.seen[e.id] = {
        species: e.species,
        structure: e.structure,
        profile: e.captainProfile,
      };
      return __snapshotEncounter.draw(ctx, e, ...args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      __snapshotEncounter.text.push(String(text));
      return __snapshotEncounter.fillText.call(this, text, ...args);
    };
    return JSON.parse(JSON.stringify(c.s));
  });
  try {
    for (const zone of ['crypt', 'supply-highlands']) {
      const targets = await page.evaluate((zone) => {
        const c = Prototype.game;
        c.enter(zone);
        c.s.clock = 200;
        c.s.party = [];
        const z = c.zone();
        return zone === 'crypt'
          ? z.props
              .filter((p) => ['estate-rug', 'estate-hearth', 'estate-lounge'].includes(p.structure))
              .map((p) => p.id)
          : z.enemies.filter((e) => e.roomCaptain).map((e) => e.id);
      }, zone);
      assert.equal(targets.length, zone === 'crypt' ? 6 : 1);
      for (const id of targets) {
        await page.evaluate((id) => {
          const c = Prototype.game,
            z = c.zone(),
            e = [...z.props, ...z.enemies].find((e) => e.id === id);
          Object.assign(c.hero, c.safe(e.x + 50, e.y + 60), { order: null });
          __snapshotEncounter.seen = {};
          __snapshotEncounter.text = [];
          if (e.roomCaptain) {
            c.engage(e);
            c.startCaptainAttack(e, c.hero);
          }
          Prototype.updateHUD();
        }, id);
        await page.waitForFunction((id) => !!__snapshotEncounter.seen[id], id);
        if (zone === 'supply-highlands') {
          await page.waitForFunction(() => __snapshotEncounter.text.includes('Preparing…'));
          const state = await page.evaluate((id) => {
            const c = Prototype.game,
              e = c.zone().enemies.find((e) => e.id === id);
            return {
              species: e.species,
              anonymous: e.telegraph.anonymousCast,
              windup: c.effects.some((f) => f.type === 'enemyVfx' && f.stage === 'windup'),
              hiddenName: __snapshotEncounter.text.includes(e.telegraph.name),
              guards: c
                .zone()
                .enemies.filter((u) => u.roomGuard && !u.roomCaptain)
                .map((u) => u.species),
            };
          }, id);
          assert.equal(state.species, 'ridge');
          assert(state.anonymous && !state.windup && !state.hiddenName);
          assert(state.guards.every((s) => s === 'wolf'));
        }
        if (capture)
          await page.screenshot({
            path: path.join(results, 'snapshot-encounter-' + id + '-' + tag + '.png'),
          });
      }
    }
  } finally {
    await page.evaluate((state) => {
      const c = Prototype.game;
      c.s = state;
      c.tick = __snapshotEncounter.tick;
      PrototypeVisuals.draw = __snapshotEncounter.draw;
      CanvasRenderingContext2D.prototype.fillText = __snapshotEncounter.fillText;
      delete window.__snapshotEncounter;
      Prototype.updateHUD();
    }, saved);
  }
  console.log(
    'PASS snapshot estate furnishings, horned captain and anonymous cast renderer ' + tag,
  );
}
module.exports = { verifySnapshotEncounters };
