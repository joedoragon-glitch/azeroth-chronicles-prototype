'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
let count = 0;
function test(name, callback) {
  callback();
  console.log('PASS ' + name);
  count++;
}
function encounter({ ranged = false, guard = false, elite = false, mode = 'normal' } = {}) {
  const game = new Campaign(mode, 'paladin', () => 0.99);
  game.zone().props = [];
  game.s.party = [];
  game.s.time = 30;
  // Use an actual unobstructed Vale contact lane, not coordinates that may
  // intersect the river/landscape. Never bypass native LOS or impact checks.
  const gap = ranged ? 175 : 76;
  let anchor = null;
  for (let y = 400; y <= 2700 && !anchor; y += 200) {
    for (let x = 400; x <= 2700 && !anchor; x += 160) {
      const from = { x, y }, to = { x: x + gap, y };
      if (game.blocked(from.x, from.y, 'vale', 15) ||
          game.blocked(to.x, to.y, 'vale', 15) ||
          !game.line(from, to) || !game.clearSegment(from, to, 15)) continue;
      // Melee geometry and Guardian checks also need open nearby positions.
      if (!ranged && [
        { x: x + 90, y: y + 55 },
        { x: x - 110, y },
        { x: x + 95, y },
      ].some((p) => game.blocked(p.x, p.y, 'vale', 15) || !game.line(from, p)))
        continue;
      anchor = from;
    }
  }
  assert(anchor, 'original Vale map provides a lawful native contact lane');
  const enemy = game.makeEnemy(
    { species: 'skeleton', name: 'Skeleton', level: 4, hp: 10000, damage: 50, gold: 0, xp: 0 },
    anchor,
  );
  Object.assign(enemy, {
    guard, ranged, form: elite ? 'ringleader' : 'normal',
    aggro: true, fightStart: 0, cd: 0, specialCd: 0,
  });
  game.zone().enemies = [enemy];
  Object.assign(game.hero, {
    x: ranged ? enemy.x + 175 : enemy.x + 76,
    y: enemy.y, hp: 100000, maxHp: 100000,
    immune: 0, slow: 0, level: 10,
  });
  return { game, enemy };
}
function castAndRelease(game, enemy) {
  assert(game.startSkeletonCraft(enemy, game.hero), 'lawful native cast starts');
  const cast = enemy.telegraph;
  assert(cast.skeletonCraft && cast.mobileRogueCast && cast.name);
  assert(cast.timer > 0 && cast.total === cast.timer);
  game.resolveAttack(enemy);
  return cast;
}

test('Exact 25 existing titles plus four new craft names match approved English identities', () => {
  const t = Campaign.rules.tacticalFoundation;
  assert.equal(Object.keys(t.skillLoreTitles).length, 25);
  assert.deepEqual(
    ['melee', 'ranged'].flatMap((role) =>
      ['ordinary', 'ringleader'].map((tier) => t.skeletonCraftSkills[role][tier].name)),
    ['Mortise Cut', 'Double Shear', 'Datum Line', 'Resection'],
  );
  assert.equal(t.skillLoreTitles['Slingmaster Split Screen'][0], 'Fixation');
  assert(!Object.values(t.skillLoreTitles).some(([name]) => name === 'Immobilization'));
});

test('Actual context gates professional titles; wild independent actors retain old identities', () => {
  const { game, enemy } = encounter();
  assert.equal(game.monsterSkillTitle('Bone Hook', enemy), 'Counterpressure');
  assert.equal(game.monsterSkillTitle('Graveveil Retreat', { species: 'wraith' }), 'Afterimage');
  assert.equal(game.monsterSkillTitle('Rockside Slam', { species: 'ogre', guard: false }), 'Rockside Slam');
  assert.equal(game.monsterSkillTitle('Battle Shove', { species: 'orc', guard: false }), 'Battle Shove');
  assert.equal(game.monsterSkillTitle('Slingmaster Split Screen', { species: 'goblin' }), 'Slingmaster Split Screen');
  game.s.zone = 'mine';
  assert.equal(game.monsterSkillTitle('Rockside Slam', { species: 'ogre', guard: true }), 'Pillar Punching');
  game.s.zone = 'supply-vale';
  assert.equal(game.monsterSkillTitle('Slingmaster Split Screen',
    { species: 'goblin', roomGuard: true }), 'Fixation');
  game.s.zone = 'vale';
  assert.equal(game.monsterSkillTitle('Rockside Slam', { species: 'ogre', guard: true }), 'Rockside Slam');
});

test('Mortise Cut is a real L-shaped contact and leaves no additional Slow or shove', () => {
  const { game, enemy } = encounter();
  const x = game.hero.x, before = game.hero.hp;
  const a = castAndRelease(game, enemy);
  assert.equal(a.name, 'Mortise Cut');
  assert(game.hero.hp < before, 'first segment deals real damage');
  assert.equal(game.hero.slow, 0);
  assert.equal(game.hero.x, x, 'no player shove');
  // An L-shaped extension, not an arbitrary round footprint.
  game.hero.x = enemy.x + 90;
  game.hero.y = enemy.y + 55;
  game.hero.hp = before;
  game.resolveAttack(enemy);
  assert(game.hero.hp < before, 'perpendicular mortise notch has independent contact');
  game.hero.x = enemy.x - 110;
  game.hero.y = enemy.y;
  game.hero.hp = before;
  game.resolveAttack(enemy);
  assert.equal(game.hero.hp, before, 'opposite flank escapes the specific geometry');
});

test('Guardian Mortise is post-bound, deliberate, and grants only temporary bracing', () => {
  const { game, enemy } = encounter({ guard: true });
  game.hero.x = enemy.x + 95;
  assert(game.startSkeletonCraft(enemy, game.hero));
  const initial = enemy.hp;
  assert(game.damage(enemy, 50, 'hero', { area: true }));
  const bracedLoss = initial - enemy.hp;
  enemy.telegraph = null;
  enemy.hp = initial;
  assert(game.damage(enemy, 50, 'hero', { area: true }));
  const bareLoss = initial - enemy.hp;
  assert(bracedLoss < bareLoss, 'guardian protection is active only while casting');
  enemy.telegraph = null;
  enemy.cd = 0;
  enemy.specialCd = 0;
  game.hero.x = enemy.x + 210;
  assert.equal(game.startSkeletonCraft(enemy, game.hero), false,
    'cannot activate far beyond actual defended post');
});

test('Datum Line is timed physical pressure along one locked survey bearing', () => {
  const { game, enemy } = encounter({ ranged: true });
  const a = castAndRelease(game, enemy);
  assert.equal(a.name, 'Datum Line');
  assert.equal(game.s.projectiles.length, 3);
  const [first, second, third] = game.s.projectiles;
  assert.equal(first.delay, 0);
  assert(second.delay > 0 && third.delay > second.delay);
  // Remain valid with the existing multiplier and PR #899's future explicit
  // arrow speed. No undefined multiplier, NaN speed, or enlarged reach.
  const R = Campaign.rules, flight = R.projectileFlight,
    expectedSpeed = flight
      ? (R.rangedProfiles.skeleton?.shotSpeed ?? flight.ordinaryDefault.arrow)
      : (enemy.shotSpeed || 260) * R.rangedEnemyCombat.projectileMultiplier,
    expectedLife = flight
      ? (flight.ordinaryDistance.skeleton ?? 650) / expectedSpeed
      : 2.5 / R.rangedEnemyCombat.projectileMultiplier;
  assert(game.s.projectiles.every((p) =>
    p.speed === expectedSpeed && p.life === expectedLife &&
    Number.isFinite(p.speed) && Number.isFinite(p.life) && p.life > 0));
  assert(first.dx === second.dx && second.dx === third.dx);
  assert(game.s.projectiles.every((p) =>
    p.source === 'enemy' && p.style === 'arrow' && p.slow === 0));
  const before = game.hero.hp;
  for (let i = 0; i < 60; i++) {
    game.s.time += 0.05;
    game.updateProjectiles(0.05);
  }
  assert(game.hero.hp < before, 'actual projectile contact causes damage');
  assert.equal(game.hero.slow, 0);
});

test('Physical bolts cannot hit through solid cover or follow a target sideways', () => {
  const { game, enemy } = encounter({ ranged: true });
  castAndRelease(game, enemy);
  const before = game.hero.hp;
  game.hero.y = enemy.y + 165;
  for (let i = 0; i < 60; i++) {
    game.s.time += 0.05;
    game.updateProjectiles(0.05);
  }
  assert.equal(game.hero.hp, before, 'fixed line does not home to later position');
  const second = encounter({ ranged: true });
  assert(second.game.startSkeletonCraft(second.enemy, second.game.hero));
  second.game.resolveAttack(second.enemy);
  second.game.zone().props.push({ x: second.enemy.x + 60, y: second.enemy.y, r: 28 });
  const hp = second.game.hero.hp;
  for (let i = 0; i < 60; i++) {
    second.game.s.time += 0.05;
    second.game.updateProjectiles(0.05);
  }
  assert.equal(second.game.hero.hp, hp, 'terrain intercepts the surveyed arrows');
});

test('Melee Ringleader uses two beats; charged changes the second strike angle', () => {
  const { game, enemy } = encounter({ elite: true });
  const first = castAndRelease(game, enemy);
  assert.equal(first.name, 'Double Shear');
  assert.equal(first.charged, false);
  assert.equal(game.s.projectiles.length, 0);
  assert.equal(enemy.sequence.length, 1);
  assert(enemy.sequence[0].angle !== first.angle);
  const beat = game.advanceQueuedAttack(enemy);
  assert.equal(beat.craftStep, 2);
  enemy.telegraph = beat;
  game.resolveAttack(enemy);
  enemy.sequence = [];
  enemy.telegraph = null;
  enemy.cd = 0;
  enemy.specialCd = 0;
  const charged = castAndRelease(game, enemy);
  assert.equal(charged.charged, true);
  assert.equal(enemy.sequence.length, 1);
  const secondAngle = enemy.sequence[0].angle;
  assert(Math.abs(secondAngle - charged.angle) >= 1,
    'charged form pivots sharply into lateral escape space');
});

test('Resection changes from converging double shot to charged flank interdiction', () => {
  const { game, enemy } = encounter({ elite: true, ranged: true, mode: 'nightmare' });
  const normal = castAndRelease(game, enemy);
  assert.equal(normal.name, 'Resection');
  assert.equal(normal.charged, false);
  assert.equal(game.s.projectiles.length, 2);
  const first = game.s.projectiles.map((p) => p.dy);
  assert.notEqual(first[0], first[1], 'tap is a pair of divergent launch bearings');
  game.s.projectiles = [];
  enemy.telegraph = null;
  enemy.sequence = [];
  enemy.cd = 0;
  enemy.specialCd = 0;
  const charged = castAndRelease(game, enemy);
  assert.equal(charged.charged, true);
  assert.equal(game.s.projectiles.length, 2);
  assert(game.s.projectiles[1].delay > 0);
  assert(Math.abs(game.s.projectiles[1].dy - game.s.projectiles[0].dy) > 0.2);
  assert(game.s.projectiles.every((p) => p.slow === 0));
});

test('Charmed Skeletons preserve their normal/earned repertoire without a new saved slot', () => {
  // Use real Rogue capture admission and signed v4 provenance; merely setting
  // charmOrigin on a hired Soldier/Archer is not a lawful Charmed companion.
  const R = Campaign.rules, oldClass = Campaign.classes.rogue,
    oldTalents = Campaign.talentProfiles.rogue;
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
  try {
    const game = new Campaign('normal', 'rogue', () => 0.9);
    game.s.party = [];
    game.s.mercyTime = 0;
    game.s.valeFieldAwakened = true;
    game.zone().props = [];
    game.zone().buildings = [];
    Object.assign(game.hero, { x: 500, y: 500, order: null });
    game.hero.gold = 10000;
    const capture = (ranged) => {
      const source = game.makeEnemy(
        { species: 'skeleton', name: 'Skeleton', level: 1, hp: 10000,
          damage: 0, gold: 0, xp: 0 },
        { x: 585, y: 500 },
      );
      source.ranged = ranged;
      source.aggro = true;
      source.returning = false;
      game.zone().enemies = [source];
      game.hero.basicCd = 0;
      game.s.rogueCharmRng = 12345;
      const before = game.s.party.length;
      assert.equal(game.cast(1, source.id, false, null, true), true,
        'original Rogue skill admits authentic Skeleton capture');
      assert.equal(game.s.party.length, before + 1);
      const ally = game.s.party.at(-1);
      assert(game.isCharmedCompanion(ally),
        'real capture writes a matching native provenance receipt');
      return ally;
    };
    const targetNear = (ally, offset) => {
      const enemy = game.makeEnemy(
        { species: 'skeleton', name: 'Skeleton', level: 4, hp: 10000,
          damage: 50, gold: 0, xp: 0 },
        { x: ally.x + offset, y: ally.y },
      );
      enemy.aggro = true;
      game.zone().enemies = [enemy];
      assert(game.line(ally, enemy), 'Charmed craft uses native line of sight');
      return enemy;
    };
    const melee = capture(false), enemy = targetNear(melee, 35);
    const receipt = game.s.charmCaptures[melee.id];
    delete game.s.charmCaptures[melee.id];
    assert.equal(game.charmedSkeletonCraft(melee, enemy, false, false), false,
      'a missing capture receipt cannot unlock friendly estate craft');
    game.s.charmCaptures[melee.id] = receipt;
    assert(game.charmedSkeletonCraft(melee, enemy, false, false),
      'genuinely Charmed Skeleton can perform Mortise contact');
    assert.equal(game.s.projectiles.length, 0);

    const ranged = capture(true), rangedTarget = targetNear(ranged, 50);
    assert(game.charmedSkeletonCraft(ranged, rangedTarget, false, false),
      'lawfully Charmed Skeleton Bow Guard can launch Datum arrows');
    assert.equal(game.s.projectiles.length, 3);
    assert(game.s.projectiles.every((p) =>
      p.source === ranged.id && p.target === rangedTarget.id));
    const snapshot = game.snapshot();
    Campaign.validate(snapshot);
    assert(!JSON.stringify(snapshot).includes('_charmedSkeletonTurns'));
    assert(!JSON.stringify(snapshot).includes('_skeletonCraftTurns'));
  } finally {
    if (oldClass === undefined) delete Campaign.classes.rogue;
    else Campaign.classes.rogue = oldClass;
    if (oldTalents === undefined) delete Campaign.talentProfiles.rogue;
    else Campaign.talentProfiles.rogue = oldTalents;
  }
});
test('Suppressed, summoned and out-of-range actors cannot start new craft actions', () => {
  for (const mode of ['normal', 'nightmare']) {
    const { game, enemy } = encounter({ mode });
    enemy.summon = true;
    assert(!game.startSkeletonCraft(enemy, game.hero));
    enemy.summon = false;
    enemy.returning = 1;
    assert(!game.startSkeletonCraft(enemy, game.hero));
    enemy.returning = 0;
    game.hero.x += 400;
    assert(!game.startSkeletonCraft(enemy, game.hero));
  }
});
console.log('PASS skeleton craft pilot: ' + count + ' focused tests');
