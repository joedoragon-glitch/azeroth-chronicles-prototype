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
const Format = require('../src/prototype/sprite-format.js');
const visualSandbox = {
  PrototypeRules: require('../src/prototype/rules.js'),
  performance: { now: () => 16000 },
};
vm.runInNewContext(
  fs.readFileSync(path.join(root, 'src/prototype/visuals.js'), 'utf8'),
  visualSandbox,
);
const Visuals = visualSandbox.PrototypeVisuals;
// Generation inputs exclude presentation-owned camp ground patches. Production drawing is untouched.
const generationSandbox = { ...visualSandbox };
const visualSource = fs.readFileSync(path.join(root, 'src/prototype/visuals.js'), 'utf8');
const campGround = 'fillOval(0, 10, 45, 12, ground, 0.28);';
fail(visualSource.includes(campGround), 'Review the current camp grounding before generation');
vm.runInNewContext(visualSource.replace(campGround, ''), generationSandbox);
const GenerationVisuals = generationSandbox.PrototypeVisuals;
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
function parseCatalog(text, file = 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md') {
  const summary = text.match(/<!-- SPRITE_TOTALS (\{[^\n]+\}) -->/);
  fail(summary, 'Catalog must declare its reviewed totals');
  const expected = JSON.parse(summary[1]);
  const headings = [...text.matchAll(/^### (\d{3}) — ([^\n]+)$/gm)];
  fail(
    headings.length > 0 && headings.length === expected.entries,
    'Catalog totals changed; reconcile the reviewed scope',
  );
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
      sourceHash: hash(Buffer.from(section.trim())),
      cues: section.match(/\*\*Canonical cues:\*\* ([^\n]+)/)?.[1] || '',
      prompt: section.match(/\*\*Image-generation prompt:\*\*\s*\n\s*> ([^\n]+)/)?.[1] || null,
      declaredKey: section.match(/\*\*Runtime sprite key:\*\* `([^`]+)`/)?.[1] || null,
    };
  });
  for (const state of ['generate', 'alias', 'procedural'])
    fail(
      entries.filter((e) => e.status === state).length === expected[state],
      'Catalog partition changed: ' + state,
    );
  return entries;
}
function catalog() {
  const file = 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md';
  return parseCatalog(fs.readFileSync(path.join(root, file), 'utf8'), file);
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
  const snapshotHash = canonHash();
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
    const result = {
      ...spec,
      catalog: item,
      canonSnapshotHash: snapshotHash,
      approval: approved.assets[spec.key]?.review?.status || 'pending',
      runtime: {
        displayWidth: width,
        displayHeight: height,
        anchorX,
        anchorY,
        labelHeight: Visuals.height(spec.entity),
      },
    };
    result.canonHash = hash(
      Buffer.concat([
        reference(result, true),
        Buffer.from(
          JSON.stringify({
            key: result.key,
            entity: result.entity,
            region: result.region,
            runtime: result.runtime,
          }),
        ),
      ]),
    );
    return result;
  });
}
function contractFor(key) {
  const contract = contracts().find((item) => item.key === key);
  fail(contract, 'No prepared contract for exact key: ' + key);
  return contract;
}
function asset(query) {
  fail(typeof query === 'string' && query.trim(), 'Provide a sprite key, catalog ID or name');
  const needle = query.trim().toLowerCase(),
    all = catalog(),
    bindings = contracts();
  const registry = json(path.join(root, 'tools/sprites/approved.json'));
  const exact = all.filter(
    (item) =>
      item.id === needle ||
      item.name.toLowerCase() === needle ||
      bindings.some((c) => c.catalogId === item.id && c.key === needle),
  );
  const matches = exact.length
    ? exact
    : all.filter((item) => item.name.toLowerCase().includes(needle));
  return {
    query,
    resolved: matches.length === 1,
    matches: matches.map((item) => {
      const binding = bindings.find((c) => c.catalogId === item.id),
        key = binding?.key || item.declaredKey || null,
        current = registry.assets[key];
      return {
        catalogId: item.id,
        name: item.name,
        status: item.status,
        key,
        activeRevision: current ? lease(current) : null,
        source: current ? 'tools/sprites/sources/' + current.source.file : null,
        output: current ? 'assets/sprites/' + current.output.file : null,
        presentation: current?.presentation || null,
        review: current?.review || null,
        history: Object.entries(registry.history?.[key] || {}).map(([revision, record]) => ({
          revision,
          source: 'tools/sprites/sources/' + record.source.file,
          output: 'assets/sprites/' + record.output.file,
        })),
        nextAction: current
          ? 'Edit retained source, prepare/review affected frames and replace with activeRevision lease'
          : binding
            ? 'Resume accepted design handoff and prepare this exact key'
            : 'Reconcile an exact contract before preparation',
      };
    }),
  };
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
    visible = 0,
    lowAlphaPixels = 0;
  const materialBounds = { x1: info.width, y1: info.height, x2: -1, y2: -1 };
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * info.channels + info.channels - 1];
      if (alpha === 0) transparent++;
      else {
        visible++;
        if (alpha < 16) lowAlphaPixels++;
        else {
          materialBounds.x1 = Math.min(materialBounds.x1, x);
          materialBounds.y1 = Math.min(materialBounds.y1, y);
          materialBounds.x2 = Math.max(materialBounds.x2, x);
          materialBounds.y2 = Math.max(materialBounds.y2, y);
        }
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
    lowAlphaPixels,
    materialBounds,
  };
}
function reference(contract, generation = false) {
  const canvas = createCanvas(contract.canvas.width, contract.canvas.height);
  const native = canvas.getContext('2d');
  const ctx = generation
    ? new Proxy(native, {
        get(target, property) {
          if (property === 'fill')
            return (...args) => {
              if (target.fillStyle !== '#07110d') target.fill(...args);
            };
          if (property === 'stroke')
            return (...args) => {
              if (
                !['#d2aa87', '#c9d6ad', '#a49573', '#d4b36f', '#e0b96f'].includes(
                  target.strokeStyle,
                )
              )
                target.stroke(...args);
            };
          const value = target[property];
          return typeof value === 'function' ? value.bind(target) : value;
        },
        set(target, property, value) {
          target[property] = value;
          return true;
        },
      })
    : native;
  (generation ? GenerationVisuals : Visuals).draw(
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
async function prepare(key, input, format = 'png', placement = {}) {
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
  let output = await (
    format === 'png'
      ? pipeline.png({ compressionLevel: 9, palette: false })
      : pipeline.webp({ lossless: true, effort: 6 })
  ).toBuffer();
  const dx = placement.offsetX || 0,
    dy = placement.offsetY || 0;
  fail(
    [dx, dy].every((n) => Number.isInteger(n) && Math.abs(n) <= 32),
    'Invalid explicit placement translation',
  );
  if (dx || dy) {
    const { data, info } = await sharp(output)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const moved = Buffer.alloc(data.length);
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const from = (y * info.width + x) * 4,
          xx = x + dx,
          yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= info.width || yy >= info.height)
          fail(!data[from + 3], 'Translation would discard visible pixels');
        else data.copy(moved, (yy * info.width + xx) * 4, from, from + 4);
      }
    output = await (
      format === 'png'
        ? sharp(moved, { raw: info }).png()
        : sharp(moved, { raw: info }).webp({ lossless: true })
    ).toBuffer();
  }
  const report = await inspect(output);
  fail(report.bytes <= specs.policy.maxOutputBytes, 'Output exceeds byte budget');
  const workspace = path.join(root, '_sprite-work');
  fs.mkdirSync(workspace, { recursive: true });
  fail(fs.realpathSync(workspace) === workspace, 'Workspace must not be symlinked');
  const parent = path.join(workspace, key.replaceAll(':', '-'));
  fs.mkdirSync(parent, { recursive: true });
  fail(fs.realpathSync(parent) === parent, 'Candidate parent must not be symlinked');
  const directory = path.join(
    parent,
    source.hash +
      '-' +
      format +
      '-' +
      hash(
        Buffer.from(
          JSON.stringify({
            canon: contract.canonHash,
            catalog: contract.catalog.sourceHash,
            dx,
            dy,
          }),
        ),
      ).slice(0, 12),
  );
  fail(
    !fs.existsSync(directory),
    'Candidate is immutable; use a new source or remove only the scratch candidate',
  );
  const record = {
    version: 2,
    key,
    catalogId: contract.catalogId,
    canonHash: contract.canonHash,
    canonSnapshotHash: contract.canonSnapshotHash,
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
      translation: { x: dx, y: dy, visiblePixelsDiscarded: 0 },
    },
    review: { status: 'pending', reference: null },
  };
  const stage = fs.mkdtempSync(path.join(parent, '.candidate-'));
  try {
    fs.writeFileSync(path.join(stage, 'source.' + source.format), bytes);
    fs.writeFileSync(path.join(stage, 'candidate.' + format), output);
    fs.writeFileSync(path.join(stage, 'canonical.png'), reference(contract));
    fs.writeFileSync(path.join(stage, 'generation-reference.png'), reference(contract, true));
    writeJSON(path.join(stage, 'candidate.json'), record);
    fs.renameSync(stage, directory);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
  return { directory, record };
}
function validateRecord(record, contract, requireApproval = false, allowStale = false) {
  fail(
    [1, 2].includes(record?.version) &&
      record.key === contract.key &&
      record.catalogId === contract.catalogId,
    'Candidate identity mismatch',
  );
  fail(
    allowStale ||
      (record.canonHash ===
        (record.version === 1 ? contract.canonSnapshotHash : contract.canonHash) &&
        record.catalogHash === contract.catalog.sourceHash),
    'Stale canonical reference; compare again before publication',
  );
  fail(
    allowStale || JSON.stringify(record.runtime) === JSON.stringify(contract.runtime),
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
function revisionFor(record) {
  return hash(
    Buffer.from(
      JSON.stringify({
        output: record.output.hash,
        runtime: record.runtime,
        presentation: record.presentation || null,
        canon: record.canonHash,
        catalog: record.catalogHash,
      }),
    ),
  );
}
function entryFor(record) {
  return {
    src: './assets/sprites/' + record.output.file,
    width: record.output.width,
    height: record.output.height,
    hash: record.output.hash,
    revision: record.revision || revisionFor(record),
    ...record.runtime,
    ...(record.presentation || {}),
  };
}
async function verifyExtra(extra, directory, sourceDirectory) {
  const output = await inspect(safeFile(directory, extra.output.file));
  fail(
    output.hash === extra.output.hash &&
      output.width === extra.output.width &&
      output.height === extra.output.height,
    'Extra resource provenance changed',
  );
  fail(
    output.width * output.height <= Format.LIMITS.resourcePixels &&
      output.bytes <= 4 * specs.policy.maxOutputBytes,
    'Extra resource budget exceeded',
  );
  for (const item of extra.sources || []) {
    const source = await inspect(safeFile(sourceDirectory, item.file));
    fail(source.hash === item.hash, 'Frame/variant source provenance changed');
  }
  return output;
}
async function checkProduction(options = {}) {
  const approved = json(path.join(root, 'tools/sprites/approved.json'));
  fail(
    [1, 2].includes(approved.version) && approved.assets && !Array.isArray(approved.assets),
    'Invalid approval registry',
  );
  const manifest = json(path.join(root, 'assets/sprites/manifest.json')),
    expected = {},
    unique = new Map();
  for (const [key, record] of Object.entries(approved.assets)) {
    const contract = contractFor(key),
      stale = (options.allowStaleKeys || []).includes(key);
    validateRecord(record, contract, true, stale);
    const report = await inspect(safeFile(path.join(root, 'assets/sprites'), record.output.file));
    const source = await inspect(
      safeFile(path.join(root, 'tools/sprites/sources'), record.source.file),
    );
    fail(
      report.hash === record.output.hash && source.hash === record.source.hash,
      'Approved binary provenance changed',
    );
    fail(
      report.width === (stale ? record.output.width : contract.canvas.width) &&
        report.height === (stale ? record.output.height : contract.canvas.height) &&
        report.bytes <= specs.policy.maxOutputBytes,
      'Approved output violates size budget',
    );
    unique.set('./assets/sprites/' + record.output.file, report);
    for (const extra of record.extras || [])
      unique.set(
        './assets/sprites/' + extra.output.file,
        await verifyExtra(
          extra,
          path.join(root, 'assets/sprites'),
          path.join(root, 'tools/sprites/sources'),
        ),
      );
    expected[key] =
      record.version === 1
        ? { src: './assets/sprites/' + record.output.file, ...record.runtime }
        : entryFor(record);
    if (record.revision) fail(record.revision === revisionFor(record), 'Asset revision changed');
  }
  fail(
    JSON.stringify(manifest.sprites) === JSON.stringify(expected),
    'Runtime manifest must derive exactly from approved records',
  );
  const resources = Format.resources(manifest);
  fail(
    resources.length === unique.size && resources.every((r) => unique.has(r.src)),
    'Untracked or unused sprite resources',
  );
  const activeBudget = specs.policy.maxActiveDecodedBytes;
  for (const report of unique.values())
    fail(report.decodedBytes <= activeBudget, 'Resource exceeds active decoded-memory budget');
  const decodedContent = new Map([...unique.values()].map((r) => [r.hash, r]));
  const decodedBytes = [...decodedContent.values()].reduce((n, r) => n + r.decodedBytes, 0),
    packagedBytes = [...unique.values()].reduce((n, r) => n + r.bytes, 0);
  fail(
    decodedBytes <= specs.policy.maxPackagedDecodedBytes &&
      packagedBytes <= specs.policy.maxPackagedBytes,
    'Packaged sprite budget exceeded',
  );
  return {
    catalogEntries: catalog().length,
    preparedContracts: contracts().length,
    registered: Object.keys(expected).length,
    uniqueImages: decodedContent.size,
    packagedResources: unique.size,
    decodedBytes,
    packagedBytes,
    maxActiveDecodedBytes: activeBudget,
  };
}
async function commitRegistry(approved, manifest, copies = []) {
  const approvedFile = path.join(root, 'tools/sprites/approved.json'),
    manifestFile = path.join(root, 'assets/sprites/manifest.json');
  const oldApproved = fs.readFileSync(approvedFile),
    oldManifest = fs.readFileSync(manifestFile),
    created = [];
  try {
    for (const { source, target, expectedHash } of copies) {
      const parent = path.dirname(target);
      fs.mkdirSync(parent, { recursive: true });
      fail(fs.realpathSync(parent) === parent, 'Asset directory must not be symlinked');
      if (!fs.existsSync(target)) {
        fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
        created.push(target);
      }
      fail(hash(fs.readFileSync(target)) === expectedHash, 'Immutable resource hash collision');
    }
    writeJSON(approvedFile, approved);
    writeJSON(manifestFile, manifest);
    return await checkProduction();
  } catch (error) {
    fs.writeFileSync(approvedFile, oldApproved);
    fs.writeFileSync(manifestFile, oldManifest);
    for (const file of created) fs.rmSync(file, { force: true });
    throw error;
  }
}
function lease(record) {
  return record?.revision || record?.output.hash;
}
function retain(approved, key, record) {
  approved.history ||= {};
  approved.history[key] ||= {};
  approved.history[key][lease(record)] = record;
}
async function publish(recordFile, expectedRevision = null) {
  const directory = path.dirname(path.resolve(recordFile)),
    record = json(recordFile),
    contract = contractFor(record.key);
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
  const approved = json(path.join(root, 'tools/sprites/approved.json')),
    prior = approved.assets[record.key];
  if (expectedRevision === null)
    fail(!prior, 'Replacement requires an expected active revision; use replace');
  else fail(prior && lease(prior) === expectedRevision, 'Replacement lease mismatch');
  await checkProduction({ allowStaleKeys: expectedRevision ? [record.key] : [] });
  const manifest = json(path.join(root, 'assets/sprites/manifest.json')),
    copies = [];
  const outputName =
    record.key.replaceAll(':', '-') + '-' + outputReport.hash + '.' + outputReport.format;
  const sourceName = sourceReport.hash + '.' + sourceReport.format;
  copies.push(
    {
      source: output,
      target: path.join(root, 'assets/sprites', outputName),
      expectedHash: outputReport.hash,
    },
    {
      source,
      target: path.join(root, 'tools/sprites/sources', sourceName),
      expectedHash: sourceReport.hash,
    },
  );
  for (const extra of record.extras || []) {
    await verifyExtra(extra, directory, directory);
    copies.push({
      source: safeFile(directory, extra.output.file),
      target: path.join(root, 'assets/sprites', extra.output.file),
      expectedHash: extra.output.hash,
    });
    for (const item of extra.sources) {
      const original = safeFile(directory, item.file),
        name = item.hash + '.' + item.format;
      copies.push({
        source: original,
        target: path.join(root, 'tools/sprites/sources', name),
        expectedHash: item.hash,
      });
      item.file = name;
    }
  }
  record.version = 2;
  record.output.file = outputName;
  record.source.file = sourceName;
  record.revision = revisionFor(record);
  approved.version = 2;
  if (prior) retain(approved, record.key, prior);
  approved.assets[record.key] = record;
  manifest.formatVersion = 3;
  manifest.sprites[record.key] = entryFor(record);
  return commitRegistry(approved, manifest, copies);
}
async function rollback(key, targetRevision, expectedRevision) {
  const approved = json(path.join(root, 'tools/sprites/approved.json')),
    prior = approved.assets[key],
    target = approved.history?.[key]?.[targetRevision];
  fail(
    prior ? lease(prior) === expectedRevision : expectedRevision === 'absent',
    'Rollback lease mismatch',
  );
  fail(target, 'Unknown rollback revision');
  validateRecord(target, contractFor(key), true);
  await checkProduction({ allowStaleKeys: [key] });
  if (prior) retain(approved, key, prior);
  approved.assets[key] = target;
  const manifest = json(path.join(root, 'assets/sprites/manifest.json'));
  manifest.sprites[key] =
    target.version === 1
      ? { src: './assets/sprites/' + target.output.file, ...target.runtime }
      : entryFor(target);
  return commitRegistry(approved, manifest);
}
async function remove(key, expectedRevision) {
  const approved = json(path.join(root, 'tools/sprites/approved.json')),
    prior = approved.assets[key];
  fail(prior && lease(prior) === expectedRevision, 'Removal lease mismatch');
  await checkProduction({ allowStaleKeys: [key] });
  retain(approved, key, prior);
  delete approved.assets[key];
  const manifest = json(path.join(root, 'assets/sprites/manifest.json'));
  delete manifest.sprites[key];
  return commitRegistry(approved, manifest);
}
async function attachClip(recordFile, name, frameFiles, durations, loop = true) {
  const record = json(recordFile),
    contract = contractFor(record.key),
    directory = path.dirname(path.resolve(recordFile));
  validateRecord(record, contract, true);
  fail(
    !record.presentation?.clips?.[name],
    'Clip already exists; assemble a new candidate revision',
  );
  fail(
    Array.isArray(frameFiles) &&
      frameFiles.length > 0 &&
      frameFiles.length <= 120 &&
      Array.isArray(durations) &&
      durations.length === frameFiles.length &&
      durations.every((n) => Number.isFinite(n) && n > 0 && n <= 10000),
    'Invalid clip frame timing',
  );
  const width = contract.canvas.width,
    height = contract.canvas.height,
    pad = 2;
  const columns = Math.floor(1024 / (width + pad * 2)),
    rows = Math.floor(1024 / (height + pad * 2)),
    perPage = columns * rows;
  const frames = [],
    extras = [],
    staged = [];
  fail(columns > 0 && rows > 0, 'Frame cannot fit atlas page');
  try {
    for (let start = 0; start < frameFiles.length; start += perPage) {
      const chunk = frameFiles.slice(start, start + perPage),
        composites = [],
        sources = [],
        locations = [];
      const cols = Math.min(columns, chunk.length),
        pageWidth = cols * (width + pad * 2),
        pageHeight = Math.ceil(chunk.length / cols) * (height + pad * 2);
      for (let i = 0; i < chunk.length; i++) {
        const file = path.resolve(chunk[i]),
          item = json(file),
          folder = path.dirname(file);
        validateRecord(item, contract, true);
        const input = safeFile(folder, item.output.file),
          original = safeFile(folder, item.source.file);
        fail(
          (await inspect(input)).hash === item.output.hash &&
            (await inspect(original)).hash === item.source.hash,
          'Animation frame changed after review',
        );
        const left = (i % cols) * (width + pad * 2) + pad,
          top = Math.floor(i / cols) * (height + pad * 2) + pad;
        composites.push({ input, left, top });
        locations.push({ left, top, index: start + i });
        const sourceName = 'frame-source-' + item.source.hash + '.' + item.source.format;
        const target = path.join(directory, sourceName);
        if (!fs.existsSync(target)) {
          fs.copyFileSync(original, target, fs.constants.COPYFILE_EXCL);
          staged.push(target);
        }
        fail(hash(fs.readFileSync(target)) === item.source.hash, 'Frame source collision');
        sources.push({
          ...item.source,
          file: sourceName,
          frameOutputHash: item.output.hash,
          processing: item.processing,
          review: item.review,
        });
      }
      const bytes = await sharp({
        create: {
          width: pageWidth,
          height: pageHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite(composites)
        .png({ compressionLevel: 9 })
        .toBuffer();
      const report = await inspect(bytes),
        filename = 'atlas-' + report.hash + '.png',
        target = path.join(directory, filename);
      if (!fs.existsSync(target)) {
        fs.writeFileSync(target, bytes);
        staged.push(target);
      }
      fail(hash(fs.readFileSync(target)) === report.hash, 'Atlas resource collision');
      extras.push({ role: 'atlas', output: { ...report, file: filename }, sources });
      for (const loc of locations)
        frames.push({
          src: './assets/sprites/' + filename,
          width: pageWidth,
          height: pageHeight,
          hash: report.hash,
          rect: [loc.left, loc.top, width, height],
          pivot: [width * contract.canvas.anchorX, height * contract.canvas.anchorY],
          durationMs: durations[loc.index],
        });
    }
    const presentation = {
      ...(record.presentation || {}),
      clips: { ...(record.presentation?.clips || {}), [name]: { loop, frames } },
    };
    Format.entry({ src: './assets/sprites/base.png', ...record.runtime, ...presentation });
    record.review = { status: 'pending', reference: null, inheritedStaticReview: record.review };
    record.presentation = presentation;
    record.extras = [...(record.extras || []), ...extras];
    writeJSON(recordFile, record);
    return { recordFile, pages: extras.length, frames: frames.length };
  } catch (error) {
    for (const file of staged) fs.rmSync(file, { force: true });
    throw error;
  }
}
async function attachVariants(recordFile, variants) {
  const record = json(recordFile),
    contract = contractFor(record.key),
    directory = path.dirname(path.resolve(recordFile));
  validateRecord(record, contract, true);
  fail(!record.presentation?.variants, 'Variants already exist; assemble a new candidate');
  const resources = [],
    extras = [],
    created = [];
  try {
    for (const variant of variants) {
      const file = path.resolve(variant.recordFile),
        item = json(file),
        folder = path.dirname(file);
      validateRecord(item, contract, true);
      const output = safeFile(folder, item.output.file),
        source = safeFile(folder, item.source.file);
      fail(
        (await inspect(output)).hash === item.output.hash &&
          (await inspect(source)).hash === item.source.hash,
        'Variant bytes changed',
      );
      const filename = 'variant-' + item.output.hash + '.' + item.output.format,
        sourceName = 'variant-source-' + item.source.hash + '.' + item.source.format;
      for (const [from, name, expected] of [
        [output, filename, item.output.hash],
        [source, sourceName, item.source.hash],
      ]) {
        const target = path.join(directory, name);
        if (!fs.existsSync(target)) {
          fs.copyFileSync(from, target, fs.constants.COPYFILE_EXCL);
          created.push(target);
        }
        fail(hash(fs.readFileSync(target)) === expected, 'Variant hash collision');
      }
      resources.push({
        id: variant.id,
        src: './assets/sprites/' + filename,
        width: item.output.width,
        height: item.output.height,
        hash: item.output.hash,
      });
      extras.push({
        role: 'variant',
        output: { ...item.output, file: filename },
        sources: [
          { ...item.source, file: sourceName, processing: item.processing, review: item.review },
        ],
      });
    }
    const presentation = { ...(record.presentation || {}), variants: resources };
    Format.entry({ src: './assets/sprites/base.png', ...record.runtime, ...presentation });
    record.presentation = presentation;
    record.extras = [...(record.extras || []), ...extras];
    record.review = { status: 'pending', reference: null, inheritedStaticReview: record.review };
    writeJSON(recordFile, record);
    return { recordFile, variants: resources.length };
  } catch (error) {
    for (const file of created) fs.rmSync(file, { force: true });
    throw error;
  }
}
async function spriteLayer(contract, candidateFile, presentation = null) {
  const sandbox = {
    Image: class extends Image {
      set src(_value) {
        super.src = _value.endsWith('/preview.png')
          ? candidateFile
          : path.join(path.dirname(candidateFile), path.basename(_value));
      }
    },
    console,
    fetch: async () => ({
      ok: true,
      json: async () => ({
        version: 8,
        sprites: {
          [contract.key]: {
            src: './assets/sprites/preview.png',
            width: contract.canvas.width,
            height: contract.canvas.height,
            ...contract.runtime,
            ...(presentation || {}),
          },
        },
      }),
    }),
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, 'src/prototype/sprite-format.js'), 'utf8'),
    sandbox,
  );
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/prototype/sprites.js'), 'utf8'), sandbox);
  await sandbox.PrototypeSprites.preload(undefined, [contract.key]);
  if (presentation)
    await sandbox.PrototypeSprites.warm([contract.key], { clips: true, variants: true });
  fail(
    sandbox.PrototypeSprites.status().loaded >= 1,
    'Candidate image did not decode in actual sprite layer',
  );
  for (let i = 0; i < 160; i++) sandbox.PrototypeSprites.advance(100);
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
    sprite = await spriteLayer(contract, candidate, record.presentation);
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
  const [command = 'check', key, input, format, placementFile] = process.argv.slice(2);
  let result;
  if (command === 'catalog') result = catalog();
  else if (command === 'asset') result = asset(key);
  else if (command === 'contracts') result = contracts();
  else if (command === 'inspect') result = await inspect(key);
  else if (command === 'prepare')
    result = await prepare(key, input, format, placementFile ? json(placementFile) : {});
  else if (command === 'publish') result = await publish(key);
  else if (command === 'attach-variants') result = await attachVariants(key, json(input));
  else if (command === 'attach-clip') {
    const job = json(input);
    result = await attachClip(key, job.name, job.frameFiles, job.durations, job.loop);
  } else if (command === 'replace') result = await publish(key, input);
  else if (command === 'rollback') result = await rollback(key, input, format);
  else if (command === 'remove') result = await remove(key, input);
  else if (command === 'showroom') result = await showroom(key);
  else if (command === 'check') result = await checkProduction();
  else
    throw Error(
      'Use check, catalog, contracts, inspect <image>, prepare <exact-key> <image> [png|webp], showroom [candidate.json], or publish <approved-candidate.json>',
    );
  console.log(JSON.stringify(result, null, 2));
}
module.exports = {
  parseCatalog,
  catalog,
  contracts,
  contractFor,
  asset,
  inspect,
  reference,
  prepare,
  validateRecord,
  checkProduction,
  publish,
  rollback,
  remove,
  revisionFor,
  entryFor,
  attachClip,
  attachVariants,
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
