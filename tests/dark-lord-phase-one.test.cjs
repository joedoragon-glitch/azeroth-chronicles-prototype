'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const boss = C.data.bosses.find((b) => b.id === 'darklord');
const d = boss;
const expected = [
  "Veteran's Repertoire",
  "Pathfinder's Gambit",
  'Royal Muster',
  'Freedom Has a Price',
  'No More Heroes',
  'Royal Taxation',
];
assert.deepEqual(boss.attacks.map((line) => line.split(':')[0]), expected);
assert.equal(C.rules.attacks.darklord.length, 6);
assert.equal(C.rules.tacticalFoundation.rogueMoves.bosses.darklord.name, 'Writ of Restraint');

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(C.classes)) {
    const c = new C(mode, heroClass, () => 0.9);
    c.enter('crown');
    const e = c.bossEnemy(boss, 'normal', { x: 1100, y: 1100 });
    Object.assign(c.hero, { x: 1170, y: 1100 });
    assert.equal(c.bossAttackWeights(e)[3], 0);
    assert.equal(c.bossAttackWeights(e)[4], 0);
    const sword = c.buildBossAttack(e, 0, c.hero);
    assert.equal(sword.sequence.length, 2);
    assert.equal(sword.sequence[1].coefficient, 1.3);
    const route = c.buildBossAttack(e, 1, c.hero);
    assert.equal(route.first.landing, true);
    assert.equal(route.sequence.length, 2);
    e.hp = e.maxHp * 0.25;
    assert(c.bossAttackWeights(e)[4] > 0);
    const duel = c.buildBossAttack(e, 4, c.hero);
    assert.equal(duel.first.kind, 'line');
    assert.equal(duel.first.coefficient, 1.5);
    assert.equal(C.restore(c.snapshot()).s.version, 4);
    const taxation = c.buildBossAttack(e, 5, c.hero);
    assert.equal(taxation.first.royalTaxation, true);
  }
}
// Second Wind is available exactly once per boss incarnation.
for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.9);
  c.enter('crown');
  const boss = c.bossEnemy(d, 'normal', { x: 1100, y: 1100 });
  c.zone().enemies = [boss];
  boss.hp = boss.maxHp * 0.3;
  c.hero.x = 1200;
  c.hero.y = 1100;
  assert(c.startBossRecovery(boss));
  assert.equal(boss.telegraph.name, 'Second Wind');
  assert.equal(boss.secondWindUsed, true);
  assert(!c.startBossRecovery(boss), 'Cannot repeat a once-only stance');
  const before = boss.hp;
  c.resolveAttack(boss);
  assert.equal(boss.hp, before + boss.maxHp * 0.05);
  boss.telegraph = null;
  assert(!c.startBossRecovery(boss));
  const restored = C.restore(c.snapshot(), () => 0.9);
  assert.equal(restored.s.version, 4);
}

{
  const c = new C('normal', 'ranger', () => 0.9);
  c.enter('crown');
  const boss = c.bossEnemy(d, 'normal', { x: 1100, y: 1100 });
  c.zone().enemies = [boss];
  boss.hp = boss.maxHp * 0.3;
  c.hero.x = 1200;
  c.hero.y = 1100;
  assert(c.startBossRecovery(boss));
  const face = boss.secondWindFacing;
  const hp = boss.hp;
  c.hero.x = 1000;
  c.hero.y = 1100;
  c.line = () => true;
  c.tacticalRogueLeashAllows = () => true;
  assert(c.damage(boss, 100, 'hero'), 'Rear hit lands through stance defense');
  assert.equal(face, 0);
  assert.equal(boss.secondWindCancelled, true);
  assert(boss.hp < hp);
  const before = boss.hp;
  c.resolveAttack(boss);
  assert.equal(boss.hp, before, 'Rear counter cancels only the healing');
}
console.log('PASS Dark Lord phase-one attacks, Second Wind and unchanged save schema');

for (const mode of ['normal', 'nightmare']) {
  const c = new C(mode, 'paladin', () => 0.9);
  c.enter('crown');
  const lord = c.bossEnemy(boss, 'normal', { x: 1100, y: 1100 });
  lord.hp = lord.maxHp * 0.6;
  c.zone().enemies = [lord];
  Object.assign(c.hero, { x: 1120, y: 1100 });
  c.line = () => true;
  c.tacticalRogueLeashAllows = () => true;

  const crownsBefore = c.hero.gold;
  const territory = c.buildBossAttack(lord, 3, c.hero);
  assert(territory.first.royalTerritory);
  assert(territory.sequence.every((beat) => beat.royalTerritory));
  const tax = c.buildBossAttack(lord, 5, c.hero).first;
  lord.telegraph = tax;
  c.resolveAttack(lord);
  assert(lord.royalTaxation.marked.includes('hero'));
  assert(!lord.royalTaxShield);
  c.damage(lord, 20, 'hero');
  assert(!lord.royalTaxShield, 'Single marked attacker cannot finance a shield');
  lord.royalTaxation = {
    marked: ['hero', 'test-companion'],
    expires: c.s.time + 5,
    sources: ['hero'],
  };
  c.damage(lord, 20, 'test-companion');
  assert.equal(lord.royalTaxShield, lord.maxHp * 0.03);
  const shield = lord.royalTaxShield;
  c.damage(lord, 15, 'hero');
  assert(lord.royalTaxShield < shield, 'Shield absorbs real subsequent damage');
  assert.equal(c.hero.gold, crownsBefore, 'Tax never touches real crowns');

  c.clearSegment = () => true;
  const guard = c.makeEnemy(
    { species: 'crownguard', name: 'Royal escort', level: 16, hp: 100, damage: 4, gold: 0, xp: 0 },
    { x: 980, y: 1100 },
  );
  guard.owner = lord.id;
  guard.summon = true;
  c.zone().enemies.push(guard);
  lord.royalTaxShield = 0;
  c.s.projectiles.push({
    id: 'test-royal-arrow', source: 'hero', target: lord.id, speed: 1200,
    x: 800, y: 1100, damage: 40, life: 2, style: 'arrow',
  });
  const previousLordHp = lord.hp;
  c.updateProjectiles(0.25);
  assert(guard.hp < guard.maxHp, 'Guard takes an actual post-scaling wound');
  assert(
    c.effects.some(
      (effect) => effect.type === 'projectileImpact' && effect.target === guard.id,
    ),
    'Projectile impact is attributed to the guard, not silently deleted',
  );
  assert(
    c.effects.some(
      (effect) => effect.type === 'hit' && effect.x === guard.x && effect.amount > 0,
    ),
    'Interception applies actual combat damage',
  );
  assert.equal(lord.hp, previousLordHp, 'Intercepted hit does not damage the ruler');
  assert.equal(lord.royalPrerogativeReadyAt, c.s.time + 18);
}
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('crown');
  const ruler = c.bossEnemy(boss, 'normal', { x: 1100, y: 1100 });
  c.zone().enemies = [ruler];
  ruler.telegraph = c.buildBossAttack(ruler, 2, c.hero).first;
  c.resolveAttack(ruler);
  const guards = c.bossOwnedSummons(ruler);
  assert(guards.length > 0 && guards.length <= 3);
  assert(guards.every((guard) => guard.royalFormationUntil === c.s.time + 3));
}
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('crown');
  const lord = c.bossEnemy(boss, 'normal', { x: 1100, y: 1100 });
  lord.telegraph = {
    rogueMove: true, rogueSignature: true, effect: 'bind',
    x: lord.x, y: lord.y, radius: 175,
  };
  c.tacticalResolveRogueMove = () => true;
  c.resolveAttack(lord);
  assert.equal(lord.crownDecreeZone.radius, 175);
  assert.equal(lord.crownDecreeZone.expires, c.s.time + 3);
}
console.log('PASS Dark Lord royal taxation, formations, decree, sector warnings and interception');
