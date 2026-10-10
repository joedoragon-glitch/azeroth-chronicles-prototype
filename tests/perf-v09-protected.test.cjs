'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./fixtures/perf-v09-protected.json');
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.resolve(__dirname, '..', file)))
    .digest('hex');
  assert.equal(actual, expected, file + ' is protected against baseline ' + manifest.baseline);
}
console.log(
  'PASS ' +
    Object.keys(manifest.files).length +
    ' exact protected simulation/scheduling/save/UI/art hashes',
);
