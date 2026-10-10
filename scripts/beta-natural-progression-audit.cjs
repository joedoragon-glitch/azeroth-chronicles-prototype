'use strict';
const fs = require('node:fs');
const C = require('../src/prototype/engine');
const assert = require('node:assert/strict');
const path = require('node:path');
const outputDir =
  process.env.BETA_NATURAL_OUTPUT || path.join(__dirname, '../test-results/readiness');
fs.mkdirSync(outputDir, { recursive: true });
const c = new C(process.argv[2] || 'normal', process.argv[3] || 'ranger', () => 0.9);
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
function fight(e, seconds = 180) {
  const deaths = c.s.statistics.deaths;
  let stage, goal;
  for (let i = 0; i < seconds * 10 && e.hp > 0; i++) {
    if (c.s.statistics.deaths > deaths) return false;
    const a = e.telegraph || e.motion;
    c.cast(1, e.id);
    if (c.hero.skills[1]) c.cast(2, e.id);
    if (c.hero.skills[2] && c.hero.hp < c.hero.maxHp * 0.8) c.cast(3, e.id);
    if (a && a.kind !== 'summon') {
      if (stage !== a) {
        stage = a;
        const angle = Math.atan2(c.hero.y - e.y, c.hero.x - e.x);
        goal =
          a.kind === 'cone'
            ? c.safe(e.x + Math.cos(angle) * 230, e.y + Math.sin(angle) * 230)
            : c.safe(
                a.x + Math.cos((a.angle || 0) + Math.PI / 2) * 210,
                a.y + Math.sin((a.angle || 0) + Math.PI / 2) * 210,
              );
      }
      c.hero.order = { type: 'move', ...goal };
    } else c.hero.order = { type: 'attack', id: e.id };
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
    if (c.hero.hp < c.hero.maxHp * 0.65) {
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
  if (!process.argv.includes('--boss-attempt'))
    throw Error('early earned-state pilot complete; whole campaign NOT RUN');
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
    if (c.hero.hp < c.hero.maxHp * 0.7) rest();
  }
  record('earned preparation');
  rest();
  const boss = c.zone().enemies.find((e) => e.family === 'thorn');
  if (!fight(boss, 240)) throw Error('Thornfang not defeated by pilot');
  record('Thornfang defeated');
  visit('cage-thorn');
  const teacher = c.zone().npcs.find((n) => n.kind === 'teacher' && n.family === 'thorn');
  if (!walk(teacher)) throw Error('teacher unreachable');
  for (const slot of c.teacherCatalog('thorn').learn) c.learn(slot, 'thorn');
  c.trainExpedition('thorn');
  record('paid training');
} catch (e) {
  record(e.message);
}
const report = {
  checkpointResult,
  sha: '6c2381b34ce63fb935936a4e69ec404996f7765a',
  mode: c.s.mode,
  class: c.hero.class,
  provenance:
    'Fresh current-engine automated action pilot; fixed RNG 0.9; only movement/attack orders and public player actions; no resource/stat/kill/position injection; not human or historical save',
  events,
  final: {
    quests: c.s.quests,
    statistics: { ...c.s.statistics, events: undefined },
    skills: c.hero.skills,
    barracks: c.zone().buildings.map((b) => ({ progress: b.progress, full: b.full })),
    thornHp: c.zone().enemies.find((e) => e.family === 'thorn')?.hp,
  },
};
fs.writeFileSync(
  path.join(outputDir, 'natural-' + c.s.mode + '-' + c.hero.class + '.json'),
  JSON.stringify(report, null, 2),
);
