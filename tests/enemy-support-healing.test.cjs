'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const R = Campaign.rules;
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function fixture(region = 'vale', mode = 'normal') {
  const g = new Campaign(mode, 'paladin', () => 0.9);
  g.s.zone = region;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 900, y: 900 });
  const z = g.zone();
  z.enemies = [];
  g.line = () => true; // deterministic clear sight for targeting, not production geometry
  completeFieldOpening(g);
  let sequence = 0;
  function mob(species, options = {}) {
    const e = g.makeEnemy(
      { species, name: species + ' test', level: 1, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 980 + (sequence++ % 5) * 15, y: 900 },
    );
    Object.assign(e, { aggro: true, pack: 'healing-party', ...options });
    z.enemies.push(e);
    return e;
  }
  return { g, z, mob };
}
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-8, message + ': ' + a + ' !== ' + b);

{
  const { g, mob } = fixture();
  const healer = mob('ogre', { ranged: true });
  const recipient = mob('ogre', { hp: 400 });
  g.zone = () => {
    throw new Error('faction checks must not run world maintenance');
  };
  assert(g.enemyHealTeammate(healer, recipient));
  delete g.s.zones[g.zoneId];
  assert.equal(
    g.enemyHealTeammate(healer, recipient),
    false,
    'missing current roster fails closed',
  );
}

assert.equal(R.enemySupportHealing.cooldown, R.rangerSupport.cooldown);
assert.equal(R.enemySupportHealing.duration, R.rangerSupport.duration);
assert.equal(R.enemySupportHealing.fraction, 0.05);
assert.deepEqual(Object.keys(R.enemySupportHealing.captains).sort(), [
  'supply-crown',
  'supply-march',
  'supply-vale',
]);
assert.deepEqual(Object.keys(R.enemySupportHealing.bosses).sort(), [
  'abyss',
  'archive',
  'crypt',
  'mire',
  'ridge',
]);
for (const species of [
  'wolf',
  'goblin',
  'skeleton',
  'wraith',
  'stalker',
  'mireling',
  'reedbeast',
  'archer',
  'crownguard',
  'ashbeast',
  'orc',
  'ogre',
]) {
  const { g, mob } = fixture();
  const healer = mob(species, { ranged: true });
  const ally = mob(species, { hp: 400 });
  assert(g.enemyHealProfile(healer), species + ' has an authored healing identity');
  assert(g.enemySupportHeal(healer), species + ' heals a wounded companion');
  // The live zone may normalize ally max HP as its ordinary population
  // migrates; assert against the recipient's actual post-normalization values.
  const budget = Math.min(
    ally.maxHp - ally.hp,
    ally.maxHp * R.enemySupportHealing.ordinary.fraction * g.enemyHealMultiplier(healer),
  );
  const before = ally.hp;
  near(ally.supportHeal.remaining, budget, species + ' 10% ordinary recipient heal');
  near(ally.supportHeal.seconds, 3, species + ' three-second treatment');
  near(healer.supportHealCd, 7, species + ' seven-second ordinary cooldown');
  assert(!g.enemySupportHeal(healer), species + ' cannot duplicate the cast');
  g.advanceEnemySupportHeal(ally, 1);
  near(ally.hp, before + budget / 3, species + ' partial three-second heal');
  g.advanceEnemySupportHeal(ally, 2);
  near(ally.hp, before + budget, species + ' full heal');
  assert(!ally.supportHeal, species + ' effect completes');
}
console.log('PASS twelve ranged species use individual identity and the Archer healing interval');

// Enemy support must ignore injured player actors even when they are closer
// and much more wounded than the intended hostile recipient.
for (const species of Object.keys(R.enemySupportHealing.species)) {
  const { g, mob } = fixture();
  g.hero.hp = g.hero.maxHp * 0.1;
  g.s.party = [
    g.unit('soldier', 981, 900),
    g.unit('archer', 982, 900),
    ...Object.keys(R.petCompanions).map((family) => g.unit('pet', 983, 900, family)),
  ];
  for (const u of g.s.party) u.hp = u.maxHp * 0.1;
  const playerHp = [g.hero, ...g.s.party].map((u) => u.hp);
  const healer = mob(species, { ranged: true });
  const recipient = mob('ogre', { hp: 400 });
  for (const u of [g.hero, ...g.s.party]) {
    assert.equal(g.enemyHealTeammate(healer, u), false, 'player actors are never healer allies');
    assert.equal(
      g.enemyHealTeammate(u, recipient),
      false,
      'player actors are never hostile healers',
    );
  }
  // Prove faction exclusion is explicit, rather than trusting the collection's
  // name: even a malformed roster containing player actors cannot heal them.
  g.zone().enemies.push(g.hero, ...g.s.party);
  assert(g.enemySupportHeal(healer), species + ' starts real hostile support');
  const event = g.effects.find((e) => e.type === 'heal' && e.actor === 'enemy');
  assert.equal(event.target, recipient.id, species + ' targets only the hostile roster');
  g.advanceEnemySupportHeal(recipient, R.enemySupportHealing.duration);
  assert(recipient.hp > 400, species + ' actually restores hostile HP');
  assert.deepEqual(
    [g.hero, ...g.s.party].map((u) => u.hp),
    playerHp,
    species + ' never restores hero, troops or any boss pet HP',
  );
  assert(
    [g.hero, ...g.s.party].every((u) => !u.supportHeal),
    species + ' never attaches enemy regeneration to player actors',
  );
}
console.log('PASS hostile healing excludes wounded hero, both troop types and all eleven pets');

{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: false });
  mob('goblin', { hp: 400 });
  assert.equal(g.enemyHealProfile(healer), null, 'melee does not inherit ranged healing');
  assert(!g.enemySupportHeal(healer), 'ordinary melee has no support cast');
}
{
  const { g, mob } = fixture();
  const ordinary = mob('goblin', { ranged: false });
  assert(
    !Object.hasOwn(ordinary, 'supportHealCd'),
    'ordinary enemy starts without a healing clock',
  );
  g.updateEnemies(0.1);
  assert(
    !Object.hasOwn(ordinary, 'supportHealCd'),
    'combat tick does not alter non-healer save shape',
  );
}

{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  const unrelated = mob('wolf', { hp: 400, pack: 'unrelated' });
  assert(
    g.enemySupportHeal(healer),
    'hostile factions provide aid across species and formation posts',
  );
  assert(unrelated.supportHeal, 'cross-species recipient is actually healing');
}
{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  mob('goblin', { hp: 0 });
  assert(!g.enemySupportHeal(healer), 'never revive dead allies');
}
{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  mob('goblin', { hp: 900 });
  assert(!g.enemySupportHeal(healer), 'support healing retains a 75-percent cutoff');
}
{
  const { g, mob } = fixture();
  const leader = mob('goblin', {
    captain: true,
    roomCaptain: true,
    captainProfile: 'supply-vale',
    ranged: false,
    hp: 100,
  });
  const ally = mob('goblin', { hp: 400 });
  assert.equal(g.enemyHealProfile(leader), 'Salvage Surge');
  assert(g.enemySupportHeal(leader), 'Scornfang healer can act through authored ranged volley');
  assert(ally.supportHeal, 'area heal includes the wounded companion');
  assert(leader.supportHeal, 'area heal also includes an eligible wounded captain');
  near(leader.supportHealCd, 10, 'captain has same per-actor cooldown');
  leader.supportHealCd = 0;
  delete leader.supportHeal;
  delete ally.supportHeal;
  ally.hp = ally.maxHp;
  assert(g.enemySupportHeal(leader), 'captain can self-heal when no companion needs care');
  assert(leader.supportHeal, 'self recovery is a real timed effect');
}
{
  const { g, mob } = fixture('crown');
  const leader = mob('ashbeast', {
    captain: true,
    roomCaptain: true,
    captainProfile: 'supply-crown',
    ranged: false,
    hp: 100,
  });
  const ally = mob('ashbeast', { hp: 300, owner: leader.id });
  assert.equal(g.enemyHealProfile(leader), 'Grafting');
  assert(g.enemySupportHeal(leader), 'Dreadmaw prioritizes his wounded brood');
  assert(ally.supportHeal && leader.supportHeal);
}
{
  const { g, mob } = fixture('march');
  const direjaw = mob('mireling', {
    captain: true,
    roomCaptain: true,
    captainProfile: 'supply-march',
    hp: 110,
  });
  const wounded = mob('mireling', { hp: 300 });
  assert.equal(g.enemyHealProfile(direjaw), 'Silt Pulse');
  assert(g.enemySupportHeal(direjaw), 'Direjaw heals the more wounded companion first');
  assert(wounded.supportHeal && direjaw.supportHeal);
  direjaw.supportHealCd = 0;
  delete direjaw.supportHeal;
  delete wounded.supportHeal;
  wounded.hp = wounded.maxHp;
  assert(g.enemySupportHeal(direjaw), 'Direjaw may treat his own wounds');
}
for (const profile of ['supply-highlands', 'frontier-overseer']) {
  const { g, mob } = fixture();
  const leader = mob('ogre', { captain: true, captainProfile: profile, ranged: false, hp: 100 });
  mob('ogre', { hp: 200 });
  assert(!g.enemyHealProfile(leader), profile + ' melee-centered captain is not a healer');
}
{
  const { g, mob } = fixture('crown');
  const dreadmaw = mob('ashbeast', {
    captain: true,
    roomCaptain: true,
    captainProfile: 'supply-crown',
    hp: 300,
  });
  mob('ashbeast', { hp: 800 });
  assert(g.enemySupportHeal(dreadmaw), 'Dreadmaw can use agricultural self-treatment');
  assert(dreadmaw.supportHeal, 'Dreadmaw really heals himself, not just broodmates');
}
console.log(
  'PASS three authored hybrid/ranged captains heal nearby allies and eligible self together',
);

for (let i = 0; i < 5; i++) {
  const region = ['vale', 'march', 'highlands', 'frontier', 'crown'][i];
  const { g, mob } = fixture(region);
  const ordinary = mob('goblin', { ranged: true });
  const guardian = mob('goblin', { ranged: true, guard: true });
  const summoned = mob('goblin', { ranged: true, summon: true });
  near(g.enemyHealMultiplier(ordinary), R.ordinaryRangedScaling[i].damage, region + ' ordinary');
  near(g.enemyHealMultiplier(guardian), R.guardianScaling[i].damage, region + ' guardian');
  near(g.enemyHealMultiplier(summoned), R.summonScaling[i].damage, region + ' summoned');
}
{
  const { g, mob } = fixture('crown');
  const ringleader = mob('orc', { ranged: true, form: 'ringleader' });
  near(
    g.enemyHealMultiplier(ringleader),
    R.ordinaryRangedScaling[4].damage * R.ringleaderScaling.damage,
    'Ringleader gets one 1.5x elite modifier',
  );
}
{
  const { g, mob } = fixture('vale');
  g.s.clock = 400;
  g.s.normal = { thorn: true, crypt: true, mire: true, archive: true, ridge: true };
  const archer = mob('goblin', { ranged: true });
  archer.damage *= g.multipliers().damage;
  near(g.enemyHealMultiplier(archer), 1.25, 'night progress five increments');
  const wraith = mob('wraith', { ranged: true, nightOnly: true });
  wraith.damage *= g.multipliers().damage;
  near(
    g.enemyHealMultiplier(wraith),
    1.25 * R.nightEnemyCombat.wraith.damage,
    'night-only Wraith scaling applied once',
  );
}
{
  const { g, mob } = fixture('vale', 'nightmare');
  const archer = mob('goblin', { ranged: true });
  assert.equal(g.night(), false, 'new Nightmare begins with the authored sunset');
  near(g.enemyHealMultiplier(archer), 1, 'sunset healing uses day scaling');
  const hpFraction = archer.hp / archer.maxHp;
  g.advanceDaylight(g.s.nightmareIntroRemaining);
  assert.equal(g.night(), true, 'the actual intro boundary starts permanent night');
  near(archer.hp / archer.maxHp, hpFraction, 'boundary preserves existing wounds');
  near(g.enemyHealMultiplier(archer), 1.15, 'post-sunset Nightmare inherits night scaling once');
}
{
  const { g, mob } = fixture();
  const boss = g.bossEnemy(g.boss('crypt'), 'true', { x: 980, y: 900 });
  boss.aggro = true;
  near(g.enemyHealMultiplier(boss), 1.25, 'normal TRUE boss strength counted once');
  assert(g.enemyHealProfile(boss), 'Lifebinder uses individually authored recovery');
  const meleeBoss = g.bossEnemy(g.boss('thorn'), 'normal', { x: 990, y: 900 });
  assert(!g.enemyHealProfile(meleeBoss), 'melee-only boss does not get generic skill');
  const elite = mob('wraith', {
    ranged: true,
    summon: true,
    form: 'ringleader',
    trueSummonRole: 'captain',
    owner: boss.id,
  });
  near(
    g.enemyHealMultiplier(elite),
    R.summonScaling[0].damage * 1.5,
    'TRUE captain summons gain one elite multiplier, not two',
  );
}
{
  const { g } = fixture('march');
  for (const id of ['crypt', 'mire', 'archive', 'ridge', 'abyss']) {
    const boss = g.bossEnemy(g.boss(id), 'normal', { x: 980, y: 900 });
    assert(g.enemyHealProfile(boss), id + ' ranged/lore-centered authored healing');
  }
  for (const id of ['thorn', 'mine', 'warlord', 'citadel', 'cindermaw', 'darklord']) {
    const boss = g.bossEnemy(g.boss(id), 'normal', { x: 980, y: 900 });
    assert.equal(g.enemyHealProfile(boss), null, id + ' is deliberately excluded');
  }
}
console.log(
  'PASS region, night, progression, night-species, TRUE, elite scaling and boss eligibility',
);

{
  const { g, mob } = fixture();
  const boss = g.bossEnemy(g.boss('crypt'), 'normal', { x: 980, y: 900 });
  boss.aggro = true;
  boss.hp = boss.maxHp * 0.25;
  g.zone().enemies.push(boss);
  const attendant = mob('skeleton', { hp: 250, owner: boss.id });
  assert(g.enemySupportHeal(boss), 'eligible boss supports existing summon');
  assert(attendant.supportHeal && !boss.supportHeal, 'ally before boss self');
  boss.supportHealCd = 0;
  delete attendant.supportHeal;
  attendant.hp = attendant.maxHp;
  boss.healCd = 8;
  assert(
    !g.enemySupportHeal(boss),
    'Lifebinder keeps existing vitality siphon instead of duplicate self-healing',
  );
  near(boss.healCd, 8, 'existing boss recovery and support remain independent');
  near(boss.supportHealCd, 0, 'ineligible duplicate self-cast does not spend support cooldown');
}
{
  const { g } = fixture('highlands');
  const ridge = g.bossEnemy(g.boss('ridge'), 'normal', { x: 980, y: 900 });
  ridge.aggro = true;
  ridge.hp = ridge.maxHp * 0.25;
  g.zone().enemies.push(ridge);
  assert(
    g.enemySupportHeal(ridge),
    'Ridge Tyrant can self-heal without duplicate authored recovery',
  );
  assert(ridge.supportHeal && ridge.supportHeal.skill === 'Bailout');
  near(ridge.supportHealCd, R.rangerSupport.cooldown, 'Ridge self-heal uses Archer cooldown');
}
{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  const ally = mob('goblin', { hp: 400 });
  g.enemySupportHeal(healer);
  const snapshot = g.snapshot();
  for (const z of Object.values(snapshot.zones))
    for (const e of z.enemies) {
      assert(!('supportHeal' in e), 'v4 snapshots do not carry transient heal effects');
      assert(!('supportHealCd' in e), 'v4 snapshots do not carry support cooldowns');
    }
  const restored = Campaign.restore(snapshot, () => 0.9);
  assert(restored && restored.s.version === 4, 'save restores with unchanged version');
  const copied = JSON.parse(JSON.stringify(snapshot));
  copied.zones[copied.zone].enemies[0].supportHeal = {
    seconds: 1e9,
    remaining: 1e9,
    source: 'malicious',
  };
  copied.zones[copied.zone].enemies[0].supportHealCd = 1e9;
  const repaired = Campaign.restore(copied, () => 0.9);
  const enemy = repaired.zone().enemies[0];
  assert(!enemy.supportHeal && !enemy.supportHealCd, 'import drops forged heal state');
  assert(ally && healer, 'initial fixture remains unchanged');
}
{
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  const ally = mob('goblin', { hp: 400 });
  g.updateEnemies(0.1);
  assert(healer.supportHealCd > 6, 'live updateEnemies invokes automatic seven-second support healing');
  assert(ally.supportHeal || ally.hp > 400, 'the live combat tick starts gradual ally healing');
}
{
  const { g } = fixture('frontier');
  const dragon = g.bossEnemy(g.boss('abyss'), 'normal', { x: 980, y: 900 });
  dragon.aggro = true;
  dragon.hp = dragon.maxHp * 0.25;
  g.zone().enemies.push(dragon);
  assert(g.enemyHealProfile(dragon), 'Abyss Dragon can support its ranged warband');
  assert(
    !g.enemySupportHeal(dragon),
    'authored recovery bosses do not gain duplicate self-healing',
  );
}
console.log('PASS boss skill independence, support priority, and old v4 save compatibility');

// The combined phone renderer must retain the actual heal event/status owners
// without restoring the old warning-over-actors pass or mutating campaign state.
{
  const { createCanvas } = require('@napi-rs/canvas');
  const Renderer = require('../src/prototype/renderer');
  const FX = require('../src/prototype/combat-visuals');
  const Visuals = require('../src/prototype/visuals');
  const { g, mob } = fixture();
  const healer = mob('goblin', { ranged: true });
  const recipient = mob('goblin', { hp: 400 });
  assert(g.enemySupportHeal(healer));
  const canvas = createCanvas(844, 390),
    order = [],
    heals = [];
  const renderer = Renderer.create({
    canvas,
    ctx: canvas.getContext('2d'),
    getGame: () => g,
    platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 422, y: 195 }) },
    Campaign,
    PrototypeVisuals: Visuals,
    PrototypeCombatVisuals: {
      ...FX,
      ground(...args) {
        order.push(args[3]);
        return FX.ground(...args);
      },
      enemySupportHeal(...args) {
        order.push('heal-event');
        heals.push(args[2]);
        return FX.enemySupportHeal(...args);
      },
      enemySupportStatus(...args) {
        order.push('heal-status');
        return FX.enemySupportStatus(...args);
      },
      actorCues(...args) {
        order.push('captions');
        return FX.actorCues(...args);
      },
    },
    chargePresentation: () => null,
    isPaused: () => false,
    now: () => 16000,
  });
  g.zone();
  const before = JSON.stringify(g.snapshot());
  renderer.queue(g.effects);
  renderer.draw();
  assert(order.includes('heal-event'), 'real queued enemy heal reaches its species VFX');
  assert(
    order.includes('heal-status'),
    'ongoing recovery remains visible in the combined renderer',
  );
  assert(order.indexOf('underlay-cue') < order.indexOf('heal-status'));
  assert(order.indexOf('heal-status') < order.indexOf('captions'));
  assert(!order.includes('cue'), 'healing does not restore old floor warnings above actors');
  assert.equal(JSON.stringify(g.snapshot()), before, 'healing rendering stays save-pure');
  // Leave the hero standing at the recipient's old spot, as in the reported
  // overlap. The burst must follow its actual enemy, not imply a hero heal.
  Object.assign(g.hero, { x: recipient.x, y: recipient.y });
  recipient.x += 80;
  healer.y += 35;
  renderer.draw();
  assert.equal(heals.at(-1).x, recipient.x, 'heal burst follows moving enemy recipient');
  assert.equal(heals.at(-1).y, recipient.y);
  assert.equal(heals.at(-1).fromY, healer.y, 'heal link follows its actual caster');
  for (const state of ['dead', 'neutral', 'removed']) {
    recipient.hp = state === 'dead' ? 0 : 400;
    recipient.neutral = state === 'neutral';
    if (state === 'removed') g.zone().enemies = [healer];
    heals.length = 0;
    renderer.draw();
    assert.equal(heals.length, 0, state + ' enemy cannot leave a recovery burst on the hero');
  }
  const soldier = g.unit('soldier', 900, 900);
  g.s.party = [soldier];
  g.zone().enemies.push(g.hero, soldier);
  for (const target of ['hero', soldier.id, 'missing-enemy']) {
    const queued = FX.queue([{ type: 'heal', actor: 'enemy', target, resource: 'health' }], g);
    assert(
      !queued.some((f) => f.type === 'heal'),
      'enemy heal never falls back to hero coordinates',
    );
  }
  const heroHp = g.hero.hp;
  g.hero.aggro = true;
  g.hero.supportHeal = { seconds: 5, remaining: 1000 };
  g.advanceEnemySupportHeal(g.hero, 1);
  assert.equal(g.hero.hp, heroHp, 'forged hostile healing cannot advance on a player actor');
  assert(!g.hero.supportHeal, 'invalid player-side hostile regeneration is discarded');
}
console.log(
  'PASS combined phone healing particles/status, warning layering and save-pure rendering',
);
