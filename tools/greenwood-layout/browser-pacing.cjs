'use strict';
// One scoped Greenwood pilot through the production shell and input/charge path.
// Virtual browser time exercises ordinary frames; it is never a hardware/FPS test.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  cp = require('node:child_process'),
  crypto = require('node:crypto');
const { chromium } = require('playwright'),
  sharp = require('sharp'),
  C = require('../../src/prototype/engine'),
  { rng } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..'),
  seconds = Number(process.argv[2] || 600),
  seedId = Number(process.argv[3] || 0x47564101),
  mode = process.argv[4] || 'orientation';
assert([600, 1800].includes(seconds));
assert(['orientation', 'farm-woods', 'estate'].includes(mode));
const out = path.join(root, 'docs/evidence/greenwood-revised-20261028/browser-pacing'),
  seed = new C('normal', 'paladin', rng(seedId)).snapshot();
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};
const routes = {
  orientation: [
    'supplier',
    'recruiter',
    'board',
    'rest',
    'minor',
    'orchard',
    'mill-pond',
    'bridge-north',
    'outbound',
    'bridge-south',
    'rest',
  ],
  'farm-woods': [
    'supplier',
    'recruiter',
    'minor',
    'orchard',
    'mill-pond',
    'goblin-camp',
    'den-ruins',
    'bridge-south',
    'minor',
    'rest',
  ],
  estate: [
    'supplier',
    'recruiter',
    'bridge-north',
    'outbound',
    'cache',
    'entrance',
    'supply-entrance',
    'bridge-south',
    'rest',
  ],
};
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(
        /^\/+/,
        '',
      ),
      file = path.resolve(root, name || 'index.html');
    if (
      !file.startsWith(root + path.sep) ||
      name.split('/').some((x) => x.startsWith('.')) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  const started = performance.now();
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      }),
      page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      ({ seed, seedId }) => {
        let a = seedId >>> 0;
        Math.random = () => {
          a = (a + 0x6d2b79f5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        localStorage.setItem('azeroth-display-language-v1', 'en');
        localStorage.setItem('azeroth-v4-normal', JSON.stringify(seed));
      },
      { seed, seedId },
    );
    await page.clock.install({ time: new Date('2026-10-29T12:00:00Z') });
    await page.goto('http://127.0.0.1:' + server.address().port + '/index.html');
    await page.getByRole('button', { name: 'Continue Adventure', exact: true }).click();
    await page.waitForFunction(() => Prototype.started && !Prototype.sceneLoading);
    await page.evaluate(() => PrototypeSprites.preload());
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const initial = await page.evaluate(
      ({ route }) => {
        const g = Prototype.game;
        window.pilot = {
          route,
          index: 0,
          visits: [],
          decisions: [],
          restAttempts: 0,
          rests: 0,
          healRequests: 0,
          recoveries: 0,
          chargedReleases: 0,
          normalManualReleases: 0,
          automaticReleases: 0,
          dwellUntil: 0,
          lastDeath: g.s.statistics.deaths,
          startTime: g.s.time,
          lastRestAttempt: -999,
        };
        const original = g.event;
        g.event = function (type, data) {
          if (type === 'heroSkillCast' && data.actor === 'hero') {
            if (data.charged) pilot.chargedReleases++;
            else if (data.automaticBasic) pilot.automaticReleases++;
            else pilot.normalManualReleases++;
          }
          return original.call(this, type, data);
        };
        return {
          time: g.s.time,
          ordinary: g.zone().enemies.filter((e) => e.type === 'mob' && !e.summon).length,
          criticalParty: !!g._criticalPartyNative?.enabled,
          criticalWorld: !!g._criticalWorldNative?.enabled,
          sourceVersion: g.zone().greenwoodSourceVersion,
          sceneVersion: g.zone().greenwoodSceneVersion,
        };
      },
      { route: routes[mode] },
    );
    assert(
      initial.criticalParty && initial.criticalWorld,
      'production must attach both actual critical sessions',
    );
    assert.equal(initial.ordinary, 32);
    let lastTime = initial.time,
      loops = 0;
    const shots = [];
    while (lastTime - initial.time < seconds && loops++ < seconds * 3) {
      const decision = await page.evaluate(() => {
        const g = Prototype.game,
          p = pilot,
          z = g.zone(),
          d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
          by = (id) => z.npcs.find((n) => n.id === id),
          record = (action, detail) => {
            if (p.decisions.at(-1)?.action !== action)
              p.decisions.push({ time: Math.round(g.s.time - p.startTime), action, ...detail });
          };
        if (g.zoneId !== 'vale') return { stop: 'left Greenwood' };
        if (Prototype.sceneLoading) return { action: 'wait', time: g.s.time };
        if (g.s.statistics.deaths !== p.lastDeath) {
          p.visits.push({
            id: p.route[p.index % p.route.length],
            time: Math.round(g.s.time - p.startTime),
            outcome: 'death before destination',
          });
          p.lastDeath = g.s.statistics.deaths;
          p.index++;
        }
        if (g.hero.talentPoints > 0) g.talent(g.hero.talents[2] < 2 ? 2 : 0);
        const engaged = z.enemies
            .filter((e) => e.hp > 0 && !e.neutral && !e.returning && e.aggro && d(e, g.hero) < 350)
            .sort((a, b) => d(a, g.hero) - d(b, g.hero)),
          threat = engaged[0];
        const n = by(p.route[p.index % p.route.length]),
          target = n.servicePoint || n;
        const move = (q) => {
          if (g.hero.order?.type !== 'move' || d(g.hero.order, q) > 2)
            PrototypeInput.requestMove(g, q);
        };
        if (
          g.hero.hp < g.hero.maxHp * 0.65 &&
          g.healCompanionCasters().length > 0 &&
          !g.hasSupportEffect(g.hero, 'health') &&
          !g.queuedRangerHeal()
        ) {
          p.healRequests++;
          return { action: 'heal', time: g.s.time };
        }
        if (g.hero.hp < g.hero.maxHp * 0.3) {
          const town = by('rest'),
            door = town.servicePoint || town;
          if (d(g.hero, door) <= 105 && !g.refugeThreat()) {
            if (g.s.time - p.lastRestAttempt > Math.max(1, g.s.restCooldown || 0)) {
              p.lastRestAttempt = g.s.time;
              p.restAttempts++;
              if (g.interact(town)) p.rests++;
            }
            g.hero.order = null;
            record('recover', {});
          } else {
            move(g.refugeThreat() && d(g.hero, door) <= 105 ? { x: 220, y: 270 } : door);
            record('retreat', {});
          }
          return { action: 'advance', time: g.s.time };
        }
        if (threat) {
          g.hero.order = { type: 'attack', id: threat.id };
          g.holdHeroTarget(() => true, threat.id);
          record('engaged combat', { target: threat.id });
          return { action: g.skillReady(1, true) ? 'charge' : 'advance', time: g.s.time };
        }
        if (g.s.time < p.dwellUntil) {
          g.hero.order = null;
          return { action: 'advance', time: g.s.time };
        }
        if (d(g.hero, target) > 28) {
          move(target);
          record('travel', { target: n.id });
          return { action: 'advance', time: g.s.time };
        }
        g.hero.order = null;
        const visit = {
          id: n.id,
          time: Math.round(g.s.time - p.startTime),
          outcome: 'arrived',
          position: { x: g.hero.x, y: g.hero.y },
          hp: g.hero.hp,
          livingCompanions: g.activeLivingParty().length,
        };
        p.visits.push(visit);
        p.index++;
        p.dwellUntil = g.s.time + 5;
        record('scene', { target: n.id });
        if (n.kind === 'recruiter' && g.s.party.some((u) => u.hp <= 0)) {
          if (g.recover()) p.recoveries++;
        }
        return {
          action: ['supplier', 'recruiter', 'quests', 'rest', 'landmark', 'transport'].includes(
            n.kind,
          )
            ? 'interact'
            : 'advance',
          visit,
          time: g.s.time,
        };
      });
      if (decision.stop) break;
      if (decision.action === 'heal') await page.keyboard.press('h');
      if (decision.action === 'charge') {
        await page.keyboard.down('j');
        await page.clock.runFor(800);
        await page.keyboard.up('j');
        await page.clock.runFor(200);
      } else {
        if (decision.action === 'interact') {
          await page.keyboard.press('f');
          await page.clock.runFor(800);
          await page.evaluate(() => Prototype.closeMenu());
          await page.clock.runFor(200);
        } else await page.clock.runFor(1000);
      }
      lastTime = await page.evaluate(() => Prototype.game.s.time);
      if (
        decision.visit &&
        shots.length < routes[mode].length &&
        !shots.some((s) => s.id === decision.visit.id)
      ) {
        const file = `live-${mode}-${decision.visit.id}-${seedId}.webp`;
        await sharp(await page.screenshot())
          .webp({ quality: 85 })
          .toFile(path.join(out, file));
        shots.push({ file, ...decision.visit });
      }
      if (loops % 20 === 0) {
        const progress = await page.evaluate(() => ({
          simulatedSeconds: Prototype.game.s.time - pilot.startTime,
          visits: pilot.visits.length,
          deaths: Prototype.game.s.statistics.deaths,
          charged: pilot.chargedReleases,
          hp: Prototype.game.hero.hp,
        }));
        fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
        fs.writeFileSync(
          path.join(root, 'test-results', 'browser-pilot-' + mode + '.json'),
          JSON.stringify(progress),
        );
      }
      if (errors.length) throw Error(errors.join('\n'));
    }
    const result = await page.evaluate(() => {
      const g = Prototype.game;
      return {
        ...pilot,
        endTime: g.s.time,
        final: {
          level: g.hero.level,
          hp: g.hero.hp,
          kills: g.s.statistics.kills,
          deaths: g.s.statistics.deaths,
          crowns: g.hero.gold,
          livingCompanions: g.activeLivingParty().length,
          completedValeQuests: g
            .questDefs()
            .filter((q) => q.region === 'vale' && g.s.quests[q.id]?.done)
            .map((q) => q.id),
        },
        frameSkip: Prototype.frameSkip.status(),
        snapshotVersion: g.snapshot().version,
      };
    });
    const report = {
      sourceSha: cp
        .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
        .trim(),
      build: require('../../package.json').version,
      seed: seedId,
      mode,
      requestedGameSeconds: seconds,
      actualGameSeconds: result.endTime - result.startTime,
      hostWallMs: Math.round(performance.now() - started),
      browser: browser.version(),
      initial,
      viewport: { width: 1280, height: 800, dpr: 1, zoom: 1.5 },
      boundary:
        'One seeded fresh Normal Paladin resumed through real production Continue. Actual app frames and ordinary controls/charge admission, critical sessions and rendering run under virtual browser time. Native route requests, earned training, lawful rest/recovery; no immediate construction or attacks on unengaged passersby. No HP/XP/crown/count/damage edits. Software/virtual-time strategy is not physical-device FPS or human enjoyment acceptance.',
      errors,
      shots,
      ...result,
    };
    fs.writeFileSync(
      path.join(out, `pilot-${mode}-${seconds}-${seedId}.json`),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(
      JSON.stringify({
        actualGameSeconds: report.actualGameSeconds,
        hostWallMs: report.hostWallMs,
        mode,
        visits: result.visits.length,
        charged: result.chargedReleases,
        ...result.final,
      }),
    );
    assert(
      report.actualGameSeconds >= seconds - 1,
      'the production game clock must actually advance for the requested duration',
    );
    await context.close();
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
