'use strict';
// Immutable native raster crops plus complete scene hashes; never approves or installs art.
const fs = require('node:fs'),
  path = require('node:path'),
  sharp = require('sharp'),
  p = require('./sprite-pipeline.cjs'),
  profiles = require('../tools/sprites/specifications.json').policy.reviewProfiles;
async function capture(file) {
  const record = JSON.parse(fs.readFileSync(file)),
    dir = path.join(path.dirname(file), 'native-review-v1');
  if (fs.existsSync(dir)) throw Error('Retain existing native evidence');
  fs.mkdirSync(dir);
  const contract = p.contractFor(record.key),
    sprite = await p.spriteLayer(
      contract,
      path.join(path.dirname(file), record.output.file),
      record.presentation,
    ),
    rows = [];
  for (const profile of profiles)
    for (const light of ['day', 'night']) {
      const scene = p.scene(contract, profile.width, profile.height, sprite, light, null, profile);
      const crop = {
        left: Math.max(0, Math.round(scene.anchor.x * scene.ratio - 144 * scene.ratio)),
        top: Math.max(0, Math.round(scene.anchor.y * scene.ratio - 180 * scene.ratio)),
        width: Math.min(scene.pixelWidth, Math.round(288 * scene.ratio)),
        height: Math.min(scene.pixelHeight, Math.round(240 * scene.ratio)),
      };
      crop.left = Math.min(crop.left, scene.pixelWidth - crop.width);
      crop.top = Math.min(crop.top, scene.pixelHeight - crop.height);
      const name = profile.width + 'x' + profile.height + '-' + light;
      await sharp(scene.bytes)
        .extract(crop)
        .png()
        .toFile(path.join(dir, name + '.png'));
      // Complete view retained losslessly compressed via PNG; crops supply native review detail.
      if (profile.width === 375) fs.writeFileSync(path.join(dir, name + '-scene.png'), scene.bytes);
      rows.push({
        name,
        mode: scene.mode,
        zoom: scene.cameraZoom,
        ratio: scene.ratio,
        pixelWidth: scene.pixelWidth,
        pixelHeight: scene.pixelHeight,
        crop,
        fullSceneHash: p.hash(scene.bytes),
      });
    }
  const frames = record.presentation?.clips?.idle?.frames || [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    await sharp(path.join(path.dirname(file), path.basename(f.src)))
      .extract({
        left: f.rect[0],
        top: f.rect[1],
        width: f.rect[2],
        height: f.rect[3],
      })
      .png()
      .toFile(path.join(dir, 'idle-frame-' + i + '.png'));
  }
  const evidence = {
    key: record.key,
    outputHash: record.output.hash,
    sourceHash: record.source.hash,
    clips: record.presentation || null,
    scenes: rows,
    review: 'pending engineer visual inspection',
    countsAsProductionAsset: false,
  };
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  return { key: record.key, scenes: rows.length, frames: frames.length, dir };
}
module.exports = { capture };
if (require.main === module)
  capture(process.argv[2])
    .then((r) => console.log(JSON.stringify(r)))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
