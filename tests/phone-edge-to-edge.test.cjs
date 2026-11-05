'use strict';
// Focused source and geometry-contract checks; no full-game browser matrix.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('phone entry stays one full-bleed game frame with mapped safe UI edges', () => {
  const shell = read('styles/phone-frame.css');
  assert.match(shell, /#phone-game-frame\s*\{[\s\S]*?width: 100dvw;[\s\S]*?height: 100dvh;/);
  assert.match(shell, /@media \(orientation: portrait\)\s*\{[\s\S]*?width: 100dvh;[\s\S]*?height: 100dvw;[\s\S]*?transform: rotate\(90deg\)/);
  assert.doesNotMatch(shell, /(?:width|height): calc\(100d[vwh] - env\(safe-area-inset-/,
    'the outer frame must never subtract safe areas from the world');
  assert.match(shell, /#phone-safe-probe[\s\S]*?padding: env\(safe-area-inset-top, 0px\)/);
  assert.equal(read('phone.html'), read('templates/phone-frame.html'),
    'published phone shell and build template must be identical');
  assert.match(read('phone.html'), /frame\.addEventListener\('load', syncPhoneSafeArea\)/);
  assert.match(read('phone.html'), /window\.visualViewport\?\.addEventListener\('resize', syncPhoneSafeArea/);
  assert.match(read('phone.html'), /frame\.src = '\.\/phone-game\.html' \+ window\.location\.search \+ window\.location\.hash/);
});

test('safe areas protect the real HUD, menus, title and controls within the uncropped frame', () => {
  for (const name of ['styles/phone.css', 'styles/prototype.css']) {
    const css = read(name);
    for (const edge of ['top', 'right', 'bottom', 'left'])
      assert(css.includes('var(--phone-safe-' + edge + ', env(safe-area-inset-' + edge),
        name + ' preserves native fallback for ' + edge);
  }
  const phone = read('styles/phone.css');
  const shared = read('styles/prototype.css');
  for (const id of ['#joystick', '#skills', '#movement', '#recall-button', '#target-button',
    '#touch-interact-button', '#order-button', '#squad-button', '#hud', '#menu-button',
    '#modal', '#update-button'])
    assert(phone.includes(id) || shared.includes(id), 'missing protected control ' + id);
  assert.match(shared, /#title-screen[\s\S]*?var\(--phone-safe-top, env\(safe-area-inset-top\)\)/);
  assert.match(phone, /#skills[\s\S]*?var\(--phone-safe-right, env\(safe-area-inset-right\)\)/);
  assert.match(read('src/prototype/app.js'), /platform\.mode === 'phone' \? 1\.5 : 2/,
    'phone graphical density cap remains unchanged');
});

test('the mounted game receives correctly rotated insets without reload or resize loops', () => {
  const html = read('phone.html');
  const inline = html.match(/<script>([\s\S]*?)<\/script>/);
  assert(inline, 'missing inline frame initializer');
  const handlers = new Map();
  const props = new Map();
  const gameRoot = { style: { setProperty: (key, value) => props.set(key, value) } };
  const frame = {
    contentDocument: { documentElement: gameRoot },
    addEventListener: (name, fn) => handlers.set('frame:' + name, fn),
  };
  let sources = 0;
  Object.defineProperty(frame, 'src', { set: () => { sources++; } });
  const probe = {};
  const upright = { matches: false };
  let physical = { paddingTop: '10px', paddingRight: '58px',
    paddingBottom: '14px', paddingLeft: '60px' };
  const windowMock = {
    matchMedia: () => upright,
    getComputedStyle: () => physical,
    addEventListener: (name, fn) => handlers.set('window:' + name, fn),
    visualViewport: { addEventListener: (name, fn) => handlers.set('visual:' + name, fn) },
    location: { search: '?experience=phone', hash: '#test' },
  };
  const documentMock = { getElementById: (id) => id === 'phone-game-frame' ? frame : probe };
  vm.runInNewContext(inline[1], { window: windowMock, document: documentMock, Number });
  assert.equal(sources, 1, 'inner game document loads once');
  handlers.get('frame:load')();
  assert.equal(props.get('--phone-safe-left'), '60px');
  assert.equal(props.get('--phone-safe-right'), '58px');
  assert.equal(props.get('--phone-safe-top'), '10px');
  assert.equal(props.get('--phone-safe-bottom'), '14px');
  upright.matches = true;
  physical = { paddingTop: '62px', paddingRight: '0px',
    paddingBottom: '32px', paddingLeft: '0px' };
  handlers.get('window:resize')();
  assert.equal(props.get('--phone-safe-left'), '62px');
  assert.equal(props.get('--phone-safe-right'), '32px');
  assert.equal(props.get('--phone-safe-top'), '0px');
  assert.equal(props.get('--phone-safe-bottom'), '0px');
  handlers.get('visual:resize')();
  assert.equal(sources, 1, 'rotation and viewport changes never remount the campaign');
});

test('one scoped Chromium phone-shell geometry probe in CI', () => {
  if (!process.env.GITHUB_ACTIONS) return;
  const result = cp.spawnSync(process.execPath,
    [path.join(__dirname, 'phone-edge-to-edge-browser.test.cjs')], {
      cwd: root, stdio: 'inherit', timeout: 120000, env: process.env,
    });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, 'full-bleed / safe UI browser geometry regression');
});
