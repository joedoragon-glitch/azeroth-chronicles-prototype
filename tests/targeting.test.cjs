'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function encounter() {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.zone().props = [];
  game.s.mercyTime = 0;
  Object.assign(game.hero, { x: 500, y: 500 });
  const a = game.makeEnemy(
    { species: 'goblin', name: 'Near foe', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 580, y: 500 },
  );
  const b = game.makeEnemy(
    { species: 'goblin', name: 'Far foe', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 640, y: 500 },
  );
  game.zone().enemies = [a, b];
  return { game, a, b };
}

{
  const { game, a, b } = encounter();
  assert.equal(game.heroSkillRange(1, true), 120);
  assert.equal(game.cycleHeroTarget().id, a.id, 'first Q selects the nearest available foe');
  assert.equal(game.cycleHeroTarget().id, b.id, 'second Q selects the next');
  assert.equal(game.selectedHeroTarget().id, b.id);
  const before = a.hp;
  assert.equal(game.cast(1), false, 'a selected enemy outside skill range is not silently replaced');
  assert.equal(a.hp, before, 'closer foe is not accidentally attacked');
  assert.equal(game.hero.cd[0], 0, 'failed attack consumes no cooldown');
  assert.equal(game.cycleHeroTarget().id, a.id, 'Q wraps to the first target');
  assert.equal(game.cast(1), true);
  assert(a.hp < before, 'manual selection directs basic attacks');
  assert.equal(game.s.heroTarget, a.id, 'squad focus also sees the selected enemy');
  game.zone().enemies = [b];
  assert.equal(game.selectedHeroTarget(), null, 'defeated or departed foes clear selection');
  assert.equal(game.manualHeroTargetId, null);
}
{
  const { game, a, b } = encounter();
  game.s.heroTarget = b.id; // auto combat already favors the boss/farther foe
  assert.equal(game.holdHeroTarget(() => true, b.id)?.id, b.id, 'long hold keeps current automatic combat target');
  assert.equal(game.manualHeroTargetLocked, true);
  const summon = game.makeEnemy(
    { species: 'goblin', name: 'New add', level: 1, hp: 5000, damage: 0, gold: 0, xp: 0 },
    { x: 530, y: 500 },
  );
  game.zone().enemies.push(summon);
  assert.equal(game.selectedHeroTarget()?.id, b.id, 'nearby summon cannot replace auto-target-held lock');
  b.returning = 1;
  assert.equal(game.selectedHeroTarget(), null, 'disengaging a boss ends the encounter lock');
  assert.equal(game.s.heroTarget, null, 'stale squad target clears on boss disengage');
  assert.equal(game.manualHeroTargetLocked, false);
}
{
  const { game, a, b } = encounter();
  game.cycleHeroTarget();
  game.cycleHeroTarget();
  b.x = 550;
  b.y = 500;
  assert.equal(game.cast(1), true, 'selected enemy works after moving into range');
  assert.equal(game.s.heroTarget, b.id);
  assert.equal(a.hp, a.maxHp, 'a manually selected foe wins over a nearer alternative');
  b.hp = 0;
  assert.equal(game.selectedHeroTarget(), null);
  assert.equal(game.cast(1), true, 'auto-targeting resumes once the locked foe dies');
  assert(a.hp < a.maxHp);
}
{
  const { game, a, b } = encounter();
  assert.equal(game.cycleHeroTarget((e) => e.id === b.id).id, b.id, 'screen filter narrows cycle');
  b.x = 1300;
  assert.equal(game.selectedHeroTarget(), null, 'long-distance separation releases a target');
  assert.equal(game.cycleHeroTarget((e) => false), null, 'no visible enemies releases selection');
  assert.equal(game.cycleHeroTarget((e) => e.id === a.id).id, a.id);
  game.enter('march');
  assert.equal(game.selectedHeroTarget(), null, 'changing zones releases stale selection');
  assert.equal(game.snapshot().heroTarget, null, 'targeting is transient and does not alter save v4');
}
{
  const { game, a, b } = encounter();
  game.cycleHeroTarget();
  game.cycleHeroTarget();
  assert.equal(game.holdHeroTarget().id, b.id, 'long hold locks the existing selection');
  assert.equal(game.manualHeroTargetLocked, true);
  const summons = Array.from({ length: 3 }, (_, i) =>
    game.makeEnemy(
      { species: 'goblin', name: 'Summon ' + i, level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 530 + i * 6, y: 510 },
    ),
  );
  game.zone().enemies.push(...summons);
  Object.assign(game.hero, { x: 1250, y: 900 });
  assert.equal(game.selectedHeroTarget()?.id, b.id, 'a target lock survives retreat and dodging out of range');
  game.hero.cd[0] = 0;
  assert.equal(game.cast(1), false, 'summons cannot steal the boss lock when it is beyond reach');
  assert(summons.every((s) => s.hp === s.maxHp), 'no accidental hit against summons');
  Object.assign(game.hero, { x: 600, y: 500 });
  assert.equal(game.cycleHeroTarget().id, summons[0].id, 'quick press moves to a new nearby foe');
  assert.equal(game.manualHeroTargetLocked, false, 'cycling releases the former lock');
  assert.equal(game.holdHeroTarget().id, summons[0].id, 'holding again locks the new selection');
  summons[0].hp = 0;
  assert.equal(game.selectedHeroTarget(), null, 'death immediately releases a held target');
  assert.equal(game.manualHeroTargetLocked, false);
  assert.equal(game.holdHeroTarget((e) => e.id === a.id)?.id, a.id, 'holding with no selection chooses nearest visible enemy');
  game.enter('march');
  assert.equal(game.selectedHeroTarget(), null, 'target lock never persists across zone changes');
  assert.equal(game.manualHeroTargetLocked, false);
  assert.equal(game.snapshot().heroTarget, null, 'target locks remain absent from saved campaign data');
}
{
  // Boss priority is a strategic player choice, not nearest-enemy combat AI.
  const { game, a: boss, b: pup } = encounter();
  boss.name = 'Thornfang';
  pup.name = 'Thornfang pup';
  pup.summon = true;
  pup.x = 555; // The summon is closer than Thornfang.
  assert.equal(game.cycleHeroTarget((e) => e.id === boss.id).id, boss.id);
  assert.equal(game.holdHeroTarget().id, boss.id, 'holding Target locks the chosen boss');
  assert.equal(game.manualHeroTargetLocked, true);
  const previousHp = pup.hp;
  Object.assign(game.hero, { x: 1320, y: 500 });
  pup.x = 1350;
  assert.equal(game.selectedHeroTarget()?.id, boss.id, 'dodging beyond 680 does not lose boss lock');
  assert.equal(game.cast(1), false, 'the closer pup cannot steal a locked out-of-range attack');
  assert.equal(pup.hp, previousHp, 'out-of-range locked attack cannot hit summons instead');
  Object.assign(game.hero, { x: 520, y: 500 });
  game.hero.cd[0] = 0;
  const bossHp = boss.hp;
  assert(game.cast(1), 'returning to range attacks the locked boss');
  assert(boss.hp < bossHp, 'the boss is hit when reacquired');
  assert.equal(pup.hp, previousHp, 'the distracting pup remains unharmed');
  assert.equal(game.manualHeroTargetLocked, true);
  pup.x = 555;
  assert.equal(game.cycleHeroTarget((e) => e.id === pup.id)?.id, pup.id);
  assert.equal(game.manualHeroTargetLocked, false, 'a deliberate tap to a new foe releases the lock');
}
{
  const { game, a: boss } = encounter();
  game.cycleHeroTarget((e) => e.id === boss.id);
  game.holdHeroTarget();
  boss.returning = true;
  assert.equal(game.selectedHeroTarget(), null, 'encounter reset releases the lock');
  assert.equal(game.manualHeroTargetLocked, false);
  boss.returning = false;
  game.cycleHeroTarget((e) => e.id === boss.id);
  game.holdHeroTarget();
  boss.aggro = false;
  Object.assign(game.hero, { x: 2100, y: 500 });
  assert.equal(game.selectedHeroTarget(), null, 'full disengagement clears an unreachable old lock');
}
{
  const { game, a } = encounter();
  game.cycleHeroTarget((e) => e.id === a.id);
  game.holdHeroTarget();
  game.enter('march');
  assert.equal(game.selectedHeroTarget(), null, 'travel cannot carry a boss lock to another region');
  assert.equal(game.manualHeroTargetLocked, false);
  assert(!('manualHeroTargetLocked' in game.snapshot()), 'lock state is excluded from v4 saves');
}

console.log('PASS visible target cycling, manual attack priority, range refusal, fallback and boss/summon lock, disengagement and zone cleanup');
