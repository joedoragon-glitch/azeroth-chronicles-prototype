'use strict';
// Heal is a companion ability: ordinary Rangers, lawful Charmed ranged monsters,
// and pets with an authored ally heal can answer H and the same touch command.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const addedRogue = !Campaign.classes.rogue;
if (addedRogue) {
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
}
function scene(cls = 'rogue') {
  const g = new Campaign('normal', cls, () => 0.9);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  for (const key of ['enemies', 'props', 'buildings', 'npcs', 'nodes']) g.zone()[key] = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  return g;
}
function capture(g, species, ranged) {
  const enemy = g.makeEnemy(
    { species, name: species, level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 585, y: 500 },
  );
  Object.assign(enemy, { ranged, aggro: true, returning: false });
  g.zone().enemies = [enemy];
  g.s.rogueCharmRng = 12345;
  g.hero.basicCd = 0;
  const previous = g.s.party.length;
  assert.equal(g.cast(1, enemy.id, false, null, true), true);
  assert.equal(g.s.party.length, previous + 1);
  g.zone().enemies = [];
  const unit = g.s.party.at(-1);
  assert(g.isCharmedCompanion(unit));
  return unit;
}
const effects = (g) => g.effects.filter((e) =>
  e.type === 'heal' && e.resource === 'health' && e.target === 'hero');
try {
  // The exact player failure: Rogue with a genuine ranged Charmed healer,
  // no ordinary Ranger, must be able to use H's game command.
  {
    const g = scene();
    const healer = capture(g, 'goblin', true);
    assert.equal(g.availableRangers('health').length, 0, 'no ordinary Ranger');
    assert(g.healCompanionCasters().includes(healer));
    g.hero.hp = g.hero.maxHp - 40;
    assert.equal(g.requestRangerHeal(), true);
    assert.equal(effects(g).length, 1);
    assert.equal(g.hero.supportEffects[0].remaining, g.rangerSupportAmount('health'));
    assert.equal(g.hero.supportEffects[0].seconds, R.rangerSupport.duration);
    assert.equal(healer.charmSupportCd, R.rangerSupport.cooldown);
    assert.equal(healer.healCd, 0, 'no invented second cooldown');
    assert.equal(g.rangerSupport('mana', true), false, 'no Charm mana recovery');
    const saved = Campaign.restore(g.snapshot(), () => 0.9);
    assert(saved, 'the lawful Charmed healer survives save/restore');
    assert.equal(saved.companionHealCooldown(saved.s.party[0]), R.rangerSupport.cooldown);
  }
  // Automatic healing still uses the same support effect and one cooldown,
  // without requiring combat or a separate Ranger in the party.
  {
    const g = scene();
    const healer = capture(g, 'goblin', true);
    g.hero.hp = g.hero.maxHp - 40;
    g.autoRangerSupport();
    assert(g.hasSupportEffect(g.hero, 'health'), 'Charmed ranged auto-Heal still works');
    assert.equal(healer.charmSupportCd, R.rangerSupport.cooldown);
    g.autoRangerSupport();
    assert.equal(effects(g).length, 1, 'manual/auto routes cannot stack healing');
  }
  {
    const g = scene();
    g.s.normal.crypt = true;
    g.s.true.crypt = true;
    const pet = g.unit('pet', 505, 500, 'crypt');
    g.s.party.push(pet);
    g.hero.hp = g.hero.maxHp - 40;
    g.autoRangerSupport();
    assert(g.hasSupportEffect(g.hero, 'health'), 'authored healer pet joins idle triage');
    assert.equal(pet.healCd, R.rangerSupport.cooldown);
  }
  // The *same* Heal cooldown recovers faster between fights for the three
  // eligible caster families. Threats near the hero or company restore
  // ordinary combat-speed recovery; attacks and native skills are untouched.
  {
    const fixtures = [
      () => {
        const g = scene('paladin'), ally = g.unit('archer', 510, 500);
        g.s.party.push(ally);
        return { g, ally };
      },
      () => {
        const g = scene(), ally = capture(g, 'goblin', true);
        return { g, ally };
      },
      () => {
        const g = scene();
        g.s.normal.crypt = g.s.true.crypt = true;
        const ally = g.unit('pet', 510, 500, 'crypt');
        g.s.party.push(ally);
        return { g, ally };
      },
    ];
    for (const [index, fixture] of fixtures.entries()) {
      const { g, ally } = fixture();
      assert(g.healCompanionCasters().includes(ally), 'eligible healer ' + index);
      const key = ally.charmOrigin ? 'charmSupportCd' : 'healCd';
      ally[key] = R.rangerSupport.cooldown;
      ally.cd = 1;
      ally.skill1Cd = 3;
      assert.equal(g.alliedHealCooldownRecoveryMultiplier(),
        R.rangerSupport.idleHealCooldownRecoveryMultiplier);
      g.tick(0.05);
      assert(Math.abs(ally[key] - (10 - 0.05 *
        R.rangerSupport.idleHealCooldownRecoveryMultiplier)) < 1e-6,
        'idle Heal clock accelerates for caster ' + index);
      assert(ally.cd > 0.9 && ally.skill1Cd > 2.9,
        'idle recovery does not accelerate combat skills ' + index);
      const foe = g.makeEnemy(
        { species: 'goblin', name: 'Threat', level: 1,
          hp: 2000, damage: 1, gold: 0, xp: 0 },
        { x: 590, y: 500 },
      );
      foe.aggro = true;
      g.zone().enemies = [foe];
      assert.equal(g.alliedHealCooldownRecoveryMultiplier(), 1,
        'engaged party never earns idle multiplier ' + index);
      const before = ally[key];
      g.tick(0.05);
      assert(Math.abs(ally[key] - (before - 0.05)) < 1e-6,
        'combat Heal recovery remains native ' + index);
    }
  }
  // While healing is on cooldown H queues one hero request and gives it
  // priority over automatic treatment of a wounded different-species ally.
  {
    const g = scene();
    const healer = capture(g, 'goblin', true);
    const other = capture(g, 'skeleton', false);
    g.hero.hp = g.hero.maxHp - 20;
    other.hp = other.maxHp * 0.2;
    healer.charmSupportCd = 0.2;
    assert(g.requestRangerHeal());
    assert(g.requestRangerHeal());
    assert(g.queuedRangerHeal());
    assert.equal(effects(g).length, 0);
    healer.charmSupportCd = 0;
    assert(g.resolveQueuedRangerHeal());
    assert.equal(effects(g).length, 1);
    assert(g.hasSupportEffect(g.hero, 'health'));
    assert(!g.hasSupportEffect(other, 'health'));
    assert.equal(g.queuedRangerHeal(), null);
    assert.equal(healer.charmSupportCd, 10);
    assert.equal(g.castCompanionHeal(healer, other), false, 'cannot bypass cooldown');
    g.updateRangerSupport(1);
    assert(g.hero.hp > g.hero.maxHp - 20);
  }
  // No healing from a melee Charm, forged Charm metadata, a resting,
  // dead, working, or silenced healer.
  {
    const g = scene();
    const ranged = capture(g, 'goblin', true);
    const melee = capture(g, 'skeleton', false);
    const fake = g.unit('archer', 510, 500);
    fake.charmOrigin = { ...ranged.charmOrigin };
    g.s.party.push(fake);
    assert(!g.healCompanionCasters().includes(melee));
    assert(!g.healCompanionCasters().includes(fake));
    g.hero.hp = g.hero.maxHp - 25;
    ranged.order = { type: 'build', id: 'work' };
    assert(!g.requestRangerHeal(), 'workers cannot stop work to heal');
    ranged.order = null;
    ranged.active = false;
    assert(!g.requestRangerHeal(), 'reserve cannot heal');
    ranged.active = true;
    ranged.hp = 0;
    assert(!g.requestRangerHeal(), 'dead cannot heal');
    ranged.hp = ranged.maxHp;
    const original = g.mageSilenceActive;
    g.mageSilenceActive = (u) => u === ranged || original.call(g, u);
    assert(!g.requestRangerHeal(), 'Silence blocks manual healing');
    g.mageSilenceActive = original;
  }
  // Only the authored ally-healing pet receives H. The combat attack that
  // normally delivers its on-hit ally-heal is not replaced or put on cooldown.
  {
    const g = scene();
    g.s.normal.crypt = true;
    g.s.normal.thorn = true;
    g.s.true.crypt = true;
    g.s.true.thorn = true;
    const pet = g.unit('pet', 505, 500, 'crypt');
    const ordinary = g.unit('pet', 520, 500, 'thorn');
    g.s.party.push(pet, ordinary);
    assert(g.healCompanionCasters().includes(pet));
    assert(!g.healCompanionCasters().includes(ordinary));
    g.hero.hp = g.hero.maxHp - 33;
    assert(g.requestRangerHeal());
    assert.equal(pet.healCd, 10);
    assert.equal(pet.skill1Cd, 0);
    assert.equal(effects(g).length, 1);
    const restored = Campaign.restore(g.snapshot(), () => 0.9);
    assert(restored);
    assert.equal(restored.s.party.find((u) => u.petFamily === 'crypt').healCd, 10);
  }
  // A fake pet unlock, or a real pet without ally Heal, cannot grant H.
  {
    const g = scene();
    const locked = g.unit('pet', 505, 500, 'crypt');
    g.s.party.push(locked);
    assert.equal(g.healCompanionCasters().length, 0);
  }
  // Original three-class Ranger H behavior and hero priority are unchanged.
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const g = scene(cls);
    const ranger = g.unit('archer', 505, 500);
    const wounded = g.unit('soldier', 515, 500);
    g.s.party.push(ranger, wounded);
    g.hero.hp = g.hero.maxHp - 20;
    wounded.hp = wounded.maxHp * 0.2;
    assert(g.requestRangerHeal(), cls);
    assert(g.hasSupportEffect(g.hero, 'health'));
    assert(!g.hasSupportEffect(wounded, 'health'));
    assert.equal(ranger.healCd, 10);
  }
  console.log('PASS shared H Heal: Rogue Charm, Lifebinder, queued priority, safeguards, saves and ordinary Rangers');
} finally {
  if (addedRogue) {
    delete Campaign.classes.rogue;
    delete Campaign.talentProfiles.rogue;
  }
}
