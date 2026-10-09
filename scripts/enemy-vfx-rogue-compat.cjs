'use strict';
const assert = require('node:assert/strict'),
  path = require('node:path');
const live = path.resolve(__dirname, '..'),
  rogue = path.resolve(process.argv[2] || live);
const C = require(path.join(rogue, 'src/prototype/engine.js')),
  V = require(path.join(live, 'src/prototype/enemy-vfx.js')),
  Art = require(path.join(live, 'src/prototype/enemy-vfx-art.js'));
if (!C.prototype.enemyVfxEpoch)
  require(path.join(live, 'src/prototype/enemy-vfx-events.js')).install(C);
const cfg = C.rules.tacticalFoundation,
  actors = [];
assert(
  cfg.rogueRingleaderSignatures && cfg.rogueSignatures,
  'Pass a checked-out expanded rogue branch as the first argument.',
);
for (const [role, profiles] of Object.entries(cfg.rogueRingleaderSignatures))
  for (const [species, profile] of Object.entries(profiles))
    actors.push({ species, form: 'ringleader', ranged: role === 'ranged', profile });
for (const [family, profile] of Object.entries(cfg.rogueSignatures.bosses))
  actors.push({ family, type: 'boss', profile });
for (const [captainProfile, profile] of Object.entries(cfg.rogueSignatures.captains))
  actors.push({ captain: true, captainProfile, profile });
const visualRows = [];
for (const spec of actors) {
  function run(enabled) {
    const c = new C('normal', 'paladin', () => 0.5);
    c.enemyVfxEnabled = enabled;
    c.enter('vale');
    c.s.party = [];
    c.s.projectiles = [];
    c.s.hazards = [];
    c.zone().props = [];
    c.line = () => true;
    c.blocked = () => false;
    Object.assign(c.hero, { x: 1450, y: 1700, hp: 100000, maxHp: 100000 });
    const e =
      spec.type === 'boss'
        ? c.bossEnemy(c.boss(spec.family), 'normal', { x: 1400, y: 1700 })
        : c.makeEnemy(
            { species: spec.species || 'orc', level: 5, hp: 10000, damage: 20, gold: 0, xp: 0 },
            { x: 1400, y: 1700 },
          );
    const { profile, ...fields } = spec;
    Object.assign(e, fields, { aggro: true });
    c.zone().enemies = [e];
    c.zone();
    assert(c.tacticalRogueMove(e, c.hero, true));
    assert(e.telegraph.rogueSignature, JSON.stringify(spec));
    const a = e.telegraph,
      id = V.describe(e, a);
    assert(Art.recipe(id, a, e));
    c.resolveAttack(e);
    return {
      snapshot: c.snapshot(),
      events: c.effects.filter((f) => f.type === 'enemyVfx'),
      id,
      a,
    };
  }
  const on = run(true),
    off = run(false);
  assert.deepEqual(on.snapshot, off.snapshot, on.id.id);
  assert(on.events.some((f) => f.stage === 'release'));
  assert(on.events.some((f) => f.stage === 'impact'));
  visualRows.push({
    id: on.id.id,
    group: 'rogue-signature',
    name: on.a.name,
    kind: on.a.effect,
    stages: ['windup', 'release', 'impact'],
    geometry: {
      kind: on.a.kind,
      effect: on.a.effect,
      style: on.a.style,
      radius: on.a.radius,
      rogueMove: true,
      rogueSignature: true,
    },
  });
}
if (process.argv.includes('--update-fixture'))
  require('node:fs').writeFileSync(
    path.join(live, 'tests/fixtures/enemy-vfx-rogue-signatures.json'),
    JSON.stringify(visualRows, null, 2) + '\n',
  );
console.log(
  'PASS ' +
    actors.length +
    ' live pending rogue signature resolutions; full snapshot equivalence, stable identities and material/action recipes',
);
