'use strict';
// Phase 4: lawful Charmed monsters remain native, distinct companions.
// The test-only Rogue class registry does not authorize public class selection.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const Sprites = require('../src/prototype/sprites.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const CriticalParty = require('../src/prototype/critical-party-native.js');

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

  function attachCritical(g, roll) {
    let count = 0;
    g._criticalPartyNative = CriticalParty.createSession(Critical, Levels, {
      enabled: true,
      stream: { next() { count++; return roll; } },
    });
    return () => count;
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
  const node = g.zone().nodes.find((n) => n.amount > 0 && !n.tribute && !n.mini);
  if (node) {
    assert.equal(g.gather(node.id), false, 'Expedition 1 gathering stays locked');
    g.s.expeditionRank = 2;
    assert.equal(g.gather(node.id), true, 'Charmed worker receives native gather order');
    assert.equal(goblin.order.type, 'gather');
    assert.equal(Campaign.validate(g.snapshot()).party[0].order.type, 'gather');
    goblin.order = null;
    g.s.gatheringTarget = null;
    g.s.expeditionRank = 1;
  }
  assert.equal(g.charmedCompanionProfile(goblin).hp, 100);
  assert.equal(goblin.maxHp, g.companionMaxHp(goblin));
  assert.equal(goblin.hp, goblin.maxHp, 'captured at proper full friendly HP');
  assert.equal(goblin.damage, 10, 'monster base, not Soldier base');
  assert.equal(g.companionCombatReach(goblin), 65);
  assert.equal(g.companionTrySkill(goblin, { x: 550, y: 500, hp: 100 }), false,
    'no inherited Soldier skill or fabricated target');
  // A lawful captured goblin gains its actual species maneuver with an
  // ordinary cooldown, not the conventional Soldier Power Strike.
  const testFoe = g.makeEnemy(
    { species: 'goblin', name: 'Maneuver target', level: 1, hp: 1000,
      damage: 1, gold: 0, xp: 0 },
    { x: goblin.x + 55, y: goblin.y },
  );
  testFoe.aggro = true;
  g.zone().enemies = [testFoe];
  g.hero.skills[1] = 0;
  g.s.companionCombatTraining = 1;
  assert.equal(g.charmedEliteTrained(goblin), false);
  testFoe.x = goblin.x + 150;
  assert.equal(g.companionTrySkill(goblin, testFoe), false,
    'melee natural skills cannot strike at distant enemy warning range');
  testFoe.x = goblin.x + 55;
  assert.equal(g.companionTrySkill(goblin, testFoe), true,
    'native Goblin Blinding Dust can cast as ally Skill 1');
  assert.equal(goblin.skill1Cd, R.balance.companions.charmedSkills.basicCooldown);
  assert.equal(goblin.skill2Cd, 0, 'elite move locked');
  assert.equal(g.companionTrySkill(goblin, testFoe), false,
    'global/skill cooldown prevents spam');
  testFoe.x = goblin.x + 150;
  assert.equal(g.charmedPursuitFactor(goblin, testFoe),
    R.balance.pursuit.burstMultiplier, 'native melee pursuit burst while closing');
  g.s.time += R.balance.pursuit.burstSeconds;
  assert.equal(g.charmedPursuitFactor(goblin, testFoe), 1,
    'normal-speed recovery follows the burst');
  g.s.time += R.balance.pursuit.meleeRecoverySeconds;
  assert.equal(g.charmedPursuitFactor(goblin, testFoe),
    R.balance.pursuit.burstMultiplier, 'pursuit refresh uses original cadence');
  testFoe.x = goblin.x + 55;
  assert(Campaign.validate(g.snapshot()).party[0].skill1Cd > 0,
    'natural maneuver cooldown persists in v4');
  goblin.skill1Cd = 0;
  goblin.skillGlobalCd = 0;
  g.hero.skills[1] = 1;
  assert.equal(g.charmedEliteTrained(goblin), true,
    'hero Skill 2 unlocks Ringleader inheritance');
  assert.equal(g.charmedCombatMoveFactor(goblin), R.ringleaderScaling.pursuit);
  goblin.hp = goblin.maxHp * 0.4;
  assert.equal(g.companionBasicInterval(goblin),
    R.balance.companions.charmed.goblin.melee.interval *
    R.ringleaderScaling.frenzyCooldown, 'wounded elite inherits frenzy');
  assert.equal(g.companionTrySkill(goblin, testFoe), true,
    'Skill 2 unlocks goblin elite Rogue signature');
  assert.equal(goblin.skill2Cd, R.balance.companions.charmedSkills.signatureCooldown);
  g.zone().enemies = [];
  // Ranged natives retain the longer hostile seven-second pursuit cadence.
  const slingGame = fresh();
  const sling = capture(slingGame, 'goblin', true);
  const slingFoe = slingGame.makeEnemy(
    { species: 'goblin', name: 'Distant target', level: 1, hp: 1000,
      damage: 1, gold: 0, xp: 0 },
    { x: sling.x + 350, y: sling.y },
  );
  slingFoe.aggro = true;
  slingGame.zone().enemies = [slingFoe];
  assert.equal(slingGame.charmedPursuitFactor(sling, slingFoe),
    R.balance.pursuit.burstMultiplier);
  slingGame.s.time += R.balance.pursuit.burstSeconds;
  assert.equal(slingGame.charmedPursuitFactor(sling, slingFoe), 1);
  slingGame.s.time = 7;
  assert.equal(slingGame.charmedPursuitFactor(sling, slingFoe),
    R.balance.pursuit.burstMultiplier,
    'ranged pursuit keeps the seven-second native recovery');
  // Ranged basic maneuvers are real projectiles; elite signatures have separate timers.
  slingFoe.x = sling.x + 165;
  assert.equal(slingGame.companionTrySkill(sling, slingFoe), true);
  assert.equal(slingGame.s.projectiles.at(-1).slow,
    R.balance.companions.charmedSkills.basicSlowSeconds);
  sling.skillGlobalCd = 0;
  slingGame.hero.skills[1] = 1;
  assert.equal(slingGame.companionTrySkill(sling, slingFoe), true,
    'ranged signature is independently available after Skill 2');
  assert.equal(sling.skill2Cd, R.balance.companions.charmedSkills.signatureCooldown);
  // A clock reset cannot indefinitely block future individual skills.
  sling.skill1Cd = 0;
  sling.skill2Cd = 100;
  sling.skillGlobalCd = 0;
  slingGame.s.time = 0;
  assert.equal(slingGame.companionTrySkill(sling, slingFoe), true,
    'transient squad windows must reset with the game clock');
  // Both native hostile Rogue skill families have a critical damage lever.
  // Compare the actual released damage against an otherwise identical
  // noncritical Charmed cast; a critical must not multiply status durations.
  const hitCases = [0.99, 0].map((roll) => {
    const game = fresh();
    const ally = capture(game, 'goblin');
    const foe = game.makeEnemy(
      { species: 'goblin', name: 'Critical target', level: 1, hp: 10000,
        damage: 0, gold: 0, xp: 0 },
      { x: ally.x + 55, y: ally.y },
    );
    foe.aggro = true;
    game.zone().enemies = [foe];
    const count = attachCritical(game, roll);
    const actualDamage = [];
    const damage = game.damage.bind(game);
    game.damage = (enemy, amount, source, options) => {
      if (source === ally.id) actualDamage.push(amount);
      return damage(enemy, amount, source, options);
    };
    assert.equal(game.companionTrySkill(ally, foe), true);
    assert.equal(count(), 1, 'one critical decision for the natural maneuver');
    assert.equal(ally.skill1Cd, R.balance.companions.charmedSkills.basicCooldown);
    assert.equal(ally.skill2Cd, 0, 'signature still locked');
    game.hero.skills[1] = 1;
    ally.skillGlobalCd = 0;
    assert.equal(game.companionTrySkill(ally, foe), true,
      'Ringleader training adds signature without removing the basic move');
    assert.equal(count(), 2, 'one additional roll for the signature');
    assert.equal(ally.skill2Cd, R.balance.companions.charmedSkills.signatureCooldown);
    ally.skill1Cd = 0;
    ally.skillGlobalCd = 0;
    // A pivot signature moved the Goblin away; restore lawful melee reach.
    ally.x = foe.x - 55;
    ally.y = foe.y;
    game.s.time += R.balance.companions.charmedSkills.basicSquadSpacing;
    assert.equal(game.companionTrySkill(ally, foe), true,
      'species basic stays usable while the signature is cooling down');
    assert.equal(count(), 3);
    assert.equal(ally.skill2Cd, R.balance.companions.charmedSkills.signatureCooldown);
    // The native melee basic also retains its enemy-side damage crit.
    ally.skill1Cd = 100;
    ally.skill2Cd = 100;
    // Isolate the ordinary basic critical: the new third heritage ability
    // otherwise legitimately fires when the first two skills are cooling.
    ally.skill3Cd = 100;
    ally.skillGlobalCd = 0;
    ally.cd = 0;
    game._tacticalPartyTargets = new Map();
    game.companionFight(ally, foe, [ally], 1 / 60);
    assert.equal(count(), 4, 'melee basic has its own eligible critical release');
    return { actualDamage, count };
  });
  for (let i = 0; i < 4; i++)
    assert(Math.abs(
      hitCases[1].actualDamage[i] -
      hitCases[0].actualDamage[i] * Levels.LEVERS.damage.values[0],
    ) < 1e-6, 'Charmed basic and elite criticals match hostile damage-level effect');
  // A physically launched ranged move carries ONE frozen critical receipt,
  // and its normal Slow on actual contact is not increased by the crit.
  const critShot = fresh();
  const critArcher = capture(critShot, 'goblin', true);
  const critTarget = critShot.makeEnemy(
    { species: 'goblin', name: 'Critical ranged target', level: 1, hp: 10000,
      damage: 0, gold: 0, xp: 0 },
    { x: critArcher.x + 160, y: critArcher.y },
  );
  critTarget.aggro = true;
  critShot.zone().enemies = [critTarget];
  const rangedRolls = attachCritical(critShot, 0);
  assert.equal(critShot.companionTrySkill(critArcher, critTarget), true);
  const missile = critShot.s.projectiles.at(-1);
  assert.equal(missile.criticalExecution?.key, 'charm/rogue/basic');
  assert.equal(missile.criticalExecution.critical, true);
  assert.equal(missile.slow, R.balance.companions.charmedSkills.basicSlowSeconds);
  assert.equal(rangedRolls(), 1);
  // Native ranged basics also crit, without borrowing generic Ranger
  // specials. The physical attack and Heal are distinct releases.
  critArcher.skill1Cd = 100;
  critArcher.cd = 0;
  critShot._tacticalPartyTargets = new Map();
  critShot.partyFollowPoint = () => ({ x: critArcher.x, y: critArcher.y });
  critShot.companionFight(critArcher, critTarget, [critArcher], 1 / 60);
  const basicMissile = critShot.s.projectiles.at(-1);
  assert.equal(basicMissile.criticalExecution?.key, 'troop/archer/basic');
  assert.equal(rangedRolls(), 2);
  critShot.hero.hp = Math.max(1, critShot.hero.maxHp - 90);
  assert.equal(critShot.castCompanionHeal(critArcher, critShot.hero), true);
  assert.equal(rangedRolls(), 3, 'the shared Heal rolls once, at casting');
  assert.equal(critShot.hero.supportEffects.at(-1).remaining,
    critShot.rangerSupportAmount('health') * Levels.LEVERS.healAmount.values[0],
    'Charmed Heal crit preserves the normal allied Ranger effect');
  // A forged Charm has no right to draw critical randomness.
  const falseAlly = critShot.unit('archer', critArcher.x, critArcher.y);
  falseAlly.charmOrigin = { ...critArcher.charmOrigin };
  critShot.s.party.push(falseAlly);
  assert.equal(critShot.companionTrySkill(falseAlly, critTarget), false);
  assert.equal(rangedRolls(), 3, 'rejected charmer cannot roll');
  critShot.s.party.pop();

  const forged = g.unit('soldier', 510, 500);
  forged.charmOrigin = { ...goblin.charmOrigin };
  forged.active = true;
  g.s.party.push(forged);
  assert.equal(g.isCharmedCompanion(forged), false);
  assert(!g.availableLabor().includes(forged));
  g.s.party.pop();

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
      if (role === 'ranged') {
        const woundedHero = creature.hero;
        woundedHero.hp = Math.max(1, Math.floor(woundedHero.maxHp * 0.5));
        creature.s.squadEngagement = 'fight';
        const beforeHeal = woundedHero.hp;
        assert.equal(creature.charmedRangedSupport(ally, [ally]), true);
        assert.equal(woundedHero.hp, beforeHeal, 'Charmed Heal delivers over time');
        assert.equal(woundedHero.supportEffects[0].remaining,
          creature.rangerSupportAmount('health'), 'Neri-trained Ranger amount');
        assert.equal(woundedHero.supportEffects[0].seconds, R.rangerSupport.duration);
        assert.equal(creature.s.party[0].charmSupportCd, R.rangerSupport.cooldown);
        assert.equal(creature.charmedRangedSupport(ally, [ally]), false,
          'ranged support respects cooldown');
        creature.updateRangerSupport(1);
        assert(woundedHero.hp > beforeHeal, 'timed healing actually restores HP');
        woundedHero.hp = woundedHero.maxHp;
        woundedHero.supportEffects = [];
      }
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
