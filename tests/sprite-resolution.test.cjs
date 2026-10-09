'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  cp = require('node:child_process'),
  sharp = require('sharp');
const root = path.resolve(__dirname, '..'),
  before = fs.readFileSync(path.join(root, 'assets/sprites/manifest.json'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-resolution-'));
(async () => {
  try {
    const checkout = path.join(temp, 'checkout');
    fs.mkdirSync(checkout);
    for (const name of ['scripts', 'tools', 'src', 'assets', 'docs'])
      fs.cpSync(path.join(root, name), path.join(checkout, name), { recursive: true });
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(checkout, 'node_modules'), 'dir');
    fs.writeFileSync(
      path.join(checkout, 'assets/sprites/manifest.json'),
      JSON.stringify({ version: 3, sprites: {} }),
    );
    fs.writeFileSync(
      path.join(checkout, 'tools/sprites/approved.json'),
      JSON.stringify({ version: 2, assets: {} }),
    );
    // Pure test fixture; no retained artwork is edited or approved by this test.
    const source = await sharp({
      create: { width: 576, height: 576, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 150, height: 195, channels: 4, background: '#7191b0' },
          })
            .png()
            .toBuffer(),
          left: 213,
          top: 237,
        },
      ])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(checkout, 'fixture.png'), source);
    fs.writeFileSync(
      path.join(checkout, 'legacy.png'),
      await sharp(source).resize(192, 192, { kernel: 'nearest' }).png().toBuffer(),
    );
    const result = cp.spawnSync(
      process.execPath,
      [
        '-e',
        `
   const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),p=require('./scripts/sprite-pipeline.cjs');
   (async()=>{
    const key='hero:paladin',contract=p.contractFor(key);
    const request=await p.generationRequest(key,'request-checkpoint');
    assert.equal(request.request.contexts.length,12);assert.equal(request.request.target.raster.width,576);
    assert(!/undefined/.test(request.request.prompt));assert.equal(request.request.promptHash,p.hash(Buffer.from(request.request.prompt)));
    assert.equal(request.request.reference.hash,p.hash(fs.readFileSync(path.join(request.directory,'procedural-reference.png'))));
    assert(request.request.contexts.every(c=>c.cameraZoom===1.5&&c.pixelWidth===Math.round(c.width*c.ratio)));
    await assert.rejects(p.generationRequest(key,'request-checkpoint'),/immutable/);
    const legacy=await p.prepare(key,'legacy.png');
    const changedContract={...contract,canvas:{...contract.canvas,width:96,height:96},runtime:{...contract.runtime,displayWidth:96,displayHeight:96}};
    assert.doesNotThrow(()=>p.validateRecord(legacy.record,changedContract,false,true),'replacement preflight can retain a stale old contract');
    assert.throws(()=>p.validateRecord(legacy.record,changedContract),/Runtime dimensions/);
    const dense=await p.prepare(key,'fixture.png','png',{rasterScale:3,offsetX:-4,offsetY:-4});
    const phone=await p.prepare(key,'fixture.png','png',{rasterScale:2.25});
    assert.deepEqual(dense.record.runtime,legacy.record.runtime);
    assert.equal(dense.record.output.width,576);assert.equal(phone.record.output.width,432);
    assert.equal(dense.record.processing.translation.rasterX,-12);
    assert.equal(dense.record.output.bounds.x1,201);assert.equal(dense.record.output.bounds.y1,225);
    assert.equal(dense.record.output.decodedBytes,576*576*4);
    assert.equal(p.hash(fs.readFileSync(path.join(dense.directory,'source.png'))),p.hash(fs.readFileSync('fixture.png')));
    await assert.rejects(p.prepare(key,'legacy.png','png',{rasterScale:3}),/sufficient original/);
    await assert.rejects(p.prepare(key,'fixture.png','png',{rasterScale:4}),/raster scale/);
    await assert.rejects(p.prepare(key,'fixture.png','png',{rasterScale:2.25,offsetX:1}),/translation/);
    assert.throws(()=>p.validateRaster({...dense.record,output:{...dense.record.output,width:192}},contract),/raster output/);
    const approve=file=>{const r=JSON.parse(fs.readFileSync(file));r.review={status:'approved',reference:'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/111#test-only'};fs.writeFileSync(file,JSON.stringify(r));return r;};
    const legacyFile=path.join(legacy.directory,'candidate.json'),denseFile=path.join(dense.directory,'candidate.json'),phoneFile=path.join(phone.directory,'candidate.json');
    const batch=require('./scripts/sprite-batch-review.cjs');
    const denseOutput=path.join(dense.directory,'candidate.png'),savedOutput=fs.readFileSync(denseOutput);
    fs.copyFileSync('legacy.png',denseOutput);await assert.rejects(batch.capture(denseFile),/bytes changed/);fs.writeFileSync(denseOutput,savedOutput);
    fs.mkdirSync('invalid-batch');fs.writeFileSync('invalid-batch/job.json',JSON.stringify({key,original:'fixture.png',fullCanvasSize:1000,padding:2}));
    await assert.rejects(batch.prepare('invalid-batch/job.json'),/without source enlargement/);
    assert(!fs.existsSync('invalid-batch/candidate.json'));
    approve(legacyFile);approve(denseFile);approve(phoneFile);
    await p.publish(legacyFile);
    const registry=()=>JSON.parse(fs.readFileSync('tools/sprites/approved.json'));
    const oldRevision=registry().assets[key].revision;
    await assert.rejects(p.attachClip(denseFile,'idle',[denseFile,legacyFile],[100,100]),/share raster density/);
    await assert.rejects(p.attachVariants(denseFile,[{id:'old',recordFile:legacyFile}]),/share raster density/);
    await p.attachClip(denseFile,'idle',[denseFile,denseFile],[100,100]);
    const assembled=JSON.parse(fs.readFileSync(denseFile));
    assert.equal(assembled.extras.length,2,'576-pixel frames use separate bounded atlas pages');
    for(const f of assembled.presentation.clips.idle.frames){assert.deepEqual(f.rect,[2,2,576,576]);assert.deepEqual(f.pivot,[288,432]);assert(f.width*f.height<=1024*1024);}
    await assert.rejects(p.publish(denseFile,oldRevision),/creative approval/);
    approve(denseFile);
    await p.publish(denseFile,oldRevision);
    const newRevision=registry().assets[key].revision;
    assert.notEqual(newRevision,oldRevision);
    const report=await p.checkProduction();assert(report.decodedBytes<=16*1024*1024);
    assert(fs.existsSync(path.join('assets/sprites',registry().history[key][oldRevision].output.file)));
    const layer=await p.spriteLayer(contract,path.join(dense.directory,'candidate.png'),assembled.presentation);
    assert.equal(layer.definitionFor({renderKind:'hero',class:'paladin'}).entry.width,576);
    const scene=p.scene(contract,375,800,layer,'day',null,{mode:'phone',devicePixelRatio:3});
    assert.equal(scene.cameraZoom,1.5);assert.equal(scene.ratio,1.5);assert.equal(scene.pixelWidth,563);assert.equal(scene.pixelHeight,1200);
    const huge=p.scene(contract,2200,1400,layer,'day',null,{mode:'desktop',devicePixelRatio:2});assert.equal(huge.ratio,1,'existing ratio floor wins for oversized viewport');
    const preview=await p.showroom(denseFile);assert.equal(preview.comparisons.length,12);
    assert(preview.comparisons.every(c=>c.cameraZoom===1.5&&c.pixelWidth===Math.round(c.width*c.ratio)));
    const capture=await require('./scripts/sprite-batch-review.cjs').capture(denseFile);
    assert.equal(capture.comparisons,12);
    await assert.rejects(require('./scripts/sprite-batch-review.cjs').capture(denseFile),/Retain existing review/);
    await p.rollback(key,oldRevision,newRevision);assert.equal(registry().assets[key].output.width,192);
    await p.checkProduction();
    const savedRegistry=fs.readFileSync('tools/sprites/approved.json'), corrupt=registry();
    corrupt.history[key][newRevision].source.width=1;fs.writeFileSync('tools/sprites/approved.json',JSON.stringify(corrupt));
    await assert.rejects(p.checkProduction(),/revision|source|Source/);fs.writeFileSync('tools/sprites/approved.json',savedRegistry);
    await p.checkProduction();
    console.log('PASS density-aware processing, unchanged geometry, source/translation guards, bounded atlases, native review, replacement and legacy rollback');
   })().catch(e=>{console.error(e);process.exitCode=1});
  `,
      ],
      { cwd: checkout, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    process.stdout.write(result.stdout);
    assert(
      fs.readFileSync(path.join(root, 'assets/sprites/manifest.json')).equals(before),
      'real production manifest stays intact',
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
