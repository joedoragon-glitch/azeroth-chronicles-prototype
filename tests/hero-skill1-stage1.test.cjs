'use strict';
// Area 1 focused native gameplay checks; no browser, presentation or audio dependency.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const close = (a, b) => assert(Math.abs(a - b) < 1e-7, a + ' differs from ' + b);

function arena(cls = 'paladin', count = 1) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, hp: g.hero.maxHp, order: null });
  g.s.party = [];
  g.zone().props = [];
  g.zone().buildings = [];
  const enemies = Array.from({ length: count }, (_, i) => {
    const e = g.makeEnemy(
      { species: 'goblin', name: 'Skill 1 test foe', level: 1,
        hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 585 + i * 30, y: 500 },
    );
    e.aggro = true;
    e.returning = false;
    e.hp = e.maxHp; // Native engage may refill authored scaling on initial contact.
    e.home = { x: e.x, y: e.y };
    return e;
  });
  g.zone().enemies = enemies;
  return { g, enemies };
}

for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, enemies: [e] } = arena(cls);
  assert(g.cast(1, e.id, true), cls + ' charged Skill 1');
  close(g.hero.cd[0], 3);
  close(g.hero.chargedCd[0], { paladin: 8, mage: 7, ranger: 8 }[cls]);
  assert(!g.cast(1, e.id, true), 'cannot charge again while either timer is busy');
  g.hero.cd[0] = 0;
  const oldLock = g.hero.chargedCd[0];
  assert(g.cast(1, e.id, false), 'promoted Tap returns during longer charged cooldown');
  close(g.hero.cd[0], 3);
  close(g.hero.chargedCd[0], oldLock);
  // A separate automatic combo must never change either activated timer.
  g.hero.basicCd = 0;
  const oldNormal = g.hero.cd[0];
  assert(g.castMovementBasic(), 'basic continues while both activated forms are cooling');
  assert(g.hero.basicCd > 0);
  close(g.hero.cd[0], oldNormal);
  close(g.hero.chargedCd[0], oldLock);
  assert(g.hero.skills.length === 8, 'no additional learned slot');
}

{
  const { g, enemies: [e] } = arena('paladin');
  assert(g.cast(1, e.id, true));
  const first = g.effects.filter(f => f.type === 'hit').length;
  assert(first > 0, 'first cross pulse emits native hit');
  g.s.time += R.chargedSkills.first.paladin.pulseGap + 0.01;
  g.advanceHeroSkillEffects(R.chargedSkills.first.paladin.pulseGap + 0.01);
  assert.equal(g.effects.filter(f => f.type === 'hit').length, first * 2);
  assert.equal(g._heroSkillEffects.length, 0, 'no third pulse');
}

{
  const { g, enemies } = arena('mage', 3);
  assert(g.cast(1, enemies[0].id, true));
  assert.equal(g.effects.filter(f => f.type === 'hit').length, 0, 'no instant corridor damage');
  assert.equal(g._heroSkillEffects?.[0]?.kind, 'wide-beam', 'charged corridor advances over time');
  for (let i = 0; i < 10 && g._heroSkillEffects.length; i++) {
    g.s.time += 0.1;
    g.advanceHeroSkillEffects(0.1);
  }
  const beamHits = g.effects.filter(f => f.type === 'hit');
  assert.equal(beamHits.length, enemies.length, 'beam hits each line enemy exactly once on arrival');
  assert.equal(g._heroSkillEffects?.length || 0, 0, 'single traveling beam, no extra pulses');
}

{
  const { g, enemies: [e] } = arena('ranger');
  g._tacticalRegroups = new Map([[e.id, { phase: 'escape',
    anchor: { x: e.x, y: e.y }, fleeRemaining: 2 }]]);
  assert(g.cast(1, e.id, true));
  g.s.time += 0.1;
  g.advanceHeroSkillEffects(0.1);
  assert(g.effects.some(f => f.type === 'hit'), 'hawk damages on legal contact');
  assert.equal(g.tacticalRogueRegroup(e)?.phase, 'anchored',
    'hawk cancels actual Rogue escape');
  assert(g.hawkRetreatLocked(e, 'regroup'));
  assert(!g.tacticalAutoRogue(e, g.hero),
    'Rogue may not immediately restart from new wound');
  assert.equal(g._heroSkillEffects.length, 0, 'hawk ends after impact');
}

{
  const { g, enemies: [e] } = arena('mage');
  g.hero.skills[1] = 1;
  assert(g.cast(2, e.id, true), 'existing charged Skill 2');
  close(g.hero.cd[1], 3);
  close(g.hero.chargedCd[1], 6);
  g.hero.cd[1] = 0;
  assert(g.cast(2, e.id, false), 'normal Skill 2 usable during charged recovery');
  close(g.hero.chargedCd[1], 6);
}

{
  const { g, enemies: [e] } = arena('paladin');
  g.hero.skills[2] = 1;
  assert(g.cast(3, e.id, true), 'charged Shield Bash');
  close(g.hero.cd[2], 8);
  close(g.hero.chargedCd[2], 20);
  g.hero.cd[2] = 0;
  assert(g.cast(3), 'normal Shield Stance available before charged Bash');
  assert(g.hero.shieldStance > 0);
  close(g.hero.chargedCd[2], 20);
}

{
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.hero.cd[0] = 2.6;
  g.hero.chargedCd[0] = 7;
  g.hero.basicCd = 0.4;
  const now = Campaign.validate(g.snapshot());
  close(now.hero.cd[0], 2.6);
  close(now.hero.chargedCd[0], 7);
  close(now.hero.basicCd, 0.4);
  const old = g.snapshot();
  delete old.hero.chargedCd;
  delete old.hero.basicCd;
  old.hero.cd[0] = 8;
  const migrated = Campaign.validate(old);
  close(migrated.hero.cd[0], 3);
  close(migrated.hero.chargedCd[0], 8);
  close(migrated.hero.basicCd, 8);
}

console.log('PASS stage 1 Skill 1 forms, cooldown asymmetry, cross, beam, hawk, Shield Stance and v4 timers');
