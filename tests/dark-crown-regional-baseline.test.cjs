'use strict';
// Dark Crown overhaul Stage 0. Native Campaign/Canvas evidence, not a
// proposed art render, Pixi acceptance, physical-phone check, or lore change.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const Combat = require('../src/prototype/combat-visuals.js');

const root = path.join(__dirname, '..', 'test-artifacts', 'environment-708', 'dark-crown-707');
fs.mkdirSync(root, { recursive: true });
// Dedicated generated-evidence directory: never retain stale frames in a
// local rerun's new scene index or screenshot archive.
for (const filename of fs.readdirSync(root)) {
  if (filename.endsWith('.png') || filename === 'scene-index.json') {
    fs.unlinkSync(path.join(root, filename));
  }
}
// GitHub Actions often tests PRs at a synthetic merge SHA; record the actual
// feature-branch and base heads independently when the event file is present.
let prHeadSha = null;
let prBaseSha = null;
try {
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    prHeadSha = event.pull_request?.head?.sha || null;
    prBaseSha = event.pull_request?.base?.sha || null;
  }
} catch (error) {
  console.warn('Dark Crown provenance: event metadata unreadable:', error.message);
}
const rules = Campaign.rules;
assert.equal(Campaign.data.regions[4].id, 'crown', 'Keep the original fifth-region ID');
const crownSites = rules.sites[4];
assert.deepEqual(
  crownSites.filter(s => s[0].startsWith('bridge-')).map(s => s[0]).sort(),
  ['bridge-north', 'bridge-south'],
  'The two canonical volcanic crossing site IDs remain distinct',
);
assert(crownSites.some(s => s[0] === 'foundry' && s[2] === 1850 && s[3] === 2700),
  'Original Foundry arrival site is a protected baseline, not a new entrance');
const foundry = rules.sideDungeons.find(s => s.id === 'side-crown-foundry');
assert(foundry && foundry.region === 'crown' && foundry.site === 'foundry');
assert.equal(foundry.size, 1100, 'Foundry original internal floor envelope');
assert.equal(foundry.enemyCount, 14, 'Record current combat configuration; not station population');
assert.equal(rules.crownThermalWorksScenes.length, 15,
  'Existing heatworks are fifteen authored objects, not a proved pipe network');

// The Civic public hall must paint using the actual regional service, not a
// disconnected test-only art object. This verifies only a small Canvas gate.
const civic = new Campaign('normal', 'paladin', () => 0.73);
assert(civic.enter('crown'));
const rest = civic.zone().npcs.find(n => n.id === 'rest');
assert(rest && rest.kind === 'rest', 'The preexisting Crownwatch rest service remains interactive');
const hall = createCanvas(210, 180);
const savedBefore = JSON.stringify(civic.s);
Visuals.draw(hall.getContext('2d'), { ...rest, renderKind: 'npc' }, { x: 105, y: 142 }, 4);
const roof = hall.getContext('2d').getImageData(93, 76, 24, 22).data;
assert(roof.some((v, i) => i % 4 === 3 && v > 0),
  'Crownwatch civic-hall roof is painted above the former cottage silhouette');
assert.equal(JSON.stringify(civic.s), savedBefore, 'Painting a hall must not change game state');
const restoredCivic = Campaign.restore(civic.snapshot());
assert(restoredCivic.enter('crown'));
const restoredRest = restoredCivic.zone().npcs.find(n => n.id === 'rest');
assert(restoredRest);
assert.deepEqual([restoredRest.x, restoredRest.y], [rest.x, rest.y],
  'Original rest location and saved service identity must survive v4 restore');

// One reversible, service-relative civic composition is generated in the
// actual world, not just in a disconnected graphics fixture. Saved IDs and
// road polylines must remain stable on repeat generation and v4 restore.
const court = civic.zone().props.filter(p => p.crownCivicForecourt);
assert.equal(civic.zone().crownCivicForecourtVersion, 2,
  'Crown civic scenery has its own migration guard; original town layout is not bumped');
assert(court.length > 0 && court.length <= rules.crownCivicForecourt.length,
  'At least one authored forecourt detail must fit safely beside the real service');
assert(court.every(p => p.decorative && p.r === 0 &&
  Math.hypot(p.x - rest.x, p.y - rest.y) < 240),
  'No civic detail can create a blocking prop or scatter outside the local forecourt');
const ministry = civic.zone().props.find(p => p.id === 'settlement-major-2');
assert(ministry && ministry.structure === 'crown-ministry-frontage' &&
  ministry.crownPublicMinistry && !ministry.decorative,
  'The public ministry must reuse the actual historic nondecorative Crownwatch building');
// Data-only identity is not visual proof. The upper glazed office tower must
// paint in the real prop dispatch path, above the original house roofline.
const ministryCanvas = createCanvas(260, 220);
const ministryCtx = ministryCanvas.getContext('2d');
Visuals.draw(ministryCtx, { ...ministry, renderKind: 'prop' },
  { x: 130, y: 190 }, 4);
const ministryTower = ministryCtx.getImageData(110, 82, 40, 30).data;
assert(ministryTower.some((v, i) => i % 4 === 3 && v > 0),
  'The active ministry scene must render its elevated glazed civic frontage');
// The skyline changes only existing Crownwatch house artwork, never its
// foundation, save identity or road collision. Check actual zone residences
// and actual Canvas roofline pixels; a drawing code case alone is not proof.
const upperHouseIds = ['settlement-major-0', 'settlement-major-3', 'settlement-major-7'];
const upperHouses = upperHouseIds.map(id => civic.zone().props.find(p => p.id === id))
  .filter(Boolean);
assert(upperHouses.length >= 2,
  'At least two of the three selected real Crownwatch houses must exist');
assert(upperHouses.every(p => p.structure === 'crown-ash-house' && p.r === 32 &&
  p.roadBlocker && !p.decorative),
  'Occupied upper homes must preserve original collidable house definitions');
const roofSample = entity => {
  const canvas = createCanvas(240, 230);
  const ctx = canvas.getContext('2d');
  Visuals.draw(ctx, { ...entity, renderKind: 'prop' }, { x: 120, y: 200 }, 4);
  const pixels = ctx.getImageData(111, 117, 18, 13).data;
  return pixels.some((v, i) => i % 4 === 3 && v > 0);
};
const ordinaryHome = civic.zone().props.find(p => p.id === 'settlement-major-1');
assert(ordinaryHome && ordinaryHome.structure === 'crown-ash-house',
  'A neighboring conventional single-level home remains in Crownwatch');
assert(!roofSample(ordinaryHome),
  'Civic upper floors must not spread indiscriminately to every residence');
for (const home of upperHouses) {
  assert(roofSample(home), home.id + ' must paint a clearly taller inhabited roof');
  const savedHome = restoredCivic.zone().props.find(p => p.id === home.id);
  assert(savedHome && savedHome.structure === home.structure,
    home.id + ' survives old v4 save/restore with same normal house identity');
  assert.deepEqual([savedHome.x, savedHome.y, savedHome.r],
    [home.x, home.y, home.r], home.id + ' cannot move or grow its collision footprint');
}
const originalMinistry = [ministry.id, ministry.x, ministry.y, ministry.r];
const courtSnapshot = objects => objects.filter(p => p.crownCivicForecourt)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a, b) => a[0].localeCompare(b[0]));
const originalCourt = courtSnapshot(civic.zone().props);
const originalRoads = JSON.stringify(civic.zone().roads);
civic.crownCivicForecourt(civic.zone());
assert.deepEqual(courtSnapshot(civic.zone().props), originalCourt,
  'Civic one-time composition must not duplicate or move scenery');
assert.equal(JSON.stringify(civic.zone().roads), originalRoads,
  'Civic art must not alter established lava crossing approaches or local road geometry');
assert.deepEqual(courtSnapshot(restoredCivic.zone().props), originalCourt,
  'v4 save/restore must preserve exact authored civic scenery IDs and placements');
const restoredMinistry = restoredCivic.zone().props.find(p => p.id === 'settlement-major-2');
assert(restoredMinistry && restoredMinistry.structure === 'crown-ministry-frontage' &&
  restoredMinistry.crownPublicMinistry,
  'Old v4 saves retain the repurposed original ministry building identity');
assert.deepEqual(
  [restoredMinistry.id, restoredMinistry.x, restoredMinistry.y, restoredMinistry.r],
  originalMinistry, 'The actual public-office foundation must never move or resize on restore');
assert.equal(JSON.stringify(restoredCivic.zone().roads), originalRoads,
  'v4 restore must not change approved road geometry due to new civic art');

// Phase 3-4: local footpaths must preserve the historic roads/crossings.
assert.equal(civic.zone().crownIndustrialVersion, 1,
  'Industrial circulation is generated once, after the original Crown layout');
const industrial = civic.zone().crownIndustrialRoutes || [];
assert(industrial.length >= 1,
  'At least one real industrial aisle must be reachable; no data-only completion');
assert(industrial.length <= rules.crownIndustrialLinks.length,
  'Only authored, validated local service links may be added');
assert(industrial.every(link => link.from.startsWith('recovery-heat-crown-') &&
  (link.to.startsWith('recovery-heat-crown-') || link.to === 'foundry')),
  'Freight paths reference only actual heatwork props and the original Foundry entrance');
assert(industrial.some(link => link.roadConnected),
  'At least one local industry corridor must tie into an original carriageway');
const freight = civic.zone().props.filter(p => p.crownIndustrialFreight);
assert.equal(civic.zone().crownIndustrialFreightVersion, 2,
  'Industrial staging has a separate once-only v4 migration guard');
assert(freight.length >= 1 && freight.length <= rules.crownIndustrialFreight.length,
  'Real heatwork sites must stage at least one visible receiving/cooling/dispatch scene');
assert(freight.every(p => p.crownFoundryExterior !== true),
  'Regional freight dressing must not impersonate the three original Foundry gate props');
assert.deepEqual(
  freight.filter(p => p.industrialRole.startsWith('crystal-')).map(p => p.industrialRole),
  ['crystal-sorting', 'crystal-storage', 'crystal-dispatch'],
  'Crystal Deposit must actually place all three freight stages',
);
assert(freight.every(p => p.r === 0 && p.decorative &&
  p.id.startsWith('crown-industrial-freight-') &&
  rules.crownIndustrialFreight.some(([role, anchor]) => {
    const source = typeof anchor === 'number'
      ? civic.zone().props.find(q => q.id === 'recovery-heat-crown-' + anchor)
      : civic.zone().npcs.find(q => q.id === anchor);
    return role === p.industrialRole && source && Math.hypot(source.x - p.x, source.y - p.y) < 320;
  })),
  'Real-site freight must remain nonblocking and anchored to production or deposit sites');
const freightPositions = c => c.zone().props.filter(p => p.crownIndustrialFreight)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a,b) => a[0].localeCompare(b[0]));
assert.deepEqual(freightPositions(restoredCivic), freightPositions(civic),
  'v4 saves preserve industrial staging identity and positions');
// Existing Foundry approach decorations are re-used in situ. Keep site
// and historical side-entrance-N IDs; never create a second dungeon gate.
const foundryGate = civic.zone().npcs.find(n => n.id === 'foundry');
assert(foundryGate && foundryGate.kind === 'dungeon');
const exterior = civic.zone().props.filter(p => p.crownFoundryExterior)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a, b) => a[0].localeCompare(b[0]));
assert(exterior.length > 0 && exterior.length <= 3,
  'Real old Foundry entrance props must show maintained production logistics');
assert(exterior.every(p => p[0].startsWith('side-entrance-side-crown-foundry-')),
  'Original Foundry exterior prop IDs survive the art upgrade');
assert.deepEqual(restoredCivic.zone().props.filter(p => p.crownFoundryExterior)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a, b) => a[0].localeCompare(b[0])),
  exterior, 'Historical v4 exterior positions survive the factory facade migration');

const originalIndustrialPaths = JSON.stringify(civic.zone().footpaths);
civic.crownIndustrialCirculation(civic.zone());
assert.equal(JSON.stringify(civic.zone().footpaths), originalIndustrialPaths,
  'Repeat generation cannot add industrial route duplicates');
assert.equal(JSON.stringify(civic.zone().roads), originalRoads,
  'Connecting industry cannot revise original roads or lava bridges');

// Foundry production equipment must remain scenery separate from every
// original hostile actor and four real traps; no invented product or quest.
assert.deepEqual(foundry.decor.slice(7, 9).map(p => p[2]),
  ['crown-foundry-cooling-rack', 'crown-foundry-stock-bay'],
  'Historical roost and bone dressing now function as maintained facilities');
const workRoom = new Campaign('normal', 'paladin', () => 0.73);
assert(workRoom.enter('side-crown-foundry'));
const factory = workRoom.zone();
const stations = factory.props.filter(p => p.crownFoundryEquipment);
assert.equal(factory.crownFoundryProductionVersion, 2,
  'Foundry workstations have their own once-only migration');
assert(stations.length >= 3 && stations.length <= rules.crownFoundryStations.length,
  'A productive floor needs multiple actually generated safe work stations');
assert(stations.every(p => p.decorative && p.r === 0 &&
  p.id.startsWith('crown-foundry-work-')),
  'Equipment scenes cannot become new collision obstacles or enemy actors');
const trapLocations = foundry.traps.map(([x, y]) => ({ x, y }));
assert(stations.every(p => trapLocations.every(t => Math.hypot(p.x - t.x, p.y - t.y) >= 105)),
  'Equipments cannot stand inside preserved trap clearance');
const foundryPositions = () => factory.props.filter(p => p.crownFoundryEquipment)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a, b) => a[0].localeCompare(b[0]));
const firstShift = foundryPositions();
const guardSnapshot = factory.enemies.map(e => [e.id, e.x, e.y, e.hp]).sort();
const columnSnapshot = factory.props.filter(p => p.id.startsWith('side-wall-'))
  .map(p => [p.id, p.x, p.y, p.r]).sort();
const originalTraps = JSON.stringify(foundry.traps);
workRoom.crownFoundryProduction(factory);
assert.deepEqual(foundryPositions(), firstShift,
  'Repeated Foundry work migration cannot move or duplicate stations');
assert.deepEqual(factory.enemies.map(e => [e.id, e.x, e.y, e.hp]).sort(), guardSnapshot,
  'Equipments must never replace an enemy or change a hostile spawn');
assert.deepEqual(factory.props.filter(p => p.id.startsWith('side-wall-'))
  .map(p => [p.id, p.x, p.y, p.r]).sort(), columnSnapshot);
assert.equal(JSON.stringify(foundry.traps), originalTraps);
const restoredWork = Campaign.restore(workRoom.snapshot());
assert(restoredWork.enter('side-crown-foundry'));
assert.deepEqual(restoredWork.zone().props.filter(p => p.crownFoundryEquipment)
  .map(p => [p.id, p.structure, p.x, p.y]).sort((a, b) => a[0].localeCompare(b[0])),
  firstShift, 'Old v4 save schema retains production identities and coordinates');
assert.deepEqual(restoredWork.zone().enemies.map(e => [e.id, e.x, e.y, e.hp]).sort(),
  guardSnapshot, 'All hostile entities survive Foundry save/restore');

// Interior fixtures and the shipping gantry remain visually static.
for (const fixture of [
  ...stations,
  { id: 'shipping-gantry', structure: 'crown-foundry-yard-shipping' },
]) {
  function equipmentFrame(time) {
    const canvas = createCanvas(200, 170);
    Visuals.draw(canvas.getContext('2d'), { ...fixture, renderKind: 'prop',
      ambientTime: time }, { x: 96, y: 125 }, 4);
    return canvas.toBuffer('image/png');
  }
  assert.deepEqual(equipmentFrame(0), equipmentFrame(1.1),
    fixture.id + ' must remain static at distinct presentation times');
}

const candidates = [
  // First-visit city, home, heat, freight, geology, crossings and regime.
  ['arrival', 'crown', 690, 430, 245],
  ['ridge-skyline', 'crown', 1040, 240, 245],
  ['civic-court', 'crown', 600, 700, 245],
  ['civic-hall-frontage', 'crown', 600, 550, 245],
  ['courtyard-housing-baseline', 'crown', 720, 900, 245],
  ['ash-refuge', 'crown', 1030, 1840, 245],
  ['east-heat-intake', 'crown', 2770, 710, 245],
  ['west-glassworks', 'crown', 2290, 2130, 245],
  ['bridge-north', 'crown', 1350, 1000, 245],
  ['bridge-south', 'crown', 1350, 2400, 245],
  ['market-freight', 'crown', 850, 1400, 245],
  ['foundry-exterior', 'crown', 1850, 2700, 245],
  ['cindermaw-ministry', 'crown', 740, 520, 245],
  ['cindermaw-den', 'crown', 2580, 1900, 245],
  ['crystal-dispatch', 'crown', 1250, 2350, 245],
  ['orrery', 'crown', 1850, 3150, 245],
  ['fortress-logistics', 'crown', 3060, 3040, 245],
  // First pass at the waterworks and natural habitats. These remain
  // camera reconnaissance, separate from native route verification.
  ['public-bathhouse', 'crown', 1099, 735, 245],
  ['public-bathhouse-night', 'crown', 1099, 735, 480],
  ['ash-refuge-island', 'crown', 365, 2010, 245],
  ['southwest-island', 'crown', 710, 3120, 245],
  ['southern-fold-island', 'crown', 1770, 3410, 245],
  // Night variants: civilian comfort, industrial heat, official control.
  ['civic-night', 'crown', 600, 700, 480],
  ['heatworks-night', 'crown', 2770, 710, 480],
  ['fortress-night', 'crown', 3060, 3040, 480],
  // Interior production and circulation are not yet aesthetically accepted.
  ['foundry-entry', 'side-crown-foundry', 330, 260, 245],
  ['foundry-workfloor', 'side-crown-foundry', 745, 755, 245],
  ['foundry-receiving', 'side-crown-foundry', 285, 200, 245],
  ['foundry-forming', 'side-crown-foundry', 595, 260, 245],
  ['foundry-finishing', 'side-crown-foundry', 915, 515, 245],
  ['foundry-dispatch', 'side-crown-foundry', 895, 875, 245],
  ['citadel-academy', 'citadel', 630, 955, 245],
  ['cindermaw-treasury', 'supply-crown', 535, 350, 245],
];
// Bind camera reconnaissance to the REAL saved/generation identities where
// they exist. Nominal master-plan coordinates can miss the safely displaced
// actual industrial yard; a filename must never masquerade as visual proof.
// Offset the player camera from stations/props so the hero does not hide them.
const cameraAnchors = new Map([
  ['civic-hall-frontage', ['npcs', 'rest', 0, 0, true]],
  ['ridge-skyline', ['npcs', 'rest', 210, -90, true]],
  ['cindermaw-ministry', ['props', 'settlement-major-2', 60, 55, true]],
  ['ash-refuge', ['npcs', 'minor', 0, 0, true]],
  ['east-heat-intake', ['props', 'recovery-heat-crown-0', 65, 60, false]],
  ['west-glassworks', ['props', 'recovery-heat-crown-7', 65, 60, false]],
  ['bridge-north', ['npcs', 'bridge-north', 0, 0, true]],
  ['bridge-south', ['npcs', 'bridge-south', 0, 0, true]],
  ['foundry-exterior', ['npcs', 'foundry', 65, 55, true]],
  ['crystal-dispatch', ['props', 'crown-industrial-freight-crystal-dispatch', -20, -85, true]],
  ['heatworks-night', ['props', 'recovery-heat-crown-0', 65, 60, false]],
  ['foundry-receiving', ['props', 'crown-foundry-work-receiving', 65, 45, true]],
  ['foundry-forming', ['props', 'crown-foundry-work-forming', 65, 45, true]],
  ['foundry-finishing', ['props', 'crown-foundry-work-finishing', 65, 45, true]],
  ['foundry-dispatch', ['props', 'crown-foundry-work-dispatch', 65, 45, true]],
]);
const records = [];
for (const [label, zoneId, x, y, clock] of candidates) {
  const game = new Campaign('normal', 'paladin', () => 0.73);
  assert(game.enter(zoneId), 'Existing zone is enterable: ' + zoneId);
  const zone = game.zone();
  game.s.clock = clock;
  // Collision-safe teleport for CAMERA RECONNAISSANCE only. It does not
  // demonstrate that a player can reach this point through normal gameplay.
  const spec = cameraAnchors.get(label);
  const anchored = spec && zone[spec[0]]?.find(entity => entity.id === spec[1]);
  if (spec?.[4])
    assert(anchored, 'Required actual visual landmark is missing: ' + label);
  if (spec && !anchored)
    console.warn('UNPLACED camera subject: ' + label + ' (' + spec[1] + ')');
  const cameraTarget = anchored
    ? { x: anchored.x + spec[2], y: anchored.y + spec[3] } : { x, y };
  const safe = game.safe(cameraTarget.x, cameraTarget.y, zoneId);
  assert(safe && Number.isFinite(safe.x) && Number.isFinite(safe.y),
    'Native collision-safe photographic camera point: ' + label);
  if (anchored)
    assert(Math.hypot(safe.x - anchored.x, safe.y - anchored.y) <= 240,
      'A grounded landmark cannot be outside its own camera neighborhood: ' + label);
  Object.assign(game.hero, safe);
  for (const [viewport, width, height] of [['desktop', 880, 560], ['phone-800', 800, 375], ['phone-844', 844, 390]]) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const before = JSON.stringify(game.s);
    const painter = Renderer.create({
      canvas: { width, height }, ctx, getGame: () => game,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: (w, h) => ({ x: w * 0.56, y: h * 0.52 }),
      },
      Campaign, PrototypeVisuals: Visuals, PrototypeCombatVisuals: Combat,
      chargePresentation: () => null, isPaused: () => false, now: () => 16000,
    });
    painter.setOptimizationMode(false);
    painter.draw();
    assert.equal(JSON.stringify(game.s), before,
      'Native screenshot render must never mutate gameplay/save: ' + label);
    const bytes = canvas.toBuffer('image/png');
    assert(bytes.length > 5000, 'Real scene should paint at ' + label + '/' + viewport);
    const filename = label + '-' + viewport + '.png';
    fs.writeFileSync(path.join(root, filename), bytes);
    const nearby = objects => (objects || []).filter(o =>
      Number.isFinite(o.x) && Number.isFinite(o.y) &&
      Math.hypot(o.x - safe.x, o.y - safe.y) <= 430);
    records.push({
      label, zoneId, viewport, width, height, zoom: 1.5, clock,
      requestedFocus: [x, y], actualCamera: [safe.x, safe.y],
      actualFeatureAnchorId: anchored?.id || null,
      actualFeatureAnchor: anchored ? [anchored.x, anchored.y] : null,
      requestedFeatureAnchorId: spec?.[1] || null,
      plannedFeatureMissing: !!spec && !anchored,
      featureDistanceFromCamera: anchored
        ? Math.round(Math.hypot(anchored.x - safe.x, anchored.y - safe.y)) : null,
      viewNameIsIntentNotVerifiedLandmark: true,
      traversedToView: false, compositionReviewedByTest: false,
      focusDisplacement: Math.round(Math.hypot(x - safe.x, y - safe.y)),
      nearbyProps: nearby(zone.props).length,
      nearbyNpcs: nearby(zone.npcs).map(n => n.id),
      nearbyEnemies: nearby(zone.enemies.filter(e => e.hp > 0)).length,
      pngBytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      renderer: 'native Canvas2D', phoneScaleOnly: viewport.startsWith('phone-'),
    });
  }
}
assert.equal(records.length, candidates.length * 3);

const room = new Campaign('normal', 'paladin', () => 0.73);
assert(room.enter('side-crown-foundry'));
const existing = room.zone();
const enemyIds = existing.enemies.map(e => e.id).sort();
const wallIds = existing.props.filter(p => p.id.startsWith('side-wall-')).map(p => p.id).sort();
assert.equal(wallIds.length, foundry.walls.length, 'Preserve current Foundry collision columns');
const restored = Campaign.restore(room.snapshot());
assert(restored.enter('side-crown-foundry'));
assert.deepEqual(restored.zone().enemies.map(e => e.id).sort(), enemyIds,
  'Original interior enemy identities survive save/restore');
assert.deepEqual(restored.zone().props.filter(p => p.id.startsWith('side-wall-'))
  .map(p => p.id).sort(), wallIds, 'Original Foundry obstacles survive save/restore');

fs.writeFileSync(path.join(root, 'scene-index.json'), JSON.stringify({
  source: 'Dark Crown PR #707; actual game Campaign and Canvas2D code',
  status: 'Unverified current-draft scene viewpoints. Real feature IDs ground selected cameras; neither proximity nor a filename certifies visible composition or final art approval',
  pixelDeterminismVerified: false,
  pngSha256Meaning: 'per-run evidence integrity only; do not use as a cross-run pixel equality assertion',
  provenance: {
    githubCheckoutSha: process.env.GITHUB_SHA || null,
    githubPrHeadSha: prHeadSha,
    githubPrBaseSha: prBaseSha,
    githubWorkflowRunId: process.env.GITHUB_RUN_ID || null,
    localRunWithoutCiMetadata: !process.env.GITHUB_SHA,
  },
  captureMethod: 'collision-safe subject-relative hero camera where authorial feature ID exists, fallback to nominal survey where missing; fixed RNG and clock, native Canvas2D at 150%, no pixel identity, player traversal, Pixi, image-content assertion or physical phone',
  regionSourceId: 'crown', foundrySourceId: 'side-crown-foundry',
  scenes: candidates.length, captures: records.length, records,
}, null, 2) + '\n');
console.log('PASS Dark Crown Stage 0: ' + candidates.length +
  ' Canvas2D candidate camera positions x 3 viewports, Foundry ID/walls/enemies preserved');
