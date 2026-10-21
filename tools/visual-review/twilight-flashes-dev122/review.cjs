'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '../../..'),
  out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
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
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const type = process.env.SCAN_WEBKIT ? webkit : chromium;
    browser = await type.launch(
      process.env.SCAN_WEBKIT
        ? {}
        : {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          },
    );
    const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      }),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
    await p.waitForFunction(() => window.Prototype?.game);
    await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
    await p.keyboard.press('f');
    await p.keyboard.press('f');
    await p.waitForFunction(() => document.getElementById('modal').hidden);
    const combo = await p.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      const advanceEffects = Prototype.renderer.update;
      Prototype.renderer.update = () => {};
      Prototype.closeMenu();
      g.enter('vale');
      g.s.mode = 'normal';
      g.s.phase = 'adventure';
      g.s.clock = 120;
      g.s.party = [];
      g.zone().props = [];
      g.zone().buildings = [];
      g.zone().npcs = [];
      g.s.mercyTime = 0;
      Object.assign(g.hero, { class: 'mage', x: 1400, y: 1700, order: null });
      g.hero.skills.fill(1);
      g.hero.cd.fill(0);
      const e = g.makeEnemy(
        { species: 'goblin', name: 'Combo audit', level: 5, hp: 100000, damage: 0, gold: 0, xp: 0 },
        { x: 1560, y: 1700 },
      );
      g.zone().enemies = [e];
      g.engage(e);
      const steps = [];
      for (let j = 0; j < 3; j++) {
        g.effects = [];
        g.hero.cd[0] = 0;
        if (!g.cast(1, e.id)) throw Error('Actual combo cast failed');
        for (let i = 0; i < 25; i++) {
          g.s.time += 0.02;
          g.updateProjectiles(0.02);
        }
        steps.push(g.effects.filter((f) => f.type === 'basicComboFinisher').length);
      }
      const finish = g.effects.find((f) => f.type === 'basicComboFinisher');
      Prototype.renderer.queue(g.effects.splice(0));
      advanceEffects(0.18);
      Prototype.renderer.draw();
      return {
        steps,
        finish: finish && { class: finish.class, range: finish.range, halfAngle: finish.halfAngle },
        version: PrototypeBuild.version,
      };
    });
    assert.deepEqual(combo.steps, [0, 0, 1]);
    assert.equal(combo.finish.class, 'mage');
    assert.equal(combo.finish.range, 210);
    await p.screenshot({
      path: path.join(out, type.name() + '-mage-combo.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    const continuity = await p.evaluate(() => {
      const g = Prototype.game;
      g.zone().enemies = [];
      Prototype.renderer.queue([]);
      let last = null,
        maxJump = 0,
        whiteFrames = 0;
      for (let j = 0; j <= 120; j++) {
        g.s.clock = j === 120 ? 0 : 570 + j * 0.25;
        Prototype.renderer.draw();
        const c = document.getElementById('world'),
          pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let sum = 0,
          count = 0,
          white = 0;
        for (let i = 0; i < pixels.length; i += 64) {
          sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
          count += 3;
          if (pixels[i] > 235 && pixels[i + 1] > 235 && pixels[i + 2] > 235) white++;
        }
        const mean = sum / count;
        if (last !== null) maxJump = Math.max(maxJump, Math.abs(mean - last));
        last = mean;
        if (white / (count / 3) > 0.05) whiteFrames++;
      }
      return { frames: 121, maxMeanJump: maxJump, whiteFrames };
    });
    assert.equal(continuity.whiteFrames, 0);
    assert(continuity.maxMeanJump < 3, 'no full-scene brightness spike');
    await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('vale');
      g.zone().enemies = [];
      g.s.clock = 585;
      Object.assign(g.hero, { x: 800, y: 1000 });
      Prototype.renderer.draw();
    });
    await p.screenshot({
      path: path.join(out, type.name() + '-sunrise.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    await p.evaluate(() => {
      Prototype.game.s.clock = 120;
      Prototype.renderer.draw();
    });
    await p.screenshot({
      path: path.join(out, type.name() + '-greenwood.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    assert.deepEqual(errors, []);
    const result = { engine: type.name(), nativePhoneStartup: true, combo, continuity, errors };
    fs.writeFileSync(
      path.join(__dirname, 'review-' + type.name() + '.json'),
      JSON.stringify(result, null, 2) + '\n',
    );
    console.log(JSON.stringify(result));
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
