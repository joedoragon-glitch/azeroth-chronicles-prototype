'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyDreadAgriculture(page, results, tag, capture = false) {
  await page.evaluate(() => {
    const c = Prototype.game;
    window.__dreadBrowser = {
      state: c.s,
      random: c.random,
      tick: c.tick,
      effects: c.effects,
      messages: c.messages,
      notices: c.notices,
      notice: c.notice,
      noticeId: c.noticeId,
      tactical: Object.fromEntries(
        Object.keys(c)
          .filter((k) => k.startsWith('_tactical'))
          .map((k) => [k, c[k]]),
      ),
      ground: PrototypeCombatVisuals.ground,
      seen: new Set(),
      drawn: new Set(),
      frames: 0,
    };
    let seed = 13;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    c.s = new Campaign('normal', 'mage', random).s;
    c.random = random;
    c.tick = () => {};
    c.effects = [];
    c.messages = [];
    c.notices = [];
    c.notice = () => {};
    for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
    c.enter('supply-crown');
    c.s.party = [];
    c.s.mercyTime = 0;
    const e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
    c.zone().enemies = [e];
    Object.assign(c.hero, c.safe(e.x + 80, e.y), { hp: 1e6, maxHp: 1e6, immune: 1e6 });
    c.engage(e, true, false);
    e.cd = 0;
    e.specialCd = 0;
    c._tacticalRogueNext = new Map([[e.id, 1e6]]);
    PrototypeCombatVisuals.ground = function (ctx, screen, game, ...args) {
      const boss = game.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
      if (boss?.telegraph?.dreadMechanic) __dreadBrowser.drawn.add(boss.telegraph.index);
      return __dreadBrowser.ground(ctx, screen, game, ...args);
    };
    Prototype.updateHUD();
  });
  try {
    for (let indexCount = 0; indexCount < 7; indexCount++) {
      const warning = await page.evaluate(() => {
        const c = Prototype.game,
          b = __dreadBrowser,
          e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
        const destinations = [
          { x: 785, y: 650 },
          { x: 680, y: 700 },
          { x: 650, y: 630 },
        ];
        for (let i = 0; i < 8000; i++) {
          const a = e.telegraph;
          if (a?.dreadMechanic && !b.seen.has(a.index)) {
            b.seen.add(a.index);
            Prototype.updateHUD();
            return {
              index: a.index,
              name: a.name,
              warning: a.timer,
              gaps: a.gaps || [],
              brood: c.captainOwnedSummons(e).length,
            };
          }
          c.move(c.hero, destinations[Math.floor(b.frames / 400) % 3], 220, 0.05);
          if (b.frames % 700 === 699) {
            const u = c.captainOwnedSummons(e)[0];
            if (u) u.hp = 0;
          }
          c.s.time += 0.05;
          c.updateEnemies(0.05);
          b.frames++;
        }
        return null;
      });
      assert(warning, 'all seven regular attacks naturally become available');
      assert(warning.warning > 0);
      await page.waitForFunction((index) => __dreadBrowser.drawn.has(index), warning.index);
      if (capture)
        await page.screenshot({
          path: path.join(results, `snapshot-dread-${warning.index}-${tag}.png`),
        });
      const outcome = await page.evaluate(() => {
        const c = Prototype.game,
          e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown'),
          a = { ...e.telegraph },
          beforeIds = c.zone().enemies.map((u) => u.id);
        // Resolve the selected warning through actual update. Keep other decisions
        // cooling down while observing this action, without replacing the selector.
        let warning2 = false,
          feed = false,
          closure = false,
          vapor = false;
        for (let i = 0; i < 220; i++) {
          e.specialCd = 10;
          c.s.time += 0.05;
          c.updateEnemies(0.05);
          if (e.telegraph?.dreadLeg === 2) warning2 = true;
          if (c.captainOwnedSummons(e).some((u) => u.dreadFeedUntil > c.s.time)) feed = true;
          if (e.dreadClosure) closure = true;
          if (e.dreadVapors?.length) vapor = true;
        }
        const live = JSON.stringify(c.s),
          saved = c.snapshot();
        return {
          index: a.index,
          warning2,
          feed,
          closure,
          vapor,
          snapshotPure: live === JSON.stringify(c.s),
          savedTransient: saved.zones['supply-crown'].enemies.some(
            (u) => u.dreadClosure || u.dreadVapors || u.dreadFeedUntil,
          ),
          afterIds: c.zone().enemies.map((u) => u.id),
          beforeIds,
          brood: c.captainOwnedSummons(e).length,
          ranged: c.captainOwnedSummons(e).filter((u) => u.ranged).length,
        };
      });
      assert(outcome.snapshotPure && !outcome.savedTransient);
      if (outcome.index === 1) assert(outcome.warning2, 'actual second-leg warning');
      if (outcome.index === 2 || outcome.index === 6) assert(outcome.vapor);
      if (outcome.index === 3) assert(outcome.brood === 4 && outcome.ranged === 1);
      if (outcome.index === 4) assert(outcome.closure);
      if (outcome.index === 5) {
        assert(outcome.feed);
        assert.deepEqual(outcome.afterIds, outcome.beforeIds, 'feeding adds no actors');
      }
    }
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __dreadBrowser;
      for (const key of [
        'state',
        'random',
        'tick',
        'effects',
        'messages',
        'notices',
        'notice',
        'noticeId',
      ]) {
        if (key === 'state') c.s = b[key];
        else c[key] = b[key];
      }
      for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
      Object.assign(c, b.tactical);
      PrototypeCombatVisuals.ground = b.ground;
      delete window.__dreadBrowser;
      Prototype.updateHUD();
    });
  }
  console.log(
    'PASS real seven-slot Dreadmaw selection/rendering, L-rush, brood, feeding, closure, vapor and save purity ' +
      tag,
  );
}
module.exports = { verifyDreadAgriculture };
