'use strict';
// Run after extracting v0.8.118 into COOLDOWN_PREVIOUS_ROOT. This exercises a real
// installed-app update; normal CI browser gates independently cover current entries.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const oldRoot = process.env.COOLDOWN_PREVIOUS_ROOT;
assert(oldRoot, 'Set COOLDOWN_PREVIOUS_ROOT to the extracted v0.8.118 tree');
const root = path.resolve(__dirname, '..');
const nextVersion = require('../package.json').version;
let servedRoot = oldRoot;
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const rel = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(servedRoot, '.' + (rel === '/' ? '/index.html' : rel));
  if (
    !file.startsWith(path.resolve(servedRoot) + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
});
const snapshot = () => ({
  gold: Prototype.game.hero.gold,
  class: Prototype.game.hero.class,
  mode: Prototype.game.s.mode,
  succession: Prototype.game.s.challenge.succession,
  mp: Prototype.game.hero.mp,
  manaPotions: Prototype.game.hero.potions.mana,
  talents: Prototype.game.hero.talents,
  rangerMana: Prototype.game.s.rangerSupport.mana,
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const webkit = process.env.BROWSER_ENGINE === 'webkit';
  const browser = await (webkit ? pw.webkit : pw.chromium).launch(
    webkit
      ? {}
      : {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
  );
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 800 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.Prototype);
    await page.keyboard.press('s');
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('#modal').hidden);
    await page.keyboard.press('p');
    await page.evaluate(() => {
      const g = Prototype.game;
      g.hero.gold = 98765;
      g.hero.talents[1] = 3;
      g.hero.mp = 17;
      g.hero.potions.mana = 7;
      g.s.rangerSupport.mana = 2;
      const assertSave = Prototype.save();
      if (!assertSave) throw Error('Old campaign could not be saved');
    });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
    });
    // Reopen the installed app before updating (the first controller claim is
    // deliberately not a hot reload of a newly opened uninstalled page).
    await page.reload();
    await page.waitForFunction(() => window.Prototype);
    await page.keyboard.press('p');
    assert.equal(await page.evaluate(() => PrototypeBuild.version), '0.8.118');
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), 98765);
    const before = await page.evaluate(snapshot);
    servedRoot = root;
    await page
      .evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
      .catch((error) => {
        if (!/context|navigation/i.test(error.message)) throw error;
      });
    await page.waitForFunction(
      (version) => window.PrototypeBuild?.version === version,
      nextVersion,
      {
        timeout: 60000,
      },
    );
    await page.waitForFunction(async (version) => {
      const keys = await caches.keys();
      return keys.includes('azeroth-app-v' + version) && !keys.includes('azeroth-app-v0.8.118');
    }, nextVersion);
    assert.deepEqual(await page.evaluate(snapshot), before);
    assert.equal(await page.evaluate(() => PrototypeRules.resourceMode.manaEnabled), false);
    // Shutting down the origin exercises actual network unavailability and
    // avoids WebKit's context.setOffline navigation-protocol internal error.
    await new Promise((resolve) => server.close(resolve));
    await page.goto(url + 'phone.html');
    await page.waitForFunction(() => window.Prototype);
    assert.equal(await page.evaluate(() => PrototypeBuild.version), nextVersion);
    assert.equal(await page.evaluate(() => Prototype.platform.mode), 'phone');
    assert.deepEqual(await page.evaluate(snapshot), before);
    assert(await page.locator('#joystick').isVisible());
    console.log(
      'PASS ' +
        (webkit ? 'WebKit' : 'Chromium') +
        ' installed PWA 0.8.118 → ' +
        nextVersion +
        ', cache retirement, dormant MP/talent/save retention and offline phone reopen',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
