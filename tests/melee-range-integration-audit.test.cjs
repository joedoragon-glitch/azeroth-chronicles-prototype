'use strict';
// Explicit one-time focused audit for the 90-unit melee change. The project's
// CI policy does not run the all-game/all-browser matrix on ordinary PRs.
// Reuse high-value, real native subsystem suites rather than infer that a
// configuration assertion is equivalent to exercising combat.
const assert = require('node:assert/strict');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..');
const suites = [
  'enemy-reach-regroup',
  'enemy-withdrawal-actions',
  'hybrid-dual-role-ai',
  'dungeon-pressure',
  'captain-mechanics-audit',
  'boss-retreat-recovery',
  'ringleader-coverage',
  'enemy-sight',
  'critical-world-basic-native',
  'critical-world-boss-batched-native',
  'critical-world-captain-areas-native',
  'melee-pet-roles',
  'pet-combat-reach',
  'pet-formation-cadence',
  'critical-troop-native',
  'critical-pet-native',
  'companion-regroup-resume',
  'squad-boss-priority',
];
let failures = 0;
for (const name of suites) {
  const file = path.join(root, 'tests', name + '.test.cjs');
  const result = cp.spawnSync(process.execPath, [file], {
    cwd: root,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) {
    failures++;
    console.error('FAIL melee range integration suite: ' + name);
    if (result.stdout) console.error(result.stdout.slice(-6000));
    if (result.stderr) console.error(result.stderr.slice(-6000));
    if (result.error) console.error(String(result.error));
  } else {
    console.log('PASS melee range integration suite: ' + name);
  }
}
assert.equal(failures, 0, failures + ' of ' + suites.length + ' melee-range integration suites failed');
console.log('PASS ' + suites.length + ' combat, enemy AI, boss, captain, pet and companion integration suites');
