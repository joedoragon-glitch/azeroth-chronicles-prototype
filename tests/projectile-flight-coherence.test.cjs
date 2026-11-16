'use strict';
// #892: source-authoritative velocity, time-independent reach, saved v4
// speed-field compatibility, and independent global tuning controls.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
const close = (a, b, why) => assert(Math.abs(a - b) < 1e-7, why + ': ' + a + ' vs ' + b);
const room = () => {
  const g = new C('normal', 'paladin', () => 0.9);
  g.enter('crypt');
  g.zone().enemies = [];
  g.zone().props = [];
  g.s.party = [];
  Object.assign(g.hero, { x: 500, y: 500, hp: 100000, maxHp: 100000 });
  return g;
};
const ranged = (g, species, staleSpeed) => {
  const e = g.makeEnemy(
    { species, name: species + ' test', level: 4, hp: 1000, damage: 5, gold: 0, xp: 0 },
    { x: 700, y: 500 },
  );
  g.configureEnemy(e, 2);
  e.aggro = true;
  e.ranged = true;
  if (staleSpeed !== undefined) e.shotSpeed = staleSpeed;
  e.rangedAim = { x: g.hero.x, y: g.hero.y, timer: 0 };
  g.zone().enemies.push(e);
  g.updateEnemies(0.01);
  return { e, shot: g.s.projectiles.find((p) => p.sourceId === e.id) };
};

assert.equal(R.projectileFlight.globalSpeedScale, 1);
assert.equal(R.projectileFlight.hostileSpeedScale, 1);
assert.equal(R.rangedEnemyCombat.projectileMultiplier, undefined);
assert.equal(R.enemyProjectileMultiplier, undefined);
assert.equal(R.balance.goblinSlingerProjectileSpeedMultiplier, undefined);

for (const species of [
  'goblin', 'skeleton', 'reedbeast', 'mireling', 'ogre',
  'orc', 'ashbeast', 'archer', 'crownguard', 'wraith',
]) {
  const g = room();
  const { shot } = ranged(g, species, 17); // Old v4 persisted fields are not authoritative.
  assert(shot, species + ' has a genuine hostile physical shot');
  const expected = R.rangedProfiles[species]?.shotSpeed ??
    (species === 'wraith'
      ? R.projectileFlight.ordinaryDefault.spectral
      : R.projectileFlight.ordinaryDefault.arrow);
  assert.equal(shot.speed, expected, species + ' ignores stale shotSpeed');
  close(shot.speed * shot.life, R.projectileFlight.ordinaryDistance[species], species + ' original reach');
}
assert.equal(R.rangedProfiles.goblin.shotSpeed, 816, 'approved fast Goblin stone remains effective');
assert(R.rangedProfiles.skeleton.shotSpeed >= R.rangedProfiles.goblin.shotSpeed,
  'ordinary bow is not artificially slower than the corrected sling');

{
  const g = room();
  const { e } = ranged(g, 'skeleton', 40);
  g.s.projectiles = [];
  const restored = C.restore(g.snapshot());
  const e2 = restored.zone().enemies.find((u) => u.id === e.id);
  assert(e2, 'saved ranged mob remains present');
  e2.rangedAim = { x: restored.hero.x, y: restored.hero.y, timer: 0 };
  e2.aggro = true;
  restored.updateEnemies(0.01);
  const shot = restored.s.projectiles.find((p) => p.sourceId === e.id);
  assert(shot, 'restored save can still launch');
  assert.equal(shot.speed, R.rangedProfiles.skeleton.shotSpeed,
    'restored enemy uses current authored bow flight');
}

{
  const g = room();
  const boss = g.bossEnemy(g.boss('crypt'), 'normal', { x: 700, y: 500 });
  g.zone().enemies = [boss];
  g.startAttack(boss, g.hero, 1);
  const warning = boss.telegraph.total;
  g.resolveAttack(boss);
  const shots = g.s.projectiles;
  assert.equal(shots.length, 3, 'bone volley is three actual physical missiles');
  for (const p of shots) {
    assert.equal(p.speed, R.projectileFlight.boss.cryptBoneVolley);
    close(p.speed * p.life, 260 * 2.5 * R.balance.enemySpecialReachMultiplier,
      'bone volley preserved maximum flight distance');
  }
  assert.equal(warning, 1.2, 'Lifebinder retains original early-game telegraph');
  close(shots[1].delay, R.attacks.crypt[1].normalShotInterval,
    'Normal inter-shot stagger unchanged');
}

{
  const g = room();
  const e = g.bossEnemy(g.boss('ridge'), 'normal', { x: 700, y: 500 });
  g.zone().enemies = [e];
  e.telegraph = {
    ...R.attacks.ridge[1], index: 1, cargo: true, kind: 'line',
    angle: Math.PI, x: 500, y: 500, fromX: e.x, fromY: e.y,
  };
  g.resolveAttack(e);
  const p = g.s.projectiles.find((p) => p.style === 'cargo');
  assert(p, 'Ridge Tyrant retains real Rolling Cargo');
  assert.equal(p.speed, R.projectileFlight.boss.ridgeCargo);
  close(p.speed * p.life, 520, 'Rolling Cargo preserves original travel budget');
}

{
  const g = room();
  const p = {
    id: 'projectile-scalar-test', source: 'enemy', x: 510, y: 550,
    dx: 1, dy: 0, speed: 100, life: 1, damage: 0, style: 'stone',
  };
  g.s.projectiles = [p];
  try {
    R.projectileFlight.globalSpeedScale = 2;
    R.projectileFlight.hostileSpeedScale = 1.5;
    g.updateProjectiles(0.1);
    close(p.x, 540, 'tuning controls compose to 3x physical velocity');
    close(p.life, 0.7, 'same flight-clock consumption preserves maximum range');
  } finally {
    R.projectileFlight.globalSpeedScale = 1;
    R.projectileFlight.hostileSpeedScale = 1;
  }
}

// Post-#908 integration: verify native ally/pet special launches, TRUE
// Lifebinder pacing, real fortified hostile velocities, and dt-independent
// flight reach without changing any authored attack or saved data.
{
  const g = room();
  const boss = g.bossEnemy(g.boss('crypt'), 'true', { x: 700, y: 500 });
  g.zone().enemies = [boss];
  g.startAttack(boss, g.hero, 1);
  const warning = boss.telegraph.total;
  g.resolveAttack(boss);
  const shots = g.s.projectiles;
  assert.equal(shots.length, 3, 'TRUE Lifebinder retains three physical bone shots');
  for (const p of shots) {
    assert.equal(p.speed, R.projectileFlight.boss.cryptBoneVolley);
    close(p.speed * p.life, 260 * 2.5 * R.balance.enemySpecialReachMultiplier,
      'TRUE Bone Volley preserves the same travel distance');
  }
  assert.equal(warning, 1.2, 'TRUE form does not silently shorten the original warning');
  close(shots[1].delay, R.attacks.crypt[1].trueShotInterval,
    'TRUE inter-shot delay remains independently authored');
}
{
  const g = room();
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Archer training target', level: 4, hp: 10000,
      damage: 0, gold: 0, xp: 0 },
    { x: 780, y: 500 },
  );
  const archer = g.unit('archer', 600, 500);
  g.s.party = [archer];
  g.zone().enemies = [e];
  archer.skill1Cd = 0;
  assert(g.companionUseFirstSkill(archer, e),
    'actual recruited Archer can release Triple Shot');
  const shafts = g.s.projectiles.filter((p) => p.source === archer.id);
  assert.equal(shafts.length, 3);
  for (const p of shafts) {
    assert.equal(p.speed, R.projectileFlight.companion.archerTriple);
    close(p.speed * p.life, 520 * R.balance.friendlyProjectiles.lifeSeconds,
      'Archer Triple Shot keeps its former maximum travel');
  }
  close(shafts[1].delay, 0.08, 'second arrow remains staggered');
  close(shafts[2].delay, 0.16, 'third arrow remains staggered');
  assert(shafts[1].companionDelayedLaunch && shafts[2].companionDelayedLaunch,
    'late shafts launch from the living Archer, not their queued origin');
}
for (const family of ['crypt', 'archive']) {
  const g = room();
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Pet training target', level: 4, hp: 10000,
      damage: 0, gold: 0, xp: 0 },
    { x: 760, y: 500 },
  );
  const pet = g.unit('pet', 600, 500, family);
  g.s.party = [pet];
  g.zone().enemies = [e];
  assert.equal(g.petDefinition(pet).role, 'ranged');
  pet.cd = 0;
  assert(g.petDefensiveCounter(pet, e), family + ' ranged defensive basic launches');
  const basic = g.s.projectiles.find((p) => p.source === pet.id);
  assert(basic, family + ' genuine pet basic collider exists');
  assert.equal(basic.speed, R.projectileFlight.companion.petBasic[family]);
  close(basic.speed * basic.life, 450 * R.balance.friendlyProjectiles.lifeSeconds,
    family + ' basic retains its historical reach');
  g.s.projectiles = [];
  pet.skill1Cd = 0;
  assert(g.usePetSkill(pet, e, 1), family + ' targeted first skill launches');
  const skill = g.s.projectiles.find((p) => p.source === pet.id);
  assert(skill && skill.petSkillSlot === 1,
    family + ' targeted skill is a physical collider');
  assert.equal(skill.speed, R.projectileFlight.companion.petSkill[family]);
  close(skill.speed * skill.life,
    R.balance.friendlyProjectiles.skillSpeed * R.balance.friendlyProjectiles.lifeSeconds,
    family + ' skill retains historical reach');
}
for (const species of ['goblin', 'skeleton']) {
  // Reuse the native Frontier garrison site and its real stockade geometry.
  const g = new C('developer', 'paladin', () => 0.9);
  g.s.zone = 'frontier';
  g.zone();
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.clock = 120;
  Object.assign(g.hero, { x: 3340, y: 950, hp: 100000, maxHp: 100000 });
  const e = g.makeEnemy(
    { species, name: species + ' garrison shooter', level: 10, hp: 10000,
      damage: 5, gold: 0, xp: 0 },
    { x: 3000, y: 950 },
  );
  g.configureEnemy(e, 2);
  e.ranged = true;
  e.aggro = true;
  e.cd = 0;
  e.rangedAim = { x: g.hero.x, y: g.hero.y, timer: 0 };
  g.zone().enemies = [e];
  assert(g.enemyFort(e), species + ' is really in the fortified footprint');
  g.updateEnemies(0.01);
  const p = g.s.projectiles.find((p) => p.sourceId === e.id);
  assert(p?.fortId, species + ' launches an actual fortified projectile');
  close(p.speed,
    R.rangedProfiles[species].shotSpeed * R.balance.fortifications.projectileSpeedMultiplier,
    species + ' uses only the positional 1.3x flight bonus');
  close(p.speed * p.life, 340,
    species + ' fortified arc stops at its actual aimed landing point');
}
for (const dt of [1 / 60, 1 / 30, 0.1]) {
  const g = room();
  const p = {
    id: 'flight-step-' + dt, source: 'enemy', fortChecked: true,
    x: 510, y: 550, dx: 1, dy: 0,
    speed: 300, life: 0.1, damage: 0, style: 'arrow',
  };
  g.s.projectiles = [p];
  const hp = g.hero.hp;
  for (let i = 0; i < 20 && g.s.projectiles.length; i++)
    g.updateProjectiles(dt);
  close(p.x, 540, 'hostile projectile maintains its 30-unit missed-shot reach at dt=' + dt);
  assert.equal(g.s.projectiles.length, 0, 'expired shot is retired');
  assert.equal(g.hero.hp, hp, 'a physically missed shot cannot damage the hero');
}

console.log('PASS #892 authored missile speeds, legacy v4 launches, independent reach, boss identities and global dials');
