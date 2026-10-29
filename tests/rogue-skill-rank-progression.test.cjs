'use strict';
// Source-grounded Rogue instructor progression: every purchased rank improves
// both lawful manual forms and the Skill 1 three-form family. Stacking remains
// the independently merged owner contract; no separate training track.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Reference = require('../src/prototype/skill-reference.js');
const R = Campaign.rules;
const hadRogue = Object.hasOwn(Campaign.classes, 'rogue');
if (!hadRogue) {
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: 'bell' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
}
const close = (actual, expected, label) =>
  assert(Math.abs(actual - expected) < 0.00001,
    label + ': got ' + actual + ', expected ' + expected);
function fresh(rank) {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.hero.skills = Array(8).fill(rank);
  g.zone().props = [];
  g.zone().buildings = [];
  const ally = g.unit('soldier', 520, 500);
  g.s.party = [ally];
  const foe = g.makeEnemy({ species: 'goblin', name: 'Rank check target',
    level: 1, hp: 1000000, damage: 0, gold: 0, xp: 0 },
    { x: 590, y: 500 });
  foe.aggro = true;
  foe.specialCd = 3;
  g.zone().enemies = [foe];
  return { g, ally, foe };
}
try {
  let castCount = 0;
  for (let slot = 1; slot <= 8; slot++) {
    for (const charged of [false, true]) {
      let previous = null;
      for (let rank = 1; rank <= 8; rank++) {
        const { g, ally, foe } = fresh(rank);
        const form = slot === 1
          ? g.rogueSkill1Config(charged, rank)
          : g.roguePerformanceAtRank(slot, charged, rank);
        const journal = Reference.describe(g, slot, rank)[charged ? 'charge' : 'tap'];
        const metrics = journal.metrics;
        const metric = (key) => metrics.find((m) => m.key === key)?.value;
        assert(form && journal, 'rank-resolved skill and readable form');
        if (slot !== 1) {
          assert.equal(metric('duration'), form.seconds);
          assert.equal(metric('radius'), form.radius);
        } else {
          close(metric('allyBuff'), form.allyDamage * 100,
            'Skill 1 journal explains training boon');
        }
        const snapshot = JSON.stringify(g.snapshot());
        Reference.describe(g, slot, Math.min(8, rank + 1));
        assert.equal(JSON.stringify(g.snapshot()), snapshot, 'reference stays read-only');
        if (previous) {
          // Even when geometry/cooldowns stay fixed, each form gets a real
          // measurable per-rank improvement, not a cosmetic Rank label.
          const before = Reference.describe(g, slot, rank - 1)[charged ? 'charge' : 'tap'];
          assert(metrics.some((m) => {
            const prior = before.metrics.find((v) => v.key === m.key);
            return prior && JSON.stringify(prior.value) !== JSON.stringify(m.value);
          }), 'Skill ' + slot + '/' + charged + ' rank ' + rank + ' improves its form');
        }
        previous = form;
        assert(g.cast(slot, foe.id, charged),
          'rank ' + rank + ' Skill ' + slot + (charged ? ' charged' : ' normal'));
        castCount++;
        if (slot === 1) {
          close(g.rogueSongBoon(ally, 'refrain').basicDamage,
            form.allyDamage, 'Skill 1 actually grants ranked companion Refrain');
          close(g.rogueSongBoon(g.hero, 'refrain').basicDamage,
            form.allyDamage, 'Skill 1 actually grants ranked self Refrain');
        } else if (slot === 2) {
          close(g.rogueSongBoon(ally, 'quickstep').move, form.move,
            'Quickstep uses actual ranked movement');
          close(g.rogueSongBoon(g.hero, 'quickstep').recovery, form.recovery,
            'Quickstep uses actual ranked recovery');
          close(foe.slow, form.slow + R.cooldownBalance.slowDurationBonusSeconds,
            'ranked Slow contacts enemy');
        } else if (slot === 3) {
          close(g.rogueSongBoon(ally, 'steadyBeat').until, g.s.time + form.seconds,
            'Steady Beat protection lasts the ranked duration');
        } else if (slot === 4) {
          close(g.rogueSongBoon(ally, 'mending').remainingHeal,
            ally.maxHp * form.healFraction, 'ranked finite ally healing budget');
          close(g.rogueEnemyHealingFactor(foe), 1 - form.antiHeal,
            'ranked hostile anti-heal is applied');
        } else if (slot === 5) {
          close(g.rogueStationProtection(ally).resistance, form.slowResistance,
            'ranked station Slow resistance takes effect');
          close(g.rogueStationProtection(g.hero).ward, form.ward,
            'ranked station ward takes effect');
        } else if (slot === 6) {
          close(g.rogueSongBoon(ally, 'borrowedTime').specialRecovery,
            form.specialRecovery, 'ranked Borrowed Time accelerates ally recovery');
          close(g.rogueSongBoon(g.hero, 'borrowedTime').specialRecovery,
            form.specialRecovery, 'ranked Borrowed Time accelerates Rogue');
        } else if (slot === 7) {
          close(g.rogueSongBoon(g.hero, 'firmFooting').outgoing, form.outgoing,
            'ranked Firm Footing actually strengthens Rogue');
          close(g.rogueEnemyWeakenFraction(foe), form.weakenFraction,
            'ranked Weaken actually applies to enemy');
        } else if (slot === 8) {
          close(g.rogueSongBoon(ally, 'finale').criticalChance,
            form.criticalChance, 'ranked Finale critical chance applies to ally');
          assert(foe.hp < foe.maxHp, 'ranked ultimate actually damages enemy');
          close(metric('damage'), (g.power() + 12) * form.damage *
            (1 + 0.15 * (rank - 1)), 'ultimate journal lists real ranked damage');
        }
        assert.doesNotThrow(() => Campaign.validate(g.snapshot()),
          'ranked combat keeps save compatibility');
      }
    }
  }
  for (let rank = 1; rank < 8; rank++) {
    const { g } = fresh(rank);
    for (let slot = 1; slot <= 8; slot++) {
      const blocks = Reference.changes(g, slot, rank);
      for (const block of blocks.filter((b) => b.title !== 'Automatic basics'))
        assert(block.rows.length > 0,
          'Skill ' + slot + ' from ' + rank + ' to ' + (rank+1) +
          ' must not advertise No change at this rank');
    }
  }
  const { g, ally, foe } = fresh(8);
  assert(g.cast(1, foe.id, false));
  g.hero.cd[0] = 0;
  assert(g.cast(1, foe.id, true));
  close(g.rogueSongBoon(ally, 'refrain').basicDamage, 0.16,
    'Rank 8 +7% Normal and +9% Charged sum during legal overlap');
  close(g.rogueSongBoon(g.hero, 'refrain').basicDamage, 0.16,
    'Rank 8 hero receives same separately timed layered benefit');
  assert.equal(g.roguePerformanceAtRank(2, false, 9), null,
    'Rank 9 is outside the instructor curriculum');
  console.log('PASS Rogue ranked combat: ' + castCount +
    ' actual releases, every rank 1-8 and 16 forms, honest previews, hero/party/enemy parity, Rank-8 7%+9% stacking, save compatibility');
} finally {
  if (!hadRogue) {
    delete Campaign.classes.rogue;
    delete Campaign.talentProfiles.rogue;
  }
}
