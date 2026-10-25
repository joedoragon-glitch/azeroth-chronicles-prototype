'use strict';
// Phase 2A: Native damage/engagement/enemy-update pathway in an unobstructed
// *actual* Vale corridor. Delivered damage is real; class-specific projectile
// input and hit delivery are deliberately outside this intermediate probe.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

const distances = [350, 400, 450, 480];
const attackers = ['ranger', 'mage', 'archer'];
const kinds = ['ordinary', 'ringleader'];
const anchorCandidates = [
  { x: 1400, y: 1700 },
  { x: 1800, y: 1800 },
  { x: 2200, y: 1700 },
  { x: 2300, y: 2200 },
  { x: 2600, y: 1500 },
  { x: 1300, y: 2500 },
];
const directions = [
  { x: 1, y: 0 }, { x: -1, y: 0 },
  { x: 0, y: 1 }, { x: 0, y: -1 },
];

function findCorridor(c, distance) {
  for (const a of anchorCandidates) {
    if (c.blocked(a.x, a.y, 'vale', 12)) continue;
    for (const vector of directions) {
      const b = { x: a.x + vector.x * distance, y: a.y + vector.y * distance };
      if (c.blocked(b.x, b.y, 'vale', 12)) continue;
      if (!c.line(a, b) || !c.clearSegment(a, b, 12)) continue;
      return { a, b };
    }
  }
  return null;
}

function scene(mode, kind, attacker, distance, wounded) {
  const c = new Campaign(mode, attacker === 'mage' ? 'mage' : 'ranger', () => 0.9);
  c.enter('vale');
  const z = c.zone();
  // Keep authored world props, the real line/route/collision functions and
  // their terrain. Replace only enemies to control unrelated pack activity.
  const corridor = findCorridor(c, distance);
  assert(corridor, mode + ': real clear Vale corridor at distance ' + distance);
  z.enemies = [];
  c.zone = () => z;
  c.s.valeFieldAwakened = true;
  c.s.thornHeroInitiated = true;
  c.s.time = 30;
  c.s.mercyTime = 0;
  c.s.party = [];
  const e = c.makeEnemy(
    { species: 'goblin', name: 'native ranged-pressure ' + kind, form: kind === 'ringleader' ? 'ringleader' : 'normal',
      level: 3, hp: 2000, damage: 2, gold: 0, xp: 0 },
    corridor.a,
  );
  Object.assign(e, { cd: 100, specialCd: 100, fightStart: 0 });
  z.enemies = [e];
  const target = attacker === 'archer'
    ? c.unit('archer', corridor.b.x, corridor.b.y)
    : c.hero;
  if (attacker === 'archer') {
    Object.assign(target, { hp: 10000, maxHp: 10000, order: null });
    c.s.party = [target];
    // Keep non-attacking hero present but off this direct attack ray.
    Object.assign(c.hero, {
      x: corridor.b.x + (corridor.b.x - e.x) * 0.3,
      y: corridor.b.y + (corridor.b.y - e.y) * 0.3,
      hp: 10000, maxHp: 10000, level: e.level,
      order: null,
    });
    c._tacticalPartyTargets = new Map([[target.id, e.id]]);
  } else {
    Object.assign(c.hero, {
      x: corridor.b.x, y: corridor.b.y, hp: 10000, maxHp: 10000,
      level: e.level, order: { type: 'attack', id: e.id },
    });
  }
  // No synthetic threat ledger here: the native damage resolver must create
  // the actual engagement and record the source itself.
  if (wounded) e.hp = e.maxHp * 0.48;
  const initialHp = e.hp;
  const source = attacker === 'archer' ? target.id : 'hero';
  assert(c.line(target, e), 'native geometry still permits outgoing damage');
  assert(c.damage(e, 20, source), 'native delivered-hit damage is accepted');
  assert(e.hp < initialHp && e.hp > 0, 'delivered hit does real nonlethal damage');
  assert(e.aggro, 'native damage provokes established engagement');
  assert(c.tacticalThreatSnapshot(e).some((hit) => hit.source === source && hit.damage > 0),
    'native hit automatically enters original threat ledger');
  return { c, e, target, corridor, source };
}

let cases = 0;
let samplesWithRogueDecision = 0;
for (const mode of ['normal', 'nightmare']) {
  for (const kind of kinds) {
    for (const attacker of attackers) {
      for (const distance of distances) {
        for (const wounded of [false, true]) {
          const { c, e, target, source } = scene(mode, kind, attacker, distance, wounded);
          const initial = { x: e.x, y: e.y, hp: e.hp };
          const recent = c.tacticalActiveTargetCount(e);
          const eligible = c.tacticalRogueEligibility(e, recent);
          const selected = c.tacticalHighestThreatTarget(e, target) === target;
          assert.equal(selected, distance <= 360,
            'actual incoming hit does not waive the independent 360-unit selection gate');
          // A fully healthy equal-level isolated actor does not automatically
          // gain a Rogue action; a wounded actor can reconsider tactics.
          if (!wounded && recent === 1) assert(!eligible, 'solo healthy pressure gate');
          if (wounded && recent === 1) assert(eligible, 'solo wounded pressure gate');
          let phase = null;
          let didWarn = false;
          let didRetreat = false;
          for (let frame = 0; frame < 16; frame++) {
            c.s.time += 0.1;
            c.updateEnemies(0.1);
            const state = c.tacticalRogueRegroup(e);
            if (state) {
              phase = state.phase;
              if (['travel', 'extended', 'escape'].includes(state.phase)) didRetreat = true;
            }
            if (e.telegraph?.rogueMove ||
                c.s.statistics.events.some((event) => event.type === 'rogueMove'))
              didWarn = true;
          }
          if (phase || didWarn || didRetreat) samplesWithRogueDecision++;
          assert(e.hp >= 0 && e.hp <= e.maxHp,
            'native opponent health stays bounded after a confirmed distant hit');
          console.log('ROGUE_NATIVE_HIT ' + JSON.stringify({
            mode, kind, attacker, distance, wounded, source,
            pressure: recent, eligible, selected,
            actorMoved: Number(Math.hypot(e.x - initial.x, e.y - initial.y).toFixed(2)),
            hp: Number(e.hp.toFixed(2)), phase, didWarn, didRetreat,
            returning: !!e.returning, aggro: !!e.aggro,
          }));
          cases++;
        }
      }
    }
  }
}
assert.equal(cases, 96, 'controlled Normal/Nightmare hit/health matrix completes');
assert(samplesWithRogueDecision > 0, 'native wounded Rogue decisions occur in at least one legal encounter');
console.log('PASS ' + cases +
  ' native delivered-hit cases on real Vale corridors; ' +
  samplesWithRogueDecision + ' observed tactical responses; no balance edits');
