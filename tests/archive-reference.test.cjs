'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const Archive = require('../src/prototype/archive');
const Input = require('../src/prototype/input');
for (const mode of ['normal', 'nightmare'])
  for (const heroClass of Object.keys(C.classes)) {
    const c = new C(mode, heroClass, () => 0.9);
    const before = c.snapshot(),
      effects = JSON.stringify(c.effects);
    let sections = Archive.sections(c, { D: C.data, R: C.rules });
    assert.deepEqual(c.snapshot(), before, 'consulting creates no encounters or progression');
    assert.equal(JSON.stringify(c.effects), effects);
    assert.equal(sections.find((s) => s.title === 'Your skills').topics.length, 8);
    const bosses = sections.find((s) => s.title === 'Adversaries and their attacks');
    for (const boss of C.data.bosses) assert(bosses.topics.some(([title]) => title === boss.name));
    assert(!sections.some((s) => s.title === 'The orders among the shelves'));
    assert(
      !JSON.stringify(sections).includes('proposed capturing'),
      'optional lore must not bypass unread evidence',
    );
    c.s.keeperEvidence = true;
    assert(
      Archive.sections(c, { D: C.data, R: C.rules }).some(
        (s) => s.title === 'The orders among the shelves',
      ),
    );
    const original = C.rules.balance.skills.cooldowns[1];
    try {
      C.rules.balance.skills.cooldowns[1] = 9.125;
      sections = Archive.sections(c, { D: C.data, R: C.rules });
      assert(sections.find((s) => s.title === 'Your skills').topics[0][1].includes('9.13 seconds'));
    } finally {
      C.rules.balance.skills.cooldowns[1] = original;
    }
    // Future/restored mode reads the shared guard and effective cooldown method.
    const oldMode = C.rules.resourceMode;
    try {
      C.rules.resourceMode = { manaEnabled: false };
      c.skillCooldown = (slot, charged) => (charged ? 11 : 4);
      sections = Archive.sections(c, { D: C.data, R: C.rules });
      const skill = sections.find((s) => s.title === 'Your skills').topics[0][1];
      assert(skill.includes('recovery 4 seconds') && skill.includes('Charged recovery: 11'));
      assert(!skill.includes('MP'));
      assert(
        !sections
          .find((s) => s.title === 'Companions and field bases')
          .topics.find((t) => t[0] === 'A Ranger’s care')[1]
          .includes('Mana Recovery'),
      );
    } finally {
      if (oldMode === undefined) delete C.rules.resourceMode;
      else C.rules.resourceMode = oldMode;
    }
  }
// The stated party-armor formula matches the actual resolver and immunity.
const c = new C(),
  incoming = 50,
  hp = c.hero.hp,
  armor = c.armor();
c.hitParty(c.hero, incoming);
assert.equal(hp - c.hero.hp, Math.max(3, incoming - armor * 0.35));
c.hero.immune = 1;
const immuneHp = c.hero.hp;
c.hitParty(c.hero, 1000);
assert.equal(c.hero.hp, immuneHp);
c.hero.gold = 0;
assert(!c.spend(50));
assert(
  c.effects.some((e) => e.type === 'actionFailed' && e.reason === 'crowns' && e.needed === 50),
);
console.log(
  'PASS read-only optional Archive, all class/mode references, live costs/cooldowns, evidence gate, armor formula and crown failure event',
);
