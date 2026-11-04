'use strict';
// Native Campaign and authentic enemy records, without live fifth-class admission.
const test=require('node:test'),assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Native=require('../src/prototype/strategist-lab-navigation.js');
const Materials=require('../src/prototype/strategist-materials.js');
const Sources=require('../src/prototype/strategist-lab-sources.js');
const Workforce=require('../src/prototype/strategist-lab-workforce.js');
const Threats=require('../src/prototype/strategist-lab-threats.js');
const Remote=require('../src/prototype/strategist-lab-combat.js');
const Labs=require('../src/prototype/strategist-field-labs.js');
const R=Campaign.rules,nav=Native.adapter();
const workers=Workforce.install(Campaign);
const threats=Threats.create({sight:(g,z,a,e)=>Native.passable(g,z,a,e)});
const remote=Remote.create({navigation:nav,rules:R});
const installed=Labs.install(Campaign,{
  materials:Materials,navigation:nav,rules:R,
  authenticatedLocation:workers.authenticatedLocation,
  safeFromThreat:threats.safeFromThreat,
  inspectThreat:(g,z,pos,u)=>threats.inspect(g,z,{...pos,workerId:u.id}),
  verifySource:Sources.create(Materials,R).verifySource,
  advanceEnemyDanger:remote.advanceEnemyDanger,
});
assert.equal(installed.readyForRemoteCombat,true);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function setup(){
  const g=new Campaign('normal','paladin',()=>0.57);
  const home=g.zoneId,zone=g.zone();
  const enemy=zone.enemies.find(e=>e.type==='mob'&&e.hp>0&&!e.neutral&&
    !g.enemyRanged(e)&&!e.captain&&!e.roomCaptain&&e.home);
  assert.ok(enemy,'authored Vale zone supplies real native ordinary melee enemy');
  const candidate=[];
  for(const d of [45,65,85,100])
    for(const sign of [1,-1]){
      candidate.push({x:enemy.x+sign*d,y:enemy.y});
      candidate.push({x:enemy.x,y:enemy.y+sign*d});
    }
  const site=candidate.find(p=>!g.blocked(p.x,p.y,home,15)&&
    distance(p,enemy)<=g.enemyMeleeBasicRange(enemy)&&
    Native.passable(g,home,enemy,p));
  assert.ok(site,'authored enemy has one real collision-clear melee approach');
  const u=g.s.party[0];assert.ok(u&&u.hp>0);
  // Fixture places an already-owned native companion beside an already-authored
  // enemy; no extra enemy, species, reward, class or inventory is invented.
  u.x=site.x;u.y=site.y;
  const maxHp=u.hp;
  g.hero.class='strategist';g.hero.gold=5000;
  g.s.strategistAcidBottles=0;
  const lab={id:'strategist-lab-'+g.s.nextId++,kind:'strategist-field-lab',
    name:'Field Lab',zoneId:home,x:site.x,y:site.y,progress:4,
    windmill:false,workSeconds:20,processSeconds:0};
  zone.buildings.push({id:'barracks-'+g.s.nextId++,kind:'barracks',
    x:site.x+190,y:site.y,progress:4},lab);
  const bank=g.fieldLabNetwork(true);
  u.active=false;u.fieldLabTrained=true;u.fieldLabJob=lab.id;
  u.order={type:'strategist-field-lab',id:lab.id};
  bank.jobs[u.id]={zoneId:home,labId:lab.id,workerId:u.id,material:'wood',
    position:{x:u.x,y:u.y},phase:'idle',path:[],waypoint:0,
    sampleLeft:0,carries:false,retryAt:20,target:null,sourceId:null,
    wasActive:true};
  g.s.zone='march';g.zone(); // Real remote zone, never borrowed in combat.
  assert.equal(g.s.zone,'march');
  return {g,u,enemy,lab,bank,home,maxHp,job:bank.jobs[u.id]};
}
function tick(g,n=1){for(let i=0;i<n;i++){g.s.time+=0.1;g.advanceFieldLabEconomy(0.1);}}
test('native combatTargets includes valid current-region Lab workers but no remote, invalid or old-class actors',()=>{
  const {g,u,home,job}=setup();
  assert.equal(g.combatTargets().includes(u),false,'remote worker not current combat target');
  g.s.zone=home;
  assert.equal(g.combatTargets().includes(u),true,'existing native AI sees working companion');
  assert.equal(g.activeParty().includes(u),false,'not double-counted as active party');
  u.hp=0;assert.equal(g.combatTargets().includes(u),false,'fallen actor not a target');
  u.hp=100;u.order=null;
  assert.equal(g.combatTargets().includes(u),false,'forged idle worker not promoted');
  u.order={type:'strategist-field-lab',id:job.labId};
  g.hero.class='paladin';
  assert.equal(g.combatTargets().includes(u),false,'original classes unchanged');
});
test('real off-zone melee enemy damages the owned worker through native hitParty and native cooldown',()=>{
  const {g,u,enemy,bank,home}=setup();
  const initial=u.hp,enemyHp=enemy.hp,other=JSON.stringify(g.s.zones.march.enemies);
  tick(g);
  assert.ok(u.hp<initial,'real native authored hostile damaged the worker');
  assert.ok(enemy.cd>0,'the real enemyStartBasic owns its cooldown');
  const after=u.hp;
  tick(g);
  assert.equal(u.hp,after,'ordinary cooldown blocks immediate second hit');
  assert.equal(enemy.hp,enemyHp,'worker cannot invent enemy kills or XP');
  assert.equal(g.zoneId,'march','remote hit did not switch hero region');
  assert.equal(JSON.stringify(g.s.zones.march.enemies),other,
    'remote hit never mutates hero-region opponents');
  assert.equal(bank.samples.wood,0,'enemy contact never produces free samples');
  assert.equal(g.s.zones[home].enemies.includes(enemy),true);
  // A claimed source in the wrong region must be rejected before HP changes.
  const before=u.hp;
  assert.equal(g.hitParty(u,10,0,enemy.id,false,null,{
    zoneId:'march',enemy}),false);
  assert.equal(u.hp,before);
});
test('a real lethal enemy basic releases the Lab assignment, loses cargo and retains native recovery ownership',()=>{
  const {g,u,enemy,bank,job}=setup();
  u.hp=1;enemy.damage=Math.max(14,enemy.damage);
  tick(g);
  assert.equal(u.hp,0,'native hitParty applies lethal damage and death flags');
  assert.equal(bank.jobs[u.id],undefined,'no invalid saved job for a dead worker');
  assert.equal(u.active,false);
  assert.equal(u.fieldLabJob,undefined);
  assert.equal(u.order,null);
  assert.equal(u.strategistLabRest,undefined,'dead worker cannot forge reserve provenance');
  assert.equal(bank.samples.wood,0,'carried samples lost, no deposit');
  assert.equal(g.s.party.includes(u),true,'fallen companion remains native roster-owned');
  assert.equal(job.carries,false);
});
test('blocked native collision prevents remote melee damage and fake pursuit',()=>{
  const {g,u,enemy,home}=setup();
  const native=g.blocked.bind(g);
  const center={x:(u.x+enemy.x)/2,y:(u.y+enemy.y)/2};
  g.blocked=(x,y,zone,radius,...extra)=>
    (zone===home && distance({x,y},center)<10+radius)||
    native(x,y,zone,radius,...extra);
  const hp=u.hp,point={x:enemy.x,y:enemy.y};
  tick(g,20);
  assert.equal(u.hp,hp,'enemy cannot attack through native collision wall');
  assert.deepEqual({x:enemy.x,y:enemy.y},point,'no off-screen teleport through wall');
});
test('unsupported ranged/boss remote attacks remain suspended rather than instant phantom damage',()=>{
  const {g,u,enemy,home}=setup();
  const hp=u.hp;
  enemy.ranged=true;
  remote.invalidate(g);
  tick(g,20);
  assert.equal(u.hp,hp,'no fake hitscan/projectile from unsupported ranged mode');
  assert.equal(enemy.rangedAim,undefined,'unowned ranged aim is not manufactured');
  enemy.ranged=false;enemy.type='boss';
  remote.invalidate(g);
  tick(g,20);
  assert.equal(u.hp,hp,'unsupported boss specials do not invent effects');
  assert.equal(g.s.zone,'march');
});
