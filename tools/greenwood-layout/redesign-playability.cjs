'use strict';
// Controlled native first-region acceptance. Boss defeat/rescue fixtures do
// not claim human combat play; full-session pilots are recorded separately.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { loadRedesign, rng } = require('./fixtures.cjs'),
  C = loadRedesign(3200);
const rows = [],
  out = path.resolve(__dirname, '../../docs/evidence/greenwood-redesign-20261029');
const fresh = () => new C('normal', 'paladin', rng(0x47564101));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const kill = (g, e) => {
  assert(e);
  e.hp = 0;
  e.heroParticipated = true;
  g.kill(e);
};
const test = (name, fn) => {
  const t = performance.now();
  fn();
  rows.push({ name, passed: true, hostMs: Math.round(performance.now() - t) });
  console.log('PASS ' + name);
};
test('native opening, authored road/door clearances, essential scenes and mill water continuity', () => {
  const g = fresh(),
    z = g.zone();
  assert.deepEqual([g.hero.x, g.hero.y], C.data.towns[0]);
  assert(g.s.party.every((u) => !g.blocked(u.x, u.y)));
  for (const r of [...z.roads, ...z.footpaths])
    for (let j = 1; j < r.length; j++)
      assert(g.clearSegment(r[j - 1], r[j], 20), 'hero/companion-width authored segment');
  for (const p of z.props.filter((p) => p.roadBlocker))
    assert(g.distanceToRoad(z, p) + 1e-4 >= g.roadSetback(p), 'visible roof setback ' + p.id);
  for (const id of ['greenwood-working-mill', 'greenwood-working-cellar', 'greenwood-mill-sluice'])
    assert(z.props.some((p) => p.id === id));
  for (const kind of ['fruit-tree', 'sapling', 'furrow-plot', 'drying-rack', 'estate-scaffold'])
    assert(
      z.props.some((p) => p.structure === kind),
      kind,
    );
  const cfg = C.rules.greenwoodLayout;
  for (const points of [cfg.headrace, cfg.tailrace])
    for (let j = 1; j < points.length; j++)
      for (let k = 1; k < 20; k++) {
        const f = k / 20,
          p = {
            x: points[j - 1].x + (points[j].x - points[j - 1].x) * f,
            y: points[j - 1].y + (points[j].y - points[j - 1].y) * f,
          };
        assert(g.blocked(p.x, p.y, 'vale', 0, true), 'continuously wetted mill channel');
      }
  assert(z.greenwoodSceneAudit.every((p) => !p.essential || p.placed));
});
test('both crossings physically carry hero and both original companions in both directions', () => {
  for (const name of ['north', 'south']) {
    const g = fresh(),
      cfg = C.rules.greenwoodLayout,
      y = cfg.anchors[name].y;
    const [lo, hi] = C.rules.channelBanks(0, y),
      west = g.safe(lo - 320, y),
      east = g.safe(hi + 320, y);
    Object.assign(g.hero, west);
    g.s.party.forEach((u, j) => Object.assign(u, g.safe(west.x - 40 - j * 30, west.y + 20)));
    for (const target of [east, west]) {
      g.hero.order = { type: 'move', ...target, navigation: true };
      let steps = 0;
      for (; steps < 1200; steps++) {
        g.tick(0.1);
        if (
          distance(g.hero, target) < 30 &&
          g
            .activeLivingParty()
            .every(
              (u) =>
                distance(u, target) < 240 &&
                (target === east
                  ? u.x > C.rules.channelBanks(0, u.y)[1] + 20
                  : u.x < C.rules.channelBanks(0, u.y)[0] - 20),
            )
        )
          break;
      }
      assert(steps < 1200, name + ' party completes crossing');
      assert(g.activeLivingParty().length === 2);
      assert(!g.blocked(g.hero.x, g.hero.y));
      assert(g.activeLivingParty().every((u) => !g.blocked(u.x, u.y)));
    }
  }
});
test('all eight native Thornfang/Mira patrol legs, shared crossings and captive spacing', () => {
  const g = fresh();
  g.xp(120);
  const e = g.zone().enemies.find((e) => e.family === 'thorn'),
    captive = g.thornCaptive(),
    seen = new Set();
  let maxGap = 0,
    steps = 0;
  for (; steps < 18000 && seen.size < 8; steps++) {
    g.s.time += 0.1;
    g.updateThornPatrol(e, 0.1);
    g.updateThornCaptive(0.1);
    if (Number.isInteger(e.thornLeg)) seen.add(e.thornLeg);
    maxGap = Math.max(maxGap, distance(e, captive));
  }
  assert.equal(seen.size, 8, 'patrol traverses every authored leg without teleporting');
  assert(maxGap <= C.rules.thornPatrol.waitForCaptive + 25, 'captive follows through real terrain');
  assert(!g.blocked(e.x, e.y) && !g.blocked(captive.x, captive.y));
  rows.push({
    name: 'patrol observations',
    visitedLegs: [...seen],
    simulatedSeconds: steps / 10,
    maxCaptiveGap: maxGap,
  });
});
const quests = fresh()
  .questDefs()
  .filter((q) => q.region === 'vale' && !q.tutorial);
assert.equal(quests.length, 6);
assert.equal(
  quests.reduce((a, q) => a + q.gold, 0),
  160,
);
assert.equal(
  quests.reduce((a, q) => a + q.xp, 0),
  600,
);
for (const q of quests)
  test(q.name + ' completes and pays once through native objectives', () => {
    const g = fresh();
    if (q.kind === 'rescue') {
      const boss = g.boss(q.target);
      if (boss.id === 'thorn') g.xp(120);
      if (boss.kind === 'dungeon') g.enter(boss.id);
      kill(
        g,
        g.zone().enemies.find((e) => e.family === boss.id && e.type === 'boss'),
      );
      const captive = g.zone().npcs.find((n) => n.kind === 'cage' && n.family === boss.id);
      Object.assign(g.hero, captive);
      assert(g.interact(captive));
      if (q.clear)
        for (const e of g.zone().enemies.filter((e) => e.mini === q.clear && e.hp > 0)) kill(g, e);
      g.enter('vale');
      const service = g
        .zone()
        .npcs.find((n) => n.family === boss.id && ['teacher', 'smith'].includes(n.kind));
      assert(service, 'rescued service present');
      const route = g.route(g.hero, service.servicePoint || service);
      assert(
        route.length && distance(route.at(-1), service.servicePoint || service) < 40,
        'rescued service accessible',
      );
    } else if (q.kind === 'patrol')
      g.zone()
        .enemies.filter((e) => e.type === 'mob' && !e.guard && !e.nightOnly && e.hp > 0)
        .slice(0, q.target)
        .forEach((e) => kill(g, e));
    else if (q.kind === 'bundles') {
      const door = g.zone().npcs.find((n) => n.id === 'supply-entrance');
      Object.assign(g.hero, door);
      assert(g.interact(door));
      const z = g.zone(),
        bundles = z.npcs.filter((n) => n.kind === 'bundle');
      assert.equal(bundles.length, 2);
      Object.assign(g.hero, bundles[0]);
      assert(!g.interact(bundles[0]), 'native Treasury guards remain authoritative');
      for (const e of z.enemies.filter((e) => e.guard && e.hp > 0)) kill(g, e);
      for (const n of bundles) {
        Object.assign(g.hero, n);
        assert(g.interact(n));
        assert(!g.interact(n));
      }
    } else if (q.kind === 'sites') {
      for (const id of q.sites.slice(0, q.minSites || q.sites.length)) {
        if (id === 'port') {
          const n = g.zone().npcs.find((n) => n.id === 'outbound');
          Object.assign(g.hero, n);
          g.tick(0.01);
        } else {
          const n = g.zone().npcs.find((n) => n.id === id);
          assert(n);
          Object.assign(g.hero, n.servicePoint || n);
          g.tick(0.01);
          if (n.kind === 'landmark') assert(g.interact(n));
          if (n.kind === 'dungeon' && n.sideDungeon) {
            assert(g.interact(n));
            const exit = g.zone().npcs.find((n) => n.kind === 'exit');
            Object.assign(g.hero, exit);
            assert(g.interact(exit));
          }
        }
      }
    } else throw Error('Unexpected Vale quest kind ' + q.kind);
    g.checkQuests();
    assert(g.s.quests[q.id].done && g.s.quests[q.id].paid, q.id + ' actual completion and payment');
    const gold = g.hero.gold;
    g.checkQuests();
    assert(!g.claim(q.id));
    assert.equal(g.hero.gold, gold);
    const again = C.restore(g.snapshot(), rng(1));
    again.checkQuests();
    assert.equal(again.hero.gold, gold, 'no second payment on load');
    assert(again.s.quests[q.id].done && again.s.quests[q.id].paid);
  });
const report = {
  status:
    'Focused controlled geometry, patrol, companions and all six native Vale quest/rescued-service checks; no combat rebalance, human-enjoyment or physical-device claim',
  sourceFiles: Object.fromEntries(
    ['engine', 'greenwood-landscape', 'world', 'navigation', 'rules', 'save'].map((n) => [
      n,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/' + n + '.js')))
        .digest('hex'),
    ]),
  ),
  rows,
};
fs.writeFileSync(path.join(out, 'playability.json'), JSON.stringify(report, null, 2) + '\n');
