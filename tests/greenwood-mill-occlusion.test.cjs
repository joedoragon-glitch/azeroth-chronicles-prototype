'use strict';
// Focused real-world Greenwood millbank occlusion and historical-v4 migration.
// Does not modify combat roles, enemy homes, pathfinding, road or water geometry.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const treeId = 'greenwood-nature-165';
const alternatives = [[1450,2000],[1490,1930],[1350,2070]];
const original = { x: 1251, y: 1765 };
const enemies = z => z.enemies.map(e =>
  [e.id,e.x,e.y,e.home?.x,e.home?.y,e.hp,e.species,e.ranged]);
const authored = z => z.props.filter(p => p.greenwoodNature === 'tree');
const atTree = z => z.props.find(p => p.id === treeId);
const critical = z => ({
  enemies:enemies(z), nodes:z.nodes.map(n=>[n.id,n.x,n.y,n.amount]),
  roads:z.roads, footpaths:z.footpaths,
  bridgeApproaches:z.bridgeApproaches, workingMill:z.props.find(p=>p.id==='greenwood-working-mill'),
  pond:z.npcs.find(n=>n.id==='mill-pond'),
});
for(const seed of [0x47564101,0x47564102,0x47564103,0x47564104]){
  const g = new C('normal','paladin',rng(seed)),z=g.zone(), t=atTree(z);
  assert(t && t.greenwoodNature==='tree', 'original authored mature tree remains');
  assert.equal(z.greenwoodMillbankSightlineVersion,1);
  assert(z.greenwoodMillbankSightlineAudit?.moved,
    'the exact unowned canopy is shifted to a safe nearby woodland margin');
  assert(alternatives.some(([x,y])=>distance(t,{x,y})<1),
    'tree arrives at one of three bounded native woodland clearings');
  assert(distance(t,original)>150,'tree no longer blocks the mill-side goblins');
  assert(!g.blocked(t.x,t.y,'vale',0,true),'tree has a dry physical anchor');
  assert(g.distanceToRoad(z,t)>=105,'tree does not intrude into roadway');
  assert(g.distanceToRoad({roads:z.footpaths},t)>=70,'tree does not cover the footpath');
  assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640);
  assert.equal(z.enemies.filter(e=>e.type==='mob'&&!e.summon).length,32);
  const trees=authored(z);
  assert.equal(trees.filter(p=>p.id===treeId).length,1,'tree identity not duplicated');
  const stable=JSON.stringify(g.snapshot());
  g.zone();g.zone();
  assert.equal(JSON.stringify(g.snapshot()),stable,'visual pass runs only once per save');

  // Simulate the actual pre-correction scene-5 saved state. Preserve all its
  // actors and civil infrastructure; change only the one protected tree's
  // recorded visual position to the authored prior location.
  const old=JSON.parse(stable),oldZone=old.zones.vale,
    oldTree=atTree(oldZone);
  oldTree.x=original.x;oldTree.y=original.y;
  delete oldZone.greenwoodMillbankSightlineVersion;
  delete oldZone.greenwoodMillbankSightlineAudit;
  oldZone.props.push({id:'player-millbank-property',structure:'barrel',
    x:3070,y:3060,r:0,decorative:true,playerOwned:true});
  const expected=JSON.stringify(critical(oldZone)),serialized=JSON.stringify(old);
  const restored=C.restore(old,rng(seed)),rz=restored.zone();
  assert.equal(JSON.stringify(old),serialized,'restoration leaves source backup untouched');
  const newTree=atTree(rz);
  assert(newTree && distance(newTree,original)>150,'historical scene receives tree correction');
  assert.equal(rz.greenwoodMillbankSightlineVersion,1);
  assert(rz.greenwoodMillbankSightlineAudit?.moved);
  assert.equal(JSON.stringify(critical(rz)),expected,
    'all saved enemies, mill geometry, routes, destinations and resource nodes preserved');
  assert(rz.props.some(p=>p.id==='player-millbank-property'&&p.playerOwned),
    'player-made property preserved');
  assert.equal(authored(rz).length,trees.length,'no tree created or destroyed');
  const once=JSON.stringify(restored.snapshot());
  restored.zone();restored.zone();
  assert.equal(JSON.stringify(restored.snapshot()),once,'second restore access is idempotent');
  console.log('PASS MILLBANK_SIGHTLINE '+JSON.stringify({
    seed,treeId,x:newTree.x,y:newTree.y,
    goblins:rz.enemies.filter(e=>e.species==='goblin'&&
      distance(e,{x:1040,y:1500})<320).map(e=>e.id),
    trees:trees.length,sceneVersion:rz.greenwoodMillbankSightlineVersion
  }));
}
console.log('PASS four-seed native canopy clearance, stable actors, authored props, historical v4 saves and no duplicate migration');
