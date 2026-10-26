'use strict';
// Dreadmaw Purse-Seine Closure. One opt-in World decision at the genuinely
// warned ring release; its two traversable gaps, contraction and tick damage
// stay native, and only the lawful delayed final center blast is enhanced.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const ctx=require('./helpers/specialist-night-context.cjs');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function scene(context='normal'){
 const g=ctx.campaign(context,'paladin',()=>.99);
 g.enter('supply-crown');g.s.time=30;g.s.mercyTime=0;g.s.party=[];
 const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
 assert(e,'actual specialist captain');
 g.zone().enemies=g.zone().enemies.filter(u=>u===e);
 Object.assign(g.hero,g.safe(e.x+80,e.y),{hp:1000000,maxHp:1000000,immune:0});
 g.engage(e,true,false);
 Object.assign(e,{aggro:true,cd:1e6,specialCd:0,lastCaptainAttack:-1,
   captainOpeningSummon:true,dreadClosure:null});
 let selected=false;
 for(let n=0;n<100;n++){
  g.random=()=>n/100;e.telegraph=null;e.sequence=[];e.lastCaptainAttack=-1;
  if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===4){selected=true;break;}
 }
 assert(selected,'real selector chooses Purse-Seine Closure');
 assert.equal(e.telegraph.kind,'ring');
 assert.equal(e.telegraph.dreadMechanic,'closure');
 assert.equal(e.sequence.length,0,'one original warned ring activation');
 assert.equal(e.telegraph.gaps?.length,2,'two native escape openings');
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
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,label+': '+a+' vs '+b);
const angleDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function closedArcPoint(g,ring){
 for(let i=0;i<72;i++){
  const angle=i*Math.PI/36;
  if(ring.gaps.some(gap=>angleDistance(gap,angle)<=ring.gapWidth/2))continue;
  const point={x:ring.x+Math.cos(angle)*ring.initialRadius,
               y:ring.y+Math.sin(angle)*ring.initialRadius};
  if(!g.blocked(point.x,point.y,g.zoneId,12)&&g.line(ring,point))
    return point;
 }
 assert.fail('original arena must provide a lawful closed ring arc');
}
function checkRingBaseline(a,b){
 const p=a.e.dreadClosure,q=b.e.dreadClosure;
 assert(p&&q);
 for(const key of ['x','y','initialRadius','finalRadius','finalBlastRadius',
   'width','gapWidth','duration','tickInterval','coefficient',
   'finalCoefficient','radius','tick','age','recovery'])
  assert.equal(q[key],p[key],'original ring geometry/timing unchanged: '+key);
 assert.deepEqual(q.gaps,p.gaps,'two native safe gap angles preserved');
 assert.equal(q.gaps.length,2);
 assert(q.finalBlastRadius<q.finalRadius,'native central final blast bounded');
}
function releaseBoth(x,y){
 const warning=y.e.telegraph.timer,recovery=y.e.telegraph.recovery;
 x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
 assert.equal(y.e.telegraph.timer,warning,'original ring warning untouched');
 assert.equal(y.e.telegraph.recovery,recovery,'original cooldown untouched');
 checkRingBaseline(x,y);
 assert.equal(x.g.s.projectiles.length,y.g.s.projectiles.length,'no new projectile');
 assert.equal(x.g.s.hazards.length,y.g.s.hazards.length,'no new floor hazards');
}
function finishCenter(x,y){
 for(const scene of [x,y]){
  const ring=scene.e.dreadClosure;
  Object.assign(scene.g.hero,{x:ring.x,y:ring.y,immune:0});
  ring.age=ring.duration-0.05;
  ring.tick=999;
 }
 const hpX=x.g.hero.hp,hpY=y.g.hero.hp;
 x.g.updateCinderRegularState(x.e,.1);
 y.g.updateCinderRegularState(y.e,.1);
 assert.equal(x.e.dreadClosure,undefined,'baseline ring completes at authored duration');
 assert.equal(y.e.dreadClosure,undefined,'critical ring completes at same time');
 const hitX=hpX-x.g.hero.hp,hitY=hpY-y.g.hero.hp;
 assert(hitX>0&&hitY>0,'original bounded center blast contacts hero');
 return {hitX,hitY};
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'Critical OFF in production');
for(const context of ['normal','nightmare-night']){
 for(const level of [1,2,3]){
  const x=scene(context),y=scene(context),t=attach(y.g,level);
  assert.equal(t.count(),0,'ring warning and exit placement never sample World RNG');
  releaseBoth(x,y);
  assert.equal(t.count(),1,'one lawful ring activation one roll');
  const receipt=y.e.dreadClosure.criticalExecution;
  assert(receipt&&Object.isFrozen(receipt),'original frozen release receipt');
  assert.equal(receipt.key,'world/captain/supply-crown/4');
  assert.equal(receipt.intensity,level);
  t.session.setCriticalLevel('world',3);
  // Walking out through an advertised gap must never become damage.
  const r=x.e.dreadClosure;
  const gap=r.gaps[0],point={x:r.x+Math.cos(gap)*r.initialRadius,
                             y:r.y+Math.sin(gap)*r.initialRadius};
  Object.assign(x.g.hero,{...point,immune:0});
  Object.assign(y.g.hero,{...point,immune:0});
  const safeX=x.g.hero.hp,safeY=y.g.hero.hp;
  x.g.updateCinderRegularState(x.e,0);
  y.g.updateCinderRegularState(y.e,0);
  near(x.g.hero.hp,safeX,'baseline escape gap never hits');
  near(y.g.hero.hp,safeY,'critical escape gap never hits');
  // A real closed arc preserves its native damage budget on both sides.
  const closed=closedArcPoint(x.g,x.e.dreadClosure);
  Object.assign(x.g.hero,{...closed,immune:0});
  Object.assign(y.g.hero,{...closed,immune:0});
  x.e.dreadClosure.tick=0;y.e.dreadClosure.tick=0;
  const tickX=x.g.hero.hp,tickY=y.g.hero.hp;
  x.g.updateCinderRegularState(x.e,0);
  y.g.updateCinderRegularState(y.e,0);
  assert(tickX>x.g.hero.hp,'original contracting ring tick hits the closed arc');
  near(tickX-x.g.hero.hp,tickY-y.g.hero.hp,
    'ring tick never inherits critical modifier');
  assert.equal(t.count(),1,'ring ticks cannot reroll the original action');
  const final=finishCenter(x,y);
  assert(final.hitY>final.hitX,'only delayed center blast enhanced at level '+level);
  assert.equal(t.count(),1,'final blast never rerolls critical chance');
 }
}
{
 const x=scene(),y=scene(),t=attach(y.g,3,.99);
 releaseBoth(x,y);
 const final=finishCenter(x,y);
 near(final.hitX,final.hitY,'noncritical final blast parity');
 assert.equal(t.count(),1,'one original roll even when not critical');
}
{
 const x=scene(),t=attach(x.g);
 x.e.telegraph=null;x.g.resolveAttack(x.e);
 assert.equal(t.count(),0,'canceled ring cast cannot consume RNG');
 assert(!x.e.dreadClosure);
}
{
 const x=scene(),t=attach(x.g,2);
 x.g.hero.immune=999;const hp=x.g.hero.hp;
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 const ring=x.e.dreadClosure;
 Object.assign(x.g.hero,{x:ring.x,y:ring.y});
 ring.age=ring.duration-.05;ring.tick=999;
 x.g.updateCinderRegularState(x.e,.1);
 assert.equal(x.g.hero.hp,hp,'native immunity remains absolute at final blast');
}
{
 const x=scene(),t=attach(x.g,1);
 x.g.resolveAttack(x.e);
 assert.equal(t.count(),1);
 assert(x.e.dreadClosure?.criticalExecution);
 const saved=x.g.snapshot();
 const e=saved.zones['supply-crown'].enemies.find(u=>u.id===x.e.id);
 assert(e,'captain retained in original v4 save encounter reset');
 assert(!e.dreadClosure,'ring is transient and never saved');
 assert(!JSON.stringify(saved).includes('criticalExecution'),
   'no active ring receipt retained by v4 snapshot');
}
console.log('PASS World Dreadmaw Closure: native escape gaps, ring ticks, final blast 3 tiers in Normal/Nightmare, immutable receipt, no-crit/cancel/immune/v4');
