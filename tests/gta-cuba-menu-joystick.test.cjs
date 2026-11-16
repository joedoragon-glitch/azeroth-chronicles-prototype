'use strict';

const assert = require('node:assert/strict');
const Input = require('../src/prototype/input');

const pad = Input.createMenuJoystickNavigator();
const step = (x, y, t) => pad.step({ x, y }, t);

assert.equal(step(0.25, 0.15, 0), 0, 'small thumb tremor is ignored');
assert.equal(step(0.8, 0.78, 20), 0, 'ambiguous diagonal cannot pick a direction');
assert.equal(step(0.1, 0.84, 120), 1, 'a deliberate down tilt selects exactly once');
assert.equal(step(0.95, -0.9, 200), 0, 'an angled drift cannot reverse a held selection');
assert.equal(step(0.95, -0.9, 659), 0, 'initial hold allows time to confirm one choice');
assert.equal(step(0.95, -0.9, 660), 1, 'a sustained tilt can scroll a long menu');
assert.equal(step(0.95, -0.9, 1029), 0, 'held scrolling is rate limited');
assert.equal(step(0.95, -0.9, 1030), 1, 'held scroll repeats at the controlled cadence');
assert.equal(step(0, -0.2, 1040), 0, 'returning toward center releases the direction');
assert.equal(step(-0.9, 0, 1050), -1, 'a new left tilt selects previous');
assert.equal(step(0.9, 0, 1090), 0, 'an abrupt reversal without recentering is ignored');
assert.equal(step(0, 0, 1110), 0);
assert.equal(step(0.9, 0, 1120), 1, 'right tilt selects next after recentering');
pad.reset(true);
assert.equal(step(0.9, 0, 1150), 0, 'Confirm suppresses held-stick spillover');
assert.equal(step(0.1, 0.1, 1160), 0);
assert.equal(step(0, -0.9, 1170), -1, 'fresh movement works after Confirm and center');
pad.reset();
assert.equal(step(NaN, Infinity, 1200), 0, 'invalid axis values are inert');

const anchor = { x: 80, y: 85 };
const drag = (x, y) => Input.menuJoystickDragVector(anchor, { x, y }, 110);
assert.deepEqual(drag(80, 85), { x: 0, y: 0 }, 'touchdown is neutral anywhere in the stick');
assert.equal(drag(80, 95).y < 0.32, true, 'tiny thumb travel remains below release distance');
assert.equal(drag(80, 112).y > 0.65, true, 'deliberate 27px drag reaches menu threshold');
const anchoredPad = Input.createMenuJoystickNavigator();
assert.equal(anchoredPad.step(drag(80, 85), 0), 0);
assert.equal(anchoredPad.step(drag(80, 95), 20), 0);
assert.equal(anchoredPad.step(drag(80, 112), 60), 1);
assert.equal(anchoredPad.step(drag(80, 85), 80), 0);
assert.equal(anchoredPad.step(drag(50, 85), 100), -1);

const second = Input.createMenuJoystickNavigator();
assert.equal(second.step({ x: 0, y: -0.9 }, 0), -1, 'new menu controllers have no old repeat state');
const controls = Input.create();
assert.equal(controls.preferences.joystickMode, 'fixed');
assert.equal(controls.preferences.touchMove, false);
assert.equal(controls.actionFor('KeyF'), 'confirm');
assert.equal(controls.actionFor('KeyS'), 'down');
assert.equal(Input.floatingJoystickVector({ x: 0, y: 0 }, { x: 42, y: 0 }, 42).x, 1);
console.log('PASS GTA Cuba menu joystick intent, hold timing, recentering, and unchanged field input');
