'use strict';
// Deferred combined-source cases. Do not execute before the shared validation gate.
const assert = require('node:assert/strict');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const Campaign = require('../src/prototype/engine.js');
const Art = require('../src/prototype/hero-presentation.js');
const Visuals = require('../src/prototype/combat-visuals.js');
const R = Campaign.rules;
const near = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function arena(cls = 'mage') {
  const g = new Campaign('normal', cls, () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 500, order: null, slow: 0, immune: 0 });
  g.hero.skills = Array(8).fill(1);
  g.hero.cd = Array(8).fill(0);
  g.hero.hp = g.hero.maxHp / 2;
  const z = g.zone();
  z.props = [];
  z.buildings = [];
  z.npcs = [];
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Combined target',
      level: 1,
      hp: 100000,
      damage: 20,
      gold: 0,
      xp: 0,
    },
    { x: 570, y: 500 },
  );
  z.enemies = [e];
  const u = g.unit('soldier', 520, 500);
  g.s.party = [u];
  g.s.companionCombatTraining = 2;
  return { g, e, u };
}
// The domain API intentionally permits direct charged resolution: shell timing
// has its own keyboard/touch coverage. Here verify every resolver emits truthful
// presentation and retains the common cooldown/rank contract.
for (const skillRank of [1, 4, 8])
  for (const cls of ['paladin', 'mage', 'ranger']) {
    for (let slot = 1; slot <= 8; slot++) {
      for (const charged of [false, true]) {
        const { g, e } = arena(cls);
        g.hero.skills.fill(skillRank);
        if (cls === 'mage' && slot === 3 && !charged)
          e.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
        const rank = g.hero.skills[slot - 1];
        assert(g.cast(slot, e.id, charged), `${cls} ${slot} ${charged} admission`);
        const event = g.effects.find((f) => f.type === 'heroSkillCast');
        assert(event && event.slot === slot && event.charged === charged);
        assert.equal(g.hero.skills[slot - 1], rank);
        const cooldown =
          cls === 'paladin' && slot === 3 && !charged ? 0 : g.skillCooldown(slot, false);
        near(g.hero.cd[slot - 1], cooldown);
        near(g.hero.chargedCd[slot - 1], charged ? g.skillCooldown(slot, true) : 0);
        const fx = Visuals.queue(g.effects, g, []);
        assert(fx.some((f) => f.type === 'heroSkill' && f.slot === slot));
        assert(Art.profile(event), 'every form has its own material/motif mapping');
        const audio = new (require('../src/prototype/audio.js'))(),
          sounds = [];
        audio.ctx = { currentTime: 1, state: 'running' };
        audio.playSoundEvent = () => false;
        for (const method of [
          'tone',
          'sweep',
          'noiseBurst',
          'bowRelease',
          'rapidBow',
          'steelImpact',
        ])
          audio[method] = (...args) => sounds.push([method, ...args]);
        const observed = [...g.effects];
        for (let step = 0; step < 12; step++) {
          g.effects = [];
          g.updateProjectiles(0.05);
          observed.push(...g.effects);
        }
        for (const receipt of observed) {
          audio.ctx.currentTime += 0.1;
          audio.effect(receipt);
        }
        assert(
          sounds.length > 0,
          `${cls} ${slot} ${charged} rank ${skillRank} actual cast/flight/contact audio`,
        );
      }
    }
  }
{
  const { g, e } = arena('paladin'),
    h = g.hero;
  h.hp = h.maxHp = 100;
  h.shieldStance = 8;
  h.shieldRank = 8;
  h.wardUntil = g.s.time + 5;
  h.wardReduction = 0.3;
  assert(g.beginPartyCharge(h, 4));
  g.hitParty(h, 20, 0, null, true);
  near(g.partyChargeState(h).lostHp, 5.4);
  assert(!g.partyChargeState(h).interrupted, 'strongest single defense precedes charge accounting');
  g.hitParty(h, 6, 0, null, true);
  assert(g.partyChargeState(h).interrupted);
  assert(!g.cast(4, e.id, true), 'domain release cannot bypass charged recovery');
  near(h.cd[3], 0);
}
{
  const { g } = arena('paladin');
  assert(g.cast(3));
  g.hero.slow = 1;
  assert(g.cast(3), 'lowering the shield starts its shared cooldown');
  const start = g.hero.cd[2];
  g.zone().enemies = [];
  g.s.party = [];
  g.tick(0.1);
  near(g.hero.cd[2], start - 0.065);
  assert.equal(g.hero.shieldStance, 0);
}
{
  const { g, e, u } = arena();
  assert(g.companionUseSecondSkill(u, e));
  assert(g.cast(3, undefined, true), 'silence is a real bilateral special restriction');
  const before = e.hp;
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  assert.equal(e.hp, before);
  assert.equal(u.skill2Cd, 0, 'silenced preparation does not spend the full cooldown');
  assert(!g.partyChargeState(u));
  assert(g.castMovementBasic(), 'automatic basics remain possible during Silence');
  assert(!g.cast(1, e.id), 'promoted activated Tap still obeys Silence');
  e.ranged = true;
  e.aggro = true;
  e.pack = 'healing';
  const ally = g.makeEnemy(
    { species: 'goblin', name: 'Wounded ally', level: 1, hp: 1000, damage: 10, xp: 0, gold: 0 },
    { x: 590, y: 500 },
  );
  Object.assign(ally, { hp: 100, aggro: true, pack: 'healing' });
  g.zone().enemies.push(ally);
  assert(g.enemyHealProfile(e));
  assert(!g.enemySupportHeal(e), 'new enemy support specials honor Silence');
  g.hero.silenceField.until = g.s.time;
  assert(g.enemySupportHeal(e), 'healing can start after Silence expires');
}
{
  const { g, e, u } = arena('ranger');
  u.slow = 1;
  assert(g.cast(4, undefined, true));
  assert(g.companionRallyMoveSpeed(u, 250) > g.companionMoveSpeed(250));
  near(g.cooldownRecoveryElapsed(u, 0.1), 0.065);
  near(g.cooldownRecoveryElapsed(e, 0.1, true), 0.1);
  assert.equal(g.s.projectiles.length, 0, 'Rally creates no dash or invented attack');
  assert.equal(u.skill2Cd, 0, 'Rally never changes special cooldowns');
  const saved = g.snapshot();
  assert(!('rangerRallyUntil' in saved.party[0]));
  assert(g.rangerRallyActive(u), 'snapshot sanitizes its copy rather than live buff');
  const restored = Campaign.restore(saved);
  assert(!restored.rangerRallyActive(restored.s.party[0]));
}
{
  const { g, e } = arena('ranger');
  assert(g.cast(8, e.id, true));
  const arrows = g.s.projectiles;
  assert.equal(arrows.length, 3, 'approved isolated-target ultimate keeps three actual arrows');
  g.effects = [];
  g.updateProjectiles(0.01);
  assert.equal(
    g.effects.filter((f) => f.type === 'heroProjectileFlight').length,
    1,
    'only the first actual departure sounds before staggered arrows launch',
  );
}
assert.equal(R.chargedSkills.holdSeconds, 0.65);
assert.equal(R.cooldownBalance.slowRecoveryMultiplier, 0.65);
assert.equal(R.cooldownBalance.enemySlowRecoveryMultiplier, 0.85);
console.log(
  'PASS combined hero skill forms, mitigation/interruption, Slow/Rally, Silence/healing and real flight',
);

// Exercise the new facade dispatcher rather than certifying it using preserved
// legacy recipe hashes. These cases are source additions, not executed evidence.
const Audio = require('../src/prototype/audio.js');
for (const cls of ['paladin', 'mage', 'ranger']) {
  const audio = new Audio(),
    calls = [];
  audio.ctx = { currentTime: 1, state: 'running' };
  audio.playSoundEvent = () => false;
  for (const method of ['tone', 'sweep', 'noiseBurst'])
    audio[method] = (...args) => calls.push([method, ...args]);
  audio.effect({
    type: 'heroCharge',
    actor: 'hero',
    class: cls,
    slot: 8,
    charged: true,
    stage: 'ready',
    x: 500,
    y: 500,
  });
  assert(calls.length > 0, cls + ' ready feedback reaches the installed hero audio owner');
  calls.length = 0;
  audio.settings.muted = true;
  audio.ctx.currentTime += 1;
  audio.effect({
    type: 'heroCharge',
    actor: 'hero',
    class: cls,
    slot: 8,
    charged: true,
    stage: 'cancel',
    x: 500,
    y: 500,
  });
  assert.equal(calls.length, 0, 'mute applies to new charge feedback');
  assert.equal(
    audio.heroSkillEffect({
      type: 'melee',
      actor: 'companion',
      role: 'soldier',
      source: 'ally',
      x: 500,
      y: 500,
    }),
    false,
    'hero owner leaves companion events on their existing route',
  );
}
