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
        return a.ctx?.state === 'running' && a.context?.millhavenTown &&
          a.cue?.id === 'vale' && a.recordedScore?.id === 'millhaven-chamber' &&
          a.recordedScore?.voices[0]?.targetGain > 0;
      }, null, { timeout: 15000 });
      // The entry transition may briefly suspend/resume Web Audio while the
      // first graphics frame commits. It must settle into running playback,
      // without requiring an extra movement or skill gesture.
      await page.waitForTimeout(300);
      await page.waitForFunction(() => Prototype.audio.ctx?.state === 'running' && !Prototype.audio.paused,
        null, { timeout: 8000 });
      const loaded = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id || 'synth:vale',
        at: Prototype.audio.recordedScore?.at,
        started: Prototype.started, state: Prototype.audio.ctx.state,
        zone: Prototype.game.zoneId, time: Prototype.game.s.time,
      }));
      assert.equal(loaded.id, 'millhaven-chamber',
        'new game inside expanded Millhaven plays the approved chamber recording');
      const peacefulMix = await page.evaluate(() => {
        const a = Prototype.audio, spec = a.productionCue(a.context);
        return { engaged: a.context.engaged, town: a.context.millhavenTown,
          id: a.recordedScore?.id || 'synth:vale', expected: spec?.id || 'synth:vale',
          voiceGain: a.recordedScore?.voices[0]?.targetGain || 0 };
      });
      assert.equal(peacefulMix.id, peacefulMix.expected);
      assert(peacefulMix.town && peacefulMix.voiceGain > 0,
        'peaceful Millhaven must have audible recorded Candidate B output');
      await page.locator('#menu-button').click();
      await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Adventure menu');
      await page.waitForTimeout(160);
      const menu = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id || 'synth:vale',
        at: Prototype.audio.recordedScore?.at,
        now: Prototype.audio.ctx.currentTime, time: Prototype.game.s.time,
        state: Prototype.audio.ctx.state, scene: Prototype.audio.mixScene,
      }));
      assert.equal(menu.id, loaded.id);
      assert.equal(menu.at, loaded.at, 'menu must not restart the score');
      assert.equal(menu.state, 'running', 'menu must not suspend Web Audio');
      assert.equal(menu.scene, 'world', 'menu must not reduce music to 22%');
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Settings');
      await page.waitForTimeout(200);
      const settings = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id || 'synth:vale',
        at: Prototype.audio.recordedScore?.at,
        now: Prototype.audio.ctx.currentTime, time: Prototype.game.s.time,
      }));
      assert.equal(settings.id, loaded.id);
      assert.equal(settings.at, loaded.at);
      assert(settings.now > menu.now, 'audio clock continues during settings');
      assert.equal(settings.time, menu.time, 'simulation must stay frozen in menus');

      // Millhaven's current eastern workshop, not the old village radius,
      // determines when the chamber recording hands off to Orchard Roads.
      const roadside = await page.evaluate(() => {
        const campaign = Prototype.game;
        const outer = campaign.zone().props.find((p) => p.id === 'settlement-major-6');
        if (!outer) return null;
        const home = { x: campaign.hero.x, y: campaign.hero.y };
        campaign.hero.x = outer.x + 390;
        campaign.hero.y = outer.y;
        Prototype.audio.update(campaign, false, { started: true, menu: true });
        return home;
      });
      assert(roadside, 'expanded Millhaven eastern workshop is required');
      await page.waitForFunction(() =>
        !Prototype.audio.context?.millhavenTown &&
        Prototype.audio.recordedScore?.id === 'place-vale',
        null, { timeout: 20000 });
      assert(await page.evaluate(() =>
        Prototype.audio.recordedScore?.voices[0]?.targetGain > 0),
        'Orchard Roads recording must be audible in the outside fields');
      await page.evaluate((home) => {
        const campaign = Prototype.game;
        Object.assign(campaign.hero, home);
        Prototype.audio.update(campaign, false, { started: true, menu: true });
      }, roadside);
      await page.waitForFunction(() => {
        const a = Prototype.audio;
        return a.context?.millhavenTown && a.recordedScore?.id === 'millhaven-chamber' &&
          a.cue?.id === 'vale' && a.recordedScore?.voices[0]?.targetGain > 0;
      }, null, { timeout: 20000 });

      // Exercise real MP3 handoff at the live Forest Crypt entrance while the
      // game menu safely freezes simulation. This is still a real WebAudio
      // transition, not merely a mocked cue-selection assertion.
      const estate = await page.evaluate(() => {
        const c = Prototype.game;
        const entrance = c.zone().npcs.find((n) =>
          n.kind === 'dungeon' && n.family === 'crypt' && !n.sideDungeon);
        if (!entrance) return null;
        const home = { x: c.hero.x, y: c.hero.y };
        c.hero.x = entrance.x - 940;
        c.hero.y = entrance.y;
        Prototype.audio.update(c, false, { started: true, menu: true });
        return { home, entrance: { x: entrance.x, y: entrance.y } };
      });
      assert(estate, 'live Forest Crypt entrance is required for audio routing');
      await page.waitForFunction(() => {
        const a = Prototype.audio, v = a.recordedScore?.voices[0];
        return a.recordedScore?.id === 'settlement-vale' &&
          a.context?.estateApproach && !!v?.osc?.buffer && v.targetGain > 0;
      }, null, { timeout: 18000 });
      const approachStart = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore.id, at: Prototype.audio.recordedScore.at,
      }));
      await page.evaluate((e) => {
        const c = Prototype.game;
        c.hero.x = e.x - 1080;
        c.hero.y = e.y;
        Prototype.audio.update(c, false, { started: true, menu: true });
      }, estate.entrance);
      const approachHold = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id, at: Prototype.audio.recordedScore?.at,
        approaching: Prototype.audio.context?.estateApproach,
      }));
      assert.equal(approachHold.id, 'settlement-vale');
      assert.equal(approachHold.at, approachStart.at,
        'the estate melody must not restart inside the hysteresis exit band');
      assert.equal(approachHold.approaching, true);
      await page.evaluate((e) => {
        const c = Prototype.game;
        c.hero.x = e.x - 1160;
        c.hero.y = e.y;
        Prototype.audio.update(c, false, { started: true, menu: true });
      }, estate.entrance);
      await page.waitForFunction(() =>
        Prototype.audio.recordedScore?.id === 'place-vale' &&
        !Prototype.audio.context?.estateApproach,
        null, { timeout: 18000 });
      await page.evaluate((home) => {
        const c = Prototype.game;
        c.hero.x = home.x;
        c.hero.y = home.y;
        Prototype.audio.update(c, false, { started: true, menu: true });
      }, estate.home);
      await page.waitForFunction(() => {
        const a = Prototype.audio;
        return a.context?.millhavenTown && a.recordedScore?.id === 'millhaven-chamber' &&
          a.cue?.id === 'vale' && a.recordedScore?.voices[0]?.targetGain > 0;
      }, null, { timeout: 20000 });
      assert.equal(await page.evaluate(() => Prototype.audio.productionCue(Prototype.audio.context)?.id),
        'millhaven-chamber', 'returning to real Millhaven resumes Candidate B');

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
      await page.waitForFunction(() => {
        const a = Prototype.audio;
        return Prototype.started && a.context?.millhavenTown &&
          a.cue?.id === 'vale' && a.recordedScore?.id === 'millhaven-chamber';
      }, null, { timeout: 60000 });
      const again = await page.evaluate(() => ({
        id: Prototype.audio.recordedScore?.id || 'synth:vale',
        expected: Prototype.audio.productionCue(Prototype.audio.context)?.id || 'synth:vale',
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
