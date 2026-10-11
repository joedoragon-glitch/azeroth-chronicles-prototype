'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

// Prove the actual hitParty armor contract, not a stubbed damage resolver.
for (const cls of ['paladin', 'mage', 'ranger']) {
  const c = new Campaign('normal', cls, () => 0.5);
  c.enter('vale');
  const boss = c.bossEnemy(c.boss('mire'), 'normal', { x: 500, y: 500 });
  c.zone().enemies = [boss];
  c.s.party = [];
  c.hero.x = 555;
  c.hero.y = 500;
  c.hero.maxHp = c.hero.hp = 2000;
  c.hero.immune = 0;
  c.line = () => true;
  c.clearSegment = () => true;
  const plan = Campaign.rules.attacks.mire[0];
  const jaw = {
    ...plan, index: 0, kind: 'cone', x: 500, y: 500,
    fromX: 500, fromY: 500, angle: 0, radius: 190,
  };
  const armor = c.armor();
  const expectedLoss = Math.max(3, boss.damage * jaw.coefficient - armor * 0.35);
  c.resolveArea(boss, jaw);
  assert(boss.deathRoll, cls + ': bite captures one victim');
  assert.equal(c.hero.hp, 2000, cls + ': no extra upfront bite');
  const declaredDamage = boss.deathRoll.totalDamage;
  assert(Math.abs(declaredDamage - expectedLoss) < 1e-8);
  for (let beat = 0; beat < 3; beat++) {
    c.updateEnemies(0.5);
    assert(Math.abs(c.hero.hp - (2000 - expectedLoss * (beat + 1) / 3)) < 1e-7,
      cls + ': damage on roll beat ' + (beat + 1));
  }
  assert.equal(boss.deathRoll, null);
  assert.equal(c.hero.deathRollHeld, false);
  assert(c.hero.slow > 0);
}

// Verify that mitigation opt-in leaves the legacy four-argument hit contract alone.
{
  const c = new Campaign('normal', 'paladin', () => 0.5);
  c.hero.maxHp = c.hero.hp = 500;
  const before = c.hero.hp;
  c.hitParty(c.hero, 50);
  const ordinaryLoss = before - c.hero.hp;
  assert(Math.abs(ordinaryLoss - Math.max(3, 50 - c.armor() * 0.35)) < 1e-8);
  c.hero.hp = 500;
  c.hitParty(c.hero, ordinaryLoss / 3, 0, null, true);
  assert(Math.abs(500 - c.hero.hp - ordinaryLoss / 3) < 1e-8);
}
console.log('PASS actual armor-aware Death Roll beats and untouched normal hit contract');
