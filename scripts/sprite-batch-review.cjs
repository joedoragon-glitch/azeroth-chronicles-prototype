'use strict';
// Development-only deterministic preparation. This never approves or publishes art.
const fs = require('node:fs'),
  path = require('node:path'),
  sharp = require('sharp'),
  pipeline = require('./sprite-pipeline.cjs');
const root = path.resolve(__dirname, '..');
async function capture(recordFile, entity = null) {
  const directory = path.dirname(path.resolve(recordFile)),
    record = JSON.parse(fs.readFileSync(recordFile)),
    base = pipeline.contractFor(record.key),
    contract = entity ? { ...base, entity } : base,
    reviewTarget = path.join(directory, 'review-scenes');
  pipeline.validateRecord(record, base);
  if (fs.existsSync(reviewTarget))
    throw Error('Retain existing review; capture in a new revision directory');
  const review = fs.mkdtempSync(path.join(directory, '.review-'));
  try {
    const sprite = await pipeline.spriteLayer(
      base,
      path.join(directory, record.output.file),
      record.presentation,
    );
    const rows = [],
      comparisons = [];
    for (const profile of require('../tools/sprites/specifications.json').policy.reviewProfiles)
      for (const lighting of ['day', 'night']) {
        const { width, height } = profile;
        const canonical = pipeline.scene(contract, width, height, null, lighting, null, profile),
          candidate = pipeline.scene(contract, width, height, sprite, lighting, null, profile);
        const anchor = canonical.anchor,
          ratio = canonical.ratio,
          cropWidth = Math.min(
            canonical.pixelWidth,
            Math.ceil(record.runtime.displayWidth * canonical.cameraZoom * ratio),
          ),
          cropHeight = Math.min(
            canonical.pixelHeight,
            Math.ceil(record.runtime.displayHeight * canonical.cameraZoom * ratio),
          ),
          crop = {
            left: Math.max(
              0,
              Math.min(
                canonical.pixelWidth - cropWidth,
                Math.round(anchor.x * ratio - cropWidth / 2),
              ),
            ),
            top: Math.max(
              0,
              Math.min(
                canonical.pixelHeight - cropHeight,
                Math.round(anchor.y * ratio - cropHeight * record.runtime.anchorY),
              ),
            ),
            width: cropWidth,
            height: cropHeight,
          };
        const index = comparisons.length;
        for (const [column, scene] of [canonical, candidate].entries()) {
          const input = await sharp(scene.bytes).extract(crop).png().toBuffer();
          fs.writeFileSync(
            path.join(
              review,
              (column ? 'candidate-' : 'canonical-') +
                width +
                'x' +
                height +
                '-' +
                lighting +
                '.png',
            ),
            scene.bytes,
          );
          rows.push({
            input: await sharp(input)
              .resize(288, 288, { fit: 'contain', background: '#19261d' })
              .png()
              .toBuffer(),
            left: column * 288,
            top: index * 288,
          });
        }
        comparisons.push({
          width,
          height,
          lighting,
          mode: canonical.mode,
          cameraZoom: canonical.cameraZoom,
          ratio,
          pixelWidth: canonical.pixelWidth,
          pixelHeight: canonical.pixelHeight,
          anchor,
          crop,
          canonicalHash: pipeline.hash(canonical.bytes),
          candidateHash: pipeline.hash(candidate.bytes),
        });
      }
    await sharp({
      create: { width: 576, height: comparisons.length * 288, channels: 4, background: '#19261d' },
    })
      .composite(rows)
      .png()
      .toFile(path.join(review, 'native-review.png'));
    fs.writeFileSync(
      path.join(review, 'comparison.json'),
      JSON.stringify(
        {
          key: record.key,
          entity: contract.entity,
          comparisons,
          review: 'pending visual inspection',
        },
        null,
        2,
      ) + '\n',
    );
    fs.renameSync(review, reviewTarget);
    return { review: reviewTarget, comparisons: comparisons.length };
  } finally {
    fs.rmSync(review, { recursive: true, force: true });
  }
}
async function prepare(jobFile) {
  const job = JSON.parse(fs.readFileSync(jobFile)),
    directory = path.dirname(path.resolve(jobFile)),
    original = path.resolve(root, job.original),
    contract = pipeline.contractFor(job.key);
  if (fs.existsSync(path.join(directory, 'candidate.json')))
    throw Error('Candidate/checkpoint is immutable; prepare in a new revision directory');
  const target = path.join(directory, 'image-tool-original.png');
  if (!fs.existsSync(target)) fs.copyFileSync(original, target, fs.constants.COPYFILE_EXCL);
  if (pipeline.hash(fs.readFileSync(original)) !== pipeline.hash(fs.readFileSync(target)))
    throw Error('Retained original differs; create a new revision directory');
  fs.writeFileSync(path.join(directory, 'reference.png'), pipeline.reference(contract));
  const normalized = await sharp(original)
    .resize(job.fullCanvasSize, job.fullCanvasSize, { kernel: 'nearest' })
    .extend({
      left: job.padding,
      right: job.padding,
      top: job.padding,
      bottom: job.padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const padded = path.join(directory, 'padded-source.png');
  fs.writeFileSync(padded, normalized);
  const result = await pipeline.prepare(job.key, padded, 'png', {
    ...job.translation,
    rasterScale: job.rasterScale ?? 1,
  });
  for (const file of fs.readdirSync(result.directory))
    fs.copyFileSync(path.join(result.directory, file), path.join(directory, file));
  fs.writeFileSync(
    path.join(directory, 'normalization.json'),
    JSON.stringify(
      {
        originalHash: pipeline.hash(fs.readFileSync(original)),
        normalizedHash: pipeline.hash(normalized),
        fullCanvasSize: job.fullCanvasSize,
        padding: job.padding,
        translation: job.translation,
        crop: false,
        trim: false,
        alphaDeletion: false,
        reason:
          'Explicit full-canvas resize, transparent padding and root translation; immutable original retained.',
      },
      null,
      2,
    ) + '\n',
  );
  return capture(path.join(directory, 'candidate.json'), job.entity || null);
}
module.exports = { prepare, capture };
if (require.main === module) {
  const [command, file] = process.argv.slice(2);
  (command === 'prepare'
    ? prepare(file)
    : command === 'capture'
      ? capture(file)
      : Promise.reject(Error('Use prepare <job.json> or capture <candidate.json>'))
  )
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
