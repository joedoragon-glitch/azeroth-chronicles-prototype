'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

for (const mode of ['normal', 'nightmare'])
  for (const heroClass of ['paladin', 'mage', 'ranger'])
    for (const form of ['normal', 'true']) {
      let c = new C(mode, heroClass, () => .73);
      c.enter('citadel');
      const center = { x: 1160, y: 1110 };
      c.zone().enemies = [c.bossEnemy(c.boss('citadel'), form, center)];
      let boss = c.zone().enemies[0];
      c.hero.maxHp = c.hero.hp = 1000000;
      c.hero.immune = 0;
      c.s.mercyTime = 0;
      c.s.party = [];
      Object.assign(c.hero, { x: 1240, y: 1130 });
      boss.aggro = true;
      let sawBoard = false;
      let simultaneous = false;
      let otherAttacks = 0;
      let maxProjectiles = 0;
      for (let i = 0; i < 850; i++) {
        c.tick(.04, { x: 0, y: 0 });
        boss = c.zone().enemies.find(e => e.family === 'citadel' && e.hp > 0);
        assert(boss, 'boss must not vanish during normal combat');
        assert(Number.isFinite(boss.x) && Number.isFinite(boss.y), 'finite movement');
        assert(Number.isFinite(c.hero.hp), 'finite player health');
        if (boss.board) {
          sawBoard = true;
          if (boss.telegraph || boss.motion || boss.attackIndex > 1) simultaneous = true;
          assert.equal(c.sentinelBoardCells(boss).length, 16);
        }
        otherAttacks = Math.max(otherAttacks, boss.attackIndex || 0);
        maxProjectiles = Math.max(maxProjectiles, c.s.projectiles.length);
        if (i === 350) {
          const snapshot = c.snapshot();
          c = C.restore(snapshot, () => .73);
          boss = c.zone().enemies.find(e => e.family === 'citadel' && e.hp > 0);
          assert(boss && Number.isFinite(boss.hp));
        }
      }
      assert(sawBoard, mode + '/' + heroClass + '/' + form + ': AI must initiate board');
      assert(simultaneous, 'persistent board must coexist with other boss behavior');
      assert(otherAttacks >= 3, 'boss should keep issuing attacks beyond initial board');
      assert(maxProjectiles <= 100, 'projectile count must remain bounded');
      console.log('PASS Veyra AI soak', mode, heroClass, form, { attacks: otherAttacks, projectiles: maxProjectiles });
    }
