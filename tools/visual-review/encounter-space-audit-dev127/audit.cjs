'use strict';
const C = require('../../../src/prototype/engine'),
  fs = require('fs'),
  path = require('path');
const out = {
  scope: 'Actual authored geometry; no runtime changes or balance certification',
  seed: 0.73,
  spawns: [],
  entrances: [],
  skills: [],
  summons: [],
  pilots: [],
};
const ids = [
  ...C.data.regions.map((r) => r.id),
  ...C.dungeonIds,
  ...C.rules.supplyRooms.map((r) => r.id),
  ...C.rules.sideDungeons.map((r) => r.id),
];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  point = (p) => ({ x: p.x, y: p.y });
function world(id) {
  const g = new C('normal', 'mage', () => 0.73);
  g.s.mercyTime = 0;
  g.enter(id);
  return g;
}
function target(g, e) {
  for (const r of [160, 240, 320, 100])
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6,
        p = { x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r };
      if (
        !g.blocked(p.x, p.y, g.zoneId, g.actorRadius(g.hero)) &&
        g.line(e, p) &&
        g.clearSegment(e, p, g.actorRadius(e))
      )
        return p;
    }
  return null;
}
function fresh(s) {
  const g = new C('normal', 'mage', () => 0.73);
  g.s = structuredClone(s);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.hero.hp = g.hero.maxHp = 1e8;
  g.hero.immune = 1e8;
  return g;
}
function audit(g, id, e, label) {
  const r = g.actorRadius(e),
    row = {
      zone: id,
      encounter: label,
      name: e.name,
      family: e.family,
      profile: e.captainProfile,
      spawn: point(e),
      home: point(e.home || e),
      bodyRadius: r,
      spawnBlocked: g.blocked(e.x, e.y, id, r),
      fort: g.enemyFort(e)?.id || null,
      openDirections: {},
    };
  for (const range of [140, 300, 450])
    row.openDirections[range] = Array.from({ length: 12 }, (_, j) => {
      const a = (j * Math.PI) / 6;
      return g.clearSegment(e, { x: e.x + Math.cos(a) * range, y: e.y + Math.sin(a) * range }, r);
    }).filter(Boolean).length;
  out.spawns.push(row);
  const baseline = structuredClone(g.s),
    enemyId = e.id;
  const p = target(g, e);
  row.clearTarget = p;
  if (e.type === 'boss') {
    for (const [index, plan] of C.rules.attacks[e.family].entries()) {
      const h = fresh(baseline),
        enemy = h.zone().enemies.find((u) => u.id === enemyId);
      const samples = [];
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4,
          mark = { x: enemy.x + Math.cos(a) * 160, y: enemy.y + Math.sin(a) * 160 };
        if (h.blocked(mark.x, mark.y, id, h.actorRadius(h.hero)) || !h.line(enemy, mark)) continue;
        Object.assign(h.hero, mark);
        enemy.telegraph = null;
        enemy.sequence = [];
        enemy.motion = null;
        let started = false,
          error = null,
          persists = null;
        try {
          started = h.startAttack(enemy, h.hero, index);
          if (started) {
            const cast = enemy.telegraph;
            h.damage(enemy, 1, 'hero');
            persists = enemy.telegraph === cast;
          }
        } catch (err) {
          error = err.message;
        }
        samples.push({ direction: j, started, persistsAfterOrdinaryDamage: persists, error });
      }
      out.skills.push({ encounter: label, index, kind: plan.kind, samples });
    }
  }
  const h = fresh(baseline),
    enemy = h.zone().enemies.find((u) => u.id === enemyId),
    plan = enemy.type === 'boss' ? h.trueSummonPlan(enemy) : h.captainProfile(enemy)?.summon;
  if (plan) {
    if (p) Object.assign(h.hero, p);
    const count =
        enemy.type === 'boss'
          ? h.summonBossAdds(enemy, plan, h.bossSummonCap(enemy))
          : h.summonCaptainAdds(enemy, plan),
      adds = h.zone().enemies.filter((u) => u.summon && u.owner === enemy.id);
    out.summons.push({
      encounter: label,
      count,
      adds: adds.map((u) => ({
        id: u.id,
        ...point(u),
        bodyRadius: h.actorRadius(u),
        blocked: h.blocked(u.x, u.y, id, h.actorRadius(u)),
        ownerOverlap: dist(u, enemy) < h.actorRadius(u) + h.actorRadius(enemy),
        otherOverlaps: h
          .zone()
          .enemies.filter(
            (v) => v !== u && v.hp > 0 && dist(u, v) < h.actorRadius(u) + h.actorRadius(v),
          )
          .map((v) => v.id),
        directExitDirections: Array.from({ length: 12 }, (_, j) => {
          const a = (j * Math.PI) / 6;
          return h.clearSegment(
            u,
            { x: u.x + Math.cos(a) * 80, y: u.y + Math.sin(a) * 80 },
            h.actorRadius(u),
          );
        }).filter(Boolean).length,
      })),
    });
  }
  if (p) {
    const h = fresh(baseline),
      enemy = h.zone().enemies.find((u) => u.id === enemyId),
      starts = [],
      impacts = [];
    Object.assign(h.hero, p);
    h.engage(enemy, true, false);
    enemy.cd = 0;
    enemy.specialCd = 0;
    const bossStart = h.startAttack,
      captainStart = h.startCaptainAttack,
      resolve = h.resolveAttack;
    h.startAttack = function (u, ...args) {
      const ok = bossStart.call(this, u, ...args);
      if (ok && u.id === enemyId)
        starts.push({ time: this.s.time, index: u.telegraph?.index, kind: u.telegraph?.kind });
      return ok;
    };
    h.startCaptainAttack = function (u, ...args) {
      const ok = captainStart.call(this, u, ...args);
      if (ok && u.id === enemyId)
        starts.push({ time: this.s.time, index: u.telegraph?.index, kind: u.telegraph?.kind });
      return ok;
    };
    h.resolveAttack = function (u, ...args) {
      if (u.id === enemyId)
        impacts.push({ time: this.s.time, index: u.telegraph?.index, kind: u.telegraph?.kind });
      return resolve.call(this, u, ...args);
    };
    let error = null;
    try {
      for (let n = 0; n < 400; n++) {
        h.s.time += 0.05;
        h.updateEnemies(0.05);
        h.updateProjectiles(0.05);
      }
    } catch (err) {
      error = err.message;
    }
    out.pilots.push({
      encounter: label,
      seconds: 20,
      heroAt: p,
      starts,
      impacts,
      final: point(enemy),
      returning: !!enemy.returning,
      error,
    });
  }
}
for (const id of ids) {
  const g = world(id);
  const z = g.zone();
  if (g.isDungeon() || g.sideDungeon() || g.supplyRoom()) {
    const party = Array.from({ length: 6 }, () => g.unit('soldier', g.hero.x, g.hero.y));
    g.s.expeditionRank = 6;
    g.s.party = party;
    g.enter(id);
    out.entrances.push({
      zone: id,
      hero: point(g.hero),
      heroBlocked: g.blocked(g.hero.x, g.hero.y, id, g.actorRadius(g.hero)),
      party: party.map((u) => ({
        ...point(u),
        blocked: g.blocked(u.x, u.y, id, g.actorRadius(u)),
      })),
      nearestHostile: Math.min(
        ...z.enemies.filter((e) => e.hp > 0 && !e.neutral).map((e) => dist(e, g.hero)),
      ),
      forts: g.fortAreas().map((a) => a.id),
    });
    g.s.party = [];
  }
  if (id === 'crown') {
    g.s.rescued.cindermaw = g.s.rescued.citadel = true;
    g.finalBossPopulation(z);
  }
  for (const e of z.enemies.filter(
    (e) => e.type === 'boss' || e.captain || e.roomCaptain || e.fieldCaptain,
  )) {
    audit(g, id, e, (e.family || e.captainProfile) + ':normal');
    if (e.type === 'boss') {
      const h = fresh(g.s),
        old = h.zone().enemies.find((u) => u.id === e.id);
      let p = point(old);
      if (C.data.bosses.find((b) => b.id === old.family).kind !== 'dungeon')
        p = h.fieldTrueSpawnPoint(old) || p;
      const t = h.bossEnemy(h.boss(old.family), 'true', p);
      h.zone().enemies = h.zone().enemies.filter((u) => u.id !== old.id);
      h.zone().enemies.push(t);
      if (['thorn', 'cindermaw'].includes(t.family)) t.home = point(h.fieldCenter());
      audit(h, id, t, t.family + ':true');
    }
  }
  console.log('Audited', id);
}
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(out, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      spawns: out.spawns.length,
      entrances: out.entrances.length,
      skills: out.skills.length,
      pilots: out.pilots.length,
      blockedSpawns: out.spawns.filter((r) => r.spawnBlocked),
      blockedArrivals: out.entrances.filter((r) => r.heroBlocked || r.party.some((u) => u.blocked)),
      summonIssues: out.summons.flatMap((r) =>
        r.adds
          .filter(
            (u) => u.blocked || u.ownerOverlap || u.otherOverlaps.length || !u.directExitDirections,
          )
          .map((u) => ({ encounter: r.encounter, ...u })),
      ),
      pilotFailures: out.pilots.filter((r) => r.error || !r.starts.length),
    },
    null,
    2,
  ),
);
