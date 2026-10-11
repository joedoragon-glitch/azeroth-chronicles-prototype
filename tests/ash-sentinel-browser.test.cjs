'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.SENTINEL_BROWSER_ENGINE === 'webkit' ? webkit : chromium;
const engineName = process.env.SENTINEL_BROWSER_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results', 'ash-sentinel');
fs.mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\/+/, '')) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await engine.launch({ headless: true });
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 800 }]) {
      const page = await browser.newPage({ viewport, isMobile: viewport.width < 400, hasTouch: viewport.width < 400 });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const url = 'http://127.0.0.1:' + server.address().port + '/';
      await page.goto(url);
      await page.waitForFunction(() => !!window.Prototype?.game);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      const charge = await page.evaluate(() => {
        const c = Prototype.game;
        c.enter('citadel');
        c.s.party = [];
        const e = c.zone().enemies.find(u => u.family === 'citadel');
        c.zone().enemies = [e];
        Object.assign(c.hero, { x: e.x + 80, y: e.y + 100, hp: c.hero.maxHp });
        e.aggro = true;
        e.telegraph = c.buildBossAttack(e, 2, c.hero).first;
        e.telegraph.timer = 2.4;
        const details = { kind: e.telegraph.kind, legs: e.telegraph.path.length, name: e.telegraph.name };
        c.tick = () => {};
        Prototype.renderer.draw();
        return details;
      });
      assert.equal(charge.kind, 'pattern-charge');
      assert.equal(charge.legs, 5);
      await page.screenshot({ path: path.join(out, 'contouring-' + engineName + '-' + viewport.width + '.png') });
      const board = await page.evaluate(() => {
        const c = Prototype.game;
        const e = c.zone().enemies.find(u => u.family === 'citadel');
        e.telegraph = null;
        e.board = { x: e.home.x, y: e.home.y, size: 112, beat: 0, phase: 'warn', timer: 1.45 };
        Prototype.renderer.draw();
        return { cells: c.sentinelBoardCells(e).length, selected: c.sentinelBoardCells(e).filter(x => x.selected).length };
      });
      assert.deepEqual(board, { cells: 16, selected: 2 });
      await page.screenshot({ path: path.join(out, 'fractional-' + engineName + '-' + viewport.width + '.png') });
      assert.deepEqual(errors, [], 'real browser scene has no canvas/runtime errors');
      console.log('PASS Veyra ' + engineName + ' charge/board scene ' + viewport.width + 'x' + viewport.height);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
