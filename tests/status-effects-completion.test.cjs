'use strict';
// Product regression: live Rogue skill producers to pixels, actual Slow debt,
// bounded stack display, expiry and special-action gates. No mock UI flags.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Art = require('../src/prototype/hero-presentation.js');
const R = Campaign.rules;
if (!Campaign.classes.rogue) {
  Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon:'🔔' };
  Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
}
function near(value, expected, label) {
  assert(Math.abs(value - expected) < 1e-8, label + ': ' + value + ' vs ' + expected);
}
function fresh() {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x:500, y:500, order:null });
  g.zone().props = [];
  g.zone().buildings = [];
  g.s.party = [];
  const enemy = g.makeEnemy({
    species:'goblin', name:'Status test target', level:1,
    hp:10000, damage:0, xp:0, gold:0,
  }, { x:590, y:500 });
  enemy.aggro = true;
  enemy.returning = false;
  g.zone().enemies = [enemy];
  return { g, enemy };
}
function paint(g) {
  const canvas = createCanvas(800, 680), ctx = canvas.getContext('2d');
  const labels = [];
  const old = ctx.fillText;
  ctx.fillText = function (message, ...args) {
    labels.push(String(message));
    return old.call(this, message, ...args);
  };
  const saved = JSON.stringify(g.snapshot());
  Art.statuses(ctx, u => ({x:u.x, y:u.y}), g, 800, 680);
  assert.equal(JSON.stringify(g.snapshot()), saved, 'painter may not alter saves');
  return { labels, pixels:Buffer.from(ctx.getImageData(0,0,800,680).data) };
}
{
  const {g,enemy} = fresh();
  g.hero.skills[2] = 1;
  const before = paint(g);
  assert.equal(g.cast(3, enemy.id, true), true, 'lawful actual charged Hush release');
  assert(g.rogueEnemySilenced(enemy), 'real Hush producer active');
  assert(!paint(g).pixels.equals(before.pixels), 'Hush must paint Silence in world');
  g.s.time += 20;
  assert(!g.rogueEnemySilenced(enemy), 'Hush must expire');
  assert(paint(g).pixels.equals(before.pixels), 'expired Hush removes world cue');
}
{
  const {g,enemy} = fresh();
  g.hero.skills[3] = 1;
  const before = paint(g);
  assert.equal(g.cast(4, enemy.id), true, 'lawful actual Wither release');
  assert(g.rogueEnemyWithered(enemy), 'actual timed Wither producer active');
  assert(!paint(g).pixels.equals(before.pixels), 'active Wither must paint in world');
  g.s.time += 20;
  assert(!g.rogueEnemyWithered(enemy), 'Wither expires');
  assert(paint(g).pixels.equals(before.pixels), 'expired Wither icon disappears');
}
{
  const {g,enemy} = fresh();
  enemy.hybrid = true;
  enemy.hp = enemy.maxHp * 0.25;
  enemy.hybridSelfHealCd = 0;
  g.applyRogueEnemySilence(enemy, 3);
  assert(!g.enemyHybridSelfHeal(enemy), 'Hush blocks new hybrid self-heal');
  assert.equal(enemy.hybridSelfHealCd, 0, 'no cooldown consumed while silenced');
  g.s.time += 4;
  assert(g.enemyHybridSelfHeal(enemy), 'healing starts after Hush expires');
}
{
  const {g} = fresh();
  const ally = g.unit('archer', 510, 500);
  g.s.party = [ally];
  ally.charmSupportCd = 10;
  const before = paint(g);
  assert(g.applySlow(ally, 2));
  const debt = 2.25 * R.cooldownBalance.slowDebtFraction;
  near(ally.charmSupportCd, 10 + debt, 'Charmed support Slow hit-time debt');
  assert(!paint(g).pixels.equals(before.pixels), 'ally world Slow must draw');
  assert(g.applySlow(ally, 2));
  near(ally.charmSupportCd, 10 + 2 * debt, 'two active Slow hit debts');
  assert(paint(g).labels.includes('×2'), 'stack count visible');
  ally.slow = 0; delete ally.slowStacks;
  assert(paint(g).pixels.equals(before.pixels), 'world Slow expires');
  ally.charmSupportCd = 0;
  assert(g.applySlow(ally, 2));
  assert.equal(ally.charmSupportCd, 0, 'ready allied support unaffected');
}
{
  const {g,enemy} = fresh();
  enemy.hybridSelfHealCd = 10;
  assert(g.applySlow(enemy, 2));
  near(enemy.hybridSelfHealCd, 10 + 2.25 * R.cooldownBalance.enemySlowDebtFraction,
    'hybrid self-heal Slow hit-time debt');
  enemy.hybridSelfHealCd = 0;
  assert(g.applySlow(enemy, 2));
  assert.equal(enemy.hybridSelfHealCd, 0, 'ready hybrid self-heal stays ready');
}
console.log('PASS live status effects: Rogue Hush/Wither pixels and expiry, Slow debt/stack/ally visibility');
