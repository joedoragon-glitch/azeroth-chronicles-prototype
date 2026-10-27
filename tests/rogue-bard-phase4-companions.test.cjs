'use strict';
// Phase 4: lawful Charmed monsters remain native, distinct companions.
// The test-only Rogue class registry does not authorize public class selection.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const Sprites = require('../src/prototype/sprites.js');

assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
try {
  function fresh() {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.party = [];
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    g.zone().enemies = [];
    g.zone().props = [];
    g.zone().buildings = [];
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.hero.gold = 10000;
    return g;
  }
  function capture(g, species = 'goblin', ranged = false) {
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
    assert.equal(g.s.party.length, before + 1, species + ' capture');
    return g.s.party.at(-1);
  }

  // No Rogue constructor privilege or conventional hiring; the first builder
  // is a genuinely captured ordinary monster with a matching save ledger.
  const g = fresh();
  assert.equal(g.availableLabor().length, 0);
  assert.equal(g.build(), false, 'solo Rogue cannot build without a worker');
  assert.match(g.companionRecruitmentReason('soldier'), /cannot hire/i);
  const goblin = capture(g);
  assert.equal(g.isCharmedCompanion(goblin), true);
  assert.equal(g.availableLabor()[0], goblin);
  assert.equal(g.availableGatherers()[0], goblin);
  assert.equal(g.charmedCompanionProfile(goblin).hp, 100);
  assert.equal(goblin.maxHp, g.companionMaxHp(goblin));
  assert.equal(goblin.hp, goblin.maxHp, 'captured at proper full friendly HP');
  assert.equal(goblin.damage, 10, 'monster base, not Soldier base');
  assert.equal(g.companionCombatReach(goblin), 65);
  assert.equal(g.companionTrySkill(goblin, { x: 550, y: 500, hp: 100 }), false,
    'no inherited Soldier skill');
  const forged = g.unit('soldier', 510, 500);
  forged.charmOrigin = { ...goblin.charmOrigin };
  assert.equal(g.isCharmedCompanion(forged), false);
  assert(!g.availableLabor().includes(forged));

  // Use the game's real build/construction/upgrade lifecycle. Only terrain
  // plot selection is isolated from unrelated roadway/scenery evolution.
  g.distanceToRoad = () => 400;
  g.blocked = () => false;
  assert.equal(g.build(), true, 'real Charmed worker receives native build order');
  const camp = g.zone().buildings.find((x) => x.kind === 'barracks');
  assert(camp);
  assert.deepEqual(goblin.order, { type: 'build', id: camp.id });
  goblin.x = camp.x;
  goblin.y = camp.y;
  assert.deepEqual(Campaign.validate(g.snapshot()).party[0].order, goblin.order,
    'active authenticated construction survives save');
  const resumed = Campaign.restore(g.snapshot(), () => 0.9);
  assert.deepEqual(resumed.s.party[0].order, goblin.order);
  resumed.zone().enemies = [];
  const worker = resumed.s.party[0];
  worker.x = camp.x;
  worker.y = camp.y;
  resumed.updateParty(4.1);
  const built = resumed.zone().buildings.find((x) => x.id === camp.id);
  assert.equal(built.progress, 4, 'actual worker completes construction');
  assert.equal(worker.order, null);

  resumed.s.expeditionRank = 4;
  assert.equal(resumed.upgradeBarracks(camp.id), true);
  assert.deepEqual(worker.order, { type: 'upgrade', id: camp.id });
  assert.deepEqual(Campaign.validate(resumed.snapshot()).party[0].order, worker.order,
    'paid Charmed upgrade order survives save');
  worker.x = built.x;
  worker.y = built.y;
  resumed.updateParty(4.1);
  assert.equal(built.full, true);
  assert.equal(worker.order, null);

  // Species-specific identity and relative combat abilities remain stable
  // across hero growth, save/reload and foreign-region native transitions.
  for (const [species, group] of Object.entries(R.balance.companions.charmed)) {
    for (const [role, spec] of Object.entries(group)) {
      const creature = fresh();
      const ally = capture(creature, species, role === 'ranged');
      assert.equal(ally.charmOrigin.species, species);
      assert.equal(creature.charmedCompanionProfile(ally), spec);
      assert.equal(ally.maxHp, creature.companionMaxHp(ally));
      assert.equal(ally.damage, spec.damage);
      assert.equal(creature.companionArmor(ally),
        spec.armor + creature.companionInheritedArmorBonus());
      assert.equal(creature.companionCombatReach(ally), spec.reach);
      assert.equal(creature.companionBasicInterval(ally), spec.interval);
      assert.equal(creature.canGatherTribute(ally), true);
      const startingHp = ally.maxHp;
      creature.hero.level += 2;
      creature.syncCompanionLevelStats();
      assert(ally.maxHp > startingHp, 'level growth for ' + species + '/' + role);
      creature.hero.level -= 2;
      creature.syncCompanionLevelStats();
      const restored = Campaign.restore(creature.snapshot(), () => 0.9);
      const copy = restored.s.party[0];
      assert.equal(copy.charmOrigin.typeId, ally.charmOrigin.typeId);
      assert.equal(copy.customName, ally.customName);
      assert.equal(restored.charmedCompanionProfile(copy), spec);
      restored.zone().enemies = [];
      restored.enter('march');
      const moved = restored.s.party.find((u) => u.id === copy.id);
      assert(moved && moved.active, 'same captured ID accompanies to Marches');
      assert.equal(moved.charmOrigin.species, species);
      assert.equal(moved.customName, ally.customName);
      assert.equal(restored.charmedCompanionProfile(moved), spec);
      // The sprite resolver is shared by Canvas/Pixi. The species fallback
      // path must never choose a conventional Soldier/Archer body.
      const actor = { ...moved, renderKind: 'ally' };
      const key = Sprites.candidateKeys(actor, 1)[0];
      assert(key && key.startsWith('enemy:' + species),
        'species art in foreign region: ' + key);
    }
  }

  // Recovery preserves exact ID, nickname, species, signed capture ledger
  // and friendly HP without reviving a different conventional troop.
  g.zone().enemies = [];
  goblin.order = null;
  goblin.hp = 0;
  goblin.active = false;
  const id = goblin.id, name = goblin.customName, origin = { ...goblin.charmOrigin };
  assert.equal(g.recover(id), true);
  assert.equal(goblin.id, id);
  assert.equal(goblin.customName, name);
  assert.deepEqual(goblin.charmOrigin, origin);
  assert.equal(goblin.hp, g.companionMaxHp(goblin));
  assert.equal(goblin.active, false);
  assert.deepEqual(g.s.charmCaptures[id], origin);
  assert.doesNotThrow(() => Campaign.validate(g.snapshot()));

  // Original classes retain their normal companion profile, recruiting and
  // active capacity; they cannot make new Rogue captures.
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const ordinary = new Campaign('normal', cls, () => 0.9);
    const unit = ordinary.unit('soldier', 500, 500);
    assert.equal(ordinary.companionMaxHp('soldier'), ordinary.companionMaxHp(unit));
    assert.equal(ordinary.companionArmor(unit), ordinary.companionArmor('soldier'));
    assert.equal(ordinary.expeditionPartyCap(1), 2);
    assert.equal(ordinary.rogueCharmProfile?.(ordinary.zone().enemies[0]), null);
  }
  console.log('PASS Phase 4 native Charm companions: species, labor, recovery, travel, persistence');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
