'use strict';
const fs = require('node:fs');
const C = require('../src/prototype/engine');
const assert = require('node:assert/strict');
const path = require('node:path');
const outputDir =
  process.env.BETA_NATURAL_OUTPUT || path.join(__dirname, '../test-results/readiness');
fs.mkdirSync(outputDir, { recursive: true });
const inputPath = process.env.BETA_RESUME;
if (!inputPath)
  throw Error(
    'BETA_RESUME must name an earned save; this controller never creates boosted fixtures',
  );
const inputBytes = fs.readFileSync(inputPath);
const inputHash = require('node:crypto').createHash('sha256').update(inputBytes).digest('hex');
const c = C.restore(JSON.parse(inputBytes), () => 0.9);
const D = require('../src/prototype/data');
const route = process.argv[2] || 'crypt';
const trace = [];
const watch = new Set([
  'bossDefeat',
  'rescue',
  'learning',
  'upgrade',
  'purchase',
  'travel',
  'awakening',
  'death',
  'expeditionRank',
]);
function capture() {
  for (const e of c.effects)
    if (watch.has(e.type)) {
      const entry = { time: +c.s.time.toFixed(1), zone: c.zoneId, ...e };
      trace.push(entry);
      console.log(JSON.stringify(entry));
    }
  c.effects.length = 0;
}
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
    phase: c.s.phase,
    normal: c.s.normal,
    true: c.s.true,
    skills: [...h.skills],
    weapon: h.weapon,
    armorTier: h.armorTier,
    expeditionRank: c.s.expeditionRank,
    messages: [...c.messages],
  };
  events.push(JSON.parse(JSON.stringify(r)));
  capture();
  fs.writeFileSync(
    path.join(outputDir, String(checkpointIndex++).padStart(2, '0') + '-save.json'),
    JSON.stringify(c.snapshot(), null, 2),
  );
  console.log(JSON.stringify(r));
}
function tick() {
  c.tick(0.1);
  capture();
  while (c.hero.talentPoints > 0) {
    if (!c.talent(0) && !c.talent(2) && !c.talent(1) && !c.talent(3)) break;
  }
}
function near() {
  return c
    .zone()
    .enemies.filter((e) => e.hp > 0 && !e.neutral && !e.returning && dist(e, c.hero) < 420)
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
  const deaths = c.s.statistics.deaths,
    started = c.s.time;
  let lastHp = e.hp,
    lastProgress = c.s.time;
  for (let i = 0; i < seconds * 10 && e.hp > 0; i++) {
    if (e.hp < lastHp) {
      lastProgress = c.s.time;
      lastHp = e.hp;
    }
    if (c.s.time - lastProgress > 35 && dist(c.hero, e) < 430) {
      record(
        'combat no-progress: ' +
          e.name +
          ' ' +
          e.id +
          ' hp=' +
          Math.round(e.hp) +
          ' at ' +
          Math.round(e.x) +
          ',' +
          Math.round(e.y),
      );
      return false;
    }
    if (c.s.statistics.deaths > deaths) return false;
    if (!c.zone().enemies.includes(e)) {
      record('combat target removed by engine: ' + e.id);
      return false;
    }
    // Adds take priority once they are close; no target HP or position writes.
    const close = near();
    const target = close && close !== e && dist(close, c.hero) < 220 ? close : e;
    c.cast(1, target.id);
    for (const slot of [2, 6, 5, 7, 8]) if (c.hero.skills[slot - 1]) c.cast(slot, target.id);
    if (c.hero.skills[3] && dist(target, c.hero) < 130) c.cast(4, target.id);
    if (c.hero.skills[2] && c.hero.hp < c.hero.maxHp * 0.8) c.cast(3, target.id);
    if (dist(c.hero, e) > 430 || !c.line(c.hero, e)) {
      c.hero.order = !c.line(c.hero, e)
        ? { type: 'move', x: e.x, y: e.y }
        : { type: 'attack', id: e.id };
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
  if (e.hp > 0)
    record(
      'combat timeout: ' +
        e.name +
        ' ' +
        e.id +
        ' hp=' +
        Math.round(e.hp) +
        ' elapsed=' +
        Math.round(c.s.time - started),
    );
  return e.hp <= 0;
}
function walk(p, combat = true, seconds = 100, arrival = 65) {
  const deaths = c.s.statistics.deaths;
  for (let i = 0; i < seconds * 10; i++) {
    if (dist(c.hero, p) < arrival) return true;
    if (c.s.statistics.deaths > deaths) return false;
    const e = combat && near();
    if (e && e.aggro && dist(e, c.hero) < 360) {
      if (!fight(e) && c.zone().enemies.includes(e)) return false;
    }
    c.hero.order = { type: 'move', x: p.x, y: p.y };
    tick();
  }
  return false;
}
function visit(id) {
  const n = c.zone().npcs.find((n) => n.id === id);
  if (!n || !walk(n)) throw Error('visit failed ' + id);
  if (!c.interact(n)) throw Error('interaction rejected ' + id + ' ' + c.messages.at(-1));
  record(id);
}
function rest() {
  if (c.hero.hp >= c.hero.maxHp && c.s.party.every((u) => u.hp <= 0 || u.hp >= u.maxHp))
    return true;
  const n = c
    .zone()
    .npcs.filter((n) => n.kind === 'rest')
    .sort((a, b) => dist(a.servicePoint || a, c.hero) - dist(b.servicePoint || b, c.hero))[0];
  if (!n || !walk(n.servicePoint || n, false)) return false;
  for (let i = 0; i < 1000; i++) {
    if (c.rest()) return true;
    tick();
  }
  return false;
}

function approach(n) {
  if (!n || !walk(n.servicePoint || n)) throw Error('cannot reach ' + (n?.id || 'missing NPC'));
  if (dist(c.hero, n.servicePoint || n) > 115) throw Error('service out of reach');
}
function services() {
  for (const n of [...c.zone().npcs].filter((n) => n.kind === 'teacher' && c.s.rescued[n.family])) {
    approach(n);
    const catalog = c.teacherCatalog(n.family);
    for (const slot of catalog.learn) if (!c.hero.skills[slot - 1]) c.learn(slot, n.family);
    while (c.trainExpedition(n.family)) capture();
    for (const slot of [1, 2])
      while (
        c.hero.gold - c.skillTrainingCost(slot, c.hero.skills[slot - 1]) >= 120 &&
        c.upgrade(slot, n.family)
      )
        capture();
    record('teacher service ' + n.family);
  }
  for (const n of [...c.zone().npcs].filter((n) => n.kind === 'smith' && c.s.rescued[n.family])) {
    approach(n);
    for (const slot of ['weapon', 'armor']) c.gear(n.family, slot);
    record('smith service ' + n.family);
  }
  const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
  if (recruiter) {
    approach(recruiter);
    while (c.s.party.some((u) => u.hp <= 0) && c.recover()) capture();
    if (c.rosterCount() < 3 && c.hero.gold > 120) c.recruit('archer');
    record('town party service');
  }
  rest();
  record('rest before departure');
}
function earnPreparation() {
  const node = c
    .zone()
    .nodes.filter((n) => n.amount > 0 && c.tributeKnown(n))
    .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
  approach(node);
  const before = c.hero.gold,
    deaths = c.s.statistics.deaths;
  if (!c.gather(node.id)) throw Error('resource assignment rejected');
  record('resource gathering assigned ' + node.id);
  for (let i = 0; i < 2400 && c.hero.gold < 360; i++) {
    if (c.s.statistics.deaths > deaths) throw Error('defeated during gathering');
    const enemy = near();
    if (enemy?.aggro) {
      c.cast(1, enemy.id);
      if (c.hero.skills[1]) c.cast(2, enemy.id);
    }
    if (c.hero.skills[2] && c.hero.hp < c.hero.maxHp * 0.8) c.cast(3);
    tick();
    if (i % 300 === 299) record('gathering progress');
  }
  c.recallParty();
  record('resource deposits earned ' + (c.hero.gold - before) + ' crowns');
}
function collectLocalLoot() {
  for (const l of [...c.s.loot].filter((l) => l.zone === c.zoneId && dist(l, c.hero) < 300))
    if (!walk(l)) break;
}
function defeatAndRescue(family) {
  const def = D.bosses.find((b) => b.id === family);
  if (!def) throw Error('unknown boss ' + family);
  if (def.kind === 'dungeon' && c.zoneId !== family) {
    const door = c.zone().npcs.find((n) => n.kind === 'dungeon' && n.family === family);
    approach(door);
    if (!c.interact(door) || c.zoneId !== family) throw Error('entry failed ' + family);
    record('entered ' + family);
  }
  const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.family === family && e.hp > 0);
  if (boss) {
    record('encounter approach ' + family + ' ' + boss.form);
    if (!walk(boss, true, 180, 420)) throw Error('approach incomplete ' + family);
    if (!fight(boss, 300)) throw Error('encounter incomplete ' + family);
    capture();
    record('encounter completed ' + family + ' ' + boss.form);
  } else if (!c.s.normal[family] && !c.s.true[family]) throw Error('boss missing ' + family);
  collectLocalLoot();
  const captive = c.zone().npcs.find((n) => n.kind === 'cage' && n.family === family);
  if (captive && !c.s.rescued[family]) {
    approach(captive);
    if (!c.interact(captive) || !c.s.rescued[family]) throw Error('rescue failed ' + family);
    record('rescued ' + family);
  }
  if (def.kind === 'dungeon') {
    const exit = c.zone().npcs.find((n) => n.kind === 'exit');
    approach(exit);
    if (!c.interact(exit) || c.zoneId !== def.region) throw Error('exit failed ' + family);
    record('returned from ' + family);
  }
}
function travelOnward() {
  const n = c.zone().npcs.find((n) => n.kind === 'transport' && n.direction === 1);
  approach(n);
  const from = c.zoneId,
    gold = c.hero.gold,
    fare = c.travelFare(c.regionIndex(), 1);
  if (!c.travel(1)) throw Error('travel failed ' + from + ' ' + c.messages.at(-1));
  assert.equal(c.hero.gold, gold - fare, 'actual fare');
  record('paid transport from ' + from);
}
function verifySave() {
  const original = c.snapshot(),
    bytes = JSON.stringify(original),
    restored = C.restore(original, () => 0.9);
  for (const key of ['gold', 'level', 'xp', 'skills', 'weapon', 'armorTier', 'reforges', 'talents'])
    assert.deepEqual(restored.hero[key], c.hero[key], key);
  for (const key of ['normal', 'true', 'rescued', 'quests', 'expeditionRank', 'tickets', 'phase'])
    assert.deepEqual(restored.s[key], c.s[key], key);
  assert.deepEqual(
    restored.s.party.map((u) => [u.id, u.hp, u.maxHp, u.active]),
    c.s.party.map((u) => [u.id, u.hp, u.maxHp, u.active]),
  );
  assert.equal(JSON.stringify(original), bytes, 'input save unchanged');
  assert.equal(
    require('node:crypto').createHash('sha256').update(fs.readFileSync(inputPath)).digest('hex'),
    inputHash,
    'resume original unchanged',
  );
  fs.writeFileSync(path.join(outputDir, 'final-save.json'), bytes);
  return 'PASS earned save restores progression, economy, equipment, skills, party, quests and transport; originals unchanged';
}
record('resumed earned campaign');
try {
  services();
  const routes = {
    prepare: [],
    crypt: ['crypt'],
    march: ['mire', 'archive'],
    highlands: ['ridge', 'mine'],
    frontier: ['warlord', 'abyss'],
    crown: ['cindermaw', 'citadel', 'darklord'],
  };
  const targets = routes[route];
  if (!targets) throw Error('unknown route ' + route);
  const region = targets.length ? D.bosses.find((b) => b.id === targets[0]).region : c.zoneId;
  if (route === 'prepare') {
    earnPreparation();
    services();
    const alchemist = c.zone().npcs.find((n) => n.family === 'archive' && n.kind === 'alchemist');
    if (alchemist) {
      approach(alchemist);
      c.trainRangerSupport('health', 'archive');
      record('paid Ranger Heal training');
    }
  }
  if (c.zoneId !== region) {
    travelOnward();
    if (c.zoneId !== region) throw Error('unexpected arrival');
    services();
  }
  for (const family of targets) {
    defeatAndRescue(family);
    services();
  }
  outcome = 'PASS route ' + route + ' (engine actions only)';
} catch (e) {
  outcome = 'INCOMPLETE: ' + e.message;
  record(outcome);
}
let restoreResult;
try {
  restoreResult = verifySave();
} catch (e) {
  restoreResult = 'FAIL ' + e.message;
  outcome = 'INCOMPLETE: save verification';
}
record('final');
fs.writeFileSync(
  path.join(outputDir, 'report.json'),
  JSON.stringify(
    {
      outcome,
      restoreResult,
      sourceCommit,
      releasedRuntime: 'd7d2c22485b08265b31bf595305ef952b40b72cd',
      inputPath,
      inputHash,
      route,
      provenance:
        'Resume of earned Normal Ranger fixed RNG 0.9; instrumented engine actions, not UI/physical/historical player-save acceptance',
      events,
      trace,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ outcome, restoreResult }));
