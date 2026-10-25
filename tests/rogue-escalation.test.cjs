'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

function encounter(region = 'vale', roll = 0.25) {
  const c = new Campaign('normal', 'paladin', () => roll);
  c.s.zone = region;
  const z = c.zone();
  z.props = [];
  c.s.time = 30;
  const add = (x, form = 'ringleader') => {
    const u = c.makeEnemy(
      { species: 'goblin', name: 'goblin ' + form, form, level: 3, hp: 250,
        damage: 15, gold: 0, xp: 0 }, { x, y: 1300 }
    );
    u.aggro = true;
    u.fightStart = 0;
    u.cd = 100;
    return u;
  };
  const a = add(1300), b = add(1340);
  z.enemies = [a, b];
  c.s.party = [c.unit('soldier', 1390, 1315), c.unit('archer', 1390, 1285)];
  for (const u of c.s.party) {
    u.hp = u.maxHp = 10000;
    u.order = null;
  }
  Object.assign(c.hero, {
    x: 1380, y: 1300, level: 4,
    hp: 10000, maxHp: 10000, immune: 0, order: null,
  });
  c._tacticalPartyTargets = new Map(c.s.party.map(u => [u.id, a.id]));
  c.route = (_actor, destination) => [{ x: destination.x, y: destination.y }];
  return { c, z, a, b, add };
}

{
  const { c, z, a, b, add } = encounter();
  assert(c.tacticalNeedsMoreSupport(a), 'two defenders are insufficient against three higher-level opponents');
  const far = add(2400, 'normal');
  z.enemies.push(far);
  assert(!c.tacticalRegroupCandidates(a).includes(far), 'distant ally beyond local awareness');
  assert(c.tacticalBeginExtendedRetreat(a), 'known occupied home available');
  const state = c.tacticalRogueRegroup(a);
  assert.equal(state.phase, 'extended');
  assert.equal(state.allyId, far.id);
  assert.equal(state.destination.x, far.home.x);
  assert(c.tacticalBeginExtendedRetreat(b), 'second defender can choose same distant ally');
  assert.equal(c.tacticalRogueRegroup(b).destination.x, far.home.x);
}
console.log('PASS paired ringleaders can reach an occupied outpost beyond 750');

{
  const { c, z, a, add } = encounter();
  z.enemies.push(add(250, 'normal'));
  assert(c.tacticalBeginExtendedRetreat(a));
  c._tacticalRogueNext = new Map([[a.id, c.s.time + 20]]);
  const before = a.x, time = c.tacticalRogueRegroup(a).travelRemaining;
  c.tacticalAdvanceExtendedRetreat(a, c.hero, 0.2);
  assert(c.tacticalRogueRegroup(a).travelRemaining < time, 'travel clock advances');
  assert(a.x < before, 'withdrawal moves toward outpost instead of target');
  assert(!a.telegraph, 'movement does not require a Rogue cast');
}
console.log('PASS extended movement survives ability cooldown');

{
  const { c, z, a, b } = encounter();
  assert(c.tacticalEmergencyCall(a), 'isolated ringleader calls reinforcements');
  let guards = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.owner === a.id && u.hp > 0);
  assert.equal(guards.length, 2, 'first roll calls two');
  for (const u of guards) {
    assert.equal(u.species, a.species);
    assert.equal(u.form, 'normal');
    assert(u.guard && u.summon && u.summonBalanceVersion === 1);
    assert.equal(u.owner, a.id);
    assert.equal(u.gold, 0);
    assert.equal(u.xp, 0);
    assert.equal(c.tacticalAutoRogue(u, c.hero), false, 'emergency guard does not recursively escalate');
  }
  assert(!c.tacticalEmergencyCall(a), 'immediate repeat is forbidden');
  guards[0].hp = 0;
  c.s.time += 17;
  assert(c.tacticalEmergencyCall(a), 'later call replenishes after loss');
  guards = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.owner === a.id && u.hp > 0);
  assert.equal(guards.length, 3, 'per-ringleader simultaneous cap');
  assert(!c.tacticalEmergencyCall(a), 'cannot exceed three living');
  assert(!c.tacticalEmergencyCall(b), 'adequate group support prevents unnecessary extra calls');
  guards[0].hp = 0;
  guards[1].hp = 0;
  assert(c.tacticalEmergencyCall(b), 'second owner can call after the group loses its advantage');
  assert(z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0).length <= 6);
}
console.log('PASS repeatable 50/50 reinforcements, per-owner cap, rewards, non-recursion');

{
  const { c, z, a } = encounter('crypt');
  assert(c.isDungeon());
  assert(c.tacticalEmergencyCall(a));
  c.s.normal.crypt = true;
  c.s.paid['clear:crypt'] = false;
  c.s.pending = {};
  c.checkClear();
  assert(c.s.paid['clear:crypt'], 'summoned guardian does not block permanent dungeon clear');
  const owned = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0);
  assert(owned.length > 0);
  a.hp = 0;
  c.kill(a);
  assert(owned.every(u => u.hp === 0), 'owner death retires emergency defenders');
}
console.log('PASS dungeon-clear separation and owner death cleanup');

{
  const { c, a } = encounter();
  assert(c.tacticalRogueMove(a, c.hero));
  assert.equal(a.telegraph.name, 'Gang Boss Smoke Trick');
  a.telegraph = null;
  c.s.time += 1.4;
  assert(!c.tacticalRogueMove(a, c.hero), 'cannot bypass three-second cast cadence');
  c.s.time += 1.7;
  assert(c.tacticalRogueMove(a, c.hero), 'later cast permitted');
}
console.log('PASS Rogue cast-to-cast cadence cannot be bypassed');

{
  const { c, z, a } = encounter();
  assert(c.tacticalEmergencyCall(a));
  const saved = c.snapshot();
  assert(saved.zones.vale.enemies.some(u => u.id === a.id), 'Ringleader remains save compatible');
  c.disengage(a, 0);
  assert(z.enemies.filter(u => u.owner === a.id && u.rogueEmergencyReinforcement)
    .every(u => u.hp === 0), 'reset retires emergency defenders');
}
console.log('PASS retreat reset cleans up emergency reinforcements');

{
  const { c, z, a } = encounter('vale', 0.75);
  assert(c.tacticalEmergencyCall(a), 'second coin flip permits three defenders');
  assert.equal(z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0).length, 3);
}
console.log('PASS the three-defender branch of the 50/50 roll');

{
  const sideId = Campaign.rules.sideDungeons[0].id;
  const { c, z, a } = encounter(sideId);
  assert(c.isDungeon() && c.sideDungeon(), 'side-dungeon identity');
  assert.equal(c.tacticalBeginExtendedRetreat(a), false, 'no regional roaming inside interiors');
  assert(c.tacticalEmergencyCall(a), 'side-dungeon fallback has the same emergency call');
  assert(z.enemies.some(u => u.owner === a.id && u.rogueEmergencyReinforcement));
}
console.log('PASS side dungeons use the contained fallback instead of field movement');
