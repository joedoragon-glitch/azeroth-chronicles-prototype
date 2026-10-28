'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
// The four streams must reproduce and differ. The production map is authored,
// so coverage comes from sampled live actor states, never fake random maps.
const seeds = [0x47564101, 0x47564102, 0x47564103, 0x47564104];
const streams = seeds.map((seed) => {
  const r = rng(seed);
  return Array.from({ length: 40 }, r);
});
assert.equal(new Set(streams.map(JSON.stringify)).size, 4);
assert.deepEqual(streams[0], Array.from({ length: 40 }, rng(seeds[0])));
for (const size of [2700, 3200, 3400]) {
  const result = JSON.parse(
    cp.execFileSync(
      process.execPath,
      [
        '-e',
        `
 const C=require('./src/prototype/engine.js');
 const {rng,candidate}=require('./tools/greenwood-layout/fixtures.cjs');
 const other=JSON.stringify({regions:C.data.regions.slice(1),terrain:C.rules.terrain.slice(1),sites:C.rules.sites.slice(1)});
 const original={count:C.data.regions[0].enemy_count,rewards:C.rules.tributePlans.vale,house:C.rules.settlementLayouts.major};
 const plan=candidate(C,${size});
 const states=[];let game;
 for(const seed of [0x47564101,0x47564102,0x47564103,0x47564104]){
  const g=new C('normal','paladin',rng(seed));for(let j=0;j<120;j++)g.tick(.1);
  states.push(JSON.stringify(g.s));game=g;
 }
 const z=game.zone();
 console.log(JSON.stringify({size:game.zoneSize(),uniqueStates:new Set(states).size,
  othersUnchanged:other===JSON.stringify({regions:C.data.regions.slice(1),terrain:C.rules.terrain.slice(1),sites:C.rules.sites.slice(1)}),
  ordinary:z.enemies.filter(e=>e.type==='mob'&&!e.summon).length,
  props:z.props.length,tribute:z.nodes.reduce((a,n)=>a+n.amount,0),
  deckWidths:C.rules.barriers[0].gaps.map(([a,b])=>b-a),
  localHousePreserved:JSON.stringify(original.house)===JSON.stringify(C.rules.settlementLayouts.major),
  centers:z.bridgeApproaches.map(b=>({clear:game.clearSegment(b.west,b.east,15),bothRoutes:game.route(b.west,b.east).length>0&&game.route(b.east,b.west).length>0})),
  sourceCount:C.data.regions[0].enemy_count}));
 `,
      ],
      { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8' },
    ),
  );
  assert.equal(result.size, size);
  assert.equal(result.uniqueStates, 4, 'four distinct deterministic actor states at ' + size);
  assert(result.othersUnchanged, 'fixture must not change the four other regions');
  assert.equal(result.sourceCount, 32);
  assert.equal(result.ordinary, 32, 'relocation cannot inflate ordinary mobs');
  assert.equal(result.tribute, 640);
  assert(result.props <= 400);
  assert(result.localHousePreserved, 'expansion must not scale house offsets');
  assert(
    result.deckWidths.length === 2 && result.deckWidths.every((w) => Math.abs(w - 180) < 1e-9),
    'retain exact authored deck widths within floating-point precision',
  );
  assert(
    result.centers.every((b) => b.clear && b.bothRoutes),
    'both real decks remain connected',
  );
}
console.log(
  'PASS isolated 2700/3200/3400 comparisons; distinct seeded actor states, fixed art/decks/counts/economy and unaffected other regions',
);
