'use strict';
// Dreadmaw delegated Ensiling: one actual warned initial cone World release,
// not a blanket critical to ongoing vapors or their native Slow/cooldowns.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Critical=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const nightContext=require('./helpers/specialist-night-context.cjs');
function scene(context='normal'){
  const g=nightContext.campaign(context,'paladin',()=>.99);
  g.enter('supply-crown');
  g.s.time=30;g.s.mercyTime=0;g.s.party=[];g.s.hazards=[];
  const e=g.zone().enemies.find(u=>u.roomCaptain&&u.captainProfile==='supply-crown');
  assert(e,'authored real Dreadmaw');
  g.zone().enemies=g.zone().enemies.filter(u=>u===e);
  const point=g.safe(e.x+85,e.y);
  Object.assign(g.hero,point,{hp:1000000,maxHp:1000000,immune:0});
  g.engage(e,true,false);
  Object.assign(e,{aggro:true,cd:1e6,specialCd:0,lastCaptainAttack:-1,
    captainOpeningSummon:true});
  let selected=false;
  for(let sample=0;sample<100;sample++){
    g.random=()=>sample/100;
    e.lastCaptainAttack=-1;e.telegraph=null;e.sequence=[];
    if(g.startCaptainAttack(e,g.hero)&&e.telegraph?.index===2){selected=true;break;}
  }
  assert(selected,'native Dreadmaw selector admits Ensiling');
  assert.equal(e.telegraph.dreadMechanic,'ensiling');
  assert.equal(e.telegraph.kind,'cone');
  assert.equal(e.telegraph.captainProfile,'supply-crown');
  assert.equal(e.telegraph.index,2);
  assert.equal(e.sequence.length,0,'no invented follow-ups');
  return {g,e};
}
function attach(g,level=1,roll=0){
  let n=0;const session=World.createSession(Critical,Levels,{
    enabled:true,stream:{next(){n++;return roll;}},
  });
  session.setCriticalLevel('world',level);g._criticalWorldNative=session;
  return {count:()=>n,session};
}
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,label+': '+a+' versus '+b);
assert.equal(Campaign.prototype._criticalWorldNative,undefined,'not auto-installed in production');
for(const context of ['normal','nightmare-night']){
  for(const level of [1,2,3]){
    const x=scene(context),y=scene(context),t=attach(y.g,level);
    const ax=x.e.telegraph,ay=y.e.telegraph;
    assert.equal(t.count(),0,'selection and warning do not consume World RNG');
    const beforeY=y.g.hero.hp,beforeX=x.g.hero.hp;
    const warning=ay.timer,recovery=ay.recovery,cone=ay.angle,
      radius=ay.radius,amount=ay.coefficient;
    x.g.resolveAttack(x.e);
    y.g.resolveAttack(y.e);
    assert.equal(t.count(),1,'one release at actual specialist cone');
    const receipt=ay.criticalExecution;
    assert(receipt&&Object.isFrozen(receipt));
    assert.equal(receipt.key,'world/captain/supply-crown/2');
    assert.equal(receipt.domain,'world');
    assert.equal(receipt.intensity,level);
    const normalHit=beforeX-x.g.hero.hp,critHit=beforeY-y.g.hero.hp;
    assert(normalHit>0,'original Ensiling cone physically hits in '+context);
    assert(critHit>normalHit,'critical amplifies only real initial cone');
    for(const [k,v] of [['timer',warning],['recovery',recovery],['angle',cone],
      ['radius',radius],['coefficient',amount]])assert.equal(ay[k],v,'original '+k);
    assert.equal(y.e.cd,x.e.cd,'unchanged captain cooldown');
    assert.equal(y.e.specialCd,x.e.specialCd);
    assert.equal(y.g.s.hazards.length,x.g.s.hazards.length,'same original persistent floors');
    for(let i=0;i<x.g.s.hazards.length;i++){
      const a=x.g.s.hazards[i],b=y.g.s.hazards[i];
      for(const key of ['x','y','radius','life','damage','tick'])
        assert.equal(b[key],a[key],'same original floor '+key);
      assert(!b.criticalExecution,'persistent floor receipt stripped');
    }
    assert.equal(y.e.dreadVapors?.length,1,'only one original delegated vapor');
    assert.equal(x.e.dreadVapors?.length,1,'baseline creates identical vapor');
    const vapor=x.e.dreadVapors[0],boosted=y.e.dreadVapors[0];
    for(const key of ['x','y','angle','radius','coefficient','tickInterval',
      'slow','slowDuration','life','age','skill'])
      assert.equal(boosted[key],vapor[key],'unchanged delegated vapor '+key);
    assert(!boosted.criticalExecution,'vapor cannot inherit receipt');
    t.session.setCriticalLevel('world',3);
    const hpA=x.g.hero.hp,hpB=y.g.hero.hp;
    vapor.tick=0;boosted.tick=0;
    x.g.updateCinderRegularState(x.e,0);
    y.g.updateCinderRegularState(y.e,0);
    assert.equal(t.count(),1,'vapor and contact never reroll');
    near(hpA-x.g.hero.hp,hpB-y.g.hero.hp,'native vapor tick budget unchanged');
    assert(x.g.hero.hp<hpA,'delegated vapor still ticks');
  }
}
{
  const x=scene(),y=scene(),t=attach(y.g,3,.99);
  x.g.resolveAttack(x.e);y.g.resolveAttack(y.e);
  assert.equal(t.count(),1);
  near(x.g.hero.hp,y.g.hero.hp,'failed critical roll retains original hit');
  assert.equal(x.e.dreadVapors[0].coefficient,y.e.dreadVapors[0].coefficient);
}
{
  const x=scene(),t=attach(x.g);
  x.e.telegraph=null;x.g.resolveAttack(x.e);
  assert.equal(t.count(),0,'cancelled warning no World roll');
}
{
  const x=scene(),t=attach(x.g);
  x.e.telegraph.index=3;x.e.telegraph.dreadMechanic='herd';
  x.g.resolveAttack(x.e);
  assert.equal(t.count(),0,'unreviewed Nucleus Herd cannot borrow Ensiling critical');
}
console.log('PASS Dreadmaw Ensiling initial cone: real selector, Normal/Nightmare, 3 tiers, original vapor/floor ticks, no-crit, cancellation and exclusions');
