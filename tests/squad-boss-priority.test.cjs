'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

function encounter(heroClass) {
  const c = new C('normal', heroClass, () => 0.9);
  const b = c.zone().enemies.find((e) => e.type === 'boss' && e.hp > 0);
  assert(b, 'Vale teaching boss exists');
  c.zone().enemies = [b];
  Object.assign(c.hero, c.safe(b.x - 120, b.y));
  for (const [i, u] of c.s.party.entries())
    Object.assign(u, c.safe(c.hero.x + i * 35, c.hero.y + 50));
  b.aggro = true;
  c.s.expeditionRank = 3;
  return { c, b };
}
const targets = (c) => {
  c.updateParty(0.01);
  return c.activeLivingParty().map((u) => c._tacticalPartyTargets.get(u.id));
};
const attacker = (c, owner = null) => {
  const p = c.safe(c.hero.x + 65, c.hero.y - 45);
  const e = c.makeEnemy(
    { species: 'wolf', name: 'Pressing attacker', level: 2, hp: 99999,
      damage: 1, gold: 0, xp: 0 },
    p,
  );
  if (owner) { e.summon = true; e.owner = owner.id; }
  e.aggro = true;
  c.zone().enemies.push(e);
  return e;
};
for (const heroClass of ['mage', 'ranger', 'paladin']) {
  const { c, b } = encounter(heroClass);
  const defaultMode = heroClass === 'paladin' ? 'focus' : 'guard';
  assert.equal(c.squadDoctrineLabel().mode, defaultMode, heroClass + ' keeps its class default');
  assert.deepEqual(targets(c), [b.id, b.id],
    heroClass + ' does not idle when a boss has no active adds');

  const summoned = attacker(c, b);
  if (heroClass !== 'paladin') {
    assert.deepEqual(targets(c), [summoned.id, summoned.id],
      heroClass + ' automatically screens boss summons attacking near the hero');
  } else {
    assert.deepEqual(targets(c), [b.id, b.id],
      'Paladin class default keeps its explicit boss priority despite summons');
  }

  assert(c.toggleSquadDoctrine(), heroClass + ' can switch modes using the existing control');
  const manual = heroClass === 'paladin' ? 'guard' : 'focus';
  assert.equal(c.s.squadDoctrine, manual);
  assert.deepEqual(targets(c), [manual === 'focus' ? b.id : summoned.id,
    manual === 'focus' ? b.id : summoned.id],
  heroClass + ' manual switch governs current targets');

  // Dropping out of boss sight for an instant while the adds are still pressing
  // must not silently overwrite a deliberate player order.
  b.aggro = false;
  c.squadDoctrineLabel();
  assert.equal(c.s.squadDoctrine, manual, heroClass + ' keeps the manual mode during adds-only pressure');
  b.aggro = true;
  c.squadDoctrineLabel();
  assert.equal(c.s.squadDoctrine, manual, heroClass + ' retains the manual mode on boss reacquisition');

  // The manual ADDS order also has a boss fallback, not an idle state.
  if (manual === 'guard') {
    summoned.hp = 0;
    assert.deepEqual(targets(c), [b.id, b.id], 'Paladin manual ADDS mode returns to boss when safe');
    summoned.hp = 99999;
    assert.deepEqual(targets(c), [summoned.id, summoned.id],
      'Paladin manual ADDS mode resumes screening when summons return');
  }

  // After full disengagement, the original class doctrine is restored.
  summoned.aggro = false;
  b.aggro = false;
  c.squadDoctrineLabel();
  assert.equal(c.s.squadDoctrine, defaultMode, heroClass + ' resets only after full disengagement');

  // An ordinary monster attacking the player is an active add too, even
  // without a summon flag; its removal returns guardians to boss pressure.
  b.aggro = true;
  summoned.hp = 0;
  const ordinary = attacker(c);
  if (heroClass !== 'paladin') {
    assert.deepEqual(targets(c), [ordinary.id, ordinary.id],
      heroClass + ' default add priority protects against any engaged attacker');
    ordinary.hp = 0;
    assert.deepEqual(targets(c), [b.id, b.id],
      heroClass + ' resumes boss as soon as the attacker is defeated');
  } else {
    assert.deepEqual(targets(c), [b.id, b.id], 'Paladin default is still boss priority');
  }
}
console.log('PASS automatic add screening, boss fallback, manual BOSS/ADDS priority and lifecycle for all classes');
