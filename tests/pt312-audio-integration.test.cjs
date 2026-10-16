'use strict';
// Authored only; no audio context or game is executed during implementation.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Audio = require('../src/prototype/audio.js');
const P = require('../src/prototype/enemy-presentation.js');
const B = require('../src/prototype/enemy-vfx-events.js');
const audio = new Audio();
for (const species of Object.keys(C.rules.enemyMeleeKits.species)) {
  const equipment = C.rules.enemyMeleeEquipment({ species });
  const key = audio.soundKind({ type: 'melee', actor: 'enemy', species, ...equipment });
  assert.equal(key, equipment.material === 'steel' ? 'enemyWeaponImpact' :
    ['wood', 'stone'].includes(equipment.material) ? 'enemyHeavyImpact' :
      ['spectral', 'ash', 'wet', 'bone'].includes(equipment.material) ? 'enemyElementImpact' : 'creatureImpact');
}
for (const species of ['skeleton', 'orc', 'archer', 'crownguard'])
  assert.deepEqual(C.rules.enemyMeleeEquipment({ species, ranged: true }),
    { weapon: 'bow stave', material: 'wood' }, 'visible bow is not an invented knife');
{
  const g = new C('developer'); g.enter('highlands');
  const e = g.developerSummon('boss:ridge:normal');
  Object.assign(g.hero, g.safe(e.x + 110, e.y));
  g.effects = [];
  e.ledgerOpen = true;
  g.startAttack(e, g.hero, 1);
  const warning = g.effects.find((f) => f.type === 'enemyVfx' && f.stage === 'windup');
  assert(warning?.audioOnly, 'Ledger keeps its original hidden spatial-warning rule');
  assert.equal(P.route(warning).key, 'rollingCargoWindup');
  g.resolveAttack(e);
  assert(g.effects.some((f) => f.stage === 'release' && P.route(f)?.key === 'rollingCargoLaunch'));
  g.updateProjectiles(0.05);
  assert(g.effects.some((f) => f.stage === 'travel' && f.audioOnly && P.route(f)?.key === 'rollingCargoTravel'));
  const p = g.s.projectiles.find((p) => p.style === 'cargo');
  if (p) {
    const before = g.effects.length;
    g.enemyVfxProjectileImpact(p, { x: p.x, y: p.y, terrain: true });
    const impacts = g.effects.slice(before).filter((f) => f.stage === 'impact');
    assert.equal(impacts.length, 1);
    assert.equal(P.route(impacts[0]).key, 'rollingCargoImpact');
  }
}
{
  const marks = [{ x: 100, y: 150, radius: 50 }], a = { kind: 'circle', arenaPatches: marks };
  const frozen = B.geometry(a);
  marks[0].x = 900;
  assert.equal(frozen.arenaPatches[0].x, 100, 'visual payoff keeps actual warned coordinates');
  assert(Object.isFrozen(frozen.arenaPatches[0]));
}
console.log('PASS PT312 audio/event acceptance');
