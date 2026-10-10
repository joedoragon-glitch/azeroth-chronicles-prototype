'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const quick = new Set([
  'architecture',
  'campaign-domains',
  'platform-runtime',
  'input',
  'game',
  'service-worker',
  'sprites',
  'prototype',
  'migration',
  'roads',
  'prototype-ui',
  'auto-potions',
  'combat-feedback',
  'enemy-vfx-foundation',
  'enemy-vfx-events',
  'enemy-vfx-art',
  'enemy-vfx-assets',
  'enemy-vfx-quality',

  'enemy-audio',
  'enemy-vfx-inventory',
  'terrain-effects',
  'first-boss-balance',
  'dungeon-pressure',
  'abyss-flight-project',
  'abyss-v09-routes',
  'awakening-anchor',
  'local-sites',
  'world-aesthetic',
]);
const files = fs
  .readdirSync(__dirname)
  .filter(
    (name) =>
      name.endsWith('.test.cjs') &&
      !name.includes('browser') &&
      (!process.argv.includes('--quick') || quick.has(name.replace('.test.cjs', ''))),
  )
  .sort();
for (const file of files) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('\nPASS ' + files.length + ' regression suites');
