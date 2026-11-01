'use strict';
// Focused real Chromium smoke for owner-directed title/continue/in-game menu music.
// One desktop browser only. Not a broad device or artistic test.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/azeroth-chronicles-prototype/';
const contentTypes = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const uri = new URL(req.url, 'http://localhost');
  const relative = uri.pathname.startsWith(prefix) ? decodeURIComponent(uri.pathname.slice(prefix.length)) : null;
  const file = relative === null ? '' : path.resolve(root, relative || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1024, height: 780 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await page.goto('http://127.0.0.1:' + server.address().port + prefix);
      await page.waitForFunction(() => window.Prototype?.audio && !document.querySelector('#startup-update:not([hidden])'), null, { timeout: 30000 });
      assert.equal(await page.evaluate(() => Prototype.audio.ctx), null, 'no forbidden silent autoplay override');
      await page.locator('#title-heading').click();
      await page.waitForFunction(() => Prototype.audio.recordedScore?.id === 'title' && Prototype.audio.ctx?.state === 'running', null, { timeout: 30000 });
      const titlePlayback = await page.evaluate(() => {
        const a = Prototype.audio, v = a.recordedScore?.voices[0];
        return { id: a.recordedScore?.id, voice: v?.id,
          gain: v?.targetGain, music: a.mixLevel('music'), master: a.mixLevel('master'),
          started: !!v?.osc?.buffer, paused: a.paused };
      });
      assert.equal(titlePlayback.voice, 'title');
      assert(titlePlayback.gain > 0 && titlePlayback.music > 0 &&
        titlePlayback.master > 0 && titlePlayback.started && !titlePlayback.paused,
        'title must have an active nonzero recorded output, not just a selected ID');
      await page.locator('#title-new').click();
      await page.getByRole('button', { name: 'New Normal game' }).click();
      await page.getByRole('button', { name: /^English(?: ✓)?$/ }).click();
      await page.getByRole('button', { name: 'Standard death and refuge recovery' }).click();
      await page.getByRole('button', { name: /Paladin/ }).click();
      await page.waitForFunction(() => window.Prototype?.started && !document.querySelector('#title-screen:not([hidden])'), null, { timeout: 60000 });
      await page.waitForFunction(() => {
        const a = Prototype.audio;
        return a.ctx?.state === 'running' && a.recordedScore && a.recordedScore.id !== 'title' &&
          a.recordedScore.id === a.productionCue(a.context)?.id;
      }, null, { timeout: 15000 });
      // The entry transition may briefly suspend/resume Web Audio while the
      // first graphics frame commits. It must settle into running playback,
      // without requiring an extra movement or skill gesture.
      await page.waitForTimeout(300);
      await page.waitForFunction(() => Prototype.audio.ctx?.state === 'running' && !Prototype.audio.paused,
        null, { timeout: 8000 });
      const loaded = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore.id, at: Prototype.audio.recordedScore.at,
        started: Prototype.started, state: Prototype.audio.ctx.state,
        zone: Prototype.game.zoneId, time: Prototype.game.s.time,
      }));
      assert.equal(loaded.id, 'place-vale',
        'real new-game Millhaven arrival uses the original Greenwood recording, not the estate cue');
      const peacefulMix = await page.evaluate(() => {
        const a = Prototype.audio, spec = a.productionCue(a.context);
        return { engaged: a.context.engaged, id: a.recordedScore?.id,
          expected: spec.id, voices: a.recordedScore?.voices.map(v =>
            ({ id: v.id, gain: v.targetGain })) };
      });
      assert.equal(peacefulMix.id, peacefulMix.expected);
      if (!peacefulMix.engaged && peacefulMix.voices.length > 1)
        assert.equal(peacefulMix.voices[1].gain, 0,
          'peaceful Greenwood must not leak the separate encounter layer');
      await page.locator('#menu-button').click();
      await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Adventure menu');
      await page.waitForTimeout(160);
      const menu = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id, at: Prototype.audio.recordedScore?.at,
        now: Prototype.audio.ctx.currentTime, time: Prototype.game.s.time,
        state: Prototype.audio.ctx.state, scene: Prototype.audio.mixScene,
      }));
      assert.equal(menu.id, loaded.id);
      assert.equal(menu.at, loaded.at, 'menu must not restart the score');
      assert.equal(menu.state, 'running', 'menu must not suspend Web Audio');
      assert.equal(menu.scene, 'world', 'menu must not reduce music to 22%');
      await page.getByRole('button', { name: 'Game and settings' }).click();
      await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Game and settings');
      await page.waitForTimeout(200);
      const settings = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore.id, at: Prototype.audio.recordedScore.at,
        now: Prototype.audio.ctx.currentTime, time: Prototype.game.s.time,
      }));
      assert.equal(settings.id, loaded.id);
      assert.equal(settings.at, loaded.at);
      assert(settings.now > menu.now, 'audio clock continues during settings');
      assert.equal(settings.time, menu.time, 'simulation must stay frozen in menus');
      await page.evaluate(() => Prototype.closeMenu());
      await page.locator('#menu-button').click();
      await page.getByRole('button', { name: 'Return to Main Menu' }).click();
      await page.waitForFunction(() =>
        !Prototype.started && !!document.querySelector('#title-screen:not([hidden])') &&
        Prototype.audio.recordedScore?.id === 'title',
        null, { timeout: 20000 });
      assert.equal(await page.evaluate(() => Prototype.audio.ctx.state), 'running');
      const returnedTitle = await page.evaluate(() => {
        const a = Prototype.audio;
        return { id: a.recordedScore?.id, active:
          a.recordedScore?.voices.some(v => v.id === 'title' && v.targetGain > 0 &&
          !!v.osc.buffer), music: a.mixLevel('music'), master: a.mixLevel('master') };
      });
      assert(returnedTitle.active && returnedTitle.music > 0 && returnedTitle.master > 0,
        'returning to Main Menu must restore the audible title voice');
      await page.locator('#title-continue').click();
      await page.waitForFunction(() => Prototype.started && Prototype.audio.recordedScore?.id !== 'title', null, { timeout: 60000 });
      const again = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id, expected: Prototype.audio.productionCue(Prototype.audio.context)?.id,
        state: Prototype.audio.ctx?.state, zone: Prototype.game.zoneId,
      }));
      assert.equal(again.id, again.expected);
      assert.equal(again.state, 'running');
      assert.equal(again.zone, loaded.zone);
      assert.deepEqual(errors, []);
      console.log('PASS real game title gesture -> New Game destination score -> uninterrupted Adventure/Settings music -> Return to title -> Continue destination score');
      console.log(JSON.stringify({ loaded, menu, settings, again }));
    } catch (error) {
      console.error('PHASE9_JOURNEY_DIAG', JSON.stringify(await page.evaluate(() => ({
        started: window.Prototype?.started,
        audio: window.Prototype?.audio?.status?.(),
        modal: document.querySelector('#modal-title')?.textContent,
        title: !document.querySelector('#title-screen')?.hidden,
        loading: document.querySelector('#title-loading')?.textContent,
      })).catch(() => ({}))));
      throw error;
    } finally {
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
