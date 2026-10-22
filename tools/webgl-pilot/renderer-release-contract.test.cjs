'use strict';
// Fast, dependency-free staging-contract tests; NOT the full game test suite.
const assert = require('node:assert/strict');
const test = require('node:test');
const C = require('./renderer-release-contract.cjs');
const blockedEvidence = require('./renderer-readiness.json');

test('Canvas 2D is the default for absent, unknown or malformed preference', () => {
  for (const value of [undefined, null, '', 'canvas', 'hybrid', 'webgl', 'WEBGL2', 42, {}]) {
    assert.equal(C.normalizedPreference(value), 'canvas2d');
  }
  assert.equal(C.normalizedPreference('webgl2'), 'webgl2');
  assert.deepEqual(C.OPTIONS, ['canvas2d', 'webgl2']);
});

test('the existing incomplete WebGL prototype cannot be selected', () => {
  assert.equal(C.nativeWebglReady(blockedEvidence), false);
  assert.deepEqual(C.resolveRequestedRenderer('webgl2', blockedEvidence), {
    requested:'webgl2', active:'canvas2d',reason:'webgl-not-certified'
  });
});

test('renderer API compatibility is strict and uses all current Canvas methods', () => {
  const backend = Object.fromEntries(C.API_METHODS.map(name => [name, () => {}]));
  assert.equal(C.rendererApiComplete(backend), true);
  for (const method of C.API_METHODS) {
    const copy = {...backend}; delete copy[method];
    assert.equal(C.rendererApiComplete(copy), false, 'missing '+method);
  }
});

test('all evidence gates and independent source/receipt are required', () => {
  const verified = {
    renderer:'webgl2',
    nativeModule:'future-native-webgl-implementation.js',
    testReceipt:'future-complete-scene-parity-receipt.json',
    gates:Object.fromEntries(C.GATES.map(name => [name,true]))
  };
  assert.equal(C.nativeWebglReady(verified), true);
  assert.equal(C.resolveRequestedRenderer('webgl2', verified, false).active,'canvas2d');
  assert.equal(C.resolveRequestedRenderer('webgl2', verified, true).active,'webgl2');
  for (const gate of C.GATES) {
    const missing = structuredClone(verified);
    missing.gates[gate] = false;
    assert.equal(C.nativeWebglReady(missing), false, 'missing gate '+gate);
  }
  assert.equal(C.nativeWebglReady({...verified,nativeModule:''}),false);
  assert.equal(C.nativeWebglReady({...verified,testReceipt:''}),false);
});

test('failure always keeps a working Canvas selection', () => {
  assert.equal(C.resolveRequestedRenderer('canvas2d', null).active,'canvas2d');
  assert.equal(C.resolveRequestedRenderer('webgl2', null).active,'canvas2d');
});
