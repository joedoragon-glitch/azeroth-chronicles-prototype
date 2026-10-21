'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function scene() {
  const g = new C('normal', 'mage', () => 0.9);
  for (const k of ['props', 'npcs', 'buildings', 'enemies']) g.zone()[k] = [];
  Object.assign(g.hero, { x: 600, y: 1500, skills: Array(8).fill(1), cd: Array(8).fill(0) });
  g.hero.hp = g.hero.maxHp;
  g.s.expeditionRank = 6;
  const pet = g.unit('pet', 630, 1500, 'ridge'),
    ranger = g.unit('archer', 610, 1500);
  pet.hp = pet.maxHp / 2;
  g.s.party = [pet, ranger];
  return { g, pet, ranger };
}
for (const mode of [
  'silenced',
  'automatic',
  'cooldown',
  'dead',
  'resting',
  'absent',
  'mixed-blocked',
  'outside-ready',
]) {
  const { g, pet, ranger } = scene();
  if (['silenced', 'automatic', 'mixed-blocked', 'outside-ready'].includes(mode))
    assert(g.cast(3, undefined, true));
  if (mode === 'cooldown') ranger.healCd = 2.2;
  if (mode === 'dead') ranger.hp = 0;
  if (mode === 'resting') ranger.active = false;
  if (mode === 'absent') g.s.party = [pet];
  if (mode === 'mixed-blocked' || mode === 'outside-ready') {
    const other = g.unit('archer', 850, 1500);
    other.healCd = mode === 'mixed-blocked' ? 5 : 0;
    g.s.party.push(other);
  }
  const hp = pet.hp,
    count = g.messages.length,
    cd = ranger.healCd || 0;
  const cast = g.rangerSupport('health', mode !== 'automatic', pet);
  if (mode === 'outside-ready') {
    assert(cast);
    assert(g.hasSupportEffect(pet, 'health'));
    g.updateRangerSupport(5);
    assert(pet.hp > hp);
    assert.equal(ranger.healCd || 0, 0, 'silenced Ranger does not spend cooldown');
  } else {
    assert(!cast);
    assert.equal(pet.hp, hp);
    assert.equal(ranger.healCd || 0, cd);
    if (mode === 'automatic')
      assert.equal(g.messages.length, count, 'automatic failure stays quiet');
    else if (mode === 'silenced' || mode === 'mixed-blocked')
      assert.equal(g.messages.at(-1), 'Ranger cannot use Heal while silenced.');
    else if (mode === 'cooldown') assert.equal(g.messages.at(-1), 'Heal is cooling down · 3s.');
    else assert.equal(g.messages.at(-1), 'No active Ranger is available to use Heal.');
  }
}
console.log(
  'PASS Ranger Heal Silence/cooldown/availability feedback, mixed casters, quiet automatic failure and unchanged healing/cooldown effects',
);
