'use strict';
// Verify an actual projectile starting inside native blocking terrain (j=0)
// retains its hit outcome and impact receipt. No collision implementation
// is stubbed; only test-instance instrumentation records call counts.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine');
function scene(shots,blockedAtStart=true){
  const g=new Campaign('developer','paladin',()=>.73),z=g.zone();
  z.enemies=[];z.nodes=[];z.buildings=[];z.npcs=[];z.props=[];
  g.s.projectiles=[];g.s.hazards=[];
  g.hero.hp=10000;g.hero.maxHp=10000;
  const origin={x:1420,y:1300};
  z.props.push({id:'projectile-source-wall',x:origin.x,y:origin.y,r:35});
  assert(g.blocked(origin.x,origin.y,g.zoneId,0),
    'source wall must be native blocked terrain');
  if(!blockedAtStart)z.props=[];
  for(let i=0;i<shots;i++)g.s.projectiles.push({
    id:'audit-buried-'+i,source:'enemy',sourceId:'unknown',
    fortChecked:true,x:origin.x,y:origin.y,dx:1,dy:0,
    speed:180,damage:2,life:3,hitRadius:18,style:'arrow',
  });
  let checks=0,impacts=0,terrainImpacts=0;
  const oldBlocked=g.blocked,oldEvent=g.event;
  g.blocked=function(...args){checks++;return oldBlocked.apply(this,args)};
  g.event=function(name,detail){
    if(name==='projectileImpact'){impacts++;if(detail?.terrain)terrainImpacts++}
    return oldEvent.call(this,name,detail);
  };
  g.updateProjectiles(.05);
  delete g.blocked;delete g.event;
  return {shots,blockedAtStart,checks,impacts,terrainImpacts,
    shotsRemaining:g.s.projectiles.length,heroHp:g.hero.hp,
    snapshot:g.snapshot()};
}
for(const n of [1,24,96]){
  const outcome=scene(n);
  assert.equal(outcome.shotsRemaining,0,'buried enemy projectiles must be stopped by terrain');
  assert.equal(outcome.heroHp,10000,'no hero damage through terrain');
  console.log('PROJECTILE_ORIGIN_COLLISION '+JSON.stringify({
    shots:n,checks:outcome.checks,impacts:outcome.impacts,
    terrainImpacts:outcome.terrainImpacts,remaining:outcome.shotsRemaining,
    heroHp:outcome.heroHp
  }));
}
const free=scene(24,false);
assert(free.shotsRemaining>0,'free-space projectiles must continue moving');
console.log('PASS authoritative projectile origin collision and free-flight control');
