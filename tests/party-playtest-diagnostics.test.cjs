'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine');

const game = new Campaign('normal', 'mage', () => 0.9);
const soldier = game.unit('soldier', game.hero.x, game.hero.y);
const pet = game.unit('pet', game.hero.x + 30, game.hero.y, 'thorn');
const resting = game.unit('archer', game.hero.x + 45, game.hero.y);
resting.active = false;
game.s.party = [soldier, pet, resting];
soldier.cd = 4;
pet.skill1Cd = 5;
game.s.time = 10;

const initial = game.partyDiagnosticsReport();
assert.equal(initial.version, 1);
assert.equal(initial.current.rosterSize, 3);
assert.equal(initial.current.activeCount, 2);
assert.equal(initial.current.petCount, 1);
assert.equal(initial.current.units.find((u) => u.id === pet.id).petFamily, 'thorn');
assert.equal(initial.samples.length, 0);

assert(game.applyRogueSlow(soldier, 2.7, 'goblin-ringleader', 'Gang Boss Smoke Trick'));
assert(game.applyRogueSlow(pet, 2.7, 'goblin-ringleader', 'Gang Boss Smoke Trick'));
assert(game.applyRogueSlow(soldier, 2.7, 'goblin-ringleader', 'Gang Boss Smoke Trick'));
const events = game.partyDiagnosticsReport().slowApplications;
assert.equal(events.length, 3);
assert.deepEqual(events.map((event) => event.targetKind), ['companion', 'pet', 'companion']);
assert(events.every((event) => event.sourceId === 'goblin-ringleader'));
assert(events.every((event) => event.moveName === 'Gang Boss Smoke Trick'));
assert.equal(events[0].after.slow.stacks, 1);
assert.equal(events[2].after.slow.stacks, 2);
assert.equal(events[2].after.slow.rogueSeconds, 2.95);
assert(events[2].after.cooldowns.cd > events[0].after.cooldowns.cd);
assert(game.partyDiagnosticsReport().current.units.find((u) => u.id === pet.id).slow.stacks === 1);

const unrelatedEnemy = game.makeEnemy(
  { species: 'goblin', name: 'Diagnostic control', level: 1, hp: 50, damage: 0 },
  { x: 100, y: 100 },
);
game.applySlow(unrelatedEnemy, 1);
game.applySlow(game.hero, 1);
assert.equal(game.partyDiagnosticsReport().slowApplications.length, 3,
  'The party ledger excludes enemies and the separately reported hero');

const stateBefore = JSON.stringify(game.snapshot());
game.partyDiagnosticsObserveTick();
game.partyDiagnosticsObserveTick();
assert.equal(game.partyDiagnosticsReport().samples.length, 1);
assert.equal(game.partyDiagnosticsReport().samples[0].units.length, 2,
  'Benched units appear in current roster, not active simulation samples');
assert.equal(JSON.stringify(game.snapshot()), stateBefore, 'Observation must not alter saves');

game.partyDiagnosticsObserveEmergency(false, 30, 0);
game.partyDiagnosticsObserveEmergency(true, 700, 1);
game.partyDiagnosticsObserveEmergency(true, 100, 1);
game.partyDiagnosticsRecoveryAction('encounter-reset-attempt');
game.partyDiagnosticsObserveEmergency(false, 20, 1);
let report = game.partyDiagnosticsReport();
assert.deepEqual(report.emergencyTransitions.map((event) => event.phase),
  ['entered', 'recovered']);
assert.equal(report.emergencyTransitions[0].callbackIntervalMs, 700);
assert.equal(report.emergencyTransitions[0].party.units.length, 3);
assert.equal(report.recoveryActions.length, 1);

for (let i = 0; i < 150; i++) {
  game.s.time += 0.5;
  game.partyDiagnosticsObserveTick();
}
report = game.partyDiagnosticsReport();
assert.equal(report.samples.length, 120);
assert(report.dropped.samples > 0);
assert.equal(report.emergencyTransitions.length, 2, 'Emergency markers outlive rolling samples');
assert.equal(JSON.stringify(game.snapshot()).includes('partyDiagnostics'), false,
  'Transient diagnostics never enter a persisted campaign');

// Same-frame incident context is sampled only when a callback is unusually
// late or its measured work (especially the party stage) is expensive.
const quiet = {
  callbackTimeMs: 10, intervalMs: 16, frameWorkMs: 5,
  simulationMs: 3, companionAIMs: 1, enemyAIMs: 1, renderMs: 1,
};
const beforeIncidents = JSON.stringify(game.snapshot());
assert.equal(game.partyDiagnosticsObservePerformance(quiet), false);
assert.equal(game.partyDiagnosticsReport().performanceIncidents.length, 0);
assert(game.partyDiagnosticsObservePerformance({
  ...quiet, callbackTimeMs: 500, intervalMs: 227, frameWorkMs: 10,
  simulating: false, recovering: true, drawn: false,
  rendererMode: 'canvas2d', optimizationMode: true,
}));
let incident = game.partyDiagnosticsReport().performanceIncidents[0];
assert.deepEqual(incident.reasons, ['callback-gap']);
assert.equal(incident.frameWorkMs, 10);
assert.equal(incident.stagesMs.companionAI, 1);
assert.equal(incident.frame.emergencyHeld, true);
assert.equal(incident.party.activeCount, 2);
assert.equal(incident.scene.livingHostiles >= 0, true);
assert.equal(game.partyDiagnosticsObservePerformance({
  ...quiet, callbackTimeMs: 520, intervalMs: 60, frameWorkMs: 55,
}), false, 'normal-cost anomalies are throttled between nearby events');
assert(game.partyDiagnosticsObservePerformance({
  ...quiet, callbackTimeMs: 540, intervalMs: 180, frameWorkMs: 97,
  simulationMs: 87, companionAIMs: 68, enemyAIMs: 7,
  simulating: true, recovering: false, drawn: true,
}));
incident = game.partyDiagnosticsReport().performanceIncidents[1];
assert(incident.reasons.includes('companion-update'));
assert(incident.reasons.includes('synchronous-work'));
assert.equal(incident.stagesMs.companionAI, 68);
assert.equal(incident.stagesMs.simulation, 87);
for (let i = 0; i < 22; i++)
  game.partyDiagnosticsObservePerformance({
    ...quiet, callbackTimeMs: 1200 + i * 650, frameWorkMs: 52,
  });
report = game.partyDiagnosticsReport();
assert.equal(report.performanceIncidents.length, 16);
assert(report.dropped.performanceIncidents > 0);
assert.equal(JSON.stringify(game.snapshot()), beforeIncidents,
  'recording incident context must never alter the campaign or v4 save');

const { shell } = require('./helpers/production-shell.cjs');
const app = shell('en');
app.frame(0);
app.frame(33);
const appGame = app.scope.Prototype.game;
assert(appGame.partyDiagnosticsReport().simulationTicksObserved >= 1,
  'Browser frame loop samples actual completed simulations');
app.elements.get('menu-button').click();
const beforeMenu = appGame.partyDiagnosticsReport().simulationTicksObserved;
app.frame(66);
assert.equal(appGame.partyDiagnosticsReport().simulationTicksObserved, beforeMenu,
  'Menu and paused callbacks do not advance party samples');

const appSource = fs.readFileSync(
  path.join(__dirname, '../src/prototype/app.js'), 'utf8',
);
assert(appSource.includes('partyDiagnostics: game.partyDiagnosticsReport()'),
  'Playtest JSON export must contain the companion/pet report');
assert(appSource.includes('game.partyDiagnosticsObservePerformance({'),
  'real abnormal animation callbacks must feed the exported incident timeline');
assert(appSource.includes('intervalMs >= 140 || frameWorkMs >= 45 || stageTimes.companionAIMs >= 20'),
  'normal callbacks must avoid expensive incident gathering');
console.log('PASS bounded companion/pet playtest diagnostics, source attribution, emergency markers and paused frame exclusion');
