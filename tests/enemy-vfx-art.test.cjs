'use strict';
const assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../src/prototype/engine.js'),
  V = require('../src/prototype/enemy-vfx.js'),
  Art = require('../src/prototype/enemy-vfx-art.js'),
  FX = require('../src/prototype/combat-visuals.js'),
  Inventory = require('../scripts/enemy-vfx-inventory.cjs');
const rows = [...Inventory.collect(), ...require('./fixtures/enemy-vfx-rogue-signatures.json')];
for (const r of rows)
  assert(
    Art.recipe(
      { id: r.id, variant: 'normal', role: r.id.includes('/ranged/') ? 'ranged' : 'melee' },
      { kind: r.kind, style: r.kind, effect: r.kind },
    ),
    r.id + ' authored recipe',
  );
const c = new C('normal', 'paladin', () => 0.5);
c.s.party = [];
c.s.projectiles = [];
c.s.hazards = [];
c.zone().enemies = [];
c.line = () => true;
c.blocked = () => false;
Object.assign(c.hero, { x: 1500, y: 1700, hp: 100000, maxHp: 100000 });
const canvas = createCanvas(900, 600),
  ctx = canvas.getContext('2d'),
  screen = (p) => ({ x: 450 + (p.x - p.y - -200) * 0.76, y: 300 + (p.x + p.y - 3200) * 0.27 });
let count = 0;
for (const b of C.data.bosses)
  for (const form of ['normal', 'true'])
    for (let index = 0; index < C.rules.attacks[b.id].length; index++) {
      c.s.hazards = [];
      c.s.projectiles = [];
      c.effects = [];
      const e = c.bossEnemy(b, form, { x: 1400, y: 1700 });
      e.aggro = true;
      c.zone().enemies = [e];
      c.startAttack(e, c.hero, index);
      const before = JSON.stringify(c.s);
      Art.actors(ctx, screen, c, []);
      assert.equal(JSON.stringify(c.s), before, 'windup drawing stays pure');
      c.resolveAttack(e);
      e.telegraph = null;
      if (e.motion) for (let j = 0; j < 25 && e.motion; j++) c.advanceMotion(e, 0.05);
      let effects = FX.queue(c.effects, c);
      assert(effects.length <= 40);
      for (let j = 0; j < 8; j++) {
        for (const f of effects) f.life = Math.max(0.01, f.max - j * 0.04);
        const before = JSON.stringify(c.s);
        Art.ground(ctx, screen, c, effects);
        Art.actors(ctx, screen, c, effects);
        for (const p of c.s.projectiles) Art.projectile(ctx, screen, p, c);
        assert.equal(JSON.stringify(c.s), before, 'resolved draw stays pure');
      }
      count++;
    }
// Exact truthful summon/ring warning language and real collision dimensions.
assert.deepEqual(
  FX.warningShapes({ kind: 'summon', x: 1, y: 2, radius: 100 }, [{ x: 1, y: 2, radius: 100 }]),
  [],
);
const ring = FX.warningShapes({ kind: 'ring', fromX: 0, fromY: 0 }, [])[0],
  max = Math.max(...ring.map((p) => p.x));
assert.equal(
  max,
  C.rules.combatGeometry.ringSpeed *
    C.rules.combatGeometry.ringLife *
    C.rules.bossCadence.areaRangeMultiplier +
    C.rules.combatGeometry.ringHalfWidth,
);
// Death, travel, same-zone reentry and old event delivery cannot retain decoration.
const e = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 });
c.zone().enemies = [e];
c.effects = [];
c.startAttack(e, c.hero, 0);
c.resolveAttack(e);
const events = c.effects.filter((f) => f.type === 'enemyVfx');
assert(Art.queue(events, c, []).length);
e.hp = 0;
assert.equal(Art.queue(events, c, []).length, 0);
e.hp = e.maxHp;
c.enter(c.zoneId);
assert.equal(Art.queue(events, c, []).length, 0);
// Crowd/dedup ceiling is shared with hero cues and no stage alters danger overlays.
c.zone().enemies = [e];
c.effects = [];
c.startAttack(e, c.hero, 0);
c.resolveAttack(e);
const fresh = c.effects.filter((f) => f.type === 'enemyVfx');
const many = Array.from({ length: 1000 }, (_, j) => ({ ...fresh[0], eventId: 1000 + j }));
const bounded = FX.queue(many, c);
assert.equal(bounded.length, 40);
assert.equal(FX.queue(many, c, bounded).length, 40);
const id = V.describe(e, e.telegraph);
Art.rollback(id.id, 'release');
assert(!Art.queue(fresh, c, []).some((f) => f.stage === 'release'));
Art.rollback(id.id, 'release', false);
assert.equal(
  Art.installManifest({
    version: 1,
    effects: { bad: { stages: { impact: { type: 'sprite', spriteKey: 'https://bad' } } } },
  }),
  false,
);
assert(Art.installManifest({ version: 1, effects: {} }));
console.log(
  'PASS ' +
    rows.length +
    ' authored recipes, ' +
    count +
    ' normal/TRUE animation draws, exact summon/ring cues, purity, death/travel/dedupe/crowd/rollback/fallback',
);
