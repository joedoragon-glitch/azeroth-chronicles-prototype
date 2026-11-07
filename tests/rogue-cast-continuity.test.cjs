'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  FX = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
function arena(boss = false) {
  const c = new C('normal', 'paladin', () => 0.99);
  c.zone().props = [];
  c.s.party = [];
  c.s.time = 30;
  const e = boss
    ? c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 })
    : c.makeEnemy(
        { species: 'goblin', level: 2, hp: 10000, damage: 25, xp: 0, gold: 0 },
        { x: 1400, y: 1700 },
      );
  c.zone().enemies = [e];
  Object.assign(c.hero, {
    x: e.x + 70,
    y: e.y,
    hp: 10000,
    maxHp: 10000,
    level: e.level + 1,
    immune: 0,
  });
  c.engage(e);
  Object.assign(e, { cd: 100, specialCd: 100, summonCd: 100 });
  return { c, e };
}
function anchor(c, e) {
  c._tacticalRegroups = new Map([
    [e.id, { phase: 'anchored', anchor: { x: e.x, y: e.y }, holdRemaining: 12, moveUsed: true }],
  ]);
}
for (const kind of ['Tripwire', 'ordinary Rogue', 'elite Rogue', 'ranged aim']) {
  const { c, e } = arena(kind === 'Tripwire' || kind === 'elite Rogue');
  if (kind === 'Tripwire') e.telegraph = c.buildBossAttack(e, 2, c.hero).first;
  else if (kind === 'ranged aim') {
    e.ranged = true;
    e.rangedAim = { x: c.hero.x, y: c.hero.y, timer: 0.5 };
  } else assert(c.tacticalRogueMove(e, c.hero));
  const clock = kind === 'ranged aim' ? e.rangedAim : e.telegraph;
  clock.timer = 0.5;
  anchor(c, e);
  c.hero.x = e.x + 310;
  c.updateEnemies(0.1);
  assert(
    Math.abs(clock.timer - 0.4) < 1e-9,
    kind + ' counts down while target leaves regroup radius',
  );
  for (let i = 0; i < 5; i++) {
    c.s.time += 0.1;
    c.updateEnemies(0.1);
  }
  assert(
    e.telegraph !== clock && e.rangedAim !== clock,
    kind + ' completes or misses instead of freezing',
  );
}
// The fixed footprint, rather than the original target ID, decides ordinary contact.
for (const escaped of [false, true]) {
  const { c, e } = arena();
  assert(c.tacticalRogueMove(e, c.hero));
  const a = e.telegraph;
  const near = c.unit('soldier', a.x + a.radius - 1, a.y),
    outside = c.unit('soldier', a.x + a.radius + 1, a.y),
    covered = c.unit('soldier', a.x, a.y + 25),
    immune = c.unit('soldier', a.x, a.y - 25);
  c.s.party = [near, outside, covered, immune];
  immune.immune = 2;
  const line = c.line.bind(c);
  c.line = (from, to) => to !== covered && line(from, to);
  const hp = c.s.party.map((u) => u.hp);
  if (escaped) c.hero.x = a.x + a.radius + 30;
  c.tacticalResolveRogueMove(e, a);
  assert.equal(
    near.rogueSlow,
    2,
    'inside edge receives the authored two-second Rogue slow even if initial victim escaped',
  );
  assert(near.hp < hp[0], 'inside edge receives real contact');
  assert.equal(outside.rogueSlow, undefined, 'outside edge remains safe');
  assert.equal(outside.hp, hp[1]);
  assert.equal(covered.rogueSlow, undefined, 'solid cover protects each individual');
  assert.equal(covered.hp, hp[2]);
  assert.equal(immune.rogueSlow, undefined, 'immunity protects each individual');
  assert.equal(immune.hp, hp[3]);
  assert.equal(c.slowMovementFactor(near), 0.4);
  if (!escaped) assert.equal(c.hero.rogueSlow, 2);
  else assert.equal(c.hero.rogueSlow, undefined);
  c.s.expeditionRank = 4;
  const restored = C.restore(c.snapshot(), () => 0.99);
  assert.equal(restored.hero.rogueSlow, c.hero.rogueSlow, 'save retains hero condition');
  assert.equal(
    restored.s.party.find((u) => u.id === near.id).rogueSlow,
    2,
    'save retains companion condition',
  );
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const c = new C('normal', cls, () => 0.99);
  c.zone().props = [];
  c.zone().enemies = [];
  c.s.party = [];
  Object.assign(c.hero, { x: 1400, y: 1700 });
  const speeds = [];
  const move = c.move.bind(c);
  c.move = (u, p, s, ...rest) => {
    if (u === c.hero) speeds.push(s);
    return move(u, p, s, ...rest);
  };
  c.applySlow(c.hero, 4);
  c.tick(0.1, { x: 1, y: 0, speedFactor: 1.35 });
  const ordinary = speeds.at(-1);
  c.applyRogueSlow(c.hero, 2);
  c.tick(0.1, { x: 1, y: 0, speedFactor: 1.35 });
  const rogue = speeds.at(-1);
  assert(Math.abs(ordinary - c.hero.speed * 1.35 * 0.65) < 1e-6, 'non-Rogue slow unchanged');
  assert(
    Math.abs(rogue - c.hero.speed * 1.35 * 0.4) < 1e-6,
    'input uses Rogue reduction even while sprinting',
  );
  assert(rogue < 175, 'baseline sprint falls below an ordinary pursuer');
  c.applySlow(c.hero, 6);
  c.hero.rogueSlow = 0.05;
  c.tick(0.1, { x: 1, y: 0 });
  assert.equal(
    c.slowMovementFactor(c.hero),
    0.65,
    'strong component expires without shortening ordinary Slow',
  );
}
// Ground outlines cannot paint over bodies, while floating captions remain separate.
{
  const { c, e } = arena(true);
  e.telegraph = c.buildBossAttack(e, 2, c.hero).first;
  e.telegraph.timer = 0.5;
  const ops = [],
    canvas = createCanvas(393, 852),
    ctx = canvas.getContext('2d');
  const fillText = ctx.fillText.bind(ctx),
    fillRect = ctx.fillRect.bind(ctx);
  ctx.fillText = (t, ...a) => {
    ops.push(['text', t]);
    fillText(t, ...a);
  };
  ctx.fillRect = (...a) => {
    ops.push(['rect', ctx.fillStyle]);
    fillRect(...a);
  };
  const screen = (p) => ({ x: 196 + (p.x - c.hero.x) * 0.4, y: 420 + (p.y - c.hero.y) * 0.4 });
  const state = JSON.stringify(c.snapshot());
  FX.ground(ctx, screen, c, 'underlay-cue');
  assert(
    !ops.some((x) => x[0] === 'text' && x[1].includes('Tripwire')),
    'floor pass never draws the floating attack plaque',
  );
  ops.length = 0;
  FX.actorCues(ctx, screen, c);
  assert(
    ops.some((x) => x[0] === 'text' && x[1].includes('0.5s')),
    'countdown explicitly labels seconds',
  );
  assert(
    ops.some((x) => x[0] === 'rect' && /7a$|80$/i.test(x[1])),
    'cast plaque has a translucent fill',
  );
  assert.equal(JSON.stringify(c.snapshot()), state, 'both presentation passes stay save pure');
  const order = [],
    v = {
      height: () => 65,
      floor() {},
      terrain() {},
      roads() {},
      footpaths() {},
      bridges() {},
      atmosphere() {},
      draw(_ctx, ent) {
        order.push(ent.renderKind);
      },
    };
  c.zone().props = [{ id: 'cover', structure: 'rock', x: c.hero.x, y: c.hero.y }];
  c.s.party = [c.unit('soldier', c.hero.x, c.hero.y)];
  const renderer = R.create({
    canvas,
    ctx,
    getGame: () => c,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 196, y: 420 }) },
    chargePresentation: () => null,
    isPaused: () => false,
    Campaign: C,
    PrototypeVisuals: v,
    PrototypeCombatVisuals: {
      ground(_ctx, _s, _g, pass) {
        order.push(pass);
      },
      actorCues() {
        order.push('captions');
      },
    },
    PrototypeSprites: null,
    PrototypeMaterials: null,
    PrototypeGroundCache: null,
    now: () => 16000,
  });
  renderer.draw();
  for (const type of ['prop', 'hero', 'ally', 'enemy']) {
    assert(order.includes(type));
    assert(order.indexOf('underlay-cue') < order.indexOf(type), type + ' covers ground warnings');
    assert(order.indexOf(type) < order.indexOf('captions'), 'caption stays readable above ' + type);
  }
}
console.log(
  'PASS committed-cast clocks, full ordinary circle/edge/cover/immunity, Rogue speed and save persistence, warning layers and translucent captions',
);
