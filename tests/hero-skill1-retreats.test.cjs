'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function arena(family = null, form = 'normal') {
  const g = new C('normal', 'ranger', () => 0.9);
  if (family === 'abyss') g.enter('abyss');
  completeFieldOpening(g);
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.s.party = [];
  g.s.mercyTime = 0;
  const e = family
    ? g.bossEnemy(g.boss(family), form, { x: 600, y: 500 })
    : g.makeEnemy(
        {
          species: 'skeleton',
          name: 'Retreat test',
          level: 1,
          hp: 10000,
          damage: 0,
          gold: 0,
          xp: 0,
        },
        { x: 600, y: 500 },
      );
  if (!family) e.ranged = true;
  g.zone().enemies = [e];
  assert(g.damage(e, 1, 'hero'), 'fixture native hero engagement');
  e.hp = e.maxHp = 10000;
  return { g, e };
}
function impact(g, e) {
  const before = e.hp;
  assert(g.cast(1, e.id, true));
  for (let i = 0; i < 8 && g._heroSkillEffects.length; i++) {
    g.s.time += 0.025;
    g.advanceHeroSkillEffects(0.025);
  }
  assert(e.hp < before, `legal hawk contact deals damage: ${e.family || e.species} ${JSON.stringify(g.effects.slice(-3))}`);
}
for (const family of [null, 'thorn', 'abyss']) {
  const { g, e } = arena(family);
  g._tacticalRegroups = new Map([
    [e.id, { phase: 'escape', anchor: { x: e.x, y: e.y }, fleeRemaining: 2 }],
  ]);
  impact(g, e);
  assert.equal(g.tacticalRogueRegroup(e).phase, 'anchored');
  assert(g.hawkRetreatLocked(e, 'regroup'));
  assert(!g.hawkRetreatLocked(e, 'backpedal'), 'only the interrupted family is suppressed');
  g.s.time += 4.01;
  assert(!g.hawkRetreatLocked(e, 'regroup'), 'suppression expires');
}
for (const family of [null, 'thorn', 'abyss']) {
  const { g, e } = arena(family);
  if (!family) e.ranged = true;
  e.rangedAim = { withdrawal: true, timer: 1, x: g.hero.x, y: g.hero.y };
  const warning = e.rangedAim;
  impact(g, e);
  assert(g.hawkRetreatLocked(e, 'backpedal'));
  assert.equal(e.rangedAim, warning, 'committed ranged warning remains');
  assert.equal(warning.timer, 1, 'warning timing is untouched');
  assert.equal(warning.withdrawal, false);
  assert(!g.enemyBackpedal(e, g.hero, 0.1, 1800));
  g.s.time += 4.01;
  assert(!g.hawkRetreatLocked(e, 'backpedal'), 'same retreat lock expires');
  if (!family) assert(g.enemyBackpedal(e, g.hero, 0.1, 1800), 'native ranged retreat resumes');
}
{
  const { g, e } = arena('thorn');
  const a = (e.telegraph = { rogueMove: true, style: 'withdraw', timer: 1, x: 550, y: 500 });
  impact(g, e);
  assert(g.hawkRetreatLocked(e, 'withdraw'));
  assert.equal(e.telegraph, a, 'hawk never discards the committed attack');
  assert.equal(a.timer, 1);
}
// Safe lifecycle returns and offensive/healing flights are distinct from
// optional tactical withdrawals, including TRUE-form boss actors.
for (const form of ['normal', 'true']) {
  for (const kind of ['returning', 'thornIntro', 'offensive', 'goAround', 'healing']) {
    const { g, e } = arena('abyss', form);
    if (kind === 'returning') e.returning = 1;
    if (kind === 'thornIntro') {
      e.thornIntroRetreat = 0;
      e.aggro = false;
    }
    if (kind === 'offensive')
      e.motion = { aerial: 'high-yo-yo', life: 2, target: { x: 700, y: 500 } };
    if (kind === 'goAround')
      e.motion = { aerial: 'go-around', life: 2, healFraction: 0.1, target: { x: 700, y: 500 } };
    if (kind === 'healing') e.telegraph = { bossHeal: true, timer: 1 };
    const motion = e.motion,
      warning = e.telegraph;
    assert.equal(g.hawkRetreatKind(e), null, kind + ' is not optional tactical withdrawal');
    assert(!g.hawkInterruptRetreat(e, 'backpedal', 4));
    assert.equal(e.motion, motion);
    assert.equal(e.telegraph, warning);
  }
}
console.log(
  'PASS hawk optional mob/boss retreat interruption, family-only expiry, committed warnings and protected return/flight/heal exemptions',
);
