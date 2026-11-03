'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectTests } = require('../.github/scripts/focused-ci.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const auto = read('.github/workflows/focused-deploy.yml');
const manual = read('.github/workflows/pages.yml');
const policy = read('AGENTS.md');
const runner = read('.github/scripts/focused-ci.cjs');

assert.match(
  auto,
  /^on:\n  push:\n    branches: \[main\]\n  pull_request:\n    # [^\n]+\n    branches: \[main, 'archive\/\*\*', 'narrative\/\*\*'\]/m,
  'ordinary updates use the focused workflow',
);
assert.match(
  auto,
  /node \.github\/scripts\/focused-ci\.cjs/,
  'automatic CI must use selective local tests',
);
assert.match(
  auto,
  /node scripts\/build\.cjs --check --site/,
  'releases still verify the deployable package',
);
assert.match(auto, /needs: focused/, 'the publisher must depend on focused verification');
assert.match(auto, /name: Preserve focused-test diagnostics[\s\S]*?if: always\(\)[\s\S]*?actions\/upload-artifact@v4/,
  'failed or successful focused checks must retain evidence without rerunning suites');
assert.match(auto, /name: focused-ci-evidence[\s\S]*?azeroth-focused-ci-report\.json/,
  'structured focused evidence is independently reviewable after CI');
assert.doesNotMatch(
  auto,
  /npm test|\.github\/actions\/check-game|playwright install|full browser matrix/i,
  'automatic updates must never invoke expensive test matrices',
);
assert.match(
  manual,
  /^on:\n  workflow_dispatch:\n    inputs:\n      approve_full_suite:/m,
  'game-wide suites must only be available through explicit manual dispatch',
);
assert.match(
  manual,
  /type: boolean\n        required: true\n        default: false/,
  'manual approval must be unchecked by default',
);
assert.doesNotMatch(
  manual,
  /^  push:|^  pull_request:/m,
  'full suites must not trigger on pushes or pull requests',
);
assert.match(
  manual,
  /  release-plan:\n    if: \$\{\{ inputs\.approve_full_suite == true \}\}/,
  'unapproved manual runs must not start any full-suite prerequisites',
);
assert.match(
  manual,
  /  main-test:\n    if: inputs\.approve_full_suite == true/,
  'the full Node/Chromium suite must require approval',
);
assert.match(
  manual,
  /  phone-webkit:\n    needs: release-plan\n    if: inputs\.approve_full_suite == true/,
  'the full WebKit suite must require approval',
);
assert.match(
  policy,
  /Never launch or trigger full-game test runs/,
  'contributors must follow the standing owner permission rule',
);
assert.doesNotMatch(
  runner,
  /npm test|prototype-browser\.test\.cjs|playwright install/,
  'focused selector must never escalate to full game or browser tests',
);

const exists = () => true;
const renderer = selectTests(['src/prototype/pixi-experimental.js'], exists);
assert(renderer.tests.includes('tests/pixi-fidelity.test.cjs'));
assert(renderer.tests.includes('tools/webgl-pilot/renderer-switch-guard.test.cjs'));
assert(!renderer.tests.includes('tests/game.test.cjs'));
assert(
  !renderer.tests.includes('tests/pixi-renderer-browser.test.cjs'),
  'ordinary Pixi code changes must not launch a browser test automatically',
);
assert.deepEqual(renderer.uncovered, []);
const singleBrowser = selectTests(['tests/pixi-renderer-browser.test.cjs'], exists);
assert(
  singleBrowser.tests.includes('tests/pixi-renderer-browser.test.cjs'),
  'the explicitly modified Pixi acceptance test must be exercised in focused CI',
);
assert(
  !singleBrowser.tests.includes('tests/prototype-browser.test.cjs'),
  'targeted Pixi acceptance must never pull in the general browser suite',
);
const gameplay = selectTests(['src/prototype/engine.js'], exists);
assert(
  selectTests(['src/prototype/runtime.js'], exists).tests.includes(
    'tests/render-resolution.test.cjs',
  ),
  'later runtime-only changes must retain the live adaptive-resolution regression',
);
assert(gameplay.tests.includes('tests/game.test.cjs'));
assert(!gameplay.tests.includes('tests/pixi-fidelity.test.cjs'));
const ci = selectTests(['.github/workflows/pages.yml'], exists);
assert(ci.tests.includes('tests/focused-ci-report.test.cjs'),
  'CI runner edits keep failure-report verification selected');
assert(ci.tests.includes('tests/ci-focus-policy.test.cjs'));
assert(!ci.tests.includes('tests/game.test.cjs'));
assert.deepEqual(selectTests(['README.md'], exists).tests, []);
assert.deepEqual(selectTests(['docs/arbitrary.md'], exists).tests, []);
const unclassified = selectTests(
  ['src/prototype/new-future-system.js'],
  (file) => file === 'tests/architecture.test.cjs',
);
assert.deepEqual(unclassified.uncovered, ['src/prototype/new-future-system.js']);
assert.deepEqual(unclassified.tests, ['tests/architecture.test.cjs']);
assert.deepEqual(unclassified.manualBrowser, []);
const unmappedHelper = selectTests(['tests/helpers/unknown-native-setup.cjs'],
  (file) => file === 'tests/architecture.test.cjs');
assert.deepEqual(unmappedHelper.uncovered, ['tests/helpers/unknown-native-setup.cjs'],
  'shared fixture changes cannot silently claim behavioral coverage');
const deferredBrowser = selectTests(['tests/audio-browser.test.cjs'], exists);
assert.deepEqual(deferredBrowser.manualBrowser, ['tests/audio-browser.test.cjs'],
  'changed browser suites must remain visibly deferred, never disguised as architecture');
assert(!deferredBrowser.tests.includes('tests/audio-browser.test.cjs'),
  'a browser matrix is never triggered automatically');
const helperCoverage = selectTests(['tests/helpers/native-fixture-contracts.cjs'], exists);
for (const expected of ['native-fixture-contracts', 'ranger-max-range-goblin-response', 'class-passives'])
  assert(helperCoverage.tests.includes('tests/' + expected + '.test.cjs'));
const classCoverage = selectTests(['src/prototype/hero-combat.js'], exists);
for (const expected of ['class-passives', 'cooldown-only', 'hero-skill1-stage1'])
  assert(classCoverage.tests.includes('tests/' + expected + '.test.cjs'));
assert(selectTests(['src/prototype/rules.js'], exists).tests.includes('tests/archive-reference.test.cjs'));
assert(selectTests(['src/prototype/renderer.js'], exists).tests.includes('tests/sprite-scope.test.cjs'));
for (const file of ['progression', 'boss-combat'])
  assert(selectTests(['src/prototype/' + file + '.js'], exists).tests.includes('tests/class-passives.test.cjs'),
    'original class regression must follow source-only ' + file + ' changes');
for (const file of ['engine', 'hero-combat', 'combat', 'rules'])
  assert(selectTests(['src/prototype/' + file + '.js'], exists).tests.includes(
    'tests/ranger-max-range-goblin-response.test.cjs'),
    'native Ranger/Goblin regression must survive source-only edits in ' + file);
for (const file of ['world', 'visuals', 'data', 'sprites'])
  assert(selectTests(['src/prototype/' + file + '.js'], exists).tests.includes(
    'tests/sprite-scope.test.cjs'),
    'source-hash graphics evidence must follow ' + file);
for (const file of ['engine', 'combat'])
  assert(selectTests(['src/prototype/' + file + '.js'], exists).tests.includes(
    'tests/rogue-anchor-under-fire-integrity.test.cjs'),
    'merged #521 native tactical contract must survive later source-only edits');
assert(selectTests(['scripts/sprite-scope-audit.cjs'], exists).tests.includes(
  'tests/sprite-scope.test.cjs'), 'scope audit script edits must verify original scope check');
for (const [source, expected] of [
  ['runtime', ['frame-skip', 'auto-fps-adaptive-coupling', 'render-resolution']],
  [
    'persistence',
    ['persistence-safety', 'save-writer', 'restart-recovery', 'save-recovery-checkpoints'],
  ],
  [
    'save',
    ['persistence-safety', 'slow-cooldown', 'beta-historical', 'snapshot-encounter-lifecycle'],
  ],
  ['navigation', ['navigation-route-stage4', 'crowd-collision-fast-reject', 'runtime-workload']],
  ['highlands', ['ironroot-highlands', 'local-sites', 'town-street-audit']],
  ['world', ['runtime-workload']],
  ['engine', ['runtime-workload', 'night-tempo']],
  [
    'rules',
    [
      'slow-cooldown',
      'ranged-pet-support',
      'enemy-support-healing',
      'snapshot-encounter-lifecycle',
    ],
  ],
  ['field-onboarding', ['field-onboarding', 'ranged-pet-support', 'enemy-support-healing']],
  ['combat', ['projectile-order', 'ranged-pet-support', 'slow-cooldown']],
]) {
  const selection = selectTests(['src/prototype/' + source + '.js']);
  for (const test of expected)
    assert(selection.tests.includes(TEST_PATH(test)), source + ' must protect ' + test);
  assert.deepEqual(selection.uncovered, []);
  assert.deepEqual(selection.missing, []);
}
function TEST_PATH(name) {
  return 'tests/' + name + '.test.cjs';
}
assert(
  selectTests(['tests/fixtures/runtime-workload-dev175.json']).tests.includes(
    TEST_PATH('runtime-workload'),
  ),
  'fixture edits must run the preservation comparison',
);
assert(
  selectTests(
    ['src/prototype/persistence.js'],
    (file) => file !== TEST_PATH('save-writer'),
  ).missing.includes(TEST_PATH('save-writer')),
  'Renaming a mapped regression must not silently remove protection',
);
// Imported environmental recordings now have an explicit focused-test owner.
const environmentalImport = selectTests(['tools/audio/integrate-regional-candidates.cjs']);
assert.deepEqual(environmentalImport.uncovered, [],
  'new recording registration source must never silently escape focused CI');
assert(environmentalImport.tests.includes('tests/audio-catalog.test.cjs'),
  'imported master credits/ownership/manifest validation must execute');
assert(environmentalImport.tests.includes('tests/environment-audio-inventory.test.cjs'),
  'all nineteen scene routes and fourteen retained original recordings must execute');
console.log('PASS owner-approved full CI and focused-only automatic policy');
