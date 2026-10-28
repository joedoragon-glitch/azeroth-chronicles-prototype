'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const C = require('../src/prototype/engine.js');
const title = "Scornfang's Treasury",
  oldTitle = "Thornfang's Treasury";
const clone = (v) => JSON.parse(JSON.stringify(v));
const room = C.rules.supplyRooms.find((r) => r.id === 'supply-vale');
assert.equal(room.name, title);
assert.equal(room.objective, 'Recover 2 caches from ' + title);
assert.equal(room.boss, 'thorn');
assert.equal(room.count, 2);
assert.deepEqual(room.entryOffset, [255, -170]);
assert.equal(C.rules.roomCaptains['supply-vale'].name, 'Scornfang');
assert.equal(C.rules.roomCaptains['supply-vale'].mentor, 'thorn');
assert.equal(C.rules.treasuryRecovery.sites.find((s) => s.region === 'vale').name, title);
assert.equal(C.data.quests.filter((q) => q[0] === 'vale').length, 6);
assert.deepEqual(
  C.data.quests.find((q) => q[1] === 'Stolen Stores'),
  ['vale', 'Stolen Stores', 'Recover 2 caches from ' + title, 35, 100],
);
const g = new C('normal', 'paladin', () => 0.73);
g.enter('supply-vale');
const original = g.snapshot();
original.zones.vale.nodes[0].amount = 37;
original.discovered['supply-vale:bundle-0'] = true;
original.treasuryRecovery.vale = { crowns: 73, unlocked: true, respawnAt: 500 };
const dead = original.zones['supply-vale'].enemies.find((e) => e.guard && !e.roomCaptain);
assert(dead);
dead.hp = 0;
dead.deathPaid = true;
const old = clone(original);
old.zones.vale.npcs.find((n) => n.id === 'supply-entrance').name = oldTitle;
for (const n of old.zones['supply-vale'].npcs) {
  if (n.kind === 'exit') n.name = 'Leave ' + oldTitle;
  if (n.kind === 'bundle' && !n.treasuryRecovery) n.name = oldTitle + ' cache ' + (n.index + 1);
}
// These are ALREADY-CURRENT layouts. A geometry-version bump would disguise
// the exact save case that previously retained old labels forever.
assert.equal(old.zones.vale.supplyRoomVersion, 6);
assert.equal(old.zones['supply-vale'].treasuryVersion, 3);
const untouched = JSON.stringify(old),
  restored = C.restore(old, () => 0.73),
  control = C.restore(original, () => 0.73);
assert.equal(JSON.stringify(old), untouched, 'never edit the imported backup');
assert.deepEqual(
  restored.snapshot(),
  control.snapshot(),
  'only presentation differs from the identical correctly named campaign',
);
assert.equal(restored.s.zones.vale.npcs.find((n) => n.id === 'supply-entrance').name, title);
for (const n of restored.zone().npcs) {
  if (n.kind === 'exit') assert.equal(n.name, 'Leave ' + title);
  if (n.kind === 'bundle' && !n.treasuryRecovery)
    assert.equal(n.name, title + ' cache ' + (n.index + 1));
}
assert.equal(restored.zoneId, 'supply-vale');
assert.equal(restored.zone().enemies.find((e) => e.id === dead.id).hp, 0);
assert.equal(restored.treasuryLostCrowns('vale'), 73);
assert(
  restored
    .zone()
    .npcs.filter((n) => n.treasuryRecovery)
    .every((n) => !n.name.includes('cache')),
  'recovery bundles retain their own name and finite value',
);
assert.equal(restored.s.zones.vale.nodes[0].amount, 37);
assert.equal(restored.s.discovered['supply-vale:bundle-0'], true);
const once = restored.snapshot(),
  twice = C.restore(once, () => 0.73);
assert.deepEqual(twice.snapshot(), once, 'presentation reconciliation is idempotent');
for (const f of ['data.js', 'rules.js', 'app.js']) {
  const source = fs.readFileSync(path.join(__dirname, '../src/prototype', f), 'utf8');
  assert(!source.includes(oldTitle), f + ' has no stale active title');
}
const shell = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(shell.includes('Recupera 2 escondites del tesoro de Scornfang.'));
assert(!shell.includes('tesoro de Thornfang.'));
console.log(
  'PASS Scornfang visible name, unchanged current-layout v4 restore, two reloads, paid/dead/cache/tribute/recovery and EN/ES objective identity',
);
