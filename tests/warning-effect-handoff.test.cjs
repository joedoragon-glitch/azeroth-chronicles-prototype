'use strict';
// A warning is pre-release information, not a persistent impact effect.
// Cover the shared Canvas/Pixi overlay renderer and the native combat bridge.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine.js');
const FX = require('../src/prototype/combat-visuals.js');
const Art = require('../src/prototype/enemy-vfx-art.js');

function arena(family = 'thorn', form = 'normal') {
  const c = new C('normal', 'paladin', () => 0.5);
  const definition = c.boss(family);
  c.enter(definition.kind === 'dungeon' ? definition.id : definition.region);
  c.s.party = [];
  c.s.mercyTime = 0;
  c.s.holdFire = true;
  // Simulate a lawful committed field encounter: first-play Greenwood bosses
  // and ordinary monsters otherwise refuse unprovoked hits by design.
  c.s.thornHeroInitiated = true;
  c.s.valeFieldAwakened = true;
  c.line = () => true;
  c.blocked = () => false;
  c.clearSegment = () => true;
  c.traps = () => [];
  Object.assign(c.hero, { x: 1480, y: 1700, hp: 1e8, maxHp: 1e8, immune: 999 });
  const e = c.bossEnemy(definition, form, { x: 1400, y: 1700 });
  e.home = { x: e.x, y: e.y };
  c.zone().enemies = [e];
  c.zone().props = [];
  c.s.hazards = [];
  c.engage(e);
  return { c, e };
}
const screen = ({ x, y }) => ({
  x: 350 + (x - 1400) * 0.6,
  y: 260 + (y - 1700) * 0.38,
});
function paint(c, effectArt = true) {
  const canvas = createCanvas(700, 520),
    ctx = canvas.getContext('2d'),
    strokes = [],
    fills = [],
    labels = [],
    originalStroke = ctx.stroke.bind(ctx),
    originalFill = ctx.fill.bind(ctx),
    originalText = ctx.fillText.bind(ctx);
  ctx.stroke = (...args) => {
    strokes.push(ctx.strokeStyle);
    return originalStroke(...args);
  };
  ctx.fill = (...args) => {
    fills.push(ctx.fillStyle);
    return originalFill(...args);
  };
  ctx.fillText = (label, ...args) => {
    labels.push(String(label));
    return originalText(label, ...args);
  };
  const shapes = new Map();
  FX.ground(ctx, screen, c, 'fill', c.s.time, shapes);
  FX.ground(ctx, screen, c, 'underlay-cue', c.s.time, shapes);
  FX.actorCues(ctx, screen, c);
  if (effectArt) Art.actors(ctx, screen, c, []);
  return {
    strokes, fills, labels,
    pixels: Buffer.from(ctx.getImageData(0, 0, 700, 520).data),
  };
}

// The shared rule applies to named cones/circles, anonymous/elite Rogue casts,
// ordinary ranged aim, boss recovery and every released attack family.
for (const timer of [0, -0.02, -1]) assert.equal(FX.pendingWarning({ timer }), false);
assert.equal(FX.pendingWarning(null), false);
assert.equal(FX.pendingWarning({ timer: 0.01 }), true);
{
  const { c, e } = arena();
  assert(c.startAttack(e, c.hero, 0));
  assert(FX.visibleWarning(e));
  const original = e.telegraph;
  const during = paint(c);
  original.timer = 0;
  assert.equal(FX.visibleWarning(e), false);
  const expired = paint(c);
  e.telegraph = null;
  const absent = paint(c);
  assert.deepEqual(expired.pixels, absent.pixels,
    'expired boss warning/cast/windup art remains after release');
  assert.notDeepEqual(during.pixels, absent.pixels,
    'a pending boss strike must retain its readable pre-release warning');
  e.telegraph = original;
  original.timer = 0.01;
  // A boss may be in its legitimate opening/patrol transition when this
  // test begins. Advance native simulation, not a direct forced resolution.
  for (let tick = 0; tick < 600 && e.telegraph === original; tick++) {
    c.s.time += 0.02;
    c.updateEnemies(0.02);
  }
  assert.notEqual(e.telegraph, original,
    'native combat must retire the exact warned attack at release');
}
{
  const { c, e } = arena();
  const a = {
    kind: 'cone', name: 'Anonymous', x: e.x, y: e.y,
    angle: 0, radius: 120, fromX: e.x, fromY: e.y,
    timer: 0.35, total: 0.35, anonymousCast: true,
  };
  e.telegraph = a;
  const during = paint(c);
  a.timer = 0;
  const expired = paint(c);
  e.telegraph = null;
  assert.deepEqual(expired.pixels, paint(c).pixels,
    'anonymous cast bar must vanish once its action clock expires');
  assert.notDeepEqual(during.pixels, expired.pixels,
    'anonymous cast bar must remain during actual preparation');
}
{
  const { c, e } = arena();
  e.telegraph = null;
  e.rangedAim = { x: c.hero.x, y: c.hero.y, timer: 0.35, total: 0.35 };
  const during = paint(c);
  e.rangedAim.timer = 0;
  const expired = paint(c);
  e.rangedAim = null;
  assert.deepEqual(expired.pixels, paint(c).pixels,
    'ordinary ranged aiming line must vanish at projectile launch');
  assert.notDeepEqual(during.pixels, expired.pixels,
    'active ranged aim remains visible during the shot windup');
}
{
  const { c, e } = arena();
  e.telegraph = null;
  const goblin = c.makeEnemy(
    { species: 'goblin', level: 5, hp: 9000, damage: 24, xp: 0, gold: 0 },
    { x: e.x, y: e.y },
  );
  c.zone().enemies = [goblin];
  goblin.aggro = true;
  assert(c.tacticalRogueMove(goblin, c.hero, false));
  const move = goblin.telegraph;
  const during = paint(c);
  move.timer = 0;
  const expired = paint(c);
  goblin.telegraph = null;
  assert.deepEqual(expired.pixels, paint(c).pixels,
    'ordinary monster Rogue cone/circle persists into execution');
  assert.notDeepEqual(during.pixels, expired.pixels,
    'Rogue attack still telegraphs before its release');
}
{
  const { c, e } = arena('citadel');
  e.telegraph = null;
  e.board = {
    x: e.x, y: e.y, size: 64, beat: 0, timer: 0.3, phase: 'warn',
  };
  c.sentinelBoardCells = () => [
    { x: e.x, y: e.y, size: 64, selected: true },
  ];
  const warning = paint(c, false);
  assert(warning.strokes.includes('#fff1a7'),
    'the Citadel board still announces a future dangerous tile');
  // Use the actual Citadel damage engine rather than advancing the
  // presentation phase by hand: the warning must retire on the hit tick.
  Object.assign(c.hero, { x: e.x, y: e.y, immune: 0 });
  const hpBefore = c.hero.hp;
  c.sentinelUpdateBoard(e, 0.31);
  assert.equal(e.board.phase, 'rest', 'Citadel must enter rest on impact');
  assert(c.hero.hp < hpBefore, 'Citadel checkerboard must inflict native damage at release');
  const impact = paint(c, false);
  assert(!impact.strokes.includes('#ff9267') && !impact.fills.includes('#e84b3d88'),
    'old damaging square outline/fill persists after the board hit');
  assert(impact.strokes.includes('#ffb078'),
    'resolved board strike needs a visually distinct non-warning impact');
}

// Every authored boss family and TRUE form uses the same timer boundary.
// Queued follow-up warnings may appear immediately, but must be a NEW object.
let releases = 0;
for (const boss of C.data.bosses)
  for (const form of ['normal', 'true']) {
    const { c, e } = arena(boss.id, form);
    assert(c.startAttack(e, c.hero, 0), boss.id + '/' + form + ' setup');
    const previous = e.telegraph;
    previous.timer = 0.01;
    for (let tick = 0; tick < 600 && e.telegraph === previous; tick++) {
      c.s.time += 0.02;
      c.updateEnemies(0.02);
    }
    assert.notEqual(e.telegraph, previous, boss.id + '/' + form + ' obsolete warning');
    assert(!FX.pendingWarning(previous), boss.id + '/' + form + ' expired cast');
    if (e.telegraph)
      assert(FX.pendingWarning(e.telegraph),
        boss.id + '/' + form + ' next attack warning must remain actionable');
    releases++;
  }
console.log('PASS warning/effect handoff: pending timers, Rogue, ranged, Citadel, ' +
  releases + ' boss and TRUE releases');
