'use strict';
const assert = require('node:assert/strict');
async function verifyRoamingInterception(page) {
  await page.evaluate(() => {
    window.__roamingAudit = { state: Prototype.game.s, tick: Prototype.game.tick };
    Prototype.game.s = new Campaign('normal', 'mage', () => 0.73).s;
    Prototype.game.tick = () => {};
    Prototype.closeMenu();
  });
  try {
    for (const family of ['thorn', 'cindermaw']) {
      const result = await page.evaluate((family) => {
        const g = Prototype.game;
        g.enter(family === 'thorn' ? 'vale' : 'crown');
        const z = g.zone(),
          e = z.enemies.find((e) => e.type === 'boss' && e.family === family),
          point = g.safe(family === 'thorn' ? 2250 : 1900, family === 'thorn' ? 1900 : 1450);
        Object.assign(e, point);
        const n = family === 'thorn' ? g.thornCaptive() : g.veraCaptive();
        if (n) Object.assign(n, g.safe(point.x + 20, point.y + 20));
        Object.assign(g.hero, g.safe(e.x + 70, e.y));
        g.hero.cd = Array(8).fill(0);
        g.s.party = [];
        z.enemies = [e];
        g.s.mercyTime = 0;
        e.thornLeg = 4;
        e.thornPause = 0;
        e.cinderStop = 1;
        e.cinderDestination = { ...g.cinderInspectionStops()[2], i: 2 };
        const receipt = g.chargedEncounterSnapshot(),
          fraction = e.hp / e.maxHp;
        g.cast(1, e.id, true, receipt);
        for (let i = 0; i < 10; i++) g.updateProjectiles(0.1);
        const responded = e.aggro,
          undamaged = e.hp / e.maxHp === fraction;
        g.disengage(e, 0.1);
        const resumed =
          !e.returning &&
          !e.aggro &&
          e.thornLeg === 4 &&
          Math.hypot(e.x - point.x, e.y - point.y) < 1e-7;
        e.returning = 1;
        if (family === 'thorn') e.thornReturn = true;
        else e.cinderReturn = true;
        g.hero.cd[0] = 0;
        const admitted = g.cast(1, e.id, false);
        for (let i = 0; i < 10; i++) g.updateProjectiles(0.1);
        Prototype.updateHUD();
        return { responded, undamaged, resumed, admitted, reengaged: e.aggro && !e.returning };
      }, family);
      assert(
        result.responded && result.undamaged,
        family + ' deflects the early charge and stops to fight ' + JSON.stringify(result),
      );
      assert(result.resumed, family + ' resumes original patrol itinerary');
      assert(
        result.admitted && result.reengaged,
        family + ' accepts a real player cast while returning',
      );
    }
  } finally {
    await page.evaluate(() => {
      Prototype.closeMenu();
      Prototype.game.s = __roamingAudit.state;
      Prototype.game.tick = __roamingAudit.tick;
      delete window.__roamingAudit;
      Prototype.updateHUD();
    });
  }
}
module.exports = { verifyRoamingInterception };
