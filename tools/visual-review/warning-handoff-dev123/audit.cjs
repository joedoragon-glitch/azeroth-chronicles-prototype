'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  C = require('../../../src/prototype/engine');
const rows = [];
for (const [family, index, form] of [
  ...C.data.bosses.map((b) => [b.id, 0, 'normal']),
  ['thorn', 0, 'true'],
  ['darklord', 0, 'true'],
  ['crypt', 1, 'normal'],
  ['abyss', 1, 'normal'],
]) {
  const c = new C('normal', 'paladin', () => 0.5),
    b = c.boss(family);
  c.enter(b.kind === 'dungeon' ? b.id : b.region);
  c.s.party = [];
  c.s.mercyTime = 0;
  c.s.holdFire = true;
  c.blocked = () => false;
  c.line = () => true;
  c.clearSegment = () => true;
  c.tacticalAutoRogue = () => false;
  Object.assign(c.hero, { x: 1580, y: 1700, hp: 1e8, maxHp: 1e8, immune: 999 });
  const e = c.bossEnemy(b, form, { x: 1400, y: 1700 });
  e.home = { x: e.x, y: e.y };
  c.zone().enemies = [e];
  c.engage(e);
  c.startAttack(e, c.hero, index);
  const first = e.telegraph;
  assert(first, family + '/' + form + '/' + index);
  const row = {
    family,
    index,
    form,
    kind: first.kind,
    warningSeconds: first.total,
    releaseAt: null,
    firstImpactAt: null,
    oldWarningAtRelease: null,
    nextWarningAtRelease: null,
    nextWarningAtImpact: null,
  };
  for (let i = 0; i < 600; i++) {
    c.s.time += 0.02;
    c.effects = [];
    c.updateEnemies(0.02);
    c.updateProjectiles(0.02);
    const release = c.effects.find(
      (f) => f.type === 'enemyVfx' && f.source === e.id && f.stage === 'release',
    );
    const impact = c.effects.find(
      (f) => f.type === 'enemyVfx' && f.source === e.id && f.stage === 'impact',
    );
    if (release && row.releaseAt === null) {
      row.releaseAt = +(i * 0.02 + 0.02).toFixed(3);
      row.oldWarningAtRelease = e.telegraph === first;
      row.nextWarningAtRelease = !!e.telegraph && e.telegraph !== first;
    }
    if (impact && row.firstImpactAt === null) {
      row.firstImpactAt = +(i * 0.02 + 0.02).toFixed(3);
      row.nextWarningAtImpact = !!e.telegraph && e.telegraph !== first;
      row.oldWarningAtImpact = e.telegraph === first;
    }
    if (row.releaseAt !== null && (row.firstImpactAt !== null || i * 0.02 > row.releaseAt + 3))
      break;
  }
  assert(row.releaseAt !== null, family + ' release reached through live enemy update');
  assert.equal(row.oldWarningAtRelease, false, 'resolved warning removed in the same update');
  rows.push(row);
}
const interiors = [];
for (const id of [
  ...C.dungeonIds,
  ...C.rules.supplyRooms.map((r) => r.id),
  ...(C.rules.sideDungeons || []).map((r) => r.id),
]) {
  const c = new C('normal');
  c.enter(id);
  const enemies = c.zone().enemies.filter((e) => e.hp > 0 && !e.neutral);
  interiors.push({
    zone: id,
    fortAreas: c.fortAreas().length,
    protectedEnemies: enemies.filter((e) => c.enemyFort(e)).length,
    hostileEnemies: enemies.length,
  });
}
const result = {
  scope:
    'Representative real boss update/release/contact paths; isolated clear terrain, high HP, no companion or hero attacks; not a full campaign or physical-device attention study',
  attacks: rows,
  interiors,
  fortRules: C.rules.balance.fortifications,
  visualChanges: false,
};
fs.writeFileSync(__dirname + '/audit.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      attacks: rows.length,
      oldWarningLinger: rows.filter((r) => r.oldWarningAtRelease || r.oldWarningAtImpact).length,
      overlappingNextWarning: rows
        .filter((r) => r.nextWarningAtRelease || r.nextWarningAtImpact)
        .map((r) => r.family + '/' + r.form + '/' + r.index),
      interiors,
    },
    null,
    2,
  ),
);
