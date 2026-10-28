'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function arena(cls, distance, allies = true) {
  const g = new C('normal', cls, () => 0.9);
  Object.assign(g.hero, { x: 1400, y: 1700, order: null });
  g.hero.skills.fill(1);
  g.hero.cd.fill(0);
  g.s.mercyTime = 0;
  g.s.time = 30;
  const z = g.zone();
  z.props = [];
  z.buildings = [];
  z.npcs = [];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Attack passage', level: 5, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1400 + distance, y: 1700 },
  );
  z.enemies = [e];
  g.engage(e);
  // Start at true maximum HP: this scenario tests outgoing hits, not passive
  // regeneration from a fixture-created 100,000/124,910 HP deficit.
  e.hp = e.maxHp;
  g.s.party = allies
    ? [
        g.unit('soldier', 1432, 1700),
        g.unit('archer', 1400 + distance * 0.65, 1700),
        g.unit('pet', e.x, e.y, 'crypt'),
      ]
    : [];
  return { g, e };
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = arena(cls, cls === 'paladin' ? 65 : 250);
  assert(g.move(g.hero, { x: 1430, y: 1700 }, 200, 0.15),
    cls + ': hero may pass through companions even while fighting');
  assert.equal(g.hero.x, 1430, cls + ': no actor body barrier');
  assert(g.line(g.hero, e), cls + ': companion does not block skill sight');
  assert(g.clearSegment(g.hero, e, 0), cls + ': companion does not block shot flight');
  assert.equal(
    g.cycleHeroTarget().id,
    e.id,
    cls + ': target acquisition ignores overlapping friendly body',
  );
  cases++;
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const attacks =
    cls === 'paladin'
      ? [
          [1, false],
          [1, true],
          [4, false],
          [4, true],
        ]
      : [
          [1, false],
          [1, true],
          [2, false],
          [cls === 'mage' ? 4 : 7, true],
          [6, false],
          [6, true],
        ];
  for (const [slot, charged] of attacks) {
    const results = [];
    for (const allies of [false, true]) {
      const { g, e } = arena(cls, cls === 'paladin' ? 65 : 250, allies),
        hp = e.hp;
      let landedDamage = 0, damageCalls = 0;
      const originalDamage = g.damage;
      g.damage = function(target, ...params) {
        const before = target?.hp;
        const result = originalDamage.call(this, target, ...params);
        if (target === e && result && before > e.hp) {
          damageCalls++;
          landedDamage += before - e.hp;
        }
        return result;
      };
      assert(g.cast(slot, e.id, charged), cls + ' ' + slot + ' ' + charged + ' can release');
      for (let i = 0; i < 70; i++) {
        g.s.time += 0.05;
        g.updateProjectiles(0.05);
      }
      if (!(e.hp < hp)) console.error('ROLLBACK-DIAGNOSTIC ally miss',
        JSON.stringify({cls, slot, charged, allies, hp, finalHp:e.hp,
          hero:{x:g.hero.x,y:g.hero.y}, enemy:{x:e.x,y:e.y,neutral:e.neutral,
            returning:e.returning, immune:e.immune},
          line:g.line(g.hero,e), directTargetable:g.tacticalDirectTargetable(e),
          pending:g.s.projectiles.map(p=>({x:p.x,y:p.y,target:p.target,life:p.life,
            source:p.source,style:p.style})),
          events:g.events?.slice(-10)}));
      assert(landedDamage > 0, cls + ' ' + slot + ' ' + charged + ' lands through allies, actual damage receipts='+damageCalls);
      results.push(landedDamage);
    }
    assert.equal(
      results[0],
      results[1],
      'allies neither absorb nor weaken ' + cls + ' ' + slot + ' ' + charged,
    );
    cases++;
  }
}
console.log(
  'PASS ' +
    cases +
    ' ally attack-passage cases: combat-body passage, targeting/line/shot passage and actual class basic/charged/skill hits',
);
