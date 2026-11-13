'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../_site');
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
async function main() {
  if (!fs.existsSync(path.join(root, 'tools/sprites/library-index.json')))
    throw Error('Build the static site first: node scripts/build.cjs --check --site');
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    const target = fs.existsSync(file) && fs.statSync(file).isFile()
      ? file : file === root ? path.join(root, 'index.html') : null;
    if (!target) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(response);
  });
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const opts = { headless: true };
    if (process.env.CHROMIUM_EXECUTABLE) {
      opts.executablePath = process.env.CHROMIUM_EXECUTABLE;
      opts.args = ['--no-sandbox', '--disable-dev-shm-usage'];
    }
    browser = await chromium.launch(opts);
    const url = 'http://127.0.0.1:' + server.address().port + '/tools/sprites/showroom.html';
    for (const width of [1280, 393]) {
      const page = await browser.newPage({ viewport: { width, height: width === 393 ? 852 : 800 } });
      const errors = [];
      const images = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (request.url().includes('/assets/sprites/')) images.push(request.url());
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.SpriteShowroom?.ready === true, null, { timeout: 40000 });
      assert.deepEqual(errors, [], 'browser painter scripts must not crash: ' + width);
      assert.equal(await page.locator('h1').first().textContent(), 'Sprite Showroom');
      assert.equal(await page.locator('#asset-grid .asset-card').count(), 24);
      const index = JSON.parse(fs.readFileSync(path.join(root, 'tools/sprites/library-index.json')));
      assert.equal(await page.evaluate(() => window.SpriteShowroom.entries), index.entries.length);
      await page.locator('#asset-query').fill('hero:paladin');
      await page.locator('#asset-grid .asset-card').first().click();
      await page.waitForFunction(() => new URL(location.href).searchParams.get('asset') === 'hero:paladin');
      assert.match(await page.locator('#asset-selection').textContent(), /Procedural selected/);
      assert.equal(await page.locator('#asset-revision option').count() > 0, true);
      await page.locator('button[data-view="compare"]').click();
      assert.equal(await page.locator('#asset-secondary-frame').isVisible(), true);
      await page.locator('#asset-light').selectOption('night');
      await page.waitForTimeout(180);
      assert.match(await page.locator('#asset-preview-note').textContent(), /night studio grade/);
      await page.locator('#asset-query').fill('registered-terrain:road:vale');
      await page.locator('#asset-grid .asset-card').first().click();
      assert.match(await page.locator('#asset-selection').textContent(), /road material/);
      assert.equal(await page.locator('button[data-view="compare"]').isDisabled(), true);
      await page.locator('#asset-query').fill('enemy:skeleton');
      await page.locator('#asset-grid .asset-card').first().click();
      assert.match(await page.locator('#asset-selection').textContent(), /Dated review fixture/);
      await page.locator('#asset-query').fill('');
      await page.locator('#asset-group').selectOption('World & scenery');
      assert.equal((await page.locator('#asset-grid .asset-card').count()) > 0, true);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 2, 'showroom must not overflow horizontally at ' + width + 'px: ' + overflow);
      assert(images.length < 40, 'opening the showroom must not decode every retained raster');
      assert.deepEqual(errors, [], 'showroom must remain free of browser errors: ' + width);
      await page.close();
    }
    console.log('PASS single Sprite Showroom browser: desktop/phone, filters, 75+513 cases, ' +
      'renderer selection, retained raster, comparison, materials and bounded lazy images');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
