'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine');
const c=new C();c.enter('vale');c.zone().enemies=[];c.zone().props=[];c.s.party=[];Object.assign(c.hero,{x:1100,y:900});const e=c.makeEnemy({species:'goblin',name:'Pursuer',level:1,hp:100,damage:5,gold:1,xp:1},{x:800,y:900});c.zone().enemies.push(e);c.s.valeFieldAwakened=true;c.s.thornHeroInitiated=true;c.s.mercyTime=0;c.hero.level=3;c.tacticalAutoRogue=()=>false;c.engage(e);assert(e.aggro,'pursuit fixture must be admitted beyond level-1 hero-first protection');
c.updateEnemies(.1);assert(e.pursuitBurstUsed);assert.equal(e.pursuitBurst,1.2);assert(Math.abs(e.x-826.25)<.01,'one chase burst raises speed 50%');
let restored=C.restore(c.snapshot());assert(restored.zone().enemies[0].pursuitBurstUsed,'save reload does not renew the burst');
e.x=800;e.pursuitBurst=0;c.updateEnemies(.1);assert(Math.abs(e.x-817.5)<.01,'continued engagement returns to normal speed');
c.disengage(e,1.1);assert(!e.aggro);assert(!e.pursuitBurstUsed);c.engage(e);c.updateEnemies(.1);assert(e.pursuitBurstUsed);assert(Math.abs(e.x-826.25)<.01,'fresh engagement gets one new burst');
// The 3200-unit regional projection moved both river banks eastward; straddle the live barrier.
const wall=new C();wall.enter('vale');wall.zone().enemies=[];wall.zone().props=[];wall.s.party=[];const [bankWest,bankEast]=C.rules.barriers[0].bounds;Object.assign(wall.hero,{x:bankEast+70,y:1200});const blocked=wall.makeEnemy({species:'goblin',name:'Separated',level:1,hp:100,damage:5,gold:1,xp:1},{x:bankWest-70,y:1200});wall.zone().enemies.push(blocked);wall.s.valeFieldAwakened=true;wall.s.thornHeroInitiated=true;wall.hero.level=3;wall.engage(blocked);assert(!wall.line(blocked,wall.hero));wall.updateEnemies(.1);assert(!blocked.pursuitBurstUsed,'no sprint into an unseen target across the river');
const boss=new C();boss.enter('frontier');boss.zone().props=[];boss.s.party=[];const warlord=boss.zone().enemies.find(x=>x.family==='warlord'&&x.form==='normal');boss.zone().enemies=[warlord];Object.assign(warlord,{x:1900,y:1400,home:{x:1900,y:1400},cd:1});Object.assign(boss.hero,{x:2400,y:1400});boss.engage(warlord);boss.updateEnemies(.1);assert(warlord.pursuitBurstUsed);assert(Math.abs(warlord.x-1921.75)<.01,'boss also bursts at 50% extra speed');
assert.equal(warlord.pursuitBurstReadyAt, boss.s.time + 5.5,
  'authored boss pursuit renewal is unchanged');
console.log('PASS native pursuit burst speed, engagement/reset, collision/LOS, boss cadence and saves');
