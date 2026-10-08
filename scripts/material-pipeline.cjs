'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  vm = require('node:vm'),
  sharp = require('sharp');
const { createCanvas } = require('@napi-rs/canvas');
const Contract = require('../src/prototype/material-contract.js');
const root = path.resolve(__dirname, '..');
const specs = require('../tools/sprites/terrain-specifications.json');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const manifestFile = path.join(root, 'assets/materials/manifest.json'),
  registryFile = path.join(root, 'tools/sprites/materials/approved.json');
const fail = (ok, message) => {
  if (!ok) throw Error(message);
};
function safe(base, relative) {
  fail(
    typeof relative === 'string' && /^[a-zA-Z0-9_.-]+$/.test(relative) && relative !== '..',
    'Unsafe material file',
  );
  const file = path.join(base, relative);
  fail(
    fs.existsSync(file) &&
      fs.statSync(file).isFile() &&
      fs.realpathSync(file).startsWith(fs.realpathSync(base) + path.sep),
    'Missing or escaped material file',
  );
  return file;
}
function specFor(key) {
  const spec = specs.candidates.find((s) => s.resourceKey === key || s.id === key);
  fail(spec, 'Unknown material: ' + key);
  return spec;
}
function reference(key) {
  const spec = specFor(key),
    [, family, name] = spec.resourceKey.split(':'),
    regions = ['vale', 'march', 'highlands', 'frontier', 'crown'];
  const region = Math.max(
      0,
      regions.findIndex((r) => name === r || name.includes('-' + r + '-')),
    ),
    rules = require('../src/prototype/rules.js');
  const sandbox = { PrototypeRules: rules, performance: { now: () => 16000 } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/prototype/visuals.js'), 'utf8'), sandbox);
  const V = sandbox.PrototypeVisuals,
    canvas = createCanvas(256, 256),
    ctx = canvas.getContext('2d');
  let x0 = 400,
    y0 = 400,
    span = family === 'road' ? 36 : 320;
  const screen = (p) => ({
    x: (p.x - x0 - (p.y - y0)) * 0.76 + 128,
    y: (p.x - x0 + (p.y - y0)) * 0.27 + 128,
  });
  if (family === 'road') {
    x0 = 482;
    y0 = 482;
  }
  if (['rock', 'lava', 'bridge'].includes(family)) {
    const i = name === 'obsidian' || family === 'lava' ? 4 : family === 'bridge' ? 0 : 2;
    const barrier = rules.barriers[i];
    x0 = barrier.bounds[0] + 15;
    y0 = family === 'bridge' ? barrier.gaps[0][0] + 4 : family === 'lava' ? 350 : 210;
    span = Math.max(8, Math.min(32, barrier.bounds[1] - x0 - 10));
    if (name === 'obsidian') {
      const pool = rules.terrain[4].find((p) => p.kind === 'obsidian' && p.r);
      fail(pool, 'Missing current obsidian source');
      x0 = pool.x - 16;
      y0 = pool.y - 16;
      span = 32;
    }
  }
  ctx.fillStyle = spec.palette[0];
  ctx.fillRect(0, 0, 256, 256);
  ctx.scale(256 / span, 256 / span);
  ctx.transform(1 / 1.52, -1 / 1.52, 1 / 0.54, 1 / 0.54, 0, 0);
  ctx.translate(-128, -128);
  if (family === 'ground' || family === 'floor') {
    const room = name.startsWith('supply-'),
      dungeon = family === 'floor' ? name : '';
    for (let x = 320; x <= 800; x += 80)
      for (let y = 320; y <= 800; y += 80)
        V.floor(ctx, screen({ x, y }), x, y, region, room, dungeon, false);
  } else if (family === 'road')
    V.roads(
      ctx,
      [
        [
          { x: 200, y: 500 },
          { x: 900, y: 500 },
        ],
      ],
      screen,
      region,
    );
  else if (family === 'bridge') V.bridges(ctx, screen, 0);
  else V.terrain(ctx, screen, family === 'lava' || name === 'obsidian' ? 4 : 2, 3000);
  return canvas.toBuffer('image/png');
}
function dependency(spec) {
  return hash(Buffer.concat([reference(spec.resourceKey), Buffer.from(JSON.stringify(spec))]));
}
async function inspect(file, source = false) {
  const bytes = fs.readFileSync(file),
    metadata = await sharp(bytes, { limitInputPixels: 4194304 }).metadata();
  fail(
    metadata.format === 'png' && bytes.length <= (source ? 16777216 : Contract.LIMITS.encodedBytes),
    'Material must be a bounded lossless PNG',
  );
  fail(
    metadata.width === metadata.height &&
      metadata.width > 0 &&
      (!source ? metadata.width === 256 : metadata.width <= 2048),
    'Invalid square material dimensions',
  );
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let n = 3; n < data.length; n += 4) fail(data[n] === 255, 'Material must be fully opaque');
  let edgeX = 0,
    edgeY = 0,
    adjacentX = 0,
    adjacentY = 0;
  const { width: w, height: h } = info,
    delta = (a, b) => {
      let n = 0;
      for (let c = 0; c < 3; c++) n += Math.abs(data[a + c] - data[b + c]);
      return n / 3;
    };
  for (let y = 0; y < h; y++) {
    edgeX += delta(y * w * 4, (y * w + w - 1) * 4);
    for (let x = 1; x < w; x++) adjacentX += delta((y * w + x - 1) * 4, (y * w + x) * 4);
  }
  for (let x = 0; x < w; x++) {
    edgeY += delta(x * 4, ((h - 1) * w + x) * 4);
    for (let y = 1; y < h; y++) adjacentY += delta(((y - 1) * w + x) * 4, (y * w + x) * 4);
  }
  const seams = {
    x: edgeX / h,
    y: edgeY / w,
    interiorX: adjacentX / (h * (w - 1)),
    interiorY: adjacentY / (w * (h - 1)),
  };
  return { hash: hash(bytes), width: w, height: h, bytes: bytes.length, opaque: true, seams };
}
async function prepare(key, sourceFile, directory) {
  const spec = specFor(key),
    source = await inspect(sourceFile, true),
    input = fs.readFileSync(sourceFile);
  fail(!fs.existsSync(directory), 'Material candidate is immutable');
  const output = await sharp(input)
    .resize(256, 256, { kernel: 'lanczos3', fit: 'fill' })
    .png()
    .toBuffer();
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'source.png'), input);
  fs.writeFileSync(path.join(directory, 'candidate.png'), output);
  fs.writeFileSync(path.join(directory, 'reference.png'), reference(key));
  const report = await inspect(path.join(directory, 'candidate.png'));
  const composites = [];
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 3; x++) composites.push({ input: output, top: y * 256, left: x * 256 });
  await sharp({ create: { width: 768, height: 768, channels: 4, background: '#000000' } })
    .composite(composites)
    .png()
    .toFile(path.join(directory, 'wrap-review.png'));
  const record = {
    version: 1,
    key: spec.resourceKey,
    catalogId: spec.id,
    dependencyHash: dependency(spec),
    source,
    output: report,
    processing: {
      tool: 'sharp',
      version: sharp.versions.sharp,
      kernel: 'lanczos3',
      crop: false,
      trim: false,
      colorConversion: false,
      seamRepair: false,
    },
    runtime: { worldSpan: 320, opacity: 0.28 },
    review: { status: 'pending', reference: null },
  };
  write(path.join(directory, 'candidate.json'), record);
  return record;
}
function entry(record) {
  return {
    src: './assets/materials/' + record.output.hash + '.png',
    hash: record.output.hash,
    width: record.output.width,
    height: record.output.height,
    ...record.runtime,
    revision: record.revision,
  };
}
function revisionFor(record) {
  return hash(
    Buffer.from(
      JSON.stringify({
        output: record.output.hash,
        runtime: record.runtime,
        dependency: record.dependencyHash,
      }),
    ),
  );
}
function validate(record) {
  const spec = specFor(record.key);
  fail(
    record.version === 1 &&
      record.catalogId === spec.id &&
      record.dependencyHash === dependency(spec),
    'Stale material contract',
  );
  fail(
    record.review?.status === 'approved' &&
      /^https:\/\/github\.com\/joedoragon-glitch\/azeroth-chronicles-prototype\/(issues|pull)\/\d+(#.*)?$/.test(
        record.review.reference || '',
      ) &&
      record.review.nativeScale === true &&
      record.review.wrap === true,
    'Material needs recorded native/wrap review',
  );
  const { x, y, interiorX, interiorY } = record.output.seams;
  fail(
    Math.max(x, y) <= 12 && x <= Math.max(4, interiorX * 1.5) && y <= Math.max(4, interiorY * 1.5),
    'Material edge discontinuity exceeds its grain; revise the image, do not silently repair it',
  );
}
async function check() {
  const registry = json(registryFile),
    manifest = json(manifestFile),
    expected = {};
  let packagedBytes = 0;
  const resources = new Set();
  for (const [key, record] of Object.entries(registry.assets)) {
    fail(record.key === key, 'Material identity mismatch');
    validate(record);
    fail(record.revision === revisionFor(record), 'Material revision changed');
    const output = await inspect(
      safe(path.join(root, 'assets/materials'), record.output.hash + '.png'),
    );
    const source = await inspect(
      safe(path.join(root, 'tools/sprites/materials/sources'), record.source.hash + '.png'),
      true,
    );
    fail(
      JSON.stringify(output) === JSON.stringify(record.output) &&
        JSON.stringify(source) === JSON.stringify(record.source),
      'Material source/output changed',
    );
    expected[key] = entry(record);
    resources.add(record.output.hash);
  }
  for (const [key, history] of Object.entries(registry.history)) {
    fail(
      Array.isArray(history) && new Set(history.map((r) => r.revision)).size === history.length,
      'Invalid material rollback history',
    );
    for (const record of history) {
      fail(record.key === key, 'Rollback material identity changed');
      fail(record.revision === revisionFor(record), 'Retained material revision changed');
      Contract.entries({ version: 1, materials: { [key]: entry(record) } });
      const output = await inspect(
        safe(path.join(root, 'assets/materials'), record.output.hash + '.png'),
      );
      const source = await inspect(
        safe(path.join(root, 'tools/sprites/materials/sources'), record.source.hash + '.png'),
        true,
      );
      fail(
        JSON.stringify(output) === JSON.stringify(record.output) &&
          JSON.stringify(source) === JSON.stringify(record.source),
        'Retained material revision changed',
      );
      resources.add(record.output.hash);
    }
  }
  fail(
    JSON.stringify(Contract.entries(manifest)) === JSON.stringify(expected),
    'Material registry differs from manifest',
  );
  for (const id of resources)
    packagedBytes += fs.statSync(path.join(root, 'assets/materials', id + '.png')).size;
  fail(packagedBytes <= 32 * 1024 * 1024, 'Material package budget exceeded');
  return {
    active: Object.keys(expected).length,
    packagedBytes,
    decodedResidencyLimit: Contract.LIMITS.decodedBytes,
  };
}
async function publish(candidateFile, expected = 'absent') {
  const record = json(candidateFile),
    directory = path.dirname(candidateFile);
  validate(record);
  const registry = json(registryFile),
    manifest = json(manifestFile),
    old = registry.assets[record.key];
  fail((old?.revision || 'absent') === expected, 'Stale material replacement lease');
  fail(
    JSON.stringify(await inspect(path.join(directory, 'source.png'), true)) ===
      JSON.stringify(record.source) &&
      JSON.stringify(await inspect(path.join(directory, 'candidate.png'))) ===
        JSON.stringify(record.output),
    'Candidate bytes changed',
  );
  record.revision = revisionFor(record);
  Contract.entries({ version: 1, materials: { [record.key]: entry(record) } });
  const files = [manifestFile, registryFile],
    before = files.map((f) => fs.readFileSync(f));
  const created = [];
  try {
    for (const [source, target] of [
      [
        path.join(directory, 'source.png'),
        path.join(root, 'tools/sprites/materials/sources', record.source.hash + '.png'),
      ],
      [
        path.join(directory, 'candidate.png'),
        path.join(root, 'assets/materials', record.output.hash + '.png'),
      ],
    ]) {
      if (fs.existsSync(target))
        fail(
          hash(fs.readFileSync(source)) === hash(fs.readFileSync(target)),
          'Immutable material collision',
        );
      else {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
        created.push(target);
      }
    }
    registry.history[record.key] ||= [];
    if (old && !registry.history[record.key].some((r) => r.revision === old.revision))
      registry.history[record.key].push(old);
    registry.assets[record.key] = record;
    manifest.materials[record.key] = entry(record);
    write(registryFile, registry);
    write(manifestFile, manifest);
    await check();
  } catch (error) {
    files.forEach((f, i) => fs.writeFileSync(f, before[i]));
    created.forEach((f) => fs.unlinkSync(f));
    throw error;
  }
  return { key: record.key, revision: record.revision, rollback: old?.revision || 'procedural' };
}
async function rollback(key, revision, expected) {
  const registry = json(registryFile),
    manifest = json(manifestFile),
    current = registry.assets[key];
  fail((current?.revision || 'absent') === expected, 'Stale material rollback lease');
  const target =
    revision === 'procedural'
      ? null
      : (registry.history[key] || []).find((r) => r.revision === revision);
  fail(revision === 'procedural' || target, 'Missing retained material revision');
  const before = [fs.readFileSync(registryFile), fs.readFileSync(manifestFile)];
  try {
    registry.history[key] ||= [];
    if (current && !registry.history[key].some((r) => r.revision === current.revision))
      registry.history[key].push(current);
    if (target) {
      registry.assets[key] = target;
      manifest.materials[key] = entry(target);
    } else {
      delete registry.assets[key];
      delete manifest.materials[key];
    }
    write(registryFile, registry);
    write(manifestFile, manifest);
    await check();
  } catch (e) {
    fs.writeFileSync(registryFile, before[0]);
    fs.writeFileSync(manifestFile, before[1]);
    throw e;
  }
  return { key, revision: target?.revision || 'procedural' };
}
if (require.main === module)
  (async () => {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === 'check') result = await check();
    else if (command === 'reference') {
      fs.writeFileSync(args[1], reference(args[0]));
      result = { file: args[1], hash: hash(reference(args[0])) };
    } else if (command === 'inspect') result = await inspect(args[0], true);
    else if (command === 'prepare') result = await prepare(...args);
    else if (command === 'publish') result = await publish(...args);
    else if (command === 'rollback') result = await rollback(...args);
    else throw Error('Use material-pipeline check|reference|inspect|prepare|publish|rollback');
    console.log(JSON.stringify(result, null, 2));
  })().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
module.exports = {
  specFor,
  reference,
  dependency,
  inspect,
  prepare,
  check,
  publish,
  rollback,
  entry,
};
