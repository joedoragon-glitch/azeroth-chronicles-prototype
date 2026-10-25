'use strict';
// Stage 2 ONLY: genuine Campaign Skill slots 2–8, three classes, both forms.
// Critical sessions are attached per-test; not registered in the PWA runtime.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena(cls) {
  const game = new Campaign('normal', cls, () => .9);
  completeFieldOpening(game);
  game.zone().props = [];
  game.zone().buildings = [];
  game.zone().npcs = [];
  Object.assign(game.hero, { x: 500, y: 500, order: null, hp: 200, maxHp: 1000 });
  game.hero.skills.fill(8);
  game.s.party = [game.unit('soldier', 520, 500)];
  Object.assign(game.s.party[0], { hp: 100, maxHp: 1000 });
  game.s.mercyTime = 0;
  const enemy = game.makeEnemy(
    { species: 'goblin', name: 'Native skill fixture', level: 1,
      hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 580, y: 500 },
  );
  game.zone().enemies = [enemy];
  assert(game.damage(enemy, 1, 'hero'));
  return { game, enemy };
}
function observe(game) {
  const enemy = game.zone().enemies[0];
  const troop = game.s.party[0];
  return JSON.stringify({
    hp: game.hero.hp, haste: game.hero.haste, shieldStance: game.hero.shieldStance,
    silence: game.hero.silenceField?.until,
    ward: game.hero.wardUntil,
    ally: [troop.hp, troop.rangerRallyUntil, troop.wardUntil],
    enemy: [enemy.hp, enemy.x, enemy.y, enemy.cd, enemy.specialCd, enemy.weakenUntil,
      enemy.slow, enemy.slowStacks, enemy.tauntUntil, enemy.fractureUntil],
    shots: game.s.projectiles.map(p => [
      p.slot, p.damage, p.slow, p.push, p.tauntDuration, p.fractureDuration
    ])
  });
}
let paths = 0;
for (const cls of ['paladin', 'mage', 'ranger']) {
  for (let slot = 2; slot <= 8; slot++) {
    for (const charged of [false, true]) {
      const { game: original, enemy: eA } = arena(cls);
      const { game: enhanced, enemy: eB } = arena(cls);
      if (cls === 'mage' && slot === 3 && !charged) {
        eA.rangedAim = {timer: 1, remaining: 1, max: 1, targetId: 'hero'};
        eB.rangedAim = {timer: 1, remaining: 1, max: 1, targetId: 'hero'};
      }
      let rolls = 0;
      enhanced._criticalPartyNative = Native.createSession(Critical, Levels, {
        enabled: true,
        stream: { next() { rolls++; return 0; } },
      });
      const key = 'hero/' + cls + '/' + slot + (charged ? '-charged' : '-tap');
      const first = original.cast(slot, eA.id, charged);
      const second = enhanced.cast(slot, eB.id, charged);
      assert.equal(first, true, key + ' ordinary legal release');
      assert.equal(second, true, key + ' critical legal release');
      assert.equal(rolls, 1, key + ' releases exactly once');
      assert.equal(original.s.projectiles.length, enhanced.s.projectiles.length,
        key + ' preserves projectile count');
      assert.deepEqual(original.hero.cd, enhanced.hero.cd, key + ' normal cooldowns unchanged');
      assert.deepEqual(original.hero.chargedCd, enhanced.hero.chargedCd,
        key + ' charged cooldowns unchanged');
      for (const p of enhanced.s.projectiles)
        if (p.slot === slot && p.source === 'hero') {
          assert.equal(p.criticalExecution?.key, key,
            key + ' uses original immutable launch receipt');
          assert(Object.isFrozen(p.criticalExecution));
        }
      if (cls === 'mage' && slot === 3 && !charged) {
        original.updateProjectiles(0.2);
        enhanced.updateProjectiles(0.2);
      }
      assert.notEqual(observe(enhanced), observe(original),
        key + ' must improve one of the move\'s real original consequences');
      assert.equal(rolls, 1, key + ' area/child resolution must not reroll');
      paths++;
    }
  }
}
{
  const {game} = arena('paladin');
  let rolls = 0;
  game._criticalPartyNative = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { rolls++; return 0; } }
  });
  assert(game.cast(3, null, false), 'stance raise is a release');
  assert.equal(rolls, 1);
  assert(game.cast(3, null, false), 'stance lower is a separate native toggle');
  assert.equal(rolls, 1, 'stance lowering must not consume a roll');
}
{
  const {game} = arena('mage');
  let rolls = 0;
  game._criticalPartyNative = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { rolls++; return 0; } }
  });
  assert.equal(game.cast(3, null, false), false,
    'interrupt without a native warning does not release');
  assert.equal(rolls, 0);
}
console.log('PASS native hero Skills 2–8: ' + paths +
  ' original-effect variants, released-only rolls, child receipts, cooldowns and exceptions');
