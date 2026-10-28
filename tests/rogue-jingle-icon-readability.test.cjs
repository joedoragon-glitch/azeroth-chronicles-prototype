'use strict';
// Owner-approved Option A is intentionally a simple inline SVG at real game
// size, not an elaborate painted icon or the former X/face-like fallback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
const start = app.indexOf('const rogueJingleIconSvg =');
const end = app.indexOf('// Read-only class selection copy', start);
assert(start >= 0 && end > start, 'shared icon must be defined near class selection');
const svg = [...app.slice(start, end).matchAll(/'([^']*)'/g)]
  .map((match) => match[1]).join('');

assert.match(svg, /^<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"/,
  'match the existing 20px UI scale without duplicating spoken class text');
assert.match(svg, /<circle cx="12" cy="13\.1" r="8\.8" fill="#f1d77e" stroke="#18140f"/,
  'Option A has a pale-gold circular shell and dark clear outline');
assert.match(svg, /M9\.75 5\.1V4\.2a2\.25 2\.25 0 0 1 4\.5 0v\.9/,
  'a top hanging loop is required for the jingle-bell silhouette');
assert.match(svg, /M3 12\.6H21/,
  'Option A must have the horizontal equator seam from the supplied reference');
assert.match(svg, /M12 17\.9V21\.65/,
  'bottom vertical slit must reach the shell edge');
assert.match(svg, /<circle cx="12" cy="17\.2" r="1\.65" fill="#18140f"/,
  'the slit ends at a single lower keyhole opening');
assert.match(svg, /M6\.1 8\.9Q7\.5 6\.8 10\.9 6\.6/,
  'one short upper-left curved groove, not a second slot');
assert.equal((svg.match(/<circle /g) || []).length, 2,
  'only bell body and one keyhole, not eye-like dots');
assert.doesNotMatch(svg, /M8\.5 9\.7l7 7m0-7l-7 7|Q12 15|Q12 19|🔔/,
  'reject the old crossed-cutout, face-like or generic handbell design');
assert.match(app, /a\.classId === 'rogue'[\s\S]*?symbol\.innerHTML = rogueJingleIconSvg/,
  'Rogue option in New Game and Succession must use this exact icon');
assert.match(app, /h\.class === 'rogue' \? rogueJingleIconSvg : Campaign\.classes\[h\.class\]\.icon/,
  'HUD must use the same icon, not a separate placeholder');
console.log('PASS Rogue Option A: jingle-bell geometry and shared 20px class UI');
