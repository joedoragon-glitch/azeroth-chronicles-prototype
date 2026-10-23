'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectTests } = require('../.github/scripts/focused-ci.cjs');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const auto = read('.github/workflows/focused-deploy.yml');
const manual = read('.github/workflows/pages.yml');
const policy = read('AGENTS.md');
const runner = read('.github/scripts/focused-ci.cjs');

assert.match(auto,/^on:\n  push:\n    branches: \[main\]\n  pull_request:\n    branches: \[main\]/m,
  'ordinary updates use the focused workflow');
assert.match(auto,/node \.github\/scripts\/focused-ci\.cjs/,
  'automatic CI must use selective local tests');
assert.match(auto,/node scripts\/build\.cjs --check --site/,
  'releases still verify the deployable package');
assert.match(auto,/needs: focused/, 'the publisher must depend on focused verification');
assert.doesNotMatch(auto,/npm test|\.github\/actions\/check-game|playwright install|full browser matrix/i,
  'automatic updates must never invoke expensive test matrices');
assert.match(manual,/^on:\n  workflow_dispatch:\n    inputs:\n      approve_full_suite:/m,
  'game-wide suites must only be available through explicit manual dispatch');
assert.match(manual,/type: boolean\n        required: true\n        default: false/,
  'manual approval must be unchecked by default');
assert.doesNotMatch(manual,/^  push:|^  pull_request:/m,
  'full suites must not trigger on pushes or pull requests');
assert.match(manual,/  release-plan:\n    if: \$\{\{ inputs\.approve_full_suite == true \}\}/,
  'unapproved manual runs must not start any full-suite prerequisites');
assert.match(manual,/  main-test:\n    if: inputs\.approve_full_suite == true/,
  'the full Node/Chromium suite must require approval');
assert.match(manual,/  phone-webkit:\n    needs: release-plan\n    if: inputs\.approve_full_suite == true/,
  'the full WebKit suite must require approval');
assert.match(policy,/Never launch or trigger full-game test runs/,
  'contributors must follow the standing owner permission rule');
assert.doesNotMatch(runner,/npm test|prototype-browser\.test\.cjs|playwright install/,
  'focused selector must never escalate to full game or browser tests');

const exists = () => true;
const renderer = selectTests(['src/prototype/pixi-experimental.js'],exists);
assert(renderer.tests.includes('tests/pixi-fidelity.test.cjs'));
assert(renderer.tests.includes('tools/webgl-pilot/renderer-switch-guard.test.cjs'));
assert(!renderer.tests.includes('tests/game.test.cjs'));
assert(!renderer.tests.includes('tests/pixi-renderer-browser.test.cjs'),
  'ordinary Pixi code changes must not launch a browser test automatically');
assert.deepEqual(renderer.uncovered,[]);
const singleBrowser=selectTests(['tests/pixi-renderer-browser.test.cjs'],exists);
assert(singleBrowser.tests.includes('tests/pixi-renderer-browser.test.cjs'),
  'the explicitly modified Pixi acceptance test must be exercised in focused CI');
assert(!singleBrowser.tests.includes('tests/prototype-browser.test.cjs'),
  'targeted Pixi acceptance must never pull in the general browser suite');
const gameplay = selectTests(['src/prototype/engine.js'],exists);
assert(gameplay.tests.includes('tests/game.test.cjs'));
assert(!gameplay.tests.includes('tests/pixi-fidelity.test.cjs'));
const ci = selectTests(['.github/workflows/pages.yml'],exists);
assert(ci.tests.includes('tests/ci-focus-policy.test.cjs'));
assert(!ci.tests.includes('tests/game.test.cjs'));
assert.deepEqual(selectTests(['README.md'],exists).tests,[]);
assert.deepEqual(selectTests(['docs/arbitrary.md'],exists).tests,[]);
const unclassified = selectTests(['src/prototype/new-future-system.js'],
  file => file==='tests/architecture.test.cjs');
assert.deepEqual(unclassified.uncovered,['src/prototype/new-future-system.js']);
assert.deepEqual(unclassified.tests,['tests/architecture.test.cjs']);
console.log('PASS owner-approved full CI and focused-only automatic policy');
