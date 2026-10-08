'use strict';
// Deterministic 2x2 test images, created only in isolated test caches/checkouts.
const zlib = require('node:zlib');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(r, g, b) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]),
      length = Buffer.alloc(4),
      crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const row = Buffer.from([0, r, g, b, 255, r, g, b, 255]);
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat([row, row]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const images = new Map([
  ['assets/sprites/test-fixture-a.png', png(32, 64, 96)],
  ['assets/sprites/test-fixture-b.png', png(96, 64, 32)],
]);
const entry = (src) => ({
  src: './' + src,
  displayWidth: 32,
  displayHeight: 40,
  anchorX: 0.5,
  anchorY: 0.88,
});
function manifest(populated = true) {
  return {
    version: 8,
    artDirection:
      'High-fidelity sprite translation of canonical procedural visuals — preserve design, do not redesign',
    sprites: populated
      ? {
          'hero:paladin': entry('assets/sprites/test-fixture-a.png'),
          'ally:soldier': entry('assets/sprites/test-fixture-b.png'),
          'boss:thorn': entry('assets/sprites/test-fixture-a.png'),
        }
      : {},
  };
}
module.exports = { images, manifest };
