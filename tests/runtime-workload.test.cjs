'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const frozen = require('./fixtures/runtime-workload-dev175.json');
class B extends C {}
B.prototype.retireSpentReinforcements = () => 0;
for (const [kind, methods] of Object.entries(frozen)) {
  if (kind === 'source') continue;
  const klass = Function(
    'D',
    'R',
    'dungeonIds',
    'dist',
    'crownPostDistances',
    'sceneryReady',
    'return class {\n' + Object.values(methods).join('\n') + '\n}',
  )(
    C.data,
    C.rules,
    C.dungeonIds,
    (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    new WeakMap(),
    new WeakSet(),
  );
  const descriptors = Object.getOwnPropertyDescriptors(klass.prototype);
  delete descriptors.constructor;
  Object.defineProperties(B.prototype, descriptors);
}
// The workload baseline freezes old combat methods, not regional geography.
// Apply the approved new March connection to both sides before comparing
// exact game states; preserve all native route and combat assertions.
const frozenAuthoredPlaces = B.prototype.authoredPlaces;
B.prototype.authoredPlaces = function (z) {
  const result = frozenAuthoredPlaces.call(this, z);
  this.marchTownRoadLink(z);
  return result;
};
// Different native dungeon rosters plus actual hero-participation elite receipts.
for (const id of C.dungeonIds) {
  const p = pair(id),
    originals = p.a.zone().enemies.map((e) => e.id);
  for (let wave = 0; wave < 3; wave++) {
    for (const g of [p.a, p.b]) {
      for (const e of [...g.zone().enemies])
        if (e.guard && e.hp > 0) {
          e.heroParticipated = !!e.reinforcement;
          e.hp = 0;
          g.kill(e);
        }
      g.updateGuardianReinforcements(18.01);
      g.updateElites(2.01);
    }
    const ids = new Set(p.a.zone().enemies.map((e) => e.id)),
      old = structuredClone(p.b.s);
    for (const original of originals) assert(ids.has(original), id + ' keeps original ' + original);
    assert.deepEqual(
      p.a
        .zone()
        .enemies.filter((e) => e.hp > 0)
        .map((e) => e.id),
      p.b
        .zone()
        .enemies.filter((e) => e.hp > 0)
        .map((e) => e.id),
      id + ' living/elite roster',
    );
    old.zones[id].enemies = old.zones[id].enemies.filter((e) => ids.has(e.id));
    assert.deepEqual(p.a.s, old, id + ' actual elite/kill/spawn state');
    assert.deepEqual(p.a.effects, p.b.effects, id + ' actual elite events');
    assert.equal(p.ra.calls(), p.rb.calls(), id + ' random stream');
    p.a.effects.length = 0;
    p.b.effects.length = 0;
  }
}
console.log(
  'PASS all native dungeon rosters: paid hero kills, elite arrivals, original bodies and live waves preserved',
);
function rng() {
  let s = 731,
    n = 0;
  const f = () => {
    n++;
    return (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  };
  f.calls = () => n;
  return f;
}
function pair(id) {
  const ra = rng(),
    rb = rng(),
    a = new C('normal', 'paladin', ra),
    b = new B('normal', 'paladin', rb);
  a.enter(id);
  b.enter(id);
  return { a, b, ra, rb };
}
function equal(p, label) {
  assert.deepEqual(p.a.s, p.b.s, label + ' state');
  assert.deepEqual(p.a.effects, p.b.effects, label + ' events');
  assert.equal(p.ra.calls(), p.rb.calls(), label + ' random');
}
for (const id of ['vale', 'frontier', 'crown', 'mine', 'citadel']) {
  const p = pair(id);
  equal(p, id + ' setup');
  for (let i = 0; i < 36; i++) {
    for (const g of [p.a, p.b]) g.tick(1 / 60, { x: i < 18 ? 1 : 0, y: 0 });
    equal(p, id + ' tick ' + i);
  }
  for (const g of [p.a, p.b]) {
    g.enter('march');
    g.enter(id);
    g.s = structuredClone(g.s);
    g.zone();
  }
  equal(p, id + ' travel/replaced zone');
  for (const change of [
    (e) => {
      e.home = { x: 800, y: 900 };
    },
    (e) => {
      e.ranged = !e.ranged;
      e.name = 'changed';
    },
    (e) => {
      e.forcedRole = 'ranged';
      e.shotSpeed = 999;
    },
    (e) => {
      e.neutral = !e.neutral;
    },
  ]) {
    for (const g of [p.a, p.b]) {
      change(g.s.zones[id].enemies[0]);
      g.zone();
    }
    equal(p, id + ' mutable roster');
  }
}
{
  const p = pair('crown');
  let count = 0;
  const f = p.a.configureEnemy;
  p.a.configureEnemy = function (...a) {
    count++;
    return f.apply(this, a);
  };
  for (let i = 0; i < 100; i++) {
    p.a.zone();
    p.b.zone();
  }
  equal(p, '100 reads');
  assert.equal(count, 0, 'already-correct military roles need no rewrite');
}
for (const id of ['frontier', 'crown', 'crypt']) {
  const p = pair(id);
  for (const g of [p.a, p.b]) {
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    g.hero.level = 5;
    g.hero.immune = 100;
    const enemy = g.zone().enemies.find((e) => e.type === 'mob' && e.hp > 0 && !e.neutral);
    assert(enemy, id + ' has a native combat actor');
    Object.assign(g.hero, g.safe(enemy.x + 65, enemy.y + 65));
    enemy.aggro = true;
    enemy.heroParticipated = true;
    enemy.fightStart = g.s.time;
  }
  for (let tick = 0; tick < 60; tick++) {
    for (const g of [p.a, p.b]) g.tick([1 / 60, 1 / 30, 0.05][tick % 3]);
    equal(p, id + ' engaged combat ' + tick);
    p.a.effects.length = 0;
    p.b.effects.length = 0;
  }
}
console.log(
  'PASS world setup, same-step combat/movement, travel, mutable roles, RNG and events against dev.175',
);
function geometry(K) {
  const g = new K('developer', 'paladin', () => 0.73);
  g.s.party = [];
  const z = g.zone();
  z.enemies = [];
  z.props = Array.from({ length: 240 }, (_, i) => ({
    id: 'p' + i,
    x: 200 + (i % 20) * 140,
    y: 1300 + Math.floor(i / 20) * 120,
    r: 22,
  }));
  return g;
}
{
  const a = geometry(C),
    b = geometry(B);
  function checks(label) {
    for (const r of [0, 1, 15, 26, 80])
      for (const dy of [-22, 0, 22, 70]) {
        const from = { x: 160, y: 1500 + dy },
          to = { x: 1000, y: 1500 + dy };
        assert.equal(a.line(from, to), b.line(from, to), label + ' LOS');
        assert.equal(a.clearSegment(from, to, r), b.clearSegment(from, to, r), label + ' sweep');
      }
    assert.deepEqual(a.safe(480, 1480), b.safe(480, 1480), label + ' safe');
  }
  checks('initial');
  for (const change of [
    (z) => {
      z.props[0].x = 700;
      z.props[0].y = 1500;
      z.props[0].r = 190;
    },
    (z) => {
      z.props[0].decorative = true;
    },
    (z) => {
      z.props[0].structure = 'house';
    },
    (z) => {
      delete z.props[0].r;
    },
    (z) => {
      z.props[0] = { id: 'replacement', x: 700, y: 1500, r: 30 };
    },
    (z) => {
      z.props.push({ id: 'added', x: 690, y: 1500, r: 45 });
    },
    (z) => {
      z.props.splice(0, 1);
    },
    (z) => {
      z.props = z.props.slice().reverse();
    },
  ]) {
    change(a.s.zones.vale);
    change(b.s.zones.vale);
    checks('edit');
  }
  assert.deepEqual(
    a.route({ x: 300, y: 1450 }, { x: 1000, y: 1720 }),
    b.route({ x: 300, y: 1450 }, { x: 1000, y: 1720 }),
    'route result',
  );
  const old = a.blocked;
  a.blocked = () => {
    throw Error('probe');
  };
  assert.throws(() => a.clearSegment({ x: 200, y: 1500 }, { x: 900, y: 1500 }), /probe/);
  a.blocked = old;
  checks('exception cleanup');
  const samples = [B, C].map((K) => {
    const game = geometry(K), stats = { visits: 0 };
    game.s.zones.vale.props = Array.from({ length: 600 }, (_, i) => {
      const p = {
        id: 'distant' + i,
        x: 200 + (i % 20) * 140,
        y: 2000 + Math.floor(i / 20) * 15,
        r: 20,
      };
      Object.defineProperty(p, 'decorative', {
        get() {
          stats.visits++;
          return false;
        },
      });
      return p;
    });
    return { game, stats };
  });
  // The old [200,1500]-[1000,1500] lane now crosses Greenwood's
  // reconstructed terrain. Choose ONE identical genuinely open test segment
  // for both versions so the same 600 distant blockers are still measured.
  // The broadphase deliberately uses the first eight checks without a
  // shortlist. Short (300-unit) lanes cannot substantiate a 10x reduction:
  // restore the original >=800-unit physical workload.
  const corridors = [];
  for (const y of [180, 300, 450, 600, 800, 1000, 1200, 1450, 1650, 1850, 2100, 2450])
    for (const x of [180, 300, 450, 600, 800, 1050, 1300, 1550, 1800, 2100, 2300]) {
      if (x + 840 < 3120)
        corridors.push([{ x, y }, { x: x + 840, y }]);
      if (y + 840 < 3120)
        corridors.push([{ x, y }, { x, y: y + 840 }]);
    }
  // Measure only genuinely open corridors shared by both methods.
  // The former first-match case exited before enough scene probes to test the optimization.
  const measured = corridors.flatMap((corridor) => {
    const clear = samples.every(({ game }) => game.clearSegment(...corridor));
    if (!clear) return [];
    const counts = samples.map(({ game, stats }) => {
      stats.visits = 0;
      assert(game.clearSegment(...corridor));
      return stats.visits;
    });
    return [{ corridor, counts }];
  });
  assert(measured.length, 'both implementations retain a shared 840-unit walkable test corridor');
  measured.sort((a, b) => b.counts[0] - a.counts[0]);
  const { corridor, counts } = measured[0];
  console.log('NATIVE BROADPHASE OPEN-CORRIDOR', JSON.stringify({ corridor, counts, sampleCount: measured.length }));
  assert(counts[0] > 0, 'original broadphase must inspect distant props');
  assert(counts[1] < counts[0] / 10,
    'broadphase shortlist must reduce actual prop checks by at least 10x');
  console.log(
    'PASS collision equivalence, immediate edits, route/exception safety; candidate visits ' +
      counts.join(' -> '),
  );
}
{
  const p = pair('crypt'),
    rows = [];
  const nativeIds = p.a
    .zone()
    .enemies.filter((e) => !e.reinforcement)
    .map((e) => e.id);
  for (let wave = 0; wave < 30; wave++) {
    for (const g of [p.a, p.b]) {
      for (const e of [...g.zone().enemies])
        if (e.guard && e.hp > 0) {
          e.hp = 0;
          g.kill(e);
        }
      g.updateGuardianReinforcements(18.01);
    }
    const old = structuredClone(p.b.s),
      ids = new Set(p.a.s.zones.crypt.enemies.map((e) => e.id));
    old.zones.crypt.enemies = old.zones.crypt.enemies.filter((e) => ids.has(e.id));
    assert.deepEqual(p.a.s, old, 'wave ' + wave + ' surviving mechanics');
    for (const id of nativeIds) assert(ids.has(id), 'every original body remains: ' + id);
    assert.deepEqual(
      p.a
        .zone()
        .enemies.filter((e) => e.hp > 0)
        .map((e) => e.id),
      p.b
        .zone()
        .enemies.filter((e) => e.hp > 0)
        .map((e) => e.id),
      'all living actors remain',
    );
    assert.deepEqual(p.a.effects, p.b.effects);
    assert.equal(p.ra.calls(), p.rb.calls());
    p.a.effects.length = 0;
    p.b.effects.length = 0;
    if ([0, 9, 29].includes(wave))
      rows.push([wave + 1, p.b.zone().enemies.length, p.a.zone().enemies.length]);
  }
  assert(p.a.zone().enemies.length <= 20);
  assert(p.b.zone().enemies.length > 100);
  assert(C.validate(p.a.snapshot()));
  assert(C.restore(p.a.snapshot(), () => 0.73));
  const g = p.a,
    z = g.zone(),
    e = z.enemies.find((e) => e.reinforcement);
  e.hp = 0;
  g.kill(e);
  for (const ref of ['projectile', 'target-projectile', 'hazard', 'pending', 'order', 'healing']) {
    g.s.projectiles = [];
    g.s.hazards = [];
    g.s.pending = {};
    g.hero.order = null;
    delete g.hero.supportHeal;
    if (ref === 'projectile') g.s.projectiles.push({ sourceId: e.id });
    if (ref === 'target-projectile') g.s.projectiles.push({ target: e.id });
    if (ref === 'hazard') g.s.hazards.push({ sourceId: e.id });
    if (ref === 'pending') g.s.pending.probe = { base: { id: e.id } };
    if (ref === 'order') g.hero.order = { type: 'attack', id: e.id };
    if (ref === 'healing') g.hero.supportHeal = { source: e.id };
    g.retireSpentReinforcements(z);
    assert(z.enemies.includes(e), ref + ' retention');
  }
  g.s.projectiles = [];
  g.s.hazards = [];
  g.s.pending = {};
  g.hero.order = null;
  delete g.hero.supportHeal;
  for (const [key, value] of Object.entries({
    reinforcement: false,
    guard: false,
    deathPaid: false,
    type: 'boss',
    form: 'ringleader',
    neutral: true,
    summon: true,
    captain: true,
    roomCaptain: true,
    family: 'crypt',
    owner: 'owner',
    respawn: 1,
    supportHeal: {},
  })) {
    const owned = Object.hasOwn(e, key),
      before = e[key];
    e[key] = value;
    g.retireSpentReinforcements(z);
    assert(z.enemies.includes(e), 'excluded record: ' + key);
    if (owned) e[key] = before;
    else delete e[key];
  }
  e.species = 'wolf';
  const commander = g.makeEnemy(
    { species: 'wolf', name: 'Revival audit', level: 5, hp: 100, damage: 1, gold: 0, xp: 0 },
    e.home,
  );
  Object.assign(commander, { type: 'boss', family: 'ridge' });
  z.enemies.push(commander);
  g.retireSpentReinforcements(z);
  assert(z.enemies.includes(e), 'revival preservation');
  g.tacticalRogueCommanderSupport(commander, {
    reinforceSpecies: 'wolf',
    reinforceCap: 1,
    reinforceBelow: 0,
    rallySeconds: 2,
  });
  assert(e.hp > 0, 'the preserved body can actually return through native commander support');
  e.hp = 0;
  g.kill(e);
  z.enemies.splice(z.enemies.indexOf(commander), 1);
  assert.equal(g.retireSpentReinforcements(z), 1);
  assert(
    z.enemies.some((e) => e.guard && !e.reinforcement && e.hp <= 0),
    'native bodies preserved',
  );
  console.log(
    'PASS 30 native waves, rewards/events/RNG, source/elite/revival retention, v4 round trip; [wave,old,new] ' +
      JSON.stringify(rows),
  );
}
