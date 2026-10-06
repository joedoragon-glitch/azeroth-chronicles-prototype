'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine');
const setup=(ex,ey,hx,hy)=>{const c=new Campaign();c.s.mercyTime=0;c.enter('vale');c.zone().props=[];c.zone().enemies=[];c.s.party=[];Object.assign(c.hero,{x:hx,y:hy});const e=c.makeEnemy({species:'goblin',name:'Sentry',level:1,hp:100,damage:5,gold:1,xp:1},{x:ex,y:ey});c.zone().enemies.push(e);return {c,e};};
let {c,e}=setup(850,900,600,900);assert(c.line(e,c.hero));c.updateEnemies(.016);assert(e.aggro,'visible enemy at 250 units spots the hero');
({c,e}=setup(880,900,600,900));c.updateEnemies(.016);assert(!e.aggro,'enemy at 280 units stays idle');
({c,e}=setup(1300,1200,1100,1200));assert(!c.line(e,c.hero),'river blocks sight');c.updateEnemies(.016);assert(!e.aggro,'enemy cannot see through terrain');
({c,e}=setup(540,350,330,350));c.updateEnemies(.016);assert(!e.aggro,'town protection remains active');
console.log('PASS increased sight radius preserves terrain sight and town protection');
