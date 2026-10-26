'use strict';
// Stage 2 browser acceptance: sound begins after a user gesture without hero
// movement, and transient recorded music / ambience loads recover in-place.
// This is a single Chromium smoke in desktop and mobile-sized contexts, not
// a replacement for the manually gated all-engine/device suite.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const types = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  const file = path.resolve(root, name.replace(/^\//, '') || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const entry of ['index.html', 'phone.html']) {
      const phone = entry === 'phone.html';
      const context = await browser.newContext({
        viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        hasTouch: phone,
        isMobile: phone,
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      let scoreFetches = 0;
      let environmentFetches = 0;
      await page.route('**/assets/audio/music/title.mp3', (route) => {
        scoreFetches++;
        if (scoreFetches === 1)
          return route.fulfill({ status: 503, contentType: 'text/plain', body: 'transient score outage' });
        return route.continue();
      });
      await page.route('**/assets/audio/ambience/env-woodland-day.mp3', (route) => {
        environmentFetches++;
        if (environmentFetches === 1)
          return route.fulfill({ status: 503, contentType: 'text/plain', body: 'transient ambience outage' });
        return route.continue();
      });
      try {
        await page.goto(base + entry);
        await page.waitForFunction(() => !!window.Prototype?.audio && !!document.querySelector('#modal-title'));
        const before = await page.evaluate(() => ({
          state: Prototype.audio.ctx?.state || 'locked',
          x: Prototype.game.hero.x,
          y: Prototype.game.hero.y,
          started: Prototype.audio.context?.started,
          menu: document.querySelector('#modal-title').textContent,
        }));
        assert.equal(before.state, 'locked', entry + ': audio must respect browser gesture gate');
        assert.equal(before.started, false, entry + ': not started as a character action');

        // A tap/click on non-action heading supplies browser activation but
        // never moves the player, starts a run, presses a menu button or casts.
        if (phone) await page.locator('#modal-title').tap();
        else await page.locator('#modal-title').click();
        await page.waitForFunction(() => Prototype.audio.ctx?.state === 'running');
        await page.waitForFunction(() =>
          Prototype.audio.productionRetry?.attempts >= 1 &&
          !Prototype.audio.productionRetry.pending
        );
        await page.waitForFunction(() => Prototype.audio.recordedScore?.id === 'title', null, {
          timeout: 20000,
        });
        const after = await page.evaluate(() => ({
          x: Prototype.game.hero.x, y: Prototype.game.hero.y,
          started: Prototype.audio.context?.started,
          score: Prototype.audio.recordedScore?.id,
          retries: Prototype.audio.productionRetry?.attempts,
          error: Prototype.audio.recordingError,
          voices: Prototype.audio.voices.size,
        }));
        assert.equal(after.x, before.x, 'no movement to activate score');
        assert.equal(after.y, before.y, 'no movement to activate score');
        assert.equal(after.started, false, 'character not started');
        assert.equal(after.score, 'title', 'music starts from game-entry gesture');
        assert.equal(after.retries, 2, 'one failed download and one successful retry');
        assert.equal(scoreFetches, 2, 'one bounded real network retry');
        assert.equal(after.error, null, 'recover clears score error');
        assert(after.voices > 0 && after.voices <= 64);

        // Freeze only the audio selection updater inside this test page.
        // It prevents the real title scene from cancelling the deliberately
        // simulated outdoor environment before the network retry resolves.
        await page.evaluate(() => {
          const a = Prototype.audio;
          a.update = () => {};
          window.stage2Scene = {
            zone: 'vale', region: 'vale', interior: 'outdoors',
            situation: 'exploration', started: true, night: false,
            peace: false, engaged: 0, settlement: null, boss: null,
          };
          a.updateEnvironment(window.stage2Scene);
        });
        await page.waitForFunction(() =>
          Prototype.audio.environmentRetry?.attempts === 1 &&
          !Prototype.audio.environmentRetry.pending &&
          Prototype.audio.environmentFallback
        );
        await page.waitForTimeout(1150);
        await page.evaluate(() => Prototype.audio.updateEnvironment(window.stage2Scene));
        await page.waitForFunction(() =>
          Prototype.audio.environmentVoice?.id === 'env-woodland-day', null, {
            timeout: 15000,
          }
        );
        const recovered = await page.evaluate(() => ({
          bed: Prototype.audio.environmentVoice?.id,
          attempts: Prototype.audio.environmentRetry.attempts,
          error: Prototype.audio.environmentError,
          fallback: Prototype.audio.environmentFallback,
          voices: Prototype.audio.voices.size,
        }));
        assert.equal(recovered.attempts, 2);
        assert.equal(environmentFetches, 2);
        assert.equal(recovered.error, null);
        assert.equal(recovered.fallback, false);
        assert(recovered.voices <= 64);
        assert.deepEqual(errors, []);
        console.log('PASS Stage 2 Chromium ' + (phone ? 'phone' : 'desktop') +
          ': first non-action gesture unlocks title score; real transient MP3 fetches recover in same scene');
      } catch (error) {
        fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
        await page.screenshot({
          path: path.join(root, 'test-results/audio-stage2-' + (phone ? 'phone' : 'desktop') + '-failure.png'),
        }).catch(() => {});
        console.error(entry, { scoreFetches, environmentFetches });
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
