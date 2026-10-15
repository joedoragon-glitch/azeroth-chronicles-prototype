'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyAviation(page, results, tag, capture = false) {
  await page.evaluate(() => {
    const c = Prototype.game;
    window.__aviationBrowser = {
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
    c.enter('abyss');
    c.s.party = [];
    c.s.clock = 200;
    const e = c.bossEnemy(c.boss('abyss'), 'normal', { x: 1150, y: 1120 });
    c.zone().enemies = [e];
    c.hero.hp = c.hero.maxHp = 100000;
    Object.assign(c.hero, c.safe(980, 1040));
    c.hero.immune = 100;
    c.startAttack(e, c.hero, 2);
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      __aviationBrowser.text.push(String(text));
      return __aviationBrowser.fillText.call(this, text, ...args);
    };
    Prototype.updateHUD();
  });
  try {
    await page.waitForFunction(() => __aviationBrowser.text.some((t) => t.includes('Lazy Eight')));
    if (capture)
      await page.screenshot({
        path: path.join(results, 'snapshot-aviation-warning-' + tag + '.png'),
      });
    const flight = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies[0],
        before = { x: e.x, y: e.y };
      c.resolveAttack(e);
      e.telegraph = null;
      const steps = [];
      for (let i = 0; i < 8 && e.motion; i++) {
        const p = { x: e.x, y: e.y };
        c.advanceMotion(e, 0.02);
        steps.push(Math.hypot(e.x - p.x, e.y - p.y));
      }
      Prototype.updateHUD();
      return {
        steps,
        moved: Math.hypot(e.x - before.x, e.y - before.y),
        motion: !!e.motion,
        blocked: c.blocked(e.x, e.y, 'abyss', 15),
      };
    });
    assert(flight.motion && flight.moved > 0 && !flight.blocked);
    assert(
      flight.steps.every((d) => d <= 9 + 1e-7),
      'actual physical flight never teleports',
    );
    if (capture)
      await page.screenshot({
        path: path.join(results, 'snapshot-aviation-flight-' + tag + '.png'),
      });
    const outcome = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies[0];
      for (let i = 0; i < 380 && e.motion; i++) c.advanceMotion(e, 0.02);
      const separateWarning = e.telegraph?.name;
      c.cancelEncounter(e);
      e.healCd = 0;
      e.hp = e.maxHp * 0.3;
      const before = e.hp;
      const started = c.startBossRecovery(e);
      c.resolveAttack(e);
      e.telegraph = null;
      const deferred = e.hp === before && e.motion?.aerial === 'go-around';
      for (let i = 0; i < 160 && e.motion; i++) c.advanceMotion(e, 0.02);
      const amount = e.hp - before;
      const save = c.snapshot();
      return {
        separateWarning,
        started,
        deferred,
        amount,
        max: e.maxHp,
        motion: !!e.motion,
        savedMotion: save.zones.abyss.enemies[0].motion,
      };
    });
    assert.equal(outcome.separateWarning, 'Lazy Eight');
    assert(outcome.started && outcome.deferred && !outcome.motion);
    assert(Math.abs(outcome.amount - outcome.max * 0.08) < 1e-7);
    assert.equal(outcome.savedMotion, null);
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __aviationBrowser;
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
      delete window.__aviationBrowser;
      Prototype.updateHUD();
    });
  }
  console.log(
    'PASS actual aviation warning, moving flight, separate landing, completed retreat heal and save ' +
      tag,
  );
}
module.exports = { verifyAviation };
