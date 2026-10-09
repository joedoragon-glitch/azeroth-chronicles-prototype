'use strict';
// Real browser evidence for the installed pilot batch. No approval or registry writes.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const profiles = require('../tools/sprites/specifications.json').policy.reviewProfiles;
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
async function capture(base, directory, engine = 'webkit') {
  assert(!fs.existsSync(directory), 'Preserve prior browser evidence');
  fs.mkdirSync(directory, { recursive: true });
  const browser = await pw[engine].launch();
  const evidence = [];
  try {
    for (const profile of profiles) {
      const phone = profile.mode === 'phone';
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: 2,
        hasTouch: phone,
        isMobile: phone,
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + (phone ? 'phone.html' : 'index.html'));
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(async () => {
        await PrototypeSprites.preload(undefined, ['hero:paladin', 'enemy:goblin']);
        await PrototypeSprites.warm(['hero:paladin', 'enemy:goblin'], { clips: true });
        await PrototypeMaterials.load();
        await PrototypeMaterials.ensure('terrain:road:vale');
        await PrototypeMaterials.ensure('terrain:road:highlands');
        window.requestAnimationFrame = () => 0;
        Prototype.game.tick = () => {};
      });
      await page.waitForTimeout(80);
      for (const lighting of ['day', 'night']) {
        const setup = await page.evaluate((lighting) => {
          const c = Prototype.game;
          c.enter('vale');
          c.zone().props = [];
          c.s.party = [];
          c.s.clock = lighting === 'night' ? 430 : 120;
          Object.assign(c.hero, { x: 1470, y: 1700, hp: 10000, maxHp: 10000 });
          const g = c.makeEnemy(
            { species: 'goblin', name: 'Goblin', level: 1, hp: 3000, damage: 10, gold: 0, xp: 0 },
            { x: 1400, y: 1700 },
          );
          g.aggro = true;
          c.zone().enemies = [g];
          Prototype.renderer.draw();
          return {
            snapshot: JSON.stringify(c.snapshot()),
            sprite: PrototypeSprites.status(),
            material: PrototypeMaterials.status(),
            paladin: PrototypeSprites.definitionFor({ ...c.hero, renderKind: 'hero' }, 0).entry,
            goblin: PrototypeSprites.definitionFor({ ...g, renderKind: 'enemy' }, 0).entry,
          };
        }, lighting);
        assert.equal(setup.paladin.width, 576);
        assert.equal(setup.goblin.width, 576);
        assert.equal(setup.paladin.clips.idle.frames.length, 2);
        assert.equal(setup.goblin.clips.idle.frames.length, 2);
        assert(setup.sprite.decodedBytes <= setup.sprite.maxDecodedBytes);
        const tag = `${profile.width}x${profile.height}-${lighting}`;
        const frames = [];
        for (let frame = 0; frame < 2; frame++) {
          if (frame)
            await page.evaluate(() => {
              for (let i = 0; i < 8; i++) PrototypeSprites.advance(100, false);
              Prototype.renderer.draw();
            });
          const bytes = await page.locator('#world').screenshot();
          fs.writeFileSync(path.join(directory, `${tag}-idle-${frame}.png`), bytes);
          frames.push(hash(bytes));
        }
        assert.notEqual(frames[0], frames[1], 'Both real-browser idle frames must render');
        assert.equal(
          await page.evaluate(() => JSON.stringify(Prototype.game.snapshot())),
          setup.snapshot,
          'Animation must not mutate gameplay',
        );
        const pause = await page.evaluate(() => {
          const before = PrototypeSprites.timeMs();
          for (let i = 0; i < 8; i++) PrototypeSprites.advance(100, true);
          return before === PrototypeSprites.timeMs();
        });
        assert(pause);
        const combat = await page.evaluate(() => {
          const c = Prototype.game,
            g = c.zone().enemies[0];
          PrototypeSprites.advance(0, false);
          c.holdHeroTarget(() => true, g.id);
          c.tacticalRogueMove(g, c.hero);
          Prototype.renderer.draw();
          return {
            warning: g.telegraph?.name,
            geometry: { x: g.x, y: g.y, r: g.r },
            sprite: PrototypeSprites.status(),
          };
        });
        assert(combat.warning, 'Actual Goblin rogue warning must remain available');
        const bytes = await page.locator('#world').screenshot();
        fs.writeFileSync(path.join(directory, `${tag}-combat.png`), bytes);
        evidence.push({
          profile,
          lighting,
          frames,
          combat,
          combatHash: hash(bytes),
          pause,
          errors: [...errors],
        });
        assert.deepEqual(errors, []);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(directory, 'evidence.json'),
    JSON.stringify(
      { engine, scenes: evidence, review: 'pending engineer visual inspection' },
      null,
      2,
    ) + '\n',
  );
  return { engine, deviceLightingScenes: evidence.length, images: evidence.length * 3, directory };
}
if (require.main === module)
  (async () => {
    const args = process.argv.slice(2);
    let server;
    try {
      if (args[0] === 'local') {
        server = require('node:child_process').spawn(
          process.execPath,
          [path.join(__dirname, 'dev.cjs')],
          { env: { ...process.env, PORT: '8091' }, stdio: ['ignore', 'pipe', 'inherit'] },
        );
        await new Promise((resolve, reject) => {
          server.stdout.once('data', resolve);
          server.once('error', reject);
          server.once('exit', (code) => reject(Error('Review server exited ' + code)));
        });
        args[0] = 'http://127.0.0.1:8091/';
      }
      console.log(JSON.stringify(await capture(...args)));
    } finally {
      server?.kill();
    }
  })().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { capture };
