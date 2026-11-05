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
    // Gate 2 Water source and native Slow episode (not its past cooldown debt).
    const { g, primary, events } = make(0);
    g.applySlow(g.hero, 2);
    const debt = g.hero.basicCd;
    assert.equal(g.cast(1, primary.id), false, 'no Water source refuses manual cut');
    assert(g.hero.slow > 0 && g.hero.cd[0] === 0);
    const well = { id: 'genuine-well', structure: 'well', x: 515, y: 525, r: 15 };
    g.zone().props = [well];
    const hp = primary.hp;
    assert.equal(g.cast(1, primary.id), true, 'visible real Water permits Rinsing Cut');
    assert(primary.hp < hp, 'one native melee contact is real damage');
    assert.equal(g.hero.slow, 0);
    assert.equal(g.hero.slowStacks, 0);
    assert.equal(g.hero.basicCd, debt, 'Slow cooldown debt is not refunded');
    assert.equal(events.at(-1).cleansed, 1);
    assert.equal(events.at(-1).sourceId, well.id);
    assert(g.hero.cd[0] > 0 && !g.hero.chargedCd[0]);
    assert.equal(g.cast(1, primary.id), false, 'tap starts shared slot recovery');
  }
  {
    const { g, primary, events } = make(0);
    const well = { id: 'natural-well', structure: 'well', x: 515, y: 525, r: 15 };
    g.zone().props = [well];
    const soldier = g.s.party.find((u) => u.type === 'soldier');
    const archer = g.s.party.find((u) => u.type === 'archer');
    for (const unit of [g.hero, soldier, archer]) g.applySlow(unit, 2);
    const hp = primary.hp;
    assert.equal(g.cast(1, null, true), true, 'charged genuine team cleanse');
    assert.equal(primary.hp, hp, 'Clear Current never attacks');
    for (const unit of [g.hero, soldier, archer]) assert.equal(unit.slow, 0);
    assert.equal(events.at(-1).cleansed, 3);
    assert(g.hero.cd[0] > 0 && g.hero.chargedCd[0] > 0);
    g.hero.cd[0] = g.hero.chargedCd[0] = 0;
    assert.equal(g.cast(1, null, true), false, 'no phantom Slow');
    soldier.active = false;
    g.applySlow(soldier, 2);
    assert.equal(g.cast(1, null, true), false, 'inactive soldier cannot finance cure');
    well.dry = true;
    g.applySlow(g.hero, 2);
    assert.equal(g.cast(1, null, true), false, 'dry authentic source loses eligibility');
    assert(g.hero.slow > 0);
  }
  {
    const { g, primary, nearby, distant, events } = make(0);
    const fire = { id: 'actual-campfire', structure: 'campfire', x: 530, y: 525, r: 12, lit: true };
    assert.equal(g.cast(3, primary.id), false, 'Fire missing');
    g.zone().props = [fire];
    assert.equal(g.cast(3, distant.id), false, 'Fire <=90 reach');
    const hp = primary.hp;
    assert.equal(g.cast(3, primary.id), true, 'native hot dagger');
    assert(primary.hp < hp && g.hero.cd[2] > 0);
    g.hero.cd[2] = 0;
    g.formationHeading = { x: 1, y: 0 };
    const behind = g.makeEnemy({ species: 'goblin', name: 'behind',
      level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 }, { x: 460, y: 500 });
    behind.id = 'behind'; behind.aggro = true; behind.returning = false;
    g.zone().enemies.push(behind);
    const before = [primary.hp, nearby.hp, behind.hp, distant.hp];
    assert.equal(g.cast(3, null, true), true, 'one native two-contact front wedge');
    assert(primary.hp < before[0] && nearby.hp < before[1]);
    assert.equal(behind.hp, before[2], 'rear is excluded');
    assert.equal(distant.hp, before[3], 'distant is excluded');
    assert.equal(events.at(-1).targets.length, 2);
    assert(g.hero.cd[2] > 0 && g.hero.chargedCd[2] > 0);
    fire.lit = false;
    g.hero.cd[2] = g.hero.chargedCd[2] = 0;
    assert.equal(g.cast(3, primary.id), false, 'extinguished Fire is unavailable');
  }
  {
    // Gate 2: one genuinely source-backed stone face, native swept hit.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    assert.equal(g.cast(2), false, 'no real Mineral refuses placement');
    g.zone().props = [{ id: 'real-boulder', structure: 'boulder',
      x: 500, y: 535, r: 12 }];
    assert.equal(g.cast(2), true, 'authentic boulder permits Stone Facet');
    const physical = {
      id: 'hostile-stone', source: 'enemy', sourceId: primary.id,
      style: 'stone', x: 600, y: 500, dx: -1, dy: 0,
      speed: 1000, life: 1, damage: 20,
    };
    g.s.projectiles.push(physical);
    const hp = g.hero.hp;
    g.updateProjectiles(0.2);
    assert.equal(g.hero.hp, hp, 'prior face physically prevents hostile stone hit');
    assert(!g.s.projectiles.includes(physical));
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    const missed = {
      id: 'second-stone', source: 'enemy', sourceId: primary.id, style: 'stone',
      x: 600, y: 500, dx: -1, dy: 0, speed: 1000, life: 1, damage: 20,
    };
    assert.equal(g.strategistInterceptPhysicalProjectile(
      missed, { x: 600, y: 500 }, { x: 450, y: 500 }), false,
      'one real stop consumes the entire face');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
  }
  {
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    g.zone().props = [{ id: 'real-rock', structure: 'rock',
      x: 500, y: 535, r: 12 }];
    assert.equal(g.cast(2, null, true), true, 'genuine Notched Facet');
    const archer = g.s.party.find(u => u.type === 'archer');
    const makeArrow = (id, y) => ({
      id, source: archer.id, style: 'arrow', x: 600, y,
      dx: -1, dy: 0, speed: 1000, life: 1, damage: 20, target: primary.id,
    });
    const open = makeArrow('through-notch', 500);
    assert.equal(g.strategistInterceptPhysicalProjectile(
      open, { x: 600, y: 500 }, { x: 450, y: 500 }), false,
      'center opening really lets a friendly arrow pass');
    const magic = { ...makeArrow('magic', 525), source: 'enemy', style: 'beam' };
    assert.equal(g.strategistInterceptPhysicalProjectile(
      magic, { x: 600, y: 525 }, { x: 450, y: 525 }), false,
      'nonphysical magic is never blocked');
    const lip = makeArrow('friendly-lip', 525);
    g.s.projectiles.push(lip);
    assert.equal(g.strategistInterceptPhysicalProjectile(
      lip, { x: 600, y: 525 }, { x: 450, y: 525 }), true,
      'real friendly Archer projectile hits the two-sided lip');
    assert(!g.s.projectiles.includes(lip), 'intercept removes actual in-flight shot');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    // The face reacts to a projectile's real physical body, not whether its
    // shooter happened to survive/keep active during flight.
    g.hero.cd[1] = g.hero.chargedCd[1] = 0;
    assert.equal(g.cast(2), true);
    archer.hp = 0; archer.active = false;
    const orphaned = makeArrow('orphaned-physical-arrow', 525);
    g.s.projectiles.push(orphaned);
    assert.equal(g.strategistInterceptPhysicalProjectile(
      orphaned, { x: 600, y: 525 }, { x: 450, y: 525 }), true,
      'already launched Archer projectile remains physical after shooter falls');
    g.hero.cd[1] = g.hero.chargedCd[1] = 0;
    assert.equal(g.cast(2), true, 'one new casting replaces the spent face');
    g.s.time += R.strategistFacet.seconds + 0.01;
    const expired = makeArrow('expired', 500);
    assert.equal(g.strategistInterceptPhysicalProjectile(
      expired, { x: 600, y: 500 }, { x: 450, y: 500 }), false,
      'expired physical cover never survives combat time');
  }

  {
    // Priority 2: fire the actual native Archer basic through the Campaign
    // projectile engine, rather than constructing a stand-in arrow segment.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    g.zone().props = [{ id: 'natural-stone', structure: 'rock',
      x: 500, y: 560, r: 12 }];
    primary.x = 620; primary.y = 500;
    const archer = g.s.party.find(u => u.type === 'archer');
    Object.assign(archer, { x: 400, y: 500, hp: 100, maxHp: 100,
      active: true, cd: 0 });
    assert(g.cast(2), 'source-backed stationary face protects an actual lane');
    assert(g.companionCoverAttack(archer, primary, true),
      'real Archer ordinary native basic launches');
    const first = g.s.projectiles.at(-1), health = primary.hp;
    assert.equal(first.source, archer.id);
    assert.equal(first.style, 'arrow');
    g.updateProjectiles(0.6);
    assert(!g.s.projectiles.includes(first), 'first face contact removes native arrow');
    assert.equal(primary.hp, health, 'friendly arrow cannot pass through closed face');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
    archer.cd = 0;
    assert(g.companionCoverAttack(archer, primary, true));
    g.updateProjectiles(0.6);
    assert(primary.hp < health, 'spent face cannot eat another native arrow');
  }
  {
    // Priority 2: actual charged two-lip aperture is symmetric for friend and
    // foe. A shot through the center must NOT consume the only stopper.
    const { g, primary, events } = make(0);
    g.formationHeading = { x: 1, y: 0 };
    g.zone().props = [{ id: 'stone-face', structure: 'boulder',
      x: 500, y: 560, r: 12 }];
    primary.x = 620; primary.y = 500;
    const archer = g.s.party.find(u => u.type === 'archer');
    Object.assign(archer, { x: 400, y: 500, hp: 100, maxHp: 100,
      active: true, cd: 0 });
    assert(g.cast(2, null, true), 'Notched Facet original charged release');
    const before = primary.hp;
    assert(g.companionCoverAttack(archer, primary, true));
    g.updateProjectiles(0.6);
    assert(primary.hp < before, 'real friendly arrow fits center aperture');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 0);
    archer.cd = 0;
    archer.y = primary.y = 525;
    assert(g.companionCoverAttack(archer, primary, true));
    const second = g.s.projectiles.at(-1), after = primary.hp;
    g.updateProjectiles(0.6);
    assert(!g.s.projectiles.includes(second), 'actual lip intercepts off-center arrow');
    assert.equal(primary.hp, after, 'lip collision precedes native target');
    assert.equal(events.filter(e => e.type === 'strategistFacetIntercepted').length, 1);
  }
  {
    // Dodge is scoped to a native hostile hit; a known enemy source ID does
    // not turn its persistent damaging ground hazard into a free Dodge.
    const { g, primary, events } = make(0);
    g.random = () => 0;
    const health = g.hero.hp;
    g.s.projectiles.push({
      id: 'slowing-stone', source: 'enemy', sourceId: primary.id,
      style: 'stone', x: 600, y: 500, dx: -1, dy: 0,
      speed: 1000, life: 1, damage: 30, slow: 2,
    });
    g.updateProjectiles(0.13);
    assert.equal(g.hero.hp, health, 'real ranged native shot can Dodge');
    assert.equal(g.hero.slow, 0, 'attached Slow cannot land on Dodged shot');
    assert.equal(events.filter(e => e.type === 'strategistDodge').length, 1);
    assert.equal(events.filter(e => e.type === 'strategistRetaliation').length, 0,
      'ranged hits never authorize melee-basic retaliation');
    g.s.hazards = [{
      kind: 'circle', x: 500, y: 500, fromX: 560, fromY: 500,
      radius: 70, life: 2, tick: 0, damage: 30, slow: true,
      slowSeconds: 2, sourceId: primary.id,
    }];
    g.updateProjectiles(0.05);
    assert(g.hero.hp < health, 'persistent hazard is not a dodgable attack');
    assert(g.hero.slow > 0, 'hazard status still belongs to the real landed tick');
    assert.equal(events.filter(e => e.type === 'strategistDodge').length, 1);
  }
} finally {
  delete C.classes.strategist;
  delete C.talentProfiles.strategist;
}
assert.deepEqual(Object.keys(C.classes), originals, 'test-only admission never leaks');
console.log('PASS Strategist E0 dagger and bounded Gate 3 Ogre Dodge/retaliation native contracts');
