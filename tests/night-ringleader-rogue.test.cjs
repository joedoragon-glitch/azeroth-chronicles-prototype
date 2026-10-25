'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
for (const mode of ['normal', 'nightmare', 'developer']) {
  const c = new C(mode, 'mage', () => 0.9);
  c.s.clock = 500;
  if (mode === 'nightmare') {
    assert.equal(c.s.nightmareIntroRemaining, C.rules.dayCycle.twilightSeconds);
    assert.equal(c.night(), false, 'fresh Nightmare sunset retains day rules even at clock 500');
    assert.deepEqual(c.multipliers(), { hp: 1, damage: 1 });
    c.advanceDaylight(c.s.nightmareIntroRemaining);
    assert.equal(c.night(), true, 'the actual sunset boundary starts permanent night');
  }
  c.victory('thorn', 'normal');
  c.victory('crypt', 'normal');
  assert.equal(c.nightPoints(), 2);
  c.victory('thorn', 'true');
  c.victory('crypt', 'true');
  assert.equal(c.nightPoints(), 4, mode + ' counts field and pre-Awakening dungeon TRUE victories');
  c.victory('crypt', 'true');
  assert.equal(c.nightPoints(), 4, 'Repeat victories add no points');
  assert.equal(c.petUnlocked('thorn'), true, 'The TRUE victory still grants its boss pet');
  const restored = C.restore(c.snapshot());
  assert.equal(
    restored.nightPoints(),
    4,
    'Existing boss facts retain their contribution after reload',
  );
  if (mode !== 'nightmare') {
    const historical = c.snapshot();
    delete historical.victories;
    assert.equal(
      C.restore(historical).nightPoints(),
      4,
      'Historical saves with boss facts are supported',
    );
  }
  c.s.phase = 'awakening';
  for (const b of C.data.bosses) {
    c.victory(b.id, 'normal');
    c.victory(b.id, 'true');
  }
  assert.equal(c.nightPoints(), 20, 'All ten non-final bosses count once per form');
  assert(Math.abs(c.multipliers().hp - 1.7) < 1e-9);
  assert(Math.abs(c.multipliers().damage - 1.55) < 1e-9);
  c.s.phase = 'peace';
  assert.deepEqual(c.multipliers(), { hp: 1, damage: 1 }, 'Peace removes escalation');
}
assert.equal(C.rules.tacticalFoundation.moveCooldownSeconds, 2);
for (const make of [
  (c) => c.makeEnemy({ species: 'goblin', level: 5, hp: 10000, damage: 10 }, { x: 1400, y: 1700 }),
  (c) =>
    Object.assign(
      c.makeEnemy({ species: 'wolf', level: 5, hp: 10000, damage: 10 }, { x: 1400, y: 1700 }),
      { form: 'ringleader' },
    ),
  (c) =>
    Object.assign(
      c.makeEnemy({ species: 'goblin', level: 5, hp: 10000, damage: 10 }, { x: 1400, y: 1700 }),
      { captain: true, captainProfile: 'supply-vale' },
    ),
  (c) => c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 }),
  (c) => c.bossEnemy(c.boss('thorn'), 'true', { x: 1400, y: 1700 }),
]) {
  const c = new C('normal', 'paladin', () => 0.9),
    e = make(c);
  e.name = 'Rogue cadence fixture';
  Object.assign(e, { aggro: true, fightStart: 0, cd: 100, summonCd: 100 });
  c.zone().props = [];
  c.zone().enemies = [e];
  c.s.party = [];
  c.s.mercyTime = 0;
  c.s.time = 30;
  Object.assign(c.hero, { x: e.x + 70, y: e.y, level: e.level + 1, hp: 10000, maxHp: 10000 });
  assert(c.tacticalAutoRogue(e, c.hero));
  assert.equal(c._tacticalRogueNext.get(e.id), 32, 'Next Rogue opportunity is two seconds later');
  // Keep a real moving pursuer in range while exercising warning/resolution/reuse.
  for (let tick = 0; tick < 70; tick++) {
    c.hero.x = e.x + 70;
    c.hero.y = e.y;
    c.s.time += 0.1;
    c.updateEnemies(0.1);
  }
  const casts = c.s.statistics.events.filter((x) => x.type === 'rogueMove');
  assert(
    casts.length >= 2,
    'Persistent Rogue eligibility allows repeated moves for ' + e.type + '/' + e.form,
  );
  c.tacticalClearRogueRegroup(e);
  assert(!c._tacticalRogueNext.has(e.id), 'Encounter cleanup clears the reuse clock');
  e.aggro = false;
  assert(!c.tacticalAutoRogue(e, c.hero), 'Idle actors do not gain Rogue uses');
  e.aggro = true;
  e.hp = 0;
  assert(!c.tacticalAutoRogue(e, c.hero), 'Dead actors cannot restart Rogue');
}
console.log(
  'PASS TRUE night escalation/pets/reload/peace and three-second repeated Rogue decisions through live AI',
);
