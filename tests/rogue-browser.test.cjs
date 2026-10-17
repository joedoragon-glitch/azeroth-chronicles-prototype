'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.ROGUE_BROWSER_ENGINE || 'chromium';
const root = path.resolve(__dirname, '..'),
  results = path.join(root, 'test-results');
fs.mkdirSync(results, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, '')) || 'index.html',
  );
  if (
    !file.startsWith(root + path.sep) ||
    !fs.existsSync(file) ||
    fs.statSync(file).isDirectory()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.webmanifest': 'application/manifest+json',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const options = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE)
      Object.assign(options, {
        executablePath: process.env.CHROMIUM_EXECUTABLE,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
    browser = await pw[engine].launch(options);
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
      { width: 393, height: 852 },
      { width: 844, height: 390 },
    ]) {
      const phone = viewport.width !== 1280;
      const page = await browser.newPage({
        viewport,
        hasTouch: phone,
        isMobile: phone,
        deviceScaleFactor: phone ? 3 : 1,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html'),
      );
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {
        Prototype.game.tick = () => {};
      });
      for (const night of [false, true]) {
        // Elite signatures are now mobile, actor-anchored progress bars.
        // Protect rendered placement and cast progress instead of the retired
        // spatial SIGNATURE countdown/name panel.
        const probe = await page.evaluate((night) => {
          const p = Prototype,
            c = p.game;
          c.enter('vale');
          c.zone().props = [];
          c.s.party = [];
          c.s.clock = night ? 500 : 200;
          Object.assign(c.hero, { x: 1470, y: 1700, hp: 10000, maxHp: 10000 });
          const e = c.bossEnemy(c.boss('warlord'), 'normal', { x: 1400, y: 1700 });
          e.aggro = true;
          c.zone().enemies = [e];
          if (!c.tacticalRogueMove(e, c.hero, true)) throw Error('Warlord signature did not start');
          const cast = e.telegraph;
          const canvas = document.querySelector('#world'),
            ctx = canvas.getContext('2d');
          function capture() {
            const labels = [],
              bars = [],
              fills = [],
              originalText = ctx.fillText,
              originalStroke = ctx.strokeRect,
              originalFill = ctx.fillRect;
            ctx.fillText = function (value, x, y, ...rest) {
              const label = String(value);
              if (label === cast.name || label === 'Preparing…' ||
                  label.includes('SIGNATURE') || label.includes('Withdrawal') || label.includes('Ashen Warlord')) {
                const transform = this.getTransform(),
                  width = Math.min(this.measureText(value).width, rest[0] || Infinity);
                labels.push({
                  text: label,
                  left: transform.a * (x - width / 2) + transform.e,
                  right: transform.a * (x + width / 2) + transform.e,
                  top: transform.d * (y - 12) + transform.f,
                  bottom: transform.d * y + transform.f,
                });
              }
              return originalText.call(this, value, x, y, ...rest);
            };
            ctx.strokeRect = function (x, y, w, h) {
              if (Math.abs(w - 70) < 0.01 && Math.abs(h - 8) < 0.01) {
                const t = this.getTransform();
                bars.push({
                  center: t.a * (x + w / 2) + t.e,
                  top: t.d * y + t.f,
                  bottom: t.d * (y + h) + t.f,
                  width: t.a * w,
                });
              }
              return originalStroke.call(this, x, y, w, h);
            };
            ctx.fillRect = function (x, y, w, h) {
              if (this.fillStyle === '#e5b963' && Math.abs(h - 8) < 0.01) {
                const t = this.getTransform();
                fills.push({ width: t.a * w, center: t.a * (x + w / 2) + t.e });
              }
              return originalFill.call(this, x, y, w, h);
            };
            try {
              p.renderer.draw();
            } finally {
              ctx.fillText = originalText;
              ctx.strokeRect = originalStroke;
              ctx.fillRect = originalFill;
            }
            return { labels, bars, fills };
          }
          const before = capture();
          // Move the actual enemy and advance its real warning fraction. The
          // bar must move with it instead of staying at an old ground marker.
          e.x += 140;
          cast.timer = cast.total * 0.5;
          const moved = capture();
          return {
            before, moved, width: canvas.width, height: canvas.height,
            hud: (() => {
              const r = document.querySelector('#hud').getBoundingClientRect(),
                ratio = canvas.width / innerWidth;
              return {left:r.left*ratio, right:r.right*ratio, top:r.top*ratio, bottom:r.bottom*ratio};
            })(),
            name: cast.name,
            mobile: cast.mobileRogueCast,
            signature: cast.rogueSignature,
            remaining: cast.timer,
            total: cast.total,
          };
        }, night);
        assert.equal(probe.name, 'Ashen Warlord’s Shielded Withdrawal');
        assert(probe.mobile && probe.signature, 'Warlord signature uses actor-only mobile cast');
        assert.equal(probe.remaining, probe.total * 0.5, 'cast retains authored warning duration');
        for (const stage of [probe.before, probe.moved]) {
          const label = stage.labels.filter((x) => x.text === probe.name);
          assert.equal(label.length, 1, 'one readable actor-anchored Rogue cast label');
          assert.equal(stage.bars.length, 1, 'one real 70x8 progress border');
          assert(!stage.labels.some((x) => x.text.includes('SIGNATURE') || x.text === 'ROGUE CAST'), 'generic cast and separate spatial signature captions retired');
          const overlaps = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          assert(!overlaps(label[0],probe.hud), 'named cast remains readable beside the actual HUD: '+JSON.stringify({label:label[0],hud:probe.hud}));
          for (const nameplate of stage.labels.filter(x => x.text !== probe.name && x.text.includes('Ashen Warlord')))
            assert(!overlaps(label[0],nameplate), 'cast name stays separate from boss nameplate');
          const halfLabel = (label[0].right - label[0].left) / 2,
            expectedCenter = Math.max(4 + halfLabel, Math.min(probe.width - 4 - halfLabel, stage.bars[0].center));
          assert(Math.abs((label[0].left + label[0].right) / 2 - expectedCenter) < 2,
            'named cast follows the actor and clamps only at the viewport edge');
          for (const item of [label[0], stage.bars[0]]) {
            assert((item.left === undefined || item.left >= 0) &&
              (item.right === undefined || item.right <= probe.width) &&
              item.top >= 0 && item.bottom <= probe.height,
            'Rogue cast stays inside physical DPR viewport: ' + JSON.stringify(item));
          }
        }
        assert(Math.abs(probe.moved.bars[0].center - probe.before.bars[0].center) > 2,
          'cast bar follows physical actor relocation');
        assert(probe.moved.fills.some((x) => Math.abs(x.width -
          probe.moved.bars[0].width / 2) < 2), 'warning progress visually fills halfway');
        await page.screenshot({
          path: path.join(
            results,
            'rogue-' +
              engine +
              '-' +
              viewport.width +
              'x' +
              viewport.height +
              '-' +
              (night ? 'night' : 'day') +
              '.png',
          ),
        });
      }
      const mechanics = await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('vale');
        c.zone().props = [];
        c.s.party = [];
        Object.assign(c.hero, { x: 1470, y: 1700, hp: 10000, maxHp: 10000 });
        const g = c.makeEnemy(
          {
            species: 'goblin',
            name: 'Dust slinger',
            level: 1,
            hp: 3000,
            damage: 10,
            gold: 0,
            xp: 0,
          },
          { x: 1400, y: 1700 },
        );
        g.aggro = true;
        c.zone().enemies = [g];
        c.holdHeroTarget(() => true, g.id);
        c.tacticalRogueMove(g, c.hero);
        c.tacticalResolveRogueMove(g, g.telegraph);
        const dust =
          !c.tacticalDirectTargetable(g) && !c.manualHeroTargetLocked && !c.selectedHeroTarget();
        const b = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 });
        c.zone().enemies = [b];
        b.aggro = true;
        const before = { x: c.hero.x, y: c.hero.y };
        c.tacticalRogueMove(b, c.hero, true);
        c.tacticalResolveRogueMove(b, b.telegraph);
        const interrupted = !!c.tacticalScatterState(c.hero) && !c.cast(1, b.id);
        for (let i = 0; i < 7; i++) c.tacticalAdvanceScatter(c.hero, 0.1);
        return {
          dust,
          interrupted,
          recovered: !c.tacticalScatterState(c.hero),
          moved: Math.hypot(c.hero.x - before.x, c.hero.y - before.y) > 1,
        };
      });
      assert.deepEqual(mechanics, { dust: true, interrupted: true, recovered: true, moved: true });
      assert.deepEqual(errors, [], 'actual browser rendering and combat have no errors');
      console.log(
        'PASS ' +
          engine +
          ' mobile Rogue cast/DPR day-night, dust locks and scatter recovery ' +
          viewport.width +
          'x' +
          viewport.height,
      );
      await page.close();
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
