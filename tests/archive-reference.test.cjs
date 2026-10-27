'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const Archive = require('../src/prototype/archive');
const Input = require('../src/prototype/input');
const AuthorCopy = require('../src/prototype/narration.js').approved;
for (const mode of ['normal', 'nightmare'])
  for (const heroClass of Object.keys(C.classes)) {
    const c = new C(mode, heroClass, () => 0.9);
    const before = c.snapshot(),
      effects = JSON.stringify(c.effects);
    let sections = Archive.sections(c, { D: C.data, R: C.rules });
    assert.deepEqual(c.snapshot(), before, 'consulting creates no encounters or progression');
    assert.equal(JSON.stringify(c.effects), effects);
    assert.equal(sections.find((s) => s.title === 'Your skills').topics.length, 8);
    const institutions = sections.find(s => s.title === 'The Crown and its institutions');
    assert.equal(institutions.topics.length, 13, 'nine prior institutions plus four grounded dossiers');
    const record = institutions.topics.map(t => t.join(' ')).join(' ');
    for (const fact of ['appointed Cindermaw', 'Interior and Welfare', 'all five Crown provinces',
      'co-manages the whole Treasury', 'Superintendent', 'decommissioning',
      'different companion classes', 'whose cause I cannot explain',
      'mines and mint became intolerable', 'watch their lanterns',
      'return that affection']) {
      // Titles and office records may use their concise professional names.
      assert(record.includes(fact) || (fact === 'Superintendent' && C.rules.roomCaptains['supply-vale'].office.includes(fact)), fact);
    }
    assert(!/caused the flood|the sixth companion|now recruit.*Lifebinder/i.test(record));
    for (const topic of [
      'Garun — the old roads',
      'Veyrith — the unfinished sky',
      'Veyra — the common drill',
      'Whose peace?',
    ]) assert(institutions.topics.some(([name]) => name === topic), topic + ' available');
    const who = institutions.topics.find(([title]) => title === 'Whose peace?');
    assert.equal(who[1], AuthorCopy.K05.en);
    const wraiths = institutions.topics.find(([title]) => title === 'The Lantern Wraiths’ migration');
    assert.equal(wraiths[1], AuthorCopy.K06.en);
    const provinces = sections.find((section) => section.title === 'The provinces').topics;
    const march = provinces.find(([label]) => label === 'Flooded Marches');
    assert.equal(march[1], AuthorCopy.R05.en, 'Public R05 is not an evidence confession');
    const historical = sections.find((section) => section.title === 'Adversaries and their attacks').topics;
    const mirejaw = historical.find(([label]) => label === 'Mirejaw');
    assert(mirejaw[1].includes(AuthorCopy.K01.en), 'Current combat reference embeds approved history');
    assert(!institutions.topics.some(([name]) => name.includes('last mark')),
      'unclaimed throne cannot reveal the missing companion');
    assert.deepEqual(Object.keys(C.classes).sort(), ['mage', 'paladin', 'ranger']);
    assert.equal(C.rules.roomCaptains['supply-crown'].enduranceHp, 5000);

    const bosses = sections.find((s) => s.title === 'Adversaries and their attacks');
    for (const boss of C.data.bosses) assert(bosses.topics.some(([title]) => title === boss.name));
    assert(!sections.some((s) => s.title === 'The orders among the shelves'));
    assert(
      !JSON.stringify(sections).includes('proposed capturing'),
      'optional lore must not bypass unread evidence',
    );
    c.s.keeperEvidence = true;
    const unlocked = Archive.sections(c, { D: C.data, R: C.rules });
    const unlockedMarch = unlocked.find((section) => section.title === 'The provinces')
      .topics.find(([label]) => label === 'Flooded Marches')[1];
    assert.equal(unlockedMarch, AuthorCopy.R05.en + '\n\n' + AuthorCopy.R05_append.en);
    assert.equal(unlocked.find((section) => section.title === 'The orders among the shelves')
      .topics[0][1], AuthorCopy.P05.en);
    c.s.throneClaimed = true;
    const throne = Archive.sections(c, { D: C.data, R: C.rules });
    assert.equal(throne.find((section) => section.title === 'The Crown and its institutions')
      .topics.find(([label]) => label.includes('The last mark'))[1], AuthorCopy.Throne_Keeper.en);
    c.s.throneClaimed = false;
    assert(
      Archive.sections(c, { D: C.data, R: C.rules }).some(
        (s) => s.title === 'The orders among the shelves',
      ),
    );
    // Skill 1 has a dedicated normal/charged cooldown; the ordinary
    // cooldown table now controls Skill 2 onward. Test its actual live owner.
    const original = C.rules.balance.skills.cooldowns[2];
    try {
      C.rules.balance.skills.cooldowns[2] = 9.125;
      sections = Archive.sections(c, { D: C.data, R: C.rules });
      assert(sections.find((s) => s.title === 'Your skills').topics[1][2].includes('9.13 seconds'));
    } finally {
      C.rules.balance.skills.cooldowns[2] = original;
    }
    // Future/restored mode reads the shared guard and effective cooldown method.
    const oldMode = C.rules.resourceMode;
    try {
      C.rules.resourceMode = { manaEnabled: false };
      c.skillCooldown = (slot, charged) => (charged ? 11 : 4);
      sections = Archive.sections(c, { D: C.data, R: C.rules });
      const skill = sections.find((s) => s.title === 'Your skills').topics[0][2];
      assert(skill.includes('recovery 4 seconds') && skill.includes('Charged recovery: 11'));
      assert(!skill.includes('MP'));
      assert(
        !sections
          .find((s) => s.title === 'Companions and field bases')
          .topics.find((t) => t[0] === 'A Ranger’s care')[2]
          .includes('Mana recovery'),
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
const modeBefore = C.rules.resourceMode;
try {
  for (const manaEnabled of [false, true]) {
    C.rules.resourceMode = { manaEnabled };
    const shelves = Archive.sections(c, { D: C.data, R: C.rules });
    const records = shelves.find((s) => s.title === 'Adversaries and their attacks').topics;
    const keeper = records.find(([title]) => title === 'Drowned Keeper')[2];
    assert.equal(keeper.includes('draws back 15% of HP actually taken'), !manaEnabled);
    assert.equal(keeper.includes('drains 8% of the hero’s maximum mana'), manaEnabled);
    for (const family of ['abyss', 'citadel']) {
      const boss = C.data.bosses.find((b) => b.id === family);
      const answer = records.find(([title]) => title === boss.name)[2];
      assert.equal(answer.includes(C.rules.bossRecovery[family].name), !manaEnabled);
    }
    const lesson = shelves.find((s) => s.title === 'Experience and discipline').topics[1][2];
    assert.equal(lesson.includes('up to 20%'), !manaEnabled);
  }
} finally {
  C.rules.resourceMode = modeBefore;
}
// Distinct observed variants must survive deduplication, including equal-species
// creatures whose region, role or scaled stats differ.
const statsCampaign = new C(),
  originalCreature = statsCampaign.zone().enemies[0];
statsCampaign
  .zone()
  .enemies.push(
    { ...originalCreature, id: 'reference-stronger', maxHp: 987.5, damage: 123.25 },
    { ...originalCreature, id: 'reference-ranged', ranged: true },
    { ...originalCreature, id: 'reference-captain', roomCaptain: true },
  );
const reference = Archive.sections(statsCampaign, { D: C.data, R: C.rules });
const creatures = reference
  .find((s) => s.title === 'Adversaries and their attacks')
  .topics.find((t) => t[0] === 'Creatures encountered')[1];
assert(creatures.includes('HP 987.5 · damage 123.25'));
assert(creatures.includes('ranged') && creatures.includes('captain'));
assert(creatures.includes('Greenwood Vale'));
const battle = reference.find((s) => s.title === 'Battle and protection').topics;
const rogue = battle.find((t) => t[0] === 'Enemies under pressure');
assert(rogue[1].includes('rogue tactics') && rogue[1].includes('break pursuit'));
assert(
  rogue[2].includes('below ' + Math.round(C.rules.tacticalFoundation.woundedThreshold * 100) + '% HP') &&
    rogue[2].includes('half damage'),
  'Live tactical pressure figures, not a stale fixed percentage',
);
assert(!battle.find((t) => t[0] === 'Why a great volley loses force')[1].includes('ln('));
assert(battle.find((t) => t[0] === 'Why a great volley loses force')[2].includes('67.5%'));
assert(
  !reference
    .flatMap((s) => s.topics)
    .some((t) =>
      [
        'Quests without errands',
        'Room in the company',
        'Preparation before danger',
        'The cost of keeping a company',
        'Steel from the smith',
      ].includes(t[0]),
    ),
);
console.log(
  'PASS read-only optional Archive, all class/mode references, live figures/cooldowns, evidence gate, armor formula and crown failure event',
);
