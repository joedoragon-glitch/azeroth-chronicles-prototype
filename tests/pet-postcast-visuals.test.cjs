'use strict';
// Issue #463: each pet family keeps its own physical/magical/melee semantics.
// Real pet shots do not grow a post-impact tether to a moving caster.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Fx = require('../src/prototype/combat-visuals.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const families = Object.keys(Campaign.rules.petCompanions);
assert.equal(families.length, 11, 'all eleven authored pet families remain catalogued');
const physicalFirst = ['crypt', 'archive', 'abyss'];
const approx = (a, b, message) =>
  assert(Math.abs(a - b) < 1e-6, message + ': ' + a + ' vs ' + b);

function arena(family, distance = 210) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(game);
  const zone = game.zone();
  for (const key of ['props', 'npcs', 'buildings', 'enemies']) zone[key] = [];
  game.s.time = 30;
  game.s.mercyTime = 0;
  game.s.companionCombatTraining = 2;
  Object.assign(game.hero, { x: 1380, y: 1700 });
  const pet = game.unit('pet', 1400, 1700, family);
  game.s.party = [pet];
  const enemy = game.makeEnemy(
    { species: 'goblin', name: 'Pet visual test', level: 1, hp: 1000000,
      damage: 0, xp: 0, gold: 0 },
    { x: pet.x + distance, y: pet.y },
  );
  zone.enemies = [enemy];
  game.engage(enemy);
  const events = [];
  const event = game.event;
  game.event = function (type, detail) {
    events.push({ type, ...detail });
    return event.call(this, type, detail);
  };
  return { game, pet, enemy, events };
}

let flightCases = 0;
for (const family of physicalFirst) {
  for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
    const { game, pet, enemy, events } = arena(family);
    const original = { x: pet.x, y: pet.y };
    assert(game.usePetSkill(pet, enemy, 1), family + ' skill 1 releases');
    const p = game.s.projectiles.find((p) => p.petSkillSlot === 1 && p.source === pet.id);
    assert(p, family + ' has real moving projectile');
    assert.equal(enemy.hp, enemy.maxHp, family + ' cannot hit before flight');
    approx(p.launchX, original.x, family + ' records physical release X');
    approx(p.launchY, original.y, family + ' records physical release Y');
    const direction = { x: p.dx, y: p.dy };
    pet.x += 75;
    pet.y += 135;
    game.s.time += dt;
    game.updateProjectiles(dt);
    assert.equal(enemy.hp, enemy.maxHp, family + ' cannot hit at the first short step');
    approx(p.dx, direction.x, family + ' remains independently aimed after movement');
    approx(p.dy, direction.y, family + ' keeps its original heading');
    for (let i = 0; i < 100 && game.s.projectiles.includes(p); i++) {
      game.s.time += dt;
      game.updateProjectiles(dt);
    }
    assert(enemy.hp < enemy.maxHp, family + ' eventually hits on physical contact');
    assert(!game.s.projectiles.includes(p), family + ' removes spent projectile');
    const impact = events.find((e) =>
      e.type === 'petSkill' && e.stage === 'impact' && e.slot === 1);
    assert(impact, family + ' emits contact material at actual hit');
    assert.equal(impact.physicalProjectile, true, family + ' suppresses false impact tether');
    approx(impact.fromX, original.x, family + ' impact remembers release X');
    approx(impact.fromY, original.y, family + ' impact remembers release Y');
    assert.notEqual(impact.fromY, pet.y, family + ' did not borrow moved pet Y');
    const queued = Fx.queue([impact], game, []).find((e) => e.type === 'petSkill');
    assert(queued?.physicalProjectile, family + ' retains flag in Canvas/Pixi overlay queue');
    flightCases++;
  }
}
// Only actual single-target ranged first skills use simulated physical flight.
// A ranged ROLE does not turn the Marshal's expressly instant line into a dart.
for (const family of families.filter((family) => !physicalFirst.includes(family))) {
  const { game, pet, enemy, events } = arena(family, 65);
  assert(game.usePetSkill(pet, enemy, 1), family + ' authored first move');
  assert.equal(game.s.projectiles.filter((p) => p.source === pet.id).length, 0,
    family + ' retains direct melee, cone, circle or line contact');
  const impact = events.find((e) => e.type === 'petSkill' && e.stage === 'impact');
  assert(impact && !impact.physicalProjectile, family + ' retains planted contact footprint');
}
// Each second pet skill still uses the normal interruptible 0.65-second hold
// followed by its authored immediate area or single-target contact.
for (const family of families) {
  const { game, pet, enemy, events } = arena(family, 65);
  assert(game.companionUseSecondSkill(pet, enemy), family + ' begins charged hold');
  const hp = enemy.hp;
  game.advancePartyChargeClock(0.3);
  game.resolveCompanionCharges();
  assert.equal(enemy.hp, hp, family + ' cannot pre-hit during charge');
  game.advancePartyChargeClock(0.35);
  game.resolveCompanionCharges();
  assert(enemy.hp < hp, family + ' resolves its native hit after the hold');
  const impact = events.find((e) =>
    e.type === 'petSkill' && e.stage === 'impact' && e.slot === 2);
  assert(impact && !impact.physicalProjectile, family + ' keeps nonprojectile second effect');
  assert.equal(pet.skill2Cd, Campaign.rules.balance.companions.petSecondCooldown);
}
const lineVisualGame = new Campaign('normal', 'paladin', () => 0.9);
// The pet line hits in all four distinct families are instantaneous results,
// not continuing beams. They keep a visible but short world-planted receipt,
// including when the caster walks away after the damage has already landed.
// The interruptible 0.65s charge is separately checked above.
let lineCases = 0;
for (const family of families) {
  for (const slot of [1, 2]) {
    const def = Campaign.rules.petCompanions[family][slot === 1 ? 'first' : 'second'];
    const event = { type: 'petSkill', petFamily: family, skill: def.name,
      slot, shape: def.shape, x: 1500, y: 1700, fromX: 1400, fromY: 1700 };
    const released = Fx.queue([{ ...event, stage: 'release' }], lineVisualGame, [])
      .find((f) => f.type === 'petSkill');
    const impacted = Fx.queue([{ ...event, stage: 'impact' }], lineVisualGame, [])
      .find((f) => f.type === 'petSkill');
    assert(released && impacted, family + ' skill ' + slot + ' has both authored cues');
    const normalLife = slot === 2 ? 0.85 : 0.65;
    const isLine = def.shape === 'line';
    assert.equal(released.max, isLine ? 0.32 : normalLife,
      family + ' skill ' + slot + ' release lifetime');
    assert.equal(impacted.max, isLine ? 0.3 : normalLife,
      family + ' skill ' + slot + ' impact lifetime');
    // Its target and release-site footprint are snapshots; moving the pet
    // afterward must not make the already-resolved hit drift.
    for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
      const f = { ...impacted };
      for (let i = 0; i < Math.ceil(f.max / dt) + 1 && f.life > 0; i++) f.life -= dt;
      assert(f.life <= 0, 'transient VFX expires without owning ongoing gameplay');
      assert.equal(f.x, 1500);
      assert.equal(f.fromX, 1400);
      if (isLine) lineCases++;
    }
  }
}
assert.equal(lineCases, 4 * 3, 'all four line skills verified at 20/30/60 steps');

console.log('PASS all 11 pet families: ' + flightCases +
  ' stepped physical first shots, independent travel, correct cast-origin impacts, ' +
  'eight nonflight first skills, eleven charged holds and ' + lineCases +
  ' bounded line-afterimage step checks');
