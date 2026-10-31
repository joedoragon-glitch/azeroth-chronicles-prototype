'use strict';
// Audit-only regression probes. Never imported by the playable application.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Art = require('../src/prototype/hero-presentation.js');

const WIDTH = 700, HEIGHT = 530;
const cases = [];
function verify(name, f) {
  try {
    f();
    cases.push({ name, result: 'PASS' });
    console.log('PASS ' + name);
  } catch (e) {
    cases.push({ name, result: 'FAIL', error: e.message });
    console.error('FAIL ' + name + ': ' + e.stack);
  }
}
function fixture(cls = 'mage') {
  const g = new Campaign('developer', cls, () => 0.9);
  g.s.time = 10;
  g.s.mercyTime = 0;
  g.hero.x = 600; g.hero.y = 420;
  const e = g.makeEnemy({
    species: 'goblin', name: 'Status audit target', level: 1,
    hp: 100000, damage: 0, xp: 0, gold: 0,
  }, { x: 220, y: 180 });
  g.zone().enemies = [e];
  e.neutral = false; e.returning = 0;
  return { g, e };
}
function paint(g, project = (u) => ({ x: u.x, y: u.y }), w = WIDTH, h = HEIGHT) {
  const canvas = createCanvas(w, h), ctx = canvas.getContext('2d');
  const text = [];
  const old = ctx.fillText;
  ctx.fillText = function (message, ...args) {
    text.push(String(message));
    return old.call(this, message, ...args);
  };
  const snapshot = JSON.stringify(g.snapshot());
  Art.statuses(ctx, project, g, w, h);
  assert.equal(JSON.stringify(g.snapshot()), snapshot, 'Painting mutated the gameplay snapshot');
  return {
    text,
    bytes: Buffer.from(ctx.getImageData(0, 0, w, h).data),
    count: Array.from(ctx.getImageData(0, 0, w, h).data).filter((v, i) => i % 4 === 3 && v).length,
  };
}
function add(g, e, key) {
  if (key === 'silence') g.hero.silenceField = {
    x: e.x, y: e.y, radius: 35, zone: g.zoneId, until: g.s.time + 4,
  };
  if (key === 'taunt') e.tauntUntil = g.s.time + 4;
  if (key === 'slow') assert(g.applySlow(e, 3));
  if (key === 'fracture') g.fractureEnemy(e, 0.2, 4);
  if (key === 'weaken') g.weakenEnemy(e, 1);
}
const keys = ['silence', 'taunt', 'slow', 'fracture', 'weaken'];
for (const key of keys) verify('each native ' + key + ' state produces isolated enemy pixels', () => {
  const { g, e } = fixture();
  const before = paint(g);
  assert.equal(before.count, 0, 'Clean fixture must have no status pixels');
  add(g, e, key);
  const after = paint(g);
  assert(after.count > 0, key + ' must paint in the world');
  assert(!before.bytes.equals(after.bytes), 'Marker must alter actual pixels');
  assert(after.bytes.equals(paint(g).bytes), 'Same state must produce deterministic pixels');
});
verify('all five status fingerprints are visibly distinguishable', () => {
  const fingerprints = [];
  for (const key of keys) {
    const { g, e } = fixture(); add(g, e, key);
    fingerprints.push(paint(g).bytes.toString('base64'));
  }
  assert.equal(new Set(fingerprints).size, 5);
});
verify('three visible slots, then exact +2/+3 overflow glyph and raster difference', () => {
  const { g, e } = fixture();
  for (const key of keys.slice(0, 3)) add(g, e, key);
  const three = paint(g);
  assert.equal(three.text.length, 0, 'Three status glyphs require no +N');
  add(g, e, keys[3]);
  const four = paint(g);
  assert.deepEqual(four.text, ['+2']);
  add(g, e, keys[4]);
  const five = paint(g);
  assert.deepEqual(five.text, ['+3']);
  assert(!three.bytes.equals(four.bytes) && !four.bytes.equals(five.bytes),
    'Overflow changes must have actual independent pixels');
  assert(five.bytes.equals(paint(g).bytes), 'Overflow must be raster-deterministic');
});
verify('expired status flags retire visible icons', () => {
  const { g, e } = fixture();
  for (const key of keys) add(g, e, key);
  const before = paint(g);
  g.hero.silenceField = undefined;
  e.slow = 0; e.slowStacks = undefined;
  g.s.time += 10;
  const after = paint(g);
  assert(before.count > 0);
  assert.equal(after.count, 0, 'Expiry must clear icons, not only combat penalties');
});
verify('24/25 crowd cap, late boss and manual target receive reserved priority', () => {
  const { g } = fixture();
  const enemies = Array.from({ length: 25 }, (_, i) => {
    const e = g.makeEnemy({
      species: 'goblin', name: 'Crowd #' + i, level: 1,
      hp: 1000, damage: 0, gold: 0, xp: 0,
    }, { x: 55 + (i % 5) * 118, y: 75 + Math.floor(i / 5) * 90 });
    e.weakenUntil = 20;
    e.neutral = false; e.returning = 0;
    return e;
  });
  g.zone().enemies = enemies.slice(0, 24);
  const first = paint(g).bytes;
  g.zone().enemies = enemies;
  const capped = paint(g).bytes;
  assert(first.equals(capped), 'Unselected 25th ordinary enemy must not exceed budget');
  enemies[24].type = 'boss';
  assert(!capped.equals(paint(g).bytes), 'Late boss must displace a lower priority status');
  delete enemies[24].type;
  g.manualHeroTargetZone = g.zoneId;
  g.manualHeroTargetId = enemies[24].id;
  assert(!capped.equals(paint(g).bytes), 'Held/manual target must displace ordinary status');
  g.manualHeroTargetId = null;
  g.s.heroTarget = enemies[24].id;
  assert(!capped.equals(paint(g).bytes), 'Squad target must displace ordinary status');
});
verify('Rogue Hush must produce the same Silence world feedback as Mage Silence', () => {
  const { g, e } = fixture('rogue');
  assert.equal(g.mageSilenceActive(e), false);
  g.applyRogueEnemySilence(e, 4);
  assert.equal(g.rogueEnemySilenced(e), true, 'Actual Rogue Hush state not active');
  assert(paint(g).count > 0, 'KNOWN DEFECT: Rogue Hush produces no enemy Silence pixels');
});
verify('Charmed support cooldown receives the ordinary Slow hit-time debt', () => {
  const { g } = fixture('rogue');
  const ally = g.unit('archer', 500, 420);
  g.s.party.push(ally);
  ally.charmOrigin = 'audit-charm';
  ally.charmSupportCd = 10;
  assert(g.applySlow(ally, 2));
  const expected = 10 + 2.25 * Campaign.rules.cooldownBalance.slowDebtFraction;
  assert(Math.abs(ally.charmSupportCd - expected) < 1e-9,
    'KNOWN DEFECT: charmSupportCd ' + ally.charmSupportCd + ' versus expected ' + expected);
});
verify('Hybrid enemy heal cooldown receives the ordinary Slow hit-time debt', () => {
  const { g, e } = fixture();
  e.hybrid = true;
  e.hybridSelfHealCd = 10;
  assert(g.applySlow(e, 2));
  const expected = 10 + 2.25 * Campaign.rules.cooldownBalance.enemySlowDebtFraction;
  assert(Math.abs(e.hybridSelfHealCd - expected) < 1e-9,
    'KNOWN DEFECT: hybridSelfHealCd ' + e.hybridSelfHealCd + ' versus expected ' + expected);
});

// The focused CI entry point must also execute the already established
// regression contracts. This deliberately leaves production test files untouched.
const childProcess = require('node:child_process');
const path = require('node:path');
const establishedSuites = [
  'slow-cooldown',
  'combat-conditions',
  'combat-trap-sources',
  'effect-diagnostics-stage3',
  'effect-diagnostics-stage3-party',
  'effect-quality-protected-cues',
  'effect-warning-crowd-fps',
  'player-conditions-reference',
  'rogue-all-skills-stacking',
  'rogue-bard-phase5-repertoire',
  'rogue-bard-critical-temporal',
  'pixi-fidelity',
];
for (const suite of establishedSuites) verify('existing ' + suite + ' regression', () => {
  const script = path.join(__dirname, suite + '.test.cjs');
  const result = childProcess.spawnSync(process.execPath, [script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 180000,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, suite + ' failed: ' +
    (result.error?.message || result.stderr || result.stdout || result.signal));
});

console.log('STATUS AUDIT RESULT: ' + JSON.stringify(cases));
if (cases.some(c => c.result === 'FAIL')) process.exitCode = 1;
