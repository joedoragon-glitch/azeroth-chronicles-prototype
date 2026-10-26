'use strict';
// Genuine native conventional captain circles: one immutable opt-in World
// decision per cast, including multiple original ground patches or queued
// warned stages. Persistent hazards remain independent, unmodified ticks.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
const plans=[['supply-march',2,'captainSpread'],['supply-highlands',1,'captainSpread'],['frontier-overseer',1,'sequential']];
function scene(profile,index,extra={}){
  const g=new Campaign('normal','paladin',()=>.99);
  completeFieldOpening(g);
  const z=g.zone();
  for(const key of ['props','buildings','npcs','enemies'])z[key]=[];
  g.s.time=30;g.s.mercyTime=0;g.s.party=[];g.s.hazards=[];
  Object.assign(g.hero,{x:1470,y:1700,hp:50000,maxHp:50000,immune:0});
  const e=g.makeEnemy(
    {species:'orc',name:'Audited area captain',level:4,hp:10000,damage:300,gold:0,xp:0},
    {x:1400,y:1700});
  Object.assign(e,{aggro:true,captain:true,roomCaptain:true,captainProfile:profile,
    specialCd:0,lastCaptainAttack:-1,...extra});
  z.enemies=[e];g.zone=()=>z;
  let chosen=false;
  for(let i=0;i<100;i++){
    g.random=()=>i/100;
    e.lastCaptainAttack=-1;e.telegraph=null;e.sequence=[];
    if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===index){chosen=true;break;}
  }
  assert(chosen,'native captain selector reaches '+profile+'/'+index);
  assert.equal(e.telegraph.kind,'circle');
  assert(e.telegraph.captainSkill,'real authored captain plan');
  assert(e.telegraph.arenaPatches?.length>0,'legal ground marks');
  return {g,e};
}
function attach(g,level=1,roll=0){
  let calls=0;
  const session=World.createSession(Critical,Levels,{
    enabled:true,stream:{next(){calls++;return roll;}},
  });
  session.setCriticalLevel('world',level);
  g._criticalWorldNative=session;
  return {count:()=>calls,session};
}
const near=(x,y,msg)=>assert(Math.abs(x-y)<1e-6,msg+': '+x+' versus '+y);
function resolveBeat(base,candidate,receipt=null){
  const a=base.e.telegraph,b=candidate.e.telegraph;
  assert(a&&b,'both original warnings present');
  assert.equal(a.index,b.index);
  const firstA=a.arenaPatches?.[0]||a,firstB=b.arenaPatches?.[0]||b;
  Object.assign(base.g.hero,{x:firstA.x,y:firstA.y});
  Object.assign(candidate.g.hero,{x:firstB.x,y:firstB.y});
  const oldHp=base.g.hero.hp,newHp=candidate.g.hero.hp;
  const timer=b.timer,recovery=b.recovery,patches=JSON.stringify(b.arenaPatches);
  const oldProjectiles=base.g.s.projectiles.length,newProjectiles=candidate.g.s.projectiles.length;
  base.g.resolveAttack(base.e);
  candidate.g.resolveAttack(candidate.e);
  assert.equal(b.timer,timer,'original warning duration');
  assert.equal(b.recovery,recovery,'native recovery/cooldown');
  assert.equal(JSON.stringify(b.arenaPatches),patches,'same original ground geometry');
  if(receipt)assert.strictEqual(b.criticalExecution,receipt,'original follow-up uses first receipt');
  const hitA=oldHp-base.g.hero.hp,hitB=newHp-candidate.g.hero.hp;
  assert(hitA>0,'original legal area contacts hero');
  assert(hitB>0,'critical candidate retains contact');
  assert.equal(base.g.s.projectiles.length-oldProjectiles,
    candidate.g.s.projectiles.length-newProjectiles,'no added projectiles');
  assert.equal(base.g.s.hazards.length,candidate.g.s.hazards.length,'same hazard count');
  for(let i=0;i<base.g.s.hazards.length;i++){
    const old=base.g.s.hazards[i],fresh=candidate.g.s.hazards[i];
    for(const key of ['x','y','radius','life','tick','damage','sourceId'])
      assert.equal(fresh[key],old[key],'native hazard budget/geometry: '+key);
    assert(!fresh.criticalExecution,'critical receipt must not reach hazard ticks');
  }
  base.e.telegraph=base.g.advanceQueuedAttack(base.e);
  candidate.e.telegraph=candidate.g.advanceQueuedAttack(candidate.e);
  return {hitA,hitB,receipt:b.criticalExecution};
}
assert.equal(Campaign.prototype._criticalWorldNative,undefined);
for(const [profile,index,flag] of plans){
  for(const level of [1,2,3]){
    const x=scene(profile,index),y=scene(profile,index),t=attach(y.g,level);
    assert(x.e.telegraph[flag]&&y.e.telegraph[flag],
      'correct original authored '+flag+' kind');
    const originalStages=1+y.e.sequence.length;
    assert.equal(t.count(),0,'no sample during selection/warning/placement');
    let receipt=null,stages=0;
    while(y.e.telegraph){
      const result=resolveBeat(x,y,receipt);
      stages++;
      assert.equal(t.count(),1,'exactly one decision per whole cast');
      assert(result.hitB>result.hitA,'Level '+level+' strengthens existing impact');
      if(!receipt){
        receipt=result.receipt;
        assert(receipt&&Object.isFrozen(receipt),'immutable native World receipt');
        assert.equal(receipt.key,'world/captain/'+profile+'/'+index);
        assert.equal(receipt.intensity,level);
        t.session.setCriticalLevel('world',3);
      }
      assert(stages<10,'original warned queue bounded');
    }
    assert.equal(stages,originalStages,'same original count of warned stages');
    assert.equal(x.e.telegraph,null);
    assert.equal(y.e.sequence.length,0,'no added follow-ups');
    assert.equal(t.count(),1,'no per-stage or per-patch re-roll');
  }
  {
    const x=scene(profile,index),y=scene(profile,index),t=attach(y.g,3,.99);
    let stages=0;
    while(y.e.telegraph){
      const a=x.e.telegraph,b=y.e.telegraph;
      const posA=a.arenaPatches[0],posB=b.arenaPatches[0];
      Object.assign(x.g.hero,{x:posA.x,y:posA.y});
      Object.assign(y.g.hero,{x:posB.x,y:posB.y});
      x.g.resolveAttack(x.e);
      y.g.resolveAttack(y.e);
      near(x.g.hero.hp,y.g.hero.hp,'noncritical native parity');
      x.e.telegraph=x.g.advanceQueuedAttack(x.e);
      y.e.telegraph=y.g.advanceQueuedAttack(y.e);
      assert(++stages<10);
    }
    assert.equal(t.count(),1,'noncritical result still one sample');
  }
  {
    const x=scene(profile,index),t=attach(x.g);
    x.e.telegraph=null;x.g.resolveAttack(x.e);
    assert.equal(t.count(),0,'cancelled cast consumes no World sample');
  }
}
{
  const x=scene('frontier-overseer',1),t=attach(x.g,2);
  x.g.hero.immune=3;const hp=x.g.hero.hp;
  while(x.e.telegraph){
    x.g.resolveAttack(x.e);
    x.e.telegraph=x.g.advanceQueuedAttack(x.e);
  }
  assert.equal(t.count(),1,'immune multi-stage warnings never re-roll');
  assert.equal(x.g.hero.hp,hp,'native immunity remains absolute');
}
{
  const x=scene('supply-march',2),t=attach(x.g);
  x.e.telegraph.captainSpread=false;
  x.g.resolveAttack(x.e);
  assert.equal(t.count(),0,'forged/non-original admission does not roll');
}
console.log('PASS native World 3 conventional captain circles: 3 tiers, single release per authored marks/warnings, original hazards, immune, cancel, no-crit parity');
