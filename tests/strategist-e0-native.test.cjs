'use strict';
// E0 is a dormant combat contract, not approval to publish a fifth class.
// The temporary registry below exists ONLY in this isolated Node test process.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
assert.equal(C.classes.strategist, undefined);
assert.equal(C.heroCombatSupports('strategist'), false);
assert(C.classAdmissionIssues('strategist', {
  icon: 'test', stats: C.classes.paladin, talents: C.talentProfiles.paladin,
}).includes('missing authored combat owner'));
assert.throws(() => new C('normal', 'strategist'), /Unknown mode or class/);
const originals = Object.keys(C.classes);
C.classes.strategist = { ...C.classes.paladin };
C.talentProfiles.strategist = { ...C.talentProfiles.paladin };
try {
  const make = (stock = 0) => {
    const g = new C('normal', 'strategist', () => 0.9);
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
    const g = new C('normal', 'strategist', () => 0.9);
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
} finally {
  delete C.classes.strategist;
  delete C.talentProfiles.strategist;
}
assert.deepEqual(Object.keys(C.classes), originals, 'test-only admission never leaks');
console.log('PASS Strategist E0 dormant native dagger, finite Acid, training and v4 contracts');
