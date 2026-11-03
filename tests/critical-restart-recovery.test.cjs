'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const Persistence = require('../src/prototype/persistence');
const { shell } = require('./helpers/production-shell.cjs');

function fixture(succession = false) {
  const g = new C('normal', 'paladin', () => 0.73, { succession });
  const hero = g.hero;
  hero.hp = Math.max(2, hero.hp - 19);
  hero.gold = 293;
  hero.x = 360;
  hero.y = 700;
  const ally = g.unit('soldier', 400, 700, 'vale');
  ally.hp = Math.max(2, ally.hp - 7);
  ally.active = true;
  g.s.party = [ally];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Stalled attack', level: 1,
      hp: 100, damage: 1, gold: 0, xp: 0 },
    { x: 390, y: 700 },
  );
  e.home = { x: 800, y: 900 };
  e.aggro = true;
  e.telegraph = { timer: 10, total: 10, kind: 'circle', radius: 40, x: 360, y: 700 };
  g.zone().enemies = [e];
  g.s.mercyTime = 0;
  return { g, e, hero, ally };
}

// Escape only on persistent critical conditions, without granting free HP or
// changing death, quest or campaign recovery rules.
{
  const { g, e, hero, ally } = fixture();
  const hp = [hero.hp, ally.hp], gold = hero.gold, deaths = g.s.statistics.deaths;
  const alive = g.zone().enemies.length;
  // #684: critical-performance withdrawal activates the SAME timed Recall
  // as the player button, replacing any previous nearly expired deadline.
  g.s.recallActive = true;
  g.s.recallExpiresAt = g.s.time + 0.1;
  assert.equal(g.emergencyResetEncounter(), true);
  assert.equal(g.s.recallActive, true, 'emergency path activates the shared Recall state');
  const emergencyExpiry = g.s.recallExpiresAt;
  assert.equal(emergencyExpiry, g.s.time + C.rules.companionRecall.durationSeconds,
    'emergency recovery starts a fresh five-second Recall, never inherits stale expiry');
  assert.equal(g.recallSecondsRemaining(), 5, 'emergency Recall exposes the shared countdown');
  assert.deepEqual([e.x, e.y], [800, 900], 'Enemy returns to its authoritative home');
  assert(!e.aggro && !e.telegraph && !e.motion && !e.returning);
  assert.equal(g.zone().enemies.length, alive);
  assert.equal(g.s.statistics.deaths, deaths);
  assert.equal(hero.gold, gold);
  assert.deepEqual([hero.hp, ally.hp], hp);
  assert(g._emergencyWithdraw?.length > 0);
  const target = g._emergencyWithdraw[0].point;
  assert(Math.hypot(target.x - e.x, target.y - e.y) >
    Math.hypot(hero.x - e.x, hero.y - e.y),
    'Companion withdrawal is away from the danger instead of toward it');
  const start = { x: ally.x, y: ally.y };
  for (let i = 0; i < 22; i++) {
    g.s.time += 0.05;
    g.emergencyAdvanceWithdrawal();
  }
  assert(Math.hypot(ally.x - start.x, ally.y - start.y) > 0,
    'Protected withdrawal advances real movement and collision');
  assert.deepEqual([hero.hp, ally.hp], hp);
  assert.equal(g.s.recallExpiresAt, emergencyExpiry,
    'emergency withdrawal travel does not reset the Recall deadline');
  assert(g.recallSecondsRemaining() < 5 && g.recallSecondsRemaining() > 3.8,
    'emergency countdown follows simulation time');
  g.s.time = emergencyExpiry - 0.02;
  g.tick(0.05, { x: 0, y: 0 });
  assert.equal(g.s.recallActive, false, 'emergency-activated Recall expires on game time');
  assert.equal(g.s.recallExpiresAt, undefined, 'emergency timer cleans up at expiry');
  assert.equal(g.emergencyResetEncounter(), false, 'Once reset, no repeated reset');
}
{
  const { g, hero, ally } = fixture();
  const gold = hero.gold, hp = [hero.hp, ally.hp], deaths = g.s.statistics.deaths;
  const achievements = JSON.stringify(g.s.quests);
  assert(g.emergencyReturnToSafety());
  assert.equal(hero.gold, gold);
  assert.deepEqual([hero.hp, ally.hp], hp, 'Relocation does not heal or harm the party');
  assert.equal(g.s.statistics.deaths, deaths);
  assert.equal(JSON.stringify(g.s.quests), achievements);
  assert.equal(g.s.challenge.pending, false);
  assert.equal(g.s.challenge.gameOver, false);
  assert(g.zone().npcs.some(n => n.kind === 'rest' &&
    Math.hypot(hero.x - (n.servicePoint?.x ?? n.x),
      hero.y - (n.servicePoint?.y ?? n.y)) <= 100), 'Refuge arrival is safe');
}
{
  const { g, hero } = fixture();
  g.zone().buildings.push({ id: 'critical-camp', kind: 'barracks',
    x: 700, y: 780, progress: 4 });
  g.s.barracksRespawn = { zone: 'vale', id: 'critical-camp' };
  const hp = hero.hp, gold = hero.gold;
  assert(g.emergencyReturnToSafety());
  assert(Math.hypot(hero.x - 785, hero.y - 830) < 60,
    'Configured barracks recovery is preferred to refuge');
  assert.equal(hero.hp, hp);
  assert.equal(hero.gold, gold);
}


// The core restart sentinel is already supplied by PR #422 and tested in
// restart-recovery.test.cjs. This follow-up covers only live escalation.
{
  const { g } = fixture();
  const saved = new Map([[Persistence.saveKey('normal'), JSON.stringify(g.snapshot())]]);
  const app = shell('en', 'paladin', { storage: saved });
  const running = app.scope.Prototype.game;
  // Restoring a saved encounter may clear transient aggro: ensure a live
  // enemy exists so this deterministic stress fixture exercises reset.
  const enemy = running.zone().enemies.find(e => e.hp > 0 && !e.neutral);
  assert(enemy);
  enemy.aggro = true;
  enemy.telegraph = { kind: 'circle', timer: 20, total: 20 };
  let resets = 0, relocations = 0;
  const originalReset = running.emergencyResetEncounter.bind(running),
    originalReturn = running.emergencyReturnToSafety.bind(running);
  running.emergencyResetEncounter = () => { resets++; return originalReset(); };
  running.emergencyReturnToSafety = () => { relocations++; return originalReturn(); };
  app.frame(0);
  app.frame(700);
  assert(app.scope.Prototype.frameSkip.emergency);
  for (let now = 900; now <= 18000; now += 200) app.frame(now);
  assert.equal(resets, 1, 'A sustained near-freeze resets encounter once');
  assert.equal(relocations, 1, 'Continued near-freeze triggers one refuge fallback');
  assert.equal(running.s.statistics.deaths, 0);
  assert.equal(running.hero.hp, g.hero.hp);
  assert.equal(running.hero.gold, g.hero.gold);
  assert.equal(running.s.challenge.pending, false);
  const latest = JSON.parse(saved.get(Persistence.saveKey('normal')));
  assert.equal(latest.hero.hp, g.hero.hp);
  assert.equal(latest.statistics.deaths, 0);
}
// Severe freezes unrelated to combat still need an eventual last-resort
// fallback. With no engaged enemy, do not fabricate an encounter reset.
{
  const { g } = fixture();
  g.zone().enemies = [];
  const saved = new Map([[Persistence.saveKey('normal'), JSON.stringify(g.snapshot())]]);
  const app = shell('en', 'paladin', { storage: saved });
  const running = app.scope.Prototype.game;
  running.zone().enemies = [];
  let attempts = 0, relocations = 0;
  const reset = running.emergencyResetEncounter.bind(running),
    returnSafe = running.emergencyReturnToSafety.bind(running);
  running.emergencyResetEncounter = () => { attempts++; return reset(); };
  running.emergencyReturnToSafety = () => { relocations++; return returnSafe(); };
  app.frame(0);
  app.frame(700);
  for (let now = 900; now <= 17000; now += 200) app.frame(now);
  assert.equal(attempts, 1, 'One reset attempt, with no hostile targets');
  assert.equal(relocations, 1, 'Unresolved rendering-only stall reaches safe arrival');
  assert.equal(running.s.statistics.deaths, 0);
  assert.equal(running.hero.hp, g.hero.hp);
  assert.equal(running.hero.gold, g.hero.gold);
}
// Paused/menu time must not advance a still-pending emergency escalation.
// Resuming requires a new full interval of measured critical trouble.
{
  const { g } = fixture();
  const saved = new Map([[Persistence.saveKey('normal'), JSON.stringify(g.snapshot())]]);
  const app = shell('en', 'paladin', { storage: saved });
  const running = app.scope.Prototype.game;
  const enemy = running.zone().enemies.find(e => e.hp > 0 && !e.neutral);
  assert(enemy);
  enemy.aggro = true;
  let resetCalls = 0, relocations = 0;
  const originalReset = running.emergencyResetEncounter.bind(running),
    originalReturn = running.emergencyReturnToSafety.bind(running);
  running.emergencyResetEncounter = () => { resetCalls++; return originalReset(); };
  running.emergencyReturnToSafety = () => { relocations++; return originalReturn(); };
  app.frame(0);
  app.frame(700);
  for (let now = 900; now <= 6300; now += 200) app.frame(now);
  assert.equal(resetCalls, 1, 'First sustained episode already reset the encounter');
  assert.equal(running.s.recallActive, true, 'critical recovery enables the same visible Recall');
  app.scope.Prototype.updateHUD();
  const emergencyRecallButton = app.elements.get('recall-button');
  assert(emergencyRecallButton.classList.contains('recall-active'),
    'critical-recovery Recall receives the active button styling');
  assert(emergencyRecallButton.firstChild.textContent.includes('Recall ON'),
    'the emergency Recall uses the same visible ON label');
  assert.equal(emergencyRecallButton.getAttribute('aria-pressed'), 'true',
    'critical-recovery Recall exposes its pressed state to assistive input');
  app.elements.get('menu-button').click();
  app.frame(30000);
  assert.equal(relocations, 0, 'Time spent in menu is not an active freeze');
  app.elements.get('close-button').click();
  app.frame(30016);
  app.frame(30216);
  app.frame(30416);
  assert.equal(relocations, 0, 'A fresh brief stall after a menu does not teleport the party');
  assert.equal(running.s.statistics.deaths, 0);
}

// Regression: emergency encounters must finish the SAME cleanup as a
// completed native leash return, including scripted boss-phase state.
function stagedEnemy(game, family, form = 'normal', opts = {}) {
  const enemy = game.makeEnemy({
    family, species: family, name: 'Reset regression: ' + family,
    type: opts.type || 'boss', form, level: 12,
    hp: 400, damage: 25, gold: 0, xp: 0,
  }, { x: 390, y: 710 });
  enemy.home = { x: 830, y: 900 };
  enemy.aggro = true;
  enemy.telegraph = { kind: 'circle', timer: 8 };
  game.zone().enemies = [enemy];
  return enemy;
}
for (const form of ['normal', 'true']) {
  const g = new C('normal', 'paladin', () => 0.73);
  const e = stagedEnemy(g, 'darklord', form);
  Object.assign(e, {
    frenzy: true, frozen: true, heroParticipated: true, mercyProvoked: true,
    pursuitBurstUsed: true, secondWindUsed: true, secondWindCancelled: true,
    secondWindFacing: 3, royalTaxation: true, royalTaxShield: 75,
    royalPrerogativeReadyAt: 90, crownDecreeZone: 'crown',
    specialCd: 70, summonCd: 40, healCd: 25,
    trueEntourageSpawned: true, trueHalfSummonWave: true,
  });
  const summon = g.makeEnemy({
    family: 'darklord', type: 'mob', species: 'skeleton',
    name: 'Owned summon', level: 3, hp: 20, damage: 1, gold: 0, xp: 0,
  }, { x: 420, y: 720 });
  summon.summon = true;
  summon.owner = e.id;
  g.zone().enemies.push(summon);
  const hp = g.hero.hp, gold = g.hero.gold, deaths = g.s.statistics.deaths,
    stats = JSON.stringify(g.s.quests);
  assert.equal(g.emergencyResetEncounter(), true, 'Scripted ' + form + ' boss resets');
  assert.equal(e.aggro, false);
  assert.deepEqual([e.x, e.y], [e.home.x, e.home.y]);
  assert.equal(e.hp, e.baseHp);
  assert.equal(e.frozen, false);
  assert.equal(e.frenzy, false);
  for (const key of ['secondWindUsed', 'secondWindCancelled', 'secondWindFacing',
      'royalTaxation', 'royalTaxShield', 'royalPrerogativeReadyAt',
      'crownDecreeZone'])
    assert.equal(e[key], undefined, 'Dark Lord ' + form + ' clears ' + key);
  assert.equal(e.specialCd, 0);
  assert.equal(e.summonCd, 0);
  assert.equal(e.healCd, 0);
  assert.equal(e.heroParticipated, false);
  assert.equal(e.mercyProvoked, false);
  assert.equal(e.pursuitBurstUsed, false);
  assert.equal(e.trueEntourageSpawned, false);
  assert.equal(e.trueHalfSummonWave, false);
  assert(!g.zone().enemies.includes(summon), 'Boss-owned summon is dismissed');
  assert.equal(g.hero.hp, hp);
  assert.equal(g.hero.gold, gold);
  assert.equal(g.s.statistics.deaths, deaths);
  assert.equal(JSON.stringify(g.s.quests), stats);
}
{
  const g = new C('normal', 'paladin', () => 0.73);
  const captain = stagedEnemy(g, 'archive', 'normal', { type: 'mob' });
  Object.assign(captain, {
    captain: true, captainPhase: true, captainPhaseMove: 6,
    captainAttackRate: 3, captainGuard: 7, captainReflect: 5,
    captainPursuit: 3, captainOvertimeCd: 90,
    captainOpeningSummon: true, specialCd: 45, summonCd: 60,
  });
  assert(g.emergencyResetEncounter());
  assert.equal(captain.captainPhase, false);
  assert.equal(captain.captainPhaseMove, 1);
  assert.equal(captain.captainAttackRate, 1);
  assert.equal(captain.captainGuard, 0);
  assert.equal(captain.captainReflect, 0);
  assert.equal(captain.captainPursuit, 0);
  assert.equal(captain.captainOvertimeCd, 0);
  assert.equal(captain.captainOpeningSummon, false);
  assert.equal(captain.specialCd, 1.25, 'Captain starts with native cooldown');
  assert.equal(captain.summonCd, 0);
}
{
  const g = new C('normal', 'paladin', () => 0.73);
  stagedEnemy(g, 'mine');
  g.zone().props.push(
    { id: 'garun-critical-temporary', garunTemporary: true },
    { id: 'garun-critical-preview', garunPreview: true },
    { id: 'garun-permanent-landmark', decorative: true });
  assert(g.emergencyResetEncounter());
  assert(!g.zone().props.some(p => p.garunTemporary || p.garunPreview),
    'Emergency reset removes temporary Garun obstacles without relocation');
  assert(g.zone().props.some(p => p.id === 'garun-permanent-landmark'),
    'Unrelated authored scenery survives');
}
for (const family of ['thorn', 'cindermaw']) {
  const g = new C('normal', 'paladin', () => 0.73);
  if (family === 'cindermaw') assert.equal(g.enter('crown'), true);
  const e = stagedEnemy(g, family);
  e.thornLeg = 4;
  e.thornPause = 2.25;
  e.cinderStop = 3;
  e.cinderDestination = { x: 700, y: 760, i: 3, name: 'Next inspection' };
  e.cinderInspectionPause = 4;
  g.capturePatrolResume(e);
  const resume = g.patrolResume(e);
  assert(resume, family + ' captures pre-combat patrol identity');
  Object.assign(e, { x: 430, y: 730, returning: 1, 
    [family === 'thorn' ? 'thornReturn' : 'cinderReturn']: true });
  assert(g.emergencyResetEncounter());
  assert.deepEqual([e.x, e.y], [e.home.x, e.home.y]);
  assert.equal(e.aggro, false);
  assert.equal(e.returning, 0);
  assert.equal(e.thornReturn, undefined);
  assert.equal(e.cinderReturn, undefined);
  assert.equal(g.patrolResume(e), null, 'Old combat patrol checkpoint is retired');
  if (family === 'thorn') {
    assert.equal(e.thornLeg, resume.leg);
    assert.equal(e.thornPause, resume.pause);
  } else {
    assert.equal(e.cinderStop, resume.stop);
    assert.deepEqual(e.cinderDestination, resume.destination);
    assert.equal(e.cinderInspectionPause, resume.inspectionPause);
  }
}
{
  // The shared finishing method must remain used by ordinary disengagement,
  // not become a separately drifting emergency-only reset.
  const g = new C('normal', 'paladin', () => 0.73);
  const e = stagedEnemy(g, 'goblin', 'normal', { type: 'mob' });
  Object.assign(e, { frenzy: true, frozen: true, specialCd: 20, summonCd: 30 });
  g.disengage(e, 1.1);
  assert.equal(e.returning, 0);
  assert.equal(e.frenzy, false);
  assert.equal(e.frozen, false);
  assert.equal(e.specialCd, 0);
  assert.equal(e.summonCd, 0);
}

console.log('PASS critical escalation: no combat death, no HP loss, enemy reset, physical retreat and persistent-failure refuge fallback');
