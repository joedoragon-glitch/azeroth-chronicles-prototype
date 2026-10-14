'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const rogue = require('./fixtures/snapshot-dread-rogue.json'),
  crypto = require('node:crypto');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
assert.equal(
  sha(JSON.stringify(C.rules.tacticalFoundation)),
  rogue.ruleSha256,
  'Rogue rule table remains exact',
);
for (const [method, expected] of Object.entries(rogue.methods))
  assert.equal(
    sha(C.prototype[method].toString()),
    expected,
    method + ' unchanged from certified b87e22dc',
  );
const plans = C.rules.roomCaptains['supply-crown'].attacks;
assert.deepEqual(
  plans.map((p) => p.name),
  [
    'Subsoiling',
    'Transhumance',
    'Ensiling',
    'Nucleus Herd',
    'Purse-Seine Closure',
    'Creep Feeding',
    'Evapotranspiration',
  ],
);
function setup(mode = 'normal', heroClass = 'mage', random = () => 0.9, options = {}) {
  const c = new C(mode, heroClass, random, options);
  c.enter('supply-crown');
  c.s.party = [];
  const e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
  c.zone().enemies = c.zone().enemies.filter((u) => u === e);
  Object.assign(c.hero, c.safe(e.x + 80, e.y), { hp: 1e6, maxHp: 1e6, immune: 1e6 });
  c.s.mercyTime = 0;
  c.engage(e, true, false);
  e.cd = e.specialCd = 1e6;
  c._tacticalRogueNext = new Map([[e.id, 1e6]]);
  return { c, e };
}
function advance(c, dt = 0.05) {
  c.s.time += dt;
  c.updateEnemies(dt);
}
function cast(c, e, index) {
  e.summonCd = 0;
  const built = c.buildDreadAttack(e, c.hero, index);
  assert(built, plans[index].name + ' fits real Treasury');
  e.telegraph = built.first;
  e.sequence = built.sequence;
  return built;
}
let realCasts = 0;
for (const mode of ['normal', 'nightmare'])
  for (const heroClass of ['paladin', 'mage', 'ranger'])
    for (let index = 0; index < 7; index++) {
      const { c, e } = setup(mode, heroClass);
      if (index === 5) c.summonCaptainAdds(e);
      c.startCaptainAttack = () => false;
      const built = cast(c, e, index),
        events = [];
      const event = c.event;
      c.event = function (type, data) {
        events.push({ type, ...data });
        return event.call(this, type, data);
      };
      let legOne = null,
        secondWarn = null;
      const before = { x: e.x, y: e.y };
      for (let frame = 0; frame < 260; frame++) {
        if (e.telegraph?.dreadLeg === 2) {
          secondWarn ||= { ...e.telegraph };
          legOne ||= { x: e.x, y: e.y };
        }
        const old = { x: e.x, y: e.y };
        e.cd = 1e6;
        advance(c);
        assert(!c.blocked(e.x, e.y, c.zoneId, 15), 'captain stays on authored floor');
        assert(c.clearSegment(old, e, 15), 'each motion step remains collision safe');
      }
      assert.equal(e.telegraph, null);
      assert.equal(e.motion, null);
      assert.equal(e.sequence.length, 0);
      if (index === 1) {
        assert(
          secondWarn,
          'second rush warning runs through actual update, without manual queue advancement',
        );
        assert(Math.hypot(legOne.x - built.first.x, legOne.y - built.first.y) < 1e-6);
        assert.equal(secondWarn.fromX, legOne.x);
        assert.equal(secondWarn.fromY, legOne.y);
        const a = { x: legOne.x - before.x, y: legOne.y - before.y },
          b = { x: e.x - legOne.x, y: e.y - legOne.y };
        assert(Math.abs(a.x * b.x + a.y * b.y) < 1e-5, 'two real perpendicular motion legs');
        assert(events.some((x) => x.type === 'warning' && x.index === 1));
      }
      if (index === 3) {
        const brood = c.captainOwnedSummons(e);
        assert.equal(brood.length, 4);
        assert.equal(brood.filter((u) => u.ranged).length, 1);
        assert.equal(c.summonCaptainAdds(e), 0);
        for (const u of brood) {
          assert(!c.blocked(u.x, u.y, c.zoneId, 12));
          assert(c.route(u, c.hero).length, 'all broodlings can reach player');
        }
      }
      assert(!e.dreadClosure);
      assert(!(e.dreadVapors || []).length);
      assert(c.captainOwnedSummons(e).every((u) => !u.dreadFeedUntil));
      realCasts++;
    }
// The ring must advertise two full-width, traversable exits and a bounded blast.
{
  const { c, e } = setup();
  const ring = c.dreadClosurePlan(e),
    p = plans[4];
  assert(ring);
  assert.equal(ring.gaps.length, 2);
  for (const angle of ring.gaps)
    for (let j = 0; j < 9; j++) {
      const a = angle + (j / 8 - 0.5) * p.gapWidth,
        point = {
          x: e.x + Math.cos(a) * (ring.initialRadius + p.width + 15),
          y: e.y + Math.sin(a) * (ring.initialRadius + p.width + 15),
        };
      assert(c.clearSegment(e, point, 15));
      assert(!c.blocked(point.x, point.y, c.zoneId, 15));
    }
  assert(ring.finalBlastRadius < ring.finalRadius, 'outer escape paths survive final blast');
  const built = cast(c, e, 4);
  c.resolveAttack(e);
  e.telegraph = null;
  const closedAngle = ring.gaps[0] + Math.PI;
  Object.assign(c.hero, {
    x: e.x + Math.cos(closedAngle) * ring.initialRadius,
    y: e.y + Math.sin(closedAngle) * ring.initialRadius,
    immune: 0,
  });
  // Pick a real closed arc visible through the room rather than a wall-covered point.
  for (let j = 0; j < 72; j++) {
    const a = (j * Math.PI) / 36;
    if (
      ring.gaps.some(
        (g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) <= p.gapWidth / 2,
      )
    )
      continue;
    const point = {
      x: e.x + Math.cos(a) * ring.initialRadius,
      y: e.y + Math.sin(a) * ring.initialRadius,
    };
    if (!c.blocked(point.x, point.y, c.zoneId, 12) && c.line(e, point)) {
      Object.assign(c.hero, point);
      break;
    }
  }
  const hp = c.hero.hp;
  c.updateCinderRegularState(e, 0);
  assert(c.hero.hp < hp, 'contracting closed arc deals actual damage');
  e.dreadClosure.tick = 0;
  Object.assign(c.hero, {
    x: e.x + Math.cos(ring.gaps[0]) * ring.initialRadius,
    y: e.y + Math.sin(ring.gaps[0]) * ring.initialRadius,
  });
  const safeHp = c.hero.hp;
  c.updateCinderRegularState(e, 0);
  assert.equal(c.hero.hp, safeHp, 'advertised opening excludes ring damage');
  Object.assign(c.hero, { x: e.x, y: e.y });
  e.dreadClosure.age = p.duration - 0.05;
  advance(c);
  assert(c.hero.hp < safeHp, 'delayed center explosion deals real damage');
  assert(!e.dreadClosure);
  assert.equal(built.first.radius, ring.initialRadius);
}
// Feeding changes living owned brood readiness/movement, never HP/count/foreign actors.
{
  const { c, e } = setup();
  c.summonCaptainAdds(e);
  const brood = c.captainOwnedSummons(e);
  brood[0].hp -= 10;
  const dead = brood[1];
  dead.hp = 0;
  const hp = brood.map((u) => u.hp),
    ids = c.zone().enemies.map((u) => u.id);
  const foreign = { ...brood[2], id: 'foreign-brood', owner: 'other', cd: 3 };
  c.zone().enemies.push(foreign);
  cast(c, e, 5);
  c.resolveAttack(e);
  e.telegraph = null;
  for (const u of brood.filter((u) => u.hp > 0)) {
    assert.equal(c.ownedSummonMovementFactor(u), plans[5].movementFactor);
    u.cd = 3;
    c.updateCinderRegularState(u, 0.5);
    assert(Math.abs(u.cd - (3 - 0.5 * (plans[5].readinessFactor - 1))) < 1e-9);
    const expiry = u.dreadFeedUntil;
    cast(c, e, 5);
    c.resolveAttack(e);
    e.telegraph = null;
    assert.equal(u.dreadFeedUntil, expiry, 'active modifier cannot stack or refresh');
  }
  assert(!dead.dreadFeedUntil);
  assert(!foreign.dreadFeedUntil);
  assert.equal(c.ownedSummonMovementFactor(foreign), 1);
  assert.deepEqual(
    brood.map((u) => u.hp),
    hp,
  );
  assert.deepEqual(
    c
      .zone()
      .enemies.filter((u) => u !== foreign)
      .map((u) => u.id),
    ids,
  );
  c.s.time += plans[5].duration + 0.01;
  for (const u of brood) {
    c.updateCinderRegularState(u, 0.01);
    assert.equal(c.ownedSummonMovementFactor(u), 1);
    assert(!u.dreadFeedUntil);
  }
}
// Save/raw restore/travel/cancel sanitize transient agriculture without changing live snapshot input.
for (const end of ['snapshot', 'raw-restore', 'travel', 'cancel', 'peace']) {
  const { c, e } = setup();
  c.summonCaptainAdds(e);
  cast(c, e, 5);
  c.resolveAttack(e);
  cast(c, e, 4);
  c.resolveAttack(e);
  cast(c, e, 2);
  c.resolveAttack(e);
  e.telegraph = null;
  assert(e.dreadClosure);
  assert(e.dreadVapors.length);
  const before = JSON.stringify(c.s);
  if (end === 'snapshot' || end === 'raw-restore') {
    const source = end === 'snapshot' ? c.snapshot() : JSON.parse(before);
    assert.equal(JSON.stringify(c.s), before, 'snapshot does not mutate active fight');
    const restored = C.restore(source, () => 0.9),
      boss = restored.s.zones['supply-crown'].enemies.find((u) => u.id === e.id);
    assert(!boss.dreadClosure);
    assert(!boss.dreadVapors);
    assert(restored.s.zones['supply-crown'].enemies.every((u) => !u.dreadFeedUntil));
  } else {
    if (end === 'travel') c.enter('crown');
    if (end === 'cancel') c.cancelEncounter(e);
    if (end === 'peace') {
      c.s.phase = 'peace';
      c.updateCinderRegularState(e, 0.1);
    }
    assert(!e.dreadClosure);
    assert(!e.dreadVapors);
    if (end !== 'peace') assert(c.s.zones['supply-crown'].enemies.every((u) => !u.dreadFeedUntil));
  }
}
// Actual fatal boundaries stop the current attack and discard every owned effect.
let fatalities = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const succession of [false, true])
    for (const kind of ['fracture', 'rush', 'cone', 'vapor', 'steam', 'ring', 'blast']) {
      const { c, e } = setup('normal', cls, () => 0.9, { succession });
      c.hero.hp = 1;
      c.hero.immune = 0;
      e.damage = 1e6;
      const index = { fracture: 0, rush: 1, cone: 2, vapor: 2, steam: 6, ring: 4, blast: 4 }[kind];
      const built = cast(c, e, index);
      if (kind === 'fracture' || kind === 'steam')
        Object.assign(c.hero, { x: built.first.x, y: built.first.y });
      if (kind === 'rush') Object.assign(c.hero, { x: e.x + 5, y: e.y });
      if (kind === 'vapor') c.hero.immune = 1;
      c.resolveAttack(e);
      if (kind === 'rush') c.advanceMotion(e, 0.05);
      if (kind === 'vapor') {
        c.hero.immune = 0;
        c.updateCinderRegularState(e, 0);
      }
      if (kind === 'ring' || kind === 'blast') {
        const ring = e.dreadClosure;
        assert(ring);
        if (kind === 'blast') {
          Object.assign(c.hero, { x: ring.x, y: ring.y });
          ring.age = ring.duration;
        } else {
          let point = null;
          for (let j = 0; j < 72; j++) {
            const a = (j * Math.PI) / 36;
            if (
              ring.gaps.some(
                (g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) <= ring.gapWidth / 2,
              )
            )
              continue;
            const p = {
              x: ring.x + Math.cos(a) * ring.radius,
              y: ring.y + Math.sin(a) * ring.radius,
            };
            if (!c.blocked(p.x, p.y, c.zoneId, 12) && c.line(ring, p)) {
              point = p;
              break;
            }
          }
          assert(point);
          Object.assign(c.hero, point);
        }
        c.updateCinderRegularState(e, 0);
      }
      assert.equal(c.s.statistics.deaths, 1, kind + ' produces one real fatal event');
      assert(!e.dreadClosure && !e.dreadVapors && !e.motion && !e.telegraph);
      assert(!c.s.hazards.length && !c.s.projectiles.length);
      assert.equal(c.hero.slow || 0, 0, 'no stale slow on revived/pending hero');
      fatalities++;
    }
// Contextual selector exposes all seven slots through live update in seeded pilots.
const all = new Set();
let pilots = 0;
for (let seed = 1; seed <= 12; seed++) {
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const { c, e } = setup('normal', 'mage', random);
  e.specialCd = 0;
  e.cd = 0;
  for (let frame = 0; frame < 3200; frame++) {
    const destinations = [
      { x: 785, y: 650 },
      { x: 680, y: 700 },
      { x: 650, y: 630 },
    ];
    c.move(c.hero, destinations[Math.floor(frame / 400) % destinations.length], 220, 0.05);
    if (frame % 700 === 699) {
      const brood = c.captainOwnedSummons(e);
      if (brood[0]) brood[0].hp = 0;
    }
    advance(c, 0.05);
    if (e.telegraph?.captainSkill && !e.telegraph.rogueMove) all.add(e.telegraph.index);
  }
  pilots++;
}
assert.deepEqual([...all].sort(), [0, 1, 2, 3, 4, 5, 6]);
console.log(
  `PASS Dreadmaw: ${realCasts} live casts across classes/modes, two real L-rush legs, traversable ring openings, finite feeding, save/travel cleanup ${fatalities} fatal recovery boundaries and ${pilots} contextual scheduler pilots`,
);
