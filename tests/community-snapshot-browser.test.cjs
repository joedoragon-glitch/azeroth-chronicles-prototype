'use strict';
// Native Canvas/device fixture. Authored only: do not run before owner validation authorization.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER_ENGINE || 'chromium',
  root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results', 'community-' + engine);
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'),
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.webmanifest': 'application/manifest+json',
      '.png': 'image/png',
      '.mp3': 'audio/mpeg',
    }[path.extname(file)] || 'text/html',
  );
  fs.createReadStream(file).pipe(res);
});
// Browser commands in this file are authored acceptance work, never implementation evidence.
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, 'tools/community-snapshot/procedural-art-inventory.json'),
    'utf8',
  ),
);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  const reports = [];
  try {
    browser = await pw[engine].launch(
      engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {},
    );
    for (const [width, height, phone] of [
      [1280, 800, false],
      [375, 800, true],
      [393, 852, true],
      [800, 375, true],
      [844, 390, true],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: phone,
        isMobile: phone,
        deviceScaleFactor: phone ? 2 : 1,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html'),
      );
      await page.waitForFunction(
        () =>
          window.Campaign &&
          window.PrototypeRenderer &&
          window.PrototypePartyPets &&
          window.Prototype,
      );
      await page.evaluate(
        ({ width, height }) => {
          // Keep the real shell paused; controlled scenes use the production painter and menus.
          const canvas = document.createElement('canvas');
          canvas.id = 'community-canvas';
          canvas.width = width;
          canvas.height = height;
          Object.assign(canvas.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '999999',
            background: '#20332e',
          });
          document.body.append(canvas);
          window.communityCapture = {
            canvas,
            ctx: canvas.getContext('2d'),
            game: null,
            painter: null,
          };
          window.communityCapture.create = (region, zoom, sprites) => {
            const c = communityCapture;
            c.game = new Campaign('normal', 'paladin', () => 0.9);
            c.game.enter(Campaign.data.regions[region].id);
            Object.assign(c.game.hero, c.game.safe(1100, 1100));
            c.painter = PrototypeRenderer.create({
              canvas: { width, height },
              ctx: c.ctx,
              getGame: () => c.game,
              platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: width / 2, y: height / 2 }) },
              chargePresentation: () => null,
              isPaused: () => false,
              Campaign,
              PrototypeVisuals,
              PrototypeCombatVisuals,
              PrototypeSprites: sprites ? PrototypeSprites : null,
              PrototypeMaterials,
              now: () => 16000,
            });
            return c.game;
          };
          window.communityCapture.draw = () => {
            const c = communityCapture,
              before = JSON.stringify(c.game.s);
            c.painter.draw();
            if (JSON.stringify(c.game.s) !== before) throw Error('renderer mutates campaign');
            const pixels = c.ctx.getImageData(0, 0, width, height).data;
            if (!pixels.some((v, i) => i % 4 !== 3 && v > 0)) throw Error('empty world');
            if (c.painter.metrics().transientEffects > 40) throw Error('unbounded effects');
            return c.painter.metrics();
          };
        },
        { width, height },
      );
      const capture = async (name, data) => {
        await page
          .locator('#community-canvas')
          .screenshot({ path: path.join(out, `${width}x${height}-${name}.png`) });
        reports.push({ width, height, name, ...data });
      };
      for (const motion of ['reduce', 'no-preference']) {
        await page.emulateMedia({ reducedMotion: motion });
        for (const zoom of [1, 1.5, 1.75]) {
          const tag = motion + '-' + zoom;
          // Every regional scene is captured BEFORE a later drawing can overwrite it.
          for (const sprites of [false, true]) {
            if (sprites)
              await page.evaluate(async () => {
                const m = await PrototypeSprites.preload();
                await PrototypeSprites.warm(Object.keys(m.sprites));
              });
            for (let region = 0; region < 5; region++)
              for (const clock of [0, 500]) {
                const metrics = await page.evaluate(
                  ({ region, clock, zoom, sprites }) => {
                    const g = communityCapture.create(region, zoom, sprites),
                      h = g.hero;
                    g.s.clock = clock;
                    g.s.expeditionRank = 6;
                    g.s.party = Campaign.data.bosses
                      .slice(region, region + 6)
                      .map((b, i) =>
                        g.unit('pet', h.x + (i % 2 ? 50 : -50), h.y + Math.floor(i / 2) * 30, b.id),
                      );
                    return communityCapture.draw();
                  },
                  { region, clock, zoom, sprites },
                );
                await capture(
                  `${tag}-region${region}-clock${clock}-${sprites ? 'sprites' : 'procedural'}`,
                  { metrics },
                );
              }
          }
          // All reviewed body contracts on desktop and portrait at default view; every
          // changed contract on the complete viewport/motion/zoom matrix. Shared world
          // painters keep their existing interior/terrain capture gates.
          const records = inventory.records.filter(
            (r) =>
              r.nativeFixture &&
              (['upgrade', 'new-pet'].includes(r.decision) ||
                r.category === 'pet' ||
                ((width === 1280 || width === 375) && motion === 'no-preference' && zoom === 1.5)),
          );
          for (const r of records) {
            const result = await page.evaluate(
              ({ record, zoom }) => {
                const c = communityCapture,
                  spec = record.nativeFixture;
                const g = c.create(spec.region, zoom, false),
                  z = g.zone(),
                  h = g.hero;
                let e;
                if (spec.boss) {
                  const b = g.boss(spec.boss);
                  e = g.bossEnemy(b, 'true', { x: h.x + 70, y: h.y + 30 });
                } else if (spec.enemy)
                  e = g.makeEnemy(
                    {
                      species: spec.enemy,
                      name: record.family,
                      level: 1,
                      hp: 100,
                      damage: 0,
                      xp: 0,
                      gold: 0,
                    },
                    { x: h.x + 70, y: h.y + 30 },
                  );
                else if (spec.pet) e = g.unit('pet', h.x + 70, h.y + 30, spec.pet);
                else if (spec.captain) {
                  e = z.enemies.find((e) => e.captainProfile === spec.captain);
                  if (!e) throw Error('missing authored captain ' + spec.captain);
                } else
                  e = {
                    id: record.id,
                    name: record.family,
                    x: h.x + 70,
                    y: h.y + 30,
                    ...spec.entity,
                  };
                if (spec.captain) Object.assign(h, g.safe(e.x - 70, e.y - 30));
                e.id = e.id || record.id;
                const kind =
                  e.renderKind ||
                  (spec.pet ? 'ally' : spec.boss || spec.enemy || spec.captain ? 'enemy' : 'prop');
                e.renderKind = kind;
                z.enemies = kind === 'enemy' ? [e] : [];
                g.s.party = kind === 'ally' ? [e] : [];
                z.props = kind === 'prop' ? [e] : [];
                z.npcs = kind === 'npc' ? [e] : [];
                z.nodes = kind === 'node' ? [e] : [];
                z.buildings = kind === 'building' ? [e] : [];
                // Alpha on a separate transparent body canvas prevents the terrain from
                // satisfying the actor's visibility oracle. This is coverage, not beauty.
                const probe = document.createElement('canvas');
                probe.width = 400;
                probe.height = 400;
                const pc = probe.getContext('2d');
                PrototypeVisuals.draw(
                  pc,
                  { ...e, ...spec.probeEntity },
                  { x: 200, y: 230 },
                  spec.region,
                );
                const pixels = pc.getImageData(0, 0, 400, 400).data;
                let opaque = 0;
                for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) opaque++;
                if (opaque < 10) throw Error('missing procedural body ' + record.id);
                const metrics = c.draw(),
                  p = c.painter.screen(e);
                if (p.x < 0 || p.y < 0 || p.x > innerWidth || p.y > innerHeight)
                  throw Error('offscreen actor ' + record.id);
                return { id: record.id, opaque, metrics };
              },
              { record: r, zoom },
            );
            await capture(`${tag}-art-${r.id.replace(/[^a-z0-9-]/gi, '-')}`, result);
          }
          // A separate image for each pet/facing avoids fitting/clipping eleven
          // small characters into one crowded portrait gallery.
          for (const family of inventory.records
            .filter((r) => r.category === 'pet')
            .map((r) => r.family)) {
            for (const facing of [-1, 1]) {
              const result = await page.evaluate(
                ({ family, facing, zoom }) => {
                  const c = communityCapture,
                    ctx = c.ctx;
                  ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
                  ctx.save();
                  ctx.translate(c.canvas.width / 2, c.canvas.height / 2);
                  ctx.scale(zoom * facing, zoom);
                  PrototypeVisuals.draw(
                    ctx,
                    { renderKind: 'ally', type: 'pet', petFamily: family, id: 'facing-' + family },
                    { x: 0, y: 0 },
                    0,
                  );
                  ctx.restore();
                  const data = ctx.getImageData(0, 0, c.canvas.width, c.canvas.height).data;
                  let count = 0;
                  for (let i = 3; i < data.length; i += 4) if (data[i]) count++;
                  if (count < 20) throw Error('missing pet ' + family);
                  if (
                    PrototypeSprites.candidateKeys(
                      { renderKind: 'ally', type: 'pet', petFamily: family },
                      0,
                    ).length
                  )
                    throw Error('pet unexpectedly binds a sprite');
                  return { family, facing, paintedPixels: count };
                },
                { family, facing, zoom },
              );
              await capture(`${tag}-${family}-facing${facing}`, result);
            }
            for (const phase of ['charge', 'impact']) {
              const result = await page.evaluate(
                ({ family, phase, zoom }) => {
                  const c = communityCapture,
                    g = c.create(0, zoom, false),
                    h = g.hero,
                    z = g.zone();
                  z.props = [];
                  z.npcs = [];
                  z.buildings = [];
                  z.nodes = [];
                  g.s.expeditionRank = 6;
                  g.s.companionCombatTraining = 2;
                  const u = g.unit('pet', h.x + 30, h.y + 20, family);
                  g.s.party = [u];
                  const ranged = g.petDefinition(u).role === 'ranged';
                  const target = g.makeEnemy(
                    { species: 'goblin', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
                    { x: u.x + (ranged ? 230 : 55), y: u.y },
                  );
                  z.enemies = [target];
                  g.s.mercyTime = 0;
                  g.engage(target);
                  u.skill1Cd = 30;
                  g.updateParty(0.01);
                  if (!g.partyChargeState(u)) throw Error('automatic pet charge absent ' + family);
                  if (phase === 'impact') {
                    g.advancePartyChargeClock(0.65);
                    g.resolveCompanionCharges();
                  } else g.advancePartyChargeClock(0.3);
                  const events = g.effects.filter((e) => e.type === 'petSkill');
                  if (phase === 'impact' && !events.some((e) => e.slot === 2))
                    throw Error('real impact missing');
                  c.painter.queue(g.effects);
                  const metrics = c.draw();
                  if (phase === 'impact' && metrics.transientEffects === 0)
                    throw Error('impact not queued');
                  // Saturate with real pet release metadata to exercise the bounded queue.
                  if (events.length) {
                    c.painter.queue(Array.from({ length: 80 }, () => ({ ...events[0] })));
                    c.draw();
                  }
                  return { family, phase, shape: g.petSkillDefinition(u, 2).shape, metrics };
                },
                { family, phase, zoom },
              );
              await capture(`${tag}-${family}-${phase}`, result);
            }
          }
        }
      }
      // Real production menu definitions rendered by the real shell. Exercise touch/
      // mouse actions and scrolling instead of only serializing menu objects.
      await page.evaluate(() => {
        document.querySelector('#community-canvas').remove();
        const g = new Campaign('normal', 'paladin', () => 0.9),
          z = g.zone();
        z.enemies = [];
        z.npcs = [];
        g.s.expeditionRank = 6;
        g.hero.gold = 1000;
        const b = {
          id: 'native-pet-base',
          kind: 'barracks',
          x: g.hero.x,
          y: g.hero.y,
          progress: 4,
          full: true,
          queue: 0,
        };
        z.buildings = [b];
        for (const boss of Campaign.data.bosses) g.s.normal[boss.id] = g.s.true[boss.id] = true;
        const menu = PrototypeMenus.create({
          getGame: () => g,
          Campaign,
          D: Campaign.data,
          action: (label, action, detail = '', disabled = false) => ({
            label,
            action,
            detail,
            disabled,
          }),
          openMenu: Prototype.openMenu,
          closeMenu: Prototype.closeMenu,
          recallSquad() {},
          showMap() {},
          finaleMenu() {},
        });
        window.communityMenuGame = g;
        window.communityMenuOpen = () => menu.barracksMenu(b);
        communityMenuOpen();
      });
      await page.getByRole('button', { name: /^Company/ }).click();
      await page.getByRole('button', { name: /^Boss pet collection/ }).click();
      for (const family of ['thorn', 'darklord']) {
        const name = await page.evaluate((f) => communityMenuGame.petDefinition(f).name, family);
        await page.getByRole('button', { name: new RegExp('^' + name + ' · Recruitable') }).click();
        assert(
          (await page.locator('#modal-content').innerText()).includes('reach'),
          'move range visible',
        );
        await page.getByRole('button', { name: /^Recruit · FREE/ }).click();
        await page.getByRole('button', { name: /^Rest in collection/ }).click();
        await page.getByRole('button', { name: /^Add to group/ }).click();
        await page.screenshot({ path: path.join(out, `${width}x${height}-menu-${family}.png`) });
        const fits = await page.evaluate(() => {
          const r = document.querySelector('#modal').getBoundingClientRect();
          return (
            r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1
          );
        });
        assert(fits, 'collection detail fits native viewport');
        await page.locator('#close-button').click();
      }
      await page.evaluate(() => {
        communityMenuGame.s.party[0].hp = 0;
        communityMenuOpen();
      });
      await page.getByRole('button', { name: /^Company/ }).click();
      await page.getByRole('button', { name: /^Recovery/ }).click();
      await page.getByRole('button', { name: /^Recover fallen companion/ }).click();
      assert(
        await page.evaluate(
          () => communityMenuGame.s.party[0].hp === communityMenuGame.s.party[0].maxHp,
        ),
        'native recovery restores the same pet',
      );
      await page.screenshot({ path: path.join(out, `${width}x${height}-pet-recovery.png`) });
      assert.deepEqual(errors, [], 'no native browser errors');
      await page.close();
    }
    fs.writeFileSync(
      path.join(out, 'report.json'),
      JSON.stringify(
        {
          limits:
            'Authored controlled rendering and interaction coverage. Screenshots require human aesthetic review. No physical-device or balance certification.',
          reports,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'Captured Community native source-contract, pet and skill contexts:',
      reports.length,
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
