'use strict';
// Issue #589: all twelve owner-chosen heritage effects, independent timers,
// two lawful night captures, exact v4 identity and visible contact receipts.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');

assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
try {
  const selected = {
    goblin: 'Dust Entrainment',
    skeleton: 'Disarticulation',
    mireling: 'Hydraulic Jump',
    reedbeast: 'Mud Pumping',
    wolf: 'Crowd Dispersal',
    ogre: 'Lateral Load Transfer',
    orc: 'Flank Command',
    archer: 'Bad Deal',
    ashbeast: 'Broodscreen Roar',
    crownguard: 'Reversal',
    wraith: 'Pressure Grouting',
    stalker: 'Flank Command',
  };
  assert.deepEqual(Object.keys(R.balance.companions.charmHeritage).sort(),
    Object.keys(selected).sort(), 'exactly 12 owner-approved selections');
  for (const [species, name] of Object.entries(selected))
    assert.equal(R.balance.companions.charmHeritage[species].name, name);

  const names = new Map([...Campaign.data.species.flat()
    .map((row) => [row[0], row[1]]),
    ['wraith', 'Lantern wraith'], ['stalker', 'Ash stalker']]);
  function fresh() {
    const game = new Campaign('normal', 'rogue', () => 0.9);
    game.s.party = [];
    game.s.charmCaptures = {};
    game.s.mercyTime = 0;
    game.s.valeFieldAwakened = true;
    game.zone().enemies = [];
    game.zone().props = [];
    game.zone().buildings = [];
    Object.assign(game.hero, { x: 1000, y: 1000, order: null });
    return game;
  }
  function ally(game, species) {
    const role = species === 'wraith' || species === 'archer' ? 'archer' : 'soldier',
      u = game.unit(role, 1000, 1000),
      variant = role === 'archer' ? R.rangedProfiles[species]?.variant : null;
    const origin = {
      typeId: 'enemy:' + species + ':' + (role === 'archer' ? 'ranged' : 'melee'),
      species, role, typeName: names.get(species) + (variant ? ' ' + variant : ''),
      sourceEnemyId: 'enemy-' + (10000 + game.s.nextId++),
      sourceZone: game.zoneId,
    };
    u.charmOrigin = { ...origin };
    u.name = origin.typeName;
    u.damage = R.balance.companions.charmed[species][
      role === 'archer' ? 'ranged' : 'melee'].damage;
    u.maxHp = game.companionMaxHp(u);
    u.hp = u.maxHp;
    game.s.party.push(u);
    game.s.charmCaptures[u.id] = { ...origin };
    assert.equal(game.isCharmedCompanion(u), true, species + ' authorized ledger');
    return u;
  }
  function foe(game, x = 1070, y = 1000) {
    const e = game.makeEnemy({
      species: 'goblin', name: 'Skill test dummy', hp: 10000, level: 1,
      damage: 1, gold: 0, xp: 0,
    }, { x, y });
    e.aggro = true;
    e.returning = false;
    game.zone().enemies.push(e);
    // Engaging an unconfigured mock triggers native regional stat scaling.
    // Normalize it BEFORE measuring ability damage; never infer healing
    // from the initial encounter's 1.25x melee HP adjustment.
    game.engage(e, true);
    e.maxHp = e.hp = 10000;
    return e;
  }
  function attachCritical(game, roll) {
    let rolls = 0;
    game._criticalPartyNative = Native.createSession(Critical, Levels, {
      enabled: true, stream: { next() { rolls++; return roll; } },
    });
    return () => rolls;
  }

  for (const species of Object.keys(selected)) {
    const game = fresh(), u = ally(game, species), e = foe(game);
    const def = R.balance.companions.charmHeritage[species];
    const rolls = attachCritical(game, 0);
    game.hero.skills[1] = 1;
    assert.equal(game.charmedEliteTrained(u), true, species);
    const hp = e.hp, originalSkill1 = u.skill1Cd, originalSkill2 = u.skill2Cd;
    assert.equal(game.charmedSpeciesSpecial(u, e, def), true,
      species + ' selected heritage must land');
    assert(e.hp < hp, species + ' actual damage: before=' + hp + ' after=' + e.hp + ' value=' + game.companionAttackDamage(u) + ' landed=' + (game.effects.find(x=>x.type === 'charmHeritage')?.hitCount));
    assert.equal(u.skill3Cd, def.cooldown, species + ' own third cooldown');
    assert.equal(u.skill1Cd, originalSkill1, species + ' Skill 1 untouched');
    assert.equal(u.skill2Cd, originalSkill2, species + ' Skill 2 untouched');
    assert.equal(rolls(), 1, species + ' exactly one critical roll per cast');
    const fx = game.effects.find(x => x.type === 'charmHeritage');
    assert(fx && fx.species === species && fx.shape === def.shape,
      species + ' shape-specific visual event');
    assert(game.effects.some(x => x.type === 'spell' &&
      x.kind === 'charmHeritage' && x.species === species),
      species + ' audible cast event');
    assert.equal(game.charmedSpeciesSpecial(u, e, def), false,
      species + ' cooldown stops repeat');
    assert.equal(rolls(), 1, species + ' invalid recast draws nothing');
    assert.equal(Campaign.validate(game.snapshot()).party[0].skill3Cd,
      def.cooldown, species + ' v4 cooldown persisted');
    // Personal mastery is saved, while every legitimate effect gets a small,
    // bounded potency gain without changing radius, target count or timers.
    const tierDamage = [];
    for (const points of [0, 4, 10, 18]) {
      const tierGame = fresh(), tierAlly = ally(tierGame, species);
      const tierEnemy = foe(tierGame);
      tierGame.hero.skills[1] = 1;
      tierAlly.masteryPoints = points;
      const before = tierEnemy.hp;
      assert(tierGame.charmedSpeciesSpecial(tierAlly, tierEnemy, def),
        species + ' tier ' + points + ' legal hit');
      tierDamage.push(before - tierEnemy.hp);
      assert.equal(Campaign.validate(tierGame.snapshot()).party[0].masteryPoints,
        points, 'mastery points persisted at ' + points);
      assert.equal(tierGame.companionMasteryTier(tierAlly),
        [0, 4, 10, 18].indexOf(points));
      assert.equal(tierAlly.skill3Cd, def.cooldown, 'mastery never shortens cooldown');
    }
    assert(tierDamage.every((n, i) => i === 0 || n >= tierDamage[i - 1]),
      species + ' mastery never weakens on-hit damage');
    assert(tierDamage[3] <= tierDamage[0] * 1.13 + 0.01,
      species + ' mastery cannot inflate heritage damage excessively');
    if (def.slow) assert(e.slow > 0, species + ' real Slow on contact');
  }

  // Short-range ranged heritage must fire WHILE the Charmed Ranger retreats.
  // It cannot require the actor to stand inside its own retreat threshold.
  const retreat = fresh(), raider = ally(retreat, 'archer'), close = foe(retreat);
  retreat.hero.skills[1] = 1;
  raider.skill1Cd = 100;
  raider.skill2Cd = 100;
  retreat._tacticalPartyTargets = new Map();
  const oldHp = close.hp;
  retreat.companionFight(raider, close, [raider], 1 / 60);
  assert.equal(raider.skill3Cd, R.balance.companions.charmHeritage.archer.cooldown,
    'ranged Bad Deal fires at close quarters while retreating');
  assert(close.hp < oldHp, 'defensive heritage actually hits');

  // Real AoE geometry and a strict two-target budget, not a radius shortcut.
  const cone = fresh(), caster = ally(cone, 'goblin'), near = foe(cone);
  const far = foe(cone, 925, 1000);
  const side = foe(cone, 1070, 1070);
  assert(cone.charmedSpeciesSpecial(caster, near,
    R.balance.companions.charmHeritage.goblin));
  assert(near.hp < near.maxHp);
  assert.equal(far.hp, far.maxHp, 'cone excludes enemies behind caster');
  assert.equal(side.hp, side.maxHp, 'cone excludes outside angle');
  const crowd = fresh(), wolf = ally(crowd, 'wolf'), victims = [
    foe(crowd, 1045, 1000), foe(crowd, 1045, 1020),
    foe(crowd, 1035, 1040),
  ];
  assert(crowd.charmedSpeciesSpecial(wolf, victims[0],
    R.balance.companions.charmHeritage.wolf));
  assert.equal(victims.filter(e => e.hp < e.maxHp).length, 2,
    'crowd skill never damages a third target');

  // Capturing night enemies is an exception ONLY for exact ordinary species
  // while genuinely nighttime, not a blanket bypass for any nightOnly mob.
  for (const species of ['wraith', 'stalker']) {
    const game = fresh();
    const enemy = game.makeEnemy({ species, name: names.get(species), level: 4,
      hp: 200, damage: 12, gold: 0, xp: 0 }, { x: 1070, y: 1000 });
    enemy.nightOnly = true;
    game.night = () => false;
    assert.equal(game.rogueCharmProfile(enemy), null,
      species + ' cannot be captured by day');
    game.night = () => true;
    const profile = game.rogueCharmProfile(enemy);
    assert(profile && profile.species === species, species + ' night admission');
    assert.equal(profile.role, species === 'wraith' ? 'archer' : 'soldier');
    enemy.form = 'ringleader';
    assert.equal(game.rogueCharmProfile(enemy), null,
      'elite night monster is still protected');
    enemy.form = 'normal';
    enemy.summon = true;
    assert.equal(game.rogueCharmProfile(enemy), null,
      'summoned night monster is still protected');
    game.night = () => false;
    const companion = ally(game, species);
    assert(game.isCharmedCompanion(companion),
      species + ' stays on party after sunrise');
    assert(Campaign.validate(game.snapshot()).party[0].charmOrigin,
      species + ' save survives daylight');
    const old = game.snapshot();
    delete old.party[0].skill3Cd;
    delete old.party[0].skillNightCd;
    assert.equal(Campaign.validate(old).party[0].skill3Cd, 0,
      'old v4 save migrates third cooldown');
    assert.equal(Campaign.validate(old).party[0].skillNightCd, 0,
      'old v4 save migrates separate night cooldown');
  }

  for (const species of ['wraith', 'stalker']) {
    const game = fresh(), u = ally(game, species), e = foe(game);
    const def = R.balance.companions.charmNightNative[species];
    const rolls = attachCritical(game, 0);
    u.hp -= 20;
    assert(game.charmedSpeciesSpecial(u, e, def, 'native'),
      species + ' native night skill lands in ally form');
    assert.equal(rolls(), 1, species + ' one night critical roll');
    assert.equal(u.skillNightCd, R.balance.companions.charmedSkills.basicCooldown);
    assert.equal(u.skill1Cd, 0, species + ' innate cannot replace its Rogue basic');
    assert.equal(u.skill2Cd, 0, species + ' innate cannot consume Ringleader');
    assert.equal(u.skill3Cd, 0, species + ' innate cannot consume heritage');
    assert(game.effects.some(x => x.type === 'charmHeritage' &&
      x.kind === 'native' && x.species === species));
    if (species === 'wraith') assert(u.hp > u.maxHp - 20,
      'Soul Drain recovers real dealt damage');
    if (species === 'stalker') assert(u.x > 1000,
      'Shadow Pounce physically moves its Charmed owner');
  }
  // Full scheduler: a third move fills an opening ONLY when the native and
  // Ringleader abilities have been used/cooling, never replaces them.
  const game = fresh(), u = ally(game, 'goblin'), e = foe(game);
  game.hero.skills[1] = 1;
  u.skill1Cd = 100;
  u.skill2Cd = 100;
  assert.equal(game.companionTrySkill(u, e), true);
  assert.equal(u.skill3Cd, R.balance.companions.charmHeritage.goblin.cooldown);
  assert.equal(u.skill1Cd, 100);
  assert.equal(u.skill2Cd, 100);

  console.log('PASS issue #589: twelve native effect identities, VFX/audio, cooldowns, critical ownership, two night captures/daylight saves');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
