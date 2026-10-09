'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');
const prettier = require('prettier');
(async () => {
  let diffs = 0;
  for (const path of ['src/prototype/boss-combat.js', 'src/prototype/combat.js']) {
    const before = fs.readFileSync(path, 'utf8');
    const options = (await prettier.resolveConfig(path)) || {};
    const after = await prettier.format(before, { ...options, filepath: path });
    if (after === before) continue;
    fs.writeFileSync(path, after);
    const patch = cp.spawnSync('git', ['diff', '--', path], { encoding: 'utf8' }).stdout;
    console.log('COOLDOWN_FORMAT_PATCH|' + path + '|' + JSON.stringify(patch));
    diffs++;
  }
  if (diffs) {
    console.log('Temporary formatting diagnostics: ' + diffs + ' corrections needed.');
    process.exitCode = 1;
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
