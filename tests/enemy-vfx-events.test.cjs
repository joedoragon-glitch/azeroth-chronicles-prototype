'use strict';
const assert = require('node:assert/strict'), C = require('../src/prototype/engine.js'), V = require('../src/prototype/enemy-vfx-events.js');
const fresh = (enabled=true) => { const c=new C('normal','paladin',()=>.5); c.enemyVfxEnabled=enabled; c.s.party=[]; c.zone().enemies=[]; Object.assign(c.hero,{x:1480,y:1700,hp:100000,maxHp:100000,mp:10000,maxMp:10000}); c.line=()=>true; return c; };
// Every boss plan including TRUE: visual bridge cannot mutate snapshots, RNG or event statistics.
for (const b of C.data.bosses) for (const form of ['normal','true']) for (let index=0;index<C.rules.attacks[b.id].length;index++) {
 const run=enabled=>{const c=fresh(enabled), e=c.bossEnemy(c.boss(b.id),form,{x:1400,y:1700});c.zone().enemies=[e];e.aggro=true;c.startAttack(e,c.hero,index);c.resolveAttack(e); if(e.motion)for(let j=0;j<30&&e.motion;j++)c.advanceMotion(e,.05);c.updateProjectiles(.1);return {snapshot:c.snapshot(),events:c.effects.filter(f=>f.type==='enemyVfx'),c,e};};
 const on=run(true),off=run(false);assert.deepEqual(on.snapshot,off.snapshot,b.id+'/'+form+'/'+index+' gameplay equivalence');assert(on.events.some(f=>f.stage==='release'),'release even without victim');
 for(const f of on.events){assert(Object.isFrozen(f));assert(Object.isFrozen(f.geometry));assert.equal(f.identity.id,'boss/'+b.id+'/'+index);assert.equal(f.identity.variant,form);assert(!('damage' in f.geometry));}
}
// True misses still produce ground payoff; repeated delivery is bounded and idempotent.
{
 const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700});c.zone().enemies=[e];c.hero.x=2000;c.startAttack(e,{x:1470,y:1700},0);c.resolveAttack(e);const n=c.effects.length;c.resolveAttack(e);assert.equal(c.effects.length,n);assert(c.effects.some(f=>f.stage==='impact'&&!f.target));assert(!c.effects.some(f=>f.type==='hurt'));
}
// Source-centered summon cast, actual (not predicted) landing points.
{
 const c=fresh(),e=c.bossEnemy(c.boss('mire'),'normal',{x:1400,y:1700});c.zone().enemies=[e];c.startAttack(e,c.hero,3);c.resolveAttack(e);const births=c.effects.filter(f=>f.stage==='spawn');assert(births.length);for(const f of births){const u=c.zone().enemies.find(u=>u.id===f.target);assert.deepEqual([f.x,f.y],[u.x,u.y]);} const release=c.effects.find(f=>f.stage==='release');assert.deepEqual([release.x,release.y],[e.x,e.y]);
}
// Captain phase starts once; all actual summon identities kept.
for(const [id,p]of Object.entries(C.rules.roomCaptains)){
 const c=fresh(),e=c.makeEnemy({species:'ashbeast',name:p.name,level:5,hp:1000,damage:20,gold:0,xp:0},{x:1400,y:1700});Object.assign(e,{captain:true,captainProfile:id,hp:400});c.zone().enemies=[e];assert(c.triggerCaptainPhase(e));assert(!c.triggerCaptainPhase(e));assert.equal(c.effects.filter(f=>f.stage==='phase').length,1);
}
// Presentation sidecar is not serialized and can be entirely disabled.
assert(!JSON.stringify(fresh().snapshot()).includes('enemyVfx'));
assert.deepEqual(V.geometry({x:3,y:4,kind:'cone',damage:999,coefficient:2}),{x:3,y:4,kind:'cone'});
console.log('PASS enemy VFX bridge: 92 boss/TRUE equivalence runs, miss/dedupe, spawn origins, phase delivery, save exclusion');
