'use strict';
// Review the camp, furnishing and actor continuation batch in the real renderer; no campaign or registry writes.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const sharp = require('sharp'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pipeline = require('./sprite-pipeline.cjs');
const journal = require('../tools/sprites/batches/2026-10-10-08/production-journal.json');
const profiles = require('../tools/sprites/specifications.json').policy.reviewProfiles;
async function capture(base, directory, engine = 'chromium') {
  assert(!fs.existsSync(directory), 'Retain prior native evidence');
  fs.mkdirSync(directory, { recursive: true });
  const jobs = journal.entries.map((j) => ({
    ...j,
    record: JSON.parse(fs.readFileSync(path.resolve(j.candidate))),
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
        serviceWorkers: process.env.SPRITE_CONTINUATION_CANDIDATES === '1' ? 'block' : 'allow',
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      if (process.env.SPRITE_CONTINUATION_CANDIDATES === '1') {
        const manifest = JSON.parse(fs.readFileSync('assets/sprites/manifest.json'));
        for (const job of jobs) {
          const src =
            './assets/sprites/continuation-preview/' + job.key.replaceAll(':', '-') + '.png';
          manifest.sprites[job.key] = { ...pipeline.entryFor(job.record), src };
          await page.route('**/' + src.slice(2), (route) =>
            route.fulfill({
              status: 200,
              contentType: 'image/png',
              body: fs.readFileSync(path.join(path.dirname(job.candidate), job.record.output.file)),
            }),
          );
        }
        await page.route('**/assets/sprites/manifest.json', (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(manifest),
          }),
        );
      }
      console.log('PROFILE', profile.width, profile.height);
      await page.goto(base + (phone ? 'phone.html' : 'index.html'));
      console.log('LOADED');
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      console.log('STARTED');
      await page.evaluate(
        async (keys) => {
          await Promise.race([
            PrototypeSprites.preload(undefined, keys),
            new Promise((_, reject) =>
              setTimeout(() => reject(Error('Sprite preload timed out')), 30000),
            ),
          ]);
          await PrototypeSprites.warm(keys, { clips: true });
          window.requestAnimationFrame = () => 0;
          Prototype.game.tick = () => {};
        },
        [...jobs.map((j) => j.key), 'hero:paladin', 'enemy:goblin'],
      );
      console.log('WARMED');
      for (const lighting of ['day', 'night']) {
        const tiles = [];
        const scenes = await page.evaluate(
          async ({ contracts, lighting }) => {
            const captureScene = async ({ contract, lighting }) => {
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
              if (e.renderKind === 'hero') Object.assign(c.hero, e);
              else if (e.renderKind === 'ally')
                c.s.party = [{ ...e, hp: 10000, maxHp: 10000, level: 1 }];
              else if (e.renderKind === 'building') z.buildings = [e];
              else if (e.renderKind === 'enemy')
                z.enemies = [{ ...e, hp: 10000, maxHp: 10000, level: 1, type: 'mob' }];
              else z.props = [e];
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
                { x: c.hero.x + 165, y: c.hero.y - 185 },
              );
              if (e.renderKind === 'enemy') z.enemies.push(g);
              else z.enemies = [g];
              g.aggro = true;
              c.holdHeroTarget(() => true, g.id);
              c.tacticalRogueMove(g, { ...c.hero, x: c.hero.x + 150, y: c.hero.y - 160 });
              const before = JSON.stringify(c.snapshot());
              const probe = document.createElement('canvas');
              probe.width = probe.height = 1024;
              const spriteDrawn = PrototypeSprites.draw(
                probe.getContext('2d'),
                e,
                { x: 512, y: 700 },
                contract.region,
              );
              probe.width = probe.height = 0;
            const originalDraw = PrototypeSprites.draw;
              let rendererSpriteDraws = 0;
              PrototypeSprites.draw = function (ctx, actor, ...args) {
                const result = originalDraw(ctx, actor, ...args);
                if (actor.id === e.id && result) rendererSpriteDraws++;
                return result;
              };
              try {
                Prototype.renderer.draw();
              } finally {
                PrototypeSprites.draw = originalDraw;
              }
              const canvas = document.querySelector('#world'),
                rect = canvas.getBoundingClientRect();
              const ratio = canvas.width / rect.width,
                cropWidth = 500,
                cropHeight = 360;
              const left = Math.max(
                0,
                Math.min(
                  canvas.width - cropWidth,
                  Math.round(Prototype.renderer.screen(e).x * ratio - cropWidth / 2),
                ),
              );
              const top = Math.max(
                0,
                Math.min(
                  canvas.height - cropHeight,
                  Math.round(Prototype.renderer.screen(e).y * ratio - cropHeight * 0.78),
                ),
              );
              const native = document.createElement('canvas');
              native.width = cropWidth;
              native.height = cropHeight;
              native
                .getContext('2d')
                .drawImage(canvas, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
              const fullBase64=canvas.toDataURL('image/png').split(',')[1];
            assertFull: if (!fullBase64) throw Error('Full canvas PNG encoding failed');
            const fullBinary=atob(fullBase64), fullBytes=Uint8Array.from(fullBinary, c=>c.charCodeAt(0));
            const digest = await crypto.subtle.digest('SHA-256', fullBytes);
              const sceneHash = Array.from(new Uint8Array(digest), (n) =>
                n.toString(16).padStart(2, '0'),
              ).join('');
              return {
                preservesSnapshot: before === JSON.stringify(c.snapshot()),
                sceneHash,
                nativeCrop: { left, top, width: cropWidth, height: cropHeight },
                spriteDrawn,
                rendererSpriteDraws,
                entry: PrototypeSprites.definitionFor(e, contract.region).entry,
                status: PrototypeSprites.status(),
                anchor: Prototype.renderer.screen(e),
                ratio: canvas.width / rect.width,
                width: canvas.width,
                height: canvas.height,
                warning: g.telegraph?.name,
                png: native.toDataURL('image/png').split(',')[1],
              };
            };
            const results = [];
            for (const contract of contracts)
              results.push(await captureScene({ contract, lighting }));
            return results;
          },
          { contracts: jobs.map((j) => j.contract), lighting },
        );
        for (const [index, job] of jobs.entries()) {
          const scene = scenes[index];
          assert(scene.preservesSnapshot, 'Drawing preserves saves and geometry');
          assert(scene.spriteDrawn, `Candidate image actually draws: ${job.key}`);
          assert(scene.rendererSpriteDraws > 0, `Game renderer uses candidate: ${job.key}`);
          assert.equal(scene.status.failed, 0, 'All requested images decode');
          assert.equal(scene.entry.width, job.record.output.width);
          assert.equal(scene.entry.hash, job.record.output.hash);
          assert.equal(scene.status.maxDecodedBytes, 256 * 1024 * 1024);
          assert(scene.status.decodedBytes <= scene.status.maxDecodedBytes);
          assert(scene.warning, 'Actual combat warning must render alongside candidate');
          const bytes = Buffer.from(scene.png, 'base64');
          const { left, top, width: cropWidth, height: cropHeight } = scene.nativeCrop;
          const cropBytes = bytes;
          const cropped = await sharp(cropBytes).metadata();
          assert.equal(cropped.width, cropWidth);
          assert.equal(cropped.height, cropHeight);
          tiles.push({
            input: cropBytes,
            left: (index % 4) * 500,
            top: Math.floor(index / 4) * 360,
          });
          evidence.push({
            profile,
            lighting,
            key: job.key,
            outputHash: scene.entry.hash,
            revision: scene.entry.revision,
            sceneHash: scene.sceneHash,
            spriteDrawn: scene.spriteDrawn,
            rendererSpriteDraws: scene.rendererSpriteDraws,
            nativeCrop: { left, top, width: cropWidth, height: cropHeight },
            nativeCropHash: pipeline.hash(cropBytes),
            anchor: scene.anchor,
            ratio: scene.ratio,
            warning: scene.warning,
            decodedBytes: scene.status.decodedBytes,
            maxDecodedBytes: scene.status.maxDecodedBytes,
          });
        }
        await sharp({ create: { width: 2000, height: 1800, channels: 4, background: '#19261d' } })
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
