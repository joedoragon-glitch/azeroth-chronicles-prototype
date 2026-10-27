'use strict';
// Characterization first: native Ranger basic arrow flight and a native enemy
// response at the precise edge of the authored 450-unit basic range.
// Separate sight/terrain and safe-town effects; no AI methods are stubbed.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
function prep(g,e,p) {
  const z=g.zone();
  z.enemies=[e];
  g.s.party=[];
  g.s.time=30;
  g.s.mercyTime=0;
  g.s.valeFieldAwakened=true;
  g.s.thornHeroInitiated=true;
  Object.assign(g.hero,{...p, hp:100000,maxHp:100000,level:e.level,
    basicCd:0,order:null,immune:0});
  g.hero.skills[0]=1;
  g.s.projectiles=[];
  e.cd=100;
  e.specialCd=100;
}
function probe(g,e,range,context) {
  const start={x:e.x,y:e.y,hp:e.hp,homeDistance:dist(g.hero,e.home)};
  const cast=g.cast(1,e.id,false,null,true);
  let hit=false;
  for(let i=0;i<25&&!hit;i++){
    g.s.time+=0.05;
    g.updateProjectiles(0.05);
    hit=e.hp<start.hp;
  }
  const aggroAfterHit=!!e.aggro;
  const alert=!!g.enemyUnderFireAlert(e);
  const insideLeash=g.tacticalRogueLeashAllows(e,g.hero,500);
  const nearTown=dist(g.hero,{x:300,y:350});
  const xy={x:e.x,y:e.y};
  let firstMoveAt=null;
  let reset=false;
  for(let i=0;i<25;i++){
    g.s.time+=0.1;
    g.updateEnemies(0.1);
    if(firstMoveAt===null && dist(xy,e)>0.1)firstMoveAt=(i+1)*0.1;
    if(e.returning)reset=true;
  }
  const result={context,range,cast,hit,aggroAfterHit,alert,
    homeDistance:Math.round(start.homeDistance),nearTown:Math.round(nearTown),
    insideLeash,firstMoveAt,step:Math.round(dist(xy,e)),reset,
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
assert(coverage===5&&normalReactions>0,'characterization must probe legal basic shot and native reactions');
console.log('PASS ranger edge characterization');
