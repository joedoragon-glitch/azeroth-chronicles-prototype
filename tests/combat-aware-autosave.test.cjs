'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.resolve(__dirname, '../src/prototype/app.js'), 'utf8');
const start = app.indexOf('      saveTimer += dt;');
const end = app.indexOf('    }\n    const eventAt', start);
assert(start >= 0 && end > start, 'live periodic autosave branch exists');
const periodic = app.slice(start, end);
const tick = new Function('game', 'save', 'dt', 'saveTimer', periodic + '\nreturn saveTimer;');

let timer = 0;
let saves = 0;
const game = {
  s: { squadEngagement: 'field', projectiles: [] },
  heroThreatened: false,
  manaCombatActive() { return this.heroThreatened; },
};
const save = () => { saves++; return true; };
const advance = (count) => {
  for (let i = 0; i < count; i++) timer = tick(game, save, 1, timer);
};

advance(10);
assert.equal(saves, 0, 'encounter blocks periodic saves without queuing them');
assert.equal(timer, 0, 'each five-second combat attempt resets the existing timer');

game.s.squadEngagement = null;
game.heroThreatened = true;
advance(5);
assert.equal(saves, 0, 'hero-in-combat check covers an empty squad engagement');

game.heroThreatened = false;
game.s.projectiles = [{ source: 'enemy' }];
advance(5);
assert.equal(saves, 0, 'an incoming hostile projectile blocks periodic serialization');

game.s.projectiles = [];
advance(5);
assert.equal(saves, 1, 'periodic autosave resumes at the next eligible five-second tick');
advance(5);
assert.equal(saves, 2, 'ordinary five-second cadence is unchanged outside combat');

game.s.squadEngagement = 'boss';
advance(5);
assert.equal(saves, 2, 'boss combat is also protected');
game.s.squadEngagement = null;
advance(5);
assert.equal(saves, 3, 'a deferred tick is not backlogged or duplicated');

const eventStart = app.indexOf('    if (\n      events.some((e) =>\n        [');
const eventEnd = app.indexOf("    if (events.some((e) => e.type === 'peace'))", eventStart);
assert(eventStart >= 0 && eventEnd > eventStart, 'milestone-save branch exists');
const eventSave = new Function('events', 'save', app.slice(eventStart, eventEnd));
game.s.squadEngagement = 'boss';
for (const type of ['level', 'bossDefeat', 'questComplete', 'death', 'travel', 'successor']) {
  const before = saves;
  eventSave([{ type }], save);
  assert.equal(saves, before + 1, type + ' still saves immediately in combat');
}
const before = saves;
eventSave([{ type: 'swing' }], save);
assert.equal(saves, before, 'ordinary combat VFX does not trigger a progression save');
console.log('PASS combat-aware periodic autosave and independent milestone saves');
