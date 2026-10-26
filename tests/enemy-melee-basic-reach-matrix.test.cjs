'use strict';
// Hostile 90-unit melee baseline: exercise native attack dispatch and the
// separate tactical-withdrawal basic gate, not just exported range constants.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

const categories = [
  { name: 'ordinary', attrs: {} },
  { name: 'guardian', attrs: { guard: true } },
  { name: 'ringleader', attrs: { form: 'ringleader' } },
  { name: 'captain', attrs: { captain: true } },
  { name: 'room captain', attrs: { roomCaptain: true } },
  { name: 'field captain', attrs: { fieldCaptain: true } },
  { name: 'boss', attrs: { type: 'boss', family: 'crypt' } },
  { name: 'ordinary hybrid', attrs: { ranged: true, hybrid: true, shotRange: 240 } },
  { name: 'ringleader hybrid', attrs: {
    ranged: true, hybrid: true, form: 'ringleader', shotRange: 240,
  } },
];
function arena(attrs, gap, zone = 'frontier') {
  const g = new Campaign('normal', 'paladin', () => 0.99);
  g.enter(zone);
  const z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  // Use real world collision, but never assume one fixed wilderness tile
  // is clear after map or scenery changes. Admit a 150-unit corridor first.
  let start = null;
  for (let y = 600; y <= 2600 && !start; y += 170) {
    for (let x = 600; x <= 2600 && !start; x += 170) {
      const a = { x, y }, b = { x: x + 150, y };
      if (!g.blocked(a.x, a.y) && !g.blocked(b.x, b.y) &&
          g.line(a, b) && g.clearSegment(a, b, 15))
        start = a;
    }
  }
  assert(start, 'fixture requires a clear native world corridor');
  const target = { x: start.x + gap, y: start.y };
  const e = g.makeEnemy({
    species: 'goblin', name: 'Melee reach audit', level: 5,
    hp: 20000, damage: 30, gold: 0, xp: 0,
  }, start);
  Object.assign(e, attrs);
  e.home = { ...start };
  z.enemies = [e];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.time = 30;
  Object.assign(g.hero, { ...target, hp: 10000, maxHp: 10000 });
  g.engage(e);
  e.cd = 0;
  e.specialCd = 999;
  e.basicDue = true; // An eligible boss normal strike, not its authored special.
  assert(g.line(e, g.hero), 'actor and target have line of sight');
  return { g, e };
}
let cases = 0;
for (const role of categories) {
  for (const gap of [85, 95]) {
    const label = role.name + ' at ' + gap;
    const { g, e } = arena(role.attrs, gap);
    assert.equal(g.enemyMeleeBasicRange(e), 90, label + ' uses 90-unit floor');
    const before = g.hero.hp;
    // Native combat frame: any allowed movement cannot itself cause a hit,
    // since the melee attack decision is made using pre-movement distance.
    g.updateEnemies(0.01);
    assert.equal(g.hero.hp < before, gap <= 90, label + ' native melee contact');
    cases++;

    // Independent withdrawal covering attack must preserve the same boundary.
    const withdraw = arena(role.attrs, gap);
    const w = withdraw.g, enemy = withdraw.e;
    const hp = w.hero.hp;
    const used = w.enemyWithdrawalAction(enemy, w.hero);
    if (gap <= 90) {
      assert(used, label + ' withdrawal melee admitted');
      assert(w.hero.hp < hp, label + ' withdrawal melee actually damaged hero');
    } else {
      assert.equal(w.hero.hp, hp, label + ' withdrawal cannot melee past 90');
      if (!role.attrs.hybrid) assert.equal(used, false, label + ' withdrawal refused');
      else if (role.attrs.form === 'ringleader')
        assert.equal(used, false, label + ' hybrid melee stance cannot hit at 95');
      else
        assert(enemy.rangedAim, label + ' ordinary hybrid uses ranged aim beyond melee stance');
    }
    cases++;
  }
}

// The 90-unit floor is a minimum; authored longer-reach monsters keep their reach.
for (const gap of [115, 125]) {
  const { g, e } = arena({ type: 'boss', family: 'crypt', meleeBasicRange: 120 }, gap);
  assert.equal(g.enemyMeleeBasicRange(e), 120, 'longer authored boss basic preserved');
  const before = g.hero.hp;
  g.updateEnemies(0.01);
  assert.equal(g.hero.hp < before, gap <= 120, 'authored 120-unit boss melee at ' + gap);
  cases++;
}
console.log('PASS ' + cases + ' hostile melee cases across nine roles, native dispatch, withdrawal and longer reach');
