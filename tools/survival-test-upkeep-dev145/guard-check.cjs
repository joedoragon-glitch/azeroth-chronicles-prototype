// Focused negative checks for the reconciled preservation gate. No gameplay or test file is edited.
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '../..');
for (const [name, mutate, pattern] of [
  [
    'unlisted rule',
    'C.rules={...C.rules,tacticalFoundation:{...C.rules.tacticalFoundation,unreviewedRule:1}}',
    'Rogue rules remain original',
  ],
  [
    'approved field changed again',
    'C.rules={...C.rules,tacticalFoundation:{...C.rules.tacticalFoundation,woundedThreshold:0.51}}',
    'woundedThreshold',
  ],
  [
    'approved method changed again',
    'C.prototype.tacticalAutoRogue=function(){return false}',
    'tacticalAutoRogue matches',
  ],
  [
    'historically unchanged method',
    'C.prototype.tacticalRogueWounded=function(){return false}',
    'tacticalRogueWounded matches',
  ],
]) {
  const r = spawnSync(
    process.execPath,
    [
      '-e',
      `const C=require('./src/prototype/engine');${mutate};require('./tests/snapshot-dreadmaw.test.cjs')`,
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.notEqual(r.status, 0, name);
  assert(
    (r.stderr + r.stdout).includes(pattern),
    name + ': expected preservation assertion, got ' + r.stderr.slice(-300),
  );
  console.log('PASS preservation gate rejects ' + name);
}
