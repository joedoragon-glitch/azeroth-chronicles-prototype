'use strict';
// #892/#902 integration: the native Citadel canister contact/warning fixture
// is callable, not executable itself. Preserve its 3 directions, normal/TRUE,
// contexts, independent projectile contact, safe corridors and fort multiplier.
const assert = require('node:assert/strict');
const runCanisterBoundaries = require('./helpers/canister-boundaries.cjs');
const cases = runCanisterBoundaries();
assert(Number.isSafeInteger(cases) && cases > 0,
  'actual native Citadel canister boundary/fort checks must execute');
console.log('PASS ' + cases +
  ' Citadel normal/TRUE canister warning, contact, fort-flight boundary cases');
