'use strict';
const assert = require('node:assert/strict');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const C = require('../src/prototype/engine');
function scene() {
  const g = new C('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  Object.assign(g.hero, { x: 1400, y: 1700, gold: 10000 });
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.normal.crypt = g.s.true.crypt = true;
  const z = g.zone();
  z.props = [];
  z.npcs = [];
  z.buildings = [];
  z.enemies = [];
  const u = g.unit('pet', 1400, 1700, 'crypt');
  g.s.party = [u];
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Pet activation fixture',
      level: 1,
      hp: 100000,
      damage: 0,
      gold: 0,
      xp: 0,
    },
    { x: 1630, y: 1700 },
  );
  z.enemies = [e];
  g.engage(e);
  return { g, u, e };
}
function fly(g) {
  for (let i = 0; i < 65; i++) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
}
for (const dodge of [false, true]) {
  const { g, u, e } = scene();
  u.hp = u.maxHp * 0.5;
  assert(!g.companionSecondSkillUnlocked());
  g.updatePetCombat(u, e, [u], 0.01);
  assert.equal(u.skill1Cd, 8, 'untrained first activates through actual autonomous pet decision');
  assert.equal(u.skill2Cd, 0);
  assert.equal(u.hp, u.maxHp * 0.5, 'self heal waits for contact');
  const hp = e.hp;
  if (dodge) e.y += 180;
  fly(g);
  assert.equal(e.hp < hp, !dodge, 'ranged pet skill is dodgeable');
  assert.equal(u.hp > u.maxHp * 0.5, !dodge, 'miss gives no self heal');
  if (!dodge)
    assert(
      Math.abs(u.hp - u.maxHp * 0.6) < 1e-8,
      'successful Stay Alive heals exactly 10% maximum HP',
    );
}
{
  const { g, u, e } = scene();
  g.updatePetCombat(u, e, [u], 0.01);
  assert.equal(u.skill1Cd, 8, 'full HP does not prevent first skill activation');
}
for (const block of ['range', 'line', 'cooldown', 'global', 'silence', 'rest', 'dead', 'recall']) {
  const { g, u, e } = scene();
  if (block === 'range') e.x = u.x + 800;
  if (block === 'line') g.line = () => false;
  if (block === 'cooldown') u.skill1Cd = 5;
  if (block === 'global') u.skillGlobalCd = 1;
  if (block === 'silence')
    g.hero.silenceField = { x: u.x, y: u.y, radius: 300, zone: g.zoneId, until: g.s.time + 10 };
  if (block === 'rest') u.active = false;
  if (block === 'dead') u.hp = 0;
  if (block === 'recall') g.s.recallActive = true;
  g.updateParty(0.01);
  assert(!g.s.projectiles.some((p) => p.petSkillSlot), block + ' prevents automatic first skill');
}
{
  const { g, u, e } = scene();
  assert(!g.companionUseSecondSkill(u, e), 'second requires training');
  g.s.rescued.thorn = true;
  assert(g.learn(2, 'thorn'), 'Mira teaches hero Skill 2');
  assert(g.companionSecondSkillUnlocked(), 'learning Skill 2 unlocks pets too');
  assert(g.companionUseSecondSkill(u, e));
  const hp = e.hp;
  g.advancePartyChargeClock(0.3);
  g.resolveCompanionCharges();
  assert.equal(e.hp, hp);
  g.advancePartyChargeClock(0.35);
  g.resolveCompanionCharges();
  assert(e.hp < hp && e.slow > 0, 'Algor Mortis completes real charged damage and Slow');
  assert.equal(u.skill2Cd, 12);
}
console.log(
  'PASS Lifebinder automatic untrained first, full/wounded HP, contact healing, dodge, activation gates and actual Mira training/charged second',
);
