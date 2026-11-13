'use strict';
// Current-source showroom census: deterministic world instances, no playthrough,
// persistence, renderer screenshot generation or game data mutation on disk.
const Campaign = require('../src/prototype/engine.js');
const Sprites = require('../src/prototype/sprites.js');
const fields = new Set([
  'id','name','icon','renderKind','kind','type','class','species','family',
  'structure','decorative','visualScale','scale','form','crowned','crownTroop',
  'crownUtility','crownPublicMinistry','crownLineage','mountedCrownRider',
  'crownRole','crownRank','crownState','crownBanner','tier','level','guard',
  'captain','roomCaptain','fieldCaptain','captainProfile','ranged','hybrid',
  'ringleader','rangedAim','weapon','weaponKind','loadout','element','color',
  'hp','maxHp','progress','full','construction','workstation','presentation',
  'sceneRole','greenwoodNature','greenwoodFacility','greenwoodWall',
  'greenwoodInteriorAsset','highlandsNature','miningFacility','treasuryBoss',
  'room','regionalDistrict','settlementRole','home','open','restored',
  'rescued','charmOrigin','masterId','masterGroup','service','role',
  'petFamily','petType','petState','petTier','petElement','state','r',
  'owner','facing','direction','daylight','occupation','guild','alignment',
]);
const regionNames = ['Greenwood Vale', 'Flooded Marches', 'Ironroot Highlands',
  'Ashen Frontier', 'Dark Crown'];
const regionIds = ['vale', 'march', 'highlands', 'frontier', 'crown'];
const clean = (name) => String(name || 'default').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 88) || 'default';
const human = (name) => String(name || 'Visual').replace(/[:_-]+/g, ' ')
  .replace(/\b[a-z]/g, (c) => c.toUpperCase());
function snapshot(entity, renderKind) {
  const out = {};
  for (const [key, value] of Object.entries(entity || {}))
    if (fields.has(key) && (value == null || typeof value === 'string' ||
      typeof value === 'boolean' || typeof value === 'number' ||
      (typeof value === 'object' && ['charmOrigin','home','loadout'].includes(key))))
      out[key] = value;
  out.renderKind = entity.renderKind || renderKind;
  out.x = 600; out.y = 600;
  // Retain stable source identity where the painter uses ID-hash variants.
  out.id = String(entity.id || entity.name || 'showroom-' + renderKind).slice(0, 140);
  return out;
}
function labelFor(entity, kind) {
  return entity.name || entity.structure || entity.species || entity.family ||
    entity.kind || entity.type || kind;
}
function trackIdentity(entity, region, zone, kind, protectedKeys) {
  // Gameplay sceneRole/presentation can intentionally suppress sprite lookup.
  // They do not make a visually identical generic crate, rack or table into
  // another artwork. Normalize unregistered shared props BEFORE candidateKeys
  // so both scene-role and ordinary instances resolve to the same art card.
  // Exact registered/contracted identities remain protected from folding.
  const genericProp = entity.renderKind === 'prop' && entity.structure &&
    !entity.greenwoodNature && !entity.highlandsNature &&
    !entity.greenwoodFacility && !entity.greenwoodInteriorAsset &&
    !entity.greenwoodWall && !entity.miningFacility;
  if (genericProp) {
    const structure = clean(entity.structure);
    const isProtectedArtwork = [...protectedKeys].some((key) =>
      key.startsWith('prop:' + structure + ':'));
    if (!isProtectedArtwork)
      return 'shared:prop:' + structure +
        (entity.form ? ':' + clean(entity.form) : '');
  }
  const candidate = Sprites.candidateKeys(entity, region)[0];
  if (candidate && !candidate.startsWith('landmark:')) {
    // Retain exact keys if sprite-registered or explicitly prepared in
    // production. They may have independently approved regional identities.
    if (protectedKeys.has(candidate)) return candidate;
    // Unregistered generic props previously became separate cards solely
    // because sprite lookup constructs a different region-key per region.
    // The procedural painter may still use the region as a selectable state.
    if (entity.renderKind === 'prop' &&
        !entity.greenwoodNature && !entity.highlandsNature &&
        !entity.greenwoodFacility && !entity.greenwoodInteriorAsset &&
        !entity.greenwoodWall && !entity.miningFacility) {
      return 'shared:prop:' + clean(entity.structure || entity.name ||
        entity.icon || 'wild') + (entity.form ? ':' + clean(entity.form) : '');
    }
    if (entity.renderKind === 'npc' && candidate.startsWith('npc:')) {
      return 'shared:npc:' + clean(entity.name || entity.id || entity.kind || 'resident') +
        ':' + clean(entity.kind || 'resident');
    }
    return candidate;
  }
  // A shared drawing is one asset with selectable regional states, not five
  // copies of "Barrel" or "Crate" solely because it spawns in five regions.
  // Named people retain their own identity even if they offer the same service.
  const actor = (entity.renderKind || kind) === 'npc';
  const visualName = actor
    ? (entity.name || entity.id || entity.kind || kind)
    : (entity.structure || entity.species || entity.family ||
      entity.greenwoodNature || entity.highlandsNature ||
      entity.greenwoodFacility || entity.greenwoodInteriorAsset ||
      entity.miningFacility || entity.kind || entity.type || entity.name || kind);
  const semantic = [
    entity.renderKind || kind,
    visualName,
    (entity.renderKind === 'prop' ? ''
      : entity.sceneRole || entity.captainProfile || entity.masterId || ''),
    entity.form || '',
    entity.crowned ? 'crowned' : '',
    entity.ranged ? 'ranged' : '',
    entity.guard ? 'guard' : '',
    entity.captain ? 'captain' : '',
    entity.full ? 'full' : '',
  ].filter(Boolean).map(clean);
  return 'world:' + semantic.join(':');
}
function census(options = {}) {
  const protectedKeys = new Set(options.protectedKeys || []);
  const areas = [...new Set([
    ...Campaign.data.regions.map((r) => r.id),
    ...Object.keys(Campaign.rules.dungeonArchitecture),
    ...Campaign.rules.sideDungeons.map((r) => r.id),
    ...Object.keys(Campaign.rules.treasuryWalls),
  ])];
  const rows = new Map();
  let observedInstances = 0;
  for (const randomValue of [0.1, 0.9]) {
    const game = new Campaign('normal', 'paladin', () => randomValue);
    for (const area of areas) {
      game.enter(area);
      const region = game.regionIndex();
      const zone = game.zone();
      for (const [collection, inferred] of [
        ['props','prop'], ['enemies','enemy'], ['npcs','npc'],
        ['nodes','node'], ['buildings','building'],
      ]) {
        for (const entity of zone[collection] || []) {
          if (!entity || typeof entity !== 'object') continue;
          const visual = snapshot(entity, inferred);
          const id = trackIdentity(visual, region, area, inferred, protectedKeys);
          const selected = Sprites.definitionFor(visual, region);
          observedInstances++;
          const existing = rows.get(id);
          if (existing) {
            // One artwork identity can appear in several authored areas.
            // Keep each location browseable without duplicating the art card.
            if (!existing.areas.includes(area)) existing.areas.push(area);
            if (!existing.regions.includes(regionNames[region]))
              existing.regions.push(regionNames[region]);
            const newRegion = !existing.states.some((s) => s.region === region);
            if ((newRegion || existing.states.length < 10) &&
                !existing.states.some((s) => s.area === area)) {
              existing.states.push({
                label: 'Observed world fixture · ' + human(area),
                entity: visual, region, area,
              });
            }
            if (visual.name && !existing.aliases.includes(visual.name))
              existing.aliases.push(visual.name);
            continue;
          }
          rows.set(id, {
            id,
            name: human(labelFor(visual, inferred)),
            group: ['hero','ally','enemy','npc','pet','boss'].includes(visual.renderKind) ? 'Characters'
              : visual.renderKind === 'building' ? 'Buildings & services'
              : visual.renderKind === 'npc' && ['rest','shop','smith','teacher','transport'].includes(visual.kind)
                ? 'Buildings & services' : 'World & scenery',
            region: regionNames[region] || human(area),
            regionIndex: region,
            areas: [area], regions: [regionNames[region] || human(area)],
            aliases: visual.name ? [visual.name] : [],
            sourceKind: 'current-world-fixture',
            catalogId: null,
            states: [{ label: 'Observed world fixture · ' + human(area),
              entity: visual, region, area }],
            representation: selected ? 'raster' : 'procedural',
            activeSpriteKey: selected?.key || null,
            activeRaster: selected?.entry?.src || null,
            referenceDate: null,
          });
        }
      }
    }
  }
  // New playable hero classes must not disappear merely because the October
  // historical art review predates their introduction.
  for (const heroClass of ['paladin', 'mage', 'ranger', 'rogue']) {
    const id = 'hero:' + heroClass;
    const entity = { id: 'showroom-' + heroClass, renderKind: 'hero',
      class: heroClass, name: human(heroClass), visualScale: 1 };
    const selected = Sprites.definitionFor(entity, 0);
    rows.set(id, {
      id, name: human(heroClass), group: 'Characters',
      region: regionNames[0], regionIndex: 0, areas: [],
      regions: [regionNames[0]], aliases: [],
      sourceKind: 'current-hero-fixture', catalogId: null,
      states: [{ label: 'Current playable hero', entity, region: 0 }],
      representation: selected ? 'raster' : 'procedural',
      activeSpriteKey: selected?.key || null,
      activeRaster: selected?.entry?.src || null,
      referenceDate: null,
    });
  }
  return { areas, observedInstances, rows: [...rows.values()] };
}
module.exports = { census };
if (require.main === module) {
  const result = census();
  console.log(JSON.stringify({
    areas: result.areas.length,
    observedInstances: result.observedInstances,
    visualIdentities: result.rows.length,
    includesRogue: result.rows.some((r) => r.id === 'hero:rogue'),
  }, null, 2));
}
