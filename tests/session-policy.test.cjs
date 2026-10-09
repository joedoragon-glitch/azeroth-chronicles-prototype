'use strict';
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Session = require('../src/prototype/session');
let game = new Campaign('normal', 'paladin', () => 0.9);
const session = Session.create({ getGame: () => game });
const active = {
  started: true,
  menuOpen: false,
  paused: false,
  focused: true,
  hidden: false,
  blocked: false,
};
assert.equal(session.mode, 'single-player');
for (const flag of ['menuOpen', 'paused', 'hidden']) {
  const result = session.timing({ ...active, [flag]: true });
  assert(result.worldPaused && result.inputBlocked, flag + ' pauses single-player');
}
assert(session.timing({ ...active, focused: false }).worldPaused);
const originalSave = game.snapshot();
session.setMode('cooperative');
assert.deepEqual(
  game.snapshot(),
  originalSave,
  'session selection does not mutate the v4 campaign',
);
for (const flag of ['menuOpen', 'paused', 'hidden']) {
  const result = session.timing({ ...active, [flag]: true });
  assert(!result.worldPaused && result.inputBlocked, flag + ' blocks only local input in co-op');
}
assert(!session.timing({ ...active, focused: false }).worldPaused);
assert(
  session.timing({ ...active, blocked: true }).worldPaused,
  'campaign terminal gate still blocks simulation',
);
assert(session.timing({ ...active, started: false }).worldPaused);
assert.throws(() => session.setMode('online'), /Unknown session/);
assert.equal(session.mode, 'cooperative');

function atService() {
  game = new Campaign('normal', 'paladin', () => 0.9);
  const source = game.visibleNPCs().find((n) => n.kind === 'transport');
  Object.assign(game.hero, { x: source.x, y: source.y });
  return { source, lease: session.captureInteraction(source) };
}
let { source, lease } = atService();
assert(session.interactionValid(lease));
game.refreshNPCs();
assert(session.interactionValid(lease), 'NPC refresh keeps the same available service valid');
game.hero.x += 116;
assert(!session.interactionValid(lease), 'service distance is checked at action time');
({ source, lease } = atService());
game.zone().npcs = game.zone().npcs.filter((n) => n.id !== source.id);
assert(!session.interactionValid(lease), 'removed service invalidates its dialog');
({ lease } = atService());
game.enter('march');
assert(!session.interactionValid(lease));
game.enter('vale');
assert(!session.interactionValid(lease), 'leaving and returning cannot revive an old dialog');
({ lease } = atService());
game.enter('vale');
assert(!session.interactionValid(lease), 'same-zone entry also invalidates a local interaction');
({ lease } = atService());
game.die();
assert(!session.interactionValid(lease), 'death invalidates the old interaction after revival');
({ lease } = atService());
game = new Campaign();
assert(!session.interactionValid(lease), 'replacement campaign invalidates old interactions');
({ lease } = atService());
game.s.hero = { ...game.hero };
assert(
  !session.interactionValid(lease),
  'controlled character replacement invalidates the interaction',
);
assert(session.interactionValid(null), 'global menus have no location dependency');

// A Barracks service uses the Barracks location, not a synthetic remote specialist.
game = new Campaign();
const b = { id: 'test-barracks', x: game.hero.x, y: game.hero.y, progress: 4 };
game.zone().buildings.push(b);
lease = session.captureInteraction({ ...b, kind: 'barracks' });
assert(session.interactionValid(lease));
game.zone().buildings.length = 0;
assert(!session.interactionValid(lease));
assert(!Object.hasOwn(game.snapshot(), 'interactionEpoch'), 'interaction leases never enter saves');
console.log(
  'PASS single-player/co-op timing and location, NPC, actor, death and travel interaction validation',
);
