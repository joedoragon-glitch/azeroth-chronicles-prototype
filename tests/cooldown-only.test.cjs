'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const R = Campaign.rules;

assert.equal(R.resourceMode.manaEnabled, false, 'cooldown-only mode is active by default');
assert.equal(R.balance.disciplines.maxRanks[1], 5, 'reassigned talent has five ranks');
assert.equal(R.cooldownBalance.reductionPerTalentRank, 0.04);
const classes = ['paladin', 'mage', 'ranger'];

function targetArena(cls) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.s.party = [];
  g.zone().props = [];
  g.hero.skills = Array(8).fill(1);
  g.hero.cd = Array(8).fill(0);
  g.hero.mp = 0;
  g.hero.hp = Math.max(1, g.hero.maxHp - 45);
  Object.assign(g.hero, { x: 500, y: 500 });
  const foe = g.makeEnemy({
    species: 'goblin', name: 'Cooldown validation target', level: 1,
    hp: 1000000, damage: 0, gold: 0, xp: 0,
  }, { x: 580, y: 500 });
  g.zone().enemies = [foe];
  return { g, foe };
}

for (const cls of classes) {
  const fresh = new Campaign('normal', cls, () => 0.9);
  assert.deepEqual(fresh.hero.skills, [1,0,0,0,0,0,0,0], cls + ' unchanged unlocks');
  assert.equal(fresh.skillManaCost(1), 0, cls + ' basic has no cost');
  assert.equal(fresh.skillManaCost(8), 0, cls + ' final special has no cost');
  assert.equal(fresh.skillManaCost(3,1,true), 0, cls + ' charged heals have no cost');
  for (const talentRank of [0,1,2,3,4,5]) {
    const ratio = 1 - 0.04 * talentRank;
    for (const [slot, charged] of [
      ...Array.from({length:8},(_,i)=>[i+1,false]),[1,true],[2,true],[3,true],
    ]) {
      const {g,foe} = targetArena(cls);
      g.hero.talents[1] = talentRank;
      const nominal = charged ? R.cooldownBalance.chargedSeconds[slot] : R.balance.skills.cooldowns[slot];
      const expected = nominal * ratio;
      assert(Math.abs(g.skillCooldown(slot,charged)-expected) < 1e-9,
        cls+' rank '+talentRank+' slot '+slot+' charged '+charged+' cooldown');
      const before = g.hero.mp;
      assert(g.cast(slot,foe.id,charged),cls+' slot '+slot+' casts without MP');
      assert.equal(g.hero.mp,before,cls+' no resource consumed');
      assert(Math.abs(g.hero.cd[slot-1]-expected)<1e-9,'cooldown begins with correct value');
      assert(!g.cast(slot,foe.id,charged),'cooldown rejects immediate repeat');
    }
  }
}
console.log('PASS three hero classes × all eight normal and three charged skills × six talent ranks');

for(const cls of classes){
  const g=new Campaign('normal',cls,()=>0.9);
  g.hero.talents[1]=5;g.hero.mp=0;
  const snapshot=g.snapshot();
  assert.equal(snapshot.hero.mp,0,'legacy MP retained in save');
  const next=Campaign.restore(snapshot,()=>0.9);
  assert.equal(next.hero.talents[1],5,'Cool-down Training investment survives reload');
  assert.equal(next.hero.mp,0,'legacy MP state persists without refill');
  const mpBefore=next.hero.mp, maxBefore=next.hero.maxMp;
  next.zone().enemies=[];
  next.updateParty=()=>{};next.updateEnemies=()=>{};
  next.tick(0.1);
  assert.equal(next.hero.mp,mpBefore,'passive recovery disabled');
  next.xp(120);
  assert.equal(next.hero.maxMp,maxBefore+R.manaBalance.perLevel,'dormant capacity still grows for future MP reactivation');
  assert.equal(next.hero.mp,mpBefore,'level-up does not refill dormant MP');
  assert.equal(next.skillCooldown(8),24*.8);
  next.hero.gold=500;next.s.rescued.archive=true;
  const gold=next.hero.gold;
  assert.equal(next.trainRangerSupport('mana','archive'),false,'retired mana-support training is unavailable');
  assert.equal(next.hero.gold,gold,'retired support training spends no crowns');
  assert.equal(next.rangerSupport('mana'),false,'mana recovery cannot activate');
  assert.equal(next.drainMana(next.hero,.12),0,'enemy mana drains are retired');
  assert.equal(next.hero.mp,mpBefore,'enemy mana drains do not alter dormant MP');
}
console.log('PASS legacy saves, talent preservation, disabled mana restoration and drain');

{
  const g=new Campaign('normal','mage',()=>0.9);
  g.hero.mp=0;
  const foe=g.zone().enemies.find(e=>e.type==='mob');
  Object.assign(foe,{x:g.hero.x+80,y:g.hero.y,aggro:true,damage:0,baseDamage:0});
  const hp=g.hero.hp;
  g.hero.immune=0;
  assert(g.hitParty(g.hero,20,.12),'magical damage still hurts hero');
  assert(g.hero.hp<hp,'enemy health threat preserved');
  assert.equal(g.hero.mp,0,'no hidden MP drain');
}
console.log('PASS enemy attacks preserve health damage while resource effect remains dormant');

{
  // Uncapped cinder and boss lifesteal uses actual HP taken; only missing HP limits healing.
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.zone().props = [];
  g.hero.maxHp = g.hero.hp = 10000;
  g.hero.immune = 0;
  const ash = g.makeEnemy(
    { species: 'ashbeast', name: 'Cinder Spitter', level: 1, hp: 1000, damage: 30, gold: 0, xp: 0 },
    { x: g.hero.x + 80, y: g.hero.y },
  );
  Object.assign(ash, { hp: 200, maxHp: 1000, projectileStyle: 'cinder' });
  g.zone().enemies = [ash];
  g.zone(); // Complete authored enemy-stat normalization before measuring lifesteal.
  const beforeHero = g.hero.hp, beforeAsh = ash.hp;
  assert(g.hitParty(g.hero, 160, 0.04, ash.id));
  const taken = beforeHero - g.hero.hp;
  assert(Math.abs((ash.hp - beforeAsh) - taken * 0.15) < 1e-8, 'Cinder Siphon heals full 15% of real HP damage');
  assert(ash.hp - beforeAsh > 0.01 * ash.maxHp, 'Cinder Siphon is NOT capped to 1% of max HP');
  const soldier = g.s.party.find(u => u.type === 'soldier');
  soldier.hp = soldier.maxHp;
  const soldierBefore = soldier.hp, ashBefore = ash.hp;
  assert(g.hitParty(soldier, 30, 0.04, ash.id));
  assert(Math.abs((ash.hp - ashBefore) - (soldierBefore - soldier.hp) * 0.15) < 1e-8,
    'Ash-beasts also siphon companions');
  g.hero.immune = 2;
  const immuneBefore = ash.hp;
  assert(!g.hitParty(g.hero, 160, 0.04, ash.id));
  assert.equal(ash.hp, immuneBefore, 'immune target cannot feed the Ash-beast');
  g.hero.immune = 0;
  ash.hp = ash.maxHp - 1;
  assert(g.hitParty(g.hero, 160, 0.04, ash.id));
  assert.equal(ash.hp, ash.maxHp, 'natural missing-HP limit prevents overheal');
}
console.log('PASS uncapped 15% Cinder Siphon, companions, immunity, and natural missing-health bound');

{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.zone().props = [];
  g.hero.maxHp = g.hero.hp = 10000;
  g.hero.immune = 0;
  Object.assign(g.hero, { x: 500, y: 500 });
  const def = Campaign.data.bosses.find(b => b.id === 'crypt');
  const crypt = g.bossEnemy(def, 'normal', { x: 480, y: 500 });
  crypt.hp = crypt.maxHp * 0.5;
  // Stress a high-damage AoE so its 15% transfer demonstrably exceeds 2%.
  crypt.damage = 160;
  g.zone().enemies = [crypt];
  g.zone(); // Settle zone stats before the controlled two-target hit.
  crypt.hp = crypt.maxHp * 0.5;
  const soldier = g.s.party.find(u => u.type === 'soldier');
  soldier.hp = soldier.maxHp = 10000;
  Object.assign(soldier, { x: 510, y: 515, active: true });
  for (const u of g.s.party.filter(u => u !== soldier)) u.active = false;
  const heroBefore = g.hero.hp, soldierBefore = soldier.hp, bossBefore = crypt.hp;
  g.resolveArea(crypt, {
    kind: 'circle', count: 1, x: 500, y: 505, fromX: 480, fromY: 500,
    radius: 160, coefficient: 1, manaDrain: 0.05, persistent: false,
  });
  const actualLoss = (heroBefore - g.hero.hp) + (soldierBefore - soldier.hp);
  assert(actualLoss > 0, 'boss area hits active hero and companion');
  const gained = crypt.hp - bossBefore;
  assert(Math.abs(gained - actualLoss * 0.15) < 1e-8, 'boss heals from aggregate actual party HP damage');
  assert(gained > crypt.maxHp * 0.02, 'boss AoE healing is NOT capped at 2% of boss maximum HP');

  crypt.hp = crypt.maxHp - 2;
  const nearlyFull = crypt.hp;
  assert(g.hitParty(g.hero, 160, 0.05, crypt.id));
  assert.equal(crypt.hp, crypt.maxHp, 'boss cannot heal beyond maximum HP');
  assert(crypt.hp - nearlyFull <= 2, 'only missing HP constrains healing');
  g.hero.immune = 2;
  crypt.hp = crypt.maxHp * 0.5;
  const frozen = crypt.hp;
  assert(!g.hitParty(g.hero, 160, 0.05, crypt.id));
  assert.equal(crypt.hp, frozen, 'immunity denies boss life-steal');

  const dragonDef = Campaign.data.bosses.find(b => b.id === 'abyss');
  const dragon = g.bossEnemy(dragonDef, 'normal', { x: 480, y: 500 });
  dragon.hp = dragon.maxHp / 2;
  g.zone().enemies = [dragon];
  g.hero.immune = 0;
  const dragonBefore = dragon.hp;
  assert(g.hitParty(g.hero, 160, 0.08, dragon.id));
  assert.equal(dragon.hp, dragonBefore,
    'non-siphoning dragon does not gain implausible drain; separate cooldown heal remains deferred');
}
console.log('PASS uncapped 15% supernatural boss AoE lifesteal, natural heal bound and non-siphoning bosses');

{
  // Worst-case seven-target AoE: a Dark Lord siphon scales with real aggregate
  // party damage and never applies the rejected 2%-of-boss-max-HP cast cap.
  const g = new Campaign('normal', 'mage', () => 0.9);
  const bossDef = Campaign.data.bosses.find(b => b.id === 'darklord');
  const darkLord = g.bossEnemy(bossDef, 'normal', { x: 500, y: 500 });
  darkLord.hp = darkLord.maxHp * 0.5;
  g.s.expeditionRank = 6;
  g.zone().props = [];
  g.zone().enemies = [darkLord];
  g.zone(); // Avoid counting zone-stat migration as recovered boss health.
  darkLord.hp = darkLord.maxHp * 0.5;
  Object.assign(g.hero, { x: 500, y: 500, hp: 10000, maxHp: 10000, immune: 0 });
  g.s.party = Array.from({ length: 6 }, (_, i) => {
    const u = g.unit(i % 2 ? 'archer' : 'soldier', 520 + (i % 3) * 10, 510 + Math.floor(i / 3) * 20);
    u.maxHp = u.hp = 10000;
    return u;
  });
  const victims = [g.hero, ...g.s.party];
  const previousHP = victims.map(u => u.hp);
  const bossBefore = darkLord.hp;
  darkLord.damage = 500;
  g.resolveArea(darkLord, {
    kind: 'circle', count: 1, x: 520, y: 510, fromX: 500, fromY: 500,
    radius: 200, coefficient: 1, manaDrain: 0.12, persistent: false,
  });
  const totalActualDamage = victims.reduce((sum, u, i) => sum + previousHP[i] - u.hp, 0);
  const totalHealing = darkLord.hp - bossBefore;
  assert(totalActualDamage > 0 && victims.every((u, i) => u.hp < previousHP[i]),
    'the area damages the hero and all six active companions');
  assert(Math.abs(totalHealing - totalActualDamage * R.vitalitySiphon.healFraction) < 1e-7,
    'boss heals from each actual HP loss without an artificial per-skill limit');
  assert(totalHealing > darkLord.maxHp * 0.02,
    'seven-target life drain legitimately exceeds the rejected 2% boss-HP ceiling');
}
console.log('PASS 7-target Dark Lord life-siphon stress case with no percent-max-HP cap');

{
  // Elemental and construct bosses heal without acquiring implausible life-steal.
  for (const family of ['abyss', 'citadel']) {
    const g = new Campaign('normal', 'mage', () => 0.9);
    const cfg = R.bossRecovery[family];
    const def = Campaign.data.bosses.find(b => b.id === family);
    const boss = g.bossEnemy(def, 'normal', { x: 500, y: 500 });
    g.zone().enemies = [boss];
    boss.hp = boss.maxHp * 0.5;
    assert(g.startBossRecovery(boss), family + ' starts its own heal when wounded');
    assert.equal(boss.telegraph.bossHeal, true, 'healing warns separately from damage');
    assert.equal(boss.telegraph.name, cfg.name);
    assert.equal(boss.healCd, cfg.cooldown, family + ' independent heal cooldown starts');
    assert(!g.startBossRecovery(boss), family + ' cannot queue a duplicate');
    const before = boss.hp;
    g.resolveAttack(boss);
    assert(Math.abs(boss.hp - (before + cfg.healFraction * boss.maxHp)) < 1e-9,
      family + ' heals exactly the authored fraction');
    assert(g.effects.some(e => e.type === 'heal' && e.target === boss.id),
      'boss recovery emits visible healing');
    boss.telegraph = null;
    assert(!g.startBossRecovery(boss), family + ' heal cooldown prevents repeats');
    boss.healCd = 0;
    boss.hp = boss.maxHp * 0.9;
    assert(!g.startBossRecovery(boss), family + ' cannot heal when not sufficiently injured');
    assert.equal(g.hero.hp, g.hero.maxHp, 'self-heal does not damage the party');
  }
}
console.log('PASS independently telegraphed Dragon and Sentinel cooldown healing');
