'use strict';
// Tunable hostile melee baseline: exercise native attack dispatch and the
// separate tactical-withdrawal basic gate, not just exported range constants.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const tuning = Campaign.rules.meleeReach;

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
  // Use real collision, but never assume one fixed wilderness tile is clear.
  // The corridor must cover both current reach and any longer authored reach.
  const corridor = Math.max(150, gap + 20);
  let start = null;
  for (let y = 600; y <= 2600 && !start; y += 170) {
    for (let x = 600; x <= 2600 && !start; x += 170) {
      const a = { x, y }, b = { x: x + corridor, y };
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
  const reach = role.attrs.type === 'boss' || role.attrs.captain || role.attrs.roomCaptain ||
    role.attrs.fieldCaptain || role.attrs.form === 'ringleader' ? tuning.elite : tuning.enemy;
  for (const gap of [reach - 5, reach + 5]) {
    const label = role.name + ' at ' + gap;
    const { g, e } = arena(role.attrs, gap);
    assert.equal(g.enemyMeleeBasicRange(e), reach, label + ' uses tuned melee floor');
    const before = g.hero.hp;
    // Native combat frame: any allowed movement cannot itself cause a hit,
    // since the melee attack decision is made using pre-movement distance.
    g.updateEnemies(0.01);
    assert.equal(g.hero.hp < before, gap <= reach, label + ' native melee contact');
    cases++;

    // Independent withdrawal covering attack must preserve the same boundary.
    const withdraw = arena(role.attrs, gap);
    const w = withdraw.g, enemy = withdraw.e;
    const hp = w.hero.hp;
    const used = w.enemyWithdrawalAction(enemy, w.hero);
    if (gap <= reach) {
      assert(used, label + ' withdrawal melee admitted');
      assert(w.hero.hp < hp, label + ' withdrawal melee actually damaged hero');
    } else {
      assert.equal(w.hero.hp, hp, label + ' withdrawal cannot melee past basic reach');
      if (!role.attrs.hybrid) assert.equal(used, false, label + ' withdrawal refused');
      else if (role.attrs.form === 'ringleader')
        assert.equal(used, false, label + ' hybrid melee stance cannot hit outside basic reach');
      else
        assert(enemy.rangedAim, label + ' ordinary hybrid uses ranged aim beyond melee stance');
    }
    cases++;
  }
}

// The selected elite floor is a minimum; longer authored reach still wins.
const authoredReach = tuning.elite + 30;
for (const gap of [authoredReach - 5, authoredReach + 5]) {
  const { g, e } = arena({ type: 'boss', family: 'crypt', meleeBasicRange: authoredReach }, gap);
  assert.equal(g.enemyMeleeBasicRange(e), authoredReach, 'longer authored boss basic preserved');
  const before = g.hero.hp;
  g.updateEnemies(0.01);
  assert.equal(g.hero.hp < before, gap <= authoredReach,
    'authored longer reach boss melee at ' + gap);
  cases++;
}
console.log('PASS ' + cases + ' dynamically tuned hostile melee cases across nine roles, native dispatch, withdrawal and longer reach');
