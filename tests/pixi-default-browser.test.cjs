// Focused desktop/phone default-renderer migration, isolated from the
// longer manual Pixi/Canvas fidelity and recovery browser journey.
// Both tests are intentionally separate so the standard six-minute per-test
// ceiling remains strict; no graphics-preparation deadline is extended.
'use strict';
// Focused real-browser acceptance for the PixiJS-default rollout.
// A software browser may lack WebGL2; in that case Canvas fallback is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const Campaign = require('../src/prototype/engine');

const root = path.resolve(__dirname, '..');
// An isolated browser smoke may run before the general build step. Ensure
// the exact pinned local Pixi bundle exists, just like the actual PWA build.
if (!fs.existsSync(path.join(root, 'assets/vendor/pixi-8.22.0.min.js')))
  cp.execFileSync(process.execPath, ['scripts/vendor-pixi.cjs', '--ensure'], {
    cwd: root,
    stdio: 'inherit',
  });
const engine = process.env.BROWSER_ENGINE || 'chromium';
const requireWebGL = process.env.REQUIRE_WEBGL2 === '1';
// The dedicated CI workflow runs desktop and phone independently. A direct
// local invocation still exercises both, with the same real title/UI actions.
const deviceCases =
  process.env.PIXI_BROWSER_DEVICE === 'desktop'
    ? [false]
    : process.env.PIXI_BROWSER_DEVICE === 'phone'
      ? [true]
      : [false, true];
// Use the runner's Chromium if available, including its software WebGL2
// implementation. This is a functionality check, never a hardware FPS claim.
function installedChromium() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'])
    try {
      return cp.execFileSync('which', [command], { encoding: 'utf8' }).trim();
    } catch (_) {}
  return null;
}
async function selectPixi(page) {
  await page.locator('#menu-button').click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
  // The current UI exposes an inline SELECT, not the old Graphics submenu.
  await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
  try {
    // A complete current-region atlas can legitimately take much longer than
    // the old fringe-only Pixi startup, especially with software WebGL2.
    // This is a *test observation limit*, never a game loading deadline.
    await page.waitForFunction(
      () => {
        const r = Prototype.experimentalGraphics;
        return (
          r.phase === 'trial' || (r.phase === 'canvas' && !!(r.lastError || r.lastFallbackReason))
        );
      },
      null,
      { timeout: 240000 },
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      renderer: Prototype.experimentalGraphics,
      titleLoading: document.querySelector('#title-loading')?.textContent,
      sceneLoading: document.querySelector('#scene-loading-text')?.textContent,
      gpuPreparation: document.querySelector('#gpu-renderer-trial')?.textContent,
      titleHidden: document.querySelector('#title-screen')?.hidden,
      gameStarted: Prototype.started,
    }));
    throw Error(
      'Pixi regional preload did not complete: ' +
        JSON.stringify(diagnostic) +
        '; ' +
        String(error),
    );
  }
  return page.evaluate(() => Prototype.experimentalGraphics);
}
// Drive the actual modern title-screen flow. Earlier graphics tests relied
// on automatic gameplay startup and could silently skip preloading entirely.
async function enterPlayableGame(page, hero = 'Paladin', developer = false) {
  await page.waitForFunction(() => !!window.Prototype?.renderer);
  // The first-use choice is above the title, after the automatic update gate.
  await page.waitForFunction(() => document.querySelector('#startup-update')?.hidden);
  if (await page.locator('#language-welcome').isVisible())
    await page.locator('#language-welcome [data-language="en"]').click();
  const title = page.locator('#title-screen');
  if (await title.evaluate((el) => !el.hidden)) {
    if (!(await page.locator('#title-continue').isDisabled())) {
      await page.locator('#title-continue').click();
    } else {
      const titleGeometry = await page.locator('#title-screen nav button').evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect(),
            css = getComputedStyle(node);
          return {
            text: node.textContent,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            font: parseFloat(css.fontSize),
          };
        }),
      );
      assert.equal(titleGeometry.length, 5);
      for (const item of titleGeometry) {
        assert(item.height >= 44 && item.font >= 15, JSON.stringify(item));
        assert(
          item.top >= 0 && item.bottom <= (await page.evaluate(() => innerHeight)),
          JSON.stringify(item),
        );
      }
      await page.locator('#title-new').click();
      await page
        .getByRole('button', { name: developer ? 'New Developer Mode run' : /^Choose Hero/ })
        .click();
      const geometry = await page.evaluate(() => {
        const modal = document.querySelector('#modal'),
          back = document.querySelector('#close-button');
        const bounds = modal.getBoundingClientRect(),
          close = back.getBoundingClientRect();
        return {
          heading: parseFloat(getComputedStyle(modal.querySelector('h2')).fontSize),
          body: parseFloat(getComputedStyle(document.querySelector('#modal-description')).fontSize),
          cards: [...document.querySelectorAll('#modal-actions button')].map((node) => ({
            font: parseFloat(getComputedStyle(node).fontSize),
            details: [...node.querySelectorAll('.detail')].map((x) =>
              parseFloat(getComputedStyle(x).fontSize),
            ),
            height: node.getBoundingClientRect().height,
          })),
          back: { height: close.height, width: close.width, top: close.top, bottom: close.bottom },
          viewport: { width: innerWidth, height: innerHeight },
          modal: { left: bounds.left, right: bounds.right },
        };
      });
      assert.equal(geometry.cards.length, 4);
      assert(geometry.heading >= 16 && geometry.body >= 13, JSON.stringify(geometry));
      assert(
        geometry.back.height >= 44 &&
          geometry.back.width >= 44 &&
          geometry.back.top >= 0 &&
          geometry.back.bottom <= geometry.viewport.height,
        JSON.stringify(geometry),
      );
      assert(
        geometry.modal.left >= 0 && geometry.modal.right <= geometry.viewport.width,
        JSON.stringify(geometry),
      );
      for (const card of geometry.cards)
        assert(
          card.font >= 13 && card.height >= 44 && card.details.every((n) => n >= 11.5),
          JSON.stringify(card),
        );
      console.log('Stage 4 computed menu geometry ' + JSON.stringify(geometry));
      await page
        .getByRole('button', { name: new RegExp(hero) })
        .first()
        .click();
    }
  }
  await page.waitForFunction(
    () =>
      !!window.Prototype?.started &&
      document.querySelector('#title-screen')?.hidden &&
      document.querySelector('#scene-loading')?.hidden !== false,
    null,
    { timeout: 180000 },
  );
}
// Use a real screen-coordinate touch on phone. Playwright locator.click() may
// scroll the fixed 15-second trial panel during mobile restart, potentially
// changing the visual viewport and invalidating the graphics trial itself.
// Never bypass the user-facing button or extend/disable the safety deadline.
async function keepPixiTrial(page, phone, checkpoint) {
  const target = await page.evaluate(() => {
    const panel = document.querySelector('#gpu-renderer-trial');
    const button = panel?.querySelector('button');
    const rect = button?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : -1;
    const y = rect ? rect.top + rect.height / 2 : -1;
    const top = document.elementFromPoint(x, y);
    return {
      x,
      y,
      width: rect?.width || 0,
      height: rect?.height || 0,
      hit: !!button && (top === button || button.contains(top)),
      panelVisible: !!panel && !panel.hidden,
      graphics: Prototype.experimentalGraphics,
    };
  });
  assert.equal(
    target.graphics.phase,
    'trial',
    checkpoint + ': confirmation requires an active, unexpired trial: ' + JSON.stringify(target),
  );
  assert(
    target.graphics.secondsRemaining > 0 && target.panelVisible,
    checkpoint + ': Keep prompt disappeared before user confirmation: ' + JSON.stringify(target),
  );
  assert(
    target.hit && target.width >= 44 && target.height >= 44,
    checkpoint + ': Keep must be touchable at its visible center: ' + JSON.stringify(target),
  );
  if (phone) await page.touchscreen.tap(target.x, target.y);
  else
    // A coordinate click does not auto-scroll the fixed safety panel or
    // accidentally change the viewport during the 15-second trial.
    await page.mouse.click(target.x, target.y);
  const result = await page.evaluate(() => Prototype.experimentalGraphics);
  assert.equal(
    result.phase,
    'confirmed',
    checkpoint +
      ': the real Keep action must confirm, not time out or revert: ' +
      JSON.stringify({ before: target.graphics, after: result }),
  );
  return result;
}
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const filename = path.resolve(root, name);
  if (
    !filename.startsWith(root + path.sep) ||
    !fs.existsSync(filename) ||
    !fs.statSync(filename).isFile()
  ) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
  });
  fs.createReadStream(filename).pipe(res);
});
async function downloadReport(page) {
  await page.locator('#menu-button').click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Playtest tools', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Export playtest report/ }).click();
  const report = JSON.parse(fs.readFileSync(await (await download).path(), 'utf8'));
  for (let back = 0; back < 4 && (await page.locator('#modal').isVisible()); back++)
    await page.keyboard.press('Escape');
  return report;
}
function reportReceipt(report, scenario) {
  const g = report.performance.graphicsRenderer,
    r = report.performance.rendererDiagnostics;
  // Synthetic test observations only. Never log complete player/save/device reports.
  console.log(
    'STARTUP_REPORT_RECEIPT ' +
      JSON.stringify({
        scenario,
        version: report.version,
        active: g.activeRenderer,
        preferred: g.preferredRenderer,
        reason: g.lastFallbackReason,
        hold: g.recoveryHoldReason,
        firstFailure: g.firstFailure
          ? { type: g.firstFailure.type, stage: g.firstFailure.stage }
          : null,
        startup: report.performance.startupDiagnostics.attempts.at(-1).outcome,
        rendererRecording: r.state,
        durationMs: r.durationMs,
        frames: r.frames,
        draws: r.draws,
        initial: r.initialRenderer,
        final: r.finalRenderer,
        guideVersion: report.analysisGuide.version,
        effectsRecording: report.performance.effectDiagnostics?.recording,
        effectDraws: report.performance.effectDiagnostics?.drawFrames,
        navigationRecording: report.performance.crowdDiagnostics.recording,
        navigationTicks: report.performance.crowdDiagnostics.sampledSimulationTicks,
        recoveryActions: report.partyDiagnostics.recoveryActions.map((row) => row.action),
        emergencyTransitions: report.partyDiagnostics.emergencyTransitions.length,
        callbackP95UpperMs: r.approximatePercentiles?.callbackInterval.p95UpperMs,
        workP95UpperMs: r.approximatePercentiles?.frameWork.p95UpperMs,
      }),
  );
}
// Issue #841: separate isolated desktop cases, never the owner's browser storage.
async function startupCase(browser, host, scenario) {
  assert(
    ['fresh', 'recordings', 'startup-history', 'interrupted', 'repeated', 'unavailable'].includes(
      scenario,
    ),
  );
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    await context.addInitScript(
      ({ scenario }) => {
        if (!sessionStorage.getItem('841-seeded')) {
          sessionStorage.setItem('841-seeded', 'yes');
          if (scenario === 'interrupted' || scenario === 'repeated') {
            localStorage.setItem('azeroth-renderer-webgl-primary-v1', 'applied');
            localStorage.setItem('azeroth-pixi-settings-baseline-v1', 'applied');
            localStorage.setItem('azeroth-renderer-choice-v1', 'webgl2');
            if (scenario === 'interrupted')
              localStorage.setItem('azeroth-renderer-trial-pending-v1', 'pending');
            else localStorage.setItem('azeroth-webgl2-recovery-hold-v1', 'repeated-failures');
          }
        }
        if (scenario === 'unavailable') {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            return /webgl/.test(type) ? null : original.call(this, type, ...args);
          };
        }
      },
      { scenario },
    );
    const page = await context.newPage();
    if (scenario === 'startup-history') {
      // Failure before app.js: automatic head recorder must retain it even
      // when the broken page cannot open a menu or export a report.
      await page.route('**/src/prototype/engine.js', (route) => route.abort());
      await page.goto(host + 'index.html?developer=1');
      await page.waitForFunction(() =>
        window.PrototypeStartupDiagnostics?.journal
          .report()
          .attempts.at(-1)
          .events.some((e) => e.stage === 'asset-error'),
      );
      assert.equal(
        await page.locator('#title-new').isVisible(),
        false,
        'failed boot never reached playable title',
      );
      await page.unroute('**/src/prototype/engine.js');
      await page.reload();
    } else await page.goto(host + 'index.html?developer=1');
    await enterPlayableGame(page, 'Mage', true);
    assert.equal(await page.evaluate(() => Prototype.game.s.mode), 'developer');
    const state = await page.evaluate(() => Prototype.experimentalGraphics);
    if (['unavailable', 'interrupted', 'repeated'].includes(scenario)) {
      const report = await downloadReport(page);
      const g = report.performance.graphicsRenderer;
      assert.equal(g.activeRenderer, 'canvas2d');
      assert.equal(g.preferredRenderer, 'webgl2');
      assert(g.lastFallbackReason, 'actual downloaded fallback report must explain Canvas');
      assert.equal(report.performance.startupDiagnostics.attempts.at(-1).outcome, 'ready');
      if (scenario === 'unavailable') {
        assert(g.firstFailure?.type, 'actual GPU rejection is recorded');
        assert(
          report.performance.startupDiagnostics.attempts.at(-1).firstFailure,
          'startup journal retains the observed failure',
        );
      } else {
        assert.equal(
          g.recoveryHoldReason,
          scenario === 'interrupted' ? 'interrupted-restore' : 'repeated-failures',
        );
        assert.equal(g.firstFailure, null, 'old hold does not invent its original failure');
      }
      reportReceipt(report, scenario);
    }
    if (scenario === 'startup-history') {
      assert.equal(state.mode, 'webgl2');
      await page.waitForFunction(() =>
        PrototypeStartupDiagnostics.journal
          .report()
          .attempts.at(-1)
          .events.some((e) => e.stage === 'first-live-draw'),
      );
      const beforeMove = await page.evaluate(() => PrototypeStartupDiagnostics.journal.report());
      assert(
        beforeMove.attempts.some((a) =>
          a.events.some((e) => e.stage === 'asset-error' && e.asset === 'engine.js'),
        ),
      );
      assert.equal(beforeMove.attempts.at(-1).outcome, 'ready');
      assert(
        !beforeMove.attempts.at(-1).events.some((e) => e.stage === 'first-movement-observed'),
        'idle startup is complete without player input',
      );
      await page.keyboard.down('d');
      try {
        await page.waitForFunction(() =>
          PrototypeStartupDiagnostics.journal
            .report()
            .attempts.at(-1)
            .events.some((e) => e.stage === 'first-movement-observed'),
        );
      } finally {
        await page.keyboard.up('d');
      }
      await page.keyboard.press('z');
      await page.getByRole('heading', { name: / map$/ }).waitFor({ state: 'visible' });
      assert(
        await page.evaluate(() =>
          PrototypeStartupDiagnostics.journal
            .report()
            .attempts.at(-1)
            .events.some((e) => e.stage === 'map-opened'),
        ),
      );
      await page.keyboard.press('Escape');
      await page.locator('#menu-button').click();
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByRole('button', { name: 'Playtest tools', exact: true }).click();
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: /^Export playtest report/ }).click();
      const report = JSON.parse(fs.readFileSync(await (await downloaded).path(), 'utf8'));
      const boot = report.performance.startupDiagnostics;
      assert.equal(report.performance.rendererDiagnostics.state, 'not-recorded');
      assert.equal(report.analysisGuide.version, 1);
      assert.equal(report.settings.references.sound, 'audio.settings');
      assert.equal(typeof report.audio.settings.master, 'number');
      assert.equal(typeof report.settings.controls.bindings.up, 'string');
      assert.equal(typeof report.performance.environment.device.maxTouchPoints, 'number');
      assert.equal(
        report.performance.graphicsRenderer.deviceGraphics.source,
        'existing-game-webgl2-context',
      );
      assert.match(report.performance.graphicsRenderer.deviceGraphics.version, /WebGL 2/);
      assert.equal(boot.attempts.at(-1).outcome, 'ready');
      assert(
        boot.attempts.some((a) => a.events.some((e) => e.stage === 'asset-error')),
        'existing report includes pre-app failure after reload',
      );
      for (const stage of [
        'document-open',
        'app-entered',
        'graphics-choice',
        'sprites-start',
        'gpu-start',
        'gpu-settled',
        'scene-draw-completed',
        'scene-revealed',
        'controls-ready',
        'first-live-draw',
        'first-movement-observed',
        'map-opened',
      ])
        assert(
          boot.attempts.at(-1).events.some((e) => e.stage === stage),
          'report includes automatic ' + stage,
        );
      assert.equal(report.performance.graphicsRenderer.activeRenderer, 'pixijs-webgl2');
      assert(boot.attempts.length <= 3);
      console.log(
        'PASS automatic startup history: failed asset before app, reload, native movement/map, same one JSON, no optional profiling',
      );
      return;
    }
    if (scenario === 'fresh' || scenario === 'recordings') {
      assert.equal(state.mode, 'webgl2', JSON.stringify(state));
      assert.equal(state.phase, 'confirmed');
      const contextInfo = await page.evaluate(() => {
        const canvas = document.querySelector('#world-pixi-experimental');
        const gl = canvas?.getContext('webgl2');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        return {
          live: !!gl && !gl.isContextLost(),
          visible: canvas?.style.display,
          renderer: debug
            ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
            : gl?.getParameter(gl.RENDERER),
        };
      });
      assert(contextInfo.live && contextInfo.visible === 'block', JSON.stringify(contextInfo));
      console.log(
        'Actual WebGL2 context (software CI is not hardware FPS): ' + JSON.stringify(contextInfo),
      );
      if (scenario === 'recordings') {
        // Native recovery destination is an independent oracle, never a forced
        // position or disabled safety feature in the browser under test.
        const oracle = new Campaign('developer', 'mage', () => 0.5);
        assert(oracle.emergencyReturnToSafety());
        const safetyPoint = [oracle.hero.x, oracle.hero.y];
        for (let round = 1; round <= 3; round++) {
          const baseline = await page.evaluate(() => ({
            position: [Prototype.game.hero.x, Prototype.game.hero.y],
            zone: Prototype.game.zoneId,
            deaths: Prototype.game.s.statistics.deaths,
            rescues: Prototype.game
              .partyDiagnosticsReport()
              .recoveryActions.filter((row) => row.action === 'refuge-return-attempt').length,
          }));
          const observedModes = [];
          await page.locator('#menu-button').click();
          await page.getByRole('button', { name: 'Settings', exact: true }).click();
          await page.getByRole('button', { name: 'Playtest tools', exact: true }).click();
          await page.getByRole('button', { name: /^Start renderer profiling/ }).click();
          await page.getByRole('button', { name: /^Start effect recording/ }).click();
          await page.getByRole('button', { name: /^Start navigation profiling/ }).click();
          for (let back = 0; back < 4 && (await page.locator('#modal').isVisible()); back++)
            await page.keyboard.press('Escape');
          assert.equal(await page.locator('#modal').isVisible(), false);
          for (let interval = 0; interval < 3; interval++) {
            await new Promise((resolve) => setTimeout(resolve, 40000));
            const mode = await page.evaluate(() => Prototype.experimentalGraphics.mode);
            observedModes.push(mode);
            console.log(
              'Round ' + round + ': Mage idle ' + (interval + 1) * 40 + 's, actual ' + mode,
            );
          }
          await page.locator('#menu-button').click();
          await page.getByRole('button', { name: 'Settings', exact: true }).click();
          await page.getByRole('button', { name: 'Playtest tools', exact: true }).click();
          await page.getByRole('button', { name: /^Stop renderer profiling/ }).click();
          await page.getByRole('button', { name: /^Stop effect recording/ }).click();
          await page.getByRole('button', { name: /^Stop navigation profiling/ }).click();
          const downloaded = page.waitForEvent('download');
          await page.getByRole('button', { name: /^Export playtest report/ }).click();
          const report = JSON.parse(fs.readFileSync(await (await downloaded).path(), 'utf8'));
          // Always collect evidence before rejecting a renderer or position.
          reportReceipt(report, 'recordings-round-' + round);
          assert(
            observedModes.every((mode) => mode === 'webgl2'),
            'Pixi must remain active at every timed checkpoint',
          );
          const current = await page.evaluate(() => ({
            position: [Prototype.game.hero.x, Prototype.game.hero.y],
            zone: Prototype.game.zoneId,
          }));
          assert.equal(current.zone, baseline.zone);
          assert.equal(
            report.statistics.deaths,
            baseline.deaths,
            'idle replay cannot conceal a defeat',
          );
          assert(
            !report.performance.startupDiagnostics.attempts
              .at(-1)
              .events.some((event) => event.stage === 'first-movement-observed'),
            'no player movement during recording replay',
          );
          if (current.position.some((value, index) => value !== baseline.position[index])) {
            assert(
              report.partyDiagnostics.recoveryActions.filter(
                (row) => row.action === 'refuge-return-attempt',
              ).length > baseline.rescues,
              'position changes require a newly observed native safety recovery',
            );
            assert.deepEqual(
              current.position,
              safetyPoint,
              'only the unchanged native recovery destination is allowed',
            );
            console.log(
              'QUALIFICATION: native slowdown protection relocated the idle Mage; renderer/report acceptance is not stationary-position or device-speed acceptance.',
            );
          }
          assert.equal(report.performance.graphicsRenderer.activeRenderer, 'pixijs-webgl2');
          assert.equal(report.performance.graphicsRenderer.preferredRenderer, 'webgl2');
          assert.equal(report.performance.rendererDiagnostics.initialRenderer, 'webgl2');
          assert.equal(report.performance.rendererDiagnostics.finalRenderer, 'webgl2');
          assert.equal(report.performance.rendererDiagnostics.state, 'stopped');
          assert.equal(report.analysisGuide.language, 'en');
          for (const path of [
            'performance.rendererDiagnostics',
            'performance.effectDiagnostics',
            'performance.crowdDiagnostics',
          ])
            assert(
              report.analysisGuide.sections.some((section) => section.path === path),
              'guide covers ' + path,
            );
          assert.equal(report.performance.effectDiagnostics.recording, false);
          assert(
            report.performance.effectDiagnostics.drawFrames > 0,
            'stopped effects retain actual observations',
          );
          assert.equal(report.performance.crowdDiagnostics.recording, false);
          assert(
            report.performance.crowdDiagnostics.sampledSimulationTicks > 0,
            'stopped navigation retains actual observations',
          );
          console.log(
            'PASS exact owner sequence round ' + round + ': exported report confirms active Pixi',
          );
          for (let back = 0; back < 4 && (await page.locator('#modal').isVisible()); back++)
            await page.keyboard.press('Escape');
        }
        return;
      }
      // Observe actual frame submissions through both authored light phases.
      for (const night of [false, true]) {
        await page.evaluate((night) => {
          Prototype.game.s.clock = night ? Campaign.rules.dayCycle.nightAt + 30 : 0;
        }, night);
        assert.equal(await page.evaluate(() => Prototype.game.night()), night);
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              let count = 0;
              const check = () => {
                if (Prototype.experimentalGraphics.mode !== 'webgl2')
                  throw Error('Pixi lost during idle light-phase frames');
                if (++count === 8) resolve();
                else requestAnimationFrame(check);
              };
              requestAnimationFrame(check);
            }),
        );
      }
      await page.locator('#menu-button').click();
      await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
      await enterPlayableGame(page);
      assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'webgl2');
      await page.reload();
      await enterPlayableGame(page);
      assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'webgl2');
    } else if (scenario === 'unavailable') {
      assert.equal(state.mode, 'canvas2d');
      assert(state.lastFailure?.type && state.lastFallbackReason, JSON.stringify(state));
      assert.equal(state.firstFailure.type, state.lastFailure.type);
      assert.equal(state.preferredRenderer, 'webgl2');
      await page.reload();
      await enterPlayableGame(page);
      const next = await page.evaluate(() => Prototype.experimentalGraphics);
      assert.equal(
        next.firstFailure.timestampMs,
        state.firstFailure.timestampMs,
        'earliest real failure survives reload',
      );
    } else {
      const hold = scenario === 'interrupted' ? 'interrupted-restore' : 'repeated-failures';
      assert.equal(state.mode, 'canvas2d');
      assert.equal(state.preferredRenderer, 'webgl2');
      assert.equal(state.recoveryPaused, true);
      assert.equal(state.recoveryAttempts, 0);
      assert.equal(state.lastFallbackReason, 'confirmed-recovery-quarantined');
      assert.equal(state.startupDecision.recoveryHoldReason, hold);
      assert.equal(state.firstFailure, null, 'old hold does not prove a GPU error');
      assert.equal(
        await page.locator('#world-pixi-experimental').count(),
        0,
        'no GPU boot through a hold',
      );
      await page.locator('#gpu-renderer-trial').waitFor({ state: 'visible' });
      assert.match(
        await page.locator('#gpu-renderer-trial').textContent(),
        /Automatic retries are paused/,
      );
      await page.reload();
      await enterPlayableGame(page);
      assert.equal(
        await page.evaluate(() => Prototype.experimentalGraphics.recoveryHoldReason),
        hold,
      );
      // Actual explicit button, unchanged real 15-second Keep/Revert protection.
      await page.getByRole('button', { name: 'Retry PixiJS WebGL2', exact: true }).click();
      await page.waitForFunction(() => Prototype.experimentalGraphics.phase === 'trial', null, {
        timeout: 180000,
      });
      await keepPixiTrial(page, false, 'explicit startup-hold retry');
      assert.equal(
        await page.evaluate(() => localStorage.getItem('azeroth-webgl2-recovery-hold-v1')),
        null,
      );
    }
    console.log('PASS isolated #841 startup / ' + scenario);
  } finally {
    await context.close();
  }
}
async function run() {
  let browser;
  try {
    if (!process.env.PLAYTEST_URL)
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const binary = engine === 'chromium' ? installedChromium() : null;
    const options =
      engine === 'chromium'
        ? {
            ...(binary ? { executablePath: binary } : {}),
            args: [
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--enable-webgl',
              '--use-gl=angle',
              '--use-angle=swiftshader',
              '--enable-unsafe-swiftshader',
            ],
          }
        : {};
    browser = await playwright[engine].launch(options);
    const host = process.env.PLAYTEST_URL
      ? process.env.PLAYTEST_URL.replace(/\/?$/, '/')
      : 'http://127.0.0.1:' + server.address().port + '/';

    if (process.env.PIXI_STARTUP_CASE) {
      await startupCase(browser, host, process.env.PIXI_STARTUP_CASE);
      return;
    }

    // Exercise both form factors through current title/new/continue preparation.
    // A previous Canvas choice is superseded only on the first migrated boot.
    for (const phone of deviceCases) {
      const migrationContext = await browser.newContext({
        viewport: phone ? { width: 800, height: 375 } : { width: 1280, height: 800 },
        isMobile: phone,
        hasTouch: phone,
      });
      try {
        await migrationContext.addInitScript(() => {
          if (!localStorage.getItem('azeroth-renderer-webgl-primary-v1'))
            localStorage.setItem('azeroth-renderer-choice-v1', 'canvas2d');
        });
        const migrationPage = await migrationContext.newPage();
        await migrationPage.goto(host + (phone ? 'phone.html' : 'index.html'));
        if (phone)
          await migrationPage
            .frameLocator('#phone-game-frame')
            .locator('#title-screen')
            .waitFor({ state: 'attached' });
        const gamePage = phone ? migrationPage.frame({ url: /phone-game\.html/ }) : migrationPage;
        assert(gamePage, 'real game document is mounted');
        await gamePage.waitForFunction(() => !!window.Prototype?.renderer);
        const migrated = await gamePage.evaluate(() => ({
          marker: localStorage.getItem('azeroth-renderer-webgl-primary-v1'),
          choice: localStorage.getItem('azeroth-renderer-choice-v1'),
          phase: Prototype.experimentalGraphics.phase,
        }));
        assert.equal(migrated.marker, 'applied');
        assert.equal(migrated.choice, 'webgl2');
        assert.equal(
          migrated.phase,
          'canvas',
          'Title screen must not start expensive GPU preparation automatically',
        );
        await enterPlayableGame(gamePage);
        const active = await gamePage.evaluate(() => Prototype.experimentalGraphics);
        assert.equal(active.preferredRenderer, 'webgl2');
        if (requireWebGL)
          assert.equal(active.mode, 'webgl2', 'usable clean migration must actually activate Pixi');
        if (active.mode === 'webgl2')
          assert.equal(
            active.phase,
            'confirmed',
            'Default Pixi is confirmed without the manual trial countdown',
          );
        else
          assert(
            active.mode === 'canvas2d' && (active.lastError || active.lastFallbackReason),
            'Unusable GPU must fall back to Canvas with a diagnostic reason',
          );
        if (!phone) {
          await migrationPage.locator('#menu-button').click();
          await migrationPage
            .getByRole('button', { name: 'Settings', exact: true })
            .click();
          await migrationPage
            .getByRole('button', { name: 'Screen and performance', exact: true })
            .click();
          await migrationPage
            .locator('select[aria-label="Graphics renderer"]')
            .selectOption('canvas2d');
          await migrationPage.reload();
          await migrationPage.waitForFunction(() => !!window.Prototype?.renderer);
          assert.equal(
            await migrationPage.evaluate(() => localStorage.getItem('azeroth-renderer-choice-v1')),
            'canvas2d',
          );
          await enterPlayableGame(migrationPage);
          assert.equal(
            await migrationPage.evaluate(() => Prototype.experimentalGraphics.mode),
            'canvas2d',
          );
          const manual = await selectPixi(migrationPage);
          if (manual.mode === 'webgl2') assert.equal(manual.phase, 'trial');
        }
        console.log(
          'PASS default Pixi migration, title, manual Canvas (' +
            (phone ? 'phone' : 'desktop') +
            ')',
        );
      } finally {
        await migrationContext.close();
      }
    }
  } finally {
    await browser?.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
