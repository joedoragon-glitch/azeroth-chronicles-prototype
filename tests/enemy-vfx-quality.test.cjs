'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../src/prototype/engine.js'),
  V = require('../src/prototype/enemy-vfx.js'),
  FX = require('../src/prototype/combat-visuals.js');
function fresh() {
  const c = new C('normal', 'paladin', () => 0.5);
  c.s.party = [];
  c.s.projectiles = [];
  c.s.hazards = [];
  c.zone().enemies = [];
  c.line = () => true;
  c.blocked = () => false;
  c.clearSegment = () => true;
  c.tacticalAutoRogue = () => false;
  Object.assign(c.hero, { x: 1500, y: 1700, hp: 100000, maxHp: 100000 });
  return c;
}
(async () => {
  const calls = [],
    scope = {
      PrototypeEnemyVfx: V,
      PrototypeRules: C.rules,
      PrototypeCombatVisuals: FX,
      PrototypeSprites: {
        definition: () => ({ displayWidth: 32, displayHeight: 32, clips: { travel: {} } }),
        drawStage(ctx, key, p, options) {
          calls.push({ key, point: p, ...options });
          return true;
        },
      },
    };
  vm.createContext(scope);
  vm.runInContext(
    fs.readFileSync(require.resolve('../src/prototype/enemy-vfx-art.js'), 'utf8'),
    scope,
  );
  const A = scope.PrototypeEnemyVfxArt,
    ctx = createCanvas(900, 600).getContext('2d'),
    screen = (p) => ({ x: 450 + (p.x - 1500) * 0.76, y: 300 + (p.y - 1700) * 0.27 }),
    asset = { type: 'sprite', spriteKey: 'vfx:audit', clip: 'travel' },
    manifest = {
      version: 1,
      effects: {
        'night/stalker/pounce': { stages: { travel: asset } },
        'projectile/goblin/stone': { stages: { travel: asset } },
        'boss/crypt/3': { stages: { linger: asset } },
      },
    };
  assert(A.installManifest(manifest));
  // Short pounces and faster ordinary ranged shots must start on the first clip frame.
  const c = fresh(),
    e = c.makeEnemy(
      { species: 'stalker', name: 'Stalker', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
  c.zone().enemies = [e];
  c.startNightSkill(e, c.hero);
  c.resolveAttack(e);
  e.telegraph = null;
  assert.equal(e.motion.life, 2);
  A.ground(ctx, screen, c, []);
  assert.equal(calls.at(-1).elapsedMs, 0);
  c.advanceMotion(e, 0.05);
  A.ground(ctx, screen, c, []);
  assert(Math.abs(calls.at(-1).elapsedMs - 50) < 1e-8);
  const ranged = fresh(),
    goblin = ranged.makeEnemy(
      { species: 'goblin', name: 'Goblin', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
  Object.assign(goblin, {
    ranged: true,
    projectileStyle: 'stone',
    aggro: true,
    rangedAim: { x: 1500, y: 1700, timer: 0 },
  });
  ranged.zone().enemies = [goblin];
  ranged.updateEnemies(0.001);
  const shot = ranged.s.projectiles[0];
  assert(shot);
  assert.equal(shot.life, 2.5 / C.rules.rangedEnemyCombat.projectileMultiplier);
  A.projectile(ctx, screen, shot, ranged);
  assert.equal(calls.at(-1).elapsedMs, 0);
  ranged.updateProjectiles(0.05);
  A.projectile(ctx, screen, shot, ranged);
  assert(Math.abs(calls.at(-1).elapsedMs - 50) < 1e-8);
  const snapshot = JSON.stringify(ranged.snapshot());
  A.projectile(ctx, screen, shot, ranged);
  assert.equal(JSON.stringify(ranged.snapshot()), snapshot);
  // Failed travel is not a new encounter; decoration should continue.
  const epoch = c.enemyVfxEpoch();
  assert.equal(c.enter('not-a-zone'), false);
  assert.equal(c.enemyVfxEpoch(), epoch);
  // A fatal persistent area can leave an existing mechanical hazard after instant revival.
  // Its old resolution cannot bind visual/audio metadata into the revived encounter.
  const runFatal = (enabled) => {
    const game = fresh();
    game.enemyVfxEnabled = enabled;
    game.s.refuge = 'vale';
    game.s.refugeSite = { zone: 'vale', id: 'rest' };
    Object.assign(game.hero, { x: 1450, y: 1700, hp: 1 });
    const enemy = game.bossEnemy(game.boss('crypt'), 'normal', { x: 1400, y: 1700 });
    enemy.damage = 10000;
    game.zone().enemies = [enemy];
    game.startAttack(enemy, game.hero, 3);
    game.resolveAttack(enemy);
    assert.equal(game.s.statistics.deaths, 1);
    assert(game.s.hazards.length);
    return game;
  };
  const on = runFatal(true),
    off = runFatal(false);
  assert.deepEqual(on.snapshot(), off.snapshot());
  assert(on.s.hazards.every((h) => !on.enemyVfxHazard(h)));
  // Even a retained external reference to an earlier hazard cannot draw after reentry.
  const lingering = fresh(),
    crypt = lingering.bossEnemy(lingering.boss('crypt'), 'normal', { x: 1400, y: 1700 });
  lingering.zone().enemies = [crypt];
  lingering.startAttack(crypt, lingering.hero, 3);
  lingering.resolveAttack(crypt);
  crypt.telegraph = null;
  const hazard = lingering.s.hazards[0];
  assert(lingering.enemyVfxHazard(hazard));
  lingering.enter(lingering.zoneId);
  lingering.s.hazards = [hazard];
  lingering.zone().enemies = [crypt];
  const oldCalls = calls.length;
  A.ground(ctx, screen, lingering, []);
  assert.equal(calls.length, oldCalls);
  // Basic hits describe teeth, claws, weapons and blunt force, rather than dash or bombard skills.
  for (const id of Object.keys(C.rules.roomCaptains))
    assert(
      !['rush', 'bombard', 'fan'].includes(A.recipe({ id: 'captain/' + id + '/basic' }).action),
    );
  assert.equal(A.recipe({ id: 'enemy/orc/basic' }).action, 'cleave');
  assert.equal(A.recipe({ id: 'enemy/wolf/basic' }).action, 'bite');
  assert.equal(A.recipe({ id: 'enemy/ogre/basic' }).action, 'slam');
  assert.equal(A.recipe({ id: 'boss/ridge/0' }).material, 'steel', 'hammer is not a fur claw');
  // One thousand offscreen casts must not rasterize or request invisible stage assets.
  const crowd = fresh();
  crowd.zone().enemies = Array.from({ length: 1000 }, (_, j) => ({
    id: 'far-' + j,
    hp: 100,
    type: 'boss',
    family: 'thorn',
    x: 100000 + j,
    y: 100000,
    telegraph: { ...C.rules.attacks.thorn[1], index: 1, timer: 0.5, total: 1 },
  }));
  let strokes = 0;
  const stroke = ctx.stroke.bind(ctx);
  ctx.stroke = () => {
    strokes++;
    stroke();
  };
  A.actors(ctx, screen, crowd, []);
  assert.equal(strokes, 0);
  ctx.stroke = stroke;
  A.installManifest({ version: 1, effects: { 'boss/thorn/1': { stages: { windup: asset } } } });
  calls.length = 0;
  A.actors(ctx, screen, crowd, []);
  assert.equal(calls.length, 0, 'offscreen cast must not request asset');
  // A later explicit install wins over an older pending fetch; failed reload clears stale bindings.
  let complete;
  scope.fetch = () =>
    new Promise((r) => {
      complete = r;
    });
  const pending = A.loadManifest();
  A.installManifest({ version: 1, effects: {} });
  complete({ ok: true, json: async () => manifest });
  assert.equal(await pending, false);
  calls.length = 0;
  A.projectile(ctx, screen, shot, ranged);
  assert.equal(calls.length, 0);
  for (const fail of [
    async () => ({ ok: false }),
    async () => {
      throw Error('offline');
    },
  ]) {
    A.installManifest(manifest);
    scope.fetch = fail;
    assert.equal(await A.loadManifest(), false);
    calls.length = 0;
    A.projectile(ctx, screen, shot, ranged);
    assert.equal(calls.length, 0);
  }
  console.log(
    'PASS VFX quality: actual travel clocks, failed travel, fatal persistent-area equivalence, stale hazards, physical basics, offscreen casts and manifest races/recovery',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
