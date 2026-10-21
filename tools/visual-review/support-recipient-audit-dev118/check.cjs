'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  C = require(root + '/src/prototype/engine');
const families = Object.keys(C.rules.petCompanions),
  roles = ['hero', 'soldier', 'archer', ...families.map((f) => 'pet:' + f)],
  results = [];
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function scene(cls = 'ranger') {
  const g = new C('normal', cls, () => 0.9);
  for (const k of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) g.zone()[k] = [];
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  g.s.party = [];
  Object.assign(g.hero, {
    x: 600,
    y: 1500,
    level: 20,
    skills: Array(8).fill(1),
    cd: Array(8).fill(0),
    hp: 5000,
    maxHp: 10000,
    immune: 0,
  });
  const e = g.makeEnemy(
    { species: 'goblin', level: 20, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 670, y: 1500 },
  );
  g.zone().enemies = [e];
  g.engage(e);
  return { g, e };
}
function recipient(g, role, x = 630) {
  if (role === 'hero') return g.hero;
  const [kind, f] = role.split(':');
  const u = g.unit(kind, x, 1500, f);
  u.hp = u.maxHp = 10000;
  u.hp = 5000;
  g.s.party.push(u);
  return u;
}
function healer(g) {
  let u = g.s.party.find((u) => u.type === 'pet' && u.petFamily === 'crypt');
  if (!u) {
    u = g.unit('pet', 610, 1500, 'crypt');
    g.s.party.push(u);
  }
  u.hp = u.maxHp;
  return u;
}
function actor(g) {
  const u = g.unit('archer', 610, 1520);
  u.hp = u.maxHp;
  g.s.party.push(u);
  return u;
}
for (const role of roles) {
  {
    const { g } = scene(),
      u = recipient(g, role),
      hp = u.hp;
    assert(g.cast(3, undefined, true));
    assert(u.hp > hp, role + ' Ranger hero party heal');
    results.push({ skill: 'Ranger hero charged Heal', recipient: role, pass: true });
  }
  for (const charged of [false, true]) {
    const { g, e } = scene('paladin'),
      u = recipient(g, role);
    assert(g.cast(8, e.id, charged));
    assert(u.wardUntil > g.s.time);
    near(u.wardReduction, charged ? 0.3 : 0.2);
    const hp = u.hp;
    assert(g.hitParty(u, 100, 0, null, true));
    near(hp - u.hp, charged ? 70 : 80);
    g.s.time = u.wardUntil + 0.01;
    const h = u.hp;
    g.hitParty(u, 100, 0, null, true);
    near(h - u.hp, 100);
    results.push({
      skill: 'Paladin ' + (charged ? 'Last Bastion' : 'party ward'),
      recipient: role,
      pass: true,
    });
  }
  for (const automatic of [false, true]) {
    const { g } = scene('mage'),
      u = recipient(g, role);
    if (u !== g.hero) g.hero.hp = g.hero.maxHp;
    const r = actor(g),
      hp = u.hp;
    if (automatic) g.autoRangerSupport();
    else assert(g.rangerSupport('health', true, u));
    assert(g.hasSupportEffect(u, 'health'));
    assert(g.activeLivingParty().some((a) => a.type === 'archer' && a.healCd > 0));
    g.updateRangerSupport(5);
    assert(u.hp > hp);
    assert(u.hp <= u.maxHp);
    assert(!g.hasSupportEffect(u, 'health'));
    results.push({
      skill: 'Ranger companion ' + (automatic ? 'AI Heal' : 'manual Heal'),
      recipient: role,
      pass: true,
    });
  }
  {
    const { g, e } = scene('mage'),
      u = recipient(g, role);
    if (u !== g.hero) g.hero.hp = g.hero.maxHp;
    const h = healer(g);
    if (u === h) u.hp = u.maxHp * 0.5;
    const hp = u.hp;
    assert(g.companionUseFirstSkill(h, e));
    near(u.hp, hp);
    for (let i = 0; i < 60; i++) {
      g.s.time += 0.05;
      g.updateProjectiles(0.05);
    }
    assert(u.hp > hp, role + ' actual Lifebinder contact heals');
    assert(u.hp <= u.maxHp);
    results.push({
      skill: 'Lifebinder ' + (u === h ? 'self-heal' : 'ally heal'),
      recipient: role,
      pass: true,
    });
  }
  {
    const { g, e } = scene('mage'),
      u = recipient(g, role);
    g.fractureEnemy(e, 0.2, 4);
    let hp = e.hp;
    assert(g.damage(e, 100, u === g.hero ? 'hero' : u.id));
    near(hp - e.hp, 120);
    g.s.time += 4.01;
    hp = e.hp;
    assert(g.damage(e, 100, u === g.hero ? 'hero' : u.id));
    near(hp - e.hp, 100);
    results.push({ skill: 'Mage Fracture amplification', recipient: role, pass: true });
  }
  if (role !== 'hero') {
    const { g, e } = scene(),
      u = recipient(g, role);
    u.hp = u.maxHp;
    g.hero.hp = g.hero.maxHp;
    assert(g.cast(4, undefined, true));
    assert(g.rangerRallyActive(u));
    near(g.companionRallyAttackSpeed(u), 1.08);
    near(g.companionRallyMoveSpeed(u, 250), g.companionMoveSpeed(250) * 1.15);
    u.skill1Cd = u.skill2Cd = u.skillGlobalCd = 99;
    u.cd = 0;
    g.hero.target = e.id;
    if ((u.type === 'pet' && g.petDefinition(u).role === 'ranged') || u.type === 'archer')
      e.x = u.x + 200;
    else e.x = u.x + 40;
    g.updateParty(0.05);
    assert(u.cd > 0 && u.cd < 0.85, role + ' real AI consumes faster basic interval');
    near(u.cd, 0.85 / 1.08);
    assert(!g.rangerRallyActive(g.hero));
    g.s.time = u.rangerRallyUntil + 0.01;
    near(g.companionRallyAttackSpeed(u), 1);
    near(g.companionRallyMoveSpeed(u, 250), g.companionMoveSpeed(250));
    results.push({
      skill: 'Ranger Rally actual AI basic/movement/expiry',
      recipient: role,
      pass: true,
    });
  }
}
// Recipient boundary checks: dead/reserve/outside-radius/blocked actors do not receive spatial wards/rally.
for (const skill of ['ward', 'rally'])
  for (const mode of ['dead', 'resting', 'far', 'wall']) {
    const { g, e } = scene(skill === 'ward' ? 'paladin' : 'ranger'),
      u = recipient(g, 'pet:ridge');
    if (mode === 'dead') u.hp = 0;
    if (mode === 'resting') u.active = false;
    if (mode === 'far') u.x = 1500;
    if (mode === 'wall') {
      const line = g.line;
      g.line = (a, b) => (b === u ? false : line.call(g, a, b));
    }
    if (skill === 'ward') {
      assert(g.cast(8, e.id));
      assert(!(u.wardUntil > g.s.time));
    } else {
      assert(!g.cast(4, undefined, true));
      assert(!(u.rangerRallyUntil > g.s.time));
      near(g.hero.cd[3], 0);
    }
    results.push({ skill: skill + ' exclusion', recipient: mode, pass: true });
  }
for (const method of ['heroHeal', 'rangerHeal', 'lifebinder'])
  for (const mode of ['dead', 'resting']) {
    const { g, e } = scene(),
      u = recipient(g, 'pet:ridge');
    g.hero.hp = g.hero.maxHp;
    if (mode === 'dead') u.hp = 0;
    else u.active = false;
    const hp = u.hp;
    if (method === 'heroHeal') {
      assert(!g.cast(3, undefined, true));
      near(g.hero.cd[2], 0);
    } else if (method === 'rangerHeal') {
      actor(g);
      g.autoRangerSupport();
      g.updateRangerSupport(5);
    } else {
      const h = healer(g);
      assert(g.companionUseFirstSkill(h, e));
      for (let i = 0; i < 60; i++) g.updateProjectiles(0.05);
    }
    near(u.hp, hp);
    results.push({ skill: method + ' exclusion', recipient: mode, pass: true });
  }
// Actual pet wards are self-only, and their mitigation works after genuine skill resolution.
for (const [family, slot, reduction] of [
  ['mine', 1, 0.25],
  ['cindermaw', 2, 0.35],
]) {
  const { g, e } = scene(),
    u = recipient(g, 'pet:' + family),
    other = recipient(g, 'pet:ridge');
  u.hp = u.maxHp;
  other.hp = other.maxHp;
  e.x = u.x + 40;
  if (slot === 1) assert(g.companionUseFirstSkill(u, e));
  else {
    assert(g.companionUseSecondSkill(u, e));
    g.advancePartyChargeClock(0.65);
    g.resolveCompanionCharges();
  }
  near(u.wardReduction, reduction);
  assert(!(other.wardUntil > g.s.time));
  assert(!(g.hero.wardUntil > g.s.time));
  const hp = u.hp;
  g.hitParty(u, 100, 0, null, true);
  near(hp - u.hp, 100 * (1 - reduction));
  results.push({ skill: family + ' actual self ward', recipient: 'self only', pass: true });
}
// Learn/cast actual Mage Fracture and show the debuff helps a pet, not only raw damage calls.
{
  const { g, e } = scene('mage'),
    u = recipient(g, 'pet:ridge');
  e.x = 800;
  g.hero.hp = g.hero.maxHp;
  assert(g.cast(4, e.id));
  for (let i = 0; i < 50; i++) g.updateProjectiles(0.05);
  assert(e.fractureUntil > g.s.time);
  const hp = e.hp;
  g.damage(e, 100, u.id);
  assert(hp - e.hp > 100);
  results.push({
    skill: 'Actual Mage Fracture cast/projectile',
    recipient: 'pet:ridge',
    pass: true,
  });
}
// Paladin's enemy-side weakening protects every kind of actual party recipient.
for (const role of roles) {
  const { g, e } = scene('paladin'),
    u = recipient(g, role);
  e.damage = 100;
  g.weakenEnemy(e, 1);
  const hp = u.hp;
  g.hitParty(u, g.weakenedEnemyDamage(e), 0, null, true);
  assert(hp - u.hp < 100);
  g.s.time = e.weakenUntil + 0.01;
  near(g.weakenedEnemyDamage(e), 100);
  results.push({ skill: 'Paladin Weaken shared incoming damage', recipient: role, pass: true });
}
// One real mixed-party charged heal reaches all five wounded members together.
{
  const { g } = scene(),
    units = [
      g.hero,
      recipient(g, 'soldier'),
      recipient(g, 'archer'),
      recipient(g, 'pet:ridge'),
      recipient(g, 'pet:crypt'),
    ],
    hp = units.map((u) => u.hp);
  assert(g.cast(3, undefined, true));
  units.forEach((u, i) => assert(u.hp > hp[i]));
  results.push({
    skill: 'Ranger charged Heal simultaneous mixed party',
    recipient: 'hero + Soldier + Ranger + two different pets',
    pass: true,
  });
}
// Self-Heal and personal Shield Stance remain deliberately personal.
for (const cls of ['ranger', 'paladin']) {
  const { g } = scene(cls),
    u = recipient(g, 'pet:ridge'),
    hp = u.hp;
  if (cls === 'ranger') {
    const h = g.hero.hp;
    assert(g.cast(3));
    assert(g.hero.hp > h);
    near(u.hp, hp);
  } else {
    assert(g.cast(3));
    assert(g.hero.shieldStance > 0);
    assert(!(u.wardUntil > g.s.time));
  }
  results.push({ skill: cls + ' personal Skill 3', recipient: 'hero only', pass: true });
}
// Silence blocks the caster, not recipients or already-running heal effects.
const findings = [];
{
  const { g, e } = scene('mage'),
    u = recipient(g, 'pet:ridge'),
    r = actor(g),
    h = healer(g);
  g.hero.hp = g.hero.maxHp;
  assert(g.cast(3, undefined, true));
  assert(g.mageSilenceActive(r));
  assert(!g.rangerSupport('health', true, u));
  near(r.healCd, 0);
  const message = g.messages.at(-1);
  assert.match(message, /cooling down/);
  assert.match(message, /0s/);
  findings.push({
    severity: 'low',
    kind: 'misleading feedback',
    reproduction: 'Mage charged Skill 3; ready Ranger inside Silence; wounded pet; manual Heal.',
    actualMessage: message,
    expected: 'Explain that the ready Ranger is silenced, rather than on cooldown.',
    mechanics: 'Correctly blocked; no pet exclusion or cooldown consumption.',
  });
  assert(!g.companionUseFirstSkill(h, e));
  near(h.skill1Cd || 0, 0);
  r.x = 820;
  assert(!g.mageSilenceActive(r));
  assert(g.rangerSupport('health', true, u));
  const hp = u.hp;
  g.updateRangerSupport(1);
  assert(u.hp > hp, 'silenced recipient may receive healing from an outside caster');
  h.x = 820;
  assert(!g.mageSilenceActive(h));
  assert(g.companionUseFirstSkill(h, e));
  for (let i = 0; i < 60; i++) g.updateProjectiles(0.05);
  assert(u.hp > hp);
  results.push({
    skill: 'Mage Silence caster restriction / outside support',
    recipient: 'Ranger and Lifebinder source; wounded pet inside field',
    pass: true,
  });
}
const files = [
  'hero-combat',
  'party',
  'party-pets',
  'combat',
  'rules',
  'engine',
  'progression',
].map((x) => 'src/prototype/' + x + '.js');
const report = {
  runtime: '0.9.1+snapshot.dev.118',
  baseline: '31fcdc9b500cc13e09082349745b83f77055ea71',
  passedCases: results.length,
  findings,
  results,
  sourceHashes: Object.fromEntries(
    files.map((f) => [
      f,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(root + '/' + f))
        .digest('hex'),
    ]),
  ),
  scope:
    'Source audit plus native domain-method/AI/projectile probes; no browser, full-game CI or live gameplay changes.',
};
fs.writeFileSync(__dirname + '/results.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS ' +
    results.length +
    ' support recipient, actual damage/heal/AI, expiry and exclusion cases.',
);
