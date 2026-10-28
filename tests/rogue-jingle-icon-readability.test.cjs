'use strict';
// Protect the canonical Rogue/Pícara UI mark: a spherical *jingle bell*
// with its suspension loop and crossed slots, not the generic handbell emoji
// or the earlier face-like engraving.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
const start = app.indexOf('const rogueJingleIconSvg =');
const end = app.indexOf('// Read-only class selection copy', start);
assert(start >= 0 && end > start, 'shared icon must be present before class selection');
const iconDeclaration = app.slice(start, end);
const svg = [...iconDeclaration.matchAll(/'([^']*)'/g)].map((match) => match[1]).join('');

assert.match(svg, /^<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"/,
  'native 20px UI icon must remain lightweight and hidden from redundant screen-reader output');
assert.match(svg, /<circle cx="12" cy="13\.2" r="8\.3"/,
  'a round brass jingle-ball, not a conical handbell');
assert.match(svg, /M9\.8 5\.2V3\.7a2\.2 2\.2 0 0 1 4\.4 0v1\.5/,
  'top hanging loop must distinguish an instrument from a simple coin or orb');
assert.match(svg, /M8\.5 9\.7l7 7m0-7l-7 7/,
  'prominent crossed sound slits must read at native icon size');
assert.match(svg, /stroke-width="2\.8"/,
  'the dark sound slots must not become hairline detail');
assert.doesNotMatch(svg, /Q12 15|Q12 19|M7 11\.5|M8\.8 16\.5/,
  'old curved face-like engravings must not return');
assert(!svg.includes('🔔'), 'generic handbell emoji is not Rogue canon');
assert.equal((svg.match(/<circle /g) || []).length, 2,
  'do not add decorative dots that read as eyes');

assert.match(app, /a\.classId === 'rogue'[\s\S]*?symbol\.innerHTML = rogueJingleIconSvg/,
  'shared icon must reach New Game and Succession class actions');
assert.match(app, /h\.class === 'rogue' \? rogueJingleIconSvg : Campaign\.classes\[h\.class\]\.icon/,
  'shared icon must reach HUD');
console.log('PASS Rogue class icon: spherical jingle bell, loop and sound slits across UI');
