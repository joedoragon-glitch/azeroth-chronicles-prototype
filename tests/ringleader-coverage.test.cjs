'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine');
const zones=[...Campaign.data.regions.map(r=>r.id),...Campaign.dungeonIds];
let cases=0;
for(const zone of zones){
 const probe=new Campaign('normal','paladin',()=>.9);probe.enter(zone);
 if(['march','frontier'].includes(zone)){probe.s.clock=500;probe.updateNight();}
 const profiles=new Set(probe.zone().enemies.filter(e=>e.type==='mob'&&e.form==='normal').map(e=>e.species+':'+!!e.guard));
 for(const profile of profiles){
  const [species,guard]=profile.split(':');
  for(const [roll,count]of [[.9,1],[.2,2]]){
   const c=new Campaign('normal','paladin',()=>roll);c.enter(zone);
   if(['march','frontier'].includes(zone)){c.s.clock=500;c.updateNight();}
   const victims=c.zone().enemies.filter(e=>e.species===species&&e.form==='normal'&&String(!!e.guard)===guard).slice(0,2);
   assert.equal(victims.length,2,zone+' '+profile+' has a matching pair');
   for(const e of victims){e.hp=0;e.heroParticipated=true;c.kill(e);}
   const pending=c.s.pending[species];assert(pending,zone+' '+profile+' schedules its own leader');assert.equal(pending.count,count);
   const restored=Campaign.restore(c.snapshot(),()=>roll);restored.updateElites(3);
   const leaders=restored.zone().enemies.filter(e=>e.species===species&&e.form==='ringleader'&&e.hp>0);
   assert.equal(leaders.length,count,zone+' '+profile+' spawns the saved roll');
   for(const e of leaders){assert.equal(!!e.guard,guard==='true');assert.equal(!!e.nightOnly,!!victims[1].nightOnly);assert.equal(e.baseHp,victims[1].baseHp*Campaign.rules.ringleaderScaling.hp);assert.equal(e.baseDamage,victims[1].baseDamage*Campaign.rules.ringleaderScaling.damage);assert.equal(e.gold,victims[1].gold*1.5);assert.equal(e.xp,victims[1].xp*1.5);assert.equal(!!e.ranged,!!victims[1].ranged);}
   cases++;
  }
 }
}
assert(cases>=44,'all regional, night and guardian species were covered');

for(const zone of ['march','frontier']){
 const c=new Campaign('normal','paladin',()=>.9);c.enter(zone);c.s.clock=719.9;c.updateNight();
 const species=zone==='march'?'wraith':'stalker',victims=c.zone().enemies.filter(e=>e.species===species).slice(0,2);
 for(const e of victims){e.hp=0;e.heroParticipated=true;c.kill(e);}
 const nightBonus=c.s.pending[species].nightBonus;assert(nightBonus.hp>1&&nightBonus.damage>1);
 const restored=Campaign.restore(c.snapshot());restored.s.clock=0;restored.updateNight();restored.updateElites(3);
 const leader=restored.zone().enemies.find(e=>e.species===species&&e.form==='ringleader');assert(leader,zone+' delayed night leader appears');
 assert.deepEqual(leader.eliteNightBonus,nightBonus);assert.equal(leader.hp,leader.baseHp*nightBonus.hp);assert.equal(leader.damage,leader.baseDamage*nightBonus.damage);
 restored.engage(leader);assert.equal(leader.maxHp,leader.baseHp*nightBonus.hp);
}
console.log('PASS '+cases+' one/two ringleader outcomes for every ordinary, night and guardian species, including reload and dawn');
