'use strict';
// Review-only adversarial probes. They report observed defects, not a green release gate.
const path = require('node:path');
const C = require(
  process.env.SURVIVAL_AUDIT_ENGINE || path.join(__dirname, '../../src/prototype/engine'),
);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function companion(type = 'archer', gap = 150) {
  const g = new C('normal', 'mage', () => 0.9),
    z = g.zone();
  Object.assign(z, { props: [], nodes: [], npcs: [], buildings: [], enemies: [] });
  g.blocked = (x, y, zone, r = 15) => x < 50 + r || y < 50 + r || x > 2450 - r || y > 2450 - r;
  Object.assign(g.hero, { x: 950, y: 1500 });
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  g.setPartyChargeClock(() => g.s.time);
  const u = type.startsWith('pet:')
    ? g.unit('pet', 1150, 1500, type.slice(4))
    : g.unit(type, 1150, 1500);
  Object.assign(u, { hp: u.maxHp * 0.1, skill1Cd: 60, skill2Cd: 60, healCd: 60, cd: 0 });
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100000, damage: 20, gold: 0, xp: 0 },
    { x: u.x - gap, y: u.y },
  );
  e.aggro = true;
  z.enemies = [e];
  g.syncSquadDoctrine();
  const step = (dt = 0.05) => {
    g.s.time += dt;
    g.updateParty(dt);
    g.resolveCompanionCharges();
  };
  return { g, z, u, e, step };
}
for (const kind of ['ranged', 'boss', 'captain'])
  for (const role of ['soldier', 'archer', 'pet:ridge', 'pet:archive']) {
    const { g, u, e, step } = companion(role);
    Object.assign(u, { x: 1100, y: 1500 });
    Object.assign(g.hero, { x: 1150, y: 1500 });
    Object.assign(e, { x: 1420, y: 1500 });
    if (kind === 'ranged') Object.assign(e, { ranged: true, shotRange: 400 });
    if (kind === 'boss') Object.assign(e, { type: 'boss', family: 'thorn' });
    if (kind === 'captain') Object.assign(e, { captain: true, captainProfile: 'supply-vale' });
    const before = dist(u, e),
      assessment = g.companionSafetyAssessment(u, e, g.activeLivingParty());
    step();
    console.log(
      JSON.stringify({
        case: 'critical-long-reach',
        kind,
        role,
        hp: u.hp / u.maxHp,
        enemyReach:
          kind === 'ranged'
            ? g.enemyRangedRange(e)
            : kind === 'boss'
              ? C.rules.bossCadence.specialRange
              : g.captainProfile(e).specialRange,
        unsafe: assessment.unsafe,
        before,
        after: dist(u, e),
        retreat: g.companionRetreatMode(u),
        fired: g.s.projectiles.some((p) => p.source === u.id),
      }),
    );
  }
if (process.argv.includes('--entry-only')) process.exit(0);
{
  const { g, z, u, e, step } = companion();
  const t = g.traps()[0];
  if (t) {
    Object.assign(u, { x: t.x, y: t.y });
    Object.assign(e, { x: t.x - 150, y: t.y, home: { x: t.x - 150, y: t.y } });
    Object.assign(g.hero, { x: t.x - 200, y: t.y });
    z.clock =
      t.warningTime + 0.05 - t.index * (C.rules.outdoorMiniTrapTuning[z.id]?.offset || 1.35);
    if (z.clock < 0) z.clock += t.cycleLength * 100;
    const actual = g.traps().find((x) => x.index === t.index);
    const allowed = g.companionSafeContribution(u, e, 0),
      hp = u.hp;
    step();
    const held = { x: u.x, y: u.y };
    g.updateTraps(0.05);
    console.log(
      JSON.stringify({
        case: 'outdoor-trap',
        zone: z.id,
        isDungeon: g.isDungeon(),
        trap: actual,
        contains: g.trapContains(actual, u),
        allowed,
        held: dist(held, actual),
        hpBefore: hp,
        hpAfter: u.hp,
      }),
    );
  }
}
{
  const { g, z, u, e, step } = companion();
  const caster = g.makeEnemy(
    { species: 'reedbeast', level: 1, hp: 10000, damage: 50, gold: 0, xp: 0 },
    { x: 450, y: 1500 },
  );
  Object.assign(caster, {
    roomCaptain: true,
    captainProfile: 'supply-crown',
    aggro: true,
    dreadVapors: [
      {
        x: u.x,
        y: u.y,
        radius: 66,
        kind: 'circle',
        life: 2,
        age: 0,
        tick: 0,
        coefficient: 0.12,
        skill: 6,
        tickInterval: 0.55,
      },
    ],
  });
  z.enemies.push(caster);
  const allowed = g.companionSafeContribution(u, e, 0),
    hp = u.hp;
  let frames = 0;
  while (u.hp > 0 && frames < 30) {
    step();
    g.updateCinderRegularState(caster, 0.05);
    frames++;
  }
  console.log(
    JSON.stringify({
      case: 'special-vapor',
      allowed,
      hpBefore: hp,
      hpAfter: u.hp,
      elapsed: frames * 0.05,
      contributing: g.s.projectiles.some((p) => p.source === u.id),
    }),
  );
}
{
  const { g, u, e, step } = companion();
  g.s.hazards.push({
    kind: 'ring',
    family: 'mine',
    x: u.x - 50,
    y: u.y,
    radius: 180,
    age: 1,
    life: 3,
    tick: 0,
    hit: [],
    damage: 50,
  });
  const ring = g.s.hazards[0],
    allowed = g.companionSafeContribution(u, e, 0),
    hp = u.hp;
  g.updateProjectiles(0.01);
  console.log(
    JSON.stringify({
      case: 'spent-ring-interior',
      allowed,
      ringDistance: dist(u, ring),
      radius: ring.radius,
      hpBefore: hp,
      hpAfter: u.hp,
    }),
  );
}
{
  const c = new C('normal', 'mage', () => 0.5);
  c.enter('supply-crown');
  const e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
  c.s.party = [];
  c.zone().enemies = [e];
  const out = { case: 'dread-closure-prevalidated-center', zone: c.zoneId };
  let found = null;
  for (let x = 120; x < 1500 && !found; x += 35)
    for (let y = 120; y < 1500; y += 35) {
      if (c.blocked(x, y, c.zoneId, 20)) continue;
      Object.assign(e, { x, y });
      const plan = c.dreadClosurePlan(e);
      if (plan && dist(plan, e) > 1) {
        found = { actor: { x, y }, plan };
        break;
      }
    }
  if (found) {
    Object.assign(c.hero, { x: e.x + 140, y: e.y });
    Object.assign(e, { aggro: true, cd: 0, specialCd: 0, summonCd: 100 });
    let selected = false;
    for (let roll = 0; roll <= 100; roll++) {
      c.random = () => roll / 101;
      e.telegraph = null;
      e.sequence = [];
      e.specialCd = 0;
      delete e.lastCaptainAttack;
      c.enemyWithdrawalAction(e, c.hero);
      if (e.telegraph?.index === 4) {
        selected = true;
        break;
      }
    }
    if (!selected) throw Error('Native Dreadmaw must select its closure');
    out.nativeWithdrawalCast = e.telegraph.withdrawal;
    const before = { ...e.telegraph };
    c.enemyWithdrawalCastPosition(e);
    out.before = { x: before.x, y: before.y };
    out.after = { x: e.telegraph.x, y: e.telegraph.y };
    out.actor = { x: e.x, y: e.y };
    out.shift = dist(before, e.telegraph);
    out.gapValidityBefore = before.gaps.map((angle) =>
      Array.from({ length: 9 }, (_, i) => (i / 8 - 0.5) * before.gapWidth).every((o) => {
        const p = {
          x: before.x + Math.cos(angle + o) * (before.initialRadius + before.width + 15),
          y: before.y + Math.sin(angle + o) * (before.initialRadius + before.width + 15),
        };
        return !c.blocked(p.x, p.y, c.zoneId, 15) && c.clearSegment(before, p, 15);
      }),
    );
    out.gapValidityAfter = before.gaps.map((angle) =>
      Array.from({ length: 9 }, (_, i) => (i / 8 - 0.5) * before.gapWidth).every((o) => {
        const p = {
          x: e.x + Math.cos(angle + o) * (before.initialRadius + before.width + 15),
          y: e.y + Math.sin(angle + o) * (before.initialRadius + before.width + 15),
        };
        return !c.blocked(p.x, p.y, c.zoneId, 15) && c.clearSegment(e, p, 15);
      }),
    );
  }
  console.log(JSON.stringify(out));
}
