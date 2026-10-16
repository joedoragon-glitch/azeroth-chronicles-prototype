'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  for (const cls of Object.keys(C.classes)) {
    const c = new C(mode, cls, () => 0.9);
    assert(c.enter('crown'));
    const gate = c.zone().npcs.find((n) => n.id === 'fortress-gate');
    assert(gate, 'fortress gate remains available');
    assert(!c.zone().npcs.some((n) => n.kind === 'throne'), 'no ending action before TRUE victory');
    const staleThrone = { id: 'dark-crown-throne', kind: 'throne', x: 3250, y: 3090 };
    assert.equal(c.interact(staleThrone), false, 'stale references cannot claim before victory');
    c.zone().npcs.push(staleThrone);
    const restoredEarly = C.restore(c.snapshot());
    assert(!restoredEarly.zone().npcs.some((n) => n.kind === 'throne'),
      'historical cached throne is removed on restore');
    c.s.normal.darklord = true;
    c.refreshNPCs();
    assert(!c.zone().npcs.some((n) => n.kind === 'throne'), 'normal victory does not expose coronation');
    c.s.true.darklord = true;
    c.awaken();
    c.refreshNPCs();
    const thrones = c.zone().npcs.filter((n) => n.id === 'dark-crown-throne');
    assert.equal(thrones.length, 1, 'TRUE victory creates exactly one throne interaction');
    const throne = thrones[0];
    assert(!c.blocked(throne.x, throne.y, 'crown'), 'the throne is not inside an obstacle');
    assert(c.route(gate, throne).length > 0, 'the throne is reachable from the gate');
    for (const id of C.dungeonIds) {
      c.s.normal[id] = true;
      c.s.true[id] = true;
    }
    c.checkEnding();
    assert.equal(c.peace, false, 'even five old TRUE victories do not skip coronation');
    Object.assign(c.hero, { x: throne.x + 20, y: throne.y });
    for (const enemy of c.zone().enemies) if (enemy.family === 'darklord') enemy.hp = 0;
    assert(c.interact(throne), 'claiming the nearby throne succeeds');
    assert(c.peace, 'all already-credited TRUE victories allow peace upon coronation');
    assert.equal(c.s.throneClaimed, true);
    assert.equal(C.restore(c.snapshot()).s.throneClaimed, true, 'v4 restores coronation');
    const legacyPeace = c.snapshot();
    delete legacyPeace.throneClaimed;
    assert(C.restore(legacyPeace).peace, 'pre-snapshot v4 peace is grandfathered');
    const legacyAwakening = c.snapshot();
    legacyAwakening.phase = 'awakening';
    delete legacyAwakening.throneClaimed;
    assert.equal(C.restore(legacyAwakening).s.throneClaimed, false);
    assert.equal(
      C.restore(legacyAwakening).zone().npcs.filter((n) => n.id === 'dark-crown-throne').length,
      1,
      'throne safely added once to earlier generated Crown zone',
    );
  }
}

console.log('PASS six throne routes, explicit coronation, prior TRUE credits and legacy v4 restores');
