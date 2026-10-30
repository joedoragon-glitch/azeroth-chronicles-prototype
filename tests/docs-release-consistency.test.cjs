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
{ const b = data(); b.state = b.state.split('\n').filter(line => !line.startsWith('| Build/cache version |')).join('\n'); rejects(b, 'table is missing'); }
{ // A new source candidate must retain the previous VERIFIED publication until Pages actually runs.
  const b = data(); const candidate = '0.9.1+snapshot.dev.210';
  b.pkg.version = candidate; b.lock.version = candidate; b.lock.packages[''].version = candidate;
  b.buildInfo = b.buildInfo.replace(v, candidate);
  b.sw = b.sw.replace(v, candidate);
  b.state = b.state.replaceAll(v, candidate) +
    '\n**Latest verified playable update:** published ' + tick + v + tick + '.';
  assert.deepEqual(inspect(b, { previousVersion: v,
    changedPaths: ['package.json', 'docs/DEVELOPMENT_STATE.md'] }), []);
}
{ const b = data(); b.state = '**Latest verified playable update:** ' + tick + v + tick + '\n**Current public game: ' + old + '**\n' + b.state; rejects(b, 'current-public-game claim'); }
{ const b = data(); b.readme = 'Last verified game build: ' + old; rejects(b, 'README duplicates'); }
{ const b = data(); b.readme = 'Last verified published game build: ' + tick + old + tick; rejects(b, 'README duplicates'); }
{ const b = data(); b.agents = 'Rogue published in the dev.208 build.\n'; rejects(b, 'AGENTS opening'); }
{ const b = data(); b.index = '**28 October routing refresh:** current dev.208.'; rejects(b, 'Documentation index'); }
{ const b = data(); b.index = '**Checkpoint:** ' + tick + 'dev.208' + tick + ' was published.'; rejects(b, 'Documentation index'); }
{ const b = data(); b.lock.version = old; rejects(b, 'package-lock'); }
{ const b = data(); b.sw = 'const CACHE_VERSION="azeroth-app-v' + old + '";'; rejects(b, 'sw.js'); }
rejects(data(), 'Runtime changes have no accompanying', { changedPaths: ['src/prototype/renderer.js','tests/pixi-fidelity.test.cjs'] });
rejects(data(), 'Runtime changes have no accompanying', { changedPaths: ['src/prototype/renderer.js','docs/DEVELOPMENT_STATE.md','docs/DOCUMENTATION_INDEX.md','AGENTS.md'] });
rejects(data(), 'Runtime changes have no accompanying', {
  changedPaths: ['src/prototype/renderer.js','docs/NEW_FEATURE_GUIDE.md'],
  modifiedPaths: ['src/prototype/renderer.js'],
});
assert.deepEqual(inspect(data(), {
  changedPaths: ['src/prototype/renderer.js','docs/EXISTING_FEATURE_GUIDE.md'],
  modifiedPaths: ['src/prototype/renderer.js','docs/EXISTING_FEATURE_GUIDE.md'],
}), []);
assert.deepEqual(inspect(data(), { changedPaths: ['src/prototype/renderer.js','docs/PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md'] }), []);
assert.deepEqual(inspect(data(), { changedPaths: ['tests/pixi-fidelity.test.cjs'] }), []);
rejects(data(), 'Version bump omits', { previousVersion: old, changedPaths: ['package.json'] });
assert.deepEqual(inspect(data(), { previousVersion: old, changedPaths: ['package.json','docs/DEVELOPMENT_STATE.md'] }), []);

function publishedData() {
  const b = data();
  const dev = v.match(/\.dev\.(\d+)$/)[1];
  b.state = b.state.replace(
    '| Build/cache version | **' + tick + v + tick + '** | current code |',
    '| Build/cache version | **' + tick + v + tick + '** — merged and published | release receipt |',
  ) + '\n' +
    '**Latest verified published code/build version:** ' + tick + v + tick + '\n' +
    '| Source | **dev.' + dev + ' published gameplay source** | receipt |\n' +
    '| Focused automation | **Dev.' + dev + ' merged-main tests** | receipt |\n' +
    '| GitHub Pages publication | **Published dev.' + dev + '** | receipt |';
  return b;
}
{ // Prior release mentioned in an evidence cell must not convert a draft into a published build.
  const draft = data();
  draft.state = draft.state.replace('| current code |',
    '| prior dev.208 was merged and published; current source is still a candidate |');
  assert.deepEqual(inspect(draft), []);
}
assert.deepEqual(inspect(publishedData()), []);
{ const b = publishedData(); b.state = b.state.replace('published code/build version:** ' + tick + v,
  'published code/build version:** ' + tick + old); rejects(b, 'latest verified published version'); }
{ const b = publishedData(); b.state = b.state.replace('**Latest verified published code/build version:** ' + tick + v + tick + '\n', '');
  rejects(b, 'latest verified published version'); }
{ const b = publishedData(); b.state = b.state.replace('| Source | **dev.209', '| Source | **dev.208');
  rejects(b, 'Source published checkpoint'); }
{ const b = publishedData(); b.state = b.state.replace('| Focused automation | **Dev.209', '| Focused automation | **Dev.208');
  rejects(b, 'Focused automation published checkpoint'); }
{ const b = publishedData(); b.state = b.state.replace('| GitHub Pages publication | **Published dev.209', '| GitHub Pages publication | **Published dev.208');
  rejects(b, 'GitHub Pages publication published checkpoint'); }

{ // A published release must not still be described as an unmerged draft.
  const b = publishedData();
  b.state = b.state.replace('**Current code/build version:** ' + tick + v + tick,
    '**Current code/build version:** ' + tick + v + tick + ' — draft #654, unmerged/unpublished');
  rejects(b, 'current published build still marked draft');
}
{ // Latest hosted release must follow the published status, not an earlier source.
  const b = publishedData();
  b.state += '\n**Latest verified playable update — 30 October 2026:** Dev.209 hosted.';
  assert.deepEqual(inspect(b), []);
}
{
  const b = publishedData();
  b.state += '\n**Latest verified playable update — 30 October 2026:** Dev.208 hosted.';
  rejects(b, 'latest playable release is stale');
}

console.log('PASS release/docs consistency positive and negative scenarios');
