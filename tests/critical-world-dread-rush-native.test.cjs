'use strict';
// Dreadmaw Transhumance: genuinely selected and collision-checked two-leg
// motion. One World release on first travel; second warning, movement and
// each lawful impact inherit the same original frozen decision.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const nightContext=require('./helpers/specialist-night-context.cjs');
function scene(context='normal'){
 const g=nightContext.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'native Dreadmaw resident');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{hp:1000000,maxHp:1000000,immune:0});
 g.engage(e,true,false);
 Object.assign(e,{aggro:true,cd:1e6,specialCd:0,lastCaptainAttack:-1,
   captainOpeningSummon:true});
 let selected=false;
 for(let n=0;n<100;n++){
  g.random=()=>n/100;
  e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===1){selected=true;break;}
 }
 assert(selected,'original specialist attack selector chooses Transhumance');
 assert.equal(e.telegraph.dreadMechanic,'rush');
 assert.equal(e.telegraph.kind,'line');
 assert.equal(e.telegraph.dreadLeg,1);
 assert.equal(e.telegraph.stage,1);
 assert.equal(e.sequence.length,1,'two original warned legs, not two casts');
 assert.equal(e.sequence[0].dreadLeg,2);
 assert.equal(e.sequence[0].stage,2);
 return {g,e};
}
function attach(g,level=1,roll=0){
 let calls=0;
 const session=World.createSession(Critical,Levels,{
  enabled:true,stream:{next(){calls++;return roll;}}
 });
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;
 return {count:()=>calls,session};
}
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-5,label+': '+a+' versus '+b);
function runLeg(x,y,prior=null){
 const a=x.e.telegraph,b=y.e.telegraph;
 assert(a&&b&&a.dreadLeg===b.dreadLeg,'both original warned legs exist');
 const originalWarn=b.timer,originalRecovery=b.recovery,
       originalShape=[b.x,b.y,b.fromX,b.fromY,b.angle,b.speed,b.motionLife,b.radius];
 const beforeX=x.g.hero.hp,beforeY=y.g.hero.hp;
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 const mx=x.e.motion,my=y.e.motion;
 assert(mx?.dreadMotion&&my?.dreadMotion,'actual delegated physical motion');
 if(prior)assert.strictEqual(my.criticalExecution,prior,'second original leg inherits first receipt');
 assert.equal(b.timer,originalWarn,'original warning duration');
 assert.equal(b.recovery,originalRecovery,'original recovery');
 assert.deepEqual([b.x,b.y,b.fromX,b.fromY,b.angle,b.speed,b.motionLife,b.radius],
   originalShape,'original path and dimensions unchanged');
 for(const key of ['speed','life','radius','recovery','dreadLeg','angle'])
   assert.equal(my[key],mx[key],'native movement budget unchanged '+key);
 const dx=mx.target.x-x.e.x,dy=mx.target.y-x.e.y;
 const ex=my.target.x-y.e.x,ey=my.target.y-y.e.y;
 near(dx,ex,'same physical leg x');near(dy,ey,'same physical leg y');
 Object.assign(x.g.hero,{x:x.e.x+dx*.5,y:x.e.y+dy*.5});
 Object.assign(y.g.hero,{x:y.e.x+ex*.5,y:y.e.y+ey*.5});
 let ticks=0;
 while(x.e.motion||y.e.motion){
   if(x.e.motion)x.g.advanceMotion(x.e,.05);
   if(y.e.motion)y.g.advanceMotion(y.e,.05);
   assert(++ticks<=50,'original rush movement terminates');
 }
 assert.equal(x.e.motion,null);assert.equal(y.e.motion,null);
 near(x.e.x,y.e.x,'identical native destination x');
 near(x.e.y,y.e.y,'identical native destination y');
 const dealtX=beforeX-x.g.hero.hp,dealtY=beforeY-y.g.hero.hp;
 assert(dealtX>0,'actual original moving line contacts hero');
 assert(dealtY>0,'candidate has same lawful contact');
 assert.equal(y.g.s.projectiles.length,x.g.s.projectiles.length,'no added missile');
 assert.equal(y.g.s.hazards.length,x.g.s.hazards.length,'no added floor pulse');
 return {receipt:my.criticalExecution,dealtX,dealtY,motion:my};
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'production feature absent');
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const x=scene(context),y=scene(context),t=attach(y.g,level);
  assert.equal(t.count(),0,'plan and warning do not draw World RNG');
  const first=runLeg(x,y);
  assert.equal(t.count(),1,'first physical release draws once');
  assert(first.receipt&&Object.isFrozen(first.receipt),'frozen World receipt');
  assert.equal(first.receipt.key,'world/captain/supply-crown/1');
  assert.equal(first.receipt.domain,'world');
  assert.equal(first.receipt.intensity,level);
  assert(first.dealtY>first.dealtX,'first native contact is critical at '+level);
  assert(y.e.telegraph?.dreadLeg===2,'native second leg clearance succeeded');
  const secondWarning=y.e.telegraph;
  assert.strictEqual(secondWarning.criticalExecution,first.receipt,
    'warned second leg already holds first release');
  t.session.setCriticalLevel('world',3);
  const second=runLeg(x,y,first.receipt);
  assert(second.dealtY>second.dealtX,
    'second lawful contact uses original Level '+level+' intensity');
  assert.equal(t.count(),1,'second release and two hit paths never reroll');
  assert.equal(x.e.telegraph,null);assert.equal(y.e.telegraph,null);
  assert.equal(y.e.sequence.length,0,'original stage count unchanged');
 }
}
{
 const x=scene(),y=scene(),t=attach(y.g,3,.99);
 for(let leg=0;leg<2;leg++){
  const a=runLeg(x,y);
  near(a.dealtX,a.dealtY,'noncritical native damage unchanged');
 }
 assert.equal(t.count(),1,'failed crit still makes only first admission roll');
}
{
 const x=scene(),t=attach(x.g,1);
 x.e.telegraph=null;x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'cancelled initial warning consumes no World sample');
 assert.equal(x.e.motion,null);
}
{
 const x=scene(),t=attach(x.g,2);
 x.e.telegraph=x.e.sequence[0];x.e.sequence=[];
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'orphan second leg cannot create critical roll');
 assert(!x.e.motion?.criticalExecution);
}
{
 const x=scene(),t=attach(x.g,3);
 x.g.hero.immune=999;
 const hp=x.g.hero.hp;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1,'committed charge samples even against immune victim');
 for(let i=0;i<50&&x.e.motion;i++)x.g.advanceMotion(x.e,.05);
 assert.equal(x.g.hero.hp,hp,'native immunity never bypassed');
}
{
 const x=scene(),t=attach(x.g,1);
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 const hp=x.g.hero.hp;
 x.g.clearSegment=()=>false;
 x.g.advanceMotion(x.e,.05);
 assert.equal(x.e.motion,null,'blocked movement aborts original motion');
 assert.equal(x.e.sequence.length,0,'blocked leg cancels queued second warning');
 assert.equal(x.g.hero.hp,hp,'blocked movement invents no contact');
 assert.equal(t.count(),1,'no roll on failed movement step');
}
{
 const x=scene(),t=attach(x.g,2);
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 assert(x.e.motion?.criticalExecution);
 const saved=x.g.snapshot();
 const resident=saved.zones['supply-crown'].enemies.find(u=>u.id===x.e.id);
 assert(resident);
 assert.equal(resident.motion,null,'original v4 save clears midflight motion');
 assert.equal(resident.telegraph,null,'original v4 save clears pending warning');
 assert.deepEqual(resident.sequence,[],'original v4 save clears second leg');
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'v4 snapshot never saves transient two-leg critical receipt');
}
console.log('PASS Dreadmaw two-leg Transhumance: native path, 3 tiers, Normal/Nightmare, one roll, movement/immune/cancel/block/no-crit and v4 reset');
