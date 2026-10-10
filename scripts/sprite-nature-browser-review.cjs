'use strict';
// Review the current nature batch in the real renderer; no campaign or registry writes.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const sharp = require('sharp'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pipeline = require('./sprite-pipeline.cjs');
const journal = require('../tools/sprites/batches/2026-10-09-150-adaptation/production-journal.json');
const profiles = require('../tools/sprites/specifications.json').policy.reviewProfiles;
async function capture(base, directory, engine = 'chromium') {
  assert(!fs.existsSync(directory), 'Retain prior native evidence');
  fs.mkdirSync(directory, { recursive: true });
  const jobs = journal.natureBatch.entries.map((j) => ({
    ...j,
    contract: pipeline.contractFor(j.key),
  }));
  const browser = await pw[engine].launch(
    process.env[engine === 'chromium' ? 'CHROMIUM_EXECUTABLE' : 'WEBKIT_EXECUTABLE']
      ? {
          executablePath:
            process.env[engine === 'chromium' ? 'CHROMIUM_EXECUTABLE' : 'WEBKIT_EXECUTABLE'],
        }
      : {},
  );
  const evidence = [],
    originals = require('../tools/sprites/approved.json').assets;
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
      await page.evaluate(
        async (keys) => {
          await PrototypeSprites.preload(undefined, keys);
          await PrototypeSprites.warm(keys, { clips: true });
          window.requestAnimationFrame = () => 0;
          Prototype.game.tick = () => {};
        },
        [...jobs.map((j) => j.key), 'hero:paladin', 'enemy:goblin'],
      );
      for (const lighting of ['day', 'night']) {
        const tiles = [];
        for (const [index, job] of jobs.entries()) {
          const scene = await page.evaluate(
            ({ contract, lighting }) => {
              const c = Prototype.game;
              c.enter(['vale', 'march', 'highlands', 'frontier', 'crown'][contract.region]);
              const z = c.zone();
              z.props = [];
              z.npcs = [];
              z.nodes = [];
              z.buildings = [];
              c.s.party = [];
              c.s.clock = lighting === 'night' ? 430 : 120;
              Object.assign(c.hero, c.safe(800, 800), { hp: 10000, maxHp: 10000 });
              const e = {
                ...contract.entity,
                x: c.hero.x + 20,
                y: c.hero.y + 120,
                id: 'native-nature-review',
              };
              z.props = [e];
              const g = c.makeEnemy(
                {
                  species: 'goblin',
                  name: 'Goblin',
                  level: 1,
                  hp: 3000,
                  damage: 10,
                  gold: 0,
                  xp: 0,
                },
                { x: c.hero.x + 65, y: c.hero.y - 65 },
              );
              z.enemies = [g];
              g.aggro = true;
              c.holdHeroTarget(() => true, g.id);
              c.tacticalRogueMove(g, c.hero);
              const before = JSON.stringify(c.snapshot());
              Prototype.renderer.draw();
              const canvas = document.querySelector('#world'),
                rect = canvas.getBoundingClientRect();
              return {
                before,
                after: JSON.stringify(c.snapshot()),
                entry: PrototypeSprites.definitionFor(e, contract.region).entry,
                status: PrototypeSprites.status(),
                anchor: Prototype.renderer.screen(e),
                ratio: canvas.width / rect.width,
                width: canvas.width,
                height: canvas.height,
                warning: g.telegraph?.name,
                png: canvas.toDataURL('image/png').split(',')[1],
              };
            },
            { contract: job.contract, lighting },
          );
          assert.equal(scene.before, scene.after, 'Drawing preserves saves and geometry');
          assert.equal(scene.entry.width, job.target);
          assert.equal(scene.entry.hash, originals[job.key].output.hash);
          assert.equal(scene.status.maxDecodedBytes, 256 * 1024 * 1024);
          assert(scene.status.decodedBytes <= scene.status.maxDecodedBytes);
          assert(scene.warning, 'Actual combat warning must render alongside nature');
          const bytes = Buffer.from(scene.png, 'base64'),
            tag = `${profile.width}x${profile.height}-${lighting}-${job.key.replaceAll(':', '-')}`;
          fs.writeFileSync(path.join(directory, tag + '.png'), bytes);
          const size = 190,
            left = Math.max(
              0,
              Math.min(scene.width - size, Math.round(scene.anchor.x * scene.ratio - size / 2)),
            ),
            top = Math.max(
              0,
              Math.min(
                scene.height - size,
                Math.round(scene.anchor.y * scene.ratio - 40 - size / 2),
              ),
            );
          tiles.push({
            input: await sharp(bytes)
              .extract({ left, top, width: size, height: size })
              .png()
              .toBuffer(),
            left: (index % 6) * 200,
            top: Math.floor(index / 6) * 200,
          });
          evidence.push({
            profile,
            lighting,
            key: job.key,
            outputHash: scene.entry.hash,
            revision: scene.entry.revision,
            sceneHash: pipeline.hash(bytes),
            anchor: scene.anchor,
            ratio: scene.ratio,
            warning: scene.warning,
            decodedBytes: scene.status.decodedBytes,
            maxDecodedBytes: scene.status.maxDecodedBytes,
          });
        }
        await sharp({ create: { width: 1200, height: 800, channels: 4, background: '#19261d' } })
          .composite(tiles)
          .png()
          .toFile(
            path.join(directory, `${profile.width}x${profile.height}-${lighting}-native-crops.png`),
          );
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(directory, 'evidence.json'),
    JSON.stringify(
      { engine, assets: jobs.length, scenes: evidence, review: 'pending visual inspection' },
      null,
      2,
    ) + '\n',
  );
  return { engine, assets: jobs.length, deviceLightCombatScenes: evidence.length };
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
          { env: { ...process.env, PORT: '8092' }, stdio: ['ignore', 'pipe', 'inherit'] },
        );
        await new Promise((resolve, reject) => {
          server.stdout.once('data', resolve);
          server.once('error', reject);
          server.once('exit', (c) => reject(Error('Review server exit ' + c)));
        });
        args[0] = 'http://127.0.0.1:8092/';
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
