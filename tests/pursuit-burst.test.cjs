'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine');
const c=new C();c.enter('vale');c.zone().enemies=[];c.zone().props=[];c.s.party=[];Object.assign(c.hero,{x:1100,y:900});const e=c.makeEnemy({species:'goblin',name:'Pursuer',level:1,hp:100,damage:5,gold:1,xp:1},{x:800,y:900});c.zone().enemies.push(e);c.engage(e);
c.updateEnemies(.1);assert(e.pursuitBurstUsed);assert(e.pursuitBurst>0);assert(Math.abs(e.x-824.5)<.01,'one chase burst raises speed 40%');
let restored=C.restore(c.snapshot());assert(restored.zone().enemies[0].pursuitBurstUsed,'save reload does not renew the burst');
e.x=800;e.pursuitBurst=0;c.updateEnemies(.1);assert(Math.abs(e.x-817.5)<.01,'continued engagement returns to normal speed');
c.disengage(e,1.1);assert(!e.aggro);assert(!e.pursuitBurstUsed);c.engage(e);c.updateEnemies(.1);assert(e.pursuitBurstUsed);assert(Math.abs(e.x-824.5)<.01,'fresh engagement gets one new burst');
const wall=new C();wall.enter('vale');wall.zone().enemies=[];wall.zone().props=[];wall.s.party=[];Object.assign(wall.hero,{x:1300,y:1200});const blocked=wall.makeEnemy({species:'goblin',name:'Separated',level:1,hp:100,damage:5,gold:1,xp:1},{x:1100,y:1200});wall.zone().enemies.push(blocked);wall.engage(blocked);assert(!wall.line(blocked,wall.hero));wall.updateEnemies(.1);assert(!blocked.pursuitBurstUsed,'no sprint into an unseen target across the river');
console.log('PASS one brief chase burst per engagement, visible pursuit, reload persistence and normal chase recovery');
