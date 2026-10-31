'use strict';
// Presentation-only reset contract: anti-kiting logic remains authoritative.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Visuals = require('../src/prototype/combat-visuals');

function encounter(offset = 180) {
  const g = new Campaign('normal', 'paladin', () => 0.73);
  g.enter('vale');
  const home = g.safe(1100, 1400);
  const e = g.makeEnemy({
    species: 'goblin', name: 'reset cue check', form: 'normal',
    level: 3, hp: 500, damage: 1, gold: 0, xp: 0,
  }, home);
  g.zone().enemies = [e];
  g.s.party = [];
  g.effects.splice(0);
  Object.assign(e, { x: home.x + offset, y: home.y, aggro: true, hp: e.baseHp / 2 });
  return { g, e, home };
}

{
  const { g, e, home } = encounter();
  const old = { x: e.x, y: e.y };
  g.disengage(e, 0.1);
  assert(e.returning > 0 && e.returning < 1, 'existing one-second return remains');
  assert.equal(e.hp, e.baseHp / 2, 'HP is not instantly restored when return begins');
  const breaking = g.effects.filter(f => f.type === 'reset');
  assert.equal(breaking.length, 1, 'only one disengage receipt');
  assert.deepEqual({ x: breaking[0].x, y: breaking[0].y, zone: breaking[0].zone },
    { ...old, zone: g.zoneId });
  assert(!g.effects.some(f => f.type === 'resetArrival'), 'arrival awaits actual reset');

  g.disengage(e, 1.1);
  assert.equal(e.returning, 0);
  assert.equal(e.aggro, false);
  assert.equal(e.hp, e.baseHp, 'native HP recovery retained');
  assert.deepEqual({ x: e.x, y: e.y }, home, 'native home position retained');
  const arrival = g.effects.filter(f => f.type === 'resetArrival');
  assert.equal(arrival.length, 1);
  assert.deepEqual({
    x: arrival[0].x, y: arrival[0].y,
    fromX: arrival[0].fromX, fromY: arrival[0].fromY,
    zone: arrival[0].zone,
  }, { ...home, fromX: old.x, fromY: old.y, zone: g.zoneId });
  const queued = Visuals.queue(g.effects, g, []);
  assert(queued.some(f => f.type === 'resetCue' && f.max === 0.2));
  assert(queued.some(f => f.type === 'resetArrival' && f.max === 0.28));
  assert(queued.length <= 40, 'existing transient VFX cap is respected');
  g.effects.splice(0);
  g.disengage(e, 0.1);
  assert(!g.effects.some(f => f.type === 'resetArrival'),
    'a finished reset never emits another arrival');
}

{
  const { g, e, home } = encounter(12);
  g.disengage(e, 1.1);
  assert.deepEqual({ x: e.x, y: e.y }, home);
  assert(!g.effects.some(f => f.type === 'resetArrival'),
    'tiny position reconciliation never pretends to be a teleport');
}

{
  const { g } = encounter();
  assert.equal(Visuals.queue([
    { type: 'resetArrival', zone: 'crown', x: 1, y: 2, fromX: 3, fromY: 4 },
    { type: 'resetArrival', zone: g.zoneId, x: NaN, y: 2, fromX: 3, fromY: 4 },
    { type: 'reset', zone: 'crown', x: 1, y: 2 },
  ], g, []).length, 0, 'foreign/malformed reset cues are never displayed');
}

console.log('PASS encounter reset visual receipts: fast native return, anti-exploit HP/reset, bounded render cues and zone filtering');
