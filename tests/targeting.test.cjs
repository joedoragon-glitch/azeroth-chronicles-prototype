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
  assert(
    game.s.projectiles.some((p) => p.source === 'hero' && p.target === a.id),
    'the restored target receives the correct physical Skill 1 projectile',
  );
  for (let i = 0; i < 12 && a.hp >= a.maxHp; i++) game.updateProjectiles(0.05);
  assert(a.hp < a.maxHp, 'automatic fallback eventually lands its projectile');
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
  assert(
    game.s.projectiles.some((p) => p.source === 'hero' && p.target === boss.id),
    'the retained boss target receives the actual basic projectile',
  );
  for (let i = 0; i < 12 && boss.hp >= bossHp; i++) game.updateProjectiles(0.05);
  assert(boss.hp < bossHp, 'the boss is hit when the projectile reaches it');
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
  const heroOrderBeforeRecall = game.hero.order;
  game.recallParty();
  assert.equal(
    game.castMovementBasic(),
    false,
    'a retained distant target cannot restart pursuit after Recall',
  );
  assert.equal(game.hero.order, heroOrderBeforeRecall,
    'Recall and passive fire must preserve existing hero intent, including no order');
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
    true,
    'deliberate offense cannot silently cancel a player-timed Recall after arrival',
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


// Select a real clear lane within the authored map; props-only clearing is
// insufficient when native terrain can still block line of sight.
function rangedBasicClearLane(game, length, behind = 0) {
  for (let x = 850; x <= 2450; x += 160) {
    for (let y = 450; y <= 2450; y += 160) {
      const from = { x, y },
        end = { x: x + length, y },
        rear = { x: x - behind, y };
      if (
        !game.blocked(from.x, from.y) &&
        !game.blocked(end.x, end.y) &&
        !game.blocked(rear.x, rear.y) &&
        game.line(from, end)
      )
        return from;
    }
  }
  assert.fail('must find a native, unobstructed ranged basic test lane');
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
    const lane = rangedBasicClearLane(game, reach + 1);
    Object.assign(game.hero, { ...lane, basicCd: 0, order: null });
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
    const lane = rangedBasicClearLane(game, 285, 510);
    Object.assign(game.hero, { x: lane.x - 510, y: lane.y, order: null });
    const ally = game.unit(kind, lane.x, lane.y, kind === 'pet' ? petFamily : undefined);
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


// Investigation #684: characterize existing auto range, manual selection and legacy orders.
// These are baseline observations, NOT approval of the existing target-lock policy
// or the obsolete attack-order movement and automatic Skill 1 behavior.
function heroAutoInvestigation(heroClass, distances) {
  // The browser registers the playable fourth class at startup; standalone
  // native tests must explicitly opt into the same registry first.
  if (heroClass === 'rogue' && !Campaign.classes.rogue) Campaign.enableRoguePlaytest();
  const game = new Campaign('normal', heroClass, () => 0.9);
  const zone = game.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) zone[key] = [];
  game.s.party = [];
  game.s.mercyTime = 0;
  game.s.valeFieldAwakened = true;
  game.s.thornHeroInitiated = true;
  const reach = heroClass === 'rogue'
    ? Campaign.rules.rogueHeroFoundation.basic.range
    : game.heroSkillRange(1);
  const lane = rangedBasicClearLane(game, Math.max(reach + 60, ...distances) + 1);
  Object.assign(game.hero, { ...lane, basicCd: 0, order: null });
  const enemies = distances.map((distance, i) =>
    game.makeEnemy(
      { species: 'goblin', name: 'Auto investigation ' + i,
        level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: lane.x + distance, y: lane.y },
    ));
  zone.enemies = enemies;
  for (const enemy of enemies)
    assert(game.line(game.hero, enemy), heroClass + ' clear investigation sightline');
  return { game, reach, enemies };
}

for (const [heroClass, expectedRange] of [
  ['paladin', 120], ['mage', 400], ['ranger', 450], ['rogue', 220],
]) {
  for (const distance of [expectedRange - 1, expectedRange, expectedRange + 1]) {
    const { game, reach } = heroAutoInvestigation(heroClass, [distance]);
    assert.equal(reach, expectedRange, heroClass + ' current basic reach');
    const attacked = game.castMovementBasic();
    assert.equal(
      attacked, distance <= expectedRange,
      heroClass + ' passive acquisition at ' + distance,
    );
    assert.equal(game.hero.basicCd > 0, attacked, heroClass + ' basic-only recovery');
    assert.equal(game.hero.order, null, 'passive fire never creates an approach order');
  }

  // A manually selected, still-visible distant enemy is currently exclusive:
  // even a different enemy within legal auto-basic reach does not receive fire.
  // This is a documented design question, not a proposed future invariant.
  {
    const { game, enemies } = heroAutoInvestigation(heroClass, [
      expectedRange - 20, expectedRange + 40,
    ]);
    const [near, distant] = enemies;
    assert.equal(game.cycleHeroTarget(() => true)?.id, near.id);
    assert.equal(game.cycleHeroTarget(() => true)?.id, distant.id);
    assert.equal(game.selectedHeroTarget()?.id, distant.id);
    assert.equal(
      game.castMovementBasic(), false,
      heroClass + ' current distant manual target suppresses near auto-basic',
    );
    assert.equal(game.hero.basicCd, 0, 'suppressed passive cast consumes no basic recovery');
    assert.equal(game.hero.order, null, 'suppressed passive cast does not chase');

    // A merely remembered squad/last-combo focus is not the same as a manual
    // selection. When the player releases selection, nearby valid fire resumes.
    game.manualHeroTargetId = null;
    game.manualHeroTargetZone = null;
    game.manualHeroTargetLocked = false;
    assert.equal(game.s.heroTarget, distant.id, 'historical focus remains for fallback check');
    assert.equal(game.castMovementBasic(), true, heroClass + ' unselected near target fires');
    assert.equal(game.basicComboTargetId, near.id, 'automatic fallback targets near foe');
  }
}

// Historical hero 'attack' is now inert: no Skill 1, basic or chase authority.
{
  const { game, enemies } = heroAutoInvestigation('ranger', [345]);
  game.hero.order = { type: 'attack', id: enemies[0].id };
  game.tick(0.05, { x: 0, y: 0 });
  assert.equal(game.hero.cd[0], 0, 'old attack order cannot activate Skill 1');
  assert.equal(game.hero.basicCd, 0, 'old order cannot fire an automatic basic');
  assert.equal(game.hero.order, null, 'old command is dropped on native tick');
}
{
  const game = new Campaign('normal', 'mage', () => 0.9);
  const enemy = game.zone().enemies.find((e) => e.hp > 0 && !e.neutral);
  assert(enemy, 'real enemy for persisted-order characterization');
  game.hero.order = { type: 'attack', id: enemy.id };
  const snapshot = game.snapshot();
  assert.equal(snapshot.hero.order, null, 'legacy attack order cannot enter a v4 snapshot');
  const restored = Campaign.restore(snapshot, () => 0.9);
  assert.equal(restored.hero.order, null, 'sanitized snapshot has no chase intent');
  const imported = structuredClone(game.s);
  imported.hero.order = { type: 'attack', id: enemy.id };
  assert.equal(Campaign.validate(imported).hero.order, null,
    'historical v4 imports discard legacy attack orders before restoration');
  assert.equal(Campaign.restore(imported, () => 0.9).hero.order, null,
    'historical v4 import cannot reactivate old manual Skill 1');
}


// Investigation #684: live movement/navigation and Recall characterization.
// These establish present four-class behavior; future fixes must not preserve
// an unwanted Rogue-only Recall side effect by treating this as specification.
for (const [heroClass, reach] of [
  ['paladin', 120], ['mage', 400], ['ranger', 450], ['rogue', 220],
]) {
  const moving = heroAutoInvestigation(heroClass, [reach - 50]).game;
  const beforeX = moving.hero.x;
  moving.tick(0.05, { x: 1, y: 0 });
  assert(moving.hero.x > beforeX, heroClass + ' moves through the native tick');
  assert(moving.castMovementBasic(), heroClass + ' can passively attack after movement');
  assert.equal(moving.hero.order, null, 'moving autoattack does not start pursuit');

  const navigating = heroAutoInvestigation(heroClass, [reach - 50]).game;
  const destination = { x: navigating.hero.x + 80, y: navigating.hero.y };
  navigating.hero.order = { type: 'move', ...destination, navigation: true };
  navigating.hero.path = navigating.route(navigating.hero, destination);
  navigating.hero.routeAge = 1.3;
  navigating.tick(0.05, { x: 0, y: 0 });
  const journey = navigating.hero.order;
  assert.equal(journey?.type, 'move', 'native map-style travel order remains active');
  assert(navigating.castMovementBasic(), heroClass + ' fires while traveling');
  assert.equal(navigating.hero.order, journey, 'passive fire retains journey command');

  const recalled = heroAutoInvestigation(heroClass, [reach - 20]).game;
  const returning = recalled.unit('soldier', recalled.hero.x + 10, recalled.hero.y + 10);
  recalled.s.party = [returning];
  recalled.s.recallActive = true;
  assert(recalled.castMovementBasic(), heroClass + ' can defend during Recall');
  assert.equal(
    recalled.s.recallActive,
    true,
    heroClass + ' passive basic always preserves the active Recall order',
  );
}


// Investigation #684: inert old-order regression and independent Recall gates.
{
  // The Mage can fire at 385 (inside 400); an old order cannot impose 350.
  const { game, enemies } = heroAutoInvestigation('mage', [385]);
  const enemy = enemies[0], before = { x: game.hero.x, y: game.hero.y };
  game.hero.order = { type: 'attack', id: enemy.id };
  game.tick(0.05, { x: 0, y: 0 });
  assert.equal(game.hero.x, before.x,
    'legacy order cannot cause needless approach inside lawful Mage basic range');
  assert.equal(game.hero.order, null);
  assert(game.castMovementBasic(), 'Mage passive basic fires at its full legal range');
  assert(game.hero.basicCd > 0);
  assert.equal(game.hero.cd[0], 0, 'old order cannot change manual Skill 1');
}
{
  // Legacy instructions must not substitute manual song for an auto bell.
  const { game, enemies } = heroAutoInvestigation('rogue', [205]);
  game.hero.order = { type: 'attack', id: enemies[0].id };
  game.tick(0.05, { x: 0, y: 0 });
  assert.equal(game.hero.cd[0], 0, 'old Rogue order cannot activate manual song');
  assert.equal(game.hero.basicCd, 0, 'old Rogue order cannot release auto bell');
  assert.equal(game.hero.order, null);
  assert(!game.effects.some((e) => e.type === 'rogueBellSkill1'),
    'no old-command-generated singer-centered Skill 1 effect');
}
{
  // Rogue automatic basics remain independent from timed Recall.
  const { game } = heroAutoInvestigation('rogue', [160]);
  const companion = game.unit('soldier', game.hero.x + 350, game.hero.y);
  game.s.party = [companion];
  game.s.recallActive = true;
  assert(game.recallInProgress(), 'a companion is still traveling to the hero');
  assert(game.castMovementBasic(), 'Rogue defends while companion returns');
  assert.equal(game.s.recallActive, true,
    'Rogue autoattack cannot release an unfinished Recall');
  // Nearby-companion noncancellation is covered by the four-class witness.
}


// #684 owner contract: Recall is a five-second game-time toggle, independent of attacks.
{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.s.party = [g.unit('soldier', g.hero.x + 10, g.hero.y)];
  const start = g.s.time;
  assert(g.recallParty(), 'Recall activates');
  assert.equal(g.s.recallActive, true);
  assert.equal(g.s.recallExpiresAt, start + 5);
  assert.equal(g.recallSecondsRemaining(), 5);
  assert(g.recallParty(), 'second button action toggles Recall OFF');
  assert.equal(g.s.recallActive, false);
  assert.equal(g.recallSecondsRemaining(), 0);
  assert(!('recallExpiresAt' in g.s), 'cancelled Recall timer is removed');
  assert(g.recallParty(), 'Recall can be activated again');
  assert.equal(g.recallSecondsRemaining(), 5);
  for (let i = 0; i < 20; i++) g.tick(0.1);
  assert(g.s.recallActive, 'two game seconds do not finish Recall');
  const stored = g.snapshot();
  assert(Math.abs(stored.recallExpiresAt - (start + 5)) < 1e-5);
  const restored = Campaign.restore(stored, () => 0.9);
  assert(restored.s.recallActive, 'active timed Recall survives v4 save');
  assert(Math.abs(restored.recallSecondsRemaining() - 3) < 1e-5,
    'restore preserves remaining five-second budget');
  for (let i = 0; i < 31; i++) restored.tick(0.1);
  assert.equal(restored.s.recallActive, false, 'Recall expires after 5s of simulation');
  assert.equal(restored.recallSecondsRemaining(), 0);
  const legacy = structuredClone(stored);
  delete legacy.recallExpiresAt;
  const imported = Campaign.restore(legacy, () => 0.9);
  assert(imported.s.recallActive);
  assert.equal(imported.recallSecondsRemaining(), 5,
    'older v4 saves receive a bounded Recall timer on import');
  const invalid = structuredClone(stored);
  invalid.recallExpiresAt = invalid.time + 5000;
  assert.throws(() => Campaign.validate(invalid), /Invalid Recall timer/,
    'malformed imports cannot grant an unbounded defensive command');
  const noRecall = structuredClone(stored);
  noRecall.recallActive = false;
  assert.equal(Campaign.validate(noRecall).recallExpiresAt, undefined,
    'inactive Recall never preserves a stale timer');

  g.recallParty(); // after 2s, the second press ends the standing command
  assert.equal(g.s.recallActive, false);
  g.recallParty(); // restart
  assert.equal(g.gather('not-a-site'), false, 'labor is refused during Recall');
  assert.equal(g.s.recallActive, true, 'labor refusal cannot cancel Recall');
}


// #684 diagnostic only: quick-selected cover and held distant target both block auto fallback.
{
  const { game, enemies } = heroAutoInvestigation('ranger', [150, 330]);
  const [near, obscured] = enemies;
  assert.equal(game.cycleHeroTarget(() => true)?.id, near.id);
  assert.equal(game.cycleHeroTarget(() => true)?.id, obscured.id);
  assert.equal(game.manualHeroTargetLocked, false, 'quick selection is not a hold lock');
  const originalLine = game.line.bind(game);
  game.line = (from, to) => to === obscured ? false : originalLine(from, to);
  assert.equal(game.selectedHeroTarget()?.id, obscured.id,
    'selection remains despite lost line of sight');
  assert(originalLine(game.hero, near));
  assert.equal(game.castMovementBasic(), false,
    'quick-selected obscured foe presently suppresses firing at clear near foe');
}
{
  const { game, enemies } = heroAutoInvestigation('rogue', [150, 600]);
  const [near, held] = enemies;
  assert.equal(game.holdHeroTarget(() => true, held.id)?.id, held.id);
  assert.equal(game.manualHeroTargetLocked, true);
  held.x = game.hero.x + 900;
  assert.equal(game.selectedHeroTarget()?.id, held.id,
    'held target remains selected beyond the 680-unit quick-cycle limit');
  assert.equal(game.castMovementBasic(), false,
    'Rogue auto basic still prefers unreachable held foe over a near Charm candidate');
  assert.equal(near.hp, near.maxHp);
}


// #684: region transition drops both Recall hold and stale expiry.
{
  const game = new Campaign('normal', 'paladin', () => 0.9);
  assert(game.recallParty());
  assert.equal(game.s.recallActive, true);
  assert(Number.isFinite(game.s.recallExpiresAt));
  game.enter('march');
  assert.equal(game.s.recallActive, false, 'region transition cancels the prior Recall');
  assert.equal(game.s.recallExpiresAt, undefined,
    'region transition must not leave a stale timer for later emergency withdrawal');
}


// #684: Rogue manual songs and bell covering fire never release companion Recall.
for (const companionDistance of [350, 15]) {
  const { game, enemies } = heroAutoInvestigation('rogue', [150]);
  const foe = enemies[0];
  // Disable random Charm here; this case isolates the hero's attack contract.
  game.rogueCharmAttempt = () => false;
  game.hero.skills[0] = 1;
  game.hero.skills[1] = 1;
  game.s.party = [game.unit('soldier', game.hero.x + companionDistance, game.hero.y)];
  assert.equal(game.recallParty(), true, 'Recall activates before covering fire');
  const timer = game.s.recallExpiresAt;
  assert.equal(game.s.recallActive, true);
  assert(game.cast(1, foe.id), 'Rogue can manually perform Skill 1 while recalling');
  assert.equal(game.s.recallActive, true,
    'manual Rogue Skill 1 cannot cancel a player or safety-activated Recall');
  assert.equal(game.s.recallExpiresAt, timer, 'manual song cannot extend or shorten Recall');
  assert(game.cast(2, foe.id), 'Rogue can manually perform Skill 2 while recalling');
  assert.equal(game.s.recallActive, true,
    'manual Rogue Skill 2 cannot cancel companion withdrawal');
  assert.equal(game.s.recallExpiresAt, timer, 'second song cannot reset Recall duration');
  game.hero.basicCd = 0;
  assert(game.castMovementBasic(), 'automatic Rogue bell can cover the withdrawal');
  assert.equal(game.s.recallActive, true,
    'Rogue automatic basic cannot release Recall while covering retreat');
  assert.equal(game.s.recallExpiresAt, timer,
    'automatic bell never modifies the Recall expiration');
  assert(game.hero.cd[0] > 0 && game.hero.cd[1] > 0 && game.hero.basicCd > 0,
    'two manual song cooldowns and automatic basic recovery stay independent');
}


// #684: Recall never cancels an already authorized hero skill-approach order.
{
  const { game, enemies } = heroAutoInvestigation('mage', [460]);
  const enemy = enemies[0];
  assert(game.cast(1, enemy.id),
    'manual out-of-range Mage Skill 1 creates its normal approach request');
  const pending = game.hero.order;
  assert.equal(pending?.type, 'skill-approach');
  game.s.party = [game.unit('soldier', game.hero.x + 300, game.hero.y + 25)];
  assert(game.recallParty(), 'squad can be recalled while hero Skill 1 is approaching');
  assert.equal(game.hero.order, pending,
    'Recall cannot erase a player-authorized hero Skill 1 approach');
  assert.equal(game.s.recallActive, true);
  const oldX = game.hero.x;
  game.tick(0.05, { x: 0, y: 0 });
  assert(game.hero.x >= oldX,
    'hero is still permitted to approach and cover the retreat during Recall');
  assert.equal(game.s.recallActive, true,
    "hero's ongoing approach neither cancels nor extends companion Recall");
}
