'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

function encounter(region = 'vale', roll = 0.25) {
  const c = new Campaign('normal', 'paladin', () => roll);
  c.s.zone = region;
  const z = c.zone();
  z.props = [];
  c.s.time = 30;
  // These actors are deliberately already fighting; Vale's original
  // first-hero-hit onboarding must not erase synthetic engagements.
  c.s.valeFieldAwakened = true;
  c.s.thornHeroInitiated = true;
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
  assert(!a.returning, 'active synthetic Rogue fixture must not start its escape in returning state');
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
  // Field elites may seek ORDINARY monsters, not only elite followers. Their
  // territorial responsibility bounds movement but does not pin them in place.
  for (const role of ['boss', 'captain']) {
    const { c, z, a, add } = encounter();
    z.enemies = [a];
    if (role === 'boss') { a.type = 'boss'; a.family = 'ridge'; }
    else { a.captain = true; a.captainProfile = 'supply-vale'; }
    const ordinary = add(1580, 'normal');
    z.enemies.push(ordinary);
    assert(c.tacticalBeginExtendedRetreat(a),
      role + ' must be able to seek an occupied post held by an ordinary monster');
    const state = c.tacticalRogueRegroup(a);
    assert.equal(state.allyId, ordinary.id);
    assert(c.tacticalRogueLeashAllows(a, c.hero, 700),
      'moving field elite remains in its live territorial encounter');
    let destination = null;
    c.follow = (u, point) => { destination = point; u.x += 10; return true; };
    const before = a.x;
    assert(c.tacticalAdvanceExtendedRetreat(a, c.hero, 0.1));
    assert(a.x > before && destination.x === ordinary.home.x,
      role + ' makes physical progress toward its ordinary defender');
    const { c: limited, z: local, a: leader, add: addFar } = encounter();
    local.enemies = [leader];
    if (role === 'boss') { leader.type = 'boss'; leader.family = 'ridge'; }
    else { leader.captain = true; leader.captainProfile = 'supply-vale'; }
    local.enemies.push(addFar(2300, 'normal'));
    assert(!limited.tacticalBeginExtendedRetreat(leader),
      role + ' cannot desert its territory for a distant post');
  }
}
console.log('PASS field bosses and captains recruit ordinary regional defenders without deserting their posts');

{
  const { c, z, a } = encounter();
  z.enemies = [a];
  a.type = 'boss';
  a.family = 'ridge';
  const captive = { id: 'cage-ridge', kind: 'cage', family: 'ridge', x: 1050, y: 1300 };
  z.npcs = [captive];
  assert.equal(c.tacticalGuardedSpecialist(a), captive,
    'stationary captive specialist is a valid final-defense objective');
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'guard-captive',
    'isolated guardian must stand near captive instead of casting in place');
  assert(!a.telegraph?.rogueMove);
  let ordered = null;
  c.follow = (u, point) => { ordered = point; u.x -= 12; return true; };
  const before = a.x;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.1));
  assert(a.x < before && ordered === captive,
    'the final stand physically travels toward the existing captive NPC');
  assert(!c.s.rescued.ridge && !c.s.keys.ridge,
    'regrouping cannot free the specialist or award its skill benefits');
  assert(!c.combatTargets().includes(captive),
    'the civilian specialist remains outside combat targets');
}
console.log('PASS overwhelmed captive guardians return to existing civilians for their final stand');

{
  const { c, z, a } = encounter();
  a.type = 'boss';
  a.family = 'thorn';
  z.enemies = [a];
  z.npcs = [{ id: 'cage-thorn', kind: 'cage', family: 'thorn', x: 1300, y: 1280 }];
  assert(c.thornCaptiveFollowing(), 'the existing mobile-captive contract is active');
  assert.equal(c.tacticalGuardedSpecialist(a), null,
    'mobile specialists retain the existing patrol-follow implementation');
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'defend',
    'mobile specialist guardians hold their existing combat instead of resetting a captive patrol');
}
console.log('PASS mobile captives remain controlled by existing native patrol-follow systems');

{
  // A level disparity alone may prompt tactical assessment, not endless
  // escape from every solo hero walking past an otherwise healthy monster.
  const { c, z, a } = encounter();
  z.enemies = [a];
  c.s.party = [];
  a.form = 'normal';
  c.hero.level = 30;
  assert(c.tacticalAutoRogue(a, c.hero));
  c.s.time += 0.31;
  assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
  assert.equal(c.tacticalRogueRegroup(a).phase, 'defend');
  assert(!a.telegraph, 'outleveling by itself does not start an escape covering cast');
  const hp = a.hp;
  for (let i = 0; i < 35; i++) {
    c.s.time += 0.2;
    assert.equal(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.2), false,
      'defensive stance yields to established ordinary fighting');
  }
  assert.equal(a.hp, hp);
  assert(!a.returning, 'repeated reconsideration cannot turn level difference into a reset');
}
console.log('PASS healthy monsters do not flee a solo hero solely because of level disparity');

{
  // Leaders may seek other elites (rare, but valid), subject to a short
  // local movement budget rather than the entire native leash distance.
  const { c, z, a, add } = encounter();
  z.enemies = [a];
  a.type = 'boss';
  a.family = 'ridge';
  const otherBoss = add(1580, 'normal');
  otherBoss.type = 'boss';
  otherBoss.family = 'mire';
  z.enemies.push(otherBoss);
  assert(c.tacticalBeginExtendedRetreat(a), 'another living boss may be a nearby refuge');
  assert.equal(c.tacticalRogueRegroup(a).allyId, otherBoss.id);
  const { c: distant, z: area, a: leader, add: make } = encounter();
  area.enemies = [leader];
  leader.type = 'boss';
  leader.family = 'ridge';
  area.enemies.push(make(1780, 'normal'));
  assert(!distant.tacticalBeginExtendedRetreat(leader),
    'a refuge inside the broad boss leash is still too far for tactical retreat');
}
console.log('PASS field leaders may rally other elites but their retreat stays local');

{
  for (const role of ['boss', 'captain']) {
    const { c, z, a } = encounter();
    z.enemies = [a];
    if (role === 'boss') { a.type = 'boss'; a.family = 'ridge'; }
    else { a.captain = true; a.captainProfile = 'supply-vale'; }
    a.hp = a.maxHp * 0.7;
    const hp = a.hp;
    assert(c.tacticalAutoRogue(a, c.hero));
    c.s.time += 0.31;
    assert(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.31));
    assert.equal(c.tacticalRogueRegroup(a).phase, 'defend',
      role + ' with no allies must fight, not enter finite escape');
    for (let i = 0; i < 25; i++) {
      c.s.time += 0.2;
      assert.equal(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.2), false);
    }
    assert.equal(a.hp, hp, role + ' must not heal via a tactical reset');
    assert(!a.returning && a.aggro, role + ' retains its live encounter');
    // Even the pre-existing reached-refuge anchor may not time out into an
    // elite's full-health disengage while the hero stays within native leash.
    c._tacticalRegroups.set(a.id, {
      phase: 'anchored', anchor: { x: a.x, y: a.y },
      holdRemaining: 0.01, moveUsed: true, recruited: true,
    });
    c.hero.x = a.x + 400;
    assert.equal(c.tacticalAdvanceRogueRegroup(a, c.hero, 0.2), false);
    assert.equal(c.tacticalRogueRegroup(a), null);
    assert(!a.returning && a.hp === hp,
      role + ' anchor timeout returns control without resetting its health');
  }
}
console.log('PASS boss and captain no-support/anchor cases never force an encounter reset');

{
  const { c, z, a } = encounter('crypt');
  z.enemies = [a];
  a.type = 'boss';
  a.family = 'crypt';
  const farRoomTarget = { ...c.hero, x: a.home.x + 1100, y: a.home.y };
  assert(c.tacticalRogueLeashAllows(a, farRoomTarget, 1800),
    'original dungeon boss reach must support this player position');
  c._tacticalRegroups = new Map([[a.id, {
    phase: 'defend', anchor: { x: a.x, y: a.y }, holdRemaining: 6,
  }]]);
  assert(c.tacticalRogueLeashAllows(a, farRoomTarget, 1800),
    'new defensive fallback cannot shorten existing dungeon boss leash');
}
console.log('PASS the defensive boss stance preserves existing dungeon encounter reach');

{
  // The cast RELEASE, not merely the warning, must keep withdrawing actors
  // from closing the gap. Supported counteroffensive dash remains intact.
  const { c, z, a } = encounter();
  z.enemies = [a];
  c.s.party = [];
  a.form = 'normal';
  a.species = 'wolf';
  c.hero.x = a.x + 100;
  c._tacticalRegroups = new Map([[a.id, {
    phase: 'escape', anchor: { x: a.x, y: a.y },
    fleeRemaining: 5, seekDelay: 1, stalled: 0,
  }]]);
  assert(c.tacticalRogueMove(a, c.hero, true));
  assert.equal(a.telegraph.style, 'snare',
    'wolf retreat substitutes a defensive move for Flanking Snap dash');
  assert(a.telegraph.defensiveCover);
  a.telegraph = null;
  a.type = 'boss';
  a.family = 'ridge';
  c.tacticalStopRogueRegroup(a);
  c.s.time += 2.01;
  a.rogueBasicTurn = 0;
  assert(c.tacticalRogueMove(a, c.hero));
  assert.equal(a.telegraph.style, 'dash', 'the normal counteroffensive dash remains usable');
  let inbound = 0;
  const originalMove = c.move.bind(c);
  c.move = (actor, destination, ...args) => {
    if (actor === a && destination === c.hero) inbound++;
    return originalMove(actor, destination, ...args);
  };
  const startX = a.x, startY = a.y;
  c.tacticalResolveRogueMove(a, a.telegraph);
  assert.equal(inbound, 1, 'supported Rogue dash still attempts its attack at release');
  // Return to identical legal reach so the second assertion cannot pass just
  // because the first dash already closed the gap.
  a.x = startX;
  a.y = startY;
  const cover = { ...a.telegraph, defensiveCover: true };
  inbound = 0;
  c.tacticalResolveRogueMove(a, cover);
  assert.equal(inbound, 0, 'a committed covering cast can never dash inward at release');
}
console.log('PASS withdrawal covering actions and supported dash releases stay distinct');

{
  // Exercise the actual world router and follower at a reachable native
  // Vale position rather than treating every straight line as a legal path.
  const { c, z, a, add } = encounter();
  c.route = Campaign.prototype.route.bind(c);
  c.follow = Campaign.prototype.follow.bind(c);
  z.enemies = [a];
  let chosen = null;
  for (const x of [1560, 1600, 1620, 1540]) {
    const occupant = add(x, 'normal');
    z.enemies = [a, occupant];
    c._tacticalExtendedSearchAfter?.delete(a.id);
    if (c.tacticalBeginExtendedRetreat(a)) {
      chosen = occupant;
      break;
    }
  }
  assert(chosen, 'at least one occupied local post must have a native route');
  const start = Math.hypot(a.x - chosen.home.x, a.y - chosen.home.y);
  for (let i = 0; i < 8; i++) {
    c.s.time += 0.1;
    c.tacticalAdvanceExtendedRetreat(a, c.hero, 0.1);
  }
  assert(Math.hypot(a.x - chosen.home.x, a.y - chosen.home.y) < start,
    'native follower physically approaches the occupied post');
  assert(!a.returning, 'native reposition remains part of the same fight');
}
console.log('PASS extended refuge makes real navigation progress without disengaging');



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
