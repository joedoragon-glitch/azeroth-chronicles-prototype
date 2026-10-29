'use strict';
// Regression: authentic Rogue-captured ranged enemies retain Ranger-equivalent
// automatic healing, including idle triage, Alchemist support and Vitality.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const addedRogue = !Campaign.classes.rogue;
if (addedRogue) {
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
}
try {
  function fresh() {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.party = [];
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    g.zone().enemies = [];
    g.zone().props = [];
    g.zone().buildings = [];
    Object.assign(g.hero, { x: 500, y: 500, order: null, gold: 10000 });
    return g;
  }
  function charm(g, species, ranged) {
    const foe = g.makeEnemy(
      { species, name: species, level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 585, y: 500 },
    );
    foe.ranged = ranged;
    foe.aggro = true;
    foe.returning = false;
    g.zone().enemies = [foe];
    g.hero.basicCd = 0;
    g.s.rogueCharmRng = 12345;
    const before = g.s.party.length;
    assert.equal(g.cast(1, foe.id, false, null, true), true);
    assert.equal(g.s.party.length, before + 1);
    g.zone().enemies = [];
    const ally = g.s.party.at(-1);
    assert(g.isCharmedCompanion(ally));
    return ally;
  }

  // Original report: the Rogue and her other Charmed creatures can be wounded
  // while everyone is idle. A Goblin Slinger must heal without enemy aggro.
  const g = fresh();
  const goblin = charm(g, 'goblin', true);
  const skeleton = charm(g, 'skeleton', false);
  assert.equal(g.manaCombatActive(), false, 'idle world is not engaged');
  g.hero.hp = g.hero.maxHp - 40;
  g.autoRangerSupport();
  assert.equal(goblin.charmSupportCd, R.rangerSupport.cooldown);
  assert.equal(g.hero.supportEffects.length, 1, 'idle Rogue gets healing');
  assert.equal(g.hero.supportEffects[0].remaining, g.rangerSupportAmount('health'));
  assert.equal(g.hero.supportEffects[0].seconds, R.rangerSupport.duration);
  const before = g.hero.hp;
  g.updateRangerSupport(1);
  assert(g.hero.hp > before, 'the heal restores health in simulation time');
  assert.equal(g.hero.supportEffects[0].remaining, 48);

  // Healing must be shareable: the same Slinger treats an injured, different
  // species companion after its cooldown, not just the player.
  g.hero.hp = g.hero.maxHp;
  g.hero.supportEffects = [];
  skeleton.hp = skeleton.maxHp - 35;
  goblin.charmSupportCd = 0;
  g.autoRangerSupport();
  assert.equal(skeleton.supportEffects.length, 1, 'cross-species companion healed');
  assert.equal(skeleton.supportEffects[0].remaining, g.rangerSupportAmount('health'));
  g.updateRangerSupport(1);
  assert(skeleton.hp > skeleton.maxHp - 35);
  assert.equal(g.charmedRangedSupport(skeleton), false, 'melee cannot heal');

  // Neri's Ranger Heal upgrade applies to all authentic Charmed ranged roles.
  g.s.rescued.archive = true;
  assert.equal(g.trainRangerSupport('health', 'archive'), true);
  assert.equal(g.rangerSupportAmount('health'), 150);
  g.hero.hp = Math.max(1, g.hero.maxHp - 70);
  g.hero.supportEffects = [];
  skeleton.supportEffects = [];
  skeleton.hp = skeleton.maxHp;
  goblin.charmSupportCd = 0;
  g.autoRangerSupport();
  assert.equal(g.hero.supportEffects[0].remaining, 150, 'Neri upgrade affects Slinger');
  assert.equal(goblin.charmSupportCd, 10);
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  const copied = restored.s.party.find((u) => u.id === goblin.id);
  assert.equal(copied.charmSupportCd, 10, 'heal cooldown survives save/restore');
  assert.equal(restored.hero.supportEffects[0].remaining, 150,
    'active upgraded healing persists through save/restore');

  // Neri's repeatable companion-max-HP training already uses shared companion
  // progression, and must continue to include Charmed melee and ranged forms.
  const oldHeroMax = g.hero.maxHp, oldSlingerMax = goblin.maxHp;
  const oldSkeletonMax = skeleton.maxHp;
  assert.equal(g.trainCompanionVitality('archive'), true);
  assert(goblin.maxHp > oldSlingerMax, 'Slinger gains Companion Vitality HP');
  assert(skeleton.maxHp > oldSkeletonMax, 'melee Charmed monster gains HP');
  assert.equal(g.hero.maxHp, oldHeroMax, 'Companion Vitality does not affect Rogue');

  // Existing Ranger control contract remains unchanged: Charmed healers do
  // not gain an unrelated mana skill or the conventional Ranger cast button.
  assert.equal(g.availableRangers('health').length, 0);
  assert.equal(g.availableRangers('mana').length, 0);
  assert.equal(goblin.charmSupportCd > 0, true);
  const other = charm(g, 'skeleton', true);
  other.charmSupportCd = 0;
  assert.equal(g.isCharmedCompanion(other), true);
  assert.equal(g.charmedRangedSupport(other), false, 'covered target never double-healed');

  // Silence, capture provenance, reserve and work orders are still respected.
  g.hero.supportEffects = [];
  g.hero.hp = g.hero.maxHp - 30;
  other.order = { type: 'build', id: 'blocked-by-job' };
  assert.equal(g.charmedRangedSupport(other), false, 'working healer unavailable');
  other.order = null;
  other.active = false;
  assert.equal(g.charmedRangedSupport(other), false, 'reserve healer unavailable');
  other.active = true;
  const oldSilence = g.mageSilenceActive;
  g.mageSilenceActive = (unit) => unit === other || oldSilence.call(g, unit);
  assert.equal(g.charmedRangedSupport(other), false, 'Silence prevents cast');
  g.mageSilenceActive = oldSilence;
  const forgery = g.unit('archer', 510, 500);
  forgery.charmOrigin = { ...goblin.charmOrigin };
  forgery.active = true;
  g.s.party.push(forgery);
  assert.equal(g.charmedRangedSupport(forgery), false,
    'unverified charm metadata grants no healing');
  g.s.party.pop();

  console.log('PASS Charmed ranged idle/party heal, Neri amounts/Vitality, save, cooldown and safeguards');
} finally {
  if (addedRogue) {
    delete Campaign.classes.rogue;
    delete Campaign.talentProfiles.rogue;
  }
}
