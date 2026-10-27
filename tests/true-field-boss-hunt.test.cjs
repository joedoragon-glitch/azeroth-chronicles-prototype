'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');

// TRUE overworld hunters visit authored entrances and return to the point
// where their TRUE incarnation appeared, not the defeated ordinary boss home.
{
  const g = new C('normal', 'paladin', () => 0.73);
  g.enter('march');
  g.s.mercyTime = 0;
  g.s.time = 35;
  g.s.party = [];
  const appear = g.safe(1640, 620, 'march'),
    e = g.bossEnemy(g.boss('mire'), 'true', appear),
    z = g.zone();
  z.enemies = [e];
  assert(g.trueFieldBossCircuit(e));
  assert(!g.trueFieldBossCircuit(g.bossEnemy(g.boss('mire'), 'normal', appear)));
  const stops = g.trueFieldBossCircuitStops(e);
  assert.deepEqual(stops.map((p) => p.key), ['side', 'treasury', 'dungeon', 'origin']);
  assert.deepEqual({ x: stops[3].x, y: stops[3].y }, appear);
  assert.notDeepEqual(appear, g.fieldCenter(g.regionIndex()),
    'TRUE appearance is not the normal boss den');
  assert(stops.slice(0, 3).every((p) => z.npcs.some(
    (n) => n.kind === 'dungeon' && n.x === p.x && n.y === p.y)),
    'waypoints use existing outdoor entrance NPCs');

  // Native follow handles movement; the patrol does not teleport to stops.
  const nativeFollow = g.follow;
  let calledWith;
  g.follow = (actor, goal) => {
    if (actor === e) calledWith = { x: goal.x, y: goal.y };
    return true;
  };
  assert(g.updateTrueFieldBossCircuit(e, 0.1));
  assert.deepEqual(calledWith, { x: stops[0].x, y: stops[0].y });
  assert.deepEqual({ x: e.x, y: e.y }, appear, 'route processing never teleports');
  g.follow = nativeFollow;
  Object.assign(e, { x: stops[0].x, y: stops[0].y });
  assert(g.updateTrueFieldBossCircuit(e, 0.1));
  assert.equal(e.trueCircuitLeg, 1, 'arrival advances to Treasury');

  // An encountered hero supersedes the visit and uses ordinary engagement.
  Object.assign(e, appear);
  e.trueCircuitPause = 0;
  Object.assign(g.hero, { x: appear.x + 500, y: appear.y, hp: g.hero.maxHp });
  g.enemyRangedLine = () => true;
  g.updateEnemies(0.05);
  assert(e.aggro, 'TRUE hunter detects a visible hero beyond normal idle range');
  assert.deepEqual(e.trueCircuitCombatAnchor, appear);
  const interruptedLeg = e.trueCircuitLeg;
  g.disengage(e, 1.1);
  assert(!e.returning, 'disengagement completes locally');
  assert.deepEqual({ x: e.x, y: e.y }, appear, 'combat reset does not jump to den');
  assert.equal(e.trueCircuitLeg, interruptedLeg, 'patrol resumes its stage');
  assert.equal(e.trueCircuitCombatAnchor, undefined, 'combat anchor cleared');

  const restored = C.restore(g.snapshot()),
    re = restored.zone().enemies.find((u) => u.id === e.id);
  assert(re, 'living TRUE boss survives save/load');
  assert.deepEqual(re.trueCircuitOrigin, appear, 'appearance coordinate survives save/load');
  assert.equal(re.trueCircuitLeg, interruptedLeg, 'route stage survives save/load');
}

// Frontier has no authored Treasury entrance: never invent a fake destination.
{
  const g = new C('normal', 'mage', () => 0.73);
  g.enter('frontier');
  const e = g.bossEnemy(g.boss('warlord'), 'true', g.safe(1800, 1150, 'frontier'));
  assert.deepEqual(g.trueFieldBossCircuitStops(e).map((p) => p.key),
    ['side', 'dungeon', 'origin']);
}

// Existing captive patrols, stationary bosses and dungeon TRUE encounters
// remain outside the regional TRUE hunter system.
for (const family of ['thorn', 'cindermaw']) {
  const g = new C();
  g.enter(family === 'thorn' ? 'vale' : 'crown');
  const e = g.bossEnemy(g.boss(family), 'true', g.safe(1400, 1200));
  assert(!g.trueFieldBossCircuit(e), family + ' still has native captive patrol');
}
{
  const g = new C();
  const e = g.bossEnemy(g.boss('crypt'), 'true', g.safe(1160, 1120));
  assert(!g.trueFieldBossCircuit(e), 'dungeon TRUE boss retains its chamber encounter');
}

console.log('PASS TRUE field hunter origin, landmarks, hero-first interruption, local return, save and roaming exclusions');
