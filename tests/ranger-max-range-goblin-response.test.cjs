'use strict';
// Characterization first: native Ranger basic arrow flight and a native enemy
// response at the precise edge of the authored 450-unit basic range.
// Separate sight/terrain and safe-town effects; no AI methods are stubbed.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const { assertNativeClearLane, nativeBasicProjectileHit } = require('./helpers/native-fixture-contracts.cjs');
function findNative450Lane(g) {
  // Locate an actual clear shot in the current authored Vale rather than
  // assuming that coordinates from the pre-reconstruction map remain open.
  for (let y = 350; y < g.zoneSize() - 350; y += 100)
    for (let x = 250; x < g.zoneSize() - 700; x += 100) {
      const target = { x, y }, hero = { x: x + 450, y };
      if (!g.blocked(target.x, target.y, 'vale', 15) &&
          !g.blocked(hero.x, hero.y, 'vale', 15) &&
          g.line(target, hero) && g.clearSegment(target, hero, 15))
        return { target, hero };
    }
  throw Error('Reconstructed Greenwood must retain a legal 450-unit firing lane');
}
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
function prep(g,e,p) {
  const z=g.zone();
  z.enemies=[e];
  g.s.party=[];
  g.s.time=30;
  g.s.mercyTime=0;
  // Earn the opening admission through the real first-kill boundary rather
  // than fabricating a level/aggro flag (historical dev.175 failure source).
  completeFieldOpening(g);
  assert.equal(g.s.valeFieldAwakened, true,
    'fixture must complete native first-kill admission');
  g.s.thornHeroInitiated=true;
  Object.assign(g.hero,{...p, hp:100000,maxHp:100000,level:4,
    basicCd:0,order:null,immune:0});
  g.hero.skills[0]=1;
  g.s.projectiles=[];
  e.cd=100;
  e.specialCd=100;
}
function probe(g,e,range,context) {
  const start={x:e.x,y:e.y,hp:e.hp,homeDistance:dist(g.hero,e.home)};
  const { cast, hit } = nativeBasicProjectileHit(g, e, { expectedHeroLevel: 4 });
  const aggroAfterHit=!!e.aggro;
  const alert=!!g.enemyUnderFireAlert(e);
  const insideLeash=g.tacticalRogueLeashAllows(e,g.hero,500);
  const nearTown=dist(g.hero,{x:300,y:350});
  const xy={x:e.x,y:e.y};
  let firstMoveAt=null;
  let maxFrameStep=0, firstBurstAt=null, rogueSeen=false, maxFramesWithoutMotion=0, noMotionFrames=0;
  let reset=false;
  for(let i=0;i<25;i++){
    g.s.time+=0.1;
    const frameStart={x:e.x,y:e.y};
    g.updateEnemies(0.1);
    const frameStep=dist(frameStart,e);
    maxFrameStep=Math.max(maxFrameStep,frameStep);
    if(firstBurstAt===null && e.pursuitBurst>0)firstBurstAt=(i+1)*0.1;
    if(g.tacticalRogueRegroup(e)||e.telegraph?.rogueMove)rogueSeen=true;
    noMotionFrames=frameStep<0.1 ? noMotionFrames+1 : 0;
    maxFramesWithoutMotion=Math.max(maxFramesWithoutMotion,noMotionFrames);
    if(firstMoveAt===null && dist(xy,e)>0.1)firstMoveAt=(i+1)*0.1;
    if(e.returning)reset=true;
  }
  const result={context,range,cast,hit,aggroAfterHit,alert,
    homeDistance:Math.round(start.homeDistance),nearTown:Math.round(nearTown),
    insideLeash,firstMoveAt,firstBurstAt,
    maxFrameStep:+maxFrameStep.toFixed(2),step:Math.round(dist(xy,e)),
    rogueSeen,maxFramesWithoutMotion,reset,
    after:{aggro:!!e.aggro,returning:!!e.returning,noProgress:+(e.noProgress||0).toFixed(2),
      rogue:g.tacticalRogueRegroup(e)?.phase||null,health:Math.round(e.hp)}};
  console.log('RANGER_EDGE_PROBE '+JSON.stringify(result));
  return result;
}
assert.equal(new Campaign('normal','ranger').heroSkillRange(1),450);
let coverage=0,normalReactions=0;
for(const range of [350,400,440,449,450]){
  const g=new Campaign('normal','ranger',()=>0.91);
  g.enter('vale');
  const z=g.zone();
  // Keep the true Vale ground/obstacles but use a single correctly configured
  // ordinary Goblin in a known woodland clearing to isolate edge conditions.
  const candidates=[{x:1400,y:1700},{x:1800,y:1800},{x:2200,y:1700}];
  let picked=null;
  for(const p of candidates)for(const dir of [[1,0],[-1,0],[0,1],[0,-1]]){
    const shooter={x:p.x+dir[0]*range,y:p.y+dir[1]*range};
    if(g.blocked(p.x,p.y,'vale',15)||g.blocked(shooter.x,shooter.y,'vale',15)||
       !g.line(shooter,p)||!g.clearSegment(p,shooter,15))continue;
    picked={p,shooter};break;
  }
  assert(picked,'authored Vale must contain a clear 15-unit lane at '+range);
  assertNativeClearLane(g, picked.shooter, picked.p);
  const e=g.makeEnemy({species:'goblin',name:'range edge goblin',level:3,
    hp:1000,damage:1,gold:0,xp:0},{...picked.p});
  g.configureEnemy(e,0);
  prep(g,e,picked.shooter);
  const r=probe(g,e,range,'clear-ground');
  assert(r.cast&&r.hit,'real Ranger automatic basic must hit at '+range);
  coverage++;
  if(r.firstMoveAt!==null||r.after.rogue||r.reset)normalReactions++;
}
// Sample original world goblins, without rewriting their homes or the map.
// Some real sites may be inaccessible to the 450-unit shooter; never claim
// those are real legal arrows.
{
 const g=new Campaign('normal','ranger',()=>0.91);
 g.enter('vale');
 const goblins=g.zone().enemies.filter(e=>e.species==='goblin'&&e.hp>0&&!e.neutral);
 console.log('RANGER_EDGE_SPAWNS '+JSON.stringify(goblins.slice(0,25).map(e=>({
    name:e.name,home:e.home,position:{x:e.x,y:e.y},ranged:!!e.ranged,hybrid:!!e.hybrid
 }))));
 let tested=0;
 for(const e of goblins){
   if(tested>=5)break;
   let found=null;
   for(const dir of [[1,0],[-1,0],[0,1],[0,-1],[0.707,0.707],[-0.707,-0.707]]){
     const p={x:e.x+dir[0]*450,y:e.y+dir[1]*450};
     if(g.blocked(p.x,p.y,'vale',15)||!g.line(p,e)||!g.clearSegment(e,p,15))continue;
     found=p;break;
   }
   if(!found)continue;
   // One campaign per sample: restore the original ecosystem before each
   // probe, retain the chosen native enemy object and terrain.
   const fresh=new Campaign('normal','ranger',()=>0.91);
   fresh.enter('vale');
   const native=fresh.zone().enemies.find(u=>u.id===e.id);
   if(!native)continue;
   prep(fresh,native,found);
   const r=probe(fresh,native,450,'real-spawn');
   tested++;
   if(r.hit&&r.insideLeash&&!r.reset)
     assert(r.firstMoveAt!==null||r.after.rogue,
       'real native goblin must respond at edge when lane and leash are legal');
 }
 console.log('RANGER_EDGE_NATIVE '+JSON.stringify({goblins:goblins.length,tested}));
}
// Regression for merged PRs #516 and #521: the native level-four Ranger arrow
// can hit at 450 units, but a fresh hit WHILE the level-one Goblin is at its
// ally anchor must request tactical reassessment, not a compulsory chase.
// A pre-arrival hit does not count; no extra dash or aggression is invented.
for (const mode of ['normal', 'nightmare']) {
  const g=new Campaign(mode,'ranger',()=>0.91);
  g.enter('vale');
  const { target, hero } = findNative450Lane(g);
  assert(!g.blocked(target.x,target.y,'vale',15) &&
    !g.blocked(hero.x,hero.y,'vale',15) && g.line(target,hero) &&
    g.clearSegment(target,hero,15), 'clear native Greenwood long-range lane');
  const e=g.makeEnemy({
    species:'goblin',name:'level-one pressured goblin',level:1,
    hp:4000,damage:2,gold:0,xp:0,
  },target);
  e.ranged=false;
  e.hybrid=false;
  prep(g,e,hero);
  assertNativeClearLane(g, hero, target);
  // Establish native tactical state BEFORE the hit. Earlier damage can no
  // longer invalidate an anchor reached afterward (merged #521).
  g._tacticalRegroups=new Map([[e.id,{
    phase:'anchored',anchor:{x:e.x,y:e.y},holdRemaining:12,
    moveUsed:true,recruited:false,
  }]]);
  const arrow = nativeBasicProjectileHit(g, e, { expectedHeroLevel: 4 });
  assert(arrow.cast, 'level-four Ranger fires native automatic basic');
  assert(arrow.hit && !!g.enemyUnderFireAlert(e),
    'native arrow actually reduces post-engagement HP while anchored');
  assert.equal(g.tacticalRogueRegroup(e)?.hitWhileAnchored,true,
    mode+': actual anchored HP hit is distinguished from prior damage');
  const before={x:e.x,y:e.y};
  g.s.time+=0.1;
  g.updateEnemies(0.1);
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'thinking',
    mode+': new long-range anchored hit requests native tactical reassessment');
  const step=dist(before,e);
  assert.equal(step,0,mode+': genuine hit must not force an instant aggressive chase');
  assert((g._tacticalRogueNext?.get(e.id)||0)>=g.s.time+1.99,
    mode+': original two-second Rogue decision cooldown is preserved');
  assert(g.tacticalRogueLeashAllows(e,g.hero,500),
    'the response retains its existing 500-unit home leash');
  console.log('RANGER_EDGE_ANCHORED '+JSON.stringify({mode,step,level:g.hero.level,enemy:e.level}));
}
// Do not cancel an ordinary tactical hold just because a distant Ranger is
// visible: the source must have genuinely damaged this particular enemy.
{
  const g=new Campaign('normal','ranger',()=>0.91);
  g.enter('vale');
  const { target, hero } = findNative450Lane(g);
  const e=g.makeEnemy({species:'goblin',name:'unhit control',level:1,
    hp:4000,damage:2,gold:0,xp:0},target);
  e.ranged=false;
  prep(g,e,hero);
  g.engage(e,true,false);
  g._tacticalRegroups=new Map([[e.id,{
    phase:'anchored',anchor:{x:e.x,y:e.y},holdRemaining:12,
    moveUsed:true,recruited:false,
  }]]);
  const before={x:e.x,y:e.y};
  g.s.time+=0.1;
  g.updateEnemies(0.1);
  assert.equal(dist(e,before),0,'no arbitrary movement from an unprovoked hold');
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'anchored',
    'an unhit ordinary goblin retains deliberate tactical anchoring');
}
// Preserve stronger tactical role contracts: an authored leader, summoned
// creature, or captain is not reclassified into a normal chasing goblin.
for(const [name, flags] of [
  ['ringleader',{form:'ringleader'}],
  ['summon',{summon:true}],
  ['captain',{captain:true}],
]){
  const g=new Campaign('normal','ranger',()=>0.91);
  g.enter('vale');
  const { target, hero } = findNative450Lane(g);
  const e=g.makeEnemy({species:'goblin',name:name+' control',level:1,
    hp:4000,damage:2,gold:0,xp:0},target);
  prep(g,e,hero);
  Object.assign(e,flags);
  assert(g.damage(e,25,'hero'),name+': a genuine hit applies');
  assert(g.enemyUnderFireAlert(e),name+': alert really exists');
  g._tacticalRegroups=new Map([[e.id,{
    phase:'anchored',anchor:{x:e.x,y:e.y},holdRemaining:12,
    moveUsed:true,recruited:false,
  }]]);
  const before={x:e.x,y:e.y};
  g.s.time+=0.1;
  g.updateEnemies(0.1);
  assert.equal(dist(e,before),0,name+': leader/summon tactical hold is not overridden');
  assert.equal(g.tacticalRogueRegroup(e)?.phase,'anchored',
    name+': existing tactical lifecycle remains authoritative');
}
assert(coverage===5&&normalReactions>0,'characterization must probe legal basic shot and native reactions');
console.log('PASS ranger edge characterization');
