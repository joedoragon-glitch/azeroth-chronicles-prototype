'use strict';
// Native criticals belong to legitimate allied actions, not a recruitment class.
// The gameplay feature gate remains OFF: tests attach only an opt-in native session.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const R = Campaign.rules;
const addedRogue = !Campaign.classes.rogue;
if (addedRogue) {
  // Node's standalone Campaign engine keeps Rogue registration test-local.
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
}

function game() {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  for (const key of ['enemies', 'props', 'buildings', 'npcs', 'nodes']) g.zone()[key] = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  return g;
}
function charm(g, species, ranged) {
  const foe = g.makeEnemy(
    { species, name: species, level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: 585, y: 500 },
  );
  Object.assign(foe, { ranged, aggro: true, returning: false });
  g.zone().enemies = [foe];
  g.hero.basicCd = 0;
  g.s.rogueCharmRng = 12345;
  const before = g.s.party.length;
  assert.equal(g.cast(1, foe.id, false, null, true), true);
  assert.equal(g.s.party.length, before + 1);
  g.zone().enemies = [];
  const unit = g.s.party.at(-1);
  assert(g.isCharmedCompanion(unit), 'must originate from lawful Rogue capture');
  return unit;
}
function attach(g, roll = 0, level = 1) {
  let count = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { count++; return roll; } },
  });
  session.setCriticalLevel('companion', level);
  g._criticalPartyNative = session;
  return { count: () => count };
}
function combat(ranged, roll = null) {
  const g = game();
  const unit = charm(g, 'goblin', ranged);
  const enemy = g.makeEnemy(
    { species: 'skeleton', name: 'critical target', level: 1, hp: 100000,
      damage: 0, xp: 0, gold: 0 },
    { x: unit.x + (ranged ? 210 : 35), y: unit.y },
  );
  g.zone().enemies = [enemy];
  g.engage(enemy);
  g.partyFollowPoint = () => ({ x: unit.x, y: unit.y });
  g._tacticalPartyTargets = new Map();
  unit.cd = 0;
  const tally = roll === null ? null : attach(g, roll);
  return { g, unit, enemy, tally };
}
function basicAttack(state) {
  const {g, unit, enemy} = state;
  g.companionFight(unit, enemy, [unit], 0.05);
}

for (const ranged of [false, true]) {
  const normal = combat(ranged), critical = combat(ranged, 0);
  const type = ranged ? 'archer' : 'soldier';
  assert.equal(normal.g.troopCriticalRelease(normal.unit, 'basic'), null,
    'normal Campaign keeps the critical feature gate OFF');
  basicAttack(normal);
  basicAttack(critical);
  assert.equal(critical.tally.count(), 1, type + ' Charmed basic rolls once');
  assert.equal(normal.unit.cd, critical.unit.cd, 'basic recovery unchanged');
  if (ranged) {
    assert.equal(normal.g.s.projectiles.length, 1);
    assert.equal(critical.g.s.projectiles.length, 1, 'critical adds no arrows');
    const regular = normal.g.s.projectiles[0], shot = critical.g.s.projectiles[0];
    assert.equal(shot.criticalExecution.key, 'troop/archer/basic');
    assert.equal(shot.criticalExecution.source, critical.unit.id);
    assert.equal(shot.criticalExecution.group, 'companion');
    assert(Object.isFrozen(shot.criticalExecution));
    assert(Math.abs(shot.damage - regular.damage * 1.08) < 1e-7,
      'ranged Charmed critical improves actual native projectile damage');
    assert.equal(critical.tally.count(), 1, 'shot travel cannot reroll');
  } else {
    assert(critical.enemy.hp < normal.enemy.hp,
      'melee Charmed critical increases actual native hit damage');
  }

  // Charmed monsters do not own ordinary Soldier/Archer combat skills.
  // Their critical eligibility must not manufacture Power Strike/Triple Shot.
  assert.equal(critical.g.companionUseFirstSkill(critical.unit, critical.enemy), false);
  assert.equal(critical.g.companionUseSecondSkill(critical.unit, critical.enemy), false);
  assert.equal(critical.tally.count(), 1, 'unowned troop skills consume no RNG');
}

// Legal ranged heal is a real Charmed skill, with the same 3 intensity tiers
// and no extra RNG/cooldown from its five seconds of later recovery.
for (const level of [1, 2, 3]) {
  const base = game(), boosted = game();
  const ordinary = charm(base, 'goblin', true);
  const healer = charm(boosted, 'goblin', true);
  const tally = attach(boosted, 0, level);
  base.hero.hp = base.hero.maxHp - 40;
  boosted.hero.hp = boosted.hero.maxHp - 40;
  assert.equal(base.requestRangerHeal(), true);
  assert.equal(boosted.requestRangerHeal(), true);
  const original = base.hero.supportEffects[0], effect = boosted.hero.supportEffects[0];
  assert(Math.abs(effect.remaining - original.remaining * Levels.LEVERS.healAmount.values[level - 1]) < 1e-7,
    'Level ' + level + ' strengthens the original Charmed Heal budget');
  assert.equal(effect.seconds, R.rangerSupport.duration);
  assert.equal(healer.charmSupportCd, R.rangerSupport.cooldown);
  assert.equal(healer.healCd || 0, 0, 'Charmed Heal never gains a second timer');
  assert.equal(ordinary.charmSupportCd, healer.charmSupportCd);
  assert.equal(tally.count(), 1, 'one genuine Heal release at Level ' + level);
  base.updateRangerSupport(2.5);
  boosted.updateRangerSupport(2.5);
  assert.equal(tally.count(), 1, 'Heal ticks do not reroll');
  assert(boosted.hero.hp > base.hero.hp, 'Charmed critical Heal restores more HP than baseline');
  assert.equal(boosted.requestRangerHeal(), true, 'cooldown input queues hero Heal');
  assert(boosted.queuedRangerHeal(), 'hero Heal queue is retained');
  assert.equal(tally.count(), 1, 'queue does not count as a new cast');
  const saved = Campaign.restore(boosted.snapshot(), () => 0.9);
  assert(saved);
  assert.equal(saved.s.party.find((u) => u.id === healer.id).charmSupportCd, 10);
  assert.equal(saved.queuedRangerHeal(), null, 'queued input remains transient');
}

// Charmed heal can critically fire from idle automatic support as well.
{
  const g = game(), healer = charm(g, 'goblin', true);
  const tally = attach(g, 0);
  g.hero.hp = g.hero.maxHp - 100;
  g.autoRangerSupport();
  assert.equal(g.hero.supportEffects[0].remaining, 66);
  assert.equal(healer.charmSupportCd, 10);
  g.autoRangerSupport();
  assert.equal(tally.count(), 1, 'automatic triage respects a single release/cooldown');
}

// A miss still consumes exactly one eligible roll but has no boosted damage.
{
  const normal = combat(true), missed = combat(true, 0.99);
  basicAttack(normal);
  basicAttack(missed);
  assert.equal(missed.tally.count(), 1);
  assert.equal(missed.g.s.projectiles[0].criticalExecution.critical, false);
  assert.equal(missed.g.s.projectiles[0].damage, normal.g.s.projectiles[0].damage);
}

// A tampered/unauthenticated archer must never obtain critical eligibility.
{
  const g = game(), original = charm(g, 'goblin', true);
  const fake = g.unit('archer', 600, 500);
  fake.charmOrigin = { ...original.charmOrigin };
  g.s.party.push(fake);
  assert.equal(g.isCharmedCompanion(fake), false);
  const tally = attach(g, 0);
  assert.equal(g.troopCriticalRelease(fake, 'basic'), null);
  assert.equal(tally.count(), 0);
  assert.equal(g.troopCriticalRelease(original, 'basic').group, 'companion');
  assert.equal(tally.count(), 1);
}
assert.equal(Campaign.prototype._criticalPartyNative, undefined,
  'do not switch on criticals globally as part of this correction');
if (addedRogue) {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
console.log('PASS native Charmed companion melee/ranged basics, critical Heal tiers/auto/queue, integrity, OFF gate');
