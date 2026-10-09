'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');
const prettier = require('prettier');
(async () => {
  for (const path of ['src/prototype/boss-combat.js', 'src/prototype/combat.js']) {
    const before = fs.readFileSync(path, 'utf8');
    const options = (await prettier.resolveConfig(path)) || {};
    const after = await prettier.format(before, { ...options, filepath: path });
    if (before === after) continue;
    fs.writeFileSync(path, after);
    const patch = cp.execFileSync('git', ['diff', '--', path], { encoding: 'utf8' });
    console.log('FORMAT_PATCH_JSON|' + path + '|' + JSON.stringify(patch));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
