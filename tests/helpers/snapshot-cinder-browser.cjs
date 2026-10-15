'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyCinderSupport(page, results, tag, capture = false) {
  await page.evaluate(() => {
    const c = Prototype.game;
    window.__cinderBrowser = {
      state: c.s,
      tick: c.tick,
      random: c.random,
      effects: c.effects,
      messages: c.messages,
      notices: c.notices,
      noticeId: c.noticeId,
      notice: c.notice,
      tactical: Object.fromEntries(
        Object.keys(c)
          .filter((k) => k.startsWith('_tactical'))
          .map((k) => [k, c[k]]),
      ),
      fillText: CanvasRenderingContext2D.prototype.fillText,
      text: [],
    };
    c.s = new Campaign('normal', 'mage', () => 0.9).s;
    c.tick = () => {};
    c.random = () => 0.9;
    c.effects = [];
    c.messages = [];
    c.notices = [];
    c.notice = () => {};
    for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
    c.enter('crown');
    c.s.party = [];
    c.s.clock = 200;
    c.s.mercyTime = 0;
    const e = c.zone().enemies.find((e) => e.family === 'cindermaw');
    c.hero.hp = c.hero.maxHp = 1e6;
    c.hero.immune = 1e6;
    Object.assign(c.hero, c.safe(e.x + 70, e.y));
    c.engage(e, true, false);
    e.cd = e.summonCd = 1e6;
    c._tacticalRogueNext = new Map([[e.id, 1e6]]);
    if (!c.tacticalRogueMove(e, c.hero, true)) throw Error('actual Broodscreen failed to prepare');
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      __cinderBrowser.text.push(String(text));
      return __cinderBrowser.fillText.call(this, text, ...args);
    };
    Prototype.updateHUD();
  });
  try {
    await page.waitForFunction(() => __cinderBrowser.text.includes('Preparing…'));
    const warning = await page.evaluate(() => {
      const a = Prototype.game.zone().enemies.find((e) => e.family === 'cindermaw').telegraph;
      return {
        anonymous: a.anonymousCast,
        radius: a.radius,
        total: a.total,
        named: __cinderBrowser.text.some(
          (t) => t.includes('Broodscreen') || t.includes('SIGNATURE'),
        ),
      };
    });
    assert.deepEqual(warning, { anonymous: true, radius: 1200, total: 1.5, named: false });
    if (capture)
      await page.screenshot({
        path: path.join(results, 'snapshot-cinder-anonymous-' + tag + '.png'),
      });
    const response = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'cindermaw'),
        ids = c.zone().enemies.map((u) => u.id);
      c.resolveAttack(e);
      e.telegraph = null;
      const enrolled = [...c._tacticalCinderResponses.keys()],
        homes = enrolled.map((id) => ({ ...c.zone().enemies.find((u) => u.id === id).home }));
      const distant = enrolled.every(
        (id) =>
          Math.hypot(
            c.zone().enemies.find((u) => u.id === id).x - e.x,
            c.zone().enemies.find((u) => u.id === id).y - e.y,
          ) > 195,
      );
      let maxStep = 0;
      for (let i = 0; i < 320; i++) {
        const before = enrolled.map((id) => {
          const u = c.zone().enemies.find((u) => u.id === id);
          return { x: u.x, y: u.y };
        });
        c.s.time += 0.05;
        c.updateEnemies(0.05);
        for (let j = 0; j < enrolled.length; j++) {
          const u = c.zone().enemies.find((u) => u.id === enrolled[j]);
          maxStep = Math.max(maxStep, Math.hypot(u.x - before[j].x, u.y - before[j].y));
        }
        if (enrolled.every((id) => c._tacticalCinderResponses.get(id)?.joined)) break;
      }
      const joined = enrolled.filter((id) => c._tacticalCinderResponses.get(id)?.joined).length;
      const stable = enrolled.every(
        (id, j) =>
          JSON.stringify(c.zone().enemies.find((u) => u.id === id).home) ===
          JSON.stringify(homes[j]),
      );
      Prototype.updateHUD();
      return {
        enrolled: enrolled.length,
        distant,
        joined,
        maxStep,
        stable,
        sameIds: JSON.stringify(ids) === JSON.stringify(c.zone().enemies.map((u) => u.id)),
        saved: JSON.stringify(c.snapshot()).includes('CinderResponses'),
      };
    });
    assert(response.distant && response.stable && response.sameIds && !response.saved);
    assert.equal(response.enrolled, 6);
    assert.equal(response.joined, 6);
    assert(response.maxStep < 17);
    if (capture)
      await page.screenshot({
        path: path.join(results, 'snapshot-cinder-native-arrivals-' + tag + '.png'),
      });
    const canceled = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'cindermaw');
      c.disengage(e, 0);
      c.s.mercyTime = 10;
      // The ministry now returns with its entourage physically; a fixture
      // cannot clear the old timer and leave the new return state stranded.
      for (let i = 0; i < 2400 && (e.returning || e.cinderReturn); i++) {
        c.s.time += 0.05;
        c.updateEnemies(0.05);
      }
      if (e.returning || e.cinderReturn) throw Error('Ministry joint return did not complete');
      return c._tacticalCinderResponses.size;
    });
    assert.equal(canceled, 0);
    const ministry = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'cindermaw');
      Object.assign(e, e.home, { returning: 0 });
      c.engage(e, true, false);
      const built = c.buildBossAttack(e, 0, c.hero);
      e.telegraph = built.first;
      c.resolveAttack(e);
      e.telegraph = null;
      c.s.time += 0.9;
      c.advanceCinderCordon(e, 0.9);
      __cinderBrowser.text = [];
      Prototype.updateHUD();
      return {
        radius: e.cinderCordon.radius,
        initial: built.first.initialRadius,
        next: e.cinderCordon.warning,
        gap: built.first.gapAngle,
        second: built.first.nextGap,
      };
    });
    assert(ministry.radius < ministry.initial && ministry.next && ministry.gap !== ministry.second);
    await page.waitForFunction(() => __cinderBrowser.text.includes('NEXT OPENING'));
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-cinder-cordon-' + tag + '.png') });
    const seals = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'cindermaw');
      c.cancelEncounter(e);
      c.engage(e, true, false);
      Object.assign(c.hero, c.safe(e.x + 70, e.y));
      const built = c.buildBossAttack(e, 3, c.hero);
      e.telegraph = built.sequence[1];
      __cinderBrowser.text = [];
      Prototype.updateHUD();
      return [built.first, ...built.sequence].map((a) => ({ x: a.x, y: a.y, stage: a.stage }));
    });
    assert.deepEqual(
      seals.map((a) => a.stage),
      [1, 2, 3, 4, 5, 6, 7],
    );
    assert.equal(new Set(seals.map((a) => a.x + ':' + a.y)).size, 7);
    await page.waitForFunction(() => __cinderBrowser.text.some((t) => t.includes('3/7')));
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-cinder-seals-' + tag + '.png') });
    const delegation = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies.find((e) => e.family === 'cindermaw');
      c.cancelEncounter(e);
      c.engage(e, true, false);
      c.summonBossAdds(e, c.trueSummonPlan(e), 6);
      for (const u of c.bossOwnedSummons(e)) {
        u.cd = 1e6;
        u.telegraph = null;
        u.motion = null;
        u.slow = 0;
      }
      e.cd = 1e6;
      c._tacticalRogueNext.set(e.id, 1e6);
      const a = c.buildBossAttack(e, 5, c.hero).first;
      const ids = c.zone().enemies.map((u) => u.id);
      e.telegraph = a;
      c.resolveAttack(e);
      e.telegraph = null;
      const count = e.cinderDelegation?.members.length || 0;
      const stages = new Set();
      let finish = false;
      for (let n = 0; n < 350 && e.cinderDelegation; n++) {
        c.s.time += 0.05;
        c.updateEnemies(0.05);
        for (const u of c.zone().enemies) if (u.telegraph?.cinderDelegate) stages.add(u.id);
        finish ||=
          e.telegraph?.cinderMechanic === 'finisher' || e.motion?.cinderMotion === 'finisher';
      }
      const done = !e.cinderDelegation,
        stable = JSON.stringify(ids) === JSON.stringify(c.zone().enemies.map((u) => u.id));
      const clean = !JSON.stringify(c.snapshot()).includes('cinderDeleg');
      c.cancelEncounter(e);
      return { count, warned: stages.size, finish, done, stable, clean };
    });
    assert(delegation.count > 0 && delegation.count <= 4);
    assert.equal(delegation.warned, delegation.count);
    assert(delegation.finish && delegation.done && delegation.stable && delegation.clean);
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __cinderBrowser;
      c.s = b.state;
      c.tick = b.tick;
      c.random = b.random;
      c.effects = b.effects;
      c.messages = b.messages;
      c.notices = b.notices;
      c.noticeId = b.noticeId;
      c.notice = b.notice;
      for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
      Object.assign(c, b.tactical);
      CanvasRenderingContext2D.prototype.fillText = b.fillText;
      delete window.__cinderBrowser;
      Prototype.updateHUD();
    });
  }
  console.log(
    'PASS actual anonymous Cindermaw cast, six distant native physical arrivals and cancellation ' +
      tag,
  );
}
module.exports = { verifyCinderSupport };
