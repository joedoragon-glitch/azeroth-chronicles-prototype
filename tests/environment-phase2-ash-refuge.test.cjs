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
