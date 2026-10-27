'use strict';
// Regression for PR #516: prevent ranged damage from converting a legitimate
// outmatched-enemy regroup into an unconditional sprint at the attacker.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const PHASE='anchored';
function fixture(mode='normal') {
  const g=new Campaign(mode,'ranger',()=>0.91);
  g.enter('vale');
  g.s.time=30;
  g.s.mercyTime=0;
  g.s.party=[];
  g.s.thornHeroInitiated=true;
  g.s.valeFieldAwakened=true;
  Object.assign(g.hero,{
    x:2250,y:1800,level:4,hp:100000,maxHp:100000,order:null,slow:0
  });
  const e=g.makeEnemy({
    species:'goblin',name:'outmatched level-one goblin',type:'mob',level:1,
    hp:4000,damage:1,gold:0,xp:0
  },{x:1800,y:1800});
  e.ranged=false;e.hybrid=false;e.cd=100;e.specialCd=100;
  g.zone().enemies=[e];
  assert(g.line(g.hero,e) && g.clearSegment(g.hero,e,15),'real Greenwood firing lane');
  assert(g.engage(e,true,false)!==false,'native engagement');
  return {g,e};
}
function anchor(g,e,extra={}) {
  if(!g._tacticalRegroups)g._tacticalRegroups=new Map();
  g._tacticalRegroups.set(e.id,{
    phase:PHASE,anchor:{x:e.x,y:e.y},holdRemaining:12,
    moveUsed:true,recruited:true,...extra
  });
}
function tick(g,dt=.1){g.s.time+=dt;g.updateEnemies(dt);}
// Previous damage is not evidence of damage AFTER arriving at a newly reached
// ally post; a four-second alert must not erase a successful retreat.
for(const mode of ['normal','nightmare']){
  const {g,e}=fixture(mode);
  assert(g.damage(e,20,'hero'),'actual HP hit before reaching anchor');
  assert(g.enemyUnderFireAlert(e),'prior hit remains in four-second buffer');
  anchor(g,e);
  const first={x:e.x,y:e.y};
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,PHASE,
    mode+': pre-arrival hit cannot cancel the post-arrival tactical hold');
  assert.equal(d(e,first),0,'the fresh ally position remains occupied');
}
// Once a new real HP hit occurs DURING a distant anchor, run the ORIGINAL
// tactical assessment first, not native sprinting on the very same tick.
for(const mode of ['normal','nightmare']){
  const {g,e}=fixture(mode);
  anchor(g,e);
  const first={x:e.x,y:e.y};
  assert(g.damage(e,25,'hero'),mode+': real HP hit while anchored');
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'thinking',
    mode+': legal distant damage opens tactical reassessment, not forced chase');
  assert.equal(d(first,e),0,'no instant move toward superior Ranger');
  assert.equal(g.tacticalRogueRegroup(e).anchor.x,first.x,'defended post context retained');
  assert(g._tacticalRogueNext?.get(e.id) >= g.s.time + 1.99,
    'reassessment spends the original two-second Rogue decision readiness');
  for(let i=0;i<4;i++)tick(g);
  assert(['defend','escape','travel','extended','anchored'].includes(
    g.tacticalRogueRegroup(e)?.phase),
    'original Rogue decision chooses another tactic after reassessment');
}
// Wounded outmatched monsters must retain their EXISTING escape option.
// Their response must not always become a fast aggressive charge.
{
  const {g,e}=fixture();
  e.hp=e.maxHp*.4;
  anchor(g,e);
  assert(g.damage(e,5,'hero'),'damage while badly wounded');
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'thinking');
  for(let i=0;i<4;i++)tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'escape',
    'wounded isolated mob retains its original tactical withdrawal choice');
}
// The existing two-second decision floor is not bypassed by a new hit.
{
  const {g,e}=fixture();
  anchor(g,e);
  if(!g._tacticalRogueNext)g._tacticalRogueNext=new Map();
  g._tacticalRogueNext.set(e.id,g.s.time+1);
  assert(g.damage(e,20,'hero'));
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'anchored',
    'recent hit must respect existing Rogue decision cooldown');
  for(let i=0;i<10;i++)tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'thinking',
    'unanswered hit requests reassessment when existing cooldown permits');
}
// A blocked/no-HP hit can never authorize a new assessment.
{
  const {g,e}=fixture();
  anchor(g,e);
  assert.equal(g.damage(e,0,'hero'),false);
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'anchored');
}
// Tactical travel to an ally survives damage: preserve ally, retreat corridor
// and 50%-damage protection instead of interrupting to pursue the attacker.
{
  const {g,e}=fixture();
  const ally=g.makeEnemy({species:'goblin',name:'support',level:1,
    hp:100,damage:1,gold:0,xp:0},{x:1900,y:1800});
  g.zone().enemies.push(ally);
  g._tacticalRegroups=new Map([[e.id,{
    phase:'travel',allyId:ally.id,destination:{x:1900,y:1800},
    retreatOrigin:{x:1800,y:1800},travelRemaining:12,stalled:0,
    anchor:null,holdRemaining:12
  }]]);
  const hp=e.hp;
  assert(g.damage(e,100,'hero'));
  assert(hp-e.hp>0 && hp-e.hp<100,'in-travel damage reduction remains active');
  tick(g);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'travel',
    'damage never forcibly discards a supported regroup journey');
  assert.deepEqual(e.home,{x:1800,y:1800},'original home is intact');
}
console.log('PASS Rogue anchor integrity: prior vs new hit, outmatched think/flee, cooldown, no-hit, allied retreat');
