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
    assert.equal(catalog.length, 296);
    assert.equal(catalog.filter((item) => item.status === 'generate').length, 280);
    assert.equal(catalog.filter((item) => item.status === 'procedural').length, 16);
    const sourceText = fs.readFileSync(
      path.join(root, 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'),
      'utf8',
    );
    const extended =
      sourceText.replace('"entries":296,"generate":280', '"entries":297,"generate":281') +
      '\n### 297 — Reviewed future asset\n\n**Canonical cues:** Current exact source.\n\n**Image-generation prompt:**\n\n> One asset.\n';
    assert.equal(
      pipeline.parseCatalog(extended).length,
      297,
      'reviewed additions are not blocked by a historic fixed count',
    );
    assert.throws(
      () =>
        pipeline.parseCatalog(
          sourceText +
            '\n### 297 — Unreconciled asset\n\n**Image-generation prompt:**\n\n> One asset.\n',
        ),
      /totals changed/,
      'unreviewed count changes still reject',
    );
    console.log('PASS reviewed open catalog partition');
    const contracts = pipeline.contracts();
    assert.deepEqual(
      contracts.slice(0, 3).map((item) => item.key),
      ['hero:paladin', 'enemy:goblin', 'prop:vale-cottage:vale'],
    );
    assert(contracts.length >= 70, 'retain all baseline contracts as the open catalog grows');
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
        pipeline.hash(pipeline.scene(contract, 375, 800).bytes),
        pipeline.hash(pipeline.scene(contract, 375, 800).bytes),
        'fixed scene is reproducible: ' + contract.key,
      );
    }
    console.log('PASS references and deterministic scenes');
    const cleanGoblin = await sharp(pipeline.reference(contracts[1], true))
      .ensureAlpha()
      .raw()
      .toBuffer();
    const groundedGoblin = await sharp(pipeline.reference(contracts[1]))
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.notDeepEqual(
      cleanGoblin,
      groundedGoblin,
      'generation reference removes procedural ground markings',
    );
    for (let i = 0; i < cleanGoblin.length; i += 4)
      if (
        Math.floor(i / 4 / 192) < 144 &&
        groundedGoblin[i + 3] === 281 &&
        cleanGoblin[i + 3] === 281
      )
        assert.deepEqual(
          cleanGoblin.subarray(i, i + 4),
          groundedGoblin.subarray(i, i + 4),
          'opaque actor materials above the grounding zone remain unchanged',
        );
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
      'generation-reference.png',
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
    assert.equal(preview.comparisons.length, 12);
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
      const rename=fs.renameSync;let injected=false;
      fs.renameSync=function(from,file){if(String(file).endsWith('assets/sprites/manifest.json')&&!injected){injected=true;throw Error('simulated write failure');}return rename.call(fs,from,file);};
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
    const ownerPath = path.join(checkout, 'tools/sprites/approved.json');
    const getActive = () => JSON.parse(fs.readFileSync(ownerPath)).assets['hero:paladin'];
    const firstRevision = getActive().revision;
    const replacementFile = path.join(webp.directory, 'candidate.json');
    const replacement = JSON.parse(fs.readFileSync(replacementFile));
    replacement.review = record.review;
    fs.writeFileSync(replacementFile, JSON.stringify(replacement));
    assert.notEqual(
      run('replace', replacementFile, '0'.repeat(64)).status,
      0,
      'wrong replacement lease rejects',
    );
    success('replace', replacementFile, firstRevision);
    const secondRevision = getActive().revision;
    assert.notEqual(secondRevision, firstRevision);
    assert(
      fs.existsSync(
        path.join(
          checkout,
          'assets/sprites',
          JSON.parse(fs.readFileSync(ownerPath)).history['hero:paladin'][firstRevision].output.file,
        ),
      ),
      'old binary retained',
    );
    success('rollback', 'hero:paladin', firstRevision, secondRevision);
    assert.equal(getActive().revision, firstRevision);
    assert.notEqual(
      run('rollback', 'hero:paladin', secondRevision, secondRevision).status,
      0,
      'rollback lease rejects',
    );
    const clipJob = path.join(checkout, 'clip-job.json');
    fs.writeFileSync(
      clipJob,
      JSON.stringify({
        name: 'idle',
        frameFiles: [recordFile, replacementFile],
        durations: [100, 100],
        loop: true,
      }),
    );
    success('attach-clip', replacementFile, clipJob);
    assert.notEqual(
      run('replace', replacementFile, firstRevision).status,
      0,
      'assembly requires a final review',
    );
    const assembled = JSON.parse(fs.readFileSync(replacementFile));
    assembled.review = record.review;
    fs.writeFileSync(replacementFile, JSON.stringify(assembled));
    success('replace', replacementFile, firstRevision);
    assert.equal(success('check').uniqueImages, 2, 'fallback and atlas registered');
    success('rollback', 'hero:paladin', firstRevision, getActive().revision);
    // An unrelated renderer edit must not invalidate accepted image evidence.
    const rendererFile = path.join(checkout, 'src/prototype/renderer.js');
    fs.appendFileSync(rendererFile, '\n// unrelated maintenance\n');
    success('check');
    const originalCatalog = fs.readFileSync(
      path.join(checkout, 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'),
      'utf8',
    );
    fs.writeFileSync(
      path.join(checkout, 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'),
      originalCatalog.replace('"entries":296,"generate":280', '"entries":297,"generate":281') +
        '\n### 297 — Future object\n\n**Image-generation prompt:**\n\n> One object.\n',
    );
    success('check');
    fs.writeFileSync(path.join(checkout, 'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'), originalCatalog);
    assert.notEqual(run('remove', 'hero:paladin', '0'.repeat(64)).status, 0);
    success('remove', 'hero:paladin', firstRevision);
    assert.equal(success('check').registered, 0);
    // Restore a removed registration using the explicit absent lease.
    assert.notEqual(run('rollback', 'hero:paladin', firstRevision, firstRevision).status, 0);
    success('rollback', 'hero:paladin', firstRevision, 'absent');
    assert.equal(success('asset', 'hero:paladin').matches[0].activeRevision, firstRevision);
    assert.equal(
      success('asset', 'goblin').resolved,
      false,
      'ambiguous species names return choices',
    );
    console.log(
      'PASS replacement leases, retained revisions, rollback/removal, atlas provenance and unrelated-source/catalog additions',
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
      canonHash: goblin.canonHash,
      runtime: goblin.runtime,
    });
    duplicateRecord.revision = pipeline.revisionFor(duplicateRecord);
    owner.assets[goblin.key] = duplicateRecord;
    fs.writeFileSync(ownerFile, JSON.stringify(owner));
    const doubled = JSON.parse(JSON.stringify(singleManifest));
    doubled.sprites[goblin.key] = pipeline.entryFor(duplicateRecord);
    fs.writeFileSync(path.join(checkout, 'assets/sprites/manifest.json'), JSON.stringify(doubled));
    const duplicateBudget = success('check');
    assert.equal(duplicateBudget.uniqueImages, 1);
    assert.equal(
      duplicateBudget.decodedBytes,
      prepared.record.output.decodedBytes,
      'shared content is decoded once',
    );
    const specFile = path.join(checkout, 'tools/sprites/specifications.json'),
      policy = JSON.parse(fs.readFileSync(specFile));
    policy.policy.maxActiveDecodedBytes = prepared.record.output.decodedBytes - 1;
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
