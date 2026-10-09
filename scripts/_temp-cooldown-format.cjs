'use strict';
// Temporary CI diagnostic: print Prettier's exact diffs for the cooldown-only branch.
const fs = require('node:fs');
const cp = require('node:child_process');
const prettier = require('prettier');
(async () => {
  const paths = [
    'src/prototype/app.js',
    'src/prototype/data.js',
    'src/prototype/engine.js',
    'src/prototype/hero-combat.js',
    'src/prototype/input.js',
    'src/prototype/menus.js',
    'src/prototype/party.js',
    'src/prototype/progression.js',
    'src/prototype/combat.js',
    'src/prototype/rules.js',
  ];
  for (const path of paths) {
    const before = fs.readFileSync(path, 'utf8');
    const options = (await prettier.resolveConfig(path)) || {};
    const after = await prettier.format(before, { ...options, filepath: path });
    if (before === after) continue;
    fs.writeFileSync(path, after);
    const diff = cp.spawnSync('git', ['diff', '--', path], { encoding: 'utf8' }).stdout;
    console.log('FORMAT_PATCH_JSON|' + path + '|' + JSON.stringify(diff));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
