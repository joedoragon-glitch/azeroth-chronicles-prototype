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
  assert.equal(g.emergencyResetEncounter(), true);
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
console.log('PASS critical escalation: no combat death, no HP loss, enemy reset, physical retreat and persistent-failure refuge fallback');
