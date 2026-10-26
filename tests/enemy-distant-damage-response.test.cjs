'use strict';
// Focused native checks for real HP damage beyond passive enemy detection.
// The damage/AI contracts must behave independently of Canvas and PixiJS.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function scene(mode, cls = 'ranger') {
  const g = new Campaign(mode, cls, () => 0.9);
  g.enter('vale');
  const z = g.zone();
  z.props = [];
  z.buildings = [];
  z.enemies = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  Object.assign(g.hero, { x: 1800, y: 1700, hp: 10000, maxHp: 10000, level: 1 });
  const e = g.makeEnemy(
    { species: 'goblin', name: 'distant damage response goblin', level: 1,
      hp: 1000, damage: 1, gold: 0, xp: 0 },
    { x: 1400, y: 1700 },
  );
  Object.assign(e, { ranged: false, hybrid: false, cd: 100, specialCd: 100, idleWanderWait: 1000 });
  z.enemies = [e];
  return { g, z, e };
}
function tick(g, count, dt = 0.1) {
  for (let i = 0; i < count; i++) {
    g.s.time += dt;
    g.updateEnemies(dt);
  }
}
const acquisition = Campaign.rules.balance.enemyAcquisitionRange *
  Campaign.rules.balance.enemyTargetingMultiplier;
assert.equal(acquisition, 286, 'original passive detection contract remains unchanged');

// A real attacker outside passive acquisition must override an unrelated closer
// party bystander, without changing combat range or making all enemies alert.
for (const mode of ['normal', 'nightmare']) {
  const { g, e } = scene(mode);
  const soldier = g.unit('soldier', 1300, 1700);
  Object.assign(soldier, { hp: 10000, maxHp: 10000, order: null });
  g.s.party = [soldier];
  assert(!e.aggro && !g.enemyUnderFireAlert(e), 'fixture starts without combat awareness');
  assert.equal(g.damage(e, 0, 'hero'), false, 'zero damage cannot provoke or record a hit');
  assert(!e.aggro && !g.enemyUnderFireAlert(e), 'no alert without real damage');
  assert(g.line(g.hero, e), 'real outgoing hit has clear line');
  assert(g.damage(e, 25, 'hero'), 'legitimate HP hit is delivered at 400 units');
  assert(e.hp < e.maxHp && e.aggro, 'real HP loss engages beyond passive detection');
  assert.equal(g.enemyUnderFireAlert(e).source, 'hero', 'hit source recorded as transient awareness');
  const oldX = e.x;
  tick(g, 1);
  assert(e.x > oldX, mode + ': enemy moves toward actual distant attacker, not closer soldier');
  assert.equal(Campaign.rules.balance.enemyAcquisitionRange *
    Campaign.rules.balance.enemyTargetingMultiplier, acquisition,
    'no globally enlarged acquisition range');
  const saved = g.snapshot();
  assert(!JSON.stringify(saved).includes('nextSidestep'),
    'temporary damage stimulus is not written to version-4 saves');
  const restored = Campaign.restore(saved, () => 0.9);
  restored.enter('vale');
  const restoredEnemy = restored.zone().enemies.find(u => u.id === e.id);
  assert(restoredEnemy && !restored.enemyUnderFireAlert(restoredEnemy),
    'restoring an existing save does not manufacture stale knowledge');
}

// Being able to see a damaged unit is not the same as having magical sight
// of its previous attacker: a hidden shooter must not replace a visible threat.
{
  const { g, e } = scene('normal');
  const soldier = g.unit('soldier', 1300, 1700);
  Object.assign(soldier, { hp: 10000, maxHp: 10000, order: null });
  g.s.party = [soldier];
  assert(g.damage(e, 25, 'hero'));
  const visible = g.enemyRangedLine.bind(g);
  g.enemyRangedLine = (enemy, actor) => actor !== g.hero && visible(enemy, actor);
  const beforeX = e.x;
  tick(g, 1);
  assert(e.x < beforeX,
    'hidden recent attacker is not tracked through walls; existing visible threat wins');
}

// A ranged enemy that is legitimately waiting for its next shot must not be
// made to dodge or chase solely because it has recently taken damage.
{
  const { g, e } = scene('normal');
  Object.assign(e, { ranged: true, shotRange: 280 });
  Object.assign(g.hero, { x: e.x + 300, y: e.y });
  assert(g.damage(e, 25, 'hero'), 'ranged enemy is genuinely wounded in normal shot range');
  const before = { x: e.x, y: e.y };
  tick(g, 15);
  assert.deepEqual({ x: e.x, y: e.y }, before,
    'normal ranged cooldown holding position is not treated as blocked pursuit');
  g.s.time += 4.1;
  assert(!g.enemyUnderFireAlert(e), 'stimulus expires without creating permanent aggression');
}

// A target behind an obstructed long route is not allowed to leave the
// wounded monster frozen in place when a small collision-safe dodge exists.
// Route planning is intentionally unavailable, but short local native moves
// and all original move collision checks stay active.
for (const mode of ['normal', 'nightmare']) {
  const { g, e } = scene(mode);
  assert(g.damage(e, 25, 'hero'), 'hit reaches the enemy before obstruction');
  const nativeClear = g.clearSegment.bind(g);
  g.clearSegment = (a, b, ...args) =>
    Math.hypot(a.x - b.x, a.y - b.y) <= 80 && nativeClear(a, b, ...args);
  g.route = () => [];
  const before = { x: e.x, y: e.y };
  tick(g, 9);
  assert(Math.hypot(e.x - before.x, e.y - before.y) > 0.1,
    mode + ': incoming damage produces a bounded defensive move after blocked pursuit');
  assert(Math.hypot(e.x - e.home.x, e.y - e.home.y) < 500,
    'defensive sidestep respects the existing normal-monster home leash');
  assert(e.aggro, 'the response does not falsely disengage immediately');
  g.clearEnemyUnderFire(e);
  assert(!g.enemyUnderFireAlert(e), 'alert can be cleared without changing persistent enemy fields');
}

// Actual furnished Greenwood Treasury: target exactly the authored lookout.
// Find an accessible, clear 350-420-unit Ranger firing lane, retaining the
// native architecture, sightlines, room bounds and combat AI.
for (const mode of ['normal', 'nightmare']) {
  const g = new Campaign(mode, 'ranger', () => 0.9);
  g.enter('supply-vale');
  const z = g.zone();
  const lookout = z.enemies.find(e => e.name === 'Greenwood lookout guardian');
  assert(lookout && lookout.ranged && lookout.roomGuard,
    'original Greenwood Treasury lookout exists in the native roster');
  z.enemies = [lookout]; // Isolate a single defender, not the real furniture or map.
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  let point = null;
  for (const d of [350, 375, 400, 420]) {
    if (point) break;
    for (let i = 0; i < 24; i++) {
      const a = i * 2 * Math.PI / 24;
      const p = { x: lookout.x + Math.cos(a) * d, y: lookout.y + Math.sin(a) * d };
      if (g.blocked(p.x, p.y, 'supply-vale', 15)) continue;
      if (!g.line(lookout, p) || !g.clearSegment(lookout, p)) continue;
      point = p;
      break;
    }
  }
  assert(point, 'furnished Greenwood room has a physically clear long-range attack lane');
  Object.assign(g.hero, { ...point, level: lookout.level,
    hp: 10000, maxHp: 10000, order: null });
  assert(g.damage(lookout, 15, 'hero'), 'real Greenwood guardian receives Ranger-range damage');
  const before = { x: lookout.x, y: lookout.y };
  let visiblyReacted = false;
  for (let i = 0; i < 35; i++) {
    tick(g, 1);
    if (lookout.rangedAim || lookout.telegraph || lookout.motion ||
        Math.hypot(lookout.x - before.x, lookout.y - before.y) > 0.1 ||
        g.s.statistics.events.some(evt => evt.type === 'projectileLaunch' &&
          evt.source === lookout.id)) {
      visiblyReacted = true;
      break;
    }
  }
  assert(visiblyReacted,
    mode + ': Greenwood lookout attacks, aims or physically responds after real distant damage');
}
console.log('PASS distant damage awareness: 2 difficulties, true attacker preference, blocked-path fallback, v4 save isolation and native Greenwood Treasury');
