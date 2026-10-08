'use strict';
// Development tooling only. Nothing here runs in the game or writes player storage.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const sharp = require('sharp');
const { createCanvas, Image } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const specs = require('../tools/sprites/specifications.json');
const Sprites = require('../src/prototype/sprites.js');
const visualSandbox = {
  PrototypeRules: require('../src/prototype/rules.js'),
  performance: { now: () => 16000 },
};
vm.runInNewContext(
  fs.readFileSync(path.join(root, 'src/prototype/visuals.js'), 'utf8'),
  visualSandbox,
);
const Visuals = visualSandbox.PrototypeVisuals;
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function fail(condition, message) {
  if (!condition) throw Error(message);
}
function safeFile(base, relative) {
  fail(typeof relative === 'string' && /^[a-zA-Z0-9_./-]+$/.test(relative), 'Unsafe file path');
  fail(!path.isAbsolute(relative) && !relative.split('/').includes('..'), 'Unsafe file path');
  const absolute = path.resolve(base, relative);
  const boundary = fs.realpathSync(base) + path.sep;
  fail(fs.existsSync(absolute) && fs.statSync(absolute).isFile(), 'Missing file: ' + relative);
  fail(fs.realpathSync(absolute).startsWith(boundary), 'File escapes declared directory');
  return absolute;
}
function catalog() {
  const file = 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md';
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const headings = [...text.matchAll(/^### (\d{3}) — ([^\n]+)$/gm)];
  fail(headings.length === 231, 'Catalog changed; review coverage before updating expectations');
  const entries = headings.map((heading, index) => {
    fail(Number(heading[1]) === index + 1, 'Duplicate or reordered catalog ID');
    const section = text.slice(heading.index, headings[index + 1]?.index || text.length);
    const states = [
      section.includes('**Image-generation prompt:**'),
      section.includes('ALIAS — do not generate a new image'),
      section.includes('KEEP PROCEDURAL — DO NOT GENERATE A SPRITE'),
    ];
    fail(states.filter(Boolean).length === 1, 'Ambiguous catalog status: ' + heading[1]);
    return {
      id: heading[1],
      name: heading[2],
      status: states[0] ? 'generate' : states[1] ? 'alias' : 'procedural',
      source: file,
      sourceHash: hash(Buffer.from(section)),
      cues: section.match(/\*\*Canonical cues:\*\* ([^\n]+)/)?.[1] || '',
      prompt: section.match(/\*\*Image-generation prompt:\*\*\s*\n\s*> ([^\n]+)/)?.[1] || null,
      declaredKey: section.match(/\*\*Runtime sprite key:\*\* `([^`]+)`/)?.[1] || null,
    };
  });
  fail(entries.filter((e) => e.status === 'generate').length === 221, 'Catalog partition changed');
  return entries;
}
function canonHash() {
  return hash(
    Buffer.concat(
      ['visuals', 'rules', 'data', 'sprites', 'renderer'].map((name) =>
        fs.readFileSync(path.join(root, 'src/prototype/' + name + '.js')),
      ),
    ),
  );
}
function contracts() {
  const entries = catalog();
  const approved = json(path.join(root, 'tools/sprites/approved.json'));
  return specs.assets.map((spec) => {
    const item = entries.find((entry) => entry.id === spec.catalogId);
    fail(item?.status === 'generate', 'Only GENERATE catalog entries can have asset contracts');
    fail(
      Sprites.candidateKeys(spec.entity, spec.region)[0] === spec.key,
      'Exact runtime key mismatch',
    );
    fail(!item.declaredKey || item.declaredKey === spec.key, 'Catalog/runtime key mismatch');
    const { width, height, anchorX, anchorY } = spec.canvas;
    fail(
      [width, height].every(
        (n) => Number.isInteger(n) && n > 0 && n <= specs.policy.maxOutputDimension,
      ),
      'Invalid canvas',
    );
    fail(
      [anchorX, anchorY].every((n) => Number.isFinite(n) && n >= 0 && n <= 1),
      'Invalid anchor',
    );
    return {
      ...spec,
      catalog: item,
      canonHash: canonHash(),
      approval: approved.assets[spec.key]?.review?.status || 'pending',
      runtime: {
        displayWidth: width,
        displayHeight: height,
        anchorX,
        anchorY,
        labelHeight: Visuals.height(spec.entity),
      },
    };
  });
}
function contractFor(key) {
  const contract = contracts().find((item) => item.key === key);
  fail(contract, 'No prepared contract for exact key: ' + key);
  return contract;
}
async function inspect(input, policy = specs.policy) {
  const bytes = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
  fail(bytes.length <= policy.maxSourceBytes, 'Source exceeds byte budget');
  const image = sharp(bytes, { limitInputPixels: policy.maxSourcePixels, failOn: 'warning' });
  const metadata = await image.metadata();
  fail(['png', 'webp'].includes(metadata.format), 'Only PNG or WebP sources are supported');
  fail(!metadata.pages || metadata.pages === 1, 'Static single-frame image required');
  fail(
    !metadata.orientation || metadata.orientation === 1,
    'Normalize orientation explicitly before preparation',
  );
  fail(metadata.hasAlpha, 'Transparent alpha channel required');
  fail(
    !metadata.icc && ['srgb', 'rgb'].includes(metadata.space),
    'Use unprofiled sRGB; no implicit color conversion',
  );
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x1 = info.width,
    y1 = info.height,
    x2 = -1,
    y2 = -1,
    transparent = 0,
    visible = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * info.channels + info.channels - 1];
      if (alpha === 0) transparent++;
      else {
        visible++;
        x1 = Math.min(x1, x);
        y1 = Math.min(y1, y);
        x2 = Math.max(x2, x);
        y2 = Math.max(y2, y);
      }
    }
  fail(visible && transparent, 'Image must contain visible content and transparent background');
  const padding = Math.min(x1, y1, info.width - 1 - x2, info.height - 1 - y2);
  fail(padding >= policy.minimumPadding, 'Visible pixels touch the required transparent margin');
  return {
    format: metadata.format,
    width: info.width,
    height: info.height,
    bytes: bytes.length,
    decodedBytes: info.width * info.height * 4,
    hash: hash(bytes),
    pixelHash: hash(data),
    bounds: { x1, y1, x2, y2 },
    padding,
    transparentPixels: transparent,
    visiblePixels: visible,
  };
}
function reference(contract) {
  const canvas = createCanvas(contract.canvas.width, contract.canvas.height);
  const ctx = canvas.getContext('2d');
  Visuals.draw(
    ctx,
    contract.entity,
    {
      x: canvas.width * contract.canvas.anchorX,
      y: canvas.height * contract.canvas.anchorY,
    },
    contract.region,
    false,
  );
  return canvas.toBuffer('image/png');
}
async function prepare(key, input, format = 'png') {
  fail(['png', 'webp'].includes(format), 'Output must be PNG or lossless WebP');
  const contract = contractFor(key),
    bytes = fs.readFileSync(input),
    source = await inspect(bytes);
  fail(
    source.width * contract.canvas.height === source.height * contract.canvas.width,
    'Source aspect must match the reference canvas; no implicit crop or distortion',
  );
  const pipeline = sharp(bytes).resize(contract.canvas.width, contract.canvas.height, {
    kernel: specs.policy.resizeKernel,
  });
  const output = await (
    format === 'png'
      ? pipeline.png({ compressionLevel: 9, palette: false })
      : pipeline.webp({ lossless: true, effort: 6 })
  ).toBuffer();
  const report = await inspect(output);
  fail(report.bytes <= specs.policy.maxOutputBytes, 'Output exceeds byte budget');
  const workspace = path.join(root, '_sprite-work');
  fs.mkdirSync(workspace, { recursive: true });
  fail(fs.realpathSync(workspace) === workspace, 'Workspace must not be symlinked');
  const parent = path.join(workspace, key.replaceAll(':', '-'));
  fs.mkdirSync(parent, { recursive: true });
  fail(fs.realpathSync(parent) === parent, 'Candidate parent must not be symlinked');
  const directory = path.join(parent, source.hash + '-' + format);
  fail(
    !fs.existsSync(directory),
    'Candidate is immutable; use a new source or remove only the scratch candidate',
  );
  const record = {
    version: 1,
    key,
    catalogId: contract.catalogId,
    canonHash: contract.canonHash,
    catalogHash: contract.catalog.sourceHash,
    source: { file: 'source.' + source.format, ...source },
    output: { file: 'candidate.' + format, ...report },
    runtime: contract.runtime,
    processing: {
      tool: 'sharp',
      version: sharp.versions.sharp,
      kernel: specs.policy.resizeKernel,
      from: [source.width, source.height],
      to: [report.width, report.height],
      crop: false,
      trim: false,
      colorConversion: false,
    },
    review: { status: 'pending', reference: null },
  };
  const stage = fs.mkdtempSync(path.join(parent, '.candidate-'));
  try {
    fs.writeFileSync(path.join(stage, 'source.' + source.format), bytes);
    fs.writeFileSync(path.join(stage, 'candidate.' + format), output);
    fs.writeFileSync(path.join(stage, 'canonical.png'), reference(contract));
    writeJSON(path.join(stage, 'candidate.json'), record);
    fs.renameSync(stage, directory);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
  return { directory, record };
}
function validateRecord(record, contract, requireApproval = false) {
  fail(
    record?.version === 1 && record.key === contract.key && record.catalogId === contract.catalogId,
    'Candidate identity mismatch',
  );
  fail(
    record.canonHash === contract.canonHash && record.catalogHash === contract.catalog.sourceHash,
    'Stale canonical reference; compare again before publication',
  );
  fail(
    JSON.stringify(record.runtime) === JSON.stringify(contract.runtime),
    'Runtime dimensions/anchors differ from the contract',
  );
  if (requireApproval)
    fail(
      record.review?.status === 'approved' &&
        /^https:\/\/github\.com\/joedoragon-glitch\/azeroth-chronicles-prototype\/(issues|pull)\/\d+(#.*)?$/.test(
          record.review.reference || '',
        ),
      'Recorded creative approval is required; tests cannot approve appearance',
    );
}
async function checkProduction() {
  const approved = json(path.join(root, 'tools/sprites/approved.json'));
  fail(
    approved.version === 1 && approved.assets && !Array.isArray(approved.assets),
    'Invalid approval registry',
  );
  const manifest = json(path.join(root, 'assets/sprites/manifest.json'));
  const expected = {},
    unique = new Map();
  let decodedBytes = 0;
  for (const [key, record] of Object.entries(approved.assets)) {
    const contract = contractFor(key);
    validateRecord(record, contract, true);
    const file = safeFile(path.join(root, 'assets/sprites'), record.output.file);
    const sourceFile = safeFile(path.join(root, 'tools/sprites/sources'), record.source.file);
    const report = await inspect(file),
      source = await inspect(sourceFile);
    fail(
      report.hash === record.output.hash && source.hash === record.source.hash,
      'Approved binary provenance changed',
    );
    fail(
      report.width === contract.canvas.width &&
        report.height === contract.canvas.height &&
        report.bytes <= specs.policy.maxOutputBytes,
      'Approved output violates size budget',
    );
    unique.set(file, report.decodedBytes);
    decodedBytes += report.decodedBytes;
    expected[key] = { src: './assets/sprites/' + record.output.file, ...record.runtime };
  }
  fail(
    JSON.stringify(manifest.sprites) === JSON.stringify(expected),
    'Runtime manifest must derive exactly from approved records',
  );
  fail(
    decodedBytes <= specs.policy.maxDecodedRegistryBytes,
    'Current eager sprite loader exceeds provisional decoded-memory budget',
  );
  return {
    catalogEntries: catalog().length,
    preparedContracts: contracts().length,
    registered: Object.keys(expected).length,
    uniqueImages: unique.size,
    decodedBytes,
  };
}
async function publish(recordFile) {
  const directory = path.dirname(path.resolve(recordFile)),
    record = json(recordFile);
  const contract = contractFor(record.key);
  validateRecord(record, contract, true);
  const output = safeFile(directory, record.output.file),
    source = safeFile(directory, record.source.file);
  const outputReport = await inspect(output),
    sourceReport = await inspect(source);
  fail(
    outputReport.hash === record.output.hash && sourceReport.hash === record.source.hash,
    'Candidate bytes changed after review',
  );
  fail(
    outputReport.width === contract.canvas.width &&
      outputReport.height === contract.canvas.height &&
      outputReport.bytes <= specs.policy.maxOutputBytes,
    'Invalid candidate output dimensions/budget',
  );
  await checkProduction();
  const approvedFile = path.join(root, 'tools/sprites/approved.json'),
    approved = json(approvedFile);
  fail(
    !approved.assets[record.key],
    'Replacement needs its own reviewed migration; do not overwrite approved source',
  );
  const filename =
    record.key.replaceAll(':', '-') +
    '-' +
    outputReport.hash.slice(0, 16) +
    '.' +
    outputReport.format;
  const sourceName = sourceReport.hash + '.' + sourceReport.format;
  const sourceDir = path.join(root, 'tools/sprites/sources');
  fs.mkdirSync(sourceDir, { recursive: true });
  fail(fs.realpathSync(sourceDir) === sourceDir, 'Source directory must not be symlinked');
  const spriteDir = path.join(root, 'assets/sprites');
  fail(fs.realpathSync(spriteDir) === spriteDir, 'Sprite directory must not be symlinked');
  // Preflight memory and collisions before changing any authoritative file.
  const current = await checkProduction();
  fail(
    current.decodedBytes + outputReport.decodedBytes <= specs.policy.maxDecodedRegistryBytes,
    'Registry memory budget exceeded',
  );
  fail(!fs.existsSync(path.join(spriteDir, filename)), 'Output already exists');
  const manifestFile = path.join(spriteDir, 'manifest.json'),
    manifest = json(manifestFile);
  record.output.file = filename;
  record.source.file = sourceName;
  approved.assets[record.key] = record;
  manifest.sprites[record.key] = { src: './assets/sprites/' + filename, ...record.runtime };
  // Preserve the two authoritative files if a write/check fails.
  const oldApproved = fs.readFileSync(approvedFile),
    oldManifest = fs.readFileSync(manifestFile);
  let newSource = false;
  try {
    fs.copyFileSync(output, path.join(spriteDir, filename), fs.constants.COPYFILE_EXCL);
    if (!fs.existsSync(path.join(sourceDir, sourceName))) {
      fs.copyFileSync(source, path.join(sourceDir, sourceName), fs.constants.COPYFILE_EXCL);
      newSource = true;
    } else
      fail(
        hash(fs.readFileSync(path.join(sourceDir, sourceName))) === sourceReport.hash,
        'Source hash collision',
      );
    writeJSON(approvedFile, approved);
    writeJSON(manifestFile, manifest);
    return await checkProduction();
  } catch (error) {
    fs.writeFileSync(approvedFile, oldApproved);
    fs.writeFileSync(manifestFile, oldManifest);
    fs.rmSync(path.join(spriteDir, filename), { force: true });
    if (newSource) fs.rmSync(path.join(sourceDir, sourceName), { force: true });
    throw error;
  }
}
async function spriteLayer(contract, candidateFile) {
  const sandbox = {
    Image,
    console,
    fetch: async () => ({
      ok: true,
      json: async () => ({
        version: 8,
        sprites: {
          [contract.key]: { src: candidateFile, ...contract.runtime },
        },
      }),
    }),
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/prototype/sprites.js'), 'utf8'), sandbox);
  await sandbox.PrototypeSprites.preload();
  fail(
    sandbox.PrototypeSprites.status().loaded === 1,
    'Candidate image did not decode in actual sprite layer',
  );
  return sandbox.PrototypeSprites;
}
function scene(contract, width, height, sprite = null, lighting = 'day') {
  const Campaign = require('../src/prototype/engine.js');
  let seed = 111;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const game = new Campaign('normal', 'paladin', random);
  game.s.clock = lighting === 'night' ? 430 : 120;
  game.s.party = [];
  Object.assign(game.hero, game.safe(800, 800));
  const zone = game.zone();
  zone.enemies = [];
  const entity = {
    ...contract.entity,
    x: game.hero.x,
    y: game.hero.y,
    hp: 100,
    maxHp: 100,
    neutral: false,
    name: contract.entity.renderKind === 'hero' ? game.hero.name : contract.catalog.name,
    aggro: contract.entity.renderKind === 'enemy',
  };
  if (entity.renderKind === 'hero') Object.assign(game.hero, entity);
  else {
    Object.assign(game.hero, game.safe(game.hero.x + 180, game.hero.y - 100));
    if (entity.renderKind === 'enemy') zone.enemies.push(entity);
    else zone.props.push(entity);
  }
  const canvas = createCanvas(width, height);
  const platform = require('../src/prototype/platform.js').init({
    location: { search: '?experience=' + (width > 900 ? 'desktop' : 'phone') },
    localStorage: { getItem: () => null },
    document: { body: { getAttribute: () => null, setAttribute: () => {} } },
  });
  const renderer = require('../src/prototype/renderer.js').create({
    canvas,
    ctx: canvas.getContext('2d'),
    getGame: () => game,
    platform,
    Campaign,
    PrototypeVisuals: Visuals,
    PrototypeCombatVisuals: require('../src/prototype/combat-visuals.js'),
    PrototypeSprites: sprite,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  });
  renderer.draw();
  return { bytes: canvas.toBuffer('image/png'), anchor: renderer.screen(entity) };
}
async function showroom(recordFile) {
  const keyOnly = recordFile && specs.assets.some((item) => item.key === recordFile);
  const contract = recordFile
    ? contractFor(keyOnly ? recordFile : json(recordFile).key)
    : contracts()[0];
  if (keyOnly) recordFile = null;
  let record = null,
    candidate = null,
    sprite = null;
  if (recordFile) {
    record = json(recordFile);
    validateRecord(record, contract);
    candidate = safeFile(path.dirname(path.resolve(recordFile)), record.output.file);
    fail(
      (await inspect(candidate)).hash === record.output.hash,
      'Candidate changed since processing',
    );
    sprite = await spriteLayer(contract, candidate);
  }
  const directory = path.join(root, '_sprite-preview');
  fs.mkdirSync(directory, { recursive: true });
  fail(fs.realpathSync(directory) === directory, 'Preview directory must not be symlinked');
  const comparisons = [];
  for (const [width, height] of specs.policy.viewports)
    for (const lighting of ['day', 'night']) {
      const canonical = scene(contract, width, height, null, lighting),
        proposed = candidate ? scene(contract, width, height, sprite, lighting) : canonical;
      const name = width + 'x' + height + '-' + lighting;
      fs.writeFileSync(path.join(directory, 'canonical-' + name + '.png'), canonical.bytes);
      fs.writeFileSync(path.join(directory, 'candidate-' + name + '.png'), proposed.bytes);
      comparisons.push({
        width,
        height,
        lighting,
        canonical: 'canonical-' + name + '.png',
        candidate: 'candidate-' + name + '.png',
        anchor: canonical.anchor,
        canonicalHash: hash(canonical.bytes),
        candidateHash: hash(proposed.bytes),
      });
    }
  fs.writeFileSync(path.join(directory, 'canonical-isolated.png'), reference(contract));
  if (candidate)
    fs.copyFileSync(candidate, path.join(directory, 'candidate-isolated.' + record.output.format));
  const data = {
    name: contract.catalog.name,
    key: contract.key,
    pending: !candidate,
    review: record?.review || { status: 'pending' },
    runtime: contract.runtime,
    candidateImage: candidate
      ? 'candidate-isolated.' + record.output.format
      : 'canonical-isolated.png',
    comparisons,
    canonHash: contract.canonHash,
    policy: specs.policy,
  };
  writeJSON(path.join(directory, 'comparison.json'), data);
  fs.copyFileSync(
    path.join(root, 'tools/sprites/showroom.html'),
    path.join(directory, 'index.html'),
  );
  fs.copyFileSync(
    path.join(root, 'tools/sprites/showroom.js'),
    path.join(directory, 'showroom.js'),
  );
  fs.copyFileSync(
    path.join(root, 'tools/sprites/showroom.css'),
    path.join(directory, 'showroom.css'),
  );
  return { directory, comparisons, pending: !candidate };
}
async function main() {
  const [command = 'check', key, input, format] = process.argv.slice(2);
  let result;
  if (command === 'catalog') result = catalog();
  else if (command === 'contracts') result = contracts();
  else if (command === 'inspect') result = await inspect(key);
  else if (command === 'prepare') result = await prepare(key, input, format);
  else if (command === 'publish') result = await publish(key);
  else if (command === 'showroom') result = await showroom(key);
  else if (command === 'check') result = await checkProduction();
  else
    throw Error(
      'Use check, catalog, contracts, inspect <image>, prepare <exact-key> <image> [png|webp], showroom [candidate.json], or publish <approved-candidate.json>',
    );
  console.log(JSON.stringify(result, null, 2));
}
module.exports = {
  catalog,
  contracts,
  contractFor,
  inspect,
  reference,
  prepare,
  validateRecord,
  checkProduction,
  publish,
  spriteLayer,
  scene,
  showroom,
  safeFile,
  hash,
};
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
