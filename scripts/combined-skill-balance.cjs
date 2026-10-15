'use strict';
// Deterministic policy observations of the integrated engine, not human play.
const fs = require('node:fs');
const path = require('node:path');
const C = require('../src/prototype/engine.js');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { fixture, meter } = require('./cooldown-balance-audit.cjs');
const round = (n) => Math.round(n * 1000) / 1000;
function trial({ cls, skill, party, family, form = 'normal', count, policy }) {
  const level = skill === 1 ? 6 : skill === 4 ? 16 : 30;
  const g = fixture(
    cls,
    { level, skill, gear: skill === 1 ? 0 : skill === 4 ? 2 : 4, slots: 8 },
    5,
    'normal',
    113,
    party,
  );
  const def = family && g.boss(family);
  g.enter(
    def
      ? def.kind === 'dungeon'
        ? family
        : def.region
      : skill === 1
        ? 'vale'
        : skill === 4
          ? 'highlands'
          : 'crown',
  );
  let z = g.zone();
  let targets;
  if (def) {
    const spawn = z.enemies.find((e) => e.family === family && e.type === 'boss');
    if (form === 'true' && def.kind === 'dungeon') {
      g.s.phase = 'awakening';
      g.s.awakeningLevel = level + 2;
    }
    targets = [g.bossEnemy(def, form, spawn?.home || g.safe(1160, 1110))];
  } else {
    const original = z.enemies.find((e) => e.type === 'mob' && !e.guard && !e.captain && !e.summon);
    const p = original.home;
    targets = Array.from({ length: count }, (_, i) =>
      g.makeEnemy(
        {
          species: original.species,
          name: 'Pack audit',
          level: original.level,
          hp: original.baseHp,
          damage: original.baseDamage,
          gold: 0,
          xp: 0,
        },
        g.safe(p.x + (i % 4) * 36, p.y + Math.floor(i / 4) * 38),
      ),
    );
  }
  z.enemies = targets;
  z.npcs = [];
  z.buildings = [];
  z.nodes = [];
  g.s.quests = {};
  g.s.mercyTime = 0;
  const e = targets[0];
  Object.assign(g.hero, g.safe(e.x - (cls === 'paladin' ? 85 : 190), e.y));
  for (const [i, u] of g.s.party.entries())
    Object.assign(u, g.safe(g.hero.x - 20, g.hero.y + i * 12));
  const m = meter(g, e);
  g.engage(e);
  g.manualHeroTargetId = e.id;
  let pending = null,
    seconds = 0,
    warnings = 0,
    moves = 0,
    interrupted = 0;
  let warned = new Set();
  const execute = (slot, target, charged) => {
    if (charged) {
      if (pending || !g.beginPartyCharge(g.hero, slot)) return false;
      pending = { slot, target: target.id };
      return true;
    }
    return g.cast(slot, target.id);
  };
  for (
    let step = 0;
    step < 900 && !g.s.statistics.deaths && targets.some((t) => t.hp > 0);
    step++
  ) {
    const h = g.hero,
      target = targets.find((t) => t.hp > 0);
    const warning = z.enemies.find((t) => t.telegraph || t.motion);
    if (warning && !warned.has(warning.telegraph || warning.motion)) {
      warned.add(warning.telegraph || warning.motion);
      warnings++;
    }
    if (pending) {
      const hold = g.partyChargeState(h);
      if (!hold || hold.interrupted) {
        interrupted++;
        g.clearPartyCharge(h);
        pending = null;
      } else if (g.partyChargeProgress(h) >= 1 - 1e-9) {
        g.cast(pending.slot, pending.target, true);
        g.clearPartyCharge(h);
        pending = null;
      }
    }
    if (!pending) {
      let slots = policy === 'spam' ? [1] : [8, 7, 6, 5, 4, 3, 2, 1];
      for (const slot of slots) {
        if (h.cd[slot - 1] > 1e-9) continue;
        if (
          policy === 'responsive' &&
          slot === 3 &&
          (cls === 'ranger'
            ? h.hp > h.maxHp * 0.65 && !g.activeLivingParty().some((u) => u.hp < u.maxHp * 0.6)
            : cls === 'mage'
              ? !warning
              : !warning && h.hp > h.maxHp * 0.6)
        )
          continue;
        const charged =
          policy === 'fixed'
            ? slot > 1
            : policy === 'responsive' &&
              (((slot === 2 || slot === 5 || slot === 8) &&
                z.enemies.filter((t) => t.hp > 0).length >= 3) ||
                (cls === 'ranger' &&
                  slot === 3 &&
                  g.activeLivingParty().filter((u) => u.hp < u.maxHp * 0.7).length >= 2));
        if (execute(slot, target, charged)) break;
      }
    }
    if (policy === 'responsive' && warning) {
      const a = warning.telegraph || warning.motion,
        angle = Math.atan2(h.y - warning.y, h.x - warning.x);
      const p = g.safe(
        warning.x + Math.cos(angle + 1.6) * 260,
        warning.y + Math.sin(angle + 1.6) * 260,
      );
      h.order = { type: 'move', ...p };
      moves++;
    } else h.order = { type: 'attack', id: target.id };
    g.s.holdFire = !!pending;
    g.tick(0.1);
    seconds += 0.1;
    g.effects = [];
    g.notices = [];
    g.messages = [];
  }
  return {
    cls,
    skill,
    party,
    family: family || 'pack-' + count,
    form,
    policy,
    won: targets.every((t) => t.hp <= 0),
    died: !!g.s.statistics.deaths,
    seconds: round(seconds),
    damage: round(m.damage),
    received: round(m.received),
    heroHp: round(g.hero.hp / g.hero.maxHp),
    alive: g.activeLivingParty().length,
    warnings,
    moves,
    interrupted,
    remaining: round(targets.reduce((s, t) => s + Math.max(0, t.hp), 0)),
  };
}
function cases() {
  const out = [];
  for (const cls of Object.keys(C.classes))
    for (const party of ['solo', 'six'])
      for (const policy of ['spam', 'fixed', 'responsive']) {
        for (const def of C.data.bosses)
          for (const form of ['normal', 'true'])
            out.push({ cls, skill: 8, party, policy, family: def.id, form });
        for (const skill of [1, 4, 8])
          for (const count of [1, 3, 5, 8, 12]) out.push({ cls, skill, party, policy, count });
      }
  return out;
}
module.exports = { trial, cases };
if (require.main === module) {
  const [shard, shards] = (process.env.BALANCE_SHARD || '0/1').split('/').map(Number);
  const rows = cases()
    .filter((_, i) => i % shards === shard)
    .map((c, i) => {
      const r = trial(c);
      if (i % 10 === 0) console.log('completed', i, c.cls, c.family || c.count, c.policy);
      return r;
    });
  for (const row of rows)
    for (const field of ['seconds', 'damage', 'received', 'heroHp', 'remaining'])
      assert(Number.isFinite(row[field]), row.cls + ' finite ' + field);
  if (shards === 1) {
    assert.equal(rows.length, 666);
    for (const cls of Object.keys(C.classes)) {
      assert(
        rows.some((r) => r.cls === cls && r.policy === 'fixed' && !r.won),
        cls + ' fixed rotation is not universal',
      );
      assert(
        rows.some((r) => r.cls === cls && r.policy === 'responsive' && r.won),
        cls + ' responsive play remains viable',
      );
    }
  }
  const out = process.argv[2] || 'test-results/combined-validation/balance.json';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        version: require('../package.json').version,
        sources: Object.fromEntries(
          ['combat', 'engine', 'hero-combat', 'party', 'rules', 'boss-combat'].map((n) => {
            const f = 'src/prototype/' + n + '.js';
            return [
              f,
              crypto
                .createHash('sha256')
                .update(fs.readFileSync(path.join(__dirname, '..', f)))
                .digest('hex'),
            ];
          }),
        ),
        limits:
          '90 second seeded scripted policies; authored boss terrain and production tick/AI, no physical-device/human acceptance; rank-1/4 slots are deliberately unlocked for isolated skill coverage',
        rows,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS observed', rows.length, 'combined balance scenarios');
}
