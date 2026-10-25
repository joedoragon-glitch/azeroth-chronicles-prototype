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
  // This is a controlled synthetic encounter, not the authored Vale layout.
  // Reading the live zone accessor reapplies legacy placement migrations that
  // can reposition fixture actors to existing native homes.
  c.zone = () => z;
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
  assert.equal(c.tacticalRogueRegroup(b).allyId, far.id,
    'coordination keeps the actual living refuge, not the guiding Ringleader');
  a.hp = 0;
  let movementOrder = null;
  c.follow = (actor, destination) => {
    movementOrder = { ...destination };
    actor.x += 5;
    return true;
  };
  const before = b.x;
  assert(c.tacticalAdvanceExtendedRetreat(b, c.hero, 0.1),
    'guide death does not invalidate the distant living defender');
  assert.equal(movementOrder?.x, far.home.x,
    'travel remains ordered toward the living refuge even after the guide dies');
  assert(b.x > before, 'second leader can continue its refuge movement');
}
console.log('PASS paired ringleaders can reach an occupied outpost beyond 750');

{
  const { c, z, a, add } = encounter();
  z.enemies.push(add(250, 'normal'));
  assert(c.tacticalBeginExtendedRetreat(a));
  c._tacticalRogueNext = new Map([[a.id, c.s.time + 20]]);
  let moveGoal = null;
  c.follow = (actor, destination) => {
    moveGoal = { ...destination };
    actor.x -= 5;
    return true;
  };
  const before = a.x, time = c.tacticalRogueRegroup(a).travelRemaining;
  c.tacticalAdvanceExtendedRetreat(a, c.hero, 0.2);
  assert(c.tacticalRogueRegroup(a).travelRemaining < time, 'travel clock advances');
  assert.equal(moveGoal?.x, 250, 'retreat locomotion retains the distant destination');
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
  const first = c.s.time;
  assert.equal(c._tacticalRogueNext.get(a.id), first + 2,
    'decision timer agrees with the two-second cast floor');
  a.telegraph = null;
  c.s.time = first + 1.99;
  assert(!c.tacticalRogueMove(a, c.hero), 'no cast before two seconds, even through a new tactical path');
  c.s.time = first + 2.01;
  assert(c.tacticalRogueMove(a, c.hero), 'a new cast is available just after two seconds');
  assert.equal(c._tacticalRogueNext.get(a.id), c.s.time + 2);
}
console.log('PASS two-second Rogue cast floor prevents spam without retaining a three-second gate');

{
  const { c, z, a } = encounter();
  z.enemies = [a]; // No available nearby or distant support.
  a.form = 'normal';
  assert(c.tacticalAutoRogue(a, c.hero), 'isolated defender considers withdrawal');
  assert.equal(c._tacticalRogueNext.get(a.id), c.s.time + 2);
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'escape',
    'no-help decision prioritizes physical withdrawal, not a standing Rogue loop');
  assert(a.telegraph?.rogueMove, 'eligible Rogue action can cover escape');
  const firstCast = c.s.time;
  const moveAway = (actor, destination) => {
    actor.x += Math.sign(destination.x - actor.x) * 8;
    return true;
  };
  c.move = moveAway;
  let approachOrders = 0;
  c.follow = () => { approachOrders++; return false; };
  const originalX = a.x;
  c.s.time += 0.1;
  c.updateEnemies(0.1);
  assert(a.x < originalX,
    'escape continues away from pursuer during warning: ' + JSON.stringify({
      before: originalX, after: a.x, phase: c.tacticalRogueRegroup(a)?.phase,
      returning: a.returning, aggro: a.aggro, motion: a.motion?.kind,
      warning: a.telegraph?.name, heroX: c.hero.x, calls: approachOrders,
    }));
  assert.equal(approachOrders, 0,
    'a covering Rogue cast must never reverse the withdrawal toward the hero');
  assert.equal(c.tacticalRogueRegroup(a).phase, 'escape');
  a.telegraph = null; // Simulate a completed legal warning before the next window.
  c.s.time = firstCast + 1.99;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.1));
  assert(!a.telegraph, 'escape cannot cast before the two-second limit');
  c.s.time = firstCast + 2.01;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.1));
  assert(a.telegraph?.rogueMove, 'another covering cast is available while escaping');
  assert.equal(c.tacticalRogueRegroup(a).phase, 'escape',
    'repeatable Rogue defense never replaces the escape state');
}
console.log('PASS isolated monsters withdraw while optional two-second Rogue cover remains available');

{
  const { c, z, a, add } = encounter();
  const far = add(2400, 'normal');
  z.enemies = [a, far];
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'extended',
    'living distant defenders take priority over Smoke Trick fallback');
  assert.equal(c.tacticalRogueRegroup(a).allyId, far.id);
  assert(!a.telegraph, 'retreat decision does not require a covering cast');
  assert(!z.enemies.some(u => u.rogueEmergencyReinforcement),
    'a valid refuge does not need emergency replacements');
}
console.log('PASS Ringleader chooses distant occupied refuge before Rogue cast or emergency call');

{
  const { c, z, a } = encounter();
  z.enemies = [a];
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  const guards = z.enemies.filter(u => u.rogueEmergencyReinforcement && u.hp > 0);
  assert(guards.length >= 2, 'unsupported Ringleader calls real reinforcements first');
  assert.equal(c.tacticalRogueRegroup(a).phase, 'anchored');
  assert(!a.telegraph?.rogueMove, 'reinforcement precedes a standalone Smoke Trick');
}
console.log('PASS isolated Ringleader summons first instead of standing and repeating Smoke Trick');

{
  const { c, z, a } = encounter();
  z.enemies = [a];
  c.tacticalEmergencyCall = () => false; // Every reinforcement attempt is unavailable.
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'escape',
    'Ringleader with no possible refuge or summon follows finite withdrawal');
  assert(!z.enemies.some(u => u.rogueEmergencyReinforcement));
  assert(a.telegraph?.rogueMove && a.telegraph.mobileRogueCast,
    'Ringleader still has its original mobile defensive Smoke Trick');
  let inbound = 0;
  c.follow = () => { inbound++; return true; };
  c.move = (actor, destination) => {
    actor.x += Math.sign(destination.x - actor.x) * 9;
    return true;
  };
  const before = a.x;
  c.s.time += 0.1;
  c.updateEnemies(0.1);
  assert(a.x < before, 'Ringleader physically withdraws during Smoke Trick warning');
  assert.equal(inbound, 0, 'mobile Smoke Trick does not turn escaping Ringleader toward hero');
  assert.equal(c.tacticalRogueRegroup(a).phase, 'escape');
}
console.log('PASS blocked Ringleader reinforcement causes moving, not stationary Smoke Trick fallback');

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


{
  const { c, z, a, add } = encounter();
  const visitor = add(2400, 'normal');
  visitor.home = { x: 2150, y: 1300 };
  z.enemies.push(visitor);
  assert.equal(c.tacticalBeginExtendedRetreat(a), false,
    'an abandoned post does not count as an occupied refuge');
  assert.equal(c.tacticalRogueRegroup(a), null);
}
console.log('PASS only occupied posts can serve as territorial refuge');

{
  const { c, z, a, add } = encounter();
  z.enemies.push(add(2400, 'normal'));
  let probes = 0;
  c.route = () => { probes++; return []; };
  assert.equal(c.tacticalBeginExtendedRetreat(a), false, 'unreachable post rejected');
  assert(probes > 0);
  const first = probes;
  assert.equal(c.tacticalBeginExtendedRetreat(a), false);
  assert.equal(probes, first, 'blocked route probing is rate-limited');
  c.s.time += 5.1;
  assert.equal(c.tacticalBeginExtendedRetreat(a), false);
  assert(probes > first, 'new route may be considered after bounded pause');
}
console.log('PASS unreachable territorial paths do not trigger unbounded route probes');

{
  const { c, z, a, add } = encounter();
  z.enemies.push(add(2400, 'normal'));
  assert(c.tacticalBeginExtendedRetreat(a));
  assert.equal(c.hawkRetreatKind(a), 'regroup',
    'extended withdrawal remains interruptible by the established Ranger counter');
  assert(c.hawkInterruptRetreat(a, 'regroup', 2));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'anchored',
    'Hawk interrupts extended movement without resetting the encounter');
}
console.log('PASS Ranger Hawk can interrupt territorial retreat');

{
  const { c, z, a } = encounter();
  let maximum = z.enemies.length;
  for (let wave = 0; wave < 12; wave++) {
    assert(c.tacticalEmergencyCall(a), 'replacements remain available after losses');
    const guards = z.enemies.filter(u =>
      u.rogueEmergencyReinforcement && u.owner === a.id && u.hp > 0
    );
    assert(guards.length >= 2 && guards.length <= 3);
    for (const add of guards) {
      add.hp = 0;
      c.kill(add);
    }
    c.updateEnemies(0.01);
    maximum = Math.max(maximum, z.enemies.length);
    assert(!z.enemies.some(u => u.rogueEmergencyReinforcement && u.hp <= 0),
      'dead emergency actors are reclaimed on the next update');
    c.s.time += 17;
  }
  assert(maximum <= 5, 'roster stays bounded despite repeated casualty/reinforcement cycles');
  assert.equal(c.s.statistics.kills, 0, 'temporary guards never inflate permanent kill count');
}
console.log('PASS repeated guardian replenishment remains bounded in memory and rewards');


{
  const { c, z, a, b, add } = encounter();
  const third = add(1370, 'normal');
  const far = add(2400, 'normal');
  z.enemies.push(third, far);
  assert.equal(c.tacticalLocalSupport(b), 3, 'three local bodies before withdrawal');
  assert(c.tacticalBeginExtendedRetreat(a));
  assert.equal(c.tacticalLocalSupport(b), 2,
    'a retreating defender is no longer counted as stationary local support');
  assert(!c.tacticalRegroupCandidates(b).includes(a),
    'a moving Ringleader cannot be mistaken for ordinary local regroup support');
  assert(c.tacticalBeginExtendedRetreat(b),
    'explicit distant coordination remains available despite local exclusion');
  assert.equal(c.tacticalRogueRegroup(b).allyId, far.id);
}
console.log('PASS distant withdrawal does not falsely inflate local group strength');
