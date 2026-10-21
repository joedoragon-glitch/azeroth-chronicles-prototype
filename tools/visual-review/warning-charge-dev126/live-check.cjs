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
      'https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html?verify=dev126',
      { waitUntil: 'domcontentloaded' },
    );
    await p.waitForFunction(
      () => window.Prototype?.game && window.PrototypeBuild?.version === '0.9.1+snapshot.dev.126',
    );
    const version = await p.evaluate(() => PrototypeBuild.version);
    const file = 'docs/evidence/COMBAT_FLOW_DEV126_PUBLICATION_20261021.json';
    const receipt = JSON.parse(fs.readFileSync(file));
    receipt.live_phone_startup = { version, errors, passed: errors.length === 0 };
    fs.writeFileSync(file, JSON.stringify(receipt, null, 2) + '\n');
    if (errors.length) throw Error(errors.join('\n'));
    console.log('PASS live phone startup · ' + version + ' · no JavaScript errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
