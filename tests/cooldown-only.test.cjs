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
