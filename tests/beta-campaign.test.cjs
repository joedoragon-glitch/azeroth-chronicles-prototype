'use strict';

// Combined campaign checkpoints, not a difficulty/physical-device playthrough.
// Fixture shortcuts: crowns fund all existing services, kills resolve at HP=0,
// and starter Barracks construction is completed without waiting for labor.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  for (const cls of ['paladin', 'mage', 'ranger']) {
    let c = new Campaign(mode, cls, () => 0.9);
    assert.equal(c.hero.class, cls);
    assert.deepEqual(c.hero.skills, [1, 0, 0, 0, 0, 0, 0, 0]);
    assert.deepEqual(
      c.s.party.map((u) => u.type),
      ['soldier', 'archer'],
    );
    assert.equal(c.s.expeditionRank, 1);
    assert.equal(c.hero.weapon, 0);
    assert.equal(c.hero.armorTier, 0);
    assert.equal(c.hero.gold, 30);
    c.hero.gold = 50000; // Recorded service fixture; never a user save.

    Object.assign(c.hero, c.safe(740, 940));
    assert(c.build());
    c.zone().buildings.at(-1).progress = 4;
    for (const u of c.s.party) u.order = null;

    const checkpoint = () => {
      c.checkQuests();
      const original = c.snapshot();
      const bytes = JSON.stringify(original);
      const r = Campaign.restore(original, () => 0.9);
      assert.equal(JSON.stringify(original), bytes, 'restore preserves original export');
      for (const key of ['normal', 'true', 'rescued', 'keys', 'tickets'])
        assert.deepEqual(r.s[key], c.s[key], key + ' survives');
      assert.equal(r.hero.class, cls);
      assert.equal(r.s.mode, mode);
      assert.equal(r.hero.gold, c.hero.gold, 'no crown duplication on import');
      assert.equal(r.hero.weapon, c.hero.weapon);
      assert.equal(r.hero.armorTier, c.hero.armorTier);
      assert.deepEqual(r.hero.reforges, c.hero.reforges);
      assert.equal(r.s.expeditionRank, c.s.expeditionRank);
      assert.equal(r.zoneId, c.zoneId);
      assert(!r.blocked(r.hero.x, r.hero.y), 'restored location is walkable');
      const twice = Campaign.restore(r.snapshot(), () => 0.9);
      assert.equal(twice.hero.gold, r.hero.gold, 'reimport does not repay quests');
      assert.equal(twice.hero.xp, r.hero.xp);
      assert.equal(twice.hero.level, r.hero.level);
      c = twice;
    };

    for (const [i, region] of Campaign.data.regions.entries()) {
      assert.equal(c.zoneId, region.id, 'real outward transport reached region');
      for (const b of Campaign.data.bosses.filter((b) => b.region === region.id && b.captive)) {
        c.enter(b.kind === 'dungeon' ? b.id : b.region);
        const boss = c.zone().enemies.find((e) => e.family === b.id && e.form === 'normal');
        assert(boss, b.id + ' encounter exists');
        boss.hp = 0; // Isolate progression from combat difficulty.
        c.kill(boss);
        assert(c.s.keys[b.id], b.id + ' drops its captive key');
        assert(c.rescue(b.id));
        assert(!c.rescue(b.id), 'rescue is once only');
        if (Campaign.rules.teachers[b.id]) {
          while (c.trainExpedition(b.id)) {}
          for (const slot of c.teacherCatalog(b.id).learn) c.learn(slot, b.id);
        }
        if (['crypt', 'mine', 'abyss', 'cindermaw'].includes(b.id)) {
          for (const kind of ['weapon', 'armor']) {
            assert(c.gear(b.id, kind));
            assert(c.gear(b.id, kind, true));
          }
        }
        checkpoint();
      }
      c.enter(region.id);
      checkpoint();
      if (i < Campaign.data.regions.length - 1) assert(c.travel(1));
    }

    assert.equal(c.hero.weapon, 4);
    assert.equal(c.hero.armorTier, 4);
    assert.equal(c.s.expeditionRank, 6);
    while (c.trainExpeditionSupport('sharedStrength', 'cindermaw')) {}
    assert.equal(c.expeditionSupportRank('sharedStrength'), 4);
    const reserve = c.unit('archer', 300, 350);
    reserve.active = false;
    const fallen = c.unit('soldier', 300, 350);
    fallen.active = false;
    fallen.hp = 0;
    c.s.party.push(reserve, fallen);
    c.syncCompanionLevelStats();
    const partyHp = c.s.party.map((u) => ({ maxHp: u.maxHp, hp: u.hp }));
    assert(c.purchasePreparationTonic());
    assert(c.purchasePreparationTonic());
    assert(c.usePreparationTonic());
    assert(!c.usePreparationTonic(), 'active tonic cannot stack');
    assert.deepEqual(
      c.s.party.map((u) => ({ maxHp: u.maxHp, hp: u.hp })),
      partyHp,
      'hero-only tonic does not transfer through permanent Shared Strength',
    );
    checkpoint();
    assert(c.hero.tonic);
    assert.equal(c.preparationTonicStock(), 1);
    const inherited = c.companionInheritedHpBonus();
    const crowns = c.hero.gold;
    c.die();
    assert.equal(c.hero.gold, crowns - Math.ceil(crowns * 0.2));
    assert(!c.hero.tonic);
    assert.equal(c.companionInheritedHpBonus(), inherited);
    checkpoint();

    const s = new Campaign(mode, cls, () => 0.9, { succession: true });
    s.s = c.snapshot();
    s.s.challenge = { succession: true, fallen: [], pending: false, gameOver: false };
    s.s.legacyInventory = ['Espada de Cruzado'];
    assert(s.equipLegacy('Espada de Cruzado'));
    assert(s.usePreparationTonic());
    s.die();
    const next = ['paladin', 'mage', 'ranger'].find((x) => x !== cls);
    const retained = { gold: s.hero.gold, rescued: { ...s.s.rescued }, weapon: s.hero.weapon };
    assert(s.successor(next));
    assert.equal(s.hero.class, next);
    assert.equal(s.hero.level, 1);
    assert(!s.hero.tonic);
    assert.equal(s.hero.legacyWeaponName, 'Espada de Cruzado');
    assert.equal(s.hero.gold, retained.gold);
    assert.deepEqual(s.s.rescued, retained.rescued);
    assert.equal(s.hero.weapon, retained.weapon);
    const restored = Campaign.restore(s.snapshot());
    assert.equal(restored.hero.legacyWeaponName, 'Espada de Cruzado');
    assert(restored.hero.legacyEquipped);
    assert.equal(restored.hero.class, next);
    console.log(
      'PASS combined ' +
        mode +
        '/' +
        cls +
        ' fresh, five-region rescue/training/equipment, checkpoints, tonic, death and Succession',
    );
  }
}
