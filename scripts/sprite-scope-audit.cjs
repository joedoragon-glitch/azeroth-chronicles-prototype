'use strict';
// Read-only current-source discovery. This tool does not touch gameplay or sprite registries.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const pipeline = require('./sprite-pipeline.cjs');
const C = require('../src/prototype/engine');
const Sprites = require('../src/prototype/sprites');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function audit(options = {}) {
  const source = options.source ?? read('src/prototype/visuals.js');
  const coverage = options.coverage ?? read('docs/GRAPHICS_CANON_SPRITE_COVERAGE.md');
  const catalog = options.catalog ?? pipeline.catalog();
  const sections = [
    ['decoration', 'function decoration(kind)', 'function landmark()'],
    ['settlement', 'function settlementBuilding(kind)', 'function decoration(kind)'],
    ['landmark', 'function landmark()', 'function workDetails(role)'],
  ];
  const families = {};
  for (const [name, start, end] of sections) {
    const a = source.indexOf(start),
      b = source.indexOf(end, a);
    if (a < 0 || b <= a) throw Error('Review renderer section: ' + name);
    families[name] = [...source.slice(a, b).matchAll(/case '([^']+)'/g)].map((m) => m[1]);
    for (const key of families[name])
      if (!coverage.includes('| `' + key + '` |'))
        throw Error('Unclassified renderer family: ' + key);
  }
  const workStart = source.indexOf('function workDetails(role)');
  const workEnd = source.indexOf('const type = e.renderKind', workStart);
  if (workStart < 0 || workEnd < 0) throw Error('Missing contextual renderer boundary');
  const work = source.slice(workStart, workEnd);
  const workRoles = [...work.matchAll(/role === '([^']+)'/g)].map((m) => m[1]);
  for (const role of workRoles)
    if (!coverage.includes('`sceneRole:' + role + '`'))
      throw Error('Unclassified contextual state: ' + role);
  const environment = JSON.parse(read('tools/sprites/environment-scope.json'));
  for (const item of environment.candidates) {
    const decision = catalog.find((c) => c.id === item.catalogId);
    if (decision?.status !== 'generate' || decision.declaredKey !== item.representativeKey)
      throw Error('Environment candidate lacks its reviewed exact decision: ' + item.family);
    if (item.source === 'decoration' && !families.decoration.includes(item.family))
      throw Error('Review removed environment family: ' + item.family);
  }
  for (const family of new Set(C.rules.natureThemes.flat()))
    if (!coverage.includes('| `' + family + '` |'))
      throw Error('Unclassified authored nature family: ' + family);
  const terrain = JSON.parse(read('tools/sprites/terrain-specifications.json'));
  const terrainCatalog = read('docs/GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md');
  const textureKeys = new Set();
  for (const [index, item] of terrain.candidates.entries()) {
    if (item.id !== 'T' + String(index + 1).padStart(3, '0') || textureKeys.has(item.resourceKey))
      throw Error('Duplicate or reordered terrain identity');
    textureKeys.add(item.resourceKey);
    if (!terrainCatalog.includes('**Resource key:** `' + item.resourceKey + '`'))
      throw Error('Unclassified terrain material: ' + item.resourceKey);
    if (!item.palette.every((color) => source.includes("'" + color + "'")))
      throw Error('Terrain palette lacks current source evidence: ' + item.resourceKey);
  }
  const observed = new Map(),
    guards = new Set(),
    zones = new Set();
  for (const mode of ['normal', 'nightmare'])
    for (const value of [0.1, 0.9]) {
      const game = new C(mode, 'paladin', () => value);
      const ids = [
        ...C.data.regions.map((r) => r.id),
        ...Object.keys(C.rules.dungeonArchitecture),
        ...C.rules.sideDungeons.map((r) => r.id),
        ...Object.keys(C.rules.treasuryWalls),
      ];
      for (const id of ids) {
        game.enter(id);
        zones.add(id);
        for (const entity of game.zone().enemies) {
          const key = Sprites.candidateKeys({ ...entity, renderKind: 'enemy' })[0];
          if (key)
            observed.set(key, {
              key,
              species: entity.species,
              captain: !!entity.captain,
              guard: !!entity.guard,
              ranged: !!entity.ranged,
              hybrid: !!entity.hybrid,
            });
          if (entity.guard && !entity.captain && key) guards.add(key);
        }
      }
    }
  const declared = new Set(
    catalog
      .filter((c) => c.status === 'generate')
      .map((c) => c.declaredKey)
      .filter(Boolean),
  );
  for (const key of guards)
    if (!declared.has(key)) throw Error('Current guard lacks an exact generation decision: ' + key);
  for (const entity of observed.values())
    if (entity.captain && !declared.has(entity.key))
      throw Error('Current captain lacks an exact generation decision: ' + entity.key);
  for (const region of C.data.regions)
    if (!declared.has('building:barracks:' + region.id + ':full'))
      throw Error('Full camp lacks its own decision: ' + region.id);
  if (!declared.has('enemy:crownguard:ranged'))
    throw Error('Crown ranged class lacks its own decision');
  const sources = {};
  for (const file of [
    'src/prototype/visuals.js',
    'src/prototype/world.js',
    'src/prototype/rules.js',
    'src/prototype/data.js',
    'src/prototype/sprites.js',
    'src/prototype/renderer.js',
  ])
    sources[file] = crypto.createHash('sha256').update(read(file)).digest('hex');
  return {
    catalog: {
      entries: catalog.length,
      generate: catalog.filter((c) => c.status === 'generate').length,
      alias: catalog.filter((c) => c.status === 'alias').length,
      procedural: catalog.filter((c) => c.status === 'procedural').length,
    },
    preparedContracts: pipeline.contracts().length,
    families,
    workRoles,
    environmentFamilies: environment.candidates.map((c) => ({
      catalogId: c.catalogId,
      family: c.family,
      keys: c.authoredKeys,
    })),
    terrainMaterials: terrain.candidates.map((c) => ({
      id: c.id,
      key: c.resourceKey,
      owner: c.sourceOwner,
      palette: c.palette,
    })),
    zones: [...zones].sort(),
    guardKeys: [...guards].sort(),
    enemyObservations: [...observed.values()].sort((a, b) => a.key.localeCompare(b.key)),
    sources,
    limits:
      'Deterministic normal/Nightmare world samples support source-case classification; every actual art job still requires its exact current state/reference. Future summon/night/seed additions are not inferred from these samples.',
  };
}
module.exports = { audit };
if (require.main === module) {
  try {
    const result = audit();
    console.log(
      process.argv.includes('--check')
        ? 'PASS current sprite scope · ' +
            result.catalog.entries +
            ' decisions · ' +
            result.guardKeys.length +
            ' guard keys · ' +
            result.zones.length +
            ' areas'
        : JSON.stringify(result, null, 2),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
