'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Persistence = require('../src/prototype/persistence.js');

const normal = new Campaign('normal', 'paladin', () => 0.5);
assert.equal(normal.developerCombatSnapshot(), null);
assert.equal(normal.developerSummon('boss:thorn:normal'), null);
assert.equal(normal.developerSummonOptions().length, 0);

const dev = new Campaign('developer', 'paladin', () => 0.5);
assert.equal(dev.castMovementBasic(), false, 'movement auto-attack is disabled');
assert.deepEqual(dev.developerSummonOptions().filter((x) => x.kind === 'boss').map((x) => x.form).slice(0, 2), ['normal', 'true']);
assert(dev.developerSummonOptions().some((x) => x.id === 'captain:supply-vale'));
assert(!dev.developerSummonOptions().some((x) => x.id === 'captain:frontier-overseer'));
assert.equal(dev.developerSummon('boss:warlord:true'), null, 'cross-region spawn rejected');

const deaths = dev.s.statistics.deaths;
dev.hitParty(dev.hero, 100000);
assert.equal(dev.hero.hp, dev.hero.maxHp, 'fatal hit restores HP');
assert.equal(dev.s.statistics.deaths, deaths);
assert.equal(dev.s.challenge.pending, false);
const incoming = dev.developerCombatSnapshot().incoming;
assert.equal(incoming.last.length, 1);
assert(incoming.last[0] > 0);
assert(incoming.dps > 0);

const summoned = dev.developerSummon('boss:thorn:true');
assert(summoned && summoned.type === 'boss' && summoned.form === 'true');
assert.equal(summoned.neutral, false);
assert.equal(summoned.aggro, true);
assert.equal(summoned.developerSummon, true);
assert.equal(summoned.summon, true);
assert.equal(summoned.summonBalanceVersion, 1, 'native boss stats are not re-scaled as a minion');
assert.equal(summoned.baseHp, dev.boss('thorn').hp * 1.8, 'TRUE boss retains production HP');
const hpBeforeZoneRead = summoned.baseHp;
dev.zone();
assert.equal(summoned.baseHp, hpBeforeZoneRead, 'zone refresh cannot multiply test boss HP');
dev.damage(summoned, 25, 'hero');
assert(dev.developerCombatSnapshot().outgoing.last.length > 0);
const kills = dev.s.statistics.kills;
summoned.hp = 0;
dev.kill(summoned);
assert.equal(dev.s.statistics.kills, kills);
assert.equal(dev.s.true.thorn, undefined, 'no campaign victory');

const captain = dev.developerSummon('captain:supply-vale');
assert(captain && captain.captain && captain.roomCaptain);
assert.equal(captain.captainProfile, 'supply-vale');
assert.equal(captain.aggro, true);
assert(captain.guard && captain.roomGuard && !captain.fieldCaptain);
assert.equal(captain.baseHp, Math.round(65 * 2 * Campaign.rules.guardianScaling[0].hp));
const saved = dev.snapshot();
assert(!saved.zones.vale.enemies.some((e) => e.developerSummon), 'test bosses/captains excluded from saves');
assert(!saved.zones.vale.enemies.some((e) => e.owner === summoned.id), 'test adds excluded from saves');
assert(Campaign.restore(saved).s.mode === 'developer');

dev.enter('frontier');
const originalOverseer = dev.zone().enemies.find((e) => e.fieldCaptain);
assert(originalOverseer, 'native Frontier overseer exists for comparison');
const overseer = dev.developerSummon('captain:frontier-overseer');
assert(overseer && overseer.fieldCaptain && !overseer.roomCaptain);
assert.equal(overseer.baseHp, originalOverseer.baseHp, 'overseer inherits native HP');
assert.equal(overseer.baseDamage, originalOverseer.baseDamage, 'overseer inherits native damage');
assert.equal(overseer.captainProfile, originalOverseer.captainProfile);
assert.equal(overseer.aggro, true);
assert.equal(overseer.summonBalanceVersion, 1);

for (const region of Campaign.data.regions) {
  dev.enter(region.id);
  const options = dev.developerSummonOptions();
  const bosses = Campaign.data.bosses.filter((b) => b.region === region.id);
  for (const boss of bosses) {
    for (const form of ['normal', 'true']) {
      assert(options.some((entry) => entry.id === 'boss:' + boss.id + ':' + form),
        region.name + ': ' + boss.name + ' ' + form);
    }
  }
  assert(options.some((entry) => entry.kind === 'captain'), region.name + ' captain listed');
}
const t = dev.developerCombatSnapshot();
assert(t && Array.isArray(t.incoming.last) && Array.isArray(t.outgoing.last));

const store = new Map();
const storage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
};
const persistence = Persistence.create({ storage, Campaign });
const profile = { activeMode: 'normal', nightmareUnlocked: false };
persistence.save(dev, profile);
assert.equal(profile.activeMode, 'normal');
assert(persistence.exists('developer'));
assert(!persistence.exists('normal'));
for (const heroClass of ['paladin', 'mage', 'ranger']) {
  for (const charged of [false, true]) {
    const game = new Campaign('developer', heroClass, () => 0.5);
    game.zone().props = [];
    game.s.mercyTime = 0;
    Object.assign(game.hero, { x: 500, y: 500 });
    const enemy = game.makeEnemy(
      { species: 'goblin', name: 'Manual attack target', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 550, y: 500 },
    );
    game.zone().enemies = [enemy];
    assert.equal(game.castMovementBasic(), false, heroClass + ': automatic basic refused');
    assert.equal(game.cast(1, enemy.id, charged, null, true), false, 'automatic intent cannot bypass the guard');
    assert.equal(game.hero.cd[0], 0, 'refused auto-attack consumes no cooldown');
    assert.equal(enemy.hp, enemy.maxHp, 'refused auto-attack deals no damage');
    assert.equal(game.cast(1, enemy.id, charged), true, heroClass + ': manual Skill 1 works');
    assert(game.hero.cd[0] > 0, 'manual attack retains its normal cooldown');
    assert(enemy.hp < enemy.maxHp || game.s.projectiles.length > 0, 'manual attack damages or launches a real projectile');
  }
}
console.log('PASS Developer Mode isolation, immortality, manual Skill 1, disabled movement auto-attack, hostile regional summons and combat telemetry');
