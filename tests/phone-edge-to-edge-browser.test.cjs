'use strict';
// Deliberately narrow real-browser shell/layout test. No gameplay, saves or
// renderer matrix; test the public wrapper + the production CSS against a
// small DOM fixture to isolate viewport geometry and touch transforms.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
const innerFixture = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="stylesheet" href="./styles/prototype.css">
<link rel="stylesheet" href="./styles/phone.css"></head>
<body data-experience="phone">
<canvas id="world"></canvas>
<div id="hud"><div id="hero-stats">HP 155 / 155</div><button id="menu-button">Menu</button></div>
<div id="movement"><div id="joystick"><div id="stick"></div></div></div>
<div id="skills"><button>ATK</button><button>Heal</button></div>
<button id="recall-button">Recall</button><button id="target-button">Target</button>
<button id="squad-button">Squad</button><button id="touch-interact-button">Interact</button>
<button id="order-button">Confirm</button><button id="update-button">Update</button>
<section id="title-screen"><div class="title-panel">
<p id="title-tagline">He conquered the world. He wasn't expecting you.</p>
<h1 id="title-heading">So I Became the Dark Lord's Problem</h1>
<p id="title-preview">Saved adventure</p>
<nav><button id="title-continue">Continue Adventure</button>
<button>New Game</button><button>Saved Games &amp; Backups</button>
<button>Settings</button><button>Help &amp; Credits</button></nav></div></section>
<section id="modal" data-dialog-size="wide" style="pointer-events:none"><h2>Settings</h2><div id="modal-actions">
<button>Graphics</button><button>Controls</button></div><button id="close-button">Back</button></section>
<script>document.querySelector('#title-continue').addEventListener('click',()=>document.body.dataset.tapped='yes');</script>
</body></html>`;
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  if (name === '/phone-game.html') {
    res.setHeader('Content-Type', 'text/html');
    res.end(innerFixture);
    return;
  }
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
  fs.createReadStream(file).pipe(res);
});
const near = (value, goal, label) => assert(Math.abs(value - goal) < 1.1,
  label + ': expected ' + goal + ', got ' + value);
async function inspect(frame, expected, physicalSize) {
  const geometry = await frame.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const css = getComputedStyle(document.documentElement);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      safe: Object.fromEntries(['top','right','bottom','left'].map(edge =>
        [edge, parseFloat(css.getPropertyValue('--phone-safe-' + edge))])),
      world: rect('#world'), title: rect('.title-panel'), nav:
        [...document.querySelectorAll('#title-screen nav button')].map(el => {
          const r = el.getBoundingClientRect();
          return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, height:r.height };
        }),
      movement: rect('#joystick'), skills: rect('#skills'), hud: rect('#hud'),
      menu: rect('#menu-button'), interact: rect('#touch-interact-button'),
      recall: rect('#recall-button'), target: rect('#target-button'),
      confirm: rect('#order-button'), modal: rect('#modal'),
    };
  });
  near(geometry.viewport.width, expected.viewportWidth, 'inner landscape width');
  near(geometry.viewport.height, expected.viewportHeight, 'inner landscape height');
  near(geometry.world.width, expected.viewportWidth, 'full-bleed world width');
  near(geometry.world.height, expected.viewportHeight, 'full-bleed world height');
  for (const side of ['left','right','top','bottom'])
    near(geometry.safe[side], expected.safe[side], 'mapped safe ' + side);
  const left = geometry.safe.left, right = expected.viewportWidth - geometry.safe.right;
  assert(geometry.movement.x >= left - 1, 'joystick stays clear of screen cutout');
  assert(geometry.hud.x >= left - 1, 'HP HUD stays clear of screen cutout');
  assert(geometry.recall.x >= left - 1 && geometry.target.x >= left - 1,
    'squad controls stay clear of screen cutout');
  assert(geometry.interact.x >= left - 1, 'interact stays clear');
  assert(geometry.skills.right <= right + 1, 'skill buttons stay within touch-safe edge');
  assert(geometry.menu.right <= right + 1, 'Menu stays within touch-safe edge');
  assert(geometry.confirm.right <= right + 1, 'Confirm stays within touch-safe edge');
  assert(geometry.modal.x >= left - 2 && geometry.modal.right <= right + 2,
    'dialog stays within safe edges');
  for (const button of geometry.nav) {
    assert(button.left >= left - 2 && button.right <= right + 2,
      'title menu stays within touch-safe edges');
    assert(button.height >= 44, 'title menu retains accessible tap height');
  }
  assert.equal(geometry.nav.length, 5, 'all original title actions are visible');
  console.log('PASS phone full-bleed geometry ' + physicalSize +
    ' viewport=' + geometry.viewport.width + 'x' + geometry.viewport.height +
    ' safe=' + JSON.stringify(geometry.safe));
}
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const executablePath = process.env.CHROMIUM_EXECUTABLE ||
      ['/usr/bin/chromium','/usr/bin/google-chrome','/usr/bin/chromium-browser']
        .find(candidate => fs.existsSync(candidate));
    browser = await chromium.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({
      viewport: { width: 912, height: 420 }, isMobile: true,
      hasTouch: true, deviceScaleFactor: 3,
    });
    await page.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
    const frame = page.frame({ url: /phone-game\.html/ });
    assert(frame, 'same-origin inner phone game exists');
    await page.evaluate(() => {
      document.getElementById('phone-safe-probe').style.padding = '10px 58px 14px 60px';
      window.dispatchEvent(new Event('resize'));
    });
    await inspect(frame, { viewportWidth: 912, viewportHeight: 420,
      safe: { top:10, right:58, bottom:14, left:60 } }, '912x420 landscape');
    await page.evaluate(() => { document.querySelector('#phone-safe-probe').style.padding = '0px'; });
    await page.setViewportSize({ width: 420, height: 912 });
    await page.evaluate(() => {
      document.getElementById('phone-safe-probe').style.padding = '62px 0px 32px 0px';
      window.dispatchEvent(new Event('resize'));
    });
    await inspect(frame, { viewportWidth: 912, viewportHeight: 420,
      safe: { top:0, right:32, bottom:0, left:62 } }, '420x912 upright rotation');
    const outer = await page.locator('#phone-game-frame').boundingBox();
    near(outer.x, 0, 'rotated outer frame left');
    near(outer.y, 0, 'rotated outer frame top');
    near(outer.width, 420, 'rotated outer frame width');
    near(outer.height, 912, 'rotated outer frame height');
    await frame.locator('#title-continue').tap();
    assert.equal(await frame.locator('body').getAttribute('data-tapped'), 'yes',
      'transformed tap reaches the intended inner button');
    await page.setViewportSize({ width: 912, height: 420 });
    assert.equal(await frame.locator('body').getAttribute('data-tapped'), 'yes',
      'physical rotation retains the same live inner document');
    console.log('PASS phone frame orientation and transformed touch continuity');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
