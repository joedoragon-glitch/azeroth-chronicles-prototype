'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const quick = new Set([
  'architecture',
  'campaign-domains',
  'combat-arena',
  'platform-runtime',
  'input',
  'game',
  'service-worker',
  'startup-update',
  'sprites',
  'prototype',
  'migration',
  'roads',
  'prototype-ui',
  'auto-potions',
  'combat-feedback',
  'charmed-nameplates',
  'combat-conditions',
  'combat-trap-sources',
  'enemy-vfx-foundation',
  'enemy-vfx-events',
  'enemy-vfx-art',
  'enemy-vfx-assets',
  'enemy-vfx-quality',
  'warning-effect-handoff',

  'enemy-audio',
  'enemy-vfx-inventory',
  'enemy-support-healing',
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
const failures = [];
for (const file of files) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(
      'FAIL ' + file + ': ' + (result.error?.message || result.signal || 'exit ' + result.status),
    );
    failures.push(file);
  }
}
if (failures.length) {
  console.error('\nFAIL ' + failures.length + ' of ' + files.length + ' regression suites:');
  console.error(failures.join(', '));
  process.exitCode = 1;
} else {
  console.log('\nPASS ' + files.length + ' regression suites');
}
