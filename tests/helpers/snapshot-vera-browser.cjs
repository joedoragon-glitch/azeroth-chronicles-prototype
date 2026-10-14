'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyVeraInspection(page, results, tag, capture = false) {
  const patrol = await page.evaluate(() => {
    const c = Prototype.game;
    window.__veraBrowser = {
      state: c.s,
      messages: c.messages,
      notices: c.notices,
      noticeId: c.noticeId,
      notice: c.notice,
      random: c.random,
      tick: c.tick,
      effects: c.effects,
      tactical: Object.fromEntries(
        Object.keys(c)
          .filter((k) => k.startsWith('_tactical'))
          .map((k) => [k, c[k]]),
      ),
      draw: PrototypeVisuals.draw,
      seen: new Set(),
    };
    c.s = new Campaign('normal', 'mage', () => 0.6).s;
    c.random = () => 0.6;
    c.tick = () => {};
    c.effects = [];
    c.messages = [];
    c.notices = [];
    c.notice = () => {};
    for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
    c.enter('crown');
    c.s.party = [];
    c.s.mercyTime = 10000;
    c.s.clock = 200;
    const e = c.zone().enemies.find((u) => u.family === 'cindermaw'),
      n = c.veraCaptive();
    c.zone().enemies = c.zone().enemies.filter((u) => u === e || n.escortGuardIds.includes(u.id));
    for (let i = 0; i < 750; i++) {
      c.s.time += 0.1;
      c.updateEnemies(0.1);
    }
    Object.assign(c.hero, c.safe(n.x - 90, n.y + 170));
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      __veraBrowser.seen.add(e.id);
      return __veraBrowser.draw(ctx, e, ...args);
    };
    Prototype.updateHUD();
    return {
      id: n.id,
      presentation: n.presentation,
      distance: Math.hypot(e.x - e.home.x, e.y - e.home.y),
      gap: Math.hypot(n.x - e.x, n.y - e.y),
      guards: c.zone().enemies.filter((u) => u.veraEscort).length,
      keys: PrototypeSprites.candidateKeys({ ...n, renderKind: 'npc' }),
      target: c.combatTargets().includes(n),
    };
  });
  try {
    assert.equal(patrol.id, 'cage-cindermaw');
    assert.equal(patrol.presentation, 'mobile-forge');
    assert(patrol.distance > 500);
    assert(patrol.gap <= 180);
    assert.equal(patrol.guards, 2);
    assert.deepEqual(patrol.keys, []);
    assert.equal(patrol.target, false);
    await page.waitForFunction(() => __veraBrowser.seen.has('cage-cindermaw'));
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-vera-forge-' + tag + '.png') });
    const repair = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((u) => u.family === 'cindermaw'),
        n = c.veraCaptive(),
        g = c.zone().enemies.find((u) => u.veraEscort);
      Object.assign(c.hero, c.safe(e.x + 50, e.y));
      c.s.mercyTime = 0;
      c.hero.hp = c.hero.maxHp = 1e6;
      c.hero.immune = 1e6;
      c.engage(e, true, false);
      Object.assign(g, c.safe(n.x + 30, n.y));
      c.engage(g, true, false);
      c.updateVeraFieldwork(0.01);
      if (!g.veraEquipment) throw Error('actual equipment absent');
      c.damage(g, 30);
      const low = g.veraEquipment.remaining,
        hp = g.hp;
      c.s.time += 4;
      c.updateVeraFieldwork(4);
      const restored = g.veraEquipment.remaining;
      const live = JSON.stringify(c.s),
        snap = c.snapshot(),
        clean = !JSON.stringify(snap).includes('veraEquipment'),
        pure = JSON.stringify(c.s) === live;
      Prototype.updateHUD();
      return {
        low,
        restored,
        hpPure: g.hp === hp,
        clean,
        pure,
        repairing: n.veraRepairUntil > c.s.time,
      };
    });
    assert(
      repair.restored > repair.low &&
        repair.hpPure &&
        repair.clean &&
        repair.pure &&
        repair.repairing,
    );
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-vera-repairs-' + tag + '.png') });
    const defeat = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((u) => u.family === 'cindermaw'),
        n = c.veraCaptive();
      Object.assign(c.hero, c.safe(e.x + 40, e.y));
      c.damage(e, 1e6);
      Object.assign(c.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
      return { key: c.s.keys.cindermaw, repairs: c.zone().enemies.some((u) => u.veraEquipment) };
    });
    assert(defeat.key && !defeat.repairs);
    await page.locator('#touch-interact-button').evaluate((el) => el.click());
    assert(
      await page.evaluate(
        () =>
          Prototype.game.s.rescued.cindermaw &&
          Prototype.game
            .zone()
            .npcs.some((n) => n.id === 'service-cindermaw' && n.kind === 'smith'),
      ),
      'actual moving forge rescue and original service',
    );
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __veraBrowser;
      c.s = b.state;
      c.messages = b.messages;
      c.notices = b.notices;
      c.noticeId = b.noticeId;
      c.notice = b.notice;
      c.random = b.random;
      c.tick = b.tick;
      c.effects = b.effects;
      for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
      Object.assign(c, b.tactical);
      PrototypeVisuals.draw = b.draw;
      delete window.__veraBrowser;
      Prototype.updateHUD();
    });
  }
  console.log(
    'PASS real variable inspections, guarded mobile forge, defense repair/save purity and moving rescue ' +
      tag,
  );
}
module.exports = { verifyVeraInspection };
