'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena(positions) {
  const g = new Campaign('normal', 'mage', () => 0.9);
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
  const hp1 = first.hp, hp2 = second.hp;
  assert(g.cast(1, first.id, true));
  assert.equal(first.hp, hp1, 'charged Mage Skill 1 never hits on release');
  assert.equal(second.hp, hp2);
  assert.equal(g._heroSkillEffects[0]?.kind, 'wide-beam');
  const initial = g.effects.find(e => e.type === 'heroSkillArea' && e.phase === 'launch');
  assert(initial && Math.abs(initial.travelSeconds - 0.75) < 0.001);
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
  const oldHp = moving.hp;
  assert(g.cast(1, target.id, true));
  moving.y = 660;
  advance(g, 1);
  assert.equal(moving.hp, oldHp, 'charged beam never turns to follow escaping foes');
}
{
  const { g, enemies: [e] } = arena([[780, 500]]);
  const hp = e.hp;
  assert(g.cast(1, e.id, false));
  const p = g.s.projectiles.find(p => p.style === 'beam');
  assert(p?.mageSkill1Homing, 'only ordinary Skill 1 has homing');
  assert.equal(p.beamWidthScale, 2.5, '150% thicker means 2.5x original width');
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
  const missedHp = missed.hp;
  const firstHp = first.hp, extraHp = extra.hp;
  assert(g.cast(1, first.id, true));
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
  g.hero.x = 530;
  advance(g, 0.1);
  const f = g._heroSkillEffects?.[0];
  assert.equal(f.from.x, 530, 'charged beam base tracks the moving Mage');
  assert.equal(f.castFrom.x, 500, 'committed original head trajectory never moves');
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
    dx: 1, dy: 0, beamWidthScale: 2.5, mageSkill1Homing: true,
    trailPoints: [{x:500, y:500}, {x:550, y:500}],
  };
  assert(art.projectile(ctx, point => point, p, 'mage', false, {x:530, y:575, hp:100}));
  const start = calls.find(c => c[0] === 'moveTo');
  assert.deepEqual(start, ['moveTo', 530, 575], 'ordinary luminous tail starts at Mage live position');
  assert.equal(p.originX, 500, 'presenting the tail never relocates gameplay head or cast origin');
}
{
  const { g, enemies: [e] } = arena([[620, 500]]);
  const before = e.hp;
  assert(g.cast(1, e.id, true));
  g.enter('march');
  advance(g, 1);
  assert.equal(e.hp, before, 'zone transitions cancel in-flight charged beam damage');
  assert.equal(g._heroSkillEffects?.length || 0, 0);
}
console.log('PASS Mage Skill 1 travel, delayed contact, fixed charged corridor, homing normal cast and 2.5x visual width');
