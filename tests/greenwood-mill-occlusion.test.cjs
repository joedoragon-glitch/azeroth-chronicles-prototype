'use strict';
// Focused real-world Greenwood millbank occlusion and historical-v4 migration.
// Does not modify combat roles, enemy homes, pathfinding, road or water geometry.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const treeId = 'greenwood-nature-165';
const allowedX = [1320,1400,1260,1470,1520,1200];
const allowedY = [2050,2120,1980,2170,1920];
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
  const outcome=z.greenwoodMillbankSightlineAudit;
  assert(outcome?.moved || outcome?.pruned,
    'millbank canopy must either relocate safely or open in place');
  assert.notEqual(!!outcome.moved,!!outcome.pruned,
    'a tree is relocated OR treated in place, never both');
  if(outcome.moved){
    assert(allowedX.some(x=>Math.abs(t.x-x)<1) &&
      allowedY.some(y=>Math.abs(t.y-y)<1),
      'tree reaches one of thirty bounded native woodland clearings');
    assert(distance(t,original)>150,'tree relocates away from mill-side goblins');
    assert(!t.greenwoodMillbankOpenCrown,'relocated canopy needs no art override');
    assert(!g.blocked(t.x,t.y,'vale',0,true),'tree has a dry physical anchor');
    assert(g.distanceToRoad(z,t)>=105,'tree does not intrude into roadway');
    assert(g.distanceToRoad({roads:z.footpaths},t)>=70,'tree does not cover the footpath');
  }else{
    assert(distance(t,original)<2,'crowded woodland retains the original tree anchor');
    assert.equal(t.greenwoodMillbankOpenCrown,1,
      'crowded woodland presents an open but still existing crown');
  }
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
  delete oldTree.greenwoodMillbankOpenCrown;
  delete oldZone.greenwoodMillbankSightlineVersion;
  delete oldZone.greenwoodMillbankSightlineAudit;
  oldZone.props.push({id:'player-millbank-property',structure:'barrel',
    x:3070,y:3060,r:0,decorative:true,playerOwned:true});
  const expected=JSON.stringify(critical(oldZone)),serialized=JSON.stringify(old);
  const restored=C.restore(old,rng(seed)),rz=restored.zone();
  assert.equal(JSON.stringify(old),serialized,'restoration leaves source backup untouched');
  const newTree=atTree(rz);
  assert(newTree && rz.greenwoodMillbankSightlineVersion===1,
    'historical scene receives the new non-destructive canopy treatment');
  const restoredOutcome=rz.greenwoodMillbankSightlineAudit;
  assert(restoredOutcome?.moved || restoredOutcome?.pruned,
    'historical migration resolves crowded tree sightline');
  if(restoredOutcome.pruned){
    assert(distance(newTree,original)<2,'saved tree anchor preserved when opened in place');
    assert.equal(newTree.greenwoodMillbankOpenCrown,1);
  }else{
    assert(distance(newTree,original)>150,'saved tree moved to legal woodland clearing');
  }
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
    trees:trees.length,sceneVersion:rz.greenwoodMillbankSightlineVersion,
    outcome:restoredOutcome.moved?'relocated':'open-crown'
  }));
}
console.log('PASS four-seed native millbank canopy handling, guarded placement, stable actors, historical v4 saves and idempotence');
