'use strict';
// Developer-only effect recorder; never changes production combat or saved state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createEffectDiagnostics } = require('../src/prototype/renderer.js');

const trace = createEffectDiagnostics();
const base = trace.report(true);
assert.equal(base.drawFrames, 0);
assert.equal(base.eventsSeen, 0);
assert.equal(base.identities.length, 0);
trace.receipts([
  { type: 'heroSkillCast', class: 'mage', slot: 1 },
  { type: 'enemyVfx', skillId: 'boss/thorn/0', stage: 'windup', audioOnly: true },
]);
assert.equal(trace.report(true).receipts.heroSkillCast, 1);
assert.equal(trace.report(true).receipts['enemyVfx:audioOnly'], 1);
const a = { type: 'heroSkill', class: 'mage', slot: 1, stage: 'cast', life: 0.22 };
const b = { type: 'enemyVfx', skillId: 'boss/thorn/0', stage: 'impact', life: 0.42 };
const c = { type: 'impact', life: 0.2 };
trace.candidates([a, b, c], []);
trace.painted(a);
trace.painted(a);
trace.overflow(c);
trace.expiry(b);
const rows = trace.report(true).identities;
const mage = rows.find((r) => r.id === 'hero/mage/1/normal:cast');
const thorn = rows.find((r) => r.id === 'boss/thorn/0:impact');
const generic = rows.find((r) => r.id === 'impact');
assert.deepEqual([mage.queued, mage.painted, mage.drawnFrames], [1, 1, 2]);
assert.deepEqual([thorn.queued, thorn.expiredWithoutDraw], [1, 1]);
assert.deepEqual([generic.queued, generic.overflowDropped], [1, 1]);
trace.decision(false, false);
trace.decision(true, true);
trace.decision(true, false);
const game = {
  s: { time: 2, projectiles: [{}], hazards: [1, 2] },
  zone: () => ({ enemies: [{ hp: 5, telegraph: {}, motion: {} }] }),
  _companionCharges: new Map([['pet', {}]]),
  heroChargeState: () => null,
};
trace.draw(game);
const result = trace.report(false);
assert.equal(result.recording, false);
assert.equal(result.drawFrames, 1);
assert.equal(result.recentDrawFrames[0].telegraphs, 1);
assert.equal(result.recentDrawFrames[0].charges, 1);
assert.equal(result.drawDecisions.adaptiveSkipped, 1);
for (let i = 0; i < 200; i++) trace.draw(game);
assert.equal(trace.report(false).recentDrawFrames.length, 120);

const source = (name) =>
  fs.readFileSync(path.join(__dirname, '../src/prototype/' + name), 'utf8');
const app = source('app.js');
const renderer = source('renderer.js');
const queue = source('combat-visuals.js');
const art = source('enemy-vfx-art.js');
assert(app.includes("developerEnabled && game.s.mode === 'developer'"));
assert(app.includes('renderer.effectDiagnosticsReport()'));
assert(app.includes('Start effect recording'));
assert(app.includes('if (effectRecording) renderer.noteEffectDrawDecision'));
assert(renderer.includes('let effectRecorder = null'));
assert(renderer.includes("getGame().s.mode === 'developer'"));
assert(queue.includes('observer?.candidates(next, current)'));
assert(queue.includes('observer?.overflow(next[index])'));
assert(art.includes('observer?.painted(f)'));
assert(!source('engine.js').includes('effectDiagnostics'));
assert(!source('save.js').includes('effectDiagnostics'));
console.log('PASS opt-in bounded effect diagnostics: receipts, queue, overflow, expiry, first painter call, skip, export');
