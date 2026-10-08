'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const sharp = require('sharp');
const pipeline = require('../scripts/sprite-pipeline.cjs');
const root = path.resolve(__dirname, '..');
(async () => {
  const before = fs.readFileSync(path.join(root, 'assets/sprites/manifest.json'));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-preparation-'));
  try {
    const catalog = pipeline.catalog();
    assert.equal(catalog.length, 231);
    assert.equal(catalog.filter((item) => item.status === 'generate').length, 221);
    assert.equal(catalog.filter((item) => item.status === 'procedural').length, 10);
    console.log('PASS catalog partition');
    const contracts = pipeline.contracts();
    assert.deepEqual(
      contracts.map((item) => item.key),
      ['hero:paladin', 'enemy:goblin', 'prop:vale-cottage:vale'],
    );
    assert(contracts.every((item) => ['pending', 'approved'].includes(item.approval)));
    assert.equal(
      (await pipeline.checkProduction()).registered,
      Object.keys(JSON.parse(before).sprites).length,
    );
    assert.throws(() => pipeline.contractFor('enemy:goblin:ranged'), /No prepared contract/);
    for (const contract of contracts) {
      const reference = pipeline.reference(contract),
        report = await pipeline.inspect(reference);
      assert.equal(report.width, contract.canvas.width);
      assert.equal(report.height, contract.canvas.height);
      assert(report.padding >= 2 && report.visiblePixels > 0 && report.transparentPixels > 0);
      assert.equal(
        pipeline.hash(pipeline.scene(contract, 320, 568).bytes),
        pipeline.hash(pipeline.scene(contract, 320, 568).bytes),
        'fixed scene is reproducible: ' + contract.key,
      );
    }
    console.log('PASS references and deterministic scenes');
    const reference = pipeline.reference(contracts[0]);
    const committed = fs.readFileSync(
      path.join(root, 'tests/fixtures/sprite-reference-paladin.png'),
    );
    const rgba = async (bytes) => sharp(bytes).ensureAlpha().raw().toBuffer();
    assert.equal(
      pipeline.hash(await rgba(committed)),
      pipeline.hash(await rgba(reference)),
      'binary transport fixture is actual current procedural rendering',
    );
    await assert.rejects(
      pipeline.inspect(Buffer.from('placeholder text')),
      /unsupported|corrupt|Input buffer/,
    );
    const opaque = await sharp({
      create: { width: 192, height: 192, channels: 3, background: '#aabbcc' },
    })
      .png()
      .toBuffer();
    await assert.rejects(pipeline.inspect(opaque), /alpha/);
    const blank = await sharp({
      create: { width: 192, height: 192, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    await assert.rejects(pipeline.inspect(blank), /visible content/);
    const edged = await sharp({
      create: { width: 192, height: 192, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 8, height: 8, channels: 4, background: '#aabbcc' },
          })
            .png()
            .toBuffer(),
          left: 0,
          top: 0,
        },
      ])
      .png()
      .toBuffer();
    await assert.rejects(pipeline.inspect(edged), /margin/);
    await assert.rejects(
      pipeline.inspect(reference, {
        ...require('../tools/sprites/specifications.json').policy,
        maxSourceBytes: 1,
      }),
      /byte budget/,
    );
    console.log('PASS malformed images and budgets');
    const checkout = path.join(temp, 'checkout');
    fs.mkdirSync(checkout);
    for (const name of [
      'scripts',
      'tools',
      'src',
      'assets',
      'docs',
      'styles',
      'templates',
      'icons',
    ])
      fs.cpSync(path.join(root, name), path.join(checkout, name), { recursive: true });
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(checkout, 'node_modules'), 'dir');
    fs.copyFileSync(path.join(root, 'package.json'), path.join(checkout, 'package.json'));
    for (const name of [
      'index.html',
      'prototype.html',
      'phone.html',
      'legacy.html',
      'rts.html',
      'manifest.webmanifest',
      'sw.js',
    ])
      fs.copyFileSync(path.join(root, name), path.join(checkout, name));
    const empty = { ...JSON.parse(before), sprites: {} };
    const fixtureManifest = Buffer.from(JSON.stringify(empty, null, 2) + '\n');
    fs.writeFileSync(path.join(checkout, 'assets/sprites/manifest.json'), fixtureManifest);
    fs.writeFileSync(
      path.join(checkout, 'tools/sprites/approved.json'),
      JSON.stringify({ version: 1, assets: {} }),
    );
    fs.writeFileSync(path.join(checkout, 'reference.png'), reference);
    const run = (...args) =>
      cp.spawnSync(process.execPath, ['scripts/sprite-pipeline.cjs', ...args], {
        cwd: checkout,
        encoding: 'utf8',
      });
    const success = (...args) => {
      const result = run(...args);
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    };
    console.log('PASS isolated checkout');
    const prepared = success('prepare', 'hero:paladin', 'reference.png', 'png');
    assert.equal(prepared.record.review.status, 'pending');
    assert(fs.readFileSync(path.join(prepared.directory, 'source.png')).equals(reference));
    assert.equal(
      pipeline.hash(await rgba(fs.readFileSync(path.join(prepared.directory, 'candidate.png')))),
      pipeline.hash(await rgba(reference)),
      'PNG processing keeps pixels at matching dimensions',
    );
    const duplicate = run('prepare', 'hero:paladin', 'reference.png', 'png');
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /immutable/);
    assert.deepEqual(fs.readdirSync(prepared.directory).sort(), [
      'candidate.json',
      'candidate.png',
      'canonical.png',
      'source.png',
    ]);
    console.log('PASS immutable PNG processing');
    const webp = success('prepare', 'hero:paladin', 'reference.png', 'webp');
    // Invisible RGB channels are not visual content; compare premultiplied pixels for lossless alpha output.
    const normalize = (bytes) => {
      const output = Buffer.from(bytes);
      for (let i = 0; i < output.length; i += 4) if (!output[i + 3]) output.fill(0, i, i + 3);
      return output;
    };
    assert.equal(
      pipeline.hash(
        normalize(await rgba(fs.readFileSync(path.join(webp.directory, 'candidate.webp')))),
      ),
      pipeline.hash(normalize(await rgba(reference))),
    );
    const recordFile = path.join(prepared.directory, 'candidate.json');
    const pending = run('publish', recordFile);
    assert.notEqual(pending.status, 0);
    assert.match(pending.stderr, /creative approval/);
    assert(
      fs.readFileSync(path.join(checkout, 'assets/sprites/manifest.json')).equals(fixtureManifest),
    );
    console.log('PASS WebP and pending approval guard');
    const preview = success('showroom', recordFile);
    assert.equal(preview.comparisons.length, 8);
    assert.equal(preview.pending, false);
    const sprites = await pipeline.spriteLayer(
      contracts[0],
      path.join(prepared.directory, 'candidate.png'),
    );
    assert.equal(sprites.status().loaded, 1);
    assert.equal(
      sprites.definitionFor({ renderKind: 'enemy', species: 'goblin', ranged: true }),
      null,
    );
    const record = JSON.parse(fs.readFileSync(recordFile));
    record.review = {
      status: 'approved',
      reference:
        'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/111#test-only-approval',
    };
    const stale = { ...record, canonHash: 'stale' };
    fs.writeFileSync(recordFile, JSON.stringify(stale));
    const rejected = run('publish', recordFile);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /Stale/);
    fs.writeFileSync(recordFile, JSON.stringify(record));
    const injected = cp.spawnSync(
      process.execPath,
      [
        '-e',
        `
      const fs=require('fs'), pipeline=require('./scripts/sprite-pipeline.cjs');
      const write=fs.writeFileSync;let injected=false;
      fs.writeFileSync=function(file,...args){if(String(file).endsWith('assets/sprites/manifest.json')&&!injected){injected=true;throw Error('simulated write failure');}return write.call(fs,file,...args);};
      pipeline.publish(process.argv[1]).then(()=>process.exit(1)).catch(error=>{if(!error.message.includes('simulated')){console.error(error);process.exitCode=1;}});
    `,
        recordFile,
      ],
      { cwd: checkout, encoding: 'utf8' },
    );
    assert.equal(injected.status, 0, injected.stderr);
    assert.equal(
      success('check').registered,
      0,
      'failed publication rolls metadata and binary output back',
    );
    const published = success('publish', recordFile);
    assert.equal(published.registered, 1);
    assert(published.decodedBytes > 0);
    assert.equal(success('check').uniqueImages, 1);
    assert.notEqual(run('publish', recordFile).status, 0, 'approved output cannot be overwritten');
    const packageResult = cp.spawnSync(
      process.execPath,
      ['scripts/build.cjs', '--check', '--site'],
      {
        cwd: checkout,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_SHA: 'isolated-sprite-preparation' },
      },
    );
    assert.equal(packageResult.status, 0, packageResult.stderr);
    const packagedManifest = JSON.parse(
      fs.readFileSync(path.join(checkout, '_site/assets/sprites/manifest.json')),
    );
    const packed = path.join(checkout, '_site', packagedManifest.sprites['hero:paladin'].src);
    assert.equal(
      pipeline.hash(fs.readFileSync(packed)),
      prepared.record.output.hash,
      'real transparent image is packaged byte-for-byte',
    );
    for (const name of [
      'tools/sprites',
      'tests',
      'node_modules',
      '_sprite-work',
      '_sprite-preview',
    ])
      assert(
        !fs.existsSync(path.join(checkout, '_site', name)),
        'development-only files never enter the public site',
      );
    const ownerFile = path.join(checkout, 'tools/sprites/approved.json');
    const owner = JSON.parse(fs.readFileSync(ownerFile));
    const singleManifest = JSON.parse(
      fs.readFileSync(path.join(checkout, 'assets/sprites/manifest.json')),
    );
    const duplicateRecord = JSON.parse(JSON.stringify(owner.assets['hero:paladin']));
    const goblin = pipeline.contractFor('enemy:goblin');
    Object.assign(duplicateRecord, {
      key: goblin.key,
      catalogId: goblin.catalogId,
      catalogHash: goblin.catalog.sourceHash,
      runtime: goblin.runtime,
    });
    owner.assets[goblin.key] = duplicateRecord;
    fs.writeFileSync(ownerFile, JSON.stringify(owner));
    const doubled = JSON.parse(JSON.stringify(singleManifest));
    doubled.sprites[goblin.key] = {
      src: singleManifest.sprites['hero:paladin'].src,
      ...goblin.runtime,
    };
    fs.writeFileSync(path.join(checkout, 'assets/sprites/manifest.json'), JSON.stringify(doubled));
    const duplicateBudget = success('check');
    assert.equal(duplicateBudget.uniqueImages, 1);
    assert.equal(
      duplicateBudget.decodedBytes,
      prepared.record.output.decodedBytes * 2,
      'budget includes key-level duplicate decodes',
    );
    const specFile = path.join(checkout, 'tools/sprites/specifications.json'),
      policy = JSON.parse(fs.readFileSync(specFile));
    policy.policy.maxDecodedRegistryBytes = prepared.record.output.decodedBytes + 1;
    fs.writeFileSync(specFile, JSON.stringify(policy));
    const overBudget = run('check');
    assert.notEqual(overBudget.status, 0);
    assert.match(overBudget.stderr, /decoded-memory budget/);
    delete owner.assets[goblin.key];
    fs.writeFileSync(ownerFile, JSON.stringify(owner));
    fs.writeFileSync(
      path.join(checkout, 'assets/sprites/manifest.json'),
      JSON.stringify(singleManifest),
    );
    const manifestFile = path.join(checkout, 'assets/sprites/manifest.json'),
      manifest = JSON.parse(fs.readFileSync(manifestFile));
    manifest.sprites['enemy:goblin:ranged'] = manifest.sprites['hero:paladin'];
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    assert.notEqual(run('check').status, 0, 'unapproved exact variant is rejected');
    assert.throws(() => pipeline.safeFile(temp, '../outside.png'), /Unsafe/);
    fs.writeFileSync(path.join(temp, 'outside.png'), reference);
    fs.symlinkSync(path.join(temp, 'outside.png'), path.join(checkout, 'outside-link.png'));
    assert.throws(() => pipeline.safeFile(checkout, 'outside-link.png'), /escapes/);
    console.log(
      'PASS catalog/contracts, transparent binary, deterministic scenes, alpha/margins, PNG/WebP processing, immutable sources, actual decoding, approval/stale-key safeguards and isolated publication',
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    assert(
      fs.readFileSync(path.join(root, 'assets/sprites/manifest.json')).equals(before),
      'production art registry unchanged even on fixture failure',
    );
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
