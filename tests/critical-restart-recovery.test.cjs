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

const storage = new Map();
const store = {
  getItem: k => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
};
const persist = Persistence.create({ storage: store, Campaign: C });
{
  const { g } = fixture();
  assert(persist.save(g, { activeMode: 'normal', nightmareUnlocked: false, audio: {} }));
  const raw = storage.get(Persistence.saveKey('normal'));
  assert(persist.armEncounterRisk(g));
  const restored = persist.load('normal');
  assert(persist.needsCrashRescue(restored));
  assert.equal(raw, storage.get(Persistence.saveKey('normal')),
    'The marker never changes the latest validated v4 save');
  const originalHp = restored.hero.hp, deaths = restored.s.statistics.deaths,
    gold = restored.hero.gold;
  assert(restored.emergencyReturnToSafety());
  assert.equal(restored.hero.hp, originalHp);
  assert.equal(restored.hero.gold, gold);
  assert.equal(restored.s.statistics.deaths, deaths);
  assert(persist.save(restored, { activeMode: 'normal', audio: {} }));
  assert(persist.clearEncounterRisk());
  assert(!persist.needsCrashRescue(restored));
}
{
  const { g } = fixture(true);
  g.s.challenge.pending = true;
  assert.equal(g.emergencyReturnToSafety(), false);
  assert.equal(persist.armEncounterRisk(g), false);
  g.s.challenge.pending = false;
  g.hero.hp = 0;
  assert.equal(g.emergencyReturnToSafety(), false, 'Legitimate death remains untouched');
  assert.equal(persist.armEncounterRisk(g), false);
}
{
  // A previously saved active encounter + unclean marker boots at the refuge.
  const { g } = fixture();
  const originalHp = g.hero.hp, originalGold = g.hero.gold;
  const sessionStorage = new Map([
    [Persistence.saveKey('normal'), JSON.stringify(g.snapshot())],
    [Persistence.encounterRiskKey, JSON.stringify({
      v: 1, mode: 'normal', heroClass: 'paladin', zone: 'vale', seenAt: Date.now(),
    })],
  ]);
  const restarted = shell('en', 'paladin', { storage: sessionStorage });
  const reloaded = restarted.scope.Prototype.game;
  assert(!reloaded.manaCombatActive(), 'Interrupted encounter is not rejoined on boot');
  assert.equal(reloaded.hero.hp, originalHp);
  assert.equal(reloaded.hero.gold, originalGold);
  assert.equal(reloaded.s.statistics.deaths, 0);
  assert.equal(sessionStorage.get(Persistence.encounterRiskKey), '',
    'Successful safe recovery consumes the crash marker');
  assert.equal(
    JSON.parse(sessionStorage.get(Persistence.saveKey('normal'))).hero.hp,
    originalHp, 'Latest campaign save is kept and rewritten at the safe location');
}
{
  // A clean close explicitly disarms the marker, permitting ordinary in-place
  // resume, while a total JS freeze cannot execute that clean-close handler.
  const app = shell('en');
  const game = app.scope.Prototype.game;
  const e = game.zone().enemies.find(x => x.hp > 0 && !x.neutral);
  assert(e);
  e.aggro = true;
  e.x = game.hero.x + 50;
  e.y = game.hero.y;
  app.frame(33);
  assert(app.storage.get(Persistence.encounterRiskKey), 'Active encounter arms restart guard');
  const pagehide = app.events.pagehide;
  assert(pagehide?.length);
  pagehide[0]();
  assert.equal(app.storage.get(Persistence.encounterRiskKey), '',
    'Clean close does not falsely redirect the next launch');
}
{
  // Repeated sustained emergency frames escalate to encounter reset and then
  // safe refuge, without any actual death transition or save-format changes.
  const { g } = fixture();
  const saved = new Map([[Persistence.saveKey('normal'), JSON.stringify(g.snapshot())]]);
  const app = shell('en', 'paladin', { storage: saved });
  const running = app.scope.Prototype.game;
  let reset = 0, returnHome = 0;
  const originalReset = running.emergencyResetEncounter.bind(running),
    originalReturn = running.emergencyReturnToSafety.bind(running);
  running.emergencyResetEncounter = () => { reset++; return originalReset(); };
  running.emergencyReturnToSafety = () => { returnHome++; return originalReturn(); };
  app.frame(0);
  for (let now = 700; now <= 18000; now += 200) app.frame(now);
  assert.equal(reset, 1, 'Encounter is reset once after sustained critical trouble');
  assert.equal(returnHome, 1, 'Persistent failure then uses last-resort refuge');
  assert.equal(running.s.statistics.deaths, 0);
  assert.equal(running.hero.gold, g.hero.gold);
  assert.equal(running.hero.hp, g.hero.hp);
  assert.equal(saved.get(Persistence.encounterRiskKey), '',
    'Last-resort relocation is saved and the restart marker cleared');
}
console.log('PASS critical restart: legitimate death/succession preserved, clean close, unclean reboot, encounter reset, withdrawal and refuge fallback');
