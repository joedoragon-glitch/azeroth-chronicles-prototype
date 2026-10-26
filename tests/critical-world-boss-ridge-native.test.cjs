'use strict';
// Ridge Tyrant: real original warned cone across Normal/TRUE and both modes.
// Separate authored cargo, charge and summons now receive their own World keys.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const ctx=require('./helpers/specialist-night-context.cjs');
function scene(context='normal',form='normal',index=0){
 const g=ctx.campaign(context,'paladin',()=>.99);
 g.enter('highlands');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 const e=g.bossEnemy(g.boss('ridge'),form,{x:g.hero.x-70,y:g.hero.y});
 assert.equal(e.type,'boss');assert.equal(e.family,'ridge');
 e.aggro=true;g.zone().enemies=[e];
 Object.assign(g.hero,{hp:1000000,maxHp:1000000,level:8,immune:0});
 g.line=()=>true;
 assert(g.startAttack(e,g.hero,index),'native ridge boss attack selector');
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
const near=(x,y,msg)=>assert(Math.abs(x-y)<1e-6,msg+': '+x+' vs '+y);
assert.equal(Campaign.prototype._criticalWorldNative,undefined);
for(const context of ['normal','nightmare-night']){
 for(const form of ['normal','true'])
  for(const level of [1,2,3]){
   const a=scene(context,form),b=scene(context,form),t=attach(b.g,level);
   assert.equal(b.e.telegraph.kind,'cone');
   assert.equal(t.count(),0,'warning cannot draw World RNG');
   const old=a.g.hero.hp,hp=b.g.hero.hp,
     timer=b.e.telegraph.timer,recovery=b.e.telegraph.recovery,
     radius=b.e.telegraph.radius,angle=b.e.telegraph.angle;
   a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
   assert.equal(t.count(),1,'one native boss cone release');
   const receipt=b.e.telegraph.criticalExecution;
   assert(receipt&&Object.isFrozen(receipt));
   assert.equal(receipt.key,'world/boss/ridge/0');
   assert.equal(receipt.intensity,level);
   const base=old-a.g.hero.hp,enhanced=hp-b.g.hero.hp;
   assert(base>0,'native Ridge cone lawful hero hit');
   assert(enhanced>base,'same original hit enhanced at tier '+level);
   assert.equal(b.e.telegraph.timer,timer);
   assert.equal(b.e.telegraph.recovery,recovery);
   assert.equal(b.e.telegraph.radius,radius);
   assert.equal(b.e.telegraph.angle,angle);
   assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length,'no added missiles');
   assert.equal(a.g.s.hazards.length,b.g.s.hazards.length,'no new hazards');
   assert.equal(a.e.cd,b.e.cd,'native boss recovery unchanged');
   t.session.setCriticalLevel('world',3);
   assert.equal(t.count(),1);
  }
}
{
 const a=scene(),b=scene(),t=attach(b.g,3,.99);
 a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
 assert.equal(t.count(),1);near(a.g.hero.hp,b.g.hero.hp,'failed roll original damage parity');
}
{
 const a=scene(),t=attach(a.g,2);
 a.e.telegraph=null;a.g.resolveAttack(a.e);
 assert.equal(t.count(),0,'cancelled warning never samples');
}
{
 const a=scene(),t=attach(a.g,3);
 a.g.hero.immune=999;const hp=a.g.hero.hp;
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 assert.equal(a.g.hero.hp,hp,'native immunity absolute');
}
{
 const a=scene('normal','normal',1),t=attach(a.g);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1,'cargo is its own legal released action');
 assert.equal(a.g.s.projectiles.length,1);
 assert.equal(a.g.s.projectiles[0].criticalExecution.key,'world/boss/ridge/1');
}
{
 const a=scene(),t=attach(a.g);
 a.g.resolveAttack(a.e);
 assert.equal(t.count(),1);
 const saved=a.g.snapshot();
 const e=saved.zones.highlands.enemies.find(x=>x.id===a.e.id);
 assert(e&&e.telegraph===null,'original boss save resets visible attack');
 assert(!JSON.stringify(saved).includes('criticalExecution'),'no transient boss receipt saved');
}
console.log('PASS Ridge boss native cone: Normal/TRUE, Normal/Nightmare, 3 levels, original warning/geometry, noncrit/cancel/immune/cargo exclusion/v4');
