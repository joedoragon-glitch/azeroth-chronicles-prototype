'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
async function verifyNoticeStrip(page, out, tag, phone, viewport) {
  const text =
    'Silver and copper arrive separately at Stonecross. They leave as crowns stamped with the Dark Lord’s face, while armed guards count the sealed crates.';
  await page.evaluate((text) => {
    const c = Prototype.game;
    window.__noticeReview = { state: c.s, tick: c.tick };
    c.s = structuredClone(c.snapshot());
    c.tick = () => {};
    c.zone().enemies = [];
    c.s.party = [];
    c.s.projectiles = [];
    c.s.hazards = [];
    Prototype.closeMenu();
    c.notice(text, 0.5, '', 'narration');
    Prototype.updateHUD();
  }, text);
  try {
    await page.waitForFunction(() => document.querySelector('#message .notice-narration'));
    const geometry = await page.locator('#message').evaluate((el) => {
      const b = el.getBoundingClientRect();
      return {
        x: b.x,
        width: b.width,
        height: b.height,
        pointer: getComputedStyle(el).pointerEvents,
        cardWidth: el.firstElementChild.scrollWidth,
        clientWidth: el.firstElementChild.clientWidth,
      };
    });
    assert.equal(geometry.pointer, 'none', 'strip cannot capture joystick/attack input');
    assert(geometry.cardWidth <= geometry.clientWidth + 1, 'prose wraps without overflow');
    if (phone) {
      assert(
        geometry.width >= viewport.width - 24,
        'long phone notices use available horizontal space',
      );
      assert(
        geometry.x >= 0 && geometry.x + geometry.width <= viewport.width,
        'strip stays inside phone viewport',
      );
      assert(
        geometry.height <= (viewport.width > viewport.height ? 58 : 100),
        'reading stays shallow in both phone orientations',
      );
    }
    await page.screenshot({ path: path.join(out, 'notice-strip-' + tag + '.png') });
    await page.evaluate(() => {
      const c = Prototype.game;
      const e = c.makeEnemy(
        { species: 'goblin', level: 1, hp: 100, damage: 0, gold: 0, xp: 0 },
        { x: c.hero.x + 60, y: c.hero.y },
      );
      e.aggro = true;
      c.zone().enemies = [e];
      Prototype.updateHUD();
    });
    assert.equal(
      await page.locator('#message .notice-narration').count(),
      0,
      'combat hides existing prose immediately',
    );
    await page.evaluate(() => {
      Prototype.game.notice('Danger remains', 0.1, '', 'warning');
      Prototype.updateHUD();
    });
    assert.equal(
      await page.locator('#message .notice-warning').count(),
      1,
      'urgent warning still appears in combat',
    );
    await page.evaluate(() => {
      Prototype.game.zone().enemies = [];
      Prototype.updateHUD();
    });
    assert.equal(
      await page.locator('#message .notice-narration').count(),
      0,
      'victory frame cannot immediately reshow prose',
    );
    await page.waitForFunction(() => document.querySelector('#message .notice-narration'), null, {
      timeout: 4500,
    });
    assert.equal(
      await page.locator('#message .notice-narration').textContent(),
      text,
      'same story resumes once after disengagement',
    );
    await page.waitForFunction(() => !document.querySelector('#message .notice-card'));
  } finally {
    await page.evaluate(() => {
      const c = Prototype.game;
      c.s = __noticeReview.state;
      c.tick = __noticeReview.tick;
      delete window.__noticeReview;
      Prototype.updateHUD();
    });
  }
}
module.exports = { verifyNoticeStrip };
