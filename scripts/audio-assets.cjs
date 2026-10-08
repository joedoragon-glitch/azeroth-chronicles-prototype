'use strict';
// Recorded-audio publishing contract. Original score assets are registered under the bounded publishing contract.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const limits = Object.freeze({ perFile: 8 * 1024 * 1024, total: 32 * 1024 * 1024 });
function publishedFiles(root) {
  const manifestFile = 'assets/audio/manifest.json';
  const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestFile), 'utf8'));
  if (
    manifest.schemaVersion !== 1 ||
    !manifest.assets ||
    Array.isArray(manifest.assets) ||
    typeof manifest.assets !== 'object'
  )
    throw Error('Invalid audio manifest schema');
  const audioRoot = fs.realpathSync(path.join(root, 'assets/audio')) + path.sep;
  const unique = new Map();
  const entries = [];
  for (const [id, entry] of Object.entries(manifest.assets)) {
    if (
      entry?.variants !== undefined &&
      (!Array.isArray(entry.variants) || entry.variants.length > 3)
    )
      throw Error('Invalid audio codec variants: ' + id);
    entries.push([id, entry]);
    for (const [i, variant] of (entry?.variants || []).entries()) {
      if (!variant || typeof variant !== 'object')
        throw Error('Invalid audio codec variant: ' + id);
      entries.push([id + ':variant:' + i, { ...entry, src: variant.src, sha256: variant.sha256 }]);
    }
  }
  for (const [id, entry] of entries) {
    const fail = (reason) => {
      throw Error('Invalid audio asset ' + id + ': ' + reason);
    };
    if (!/^[a-z0-9][a-z0-9:_-]*$/.test(id) || !entry || typeof entry !== 'object')
      fail('invalid identity');
    if (!['music', 'ambience', 'effect'].includes(entry.kind)) fail('invalid kind');
    if (
      typeof entry.src !== 'string' ||
      !/^\.\/assets\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(entry.src)
    )
      fail('invalid local path');
    const file = entry.src.slice(2),
      disk = path.join(root, file);
    if (
      !fs.existsSync(disk) ||
      !fs.statSync(disk).isFile() ||
      !fs.realpathSync(disk).startsWith(audioRoot)
    )
      fail('missing file or escaping symlink');
    if (!Number.isFinite(entry.duration) || entry.duration <= 0 || entry.duration > 600)
      fail('invalid duration');
    if (
      !entry.credits ||
      typeof entry.credits.author !== 'string' ||
      !entry.credits.author.trim() ||
      typeof entry.credits.license !== 'string' ||
      !entry.credits.license.trim()
    )
      fail('missing author/license provenance');
    if (
      entry.loop &&
      (!Number.isFinite(entry.loop.start) ||
        !Number.isFinite(entry.loop.end) ||
        entry.loop.start < 0 ||
        entry.loop.start >= entry.loop.end ||
        entry.loop.end > entry.duration)
    )
      fail('invalid loop points');
    const bytes = fs.readFileSync(disk);
    if (!bytes.length || bytes.length > limits.perFile) fail('file size budget exceeded');
    if (
      !/^[a-f0-9]{64}$/.test(entry.sha256 || '') ||
      crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256
    )
      fail('content hash mismatch');
    const ext = path.extname(file);
    const signature =
      ext === '.wav'
        ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE'
        : ext === '.ogg'
          ? bytes.toString('ascii', 0, 4) === 'OggS'
          : bytes.toString('ascii', 0, 3) === 'ID3' ||
            (bytes[0] === 255 && (bytes[1] & 224) === 224);
    if (!signature) fail('container signature mismatch');
    unique.set(file, bytes.length);
  }
  if ([...unique.values()].reduce((a, b) => a + b, 0) > limits.total)
    throw Error('Audio package size budget exceeded');
  return [manifestFile, ...unique.keys()];
}
module.exports = { publishedFiles, limits };
