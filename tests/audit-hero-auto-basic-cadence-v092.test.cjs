'use strict';
// v0.9.2 read-only, engine-native timing measurement. No game source changes.
// The shell probe matches app.js: successful attacks are immediate; failed
// probes wait 100ms. Synthetic frame schedules are NOT physical-device tests.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
Campaign.enableRoguePlaytest();
const classes = ['paladin', 'mage', 'ranger', 'rogue'];
const near = (a,b, tol=1e-6) => assert(Math.abs(a-b)<=tol, String(a)+' vs '+String(b));
const ranges = { paladin: 120, mage: 400, ranger: 450, rogue: 220 };
let fixtures = 0;
function arena(cls, training=0, farOffset=null) {
  const g = new Campaign('normal', cls, () => 0.99);
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.mercyTime = 0;
  g.s.party = [];
  const z = g.zone();
  z.props = []; z.buildings = []; z.npcs = [];
  Object.assign(g.hero, {x:500, y:500, hp:1000, maxHp:1000,
    immune:0, order:null, basicCd:0});
  g.hero.skills[0] = 1;
  g.hero.talents[1] = training;
  // Isolate cadence from the Rogue's separate lawful 12% enemy capture RNG.
  if(cls==='rogue') g.rogueCharmAttempt=()=>false;
  const make = (name, distance) => {
    const e = g.makeEnemy({
      species:'goblin', name, level:1, hp:100000000,
      damage:0, gold:0, xp:0
    }, {x:500+distance,y:500});
    e.aggro=true; e.returning=false; e.home={x:e.x,y:e.y};
    return e;
  };
  const primary = make('Near lawful foe',80);
  const far = farOffset === null ? null : make('Far selected foe',farOffset);
  z.enemies = far ? [primary,far] : [primary];
  // Preserve true hero simulation and cast/target/Slow resolvers while
  // isolating moving enemies, companion AI, incoming damage and projectile hits.
  g.updateEnemies=()=>{};
  g.updateParty=()=>{};
  g.updateProjectiles=()=>{};
  fixtures++;
  return {g,primary,far};
}
function lock(g,foe,isLocked=true) {
  g.manualHeroTargetId=foe.id;
  g.manualHeroTargetZone=g.zoneId;
  g.manualHeroTargetLocked=isLocked;
  g.s.heroTarget=foe.id;
}
function measure(cls,training,frameMs,slowStacks=0,durationMs=11000) {
  const {g}=arena(cls,training);
  if (slowStacks) {
    g.hero.slow=100;
    g.hero.slowStacks=slowStacks;
  }
  const stamp=[],dt=Math.min(0.1,frameMs/1000);
  let nextProbeAt=0,failed=0,attempts=0;
  for(let i=0;i*frameMs<=durationMs;i++) {
    const now=i*frameMs;
    g.tick(dt);
    if(g.hero.basicCd<=0 && now>=nextProbeAt) {
      attempts++;
      if(g.castMovementBasic()) stamp.push(now);
      else {failed++;nextProbeAt=now+100;}
    }
    if(g.effects.length>200) g.effects.length=0;
  }
  const gaps=stamp.slice(1).map((time,i)=>(time-stamp[i])/1000);
  assert(gaps.length>=1,cls+' insufficient auto attacks');
  const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length;
  const base=g.basicSkillCooldown();
  const recovery=slowStacks ? g.cooldownRecoveryElapsed(
    {slow:100,slowStacks},1
  ) : 1;
  const expected=base/recovery;
  const theoreticalFrame=Math.ceil(expected/dt-1e-7)*(frameMs/1000);
  const result={class:cls,training,frameMs,slowStacks,
    baseSeconds:+base.toFixed(5),
    recoveryFactor:+recovery.toFixed(5),
    expectedCooldownSeconds:+expected.toFixed(5),
    observedMeanSeconds:+mean.toFixed(5),
    minGap:+Math.min(...gaps).toFixed(5),
    maxGap:+Math.max(...gaps).toFixed(5),
    hits:stamp.length,attempts,failed,
    observedVsTheoreticalFrameSeconds:+(mean-theoreticalFrame).toFixed(5)};
  // A controlled continuous target should have no unexplained attack omissions.
  assert.equal(failed,0,cls+' unexpected failed probe');
  near(mean,theoreticalFrame,0.00011);
  return result;
}
const measurements=[];
for(const cls of classes)for(const training of [0,5])
  for(const frameMs of [1000/60,1000/30,200])
    measurements.push(measure(cls,training,frameMs));
for(const cls of classes)for(const stacks of [1,4])
  measurements.push(measure(cls,5,1000/60,stacks));
console.log('TIMING_MEASUREMENTS '+JSON.stringify(measurements));

// Lock and movement ordering: a selected foe beyond basic range must not
// redirect automatic fire onto a nearer foe. Note that even a simple
// *selection* is sticky until the game's longer selection-clear threshold.
const targetFindings=[];
for(const cls of classes) {
  const gap=cls==='paladin'?155:cls==='mage'?430:
    cls==='ranger'?465:245;
  assert(gap>ranges[cls] && gap<680);
  for(const locked of [false,true]) {
    const {g,primary,far}=arena(cls,0,gap);
    const nearHp=primary.hp,farHp=far.hp;
    lock(g,far,locked);
    assert.equal(g.selectedHeroTarget()?.id,far.id,cls+' lock must persist outside basic reach');
    assert.equal(g.castMovementBasic(),false,cls+' should not retarget nearby while far selected');
    assert.equal(g.hero.basicCd,0,cls+' failed probe cannot spend basic cooldown');
    assert.equal(primary.hp,nearHp);
    assert.equal(far.hp,farHp);
    targetFindings.push({class:cls,locked,farDistance:gap,
      nearDistance:80,autoAttack:'blocked-by-selected-out-of-range-target'});
  }
}
// Paladin/Mage/Ranger manual Skill 1 should approach the selected far foe,
// not switch to nearby enemy or overwrite the selection.
for(const cls of ['paladin','mage','ranger']){
  const gap=cls==='paladin'?155:cls==='mage'?430:465;
  const {g,primary,far}=arena(cls,0,gap);
  lock(g,far,true);
  const hp=primary.hp,farId=far.id;
  assert(g.cast(1,null,false),cls+' explicit skill request should queue reach');
  assert.equal(g.hero.order?.type,'skill-approach',cls+' skill should initiate approach');
  assert.equal(g.hero.order.id,farId);
  assert.equal(g.hero.cd[0],0,cls+' reach request should not spend cooldown early');
  assert.equal(primary.hp,hp,cls+' no nearby retarget on skill');
  let release=false;
  for(let i=0;i<180;i++){
    g.tick(1/60);
    if(g.hero.cd[0]>0){release=true;break;}
  }
  assert(release,cls+' approach must lead to actual manual skill release');
  assert.equal(g.manualHeroTargetId,farId,cls+' lock retained after approach');
  assert.equal(primary.hp,hp,cls+' did not silently retarget nearby enemy');
  targetFindings.push({class:cls,action:'manual-skill1-outside-range',
    behavior:'native-approach-and-release',lockRetained:true});
}
// Mage/Ranger have a nonbasic skill with reach beyond automatic basic range.
// It can cast at the selected far enemy immediately and must retain the lock.
for(const cls of ['mage','ranger']){
  const gap=cls==='mage'?430:465;
  const {g,primary,far}=arena(cls,0,gap);
  lock(g,far,true);
  g.hero.skills[1]=1;
  const nearHp=primary.hp;
  assert(g.cast(2,null,false),cls+' Skill 2 can reach distant selected foe');
  assert.notEqual(g.hero.order?.type,'skill-approach');
  assert.equal(g.manualHeroTargetId,far.id);
  assert.equal(g.s.heroTarget,far.id);
  assert.equal(primary.hp,nearHp);
  assert.equal(g.castMovementBasic(),false,cls+' in-range Skill 2 cannot redirect basics');
  targetFindings.push({class:cls,action:'manual-skill2-beyond-basic-range',
    behavior:'fires-at-selected-foe',lockRetained:true,autoStillBlocked:true});
}
// Rogue songs are self-centered: when the selected foe is outside range,
// the song cannot begin a chase and must not redirect to a closer enemy.
{
  const {g,primary,far}=arena('rogue',0,245);
  lock(g,far,true);
  const hp=primary.hp;
  assert.equal(g.cast(1,null,false),false,'Rogue distant song does not start approach');
  assert.notEqual(g.hero.order?.type,'skill-approach');
  assert.equal(g.manualHeroTargetId,far.id);
  assert.equal(primary.hp,hp);
  targetFindings.push({class:'rogue',action:'manual-skill1-outside-range',
    behavior:'fails-without-approach-or-retarget',lockRetained:true});
}
// Existing selection-distance lifetime differs between ordinary and held lock.
for(const cls of classes)for(const locked of [false,true]){
  const gap=locked?1450:700;
  const {g,primary,far}=arena(cls,0,gap);
  far.aggro=false;
  lock(g,far,locked);
  assert.equal(g.selectedHeroTarget(),null);
  assert.equal(g.manualHeroTargetId,null);
  assert.equal(g.castMovementBasic(),true,cls+' near enemy auto resumes once selection expires');
  targetFindings.push({class:cls,locked,action:'selection-expires',
    selectionDistance:gap,autoResumed:true});
}
console.log('TARGET_MEASUREMENTS '+JSON.stringify(targetFindings));

// A legitimate stack of four Slow hits while the basic is cooling adds
// persistent cooldown debt. Measure the first next attack, not just algebra.
const slowImpact=[];
for(const cls of classes)for(const hits of [0,1,4]){
  const {g}=arena(cls,5);
  assert(g.castMovementBasic());
  const firstCd=g.hero.basicCd;
  g.tick(0.1);
  for(let i=0;i<hits;i++) assert(g.applySlow(g.hero,2));
  const pendingAfterHits=g.hero.basicCd;
  const dt=1/60;
  let next=null;
  for(let i=1;i<900;i++){
    g.tick(dt);
    if(g.hero.basicCd<=0 && g.castMovementBasic()){
      next=0.1+i*dt;break;
    }
  }
  assert(next!==null,cls+' Slow attack should eventually recover');
  assert(hits===0||pendingAfterHits>firstCd,cls+' debt should increase active cooldown');
  slowImpact.push({class:cls,slowHits:hits,
    firstCd:+firstCd.toFixed(5),
    pendingAfterHits:+pendingAfterHits.toFixed(5),
    nextAttackSeconds:+next.toFixed(4)});
}
console.log('SLOW_IMPACT '+JSON.stringify(slowImpact));
// A failed probe can add up to ~100ms before newly eligible targets are tried.
{
  const {g,primary}=arena('paladin');
  g.zone().enemies=[];
  assert.equal(g.castMovementBasic(),false);
  const failedAt=1000, nextProbeAt=failedAt+100;
  g.zone().enemies=[primary];
  const readyAt=failedAt+1;
  const firstAllowedAt=Math.ceil(nextProbeAt/(1000/60))*(1000/60);
  assert(g.castMovementBasic(),'direct basic is ready immediately after target appears');
  console.log('PROBE_GAP '+JSON.stringify({
    noTargetAtMs:failedAt,eligibleAtMs:readyAt,
    nextPermittedProbeMs:nextProbeAt,
    worstCaseExtraDelayMs:nextProbeAt-readyAt,
    frameAlignedDelayMs:+(firstAllowedAt-readyAt).toFixed(2),
    model:'exact 100ms failed-probe gate in app.js; schedule not browser-executed'
  }));
}
console.log('PASS audit: '+fixtures+' engine fixtures, native cast/lock/approach, 4-class cadence and Slow');
