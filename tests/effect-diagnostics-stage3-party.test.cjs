'use strict';
// Stage 3 companion and pet producer validation; CI fixture, never client code.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Art = require('../src/prototype/enemy-vfx-art.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const Fx = require('../src/prototype/combat-visuals.js');
const Renderer = require('../src/prototype/renderer.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const project = ({ x, y }) => ({ x: 300 + (x - 500) * 0.7 - (y - 500) * 0.28,
  y: 250 + (x - 500) * 0.17 + (y - 500) * 0.3 });
function pixels(canvas) {
  const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let visible = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]) visible++;
  return visible;
}
function scene(type, family = null) {
  const g = new Campaign('developer', 'paladin', () => 0.9);
  // Complete the real tutorial gate, which blocks uninitiated companion hits.
  completeFieldOpening(g);
  const z = g.zone();
  z.props = []; z.buildings = []; z.nodes = []; z.npcs = []; z.enemies = [];
  Object.assign(g.hero, { x: 500, y: 500, gold: 10000, hp: 1000, maxHp: 1000 });
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  g.s.rescued.thorn = true;
  assert(g.learn(2, 'thorn'), 'real companion second-skill training');
  if (family) g.s.true[family] = g.s.normal[family] = true;
  const u = g.unit(type, 500, 500, family);
  g.s.party = [u];
  const e = g.makeEnemy({
    species: 'goblin', name: 'Stage 3 allied target', level: 1,
    hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 550, y: 500 });
  z.enemies = [e];
  // Controlled unobstructed line of sight; skill eligibility and damage are real.
  g.line = () => true;
  g.engage(e);
  g.effects = [];
  return { g, u, e };
}
let producedPetForms = 0, paintedPetForms = 0, petInkPixels = 0;
const petKeys = [];
for (const boss of Campaign.data.bosses) {
  const { g, u, e } = scene('pet', boss.id);
  assert(g.petSkillTargets(u, e, 1).length, boss.id + ' eligible real first target');
  assert(g.companionUseFirstSkill(u, e), boss.id + ' first actual cast');
  const first = g.effects.splice(0);
  u.skillGlobalCd = 0;
  assert(g.companionUseSecondSkill(u, e), boss.id + ' second actual charge');
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  const second = g.effects.splice(0);
  const all = [...first, ...second];
  const rec = Renderer.createEffectDiagnostics();
  rec.receipts(all);
  const cues = Fx.queue(all, g, [], rec).filter((f) => f.type === 'petSkill');
  for (const slot of [1, 2]) {
    const receipt = all.find((f) => f.type === 'petSkill' && f.slot === slot);
    assert(receipt, boss.id + ' slot ' + slot + ' real petSkill event missing');
    const cue = cues.find((f) => f.slot === slot);
    assert(cue, boss.id + ' slot ' + slot + ' real queued effect missing');
    const canvas = createCanvas(650, 500);
    const success = Art.petSkill(canvas.getContext('2d'), project, cue);
    assert(success, boss.id + ' painter did not recognize real pet effect');
    const painted = pixels(canvas);
    assert(painted > 0, boss.id + ' slot ' + slot + ' failed alpha painting');
    rec.painted(cue);
    producedPetForms++;
    paintedPetForms++;
    petInkPixels += painted;
    petKeys.push('pet/' + boss.id + '/' + slot + ':' + cue.stage);
  }
  const report = rec.report(true);
  assert(report.identities.some((row) => row.id === 'pet/' + boss.id + '/1:release' && row.painted > 0));
  assert(report.identities.some((row) => row.id === 'pet/' + boss.id + '/2:release' && row.painted > 0));
}
assert.equal(producedPetForms, 22);
assert.equal(new Set(petKeys).size, 22);
console.log('STAGE3 PETS real first/charged skill receipts=22 alpha-positive painters=' +
  paintedPetForms + ' aggregate alpha pixels=' + petInkPixels);

let companionActions = 0, companionProjectileCount = 0, companionAreaCues = 0;
for (const type of ['soldier', 'archer']) {
  const { g, u, e } = scene(type);
  assert(g.companionUseFirstSkill(u, e), type + ' first actual cast');
  const first = g.effects.splice(0);
  const firstRec = Renderer.createEffectDiagnostics();
  firstRec.receipts(first);
  const fx1 = Fx.queue(first, g, [], firstRec);
  assert(first.some((f) => f.type === 'companionSkill'), type + ' first receipt');
  if (type === 'soldier') {
    assert(fx1.some((f) => f.type === 'swing'), 'Power Strike has real sword feedback');
  } else {
    assert(g.s.projectiles.filter((p) => p.companionSkill === 'triple-shot').length === 3,
      'Triple Shot must generate three actual moving arrow projectiles');
    companionProjectileCount += 3;
  }
  companionActions++;
  u.skillGlobalCd = 0;
  assert(g.companionUseSecondSkill(u, e), type + ' charged second cast');
  const chargeEvents = g.effects.splice(0);
  assert(chargeEvents.some((f) => f.type === 'companionChargeStart'), type + ' charged windup');
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  const second = g.effects.splice(0);
  const receipt = second.find((f) => f.type === 'companionSkill');
  assert(receipt, type + ' completed second skill receipt');
  const rec = Renderer.createEffectDiagnostics();
  rec.receipts(second);
  const cues = Fx.queue(second, g, [], rec);
  assert(cues.some((f) => f.type === 'chargedArea'), type + ' actual charged area');
  companionAreaCues++;
  companionActions++;
}
assert.equal(companionActions, 4);
console.log('STAGE3 COMPANIONS real Soldier/Archer skills=' + companionActions +
  ' Triple Shot physical arrows=' + companionProjectileCount +
  ' real charged areas=' + companionAreaCues);

// Projectile movement is tested at the actual combat update frequency, not by
// drawing a static arrow after applying damage. These are deterministic steps.
const flights = [];
for (const hz of [20, 30, 60]) {
  const { g, u, e } = scene('archer');
  assert(g.companionUseFirstSkill(u, e));
  const initial = g.s.projectiles.filter((p) => p.companionSkill === 'triple-shot')
    .map((p) => ({ id: p.id, x: p.x, y: p.y, delay: p.delay }));
  assert.equal(initial.length, 3);
  let moved = false, pendingLaunches = 0;
  for (let i = 0; i < Math.ceil(hz / 3); i++) {
    g.s.time += 1 / hz;
    g.updateProjectiles(1 / hz);
    pendingLaunches += g.effects.filter((f) => f.type === 'projectileImpact').length;
    const active = g.s.projectiles.filter((p) => p.companionSkill === 'triple-shot');
    for (const p of active) {
      const origin = initial.find((q) => q.id === p.id);
      if (Math.hypot(p.x - origin.x, p.y - origin.y) > 1) moved = true;
    }
  }
  assert(moved, hz + ' simulation steps have no real projectile movement');
  flights.push({ hz, spawned: initial.length, moved, remaining: g.s.projectiles.length });
}
console.log('STAGE3 ARCHER real projectile movement across simulation rates=' + JSON.stringify(flights));

// 24 status-bearing actors: a twenty-fifth is intentionally not painted.
{
  const { g } = scene('soldier');
  g.s.time = 5;
  const enemies = Array.from({ length: 25 }, (_, i) => ({
    id: 'status-' + i, hp: 100, returning: false,
    x: 500 + (i % 5) * 35, y: 500 + Math.floor(i / 5) * 35,
    weakenUntil: 10,
  }));
  const paint = () => {
    const c = createCanvas(650, 500);
    HeroArt.statuses(c.getContext('2d'), project, g, 650, 500);
    return Buffer.from(c.getContext('2d').getImageData(0, 0, 650, 500).data);
  };
  g.zone().enemies = enemies.slice(0, 24);
  const twentyFour = paint();
  g.zone().enemies = enemies;
  const twentyFive = paint();
  assert(twentyFour.equals(twentyFive),
    '25th status icon unexpectedly paints beyond source-defined 24-enemy limit');
  console.log('STAGE3 STATUS 24/25 eligible enemies: same image=true (25th intentionally hidden)');
}
console.log('PASS Stage 3 natural pets, companions, arrow flight and status culling');
