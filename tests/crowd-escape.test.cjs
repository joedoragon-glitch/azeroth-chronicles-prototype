'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const R = C.rules;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function room() {
  const g = new C('developer', 'paladin', () => 0.73);
  g.zone().enemies = [];
  g.zone().props = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.normal.crypt = true;
  g.s.true.crypt = true;
  Object.assign(g.hero, { x: 300, y: 1500 });
  // Two real solid prop rows form a narrow lane: terrain remains authoritative.
  for (let x = 100; x <= 900; x += 25)
    for (const y of [1450, 1550]) g.zone().props.push({ id: 'wall-' + x + '-' + y, x, y, r: 30 });
  return g;
}
function enemy(g, x, type = 'normal') {
  const u = g.makeEnemy(
    { species: 'goblin', name: 'Crowd fixture', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x, y: 1500 },
  );
  if (type === 'boss') Object.assign(u, { type: 'boss', family: 'crypt' });
  if (type === 'mounted') u.mountedCrownRider = true;
  g.zone().enemies.push(u);
  return u;
}
function advance(g, u, target, slow = false) {
  if (slow) g.observeCrowdFrame(100);
  g.s.time += 0.1;
  return g.move(u, target, 100, 0.1);
}
for (const kind of ['hero', 'soldier', 'pet', 'normal', 'boss', 'mounted']) {
  const g = room();
  const u =
    kind === 'hero'
      ? g.hero
      : kind === 'soldier' || kind === 'pet'
        ? g.unit(kind, 300, 1500, 'crypt')
        : enemy(g, 300, kind);
  if (kind === 'soldier' || kind === 'pet') g.s.party = [u];
  if (u !== g.hero) Object.assign(g.hero, { x: 200, y: 1500 });
  const blocker =
    kind === 'normal' || kind === 'boss' || kind === 'mounted' ? g.hero : enemy(g, 330);
  Object.assign(blocker, { x: 300 + g.actorRadius(u) + g.actorRadius(blocker) + 2, y: 1500 });
  const target = { x: 650, y: 1500 };
  assert(g.clearSegment(u, target), 'lane is clear of terrain');
  for (let i = 0; i < 3; i++) advance(g, u, target);
  assert(!g.crowdEscaping(u), kind + ': ordinary body blocking initially remains');
  for (let i = 0; i < 20 && !g.crowdEscaping(u); i++) advance(g, u, target);
  assert(g.crowdEscaping(u), kind + ': real mixed-side jam releases');
  assert(g.actorStepAllowed(blocker, { x: u.x - 10, y: u.y }), 'escape passage is symmetric');
  const at = u.x;
  for (let i = 0; i < 10; i++) advance(g, u, target);
  assert(u.x > at + 90, kind + ': physical movement crosses the blockage');
  assert(!g.blocked(u.x, u.y), 'escape never enters terrain');
  const saved = g.snapshot(),
    restored = C.restore(saved, () => 0.73);
  assert(!restored.crowdEscaping(restored.hero), 'escape is runtime-only on restore');
  g.s.time += R.actorSpacing.escapeSeconds + 0.1;
  Object.assign(blocker, { x: u.x + g.actorRadius(u) + g.actorRadius(blocker) + 2, y: u.y });
  assert(!g.actorStepAllowed(u, { x: u.x + 10, y: u.y }), 'normal collision resumes');
}
{
  const g = room(),
    e = enemy(g, 330),
    target = { x: 650, y: 1500 };
  for (let i = 0; i < 6; i++) {
    g.observeCrowdFrame(100);
    g.s.time += 0.1;
  }
  assert(g.crowdUnderPressure());
  assert(!g.crowdEscaping(g.hero), 'low FPS alone cannot disable collision');
  for (let i = 0; i < 4 && !g.crowdEscaping(g.hero); i++) advance(g, g.hero, target, true);
  assert(g.crowdEscaping(g.hero), 'sustained low FPS accelerates actual jam recovery');
  g.observeCrowdFrame(16, false);
  assert(!g.crowdUnderPressure(), 'pause clears urgency');
  for (let i = 0; i < 6; i++) g.observeCrowdFrame(100);
  g.observeCrowdFrame(2000);
  assert(!g.crowdUnderPressure(), 'resume gap cannot signal low FPS');
  assert.equal(e.hp, e.maxHp, 'overlap grants no damage or health effect');
}
{
  const g = room();
  for (let i = 0; i < 40; i++) advance(g, g.hero, { x: 300, y: 1400 }, true);
  assert(!g.crowdEscaping(g.hero), 'terrain blockage alone never enables overlap');
  assert(!g.clearSegment(g.hero, { x: 300, y: 1400 }), 'walls still block');
}
{
  const g = room(),
    u = g.unit('soldier', 200, 1500);
  g.s.party = [u];
  const e = enemy(g, 500);
  u.order = { type: 'gather', id: 'fixture' };
  const f = g.actorCrowd();
  f.congestion.set(u, { until: g.s.time + 1 });
  assert(
    g.actorStepAllowed(u, { x: 250, y: 1500 }),
    'hostile awareness is not a gathering movement wall',
  );
  assert(!g.clearSegment(u, { x: 200, y: 1400 }), 'terrain still blocks gathering movement');
  assert.equal(e.hp, e.maxHp);
}
{
  const g = room(),
    e = enemy(g, 330);
  e.telegraph = { timer: 99 };
  g.updateEnemies = () => {};
  g.updateParty = () => {};
  for (let i = 0; i < 28; i++) g.tick(0.1, { x: 1, y: 0 });
  assert(g.hero.x > e.x + 28, 'real tick/input escapes a mixed crowd');
  assert.equal(e.x, 330, 'separation preserves fixed enemy warning origin');
  assert.equal(e.hp, e.maxHp);
}
{
  const g = room(),
    e = enemy(g, 330);
  Object.assign(g.hero, { x: 200, y: 1500 });
  for (let i = 0; i < 15; i++) advance(g, e, { x: 190, y: 1500 });
  // Force a fresh jam, then ensure death/removal clears temporary state.
  const f = g.actorCrowd();
  f.congestion.set(e, { until: g.s.time + 1, blocked: 0 });
  e.hp = 0;
  g.s.time += 0.1;
  g.actorCrowd();
  e.hp = e.maxHp;
  g.s.time += 0.1;
  assert(!g.crowdEscaping(e), 'reviving an actor cannot retain old escape state');
  g.enter('frontier');
  assert(!g.crowdEscaping(g.hero), 'travel clears old-zone state');
}
// Count actual full-route calls. Body obstruction must not replan every frame;
// even unreachable terrain has a retry interval and a shared per-tick budget.
{
  const g = room(),
    movers = Array.from({ length: 12 }, (_, i) => enemy(g, 200 + i * 3));
  Object.assign(g.hero, { x: 700, y: 1500 });
  const target = { x: 700, y: 1400 };
  let plans = 0;
  g.route = () => {
    plans++;
    return [];
  };
  for (let i = 0; i < 10; i++) {
    g.s.time += 0.05;
    const before = plans;
    for (const u of movers) g.follow(u, target, 100, 0.05);
    assert(plans - before <= R.actorSpacing.movementPlansPerTick - 1, 'bounded enemy planning');
    g.separateActors(0.05);
    if (plans - before === R.actorSpacing.movementPlansPerTick - 1)
      assert(!g.reserveMovementPlan(movers[0]), 'separation cannot reset the tick budget');
    assert(g.reserveMovementPlan(g.hero), 'player slot survives separation frame refresh');
  }
  assert.equal(plans, movers.length, 'unreachable routes planned once each during retry window');
}
{
  const g = room(),
    u = enemy(g, 300),
    blocker = enemy(g, 330);
  Object.assign(g.hero, { x: 700, y: 1500 });
  let plans = 0;
  const target = { x: 700, y: 1400 };
  g.route = () => {
    plans++;
    return [{ x: 700, y: 1500 }, target];
  };
  for (let i = 0; i < 10; i++) {
    g.s.time += 0.05;
    g.follow(u, target, 100, 0.05);
  }
  assert.equal(plans, 1, 'blocked cached terrain route is not discarded every frame');
  assert(distance(u, blocker) > 0);
}
console.log(
  'PASS crowd escape: hero/troops/pets/enemies/bosses/mounts, mixed-side passage, FPS urgency, terrain, restore/death/travel, bounded pathfinding',
);
