'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine.js');
for (const mode of ['normal', 'nightmare', 'developer']) {
  const g = new C(mode, 'paladin', () => 0.73);
  const stats = [g.hero.hp, g.hero.maxHp, g.hero.gold, g.hero.power];
  assert(!g.nameHero('   '));
  assert(g.nameHero('  Joël   the Brave  '));
  assert.equal(g.hero.customName, 'Joël the Brave');
  assert(!g.nameHero('Another'));
  assert(!g.nameHero('Night King', true));
  assert.deepEqual([g.hero.hp, g.hero.maxHp, g.hero.gold, g.hero.power], stats);
  for (const u of g.s.party) {
    assert(!g.nameCompanion(u.id, ''));
    assert(g.nameCompanion(u.id, u.type === 'archer' ? 'Artemis' : 'Asuna'));
    assert(!g.nameCompanion(u.id, 'Changed'));
  }
  assert(!g.nameCompanion('enemy-1', 'Intruder'));
  g.hero.gold = 10000;
  const u = g.s.party[0],
    id = u.id;
  u.hp = 0;
  assert(g.recover());
  assert.equal(u.id, id);
  assert.equal(u.customName, 'Asuna');
  assert.equal(g.companionDisplayName(u), 'Asuna');
  assert(g.restCompanion(id));
  assert.equal(u.customName, 'Asuna');
  assert(!g.nameEquipment('crypt', 'weapon', 'Elucidator'));
  g.s.rescued.crypt = true;
  assert(g.nameEquipment('crypt', 'weapon', 'Elucidator'));
  assert(g.nameEquipment('crypt', 'armor', 'Blackwyrm Coat'));
  assert(!g.nameEquipment('crypt', 'boots', 'No slot'));
  assert(g.gear('crypt', 'weapon'));
  assert.equal(g.hero.customWeaponName, 'Elucidator');
  const saved = g.snapshot(),
    restored = C.restore(JSON.parse(JSON.stringify(saved)), () => 0.73);
  assert.equal(restored.hero.customName, 'Joël the Brave');
  assert.equal(restored.hero.customWeaponName, 'Elucidator');
  assert.equal(restored.hero.customArmorName, 'Blackwyrm Coat');
  assert.equal(restored.s.party.find((x) => x.id === id).customName, 'Asuna');
  for (const bad of ['', null, 42, '<img src=x>', 'x'.repeat(25), 'Name\nBreak']) {
    const forged = structuredClone(saved);
    forged.hero.customName = bad;
    assert.throws(() => C.restore(forged), /character name/);
  }
  const legacy = structuredClone(saved);
  delete legacy.hero.customName;
  delete legacy.hero.customWeaponName;
  delete legacy.hero.customArmorName;
  legacy.party.forEach((x) => delete x.customName);
  const old = C.restore(legacy);
  assert(old.nameHero('Kirito'));
  assert(old.nameCompanion(old.s.party[0].id, 'Sachi'));
}
for (const b of C.data.bosses) {
  const g = new C('normal', 'ranger', () => 0.73);
  g.s.normal[b.id] = g.s.true[b.id] = true;
  if (b.id === 'darklord') g.s.phase = 'awakening';
  const pet = g.unit('pet', 350, 400, b.id);
  g.s.party = [pet];
  const canonical = pet.name;
  assert(g.nameCompanion(pet.id, 'Little Star'));
  pet.hp = 0;
  g.hero.gold = 10000;
  assert(g.recover());
  const restored = C.restore(g.snapshot());
  assert.equal(restored.s.party[0].name, canonical);
  assert.equal(restored.s.party[0].customName, 'Little Star');
  assert(!restored.nameCompanion(pet.id, 'Second name'));
}
{
  const g = new C('normal', 'mage', () => 0.73);
  g.nameHero('Kirito');
  g.s.normal.darklord = g.s.true.darklord = true;
  g.s.phase = 'awakening';
  g.s.throneClaimed = true;
  assert(g.nameHero('Lord Noctis', true));
  assert.equal(g.heroDisplayName(), 'Lord Noctis');
  assert(!g.nameHero('Lord Again', true));
  const restored = C.restore(g.snapshot());
  assert.equal(restored.hero.customName, 'Kirito');
  assert.equal(restored.heroDisplayName(), 'Lord Noctis');
}
console.log(
  'PASS optional one-time hero/troop/pet names, equipment labels, regnal identity, recovery, legacy saves and invalid imports',
);

{
  const g = new C('normal', 'paladin', () => 0.73, { succession: true });
  g.nameHero('First Hero');
  g.s.rescued.crypt = true;
  g.nameEquipment('crypt', 'weapon', 'Elucidator');
  g.nameEquipment('crypt', 'armor', 'Blackwyrm Coat');
  g.die();
  assert(g.successor('mage'));
  assert.equal(g.hero.customName, undefined, 'successor has a separate identity');
  assert.equal(g.hero.customWeaponName, 'Elucidator');
  assert.equal(g.hero.customArmorName, 'Blackwyrm Coat');
  assert(g.nameHero('Second Hero'));
}
