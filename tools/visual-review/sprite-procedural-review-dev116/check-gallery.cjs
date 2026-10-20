'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/review.html', 'utf8'),
  audit = JSON.parse(fs.readFileSync(__dirname + '/audit.json'));
const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id))
      elements.set(id, {
        value: id === 'group' ? 'all' : '',
        tagName: 'SELECT',
        click() {
          if (!this.disabled) this.onclick?.();
        },
      });
    return elements.get(id);
  },
};
const box = vm.createContext({ document });
vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1], box);
let visited = 0;
for (const group of ['all', ...new Set(audit.records.map((r) => r.group))]) {
  elements.get('group').value = group;
  elements.get('group').onchange();
  const rows = audit.records.filter((r) => group === 'all' || r.group === group);
  assert(elements.get('prev').disabled);
  for (const row of rows) {
    elements.get('jump').value = String(row.number);
    elements.get('jump').onchange();
    assert(elements.get('art').src.startsWith('data:image/webp;base64,'));
    assert(elements.get('art').alt.startsWith(row.number + ' '));
    visited++;
  }
  assert(elements.get('next').disabled);
  elements.get('prev').click();
  assert.equal(elements.get('prev').disabled, rows.length <= 2);
}
assert.equal(audit.baseRegistrations, 33);
assert.equal(audit.idleFrames, 4);
assert.equal(visited, 74);
console.log(
  'PASS 74 gallery navigation selections across all/category views; 33 base sprites and 4 idle frames.',
);
