'use strict';
// E0 is a dormant combat contract, not approval to publish a fifth class.
// The temporary registry below exists ONLY in this isolated Node test process.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
assert.equal(C.classes.strategist, undefined);
assert.equal(C.heroCombatSupports('strategist'), true,
  'all six native startup forms now have a separate class-owned combat path');
assert.equal(C.classAdmissionIssues('strategist', {
  icon: 'test', stats: C.classes.paladin, talents: C.talentProfiles.paladin,
}).includes('missing authored combat owner'), false,
  'starter combat owner exists but public class still lacks registration');
assert.throws(() => new C('normal', 'strategist'), /Unknown mode or class/);
const originals = Object.keys(C.classes);
// The E0 fixture must now use the only permitted preview mode; public
// Normal registration is correctly refused even in this diagnostic process.
C.classes.strategist = { ...C.classes.paladin };
C.talentProfiles.strategist = { ...C.talentProfiles.paladin };
try {
  const make = (stock = 0) => {
    const g = new C('developer', 'strategist', () => 0.9);
    g.s.valeFieldAwakened = true;
    g.s.mercyTime = 0;
    g.s.strategistAcidBottles = stock;
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.zone().props = [];
    g.zone().buildings = [];
    g.zone().npcs = [];
    const foe = (id, x, y, hp = 10000) => {
      const e = g.makeEnemy({
        species: 'goblin', name: id, level: 1,
        hp, damage: 0, gold: 0, xp: 0,
      }, { x, y });
      e.id = id; e.aggro = true; e.returning = false;
      return e;
    };
    const primary = foe('e0-primary', 560, 500);
    const nearby = foe('e0-nearby', 590, 500);
    const distant = foe('e0-far', 850, 500);
    g.zone().enemies = [primary, nearby, distant];
    const events = [];
    const emit = g.event.bind(g);
    g.event = (type, info) => {
      if (type.startsWith('strategist')) events.push({ type, ...info });
      return emit(type, info);
    };
    return { g, primary, nearby, distant, events };
  };
  const hit = (g, target) => {
    g.hero.basicCd = 0;
    return g.cast(1, target.id, false, null, true);
  };
  {
    const g = new C('developer', 'strategist', () => 0.9);
    assert.deepEqual(g.s.party.map((u) => u.type), ['soldier', 'archer']);
    assert.deepEqual(g.hero.skills, [1, 1, 1, 0, 0, 0, 0, 0]);
    assert.equal(g.s.companionCombatTraining, 1,
      'Mineral starter does not unlock any companion skills');
    assert.equal(g.companionSecondSkillUnlocked(), false,
      'native companion AI must not treat Ogre starting Mineral as training');
    assert.equal(g.s.strategistAcidBottles, 0);
    assert.equal(C.validate(g.snapshot()).companionCombatTraining, 1);
    const withoutTraining = g.snapshot();
    delete withoutTraining.companionCombatTraining;
    assert.equal(C.validate(withoutTraining).companionCombatTraining, 1,
      'missing training default must stay core-only for Strategist');
    assert.equal(C.restore(g.snapshot(), () => 0.9).s.strategistAcidBottles, 0);
    for (const bad of [-1, 1.5, R.strategistBasicFoundation.maxBottles + 1]) {
      const s = g.snapshot(); s.strategistAcidBottles = bad;
      assert.throws(() => C.validate(s), /Acid Bottle/);
    }
    const paladin = new C('normal', 'paladin', () => 0.9);
    const changed = paladin.snapshot(); changed.strategistAcidBottles = 1;
    assert.throws(() => C.validate(changed), /Acid Bottle/);
    assert.equal(C.validate(paladin.snapshot()).companionCombatTraining, 1);
    // Native skill-2 learning cannot reinterpret an Ogre Mineral lesson as
    // conventional companion training (no approved Ogre teacher yet).
    const lesson = C.data.skills.find((s) => s[0] === 2);
    g.hero.skills[1] = 0;
    g.s.rescued[lesson[4]] = true;
    g.hero.gold = 100000;
    assert.equal(g.learn(2, lesson[4]), true);
    assert.equal(g.s.companionCombatTraining, 1);
    assert.equal(g.companionSecondSkillUnlocked(), false,
      'learning Mineral cannot unlock a Soldier/Archer second special');
    g.s.companionCombatTraining = 2;
    assert.equal(g.companionSecondSkillUnlocked(), true,
      'an independently and lawfully earned companion-training flag still works');
  }
  {
    const {g, primary, nearby, distant, events} = make(1);
    assert.equal(g.cast(1, primary.id), false, 'manual skills remain disabled');
    assert.equal(g.cast(2, primary.id, false, null, true), false);
    assert.equal(g.cast(1, primary.id, true, null, true), false);
    assert.equal(hit(g, distant), false, 'no dagger through 90-unit boundary');
    assert.equal(g.hero.basicCd, 0, 'out of reach spends no recovery');
    for (let i = 1; i <= 3; i++) {
      assert(hit(g, primary), 'legitimate ordinary basic');
      assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1)?.step, i);
      assert.equal(g.basicComboStep, 0,
        'Ogre never touches other classes attempt-based combo');
    }
    assert.equal(g.s.strategistAcidBottles, 0, 'exactly one shared bottle spent');
    const splash = events.filter((e) => e.type === 'strategistAcidSplash');
    assert.equal(splash.length, 1);
    assert(splash[0].hits >= 1, 'splash must use native actual HP loss');
    assert(nearby.hp < nearby.maxHp, 'nearby enemy receives actual splash');
    assert.equal(distant.hp, distant.maxHp, 'no fictitious long-range splash');
    for (let i = 0; i < 3; i++) assert(hit(g, primary));
    assert.equal(g.s.strategistAcidBottles, 0, 'zero cannot go negative');
    assert.equal(events.filter((e) => e.type === 'strategistAcidSplash').length, 1,
      'stockout cannot spawn a second splash');
  }
  {
    const { g, primary, nearby, events } = make(2);
    assert(hit(g, primary));
    assert(hit(g, primary));
    const nativeDamage = g.damage.bind(g);
    g.damage = () => false;
    assert(hit(g, nearby), 'legal different-target attempt may still be blocked');
    g.damage = nativeDamage;
    assert(hit(g, primary));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'a blocked attempted switch ends the prior target rhythm');
    assert.equal(g.s.strategistAcidBottles, 2);
  }
  {
    const { g, primary, nearby, events } = make(2);
    assert(hit(g, primary));
    assert(hit(g, primary));
    // Resolver true without HP change (e.g. all damage absorbed by a shield)
    // must not be mistaken for a landed dagger.
    const realDamage = g.damage.bind(g);
    g.damage = () => true;
    assert(hit(g, primary), 'a real attempt still consumes attack recovery');
    g.damage = realDamage;
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').length, 2);
    assert.equal(g.s.strategistAcidBottles, 2);
    assert(hit(g, primary));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 3);
    assert.equal(g.s.strategistAcidBottles, 1);
    assert(hit(g, nearby));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'new actually hit target restarts rhythm');
    g.s.time += R.strategistBasicFoundation.resetSeconds + 0.01;
    assert(hit(g, nearby));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'time expiry restarts rhythm');
    assert(hit(g, nearby));
    g.s.statistics.deaths++;
    assert(hit(g, nearby));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'native death counter invalidates even a same-zone life');
    assert(hit(g, nearby));
    g.resetBasicCombo();
    assert(hit(g, nearby));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'native reset also clears the isolated rhythm');
  }
  {
    const {g, primary, events} = make(1);
    assert(hit(g, primary));
    assert(hit(g, primary));
    assert(g.enter('march'), 'ordinary travel leaves the prior zone');
    assert(g.enter('vale'), 'returning to the old zone succeeds');
    g.s.mercyTime = 0;
    g.zone().props = [];
    g.zone().buildings = [];
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    const returned = g.zone().enemies.find((e) => e.id === primary.id);
    assert(returned && returned.hp > 0, 'same native foe still belongs to zone');
    Object.assign(returned, { x: 560, y: 500, aggro: true, returning: false });
    assert(hit(g, returned));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'travel out and back cannot finish a pre-travel third-contact rhythm');
  }
  {
    const {g, primary, events} = make(1);
    assert(hit(g, primary));
    primary.hp = 1;
    assert(hit(g, primary), 'native lethal contact');
    assert.equal(primary.hp, 0);
    const returned = g.makeEnemy({
      species: 'goblin', name: 'Reused identity', level: 1,
      hp: 10000, damage: 0, gold: 0, xp: 0,
    }, {x: 560, y: 500});
    Object.assign(returned, { id: primary.id, aggro: true, returning: false });
    g.zone().enemies = [returned];
    assert(hit(g, returned));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1,
      'newly alive same-ID enemy is not the previously killed dagger target');
  }
  {
    // Target A -> B -> A without an intervening attack must not counterfeit
    // a third *consecutive* landed dagger on A.
    const {g, primary, nearby, distant, events} = make(1);
    distant.neutral = true;
    assert(hit(g, primary));
    assert(hit(g, primary));
    assert.equal(g.cycleHeroTarget()?.id, primary.id);
    assert.equal(g.cycleHeroTarget()?.id, nearby.id);
    assert.equal(g.cycleHeroTarget()?.id, primary.id);
    assert(hit(g, primary));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1);
    assert.equal(g.s.strategistAcidBottles, 1, 'switching away prevents unintended Acid spend');
  }
  {
    // A direct manual hold on another live foe is a target change too.
    const {g, primary, nearby, events} = make(1);
    assert(hit(g, primary));
    assert(hit(g, primary));
    assert.equal(g.holdHeroTarget(() => true, nearby.id)?.id, nearby.id);
    assert(hit(g, primary));
    assert.equal(events.filter((e) => e.type === 'strategistDaggerLanded').at(-1).step, 1);
    assert.equal(g.s.strategistAcidBottles, 1);
  }
  {
    const {g, primary, events} = make(1);
    assert(hit(g, primary));
    assert(hit(g, primary));
    const saved = g.snapshot();
    assert.equal(saved.strategistAcidBottles, 1, 'stock persists, cadence does not');
    const restored = C.restore(saved, () => 0.9);
    assert.equal(restored.s.strategistAcidBottles, 1);
    assert.equal(restored.basicComboStep, 0);
    restored.s.valeFieldAwakened = true;
    restored.s.mercyTime = 0;
    restored.hero.basicCd = 0;
    const foe = restored.zone().enemies.find((e) => e.id === primary.id);
    Object.assign(foe, { x: 560, y: 500, aggro: true, returning: false });
    Object.assign(restored.hero, { x: 500, y: 500, order: null });
    const resume = [];
    const oldEmit = restored.event.bind(restored);
    restored.event = (type, payload) => {
      if (type === 'strategistDaggerLanded') resume.push(payload);
      return oldEmit(type, payload);
    };
    assert(hit(restored, foe));
    assert.equal(resume.at(-1).step, 1, 'save/restore starts a fresh real contact rhythm');
    assert.equal(restored.s.strategistAcidBottles, 1,
      'save/reload cannot sneak a third-hit bottle spend');
    assert.equal(events.filter((e) => e.type === 'strategistAcidSplash').length, 0);
  }
  {
    // Gate 3 isolated preview: separate personal Dodge and melee retaliation.
    // This fixture's class registry never reaches the playable app.
    const { g, primary, events } = make(0);
    primary.damage = primary.baseDamage = 32;
    g.random = () => 0; // both independent provisional rolls succeed
    const heroHp = g.hero.hp, foeHp = primary.hp;
    g.enemyStartBasic(primary, g.hero, false);
    assert.equal(g.hero.hp, heroHp,
      'Ogre Dodge prevents its own true enemy melee basic hit');
    assert.equal(events.filter((e) => e.type === 'strategistDodge').length, 1);
    assert(primary.hp < foeHp,
      'Ogre can independently retaliate on the same Dodged melee basic');
    const counters = events.filter((e) => e.type === 'strategistRetaliation');
    assert.equal(counters.length, 1, 'one and only one counter per melee basic');
    assert.equal(counters[0].dodged, true);
    const pastCounterHp = primary.hp;
    g.random = () => 0.99;
    g.enemyStartBasic(primary, g.hero, false);
    assert(g.hero.hp < heroHp, 'ordinary hit still lands when Ogre Dodge fails');
    assert.equal(primary.hp, pastCounterHp, 'retaliation remains chance-based');
    assert.equal(events.filter((e) => e.type === 'strategistRetaliation').length, 1);
  }
  {
    const { g, primary, events } = make(0);
    primary.damage = primary.baseDamage = 32;
    g.random = () => 0; // if eligible, Dodge always succeeds
    const hp = g.hero.hp;
    assert.equal(g.hitParty(g.hero, 32, 0, primary.id), false,
      'source-verified enemy projectile/special contacts may Dodge personally');
    assert.equal(g.hero.hp, hp);
    assert.equal(events.filter((e) => e.type === 'strategistDodge').length, 1);
    assert.equal(events.filter((e) => e.type === 'strategistRetaliation').length, 0,
      'only a real melee basic can trigger retaliation');
    assert.equal(g.hitParty(g.hero, 32, 0, null), true,
      'ambient/reflected unowned damage cannot be Dodged');
    assert(g.hero.hp < hp);
    const before = g.s.party[0].hp;
    assert.equal(g.hitParty(g.s.party[0], 32, 0, primary.id), true,
      'Ogre Dodge never protects companions');
    assert(g.s.party[0].hp < before);
    assert.equal(events.filter((e) => e.type === 'strategistDodge').length, 1);
  }
  {
    const { g, primary, events } = make(0);
    primary.damage = primary.baseDamage = 32;
    g.random = () => 0;
    // A ranged basic starts an aim, not a close incoming melee contact.
    g.enemyStartBasic(primary, g.hero, true);
    assert(primary.rangedAim, 'original native ranged aim stays authoritative');
    assert.equal(events.filter((e) => e.type === 'strategistRetaliation').length, 0);
    // A nearby source-only hit from an already immune hero is refused,
    // not turned into an offensive counter.
    g.hero.immune = 1;
    g.enemyStartBasic(primary, g.hero, false);
    assert.equal(events.filter((e) => e.type === 'strategistRetaliation').length, 0);
  }

  {
    // v3.2 Water tap: existing Slow alone, and one legal landed contact Trace.
    const { g, primary, events } = make(0);
    g.applySlow(g.hero, 2);
    const debt = g.hero.basicCd;
    assert.equal(g.cast(1, primary.id), false, 'source-free Water is refused');
    const well = { id: 'genuine-well', structure: 'well',
      x: 515, y: 525, r: 15 };
    g.zone().props = [well];
    const hp = primary.hp;
    assert(g.cast(1, primary.id), 'native Rinsing Cut from real water');
    assert(primary.hp < hp, 'genuine contact lands');
    assert.equal(g.hero.slow, 0);
    assert.equal(g.hero.basicCd, debt, 'already accrued Slow debt remains');
    assert.equal(events.at(-1).sourceId, well.id);
    assert.equal(events.at(-1).cleansed, 1);
    assert(g.strategistLiveTrace(), 'only landed contact makes Water Trace');
    assert(g.hero.cd[0] > 0);
    assert.equal(g.cast(1, primary.id), false, 'one shared normal/charged slot cooldown');
    g.s.time += R.strategistStarterSkills[1].traceSeconds + 0.01;
    assert.equal(g.strategistLiveTrace(), null, 'Trace expires without a frame scan');
    well.dry = true;
    g.hero.cd[0] = g.hero.chargedCd[0] = 0;
    assert.equal(g.cast(1, primary.id), false, 'dry source loses Water truth');
  }
  {
    // v3.2 Water charge: genuine facing-ground Trace, NOT group Slow cleanse.
    const { g, primary, events } = make(0);
    const well = { id: 'live-well', structure: 'well',
      x: 515, y: 525, r: 15 };
    g.zone().props = [well];
    g.formationHeading = { x: 1, y: 0 };
    const soldier = g.s.party.find(u => u.type === 'soldier');
    const archer = g.s.party.find(u => u.type === 'archer');
    for (const u of [g.hero, soldier, archer]) g.applySlow(u, 2);
    const before = primary.hp;
    assert(g.cast(1, null, true), 'Sluice Line can author empty real ground');
    const trace = g.strategistLiveTrace();
    assert(trace && trace.to.x > trace.from.x);
    assert.equal(primary.hp, before, 'no conjured distance hit');
    for (const u of [g.hero, soldier, archer])
      assert(u.slow > 0, 'charged Water never cures an earlier Slow');
    assert.equal(events.at(-1).cleansed, 0);
    assert(g.hero.cd[0] > 0 && g.hero.chargedCd[0] > 0);
    g.hero.cd[0] = g.hero.chargedCd[0] = 0;
    g.zone().props = [{ ...well, id: 'empty-well', dry: true }];
    const older = g.strategistLiveTrace();
    assert.equal(g.cast(1, null, true), false);
    assert.equal(g.strategistLiveTrace(), older, 'invalid source does not consume workpiece');
  }
  {
    // Fire tap primes precisely one future actual same-target ordinary dagger.
    const { g, primary, nearby, distant, events } = make(2);
    const fire = { id: 'campfire', structure: 'campfire',
      x: 530, y: 525, r: 12, lit: true };
    assert.equal(g.cast(3, primary.id), false, 'missing fire refuses');
    g.zone().props = [fire];
    assert.equal(g.cast(3, distant.id), false, 'Fire is truly close-range');
    assert(g.cast(3, primary.id), 'native Flash Temper contact');
    const before = primary.hp;
    assert(hit(g, nearby), 'ordinary dagger on other target');
    assert.equal(events.filter(e => e.type === 'strategistHeatSeam').length, 0);
    assert(hit(g, primary), 'next same-target ordinary dagger');
    assert(primary.hp < before);
    assert.equal(events.filter(e => e.type === 'strategistHeatSeam').length, 1);
    assert(hit(g, primary), 'follow-up dagger has no second heat event');
    assert.equal(events.filter(e => e.type === 'strategistHeatSeam').length, 1);
    assert.equal(g.s.strategistAcidBottles, 2,
      'Fire skill and seam are not ordinary third-hit Acid');
    g.hero.cd[2] = g.hero.chargedCd[2] = 0;
    fire.lit = false;
    assert.equal(g.cast(3, primary.id), false, 'extinguished fire is rejected');
  }
  {
    // Fire charge is one close clinch, not an obsolete two-target wedge.
    const { g, primary, nearby, distant, events } = make(0);
    const fire = { id: 'live-fire', structure: 'campfire',
      x: 530, y: 525, r: 12, lit: true };
    g.zone().props = [fire];
    g.formationHeading = { x: 1, y: 0 };
    const before = [primary.hp, nearby.hp, distant.hp];
    assert(g.cast(3, primary.id, true), 'Furnace Exchange close clinch');
    assert(primary.hp < before[0]);
    assert.equal(nearby.hp, before[1], 'no charged Fire wedge second hit');
    assert.equal(distant.hp, before[2]);
    assert.equal(events.at(-1).targets.length, 1);
    assert(g.hero.cd[2] > 0 && g.hero.chargedCd[2] > 0);
  }
  {
    // One expressly selected owned Water Trace converts instead of a clinch.
    const { g, primary, events } = make(0);
    const well = { id: 'well', structure: 'well',
      x: 510, y: 525, r: 12 };
    const fire = { id: 'campfire', structure: 'campfire',
      x: 530, y: 525, r: 12, lit: true };
    g.zone().props = [well, fire];
    g.formationHeading = { x: 1, y: 0 };
    assert(g.cast(1, null, true), 'Sluice Line creates one genuine Trace');
    const before = primary.hp;
    assert(g.cast(3, 'trace:' + primary.id, true), 'explicit chosen steam contact');
    assert(primary.hp < before);
    assert.equal(g.strategistLiveTrace(), null, 'one artifact consumed exactly once');
    assert.equal(events.at(-1).artifact, 'trace');
    g.hero.cd[2] = g.hero.chargedCd[2] = 0;
    assert.equal(g.cast(3, 'trace:' + primary.id, true), false,
      'spent artifact cannot be reused');
  }
  {
    // Stationary Mineral is truly physical and stops only one hostile shot.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    assert.equal(g.cast(2), false, 'no dirt-based Mineral');
    g.zone().props = [{ id: 'boulder', structure: 'boulder',
      x: 500, y: 535, r: 12 }];
    assert(g.cast(2), 'real boulder permits Stone Facet');
    const physical = {
      id: 'enemy-stone', source: 'enemy', sourceId: primary.id,
      style: 'stone', x: 600, y: 500, dx: -1, dy: 0,
      speed: 1000, life: 1, damage: 20, slow: 2,
    };
    g.s.projectiles.push(physical);
    const hp = g.hero.hp;
    g.updateProjectiles(0.2);
    assert.equal(g.hero.hp, hp);
    assert(!g.s.projectiles.includes(physical));
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    assert.equal(g.strategistFacetSnapshot(), null, 'one stop breaks the face');
    assert.equal(g.strategistInterceptPhysicalProjectile(physical,
      { x: 600, y: 500 }, { x: 450, y: 500 }), false,
    'no second block or reflection');
  }
  {
    // Actual live native Archer basic goes through updateProjectiles; a
    // mocked hand-constructed arrow alone is not acceptance evidence.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    g.zone().props = [{ id: 'actual-rock', structure: 'rock',
      x: 500, y: 535, r: 12 }];
    primary.x = 620; primary.y = 500;
    const archer = g.s.party.find(u => u.type === 'archer');
    Object.assign(archer, { x: 400, y: 500, hp: 100, maxHp: 100,
      active: true, cd: 0 });
    assert(g.cast(2), 'fixed two-sided Mineral face');
    assert(g.companionCoverAttack(archer, primary, true),
      'native Archer basic releases an actual arrow');
    const shot = g.s.projectiles.at(-1), hp = primary.hp;
    assert.equal(shot.source, archer.id);
    assert.equal(shot.style, 'arrow');
    g.updateProjectiles(0.6);
    assert(!g.s.projectiles.includes(shot), 'face removes the launched arrow');
    assert.equal(primary.hp, hp, 'Archer own face collision precedes enemy contact');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    archer.cd = 0;
    assert(g.companionCoverAttack(archer, primary, true));
    g.updateProjectiles(0.6);
    assert(primary.hp < hp, 'next native Archer arrow lands after face is spent');
  }
  {
    // Running Facet is mobile, not a four-second stationary notched wall.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    g.zone().props = [{ id: 'moving-rock', structure: 'rock',
      x: 500, y: 535, r: 12 }];
    assert(g.cast(2, null, true), 'authentic source-backed Running Facet');
    const face = g.strategistFacetSnapshot();
    assert(face.mobile && !face.notch);
    assert(face.until - g.s.time <= R.strategistFacet.mobileSeconds + 0.001);
    const magic = {
      id: 'spell', source: 'enemy', sourceId: primary.id, style: 'beam',
    };
    assert.equal(g.strategistInterceptPhysicalProjectile(magic,
      { x: 650, y: 500 }, { x: 350, y: 500 }), false,
      'magic cannot use the one physical shot budget');
    const physical = {
      id: 'moving-stone', source: 'enemy', sourceId: primary.id,
      style: 'stone', x: 650, y: 535, dx: -1, dy: 0,
      speed: 1500, life: 1, damage: 20,
    };
    g.s.projectiles.push(physical);
    g.hero.y = 570; // actual Ogre moved; only the swept moving face can catch.
    g.updateProjectiles(0.2);
    assert(!g.s.projectiles.includes(physical), 'moving-relative swept interception');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    g.hero.cd[1] = g.hero.chargedCd[1] = 0;
    assert(g.cast(2, null, true), 'recasting replaces previous face');
    g.s.time += R.strategistFacet.mobileSeconds + 0.01;
    assert.equal(g.strategistFacetSnapshot(), null, 'short mobile face expires');
  }
  {
    // A sourced hostile projectile can Dodge and withhold its linked Slow.
    // A persistent damaging hazard with same enemy source ID cannot Dodge.
    const { g, primary, events } = make(0);
    g.random = () => 0;
    const hp = g.hero.hp;
    const shot = { id: 'slowing-stone', source: 'enemy',
      sourceId: primary.id, style: 'stone', x: 600, y: 500,
      dx: -1, dy: 0, speed: 1000, life: 1, damage: 30, slow: 2 };
    g.s.projectiles.push(shot);
    g.updateProjectiles(0.13);
    assert.equal(g.hero.hp, hp, 'one eligible physical hit was Dodged');
    assert.equal(g.hero.slow, 0, 'attached Slow requires actual landed hit');
    assert.equal(events.filter(e => e.type === 'strategistDodge').length, 1);
    assert.equal(events.filter(e => e.type === 'strategistRetaliation').length, 0);
    g.s.hazards = [{ kind: 'circle', x: 500, y: 500,
      fromX: 560, fromY: 500, radius: 70, life: 2, tick: 0,
      damage: 30, slow: true, slowSeconds: 2, sourceId: primary.id }];
    g.updateProjectiles(0.05);
    assert(g.hero.hp < hp, 'persistent hazard is not Ogre Dodge eligibility');
    assert(g.hero.slow > 0, 'an actual unDodged hazardous contact applies Slow');
    assert.equal(events.filter(e => e.type === 'strategistDodge').length, 1);
  }
} finally {
  delete C.classes.strategist;
  delete C.talentProfiles.strategist;
}
assert.deepEqual(Object.keys(C.classes), originals, 'test-only admission never leaks');
console.log('PASS Strategist E0 dagger and bounded Gate 3 Ogre Dodge/retaliation native contracts');
