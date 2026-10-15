'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.9);
  c.s.normal.darklord = c.s.true.darklord = true;
  c.s.phase = 'awakening';
  c.s.throneClaimed = true;
  for (const id of C.dungeonIds) c.s.normal[id] = c.s.true[id] = true;
  const captains = c.dungeonMasterCandidates().filter((x) => x.group === 'captain');
  assert.deepEqual(captains.map((x) => x.name).sort(),
    ['Cinder Warlord', 'Crag Tyrant', 'Direjaw', 'Dreadmaw', 'Scornfang'].sort());
  assert.equal(captains.length, 5, 'all named captains, alive or defeated, eligible');
  const assigned = [];
  for (const id of C.dungeonIds) {
    assert(c.enter(id));
    const station = c.visibleNPCs().find((n) => n.kind === 'appointment');
    assert(station && c.route({ x: 160, y: 240 }, station).length,
      id + ' must have a reachable appointment station');
    const candidate = c.dungeonMasterCandidates()
      .find((choice) => choice.group === 'field' && !assigned.includes(choice.id));
    assert(candidate && c.appointDungeonMaster(id, candidate.id));
    assigned.push(candidate.id);
    assert.equal(c.zone().npcs.filter((n) => n.id === 'dungeon-master-resident').length, 1);
    assert(c.zone().npcs.find((n) => n.id === 'dungeon-master-resident').name.includes(candidate.name));
    assert.equal(C.restore(c.snapshot()).s.appointments[id], candidate.id,
      'unique appointment survives ordinary v4 save');
  }
  assert.equal(assigned.length, 5);
  assert(c.enter('crypt'));
  assert.equal(c.appointDungeonMaster('crypt', c.s.appointments.mine), false,
    'same unique character cannot govern two dungeons');
  assert(c.appointDungeonMaster('crypt', 'captain:supply-vale'),
    'defeated named captains remain eligible');
  assert.equal(c.dungeonMaster().name, 'Scornfang');
  c.s.rescued.crypt = true;
  assert(c.appointDungeonMaster('crypt', 'specialist:crypt'),
    'rescued specialist can be appointed without turning into an enemy');
  assert.equal(c.dungeonMaster().group, 'specialist');
  assert(c.appointDungeonMaster('crypt', null), 'appointment can be deferred or withdrawn');
  assert.equal(c.dungeonMaster(), null);
  const duplicate = c.snapshot();
  duplicate.appointments.archive = duplicate.appointments.mine;
  assert.throws(() => C.restore(duplicate), /dungeon master|appointment/, 'reject corrupt duplicate selection');
  c.checkEnding();
  assert.equal(c.peace, true, 'appointments never block peace');
  c.enter('archive');
  assert(c.zone().npcs.some((n) => n.kind === 'dungeon-master'));
  assert(c.zone().enemies.every((e) => e.neutral), 'master is not a hostile enemy');
}
console.log('PASS unique optional appointments, all five captains, rescues, legacy saves and peaceful residents');