'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/combat-visuals.js');
const boss = C.data.bosses.find((b) => b.id === 'darklord');

for (const mode of ['normal', 'nightmare'])
  for (const cls of Object.keys(C.classes))
    for (const form of ['normal', 'true']) {
      const game = new C(mode, cls, () => 0.9);
      assert(game.enter('crown'));
      const lord = game.bossEnemy(boss, form, { x: 1100, y: 1100 });
      game.zone().enemies = [lord];
      Object.assign(game.hero, { x: 1200, y: 1100, maxHp: 100000, hp: 100000 });
      const actualHits = [],
        realResolve = game.resolveArea.bind(game);
      game.resolveArea = (actor, a) => {
        actualHits.push({
          fromX: actor.x, fromY: actor.y, warnedX: a.x, warnedY: a.y,
          timer: a.total, name: a.name,
        });
        return realResolve(actor, a);
      };
      assert(game.startAttack(lord, game.hero, 0));
      const moves = [];
      for (let stage = 0; stage < 3; stage++) {
        const a = lord.telegraph;
        assert(a, 'all three strikes get separate real cast bars');
        assert.equal(a.total, [1.1, 0.5, 0.8][stage]);
        assert(a.anonymousCast, 'each sword stage has an anonymous cast bar');
        assert.equal(Visuals.warningShapes(a, game.attackPatches(a)).length, 1,
          'the physical hit geometry remains intact when the ground warning is hidden');
        const before = { x: lord.x, y: lord.y };
        assert.equal(a.x, before.x, 'warn at the real sword origin');
        assert.equal(a.y, before.y, 'warn at the real sword origin');
        game.resolveAttack(lord);
        if (lord.motion) {
          assert(lord.motion.royalSidestepAfterStrike);
          lord.telegraph = null;
          for (let tick = 0; tick < 20 && lord.motion; tick++)
            game.advanceMotion(lord, 0.05);
          assert(!lord.motion, 'bounded physical motion completes');
        } else lord.telegraph = game.advanceQueuedAttack(lord);
        moves.push(lord.y - before.y);
      }
      assert.equal(actualHits.length, 3, 'no motion-driven duplicate strike');
      for (const hit of actualHits) {
        assert.equal(hit.fromX, hit.warnedX, 'hit matches original warning x');
        assert.equal(hit.fromY, hit.warnedY, 'hit matches original warning y');
      }
      assert(moves[0] >= 30 && moves[1] <= -30,
        'opposing actual left/right positions between warnings');
      assert.equal(moves[2], 0, 'final thrust stays put');
      assert(C.restore(game.snapshot()), 'v4 save remains valid');

      // Impassable lateral paths do not turn the sequence into a teleport,
      // skip its hits, or silently reverse a direction.
      const blocked = new C(mode, cls, () => 0.9);
      blocked.enter('crown');
      const stuck = blocked.bossEnemy(boss, form, { x: 1100, y: 1100 });
      blocked.zone().enemies = [stuck];
      Object.assign(blocked.hero, { x: 1200, y: 1100, maxHp: 100000, hp: 100000 });
      assert(blocked.startAttack(stuck, blocked.hero, 0));
      blocked.clearSegment = () => false;
      for (let stage = 0; stage < 3; stage++) {
        const warn = stuck.telegraph;
        assert(warn && warn.anonymousCast);
        const origin = { x: stuck.x, y: stuck.y };
        blocked.resolveAttack(stuck);
        assert(!stuck.motion, 'blocked physical sidestep cannot be forced');
        assert.equal(stuck.x, origin.x);
        assert.equal(stuck.y, origin.y);
        stuck.telegraph = blocked.advanceQueuedAttack(stuck);
      }
      assert(C.restore(blocked.snapshot()), 'blocked sequence still restores');
    }

console.log('PASS 12 normal/TRUE class-mode sequences, 3 anonymous cast stages, alternating physical sidesteps, blocked routes and v4 saves');
