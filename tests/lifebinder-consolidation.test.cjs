'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const D = C.data, R = C.rules;
const b = D.bosses.find((entry) => entry.id === 'crypt');
assert(b && b.name === 'Lifebinder' && b.level === 3);
assert.equal(b.hp, 650);
assert.equal(b.damage, 16);
assert.deepEqual(b.attacks.map((s) => s.split(':')[0]),
  ['Binding Sweep', 'Stay Alive', 'Call the Attendants', 'Groundwork']);
assert.match(D.regions[0].exploration, /Lifebinder/);
assert.match(D.regions[0].exploration, /winter estate/);
assert.match(D.regions[0].exploration, /skeletons retain their own names and allegiances/);
assert.match(R.dungeonLore.crypt, /six seats at the winter table/);
assert.match(R.dungeonWorkstations.crypt.context, /BOUND and RELEASED/);
assert.match(R.tacticalFoundation.rogueMoves.bosses.crypt.name, /Lifebinder/);
assert.match(R.tacticalFoundation.rogueSignatures.bosses.crypt.name, /Lifebinder/);
assert(D.quests.some((q) => q.name === 'An Unfinished Retreat') ||
  JSON.stringify(D).includes('Defeat Lifebinder; free Borin'),
  'existing rescue quest should display the new boss name');

for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.9);
  assert(c.enter('crypt'));
  assert(c.messages.includes(R.dungeonLore.crypt), 'entry clue must be player-visible');
  const e = c.zone().enemies.find((u) => u.family === 'crypt' && u.type === 'boss');
  assert(e);
  assert.equal(e.name, 'Lifebinder');
  assert.equal(c.zone().dungeonVersion, 4);
  const props = c.zone().props.filter((p) => p.decorative);
  for (const name of ['estate-hearth', 'estate-rug', 'estate-lounge'])
    assert(props.some((p) => p.structure === name), 'approved estate furnishing: ' + name);
  assert.equal(R.attacks.crypt[3].count, 4);
  assert.equal(R.bossSummoning.overrides.crypt.normalCap, 12);
  assert.equal(R.bossSummoning.overrides.crypt.trueCap, 6);
  c.zone().enemies = [e];
  const plan = c.trueSummonPlan(e);
  for (let i = 0; i < 4; i++)
    assert.equal(c.summonBossAdds(e, plan, c.bossSummonCap(e)), 3);
  assert.equal(c.summonBossAdds(e, plan, c.bossSummonCap(e)), 0);
  assert.equal(c.bossOwnedSummons(e).length, 12);
  assert(c.bossOwnedSummons(e).every((u) => u.estateAttendant));
  const old = c.snapshot();
  const historical = C.restore(old);
  assert.equal(historical.zone().enemies.find((u) => u.family === 'crypt').name, 'Lifebinder');
  assert.equal(historical.zone().dungeonVersion, 4);
}
const normal = new C('normal', 'paladin', () => 0.9);
normal.s.normal.crypt = true;
normal.s.pending.crypt = { kind: 'dungeon', count: 1 };
assert(normal.enter('crypt'));
assert(normal.zone().enemies.some((e) => e.family === 'crypt' && e.form === 'true'));
const tb = normal.zone().enemies.find((e) => e.family === 'crypt' && e.form === 'true');
assert.equal(tb.name, 'TRUE Lifebinder');
normal.summonBossAdds(tb, normal.trueSummonPlan(tb), normal.bossSummonCap(tb));
assert.equal(normal.bossOwnedSummons(tb).length, 6);
assert.equal(normal.bossOwnedSummons(tb).filter((e) => e.trueSummonRole === 'captain').length, 2);
assert(!Object.keys(normal.s).some((key) => key.toLowerCase().includes('lifebinder')),
  'save/progression still uses crypt family IDs');
console.log('PASS Lifebinder canon reconciles with estate, attendants, TRUE and legacy identifiers');
