'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  sharp = require('sharp'),
  p = require('../scripts/sprite-pipeline.cjs');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'original-export-'));
  let candidate;
  try {
    const pixels = Buffer.alloc(768 * 768 * 4);
    for (let y = 0; y < 768; y++)
      for (let x = 0; x < 768; x++) {
        const n = (y * 768 + x) * 4;
        pixels[n] = x >= 128 && x < 130 ? 255 : 0;
        pixels[n + 2] = x >= 128 && x < 130 ? 0 : 255;
        pixels[n + 3] = x >= 128 && x < 640 && y >= 128 && y < 640 ? 255 : 0;
      }
    const original = path.join(dir, 'original.png');
    await sharp(pixels, { raw: { width: 768, height: 768, channels: 4 } })
      .png()
      .toFile(original);
    const originalBytes = fs.readFileSync(original);
    const lossy = await sharp(original).resize(192, 192, { kernel: 'nearest' }).raw().toBuffer();
    assert.equal(lossy[(32 * 192 + 32) * 4], 0, 'old intermediate discarded the red detail');
    candidate = await p.prepare('hero:paladin', original, 'png', {
      rasterScale: 3,
      normalization: { fullCanvasSize: 192, padding: 0 },
    });
    const fresh = await sharp(path.join(candidate.directory, 'candidate.png')).raw().toBuffer();
    assert.equal(
      fresh[(96 * 576 + 96) * 4],
      255,
      'fresh export retains original detail absent from old intermediate',
    );
    assert(fs.readFileSync(original).equals(originalBytes));
    assert.equal(candidate.record.processing.normalization.intermediatePixelsUsed, false);
    assert.equal(candidate.record.processing.normalization.samplingPasses, 1);
    await assert.rejects(
      p.prepare('hero:paladin', original, 'png', {
        rasterScale: 3,
        normalization: { fullCanvasSize: 192, padding: -1 },
      }),
      /Invalid original placement/,
    );
    await assert.rejects(
      p.prepare('hero:paladin', original, 'png', {
        rasterScale: 3,
        normalization: { fullCanvasSize: 192, padding: { left: 1, right: 0, top: 0, bottom: 0 } },
      }),
      /aspect/,
    );
    console.log(
      'PASS one-pass original exports recover detail, preserve source bytes and reject invalid placement',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    if (candidate) fs.rmSync(candidate.directory, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
