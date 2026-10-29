'use strict';
// Individual Orin Ringleader Training: genuine captured identity, 100-crown
// one-time promotion, HP/damage recomputation, save and lawful Succession.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin','mage','ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
try {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.zone().enemies = [];
  g.zone().props = [];
  g.zone().buildings = [];
  Object.assign(g.hero, {x:500, y:500, order:null});
  g.hero.gold = 500;
  const target = g.makeEnemy({species:'goblin', name:'Goblin', level:1,
    hp:10000, damage:0, gold:0, xp:0}, {x:585,y:500});
  target.ranged = false;
  target.aggro = true;
  target.returning = false;
  g.zone().enemies = [target];
  g.s.rogueCharmRng = 12345;
  assert(g.cast(1,target.id,false,null,true), 'real Rogue basic executes');
  assert.equal(g.s.party.length,1,'valid individual capture');
  const u = g.s.party[0];
  assert(g.isCharmedCompanion(u),'capture provenance remains authentic');
  const initialHp = g.companionMaxHp(u), initialAttack = g.companionAttackDamage(u);
  assert.equal(g.trainCharmedRingleader(u.id),false,'unrescued teacher cannot train');
  assert.equal(g.hero.gold,500);
  g.s.rescued.ridge = true;
  const generic = g.unit('soldier', 400,400);
  g.s.party.push(generic);
  assert.equal(g.trainCharmedRingleader(generic.id),false,'ordinary troop ineligible');
  assert.equal(g.hero.gold,500);
  assert.equal(g.trainCharmedRingleader('unknown'),false,'unknown ally ineligible');
  g.hero.gold = 99;
  assert.equal(g.trainCharmedRingleader(u.id),false,'requires full 100 crowns');
  assert.equal(g.hero.gold,99,'failed payment never charges');
  u.masteryPoints = 10;
  g.hero.gold = 180;
  u.hp = u.maxHp - 23;
  assert(g.trainCharmedRingleader(u.id),'Orin promotes selected Charmed monster');
  assert.equal(g.hero.gold,80,'exactly 100 crowns spent');
  assert.equal(u.charmRingleaderTrained,true);
  assert.equal(u.masteryPoints,10,'no free mastery from paid training');
  assert.equal(g.companionMasteryTier(u),2);
  assert.equal(u.maxHp,Math.round(initialHp * R.ringleaderScaling.hp));
  assert.equal(u.hp,u.maxHp - 23,'missing HP preserved across promotion');
  assert.equal(g.companionAttackDamage(u),
    initialAttack * R.ringleaderScaling.damage,'attack scales exactly once');
  assert.equal(g.companionAttackDamage(generic),
    generic.damage + 2*g.hero.level + g.companionInheritedDamageBonus(),
    'standard Soldier not promoted');
  assert.equal(g.charmedEliteTrained(u), false,
    'paying Orin does not bypass the Rogue Hero Skill-2 signature unlock');
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2; // Permanent milestone learned through hero Skill 2.
  assert(g.charmedEliteTrained(u),
    'learning Rogue Skill 2 unlocks the elite signature without duplicate promotion');
  assert.equal(g.trainCharmedRingleader(u.id),false,'no duplicate purchase');
  assert.equal(g.hero.gold,80,'no double charge');
  g.syncCompanionLevelStats();
  assert.equal(u.maxHp,Math.round(initialHp * R.ringleaderScaling.hp),
    'level stat sync never reapplies 2.5x multiplicatively');
  const saved = g.snapshot();
  assert.equal(Campaign.validate(saved).party[0].charmRingleaderTrained,true,
    'true owner promotion persists in v4');
  const old = structuredClone(saved);
  delete old.party[0].charmRingleaderTrained;
  assert.equal(Campaign.validate(old).party[0].charmRingleaderTrained,false,
    'older v4 companion defaults untrained');
  const forgery = structuredClone(saved);
  forgery.party[1].charmRingleaderTrained = true;
  assert.throws(() => Campaign.validate(forgery),/Ringleader training/i,
    'a Soldier may not carry a forged Charmed-only promotion');
  g.s.challenge.succession = true;
  g.s.challenge.pending = true;
  assert(g.successor('paladin'),'lawful successor keeps the company');
  assert.equal(g.hero.class,'paladin');
  assert.equal(u.charmRingleaderTrained,true,'individual promotion survives successor');
  assert(g.charmedEliteTrained(u),'paid Ringleader retains elite benefits with non-Rogue successor');
  assert.equal(g.companionAttackDamage(u),
    (R.balance.companions.charmed.goblin.melee.damage+
      2*g.hero.level+g.companionInheritedDamageBonus())*R.ringleaderScaling.damage,
    'successor level recalculates friendly attack before one promotion');
  console.log('PASS Orin individual Ringleader training: rescue, eligibility, 100 crowns, mastery, health/damage, v4 save and Succession');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
