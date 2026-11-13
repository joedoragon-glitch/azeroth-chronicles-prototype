'use strict';
// Source-derived index for the existing Sprite Showroom. No screenshots, image
// generation, save access or duplicate approval registry.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const Sprite = require('../src/prototype/sprites.js');
const { census } = require('./sprite-showroom-world.cjs');
const regionNames = [
  'Greenwood Vale', 'Flooded Marches', 'Ironroot Highlands',
  'Ashen Frontier', 'Dark Crown',
];
const regionIds = ['vale', 'march', 'highlands', 'frontier', 'crown'];
const human = (text) => String(text || '').replace(/[:_-]+/g, ' ').replace(/\b\w/g, (a) => a.toUpperCase());
function groupOf(id, kind = '') {
  if (/^(hero|ally|enemy|boss|pet|npc|civilian|villager|resident|captive|crowned|crown-troop|raider|appointed|mounted-direwolf)/.test(id) ||
      /character|enemy|boss|npc|merchant/.test(kind)) return 'Characters';
  if (/^(building|structure|service|entrance|residence-entrance|specialist)/.test(id)) return 'Buildings & services';
  if (/^(terrain|material)/.test(id)) return 'Materials';
  if (/^(dispatch|shared|renderer-alias)/.test(id)) return 'Visual states';
  return 'World & scenery';
}
const localSprite = (src) =>
  /^\.\/assets\/sprites\/[a-zA-Z0-9_/-]+\.(?:png|webp)$/.test(src || '') && !src.includes('..');
function outputPath(record) {
  const file = record?.output?.file;
  return file && /^[a-zA-Z0-9_-]+\.(png|webp)$/.test(file)
    ? './assets/sprites/' + file : null;
}
function archives(approved, key) {
  const entries = [];
  const seen = new Set();
  for (const [revision, record] of Object.entries(approved.history?.[key] || {})) {
    const src = outputPath(record);
    if (!src || seen.has(src) || !fs.existsSync(path.join(root, src.slice(2)))) continue;
    seen.add(src);
    entries.push({ revision, src });
  }
  return entries;
}
function choose(entity, region, manifest) {
  const definition = Sprite.definitionFor(entity, region);
  return {
    representation: definition?.key ? 'raster' : 'procedural',
    activeSpriteKey: definition?.key || null,
    activeRaster: definition?.key ? manifest.sprites[definition.key]?.src || null : null,
  };
}
// UI facets and source provenance are derived automatically; this is not an
// additional editable sprite registry or a second approval list.
const painterPaths = [
  'src/prototype/visuals.js',
  'src/prototype/greenwood-landscape.js',
  'src/prototype/greenwood-interiors.js',
  'src/prototype/highlands.js',
  'src/prototype/dark-crown-landscape.js',
  'src/prototype/hero-presentation.js',
  'src/prototype/sprites.js',
  'src/prototype/materials.js',
];
function subtypeOf(entry, entity) {
  const id = entry.id.toLowerCase(), kind = String(entity.renderKind || '').toLowerCase();
  const type = String(entity.structure || entity.kind || entity.type || '').toLowerCase();
  if (entry.group === 'Characters') {
    if (id.startsWith('hero:') || kind === 'hero') return 'Playable heroes';
    if (/^(ally|pet|captive|companion)/.test(id) || ['ally', 'pet'].includes(kind))
      return 'Allies & companions';
    if (/^(enemy|boss|raider|crown-troop|mounted-direwolf)/.test(id) ||
        ['enemy', 'boss'].includes(kind)) return 'Enemies & bosses';
    return 'People & NPCs';
  }
  if (entry.group === 'Buildings & services') {
    if (/interior|bunk|room|hall|quarters|lounge/.test(id + ':' + type))
      return 'Interiors';
    if (/barracks|wall|watch|fort|tower|gate|defense|guard/.test(id + ':' + type))
      return 'Fortifications';
    if (/merchant|shop|service|smith|rest|healer|specialist|teacher/.test(id + ':' + type))
      return 'Services & workshops';
    return 'Structures';
  }
  if (entry.group === 'World & scenery') {
    if (/ferry|boat|wagon|cart|caravan|bridge|transport|flight/.test(id + ':' + type))
      return 'Transport & crossings';
    if (/grass|tree|bush|flower|reed|sapling|moss|heather|fungus|scrub|shrub|lily|plant|root|vines|poppy|weed|foliage|thicket/.test(id + ':' + type))
      return 'Vegetation';
    if (/rock|ore|crystal|lava|stone|cliff|ground|water|pool|mud|obsidian|driftwood|geology/.test(id + ':' + type))
      return 'Geology & waters';
    if (/bed|desk|table|chair|chair|shelf|lamp|bench|workstation|rack|barrel|crate|rug|tent|seat|bunk|candle|furnish/.test(id + ':' + type))
      return 'Furniture & objects';
    if (/wall|building|facility|structure|home|gate|watchpost/.test(id + ':' + type))
      return 'Landmarks & facilities';
    return 'Other scenery';
  }
  if (entry.group === 'Materials') return entry.sourceKind === 'archived-material'
    ? 'Retired terrain' : 'Road textures';
  return 'Other visual states';
}
function painterFor(entry, entity) {
  if (entry.group === 'Materials') return ['src/prototype/materials.js'];
  const paths = [];
  if (entity.greenwoodNature || entity.greenwoodFacility || entity.greenwoodWall)
    paths.push('src/prototype/greenwood-landscape.js');
  if (entity.greenwoodInteriorAsset) paths.push('src/prototype/greenwood-interiors.js');
  if (entity.highlandsNature || entity.miningFacility)
    paths.push('src/prototype/highlands.js');
  if (entry.group === 'Characters' && (entity.renderKind === 'hero' || entry.id.startsWith('hero:')))
    paths.push('src/prototype/hero-presentation.js');
  // The shared visual fallback owns the majority of authored character/prop
  // bodies. The actual runtime selector remains src/prototype/sprites.js.
  paths.push('src/prototype/visuals.js');
  if (entry.regionIndex === 4 && /^(terrain|landscape|world):/.test(entry.id))
    paths.push('src/prototype/dark-crown-landscape.js');
  return [...new Set(paths.filter((p) => fs.existsSync(path.join(root, p))))];
}
function sourceTerms(entry, entity) {
  const tokens = [
    entity.structure, entity.greenwoodNature, entity.highlandsNature,
    entity.greenwoodFacility, entity.greenwoodInteriorAsset, entity.miningFacility,
    entity.species, entity.family, entity.class, entity.kind, entity.type,
    entry.id.split(':').slice(1).filter((s) => !regionIds.includes(s))[0],
  ].filter((t) => typeof t === 'string' && t.length >= 3 && t.length <= 90);
  return [...new Set(tokens)].slice(0, 6);
}
function enhance(entry, decisions) {
  const state = entry.states?.[0] || entry.datedStates?.[0];
  const entity = state?.entity || {};
  const locations = new Set([entry.region, ...(entry.regions || [])]);
  for (const fixture of [...(entry.states || []), ...(entry.datedStates || [])])
    if (Number.isInteger(fixture.region) && regionNames[fixture.region])
      locations.add(regionNames[fixture.region]);
  entry.regions = [...locations];
  entry.areas = [...new Set((entry.areas || []).filter(Boolean))];
  entry.subcategory = subtypeOf(entry, entity);
  const visualTags = [
    entry.subcategory, entity.renderKind, entity.class, entity.species,
    entity.structure, entity.kind, entity.type, entity.family, entity.form,
    entity.captainProfile, entity.crownRole, entity.crownRank,
    entity.ranged ? 'ranged' : null, entity.guard ? 'guard' : null,
    entity.crowned ? 'crowned' : null, entity.ringleader ? 'ringleader' : null,
    ...entry.areas, ...entry.regions, ...(entry.aliases || []),
  ];
  entry.tags = [...new Set(visualTags.filter((x) =>
    typeof x === 'string' && x.length <= 90))].slice(0, 18);
  entry.sourceFiles = painterFor(entry, entity);
  entry.sourceTerms = sourceTerms(entry, entity);
  const decision = decisions.assets?.[entry.id] ||
    (entry.activeSpriteKey ? decisions.assets?.[entry.activeSpriteKey] : null);
  if (decision?.traits) entry.currentDesign = {
    summary: String(decision.traits).slice(0, 850),
    documents: (decision.decisionDocuments || []).filter((p) => /^docs\/[a-zA-Z0-9_/-]+\.md$/.test(p)),
    provenance: 'Recorded owner design decision; verify later supersessions against current source',
  };
  entry.displayStatus = entry.group === 'Materials'
    ? entry.sourceKind === 'archived-material' ? 'retired' : 'material'
    : entry.representation === 'raster' ? 'sprite-active'
      : entry.registeredRaster || entry.archive?.length ? 'procedural-with-sprite'
        : 'procedural-only';
}
function fingerprints() {
  const list = [...painterPaths, 'src/prototype/sprite-format.js',
    'assets/sprites/manifest.json', 'assets/materials/manifest.json',
    'tools/sprites/specifications.json', 'tools/sprites/current-design-decisions.json'];
  const out = {};
  for (const file of list) if (fs.existsSync(path.join(root, file))) {
    out[file] = createHash('sha256').update(fs.readFileSync(path.join(root, file)))
      .digest('hex').slice(0, 16);
  }
  return out;
}

function build() {
  const manifest = read('assets/sprites/manifest.json');
  const specs = read('tools/sprites/specifications.json');
  const approved = read('tools/sprites/approved.json');
  const materials = read('assets/materials/manifest.json');
  const materialReviews = read('tools/sprites/materials/approved.json');
  const cases = read('tools/visual-review/approved-art-pass/handoff-index.json');
  const decisions = read('tools/sprites/current-design-decisions.json');
  if (!Sprite.installManifest(manifest)) throw Error('Invalid sprite showroom source manifest');
  const result = new Map();
  for (const spec of specs.assets) {
    const entry = manifest.sprites[spec.key] || null;
    if (Sprite.candidateKeys(spec.entity, spec.region)[0] !== spec.key)
      throw Error('Sprite showroom fixture key drift: ' + spec.key);
    const selected = choose(spec.entity, spec.region, manifest);
    const existing = archives(approved, spec.key);
    const current = entry?.src || null;
    const history = existing.filter((a) => a.src !== current);
    // Region already has a dedicated card line and filter; repeating it in
    // titles makes the visual gallery read like raw asset filenames.
    const nameParts = spec.key.split(':').slice(1)
      .filter((part) => part !== regionIds[spec.region]);
    const rawName = human(nameParts.join(' '));
    result.set(spec.key, {
      id: spec.key,
      name: rawName,
      group: groupOf(spec.key),
      region: regionNames[spec.region] || regionNames[0],
      regionIndex: spec.region,
      sourceKind: 'current-contract',
      catalogId: spec.catalogId,
      states: [{ label: 'Current fixture', entity: spec.entity, region: spec.region }],
      ...selected,
      registeredRaster: current,
      revision: entry?.revision || null,
      spriteEntry: entry ? {
        width: entry.width, height: entry.height, displayWidth: entry.displayWidth,
        displayHeight: entry.displayHeight, anchorX: entry.anchorX,
        anchorY: entry.anchorY, clips: entry.clips || null,
        variants: entry.variants || null,
      } : null,
      archive: history,
      referenceDate: null,
    });
  }
  // Enumerate the current world rather than assuming the October handoff
  // archive contains every new region fixture or the playable Rogue class.
  const currentWorld = census({
    protectedKeys: [
      ...Object.keys(manifest.sprites),
      ...specs.assets.map((asset) => asset.key),
    ],
  });
  for (const live of currentWorld.rows) {
    if (result.has(live.id)) {
      const entry = result.get(live.id);
      entry.observedInWorldSource = true;
      entry.areas = [...new Set([...(entry.areas || []), ...(live.areas || [])])];
      entry.regions = [...new Set([...(entry.regions || [entry.region]), ...(live.regions || [])])];
      entry.aliases = [...new Set([...(entry.aliases || []), ...(live.aliases || [])])];
      for (const state of live.states)
        if (!entry.states.some((s) => s.label === state.label))
          entry.states.push(state);
      continue;
    }
    const registered = live.activeSpriteKey
      ? manifest.sprites[live.activeSpriteKey] || null : null;
    result.set(live.id, {
      ...live, observedInWorldSource: live.sourceKind === 'current-world-fixture',
      registeredRaster: registered?.src || null,
      revision: registered?.revision || null,
      spriteEntry: registered ? {
        width: registered.width, height: registered.height,
        displayWidth: registered.displayWidth, displayHeight: registered.displayHeight,
        anchorX: registered.anchorX, anchorY: registered.anchorY,
        clips: registered.clips || null, variants: registered.variants || null,
      } : null,
      archive: live.activeSpriteKey ? archives(approved, live.activeSpriteKey)
        .filter((a) => a.src !== registered?.src) : [],
    });
  }
  for (const item of cases.entries) {
    if (!/^tools\/sprites\/design-handoffs\/[a-zA-Z0-9_-]+\.json$/.test(item.handoff))
      throw Error('Invalid historical showroom handoff path');
    const handoff = read(item.handoff);
    const oldStates = Array.isArray(handoff.reference?.exactEntityState)
      ? handoff.reference.exactEntityState : [];
    const states = oldStates.filter((s) => s?.entity && Number.isInteger(s.region))
      .slice(0, 12).map((s) => ({
        label: String(s.label || 'Reference state').slice(0, 80),
        entity: s.entity,
        region: s.region,
      }));
    if (result.has(item.id)) {
      // Same identity is one card. Its current contract takes precedence over
      // the dated historical capture.
      result.get(item.id).datedStates = states;
      result.get(item.id).referenceDate = '2026-10-19';
      result.get(item.id).historicalDesign = {
        summary: String(handoff.context?.decisionSummary || '').slice(0, 650),
        source: item.handoff, date: '2026-10-19',
      };
      continue;
    }
    const sample = states[0];
    const region = sample?.region ?? 0;
    const selected = sample ? choose(sample.entity, region, manifest) : {
      representation: 'unavailable', activeSpriteKey: null, activeRaster: null,
    };
    const activeEntry = selected.activeSpriteKey
      ? manifest.sprites[selected.activeSpriteKey] : null;
    result.set(item.id, {
      id: item.id,
      name: String(handoff.name || human(item.id)).slice(0, 120),
      group: groupOf(item.id, handoff.kind),
      region: regionNames[region] || 'Mixed / interior',
      regionIndex: region,
      sourceKind: 'dated-reference',
      catalogId: item.catalogNumber || null,
      states,
      ...selected,
      registeredRaster: activeEntry?.src || null,
      revision: activeEntry?.revision || null,
      spriteEntry: activeEntry ? {
        width: activeEntry.width, height: activeEntry.height,
        displayWidth: activeEntry.displayWidth, displayHeight: activeEntry.displayHeight,
        anchorX: activeEntry.anchorX, anchorY: activeEntry.anchorY,
        clips: activeEntry.clips || null, variants: activeEntry.variants || null,
      } : null,
      archive: selected.activeSpriteKey ? archives(approved, selected.activeSpriteKey)
        .filter((a) => a.src !== activeEntry?.src) : [],
      referenceDate: '2026-10-19',
      historicalDesign: {
        summary: String(handoff.context?.decisionSummary || '').slice(0, 650),
        source: item.handoff, date: '2026-10-19',
      },
    });
  }
  for (const [key, entry] of Object.entries(materials.materials)) {
    const id = 'registered-' + key;
    result.set(id, {
      id,
      name: human(key.split(':').slice(1).join(' ')),
      group: 'Materials',
      region: key.endsWith(':vale') ? regionNames[0]
        : key.endsWith(':highlands') ? regionNames[2] : 'Mixed / interior',
      regionIndex: key.endsWith(':highlands') ? 2 : 0,
      sourceKind: 'current-material',
      states: [], representation: 'material',
      registeredRaster: entry.src, activeRaster: entry.src,
      activeSpriteKey: null, archive: [], referenceDate: null,
      revision: entry.revision || null,
    });
  }
  for (const [key, records] of Object.entries(materialReviews.history || {})) {
    if (materials.materials[key]) continue;
    const record = Object.values(records)[0];
    const file = record?.output?.hash && './assets/materials/' + record.output.hash + '.png';
    if (!file || !fs.existsSync(path.join(root, file.slice(2)))) continue;
    const id = 'archived-' + key;
    result.set(id, {
      id, name: human(key.split(':').slice(1).join(' ')) + ' (retired)',
      group: 'Materials', region: 'Historical', regionIndex: 0,
      sourceKind: 'archived-material', states: [],
      representation: 'historical', activeSpriteKey: null, activeRaster: null,
      registeredRaster: file, archive: [], referenceDate: 'historical',
      revision: null,
    });
  }
  const entries = [...result.values()];
  for (const entry of entries) enhance(entry, decisions);
  const allResources = new Set();
  for (const entry of entries) {
    if (entry.registeredRaster && (entry.registeredRaster.startsWith('./assets/materials/') ||
        localSprite(entry.registeredRaster))) allResources.add(entry.registeredRaster);
    for (const record of entry.archive)
      if (localSprite(record.src)) allResources.add(record.src);
  }
  for (const entry of entries)
    if (!entry.states.length && entry.group !== 'Materials')
      entry.unsupported = 'The dated source case has no isolated renderer fixture';
  return {
    schemaVersion: 1,
    title: 'Sprite Showroom',
    regionNames,
    provenance: 'Current checked-in renderer and dated review fixtures; not full-scene player acceptance',
    sourceFingerprints: fingerprints(),
    counts: {
      exactContracts: specs.assets.length,
      liveRegistrations: Object.keys(manifest.sprites).length,
      datedReviewCases: cases.entries.length,
      currentMaterials: Object.keys(materials.materials).length,
      currentWorldIdentities: currentWorld.rows.length,
      currentSourceAreas: currentWorld.areas.length,
    },
    entries, packagedResources: [...allResources],
  };
}
module.exports = { build };
if (require.main === module) {
  const index = build();
  process.stdout.write(JSON.stringify(index));
}
