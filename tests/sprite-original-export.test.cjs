'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  sharp = require('sharp'),
  p = require('../scripts/sprite-pipeline.cjs');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'original-export-'));
  let candidate, rectangular;
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
    // A wide selected ferry original must retain its aspect while gaining edge padding.
    const wide = path.join(dir, 'wide-original.png');
    await sharp({ create: { width: 1536, height: 768, channels: 4, background: '#00000000' } })
      .composite([
        {
          input: await sharp({
            create: { width: 768, height: 384, channels: 4, background: '#71917b' },
          })
            .png()
            .toBuffer(),
          left: 384,
          top: 192,
        },
      ])
      .png()
      .toFile(wide);
    const wideBytes = fs.readFileSync(wide);
    rectangular = await p.prepare('transport:ferry', wide, 'png', {
      rasterScale: 4.25,
      normalization: {
        fullCanvasWidth: 1536,
        fullCanvasHeight: 768,
        padding: { left: 48, right: 48, top: 24, bottom: 24 },
      },
    });
    assert.deepEqual(rectangular.record.processing.to, [612, 306]);
    assert.deepEqual(rectangular.record.output.materialBounds, {
      x1: 162,
      y1: 81,
      x2: 449,
      y2: 224,
    });
    assert(fs.readFileSync(wide).equals(wideBytes));
    await assert.rejects(
      p.prepare('transport:ferry', wide, 'png', {
        rasterScale: 4.25,
        normalization: { fullCanvasWidth: 1536, fullCanvasHeight: 1536, padding: 0 },
      }),
      /preserve source aspect/,
    );
    console.log(
      'PASS square/rectangular one-pass exports preserve source detail, aspect and bytes; invalid placement rejected',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    for (const item of [candidate, rectangular])
      if (item) fs.rmSync(item.directory, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
