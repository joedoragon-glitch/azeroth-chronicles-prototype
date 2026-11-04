'use strict';
// Native Campaign collision smoke for the dormant off-zone router.
// The test may temporarily enter a region ONLY to initialize an authored test
// fixture; route() itself must never switch the Campaign's active zone.
const test=require('node:test');
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Native=require('../src/prototype/strategist-lab-navigation.js');
test('native Marches geometry can be queried remotely without changing hero zone',()=>{
  const g=new Campaign('normal','paladin',()=>0.57);
  const heroZone=g.zoneId;
  g.s.zone='march';
  g.zone(); // Native generation of a previously visited Lab region.
  g.s.zone=heroZone;
  assert.ok(g.s.zones.march?.buildings,'real remote zone exists');
  const size=g.zoneSize('march');
  let pair=null;
  // Select a real collision-clear short journey, not an invented source node.
  for(let y=160;y<size-160&&!pair;y+=160)
    for(let x=160;x<size-300;x+=160){
      const a={x,y},b={x:x+60,y};
      if(!g.blocked(a.x,a.y,'march',15) &&
          !g.blocked(b.x,b.y,'march',15) &&
          Native.passable(g,'march',a,b,Native.budget(0,70))) {
        pair=[a,b];break;
      }
    }
  assert.ok(pair,'authored Marches must retain at least one walkable 60-unit segment');
  const token=Native.budget();
  const path=Native.route(g,'march',pair[0],pair[1],token);
  assert.deepEqual(path.at(-1),pair[1]);
  assert.equal(g.zoneId,heroZone,'route did not borrow the active zone');
  assert.ok(token.tested<=2400&&token.expanded<=300);
  let prev=pair[0];
  for(const waypoint of path){
    assert.equal(Native.passable(g,'march',prev,waypoint),true);
    prev=waypoint;
  }
  // Discriminating enemy visibility is outside this pathfinder's remit.
  assert.equal(Campaign.classes.strategist,undefined);
});

test('all five native regions accept physical return paths without borrowing the hero zone', () => {
  const g = new Campaign('normal', 'paladin', () => 0.57);
  const home = g.zoneId;
  for (const zoneId of ['vale', 'march', 'highlands', 'frontier', 'crown']) {
    g.s.zone = zoneId;
    g.zone(); // Authored regional generation only, not a route shortcut.
    g.s.zone = home;
    const size = g.zoneSize(zoneId);
    let pair = null;
    for (let y = 160; y < size - 160 && !pair; y += 160)
      for (let x = 160; x < size - 240; x += 160) {
        const from = { x, y }, to = { x: x + 60, y };
        if (!g.blocked(from.x, from.y, zoneId, 15) &&
            !g.blocked(to.x, to.y, zoneId, 15) &&
            Native.passable(g, zoneId, from, to, Native.budget(0, 70))) {
          pair = [from, to];
          break;
        }
      }
    assert.ok(pair, zoneId + ': native map must contain a collision-clear local trip');
    const outward = Native.route(g, zoneId, pair[0], pair[1]);
    const inward = Native.route(g, zoneId, pair[1], pair[0]);
    assert.deepEqual(outward.at(-1), pair[1], zoneId + ': outward');
    assert.deepEqual(inward.at(-1), pair[0], zoneId + ': return');
    assert.equal(g.zoneId, home, zoneId + ': no hero-zone mutation');
  }
});
