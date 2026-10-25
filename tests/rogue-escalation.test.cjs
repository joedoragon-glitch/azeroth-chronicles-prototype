'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

function encounter(region = 'vale', roll = 0.25) {
  const c = new Campaign('normal', 'paladin', () => roll);
  c.s.zone = region;
  const z = c.zone();
  z.props = [];
  c.s.time = 30;
  // Main and side dungeons have smaller maps than the Vale field.
  const interior = region !== 'vale';
  const offset = interior ? 850 : 0;
  const floorY = interior ? 500 : 1300;
  const add = (x, form = 'ringleader') => {
    const u = c.makeEnemy(
      { species: 'goblin', name: 'goblin ' + form, form, level: 3, hp: 250,
        damage: 15, gold: 0, xp: 0 }, { x: x - offset, y: floorY }
    );
    u.aggro = true;
    u.fightStart = 0;
    u.cd = 100;
    return u;
  };
  const a = add(1300), b = add(1340);
  z.enemies = [a, b];
  c.s.party = [
    c.unit('soldier', 1390 - offset, floorY + 15),
    c.unit('archer', 1390 - offset, floorY - 15),
  ];
  for (const u of c.s.party) {
    u.hp = u.maxHp = 10000;
    u.order = null;
  }
  Object.assign(c.hero, {
    x: 1380 - offset, y: floorY, level: 4,
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
  const { c, z, a, b } = encounter('crypt');
  assert(c.isDungeon());
  // A real dungeon Ringleader inherits guardian identity from the slain guard.
  a.guard = true;
  b.guard = true;
  assert(c.tacticalEmergencyCall(a));
  const owned = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0);
  assert(owned.length > 0);
  assert(owned.every(u => u.guard && u.summon), 'temporary guardians are living defenders');
  c.s.normal.crypt = true;
  c.s.paid['clear:crypt'] = false;
  c.s.pending = {};
  // Kill the native defenders but leave the summoned guards alive.
  a.hp = 0;
  b.hp = 0;
  c.checkClear();
  assert(!c.s.paid['clear:crypt'],
    'main dungeon stays contested as long as emergency guardians survive');
  for (const u of owned) u.hp = 0;
  c.checkClear();
  assert(c.s.paid['clear:crypt'],
    'normal boss victory plus removal of all guardians earns the normal first-clear reward');
}
console.log('PASS main dungeon remains contested while summoned guardians defend it');

{
  const { c, z, a, b } = encounter('crypt');
  a.guard = true;
  b.guard = true;
  assert(c.tacticalEmergencyCall(a));
  const owned = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0);
  c.s.normal.crypt = true;
  c.s.paid['clear:crypt'] = false;
  c.s.pending = {};
  b.hp = 0;
  a.hp = 0;
  c.kill(a);
  assert(owned.every(u => u.hp === 0),
    'defeating the Ringleader dismisses only its emergency guardians');
  assert(c.s.paid['clear:crypt'],
    'last Ringleader death can complete the dungeon when no defenders remain');
}
console.log('PASS Ringleader defeat is an effective way to end its summoned defense');

{
  const { c, z, a } = encounter('crypt');
  a.guard = true;
  c.s.normal.crypt = false;
  c.s.paid['clear:crypt'] = false;
  c.s.pending = {};
  a.hp = 0;
  c.checkClear();
  assert(!c.s.paid['clear:crypt'],
    'no dungeon first-clear reward without the existing normal boss victory');
}
console.log('PASS original boss-victory condition remains required');

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
  const { c, z, a, b } = encounter(sideId);
  assert(c.isDungeon() && c.sideDungeon(), 'side-dungeon identity');
  a.guard = true;
  b.guard = true;
  assert.equal(c.tacticalBeginExtendedRetreat(a), false, 'no regional roaming inside interiors');
  assert(c.tacticalEmergencyCall(a), 'side-dungeon fallback has the same emergency call');
  const owned = z.enemies.filter(u => u.owner === a.id && u.rogueEmergencyReinforcement);
  assert(owned.length > 0);
  assert(owned.every(u => u.hp > 0 && u.guard),
    'summoned guards remain actual secondary-dungeon defenders');
  const before = JSON.stringify(c.s.paid);
  a.hp = 0;
  b.hp = 0;
  c.checkClear();
  assert.equal(JSON.stringify(c.s.paid), before,
    'no premature secondary-dungeon reward/clear flag introduced');
  assert(owned.some(u => u.hp > 0),
    'side-dungeon reinforcements remain alive until defeated or the caller is killed');
  c.kill(a);
  assert(owned.every(u => u.hp <= 0),
    'defeating side-dungeon Ringleader retires its summoned defenders');
}
console.log('PASS side dungeons preserve live defenders without inventing early clearance');

{
  const { c, z, a } = encounter();
  a.ranged = true;
  assert(c.tacticalEmergencyCall(a));
  const guards = z.enemies.filter(u => u.owner === a.id && u.rogueEmergencyReinforcement);
  assert(guards.length > 0 && guards.every(u => u.ranged && u.shotRange > 0),
    'called ranged guardians retain their native projectile combat profile');
}
console.log('PASS emergency guards retain ranged combat identity');

{
  const sample = (phase, piercing = false) => {
    const { c, a } = encounter();
    if (phase) c._tacticalRegroups = new Map([[
      a.id, { phase: 'extended', allyId: 'destination',
        destination: { x: 100, y: 1300 }, travelRemaining: 12, stalled: 0 }
    ]]);
    const hp = a.hp;
    assert(c.damage(a, 20, 'hero', piercing ? { piercing: true } : null));
    return hp - a.hp;
  };
  const normal = sample(null);
  const covered = sample('extended');
  const piercing = sample('extended', true);
  assert(covered > 0 && covered < normal * 0.5 && covered > normal * 0.2,
    '65% withdrawal reduction replaces, not stacks with, prior protection');
  assert(piercing > normal * 0.95,
    'piercing still bypasses the temporary extended-retreat protection');
}
console.log('PASS temporary 65% protection and piercing preserve the combat contract');

{
  const { c, z, a, add } = encounter();
  const third = add(1365, 'normal');
  z.enemies.push(third);
  assert(!c.tacticalRogueOutnumbered(a), 'three defenders match three opponents numerically');
  assert(c.tacticalNeedsMoreSupport(a), 'their lower level still makes reinforcement useful');
  c._tacticalRegroups = new Map([[a.id, {
    phase: 'anchored', anchor: { x: a.x, y: a.y },
    holdRemaining: 12, moveUsed: true, recruited: true,
  }]]);
  c._tacticalRogueNext = new Map([[a.id, 0]]);
  c.tacticalAdvanceRogueRegroup(a, c.hero, 0.1);
  assert.equal(c.tacticalRogueRegroup(a).phase, 'thinking',
    'equal-sized but lower-level group must keep reasoning beyond its current anchor');
}
console.log('PASS equal-sized lower-level monster groups continue the regroup chain');
