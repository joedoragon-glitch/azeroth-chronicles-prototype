'use strict';
// Owned monsters inherit the ONE live world night profile, with no saved aura.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const close = (a, b, message) =>
  assert(Math.abs(a - b) < 1e-8, message + ': ' + a + ' vs ' + b);

function captured(game, species, role, active = true) {
  const unit = game.unit(role, game.hero.x + 35, game.hero.y + 35);
  const speciesName = species === 'wraith' ? 'Lantern wraith'
    : species === 'stalker' ? 'Ash stalker'
    : Campaign.data.species.flat().find((entry) => entry[0] === species)?.[1];
  assert(speciesName, 'authored monster species');
  const variant = role === 'archer' ? R.rangedProfiles[species]?.variant : null;
  const origin = {
    typeId: 'enemy:' + species + ':' + (role === 'archer' ? 'ranged' : 'melee'),
    species, role, typeName: speciesName + (variant ? ' ' + variant : ''),
    sourceEnemyId: 'enemy-' + (900000 + game.s.nextId++),
    sourceZone: game.zoneId,
  };
  unit.charmOrigin = { ...origin };
  unit.name = origin.typeName;
  unit.active = active;
  unit.damage = R.balance.companions.charmed[species][role === 'archer' ? 'ranged' : 'melee'].damage;
  game.s.party.push(unit);
  game.s.charmCaptures[unit.id] = { ...origin };
  unit.maxHp = game.companionMaxHp(unit);
  unit.hp = unit.maxHp;
  assert(game.isCharmedCompanion(unit), 'authenticated ' + species);
  return unit;
}

const game = new Campaign('normal', 'paladin', () => 0.9);
game.s.party = [];
game.s.charmCaptures = {};
// Two historical boss-form victories authorize the pet collection in a v4 save.
for (const id of ['thorn', 'crypt']) {
  game.s.normal[id] = true;
  game.s.true[id] = true;
  game.s.victories[id + ':normal'] = true;
  game.s.victories[id + ':true'] = true;
}
game.s.clock = 100;
game.zone().enemies = [];
game.zone().props = [];
const soldier = game.unit('soldier', game.hero.x + 25, game.hero.y);
const archer = game.unit('archer', game.hero.x + 55, game.hero.y);
// The starting two-active-party cap remains authoritative in v4 saves.
soldier.active = false;
archer.active = false;
const pet = game.unit('pet', game.hero.x + 45, game.hero.y, 'thorn');
const reservePet = game.unit('pet', game.hero.x + 80, game.hero.y, 'crypt');
assert(game.petDefinition(pet));
assert(game.petDefinition(reservePet));
reservePet.active = false;
game.s.party.push(soldier, archer, pet, reservePet);
const goblin = captured(game, 'goblin', 'soldier');
const wraith = captured(game, 'wraith', 'archer', false);
const monsters = [pet, reservePet, goblin, wraith];
const troops = [soldier, archer];
for (const u of monsters) assert(game.isOwnedMonster(u), 'owned monster eligibility');
for (const u of troops) assert(!game.isOwnedMonster(u), 'ordinary troop has no monster heritage');
assert.equal(game.monsterNightBonuses(game.hero).tempo, 1, 'hero cannot inherit night passive');
assert.deepEqual(game.monsterNightBonuses(pet), { hp: 1, damage: 1, tempo: 1, dodge: 0 });
const before = new Map([...monsters, ...troops].map((u) =>
  [u.id, { max: u.maxHp, hp: u.hp, damage: game.companionAttackDamage(u),
    tempo: game.companionRallyAttackSpeed(u) }]));
pet.hp -= 16; // Pre-existing wounds must survive a change of max HP.
const dayPetMissing = pet.maxHp - pet.hp;
game.s.clock = R.dayCycle.nightAt - 0.05;
game.tick(0.1);
assert(game.night(), 'actual simulation crossed sunset');
const night = game.monsterNightBonuses();
close(night.hp, 1.1 + 0.03 * game.nightPoints(), 'single HP source');
close(night.damage, 1.15 + 0.02 * game.nightPoints(), 'single damage source');
close(night.tempo, game.nightTempo(), 'single speed source');
assert.deepEqual({hp: night.hp, damage: night.damage}, game.multipliers(),
  'enemy multipliers derive from the same night profile');
for (const u of monsters) {
  assert.deepEqual(game.monsterNightBonuses(u), night, 'owned monster matches hostile profile');
  assert.equal(u.maxHp, Math.round(before.get(u.id).max * night.hp),
    'friendly monster HP increases at actual sunset');
  close(game.companionAttackDamage(u), before.get(u.id).damage * night.damage,
    'friendly monster damage inherits the hostile factor');
  close(game.companionRallyAttackSpeed(u), before.get(u.id).tempo * night.tempo,
    'friendly monster basic tempo inherits hostile factor');
}
for (const u of troops) {
  assert.deepEqual(game.monsterNightBonuses(u), { hp: 1, damage: 1, tempo: 1, dodge: 0 });
  assert.equal(u.maxHp, before.get(u.id).max, 'troop HP untouched');
  close(game.companionAttackDamage(u), before.get(u.id).damage, 'troop damage untouched');
  close(game.companionRallyAttackSpeed(u), before.get(u.id).tempo, 'troop tempo untouched');
}
assert.equal(pet.maxHp - pet.hp, dayPetMissing, 'wounds preserved at dusk');
assert(wraith.maxHp > before.get(wraith.id).max, 'resting Charmed Wraith also updates');
assert(reservePet.maxHp > before.get(reservePet.id).max, 'resting boss pet also updates');

// Genuine victory progress changes the same curve without requiring another nightfall.
const beforeVictory = pet.maxHp, firstPoints = game.nightPoints();
game.s.normal.mire = true;
game.s.victories['mire:normal'] = true;
assert.equal(game.nightPoints(), firstPoints + 1);
game.tick(0.1);
assert(pet.maxHp > beforeVictory, 'live night victory scaling updates friendly maximum');
const currentNight = game.monsterNightBonuses();
for (const u of monsters)
  assert.equal(u.maxHp, Math.round(before.get(u.id).max * currentNight.hp),
    'all owned monsters use latest night points');
const repeated = pet.maxHp;
game.tick(0.1);
assert.equal(pet.maxHp, repeated, 'unchanged frames cannot stack HP bonuses');

const nightSave = game.snapshot();
const restored = Campaign.restore(nightSave, () => 0.9);
restored.tick(0.1);
const restoredPet = restored.s.party.find((u) => u.id === pet.id);
assert(restoredPet && restoredPet.maxHp === pet.maxHp, 'v4 night snapshot never doubles bonus');
assert(restored.isOwnedMonster(restoredPet), 'restored pet identity remains valid');
assert(restored.s.party.some((u) => u.charmOrigin && restored.isOwnedMonster(u)),
  'Charmed ownership ledger survives v4 round trip');

game.s.clock = R.dayCycle.seconds - 0.05;
game.tick(0.1);
assert(!game.night(), 'actual simulation crossed sunrise');
for (const u of monsters) {
  assert.equal(u.maxHp, before.get(u.id).max, 'sunrise removes maximum HP bonus');
  close(game.companionAttackDamage(u), before.get(u.id).damage, 'day removes damage bonus');
  close(game.companionRallyAttackSpeed(u), before.get(u.id).tempo, 'day removes attack tempo');
}
assert.equal(pet.maxHp - pet.hp, dayPetMissing, 'sunrise preserves prior wounds');
const dawnMaximum = pet.maxHp;
game.tick(0.1);
assert.equal(pet.maxHp, dawnMaximum, 'no stacking across daylight frames');

// A second sunset does not compound the first one; dawn is fully reversible.
game.s.clock = R.dayCycle.nightAt - 0.05;
game.tick(0.1);
assert.equal(pet.maxHp, Math.round(dawnMaximum * game.monsterNightBonuses().hp),
  'repeat sunset starts from natural baseline');

// Simulate the pending evasion rules table without importing unfinished
// dodge code. A SINGLE tuning edit must immediately reach enemy and owned
// monster recipients; the resolver's per-hit integration stays in that PR.
const originalEvasion = R.skillEvasion;
R.skillEvasion = { ...(originalEvasion || {}), nightEnemyBonus: 0.05 };
const hostile = { type: 'mob', id: 'enemy-888888' };
for (const unit of [hostile, pet, reservePet, goblin, wraith])
  close(game.monsterNightBonuses(unit).dodge, 0.05, 'one future night dodge knob');
close(game.monsterNightBonuses(soldier).dodge, 0, 'ordinary troop never gains night dodge');
R.skillEvasion.nightEnemyBonus = 0.07;
for (const unit of [hostile, pet, goblin])
  close(game.monsterNightBonuses(unit).dodge, 0.07, 'future knob retuning follows allegiance');
if (originalEvasion === undefined) delete R.skillEvasion;
else R.skillEvasion = originalEvasion;

// Barracks recovery reconstructs a temporary unit before restoring its
// original pet/capture ID. It must receive the same night maximum immediately.
game.s.mercyTime = 0;
game.hero.gold = 100000;
game.zone().enemies = [];
game.zone().buildings.push({
  id: 'night-recovery-base', kind: 'barracks',
  x: game.hero.x, y: game.hero.y, progress: 4,
  queue: 0, queueType: null, full: true,
});
for (const unit of [pet, goblin]) {
  const expected = game.companionMaxHp(unit);
  unit.hp = 0;
  game.syncMonsterNightStats(unit);
  assert.equal(unit.hp, 0, 'passive cannot resurrect a fallen monster');
  assert(game.recover(unit.id), 'recover original monster with lawful Barracks action');
  assert.equal(unit.maxHp, expected, 'recovered monster uses nighttime maximum');
  assert.equal(unit.hp, expected, 'recovered monster is fully healed to nighttime max');
  assert(game.isOwnedMonster(unit), 'recovery retains exact pet/capture provenance');
}

const fake = game.unit('soldier', 1000, 1000);
fake.charmOrigin = { ...goblin.charmOrigin };
fake.charmOrigin.sourceEnemyId = 'enemy-99999';
game.s.party.push(fake);
assert(!game.isOwnedMonster(fake), 'forged/unrecorded Charm is never eligible');
assert.equal(game.monsterNightBonuses(fake).hp, 1);
game.s.party.pop();
const spoof = { ...pet, petFamily: 'crypt' };
assert(!game.isOwnedMonster(spoof), 'another unlocked pet family cannot borrow the owned ID');

// Existing mode gates stay authoritative; no duplicate rules.
game.s.mode = 'nightmare';
game.s.nightmareIntroRemaining = 10;
assert.equal(game.monsterNightBonuses(goblin).hp, 1, 'Nightmare grace remains daylight');
game.s.nightmareIntroRemaining = 0;
assert(game.monsterNightBonuses(goblin).hp > 1, 'Nightmare active night follows same curve');
game.s.phase = 'peace';
assert.equal(game.monsterNightBonuses(goblin).hp, 1, 'peace removes night passive');
game.s.phase = 'adventure';
game.s.mode = 'arena';
assert.equal(game.monsterNightBonuses(pet).tempo, 1, 'arena cannot inherit night passive');
console.log('PASS monster night shared source, pets/Charm, sunset/sunrise, victory progression, reserves, integrity, v4 restore and modes');
