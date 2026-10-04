'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js');
for(let bits=0;bits<1024;bits++){const c=new Campaign('normal','paladin',()=>.9);let n=bits,early=0;
for(const id of Campaign.dungeonIds){const state=n%4;n=Math.floor(n/4);if(state){c.victory(id,'normal');c.s.earlyRoll[id]=state!==1;}if(state===2)c.s.pending[id]={kind:'dungeon',count:1};if(state===3){c.victory(id,'true');early++;}}
c.victory('darklord','normal');c.victory('darklord','true');c.awaken();assert.equal(c.peace,early===5,'initial phase '+bits);
for(const id of Campaign.dungeonIds){if(c.s.true[id]){assert(!c.s.pending[id]);continue;}if(!c.s.normal[id]){c.enter(id);const e=c.zone().enemies.find(e=>e.family===id&&e.form==='normal');e.hp=0;c.kill(e);}
assert(c.s.pending[id],'entitlement '+bits+' '+id);c.enter(id);const boss=c.zone().enemies.find(e=>e.family===id&&e.form==='true'&&e.hp>0);assert(boss,'TRUE access '+bits+' '+id);assert(boss.baseHp>=13000&&boss.baseHp<=17000);boss.hp=0;c.kill(boss);}
assert(c.peace,'final phase '+bits);assert.equal(Object.keys(c.s.late).length,5-early);Campaign.restore(c.snapshot());}
console.log('PASS All 1,024 production ending-state combinations reach permanent peace without losing early TRUE victories.');
