'use strict';
// Genuine shared Rogue resolve owner. No generic critical fallback or permanent
// gameplay registration. Captains/bosses are excluded until their own review.
const assert=require('node:assert/strict');
const C=require('../src/prototype/engine.js');
const Crit=require('../src/prototype/critical-executions.js');
const Levels=require('../src/prototype/critical-levels.js');
const World=require('../src/prototype/critical-world-native.js');
const {completeFieldOpening}=require('./helpers/field-opening.cjs');
function scene(species='goblin', options={}){
 const g=new C('normal','paladin',()=>.99);completeFieldOpening(g);
 const z=g.zone();for(const k of ['props','buildings','npcs','enemies'])z[k]=[];
 g.s.mercyTime=0;g.s.time=30;g.s.party=[];
 const e=g.makeEnemy({species,name:'Native Rogue '+species,level:2,hp:10000,damage:140,xp:0,gold:0},{x:1400,y:1700});
 Object.assign(e,{aggro:true,cd:100,specialCd:100,...options});
 z.enemies=[e];g.zone=()=>z;
 Object.assign(g.hero,{x:1470,y:1700,hp:10000,maxHp:10000,level:5,immune:0});
 return {g,e};
}
function attach(g,level=1,roll=0){
 let calls=0;const session=World.createSession(Crit,Levels,{enabled:true,stream:{next(){calls++;return roll;}}});
 session.setCriticalLevel('world',level);g._criticalWorldNative=session;return {count:()=>calls,session};
}
const close=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,msg+': '+a+' vs '+b);
const cases=[
 {species:'goblin', props:{}, key:'world/rogue/basic'},
 {species:'goblin', props:{guard:true}, key:'world/rogue/basic'},
 {species:'archer', props:{ranged:true}, key:'world/rogue/basic'},
 {species:'skeleton',props:{form:'ringleader',hp:4000},key:'world/rogue/signature'},
];
for(const variant of cases){
 for(const level of [1,2,3]){
  const a=scene(variant.species,variant.props),b=scene(variant.species,variant.props);
  const tally=attach(b.g,level);
  assert(a.g.tacticalRogueMove(a.e,a.g.hero),'baseline move warned');
  assert(b.g.tacticalRogueMove(b.e,b.g.hero),'critical move warned');
  assert.equal(tally.count(),0,'warning must not roll');
  assert.equal(!!b.e.telegraph.rogueSignature,variant.key.endsWith('signature'),'real authored role');
  const original=b.e.telegraph, name=original.name, style=original.style,
        recovery=original.recovery, radius=original.radius;
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(tally.count(),1,'one released maneuver, tier '+level);
  assert.equal(original.name,name);
  assert.equal(original.style,style);
  assert.equal(original.recovery,recovery);
  assert.equal(original.radius,radius);
  const dealtA=10000-a.g.hero.hp,dealtB=10000-b.g.hero.hp;
  assert(dealtA>0,'native Rogue contact at baseline '+variant.species);
  assert(dealtB>dealtA,'Rogue tier '+level+' improves only native contact');
  assert.equal(a.g.s.projectiles.length,b.g.s.projectiles.length,'no new projectile');
  assert.equal(a.e.cd,b.e.cd,'no Rogue cooldown change');
 }
 {
  const a=scene(variant.species,variant.props),b=scene(variant.species,variant.props),t=attach(b.g,3,.99);
  assert(a.g.tacticalRogueMove(a.e,a.g.hero));
  assert(b.g.tacticalRogueMove(b.e,b.g.hero));
  a.g.resolveAttack(a.e);b.g.resolveAttack(b.e);
  assert.equal(t.count(),1);
  close(a.g.hero.hp,b.g.hero.hp,'failed crit roll leaves Rogue unchanged');
 }
}
{
 const {g,e}=scene('goblin',{guard:true}),t=attach(g);
 assert(g.tacticalRogueMove(e,g.hero));
 g.hero.x=e.x+1000;
 const hp=g.hero.hp;
 g.resolveAttack(e);
 assert.equal(t.count(),0,'invalid mobile reach cancels without a critical roll');
 assert.equal(g.hero.hp,hp);
}
{
 const {g,e}=scene('goblin'),t=attach(g,2);
 const first=g.unit('soldier',g.hero.x+4,g.hero.y+12),second=g.unit('soldier',g.hero.x-6,g.hero.y-8);
 first.hp=first.maxHp=10000;second.hp=second.maxHp=10000;
 g.s.party=[first,second];
 assert(g.tacticalRogueMove(e,g.hero));
 assert(!e.telegraph.rogueSignature);
 g.resolveAttack(e);
 assert.equal(t.count(),1,'area-marked Rogue basic samples once for all legal targets');
 assert(first.hp<10000&&second.hp<10000,'original party footprint intact');
}
{
 const {g,e}=scene(),t=attach(g);
 assert(g.tacticalRogueMove(e,g.hero));
 e.telegraph=null;
 g.resolveAttack(e);
 assert.equal(t.count(),0,'cancelled warning no roll');
}
{
 const {g,e}=scene(),t=attach(g);
 e.captain=true;e.captainProfile='supply-vale';
 assert(g.tacticalRogueMove(e,g.hero));
 g.resolveAttack(e);
 assert.equal(t.count(),0,'captain special excluded pending its source audit');
}
assert.equal(C.prototype._criticalWorldNative,undefined);
console.log('PASS native non-boss Rogue actions: ordinary/guardian/ranged/ringleader, three tiers, warning, invalid cast, party footprint, cancel and captain exclusion');
