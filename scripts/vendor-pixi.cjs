'use strict';
// Publish the exact pinned PixiJS UMD distribution as a same-origin PWA asset.
// Download happens during the source build, never in the running game.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const version = '8.22.0';
const url = 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js';
const target = path.resolve(__dirname, '../assets/vendor/pixi-8.22.0.min.js');
// SHA-256 confirmed by GitHub's pinned 8.22.0 build. Fail closed on drift.
const expectedSha256 =
  '06d9ef9823e743518793083c296d801e752db128cb1f519fbabe37e1259567ea';
const bytesMin = 750000,
  bytesMax = 1000000;

function validate(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < bytesMin || buffer.length > bytesMax)
    throw Error('Unexpected PixiJS distribution size; refuse an invalid vendor asset.');
  const text = buffer.toString('utf8');
  if (!text.includes(version) || !text.includes('PIXI'))
    throw Error('PixiJS vendor bytes do not identify the pinned version.');
  new vm.Script(text, { filename: 'pixi-8.22.0.min.js' });
  const digest = crypto.createHash('sha256').update(buffer).digest('hex');
  if (digest !== expectedSha256) throw Error('Pinned PixiJS vendor hash mismatch');
  return digest;
}
async function main() {
  const verifyOnly = process.argv.includes('--verify');
  if (fs.existsSync(target)) {
    console.log('PixiJS v' + version + ' verified · sha256 ' + validate(fs.readFileSync(target)));
    return;
  }
  if (verifyOnly)
    throw Error('Pinned local PixiJS asset is missing. First run npm run build online.');
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || new URL(response.url).hostname !== 'cdn.jsdelivr.net')
    throw Error('Could not fetch the official pinned PixiJS distribution.');
  const buffer = Buffer.from(await response.arrayBuffer());
  const sha = validate(buffer);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = target + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temp, buffer);
    fs.renameSync(temp, target);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  console.log('Prepared same-origin PixiJS v' + version + ' · sha256 ' + sha);
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { validate, version, url, target };
