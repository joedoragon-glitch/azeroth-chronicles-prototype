'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const desktop = read('styles/desktop.css');
const phone = read('styles/phone.css');
const app = read('src/prototype/app.js');
const input = read('src/prototype/input.js');
const shell = read('index.html');

function finalRule(css, selector) {
  const at = css.lastIndexOf(selector + ' {');
  assert(at >= 0, 'missing CSS selector: ' + selector);
  return css.slice(at, css.indexOf('}', at) + 1);
}

test('Option B reuses the native Menu and eight skill actions', () => {
  assert.match(shell, /id="menu-button"[^>]*aria-label="Open game menu"/);
  assert.match(shell, /id="skills" aria-label="Skills"/);
  assert.match(app, /for \(let i = 0; i < 8; i\+\+\)/);
  assert.match(input, /Array\.from\(\{ length: 8 \}/);
  for (const id of ['recall-button', 'target-button', 'touch-interact-button', 'squad-button']) {
    assert(shell.includes('id="' + id + '"'), 'existing action must remain: ' + id);
  }
});

test('PC retains actions and context while reducing permanent sidebar', () => {
  const dock = finalRule(desktop, "body[data-experience='desktop'] #hud");
  assert.match(dock, /width: 188px/);
  assert.match(dock, /background: #142832dc/);
  const hidden = desktop.slice(desktop.indexOf('/* Option B (PC)'));
  assert.match(hidden, /#objective,[\s\S]*?#hero-stats \.wallet \{\s*display: none;/);
  assert(!/body\[data-experience='desktop'\] #skills\s*\{\s*display: none/.test(hidden));
  assert(!/body\[data-experience='desktop'\] #status\s*\{\s*display: none/.test(hidden));
  assert.match(hidden, /#cancel-navigation-button \{[\s\S]*?right: 208px/);
});

test('Phone has one visible native Menu control with a readable label', () => {
  const menu = finalRule(phone, "body[data-experience='phone'] #hud #menu-button");
  assert.match(menu, /position: fixed/);
  assert.match(menu, /right: max\(8px, env\(safe-area-inset-right\)\)/);
  assert.match(menu, /width: 94px/);
  assert.match(menu, /min-height: 46px/);
  assert.match(menu, /font-size: 13px/);
  assert.match(finalRule(phone, "body[data-experience='phone'] #hud #menu-button::before"), /content: none/);
  assert.match(app, /'☰ Menú '| '☰ Menu '/);
  assert(!/body\[data-experience='phone'\] #hud #menu-button \{[^}]*display: none/.test(phone));
});

test('The phone Menu and update action use distinct positions', () => {
  const update = finalRule(phone, "body[data-experience='phone'] #update-button:not([hidden])");
  const landscape = phone.slice(phone.indexOf('/* Option B (phone)'));
  assert.match(update, /top: max\(8px, env\(safe-area-inset-top\)\)/);
  assert.match(update, /right: calc\(max\(8px, env\(safe-area-inset-right\)\) \+ 104px\)/);
  assert.match(landscape, /@media \(orientation: landscape\) and \(min-width: 601px\)/);
  assert.match(landscape, /top: calc\(max\(8px, env\(safe-area-inset-top\)\) \+ 54px\)/);
});

test('Option B leaves the existing two-thumb, left-hand and full phone grid rules intact', () => {
  assert.match(phone, /\[data-phone-layout='left-hand'\] #skills/);
  assert.match(phone, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(phone, /#joystick/);
  assert.match(phone, /#quick-items/);
  assert.match(phone, /#touch-interact-button/);
  assert.match(phone, /#squad-button/);
});

test('Option B targeted real-shell captures (desktop and two landscape sizes)', () => {
  if (!process.env.GITHUB_ACTIONS) return;
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [path.join(__dirname, 'hud-option-b-visual.cjs')], {
    cwd: root,
    stdio: 'inherit',
    timeout: 180000,
    env: process.env,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, 'real-shell visual geometry and menu smoke failed');
});
