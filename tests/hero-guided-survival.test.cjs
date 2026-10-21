'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let cases = 0;
function test(name, fn) {
  fn();
  cases++;
  console.log('PASS ' + name);
}
function scene(type = 'archer', cls = 'mage') {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  Object.assign(z, { props: [], nodes: [], npcs: [], buildings: [], enemies: [] });
  g.blocked = (x, y, zone, r = 15) => x < 50 + r || y < 50 + r || x > 2450 - r || y > 2450 - r;
  Object.assign(g.hero, { x: 950, y: 1500, cd: g.hero.cd.map(() => 100) });
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  g.setPartyChargeClock(() => g.s.time);
  const u = type.startsWith('pet:')
    ? g.unit('pet', 1150, 1500, type.slice(4))
    : g.unit(type, 1150, 1500);
  Object.assign(u, { hp: u.maxHp * 0.1, cd: 0, healCd: 100, skill1Cd: 100, skill2Cd: 100 });
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1000, y: 1500 },
  );
  Object.assign(e, { aggro: true, cd: 100, specialCd: 100 });
  z.enemies = [e];
  g._tacticalRogueNext = new Map([[e.id, Infinity]]);
  const step = (dt = 0.05) => {
    g.s.time += dt;
    g.updateParty(dt);
    g.resolveCompanionCharges();
  };
  return { g, z, u, e, step };
}
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of [
    'soldier',
    'archer',
    ...Object.keys(C.rules.petCompanions).map((k) => 'pet:' + k),
  ])
    test(cls + ' ' + type + ' follows the moving hero promptly', () => {
      const { g, u, step } = scene(type, cls);
      step();
      const before = { x: u.x, y: u.y };
      g.hero.y -= 20;
      const gap = distance(u, g.hero);
      step();
      assert(distance(u, g.hero) < gap);
      assert(u.y < before.y);
      assert(!g.partyChargeState(u));
      for (let n = 0; n < 12; n++) {
        g.hero.y -= 12;
        step();
      }
      assert(u.y < before.y - 50);
      assert(distance(u, g.hero) < 250);
    });
test('a pending charge cancels on the first actual hero movement, including late displacement', () => {
  for (const late of [false, true]) {
    const { g, u, e, step } = scene('soldier');
    u.skill2Cd = 0;
    step();
    assert(g.partyChargeState(u));
    const hp = e.hp;
    g.hero.y -= 20;
    if (late) {
      g.s.time += 1;
      g.resolveCompanionCharges();
    } else step();
    assert(!g.partyChargeState(u));
    assert.equal(e.hp, hp);
    assert.equal(u.skill2Cd, 0);
  }
});
test('following the moving hero wins even when a warning suggests a different independent escape', () => {
  const { g, u, e, step } = scene();
  step();
  e.telegraph = { kind: 'circle', x: 1000, y: 1500, radius: 190 };
  g.hero.x -= 15;
  const before = { x: u.x, y: u.y };
  step();
  assert(u.x < before.x, 'follows the hero rather than independently fleeing right');
  assert(u.y === before.y);
  assert(!g.s.projectiles.some((p) => p.source === u.id && p.x === u.x));
});
for (const target of ['single', 'overlap'])
  test('after the hero stops, ' + target + ' native area warnings are escaped locally', () => {
    const { g, z, u, e, step } = scene();
    step();
    g.hero.y -= 20;
    step();
    const mark = { x: u.x, y: u.y };
    const caster = g.makeEnemy(
      { species: 'goblin', level: 1, hp: 10000, damage: 60, gold: 0, xp: 0 },
      { x: 500, y: 1500 },
    );
    const a = {
      kind: 'circle',
      x: mark.x,
      y: mark.y,
      radius: 70,
      timer: 0.8,
      total: 0.8,
      recovery: 1,
      coefficient: 1,
    };
    if (target === 'overlap')
      a.arenaPatches = [
        { ...mark, radius: 70 },
        { x: mark.x + 75, y: mark.y, radius: 70 },
      ];
    Object.assign(caster, { aggro: true, cd: 100, specialCd: 100, telegraph: a });
    z.enemies.push(caster);
    g._tacticalRogueNext.set(caster.id, Infinity);
    const hp = u.hp;
    for (let n = 0; n < 17; n++) {
      step();
      g.updateEnemies(0.05);
    }
    assert(!g.attackPatches(a).some((p) => distance(u, p) < p.radius));
    assert.equal(u.hp, hp);
    assert(distance(u, g.hero) <= C.rules.companionJudgment.criticalFollowRadius);
  });
test('a newly marked line makes a stationary contributor move and cancel its cast', () => {
  const { g, u, e, step } = scene('soldier');
  u.skill2Cd = 0;
  step();
  assert(g.partyChargeState(u));
  e.telegraph = { kind: 'line', fromX: 900, fromY: u.y, x: 1300, y: u.y };
  const y = u.y;
  step();
  assert(!g.partyChargeState(u));
  for (let i = 0; i < 15; i++) step();
  assert(Math.abs(u.y - y) > C.rules.combatGeometry.lineHalfWidth);
  assert(distance(u, g.hero) < 420);
});
for (const kind of ['ranged', 'captain', 'boss'])
  test(
    'possible ' + kind + ' range permits screened contributions without offensive pursuit',
    () => {
      const { g, u, e, step } = scene();
      if (kind === 'ranged') Object.assign(e, { ranged: true, shotRange: 400 });
      if (kind === 'captain') Object.assign(e, { captain: true, captainProfile: 'supply-vale' });
      if (kind === 'boss') Object.assign(e, { type: 'boss', family: 'thorn' });
      assert(g.companionSafeContribution(u, e));
      step();
      assert(g.s.projectiles.some((p) => p.source === u.id));
      const p = { x: u.x, y: u.y };
      step();
      assert.equal(distance(u, p), 0);
      u.x = 1100;
      g.hero.x = 1150;
      e.x = 1420;
      g.updateCompanionHeroGuidance();
      g.updateCompanionHeroGuidance();
      const gap = distance(u, e);
      step();
      assert(distance(u, e) >= gap, 'never advances to regain attack range');
      assert(g.companionRetreatMode(u));
    },
  );
test('outdoor spikes cause relocation instead of holding fire on the native trap', () => {
  const { g, z, u, e, step } = scene();
  const trap = g.traps()[0];
  assert(trap);
  Object.assign(u, { x: trap.x, y: trap.y });
  Object.assign(e, { x: trap.x - 150, y: trap.y });
  Object.assign(g.hero, { x: trap.x - 200, y: trap.y });
  z.clock =
    trap.warningTime +
    0.05 -
    trap.index * (C.rules.outdoorMiniTrapTuning[z.id]?.offset || 1.35) +
    trap.cycleLength * 100;
  assert(!g.companionSafeContribution(u, e));
  for (let i = 0; i < 12; i++) step();
  assert(!g.trapContains(trap, u));
  assert(u.hp > 0);
});
test('native Dreadmaw vapor no longer pins a wounded ranged companion until death', () => {
  const { g, z, u, e, step } = scene();
  const caster = g.makeEnemy(
    { species: 'ashbeast', level: 1, hp: 10000, damage: 50, gold: 0, xp: 0 },
    { x: 450, y: 1500 },
  );
  Object.assign(caster, {
    roomCaptain: true,
    captain: true,
    captainProfile: 'supply-crown',
    aggro: true,
    dreadVapors: [
      {
        x: u.x,
        y: u.y,
        radius: 66,
        kind: 'circle',
        life: 2,
        age: 0,
        tick: 0,
        coefficient: 0.12,
        skill: 6,
        tickInterval: 0.55,
      },
    ],
  });
  z.enemies.push(caster);
  const mark = { x: u.x, y: u.y };
  assert(!g.companionSafeContribution(u, e));
  for (let i = 0; i < 30; i++) {
    step();
    g.updateCinderRegularState(caster, 0.05);
  }
  assert(u.hp > 0);
  assert(distance(u, mark) > 66);
  assert(distance(u, g.hero) < 420);
});
test('an expanding native ring permits its cleared interior and blocks the approaching wave', () => {
  const { g, u, e } = scene();
  const ring = {
    kind: 'ring',
    family: 'mine',
    x: u.x - 50,
    y: u.y,
    radius: 180,
    age: 1,
    life: 3,
    tick: 0,
    hit: [],
    damage: 50,
  };
  g.s.hazards = [ring];
  assert(g.companionSafeContribution(u, e));
  const hp = u.hp;
  g.updateProjectiles(0.01);
  assert.equal(u.hp, hp);
  ring.x = u.x - 220;
  assert(!g.companionSafeContribution(u, e));
});
test('cone backs, dual-line clear lanes and separated circle patches remain usable', () => {
  const { g, u, e } = scene();
  e.telegraph = { kind: 'cone', x: e.x, y: e.y, angle: Math.PI, radius: 250 };
  assert(g.companionSafeContribution(u, e));
  e.telegraph = { kind: 'line', count: 2, fromX: 900, fromY: 1500, x: 1350, y: 1500, angle: 0 };
  assert(g.companionSafeContribution(u, e));
  u.y = 1585;
  assert(!g.companionSafeContribution(u, e));
});
test('no combatant is required for a critical companion to leave an active environmental warning', () => {
  const { g, z, u, step } = scene();
  z.enemies = [];
  g.s.hazards = [{ kind: 'circle', x: u.x, y: u.y, radius: 50, life: 2, damage: 20, tick: 0 }];
  const mark = { x: u.x, y: u.y };
  for (let n = 0; n < 12; n++) step();
  assert(distance(u, mark) > 50);
  assert(distance(u, g.hero) < 420);
});
test('Recall and transient guidance save/restore stay intact', () => {
  const { g, z, u, e, step } = scene();
  const healthy = g.unit('archer', 1160, 1520);
  g.s.party.push(healthy);
  g.recallParty();
  for (let n = 0; n < 30; n++) step();
  assert(distance(u, g.hero) <= C.rules.companionJudgment.maxAdvanceFromHero);
  assert(!g.partyChargeState(u));
  g.hero.cd = g.hero.cd.map(() => 0);
  const snapshot = g.snapshot();
  assert(!('survivalRetreat' in snapshot.party[0]));
  const restored = C.restore(snapshot);
  assert(restored);
  assert(!restored.companionHeroMoving());
});
test('a companion ahead of the hero copies his dodge direction instead of being pulled backward into the warning', () => {
  const { g, u, e, step } = scene();
  step();
  e.telegraph = { kind: 'circle', x: u.x - 50, y: u.y, radius: 90 };
  const x = u.x;
  g.hero.x += 20;
  step();
  assert(u.x > x);
  assert(g.hero.x < u.x);
  assert(!g.partyChargeState(u));
});
test('a clear companion stops following immediately when the hero stops; stationary holding has no retreat defense', () => {
  const { g, u, step } = scene();
  step();
  g.hero.y -= 20;
  step();
  const p = { x: u.x, y: u.y };
  step();
  assert.equal(distance(u, p), 0);
  assert(!g.companionRetreating(u));
});
test('copying movement retains actual enemy and terrain collision', () => {
  for (const blocked of ['enemy', 'wall']) {
    const { g, u, e, step } = scene();
    if (blocked === 'enemy') u.x = 1100;
    else
      g.blocked = (x, y, zone, r = 15) =>
        x > 1080 - r && x < 1090 + r && y > 1300 - r && y < 1700 + r;
    step();
    for (let n = 0; n < 10; n++) {
      g.hero.x -= 15;
      step();
      assert(!g.blocked(u.x, u.y, g.zoneId, g.actorRadius(u)));
      assert(distance(u, e) >= g.actorRadius(u) + g.actorRadius(e) - 0.1);
    }
  }
});
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const role of ['soldier', 'archer', 'pet:ridge', 'pet:archive'])
    test(
      cls + ' ' + role + ' guides at 20% only; 21% retains its prepared attack during a hero dodge',
      () => {
        for (const fraction of [0.2, 0.21]) {
          const { g, u, e, step } = scene(role, cls);
          u.hp = u.maxHp * fraction;
          u.skill2Cd = 0;
          assert(g.companionUseSecondSkill(u, e));
          g.updateCompanionHeroGuidance();
          const before = { x: u.x, y: u.y };
          g.hero.y -= 20;
          step();
          assert.equal(!!g.partyChargeState(u), fraction > 0.2);
          if (fraction > 0.2) assert.equal(distance(u, before), 0);
          else assert(u.y < before.y);
        }
      },
    );
console.log('PASS ' + cases + ' hero-guided survival scenarios');
