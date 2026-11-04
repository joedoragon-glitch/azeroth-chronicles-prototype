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

test('Crowns remain visible inside the existing HP row on PC and phone', () => {
  const shared = read('styles/prototype.css');
  assert.match(app, /class="health-readout"/);
  assert.match(app, /class="hud-crowns"/);
  assert.match(app, /coin\.width = coin\.height = 56;/,
    'coin texture includes padding for the full mint and shadow');
  assert.match(app, /PrototypeRenderer\.drawCrownLoot\(ink, \{ x: 14, y: 14 \}\)/,
    'HUD coin uses the same Dark Lord portrait painter as world loot');
  assert.match(app, /Math\.floor\(h\.gold\)\.toLocaleString\(language === 'es' \? 'es-ES' : 'en-US'\)/);
  assert.doesNotMatch(app, /'">👑 '/, 'generic emoji must not represent minted Crowns');
  assert.match(shared, /#hero-stats \.health-readout \.hud-crowns::before \{/,
    'coin sits in its own unclipped icon box instead of the short text line');
  assert.match(shared, /#hero-stats \.health-readout \.hud-crowns::before \{[^}]*position: absolute;/);
  assert.match(shared, /#hero-stats \.health-readout \.hud-crowns::before \{[^}]*width: 19px;[^}]*height: 19px;/);
  assert.match(shared, /#hero-stats \.health-readout \.hud-crowns::before \{[^}]*background-image: var\(--hud-crown-image, none\);/);
  assert.match(shared, /#hero-stats \.health-readout \{[^}]*display: flex;/);
  assert.match(shared, /#hero-stats \.health-readout \.hud-crowns \{[^}]*font-variant-numeric: tabular-nums;/);
  // The old wallet/XP row stays menu-only. The Crown counter is independent.
  assert.match(desktop, /#hero-stats \.wallet \{\s*display: none;/);
  assert.match(phone, /#hero-stats \.wallet,[\s\S]*?display: none;/);
  assert.match(phone, /#hero-stats \.hud-low-health \{[\s\S]*?top: 13px;/);
});

test('Phone has one visible native Menu control with a readable label', () => {
  const menu = finalRule(phone, "body[data-experience='phone'] #hud #menu-button");
  assert.match(menu, /position: fixed/);
  assert.match(menu, /right: max\(8px, var\(--phone-safe-right, env\(safe-area-inset-right\)\)\)/);
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
  assert.match(update, /top: max\(8px, var\(--phone-safe-top, env\(safe-area-inset-top\)\)\)/);
  assert.match(update, /right: calc\(max\(8px, var\(--phone-safe-right, env\(safe-area-inset-right\)\)\) \+ 104px\)/);
  assert.match(landscape, /@media \(orientation: landscape\) and \(min-width: 601px\)/);
  assert.match(landscape, /top: calc\(max\(8px, var\(--phone-safe-top, env\(safe-area-inset-top\)\)\) \+ 54px\)/);
});

test('Option B leaves the existing two-thumb, left-hand and full phone grid rules intact', () => {
  assert.match(phone, /\[data-phone-layout='left-hand'\] #skills/);
  assert.match(phone, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(phone, /#joystick/);
  assert.match(phone, /#quick-items/);
  assert.match(phone, /#touch-interact-button/);
  assert.match(phone, /#squad-button/);
});


test('Landscape Stage 2 reuses the merged title and protects wide phone menus', () => {
  const landscape = phone.slice(phone.indexOf('/* Landscape phone Stage 2'));
  assert(landscape.length > 1200, 'Stage 2 landscape override must remain in the phone stylesheet');
  assert.match(landscape, /@media \(orientation: landscape\) and \(min-width: 560px\) and \(max-height: 560px\)/);
  assert.match(landscape, /#title-screen nav button \{\s*min-height: 44px;/);
  assert.match(landscape, /\.title-active #modal\[data-dialog-size\] \{[\s\S]*?width: min\(/);
  assert.match(landscape, /#modal\[data-view='class-select'\] #modal-actions \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(landscape, /#modal\[data-view='class-select'\] #modal-actions > \.character-name-field \{[\s\S]*?grid-column: 1 \/ -1;/);
  for (const view of ['adventure', 'settings'])
    assert(landscape.includes("#modal[data-view='" + view + "'] #modal-actions"),
      'wide indexed menu must reuse existing view: ' + view);
  assert.match(landscape, /#modal:has\(\.menu-setting\) #modal-actions \{\s*grid-template-columns: minmax\(0, 1fr\)/,
    'inline sliders and selects remain in their own rows');
  assert(!landscape.includes('display: none'), 'no existing landscape actions are hidden');
  const frameCSS = read('styles/phone-frame.css');
  const frameHTML = read('phone.html');
  const gameHTML = read('phone-game.html');
  assert.match(frameCSS, /@media \(orientation: portrait\)[\s\S]*?transform: rotate\(90deg\)/,
    'physical portrait rotates the full landscape game iframe, not game internals');
  assert.match(frameHTML, /id="phone-game-frame"/,
    'public phone entry keeps one live same-origin game frame');
  assert.match(frameHTML, /'\.\/phone-game\.html' \+ window\.location\.search \+ window\.location\.hash/,
    'the public entry loads the game once and preserves diagnostic URL options');
  assert.match(gameHTML, /data-entry="phone"/,
    'the embedded game retains native phone rules and full viewport');
  assert.match(read('manifest.webmanifest'), /"orientation": "landscape"/,
    'installed app prefers native landscape when supported');
});

test('fixed-horizontal phone shell preserves one landscape game frame', () => {
  const wrapper = read('phone.html');
  const game = read('phone-game.html');
  const framing = read('styles/phone-frame.css');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const assetInventory = read('scripts/site-assets.cjs');
  assert.match(wrapper, /id="phone-game-frame"/);
  assert.match(wrapper, /'\.\/phone-game\.html' \+ window\.location\.search \+ window\.location\.hash/,
    'frame loads once with the original phone URL options');
  assert.match(wrapper, /<link rel="stylesheet" href="\.\/styles\/phone-frame\.css">/);
  assert.match(game, /<body data-entry="phone">/);
  assert.match(game, /id="world"/);
  assert.match(game, /src="\.\/src\/prototype\/app\.js"/);
  assert.equal(manifest.start_url, './phone.html');
  assert.equal(manifest.orientation, 'landscape');
  assert.match(framing, /@media \(orientation: portrait\)/);
  assert.match(framing, /transform: rotate\(90deg\)/);
  assert.match(framing, /width: 100dvh/);
  assert.match(framing, /height: 100dvw/);
  assert.match(assetInventory, /'phone-game\.html'/);
  assert.match(assetInventory, /'styles\/phone-frame\.css'/);
  assert(!wrapper.includes('id="phone-orientation-prompt"'),
    'physical portrait must show the live game, not a rotation warning');
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
