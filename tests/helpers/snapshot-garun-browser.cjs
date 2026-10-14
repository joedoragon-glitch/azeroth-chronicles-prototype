'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyGarunWorks(page, results, tag, capture = false) {
  await page.evaluate(() => {
    const c = Prototype.game;
    window.__garunBrowser = {
      state: c.s,
      tick: c.tick,
      effects: c.effects,
      random: c.random,
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
    c.s = new Campaign('normal', 'paladin', () => 0.9).s;
    c.tick = () => {};
    c.random = () => 0.9;
    c.effects = [];
    c.messages = [];
    c.notices = [];
    // This probe tests patrol/construction and rescue. Keep its simulated
    // milestones out of the real shell notification queue and ID cursor.
    c.notice = () => {};
    for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
    c.enter('mine');
    c.s.party = [];
    c.s.clock = 200;
    const e = c.zone().enemies.find((e) => e.type === 'boss' && e.family === 'mine');
    c.zone().enemies = [e];
    c.hero.hp = c.hero.maxHp = 100000;
    Object.assign(c.hero, c.safe(910, 1100));
    c.startAttack(e, c.hero, 1);
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      __garunBrowser.text.push(String(text));
      return __garunBrowser.fillText.call(this, text, ...args);
    };
    Prototype.updateHUD();
  });
  try {
    await page.waitForFunction(() => __garunBrowser.text.includes('PLANNED'));
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-garun-planned-' + tag + '.png') });
    const result = await page.evaluate(() => {
      const c = Prototype.game,
        e = c.zone().enemies[0];
      const previews = c
        .zone()
        .props.filter((p) => p.garunPreview)
        .map((p) => ({ x: p.x, y: p.y }));
      while (e.telegraph?.index === 1) {
        c.resolveAttack(e);
        e.telegraph = e.sequence.shift() || null;
      }
      const supports = c
        .zone()
        .props.filter((p) => p.garunTemporary)
        .map((p) => ({ x: p.x, y: p.y, r: p.r }));
      e.telegraph = null;
      e.sequence = [];
      c.startAttack(e, c.hero, 3);
      c.resolveAttack(e);
      for (let i = 0; i < 80 && e.motion; i++) c.advanceMotion(e, 0.1);
      Object.assign(c.hero, c.safe(e.x + 30, e.y + 30));
      __garunBrowser.text = [];
      Prototype.updateHUD();
      return { previews, supports, opening: e.open };
    });
    assert(result.supports.length > 0 && result.supports.length <= 2);
    assert(result.supports.every((p) => result.previews.some((q) => p.x === q.x && p.y === q.y)));
    assert.equal(result.opening, 3);
    await page.waitForFunction(
      () => __garunBrowser.text.includes('BLOCKED') && __garunBrowser.text.includes('CORE EXPOSED'),
    );
    if (capture)
      await page.screenshot({ path: path.join(results, 'snapshot-garun-built-' + tag + '.png') });
    await page.evaluate(() => {
      const c = Prototype.game;
      c.disengage(c.zone().enemies[0], 0.1);
      __garunBrowser.text = [];
      Prototype.renderer.draw();
    });
    assert(
      await page.evaluate(
        () => !Prototype.game.zone().props.some((p) => p.garunPreview || p.garunTemporary),
      ),
    );
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game,
        b = __garunBrowser;
      c.s = b.state;
      c.tick = b.tick;
      c.effects = b.effects;
      c.random = b.random;
      c.messages = b.messages;
      c.notices = b.notices;
      c.noticeId = b.noticeId;
      c.notice = b.notice;
      for (const k of Object.keys(c).filter((k) => k.startsWith('_tactical'))) delete c[k];
      Object.assign(c, b.tactical);
      CanvasRenderingContext2D.prototype.fillText = b.fillText;
      delete window.__garunBrowser;
      Prototype.updateHUD();
    });
  }
  console.log('PASS actual Garun planned/solid/core cues and reset ' + tag);
}
module.exports = { verifyGarunWorks };
