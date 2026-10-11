'use strict';
const fs = require('node:fs');
const C = require('../src/prototype/engine');
const assert = require('node:assert/strict');
const path = require('node:path');
const outputDir =
  process.env.BETA_NATURAL_OUTPUT || path.join(__dirname, '../test-results/readiness');
fs.mkdirSync(outputDir, { recursive: true });
const c = new C('normal', 'ranger', () => 0.9);
const sourceCommit = require('node:child_process')
  .execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
  .trim();
let checkpointIndex = 0;
let outcome = 'INCOMPLETE';
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  events = [];
function record(label) {
  const h = c.hero;
  const r = {
    label,
    time: +c.s.time.toFixed(1),
    zone: c.zoneId,
    xy: [Math.round(h.x), Math.round(h.y)],
    hp: Math.round(h.hp),
    level: h.level,
    crowns: h.gold,
    kills: c.s.statistics.kills,
    deaths: c.s.statistics.deaths,
    party: c.s.party.map((u) => Math.round(u.hp)),
    rescued: Object.keys(c.s.rescued),
  };
  events.push(r);
  fs.writeFileSync(
    path.join(outputDir, String(checkpointIndex++).padStart(2, '0') + '-save.json'),
    JSON.stringify(c.snapshot(), null, 2),
  );
  console.log(JSON.stringify(r));
}
function tick() {
  c.tick(0.1);
  c.effects.length = 0;
  while (c.hero.talentPoints > 0) {
    if (!c.talent(0) && !c.talent(2) && !c.talent(1)) break;
  }
}
function near() {
  return c
    .zone()
    .enemies.filter((e) => e.hp > 0 && !e.neutral && dist(e, c.hero) < 420)
    .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
}
// Instrumented controller: reads geometry, issues ordinary casts/movement only.
// This is not a browser perception test or evidence of human playability.
function danger(p, e) {
  let risk = 0;
  for (const u of c.zone().enemies.filter((u) => u.hp > 0 && !u.neutral)) {
    const d = dist(p, u);
    if (d < 150) risk += (150 - d) * 5;
    const a = u.telegraph || u.motion;
    if (!a || a.kind === 'summon' || a.bossHeal) continue;
    if (a.kind === 'circle' && c.attackPatches(a).some((q) => dist(p, q) < (q.radius || 120) + 40))
      risk += 1500;
    if (a.kind === 'line' && c.distanceToSegment(p, { x: a.fromX, y: a.fromY }, a) < 100)
      risk += 1500;
    if (a.kind === 'cone' && d < (a.radius || 250) + 40) {
      const delta = Math.atan2(
        Math.sin(Math.atan2(p.y - u.y, p.x - u.x) - a.angle),
        Math.cos(Math.atan2(p.y - u.y, p.x - u.x) - a.angle),
      );
      if (Math.abs(delta) < 1.2) risk += 1500;
    }
  }
  for (const q of c.s.projectiles.filter((q) => q.source === 'enemy')) {
    const end = { x: q.x + q.dx * q.speed * 0.4, y: q.y + q.dy * q.speed * 0.4 };
    if (c.distanceToSegment(p, q, end) < 45) risk += 500;
  }
  return risk + Math.abs(dist(p, e) - 310) * 0.5;
}
function fight(e, seconds = 180) {
  const deaths = c.s.statistics.deaths;
  for (let i = 0; i < seconds * 10 && e.hp > 0; i++) {
    if (c.s.statistics.deaths > deaths) return false;
    // Adds take priority once they are close; no target HP or position writes.
    const close = near();
    const target = close && close !== e && dist(close, c.hero) < 220 ? close : e;
    c.cast(1, target.id);
    if (c.hero.skills[1]) c.cast(2, target.id);
    if (c.hero.skills[2] && c.hero.hp < c.hero.maxHp * 0.8) c.cast(3, target.id);
    if (dist(c.hero, e) > 430 || !c.line(c.hero, e)) {
      c.hero.order = { type: 'attack', id: e.id };
    } else {
      let best = { x: c.hero.x, y: c.hero.y },
        score = danger(best, e);
      for (let k = 0; k < 16; k++) {
        const angle = (k * Math.PI) / 8;
        const p = { x: c.hero.x + Math.cos(angle) * 80, y: c.hero.y + Math.sin(angle) * 80 };
        if (c.blocked(p.x, p.y, c.zoneId, 16) || !c.line(c.hero, p) || !c.line(p, e)) continue;
        const next = danger(p, e) + 8;
        if (next < score) {
          best = p;
          score = next;
        }
      }
      c.hero.order = { type: 'move', ...best };
    }
    tick();
  }
  return e.hp <= 0;
}
function walk(p, combat = true, seconds = 100) {
  const deaths = c.s.statistics.deaths;
  for (let i = 0; i < seconds * 10; i++) {
    if (dist(c.hero, p) < 65) return true;
    if (c.s.statistics.deaths > deaths) return false;
    const e = combat && near();
    if (e && e.aggro && dist(e, c.hero) < 360) {
      if (!fight(e)) return false;
    }
    c.hero.order = { type: 'move', x: p.x, y: p.y };
    tick();
  }
  return false;
}
function visit(id) {
  const n = c.zone().npcs.find((n) => n.id === id);
  if (!n || !walk(n)) throw Error('visit failed ' + id);
  c.interact(n);
  record(id);
}
function rest() {
  const n = c
    .zone()
    .npcs.filter((n) => n.kind === 'rest')
    .sort((a, b) => dist(a.servicePoint || a, c.hero) - dist(b.servicePoint || b, c.hero))[0];
  if (!walk(n.servicePoint || n, false)) return false;
  for (let i = 0; i < 1000; i++) {
    if (c.rest()) return true;
    tick();
  }
  return false;
}
record('fresh');
let checkpointResult = null;
try {
  c.build();
  for (let i = 0; i < 300; i++) tick();
  record('natural construction');
  for (const id of ['goblin-camp', 'orchard', 'mill-pond']) {
    visit(id);
    if (c.hero.hp < c.hero.maxHp * 0.85 || c.s.party.some((u) => u.hp < u.maxHp * 0.6)) {
      rest();
      record('rest');
    }
  }
  const original = c.snapshot(),
    bytes = JSON.stringify(original);
  const restored = C.restore(original, () => 0.9);
  assert.equal(JSON.stringify(original), bytes, 'original snapshot preserved');
  for (const key of ['gold', 'level', 'xp', 'skills', 'weapon', 'armorTier'])
    assert.deepEqual(restored.hero[key], c.hero[key], key);
  assert.deepEqual(restored.s.quests, c.s.quests);
  assert.deepEqual(
    restored.s.party.map((u) => [u.id, u.hp, u.maxHp, u.active]),
    c.s.party.map((u) => [u.id, u.hp, u.maxHp, u.active]),
  );
  checkpointResult =
    'PASS earned-state save restore: money, XP, skills, equipment, quests, living/fallen party; original unchanged';
  fs.writeFileSync(path.join(outputDir, 'earned-checkpoint.json'), bytes);
  // Fight nearby ordinary packs to earn preparation; do not manufacture XP or crowns.
  for (let j = 0; j < 18 && c.hero.level < 6; j++) {
    const e = c
      .zone()
      .enemies.filter((e) => e.hp > 0 && !e.neutral && e.type === 'mob' && !e.guard)
      .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
    if (!e) break;
    if (!fight(e)) {
      record('combat stopped');
      break;
    }
    for (const l of [...c.s.loot].filter((l) => l.zone === c.zoneId && dist(l, c.hero) < 400))
      walk(l);
    if (c.hero.hp < c.hero.maxHp * 0.85 || c.s.party.some((u) => u.hp < u.maxHp * 0.6)) rest();
  }
  record('earned preparation');
  rest();
  const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
  if (recruiter && walk(recruiter)) {
    while (c.s.party.some((u) => u.hp <= 0) && c.recover())
      record('paid companion recovery at town captain');
  }
  record('boss departure');
  const boss = c.zone().enemies.find((e) => e.family === 'thorn');
  if (!fight(boss, 240)) throw Error('Thornfang not defeated by pilot');
  record('Thornfang defeated');
  visit('cage-thorn');
  const teacher = c.zone().npcs.find((n) => n.kind === 'teacher' && n.family === 'thorn');
  if (!walk(teacher)) throw Error('teacher unreachable');
  for (const slot of c.teacherCatalog('thorn').learn) c.learn(slot, 'thorn');
  c.trainExpedition('thorn');
  record('training actions');
  outcome = 'PASS Thornfang defeated and Mira rescued by earned actions';
} catch (e) {
  outcome = 'INCOMPLETE: ' + e.message;
  record(e.message);
}
const report = {
  outcome,
  checkpointResult,
  sourceCommit,
  releasedSourceCommit: 'd7d2c22485b08265b31bf595305ef952b40b72cd',
  mode: c.s.mode,
  class: c.hero.class,
  provenance:
    'Fresh current-engine automated action pilot; fixed RNG 0.9; only movement/attack orders and public player actions; no resource/stat/kill/position injection; instrumented geometry-aware controller, not browser UI, human or historical player save',
  events,
  final: {
    quests: c.s.quests,
    statistics: { ...c.s.statistics, events: undefined },
    skills: c.hero.skills,
    barracks: c.zone().buildings.map((b) => ({ progress: b.progress, full: b.full })),
    thornHp: c.zone().enemies.find((e) => e.family === 'thorn')?.hp,
  },
};
fs.writeFileSync(path.join(outputDir, 'earned-thorn-report.json'), JSON.stringify(report, null, 2));
