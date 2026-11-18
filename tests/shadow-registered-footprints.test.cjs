'use strict';
// #893: measurements from real registered PNG bytes; presentation evidence only.
// This script never adjusts game geometry, sprites, collision, or saved state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/sprites/manifest.json'), 'utf8'));
const out = path.resolve(process.env.SHADOW_AUDIT_OUT || path.join(root, 'test-artifacts/shadow-893'));
const tileWidth = 246, tileHeight = 250, columns = 6;
fs.mkdirSync(out, { recursive: true });

function assetPath(src) {
  assert(typeof src === 'string' && src.startsWith('./assets/sprites/'), 'Registered local PNG path required');
  const file = path.resolve(root, src);
  assert(file.startsWith(path.join(root, 'assets/sprites') + path.sep), 'Asset must stay in sprites directory');
  return file;
}

function measure(data, width, height, channels, pivot) {
  // Alpha thresholds include antialiasing but separate near-invisible fringes.
  const thresholds = [16, 64, 160];
  const results = {};
  for (const cutoff of thresholds) {
    let x0 = width, x1 = -1, y0 = height, y1 = -1, pixels = 0;
    const rowCount = new Uint32Array(height);
    const rowMin = new Int32Array(height).fill(width);
    const rowMax = new Int32Array(height).fill(-1);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * channels + 3] < cutoff) continue;
        pixels++;
        rowCount[y]++;
        rowMin[y] = Math.min(x, rowMin[y]);
        rowMax[y] = Math.max(x, rowMax[y]);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    assert(pixels > 0, 'Registered sprite has no visible alpha');
    const scanY = Math.max(0, Math.min(height - 1, Math.round(pivot.y)));
    const bandHalfHeight = Math.max(2, Math.round(height * 0.02));
    let bandPixels = 0, bandMinX = width, bandMaxX = -1;
    for (let y = Math.max(0, scanY - bandHalfHeight); y <= Math.min(height - 1, scanY + bandHalfHeight); y++) {
      bandPixels += rowCount[y];
      if (rowCount[y]) {
        bandMinX = Math.min(bandMinX, rowMin[y]);
        bandMaxX = Math.max(bandMaxX, rowMax[y]);
      }
    }
    let afterPivotPixels = 0;
    for (let y = scanY + 1; y < height; y++) afterPivotPixels += rowCount[y];
    results[String(cutoff)] = {
      bbox: { left: x0, top: y0, right: x1, bottom: y1 },
      occupiedPixels: pixels,
      occupancy: +(pixels / (width * height)).toFixed(5),
      paintedBelowPivotPercent: +(100 * afterPivotPixels / pixels).toFixed(2),
      pivotBand: {
        centerY: scanY,
        halfHeight: bandHalfHeight,
        occupiedPixels: bandPixels,
        spanPixels: bandMaxX < bandMinX ? 0 : bandMaxX - bandMinX + 1,
        spanDisplayFraction: bandMaxX < bandMinX ? 0 : +((bandMaxX - bandMinX + 1) / width).toFixed(4),
      },
    };
  }
  return results;
}

function xml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function inspect(key, def, frame, frameIndex) {
  const entry = frame || def;
  const source = assetPath(entry.src);
  const png = fs.readFileSync(source);
  const digest = crypto.createHash('sha256').update(png).digest('hex');
  assert.equal(digest, entry.hash, 'Hashed registered master changed: ' + key);
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.width, entry.width, key + ' registered PNG width');
  assert.equal(metadata.height, entry.height, key + ' registered PNG height');
  const rect = frame?.rect || [0, 0, entry.width, entry.height];
  assert(rect.length === 4 && rect.every(Number.isInteger), key + ' valid frame crop');
  assert(rect[0] >= 0 && rect[1] >= 0 && rect[2] > 0 && rect[3] > 0 &&
    rect[0] + rect[2] <= metadata.width && rect[1] + rect[3] <= metadata.height,
    key + ' crop contained in atlas');
  const extracted = await sharp(png).extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = rect[2], height = rect[3];
  const pivot = frame?.pivot
    ? { x: frame.pivot[0], y: frame.pivot[1] }
    : { x: width * def.anchorX, y: height * def.anchorY };
  assert(pivot.x >= 0 && pivot.x <= width && pivot.y >= 0 && pivot.y <= height,
    key + ' declared pivot outside body');
  const alpha = measure(extracted.data, width, height, extracted.info.channels, pivot);
  const displayWidth = def.displayWidth || 192, displayHeight = def.displayHeight || 192;
  const targetWidth = Math.round(Math.min(216, displayWidth));
  const targetHeight = Math.round(targetWidth * height / width);
  const drawX = Math.round((tileWidth - targetWidth) / 2);
  const drawY = 8 + Math.floor((200 - targetHeight) / 2);
  assert(drawY >= 0 && drawY + targetHeight <= 208, key + ' tile crop');
  const thumb = await sharp(png).extract({ left: rect[0], top: rect[1], width, height })
    .resize(targetWidth, targetHeight).png().toBuffer();
  const markX = drawX + pivot.x * targetWidth / width;
  const markY = drawY + pivot.y * targetHeight / height;
  const bbox = alpha['16'].bbox;
  const bx = drawX + bbox.left * targetWidth / width;
  const by = drawY + bbox.top * targetHeight / height;
  const bw = (bbox.right - bbox.left + 1) * targetWidth / width;
  const bh = (bbox.bottom - bbox.top + 1) * targetHeight / height;
  const label = key + (frame ? ' idle-' + frameIndex : '');
  const overlay = Buffer.from('<svg width="' + tileWidth + '" height="' + tileHeight + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) +
    '" height="' + bh.toFixed(1) + '" fill="none" stroke="#00a8c8" stroke-dasharray="3 3" stroke-width="1"/>' +
    '<line x1="' + drawX + '" y1="' + markY.toFixed(1) + '" x2="' + (drawX + targetWidth) +
    '" y2="' + markY.toFixed(1) + '" stroke="#ce4260" stroke-width="1.5"/>' +
    '<circle cx="' + markX.toFixed(1) + '" cy="' + markY.toFixed(1) + '" r="3" fill="#ce4260"/>' +
    '<text x="8" y="225" font-size="12" font-family="sans-serif" fill="#191b1e">' +
    xml(label.slice(0, 29)) + '</text>' +
    '<text x="8" y="241" font-size="10" font-family="sans-serif" fill="#4b4b4b">' +
    xml(label.slice(29) || ('alpha ' + Math.round(alpha['16'].occupancy * 100) + '%')) + '</text></svg>');
  const tile = await sharp({ create: { width: tileWidth, height: tileHeight, channels: 4,
    background: { r: 228, g: 231, b: 230, alpha: 1 } } })
    .composite([{ input: thumb, left: drawX, top: drawY }, { input: overlay, left: 0, top: 0 }])
    .png().toBuffer();
  return {
    tile,
    record: {
      key, variant: frame ? 'idle-' + frameIndex : 'master',
      source: entry.src, sha256: digest, sourceSize: [metadata.width, metadata.height],
      frameRect: rect, displaySize: [displayWidth, displayHeight],
      declaredPivot: pivot, pivotFraction: [+(pivot.x / width).toFixed(5), +(pivot.y / height).toFixed(5)],
      alpha,
      disposition: 'Measurement only: pivot band and entire alpha bbox cannot prove physical foot contact or baked shadows.',
    },
  };
}

async function main() {
  const results = [];
  for (const [key, def] of Object.entries(manifest.sprites)) {
    results.push(await inspect(key, def));
    for (const clip of Object.values(def.clips || {})) {
      for (const [index, frame] of clip.frames.entries()) {
        results.push(await inspect(key, def, frame, index));
      }
    }
  }
  const sources = Object.keys(manifest.sprites);
  assert(sources.length >= 32, 'Unexpected manifest contraction requires review');
  assert(['hero:paladin','hero:mage','hero:ranger','enemy:goblin','transport:ferry']
    .every((key) => sources.includes(key)), 'Historical shadow audit canary missing');
  const rows = Math.ceil(results.length / columns);
  const sheet = await sharp({ create: { width: tileWidth * columns, height: tileHeight * rows,
    channels: 4, background: { r: 244, g: 244, b: 244, alpha: 1 } } })
    .composite(results.map((r, i) => ({
      input: r.tile, left: (i % columns) * tileWidth, top: Math.floor(i / columns) * tileHeight,
    }))).png().toBuffer();
  fs.writeFileSync(path.join(out, 'registered-footprints.png'), sheet);
  fs.writeFileSync(path.join(out, 'registered-footprints.json'), JSON.stringify({
    issue: 893, sourceSha: process.env.GITHUB_SHA || 'local-checkout',
    manifestVersion: manifest.version, registeredKeys: sources.length,
    inspectedImages: results.length, artMasters: sources.length,
    animationFrames: results.length - sources.length,
    methodology: 'Decoded registered PNG/atlas crop RGBA alpha at cutoffs 16/64/160. Red pivot line; cyan full-alpha bbox. No automatic visual defect verdict.',
    caveats: ['Alpha silhouette != touching-foot width', 'Painted bases/foliage may legitimately extend below pivot',
      'Dark or semi-transparent pixels alone do not prove an embedded shadow',
      'This census does not validate procedural actor bodies or renderer parity'],
    entries: results.map((r) => r.record),
  }, null, 2) + '\n');
  console.log('PASS #893 measured ' + sources.length + ' registered masters and ' +
    (results.length - sources.length) + ' idle frames; no game source or saved state mutated');
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
