'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena(positions, cls = 'mage') {
  const g = new Campaign('normal', cls, () => 0.9);
  completeFieldOpening(g);
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 500, hp: 10000, maxHp: 10000, order: null });
  g.hero.skills[0] = 1;
  const enemies = positions.map(([x, y], i) => {
    const e = g.makeEnemy(
      { species: 'goblin', name: 'Beam flight ' + i, level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
      { x, y },
    );
    e.aggro = true;
    e.returning = false;
    e.home = { x, y };
    return e;
  });
  g.zone().enemies = enemies;
  // The regular combat fixture uses legal engaged targets.
  for (const enemy of enemies) assert(g.damage(enemy, 1, 'hero'));
  g.effects.length = 0;
  return { g, enemies };
}
function advance(g, seconds, step = 0.05) {
  for (let remaining = seconds; remaining > 1e-9; ) {
    const dt = Math.min(step, remaining);
    g.s.time += dt;
    g.advanceHeroSkillEffects(dt);
    remaining -= dt;
  }
}
{
  const { g, enemies: [first, second] } = arena([[620, 500], [830, 500]]);
  assert(g.cast(1, first.id, true));
  // First engagement may apply ordinary monster HP scaling at cast time.
  // Verify an actual absence of impact, then measure subsequent travel from
  // the encounter-adjusted baseline instead of the pre-engagement HP.
  assert.equal(g.effects.filter(e => e.type === 'hit').length, 0,
    'charged Mage Skill 1 never damages an enemy on release');
  const hp1 = first.hp, hp2 = second.hp;
  assert.equal(g._heroSkillEffects[0]?.kind, 'wide-beam');
  const initial = g.effects.find(e => e.type === 'heroSkillArea' && e.phase === 'launch');
  assert(initial && Math.abs(initial.travelSeconds - 0.625) < 0.001);
  advance(g, 0.1);
  assert.equal(first.hp, hp1, 'near foe not hit before traveling front reaches it');
  advance(g, 0.18);
  assert(first.hp < hp1, 'near foe damaged on arrival');
  assert.equal(second.hp, hp2, 'far foe not pre-hit');
  advance(g, 0.6);
  assert(second.hp < hp2, 'far foe hit by advancing front');
  const complete = g.effects.find(e => e.type === 'heroSkillArea' && e.phase === 'complete');
  assert.equal(complete?.hits, 2, 'one hit per foe, one complete corridor receipt');
  assert.equal(g._heroSkillEffects.length, 0);
}
{
  const { g, enemies: [target, moving] } = arena([[620, 500], [820, 500]]);
  assert(g.cast(1, target.id, true));
  const oldHp = moving.hp;
  moving.y = 660;
  advance(g, 1);
  assert.equal(moving.hp, oldHp, 'charged beam never turns to follow escaping foes');
}
{
  // The charged spell tilts toward the SAME world-space cast endpoint when
  // the player sidesteps. It may catch a previously off-axis enemy, but it
  // cannot become a parallel beam that simply slides sideways.
  const { g, enemies: [primary, newlyAligned] } = arena([[620, 500], [650, 610]]);
  assert(g.cast(1, primary.id, true));
  const oldHp = newlyAligned.hp;
  const beam = g._heroSkillEffects[0];
  assert.equal(beam.aim.x, 940);
  assert.equal(beam.aim.y, 500);
  g.hero.y = 670;
  advance(g, 0.42);
  assert.equal(beam.from.y, 670, 'charged effect remains attached to the moving Mage');
  assert.equal(beam.aim.y, 500, 'original far aiming point is fixed');
  assert(beam.endY < 670, 'the direction tilts back toward the original aim');
  assert(newlyAligned.hp < oldHp, 'new off-axis enemy can be collected by the tilted corridor');
}
{
  // Moving the Mage to a different angle cannot make the new corridor
  // pass through terrain. Rendered end and legal damage extent agree.
  const { g, enemies: [target, behindWall] } = arena([[620, 500], [850, 500]]);
  assert(g.cast(1, target.id, true));
  const hp = behindWall.hp;
  const clear = g.clearSegment.bind(g);
  g.clearSegment = (a, b, ...rest) => b.x <= 700 && clear(a, b, ...rest);
  advance(g, 0.65);
  assert(g.effects.some(e => e.type === 'heroSkillArea' && e.phase === 'complete'));
  assert(behindWall.hp === hp, 'the caster-connected beam never hits through an obstruction');
}
{
  const { g, enemies: [e] } = arena([[780, 500]]);
  assert(g.cast(1, e.id, false));
  assert.equal(g.effects.filter(e => e.type === 'hit').length, 0,
    'ordinary beam must not hit on release');
  const hp = e.hp;
  const p = g.s.projectiles.find(p => p.style === 'beam');
  assert(p?.mageSkill1Homing, 'only ordinary Skill 1 has homing');
  assert.equal(p.beamWidthScale, 2, 'regular beam is 20% thinner than previous 2.5x width');
  assert.equal(p.speed, 1.2 * Math.max(170, Math.min(535, 280 / 0.75)),
    'regular Mage beam flies 20% faster than its original speed');
  assert(p.speed < 1000, 'slower than former laser');
  assert.equal(p.travelBudget, 540, 'homing flight remains finite');
  g.hero.x = 470;
  g.updateProjectiles(0.1);
  assert.equal(e.hp, hp, 'normal beam does not impact before physical arrival');
  e.y = 590; // Move the original target after the shot releases.
  for (let i = 0; i < 28 && g.s.projectiles.includes(p); i++) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
  assert(p.trailPoints.some(point => point.y > 500), 'the actual path bends to follow its foe');
  assert.equal(p.originX, 500, 'the beam begins at its original caster position');
  assert(e.hp < hp, 'homing normal beam strikes only when it physically arrives');
}
{
  const { g, enemies: [first, extra, missed] } = arena([[620, 500], [820, 565], [820, 650]]);
  assert(g.cast(1, first.id, true));
  const missedHp = missed.hp;
  const firstHp = first.hp, extraHp = extra.hp;
  advance(g, 0.25);
  assert(first.hp < firstHp, 'charged beam reaches the first aligned enemy');
  assert.equal(extra.hp, extraHp, 'second enemy begins outside the locked angle');
  // Translation alone steers the beam: facing stays fixed from its release.
  g.hero.y = 575;
  advance(g, 0.5);
  assert(extra.hp < extraHp, 'angled beam catches an additional enemy on its real corridor');
  assert.equal(missed.hp, missedHp, 'moving the caster does not translate the whole corridor sideways');
  assert.equal(g._heroSkillEffects?.length || 0, 0);
  const result = g.effects.find(e => e.type === 'heroSkillArea' && e.phase === 'complete');
  assert.equal(result?.hits, 2, 'each distinct foe struck only once while sweeping');
  assert.equal(result?.y, 575, 'charged effect finishes at current caster source position');
}
{
  const { g, enemies: [e] } = arena([[680, 500]]);
  assert(g.cast(1, e.id, true));
  const fixedAim = { ...g._heroSkillEffects[0].aim };
  g.hero.x = 530;
  advance(g, 0.1);
  const f = g._heroSkillEffects?.[0];
  assert.equal(f.from.x, 530, 'charged beam base tracks the moving Mage');
  assert.deepEqual(f.aim, fixedAim, 'world-space aim endpoint stays fixed despite hero movement');
  assert(Math.abs(f.endY - 500) < 1e-6, 'the head stays on its original direction');
  assert(f.endX > f.from.x, 'the fixed world-space head keeps advancing');
}
{
  const art = require('../src/prototype/hero-presentation.js');
  const calls = [];
  const ctx = new Proxy({}, {
    get(o, k) {
      if (!(k in o)) o[k] = (...args) => { calls.push([k, ...args]); };
      return o[k];
    },
  });
  const p = {
    source: 'hero', style: 'beam', slot: 1, charged: false,
    originX: 500, originY: 500, x: 610, y: 500,
    dx: 1, dy: 0, beamWidthScale: 2, mageSkill1Homing: true,
    trailPoints: [{x:500, y:500}, {x:550, y:500}],
  };
  assert(art.projectile(ctx, point => point, p, 'mage', false, {x:530, y:575, hp:100}));
  const start = calls.find(c => c[0] === 'moveTo');
  assert.deepEqual(start, ['moveTo', 530, 575], 'ordinary luminous tail starts at Mage live position');
  assert.equal(p.originX, 500, 'presenting the tail never relocates gameplay head or cast origin');
}
// Chosen Alt B appearance is entirely procedural and runs on the Canvas
// 2D combat overlay in both the default Canvas and Pixi WebGL2 renderers.
{
  const art = require('../src/prototype/hero-presentation.js');
  function capture(draw) {
    const calls = [];
    const ctx = new Proxy({}, {
      get(target, key) {
        if (!(key in target)) target[key] = (...args) => calls.push([key, ...args]);
        return target[key];
      },
    });
    draw(ctx);
    return {
      calls,
      count: (method) => calls.filter((item) => item[0] === method).length,
    };
  }
  const screen = (point) => ({x: point.x, y: point.y});
  const charged = {
    stage: 'skill1-wide-beam', x: 500, y: 500,
    endX: 840, endY: 500, halfWidth: 48,
    simulatedFront: true, max: 0.705, life: 0.35,
  };
  const wide = capture(ctx => art.draw(ctx, screen, charged,
    {reduced: false, optimized: false}));
  assert(wide.count('lineTo') >= 35, 'charged Arcane Lance includes two procedural helix strands and runes');
  assert(wide.count('arc') >= 2, 'charged Arcane Lance has bounded source sigil rings');
  assert(wide.count('fill') >= 1, 'wide gameplay footprint remains visible but translucent');
  assert(wide.count('lineTo') < 110, 'charged effect geometry is bounded each draw');
  const wideReduced = capture(ctx => art.draw(ctx, screen, charged,
    {reduced: true, optimized: true}));
  assert(wideReduced.count('lineTo') < wide.count('lineTo'),
    'reduced motion and optimization omit animated helix and extra runes');
  const p = {
    source: 'hero', style: 'beam', slot: 1, charged: false,
    originX: 500, originY: 500, x: 765, y: 540, dx: 1, dy: 0,
    beamWidthScale: 2, mageSkill1Homing: true, traveled: 280,
    trailPoints: [{x:500,y:500},{x:570,y:500},{x:660,y:520}],
  };
  const snapshot = JSON.stringify(p);
  const regular = capture(ctx => art.projectile(ctx, screen, p, 'mage', false,
    {x: 530, y: 565, hp: 100}));
  assert(regular.count('lineTo') >= 35,
    'normal Arcane Lance also shows procedural helix and diamonds');
  assert(regular.count('arc') >= 1, 'normal Arcane Lance sigil attaches to Mage');
  assert.equal(JSON.stringify(p), snapshot,
    'rendering Alt B does not change physical projectile path or gameplay state');
  const regularReduced = capture(ctx => art.projectile(ctx, screen, p, 'mage', true,
    {x: 530, y: 565, hp: 100}));
  assert(regularReduced.count('lineTo') < regular.count('lineTo'),
    'normal beam reduced-motion setting omits spiral animation');
}
{
  const { g, enemies: [e] } = arena([[620, 500]]);
  assert(g.cast(1, e.id, true));
  g.enter('march');
  // Crossing regions can legitimately normalize the old zone's enemy HP.
  // Compare only AFTER transition, so this checks for late beam damage.
  const before = e.hp;
  const hitsBefore = g.effects.filter(effect => effect.type === 'hit').length;
  advance(g, 1);
  assert.equal(e.hp, before, 'no delayed charged-beam damage after zone transition');
  assert.equal(g.effects.filter(effect => effect.type === 'hit').length, hitsBefore,
    'no charged-beam hit receipt survives the transition');
  assert.equal(g._heroSkillEffects?.length || 0, 0);
}
// Frame-size equivalence: the faster 0.625-second cast must not change its
// contact count or target ownership at manual 20/30/60 FPS simulation steps.
for (const fps of [20, 30, 60]) {
  const { g, enemies: [first, second] } = arena([[620, 500], [840, 500]]);
  assert(g.cast(1, first.id, true));
  const hp1 = first.hp, hp2 = second.hp;
  advance(g, 0.1, 1 / fps);
  assert.equal(first.hp, hp1, fps + ' FPS must not damage a near target prematurely');
  advance(g, 0.55, 1 / fps);
  assert(first.hp < hp1, fps + ' FPS must contact near target');
  assert(second.hp < hp2, fps + ' FPS must contact far target');
  assert.equal(g._heroSkillEffects.length, 0, fps + ' FPS must finish one beam by 0.65s');
  assert.equal(g.effects.filter(e => e.type === 'heroSkillArea' && e.phase === 'complete').at(-1)?.hits,
    2, fps + ' FPS must resolve each enemy once');
}
// Other heroes keep independent launched projectiles and authored ground
// effects. They must not inherit Mage Skill 1 homing or caster tethering.
for (const cls of ['paladin', 'ranger']) {
  const { g, enemies: [target] } = arena([[620, 500]], cls);
  assert(g.cast(1, target.id, false), cls + ' normal Skill 1');
  const shots = g.s.projectiles.filter(p => p.source === 'hero');
  assert.equal(shots.length, cls === 'ranger' ? 3 : 1);
  for (const shot of shots) {
    assert(!shot.mageSkill1Homing && !shot.beamWidthScale,
      cls + ' normal projectile remains independent');
    const direction = {dx: shot.dx, dy: shot.dy};
    g.hero.y += 12;
    g.updateProjectiles(0.02);
    assert.equal(shot.dx, direction.dx, 'caster movement must not turn launched ' + cls + ' projectile');
    assert.equal(shot.dy, direction.dy);
  }
}
{
  const { g, enemies: [target] } = arena([[620, 500]], 'paladin');
  assert(g.cast(1, target.id, true));
  const cross = g._heroSkillEffects.find(effect => effect.kind === 'cross');
  assert(cross, 'Paladin charged cross retains authored world-space geometry');
  const castX = cross.from.x, castY = cross.from.y;
  g.hero.x += 120;
  advance(g, 0.5);
  assert.equal(cross.from.x, castX);
  assert.equal(cross.from.y, castY);
}
{
  const { g, enemies: [target] } = arena([[780, 500]], 'ranger');
  assert(g.cast(1, target.id, true));
  const hawk = g._heroSkillEffects.find(effect => effect.kind === 'hawk');
  assert(hawk, 'Ranger charged hawk is an independent pursuit entity');
  const hx = hawk.x, hy = hawk.y;
  g.hero.y += 100;
  advance(g, 0.05);
  assert(Math.hypot(hawk.x - hx, hawk.y - hy) < 150,
    'the released hawk flies independently rather than teleporting with Ranger');
}
{
  const { g, enemies: [target] } = arena([[620, 500]]);
  g.hero.skills[5] = 1;
  assert(g.cast(6, target.id, true), 'Mage charged Focused Beam');
  const shot = g.s.projectiles.find(p => p.source === 'hero' && p.slot === 6);
  assert(shot && shot.style === 'beam', 'Mage Skill 6 remains the authored projectile');
  assert(!shot.mageSkill1Homing && !shot.beamWidthScale,
    'Mage Skill 6 must not inherit Skill 1 travel/homing/thickness changes');
  const from = {x: shot.originX, y: shot.originY, dx: shot.dx, dy: shot.dy};
  g.hero.y += 100;
  g.updateProjectiles(0.02);
  assert.equal(shot.originX, from.x);
  assert.equal(shot.originY, from.y);
  assert.equal(shot.dx, from.dx);
  assert.equal(shot.dy, from.dy);
}

console.log('PASS Mage Skill 1 travel, delayed contact, caster-angled charged corridor, homing normal cast and 2.5x visual width');
