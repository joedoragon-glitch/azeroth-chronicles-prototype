'use strict';
// Phase 2 Ash Refuge: existing home/forgehouse must have two functional-looking
// domestic chores on cooled, unoccupied ground. No new NPCs, roads or systems.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const saved=(obj)=>JSON.stringify(obj);
const make=()=>new Campaign('normal','paladin',()=>0.73);
const kind=['field-kitchen','laundry'];
const g=make();
assert(g.enter('crown'));
const z=g.zone(), minor=Campaign.data.minors[4];
assert.equal(z.ashRefugeDomesticVersion,1,'Ash Refuge finishing must run for fresh games');
const props=z.props.filter(p=>p.ashRefugeDomestic);
if (props.length !== 2) {
  const homes=z.props.filter(p=>['crown-ash-house','crown-forgehouse'].includes(p.structure) &&
    Math.hypot(p.x-minor[0],p.y-minor[1])<490);
  const failures={blocked:0,road:0,npc:0,node:0,building:0,enemy:0,prop:0,clear:0}, samples=[];
  for(const home of homes)for(const radius of [65,95,135,180,225,280,320])
    for(let t=0;t<24;t++){
      const a=t*Math.PI/12,p={x:home.x+Math.cos(a)*radius,y:home.y+Math.sin(a)*radius};
      if(Math.hypot(p.x-minor[0],p.y-minor[1])>550)continue;
      const reasons=[];
      if(g.blocked(p.x,p.y,'crown',19,true))reasons.push('blocked');
      if(g.distanceToRoad(z,p)<78)reasons.push('road');
      if(z.npcs.some(n=>Math.hypot(n.x-p.x,n.y-p.y)<100))reasons.push('npc');
      if(z.nodes.some(n=>Math.hypot(n.x-p.x,n.y-p.y)<75))reasons.push('node');
      if(z.buildings.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<105))reasons.push('building');
      if(z.enemies.some(e=>e.hp>0&&Math.hypot((e.home||e).x-p.x,(e.home||e).y-p.y)<110))reasons.push('enemy');
      if(z.props.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<(q.r||0)+76))reasons.push('prop');
      for(const reason of reasons)failures[reason]++;
      if(!reasons.length){failures.clear++;if(samples.length<12)samples.push({x:Math.round(p.x),y:Math.round(p.y),home:home.id,road:Math.round(g.distanceToRoad(z,p))})}
    }
  console.log('PHASE2-ASHSITE-DIAGNOSTIC '+JSON.stringify({minor,homes:homes.map(h=>({id:h.id,x:h.x,y:h.y})),failures,samples}));
}
assert.equal(props.length,2,'Two distinct domestic chores must actually survive layout/road exclusions');
assert.deepEqual(new Set(props.map(p=>p.structure)),new Set(kind));
assert.equal(new Set(props.map(p=>p.id)).size,2,'Stable distinct IDs');
for(const p of props){
  assert(p.decorative && p.r===0);
  assert(!g.blocked(p.x,p.y,'crown',19,true),
    'No kitchen/washing furniture in lava, solids or hazard');
  assert(g.distanceToRoad(z,p)>=78,'Do not obstruct the owner-designed roads');
  assert(Math.hypot(p.x-minor[0],p.y-minor[1])<435,
    'Household evidence must live near Ash Refuge, not another district');
  assert(z.props.some(home=>['crown-ash-house','crown-forgehouse'].includes(home.structure) &&
    Math.hypot(p.x-home.x,p.y-home.y)<230),
    'Household work must be associated with an actual home or forgehouse');
}
const bare=g.snapshot(), baseRoads=saved(z.roads), beforeOther=z.props.filter(p=>!p.ashRefugeDomestic).map(p=>p.id);
const restored=Campaign.restore(bare);
restored.enter('crown');
const zr=restored.zone();
assert.deepEqual(zr.props.filter(p=>p.ashRefugeDomestic),props,
  'Save and repeated region entry keep exact household placements');
assert.equal(saved(zr.roads),baseRoads,'No streets rewritten on load');
assert.deepEqual(zr.props.filter(p=>!p.ashRefugeDomestic).map(p=>p.id),beforeOther,
  'Existing actors, gameplay props and canon objects retain IDs/order');
// Simulate a validated older v4 save with no Phase 2 domestic version marker,
// while preserving its entire established state and civilian/monster props.
const old=structuredClone(bare);
delete old.zones.crown.ashRefugeDomesticVersion;
old.zones.crown.props=old.zones.crown.props.filter(p=>!p.ashRefugeDomestic);
const upgraded=Campaign.restore(old);
upgraded.enter('crown');
const zu=upgraded.zone();
assert.equal(zu.props.filter(p=>p.ashRefugeDomestic).length,2,
  'An older v4 save receives the same reversible visual work');
assert.deepEqual(zu.props.filter(p=>!p.ashRefugeDomestic).map(p=>p.id),beforeOther,
  'Old save remains otherwise identical after decorative upgrade');
assert.equal(saved(zu.roads),baseRoads,'Old save roads remain owner-authored');
assert.equal(zu.worldLifeVersion,z.worldLifeVersion,'No world-life replay for old saves');
const again=Campaign.restore(upgraded.snapshot());again.enter('crown');
assert.deepEqual(again.zone().props.filter(p=>p.ashRefugeDomestic),
  zu.props.filter(p=>p.ashRefugeDomestic),'Second reload is idempotent');
console.log('PASS Phase 2 Ash Refuge: two visible existing-life objects on safe rock, original world and v4 saves stable');
