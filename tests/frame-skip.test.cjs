'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFrameSkip, frameSkipPreferenceKey } = require('../src/prototype/runtime');

const saved = new Map();
const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
const fresh = createFrameSkip(storage);
assert.equal(fresh.enabled, true, 'Adaptive frame skip is On by default on new devices');
assert.equal(fresh.shouldSkip(0, 20), false, 'Do not skip before measuring real drawings');
assert.equal(fresh.select('on'), false, 'Only boolean changes are accepted');

for (const target of [20, 30, 60]) {
  const skip = createFrameSkip();
  const period = 1000 / target;
  let skipped = 0, streak = 0, longest = 0, doubled = false;
  for (let i = 0; i < 90; i++) {
    const now = i * period;
    const drop = skip.shouldSkip(now, target);
    if (drop) {
      skipped++;
      streak++;
      doubled ||= streak === 2;
    } else {
      streak = 0;
      skip.observe(now, 90, 25, true);
    }
    longest = Math.max(longest, streak);
  }
  assert(skipped > 0, 'Frame skipping engages under render load at ' + target + ' FPS');
  assert(doubled, 'May skip two consecutive eligible drawings at ' + target + ' FPS');
  assert(longest <= 2, 'Must draw after two consecutive skips at ' + target + ' FPS');
  assert.equal(skip.status().skippedDraws, skipped);
  assert(skip.status().estimatedDrawWorkMs >= 89);
  const count = skip.status().skippedDraws;
  skip.suspend();
  assert.equal(skip.status().drawnSamples, 0);
  assert.equal(skip.status().skippedDraws, count, 'Suspension preserves cumulative skips');
  assert.equal(skip.shouldSkip(100000, target), false, 'Resume without a stale skip');
}

const stale = createFrameSkip();
for (let i = 0; i < 6; i++) stale.observe(i * 200, 90, 25, true);
// Previously a 110ms guard would suppress this skip; it now works even at 5 FPS.
assert.equal(stale.shouldSkip(1200, 20), true, 'Heavy slowdown can still skip a costly draw');
assert.equal(stale.shouldSkip(1400, 20), false,
  'An image 350ms or more old requires the next eligible drawing');
stale.observe(1400, 90, 25, true);
assert.equal(stale.shouldSkip(1600, 20), true, 'Skipping can resume after a real drawing');

const scarce = createFrameSkip();
for (let i = 0; i < 6; i++) scarce.observe(i * 500, 90, 25, true);
assert.equal(scarce.shouldSkip(3000, 20), false,
  'Do not deliberately extend an already 500ms-old image');

const cpu = createFrameSkip();
for (let i = 0; i < 40; i++) {
  const now = i * (1000 / 30);
  assert.equal(cpu.shouldSkip(now, 30), false, 'Do not skip on CPU-only pressure');
  cpu.observe(now, 70, 2, true);
}

const recovery = createFrameSkip();
let recoveredSkips = 0;
for (let i = 0; i < 20; i++) {
  const now = i * (1000 / 30);
  if (recovery.shouldSkip(now, 30)) recoveredSkips++;
  else recovery.observe(now, 80, 25, true);
}
assert(recoveredSkips > 0);
for (let i = 20; i < 110; i++) {
  const now = i * (1000 / 30);
  if (!recovery.shouldSkip(now, 30)) recovery.observe(now, 20, 6, true);
}
assert.equal(recovery.shouldSkip(110 * (1000 / 30), 30), false,
  'Normal rendering resumes automatically when real measured load recovers');

assert.equal(recovery.shouldSkip(Infinity, 30), false);
assert.equal(recovery.shouldSkip(4000, 0), false);
assert.equal(recovery.shouldSkip(4000, NaN), false);

assert.equal(fresh.select(false), true);
assert.equal(saved.get(frameSkipPreferenceKey), 'off');
assert.equal(createFrameSkip(storage).enabled, false, 'Explicit Off survives reload');
assert.equal(fresh.shouldSkip(123, 20), false, 'Off disables skips at every target');
assert.equal(fresh.select(true), true);
assert.equal(saved.get(frameSkipPreferenceKey), 'on');
assert.equal(createFrameSkip(storage).enabled, true, 'Explicit On survives reload');
const blocked = createFrameSkip({
  getItem() { throw Error('blocked'); },
  setItem() { throw Error('blocked'); },
});
assert.equal(blocked.enabled, true, 'Storage failure retains new default');
assert.equal(blocked.select(false), true, 'Storage errors do not block manual Off');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
const frame = app.slice(app.indexOf('  function frame(now) {'));
const simulation = frame.indexOf('game.tick(dt,');
const effectUpdate = frame.indexOf('renderer.update(simulating ? dt : 0)');
const drawGate = frame.indexOf('frameSkip.shouldSkip(now, fps.target)');
assert(simulation >= 0 && simulation < drawGate, 'Simulation precedes any adaptive skip');
assert(effectUpdate >= 0 && effectUpdate < drawGate,
  'Combat effects advance before the adaptive drawing decision');
assert(!frame.includes('frameSkip.protect('),
  'Warning, elite-warning, interruption and death events no longer block skipping');
assert(frame.includes('const eligibleDraw = fps.shouldDraw(now);'),
  'Ordinary FPS limiter remains independently in charge of drawing eligibility');
// Two slow callbacks (or one hard stall) activate emergency protection before
// the game's simulation tick, not after a lethal damage event can happen.
const emergency = createFrameSkip();
assert.equal(emergency.beginFrame(100, 210), false);
assert.equal(emergency.beginFrame(310, 210), true);
assert.equal(emergency.status().emergencyActive, true);
assert.equal(emergency.status().protectedCallbacks, 1);
const protectedBefore = emergency.status().protectedCallbacks;
assert.equal(emergency.beginFrame(1010, 700), true, 'Hard stalls retain existing protection');
assert.equal(emergency.status().protectedCallbacks, protectedBefore + 1);

// Real recent drawings are required to leave protection. Skipped opportunities
// never provide false evidence that the browser is now responsive.
let emergencySkipped = 0;
for (let i = 0; i < 24; i++) {
  const now = 1100 + i * 25;
  emergency.beginFrame(now, 25);
  const drop = emergency.shouldSkip(now, 30);
  if (drop) emergencySkipped++;
  else emergency.observe(now, 20, 6, true);
  if (!emergency.emergency) break;
}
assert(emergencySkipped > 0, 'Emergency mode skips more drawings than ordinary load');
assert.equal(emergency.emergency, false, 'Healthy actual draw probes release protection');
assert.equal(emergency.status().emergencyEntries, 1);

const hard = createFrameSkip();
assert.equal(hard.beginFrame(800, 800), true, 'One extreme callback stall activates instantly');
let streak = 0, longest = 0, counted = 0;
for (let i = 0; i < 17; i++) {
  const now = 800 + i * 33;
  const drop = hard.shouldSkip(now, 30);
  if (drop) { counted++; streak++; }
  else {
    streak = 0;
    // Keep the critical rendering work too expensive for recovery.
    hard.observe(now, 190, 145, true);
  }
  longest = Math.max(longest, streak);
}
assert(longest > 2 && longest <= 5,
  'Near-freeze mode may skip up to five eligible draws, then probes again');
assert(counted > 5);
assert(hard.emergency, 'Unhealthy drawing probes must not release protection');
hard.suspend();
assert(!hard.emergency, 'Pausing, menu opening or hiding suspends emergency state');

const offEmergency = createFrameSkip({ getItem: () => 'off' });
assert.equal(offEmergency.beginFrame(1000, 1000), false, 'User Off disables emergency too');
assert(!offEmergency.emergency);

// The emergency path is intentionally outside campaign damage/save rules: no
// battle simulation takes place until the device proves it can render again.
assert(frame.includes('const recovering = !frozen && frameSkip.beginFrame(now, intervalMs);'));
assert(frame.includes('const simulating = !frozen && !recovering;'));
assert(frame.includes('if (simulating) {') && frame.includes('      let x ='),
  'Hero movement, party AI and hostile combat run only outside emergency mode');
assert(frame.includes('renderer.update(simulating ? dt : 0);'),
  'Timed combat effects do not silently expire while combat is protected');
assert(frame.includes('if (simulating) hudTimer += dt;'),
  'Paused emergency state does not consume game HUD timing');
assert(frame.includes('syncPartyChargeClock();'));
assert(app.includes('!frameSkip.emergency &&'),
  'Wall-clock charged abilities also stop progressing during recovery');

// Exercise the actual app callback with the real campaign. Even if a boss
// would kill a hero or companion inside tick, that tick must not run during
// emergency and the same living instances must survive without fake HP refill.
const { shell } = require('./helpers/production-shell.cjs');
const production = shell('en');
const game = production.scope.Prototype.game;
const ally = game.s.party.find((u) => u.hp > 0);
assert(ally, 'A live companion is needed for the rescue contract');
let simulationCalls = 0;
const originalTick = game.tick.bind(game);
game.tick = (dt, input) => {
  simulationCalls++;
  return originalTick(dt, input);
};
production.frame(0);
const callsBefore = simulationCalls, heroHp = game.hero.hp, allyHp = ally.hp;
production.frame(800);
assert.equal(production.scope.Prototype.frameSkip.emergency, true);
assert.equal(simulationCalls, callsBefore, 'Hard stall does not advance hostile simulation');
assert.equal(game.hero.hp, heroHp, 'Hero remains alive without changing HP');
assert.equal(ally.hp, allyHp, 'Companion remains alive without changing HP');
assert.equal(game.s.statistics.deaths, 0, 'No death records or penalties on rescue');
assert.equal(game.s.challenge.pending, false, 'Succession death cannot trigger on rescue');
assert.equal(game.s.challenge.gameOver, false, 'Critical lag cannot create game over');
assert.equal(production.scope.Prototype.frameSkip.status().protectedCallbacks, 1);
for (let i = 1; i < 70 && production.scope.Prototype.frameSkip.emergency; i++)
  production.frame(800 + i * 33.3333);
assert.equal(production.scope.Prototype.frameSkip.emergency, false,
  'Live app automatically recovers after inexpensive visual probes');
const recoveredCalls = simulationCalls;
production.frame(800 + 70 * 33.3333);
assert(simulationCalls > recoveredCalls, 'Live combat resumes after recovery');

console.log('PASS adaptive frame skip: default On, all FPS targets, critical recovery and protected combat, overrides');
