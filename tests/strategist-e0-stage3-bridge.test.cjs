'use strict';
/* Exact-head cross-owner proof. Test-only Ogre admission, never a playable build.
 * E0: feat/strategist-e0-dormant-daggers-20261103 @ 63eac57f
 * Stage 3: feat/strategist-stage3-field-labs-20261103
 * Materials: feat/strategist-material-sources-20261103
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Field=require('../src/prototype/strategist-field-labs.js');
const Nav=require('../src/prototype/strategist-lab-navigation.js');
const Material=require('../src/prototype/strategist-materials.js');
const R=C.rules;
const original=Object.keys(C.classes);
assert.equal(C.classes.strategist,undefined,'must remain dormant');
C.classes.strategist={...C.classes.paladin};
C.talentProfiles.strategist={...C.talentProfiles.paladin};
Field.install(C,{
  rules:R,materials:Material,navigation:Nav.adapter(),
  authenticatedLocation(g,u) {
    return u.active!==false ? {zoneId:g.zoneId,point:{x:u.x,y:u.y}} : null;
  },
  safeFromThreat(g,zone,p) {
    return (g.s.zones[zone]?.enemies||[]).every(e=>!e.hp || e.neutral ||
      Math.hypot(e.x-p.x,e.y-p.y)>Math.max(260,g.enemyAcquisitionRange(e)));
  },
  verifySource(g,zone,material,id,p) {
    const source=Material.findSource(g,material,{
      at:p,zone:g.s.zones[zone],rules:R,range:45,
      access:(candidate,point)=>candidate.id===id && Math.hypot(point.x-p.x,point.y-p.y)<15,
    });
    return source?.id===id;
  },
  neriRescued(g){return g.s.rescued?.archive===true;},
});

function setup() {
  const g=new C('normal','strategist',()=>0.9);
  const z=g.zone();
  g.hero.gold=100000;
  const barracks={
    id:'barracks-2',kind:'barracks',name:'Barracks',theme:'vale',icon:'🏗️',
    x:300,y:350,progress:4,queue:0,queueType:null,full:false,
    upgradeProgress:0,upgradePaid:false,
  };
  const labSite=g.safe(750,800,'vale');
  assert.ok(Number.isFinite(labSite.x) && Number.isFinite(labSite.y));
  const lab={
    id:'strategist-lab-3',kind:'strategist-field-lab',name:'Field Lab',
    zoneId:'vale',x:labSite.x,y:labSite.y,progress:4,
    workSeconds:20,windmill:true,processSeconds:0,productionPriority:'acid',
  };
  z.buildings.push(barracks,lab);
  const bank=g.fieldLabNetwork(true);
  assert.equal(bank.foundedByStrategist,true);
  return {g,bank,lab};
}
test('cross-owner: native E0 save accepts one canonical Lab-produced Acid bottle',()=>{
  const {g,bank,lab}=setup();
  const worker=g.s.party[0];
  // The staffed processor is a real machine, not remote alchemy at the
  // starting position. Use the physically established Lab work station.
  worker.x=lab.x;worker.y=lab.y;
  assert.equal(worker.type,'soldier');
  worker.fieldLabTrained=true;
  worker.fieldLabJob=lab.id;
  worker.active=false;
  worker.order={type:'strategist-field-lab',id:lab.id};
  // Worker's physical coordinates remain those of the actual native unit.
  const job={
    workerId:worker.id,labId:lab.id,zoneId:'vale',
    material:'wood',position:{x:worker.x,y:worker.y},
    phase:'idle',path:[],waypoint:0,sampleLeft:0,
    carries:false,retryAt:g.s.time,target:null,sourceId:null,wasActive:true,
  };
  bank.jobs[worker.id]=job;
  bank.samples.water=2;
  bank.samples.wood=2;
  lab.processSeconds=5.999;
  assert.equal(g.fieldLabMakeProduct(job,lab,0.01),true);
  assert.equal(g.s.strategistAcidBottles,1,
    'Stage 3 produces the exact same E0 stock, no parallel wallet');
  assert.equal(bank.samples.water,1);
  assert.equal(bank.samples.wood,1);
  const raw=g.snapshot();
  assert.equal(raw.version,4);
  assert.deepEqual(raw.party.find(u=>u.id===worker.id).order,worker.order,
    'native E0 snapshot retains authenticated Lab worker order');
  assert.equal(C.validate(raw).strategistAcidBottles,1);
  const restored=C.restore(raw,()=>0.9);
  assert.equal(restored.s.strategistAcidBottles,1);
  assert.equal(restored.s.strategistLabEconomy.jobs[worker.id].workerId,worker.id);
  assert.equal(restored.s.party.find(u=>u.id===worker.id).fieldLabJob,lab.id);
  assert.equal(restored.s.party.find(u=>u.id===worker.id).active,false);
  assert.equal(restored.s.version,4);
  const checkAgain=C.validate(restored.snapshot());
  assert.equal(checkAgain.strategistAcidBottles,1,'restore/save cannot duplicate Acid');
});
test('cross-owner: E0 third actually-landed dagger consumes Stage 3 bottle once',()=>{
  const {g,bank,lab}=setup();
  const worker=g.s.party[0];
  worker.x=lab.x;worker.y=lab.y;
  worker.fieldLabTrained=true;worker.fieldLabJob=lab.id;
  worker.active=false;worker.order={type:'strategist-field-lab',id:lab.id};
  const job={
    workerId:worker.id,labId:lab.id,zoneId:'vale',material:'water',
    position:{x:worker.x,y:worker.y},phase:'idle',path:[],waypoint:0,
    sampleLeft:0,carries:false,retryAt:0,target:null,sourceId:null,wasActive:true,
  };
  bank.jobs[worker.id]=job;bank.samples.water=2;bank.samples.mineral=2;
  lab.processSeconds=5.999;
  assert.equal(g.fieldLabMakeProduct(job,lab,0.01),true);
  assert.equal(g.s.strategistAcidBottles,1);
  g.s.valeFieldAwakened=true;g.s.mercyTime=0;
  Object.assign(g.hero,{x:500,y:500,order:null});
  // Combat fixture isolates the *real* E0 resolver, not a fake inventory debit.
  g.zone().props=[];g.zone().buildings=[];
  const foe=g.makeEnemy({
    species:'goblin',name:'Acid transaction target',
    level:1,hp:10000,damage:0,gold:0,xp:0,
  },{x:560,y:500});
  foe.id='integration-target';foe.aggro=true;foe.returning=false;
  g.zone().enemies=[foe];
  let splashes=0;
  const previousEvent=g.event.bind(g);
  g.event=(type,payload)=>{if(type==='strategistAcidSplash')splashes++;return previousEvent(type,payload)};
  for(let i=0;i<3;i++){
    g.hero.basicCd=0;
    assert.equal(g.cast(1,foe.id,false,null,true),true);
  }
  assert.equal(g.s.strategistAcidBottles,0,
    'one actual third landed dagger debits the canonical bottle exactly once');
  assert.equal(splashes,1,'no duplicate splash receipt');
});
test('cross-owner: four-class saves remain untouched and E0 cap rejects illegal Acid',()=>{
  const g=new C('normal','paladin',()=>0.9);
  const ordinary=g.snapshot();
  assert.equal(ordinary.strategistLabEconomy,undefined);
  assert.equal(ordinary.strategistAcidBottles,undefined);
  const forgery=JSON.parse(JSON.stringify(ordinary));
  forgery.strategistAcidBottles=1;
  assert.throws(()=>C.validate(forgery),/Acid Bottle/);
  const strat=setup().g;
  assert.equal(R.strategistBasicFoundation.maxBottles,1000);
  strat.s.strategistAcidBottles=1001;
  assert.throws(()=>C.validate(strat.snapshot()),/Acid Bottle/);
});
test('native-zone Lab navigation cannot mutate Campaign.s.zone',()=>{
  const g=setup().g,from={x:g.hero.x,y:g.hero.y};
  assert.equal(g.zoneId,'vale');
  const target=g.safe(from.x+85,from.y+85,'vale');
  const token=Nav.budget(150,500);
  const path=Nav.route(g,'vale',from,target,token);
  if(path.length){
    let at=from;
    for(const p of path) {assert.equal(Nav.passable(g,'vale',at,p),true);at=p;}
    assert.ok(token.tested<=500);
  }
  assert.equal(g.s.zone,'vale');
});
test.after(()=>{
  delete C.classes.strategist;
  delete C.talentProfiles.strategist;
  assert.deepEqual(Object.keys(C.classes),original,'no fifth-class registration outside test');
});
