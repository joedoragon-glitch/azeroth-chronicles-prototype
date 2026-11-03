'use strict';
// #684: game-authored timed Recall announcements and the updated tutorial
// must be available in Spanish, not silently fall back to English.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/prototype/app.js'), 'utf8');
const party = fs.readFileSync(path.join(root, 'src/prototype/party.js'), 'utf8');
const menus = fs.readFileSync(path.join(root, 'src/prototype/menus.js'), 'utf8');
const marker = app.indexOf('// #684: Match the authored timed-Recall feedback');
assert(marker >= 0, 'Recall translation section is present');
const prefix = 'Object.assign(spanishText, ';
const start = app.indexOf(prefix, marker) + prefix.length;
const end = app.indexOf('\n  });', start);
assert(start >= prefix.length && end > start, 'Recall dictionary is a complete object');
const dictionary = vm.runInNewContext('(' + app.slice(start, end + 4) + ')');
const messages = [
  "Squad Recall cancelled.",
  "Squad Recall ended after five seconds.",
  "Recall OFF · companions resume normal orders.",
  "Recall expired · companions resume normal orders.",
  "Recall active. Tap Recall again or wait for the five-second hold before assigning work.",
  "Squad Recall ON for five seconds. Press Recall again to cancel.",
  "Recall ON · 5s defensive hold · tap again to cancel."
];
for (const message of messages) {
  assert(party.includes(message), 'authored Recall feedback present: ' + message);
  assert.equal(typeof dictionary[message], 'string', 'missing Spanish Recall copy: ' + message);
  assert(dictionary[message].length > 0 && dictionary[message] !== message,
    'Recall text has an actual Spanish translation: ' + message);
}
const tutorial = 'Recalled!\\nOrders cancelled. Companions stay close and defend without chasing for up to five seconds.\\nPress Recall again to cancel early; the button shows when it is active.\\n\\nNext: build your first Barracks for FREE.';
assert(menus.includes(tutorial), 'updated tutorial uses the timed-Recall text');
assert(app.includes("'" + tutorial + "':"), 'Spanish dictionary owns the updated tutorial key');
assert(app.includes('¡Reagrupados!'), 'updated tutorial has Spanish authored text');
console.log('PASS timed Recall feedback and tutorial have explicit Spanish translations');
