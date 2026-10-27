'use strict';
// Issue #510. Native encounter territorial fairness (NOT a pursuit rebalance).
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const distance = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fixture(region = 'vale') {
  const g = new Campaign('normal','ranger',()=>0.9);
  g.enter(region);
  const z = g.zone();
  z.enemies = []; z.props = []; z.buildings = [];
  g.s.party = []; g.s.time = 30; g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true; g.s.thornHeroInitiated = true;
  Object.assign(g.hero,{hp:10000,maxHp:10000,level:3,slow:0});
  const homes = [
    [1400,1700],[1800,1800],[2200,1700],[2300,2200],
    [2600,1500],[1300,2500],[1900,2600],[800,1800],
    [1900,900],[900,2200],
  ];
  let path = null;
  for(const [x,y] of homes) {
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const home={x,y},
        near={x:x+dx*420,y:y+dy*420},
        nearHero={x:x+dx*480,y:y+dy*480},
        far={x:x+dx*540,y:y+dy*540},
        farHero={x:x+dx*600,y:y+dy*600};
      if([home,near,nearHero,far,farHero].some(p=>g.blocked(p.x,p.y,region,15)))continue;
      if(!g.line(home,near)||!g.line(nearHero,near)||!g.line(farHero,far)||
         !g.clearSegment(home,far,15))continue;
      path={home,near,nearHero,far,farHero,dx,dy};
      break;
    }
    if(path)break;
  }
  assert(path,region+': unobstructed real 600-unit chase lane');
  const e=g.makeEnemy({
    species:'goblin',name:'damage leash fixture',form:'normal',
    type:'mob',level:3,hp:5000,damage:1,gold:0,xp:0,
  },path.home);
  e.ranged=false; e.hybrid=false;
  z.enemies=[e];
  Object.assign(g.hero,path.nearHero);
  g.engage(e);
  assert(e.aggro,'valid game engagement');
  return {g,e,path};
}
function position(g,e,point,hero) {
  Object.assign(e,point); Object.assign(g.hero,hero);
  assert(g.line(g.hero,e),'native line of sight');
  assert.equal(Math.round(distance(g.hero,e)),60,'real contact distance');
}
function receipt(label, flags, radius) {
  const {g,e,path}=fixture();
  Object.assign(e,flags);
  position(g,e,path.far,path.farHero);
  assert.equal(Math.round(distance(g.hero,e.home)),600);
  assert(g.tacticalRogueLeashAllows(e,g.hero,radius),
    label+' attacker stays inside original pursuit territory');
  assert(!g.tacticalRogueLeashAllows(e,g.hero,500),
    label+' used to be damage-rejected outside hard-coded 500');
  assert.equal(g.nativeEncounterTerritory(e),radius,label+' native radius');
  const hp=e.hp;
  assert.equal(g.damage(e,13,'hero'),true,label+' real damage accepted');
  assert.equal(e.hp,hp-13,label+' real HP reduced at close range');
  assert.equal(g.heroParticipated,undefined); // no new game/system flag
  console.log('PASS issue510 real-world '+label+
    ': native incoming damage accepted at 600 home / 60 enemy, radius='+radius);
}
receipt('ordinary summon',{summon:true},900);
receipt('field captain',{fieldCaptain:true},900);
receipt('quota overtime',{quotaOvertime:4},1300);
// Check boundary precedence & symmetry without introducing terrain-dependent
// assumptions about 1300-unit open straight lines (LOS is isolated here).
const choices=[
  ['ordinary',{},500],
  ['summon',{summon:true},900],
  ['field captain',{fieldCaptain:true},900],
  ['overtime',{quotaOvertime:3},1300],
  ['captain',{captain:true},500],
  ['room captain',{roomCaptain:true},500],
  ['field+overtime',{fieldCaptain:true,quotaOvertime:3},900],
  ['summon+overtime',{summon:true,quotaOvertime:3},1300],
  ['boss',{type:'boss'},700],
];
for(const [label,flags,radius] of choices) {
  const {g,e,path}=fixture();
  Object.assign(e,flags);
  assert.equal(g.nativeEncounterTerritory(e),radius,label+' leash unchanged');
  // Real damage/target/protection code with explicit LOS stub; distance gate
  // only is under test here. 600-unit case above uses actual Greenwood LOS.
  g.line=()=>true;
  for(const distFromHome of [450,499,500,501,550,850,899,900,901,949,1299,1300,1301]) {
    Object.assign(g.hero,{
      x:path.home.x+path.dx*distFromHome,
      y:path.home.y+path.dy*distFromHome,
    });
    Object.assign(e,{
      x:g.hero.x-path.dx*60, y:g.hero.y-path.dy*60,
    });
    e.aggro=true; e.returning=0; e.neutral=false; e.hp=5000;
    const permitted=distFromHome<=radius;
    assert.equal(g.tacticalRogueLeashAllows(e,g.hero,radius),permitted,
      label+' chase legal at '+distFromHome);
    const hit=g.damage(e,13,'hero');
    assert.equal(hit,permitted,label+' hit/chase symmetry '+distFromHome);
    assert.equal(e.hp,permitted?4987:5000,label+' HP '+distFromHome);
  }
}
// Idle actors retain the original pre-engagement protection. A summoned
// defender may be hard to snipe from its outer 500-900 territory but may
// still retaliate there once actually provoked and engaged.
for(const flags of [{summon:true},{fieldCaptain:true},{quotaOvertime:2}]) {
  const {g,e,path}=fixture();
  Object.assign(e,flags);
  position(g,e,path.far,path.farHero);
  e.aggro=false;
  assert(!g.damage(e,13,'hero'),'idle special actor not newly snipeable');
  position(g,e,path.near,path.nearHero);
  assert(g.damage(e,13,'hero'),'ordinary opening hit within 500 remains valid');
}
// Returning/reset invulnerability cannot be bypassed by the new shared radius.
for(const flags of [{summon:true},{fieldCaptain:true},{quotaOvertime:3}]) {
  const {g,e,path}=fixture();
  Object.assign(e,flags);
  position(g,e,path.far,path.farHero);
  e.returning=0.5; e.aggro=true;
  assert(!g.damage(e,13,'hero'),'returning actor still protected');
  e.returning=0; e.hp=e.maxHp-100;
  e.pursuitBurst=1.2; e.pursuitBurstUsed=true;
  e.pursuitBurstReadyAt=g.s.time+3.2;
  g.disengage(e,0.1);
  g.disengage(e,1.1);
  assert.equal(e.aggro,false);
  assert.equal(e.hp,e.baseHp);
  assert.equal(e.pursuitBurstUsed,false);
  assert.equal(e.pursuitBurstReadyAt,undefined);
}
// Boss has its ORIGINAL 700 outdoor / 1800 dungeon radius, with unchanged
// normal and engaged precondition (no new boss movement or strength).
{
  const {g,e}=fixture(); e.type='boss';
  assert.equal(g.nativeEncounterTerritory(e),700);
  e.aggro=false;
  const q=fixture('crypt'); q.e.type='boss';
  assert.equal(q.g.nativeEncounterTerritory(q.e),1800);
}
// Area, LoS and town protections remain owned by their original resolvers.
{
  const {g,e,path}=fixture();
  e.summon=true; position(g,e,path.far,path.farHero);
  g.line=()=>false;
  assert(!g.damage(e,13,'hero'),'new radius never bypasses actual LoS gate');
  g.line=()=>true;
  g.s.phase='peace';
  assert(!g.damage(e,13,'hero'),'peace still prevents combat');
}
console.log('PASS issue #510 bounded territorial fairness: real LOS, 9 actor classes, 13 radii, unchanged idle/reset/LOS/peace safeguards');
