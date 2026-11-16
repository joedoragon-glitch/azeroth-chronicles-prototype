'use strict';
// #679: local physical scout evidence, stable IDs and historical-save reconciliation.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const c = new C('normal', 'paladin', () => 0.5);
const beforeArrival = c.thornReport(true);
assert(beforeArrival.includes('I haven’t seen Thornfang on the trail lately'));
assert(beforeArrival.includes('takes Mira along to inspect security'));
c.hero.level = 2;
const z = c.zone(), cfg = C.rules.thornPatrol,
  e = z.enemies.find((e) => e.family === 'thorn' && e.type === 'boss'),
  witness = z.npcs.find((n) => n.thornReport);
assert(e && witness);
assert.equal(witness.id, 'thorn-local-report');
assert.equal(witness.name, 'Western road observer');
assert.equal(cfg.startLeg, 7);
assert.equal(cfg.direction, -1);
assert.equal(cfg.route.length, 8);
assert(cfg.names[2].startsWith('Northern freight crossing'));
assert(cfg.names[3].startsWith('Northern freight crossing'));
for (let i = 0; i < cfg.route.length; i++) {
  const marker = z.npcs.find((n) => n.id === 'thorn-trailhead-' + i);
  assert(marker, 'original scout trailhead ' + i);
  assert.equal(marker.name, 'Scout tracks · ' + cfg.names[i]);
}
const longer = c.thornReport(false);
assert(longer.includes('northern freight crossing'));
for (let i = 0; i < cfg.route.length; i++) {
  const leg = (i + cfg.direction + cfg.route.length) % cfg.route.length;
  Object.assign(e, { x: cfg.route[i][0], y: cfg.route[i][1], thornLeg: leg, thornPause: 0 });
  const raw = JSON.stringify(c.snapshot());
  assert(c.thornReport(true).includes('heading toward ' + cfg.names[leg]));
  assert.equal(c.thornReport(false), longer, 'static landmarks remain independent clues');
  assert.equal(JSON.stringify(c.snapshot()), raw, 'clues cannot mutate game state');
}
e.aggro = true;
assert(c.thornReport(true).includes('Last word puts Thornfang near ' + cfg.names.at(-1)));
e.aggro = false;
const mark = { id: 'report-print', thornFootprint: true, expires: c.s.time + 4,
  x: witness.x + 10, y: witness.y + 10 };
z.npcs.push(mark);
Object.assign(c.hero, { x: mark.x, y: mark.y });
assert(c.thornReport(false).startsWith('Fresh pawprints mark this nearby path'));
c.s.time += 5;
assert.equal(c.thornReport(false), longer);
c.s.keys.thorn = true;
const mira = c.thornCaptive();
Object.assign(mira, { x: cfg.route[3][0], y: cfg.route[3][1] });
assert(c.thornReport(true).includes('Mira waits near ' + cfg.names[3]),
  'the post-defeat rescue clue still identifies her actual waiting area');
c.s.rescued.thorn = true;
assert.equal(c.thornReport(true), 'Mira is free. Find her teaching in Millhaven.');
Object.assign(c.hero, { x: witness.x + 120, y: witness.y });
assert.equal(c.interact(witness), false);
Object.assign(c.hero, { x: witness.x, y: witness.y });
assert(c.interact(witness));
assert(c.messages.at(-1).includes('Mira is free'));
assert.equal(c.notices.at(-1).kind, 'narration');
for (const seed of [0.1, 0.5, 0.9]) {
  const g = new C('normal', 'paladin', () => seed);
  const resident = g.zone().npcs.find((n) => n.id === 'thorn-local-report');
  assert(resident);
  assert.equal(resident.name, 'Western road observer');
  const captain = g.zone().npcs.find((n) => n.id === 'recruiter');
  assert(Math.hypot(resident.x - captain.x, resident.y - captain.y) > 230);
  assert(!g.blocked(resident.x, resident.y));
  assert(g.route(g.hero, resident).length, 'road witness reachable from Millhaven');
  Object.assign(resident, { name: 'Orchard trail witness', x: 900, y: 850, savedWitnessNote: 'retained' });
  const marker = g.zone().npcs.find((n) => n.id === 'thorn-trailhead-2');
  marker.name = 'Scout tracks · Mill crossing, west bank';
  const input = g.snapshot(), before = JSON.stringify(input);
  const restored = C.restore(input, () => seed);
  assert.equal(JSON.stringify(input), before, 'restore does not mutate import');
  const matches = restored.zone().npcs.filter((n) => n.id === resident.id);
  assert.equal(matches.length, 1, 'same historical witness, never a duplicate');
  assert.equal(matches[0].name, 'Western road observer');
  assert.equal(matches[0].savedWitnessNote, 'retained');
  assert(Math.hypot(matches[0].x - captain.x, matches[0].y - captain.y) > 230);
  assert.equal(restored.zone().npcs.find((n) => n.id === marker.id).name,
    'Scout tracks · ' + cfg.names[2], 'historic misleading bridge caption repaired');
  const position = { x: matches[0].x, y: matches[0].y };
  restored.migrateThornPatrol(restored.zone());
  assert.deepEqual({ x: matches[0].x, y: matches[0].y }, position);
  assert.equal(restored.zone().npcs.filter((n) => n.id === resident.id).length, 1);
}
for (const language of ['en', 'es']) {
  const { scope, elements } = require('./helpers/production-shell.cjs').shell(language);
  const game = scope.Prototype.game;
  game.hero.level = 2;
  const resident = game.zone().npcs.find((n) => n.thornReport);
  Object.assign(game.hero, { x: resident.x, y: resident.y });
  elements.get('touch-interact-button').click();
  const dialogue = elements.get('modal-description').textContent;
  assert(dialogue.includes(language === 'en' ? 'patrol is heading toward' : 'se dirige hacia'));
  assert(dialogue.includes(language === 'en' ? 'get her out of there' : 'saca a Mira de allí'));
  const lead = game.thornWitnessLead();
  const target = game.navigationTarget(lead).point;
  const boss = game.zone().enemies.find((enemy) => enemy.family === 'thorn' && enemy.type === 'boss');
  boss.thornLeg = (boss.thornLeg + 1) % cfg.route.length;
  const tile = elements.get('modal-actions').children.find((button) =>
    button.textContent.startsWith(language === 'en' ? 'Follow this lead' : 'Seguir esta pista'));
  assert(tile, 'the reported landmark has an actionable lead');
  tile.click();
  assert.deepEqual(game.hero.path.at(-1), target, 'the route uses the reported area snapshot');
  assert.equal(scope.Prototype.trackedWaypoint?.id, lead.id);
  // The real hero manually takes control. A short walk must NOT recompute
  // the expensive path simply because a 100-unit threshold was crossed.
  game.hero.order = null;
  game.hero.path = [];
  let routeRefreshes = 0;
  const nativeTarget = game.navigationTarget;
  game.navigationTarget = function (...args) {
    routeRefreshes++;
    return nativeTarget.apply(this, args);
  };
  const startX = game.hero.x;
  const startTime = game.s.time;
  game.hero.x += 120;
  scope.Prototype.frame?.(0);
  assert.equal(routeRefreshes, 0, 'manual 120-unit step does not request a new full route');
  assert.equal(scope.Prototype.navigationState.active, true,
    'unrelated short walk must not hide the existing waypoint');

  // A stationary guide should not repeat full route-finding on a timer.
  game.s.time = startTime + 3;
  scope.Prototype.frame?.(100);
  assert.equal(routeRefreshes, 0, 'standing after an interrupted autopilot does not replan');
  game.hero.x = startX + 340;
  scope.Prototype.frame?.(200);
  assert.equal(routeRefreshes, 1, '2 seconds and meaningful displacement refresh once');
  game.hero.x = startX + 800;
  scope.Prototype.frame?.(300);
  assert.equal(routeRefreshes, 2, 'substantial subsequent movement refreshes the route');

  // Finding the actual patrolling monster, rather than reaching the old
  // snapshot waypoint, immediately fulfills this one informant guide.
  Object.assign(boss, { x: game.hero.x + 110, y: game.hero.y + 40 });
  assert(Math.hypot(game.hero.x - target.x, game.hero.y - target.y) > 25,
    'the player did not visit the original landmark');
  scope.Prototype.frame?.(400);
  assert.equal(scope.Prototype.trackedWaypoint, null, 'Thornfang found clears the guide');
  assert.equal(scope.Prototype.navigationState.active, false);
  assert.equal(routeRefreshes, 2, 'the encounter check prevents another route search');
  assert.equal(game.hero.order, null, 'manual hero control is preserved');

}
console.log('PASS #679 truthful, localized Thornfang/Mira clues; stable trail/witness IDs; v4 migration; rescue');
