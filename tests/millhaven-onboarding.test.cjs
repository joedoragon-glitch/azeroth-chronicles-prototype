'use strict';
const assert = require('node:assert/strict'),
  // Preserve the original 2700-layout contract and its exact historical
  // coordinates. Production 3200 scenes/migration/doors are exercised by
  // greenwood-flagship.test.cjs, not compared with this superseded layout.
  C = require('../tools/greenwood-layout/fixtures.cjs').loadRuntime(),
  Renderer = require('../src/prototype/renderer');
const pos = (p) => ({ x: p.x, y: p.y }),
  near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  by = (g, id) => g.zone().npcs.find((n) => n.id === id);
assert.equal(
  C.data.regions[0].size,
  2700,
  'historical onboarding fixture stays on its original geometry',
);
for (const mode of ['normal', 'nightmare', 'developer']) {
  const g = new C(mode, 'mage', () => 0.5),
    z = g.zone(),
    points = z.npcs.map((n) => ({ id: n.id, ...pos(n), servicePoint: n.servicePoint }));
  const captain = by(g, 'recruiter'),
    supplier = by(g, 'supplier'),
    rest = by(g, 'rest'),
    minor = by(g, 'minor');
  assert.deepEqual(pos(supplier), { x: 175, y: 440 });
  assert(captain.x > 400 && captain.y < 300);
  assert(rest.x > 600 && rest.y < 150);
  assert(minor.x < 250 && minor.y > 1250);
  assert(near(rest.servicePoint, supplier) > 450);
  assert(near(rest.servicePoint, minor.servicePoint) > 1200);
  assert(
    z.enemies.filter((e) => e.hp > 0).every((e) => near(e.home || e, minor.servicePoint) > 300),
    'field recovery stands outside hostile homes',
  );
  for (const n of [rest, minor]) {
    assert(!g.blocked(n.servicePoint.x, n.servicePoint.y));
    assert(g.route(g.hero, n.servicePoint).length, 'native reachable door');
    assert(near(n, n.servicePoint) < 115);
    const nav = g.navigationTarget(n);
    assert(nav && near(nav.point, n.servicePoint) < 1);
  }
  assert.equal(
    g.interactionDistance(rest) > 115,
    true,
    'old square no longer interacts with refuge',
  );
  const snapshot = g.snapshot();
  for (let i = 0; i < 4; i++) g.zone();
  assert.deepEqual(
    g.zone().npcs.map((n) => ({ id: n.id, ...pos(n), servicePoint: n.servicePoint })),
    points,
    'migration is idempotent',
  );
  assert.deepEqual(
    C.restore(snapshot, () => 0.5)
      .zone()
      .npcs.map((n) => ({ id: n.id, ...pos(n), servicePoint: n.servicePoint })),
    points,
    'updated saves never swap again',
  );
  // Reconstruct the immediately preceding layout, retaining all real native records.
  const old = g.snapshot(),
    oz = old.zones.vale,
    find = (id) => oz.npcs.find((n) => n.id === id),
    prop = (id) => oz.props.find((p) => p.id === id),
    swap = (a, b) => {
      const p = pos(a);
      Object.assign(a, pos(b));
      Object.assign(b, p);
    };
  swap(find('supplier'), find('recruiter'));
  swap(find('rest'), prop(C.rules.millhavenOnboarding.refugeHouse));
  swap(find('minor'), prop(C.rules.millhavenOnboarding.orchardHouse));
  find('rest').servicePoint = { x: 300, y: 350 };
  find('minor').servicePoint = { x: 900, y: 700 };
  delete oz.millhavenOnboardingVersion;
  old.refugeSite = { zone: 'vale', id: 'minor', x: 900, y: 700 };
  old.hero.gold = 347;
  old.restCooldown = 37;
  const enemies = oz.enemies.map((e) => ({ id: e.id, hp: e.hp })),
    party = old.party.map((u) => ({ id: u.id, hp: u.hp }));
  const migrated = C.restore(old, () => 0.5);
  assert.equal(migrated.hero.gold, 347);
  assert.equal(migrated.s.restCooldown, 37);
  assert.deepEqual(
    migrated.zone().enemies.map((e) => ({ id: e.id, hp: e.hp })),
    enemies,
  );
  assert.deepEqual(
    migrated.s.party.map((u) => ({ id: u.id, hp: u.hp })),
    party,
  );
  assert.deepEqual(
    pos(migrated.s.refugeSite),
    minor.servicePoint,
    'saved recovery location follows its ID',
  );
  assert.deepEqual(
    migrated.zone().npcs.map((n) => ({ id: n.id, ...pos(n), servicePoint: n.servicePoint })),
    points,
  );
}
{
  const g = new C('normal', 'paladin', () => 0.5),
    minor = by(g, 'minor');
  Object.assign(g.hero, { x: 900, y: 700 });
  g.tick(0.01);
  assert(!g.s.discovered['vale:minor'], 'old hamlet square has no ghost recovery checkpoint');
  Object.assign(g.hero, minor.servicePoint);
  g.tick(0.01);
  assert(g.s.discovered['vale:minor']);
  assert.equal(g.s.refugeSite.id, 'minor');
  g.hero.hp = 1;
  g.s.party[0].hp = 1;
  g.s.party[1].hp = 0;
  g.s.restCooldown = 0;
  const threat = g.zone().enemies[0];
  Object.assign(threat, { x: g.hero.x + 100, y: g.hero.y, aggro: true });
  assert(!g.interact(minor));
  assert.equal(g.hero.hp, 1);
  assert.equal(g.s.restCooldown, 0);
  threat.aggro = false;
  assert(g.interact(minor));
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.s.party[0].hp, g.s.party[0].maxHp);
  assert.equal(g.s.party[1].hp, 0);
  assert.equal(g.s.restCooldown, 90);
  const town = by(g, 'rest');
  Object.assign(g.hero, town.servicePoint);
  g.hero.hp = 1;
  assert(!g.interact(town));
  assert.equal(g.hero.hp, 1, 'rest cooldown remains shared');
  const invalid = g.snapshot();
  invalid.discovered['vale:refuge-help:minor'] = 'yes';
  assert.throws(() => C.restore(invalid), /refuge guidance/);
}
{
  const g = new C('normal', 'mage', () => 0.5),
    captain = by(g, 'recruiter');
  for (const [w, h] of [
    [844, 390],
    [768, 354],
  ]) {
    const r = Renderer.create({
      canvas: { width: w, height: h },
      ctx: {},
      getGame: () => g,
      platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: w * 0.5, y: h * 0.42 }) },
      isPaused: () => false,
      chargePresentation: () => null,
      Campaign: C,
      PrototypeVisuals: {},
      PrototypeCombatVisuals: {},
      now: () => 0,
    });
    const p = r.screen(captain),
      cue = { x: p.x, y: p.y - 80 * 1.5 };
    assert(cue.x - 24 > 276, 'Captain cue clears the existing left phone HUD');
    assert(
      cue.x + 24 < w && cue.y - 24 > 0 && cue.y + 24 < h,
      'cue fully visible at native default landscape camera',
    );
  }
}
console.log(
  'PASS Millhaven native swaps, reachable field shelter, landscape Captain cue, idempotent v4 migration, retained actors/funds/cooldown, moved checkpoint and native recovery guards',
);
