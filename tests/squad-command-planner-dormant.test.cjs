'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { KINDS, createSquadCommand, planSquadCommand } =
  require('../tools/experimental/squad-command-planner.cjs');
assert.deepEqual(KINDS, ['move', 'attack', 'defend']);
const hero = { x: 100, y: 100, hp: 100 };
const companions = [
  { id: 'soldier', hp: 50, active: true },
  { id: 'archer', hp: 80, active: true },
  { id: 'fallen', hp: 0, active: true },
  { id: 'resting', hp: 60, active: false },
];
const enemies = [
  { id: 'wolf', hp: 100, x: 120, y: 100, aggro: true, zone: 'vale' },
  { id: 'archer-threat', hp: 100, x: 108, y: 100, aggro: true, zone: 'vale' },
  { id: 'retreating', hp: 100, x: 102, y: 100, returning: true, zone: 'vale' },
  { id: 'dead', hp: 0, x: 101, y: 100, zone: 'vale' },
  { id: 'neutral', hp: 40, x: 100, y: 101, neutral: true, zone: 'vale' },
  { id: 'remote', hp: 40, x: 90, y: 100, zone: 'march' },
];
const scene = { hero, companions, enemies, zone: 'vale' };
const plan = (command, extra = {}) => planSquadCommand({ ...scene, ...extra, command });
assert.throws(() => createSquadCommand('hero-attack'), /Unknown/);
assert.throws(() => createSquadCommand('attack'), /enemy ID/);
assert.throws(() => createSquadCommand('move', { destination: { x: NaN, y: 1 } }), /point/);
const move = createSquadCommand('move', { destination: { x: 450, y: 500 } });
assert(Object.isFrozen(move) && Object.isFrozen(move.destination));
assert.deepEqual(plan(move), [
  { companionId: 'soldier', intent: 'move-formation', anchor: move.destination },
  { companionId: 'archer', intent: 'move-formation', anchor: move.destination },
]);
assert.equal(hero.x, 100, 'planner never moves the hero');
const attack = createSquadCommand('attack', { enemyId: 'wolf' });
assert.deepEqual(plan(attack).map((p) => p.intent), ['focus-enemy', 'focus-enemy']);
assert.deepEqual(plan(attack).map((p) => p.enemyId), ['wolf', 'wolf']);
for (const bad of ['dead', 'neutral', 'retreating', 'remote', 'missing'])
  assert(plan(createSquadCommand('attack', { enemyId: bad }))
    .every((p) => p.intent === 'escort-hero'), bad + ' must be rejected');
const defend = createSquadCommand('defend');
assert(plan(defend).every((p) => p.intent === 'escort-hero'),
  'enemy aggro alone cannot establish an enemy targeting the hero');
assert.deepEqual(
  plan(defend, { heroThreatIds: ['wolf', 'archer-threat'] }).map((p) => p.enemyId),
  ['archer-threat', 'archer-threat'],
  'prefer closest actual hero-directed enemy, not arbitrary aggro');
assert(plan(defend, { heroThreatIds: ['retreating', 'dead', 'neutral', 'remote'] })
  .every((p) => p.intent === 'escort-hero'));
assert.deepEqual(plan(defend, { heroThreatIds: ['wolf'] }).map((p) => p.enemyId),
  ['wolf', 'wolf']);
for (const command of [move, attack, defend])
  assert.deepEqual(plan(command, { recallActive: true }).map((p) => p.intent),
    ['recall', 'recall'], 'Recall takes priority');
const original = JSON.stringify({ hero, companions, enemies });
plan(defend, { heroThreatIds: ['wolf'] });
assert.equal(JSON.stringify({ hero, companions, enemies }), original);
assert.throws(() => plan(defend, { heroThreatIds: [''] }), /receipts/);
const dir = path.resolve(__dirname, '../src/prototype');
for (const file of fs.readdirSync(dir).filter((p) => p.endsWith('.js')))
  assert(!fs.readFileSync(path.join(dir, file), 'utf8').includes('squad-command-planner'),
    'dormant planner must not be imported by live runtime: ' + file);
console.log('PASS dormant squad move/attack/defend planner, actual hero threat receipts, Recall override and no game import');
