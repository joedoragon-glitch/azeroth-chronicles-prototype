'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
let passed = 0;
function test(name, run) {
  run();
  passed++;
  console.log('PASS ' + name);
}
function arena(make, gap = 200) {
  const c = new C('normal', 'paladin', () => 0.5),
    p = { x: 1400, y: 1700 };
  completeFieldOpening(c); // Native first-kill admission precedes isolated retreat fixtures.
  c.zone().props = [];
  c.s.party = [];
  c.s.time = 30;
  const e = make(c, p),
    ally = c.makeEnemy(
      { species: 'goblin', level: 2, hp: 10000, damage: 0, xp: 0, gold: 0 },
      { x: 1000, y: 1700 },
    );
  Object.assign(e, { aggro: true, fightStart: 0, cd: 0, specialCd: 0, summonCd: 100 });
  Object.assign(ally, { cd: 100, specialCd: 100 });
  c.zone().enemies = [e, ally];
  Object.assign(c.hero, {
    x: 1400 + gap,
    y: 1700,
    hp: 10000,
    maxHp: 10000,
    level: e.level + 1,
    immune: 0,
  });
  c._tacticalRogueNext = new Map([[e.id, Infinity]]);
  const state = {
    phase: 'travel',
    allyId: ally.id,
    destination: { x: 1000, y: 1700 },
    retreatOrigin: p,
    travelRemaining: 12,
    stalled: 0,
  };
  c._tacticalRegroups = new Map([[e.id, state]]);
  const step = (dt = 0.05) => {
    c.s.time += dt;
    c.updateEnemies(dt);
  };
  return { c, e, ally, state, step };
}
const mob =
  (species = 'skeleton', ranged = true, form = 'normal') =>
  (c, p) =>
    Object.assign(c.makeEnemy({ species, level: 3, hp: 10000, damage: 25, xp: 0, gold: 0 }, p), {
      ranged,
      form,
    });
const captain = (id) => (c, p) =>
  Object.assign(mob('goblin', false)(c, p), {
    captain: true,
    roomCaptain: id === 'supply-crown',
    captainProfile: id,
  });
const boss =
  (id, form = 'normal') =>
  (c, p) =>
    c.bossEnemy(c.boss(id), form, p);
for (const species of Object.keys(C.rules.enemySupportHealing.species))
  for (const form of ['normal', 'ringleader'])
    test(species + ' ' + form + ' fires while continuing a real retreat', () => {
      const { c, e, state, step } = arena(mob(species, true, form), 150);
      const x = e.x;
      step();
      assert(e.x < x);
      const aim = e.rangedAim;
      assert(aim?.withdrawal);
      const mark = { x: aim.x, y: aim.y };
      const before = e.x;
      step(0.1);
      assert(e.x < before);
      assert.equal(aim.timer, aim.total - 0.1);
      assert.deepEqual({ x: aim.x, y: aim.y }, mark);
      for (let i = 0; i < 10 && e.rangedAim; i++) step(0.05);
      assert(c.s.projectiles.some((p) => p.sourceId === e.id));
      assert(!e.rangedAim);
      assert(e.cd > 0);
      assert.equal(c.tacticalRogueRegroup(e), state);
    });
for (const id of Object.keys(C.rules.roomCaptains))
  test(id + ' chooses a compatible existing skill and completes its warning while moving', () => {
    const { c, e, step } = arena(captain(id), 180);
    step();
    const a = e.telegraph;
    assert(a?.withdrawal, id + ' starts a skill');
    if (id === 'supply-crown') {
      assert.equal(e.roomCaptain, true, 'native Dreadmaw actor dispatch is active');
      assert(a.dreadMechanic, 'the selected withdrawal really uses an agricultural mechanic');
    }
    assert(!a.charge && !a.landing);
    assert.equal(a.total, a.timer);
    const x = e.x;
    step(0.1);
    assert(e.x < x);
    assert.equal(a.timer, a.total - 0.1);
    if (['cone', 'sector', 'ring'].includes(a.kind) || a.selfDefense) assert.equal(a.x, e.x);
    for (let i = 0; i < 160 && e.telegraph === a; i++) step(0.05);
    assert.notEqual(e.telegraph, a);
    assert(!e.motion);
    assert(e.specialCd > 0);
    assert(e.cd > 0 || e.telegraph);
  });
for (const id of Object.keys(C.rules.attacks))
  for (const form of ['normal', 'true'])
    test(id + ' ' + form + ' keeps native selection within withdrawal-compatible skills', () => {
      const { c, e, ally, step } = arena(boss(id, form), 180);
      if (id === 'cindermaw') Object.assign(ally, { x: e.x - 150, species: 'ashbeast' });
      step();
      let a = e.telegraph;
      // A native random combo may be rejected as a whole if a later leg charges.
      // A ready melee basic is only possible at contact, so try other random rolls.
      for (let n = 0; !a && n < 10; n++) {
        c.random = () => n / 10;
        step(0.01);
        a = e.telegraph;
      }
      assert(a?.withdrawal, id + ' has a legal contribution');
      assert([a, ...e.sequence].every((p) => c.enemyWithdrawalPlan(e, p, p.index)));
      const x = e.x;
      step(0.1);
      assert(e.x < x);
      assert.equal(a.timer, a.total - 0.1);
      for (let n = 0; n < 200 && e.telegraph === a; n++) step(0.05);
      assert.notEqual(e.telegraph, a);
      assert(!e.motion);
      assert(e.cd > 0 || e.telegraph);
    });
test('native Dreadmaw withdrawal closure deliberately recenters its warned gaps', () => {
  const c = new C('normal', 'mage', () => 0.5);
  c.enter('supply-crown');
  const e = c.zone().enemies.find((u) => u.roomCaptain && u.captainProfile === 'supply-crown');
  assert(e, 'use the real authored captain, not a generic captain double');
  c.s.party = [];
  c.zone().enemies = [e];
  Object.assign(e, { x: 120, y: 120, aggro: true, cd: 0, specialCd: 0, summonCd: 100 });
  assert(!c.blocked(e.x, e.y, c.zoneId, 20));
  Object.assign(c.hero, { x: e.x + 140, y: e.y });
  let a;
  for (let roll = 0; roll <= 100; roll++) {
    c.random = () => roll / 101;
    e.telegraph = null;
    e.sequence = [];
    e.specialCd = 0;
    delete e.lastCaptainAttack;
    c.enemyWithdrawalAction(e, c.hero);
    if (e.telegraph?.dreadMechanic === 'closure') {
      a = e.telegraph;
      break;
    }
  }
  assert(a?.withdrawal, 'the native withdrawal selector starts the real closure');
  const anchor = { x: a.x, y: a.y },
    gaps = [...a.gaps],
    timer = a.timer;
  assert(
    Math.hypot(anchor.x - e.x, anchor.y - e.y) > 1,
    'native terrain needs an offset initial plan',
  );
  c.enemyWithdrawalCastPosition(e);
  assert.deepEqual({ x: a.x, y: a.y }, { x: e.x, y: e.y });
  assert.deepEqual(a.gaps, gaps, 'the approved shift retains the warned gap directions');
  assert.equal(a.timer, timer, 'recentring does not restart the warning');
  c.resolveAttack(e);
  assert(e.dreadClosure, 'native resolution creates the actual specialist ring');
  assert.deepEqual({ x: e.dreadClosure.x, y: e.dreadClosure.y }, { x: a.x, y: a.y });
  assert.deepEqual(e.dreadClosure.gaps, gaps);
  // Terrain may obstruct an opening after the shift: no guaranteed-exit rule.
});
test('support healing wins before firing, skills or Rogue; full cooldown and pulses retained', () => {
  const { c, e, ally, step } = arena(mob('skeleton', true));
  ally.hp = ally.maxHp * 0.5;
  ally.aggro = true;
  ally.x = e.x - 150;
  ally.home = { x: ally.x, y: ally.y };
  step();
  assert(ally.supportHeal);
  assert.equal(e.supportHealCd, 7);
  assert(!e.rangedAim && !e.telegraph);
  assert.equal(e.x, 1400);
  const hp = ally.hp;
  step(0.1);
  assert(ally.hp > hp);
  assert(e.supportHealCd < 7);
  assert(e.rangedAim?.withdrawal);
});
test('leader self-healing wins over a ready withdrawal special', () => {
  const { e, step } = arena(captain('supply-vale'));
  e.hp = e.maxHp * 0.5;
  step();
  assert(e.supportHeal);
  assert(!e.telegraph);
  assert.equal(e.supportHealCd, 10);
});
test('authored boss recovery wins before a fresh Rogue decision', () => {
  const { c, e, step } = arena(boss('darklord'));
  e.hp = e.maxHp * 0.3;
  c._tacticalRegroups.clear();
  c._tacticalRogueNext.clear();
  step();
  assert(e.telegraph?.bossHeal);
  assert(e.secondWindUsed);
  assert(!c.tacticalRogueRegroup(e));
});
test('cooldown, walls, out of range and Silence retain their action gates', () => {
  for (const gate of ['cooldown', 'wall', 'range', 'silence']) {
    const { c, e, step } = arena(captain('supply-march'), gate === 'range' ? 650 : 200);
    if (gate === 'cooldown') e.cd = 5;
    if (gate === 'wall') c.line = () => false;
    if (gate === 'silence') c.mageSilenceActive = () => true;
    const x = e.x;
    step();
    assert(e.x <= x, gate + ' never chases');
    assert(!e.telegraph && !e.rangedAim, gate);
  }
});
test('Silence still allows a native ranged basic, and cover blocks its release', () => {
  const { c, e, step } = arena(mob());
  c.mageSilenceActive = () => true;
  step();
  assert(e.rangedAim);
  c.enemyRangedLine = () => false;
  for (let i = 0; i < 10 && e.rangedAim; i++) step(0.05);
  assert(!c.s.projectiles.some((p) => p.sourceId === e.id));
});
test('melee basics only cover at contact; no charge or pursuit toward distant targets', () => {
  for (const gap of [40, 200]) {
    const { c, e, step } = arena(mob('orc', false), gap),
      hp = c.hero.hp,
      x = e.x;
    step();
    assert(e.x < x);
    assert(!e.motion && !e.telegraph);
    assert.equal(c.hero.hp < hp, gap === 40);
  }
});
test('ordinary backpedaling starts a shot and continues moving throughout its warning', () => {
  const { c, e, step } = arena(mob(), 80);
  c._tacticalRegroups.clear();
  const x = e.x;
  step();
  assert(e.x < x && e.rangedAim?.withdrawal);
  const before = e.x;
  step(0.1);
  assert(e.x < before);
  for (let i = 0; i < 10 && e.rangedAim; i++) step(0.05);
  assert(c.s.projectiles.some((p) => p.sourceId === e.id));
});
test('arriving at support cannot replace or stall a committed covering warning', () => {
  const { c, e, state, step } = arena(mob());
  step();
  state.destination = { x: e.x - 1, y: e.y };
  const a = e.rangedAim;
  step(0.1);
  assert.equal(state.phase, 'anchored');
  assert.equal(a.timer, a.total - 0.1);
  for (let i = 0; i < 10 && e.rangedAim === a; i++) step(0.05);
  assert.notEqual(e.rangedAim, a);
  assert(c.s.projectiles.some((p) => p.sourceId === e.id));
});
test('dead support, escape timeout, death and restoration retain cleanup', () => {
  for (const mode of ['support', 'escape', 'death']) {
    const { c, e, ally, state, step } = arena(mob());
    step();
    if (mode === 'support') {
      ally.hp = 0;
      step();
      assert.equal(c.tacticalRogueRegroup(e).phase, 'thinking');
      step(0.1);
      assert(e.rangedAim.timer < e.rangedAim.total);
    }
    if (mode === 'escape') {
      Object.assign(state, { phase: 'escape', fleeRemaining: 0.01, seekDelay: 1 });
      step();
      assert(e.returning);
      assert(!e.rangedAim);
      assert(!c.tacticalRogueRegroup(e));
    }
    if (mode === 'death') {
      c.damage(e, e.hp * 10, true);
      assert(!c.tacticalRogueRegroup(e));
    }
    const restored = C.restore(c.snapshot());
    assert(!restored.tacticalRogueRegroup(restored.zone().enemies.find((u) => u.id === e.id)));
    assert(!restored.zone().enemies.find((u) => u.id === e.id).rangedAim);
  }
});
test('forced movement, grabs and exposure are rejected without spending native resources', () => {
  const { c, e } = arena(boss('thorn'));
  for (const plan of [
    { kind: 'line', charge: true },
    { kind: 'circle', landing: true },
    { kind: 'line', opening: 2 },
    { kind: 'cone', combo: true },
  ])
    assert(!c.enemyWithdrawalPlan(e, plan, 1));
  for (const id of ['mire', 'archive'])
    assert(!c.enemyWithdrawalPlan({ type: 'boss', family: id }, C.rules.attacks[id][0], 0));
});
console.log('PASS ' + passed + ' enemy withdrawal scenarios');
