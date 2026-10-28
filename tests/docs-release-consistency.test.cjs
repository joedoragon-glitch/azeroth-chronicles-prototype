'use strict';
const assert = require('node:assert/strict');
const { inspect } = require('../scripts/docs-release-consistency.cjs');
const tick = String.fromCharCode(96);
const v = '0.9.1+snapshot.dev.209';
const old = '0.9.1+snapshot.dev.208';
function data() {
  return {
    pkg: { version: v },
    lock: { version: v, packages: { '': { version: v } } },
    buildInfo: '{version:"' + v + '"}',
    sw: 'const CACHE_VERSION = "azeroth-app-v' + v + '";',
    state: '<!-- CURRENT_BUILD_VERSION: ' + v + ' -->\n' +
      '**Current code/build version:** ' + tick + v + tick + '\n' +
      '**Previous publication receipt:** ' + tick + old + tick + '\n' +
      '| Build/cache version | **' + tick + v + tick + '** | current code |',
    readme: 'See Development state for the current build.',
    agents: 'Agent policy. Current release authority is Development state.',
    index: '**Current release and documentation routing:** See Development state.',
  };
}
const rejects = (b, expected, context) =>
  assert(inspect(b, context).some(e => e.includes(expected)), 'Must reject ' + expected);
assert.deepEqual(inspect(data()), []);
{ const b = data(); b.state = b.state.replace('CURRENT_BUILD_VERSION: ' + v, 'CURRENT_BUILD_VERSION: ' + old); rejects(b, 'CURRENT_BUILD_VERSION'); }
{ const b = data(); b.state = b.state.replace('version:** ' + tick + v, 'version:** ' + tick + old); rejects(b, 'visible current'); }
{ const b = data(); b.state = b.state.replace('| Build/cache version | **' + tick + v, '| Build/cache version | **' + tick + old); rejects(b, 'table is stale'); }
{ const b = data(); b.state = '**Current public game: ' + old + '**\n' + b.state; rejects(b, 'older current release'); }
{ const b = data(); b.readme = 'Last verified game build: ' + old; rejects(b, 'README duplicates'); }
{ const b = data(); b.agents = 'Rogue published in the dev.208 build.\n'; rejects(b, 'AGENTS opening'); }
{ const b = data(); b.index = '**28 October routing refresh:** current dev.208.'; rejects(b, 'Documentation index'); }
{ const b = data(); b.lock.version = old; rejects(b, 'package-lock'); }
{ const b = data(); b.sw = 'const CACHE_VERSION="azeroth-app-v' + old + '";'; rejects(b, 'sw.js'); }
rejects(data(), 'Version bump omits', { previousVersion: old, changedPaths: ['package.json'] });
assert.deepEqual(inspect(data(), { previousVersion: old, changedPaths: ['package.json','docs/DEVELOPMENT_STATE.md'] }), []);
console.log('PASS release/docs consistency: 12 positive and negative scenarios');
