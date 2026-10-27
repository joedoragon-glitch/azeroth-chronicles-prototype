'use strict';
// Issue #510: fixed, focused encounter-reset interaction suite.
// Intentionally invokes only pre-existing native Node tests (no browser/full
// game matrix, gameplay source edits or behavioral mocks beyond their fixtures).
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const names = [
  'enemy-distant-damage-response',
  'critical-restart-recovery',
  'dungeon-camps',
  'targeting',
  'pursuit-burst',
  'vale-melee-anti-kite',
  'rogue-escalation',
  'captain-treasury-native-lifecycle',
  'treasury-recovery',
  'mini-dungeons',
  'dungeon-pressure',
];
for (const name of names) {
  const file = 'tests/' + name + '.test.cjs';
  const r = spawnSync(process.execPath, [file], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 90000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) {
    console.error('AUDIT MATRIX FAIL: ' + name);
    if (r.error) console.error(r.error.message);
    if (r.stdout) console.error(r.stdout.slice(-6000));
    if (r.stderr) console.error(r.stderr.slice(-6000));
    assert.fail(name + ' native focused test failed, code=' + r.status);
  }
  console.log('AUDIT MATRIX PASS ' + name + ': ' +
    (r.stdout || '').trim().split('\n').slice(-1)[0]);
}
console.log('PASS issue #510 focused reset matrix: ' + names.length +
  ' existing native test files plus separate direct-damage reproducer');
