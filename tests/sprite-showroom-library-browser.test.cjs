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
      assert.equal(await page.locator('#asset-scale').inputValue(), 'close');
      await page.locator('#asset-scale').selectOption('1.5');
      await page.waitForFunction(() =>
        document.querySelector('#asset-preview-note').textContent.includes('150% game scale'));
      await page.locator('#asset-scale').selectOption('close');
      // The Rogue is a current playable class absent from the historical
      // 75-contract and 513-art-case inventories.
      await page.locator('#asset-query').fill('hero:rogue');
      await page.locator('#asset-grid .asset-card').first().click();
      assert.equal(new URL(page.url()).searchParams.get('asset'), 'hero:rogue');
      assert.match(await page.locator('#asset-selection').textContent(), /Playable hero/);
      await page.waitForFunction(() =>
        document.querySelector('#asset-preview-note').textContent.includes('Isolated asset study'));
      const roguePixels = await page.locator('#asset-preview').evaluate((canvas) => {
        const ctx = canvas.getContext('2d');
        const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let pixels = 0;
        for (let i = 0; i < bytes.length; i += 4) {
          const r = bytes[i], g = bytes[i + 1], b = bytes[i + 2];
          // Ignore the showroom's neutral two-tone checker and ruler line.
          const checker = (r === 35 && g === 54 && b === 46) ||
            (r === 42 && g === 62 && b === 53);
          if (!checker && !(r >= 150 && g >= 150 && b >= 130)) pixels++;
        }
        return pixels;
      });
      assert(roguePixels > 150, 'Rogue must display a real current painter, not a blank tile');
      await page.locator('#asset-query').fill('registered-terrain:road:vale');
      await page.locator('#asset-grid .asset-card').first().click();
      assert.match(await page.locator('#asset-selection').textContent(), /road material/);
      assert.equal(await page.locator('button[data-view="compare"]').isDisabled(), true);
      const historical = index.entries.find((entry) =>
        entry.sourceKind === 'dated-reference' && entry.states?.length > 0);
      assert(historical, 'at least one dated-only historical reference must be browsable');
      await page.locator('#asset-query').fill(historical.id);
      await page.locator('#asset-grid .asset-card').first().click();
      assert.equal(new URL(page.url()).searchParams.get('asset'), historical.id);
      assert.match(await page.locator('#asset-selection').textContent(), /Dated review fixture/);
      // A current world entity may share a historical identity. In that case
      // both live and dated states must remain accessible within one card.
      const overlapping = index.entries.find((entry) =>
        entry.sourceKind !== 'dated-reference' && entry.datedStates?.length > 0);
      assert(overlapping, 'a current/historical identity collision should retain both states');
      await page.locator('#asset-query').fill(overlapping.id);
      await page.locator('#asset-grid .asset-card').first().click();
      assert.equal(new URL(page.url()).searchParams.get('asset'), overlapping.id);
      assert((await page.locator('#asset-state option').count()) > 1,
        'overlapping dated reference states should not be silently discarded');
      await page.locator('#asset-kind').selectOption('dated');
      assert((await page.locator('#asset-grid .asset-card').count()) > 0,
        'dated references filter must include preserved states on modern cards');
      await page.locator('#asset-kind').selectOption('');
      await page.locator('#asset-query').fill('');
      await page.locator('#asset-group').selectOption('World & scenery');
      assert.equal((await page.locator('#asset-grid .asset-card').count()) > 0, true);
      // The first viewport paints lazily. Scroll each visible card before
      // full-page screenshots so the captured gallery shows genuine artwork.
      const cards = page.locator('#asset-grid .asset-card');
      for (let i = 0; i < await cards.count(); i++)
        await cards.nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, 0));
      const artifactDir = path.resolve(__dirname, '../test-artifacts/sprite-showroom');
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({
        path: path.join(artifactDir, width === 393 ? 'phone.png' : 'desktop.png'),
        fullPage: true,
      });
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
