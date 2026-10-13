'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const Sprites = require('../src/prototype/sprites');
const ids = ['crypt', 'archive', 'mine'];
const services = (c) =>
  Object.values(c.s.zones).flatMap((z) =>
    z.npcs.filter((n) => ['teacher', 'smith', 'alchemist'].includes(n.kind)).map((n) => n.family),
  );
for (const mode of ['normal', 'nightmare'])
  for (const id of ids) {
    const c = new C(mode, 'paladin', () => 0.9);
    c.enter(id);
    const z = c.zone(),
      a = C.rules.dungeonArchitecture[id],
      captive = z.npcs.find((n) => n.kind === 'cage'),
      boss = z.enemies.find((e) => e.type === 'boss');
    assert(
      a.walkable.length >= 6 && a.partitions.length >= 3,
      id + ' has functional rooms and real partitions',
    );
    assert.equal(z.dungeonVersion, id === 'crypt' ? 4 : 3);
    assert.equal(captive.presentation, 'workstation');
    assert.equal(captive.family, id);
    assert.deepEqual(
      Sprites.candidateKeys({ ...captive, renderKind: 'npc' }),
      [],
      'working captive never selects a cage image',
    );
    assert.equal(z.enemies.filter((e) => e.guard).length, C.data.regions[c.regionIndex()].guards);
    assert(z.enemies.filter((e) => e.guard).every((e) => e.gold === 0 && e.xp === 0));
    assert(
      z.enemies.filter((e) => e.species === 'wolf').every((e) => !e.ranged),
      'Wolves retain their existing melee identity',
    );
    assert(z.props.some((p) => p.dungeonDistrict === a.walkable[0].id));
    const traps = c.traps(),
      raw = c.blocked.bind(c);
    c.blocked = (x, y, zone, r = 15, terrain) =>
      raw(x, y, zone, r, terrain) ||
      traps.some((t) =>
        c.trapContains(
          { ...t, radius: t.radius + r, length: t.length + 2 * r, halfWidth: t.halfWidth + r },
          { x, y },
        ),
      );
    // Routes must avoid every hazard even after inflating jet width as well as length.
    for (const target of [boss, captive, z.npcs.find((n) => n.id === 'exit')]) {
      assert(
        !c.blocked(target.x, target.y, id, 15),
        id + ' mandatory destination is outside every inflated hazard',
      );
      assert(c.route(c.hero, target).length, id + ' has a safe route to ' + target.name);
    }
    for (const room of a.walkable) {
      const [x1, x2, y1, y2] = room.bounds;
      let reached = false;
      for (let x = x1 + 75; x < x2 - 50 && !reached; x += 100)
        for (let y = y1 + 75; y < y2 - 50 && !reached; y += 100) {
          if (!c.blocked(x, y, id, 18) && c.route(c.hero, { x, y }).length) reached = true;
        }
      assert(reached, id + ' room ' + room.id + ' has a route without paying a hazard toll');
    }
    c.blocked = raw;
    for (const n of C.data.regions) c.enter(n.id);
    c.enter(id);
    Object.assign(c.hero, { x: captive.x, y: captive.y });
    assert(!c.interact(captive));
    assert.deepEqual(services(c), [], 'workstation does not unlock a town service');
    boss.hp = 0;
    c.kill(boss);
    assert(c.interact(captive));
    assert.deepEqual(services(c), [id]);
    const reload = C.restore(c.snapshot());
    assert.deepEqual(services(reload), [id]);
    assert(!reload.rescue(id));
    reload.s.pending[id] = { kind: 'dungeon', count: 1, delay: 0 };
    reload.enter(id);
    reload.activatePending();
    const trueBoss = reload.zone().enemies.find((e) => e.type === 'boss' && e.form === 'true');
    assert(trueBoss);
    assert(!reload.blocked(trueBoss.x, trueBoss.y, id));
    assert(reload.route(reload.hero, trueBoss).length);
    console.log(
      'PASS ' +
        mode +
        ' ' +
        id +
        ' rooms, inflated hazards, independent rescue, reload and TRUE boss',
    );
  }
for (const id of ids) {
  const c = new C();
  c.enter(id);
  const z = c.zone(),
    guard = z.enemies.find((e) => e.guard),
    captive = z.npcs.find((n) => n.kind === 'cage');
  guard.hp = 0;
  c.hero.gold = 777;
  c.s.quests['quest-1'].count = 2;
  const state = c.snapshot();
  state.zones[id].dungeonVersion = 2;
  Object.assign(
    state.zones[id].npcs.find((n) => n.kind === 'cage'),
    { x: 1200, y: 1270 },
  );
  Object.assign(state.hero, { x: 1410, y: 1400 });
  Object.assign(state.party[0], { x: 1410, y: 1400 });
  for (const e of state.zones[id].enemies.filter((e) => e.guard)) {
    e.home = { x: 1410, y: 1400 };
    e.x = 1410;
    e.y = 1400;
  }
  const r = C.restore(state);
  assert.equal(r.hero.gold, 777);
  assert.equal(r.s.quests['quest-1'].count, 2);
  assert.equal(r.zone().enemies.find((e) => e.id === guard.id).hp, 0);
  assert(!r.blocked(r.hero.x, r.hero.y, id));
  assert(r.activeParty().every((e) => !r.blocked(e.x, e.y, id)));
  assert(
    r
      .zone()
      .enemies.filter((e) => e.hp > 0)
      .every((e) => !r.blocked(e.home.x, e.home.y, id)),
  );
  assert.equal(r.zone().npcs.find((n) => n.kind === 'cage').x, captive.x);
  const again = C.restore(r.snapshot());
  assert.deepEqual(again.snapshot(), r.snapshot(), 'migration is idempotent');
  // A completed old dungeon must stay cleared when the layout changes.
  c.victory(id, 'normal');
  z.enemies.filter((e) => e.guard).forEach((e) => (e.hp = 0));
  c.s.paid['clear:' + id] = true;
  const cleared = c.snapshot();
  cleared.zones[id].dungeonVersion = 2;
  const done = C.restore(cleared);
  assert(!done.zone().enemies.some((e) => e.guard && e.hp > 0));
  assert(done.s.normal[id]);
  assert(done.s.paid['clear:' + id]);
  console.log('PASS ' + id + ' layout migration retains dead guards, progression and clear state');
}
{
  const c = new C();
  c.enter('supply-highlands');
  const z = c.zone(),
    a = C.rules.treasuryArchitecture[z.id],
    captain = z.enemies.find((e) => e.roomCaptain);
  assert(a.walkable.some((r) => r.id === 'hearth-room'));
  assert.equal(captain.species, 'wolf');
  assert(!captain.ranged);
  assert(
    z.props.filter(
      (p) =>
        p.structure === 'sleep-roll' ||
        p.structure === 'ridge-bed' ||
        p.structure === 'game-table' ||
        p.structure === 'ridge-game-corner' ||
        p.structure === 'stone-seat',
    ).length >= 4,
    'the Treasury reads as a furnished residence',
  );
  for (const npc of z.npcs)
    assert(c.route(c.hero, npc).length, 'residence exit and every raid cache remain reachable');
  assert(c.route(c.hero, captain).length);
  c.s.discovered['highlands:bundle-1'] = true;
  captain.hp = 0;
  const state = c.snapshot();
  state.zones[z.id].treasuryVersion = 3;
  Object.assign(state.hero, { x: 870, y: 850 });
  Object.assign(state.party[0], { x: 870, y: 850 });
  const r = C.restore(state);
  assert(r.s.discovered['highlands:bundle-1']);
  assert.equal(r.zone().enemies.find((e) => e.id === captain.id).hp, 0);
  assert(!r.blocked(r.hero.x, r.hero.y));
  assert(r.activeParty().every((e) => !r.blocked(e.x, e.y)));
  console.log(
    'PASS Highlands residence preserves Wolf captain, raid circulation and saved cache/death state',
  );
}
for (const region of ['vale', 'march', 'highlands']) {
  const c = new C();
  c.enter(region);
  const z = c.zone(),
    props = z.props.filter((p) => p.regionalDistrict || p.ironrootDistrict);
  assert(props.length >= 3, region + ' has restrained support scenes');
  for (const p of props) {
    assert.equal(p.r, 0);
    assert(!c.blocked(p.x, p.y, region, 24));
    assert(!z.npcs.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 65));
    assert(
      !z.roads.some((route) =>
        route.some((b, j) => j && c.distanceToSegment(p, route[j - 1], b) < 60),
      ),
    );
  }
  for (const b of C.data.bosses.filter((b) => b.region === region && b.captive))
    c.s.rescued[b.id] = true;
  c.refreshNPCs();
  assert(
    props.every((p) => !z.npcs.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 65)),
    'future rescued services retain clear stands',
  );
  const before = props.map((p) => p.id);
  const r = C.restore(c.snapshot());
  assert.deepEqual(
    r
      .zone()
      .props.filter((p) => p.regionalDistrict || p.ironrootDistrict)
      .map((p) => p.id),
    before,
  );
  assert(
    z.props.some((p) => String(p.id).startsWith('stronghold-')),
    'existing creature homes remain',
  );
  console.log(
    'PASS ' + region + ' support furnishing avoids roads/services and persists without duplicates',
  );
}
assert.equal(
  C.rules.attacks.ridge.find((a) => a.kind === 'summon').species,
  'archer',
  'unresolved Ridge archers remain unchanged',
);
for (const role of ['pages', 'pump', 'submerged', 'alchemy', 'construction', 'coin-accounting']) {
  const e = { renderKind: 'prop', structure: 'supply-stack', decorative: true, sceneRole: role };
  assert.deepEqual(
    Sprites.candidateKeys(e),
    [],
    'generic sprite cannot erase contextual furnishing ' + role,
  );
}
console.log('PASS unresolved summon and procedural furnishing contracts remain intact');

{
  const c = new C();
  c.enter('vale');
  const z = c.zone();
  const orchard = z.props.filter((p) => p.regionalDistrict === 'hamlet-orchard');
  const carpentry = z.props.filter((p) => p.regionalDistrict === 'millhaven-carpentry');
  assert(
    orchard.filter((p) => p.structure === 'fruit-tree').length >= 3,
    'Orchard Hamlet retains a small visible productive fruit grove',
  );
  assert(
    orchard.some((p) => p.sceneRole === 'harvest'),
    'a small harvest delivery stays near the grove',
  );
  assert(
    carpentry.some((p) => p.structure === 'stacked-lumber'),
    'existing Millhaven workshop gains identifiable lumber',
  );
  const abandoned = z.npcs.find((n) => n.id === 'orchard');
  for (const p of [...orchard, ...carpentry]) {
    assert.equal(p.r, 0, 'small village scenery is decorative');
    assert(!c.blocked(p.x, p.y, 'vale', 24), 'village scenery has clear ground');
    assert(
      !z.roads.some((road) =>
        road.some((b, j) => j && c.distanceToSegment(p, road[j - 1], b) < 60),
      ),
      'village scenery stays off existing roads',
    );
  }
  assert(
    orchard.every((p) => Math.hypot(p.x - abandoned.x, p.y - abandoned.y) > 210),
    'productive grove remains distinct from the Abandoned Orchard',
  );
  const old = c.snapshot();
  old.zones.vale.regionalHandoffVersion = 1;
  old.zones.vale.props = old.zones.vale.props.filter(
    (p) => !['hamlet-orchard', 'millhaven-carpentry'].includes(p.regionalDistrict),
  );
  const upgraded = C.restore(old);
  assert.equal(upgraded.s.zones.vale.regionalHandoffVersion, 2);
  const upgradeProps = (state) =>
    state.zones.vale.props.filter((p) =>
      ['hamlet-orchard', 'millhaven-carpentry'].includes(p.regionalDistrict),
    );
  assert.deepEqual(
    upgradeProps(upgraded.snapshot()),
    upgradeProps(C.restore(upgraded.snapshot()).snapshot()),
    'regional scenery migration remains idempotent',
  );
  assert.equal(upgraded.hero.gold, c.hero.gold, 'currency remains unchanged');
  assert.deepEqual(upgraded.s.quests, c.s.quests, 'quests remain unchanged');
  console.log('PASS Greenwood livelihood and old-save scenery migration');
}

{
  const c = new C();
  c.enter('march');
  const z = c.zone();
  const trade = z.props.filter((p) => p.regionalDistrict === 'reedport-catch');
  const camp = z.props.filter((p) => p.regionalDistrict === 'camp-work');
  assert.equal(trade.length, 2, 'Reedport gains only two fishing trade details');
  assert(trade.some((p) => p.sceneRole === 'sorting' && p.structure === 'crate'));
  assert(trade.some((p) => p.sceneRole === 'delivery' && p.structure === 'cart'));
  assert(camp.some((p) => p.sceneRole === 'boat-maintenance' && p.structure === 'tool-rack'));
  for (const p of [...trade, ...camp]) {
    assert.equal(p.r, 0, 'fishing scenery has no collision radius');
    assert(!c.blocked(p.x, p.y, 'march', 24), 'fishing scenery is walkable');
    assert(
      !z.roads.some((road) =>
        road.some((b, j) => j && c.distanceToSegment(p, road[j - 1], b) < 60),
      ),
      'fishing scenery does not occupy an existing road',
    );
  }
  const old = c.snapshot();
  old.zones.march.regionalHandoffVersion = 1;
  old.zones.march.props = old.zones.march.props.filter(
    (p) => !['reedport-catch'].includes(p.regionalDistrict) && p.sceneRole !== 'boat-maintenance',
  );
  const migrated = C.restore(old);
  const selectedProps = (snapshot) =>
    snapshot.zones.march.props.filter(
      (p) => p.regionalDistrict === 'reedport-catch' || p.sceneRole === 'boat-maintenance',
    );
  assert.equal(migrated.s.zones.march.regionalHandoffVersion, 2);
  assert.deepEqual(
    selectedProps(C.restore(migrated.snapshot()).snapshot()),
    selectedProps(migrated.snapshot()),
    'old-save fishing scenery regenerates only once',
  );
  assert.equal(migrated.hero.gold, c.hero.gold, 'crowns stay unchanged');
  assert.deepEqual(migrated.s.quests, c.s.quests, 'quest progress stays unchanged');
  assert.deepEqual(migrated.s.rescued, c.s.rescued, 'specialist state stays unchanged');
  console.log('PASS Marches fishing trade scenery, paths and historical-save compatibility');
}

// Modern version-1 saves keep the exact existing scenery, including deliberately
// moved props and their place in the saved draw order. Only the new details append.
for (const region of ['vale', 'march']) {
  const c = new C();
  c.enter(region);
  const old = c.snapshot(),
    z = old.zones[region];
  const count = region === 'vale' ? 3 : 5;
  z.regionalHandoffVersion = 1;
  z.props = z.props.filter(
    (p) =>
      !String(p.id || '').startsWith('regional-handoff-') ||
      Number(p.id.slice('regional-handoff-'.length)) < count,
  );
  const first = z.props.find((p) => p.id === 'regional-handoff-0');
  first.x += 7;
  first.y += 11;
  const previous = JSON.parse(JSON.stringify(z.props));
  const migrated = C.restore(old);
  assert.deepEqual(
    migrated.s.zones[region].props.slice(0, previous.length),
    previous,
    'append-only migration preserves existing props/order/positions in ' + region,
  );
  assert.equal(migrated.s.zones[region].regionalHandoffVersion, 2);
}
console.log('PASS exact existing scenery preserved during modern save upgrade');
