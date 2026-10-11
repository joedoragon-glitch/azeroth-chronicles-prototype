'use strict';
const fs = require('node:fs');
const C = require('../src/prototype/engine');
const assert = require('node:assert/strict');
const path = require('node:path');
const outputDir =
  process.env.BETA_NATURAL_OUTPUT || path.join(__dirname, '../test-results/readiness');
fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(__filename, path.join(outputDir, 'controller.cjs'));
const inputPath = process.env.BETA_RESUME;
if (!inputPath)
  throw Error(
    'BETA_RESUME must name an earned save; this controller never creates boosted fixtures',
  );
const inputBytes = fs.readFileSync(inputPath);
const inputHash = require('node:crypto').createHash('sha256').update(inputBytes).digest('hex');
const c = C.restore(JSON.parse(inputBytes), () => 0.9);
const D = require('../src/prototype/data');
const R = require('../src/prototype/rules');
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
let nextHeartbeat = c.s.time + 60;
let healHeldAt = null;
function healParty() {
  if (!c.hero.skills[2] || c.hero.cd[2] > 0) {
    healHeldAt = null;
    return;
  }
  const wounded = c.activeLivingParty().some((u) => u.hp < u.maxHp * 0.8);
  if (wounded) {
    if (healHeldAt === null) healHeldAt = c.s.time;
    if (c.s.time - healHeldAt >= R.chargedSkills.holdSeconds) {
      c.cast(3, undefined, true);
      healHeldAt = null;
    }
  } else {
    healHeldAt = null;
    if (c.hero.hp < c.hero.maxHp * 0.8) c.cast(3);
  }
}
function tick() {
  healParty();
  c.tick(0.1);
  if (c.s.time >= nextHeartbeat) {
    nextHeartbeat = c.s.time + 60;
    record('campaign heartbeat');
  }
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
let trapCacheTime = -1,
  trapCache = [];
function danger(p, e) {
  let risk = 0;
  if (trapCacheTime !== c.s.time) {
    trapCacheTime = c.s.time;
    trapCache = c.traps();
  }
  for (const t of trapCache) {
    const expanded = { ...t, radius: t.radius + 35, halfWidth: t.halfWidth + 30 };
    if (c.trapContains(expanded, p)) risk += 2500;
  }
  for (const a of c.s.hazards) {
    if (a.kind === 'ring') {
      const radius = (a.age + 0.3) * R.combatGeometry.ringSpeed;
      if (Math.abs(dist(p, a) - radius) < 75) risk += 2000;
    } else if (dist(p, a) < a.radius + 35) risk += 2200;
  }
  for (const u of c.zone().enemies.filter((u) => u.hp > 0 && !u.neutral)) {
    const d = dist(p, u);
    if (d < 150) risk += (150 - d) * 5;
    const a = u.telegraph || u.motion;
    if (!a || a.kind === 'summon' || a.bossHeal) continue;
    if (a.kind === 'circle' && c.attackPatches(a).some((q) => dist(p, q) < (q.radius || 120) + 40))
      risk += 1500;
    if (a.kind === 'line' && c.distanceToSegment(p, { x: a.fromX, y: a.fromY }, a) < 100)
      risk += 1500;
    if (
      a.kind === 'ring' &&
      d <
        R.combatGeometry.ringSpeed * R.combatGeometry.ringLife * R.bossCadence.areaRangeMultiplier +
          45
    )
      risk += 1800;
    if (['cone', 'sector'].includes(a.kind) && d < (a.radius || 250) + 40) {
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
  const territory = e.type === 'boss' ? (c.isDungeon() ? 1600 : 600) : e.fieldCaptain ? 750 : 380;
  if (e.home) risk += Math.max(0, dist(p, e.home) - territory) * 20;
  return risk + Math.abs(dist(p, e) - 310) * 0.5;
}
function fight(e, seconds = 180) {
  const deaths = c.s.statistics.deaths,
    started = c.s.time;
  let lastHp = e.hp,
    lastProgress = c.s.time;
  if (e.type === 'boss') record('boss combat started ' + e.family + ':' + e.form);
  for (let i = 0; i < seconds * 10 && e.hp > 0; i++) {
    if (e.hp < lastHp) {
      lastProgress = c.s.time;
      lastHp = e.hp;
    }
    if (c.s.time - lastProgress > 35) {
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
    if (c.s.statistics.deaths > deaths) {
      record('combat defeat ' + e.name + ' minimum observed HP=' + Math.round(lastHp));
      return false;
    }
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
    healParty();
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
  const deaths = c.s.statistics.deaths,
    started = c.s.time;
  for (let i = 0; i < seconds * 10; i++) {
    if (dist(c.hero, p) < arrival) return true;
    healParty();
    if (!combat && c.hero.skills[3] && c.hero.hp < c.hero.maxHp * 0.65) c.cast(4);
    if (c.s.time - started > seconds) {
      record('travel approach time budget exhausted');
      return false;
    }
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
  if (!n || !walk(n.servicePoint || n, false, 60, 105)) return false;
  for (let i = 0; i < 1000; i++) {
    if (c.rest()) return true;
    if (c.hero.hp >= c.hero.maxHp && c.activeLivingParty().every((u) => u.hp >= u.maxHp)) {
      record('party healed while waiting for refuge cooldown');
      return true;
    }
    tick();
  }
  return false;
}

function approach(n, combat = true) {
  if (!n || !walk(n.servicePoint || n, combat, 100, 105))
    throw Error('cannot reach ' + (n?.id || 'missing NPC'));
  if (dist(c.hero, n.servicePoint || n) > 115) throw Error('service out of reach');
}
function services() {
  const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
  if (recruiter) {
    approach(recruiter, false);
    while (c.s.party.some((u) => u.hp <= 0) && c.recover()) capture();
    if (c.rosterCount() < 3 && c.hero.gold > 120) c.recruit('archer');
    record('town party service');
  }

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
  rest();
  record('rest before departure');
}
function earnPreparation(escort = false) {
  const budget = Number(process.env.BETA_BUDGET || 700);
  while (c.scoutTribute()) capture();
  const node = c
    .zone()
    .nodes.filter((n) => n.amount > 0 && c.tributeKnown(n))
    .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
  approach(node, false);
  const before = c.hero.gold,
    deaths = c.s.statistics.deaths;
  if (!c.gather(node.id)) throw Error('resource assignment rejected');
  record('resource gathering assigned ' + node.id);
  for (let i = 0; i < 2400 && c.hero.gold < budget; i++) {
    if (c.s.statistics.deaths > deaths) throw Error('defeated during gathering');
    const enemy = near();
    if (enemy?.aggro) {
      c.cast(1, enemy.id);
      for (const slot of escort ? [2, 6, 5, 7] : [2])
        if (c.hero.skills[slot - 1]) c.cast(slot, enemy.id);
    }
    if (escort) {
      const worker = c.activeLivingParty().find((u) => u.order);
      if (!worker) break;
      c.hero.order = { type: 'move', x: worker.x, y: worker.y };
    }
    if (c.hero.skills[2] && c.hero.hp < c.hero.maxHp * 0.8) c.cast(3);
    tick();
    if (i % 300 === 299) record('gathering progress');
  }
  c.recallParty();
  for (let i = 0; i < 20 && c.hero.gold < budget; i++) {
    const loot = c.s.loot
      .filter((l) => l.zone === c.zoneId)
      .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
    if (!loot || !walk(loot, false)) break;
  }
  record('resource deposits and loot earned ' + (c.hero.gold - before) + ' crowns');
}
function fortify() {
  const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
  approach(recruiter, false);
  while (c.s.party.some((u) => u.hp <= 0) && c.recover()) capture();
  assert(c.activeLivingParty().length, 'living resource escort');
  if (c.hero.gold < 500) earnPreparation(true);
  approach(recruiter, false);
  while (c.s.party.some((u) => u.hp <= 0) && c.recover()) capture();
  assert(rest(), 'rest before construction');
  c.recallParty();
  for (let i = 0; i < 20; i++) tick();
  let b = c.zone().buildings.find((b) => b.kind === 'barracks');
  if (!b) {
    assert(c.build(), 'paid barracks construction accepted');
    b = c.zone().buildings.at(-1);
  }
  approach(b);
  if (b.progress < 4) c.assignBuilder(b.id);
  const guardTick = () => {
    const enemy = near();
    if (enemy?.aggro)
      for (const slot of [1, 2, 6, 5, 7]) if (c.hero.skills[slot - 1]) c.cast(slot, enemy.id);
    if (c.hero.hp < c.hero.maxHp * 0.8) c.cast(3);
    tick();
  };
  for (let i = 0; i < 600 && b.progress < 4; i++) guardTick();
  assert(b.progress >= 4, 'construction completed through worker ticks');
  approach(b, false);
  if (!b.full) {
    assert(c.upgradeBarracks(b.id), 'paid full barracks upgrade accepted');
    for (let i = 0; i < 600 && !b.full; i++) guardTick();
  }
  assert(b.full, 'full barracks completed through worker ticks');
  record('earned full barracks completed');
  for (const type of ['soldier', 'archer']) {
    approach(b, false);
    assert(c.train(b.id, type), 'paid recruitment ' + type);
    for (let i = 0; i < 100 && b.queue > 0; i++) guardTick();
    assert.equal(b.queue, 0, 'recruitment completed through ticks');
  }
  assert.equal(c.activeLivingParty().length, 5, 'five living active companions');
  const teacher = c.zone().npcs.find((n) => n.kind === 'teacher' && n.family === 'warlord');
  approach(teacher, false);
  while (c.hero.skills[2] < 3 && c.upgrade(3, 'warlord')) capture();
  assert(c.hero.skills[2] >= 3, 'earned Self-Heal rank 3');
  assert(rest(), 'final recovery');
  approach(b, false);
  const partyHp = c.s.party.map((u) => u.maxHp);
  if (c.purchasePreparationTonic()) {
    assert(c.usePreparationTonic(), 'purchased tonic consumed');
    assert.deepEqual(
      c.s.party.map((u) => u.maxHp),
      partyHp,
      'tonic does not inflate companions',
    );
  }
  record('fortified expedition');
}
function collectLocalLoot() {
  for (const l of [...c.s.loot].filter((l) => l.zone === c.zoneId && dist(l, c.hero) < 300))
    if (!walk(l)) break;
}
function recoverExpedition() {
  const recoveryBudget = c.s.party.filter((u) => u.hp <= 0).length * c.companionRecoveryCost();
  for (let i = 0; i < 15 && c.hero.gold < recoveryBudget; i++) {
    const loot = c.s.loot
      .filter((l) => l.zone === c.zoneId)
      .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
    if (!loot || !walk(loot, false)) break;
  }
  const recruiter = c.zone().npcs.find((n) => n.kind === 'recruiter');
  approach(recruiter, false);
  while (c.s.party.some((u) => u.hp <= 0) && c.recover()) capture();
  assert(rest(), 'recovery rest');
  record('paid expedition recovery');
}
function supportPreparation() {
  recoverExpedition();
  if (c.zone().nodes.some((n) => n.amount > 0)) earnPreparation(true);
  recoverExpedition();
  c.recallParty();
  for (let i = 0; i < 20; i++) tick();
  let b = c.zone().buildings.find((b) => b.kind === 'barracks');
  if (!b) {
    assert(c.build(), 'support barracks construction accepted');
    b = c.zone().buildings.at(-1);
  }
  approach(b);
  if (b.progress < 4) c.assignBuilder(b.id);
  for (let i = 0; i < 600 && b.progress < 4; i++) {
    const enemy = near();
    if (enemy?.aggro)
      for (const slot of [1, 2, 6, 5, 7]) if (c.hero.skills[slot - 1]) c.cast(slot, enemy.id);
    tick();
  }
  assert(b.progress >= 4, 'support barracks completed');
  approach(b, false);
  while (c.trainExpeditionSupport('sharedTraining', 'warlord')) capture();
  while (c.trainExpeditionSupport('sharedStrength', 'abyss')) capture();
  record('paid companion inheritance ' + JSON.stringify(c.s.expeditionSkills));
  rest();
}
function defeatAndRescue(family) {
  const def = D.bosses.find((b) => b.id === family);
  if (!def) throw Error('unknown boss ' + family);
  if (family === 'cindermaw' && !c.s.normal.cindermaw) {
    const bridge = c.zone().npcs.find((n) => n.id === 'bridge-south');
    approach(bridge, false);
    const refuge = c.zone().npcs.find((n) => n.id === 'minor');
    approach(refuge, false);
    assert(rest(), 'southern approach refuge');
    record('Cindermaw approach via southern bridge and refuge');
  }
  if (def.kind === 'dungeon' && c.zoneId !== family) {
    const door = c.zone().npcs.find((n) => n.kind === 'dungeon' && n.family === family);
    approach(door, false);
    if (!c.interact(door) || c.zoneId !== family) throw Error('entry failed ' + family);
    record('entered ' + family);
  }
  const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.family === family && e.hp > 0);
  if (boss) {
    record('encounter approach ' + family + ' ' + boss.form);
    if (!walk(boss, def.kind !== 'field', 180, 420)) throw Error('approach incomplete ' + family);
    if (!fight(boss, 300)) throw Error('encounter incomplete ' + family);
    capture();
    record('encounter completed ' + family + ' ' + boss.form);
    if (family === 'darklord' && boss.form === 'normal') {
      assert(c.s.pending.darklord, 'normal Dark Lord defeat schedules TRUE form');
      const scheduled = c.s.time;
      record('TRUE Dark Lord scheduled; delay=' + c.s.pending.darklord.delay);
      let trueBoss;
      for (let i = 0; i < 60; i++) {
        tick();
        trueBoss = c
          .zone()
          .enemies.find((e) => e.family === 'darklord' && e.form === 'true' && e.hp > 0);
        if (trueBoss) break;
      }
      assert(trueBoss, 'TRUE Dark Lord actually spawns after normal defeat');
      record('TRUE Dark Lord spawned after ' + (c.s.time - scheduled).toFixed(1) + ' seconds');
      if (!fight(trueBoss, 300)) throw Error('TRUE Dark Lord encounter incomplete');
      assert(c.s.true.darklord, 'TRUE Dark Lord victory recorded');
      assert.equal(c.s.phase, 'awakening', 'TRUE Dark Lord defeat triggers Awakening');
      record('TRUE Dark Lord defeated; Awakening verified');
    }
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
  const fareNeeded = c.travelFare(c.regionIndex(), 1);
  for (let i = 0; i < 10 && c.hero.gold < fareNeeded; i++) {
    const loot = c.s.loot
      .filter((l) => l.zone === c.zoneId)
      .sort((a, b) => dist(a, c.hero) - dist(b, c.hero))[0];
    if (!loot || !walk(loot, false)) break;
  }
  const n = c.zone().npcs.find((n) => n.kind === 'transport' && n.direction === 1);
  approach(n, false);
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
  if (!process.env.BETA_SKIP_SERVICES && !['fortify', 'recover', 'support'].includes(route))
    services();
  const routes = {
    prepare: [],
    fortify: [],
    recover: [],
    support: [],
    crypt: ['crypt'],
    march: ['mire', 'archive'],
    highlands: ['ridge', 'mine'],
    frontier: ['warlord', 'abyss'],
    crown: ['cindermaw', 'citadel', 'darklord'],
  };
  const targets = routes[route];
  if (!targets) throw Error('unknown route ' + route);
  if (route === 'fortify') fortify();
  if (route === 'recover') recoverExpedition();
  if (route === 'support') supportPreparation();
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
    if (c.s.rescued[family] && c.s.normal[family] && !c.isDungeon()) continue;
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
