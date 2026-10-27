'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function encounter() {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.zone().props = [];
  game.s.mercyTime = 0;
  // This suite tests ordinary targeting, not the level-1 field opening
  // that intentionally prevents automatic first attacks.
  game.s.valeFieldAwakened = true;
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
  assert.equal(game.heroSkillRange(1, true), 190, 'current charged Paladin reach');
  assert.equal(game.cycleHeroTarget().id, a.id, 'first Q selects the nearest available foe');
  assert.equal(game.cycleHeroTarget().id, b.id, 'second Q selects the next');
  assert.equal(game.selectedHeroTarget().id, b.id);
  const before = a.hp;
  assert.equal(game.cast(1), true, 'a selected enemy outside skill range queues an approach');
  assert.equal(game.hero.order?.type, 'skill-approach');
  assert.equal(game.hero.order.id, b.id);
  const queued = game.hero.order;
  assert.equal(game.castMovementBasic(), false, 'automatic movement basic preserves queued skill');
  assert.equal(game.hero.order, queued);
  assert.equal(a.hp, before, 'closer foe is not accidentally attacked');
  assert.equal(game.hero.cd[0], 0, 'approach consumes no cooldown');
  assert.equal(game.cycleHeroTarget().id, a.id, 'Q wraps to the first target');
  assert.equal(game.cast(1), true);
  assert(
    game.s.projectiles.some((p) => p.source === 'hero' && p.target === a.id),
    'manual selection launches the physical Skill 1 projectile at the chosen enemy',
  );
  for (let i = 0; i < 12 && a.hp >= before; i++) game.updateProjectiles(0.05);
  assert(a.hp < before, 'manual selection directs the actual projectile contact');
  assert.equal(game.s.heroTarget, a.id, 'squad focus also sees the selected enemy');
  game.zone().enemies = [b];
  assert.equal(game.selectedHeroTarget(), null, 'defeated or departed foes clear selection');
  assert.equal(game.manualHeroTargetId, null);
}
{
  const { game, a, b } = encounter();
  game.s.heroTarget = b.id; // auto combat already favors the boss/farther foe
  assert.equal(
    game.holdHeroTarget(() => true, b.id)?.id,
    b.id,
    'long hold keeps current automatic combat target',
  );
  assert.equal(game.manualHeroTargetLocked, true);
  const summon = game.makeEnemy(
    { species: 'goblin', name: 'New add', level: 1, hp: 5000, damage: 0, gold: 0, xp: 0 },
    { x: 530, y: 500 },
  );
  game.zone().enemies.push(summon);
  assert.equal(
    game.selectedHeroTarget()?.id,
    b.id,
    'nearby summon cannot replace auto-target-held lock',
  );
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
  // Put the fallback foe on the same confirmed clear lane as the prior hit.
  // Manual selection does not bypass the world's line-of-sight rules.
  a.x = b.x;
  a.y = b.y;
  game.hero.cd[0] = 0; // A new target cannot bypass the normal skill cooldown.
  assert.equal(game.cast(1), true, 'auto-targeting resumes once the locked foe dies');
  assert(a.hp < a.maxHp);
}
{
  const { game, a, b } = encounter();
  assert.equal(game.cycleHeroTarget((e) => e.id === b.id).id, b.id, 'screen filter narrows cycle');
  b.x = 1300;
  assert.equal(game.selectedHeroTarget(), null, 'long-distance separation releases a target');
  assert.equal(
    game.cycleHeroTarget((e) => false),
    null,
    'no visible enemies releases selection',
  );
  assert.equal(game.cycleHeroTarget((e) => e.id === a.id).id, a.id);
  game.enter('march');
  assert.equal(game.selectedHeroTarget(), null, 'changing zones releases stale selection');
  assert.equal(
    game.snapshot().heroTarget,
    null,
    'targeting is transient and does not alter save v4',
  );
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
      { x: 530 - i * 6, y: 510 },
    ),
  );
  game.zone().enemies.push(...summons);
  Object.assign(game.hero, game.safe(1250, 900));
  assert(game.route(game.hero, b).length, 'distant-lock fixture has a real walkable approach');
  assert.equal(
    game.selectedHeroTarget()?.id,
    b.id,
    'a target lock survives retreat and dodging out of range',
  );
  game.hero.cd[0] = 0;
  assert.equal(game.cast(1), true, 'a distant lock queues approach rather than hitting a summon');
  assert.equal(game.hero.order?.id, b.id);
  assert.equal(game.hero.cd[0], 0);
  assert(
    summons.every((s) => s.hp === s.maxHp),
    'no accidental hit against summons',
  );
  Object.assign(game.hero, { x: 600, y: 500 });
  assert.equal(game.cycleHeroTarget().id, summons[0].id, 'quick press moves to a new nearby foe');
  assert.equal(game.manualHeroTargetLocked, false, 'cycling releases the former lock');
  assert.equal(game.holdHeroTarget().id, summons[0].id, 'holding again locks the new selection');
  summons[0].hp = 0;
  assert.equal(game.selectedHeroTarget(), null, 'death immediately releases a held target');
  assert.equal(game.manualHeroTargetLocked, false);
  assert.equal(
    game.holdHeroTarget((e) => e.id === a.id)?.id,
    a.id,
    'holding with no selection chooses nearest visible enemy',
  );
  game.enter('march');
  assert.equal(game.selectedHeroTarget(), null, 'target lock never persists across zone changes');
  assert.equal(game.manualHeroTargetLocked, false);
  assert.equal(
    game.snapshot().heroTarget,
    null,
    'target locks remain absent from saved campaign data',
  );
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
  Object.assign(game.hero, game.safe(1320, 500));
  assert(game.route(game.hero, boss).length, 'boss-lock fixture has a real walkable approach');
  pup.x = 1350;
  assert.equal(
    game.selectedHeroTarget()?.id,
    boss.id,
    'dodging beyond 680 does not lose boss lock',
  );
  assert.equal(
    game.cast(1),
    true,
    'approach preserves the locked boss rather than selecting its pup',
  );
  assert.equal(game.hero.order?.id, boss.id);
  assert.equal(game.hero.cd[0], 0);
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
  assert.equal(
    game.manualHeroTargetLocked,
    false,
    'a deliberate tap to a new foe releases the lock',
  );
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
  assert.equal(
    game.selectedHeroTarget(),
    null,
    'full disengagement clears an unreachable old lock',
  );
}
{
  const { game, a } = encounter();
  game.cycleHeroTarget((e) => e.id === a.id);
  game.holdHeroTarget();
  game.enter('march');
  assert.equal(
    game.selectedHeroTarget(),
    null,
    'travel cannot carry a boss lock to another region',
  );
  assert.equal(game.manualHeroTargetLocked, false);
  assert(!('manualHeroTargetLocked' in game.snapshot()), 'lock state is excluded from v4 saves');
}

{
  const { game, a } = encounter();
  assert.equal(game.cycleHeroTarget((e) => e.id === a.id)?.id, a.id);
  assert.equal(game.holdHeroTarget()?.id, a.id);
  assert.equal(game.s.heroTarget, a.id);
  assert.equal(
    game.cycleHeroTarget(() => false),
    null,
    'quick press releases an offscreen lock',
  );
  assert.equal(game.manualHeroTargetLocked, false);
  assert.equal(game.s.heroTarget, null, 'offscreen unlock also releases stale legacy focus');
}

// Movement basics are passive covering fire, never approach/Recall commands.
for (const heroClass of ['paladin', 'mage', 'ranger']) {
  const { game, b } = encounter();
  game.hero.class = heroClass;
  game.hero.skills[0] = 1;
  game.hero.mp = game.hero.maxMp;
  game.zone().enemies = [b];
  b.x = game.hero.x + game.heroSkillRange(1) + 40;
  game.manualHeroTargetId = b.id;
  game.manualHeroTargetZone = game.zoneId;
  game.s.heroTarget = b.id;
  game.recallParty();
  assert.equal(
    game.castMovementBasic(),
    false,
    'a retained distant target cannot restart pursuit after Recall',
  );
  assert.equal(game.hero.order, null);
  const retreat = { type: 'move', x: 400, y: 500 };
  game.hero.order = retreat;
  const hp = b.hp,
    mp = game.hero.mp;
  assert.equal(
    game.castMovementBasic(),
    false,
    heroClass + ' distant auto target cannot queue pursuit',
  );
  assert.equal(game.hero.order, retreat, 'auto fire preserves the retreat destination');
  assert.equal(game.s.recallActive, true, 'out-of-range auto fire preserves Recall');
  assert.equal(game.hero.cd[0], 0);
  assert.equal(game.hero.mp, mp);
  assert.equal(b.hp, hp);
  b.x = game.hero.x + Math.min(80, game.heroSkillRange(1) - 1);
  assert.equal(game.castMovementBasic(), true, heroClass + ' still fires at a reachable target');
  assert.equal(game.hero.order, retreat, 'in-range auto fire cannot replace movement');
  assert.equal(
    game.s.recallActive,
    true,
    'in-range auto fire cannot release companions from Recall',
  );
  assert.equal(
    game.selectedHeroTarget().id,
    b.id,
    'Recall and auto fire preserve explicit target identity',
  );
  game.hero.cd[0] = 0;
  assert.equal(game.cast(1), true, 'a deliberate attack remains possible');
  assert.equal(
    game.s.recallActive,
    true,
    'deliberate hero offense cannot abandon companions still returning',
  );
  for (const u of game.activeLivingParty())
    Object.assign(u, game.safe(game.hero.x + 50, game.hero.y));
  game.hero.cd[0] = 0;
  assert.equal(game.cast(1), true, 'a new deliberate attack after arrival is allowed');
  assert.equal(
    game.s.recallActive,
    false,
    'deliberate offense resumes squad engagement after every companion arrives',
  );
  game.hero.cd[0] = 0;
  b.x = game.hero.x + game.heroSkillRange(1) + 40;
  assert.equal(
    game.cast(1),
    true,
    'deliberate out-of-range Skill 1 still queues its approved approach',
  );
  assert.equal(game.hero.order?.type, 'skill-approach');
  assert.equal(game.hero.order.id, b.id);
}


for (const heroClass of ['paladin', 'mage', 'ranger']) {
  const game = new Campaign('normal', heroClass, () => 0.9);
  game.zone().props = [];
  game.s.mercyTime = 0;
  Object.assign(game.hero, { x: 500, y: 500 });
  const reach = game.heroSkillRange(1);
  const distant = game.makeEnemy(
    { species: 'goblin', name: 'Distant target', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 500 + reach + 45, y: 500 },
  );
  game.zone().enemies = [distant];
  game.manualHeroTargetId = distant.id;
  game.manualHeroTargetZone = game.zoneId;
  game.s.heroTarget = distant.id;
  assert.equal(game.selectedHeroTarget()?.id, distant.id, heroClass + ' keeps selected foe');

  // A map-owned move must never be replaced by a skill approach, even when
  // a deliberately selected out-of-range target would ordinarily be chased.
  const path = [{ x: 600, y: 650 }];
  const travel = { type: 'move', x: 600, y: 650, navigation: true };
  game.hero.order = travel;
  game.hero.path = path;
  const mp = game.hero.mp, cd = game.hero.cd[0], hp = distant.hp;
  assert.equal(game.cast(1), false, heroClass + ' out-of-range cast is not queued during Map travel');
  assert.equal(game.hero.order, travel, 'map travel keeps the original order');
  assert.equal(game.hero.path, path, 'map travel keeps the route');
  assert.equal(game.hero.mp, mp, 'out-of-range cast does not consume mana');
  assert.equal(game.hero.cd[0], cd, 'out-of-range cast does not start cooldown');
  assert.equal(distant.hp, hp, 'no remote hit');
  assert.equal(game.cast(1, distant.id), false, 'explicit target ID is also non-interrupting');
  assert.equal(game.hero.order, travel, 'explicit target cannot hijack map autopilot');
  assert.equal(game.castMovementBasic(), false, 'automatic basic never chases the distant foe');
  assert.equal(game.hero.order, travel);

  // Existing targeting and movement-basic fixtures above separately
  // assert in-range attacking and normal deliberate skill-approach behavior.
}


// Ranged hero automatic target scans use each class's real basic reach,
// not enemy aggro distance or the wider manual target-selection radius.
for (const [heroClass, reach] of [['mage', 400], ['ranger', 450]]) {
  for (const distance of [reach, reach + 1]) {
    const game = new Campaign('normal', heroClass, () => 0.9);
    const zone = game.zone();
    for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) zone[key] = [];
    game.s.party = [];
    game.s.mercyTime = 0;
    game.s.valeFieldAwakened = true;
    game.s.thornHeroInitiated = true;
    Object.assign(game.hero, { x: 1100, y: 1100, basicCd: 0, order: null });
    game.hero.skills[0] = 1;
    const foe = game.makeEnemy(
      { species: 'goblin', name: 'Basic reach probe', level: 1, hp: 10000, damage: 0,
        gold: 0, xp: 0 },
      { x: game.hero.x + distance, y: game.hero.y },
    );
    zone.enemies = [foe];
    assert(game.line(game.hero, foe), heroClass + ' unobstructed sight');
    assert.equal(game.heroSkillRange(1), reach, heroClass + ' basic reach');
    const projectiles = game.s.projectiles.length;
    assert.equal(
      game.castMovementBasic(),
      distance <= reach,
      heroClass + ' auto acquisition at ' + distance,
    );
    assert.equal(
      game.s.projectiles.length > projectiles,
      distance <= reach,
      heroClass + ' real basic projectile at ' + distance,
    );
    assert.equal(game.hero.order, null, 'automatic basic never starts pursuit');
  }
}

// An active Archer or ranged pet can spot an ALREADY-ENGAGED enemy within its
// own shot radius even when that enemy lies past the 540-unit hero squad band.
// Idle monsters, line-of-sight blocks, benched units and Recall remain safe.
for (const kind of ['archer', 'pet']) {
  const petFamily = Object.keys(Campaign.rules.petCompanions).find(
    (id) => Campaign.rules.petCompanions[id].role === 'ranged',
  );
  assert(petFamily, 'an authored ranged pet family is available');
  for (const [distance, engaged, blocked, recalled, expectedShot] of [
    [275, true, false, false, true],
    [285, true, false, false, false],
    [275, false, false, false, false],
    [275, true, true, false, false],
    [275, true, false, true, false],
  ]) {
    const game = new Campaign('normal', 'mage', () => 0.9);
    const zone = game.zone();
    for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) zone[key] = [];
    game.s.valeFieldAwakened = true;
    game.s.thornHeroInitiated = true;
    game.s.mercyTime = 0;
    game.s.expeditionRank = 6;
    Object.assign(game.hero, { x: 900, y: 1200, order: null });
    const ally = game.unit(kind, 1410, 1200, kind === 'pet' ? petFamily : undefined);
    ally.cd = 0;
    ally.skill1Cd = ally.skill2Cd = ally.skillGlobalCd = 100;
    game.s.party = [ally];
    const foe = game.makeEnemy(
      { species: 'goblin', name: 'Ranged ally awareness probe', level: 1,
        hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: ally.x + distance, y: ally.y },
    );
    zone.enemies = [foe];
    if (engaged) game.engage(foe);
    assert(Math.hypot(foe.x - game.hero.x, foe.y - game.hero.y) > 540);
    if (blocked) game.line = () => false;
    if (recalled) game.recallParty();
    const isThreat = game.squadThreats().includes(foe);
    assert.equal(
      isThreat,
      engaged && !blocked && distance <= 280,
      kind + ' own-shot threat recognition at ' + distance,
    );
    const before = game.s.projectiles.length;
    game.updateParty(0);
    assert.equal(
      game.s.projectiles.length > before,
      expectedShot,
      kind + ' target acquisition and basic release at ' + distance,
    );
  }
}

console.log(
  'PASS visible target cycling, manual attack priority, queued approach, fallback and boss/summon lock, disengagement and zone cleanup',
);
