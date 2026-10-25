'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const rules = Campaign.rules;
const support = rules.enemySupportHealing;
const near = (a, b, label, tolerance = 1e-5) =>
  assert(Math.abs(a - b) <= tolerance, label + ': ' + a + ' versus ' + b);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Phase 4: native specialist interaction checks, NOT a new difficulty budget.
// Retain every authored attack, Brood Call, Broodward, Grafting and Rebound.
const dreadPlan = rules.roomCaptains['supply-crown'];
const direPlan = rules.roomCaptains['supply-march'];
assert.equal(dreadPlan.attacks.length, 7, 'seven authored agriculture attacks remain');
assert.equal(dreadPlan.summon.cap, 4, 'four owned broodlings at a time');
assert.deepEqual(dreadPlan.summon.composition, ['melee', 'melee', 'melee', 'ranged']);
assert.equal(dreadPlan.summon.guardPerSummon, 0.25, 'Broodward guard is unchanged');
assert.equal(dreadPlan.summon.guardCap, 1, 'four brood can fully shield Dreadmaw');
assert.equal(direPlan.phase.threshold, 0.55, 'Elastic Rebound 55 percent gate is unchanged');
assert.equal(direPlan.phase.kind, 'molt');
assert.equal(support.captains['supply-crown'], 'Grafting');
assert.equal(support.captains['supply-march'], 'Silt Pulse');

function nativeRoom(id, mode = 'normal', withParty = false) {
  const g = new Campaign(mode, 'paladin', () => 0.73);
  g.enter(id);
  g.s.time = 30;
  g.s.mercyTime = 0;
  const captain = g.zone().enemies.find((u) => u.roomCaptain && u.captainProfile === id);
  assert(captain, mode + '/' + id + ' has its true captain');
  const point = g.safe(captain.x - 92, captain.y - 25);
  Object.assign(g.hero, point, { hp: 200000, maxHp: 200000 });
  g.s.party = withParty
    ? [g.unit('soldier', point.x - 25, point.y + 15),
       g.unit('archer', point.x + 30, point.y + 15)]
    : [];
  for (const u of g.s.party) { u.hp = 200000; u.maxHp = 200000; }
  return { g, captain, ranged: g.zone().enemies.filter(
    (u) => u.roomGuard && !u.roomCaptain && u.ranged) };
}
function advance(g, ticks = 1, dt = 0.1) {
  for (let i = 0; i < ticks; i++) {
    g.s.time += dt;
    g.updateEnemies(dt);
  }
}
const healingEvents = (g, captain, sources) =>
  g.s.statistics.events.filter((ev) => ev.type === 'heal' &&
    ev.target === captain.id && (!sources || sources.has(ev.source)));

for (const mode of ['normal', 'nightmare']) {
  // Direjaw's one-time rebound is independent of the three guard healers.
  const { g, captain: jaw, ranged } = nativeRoom('supply-march', mode, true);
  assert.equal(ranged.length, 3, mode + ': Direjaw still has three native ranged guards');
  jaw.hp = jaw.maxHp * 0.54;
  assert(g.triggerCaptainPhase(jaw), mode + ': real Elastic Rebound triggers');
  near(jaw.hp, jaw.maxHp, mode + ': 54% + 50% capped at full');
  near(jaw.captainPhaseMove, 1.2, mode + ': retained 20% movement bonus');
  assert(!g.triggerCaptainPhase(jaw), mode + ': rebound cannot repeat');
  jaw.hp = jaw.maxHp * 0.22;
  assert(!g.triggerCaptainPhase(jaw), mode + ': later hit cannot reactivate rebound');
  near(jaw.hp, jaw.maxHp * 0.22, mode + ': no hidden second recovery');

  // The existing wardens heal an engaged captain as well as an idle captain.
  jaw.hp = jaw.maxHp * 0.82;
  g.engage(jaw, true, false);
  advance(g, 1);
  assert(healingEvents(g, jaw, new Set(ranged.map((u) => u.id))).length > 0,
    mode + ': active March guardian heals its engaged captain');
  assert(jaw.supportHeal && jaw.supportHeal.seconds <= support.captain.duration,
    mode + ': captain receives the same five-second treatment under pressure');
  console.log('SPECIALIST Direjaw/' + mode +
    ': Rebound intact, ranged guard healing under party presence, 3 original roles');
}

for (const mode of ['normal', 'nightmare']) {
  const { g, captain: dread, ranged } = nativeRoom('supply-crown', mode, true);
  assert.equal(ranged.length, 5, mode + ': existing five Treasury ranged posts remain');
  const nearGuard = ranged.find((u) =>
    distance(u, dread) <= support.range && g.line(u, dread));
  assert(nearGuard, mode + ': a native Dreadmaw warden can treat its captain');
  // A busy ranged guard cannot interrupt a committed aim to heal.
  dread.hp = dread.maxHp * 0.82;
  nearGuard.rangedAim = { timer: 1.4, total: 1.4,
    x: g.hero.x, y: g.hero.y, targetId: 'hero' };
  assert(!g.enemySupportHeal(nearGuard), mode + ': committed aiming prevents instant heal');
  nearGuard.rangedAim = null;
  assert(g.enemySupportHeal(nearGuard), mode + ': guard casts after aim is cleared');
  assert(dread.supportHeal && dread.supportHeal.remaining > 0,
    mode + ': native captain recipient gets a guarded 5s pulse');
  const saved = g.snapshot();
  assert(!saved.zones['supply-crown'].enemies.find((u) => u.id === dread.id).supportHeal,
    mode + ': mid-encounter guard treatment is not saved');
  g.advanceEnemySupportHeal(dread, 5);

  // Real native opening: ordinary attack #3 is Brood Call, whereas Grafting is
  // separate support and must not consume any of the seven attack identities.
  g.engage(dread, true, false);
  assert(g.startCaptainAttack(dread, g.hero), mode + ': Dreadmaw begins native opener');
  assert.equal(dread.telegraph.index, 3, mode + ': opening selects Brood Call');
  advance(g, 20);
  const brood = g.captainOwnedSummons(dread);
  assert.equal(brood.length, 4, mode + ': four owned broodlings spawn in live arena');
  assert.equal(brood.filter((u) => u.ranged).length, 1,
    mode + ': exactly one broodling is a ranged healer');
  assert(brood.every((u) => u.gold === 0 && u.xp === 0),
    mode + ': broodlings provide no repeatable rewards');
  const rangedBrood = brood.find((u) => u.ranged);
  assert(rangedBrood && rangedBrood.owner === dread.id,
    mode + ': lone ranged brood has actual captain ownership');

  // Broodward: four live summons suppress normal incoming damage; removing
  // brood progressively restores vulnerability. Never rebalance that here.
  dread.hp = dread.maxHp;
  const p0 = dread.hp;
  g.damage(dread, 160, 'hero');
  near(dread.hp, p0, mode + ': full Broodward prevents ordinary attack damage');
  brood[0].hp = 0;
  const p1 = dread.hp;
  g.damage(dread, 160, 'hero');
  assert(dread.hp < p1, mode + ': defeating one brood breaks perfect immunity');
  const threeBroodDamage = p1 - dread.hp;
  for (const u of brood) u.hp = 0;
  const p2 = dread.hp;
  g.damage(dread, 160, 'hero');
  assert(p2 - dread.hp > threeBroodDamage,
    mode + ': removing all brood increases normal vulnerability');
  console.log('SPECIALIST Dreadmaw/' + mode + ': opening 3 melee + 1 ranged, ' +
    'Broodward damage at 4/3/0=' +
    [0, threeBroodDamage.toFixed(2), (p2 - dread.hp).toFixed(2)].join('/'));
}

// Grafting: real four summoned broodlings recover all of their missing HP
// across 3s; Dreadmaw's own 5%-max/5s self clock remains independent.
{
  const { g, captain: dread } = nativeRoom('supply-crown');
  assert.equal(g.summonCaptainAdds(dread), 4);
  const brood = g.captainOwnedSummons(dread);
  for (const u of brood) u.hp = u.maxHp * 0.4;
  dread.hp = dread.maxHp * 0.6;
  const eligible = brood.filter((u) =>
    distance(u, dread) <= support.range && g.line(u, dread));
  assert(eligible.length >= 1, 'at least one native broodling has a Grafting sightline');
  assert(g.enemySupportHeal(dread), 'Grafting works in the real Treasury with brood');
  const treated = eligible.filter((u) => u.supportHeal);
  assert(treated.length > 0, 'Grafting includes actual eligible owned broodlings');
  for (const u of treated) {
    near(u.supportHeal.remaining, u.maxHp * 0.6, 'full missing brood HP');
    near(u.supportHeal.seconds, 3, 'ordinary brood restoration lasts three seconds');
  }
  assert(dread.supportHeal, 'Grafting self pulse preserved');
  near(dread.supportHeal.seconds, 5, 'Dreadmaw personal treatment remains five seconds');
  near(dread.supportHeal.remaining, dread.maxHp * 0.05 * g.enemyHealMultiplier(dread),
    'Dreadmaw retains original scaled self-restoration budget');
  near(dread.supportHealCd, 7, 'Grafting support casting clock remains seven seconds');
  for (const u of treated) g.advanceEnemySupportHeal(u, 3);
  assert(treated.every((u) => u.hp === u.maxHp), 'Grafting finishes full brood restoration');
  console.log('SPECIALIST Grafting: ' + treated.length +
    ' reachable native brood recipients, independent self-treatment intact');
}

// Bounded native combat pressure, not a claimed human playtest or global DPS
// recommendation. Targets include real hero, Soldier and Archer so captain AI
// can choose warning/aim/support while independent guards make decisions.
for (const id of ['supply-march', 'supply-crown']) {
  const { g, captain, ranged } = nativeRoom(id, 'normal', true);
  captain.hp = captain.maxHp * 0.78;
  g.engage(captain, true, false);
  const begin = g.s.statistics.events.length;
  let incoming = 0;
  for (let frame = 0; frame < 80; frame++) {
    if (frame % 10 === 0 && captain.hp > 0) {
      const prior = captain.hp;
      g.damage(captain, 18, 'hero');
      incoming += Math.max(0, prior - captain.hp);
    }
    advance(g);
    if (g.s.challenge.pending || g.s.challenge.gameOver) break;
  }
  const emitted = g.s.statistics.events.slice(begin);
  const rangerIds = new Set(ranged.map((u) => u.id));
  const treatments = emitted.filter((ev) =>
    ev.type === 'heal' && ev.target === captain.id && rangerIds.has(ev.source));
  const specials = emitted.filter((ev) =>
    ev.type === 'warning' && ev.captain === id);
  assert(captain.hp >= 0 && captain.hp <= captain.maxHp,
    id + ': battle HP remains bounded');
  assert(captain.captainProfile === id && !captain.neutral,
    id + ': boss identity and faction are preserved under pressure');
  console.log('SPECIALIST pressure/' + id + ': 8s, hero+soldier+archer; ' +
    'hero damage=' + incoming.toFixed(2) +
    ', guard captain-heals=' + treatments.length +
    ', named specials=' + specials.length +
    ', captainHP=' + captain.hp.toFixed(2));
}

console.log('PASS Phase 4 Direjaw/Dreadmaw specialist interactions; no encounter balance edits');
