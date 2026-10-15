'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const bossDef = C.data.bosses.find((boss) => boss.id === 'darklord');

function encounter(mode, heroClass) {
  const game = new C(mode, heroClass, () => 0.9);
  assert(game.enter('crown'));
  const lord = game.bossEnemy(bossDef, 'normal', { x: 1100, y: 1100 });
  game.zone().enemies = [lord];
  Object.assign(game.hero, { x: 1200, y: 1100, maxHp: 100000, hp: 100000 });
  return { game, lord };
}

assert.equal(C.rules.attacks.darklord.length, 6, 'all six main moves are authored');
assert.equal(C.rules.bossRecovery.darklord.name, 'Second Wind');

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(C.classes)) {
    const { game, lord } = encounter(mode, heroClass);
    const repertoire = game.buildBossAttack(lord, 0, game.hero);
    assert.equal(repertoire.sequence.length, 2, 'three individually timed sword casts');
    assert.deepEqual(
      [repertoire.first, ...repertoire.sequence].map((attack) => attack.timer),
      [1.1, 0.5, 0.8],
    );
    assert.equal(repertoire.sequence[0].royalSidestep, true);
    assert([repertoire.first, ...repertoire.sequence].every((a) => a.anonymousCast),
      'all three sword stages use cast bars, not ground warnings');
    const gambit = game.buildBossAttack(lord, 1, game.hero);
    assert.equal(gambit.sequence.length, 2, 'three marked landing moves');
    assert(
      [gambit.first, ...gambit.sequence].every((attack) => attack.landing),
      'all three require actual landing movement',
    );
    assert.equal(game.bossAttackWeights(lord, game.hero, true)[4], 0);
    lord.hp = lord.maxHp * 0.25;
    assert(game.bossAttackWeights(lord, game.hero, true)[4] > 0);
    const finisher = game.buildBossAttack(lord, 4, game.hero).first;
    assert.equal(finisher.kind, 'line');
    assert.equal(finisher.warning, 1.5);
    assert(finisher.anonymousCast, 'No More Heroes has an anonymous cast bar');
    assert.equal(finisher.recovery * C.rules.bossCadence.specialRecoveryMultiplier, 2);
    assert.equal(game.buildBossAttack(lord, 3, game.hero).first.royalTerritory, true);

    lord.telegraph = game.buildBossAttack(lord, 5, game.hero).first;
    game.resolveAttack(lord);
    assert(lord.royalTaxation.marked.includes('hero'));
    game.line = () => true;
    game.tacticalRogueLeashAllows = () => true;
    assert(game.damage(lord, 80, 'hero'));
    assert(!lord.royalTaxShield, 'one solo attack does not create a shield');
    for (let i = 2; i <= 4; i++) {
      assert(game.damage(lord, 80, 'hero'));
      if (i < 4) assert(!lord.royalTaxShield, 'fewer than four solo hits grant no shield');
    }
    assert.equal(lord.royalTaxShield, lord.maxHp * 0.12,
      'fourth damaging solo hit grants twelve-percent shield');
    const hp = lord.hp;
    assert(game.damage(lord, 80, 'hero'));
    assert.equal(lord.hp, hp, 'shield absorbs the following hit');
    assert.equal(C.restore(game.snapshot()).s.version, 4);
  }

  const { game, lord } = encounter(mode, 'ranger');
  game.line = () => true;
  game.clearSegment = () => true;
  game.tacticalRogueLeashAllows = () => true;
  game.engage(lord, true);
  lord.telegraph = game.buildBossAttack(lord, 2, game.hero).first;
  game.resolveAttack(lord);
  const guards = game.bossOwnedSummons(lord);
  assert.equal(guards.length, 4, 'Royal Muster summons four Normal Crown guards');
  assert(guards.every((guard) => guard.royalFormationUntil === game.s.time + 6));
  const guard = guards[0];
  Object.assign(guard, { x: 1050, y: 1100 });
  const guardHp = guard.hp;
  const bossHp = lord.hp;
  game.s.projectiles = [
    {
      id: 'test-royal-shot',
      target: lord.id,
      source: 'hero',
      x: 900,
      y: 1100,
      dx: 1,
      dy: 0,
      speed: 1200,
      life: 2,
      damage: 60,
      style: 'arrow',
    },
  ];
  game.updateProjectiles(0.25);
  assert.equal(lord.hp, bossHp, 'a real Crown guard intercepts the approaching projectile');
  assert.equal(guardHp - guard.hp, 48, 'guard takes the hit with 20% temporary mitigation');
  assert.equal(lord.royalPrerogativeReadyAt, game.s.time + 18);
  assert(C.restore(game.snapshot()).zone().enemies.some((enemy) => enemy.family === 'darklord'));
  lord.returning = 0.05;
  game.disengage(lord, 0.1);
  assert.equal(lord.royalPrerogativeReadyAt, undefined, 'reaction clears on complete leash');
  assert.equal(lord.royalTaxation, undefined, 'tax marks clear on complete leash');
  assert.equal(lord.royalTaxShield, undefined, 'shield clears on complete leash');
}
console.log('PASS Dark Lord six moves, solo tax, guard formation/intercept, v4 save and reset');
