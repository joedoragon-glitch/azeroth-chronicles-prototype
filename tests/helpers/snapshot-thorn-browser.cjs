'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyThornPatrol(page, results, tag, capture = false) {
  const saved = await page.evaluate(() => {
    const c = Prototype.game;
    window.__thornBrowser = {
      state: c.s,
      tick: c.tick,
      effects: c.effects,
      seen: new Set(),
      draw: PrototypeVisuals.draw,
    };
    c.s = new Campaign('normal', 'paladin', () => 0.5).s;
    c.tick = () => {};
    c.effects = [];
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      __thornBrowser.seen.add(e.id);
      return __thornBrowser.draw(ctx, e, ...args);
    };
    const e = c.zone().enemies.find((e) => e.family === 'thorn');
    c.zone().enemies = [e];
    c.s.party = [];
    c.s.mercyTime = 10;
    for (let i = 0; i < 340; i++) {
      c.s.time += 0.1;
      c.updateEnemies(0.1);
    }
    const n = c.thornCaptive();
    Object.assign(c.hero, c.safe(n.x + 35, n.y + 40));
    Prototype.updateHUD();
    return { npc: n.id, distance: Math.hypot(n.x - e.x, n.y - e.y), x: e.x, y: e.y, home: e.home };
  });
  try {
    assert(saved.distance < 110, 'real moving follower is close and interactable');
    assert(
      Math.hypot(saved.x - saved.home.x, saved.y - saved.home.y) > 700,
      'actual remote patrol scene',
    );
    await page.waitForFunction(() => __thornBrowser.seen.has('cage-thorn'));
    const probe = await page.evaluate(() => {
      const n = Prototype.game.thornCaptive();
      return {
        presentation: n.presentation,
        keys: PrototypeSprites.candidateKeys({ ...n, renderKind: 'npc' }),
        party: Prototype.game.combatTargets().some((u) => u.id === n.id),
      };
    });
    assert.equal(probe.presentation, 'mobile-captive');
    assert.deepEqual(probe.keys, [], 'old cage sprite cannot restore bars');
    assert.equal(probe.party, false);
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-thorn-mira-' + tag + '.png') });
    // The actual shell routes the new local-inhabitant interaction to the engine.
    await page.evaluate(() => {
      const c = Prototype.game,
        n = c.zone().npcs.find((n) => n.thornReport);
      Object.assign(c.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').evaluate((el) => el.click());
    assert(
      await page.evaluate(() =>
        Prototype.game.messages.some((m) => String(m.text || m).includes('Crown wilderness scout')),
      ),
    );
    const outcome = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'thorn'),
        n = c.thornCaptive();
      Object.assign(c.hero, c.safe(e.x + 45, e.y));
      c.s.mercyTime = 0;
      c.damage(e, 1e6);
      Object.assign(c.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
      return { id: n.id, key: c.s.keys.thorn };
    });
    assert(outcome.key);
    await page.locator('#touch-interact-button').evaluate((el) => el.click());
    assert(
      await page.evaluate(() => Prototype.game.s.rescued.thorn),
      'actual moving captive shell rescue works',
    );
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __thornBrowser;
      c.s = b.state;
      c.tick = b.tick;
      c.effects = b.effects;
      PrototypeVisuals.draw = b.draw;
      delete window.__thornBrowser;
      Prototype.updateHUD();
    });
  }
  console.log('PASS actual moving Mira, cage retirement, local report and rescue ' + tag);
}
module.exports = { verifyThornPatrol };
