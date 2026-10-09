'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('../src/prototype/engine');

// Test the retained mana implementation without mutating frozen production rules.
const legacy = { console };
for (const file of require('../scripts/site-assets.cjs').scripts) {
  if (!file.startsWith('src/prototype/')) continue;
  let source = fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8');
  if (file.endsWith('/rules.js'))
    source = source.replace('manaEnabled: false', 'manaEnabled: true');
  vm.runInNewContext(source, legacy, { filename: file });
  if (file.endsWith('/engine.js')) break;
}
const L = legacy.Campaign;
assert(L.rules.resourceMode.manaEnabled);
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new L('normal', cls, () => 0.9);
  assert(g.skillManaCost(2) > 0);
  assert(g.skillManaCost(1, 1, true) > 0);
  g.hero.talents[1] = 5;
  assert.equal(g.skillCooldown(1, true), 0.85);
  g.hero.mp = 0;
  g.zone().enemies = [];
  g.s.party = [];
  g.tick(0.1);
  assert(g.hero.mp > 0);
  g.hero.mp = g.hero.maxMp;
  assert(g.drainMana(g.hero, 0.12) > 0);
}

const g = new C('normal', 'mage', () => 0.9);
g.enter('march');
g.s.clock = 500;
g.updateNight();
const w = g.zone().enemies.find((e) => e.nightOnly && e.species === 'wraith');
assert(w);
g.zone().props = [];
g.zone().enemies = [w];
g.s.party = [];
Object.assign(g.hero, { x: w.x + 40, y: w.y, hp: 10000, maxHp: 10000, immune: 0 });
w.hp = w.maxHp / 2;
assert(g.startNightSkill(w, g.hero));
const before = { hero: g.hero.hp, wraith: w.hp };
g.resolveAttack(w);
assert(
  Math.abs(w.hp - before.wraith - (before.hero - g.hero.hp) * 0.15) < 1e-8,
  'Night Wraith siphons once, without its historical flat heal',
);

g.enter('crypt');
g.zone().props = [];
const boss = g.zone().enemies.find((e) => e.type === 'boss');
g.zone().enemies = [boss];
boss.hp = boss.maxHp / 2;
Object.assign(g.hero, { x: boss.x + 30, y: boss.y, hp: 10000, maxHp: 10000, immune: 0 });
g.resolveArea(boss, {
  kind: 'circle',
  count: 1,
  x: g.hero.x,
  y: g.hero.y,
  radius: 150,
  coefficient: 1,
  manaDrain: 0.05,
  persistent: true,
});
assert.equal(g.s.hazards.length, 1);
for (let pulse = 0; pulse < 3; pulse++) {
  const h = g.hero.hp,
    b = boss.hp;
  g.s.hazards[0].tick = 0;
  g.updateProjectiles(0.1);
  assert(
    Math.abs(boss.hp - b - (h - g.hero.hp) * 0.15) < 1e-8,
    'each periodic pulse heals only from its actual damage',
  );
}
g.hero.immune = 2;
const b = boss.hp;
g.s.hazards[0].tick = 0;
g.updateProjectiles(0.1);
assert.equal(boss.hp, b);
g.hero.immune = 0;
const victim = g.unit('soldier', g.hero.x, g.hero.y);
victim.hp = 1;
g.s.party = [victim];
boss.hp = boss.maxHp / 2;
const hp = boss.hp;
g.hitParty(victim, 10000, 0.05, boss.id);
assert(Math.abs(boss.hp - hp - 0.15) < 1e-8, 'overkill siphons only the final one HP');
console.log(
  'PASS historical MP restoration, Wraith single siphon, periodic hazards, immunity and overkill',
);

for (const family of ['abyss', 'citadel']) {
  const g = new C();
  g.enter(family);
  const boss = g.zone().enemies.find((e) => e.type === 'boss');
  boss.hp = boss.maxHp / 2;
  assert(g.startBossRecovery(boss));
  assert(!g.effects.at(-1).presentationHandled, 'recovery retains the green warning path');
  assert(!g.effects.some((e) => e.type === 'enemyVfx'), 'recovery is not a damaging circle');
  g.resolveAttack(boss);
  assert(g.effects.some((e) => e.type === 'heal' && e.target === boss.id));
}
console.log('PASS independent healing warnings retain non-damaging green presentation');
