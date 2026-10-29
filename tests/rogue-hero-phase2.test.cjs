'use strict';
// Phase 2: dormant Rogue Bard hero fundamentals. No public fourth-class entry.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
assert.throws(() => new Campaign('normal', 'rogue'), /Unknown mode or class/);
const foundation = R.rogueHeroFoundation;
assert.equal(foundation.classId, 'rogue');
assert.deepEqual(foundation.stats, { hp: 90, mp: 60, power: 18, armor: 3, speed: 300 });
assert.deepEqual(foundation.talents, { power: 7, mana: 2, hp: 27, speed: 38 });
assert.equal(foundation.weapon.kind, 'staff');
assert.equal(foundation.weapon.instrument, 'suspended-jingle-bell');
assert.equal(foundation.weapon.basicCue, 'bell-jingle');
assert.equal(foundation.endure.duration, 2);
assert.equal(foundation.endure.floorHp, 1);
assert.equal(Campaign.expeditionPartyCapFor('rogue', 1), 3);

// A temporary registry entry is test-only. It lets native mechanics execute
// without exposing a broken Rogue run in the real class-choice menu.
Campaign.classes.rogue = { ...foundation.stats, icon: '🔔' };
Campaign.talentProfiles.rogue = { ...foundation.talents };
try {
  function fresh(count = 1) {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.mercyTime = 0;
    g.s.rogueCharmRng = 1; // preserve the original Phase-2 hit witness
    g.s.valeFieldAwakened = true;
    g.s.party = [];
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.zone().props = [];
    g.zone().buildings = [];
    const enemies = Array.from({ length: count }, (_, i) => {
      const e = g.makeEnemy(
        { species: 'goblin', name: 'Bell test foe', level: 1,
          hp: 10000, damage: 0, gold: 0, xp: 0 },
        { x: 585 + i * 10, y: 500 },
      );
      e.aggro = true;
      e.returning = false;
      e.hp = e.maxHp;
      e.home = { x: e.x, y: e.y };
      return e;
    });
    g.zone().enemies = enemies;
    return { g, enemies };
  }

  const { g, enemies } = fresh(7);
  assert.deepEqual(g.s.party, [], 'fresh Rogue starts solo');
  assert.equal(g.hero.hp, 90);
  assert.equal(g.hero.maxHp, 90);
  assert.equal(g.hero.mp, 60);
  assert.equal(g.talentProfile().power, 7);
  assert.equal(g.heroBasicAttackApproachRange(), 260);
  assert.equal(g.heroSkillRange(1), 260, 'first tap available at level 1');
  assert.equal(g.heroSkillRange(1, true), 300, 'first charge available at level 1');
  assert.equal(g.cast(2, enemies[0].id), false);
  assert.equal(g.effects.filter((e) => e.type === 'rogueBellBasic').length, 0);

  const originalHP = enemies.map(e => e.hp);
  const originalGold = g.hero.gold;
  assert.equal(g.cast(1, enemies[0].id, false, null, true), true, 'automatic bell basic');
  assert(g.hero.basicCd > 0);
  assert.equal(g.hero.cd[0], 0, 'manual cooldown stays independent');
  assert.equal(g.hero.gold, originalGold, 'no purchase or Charm outcome');
  assert.equal(g.s.party.length, 0, 'no premature Charm conversion');
  assert.equal(g.s.projectiles.length, 0, 'no projectile actor');
  const realHit = g.effects.find(e => e.type === 'hit');
  // Engagement legitimately scales the opponent to its fighting max HP.
  // A real hit must reduce that MAX; pre-engagement HP is not comparable.
  assert(enemies[0].hp < enemies[0].maxHp, JSON.stringify({
    reason: 'primary took real damage', before: originalHP[0], after: enemies[0].hp,
    landed: g.effects.find(e => e.type === 'rogueBellBasic')?.landed,
    hit: realHit, hero: { x: g.hero.x, y: g.hero.y, hp: g.hero.hp },
    enemy: { id: enemies[0].id, x: enemies[0].x, y: enemies[0].y,
      home: enemies[0].home, aggro: enemies[0].aggro, returning: enemies[0].returning },
  }));
  assert.equal(enemies.slice(1).filter((e) => e.hp < e.maxHp).length, 2,
    'normal release contacts exactly two legal secondaries');
  const firstCue = g.effects.find(e => e.type === 'rogueBellBasic');
  assert.equal(firstCue.instrument, 'suspended-jingle-bell');
  assert.equal(firstCue.audioCue, 'bell-jingle');
  assert.equal(firstCue.combo, 1);
  assert.equal(firstCue.splashHits, 2);
  assert.equal(g.cast(1, enemies[0].id, false, null, true), false, 'basic recovery enforced');

  // Third legitimate release uses existing combo bookkeeping, with total
  // five contacts rather than unbounded area damage.
  for (let i = 0; i < 2; i++) {
    g.hero.basicCd = 0;
    g.s.time += 0.85;
    assert(g.castMovementBasic());
  }
  const third = g.effects.filter(e => e.type === 'rogueBellBasic').at(-1);
  assert.equal(third.combo, 3);
  assert.equal(third.splashHits, 4);

  // No target, blocked target, or unsupported manual action may spend time,
  // MP, crit RNG, cooldown or mutate the company.
  const noTarget = fresh();
  noTarget.g.zone().enemies = [];
  const before = noTarget.g.snapshot();
  assert.equal(noTarget.g.castMovementBasic(), false);
  assert.deepEqual(noTarget.g.snapshot(), before);

  // Both starting manual forms must deal real spatial combat damage
  // without spawning fake Charm companions or duplicating the auto cooldown.
  const manual = fresh(6), m = manual.g, foes = manual.enemies;
  const ally = m.unit('soldier', foes[0].x + 12, foes[0].y + 12);
  m.s.party.push(ally);
  const baseline = m.companionBasicAttackDamage(ally),
    originalSpecial = m.companionAttackDamage(ally);
  assert(m.cast(1, foes[0].id), 'normal Skill 1 available from level one');
  assert.equal(m.hero.cd[0], m.skillCooldown(1));
  assert.equal(m.rogueSongBoon(m.hero, 'refrain')?.basicDamage, 0.05,
    'solo Rogue is eligible for Skill 1 basic-damage boon inside the cast area');
  assert.equal(m.hero.chargedCd[0], 0);
  assert.equal(m.hero.basicCd, 0);
  assert(m.companionBasicAttackDamage(ally) > baseline, 'friendly mirror actually changes basics');
  assert.equal(m.companionAttackDamage(ally), originalSpecial, 'special attacks not buffed');
  assert.equal(m.cast(1, foes[0].id), false, 'tap respects cooldown');
  m.hero.cd[0] = 0;
  assert(m.cast(1, foes[0].id, true), 'charged Skill 1 available at level one');
  assert(m.hero.chargedCd[0] > m.hero.cd[0], 'charged recovery distinct');
  assert.equal(m.cast(1, foes[0].id, true), false, 'charge respects longer cooldown');
  assert.equal(m.cast(2, foes[0].id), false, 'later performances remain inaccessible');
  const cues = m.effects.filter(e => e.type === 'rogueBellSkill1');
  assert.deepEqual(cues.map(e => e.form), ['tap', 'charged']);
  assert(cues[1].hits >= cues[0].hits, 'charged area capacity not smaller');
  assert.equal(cues[0].audioCue, 'bell-jingle');
  assert.equal(cues[1].allyCount, 1);
  assert.equal(m.companionBasicAttackDamage(ally), baseline * 1.07);
  const skillCard = require('../src/prototype/skill-reference.js').describe(m, 1);
  assert(skillCard?.tap && skillCard?.charge && skillCard?.auto,
    'the starting three forms must have gameplay-facing descriptions');
  const saveBoon = m.snapshot();
  assert.equal(saveBoon.party[0].rogueSharpRefrainBonus, undefined);
  assert.equal(saveBoon.party[0].rogueSharpRefrainUntil, undefined);
  assert.doesNotThrow(() => Campaign.validate(saveBoon));
  const forgedBoon = structuredClone(saveBoon);
  forgedBoon.party[0].rogueSharpRefrainBonus = 100;
  assert.throws(() => Campaign.validate(forgedBoon), /Invalid saved temporary Rogue boon/);
  m.s.time += 5.1;
  assert.equal(m.companionBasicAttackDamage(ally), baseline, 'benefit expires');

  const survival = fresh().g;
  survival.hero.hp = 8;
  assert(survival.hitParty(survival.hero, 1000), 'first lethal hit lands');
  assert.equal(survival.hero.hp, 1, 'Endure at 1 HP');
  assert.equal(survival.hero.rogueEndureUsed, true);
  assert.equal(survival.hero.rogueEndureUntil, survival.s.time + 2);
  assert.equal(survival.hitParty(survival.hero, 1000), false, 'within Endure window');
  assert.equal(survival.hero.hp, 1);
  const saved = survival.snapshot();
  assert.equal(saved.hero.rogueEndureUsed, true);
  assert.equal(saved.hero.rogueEndureUntil, undefined);
  assert.doesNotThrow(() => Campaign.validate(saved));
  const invalid = structuredClone(saved);
  invalid.hero.rogueEndureUsed = 'yes';
  assert.throws(() => Campaign.validate(invalid), /Invalid Rogue Endure state/);

  survival.s.time += 2.1;
  const deathsBefore = survival.s.statistics.deaths;
  assert(survival.hitParty(survival.hero, 1000));
  assert.equal(survival.s.statistics.deaths, deathsBefore + 1, 'no endless retrigger');
  assert.equal(survival.hero.rogueEndureUsed, false, 'standard recovery starts a new life');
  assert.equal(survival.hero.rogueEndureUntil, undefined);

  // Phase 3: exercise the real damage-and-conversion path.
  function capture(g, species = 'goblin', ranged = false, hpFraction = 1) {
    const e = g.makeEnemy(
      { species, name: species, level: 1, hp: 10000,
        damage: 0, gold: 47, xp: 53 },
      { x: 585, y: 500 },
    );
    e.ranged = ranged;
    e.aggro = true;
    // A real significant wound is needed: tiny losses may round to full
    // friendly HP, which is valid and does not justify a healing exception.
    e.hp = Math.max(1, Math.round(e.maxHp * hpFraction));
    g.zone().enemies = [e];
    g.hero.basicCd = 0;
    g.s.rogueCharmRng = 12345; // reproducible successful LCG result
    const kills = g.s.statistics.kills, gold = g.hero.gold,
      quests = structuredClone(g.s.quests);
    assert.equal(g.cast(1, e.id, false, null, true), true);
    assert.equal(g.s.statistics.kills, kills);
    assert.equal(g.hero.gold, gold);
    assert.deepEqual(g.s.quests, quests);
    return e;
  }
  const legal = fresh(1).g;
  const source = capture(legal);
  assert(!legal.zone().enemies.includes(source), 'hostile removed once');
  assert.equal(legal.s.party.length, 1);
  const capturedAlly = legal.s.party[0];
  assert.equal(capturedAlly.charmOrigin.typeId, 'enemy:goblin:melee');
  assert.equal(legal.companionDisplayName(capturedAlly), 'Pipsqueak',
    'English game auto-names a legal capture without any naming dialog');
  assert.equal(capturedAlly.customName, 'Pipsqueak');
  assert.equal(legal.nameCompanion(capturedAlly.id, 'Another'), false,
    'existing permanent-name contract blocks later renaming');
  assert.equal(capturedAlly.charmOrigin.typeName, 'Goblin',
    'personal names cannot overwrite the original monster subtype');
  assert.equal(capturedAlly.charmOrigin.sourceEnemyId, source.id);
  assert.equal(capturedAlly.hp, capturedAlly.maxHp,
    'auto-named capture always begins fully healed');
  assert.equal(legal.s.charmCaptures[capturedAlly.id].typeId, 'enemy:goblin:melee');
  assert.equal(legal.effects.filter((e) => e.type === 'rogueCharm').length, 1);
  assert.notEqual(legal.s.heroTarget, source.id, 'captured hostile cannot remain targeted');
  const savedCapture = legal.snapshot();
  assert.doesNotThrow(() => Campaign.validate(savedCapture));
  const restoredCapture = Campaign.restore(savedCapture, () => 0.9);
  assert.deepEqual(restoredCapture.s.party[0].charmOrigin, capturedAlly.charmOrigin);
  assert.equal(restoredCapture.s.party[0].customName, 'Pipsqueak',
    'a Charmed nickname survives save/restore without changing capture identity');
  assert.deepEqual(restoredCapture.s.rogueNicknameCursor, { en: 1, es: 0 });
  const oldNicknameSave = structuredClone(savedCapture);
  delete oldNicknameSave.rogueNicknameCursor;
  assert.deepEqual(Campaign.validate(oldNicknameSave).rogueNicknameCursor,
    { en: 0, es: 0 }, 'old v4 saves acquire safe rotation defaults');
  const badNicknameSave = structuredClone(savedCapture);
  badNicknameSave.rogueNicknameCursor.es = 70;
  assert.throws(() => Campaign.validate(badNicknameSave),
    /Invalid Charm nickname rotation/);
  // Identity survives ordinary native recovery, including fallen reserve status.
  capturedAlly.hp = 0;
  capturedAlly.active = false;
  const fallSnapshot = legal.snapshot();
  assert.equal(fallSnapshot.party[0].charmOrigin.typeId, 'enemy:goblin:melee');
  // The Captain provides ordinary care: Phase 4 will extend species combat AI,
  // not discard the source identity during standard healing/recovery.
  capturedAlly.active = true;
  capturedAlly.hp = Math.max(1, capturedAlly.maxHp);
  capturedAlly.active = false;
  assert(legal.dismissCompanion(capturedAlly.id), 'resting capture dismisses normally');
  assert.equal(legal.s.charmCaptures[capturedAlly.id], undefined);
  assert.doesNotThrow(() => Campaign.validate(legal.snapshot()));
  const tampered = structuredClone(savedCapture);
  tampered.party[0].charmOrigin.typeId = 'enemy:goblin:ranged';
  assert.throws(() => Campaign.validate(tampered), /Invalid charm provenance/);
  const bareClaim = structuredClone(savedCapture);
  delete bareClaim.charmCaptures;
  assert.throws(() => Campaign.validate(bareClaim), /Invalid charm provenance/);
  const malformedType = structuredClone(savedCapture);
  malformedType.party[0].charmOrigin.role = 'archer';
  malformedType.charmCaptures[malformedType.party[0].id].role = 'archer';
  assert.throws(() => Campaign.validate(malformedType), /Invalid charm provenance/);

  // Fake reserve units cannot evade the total-owned per-subtype rank quota.
  // Keep only the legitimate capture active so the active-field cap does not
  // reject the fixture before the more specific quota invariant runs.
  const forgedOverflow = structuredClone(savedCapture);
  for (let i = 0; i < 3; i++) {
    const extra = structuredClone(forgedOverflow.party[0]);
    extra.id = 'ally-' + (900 + i);
    extra.active = false;
    extra.charmOrigin.sourceEnemyId = 'enemy-' + (900 + i);
    forgedOverflow.party.push(extra);
    forgedOverflow.charmCaptures[extra.id] = { ...extra.charmOrigin };
  }
  forgedOverflow.nextId = Math.max(forgedOverflow.nextId, 904);
  assert.throws(() => Campaign.validate(forgedOverflow), /Invalid charm subtype quota/);


  const excluded = fresh(1).g, elite = excluded.zone().enemies[0];
  elite.captain = true;
  excluded.s.rogueCharmRng = 12345;
  assert(excluded.cast(1, elite.id, false, null, true));
  assert.equal(excluded.s.rogueCharmRng, 12345, 'captain exclusion spends no roll');
  assert.equal(excluded.s.party.length, 0);
  elite.captain = false;
  elite.hp = 1;
  excluded.hero.basicCd = 0;
  assert(excluded.cast(1, elite.id, false, null, true));
  assert.equal(excluded.s.party.length, 0, 'lethal primary cannot Charm');
  assert.equal(excluded.s.rogueCharmRng, 12345);

  for (const [rankIndex, cap] of [3, 4, 4, 5, 6, 7].entries()) {
    const g = fresh(1).g;
    g.s.expeditionRank = rankIndex + 1;
    for (let i = 0; i < cap; i++) capture(g);
    assert.equal(g.s.party.length, cap);
    const refused = capture(g);
    assert(g.zone().enemies.includes(refused), 'quota refusal leaves enemy alive');
    assert.equal(g.s.party.length, cap);
    assert.equal(g.s.rogueCharmRng, 12345, 'quota refusal spends no roll');
    capture(g, 'goblin', true);
    assert.equal(g.s.party.at(-1).charmOrigin.typeId, 'enemy:goblin:ranged');
    assert.equal(g.s.party.length, cap + 1);
  }
  const reserveGame = fresh(1).g;
  reserveGame.s.party = Array.from({ length: 3 }, () =>
    reserveGame.unit('soldier', 500, 500));
  capture(reserveGame);
  assert.equal(reserveGame.s.party.at(-1).active, false,
    'full field admits captured ally into reserve');
  assert.equal(reserveGame.s.party.at(-1).customName, 'Pipsqueak',
    'reserve capture receives the exact same automatic nickname');
  assert.equal(reserveGame.s.party.at(-1).hp, reserveGame.s.party.at(-1).maxHp,
    'reserve capture also arrives at full health');
  assert.doesNotThrow(() => Campaign.validate(reserveGame.snapshot()));

  // Native zone admission follows the permanent owned company, not a species'
  // home-region spawn table. Travel must neither heal nor recreate a captured mob.
  const traveler = fresh(1).g;
  capture(traveler);
  const transported = traveler.s.party[0],
    transportedId = transported.id,
    sourceOrigin = structuredClone(transported.charmOrigin),
    travelHp = transported.hp;
  assert.equal(sourceOrigin.sourceZone, 'vale');
  assert(traveler.enter('march'), 'native region transition succeeds');
  assert.equal(traveler.s.party.find((u) => u.id === transportedId), transported);
  assert.equal(transported.hp, travelHp, 'wound survives the first journey');
  assert(traveler.enter('highlands'), 'Goblin legitimately accompanies a hero into the Highlands');
  assert.deepEqual(transported.charmOrigin, sourceOrigin, 'species and source do not change with region');
  assert.equal(transported.hp, travelHp, 'regional crossing is not a free heal');
  assert(Math.hypot(transported.x - traveler.hero.x, transported.y - traveler.hero.y) < 150,
    'active Charmed companion appears beside the hero in the destination');
  const transportedSave = traveler.snapshot();
  assert.doesNotThrow(() => Campaign.validate(transportedSave));
  const transportedReload = Campaign.restore(transportedSave, () => 0.9);
  assert.deepEqual(transportedReload.s.party[0].charmOrigin, sourceOrigin);
  assert.equal(transportedReload.s.party[0].hp, travelHp);
  assert.equal(transportedReload.zoneId, 'highlands');

  // Phase 3 closing lifecycle cases. Verify actual combat and save receipts,
  // not an invented direct-call success or a speculative species stat table.
  const wounded = fresh().g;
  const woundSource = capture(wounded, 'goblin', false, 0.25);
  const woundedAlly = wounded.s.party[0];
  const postHitFraction = woundSource.hp / woundSource.maxHp;
  assert(postHitFraction > 0 && postHitFraction < 1, 'capture source survived wounded');
  assert.equal(woundedAlly.hp, woundedAlly.maxHp,
    'even a deeply wounded surviving monster is fully healed by Charm');
  assert.equal(woundedAlly.customName, 'Pipsqueak');
  const woundedSave = wounded.snapshot();
  assert.doesNotThrow(() => Campaign.validate(woundedSave));
  const woundedReloaded = Campaign.restore(woundedSave, () => 0.9);
  assert.equal(woundedReloaded.s.party[0].hp, woundedAlly.hp,
    'save/restore preserves the fully healed capture');
  assert.equal(woundedReloaded.s.party[0].maxHp, woundedAlly.maxHp);
  assert.deepEqual(woundedReloaded.s.party[0].charmOrigin, woundedAlly.charmOrigin);

  // Later ordinary wounds still follow native companion level-up semantics:
  // retain absolute missing HP; no repeat Charm-healing effect.
  woundedAlly.hp -= 8;
  const initialDamage = wounded.companionAttackDamage(woundedAlly),
    initialHp = woundedAlly.hp, initialMax = woundedAlly.maxHp;
  wounded.hero.level = 5;
  wounded.syncCompanionLevelStats();
  assert(woundedAlly.maxHp > initialMax, 'owned Charm ally gains max HP with hero level');
  assert.equal(woundedAlly.hp,
    initialHp + woundedAlly.maxHp - initialMax,
    'native level-up adjustment, not full-heal or stale level-one health');
  assert(wounded.companionAttackDamage(woundedAlly) > initialDamage,
    'native companion damage scales with hero level');
  assert.equal(woundedAlly.charmOrigin.typeId, 'enemy:goblin:melee');
  assert.doesNotThrow(() => Campaign.validate(wounded.snapshot()));

  // Language is presentation preference, not a gameplay RNG stream.
  const bilingual = fresh().g;
  bilingual.rogueNicknameLanguage = 'es';
  capture(bilingual);
  assert.equal(bilingual.s.party[0].customName, 'Pulguillas');
  assert.deepEqual(bilingual.s.rogueNicknameCursor, { en: 0, es: 1 });
  bilingual.rogueNicknameLanguage = 'en';
  capture(bilingual);
  assert.equal(bilingual.s.party[0].customName, 'Pulguillas',
    'existing Spanish nickname does not change with interface language');
  assert.equal(bilingual.s.party[1].customName, 'Pipsqueak');
  assert.deepEqual(bilingual.s.rogueNicknameCursor, { en: 1, es: 1 });
  const bilingualReload = Campaign.restore(bilingual.snapshot(), () => 0.9);
  assert.deepEqual(bilingualReload.s.rogueNicknameCursor, { en: 1, es: 1 });
  assert.deepEqual(bilingualReload.s.party.map(u => u.customName),
    ['Pulguillas', 'Pipsqueak']);

  // Every pool contains seventy distinct valid names. No Charm/combat RNG is
  // consumed when selecting the next suggestion, even at wraparound.
  const rotation = fresh().g, charmRngBeforeNames = rotation.s.rogueCharmRng;
  for (const locale of ['en', 'es']) {
    rotation.rogueNicknameLanguage = locale;
    const collected = Array.from({ length: 70 },
      () => rotation.nextRogueCharmNickname());
    assert.deepEqual(collected, R.rogueCharmNicknames[locale]);
    assert.equal(new Set(collected).size, 70);
    assert(collected.every((name) => Campaign.normalizeCharacterName(name) === name));
    assert.equal(rotation.nextRogueCharmNickname(), collected[0],
      'after all seventy have been used the pool starts again');
  }
  assert.equal(rotation.s.rogueCharmRng, charmRngBeforeNames,
    'nickname selection must not alter the independent Charm probability');
  const usedName = fresh().g;
  capture(usedName);
  usedName.s.rogueNicknameCursor.en = 0;
  capture(usedName);
  assert.deepEqual(usedName.s.party.map(u => u.customName),
    ['Pipsqueak', 'Stinkums'], 'active/reserve names in use are skipped');

  // One seeded miss consumes exactly one separate Charm draw while keeping
  // the lawful enemy and every companion intact.
  const missed = fresh().g, missedFoe = missed.zone().enemies[0];
  missed.s.rogueCharmRng = 0;
  assert(missed.cast(1, missedFoe.id, false, null, true));
  assert.equal(missed.s.rogueCharmRng, 1013904223, 'one failed 12% roll');
  assert(missed.zone().enemies.includes(missedFoe), 'roll miss leaves hostile alive');
  assert.equal(missed.s.party.length, 0);

  // Legal splash damage is never a second, hidden capture opportunity.
  const splash = fresh(3).g;
  splash.s.rogueCharmRng = 12345;
  const splashFoes = [...splash.zone().enemies];
  assert(splash.cast(1, splashFoes[0].id, false, null, true));
  assert.equal(splash.s.party.length, 1, 'one primary admits at most one ally');
  assert.equal(splash.effects.filter((e) => e.type === 'rogueCharm').length, 1);
  assert.equal(splashFoes.slice(1).filter((e) => e.hp < e.maxHp).length, 2,
    'real splash damages other targets but never charms them');
  assert(splash.zone().enemies.includes(splashFoes[1]));
  assert(splash.zone().enemies.includes(splashFoes[2]));

  // Excluded families must never consume Charm RNG, even when the ordinary
  // basic combat release is allowed to damage the target.
  for (const flag of [
    'captain', 'roomCaptain', 'fieldCaptain', 'guard', 'roomGuard',
    'summon', 'reinforcement', 'nightOnly', 'owner', 'crownTroop',
    'mountedCrownRider', 'veraEscort', 'family',
  ]) {
    const excludedCase = fresh().g, foe = excludedCase.zone().enemies[0];
    foe[flag] = true;
    excludedCase.s.rogueCharmRng = 12345;
    excludedCase.cast(1, foe.id, false, null, true);
    assert.equal(excludedCase.s.rogueCharmRng, 12345,
      flag + ' may never spend a Charm roll');
    assert.equal(excludedCase.s.party.length, 0,
      flag + ' may never join the company');
  }
  // An ordinary authored melee subtype cannot be forged by toggling a lone
  // unapproved ranged flag on an unrelated species.
  const invalidSubtype = fresh().g, illegal = invalidSubtype.zone().enemies[0];
  illegal.species = 'wraith';
  illegal.ranged = true;
  invalidSubtype.s.rogueCharmRng = 12345;
  invalidSubtype.cast(1, illegal.id, false, null, true);
  assert.equal(invalidSubtype.s.party.length, 0);
  assert.equal(invalidSubtype.s.rogueCharmRng, 12345);

  // Cancellation at a native hero-death boundary spends no RNG or member.
  const noHero = fresh().g, noHeroFoe = noHero.zone().enemies[0];
  noHero.hero.hp = 0;
  noHero.s.rogueCharmRng = 12345;
  assert.equal(noHero.cast(1, noHeroFoe.id, false, null, true), false);
  assert.equal(noHero.s.rogueCharmRng, 12345);
  assert.equal(noHero.s.party.length, 0);

  // A legitimate non-Rogue successor retains ownership, wounds, and exact
  // subtype, while their original-class active capacity still applies.
  const inheritance = fresh().g;
  capture(inheritance);
  const capturedId = inheritance.s.party[0].id,
    originalOrigin = structuredClone(inheritance.s.party[0].charmOrigin);
  inheritance.s.challenge.succession = true;
  inheritance.s.challenge.fallen = ['rogue'];
  inheritance.s.challenge.pending = true;
  inheritance.hero.hp = 0;
  assert(inheritance.successor('mage'), 'Mage may inherit a former Rogue company');
  assert.equal(inheritance.s.party[0].id, capturedId);
  assert.deepEqual(inheritance.s.party[0].charmOrigin, originalOrigin);
  assert.equal(inheritance.s.charmCaptures[capturedId].typeId, originalOrigin.typeId);
  assert.doesNotThrow(() => Campaign.validate(inheritance.snapshot()));
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
console.log('PASS Rogue Skill 1, Endure, Charm, subtype caps, save and three-class isolation');
