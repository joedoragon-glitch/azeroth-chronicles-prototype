'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const selectedRegion = process.argv.find((a) => a.startsWith('--region='))?.slice(9);
const regions = Campaign.data.regions.filter((r) => !selectedRegion || r.id === selectedRegion);
assert(regions.length, 'unknown region selection');

const historic = require('./fixtures/region-original-street-20261029.json');
const dev233Pilot = require('../docs/evidence/regional-street-rollback-20261029/seeded-spatial-deltas.json');
const { rng: regionalRng } = require('../tools/greenwood-layout/fixtures.cjs');
const rounded = (n) => Math.round(n * 10) / 10;
// Owner accepted restoring these pre-#570 regional layouts instead of mandatory
// complete connectivity or a later broad aesthetic/roadside relocation sweep.
// Strict legacy audit stays accessible with --strict-regional.
function checkRestoredRegionalBaseline(id) {
  const order = ['march','highlands','frontier','crown'];
  const index = order.indexOf(id);
  const game = new Campaign('normal', 'paladin', regionalRng(0x11005a10 + index));
  game.enter(id);
  const zone = game.zone();
  const i = game.regionIndex();
  const town = { x: Campaign.data.towns[i][0], y: Campaign.data.towns[i][1] };
  const touch = (p, road) => road.some((q,j)=>j && game.distanceToSegment(p,road[j-1],q)<1);
  const connected = new Set(zone.roads.map((r,j)=>touch(town,r)?j:-1).filter(j=>j>=0));
  for(let grew=true;grew;){
    grew=false;
    zone.roads.forEach((r,j)=>{
      if(connected.has(j))return;
      if([...connected].some(k=>r.some(p=>touch(p,zone.roads[k]))||zone.roads[k].some(p=>touch(p,r)))){
        connected.add(j);grew=true;
      }
    });
  }
  const unsafeSegments=[];
  zone.roads.forEach((r,k)=>r.forEach((p,j)=>{
    if(j && !game.clearSegment(r[j-1],p,15))
      unsafeSegments.push([k,j,rounded(r[j-1].x),rounded(r[j-1].y),rounded(p.x),rounded(p.y)]);
  }));
  const margins=zone.props.filter(p=>!p.roadTrace && game.distanceToRoad(zone,p)+.01 < game.roadSetback(p));
  const blocked=margins.filter(p=>p.roadBlocker).map(p=>[
    p.id,rounded(p.x),rounded(p.y),rounded(game.distanceToRoad(zone,p)),game.roadSetback(p)
  ]).sort((a,b)=>a[0].localeCompare(b[0]));
  const services=[['rest',190],['minor',180],['supplier',92],['recruiter',92],['board',95]]
    .flatMap(([id,required])=>{
      const p=zone.npcs.find(n=>n.id===id);
      return p && game.distanceToRoad(zone,p)+.01<required
        ? [[id,rounded(p.x),rounded(p.y),rounded(game.distanceToRoad(zone,p)),required]]:[];
    }).sort((a,b)=>a[0].localeCompare(b[0]));
  const playerBuildings=zone.buildings.flatMap(b=>{
    const actual=game.distanceToRoad(zone,b), required=175;
    return actual+.01<required
      ? [[b.id,rounded(b.x),rounded(b.y),rounded(actual),required]]:[];
  }).sort((a,b)=>a[0].localeCompare(b[0]));
  const actual={
    roads:zone.roads.length,connected:connected.size,unsafeSegments,
    marginCount:margins.length,blockingProps:blocked,services,playerBuildings
  };
  assert.deepEqual(actual,historic.regions[id],
    id+' changed from the owner-approved original regional street/placement baseline');
  assert.equal(zone.finalStreetClearanceVersion,undefined,
    'new worlds must not reapply the rejected automatic final road pass');
  // Keep a dev.233-versioned receipt harmless on v4 restore: preserve campaign
  // economy, entity identities, quest data and the existing world snapshot.
  // This does NOT claim historical scenery coordinates have been reversed.
  const old=game.snapshot();
  old.zones[id].finalStreetClearanceVersion=1;
  const coins=old.hero.gold;
  const ids=Object.fromEntries(['npcs','buildings'].map(k=>[k,old.zones[id][k].map(e=>e.id)]));
  const restored=Campaign.restore(old);
  const current=restored.zone();
  assert.equal(restored.hero.gold,coins,id+' old save currency retained');
  for(const k of ['npcs','buildings'])
    assert.deepEqual(current[k].map(e=>e.id),ids[k],id+' old save '+k+' identities retained');
  // Normal region/save migrations may legitimately replace authored scenery,
  // unlike paid progress, player camps and named service identities.
  const postProps=current.props.map(e=>e.id);
  const again=Campaign.restore(restored.snapshot());
  assert.equal(again.hero.gold,coins,id+' repeat restore currency retained');
  for(const k of ['npcs','buildings'])
    assert.deepEqual(again.zone()[k].map(e=>e.id),ids[k],id+' repeat restore '+k+' identities retained');
  assert.deepEqual(again.zone().props.map(e=>e.id),postProps,
    id+' post-migration scenery IDs remain stable across subsequent reloads');

  if (id === 'frontier' || id === 'crown') {
    const historical = new Campaign('normal','paladin',
      regionalRng(0x1c001d00 + index));
    historical.enter(id);
    const saved = historical.snapshot(),scene=saved.zones[id];
    const sample=dev233Pilot.regions[id];
    const originalRoads=scene.roads.length;
    const reversible=[];
    const twice=(values,key)=>values.filter(p=>String(p.id||p.structure||p.kind||'unknown')===key);
    for (const m of sample.moved) {
      const at=m.id.lastIndexOf('#'),key=m.id.slice(0,at),number=Number(m.id.slice(at+1));
      const p=twice(scene[m.type],key)[number-1];
      if(!p||Math.abs(p.x-m.from.x)>.06||Math.abs(p.y-m.from.y)>.06) continue;
      p.x=m.to.x;p.y=m.to.y;
      if(m.type==='npcs'&&scene[id+'TownPlacements']?.[key])
        scene[id+'TownPlacements'][key]=[m.to.x,m.to.y];
      reversible.push(m);
    }
    if(id==='crown'){
      // Witnessed three-point 25-unit connector, no invented road geometry.
      scene.roads.push([{x:875,y:1825},{x:875,y:1812.5},{x:875,y:1800}]);
    }
    assert(reversible.length>0,'historical synthetic fixture has actual move coverage');
    scene.finalStreetClearanceVersion=1;
    const playerGold=saved.hero.gold;
    const restoredOld=Campaign.restore(saved),loaded=restoredOld.zone();
    assert.equal(restoredOld.hero.gold,playerGold);
    assert.equal(loaded.regionalStreetRollbackVersion,1,
      'the inverse is versioned to run only once');
    for(const m of reversible){
      const at=m.id.lastIndexOf('#'),key=m.id.slice(0,at),number=Number(m.id.slice(at+1));
      const p=twice(loaded[m.type],key)[number-1];
      assert(p,'transformed object keeps its original identity');
      assert(Math.abs(p.x-m.from.x)<=.06 && Math.abs(p.y-m.from.y)<=.06,
        'dev.233 source-confirmed moved object restored: '+id+' '+m.id);
    }
    if(id==='crown') assert.equal(loaded.roads.length,originalRoads,
      'only the exact auto-generated Crown connector is removed');
    const againOld=Campaign.restore(restoredOld.snapshot());
    assert.equal(againOld.hero.gold,playerGold,'repeated inverse cannot debit crowns');
    assert.equal(againOld.zone().roads.length,loaded.roads.length,'no repeat road migration');
    console.log('PASS '+id+' exact-match dev.233 saved-scene reversal ('+reversible.length+
      ' moved objects), immutable identities/economy and repeated restore');
  }
  console.log('PASS '+id+' historical-region geometry parity, documented exceptions, and v4 identity preservation');
}

let routes = 0;
let inspected = 0;

for (const region of regions) {
  if (region.id !== 'vale' && !process.argv.includes('--strict-regional')) {
    checkRestoredRegionalBaseline(region.id);
    continue;
  }
  const game = new Campaign();
  game.enter(region.id);
  const zone = game.zone();
  const i = game.regionIndex();
  const town = { x: Campaign.data.towns[i][0], y: Campaign.data.towns[i][1] };
  const hamlet = { x: Campaign.data.minors[i][0], y: Campaign.data.minors[i][1] };
  const authoredVale = region.id === 'vale' && Campaign.rules.greenwoodLayout?.version === 2;
  const network = authoredVale ? [...zone.roads, ...zone.footpaths] : zone.roads;
  assert.equal(zone.settlementLayoutVersion, 4, region.id + ' new parcel plan');
  assert.equal(zone.roadVersion, 17, region.id + ' connected roads');
  assert.equal(zone.streetClearanceVersion, 3, region.id + ' full street audit');
  assert(zone.roads.length >= 4, region.id + ' real road links');
  if (region.id === 'highlands') {
    assert.equal(
      zone.highlandsQuarryRoadVersion,
      1,
      'quarry hamlet street and refuge repair is versioned',
    );
    assert.equal(
      zone.roads.filter(
        (road) =>
          road.some((p) => distance(p, { x: 2520, y: 650 }) < 1) &&
          distance(road.at(-1), hamlet) < 1,
      ).length,
      1,
      'exactly one authentic quarry hamlet road spur, including old v4 saves',
    );
  }
  if (region.id === 'march') {
    assert.equal(zone.marchTownRoadVersion, 1, 'Reedport road repair is versioned');
    assert.equal(
      zone.marchCoastalRoadClearanceVersion,
      1,
      'old and new coastal scenery keeps full roadway setback',
    );
    assert.equal(
      zone.roads.filter(
        (road) =>
          road.some((p) => distance(p, town) < 1) &&
          road.some((p) => distance(p, { x: 350, y: 1370 }) < 1),
      ).length,
      1,
      'exactly one real Reedport-to-coastal-road leg, never a duplicate',
    );
  }

  // Bridges can connect earlier spurs from either end. Validate the completed
  // geometric network, including segment-interior joins, independently of order.
  const touches = (point, path) =>
    path.some((p, j) => j && game.distanceToSegment(point, path[j - 1], p) < 1);
  const connected = new Set(
    network.map((road, j) => (touches(town, road) ? j : -1)).filter((j) => j >= 0),
  );
  for (let grew = true; grew; ) {
    grew = false;
    network.forEach((road, j) => {
      if (connected.has(j)) return;
      if (
        [...connected].some(
          (k) =>
            road.some((p) => touches(p, network[k])) ||
            network[k].some((p) => touches(p, road)),
        )
      ) {
        connected.add(j);
        grew = true;
      }
    });
  }
  assert.equal(
    connected.size,
    network.length,
    region.id + ' every road belongs to the town-connected network',
  );
  for (const road of network) {
    assert(road.length > 1, region.id + ' has no empty streets');
    for (let j = 1; j < road.length; j++) {
      assert(
        game.clearSegment(road[j - 1], road[j], 15),
        region.id + ' road crosses collision geometry',
      );
    }
    routes++;
  }
  assert(
    network.some((road) => authoredVale ? touches(hamlet, road) : distance(road.at(-1), hamlet) < 2),
    region.id + ' hamlet must be connected to town',
  );
  // Every authored village, named landmark, monster habitation and
  // occupying district needs a legible accessible street/approach.
  const R = Campaign.rules;
  const access = (id, x, y, limit = 260) => {
    const actual = game.distanceToRoad(authoredVale ? { roads: network } : zone, { x, y });
    assert(
      actual <= limit,
      region.id + ' ' + id + ' lacks road access (' + Math.round(actual) + ')',
    );
  };
  access('main dungeon', Campaign.data.entrances[i][0], Campaign.data.entrances[i][1]);
  for (const [id, , x, y] of R.sites[i]) {
    if (/^bridge-/.test(id)) continue;
    access(id, x, y);
  }
  for (const hold of R.creatureStrongholds.filter((h) => h.region === region.id)) {
    if (hold.center) access(hold.id, hold.center[0], hold.center[1]);
    else if (hold.site) {
      const site = R.sites[i].find(([id]) => id === hold.site);
      if (site) access(hold.id, site[2], site[3]);
    }
  }
  for (const habitat of R.worldLifePlans[i].habitats)
    access(habitat.id, habitat.center[0], habitat.center[1]);
  for (const district of region.id === 'frontier'
    ? R.frontierDistricts
    : region.id === 'crown'
      ? R.crownDistricts
      : [])
    access(district.id, district.center[0], district.center[1]);
  if (region.id === 'highlands')
    for (const district of R.ironrootLife) {
      const x = district.props.reduce((sum, p) => sum + p[0], 0) / district.props.length;
      const y = district.props.reduce((sum, p) => sum + p[1], 0) / district.props.length;
      access('livelihood:' + district.id, x, y);
    }
  if (region.id === 'march') {
    const failures = zone.props
      .filter((p) => !p.roadTrace && game.distanceToRoad(zone, p) + 0.01 < game.roadSetback(p))
      .map((p) => [
        p.id,
        p.structure,
        Math.round(game.distanceToRoad(zone, p)),
        game.roadSetback(p),
      ]);
    if (failures.length)
      console.error('MARCH STRICT ROAD OBSTRUCTIONS', JSON.stringify(failures.slice(0, 40)));
  }
  // Report *all* violations together. Fail closed, with the same geometric
  // threshold, but avoid correcting one wall per six-minute CI cycle.
  const obstructions = [];
  for (const prop of zone.props) {
    if (prop.roadTrace) continue; // Only explicitly flat road ruts / surface repairs may remain.
    const required = game.roadSetback(prop);
    const actual = game.distanceToRoad(zone, prop);
    if (actual + 0.01 < required)
      obstructions.push({
        id: prop.id,
        structure: prop.structure || prop.icon,
        x: Math.round(prop.x),
        y: Math.round(prop.y),
        actual: Math.round(actual),
        required,
      });
    inspected++;
  }
  assert.equal(
    obstructions.length,
    0,
    region.id +
      ' road obstructions (' +
      obstructions.length +
      '): ' +
      JSON.stringify(obstructions.slice(0, 100)),
  );
  for (const [id, settlementCenter, setback] of [
    ['rest', town, 190],
    ['minor', hamlet, 180],
    ['board', town, 95],
    ['supplier', town, 92],
    ['recruiter', town, 92],
  ]) {
    const npc = zone.npcs.find((n) => n.id === id);
    if (!npc) continue;
    assert(
      game.distanceToRoad(zone, npc) + 0.01 >= setback,
      region.id + ' ' + id + ' must stand beside a street, not in it',
    );
    // Preserve the already-merged dev.235 historical Greenwood exception.
    // The 2700-unit Orchard Hamlet has its old service at a valid, separate
    // authored location; do not impose the rejected 3200 parcel check.
    if (!(region.id === 'vale' && region.size === 2700 && id === 'minor'))
      assert(
        distance(npc, settlementCenter) < 460,
        region.id + ' ' + id + ' must remain in its neighborhood',
      );
    if (id === 'rest' || id === 'minor') {
      const size = region.size;
      assert(
        Math.min(npc.x, npc.y, size - npc.x, size - npc.y) >= 115,
        region.id + ' refuge artwork must fit within its world boundary',
      );
    }
  }
  // Reproduce pre-fix scene-composition service positions in an otherwise
  // current v4 save. Repair must survive native NPC refresh and two reloads.
  if (['highlands', 'frontier', 'crown'].includes(region.id)) {
    const historical = game.snapshot(),
      old = historical.zones[region.id];
    delete old.finalStreetClearanceVersion;
    const refuge = old.npcs.find((n) => n.id === 'rest');
    Object.assign(refuge, town);
    const priorGold = historical.hero.gold;
    const repaired = Campaign.restore(historical),
      fixed = repaired.zone();
    repaired.refreshNPCs();
    assert.equal(repaired.hero.gold, priorGold);
    assert.equal(fixed.finalStreetClearanceVersion, 1, region.id + ' final clearance completed');
    for (const [id, setback] of [
      ['rest', 190],
      ['minor', 180],
      ['board', 95],
      ['supplier', 92],
      ['recruiter', 92],
    ]) {
      const n = fixed.npcs.find((n) => n.id === id);
      assert(
        n && repaired.distanceToRoad(fixed, n) + 0.01 >= setback,
        region.id + ' refreshed service stays off the road: ' + id,
      );
    }
    const positions = fixed.npcs.map((n) => [n.id, n.x, n.y, n.servicePoint]);
    const again = Campaign.restore(repaired.snapshot());
    again.refreshNPCs();
    assert.deepEqual(
      again.zone().npcs.map((n) => [n.id, n.x, n.y, n.servicePoint]),
      positions,
      region.id + ' second restore retains exact service positions',
    );
  }
  const migrated = game.snapshot();
  const oldZone = migrated.zones[region.id];
  oldZone.roadVersion = 0;
  oldZone.settlementLayoutVersion = 3;
  oldZone.streetClearanceVersion = 0;
  const rest = oldZone.npcs.find((n) => n.id === 'rest');
  Object.assign(rest, town);
  oldZone.props.push({
    id: 'historical-cart-' + region.id,
    x: town.x + 10,
    y: town.y + 10,
    r: 0,
    decorative: true,
    structure: 'cart',
  });
  oldZone.buildings.push({
    id: 'historical-barracks-' + region.id,
    kind: 'barracks',
    x: town.x,
    y: town.y,
    progress: 4,
    queue: 0,
    queueType: null,
    full: true,
    upgradeProgress: 4,
    upgradePaid: true,
  });
  const originalGold = migrated.hero.gold;
  if (authoredVale) delete oldZone.greenwoodRedesignScene;
  const restored = Campaign.restore(migrated);
  const restoredZone = restored.zone();
  assert.equal(restored.hero.gold, originalGold, region.id + ' save currency');
  assert.equal(restoredZone.roadVersion, 17);
  assert.equal(restoredZone.settlementLayoutVersion, 4);
  if (authoredVale) assert.equal(restoredZone.greenwoodRedesignScene, Campaign.rules.greenwoodLayout.sceneVersion);
  else assert.equal(restoredZone.streetClearanceVersion, 3);
  const oldCart = restoredZone.props.find((p) => p.id === 'historical-cart-' + region.id);
  if (!authoredVale) {
    assert(oldCart, region.id + ' old scenery was preserved');
    assert(
    restored.distanceToRoad(restoredZone, oldCart) >= restored.roadSetback(oldCart),
    region.id + ' historical clutter moved off road',
    );
  } else assert(!oldCart, 'replacement discards temporary unowned scenery, preserving player construction below');
  const priorBarracks = restoredZone.buildings.find(
    (b) => b.id === 'historical-barracks-' + region.id,
  );
  assert(
    priorBarracks && priorBarracks.progress === 4 && priorBarracks.full,
    region.id + ' old barracks preserve construction/upgrades',
  );
  assert(
    restored.distanceToRoad(restoredZone, priorBarracks) >= 175,
    region.id + ' historical barracks moved off the street',
  );
  assert(
    restored.distanceToRoad(
      restoredZone,
      restoredZone.npcs.find((n) => n.id === 'rest'),
    ) >= 190,
    region.id + ' restored refuge not on the central avenue',
  );
}
const construction = new Campaign();
assert(construction.build(), 'a new barracks finds a viable plot away from Millhaven roads');
assert(
  construction.distanceToRoad(construction.zone(), construction.zone().buildings[0]) >= 175,
  'new construction cannot obstruct a planned road',
);
console.log(
  'PASS ' +
    regions.length +
    ' owner-baseline region plans and strict Vale roads, ' +
    routes +
    ' connected routes, ' +
    inspected +
    ' roadside props and historical save migration',
);
