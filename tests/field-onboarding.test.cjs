'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function hit(g, e, slot = 1) {
  g.hero.cd[slot - 1] = 0;
  assert(g.cast(slot, e.id), g.hero.class + ' manual cast admitted');
  for (let i = 0; i < 35 && g.s.projectiles.length; i++) g.updateProjectiles(0.02);
}
function arena(cls = 'paladin', mode = 'normal') {
  const g = new C(mode, cls, () => 0.9),
    z = g.zone(),
    e = z.enemies.find((e) => e.type === 'mob' && !e.guard && !e.captain);
  g.s.mercyTime = 0;
  z.props = [];
  z.buildings = [];
  Object.assign(e, {
    x: 600,
    y: 1000,
    home: { x: 600, y: 1000 },
    hp: 10000,
    maxHp: 10000,
    baseHp: 10000,
  });
  Object.assign(g.hero, { x: 530, y: 1000, hp: g.hero.maxHp });
  z.enemies = [e];
  return { g, e };
}
let early = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare', 'developer']) {
    const { g, e } = arena(cls, mode),
      z = g.zone();
    assert(!z.enemies.some((u) => u.family === 'thorn'));
    assert(!g.thornCaptive());
    assert(z.thornArrival);
    assert.equal(e.neutral, false, 'ordinary field monsters stay attackable');
    const hp = e.hp,
      heroHp = g.hero.hp;
    assert.equal(g.engage(e, true), false, 'forced/pack alerts cannot bypass early protection');
    for (let i = 0; i < 10; i++) {
      g.s.time += 0.1;
      g.updateEnemies(0.1);
    }
    assert(!e.aggro);
    assert.equal(g.hero.hp, heroHp);
    assert.equal(g.s.projectiles.length, 0);
    assert(!g.castMovementBasic(), 'movement cover fire does not initiate a protected fight');
    const companion = g.s.party[0];
    Object.assign(companion, { x: e.x - 25, y: e.y });
    assert(!g.damage(e, 50, companion.id));
    assert.equal(e.hp, hp);
    g.updateEnemies(1.1);
    assert(!e.aggro);
    Object.assign(g.hero, { x: e.x - 70, y: e.y });
    hit(g, e);
    assert(e.hp < hp);
    assert(e.aggro);
    assert(e.heroParticipated);
    assert(g.damage(e, 5, companion.id), 'companions help after actual hero contact');
    // A first hit provokes only that monster. The first paid kill with
    // hero participation unlocks the rest of the field at level 1.
    assert.equal(g.s.valeFieldAwakened, false);
    const freshMob = g.makeEnemy(
      { species: 'goblin', name: 'Still protected', level: 1, hp: 100, damage: 10, gold: 0, xp: 0 },
      { x: 700, y: 1000 },
    );
    z.enemies.push(freshMob);
    assert(g.awaitsHeroAttack(freshMob));
    e.hp = 0;
    g.kill(e);
    assert(g.s.valeFieldAwakened);
    assert.equal(g.hero.level, 1, 'opening changes on kill without a level-up');
    assert(!g.awaitsHeroAttack(freshMob));
    const remembered = C.restore(g.snapshot(), () => 0.9);
    assert(remembered.s.valeFieldAwakened, 'first kill persists in a v4 save');
    g.xp(120);
    assert.equal(g.hero.level, 2);
    assert(!z.thornArrival);
    assert(g.thornCaptive());
    assert.equal(z.enemies.filter((u) => u.family === 'thorn').length, 1);
    assert(
      !g.messages.some((m) => /Thornfang.*(appear|spawn|return)|Mira.*(appear|spawn)/i.test(m)),
      'arrival is silent',
    );
    const ordinary = g.makeEnemy(
      { species: 'goblin', name: 'Later target', level: 1, hp: 100, damage: 10, gold: 0, xp: 0 },
      { x: 700, y: 1000 },
    );
    z.enemies.push(ordinary);
    assert(!g.awaitsHeroAttack(ordinary));
    g.engage(ordinary, false);
    assert(ordinary.aggro, 'ordinary aggression stays enabled after first kill');
    const thorn = z.enemies.find((u) => u.family === 'thorn');
    assert(g.awaitsHeroAttack(thorn), 'Thornfang keeps his separate once-per-run rule');
    early++;
  }
function thornScene(cls = 'paladin') {
  const g = new C('normal', cls, () => 0.9);
  g.xp(120);
  g.s.mercyTime = 0;
  const e = g.zone().enemies.find((e) => e.family === 'thorn'),
    n = g.thornCaptive();
  g.zone().enemies = [e];
  Object.assign(g.hero, g.safe(e.x - 75, e.y));
  Object.assign(g.s.party[0], g.safe(e.x - 35, e.y));
  return { g, e, n };
}
{
  const g = new C('normal', 'mage', () => 0.5),
    bossId = g.zone().thornArrival.boss.id,
    captiveId = g.zone().thornArrival.captive.id;
  const restored = C.restore(g.snapshot(), () => 0.5);
  assert.equal(restored.hero.level, 1);
  assert(!restored.thornCaptive());
  assert(!restored.zone().enemies.some((e) => e.family === 'thorn'));
  restored.xp(120);
  assert.equal(restored.zone().enemies.find((e) => e.family === 'thorn').id, bossId);
  assert.equal(restored.thornCaptive().id, captiveId);
  for (let i = 0; i < 5; i++) restored.zone();
  assert.equal(restored.zone().enemies.filter((e) => e.family === 'thorn').length, 1);
  assert.equal(restored.zone().npcs.filter((n) => n.id === 'cage-thorn').length, 1);
}
{
  const { g, e, n } = thornScene(),
    ids = [e.id, n.id],
    hp = e.hp,
    ally = g.s.party[0];
  assert.equal(e.neutral, false);
  assert(!g.engage(e, true));
  assert(!g.castMovementBasic());
  assert(!g.damage(e, 50, ally.id));
  assert.equal(e.hp, hp);
  assert(!e.aggro);
  assert(!g.s.thornHeroInitiated);
  assert(Number.isInteger(e.thornIntroRetreat));
  const goal = e.thornIntroRetreat,
    start = { x: e.x, y: e.y },
    mira = { x: n.x, y: n.y };
  // The retreat route is now planned incrementally to protect frame time.
  // Verify physical travel with a finite liveness bound, not an assumption
  // that an obstacle-heavy route is available inside the old 2.5s window.
  let maxStep = 0;
  for (let i = 0; i < 250 &&
      (distance(e, start) <= 50 || distance(n, mira) <= 50); i++) {
    const before = { x: e.x, y: e.y };
    g.s.time += 0.1;
    g.updateEnemies(0.1);
    maxStep = Math.max(maxStep, distance(e, before));
    assert(!e.aggro);
    assert(!e.telegraph);
  }
  assert(
    maxStep <= C.rules.thornPatrol.speed * 0.1 + 0.01,
    'scripted withdrawal moves normally, never teleports to clear the test',
  );
  assert(distance(e, start) > 50, 'companion hit produces real withdrawal');
  assert(distance(n, mira) > 50, 'Mira follows the withdrawal');
  assert(Number.isInteger(e.thornIntroRetreat), 'withdrawal remains active for save/reload');
  const restored = C.restore(g.snapshot(), () => 0.9),
    re = restored.zone().enemies.find((u) => u.id === ids[0]),
    rn = restored.thornCaptive();
  assert.equal(re.thornIntroRetreat, goal);
  assert.equal(rn.id, ids[1]);
  assert(!restored.s.thornHeroInitiated);
  const [x, y] = C.rules.thornPatrol.route[goal];
  Object.assign(re, { x, y, hp: re.maxHp * 0.6 });
  Object.assign(rn, { x: x - 50, y: y + 20 });
  restored.updateEnemies(0.1);
  assert.equal(re.hp, re.maxHp);
  assert.equal(re.thornIntroRetreat, undefined);
  assert(!re.aggro);
  assert(!restored.s.thornHeroInitiated);
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = thornScene(cls);
  assert(!g.damage(e, 20, g.s.party[0].id));
  Object.assign(g.hero, g.safe(e.x - 70, e.y));
  hit(g, e);
  assert(g.s.thornHeroInitiated);
  assert(e.aggro);
  assert.equal(e.thornIntroRetreat, undefined);
  const restored = C.restore(g.snapshot(), () => 0.9),
    re = restored.zone().enemies.find((u) => u.family === 'thorn');
  assert(restored.s.thornHeroInitiated);
  assert(!restored.awaitsHeroAttack(re));
  Object.assign(restored.hero, restored.safe(re.x - 50, re.y));
  const u = restored.s.party[0];
  Object.assign(u, { x: restored.hero.x, y: restored.hero.y });
  assert(restored.damage(re, 5, u.id), 'later companion opener uses normal combat');
  assert(re.aggro);
  restored.enter('crypt');
  restored.enter('vale');
  assert(restored.s.thornHeroInitiated);
}
{
  const { g, e } = thornScene();
  g.summonBossAdds(e, { species: 'wolf' }, 2);
  const add = g.zone().enemies.find((u) => u.owner === e.id);
  assert(add);
  assert.equal(add.neutral, false);
  assert(g.awaitsHeroAttack(add));
  assert(!g.engage(add, true));
  const hp = add.hp;
  Object.assign(g.s.party[0], g.safe(add.x - 25, add.y));
  assert(!g.damage(add, 20, g.s.party[0].id));
  assert(!g.s.thornHeroInitiated);
  assert(!e.aggro);
  assert(e.thornIntroRetreat !== undefined);
  assert(!g.zone().enemies.some((u) => u.owner === e.id), 'summons reset with their owner');
}
{
  const { g, e } = arena('mage');
  const hp = e.hp;
  g.s.projectiles.push({
    id: 'old-cover-shot',
    source: 'hero',
    target: e.id,
    x: e.x - 10,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 550,
    damage: 50,
    style: 'magic',
    slot: 1,
    automaticBasic: true,
  });
  g.updateProjectiles(0.02);
  assert.equal(e.hp, hp);
  assert(!e.aggro, 'already launched automatic shots cannot initiate combat');
  g.basicComboFinisher({ id: 'other', x: e.x, y: e.y }, g.hero, 50, 'hero', 'mage', true);
  assert.equal(e.hp, hp, 'automatic finisher splash preserves protection');
}
{
  const g = new C('normal', 'mage', () => 0.5),
    legacy = g.snapshot();
  delete legacy.thornHeroInitiated;
  const arrival = legacy.zones.vale.thornArrival;
  delete legacy.zones.vale.thornArrival;
  legacy.zones.vale.enemies.push(arrival.boss);
  legacy.zones.vale.npcs.push(arrival.captive);
  let restored = C.restore(legacy, () => 0.5);
  assert(!restored.s.thornHeroInitiated);
  assert(restored.zone().thornArrival, 'pristine old v4 run gains delayed arrival');
  legacy.keys.thorn = true;
  legacy.normal.thorn = true;
  restored = C.restore(legacy, () => 0.5);
  assert(restored.s.thornHeroInitiated, 'completed legacy encounter stays unlocked');
  assert(!restored.zone().thornArrival);
  const invalidField = g.snapshot();
  invalidField.valeFieldAwakened = 'yes';
  assert.throws(() => C.restore(invalidField), /Vale first-kill state/);
  const invalid = g.snapshot();
  invalid.thornHeroInitiated = 'yes';
  assert.throws(() => C.restore(invalid), /Thornfang introduction/);
  const bad = g.snapshot();
  bad.zones.vale.thornArrival.boss.hp = NaN;
  assert.throws(() => C.restore(bad), /Invalid/);
}
{
  const g = new C('normal', 'paladin', () => 0.5);
  g.s.mercyTime = 0;
  g.enter('crypt');
  const e = g.zone().enemies.find((u) => u.hp > 0);
  assert(!g.awaitsHeroAttack(e));
  g.engage(e, true);
  assert(e.aggro, 'dungeon aggression unchanged below level 2');
}
{
  const { g, e } = arena();
  const other = g.makeEnemy(
    { species: 'goblin', name: 'Second monster', level: 1, hp: 90, damage: 8, gold: 0, xp: 0 },
    { x: 720, y: 1000 },
  );
  g.zone().enemies.push(other);
  g.admitOpeningHeroAttack(e);
  assert(!g.s.valeFieldAwakened, 'nonlethal deliberate attack does not unlock others');
  assert(g.awaitsHeroAttack(other));
  e.hp = 0;
  e.heroParticipated = false;
  g.kill(e);
  assert(!g.s.valeFieldAwakened, 'companion-only first kill does not unlock the field');
  other.hp = 0;
  other.heroParticipated = true;
  g.kill(other);
  assert(g.s.valeFieldAwakened, 'hero-involved first kill unlocks ordinary field');
  assert(!g.awaitsHeroAttack(e), 'the unlock survives enemy-local flags');
}
{
  const g = new C('normal','paladin',()=>0.5);
  g.xp(120);
  const e = g.zone().enemies.find(u=>u.type==='mob'&&!u.guard);
  assert(g.s.valeFieldAwakened===false);
  assert(g.awaitsHeroAttack(e),'level 2 without a monster kill is still protected');
}
console.log(
  'PASS ' +
    early +
    ' class/mode opening cases plus silent persistent arrival, manual vs automatic hero contact, companion reset/physical Mira withdrawal, summons, native later combat, v4 migration and dungeon boundary',
);
