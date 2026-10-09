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

  // An add owned by the boss takes priority immediately on spawning,
  // even before its aggro activates or it reaches the normal hero-threat radius.
  const distant = c.makeEnemy(
    { species: 'wolf', name: 'Newly spawned add', level: 2, hp: 99999,
      damage: 1, gold: 0, xp: 0 },
    c.safe(c.hero.x + 740, c.hero.y + 100),
  );
  distant.summon = true;
  distant.owner = b.id;
  distant.aggro = false;
  c.zone().enemies.push(distant);
  if (manual === 'focus')
    assert.deepEqual(targets(c), [b.id, b.id],
      heroClass + ' manual BOSS order ignores even newly spawned adds');
  else {
    summoned.hp = 0;
    assert.deepEqual(targets(c), [distant.id, distant.id],
      'ADDS mode ignores the boss even when its only summon is still far away');
    summoned.hp = 99999;
  }
  distant.hp = 0;

  // An ordinary aggroed attacker within the hero's threat radius also
  // takes priority if the companion starts more than 620 units away.
  if (manual === 'guard') {
    const distantAlly = c.s.party[0];
    const saved = { x: distantAlly.x, y: distantAlly.y };
    const far = c.safe(c.hero.x - 490, c.hero.y + 50);
    Object.assign(distantAlly, far);
    const nearHero = c.makeEnemy(
      { species: 'wolf', name: 'Hero pressure', level: 2, hp: 99999,
        damage: 1, gold: 0, xp: 0 },
      c.safe(c.hero.x + 310, c.hero.y),
    );
    nearHero.aggro = true;
    c.zone().enemies.push(nearHero);
    assert.notEqual(targets(c)[0], b.id,
      'ADDS mode never switches back to boss when an active threat is beyond a companion local radius');
    nearHero.hp = 0;
    Object.assign(distantAlly, saved);
  }

  // Dropping out of boss sight for an instant while the adds are still pressing
  // must not silently overwrite a deliberate player order.
  b.aggro = false;
  c.squadDoctrineLabel();
  assert.equal(c.s.squadDoctrine, manual, heroClass + ' keeps the manual mode during adds-only pressure');
  assert.deepEqual(targets(c), [manual === 'focus' ? b.id : summoned.id,
    manual === 'focus' ? b.id : summoned.id],
    heroClass + ' obeys its manual boss/adds instruction during brief boss aggro loss');
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
