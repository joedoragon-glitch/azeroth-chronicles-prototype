'use strict';
// Post-PR #908 read-only gameplay regression audit on the exact published
// engine. No gameplay source edits, save rewrites, deploy or balance tuning.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
Campaign.enableRoguePlaytest();
const classes=['paladin','mage','ranger','rogue'];
const reach={paladin:120,mage:400,ranger:450,rogue:220};
const results=[];
function arena(cls){
  const g=new Campaign('normal',cls,()=>0.99);
  const z=g.zone();
  g.s.mercyTime=0;
  g.s.valeFieldAwakened=true;
  g.s.thornHeroInitiated=true;
  g.s.party=[];
  Object.assign(z,{props:[],npcs:[],buildings:[],enemies:[]});
  Object.assign(g.hero,{x:500,y:500,order:null,basicCd:0,hp:1000,maxHp:1000,immune:0,slow:0});
  g.hero.skills[0]=1;
  g.rogueCharmAttempt=()=>false;
  g.updateEnemies=()=>{};g.updateParty=()=>{};g.updateProjectiles=()=>{};
  const make=(name,x)=>{
    const e=g.makeEnemy({species:'goblin',name,level:1,hp:1000000,damage:0,gold:0,xp:0},{x,y:500});
    e.aggro=false;e.returning=false;
    z.enemies.push(e);return e;
  };
  return {g,make};
}
function select(g,e,held){
  g.manualHeroTargetId=e.id;
  g.manualHeroTargetZone=g.zoneId;
  g.manualHeroTargetLocked=held;
  g.s.heroTarget=e.id;
}
function retained(g,e,held, label) {
  assert.equal(g.selectedHeroTarget()?.id,e.id,label+' selected target retained');
  assert.equal(g.manualHeroTargetLocked,held,label+' locked flag retained');
  assert.equal(g.s.heroTarget,e.id,label+' squad focus retained');
}
function boss(e){e.type='boss';e.family='thorn';e.captain=false;}
let interactions=0;
for(const cls of classes)for(const held of [false,true]){
  const {g,make}=arena(cls);
  const near=make('Legal nearby mob',575);
  const far=make('Unengaged selected boss',500+reach[cls]+25);
  boss(far);
  select(g,far,held);
  assert.equal(g.automaticHeroTargetAllowed(far),false,'cold boss cannot be passively opened');
  assert.equal(g.automaticHeroTargetAllowed(near),true,'ordinary mob eligible');
  const nearHp=near.hp,farHp=far.hp;
  assert(g.castMovementBasic(),cls+' can cover nearby mob while selected boss is distant');
  assert.equal(far.hp,farHp,'distant protected boss does not take direct/area damage');
  assert.equal(far.aggro,false,'distant boss remains unengaged');
  if(cls==='mage'||cls==='ranger')
    assert(g.s.projectiles.some(p=>p.source==='hero' && p.target===near.id && p.automaticBasic));
  else assert(near.hp<nearHp,'nearby ordinary takes legitimate auto basic');
  retained(g,far,held,'distant boss');
  assert.equal(g.hero.order,null,'covering fire does not chase selected boss');
  interactions++;
}
for(const cls of classes)for(const held of [false,true]){
  const {g,make}=arena(cls);
  const protectedNear=make('Idle boss in splash/attack reach',552);boss(protectedNear);
  const selected=make('Selected distant ordinary',500+reach[cls]+25);
  select(g,selected,held);
  assert.equal(g.castMovementBasic(),false,'idle boss never becomes nearby fallback');
  assert.equal(g.hero.basicCd,0,'ineligible boss does not consume basic timer');
  assert.equal(protectedNear.aggro,false);
  retained(g,selected,held,'no lawful fallback');
  interactions++;
}
for(const held of [false,true]){
  const {g,make}=arena('rogue');
  const near=make('Bell primary nearby',575);
  const idleBoss=make('Unengaged boss within splash',559);boss(idleBoss);
  const far=make('Selected far ordinary',745);
  select(g,far,held);
  const bossHp=idleBoss.hp,nearHp=near.hp;
  assert(g.castMovementBasic(),'Rogue can bell near ordinary with idle boss adjacent');
  assert(near.hp<nearHp);
  assert.equal(idleBoss.hp,bossHp,'Rogue splash cannot incidentally initiate boss');
  assert.equal(idleBoss.aggro,false,'Rogue splash does not wake idle boss');
  retained(g,far,held,'Rogue splash');
  interactions++;
}
// The public browser has an explicit Rogue class-admission step, and that
// registration enables the very same moving-auto-basic gate as other heroes.
assert.equal(Campaign.rules.movementBasicClasses.rogue,true,
  'public Rogue admission must enable automatic basic loop');
assert.deepEqual(classes.filter(c=>Campaign.rules.movementBasicClasses[c]),classes);
interactions++;
function cadence(cls,realFrameSec,slowHits,training=5){
  const {g,make}=arena(cls);
  const e=make('Engaged stable ordinary enemy',575);
  e.aggro=true;
  g.hero.talents[1]=training;
  assert(g.castMovementBasic(),'native initial basic fires');
  const firstCd=g.hero.basicCd;
  const dt=Math.min(0.1,realFrameSec);
  let real=0,applied=false;
  for(let frame=1;frame<=2400;frame++){
    g.tick(dt);
    real=frame*realFrameSec;
    if(slowHits&&!applied&&real>=0.1){
      applied=true;
      for(let i=0;i<slowHits;i++) assert(g.applySlow(g.hero,2),'Slow hit '+i);
      assert.equal(g.hero.slowStacks,slowHits);
    }
    if(g.hero.basicCd<=0){
      assert(g.castMovementBasic(),'next auto basic becomes legal again');
      return {cls,fps:+(1/realFrameSec).toFixed(2),training,slowHits,initialCd:+firstCd.toFixed(5),
        gap:+real.toFixed(5)};
    }
  }
  assert.fail('basic still blocked after bounded frame-time probe');
}
for(const cls of classes)
  for(const fps of [60,30,5])
    for(const hits of [0,1,4]){
      const r=cadence(cls,1/fps,hits);
      if(hits===4&&fps===60) assert(r.gap>3,'maximum Slow debt has large real basic suppression');
      if(hits===0&&fps===5)assert(r.gap>=1.3,'100ms tick clamp measurably extends at 5 FPS');
      results.push(r);
    }
const scenario=(fps,hits)=>results.filter(r=>r.fps===fps && r.slowHits===hits);
const sample={at60fps:{none:scenario(60,0),one:scenario(60,1),four:scenario(60,4)},
  at5fps:{none:scenario(5,0)}};
console.log('PASS post-908 hero/elite/Rogue integrated safety interactions='+interactions);
console.log('POST_908_NATIVE_CADENCE '+JSON.stringify(sample));
console.log('PASS post-908 controlled native cadence cases='+results.length);
