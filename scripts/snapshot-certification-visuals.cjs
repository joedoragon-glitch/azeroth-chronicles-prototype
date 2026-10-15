'use strict';
// Native screenshots of the actual app. Capture is evidence, never director approval.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const engine = process.env.SNAPSHOT_VISUAL_ENGINE || 'chromium';
const output = path.join(
  root,
  'test-results/snapshot-visual-' + engine + '-' + require('../package.json').version,
);
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.resolve(root, name === '/' ? 'index.html' : name.slice(1));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.webmanifest': 'application/manifest+json',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  const report = {
    engine,
    build: require('../package.json').version,
    head: require('node:child_process').execSync('git rev-parse HEAD').toString().trim(),
    rows: [],
    errors: [],
  };
  fs.mkdirSync(output, { recursive: true });
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await pw[engine].launch({
      headless: true,
      ...(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {}),
    });
    for (const profile of [
      { name: 'desktop', width: 1280, height: 800, touch: false },
      { name: 'phone', width: 393, height: 852, touch: true },
    ]) {
      const page = await browser.newPage({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.touch,
        isMobile: profile.touch,
        deviceScaleFactor: 1,
      });
      page.on('pageerror', (e) => report.errors.push(profile.name + ': ' + e.message));
      await page.goto(
        'http://127.0.0.1:' +
          server.address().port +
          '/' +
          (profile.touch ? 'phone.html' : 'index.html'),
      );
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(async () => {
        Prototype.game.tick = () => {};
        await PrototypeSprites.preload();
      });
      const scenes = await page.evaluate(() => {
        const c = Prototype.game,
          scenes = [];
        for (const [i, region] of Campaign.data.regions.entries()) {
          c.enter(region.id);
          for (const [kind, pair] of [
            ['town', Campaign.data.towns[i]],
            ['hamlet', Campaign.data.minors[i]],
          ])
            scenes.push({
              name: region.id + '-' + kind,
              zone: region.id,
              x: pair[0],
              y: pair[1],
              night: true,
            });
          for (const n of c.zone().npcs.filter((n) => n.kind === 'transport'))
            scenes.push({
              name: region.id + '-transport-' + n.id,
              zone: region.id,
              x: n.x,
              y: n.y,
            });
          if (['frontier', 'crown'].includes(region.id)) {
            const types = new Set();
            for (const p of c
              .zone()
              .props.filter((p) => String(p.id).startsWith('recovery-heat-'))) {
              if (types.has(p.structure)) continue;
              types.add(p.structure);
              scenes.push({
                name: region.id + '-' + p.structure,
                zone: region.id,
                x: p.x,
                y: p.y,
                night: true,
              });
            }
          }
        }
        for (const room of Campaign.rules.supplyRooms) {
          c.enter(room.id);
          const e = c.zone().enemies.find((e) => e.roomCaptain);
          scenes.push({ name: room.id, zone: room.id, x: e.x, y: e.y });
        }
        c.enter('mine');
        const rider = c.zone().enemies.find((e) => e.mountedCrownRider);
        scenes.push({ name: 'mine-direwolf-riders', zone: 'mine', x: rider.x, y: rider.y });
        c.enter('march');
        const mire = c.zone().enemies.find((e) => e.species === 'mireling' && e.ranged);
        if (mire)
          for (const side of [-1, 1])
            scenes.push({
              name: 'mireling-facing-' + side,
              zone: 'march',
              x: mire.x + side * 120,
              y: mire.y,
              aim: mire.id,
            });
        return scenes;
      });
      for (const scene of scenes)
        for (const zoom of [1, 1.5])
          for (const night of scene.night ? [false, true] : [false]) {
            const meta = await page.evaluate(
              ({ scene, zoom, night }) => {
                const p = Prototype,
                  c = p.game;
                p.closeMenu();
                c.enter(scene.zone);
                c.s.clock = night ? 480 : 120;
                p.platform.selectCameraZoom(zoom);
                const overview = /-(town|hamlet)$/.test(scene.name);
                const anchor = overview ? scene : { x: scene.x - 65, y: scene.y + 25 };
                c.s.party = []; // Solo inspection keeps the actual feature unobscured.
                Object.assign(c.hero, c.safe(anchor.x, anchor.y), { order: null });
                if (scene.aim) {
                  const e = c.zone().enemies.find((e) => e.id === scene.aim);
                  e.rangedAim = { x: c.hero.x, y: c.hero.y, timer: 1 };
                }
                c.s.awakeningAck = true;
                p.renderer.draw();
                return {
                  zone: c.zoneId,
                  clock: c.s.clock,
                  hero: { x: c.hero.x, y: c.hero.y },
                  zoom: p.platform.cameraZoom,
                  props: c.zone().props.length,
                };
              },
              { scene, zoom, night },
            );
            await page.waitForFunction(
              () =>
                PrototypeSprites.status().queued === 0 &&
                PrototypeSprites.status().loading === 0 &&
                PrototypeMaterials.status().queued === 0 &&
                PrototypeMaterials.status().decoding === 0,
            );
            await page.evaluate(() => {
              const c = Prototype.game,
                before = JSON.stringify(c.snapshot());
              Prototype.renderer.draw();
              if (JSON.stringify(c.snapshot()) !== before) throw Error('drawing mutated save');
            });
            const file =
              profile.name +
              '-' +
              scene.name +
              '-' +
              Math.round(zoom * 100) +
              '-' +
              (night ? 'night' : 'day') +
              '.png';
            await page.screenshot({ path: path.join(output, file) });
            report.rows.push({ file, ...meta });
          }
      await page.close();
    }
    assert.deepEqual(report.errors, [], 'actual app errors during snapshot visual audit');
    assert(
      report.rows.length >= 150,
      'all requested region, scale, light and device scenes captured',
    );
    console.log(
      'PASS ' +
        report.rows.length +
        ' native snapshot captures, 100/150% desktop/phone, pure draws; aesthetic approval remains separate',
    );
  } finally {
    fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
