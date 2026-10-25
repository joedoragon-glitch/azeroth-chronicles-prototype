'use strict';
// Deterministic action-economy observation, not a real encounter/FPS benchmark.
// Usage: node .../hero-skill1-balance-probe.cjs BASELINE_ROOT CANDIDATE_ROOT
const path = require('node:path');
function sample(root, cls, count, policy) {
  const C = require(path.join(root, 'src/prototype/engine.js'));
  const g = new C('normal', cls, () => 0.9),
    z = g.zone();
  z.props = [];
  z.buildings = [];
  z.npcs = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 500, hp: 1000, maxHp: 1000, order: null });
  g.hero.skills.fill(1);
  z.enemies = Array.from({ length: count }, (_, i) =>
    g.makeEnemy(
      { species: 'goblin', name: 'Probe', level: 1, hp: 1000000, damage: 0, xp: 0, gold: 0 },
      { x: 580 + i * 25, y: 500 },
    ),
  );
  for (const e of z.enemies) g.damage(e, 1, 'hero');
  g.updateParty = g.updateEnemies = () => {};
  let damage = 0,
    basics = 0,
    taps = 0,
    charged = 0,
    hold = null,
    nextTap = 0;
  const apply = g.damage;
  g.damage = function (e, ...args) {
    const before = e.hp,
      result = apply.call(this, e, ...args);
    damage += Math.max(0, before - e.hp);
    return result;
  };
  const candidate = typeof g.basicSkillCooldown === 'function';
  for (let i = 0; i < 240; i++) {
    const time = i * 0.05,
      enemy = z.enemies[0];
    if (
      policy === 'mixed' &&
      !hold &&
      g.hero.cd[0] <= 0 &&
      (!candidate || g.hero.chargedCd[0] <= 0)
    )
      hold = { due: time + 0.65, receipt: g.chargedEncounterSnapshot() };
    if (candidate || !hold) if (g.castMovementBasic()) basics++;
    if (hold && time + 1e-9 >= hold.due) {
      if (g.cast(1, enemy.id, true, hold.receipt)) charged++;
      hold = null;
    }
    if (policy !== 'basic' && !hold && time + 1e-9 >= nextTap) {
      if (g.cast(1, enemy.id, false)) {
        taps++;
        nextTap = time + 3;
      }
    }
    g.tick(0.05);
  }
  return {
    class: cls,
    enemies: count,
    policy,
    damage: Math.round(damage * 100) / 100,
    basics,
    taps,
    charged,
  };
}
const [baseline, candidate] = process.argv.slice(2);
const rows = [];
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const count of [1, 4])
    for (const policy of ['basic', 'tap', 'mixed']) {
      const before = sample(path.resolve(baseline), cls, count, policy),
        after = sample(path.resolve(candidate), cls, count, policy);
      rows.push({ class: cls, enemies: count, policy, before, after });
    }
console.log(
  JSON.stringify(
    {
      seconds: 12,
      dt: 0.05,
      rank: 1,
      training: 0,
      party: 0,
      limits:
        'Isolated admitted high-HP targets, automatic-basic permission, disabled enemy/party AI, identical deterministic RNG, no defense or companion retuning. Mixed uses 0.65s preparation. This observes action economy, not battle time, survival, device FPS or player acceptance.',
      rows,
    },
    null,
    2,
  ),
);
