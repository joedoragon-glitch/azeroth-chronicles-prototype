'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function kill(c, e) {
  e.hp = 0;
  e.heroParticipated = false;
  c.kill(e);
}
for (const mode of ['normal', 'nightmare']) {
  for (let index = 0; index < 30; index++) {
    const c = new C(mode, 'paladin', () => 0.9),
      q = c.questDefs().find((q) => q.id === 'quest-' + index);
    c.enter(q.region);
    if (q.kind === 'rescue') {
      const b = c.boss(q.target);
      if (b.kind === 'dungeon') c.enter(b.id);
      const z = c.zone();
      for (const e of z.enemies.filter((e) => e.guard || e.mini === q.clear)) kill(c, e);
      const boss = z.enemies.find(
        (e) => e.type === 'boss' && e.family === q.target && e.form === 'normal',
      );
      if (boss.hp > 0) kill(c, boss);
      assert(c.rescue(q.target));
    } else if (q.kind === 'patrol') {
      for (const e of c
        .zone()
        .enemies.filter((e) => e.type === 'mob' && !e.guard)
        .slice(0, q.target))
        kill(c, e);
    } else if (q.kind === 'bundles') {
      c.enter(C.rules.supplyRooms.find((room) => room.region === q.region).id);
      for (const e of c.zone().enemies.filter((e) => e.hp > 0)) kill(c, e);
      for (const n of c.zone().npcs.filter((n) => n.kind === 'bundle')) {
        Object.assign(c.hero, { x: n.x, y: n.y });
        assert(c.interact(n));
      }
    } else {
      if (q.kind === 'night') {
        c.s.clock = 400;
        c.updateNight();
        for (const e of c
          .zone()
          .enemies.filter((e) => e.nightOnly && e.species === 'wraith')
          .slice(0, q.target))
          kill(c, e);
      }
      for (const id of q.requiresRescues || []) c.s.rescued[id] = true;
      for (const id of q.sites.slice(0, q.minSites || q.sites.length)) c.discover(id);
    }
    c.checkQuests();
    assert(
      c.s.quests[q.id].done && c.s.quests[q.id].paid,
      q.id + ' completes through its real objective',
    );
    const before = c.snapshot();
    c.checkQuests();
    assert(!c.claim(q.id));
    assert.equal(c.hero.gold, before.hero.gold);
    const restored = C.restore(c.snapshot());
    restored.checkQuests();
    assert(restored.s.quests[q.id].paid, 'paid saves retain completion');
    assert.equal(restored.notices.length, 0, 'paid saves do not replay notices');
  }
}
console.log(
  'PASS all 30 real quest objectives in both modes, once-only rewards and paid-save silence',
);
