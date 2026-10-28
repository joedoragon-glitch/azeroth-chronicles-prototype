'use strict';
// Regression for the accepted Rogue weapon, spanning canon, registry, menu,
// HUD, CSS and offline asset inventory. Generic ringing-bell emoji is wrong.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const R = require('../src/prototype/rules.js');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const canon = read('docs/ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md');
const art = read('src/prototype/visuals.js');
const app = read('src/prototype/app.js');
const styles = read('styles/prototype.css');
const inventory = require('../scripts/site-assets.cjs');
const svg = read('assets/ui/rogue-jingle-staff.svg');
assert(canon.includes('oversized spherical jingle bell'));
assert(art.includes('function rogueBellStaff('));
assert(art.includes('rogueBellStaff(crowned)'));
assert.equal(R.rogueHeroFoundation.weapon.instrument, 'suspended-jingle-bell');
Campaign.enableRoguePlaytest();
assert.equal(Campaign.classes.rogue.icon, 'jingle-bell-staff');
assert.notEqual(Campaign.classes.rogue.icon, '🔔');
assert(app.includes("id === 'rogue' ? '' : c.icon + ' '"),
  'class selector text must not include a generic bell emoji');
assert(app.includes("classIcon: id === 'rogue' ? c.icon : null"),
  'class registry icon identity must reach selector action');
assert(app.includes("b.classList.add('class-jingle-staff')"));
assert(app.includes('heroIconMarkup = h.class === \'rogue\''),
  'existing HUD must use the same semantic icon');
assert(styles.includes("url('../assets/ui/rogue-jingle-staff.svg')"));
assert(svg.includes('<svg') && svg.includes('viewBox="0 0 64 64"'));
assert(svg.includes('Staff with a large suspended spherical jingle bell'));
assert(svg.includes('<circle cx="41" cy="40" r="18"'),
  'round jingle body, not a conical bell');
assert(svg.includes('M16 60V9') && svg.includes('M41 13V22'),
  'staff plus distinct suspended bell');
assert(inventory.core.includes('assets/ui/rogue-jingle-staff.svg'),
  'the public and offline PWA asset list must carry the icon');
assert(!app.includes("'🔔'") && !app.includes('"🔔"'),
  'no generic ringing bell should reappear in the presentation shell');
console.log('PASS Rogue canonical jingle-bell staff remains consistent across class, menu, HUD, vector and PWA');
