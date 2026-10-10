'use strict';

// Deterministic #214 evidence. Report current behavior without silently deciding
// whether the historical promise or stable current mechanic should change.
const Campaign = require(process.env.BETA_CAMPAIGN_MODULE || '../src/prototype/engine.js');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function replay(mode, form, family, scenario) {
  const c = new Campaign(mode, 'paladin', () => 0.9);
  c.enter(family === 'mine' ? 'mine' : 'vale');
  c.s.party = [];
  const start =
    family === 'mine'
      ? scenario === 'wall'
        ? { x: 600, y: 1100 }
        : { x: 650, y: 1150 }
      : c.safe(1850, 1850);
  const target =
    family === 'mine'
      ? scenario === 'wall'
        ? { x: 600, y: 950 }
        : scenario === 'pillar'
          ? { x: 480, y: 950 }
          : { x: 950, y: 1150 }
      : { x: start.x + 150, y: start.y };
  const e = c.bossEnemy(c.boss(family), form, start);
  c.zone().enemies = [e];
  Object.assign(c.hero, target, { immune: scenario === 'immune' ? 4 : 0 });
  const index = family === 'mine' ? 3 : 1;
  c.startAttack(e, c.hero, index);
  e.sequence = []; // Isolate the named action from randomly selected combo follow-ups.
  const warning = JSON.parse(JSON.stringify(e.telegraph));
  if (scenario === 'miss') Object.assign(c.hero, c.safe(start.x - 150, start.y - 150));
  const hp = c.hero.hp;
  c.resolveAttack(e);
  let seconds = 0;
  while (e.motion && seconds < 6) {
    c.advanceMotion(e, 0.02);
    seconds += 0.02;
  }
  return {
    mode,
    form,
    family,
    scenario,
    start,
    target,
    end: { x: e.x, y: e.y },
    warning: {
      kind: warning.kind,
      warning: warning.total,
      recovery: warning.recovery,
      opening: warning.opening || 0,
      landing: !!warning.landing,
      charge: !!warning.charge,
    },
    motionSeconds: +seconds.toFixed(2),
    reachedTarget: distance(e, target) < 20,
    targetBlocked: c.blocked(target.x, target.y),
    hpLost: hp - c.hero.hp,
    effectiveRecoverySeconds: e.cd,
    exposedOpeningSeconds: e.open || 0,
    pillarCollisionImplemented:
      family === 'mine' ? Campaign.rules.pillars.mine.some(([x, y]) => c.blocked(x, y)) : null,
    mineIncomingDamageMultiplier: family === 'mine' && e.open > 0 ? 1.25 : 1,
  };
}
function report() {
  const rows = [];
  for (const mode of ['normal', 'nightmare'])
    for (const form of ['normal', 'true']) {
      for (const scenario of ['hit', 'miss', 'immune'])
        rows.push(replay(mode, form, 'thorn', scenario));
      for (const scenario of ['unobstructed', 'wall', 'pillar', 'immune'])
        rows.push(replay(mode, form, 'mine', scenario));
    }
  return {
    purpose: 'Observed contract discrepancies, not authorization to retune bosses',
    fixture:
      'Isolated real attack resolver; seeded selection, no companion damage; motion advanced at 0.02s; follow-up combos removed to measure only the named action.',
    rows,
  };
}
if (require.main === module) console.log(JSON.stringify(report(), null, 2));
module.exports = { report, replay };
