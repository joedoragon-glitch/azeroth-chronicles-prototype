'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');
const prettier = require('prettier');
(async () => {
  for (const file of ['src/prototype/boss-combat.js', 'src/prototype/combat.js']) {
    const before = fs.readFileSync(file, 'utf8');
    const cfg = (await prettier.resolveConfig(file)) || {};
    const after = await prettier.format(before, { ...cfg, filepath: file });
    if (before === after) continue;
    fs.writeFileSync(file, after);
    const patch = cp.spawnSync('git', ['diff', '--', file], { encoding: 'utf8' }).stdout;
    console.log('COOLDOWN_FORMAT_PATCH|' + file + '|' + JSON.stringify(patch));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
