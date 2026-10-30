'use strict';
// Bounded Greenwood save/arrival regression, not a full campaign certification.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { rng, loadRedesign } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/evidence/greenwood-redesign-20261029');
if (!process.argv.includes('--size')) {
  let failed = false;
  for (const size of [3200, 3400]) {
    const result = cp.spawnSync(
      process.execPath,
      [
        __filename,
        '--size',
        String(size),
        ...(process.argv.includes('--no-report') ? ['--no-report'] : []),
      ],
      { cwd: root, stdio: 'inherit' },
    );
    failed ||= result.status !== 0;
  }
  process.exit(failed ? 1 : 0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]);
const C = loadRedesign(size),
  failures = [],
  cases = [];
const check = (name, value, detail) => {
  if (!value) failures.push({ case: current, name, detail });
};
let current;
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const fixtureBytes = fs.readFileSync(
  path.join(out, 'synthetic-expanded-rollback-lifecycle-v4.json.gz'),
);
const fixtures = JSON.parse(zlib.gunzipSync(fixtureBytes));
const construction = (s) => s.zones.vale.buildings.map(({ x, y, ...b }) => b);
const progress = (s) => ({
  gold: s.hero.gold,
  quests: s.quests,
  paid: s.paid,
  normal: s.normal,
  true: s.true,
  rescued: s.rescued,
  gathered: s.gathered,
  discovered: s.discovered,
  nodes: s.zones.vale.nodes.map((n) => [n.id, n.amount, n.hidden]),
  enemies: s.zones.vale.enemies.map((e) => [e.id, e.hp <= 0, e.deathPaid]),
  buildings: construction(s),
  barracksRespawn: s.barracksRespawn,
  party: s.party.map((u) => [u.id, u.type, u.active, u.carry, u.order?.type, u.order?.id]),
});
const spatial = (s) => ({
  zone: s.zone,
  hero: [s.hero.x, s.hero.y],
  party: s.party.map((u) => [u.id, u.x, u.y, u.order]),
  zones: Object.fromEntries(
    Object.entries(s.zones).map(([id, z]) => [
      id,
      {
        props: z.props.map((p) => [p.id, p.x, p.y]),
        buildings: z.buildings,
        npcs: z.npcs.map((n) => [n.id, n.x, n.y, n.servicePoint]),
        enemies: z.enemies.map((e) => [e.id, e.x, e.y, e.home]),
        nodes: z.nodes.map((n) => [n.id, n.x, n.y, n.amount]),
      },
    ]),
  ),
  refugeSite: s.refugeSite,
});
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [name, raw] of fixtures.saves) {
  current = name;
  const before = failures.length,
    input = JSON.stringify(raw);
  try {
    if (name.startsWith('rollback:')) {
      check('input passed native inverse rollback', raw.zones.vale.greenwoodRollbackVersion === 1);
      check('input uses rolled-back coordinates', raw.zones.vale.greenwoodSourceVersion === 0);
    }
    const g = C.restore(raw, rng(0x47564102)),
      once = g.snapshot();
    check('input untouched', input === JSON.stringify(raw));
    check('progress preserved', equal(progress(raw), progress(once)), {
      changed: Object.keys(progress(raw)).filter(
        (k) => !equal(progress(raw)[k], progress(once)[k]),
      ),
    });
    const twice = C.restore(once, rng(0x47564102)).snapshot();
    const third = C.restore(twice, rng(0x47564102)).snapshot();
    check('second spatial reload stable', equal(spatial(once), spatial(twice)));
    check('third spatial reload stable', equal(spatial(twice), spatial(third)));
    check(
      'repeat progress stable',
      equal(progress(once), progress(twice)) && equal(progress(twice), progress(third)),
    );
    check(
      'no unresolved migration',
      !once.zones.vale.greenwoodMigrationUnresolved?.length,
      once.zones.vale.greenwoodMigrationUnresolved,
    );
    check(
      'parent scene composed during restore',
      once.zones.vale.greenwoodRedesignScene === C.rules.greenwoodLayout.sceneVersion,
    );
    check(
      'no essential scene conflict',
      !!once.zones.vale.greenwoodSceneAudit?.every((p) => !p.essential || p.placed),
    );
    for (const b of g.s.zones.vale.buildings) {
      check('camp remains on dry land: ' + b.id, !g.blocked(b.x, b.y, 'vale', 50, true));
      if (b.dungeonEntrance) {
        const n = g.s.zones.vale.npcs.find(
          (n) => n.family === b.dungeonEntrance && n.kind === 'dungeon',
        );
        const previous = g.s.zone;
        g.s.zone = 'vale';
        const r = g.route(n, b);
        g.s.zone = previous;
        check(
          'named recovery camp follows entrance',
          Math.hypot(n.x - b.x, n.y - b.y) <= C.rules.dungeonCamp.builtRadius,
          { distance: Math.hypot(n.x - b.x, n.y - b.y) },
        );
        check(
          'camp accessible from entrance',
          r.length > 0 && Math.hypot(r.at(-1).x - b.x, r.at(-1).y - b.y) < 40,
        );
      }
    }
    for (const u of once.party.filter((u) => u.order?.journey)) {
      const original = raw.party.find((p) => p.id === u.id).order.journey.points;
      check('worker breadcrumbs moved with geography', !equal(u.order.journey.points, original));
      check('breadcrumb count retained', u.order.journey.points.length === original.length);
    }
    if (raw.zones.vale.greenwoodRollbackVersion === 1)
      check(
        'ambiguous rollback breadcrumbs replan',
        once.party.every((u) => !u.order?.journey),
      );
    if (g.isDungeon()) {
      const oldHero = { x: raw.hero.x, y: raw.hero.y };
      check('interior hero unchanged', equal(oldHero, { x: g.hero.x, y: g.hero.y }));
      const interior = g.zoneId,
        exit = g.zone().npcs.find((n) => n.kind === 'exit');
      Object.assign(g.hero, g.safe(exit.x, exit.y));
      check('native exit action', g.interact(exit) && g.zoneId === 'vale');
      const entrance = g
        .zone()
        .npcs.find((n) =>
          interior === 'supply-vale' ? n.id === 'supply-entrance' : n.family === interior,
        );
      check(
        'return beside relocated entrance',
        Math.hypot(g.hero.x - entrance.x, g.hero.y - entrance.y) < 160,
      );
      check('return collision clear', !g.blocked(g.hero.x, g.hero.y));
      check(
        'party arrival collision clear',
        g.activeParty().every((u) => !g.blocked(u.x, u.y)),
      );
    } else if (name.endsWith('partial-recovery-camp')) {
      const b = g.zone().buildings.find((b) => b.progress < 4),
        gold = g.hero.gold;
      check(
        'construction order survives',
        g.s.party.some((u) => u.order?.type === 'build' && u.order.id === b.id),
      );
      // Bounded native movement/work updates, without enemy simulation. This is
      // lifecycle continuation, not combat or sustained-session acceptance.
      for (let j = 0; j < 600 && b.progress < 4; j++) g.updateParty(0.1);
      check('migrated builder completes work', b.progress === 4, { progress: b.progress });
      check('no duplicate construction charge', g.hero.gold === gold);
      check('recovery selection completes', g.s.barracksRespawn?.id === b.id);
    } else if (name.endsWith('paid-partial-upgrade')) {
      const b = g.zone().buildings.find((b) => b.upgradePaid && !b.full),
        gold = g.hero.gold;
      check('native paid upgrade resumes', g.upgradeBarracks(b.id));
      for (let j = 0; j < 600 && !b.full; j++) g.updateParty(0.1);
      check('migrated upgrade completes', b.full && b.upgradeProgress === 4);
      check('upgrade payment not charged again', g.hero.gold === gold);
    } else if (name.includes('worker-')) {
      const supplier = g.zone().npcs.find((n) => n.kind === 'supplier');
      const cargo = g.s.party.reduce((a, u) => a + u.carry, 0),
        gold = g.hero.gold;
      const fraction = g.s.tributeRemainder || 0;
      Object.assign(g.hero, g.safe(supplier.x, supplier.y));
      const payout = g.unloadCompanyTribute(supplier);
      check(
        'saved cargo delivered once',
        payout !== null &&
          Math.abs(g.hero.gold - gold + (g.s.tributeRemainder || 0) - fraction - cargo) < 1e-7,
      );
      check('second unload pays zero', g.unloadCompanyTribute(supplier) === 0);
      check(
        'cargo cleared after delivery',
        g.s.party.every((u) => u.carry === 0),
      );
    }
    check(
      'native transport arrival',
      g.enter('vale', { transportId: 'outbound', dx: -60, dy: 90 }),
    );
    const wagon = g.zone().npcs.find((n) => n.id === 'outbound');
    check(
      'wagon arrival beside stand',
      Math.hypot(g.hero.x - wagon.x, g.hero.y - wagon.y) < 180 && !g.blocked(g.hero.x, g.hero.y),
    );
    cases.push({
      name,
      passed: failures.length === before,
      remainingTribute: once.zones.vale.nodes.reduce((a, n) => a + n.amount, 0),
      buildings: construction(once),
      sourceVersion: once.zones.vale.greenwoodSourceVersion,
    });
  } catch (e) {
    failures.push({ case: name, name: 'exception', detail: e.stack });
  }
}
const report = {
  size,
  sourceFiles: Object.fromEntries(
    ['greenwood-landscape', 'greenwood', 'world', 'engine', 'save', 'party'].map((n) => [
      n,
      sha(fs.readFileSync(path.join(root, 'src/prototype/' + n + '.js'))),
    ]),
  ),
  fixtureSha256: sha(fixtureBytes),
  fixtureSources: fixtures.sources,
  status:
    'Synthetic historical v4 inputs; active replacement at 3200 and 3400 comparison; bounded lifecycle checks, no device, visual, combat or full-game acceptance',
  cases,
  failures,
};
if (!process.argv.includes('--no-report'))
  fs.writeFileSync(
    path.join(out, 'lifecycle-' + size + '.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
console.log(JSON.stringify({ size, cases: cases.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
