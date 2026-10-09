'use strict';
// Development evidence only. Captures do not approve or install a material.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { Image } = require('@napi-rs/canvas');
const Sprites = require('./sprite-pipeline.cjs');
const Pipeline = require('./material-pipeline.cjs');
const Materials = require('../src/prototype/materials.js');
const profiles = require('../tools/sprites/specifications.json').policy.reviewProfiles;
async function capture(file, destination) {
  assert(!fs.existsSync(destination), 'Retain prior evidence; select a new directory');
  const bytes = fs.readFileSync(file);
  const record = JSON.parse(bytes);
  const candidate = path.resolve(path.dirname(file), 'candidate.png');
  assert.equal((await Pipeline.inspect(candidate)).hash, record.output.hash);
  assert(record.key.startsWith('terrain:road:'), 'This capture requires a regional road');
  const region = ['vale', 'march', 'highlands', 'frontier', 'crown'].indexOf(
    record.key.split(':')[2],
  );
  assert(region >= 0);
  class PreviewImage extends Image {
    set src(_) {
      super.src = candidate;
    }
  }
  const layer = new Materials({ Image: PreviewImage });
  assert(
    layer.install({
      version: 1,
      materials: { [record.key]: { ...Pipeline.entry(record), revision: record.output.hash } },
    }),
  );
  assert(await layer.ensure(record.key));
  fs.mkdirSync(destination, { recursive: true });
  const contract = { ...Sprites.contractFor('hero:paladin'), region };
  const scenes = [];
  for (const profile of profiles)
    for (const lighting of ['day', 'night']) {
      const options = { ...profile, reviewRoad: true };
      const before = Sprites.scene(
        contract,
        profile.width,
        profile.height,
        null,
        lighting,
        null,
        options,
      );
      const after = Sprites.scene(
        contract,
        profile.width,
        profile.height,
        null,
        lighting,
        layer,
        options,
      );
      assert.notEqual(
        Sprites.hash(before.bytes),
        Sprites.hash(after.bytes),
        'Candidate must actually paint the road',
      );
      const name = `${profile.width}x${profile.height}-${lighting}`;
      const width = Math.min(after.pixelWidth, Math.ceil(320 * after.ratio));
      const height = Math.min(after.pixelHeight, Math.ceil(230 * after.ratio));
      const crop = {
        left: Math.max(
          0,
          Math.min(after.pixelWidth - width, Math.round(after.anchor.x * after.ratio - width / 2)),
        ),
        top: Math.max(
          0,
          Math.min(
            after.pixelHeight - height,
            Math.round(after.anchor.y * after.ratio - height / 2),
          ),
        ),
        width,
        height,
      };
      const panels = [];
      for (const [label, scene] of [
        ['canonical', before],
        ['candidate', after],
      ]) {
        fs.writeFileSync(path.join(destination, `${name}-${label}-scene.png`), scene.bytes);
        panels.push({
          input: await sharp(scene.bytes).extract(crop).png().toBuffer(),
          left: label === 'canonical' ? 0 : width,
          top: 0,
        });
      }
      await sharp({ create: { width: width * 2, height, channels: 4, background: '#344b39' } })
        .composite(panels)
        .png()
        .toFile(path.join(destination, `${name}.png`));
      scenes.push({
        name,
        mode: after.mode,
        cameraZoom: after.cameraZoom,
        ratio: after.ratio,
        pixelWidth: after.pixelWidth,
        pixelHeight: after.pixelHeight,
        crop,
        baselineHash: Sprites.hash(before.bytes),
        candidateHash: Sprites.hash(after.bytes),
      });
    }
  assert.equal(Sprites.hash(fs.readFileSync(file)), Sprites.hash(bytes));
  fs.writeFileSync(
    path.join(destination, 'evidence.json'),
    JSON.stringify(
      {
        key: record.key,
        recordHash: Sprites.hash(bytes),
        sourceHash: record.source.hash,
        outputHash: record.output.hash,
        scenes,
        status: layer.status(),
        review: 'pending engineer inspection',
      },
      null,
      2,
    ) + '\n',
  );
  return { key: record.key, scenes: scenes.length, destination };
}
if (require.main === module)
  capture(...process.argv.slice(2))
    .then((x) => console.log(JSON.stringify(x)))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
module.exports = { capture };
