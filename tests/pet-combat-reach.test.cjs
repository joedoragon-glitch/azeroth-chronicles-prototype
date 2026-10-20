'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function scene(family, slot) {
  const g = new C('normal', 'paladin', () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  Object.assign(g.hero, { x: 850, y: 900 });
  g.s.mercyTime = 0;
  g.s.expeditionRank = 4;
  g.s.companionCombatTraining = 2;
  const u = g.unit('pet', 895, 900, family),
    def = g.petSkillDefinition(u, slot);
  g.s.party = [u];
  u[slot === 1 ? 'skill2Cd' : 'skill1Cd'] = 30;
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: u.x + def.range, y: u.y },
  );
  z.enemies = [e];
  g.engage(e);
  return { g, u, e, def };
}
let cases = 0;
for (const family of Object.keys(C.rules.petCompanions).filter(
  (f) => C.rules.petCompanions[f].role === 'melee',
)) {
  for (const slot of [1, 2]) {
    for (const block of [
      null,
      'range',
      'line',
      'cooldown',
      'global',
      'silence',
      'training',
      'recall',
      'wounded',
      'resting',
      'dead',
      'aim-dead',
    ]) {
      if (block === 'training' && slot === 1) continue;
      const { g, u, e, def } = scene(family, slot),
        hp = e.hp;
      if (block === 'range') e.x += 0.01;
      if (block === 'line') g.line = () => false;
      if (block === 'cooldown') u[slot === 1 ? 'skill1Cd' : 'skill2Cd'] = 1;
      if (block === 'global') u.skillGlobalCd = 1;
      if (block === 'silence')
        g.hero.silenceField = { x: u.x, y: u.y, radius: 300, zone: g.zoneId, until: g.s.time + 10 };
      if (block === 'training') g.s.companionCombatTraining = 1;
      if (block === 'recall') g.recallParty();
      if (block === 'wounded') {
        u.hp = u.maxHp * 0.2;
        e.x = u.x + 89;
      }
      if (block === 'resting') u.active = false;
      if (block === 'dead') u.hp = 0;
      if (block === 'aim-dead') e.hp = 0;
      const before = e.hp;
      g.updateParty(0);
      const started = slot === 1 ? u.skill1Cd === 8 : !!g.partyChargeState(u);
      assert.equal(
        started,
        !block,
        family + ' slot ' + slot + ' ' + (block || 'full listed reach'),
      );
      if (!block && slot === 2) {
        assert.equal(e.hp, hp, 'charge is not instant damage');
        g.advancePartyChargeClock(0.65);
        g.resolveCompanionCharges();
        assert.equal(u.skill2Cd, 12);
      }
      if (!block) assert(e.hp < hp, family + ' skill actually hits at ' + def.range);
      if (block === 'range') assert.equal(e.hp, before, 'basic attack keeps its 70-unit reach');
      cases++;
    }
  }
}
console.log(
  'PASS melee pet full skill reach and activation/cancellation gates: ' + cases + ' cases',
);
