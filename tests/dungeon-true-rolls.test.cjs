'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine');

let cases=0;
for(const id of Campaign.dungeonIds){
 for(const [roll,won] of [[0,true],[1/3-1e-9,true],[1/3,false],[.99,false]]){
  let draws=0;
  const c=new Campaign('normal','paladin',()=>{draws++;return roll;});
  c.enter(id);
  const boss=c.zone().enemies.find(e=>e.family===id&&e.form==='normal');
  assert(boss,id+' has its normal boss');
  boss.hp=0;boss.heroParticipated=true;c.kill(boss);
  assert.equal(draws,1,id+' rolls exactly once on first defeat');
  assert.equal(c.s.earlyRoll[id],won,id+' applies the one-third boundary');
  assert.equal(!!c.s.pending[id],won,id+' saves the encounter entitlement');
  assert(!c.zone().enemies.some(e=>e.form==='true'&&e.hp>0),'no immediate ambush');
  c.kill(boss);assert.equal(draws,1,'duplicate death cannot reroll');
  const saved=Campaign.restore(c.snapshot(),()=>{throw Error('Reload rerolled '+id);});
  saved.enter(saved.definition().id);
  saved.enter(id);
  assert.equal(saved.s.earlyRoll[id],won);
  assert(!saved.zone().enemies.some(e=>e.family===id&&e.form==='normal'&&e.hp>0));
  assert.equal(saved.zone().enemies.filter(e=>e.family===id&&e.form==='true'&&e.hp>0).length,won?1:0,id+' reentry follows saved result');
  if(won){
   const trueBoss=saved.zone().enemies.find(e=>e.family===id&&e.form==='true'&&e.hp>0);
   assert.equal(trueBoss.type,'boss',id+' TRUE keeps boss role');
   assert.equal(trueBoss.form,'true',id+' TRUE keeps true form');
   assert.match(trueBoss.name,/ TRUE$/,id+' TRUE has an explicit TRUE name');
   trueBoss.hp=0;saved.kill(trueBoss);
   saved.enter(saved.definition().id);saved.enter(id);
   assert(!saved.zone().enemies.some(e=>e.family===id&&e.type==='boss'&&e.hp>0),id+' TRUE cannot repeat');
  }else{
   saved.s.normal.darklord=true;saved.s.true.darklord=true;
   saved.s.victories['darklord:normal']=true;saved.s.victories['darklord:true']=true;
   saved.awaken();saved.enter(id);
   assert(saved.zone().enemies.some(e=>e.family===id&&e.form==='true'&&e.hp>0),id+' missed roll is guaranteed after awakening');
  }
  cases++;
 }
}
console.log('PASS '+cases+' dungeon TRUE roll boundaries, saved outcomes, reentry, single defeat and awakening');
