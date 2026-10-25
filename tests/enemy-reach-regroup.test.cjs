'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine'),
  FX = require('../src/prototype/combat-visuals');
const R = C.rules;
function scene() {
  const g = new C('normal', 'mage', () => 0.9);
  g.enter('supply-vale');
  const z = g.zone();
  // Isolate this roster from Treasury replacement spawns; keep real AI/combat/navigation.
  g.zone = () => z;
  z.enemies = [];
  z.props = [];
  z.npcs = [];
  z.buildings = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.clock = 120;
  Object.assign(g.hero, { x: 500, y: 300, hp: 100000, maxHp: 100000, immune: 0, level: 1 });
  const add = (x, extra = {}) => {
    const e = g.makeEnemy(
      { species: 'goblin', name: 'Range fixture', level: 1, hp: 1000, damage: 10, xp: 0, gold: 0 },
      { x, y: 300 },
    );
    Object.assign(e, { idleWanderWait: 100, cd: 100, specialCd: 100 }, extra);
    z.enemies.push(e);
    return e;
  };
  return { g, z, add };
}
function inside(p, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      hit = !hit;
  }
  return hit;
}
// A real new fringe hit must be covered by the same visible cone.
{
  const { g, z } = scene();
  const e = g.bossEnemy(g.boss('thorn'), 'normal', { x: 300, y: 300 });
  z.enemies = [e];
  g.engage(e);
  Object.assign(g.hero, { x: 510, y: 300 });
  const a = g.buildBossAttack(e, 0, g.hero, false).first;
  assert(Math.abs(a.radius - 165 * 1.15 * 1.2) < 1e-8);
  assert(210 > 165 * 1.15 && 210 < a.radius);
  assert(FX.warningShapes(a, g.attackPatches(a)).some((poly) => inside(g.hero, poly)));
  const hp = g.hero.hp;
  e.telegraph = a;
  g.resolveAttack(e);
  assert(g.hero.hp < hp, 'expanded cone really hits the warned fringe');
  Object.assign(g.hero, { hp: 100000, x: 300 + a.radius + 10, immune: 0 });
  e.telegraph = a;
  g.resolveAttack(e);
  assert.equal(g.hero.hp, 100000, 'outside expanded cone stays safe');
}
{
  const { g, z } = scene();
  const e = g.bossEnemy(g.boss('citadel'), 'normal', { x: 300, y: 300 });
  z.enemies = [e];
  const a = g.buildBossAttack(e, 0, g.hero, false).first;
  assert.equal(a.radius, 432);
  e.telegraph = a;
  g.resolveAttack(e);
  assert.equal(g.s.projectiles.length, 9);
  for (const p of g.s.projectiles)
    assert(p.speed * p.life + 7 <= a.radius + 1e-8, 'fragment flight remains within warned reach');
}
{
  const { g, z } = scene();
  const e = g.bossEnemy(g.boss('crypt'), 'normal', { x: 300, y: 300 });
  z.enemies = [e];
  const a = g.buildBossAttack(e, 1, g.hero, false).first;
  e.telegraph = a;
  g.resolveAttack(e);
  const p = g.s.projectiles[0];
  assert(Math.abs(p.speed * p.life - 780) < 1e-8);
  const warning = FX.warningShapes(a, [])[1];
  assert(inside({ x: 1070, y: 300 }, warning), 'volley warning reaches new projectile endpoint');
  const ring = g.buildBossAttack(e, 4, g.hero, false).first;
  assert.equal(ring.waveLife, 1.44);
}
assert.equal(R.bossCadence.specialRange, 720);
for (const profile of Object.values(R.roomCaptains))
  if (profile.specialRange) assert(profile.specialRange >= 480);
assert.equal(R.nightEnemyCombat.wraith.radius, 252);
{
  const { g, add } = scene();
  const e = add(300, { aggro: true });
  assert(g.tacticalRogueMove(e, g.hero));
  assert.equal(e.telegraph.radius, 96);
}
// Actual automatic acquisition and ordinary ranged targeting expand slightly.
for (const distance of [280, 290]) {
  const { g, add } = scene();
  const e = add(300);
  Object.assign(g.hero, { x: 300 + distance });
  g.updateEnemies(0.01);
  assert.equal(e.aggro, distance < 286);
}
{
  const { g, add } = scene();
  const e = add(300, { aggro: true, ranged: true, shotRange: 280, cd: 0 });
  Object.assign(g.hero, { x: 600 });
  g._tacticalRogueNext = new Map([[e.id, 1000]]);
  g.updateEnemies(0.01);
  assert(e.rangedAim, 'ranged ordinary troop acquires aim at 300, above old 280');
}
// Healer does not need to be aggroed. A regrouping ally at 80% is now triaged.
for (const block of [null, 'cooldown', 'silence', 'wall', 'returning']) {
  const { g, add } = scene();
  Object.assign(g.hero, { x: 900, y: 800 });
  const healer = add(300, { ranged: true, aggro: false });
  const wounded = add(350, { aggro: true, hp: 800 });
  g._tacticalRegroups = new Map([
    [wounded.id, { phase: 'anchored', anchor: { x: 350, y: 300 }, holdRemaining: 12 }],
  ]);
  if (block === 'cooldown') healer.supportHealCd = 4;
  if (block === 'silence')
    g.hero.silenceField = { x: 300, y: 300, radius: 200, zone: g.zoneId, until: 100 };
  if (block === 'wall') g.line = () => false;
  if (block === 'returning') wounded.returning = 1;
  g.updateEnemies(0.05);
  assert.equal(!!wounded.supportHeal, block === null, 'idle triage retains ' + block + ' gate');
  if (!block) {
    assert.equal(healer.aggro, false);
    assert.equal(healer.supportHealCd, 7);
    const hp = wounded.hp;
    g.advanceEnemySupportHeal(wounded, 1);
    assert(wounded.hp > hp);
  }
}
{
  const { g, add } = scene();
  const e = add(300, { aggro: true, hp: 450, fightStart: 29.5 });
  Object.assign(g.hero, { x: 360 });
  assert(g.tacticalRogueWounded(e));
  assert(g.tacticalAutoRogue(e, g.hero));
  assert.equal(g.tacticalRogueRegroup(e).phase, 'thinking');
  assert.equal(g.tacticalRogueRegroup(e).thinkRemaining, 0.3);
  assert.equal(R.tacticalFoundation.woundedThreshold, 0.5);
}

// Specialized Treasury and minister geometry retains valid real plans after expansion.
{
  const g = new C('normal', 'mage', () => 0.9);
  g.enter('supply-crown');
  const e = g.zone().enemies.find((e) => e.captainProfile === 'supply-crown');
  Object.assign(g.hero, g.safe(e.x + 120, e.y));
  for (let slot = 0; slot < 7; slot++) {
    const built = g.buildDreadAttack(e, g.hero, slot);
    assert(built?.first, 'expanded Dreadmaw plan ' + slot + ' is legal');
    for (const a of [built.first, ...built.sequence])
      if (!['summon'].includes(a.kind))
        assert(
          FX.warningShapes(a, g.attackPatches(a)).every((p) =>
            p.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y)),
          ),
        );
  }
  assert.equal(R.attacks.cindermaw[5].finisherRadius, 66);
  assert.equal(R.attacks.cindermaw[2].radius, 320, 'ally protection range is unchanged');
}
{
  const { g, add } = scene();
  Object.assign(g.hero, { x: 900, y: 800 });
  const healer = add(300, { aggro: false, ranged: true }),
    wounded = add(720, { hp: 450, aggro: true });
  g._tacticalRegroups = new Map([
    [wounded.id, { phase: 'travel', destination: { x: 400, y: 300 } }],
  ]);
  const before = healer.x;
  assert(g.enemySupportApproach(healer, 0.1));
  assert(healer.x > before, 'idle healer closes the last part of an arriving ally route');
}
{
  const { g, add } = scene();
  const e = add(300, { aggro: true, fightStart: 29.5 });
  Object.assign(g.hero, { x: 360, order: { type: 'attack', id: e.id } });
  g.s.party = [g.unit('soldier', 370, 300), g.unit('archer', 375, 315)];
  g._tacticalPartyTargets = new Map(g.s.party.map((u) => [u.id, e.id]));
  assert(g.tacticalRogueOutnumbered(e));
  assert(
    g.tacticalAutoRogue(e, g.hero),
    'healthy but outmatched troop responds before the old 1.1 second grace',
  );
}
console.log(
  'PASS expanded special fringe/contact/warnings, volley/fragment endpoints, night/Rogue reach, real acquisition/aim, earlier assessment and idle regroup triage with preserved gates',
);
