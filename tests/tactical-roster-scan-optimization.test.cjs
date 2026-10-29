'use strict';
// Compare optimized live tactical scans to the exact original filter/duplicate
// logic. No runtime stubs for collision, attack, encounter or save semantics.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
function setup(n){
  const g=new Campaign('developer','paladin',()=>.73), z=g.zone();
  for(const key of ['props','nodes','npcs','buildings','enemies'])z[key]=[];
  g.s.mercyTime=0;g.s.valeFieldAwakened=true;
  Object.assign(g.hero,{x:1230,y:1400,hp:100000,maxHp:100000});
  g.s.party=[];
  for(let i=0;i<5;i++){
    const type=i%3===0?'soldier':i%3===1?'archer':'pet';
    const u=g.unit(type,1190+(i%3)*20,1345+Math.floor(i/3)*35,
      type==='pet'?'thorn':undefined);
    u.hp=10000;u.maxHp=10000;g.s.party.push(u);
  }
  for(let i=0;i<n;i++){
    const e=g.makeEnemy({species:'goblin',name:'audit '+i,level:1,hp:100000,
      damage:1,gold:0,xp:0},{x:1390+(i%8)*25,y:1340+Math.floor(i/8)*38});
    e.aggro=true;e.cd=.5;z.enemies.push(e);
  }
  return g;
}
function present(g,e){
  const radius=Campaign.rules.tacticalFoundation.presenceRadius,
    dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const party=g.activeLivingParty().filter(
    u=>!u.order&&!g.s.recallActive&&dist(u,e)<=radius);
  return party.length+(g.hero.hp>0&&dist(g.hero,e)<=radius?1:0);
}
function support(g,e){
  const radius=Campaign.rules.tacticalFoundation.supportRadius+35,
    dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  return g.zone().enemies.filter(ally=>
    ally.hp>0&&!ally.neutral&&!ally.returning&&
    !['travel','escape','extended'].includes(g.tacticalRogueRegroup(ally)?.phase)&&
    dist(ally,e)<=radius).length;
}
function overrideLegacy(g){
  g.tacticalPresentOpponents=function(e){return present(this,e)};
  g.tacticalLocalSupport=function(e){return support(this,e)};
  g.tacticalRogueOutnumbered=function(e){
    return this.tacticalPresentOpponents(e)>=2 &&
      this.tacticalPresentOpponents(e)>this.tacticalLocalSupport(e);
  };
}
function counters(g){
  let present=0,support=0;
  const oldPresent=g.tacticalPresentOpponents,oldSupport=g.tacticalLocalSupport;
  g.tacticalPresentOpponents=function(...args){present++;return oldPresent.apply(this,args)};
  g.tacticalLocalSupport=function(...args){support++;return oldSupport.apply(this,args)};
  return {get present(){return present},get support(){return support},
    restore(){delete g.tacticalPresentOpponents;delete g.tacticalLocalSupport}};
}
// Test immediate changes in health, companion orders, Recall and regroup phase;
// a long-lived stale cache would fail these parity assertions.
for(const n of [8,24,48]){
  const g=setup(n);
  const check=()=>{
    for(const e of g.zone().enemies){
      assert.equal(g.tacticalPresentOpponents(e),present(g,e),'opponent eligibility');
      assert.equal(g.tacticalLocalSupport(e),support(g,e),'support eligibility');
      assert.equal(g.tacticalRogueOutnumbered(e),
        present(g,e)>=2 && present(g,e)>support(g,e),'outnumbered decision');
    }
  };
  check();
  g.s.party[0].order={type:'move',x:0,y:0};check();
  g.s.party[1].hp=0;check();
  g.s.recallActive=true;check();
  g.s.recallActive=false;
  g.zone().enemies[1].returning=1;check();
  g.zone().enemies[2].neutral=true;check();
  g.zone().enemies[3].hp=0;check();
  g._tacticalRegroups=new Map([[g.zone().enemies[4].id,{phase:'travel'}]]);
  check();
}
for(const n of [8,24,48]){
  const candidate=setup(n), baseline=setup(n);
  overrideLegacy(baseline);
  const a=counters(candidate),b=counters(baseline);
  for(let i=0;i<24;i++){
    candidate.tick(.05,{x:0,y:0});
    baseline.tick(.05,{x:0,y:0});
  }
  const counts={n,ticks:24,baselinePresence:b.present,candidatePresence:a.present,
    baselineSupport:b.support,candidateSupport:a.support};
  a.restore();b.restore();
  assert.deepEqual(candidate.snapshot(),baseline.snapshot(),
    'optimized scans cannot change real combat/saved state at crowd size '+n);
  assert(counts.candidatePresence<counts.baselinePresence,
    'per-enemy opponent presence must be computed once for crowd size '+n);
  assert.equal(counts.candidateSupport,counts.baselineSupport,
    'support decisions still run at their native cadence');
  console.log('TACTICAL_ROSTER_OPTIMIZATION '+JSON.stringify(counts));
}
console.log('PASS tactical roster exact predicate and 8/24/48 actor tick/save parity');
