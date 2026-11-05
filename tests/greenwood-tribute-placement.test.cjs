'use strict';
// Focused Greenwood-only audit: presence is not proof of a usable resource.
// Exercise native blocked(), route(), scout and worker extraction; no mock paths.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Diagnostic provenance for the current code on the CI runner, so current
// sprite-scope evidence can be reconciled without a cross-region art change.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
console.log('Greenwood review source SHA256:', JSON.stringify(Object.fromEntries(
  ['visuals.js', 'world.js', 'rules.js'].map((name) => {
    const file = path.resolve(__dirname, '../src/prototype', name);
    return ['src/prototype/' + name,
      crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')];
  }),
)));
const plans = [
  ['orchard-stores', 'orchard', 170, false],
  ['woodland-cache', 'goblin-camp', 180, false],
  ['pond-strongbox', 'mill-pond', 150, true],
  ['bridge-toll', 'bridge-north', 140, true],
];
const game = () => {
  const g = new C('normal', 'paladin', () => 0.73);
  g.enter('vale');
  g.s.expeditionRank = 2;
  g.s.mercyTime = 0;
  return g;
};
function audit(g, expected, label) {
  const z = g.zone();
  assert.equal(z.id, 'vale');
  assert.equal(z.nodes.length, 4, label + ': exactly four finite sources');
  const ids = z.nodes.map(n => n.id);
  assert.equal(new Set(ids).size, 4, label + ': no duplicate tribute IDs');
  let sum = 0;
  for (const [id, site, cap, hidden] of plans) {
    const n = z.nodes.find(x => x.id === 'tribute-vale-' + id);
    assert(n, label + ': missing resource ' + id);
    assert.equal(n.site, site, label + ': resource site ' + id);
    assert.equal(n.hidden, hidden, label + ': hidden status ' + id);
    assert.equal(n.tribute, true, label + ': real gatherable tribute ' + id);
    const landmark = z.npcs.find(x => x.id === site);
    assert(landmark, label + ': source has a real world landmark ' + id);
    const siteRadius = id === 'bridge-toll' ? 400 :
      id === 'orchard-stores' ? 360 : id === 'woodland-cache' ? 160 : 280;
    assert(dist(n, landmark) < siteRadius,
      label + ': source remains near its landmark, not displaced by construction ' + id);
    assert(n.amount >= 0 && n.amount <= cap, label + ': finite amount ' + id);
    assert(Number.isFinite(n.x) && Number.isFinite(n.y), label + ': finite coordinates ' + id);
    assert(!g.blocked(n.x, n.y, 'vale', 15), label + ': physically clear ' + id);
    const route = g.route(g.hero, n);
    assert(route.length > 0, label + ': reachable from regional arrival ' + id);
    assert(dist(route.at(-1), n) <= 1, label + ': path reaches *actual* deposit, not snapped proxy ' + id);
    if (hidden) assert(!g.tributeKnown(n), label + ': concealed before scouting ' + id);
    sum += n.amount;
  }
  assert.equal(sum, expected, label + ': finite total crowns retained');
  const fort = z.npcs.find(n => n.id === 'goblin-camp');
  const goblin = z.nodes.find(n => n.id === 'tribute-vale-woodland-cache');
  assert(dist(fort, goblin) < 160, label + ': guarded tribute stays inside stockade');
  const stronghold = C.rules.creatureStrongholds.find(x => x.id === 'goblin-road-fort');
  const defendedCenter = g.creatureStrongholdCenter(z, stronghold);
  assert(dist(defendedCenter, goblin) < 150,
    label + ': the original 180-crown reward is physically inside the Goblin fort perimeter');
  const depot = z.npcs.find(n => n.id === 'cache');
  const crypt = z.npcs.find(n => n.id === 'entrance');
  assert.equal(depot.name, "Scornfang's Supply Depot");
  assert.match(g.siteDescription(depot), /manifest lists the two guarded supply caches/i,
    label + ': depot explains its real freight/quest purpose');
  assert(!z.nodes.some(n => n.site === 'cache'),
    label + ': depot is not falsely advertised as another tribute source');
  assert(dist(depot, crypt) < 400, label + ': supply depot near Crypt');
  assert(dist(depot, goblin) > 1000, label + ': landmark and Goblin tribute are separate');
  assert(!g.blocked(depot.x, depot.y, 'vale', 15), label + ': depot landmark clear');
  const depotRoute = g.route(crypt, depot);
  assert(depotRoute.length && dist(depotRoute.at(-1), depot) < 1,
    label + ': Crypt-to-depot freight approach reaches the actual landmark');
  return z;
}
const initial = game();
audit(initial, 640, 'fresh');
const historical = initial.snapshot();
delete historical.zones.vale.tributeFortPlacementVersion;
delete historical.zones.vale.greenwoodFreightDepotVersion;
const amounts = [48, 57, 31, 0];
plans.forEach(([id], j) => {
  const n = historical.zones.vale.nodes.find(n => n.id === 'tribute-vale-' + id);
  n.amount = amounts[j];
});
const goblinPrior = historical.zones.vale.nodes.find(n => n.id === 'tribute-vale-woodland-cache');
Object.assign(goblinPrior, { site: 'cache', x: 2470, y: 1440, siteName: 'Woodland supply cache' });
const depotPrior = historical.zones.vale.npcs.find(n => n.id === 'cache');
Object.assign(depotPrior, { x: 2420, y: 1690, name: 'Woodland supply cache' });
const recovered = C.restore(historical, () => 0.73);
audit(recovered, amounts.reduce((a,b)=>a+b,0), 'restored partially depleted v4');
plans.forEach(([id], j) => assert.equal(
  recovered.zone().nodes.find(n => n.id === 'tribute-vale-' + id).amount,
  amounts[j], 'restored amount ' + id));
assert.deepEqual(
  C.restore(recovered.snapshot(), () => 0.73).snapshot(),
  recovered.snapshot(), 'second reload does not regenerate or reposition any resource');
// Reconstruct real pre-rebuild v4 layouts in isolated child processes.
// They use old cache-site coordinates and old Greenwood projection, rather
// than pretending a current 3200 save is historical.
const cp = require('node:child_process');
for (const legacy of ['original2700', 'expanded3200']) {
  const script = `
    const f = require('./tools/greenwood-layout/fixtures.cjs');
    const C = f.loadRuntime(${legacy === 'expanded3200' ? 3200 : 2700},
      ${legacy === 'expanded3200'});
    const source = C.rules.tributePlans.vale.find(p => p.id === 'woodland-cache');
    Object.assign(source, { site: 'cache', offset: [50, -250], context: 'collector cache' });
    const g = new C('normal', 'paladin', f.rng(0x47564102));
    g.zone();
    const z = g.s.zones.vale;
    for (const n of z.nodes) {
      if (n.tributeId === 'woodland-cache') n.amount = 59;
      if (n.tributeId === 'pond-strongbox') n.amount = 27;
      if (n.tributeId === 'bridge-toll') n.amount = 0;
    }
    process.stdout.write(JSON.stringify(g.snapshot()));
  `;
  const raw = JSON.parse(cp.execFileSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 12 * 1024 * 1024,
  }));
  const before = JSON.stringify(raw);
  const migrated = C.restore(raw, () => 0.73);
  assert.equal(JSON.stringify(raw), before, legacy + ': imported save not mutated');
  audit(migrated, 256, legacy + ' -> rebuilt');
  assert.equal(migrated.zone().greenwoodSourceVersion, 2);
  const first = migrated.snapshot();
  assert.deepEqual(C.restore(first, () => 0.73).snapshot(), first,
    legacy + ': second reload preserves all migrated coordinates and balances');
}
// Actual harvest mechanics, in live collision geometry but isolated from combat;
// no synthetic change to node amount until the actual gathering tick.
for (const [id] of plans) {
  const g = game(), z = g.zone(), n = z.nodes.find(n => n.id === 'tribute-vale-' + id);
  if (n.hidden) {
    assert(g.scoutTribute(n.id), 'scouts can reveal ' + id);
    assert(g.tributeKnown(n), 'scouting actually uncovers ' + id);
  }
  z.enemies = []; // Isolate resource extraction from independent encounter AI.
  const worker = g.unit('soldier', n.x, n.y);
  g.s.party = [worker];
  const before = n.amount;
  assert(g.gather(n.id), 'valid native gathering order ' + id);
  g.s.time += 0.1;
  g.updateParty(0.1);
  assert(n.amount < before, 'real worker harvest removes finite tribute ' + id);
  assert(worker.carry > 0, 'worker physically carries extracted tribute ' + id);
}
// Prove the physical worker can *walk* from the region's actual arrival to
// every real source, not merely spawn at a node and harvest there. Hostile
// encounters are independently excluded; terrain, roads and movement are real.
for (const [id] of plans) {
  const g = game(), z = g.zone();
  const n = z.nodes.find(n => n.id === 'tribute-vale-' + id);
  if (n.hidden) {
    assert(g.scoutTribute(n.id), id + ': scouting unlocks real assignment');
  }
  z.enemies = [];
  const worker = g.unit('soldier', g.hero.x, g.hero.y);
  g.s.party = [worker];
  const initialAmount = n.amount;
  assert(g.gather(n.id), id + ': worker accepts actual expedition order');
  let harvested = false;
  for (let tick = 0; tick < 650 && !harvested; tick++) {
    g.s.time += 0.1;
    g.updateParty(0.1);
    harvested = n.amount < initialAmount;
  }
  assert(harvested, id + ': assigned worker reaches and harvests the actual deposit');
  assert(worker.carry > 0, id + ': physically travelled worker carries tribute');
}

console.log('PASS Greenwood four actual deposits: native collision and end-to-end route, 640 finite crowns, concealed scouting, live worker harvest, Goblin placement, Crypt depot, depleted old-save migration and repeated reload');
