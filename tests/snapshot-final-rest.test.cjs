'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

function peace(mode, heroClass, zone) {
  const c = new C(mode, heroClass, () => 0.9);
  c.s.normal.darklord = c.s.true.darklord = true;
  for (const id of C.dungeonIds) c.s.normal[id] = c.s.true[id] = true;
  c.s.throneClaimed = true;
  c.s.phase = 'awakening';
  c.checkEnding();
  assert(c.peace && !c.s.finalRestCompleted);
  assert(c.enter(zone));
  return c;
}
for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(C.classes)) {
    const c = peace(mode, heroClass, 'crown');
    const refuge = c.zone().npcs.find((n) => n.kind === 'rest');
    Object.assign(c.hero, { x: refuge.x, y: refuge.y, hp: 10 });
    c.s.restCooldown = 90; // Peace must bypass ordinary healing cooldown.
    assert(c.rest(), 'reachable valid town refuge');
    assert(c.s.finalRestCompleted);
    assert.equal(c.hero.hp, c.hero.maxHp);
    c.rest();
    assert.equal(c.s.statistics.events.filter((e) => e.type === 'finalRest').length, 1);
    assert(C.restore(c.snapshot()).s.finalRestCompleted);
    const old = c.snapshot();
    delete old.finalRestCompleted;
    delete old.throneClaimed;
    assert(C.restore(old).s.finalRestCompleted, 'legacy peace not forced to replay ending');
  }
  const c = peace(mode, 'ranger', 'citadel');
  const f = c.zone().npcs.find((n) => n.kind === 'fountain');
  assert(f);
  assert.equal(c.completeFinalRest('fountain', { id: f.id }), false,
    'unvalidated synthetic fountain cannot finish the game');
  c.s.fountains.citadel = true;
  Object.assign(c.hero, { x: f.x, y: f.y, hp: 20 });
  assert(c.interact(f), 'spent real preparation fountain remains a valid final Rest');
  assert(c.s.finalRestCompleted);
  assert.equal(c.s.statistics.events.filter((e) => e.type === 'finalRest').length, 1);

  const b = peace(mode, 'mage', 'crown');
  const site = { id: 'test-final-barracks', kind: 'barracks', progress: 2,
    x: b.hero.x + 40, y: b.hero.y };
  b.zone().buildings.push(site);
  assert.equal(b.completeFinalRest('barracks', site), false, 'unfinished Barracks rejected');
  site.progress = 4;
  assert(b.completeFinalRest('barracks', site), 'completed Basic Barracks is valid');
  assert.equal(b.completeFinalRest('barracks', site), false, 'only one final Rest event');
  assert(C.restore(b.snapshot()).s.finalRestCompleted);
}
console.log('PASS final Rest for six class/mode refuges, spent fountains, completed Barracks and legacy saves');