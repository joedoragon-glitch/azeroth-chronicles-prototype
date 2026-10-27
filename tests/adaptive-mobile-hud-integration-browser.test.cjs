// Phase 4: narrowly scoped, real-browser acceptance of the combined phone HUD.
// This is not the full-game/browser matrix or a physical iOS/Android certification.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results', 'adaptive-hud-phase4');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, ''));
  const file = path.resolve(root, name || 'phone.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  const mime = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json',
    '.png': 'image/png', '.webp': 'image/webp',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
function closeTo(a, b, label) {
  assert(Math.abs(a - b) < 1.5, label + ': ' + a + ' vs ' + b);
}
const rect = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
};
async function snapshot(page) {
  return page.evaluate(() => {
    const ids = ['menu-button', 'recall-button', 'target-button', 'skill-1'];
    return Object.fromEntries(ids.map((id) => {
      const el = document.getElementById(id), r = el.getBoundingClientRect();
      return [id, { x: r.x, y: r.y, width: r.width, height: r.height }];
    }));
  });
}
async function run(browserType, name, viewport, leftHand) {
  const browser = await browserType.launch();
  let page;
  try {
    page = await browser.newPage({ viewport, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.setDefaultTimeout(10000);
    await page.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
    await page.waitForFunction(() => !!window.Prototype);
    await require('./helpers/language-browser.cjs').selectEnglish(page);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('#modal').hidden);
    await page.evaluate((left) => {
      const g = Prototype.game;
      g.enter('vale');
      g.zone().enemies = []; g.zone().npcs = []; g.zone().nodes = [];
      g.zone().buildings = []; g.s.party = [];
      g.s.projectiles = []; g.s.hazards = [];
      g.hero.skills = [1, 0, 0, 0, 0, 0, 0, 0];
      Object.assign(g.hero, { x: 750, y: 950, hp: 180, maxHp: 180, order: null, path: [] });
      if (left) {
        Prototype.input.select('phoneLayout', 'left-hand');
        document.body.dataset.phoneLayout = 'left-hand';
      }
      Prototype.updateHUD();
    }, leftHand);
    const baseline = await snapshot(page);
    assert.equal(await page.evaluate(() => Prototype.input.preferences.hudStyle), 'classic');
    assert.equal(await page.evaluate(() => Prototype.input.preferences.joystickMode), 'fixed');
    await page.evaluate(() => {
      Prototype.input.select('hudStyle', 'adaptive');
      document.body.dataset.hudStyle = 'adaptive';
      Prototype.updateHUD();
    });
    const after = await snapshot(page);
    for (const id of Object.keys(baseline)) for (const key of Object.keys(baseline[id]))
      closeTo(baseline[id][key], after[id][key], id + '.' + key);
    assert.equal(await page.locator('#skill-1').isVisible(), true, 'ATK remains visible when idle');
    assert.equal(await page.locator('#target-button').isVisible(), true);
    assert.equal(await page.locator('#recall-button').isVisible(), true);
    assert.equal(await page.locator('#menu-button').isVisible(), true);
    await page.evaluate(() => { Prototype.game.hero.hp = 37; Prototype.updateHUD(); });
    assert((await page.locator('#hero-stats').textContent()).includes('LOW HP'));
    assert.equal(await page.locator('body').getAttribute('data-hud-low-hp'), 'true');
    // A real warning must take priority and be readable over live world art.
    await page.evaluate(() => {
      Prototype.game.notice('PHASE4: incoming strike', 2, 'Dodge immediately', 'warning');
      Prototype.updateHUD();
    });
    const warning = page.locator('#message .notice-card.notice-warning');
    await warning.waitFor();
    const palette = await warning.evaluate((el) => {
      const text = getComputedStyle(el);
      return { color: text.color, background: text.backgroundColor, role: el.getAttribute('role') };
    });
    assert.equal(palette.color, 'rgb(48, 24, 12)');
    assert.equal(palette.background, 'rgb(255, 224, 167)');
    assert.equal(palette.role, 'alert');
    // Activate a floating ring through the same canvas pointer listeners;
    // WebKit synthetic pointer checks complement Chromium's real CDP swipe.
    await page.evaluate(() => {
      const canvas = document.getElementById('world');
      Prototype.input.select('joystickMode', 'floating');
      document.body.dataset.joystickMode = 'floating';
      canvas.setPointerCapture = () => {};
      const height = window.innerHeight;
      const contact = (type, id, x, y) => new PointerEvent(type, {
        pointerType: 'touch', pointerId: id, isPrimary: id === 77,
        bubbles: true, cancelable: true, clientX: x, clientY: y,
      });
      canvas.dispatchEvent(contact('pointerdown', 77, 55, height - 35));
      window.__hudPhase4Active = document.body.classList.contains('floating-joystick-active');
      canvas.dispatchEvent(contact('pointermove', 77, 105, height - 43));
      window.__hudPhase4Stick = document.getElementById('stick').style.transform;
      canvas.dispatchEvent(contact('pointerdown', 78, 60, height - 30));
      window.__hudPhase4StillActive = document.body.classList.contains('floating-joystick-active');
      document.dispatchEvent(contact('pointercancel', 77, 105, height - 43));
      window.__hudPhase4Released = !document.body.classList.contains('floating-joystick-active');
    });
    const gesture = await page.evaluate(() => ({
      active: window.__hudPhase4Active,
      stillActive: window.__hudPhase4StillActive,
      moved: window.__hudPhase4Stick,
      released: window.__hudPhase4Released,
    }));
    assert(gesture.active && gesture.stillActive && gesture.released,
      'floating gesture must start, reject second touch and release');
    assert(gesture.moved.includes('translate(') && !gesture.moved.includes('translate(0px,0px)'),
      'floating gesture uses nonzero movement vector');
    await page.locator('#menu-button').tap();
    assert.equal(await page.locator('#joystick').getAttribute('aria-hidden'), 'false',
      'fixed joystick resumes in menus');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#joystick').getAttribute('aria-hidden'), 'true');
    // The input preference is separate from the v4 save; both must survive refresh.
    await page.evaluate(() => { Prototype.save(); });
    await page.reload();
    await page.waitForFunction(() => !!window.Prototype);
    assert.equal(await page.evaluate(() => Prototype.input.preferences.hudStyle), 'adaptive');
    assert.equal(await page.evaluate(() => Prototype.input.preferences.joystickMode), 'floating');
    assert.equal(await page.evaluate(() => Prototype.input.preferences.phoneLayout),
      leftHand ? 'left-hand' : 'two-thumb');
    assert.equal(await page.evaluate(() => Prototype.game.hero.maxHp), 180);
    assert.deepEqual(errors, [], 'no browser runtime errors');
    await page.screenshot({ path: path.join(output, name + '.png'), fullPage: false });
    console.log('PASS Phase 4 integrated HUD ' + name + ' ' + viewport.width + 'x' + viewport.height);
  } catch (e) {
    await page?.screenshot({ path: path.join(output, name + '-failure.png') }).catch(() => {});
    throw e;
  } finally {
    await browser.close();
  }
}
(async () => {
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    await run(chromium, 'chromium-landscape-two-thumb', { width: 800, height: 375 }, false);
    await run(webkit, 'webkit-portrait-left-hand', { width: 393, height: 852 }, true);
  } finally {
    server.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
