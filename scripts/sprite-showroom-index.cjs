'use strict';
// Source-derived index for the existing Sprite Showroom. No screenshots, image
// generation, save access or duplicate approval registry.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const Sprite = require('../src/prototype/sprites.js');
const regionNames = [
  'Greenwood Vale', 'Flooded Marches', 'Ironroot Highlands',
  'Ashen Frontier', 'Dark Crown',
];
const regionIds = ['vale', 'march', 'highlands', 'frontier', 'crown'];
const human = (text) => String(text || '').replace(/[:_-]+/g, ' ').replace(/\b\w/g, (a) => a.toUpperCase());
function groupOf(id, kind = '') {
  if (/^(hero|ally|enemy|boss|pet|captive|crowned|crown-troop|raider|appointed|mounted-direwolf)/.test(id) ||
      /character|enemy|boss/.test(kind)) return 'Characters';
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
function build() {
  const manifest = read('assets/sprites/manifest.json');
  const specs = read('tools/sprites/specifications.json');
  const approved = read('tools/sprites/approved.json');
  const materials = read('assets/materials/manifest.json');
  const materialReviews = read('tools/sprites/materials/approved.json');
  const cases = read('tools/visual-review/approved-art-pass/handoff-index.json');
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
    const rawName = human(spec.key.split(':').slice(1).join(' '));
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
    provenance: 'Current checked-in renderer and dated review fixtures; not full-scene player acceptance',
    counts: {
      exactContracts: specs.assets.length,
      liveRegistrations: Object.keys(manifest.sprites).length,
      datedReviewCases: cases.entries.length,
      currentMaterials: Object.keys(materials.materials).length,
    },
    entries, packagedResources: [...allResources].filter((r) => r.startsWith('./assets/sprites/')),
  };
}
module.exports = { build };
if (require.main === module) {
  const index = build();
  process.stdout.write(JSON.stringify(index));
}
