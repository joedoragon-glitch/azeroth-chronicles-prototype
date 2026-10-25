'use strict';
// First boss-family native World slice: Thornfang's genuine warned cone only.
// Do not register his delayed landing, Slow line or summon without their own
// release owners. Never change the hero-first Level 2 field protection rules.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const ctx=require('./helpers/specialist-night-context.cjs');
function scene(context='normal',form='normal',index=0){
 const g=ctx.campaign(context,'paladin',()=>.99);
 g.enter('vale');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 for(const k of ['props','buildings','npcs'])g.zone()[k]=[];
 const e=g.bossEnemy(g.boss('thorn'),form,{x:1400,y:1700});
 assert.equal(e.type,'boss');assert.equal(e.family,'thorn');
 e.aggro=true;
 g.zone().enemies=[e];
 Object.assign(g.hero,{x:1470,y:1700,hp:1000000,maxHp:1000000,
   level:3,immune:0});
 // Isolate the release/area owner; original LOS/field-opening protections are
 // checked in their dedicated native regression suites.
 g.line=()=>true;
 assert(g.startAttack(e,g.hero,index),'original authored boss selector accepts move');
 assert.equal(e.telegraph.index,index);
 return {g,e};
}
function attach(g,level=1,roll=0){
 let calls=0;const session=World.createSession(Crit,Levels,{
  enabled:true,stream:{next(){calls++;return roll;}}
 });
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>calls,session};
}
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,msg+': '+a+' vs '+b);
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'feature not installed');
for(const context of ['normal','nightmare-night']){
 for(const form of ['normal','true']){
  for(const level of [1,2,3]){
   const a=scene(context,form),b=scene(context,form),t=attach(b.g,level);
   const warn=b.e.telegraph.timer,rec=b.e.telegraph.recovery,
     cone=b.e.telegraph.radius,angle=b.e.telegraph.angle,
     effects=b.g.s.projectiles.length,hazards=b.g.s.hazards.length;
   assert.equal(b.e.telegraph.kind,'cone','native attack zero remains a warned cone');
   assert.equal(t.count(),0,'planning/warning does not roll');
   const aHp=a.g.hero.hp,bHp=b.g.hero.hp;
   a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
   assert.equal(t.count(),1,'one released cone, one independent World roll');
   const receipt=b.e.telegraph.criticalExecution;
   assert(receipt&&Object.isFrozen(receipt));
   assert.equal(receipt.key,'world/boss/thorn/0');
   assert.equal(receipt.domain,'world');
   assert.equal(receipt.intensity,level);
   const ordinary=aHp-a.g.hero.hp,critical=bHp-b.g.hero.hp;
   assert(ordinary>0,'native original boss cone contact exists');
   assert(critical>ordinary,'Level '+level+' strengthens only lawful existing hit');
   assert.equal(b.e.telegraph.timer,warn,'same visible warning');
   assert.equal(b.e.telegraph.recovery,rec,'same authored recovery');
   assert.equal(b.e.telegraph.radius,cone,'same attack reach');
   assert.equal(b.e.telegraph.angle,angle,'same facing');
   assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length);
   assert.equal(a.g.s.hazards.length,b.g.s.hazards.length);
   assert.equal(b.g.s.projectiles.length,effects);
   assert.equal(b.g.s.hazards.length,hazards);
   assert.equal(a.e.cd,b.e.cd,'native attack cooldown unchanged');
   t.session.setCriticalLevel('world',3);
   assert.equal(t.count(),1,'damage/contact does not reroll original receipt');
  }
 }
}
{
 const a=scene(),b=scene(),t=attach(b.g,3,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1);
 near(a.g.hero.hp,b.g.hero.hp,'noncritical original boss damage remains equal');
}
{
 const a=scene(),t=attach(a.g);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'cancelled warned boss cone consumes no World sample');
}
{
 const a=scene(),t=attach(a.g,3);
 a.g.hero.immune=3;const hp=a.g.hero.hp;
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1,'committed cone rolls against protected target');
 assert.equal(a.g.hero.hp,hp,'native immunity cannot be bypassed');
}
{
 const a=scene('normal','normal',2),t=attach(a.g,1);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'Thornfang Slow line remains unreviewed and fail-closed');
}
{
 const a=scene(),t=attach(a.g,2);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 const saved=a.g.snapshot();
 const e=saved.zones.vale.enemies.find(u=>u.id===a.e.id);
 assert(e,'native boss remains in original v4 snapshot');
 assert.equal(e.telegraph,null);
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'one-shot boss receipt is not retained in existing save');
}
console.log('PASS native Thornfang boss cone: 3 strengths, Normal/TRUE, Normal/Nightmare, original warning/geometry, no-crit/immune/cancel, no other boss fallback/v4');
