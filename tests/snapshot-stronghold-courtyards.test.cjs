'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
assert.equal(R.creatureStrongholds.length,13);
let inspected=0;
for(const region of C.data.regions){
  const game = new C('normal','paladin',()=>0.9);
  game.enter(region.id);
  const z = game.zone();
  const enemies = z.enemies.map(e=>e.id);
  for(const hold of R.creatureStrongholds.filter(h=>h.region===region.id)){
    inspected++;
    const center=game.creatureStrongholdCenter(z,hold);
    assert(center);
    const walls=z.props.filter(p=>p.stronghold===hold.id&&p.r>0);
    const decor=z.props.filter(p=>p.stronghold===hold.id&&p.decorative);
    assert(walls.length>=3,hold.id+' keeps defensible remains');
    assert(decor.length>=5,hold.id+' retains recognizable everyday life');
    assert(['fort','ruin','habitat'].includes(hold.defenseStyle));
    assert(walls.every(w=>w.strongholdDefenseStyle===hold.defenseStyle));
    for(let i=0;i<decor.length;i++) for(let j=i+1;j<decor.length;j++)
      assert(dist(decor[i],decor[j])>=90,hold.id+' not crowded');
    for(const w of walls)
      assert(game.distanceToRoad(z,w)>=85,hold.id+' wall stays off authored roads');
    assert(game.route(game.hero,center).length>0,hold.id+' reached without wall softlock');
    assert(game.route(center,game.hero).length>0,hold.id+' exit remains available');
    const residents=z.enemies.filter(e=>e.stronghold===hold.id);
    if(!hold.night){
      assert.equal(residents.length,hold.guardCount);
      for(const e of residents){
        assert.equal(e.species,hold.species);
        assert(game.route(center,e.home).length>0);
      }
    }
    if(hold.id==='raider-drill-redoubt'){
      assert.equal(hold.defenseStyle,'fort');
      assert.equal(walls.length,22,'continuous perimeter except one gate');
      assert.equal(walls.filter(w=>w.fortCorner).length,4);
      const north=walls.filter(w=>Math.abs(w.y-(center.y-150))<1);
      assert.equal(north.length,5,'two northern wall sections omitted as a gate');
      assert(!north.some(w=>w.x===center.x||w.x===center.x+50));
    }
  }
  assert.deepEqual(z.enemies.map(e=>e.id),enemies,'no extra enemy population');
  const before=z.props.filter(p=>p.stronghold).map(p=>[p.id,p.x,p.y]);
  game.zone();
  assert.deepEqual(z.props.filter(p=>p.stronghold).map(p=>[p.id,p.x,p.y]),before,
    'unchanged repeat zone reads');
}
console.log('PASS '+inspected+' stronghold courtyard layouts, defensive identities, safe exits and native garrisons');
