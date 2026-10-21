'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const opts = {
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  };
  const raw = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (raw) {
    const u = new URL(raw);
    opts.proxy = {
      server: u.protocol + '//' + u.host,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  }
  const browser = await chromium.launch(opts);
  try {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
      serviceWorkers: 'block',
      ignoreHTTPSErrors: true,
    });
    const p = await context.newPage(),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(
      'https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html?verify=dev125',
      { waitUntil: 'domcontentloaded' },
    );
    await p.waitForFunction(
      () => window.Prototype?.game && window.PrototypeBuild?.version === '0.9.1+snapshot.dev.125',
    );
    const version = await p.evaluate(() => PrototypeBuild.version);
    const crossing = await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('archive');
      g.s.party = [];
      g.zone().enemies = [];
      Object.assign(g.hero, { x: 940, y: 1200 });
      for (let i = 0; i < 24; i++) {
        g.s.time += 0.05;
        g.move(g.hero, { x: 1010, y: 1200 }, 100, 0.05);
      }
      return {
        x: g.hero.x,
        y: g.hero.y,
        outerWall: g.blocked(940, 1380),
        partition: g.blocked(990, 1050),
      };
    });
    if (crossing.x < 1005 || !crossing.outerWall || !crossing.partition)
      throw Error('Live Archive crossing or wall check failed');
    const file = 'docs/evidence/TREASURY_ARCHIVE_DEV125_PUBLICATION_20261021.json';
    const receipt = JSON.parse(fs.readFileSync(file));
    receipt.live_phone_crossing = crossing;
    receipt.live_phone_startup = { version, errors, passed: errors.length === 0 };
    fs.writeFileSync(file, JSON.stringify(receipt, null, 2) + '\n');
    if (errors.length) throw Error(errors.join('\n'));
    console.log(
      'PASS live phone startup and Archive crossing · ' + version + ' · no JavaScript errors',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
