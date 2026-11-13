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
function trackIdentity(entity, region, zone, kind) {
  const candidate = Sprites.candidateKeys(entity, region)[0];
  if (candidate && !candidate.startsWith('landmark:')) return candidate;
  const semantic = [
    zone,
    entity.renderKind || kind,
    entity.structure || entity.species || entity.family ||
      entity.kind || entity.type || entity.name || kind,
    entity.sceneRole || entity.captainProfile || entity.masterId || '',
    entity.form || '',
    entity.crowned ? 'crowned' : '',
    entity.ranged ? 'ranged' : '',
    entity.guard ? 'guard' : '',
    entity.captain ? 'captain' : '',
    entity.full ? 'full' : '',
  ].filter(Boolean).map(clean);
  return 'world:' + semantic.join(':');
}
function census() {
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
          const id = trackIdentity(visual, region, area, inferred);
          const selected = Sprites.definitionFor(visual, region);
          observedInstances++;
          const existing = rows.get(id);
          if (existing) continue;
          rows.set(id, {
            id,
            name: human(labelFor(visual, inferred)),
            group: ['hero','ally','enemy'].includes(visual.renderKind) ? 'Characters'
              : visual.renderKind === 'building' ? 'Buildings & services'
              : visual.renderKind === 'npc' && ['rest','shop','smith','teacher','transport'].includes(visual.kind)
                ? 'Buildings & services' : 'World & scenery',
            region: regionNames[region] || human(area),
            regionIndex: region,
            sourceKind: 'current-world-fixture',
            catalogId: null,
            states: [{ label: 'Observed world fixture · ' + human(area),
              entity: visual, region }],
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
      region: regionNames[0], regionIndex: 0,
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
