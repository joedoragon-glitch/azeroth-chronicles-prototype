'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function arena(cls = 'paladin') {
  const game = new Campaign('normal', cls, () => 0.9);
  game.zone().props = [];
  game.zone().enemies = [];
  game.s.party = [];
  Object.assign(game.hero, {
    x: 500,
    y: 500,
    skills: Array(8).fill(1),
    cd: Array(8).fill(0),
  });
  function enemy(x, y, name = 'Training target') {
    const e = game.makeEnemy(
      { species: 'goblin', name, level: 1, hp: 1000000, damage: 0, gold: 0, xp: 0 },
      { x, y },
    );
    e.hp = e.maxHp = 1000000;
    game.zone().enemies.push(e);
    // Engage before measuring HP: encounter tier normalization changes max HP.
    game.engage(e);
    return e;
  }
  return { game, enemy };
}

// Instructor permission is independent of player level and does not leak
// higher-region slots into earlier teachers, even through legacy saves.
{
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.hero.gold = 100000;
  game.s.rescued.mire = true;
  game.s.rescued.ridge = true;
  game.hero.level = 1;
  assert(!game.learn(6, 'mire'), 'Region 2 cannot teach Region 3 Skill 6');
  assert(game.learn(6, 'ridge'), 'Region 3 can teach Skill 6 without a level gate');
  assert(!game.upgrade(6, 'mire'), 'Earlier instructor cannot upgrade later skill');
  assert(game.upgrade(6, 'ridge'), 'Proper instructor upgrades Skill 6');
  assert.equal(Campaign.data.skills.find((s) => s[0] === 6)[4], 'ridge');
  const restored = Campaign.restore(game.snapshot(), () => 0.9);
  assert.equal(restored.hero.skills[5], 2, 'Skill 6 rank survives save restoration');
  assert(!restored.upgrade(6, 'mire'), 'Old teacher cannot train restored Skill 6');
}
console.log('PASS regional skill-6 teaching and historical-rank preservation');

{
  const { game, enemy } = arena();
  const foe = enemy(790, 500);
  const before = foe.hp;
  assert(game.cast(6, foe.id), 'Paladin Skill 6 activates at rush range');
  assert(game.hero.x > 600 && game.hero.x < foe.x, 'Paladin closes distance');
  assert(Math.hypot(game.hero.x - foe.x, game.hero.y - foe.y) <= 120);
  assert(foe.hp < before, 'Paladin Skill 6 hits after reaching melee range');
  assert(
    game.effects.some((e) => e.type === 'swing' && e.slot === 6 && e.dash),
    'Visible rush trail receives starting coordinates',
  );
}
{
  const { game, enemy } = arena();
  const foe = enemy(790, 500);
  game.zone().props.push({ x: 645, y: 500, r: 30 });
  const hp = foe.hp;
  assert(game.cast(6, foe.id), 'A blocked targeted rush queues a legal walk around the wall');
  assert.equal(game.hero.order?.type, 'skill-approach');
  assert.equal(game.hero.order?.id, foe.id);
  assert.equal(game.hero.x, 500, 'Blocked rush does not move hero');
  assert.equal(foe.hp, hp, 'Blocked rush cannot hit through wall');
  assert.equal(game.hero.cd[5], 0, 'Blocked rush does not consume cooldown');
  for (let i = 0; i < 400 && game.hero.cd[5] === 0; i++) {
    const before = { x: game.hero.x, y: game.hero.y };
    game.tick(0.05);
    assert(game.clearSegment(before, game.hero), 'Approach never crosses the wall');
  }
  assert(game.hero.cd[5] > 0 && foe.hp < hp, 'Rush releases only after a legal approach');
}
console.log('PASS Paladin Skill 6 dash hit, trail and wall safety');

{
  const { game, enemy } = arena('ranger');
  const near = enemy(630, 500, 'First target');
  const side = enemy(590, 660, 'Second target');
  const far = enemy(900, 500, 'Outside area');
  const protectedFromDirect = side;
  protectedFromDirect.rogueDustCoverUntil = game.s.time + 5;
  assert(game.cast(5), 'Ranger Skill 5 launches radial volley');
  assert.equal(game.s.projectiles.length, 2, 'Volley fires real arrows at both eligible foes');
  const area = game.effects.find(e => e.type === 'spell' && e.slot === 5);
  assert.equal(area.projectileVolley, true, 'cosmetic shafts are owned by real arrow flights');
  assert.equal(area.contacts.length, 0, 'no contact exists before arrows arrive');
  assert.equal(near.hp, near.maxHp, 'first target waits for the physical arrow');
  assert.equal(side.hp, side.maxHp, 'second target also waits for contact');
  for (let step = 0; step < 20; step++) game.updateProjectiles(0.04);
  assert(near.hp < near.maxHp, 'first arrow hits after traveling');
  assert(side.hp < side.maxHp, 'area-tagged arrow still strikes dust-covered target');
  assert.equal(far.hp, far.maxHp, 'Volley does not damage outside its footprint');
}
console.log('PASS Ranger Skill 5 arrow volley, AoE and range');

{
  const { game, enemy } = arena('ranger');
  const guarded = enemy(720, 500);
  guarded.family = 'citadel';
  guarded.open = 0;
  guarded.roomCaptain = true;
  guarded.captainGuard = 1;
  const rawDamage = game.power() * 10;
  assert(game.cast(7, guarded.id), 'Ranger Skill 7 fires at guarded target');
  assert.equal(game.s.projectiles[0].piercing, true, 'Skill 7 projectile marks defensive penetration');
  for (let step = 0; step < 10; step++) game.updateProjectiles(0.1);
  assert(
    Math.abs(guarded.maxHp - guarded.hp - rawDamage) < 0.001,
    'Piercing ignores both phase shield and captain guard',
  );
  guarded.hp = guarded.maxHp;
  assert(game.damage(guarded, rawDamage, 'hero'), 'Ordinary shot still hits');
  assert(guarded.maxHp - guarded.hp < rawDamage * 0.7, 'Ordinary damage retains guard and shield');
}
console.log('PASS Ranger Skill 7 defensive penetration without changing ordinary mitigation');

{
  const { game, enemy } = arena('mage');
  game.hero.hp = game.hero.maxHp - 100;
  assert(!game.cast(8), 'Skill 8 cannot heal outside an encounter');
  const foe = enemy(720, 500);
  assert(game.cast(8, foe.id), 'Skill 8 remains an offensive-combined combat move');
  assert.equal(game.hero.immune, 0);
  assert.equal(game.hero.hp, game.hero.maxHp - 100, 'Mage ultimate has no invented self-heal');
}
console.log('PASS Skill 8 target requirement remains combat-only');
