'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
let passed = 0;
function test(name, run) {
  run();
  passed++;
  console.log('PASS ' + name);
}
function encounter(make) {
  const c = new C('normal', 'paladin', () => 0.9);
  const e = make(c);
  c.zone().props = [];
  c.zone().enemies = [e];
  c.s.party = [];
  c.s.time = 30;
  Object.assign(e, { aggro: true, fightStart: 0, summonCd: 100, cd: 100 });
  Object.assign(c.hero, {
    x: e.x + 70,
    y: e.y,
    level: e.level + 1,
    hp: 10000,
    maxHp: 10000,
    immune: 0,
    slow: 0,
    order: null,
  });
  return { c, e };
}
const mob =
  (species, form = 'normal', ranged = false, guard = false) =>
  (c) => {
    const e = c.makeEnemy(
      { species, name: species, level: 5, hp: 10000, damage: 50, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
    Object.assign(e, { form, ranged, guard });
    return e;
  };
function pressure(c, e) {
  c.s.party = [c.unit('soldier', e.x + 85, e.y + 12), c.unit('archer', e.x + 95, e.y - 12)];
  for (const u of c.s.party) Object.assign(u, { hp: 10000, maxHp: 10000, cd: 100 });
  c._tacticalPartyTargets = new Map(c.s.party.map((u) => [u.id, e.id]));
  c.hero.order = { type: 'attack', id: e.id };
  assert(c.tacticalRogueOutnumbered(e), 'real local pressure chooses a signature');
}
function resolveThroughAI(c, e, a) {
  // Exercise the live warning -> resolver -> recovery bridge, rather than
  // invoking the effect handler alone. Stop before a later normal attack.
  let elapsed = 0;
  while (e.telegraph === a && elapsed < a.total + 0.5) {
    c.s.time += 0.05;
    c.updateEnemies(0.05);
    elapsed += 0.05;
  }
  assert.notEqual(e.telegraph, a, a.name + ' resolves through enemy AI');
  assert(e.cd > 0, a.name + ' enters recovery');
}
test('Every authored basic actually disrupts its marked target through the live resolver', () => {
  const cases = [];
  for (const species of Object.keys(C.rules.tacticalFoundation.rogueRingleaderSignatures.melee))
    for (const role of [false, true])
      for (const tier of ['normal', 'ringleader', 'guardian'])
        cases.push(
          mob(species, tier === 'ringleader' ? tier : 'normal', role, tier === 'guardian'),
        );
  for (const id of Object.keys(C.rules.roomCaptains))
    cases.push((c) => {
      const e = mob('goblin')(c);
      Object.assign(e, { captain: true, captainProfile: id });
      return e;
    });
  for (const def of C.data.bosses)
    for (const form of ['normal', 'true'])
      cases.push((c) => c.bossEnemy(def, form, { x: 1400, y: 1700 }));
  for (const make of cases) {
    const { c, e } = encounter(make);
    assert(c.tacticalRogueMove(e, c.hero));
    const a = e.telegraph,
      hp = c.hero.hp,
      before = { x: c.hero.x, y: c.hero.y };
    assert(!a.rogueSignature);
    resolveThroughAI(c, e, a);
    assert(c.hero.hp < hp, a.name + ' has a real hit');
    if (a.style === 'shove')
      assert(
        Math.hypot(c.hero.x - before.x, c.hero.y - before.y) > 1,
        a.name + ' displaces its target',
      );
    else assert(c.hero.slow > 0, a.name + ' slows pursuit');
    if (a.blinds) assert(!c.tacticalDirectTargetable(e), 'dust cover takes effect');
    if (a.style === 'withdraw') assert(e.x < 1400, a.name + ' withdraws');
  }
  assert.equal(cases.length, 99);
});
test('Every elite signature affects multiple marked pursuers and keeps normal cadence', () => {
  const cases = [];
  for (const species of Object.keys(C.rules.tacticalFoundation.rogueRingleaderSignatures.melee))
    for (const ranged of [false, true]) cases.push(mob(species, 'ringleader', ranged));
  for (const id of Object.keys(C.rules.roomCaptains))
    cases.push((c) => {
      const e = mob('goblin')(c);
      Object.assign(e, { captain: true, captainProfile: id });
      return e;
    });
  for (const def of C.data.bosses)
    for (const form of ['normal', 'true'])
      cases.push((c) => c.bossEnemy(def, form, { x: 1400, y: 1700 }));
  for (const make of cases) {
    const { c, e } = encounter(make);
    pressure(c, e);
    const units = [c.hero, ...c.s.party],
      initial = units.map((u) => ({ x: u.x, y: u.y, hp: u.hp })),
      bossPosition = { x: e.x, y: e.y },
      index = e.attackIndex,
      basicDue = e.basicDue;
    assert(c.tacticalRogueMove(e, c.hero));
    const a = e.telegraph;
    assert(a.rogueSignature);
    resolveThroughAI(c, e, a);
    units.forEach((u, i) => {
      assert(u.hp < initial[i].hp, a.name + ' actually affects marked pursuer ' + i);
      if (['scatter', 'sweep'].includes(a.effect)) {
        if (c.tacticalScatterState(u)) for (let n = 0; n < 7; n++) c.tacticalAdvanceScatter(u, 0.1);
        assert(Math.hypot(u.x - initial[i].x, u.y - initial[i].y) > 1, a.name + ' scatters');
      } else assert(u.slow > 0, a.name + ' obstructs pursuit');
    });
    if (a.sidestep)
      assert(
        Math.hypot(e.x - bossPosition.x, e.y - bossPosition.y) > 1,
        a.name + ' really repositions',
      );
    assert.equal(e.attackIndex, index, 'rogue action cannot advance normal rotation');
    assert.equal(e.basicDue, basicDue, 'rogue action cannot fabricate a normal basic');
  }
  assert.equal(cases.length, 51);
});
test('All signature footprints can be dodged and real solid cover blocks their hits', () => {
  const cases = [];
  for (const species of Object.keys(C.rules.tacticalFoundation.rogueRingleaderSignatures.melee))
    for (const ranged of [false, true]) cases.push(mob(species, 'ringleader', ranged));
  for (const id of Object.keys(C.rules.roomCaptains))
    cases.push((c) => {
      const e = mob('goblin')(c);
      Object.assign(e, { captain: true, captainProfile: id });
      return e;
    });
  for (const def of C.data.bosses)
    for (const form of ['normal', 'true'])
      cases.push((c) => c.bossEnemy(def, form, { x: 1400, y: 1700 }));
  for (const make of cases)
    for (const cover of [false, true]) {
      const { c, e } = encounter(make);
      pressure(c, e);
      assert(c.tacticalRogueMove(e, c.hero));
      const a = e.telegraph,
        hp = c.hero.hp;
      c.s.party = [];
      if (cover) {
        c.zone().props.push({ x: (e.x + c.hero.x) / 2, y: e.y, r: 10 });
        assert(!c.line(e, c.hero), 'real solid blocks sight');
      } else Object.assign(c.hero, { x: a.x + a.radius + 15, y: a.y });
      c.tacticalResolveRogueMove(e, a);
      assert.equal(c.hero.hp, hp, a.name + (cover ? ' respects cover' : ' respects mark'));
      assert.equal(c.hero.slow, 0, 'avoided hit cannot slow');
      assert(!c.tacticalScatterState(c.hero), 'avoided hit cannot scatter');
    }
});
test('Automatic AI thinks, warns, resolves once and resumes without a forced basic/signature combo', () => {
  for (const make of [
    mob('goblin'),
    mob('archer', 'normal', true),
    mob('wolf', 'ringleader'),
    (c) => c.bossEnemy(c.boss('crypt'), 'normal', { x: 1400, y: 1700 }),
  ]) {
    const { c, e } = encounter(make),
      hp = c.hero.hp;
    for (let n = 0; n < 30; n++) {
      c.s.time += 0.1;
      c.updateEnemies(0.1);
    }
    const casts = c.s.statistics.events.filter((event) => event.type === 'rogueMove');
    assert.equal(casts.length, 1, e.name + ' automatically makes one rogue decision');
    assert(c.hero.hp < hp, 'automatic warning is delivered and has an effect');
    assert.equal(c.tacticalRogueRegroup(e), null, 'thinking/response state finishes');
  }
});
test('ADDS doctrine excludes dust-covered owned summons and resumes after exact cover expiry', () => {
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const { c, e: b } = encounter((c) =>
      c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 }),
    );
    c.hero.class = cls;
    c.s.party = [c.unit('soldier', 1480, 1720), c.unit('archer', 1490, 1730)];
    c.s.squadDoctrine = 'guard';
    c.s.squadEngagement = 'boss';
    const g = mob('goblin')(c);
    Object.assign(g, {
      x: 1510,
      y: 1700,
      summon: true,
      owner: b.id,
      aggro: true,
      rogueDustCoverUntil: c.s.time + 1.65,
    });
    c.zone().enemies.push(g);
    c.updateParty(0.01);
    assert(
      c.s.party.every((u) => c._tacticalPartyTargets.get(u.id) === b.id),
      'temporary dust falls back to the boss without reacquiring goblin',
    );
    c.s.time += 1.65;
    c.updateParty(0.01);
    assert(
      c.s.party.every((u) => c._tacticalPartyTargets.get(u.id) === g.id),
      'owned add immediately regains priority after cover',
    );
  }
});
test('Commander respawns keep distant troops at posts, never on top of an active companion', () => {
  const { c, e } = encounter((c) => c.bossEnemy(c.boss('warlord'), 'normal', { x: 1400, y: 1700 }));
  const u = mob('orc')(c);
  Object.assign(u, {
    x: 2000,
    y: 1700,
    home: { x: 2000, y: 1700 },
    pack: 'native-post',
    hp: 0,
    deathPaid: true,
  });
  c.zone().enemies.push(u);
  c.tacticalRogueFieldSupport(e, C.rules.tacticalFoundation.rogueSignatures.bosses.warlord);
  assert(u.hp > 0, 'existing distant troop respawns');
  assert(!u.aggro, 'remote respawn does not automatically pull');
  const captain = mob('orc')(c);
  Object.assign(captain, { captain: true, captainProfile: 'frontier-overseer' });
  c.zone().enemies = [captain];
  const post = mob('orc')(c);
  Object.assign(post, { x: 1600, y: 1700, home: { x: 1600, y: 1700 }, hp: 0, deathPaid: true });
  const guard = mob('orc', 'normal', false, true)(c);
  guard.hp = 0;
  guard.deathPaid = true;
  c.zone().enemies.push(post, guard);
  c.s.party = [c.unit('soldier', post.home.x, post.home.y)];
  const move = C.rules.tacticalFoundation.rogueSignatures.captains['frontier-overseer'];
  c.tacticalRogueCommanderSupport(captain, move);
  assert.equal(post.hp, 0, 'occupied companion post remains dead');
  assert.equal(guard.hp, 0, 'Cinder captain cannot revive guardians as ordinary troops');
  c.s.party[0].x += 200;
  c.tacticalRogueCommanderSupport(captain, move);
  assert(post.hp > 0, 'ordinary post can replenish once clear');
});
test('Broodscreen and Crown Decree rally owned active troops without changing summons or pulling distant ones', () => {
  for (const family of ['cindermaw', 'darklord']) {
    const { c, e } = encounter((c) => c.bossEnemy(c.boss(family), 'normal', { x: 1400, y: 1700 }));
    const allies = [mob('ashbeast')(c), mob('ashbeast')(c), mob('ashbeast')(c)];
    allies.forEach((u, i) =>
      Object.assign(u, {
        x: e.x + (i === 2 ? 600 : 100),
        summon: true,
        summonBalanceVersion: 1,
        owner: e.id,
        aggro: i !== 1,
        cd: 5,
      }),
    );
    c.zone().enemies.push(...allies);
    const before = allies.map((u) => ({ id: u.id, hp: u.hp, owner: u.owner }));
    c.tacticalRogueFieldSupport(e, C.rules.tacticalFoundation.rogueSignatures.bosses[family]);
    assert.deepEqual(
      allies.map((u) => ({ id: u.id, hp: u.hp, owner: u.owner })),
      before,
    );
    assert.equal(c.zone().enemies.length, 4, 'no summons or field troops created');
    assert(allies[0].pursuitBurst > 0 && allies[0].cd === 0.5, 'engaged brood/defender rallied');
    assert(!allies[1].aggro && !allies[1].pursuitBurst, 'idle summon not pulled');
    assert(!allies[2].pursuitBurst, 'distant summon not rallied');
  }
});
test('Death, reset and save/restore cannot preserve dust or reposition allowances', () => {
  const { c, e } = encounter(mob('goblin'));
  e.rogueDustCoverUntil = c.s.time + 100;
  const saved = c.snapshot();
  assert(!Object.hasOwn(saved.zones.vale.enemies[0], 'rogueDustCoverUntil'));
  saved.zones.vale.enemies[0].rogueDustCoverUntil = Infinity;
  assert(!Object.hasOwn(C.restore(saved).zone().enemies[0], 'rogueDustCoverUntil'));
  c.disengage(e, 0.1);
  assert(c.tacticalDirectTargetable(e));
  e.hp = 0;
  e.deathPaid = false;
  e.rogueDustCoverUntil = c.s.time + 100;
  c.kill(e);
  assert(c.tacticalDirectTargetable(e));
  c._tacticalRepositions = new Map([[e.id, { zone: c.zoneId, until: 999 }]]);
  c.die();
  assert.equal(c._tacticalRepositions.size, 0);
});
test('A lethal rogue hit ends resolution before crowd control or commander replenishment after death', () => {
  for (const signature of [false, true]) {
    const { c, e } = encounter(
      signature
        ? (c) => c.bossEnemy(c.boss('warlord'), 'normal', { x: 1400, y: 1700 })
        : mob('goblin'),
    );
    if (signature) pressure(c, e);
    c.hero.hp = 1;
    assert(c.tacticalRogueMove(e, c.hero));
    let supports = 0;
    c.tacticalRogueFieldSupport = () => {
      supports++;
      return true;
    };
    c.tacticalResolveRogueMove(e, e.telegraph);
    assert.equal(c.s.statistics.deaths, 1);
    assert.equal(supports, 0, 'dead encounter cannot replenish soldiers');
    assert.equal(e.rogueDustCoverUntil, undefined, 'dead encounter cannot create dust cover');
    assert.equal(c.hero.slow, 0, 'respawned hero cannot receive a stale slow');
  }
});
console.log(passed + ' integrated rogue effectiveness and preservation checks passed.');
