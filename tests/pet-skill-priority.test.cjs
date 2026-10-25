'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function scene(family, count = 2) {
  const g = new C('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  const z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  Object.assign(g.hero, { x: 1380, y: 1700 });
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.companionCombatTraining = 2;
  g.s.normal[family] = g.s.true[family] = true;
  const u = g.unit('pet', 1400, 1700, family);
  g.s.party = [u];
  const enemies = Array.from({ length: count }, (_, i) =>
    g.makeEnemy(
      { species: 'goblin', name: 'Scheduling target', level: 1, hp: 100000, damage: 0, xp: 0, gold: 0 },
      { x: u.x + 80 + i * 15, y: u.y },
    ),
  );
  z.enemies = enemies;
  g.engage(enemies[0]);
  return { g, u, e: enemies[0], enemies };
}

function first(g, u, e, label) {
  assert(g.companionTrySkill(u, e), label);
  assert.equal(u.skill1Cd, 8, label + ': first cooldown starts');
  assert.equal(u.skill2Cd, 0, label + ': second clock untouched');
  assert(!g._companionCharges?.has(u.id), label + ': no charge displaced first');
}
function second(g, u, e, label) {
  assert(g.companionTrySkill(u, e), label);
  assert(g._companionCharges?.has(u.id), label + ': charged preparation begins');
  assert.equal(u.skill1Cd, 0, label + ': first timer not spent');
  assert.equal(u.skill2Cd, 0, label + ': second timer waits for release');
}

// Ordinary crowd geometry still earns the charged attack, across all 11 families
// where both attacks are in range and the first provides no urgently needed aid.
for (const family of Object.keys(C.rules.petCompanions)) {
  const { g, u, e } = scene(family);
  if (family === 'mine') {
    u.wardUntil = g.s.time + 4;
    u.wardReduction = 0.25;
  }
  if (family === 'cindermaw') {
    // Its second is single-target, unlike the other ten families.
    // An active ward means the ordinary first remains the preferred action.
    u.wardUntil = g.s.time + 4;
    u.wardReduction = 0.35;
    first(g, u, e, family + ': non-area second retains first priority');
    continue;
  }
  second(g, u, e, family + ': ordinary multi-target priority');
}

// The Lifebinder only overrides crowd damage for worthwhile, reachable healing.
{
  const { g, u, e } = scene('crypt');
  u.hp = u.maxHp * 0.6;
  first(g, u, e, 'wounded Lifebinder');
}
{
  const { g, u, e } = scene('crypt');
  g.hero.hp -= u.maxHp * 0.1;
  first(g, u, e, 'wounded eligible ally');
}
{
  const { g, u, e } = scene('crypt');
  u.hp -= u.maxHp * 0.01;
  second(g, u, e, 'one-percent wound must not displace crowd attack');
}
{
  const { g, u, e } = scene('crypt');
  g.hero.hp -= u.maxHp * 0.2;
  g.hero.x = u.x + 500;
  second(g, u, e, 'out-of-heal-range ally cannot force first');
}
{
  const { g, u, e } = scene('crypt');
  g.hero.hp -= u.maxHp * 0.2;
  const old = g.line;
  g.line = (a, b) => (b === g.hero ? false : old.call(g, a, b));
  second(g, u, e, 'unreachable ally cannot force first');
}

// Pebble Colossus first-ward safety beats multi-target damage only when needed.
{
  const { g, u, e } = scene('mine');
  first(g, u, e, 'missing Pebble ward');
}
{
  const { g, u, e } = scene('mine');
  u.wardUntil = g.s.time + 10;
  u.wardReduction = 0.6;
  second(g, u, e, 'stronger live ward not overwritten');
}
{
  const { g, u, e } = scene('mine');
  u.wardUntil = g.s.time + 0.3;
  u.wardReduction = 0.25;
  first(g, u, e, 'expiring ward renewed');
}
{
  const { g, u, e } = scene('mine');
  u.wardUntil = g.s.time + 0.3;
  u.wardReduction = 0.6;
  second(g, u, e, 'expiring stronger ward must not waste the first special');
}
{
  const { g, u, e } = scene('mine');
  e.x = u.x + 99; // First reach 90; charged reach 100.
  assert(!g.petSkillTargets(u, e, 1).length);
  second(g, u, e, 'first out of range cannot block legal charge');
}

// Cinder Cub's actual defensive ward is charged, not its ordinary first skill.
{
  const { g, u, e } = scene('cindermaw', 1);
  second(g, u, e, 'missing Cinder charged ward gets priority');
}
{
  const { g, u, e } = scene('cindermaw', 1);
  u.wardUntil = g.s.time + 8;
  u.wardReduction = 0.35;
  first(g, u, e, 'protected Cinder retains first-single-target preference');
}

// Interruptions do not spend charged cooldowns; do not let repeated retries
// indefinitely outrank an available first special in a crowd.
{
  const { g, u, e } = scene('thorn');
  second(g, u, e, 'initial crowd charge');
  assert(g.hitParty(u, u.maxHp * 0.1, 0, null, true));
  assert(g.partyChargeState(u).interrupted, 'actual charge interruption registered');
  g.updateParty(0);
  assert(!g._companionCharges?.has(u.id), 'interrupted preparation cleared');
  g.advancePartyChargeClock(0.51);
  g.s.time += 0.51;
  g.updateParty(0.51);
  assert.equal(u.skill1Cd, 8, 'ready first takes next eligible turn after interruption');
  assert.equal(u.skill2Cd, 0, 'failed charged timer remains independent');
}
{
  const { g, u, e, enemies } = scene('thorn', 3);
  second(g, u, e, 'initial target-loss charge');
  g.zone().enemies = enemies.slice(1);
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  assert.equal(u.skill2Cd, 0, 'target-loss fizzle does not spend charged cooldown');
  g.advancePartyChargeClock(0.51);
  g.s.time += 0.51;
  u.skillGlobalCd = 0;
  first(g, u, enemies[1], 'target loss gives first a turn');
}
{
  const { g, u, e } = scene('thorn');
  second(g, u, e, 'separate roster');
  assert(g.hitParty(u, u.maxHp * 0.1, 0, null, true));
  const restored = C.restore(g.snapshot());
  assert.equal(restored.s.party[0].skill1Cd, 0);
  assert.equal(restored.s.party[0].skill2Cd, 0);
  assert.equal(restored.s.party[0].skillGlobalCd, u.skillGlobalCd);
  assert(!restored._companionCharges?.size, 'transient priority and charge are not saved');
  g.enter('march');
  assert(!g.petFirstDueAfterFailedCharge(u), 'a new zone clears transient priority');
}
console.log('PASS pet first/charged scheduling: 11 families, useful heal/ward, interrupted/fizzled charge and save/zone safety');
