'use strict';
// Thornfang's original warned direct Slow line: one lawful release and one
// immutable World decision across all original contacts. No damage bonus.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const World = require('../src/prototype/critical-world-native.js');
const ctx = require('./helpers/specialist-night-context.cjs');

function scene(context = 'normal', form = 'normal') {
  const g = ctx.campaign(context, 'paladin', () => 0.99);
  g.enter('vale');
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.party = [];
  for (const key of ['props', 'buildings', 'npcs']) g.zone()[key] = [];
  const e = g.bossEnemy(g.boss('thorn'), form, { x: 1400, y: 1700 });
  e.aggro = true;
  g.zone().enemies = [e];
  Object.assign(g.hero, {
    x: 1470, y: 1700, hp: 1000000, maxHp: 1000000,
    level: 3, immune: 0, slow: 0, slowStacks: 0,
  });
  g.line = () => true;
  assert(g.startAttack(e, g.hero, 2), 'original Thornfang attack selector');
  assert.equal(e.telegraph.index, 2);
  assert.equal(e.telegraph.kind, 'line');
  assert.equal(e.telegraph.slow, true);
  return { g, e };
}

function attach(g, level = 1, roll = 0) {
  let calls = 0;
  const session = World.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { calls++; return roll; } },
  });
  session.setCriticalLevel('world', level);
  g._criticalWorldNative = session;
  return { count: () => calls, session };
}
function near(a, b, label) {
  assert(Math.abs(a - b) < 1e-6, label + ': ' + a + ' vs ' + b);
}
assert.equal(Campaign.prototype._criticalWorldNative, undefined);

for (const context of ['normal', 'nightmare-night']) {
  for (const form of ['normal', 'true']) {
    for (const level of [1, 2, 3]) {
      const baseline = scene(context, form);
      const altered = scene(context, form);
      const track = attach(altered.g, level);
      const warning = altered.e.telegraph;
      const originalTimer = warning.timer;
      const originalRecovery = warning.recovery;
      const originalLine = {
        fromX: warning.fromX, fromY: warning.fromY,
        x: warning.x, y: warning.y, radius: warning.radius,
      };
      assert.equal(track.count(), 0, 'planning/warning does not sample RNG');
      const oldHp = baseline.g.hero.hp;
      baseline.g.resolveAttack(baseline.e);
      altered.g.resolveAttack(altered.e);
      assert.equal(track.count(), 1, 'exactly one World roll at the line release');
      const receipt = altered.e.telegraph.criticalExecution;
      assert(receipt && Object.isFrozen(receipt));
      assert.equal(receipt.key, 'world/boss/thorn/2');
      assert.equal(receipt.domain, 'world');
      assert.equal(receipt.intensity, level);
      assert(baseline.g.hero.slow > 0, 'original line applied lawful Slow');
      near(altered.g.hero.hp, baseline.g.hero.hp, 'critical Slow cannot change HP damage');
      assert(oldHp > baseline.g.hero.hp, 'original line preserves damage');
      near(
        altered.g.hero.slow - baseline.g.hero.slow,
        Levels.LEVERS.slowDuration.values[level - 1],
        'only original Slow duration is enhanced',
      );
      assert.equal(altered.g.hero.slowStacks, baseline.g.hero.slowStacks);
      assert.equal(warning.timer, originalTimer);
      assert.equal(warning.recovery, originalRecovery);
      assert.deepEqual(
        { fromX: warning.fromX, fromY: warning.fromY,
          x: warning.x, y: warning.y, radius: warning.radius },
        originalLine,
        'original line footprint stays unchanged',
      );
      assert.equal(altered.g.s.hazards.length, baseline.g.s.hazards.length);
      assert.equal(altered.g.s.projectiles.length, baseline.g.s.projectiles.length);
      assert.equal(altered.e.cd, baseline.e.cd);
      track.session.setCriticalLevel('world', level === 3 ? 1 : 3);
      assert.equal(receipt.intensity, level, 'in-flight level is frozen');
      assert.equal(track.count(), 1, 'contact never rerolls');
    }
  }
}
{
  const baseline = scene(), altered = scene();
  const track = attach(altered.g, 3, 0.99);
  baseline.g.resolveAttack(baseline.e);
  altered.g.resolveAttack(altered.e);
  assert.equal(track.count(), 1);
  near(altered.g.hero.slow, baseline.g.hero.slow, 'failed roll retains native Slow');
  near(altered.g.hero.hp, baseline.g.hero.hp, 'failed roll retains native damage');
}
{
  const { g, e } = scene();
  const track = attach(g, 2);
  e.telegraph = null;
  g.resolveAttack(e);
  assert.equal(track.count(), 0, 'cancelled telegraph must not sample');
}
{
  const { g, e } = scene();
  const track = attach(g, 3);
  g.hero.immune = 999;
  g.resolveAttack(e);
  assert.equal(track.count(), 1, 'lawfully released line samples once');
  assert.equal(g.hero.slow, 0, 'immune party target gains no Slow');
}
{
  const { g, e } = scene();
  const track = attach(g, 2);
  g.resolveAttack(e);
  assert.equal(track.count(), 1);
  const save = g.snapshot();
  const boss = save.zones.vale.enemies.find((u) => u.id === e.id);
  assert(boss && boss.telegraph === null, 'original v4 snapshot clears transient warning');
  assert(!JSON.stringify(save).includes('criticalExecution'),
    'v4 snapshot must not persist critical receipts');
}
console.log('PASS native Thornfang Slow line: one release, damage parity, three tiers, both forms/modes, failed roll, immunity, cancellation, unchanged geometry and v4 reset');
