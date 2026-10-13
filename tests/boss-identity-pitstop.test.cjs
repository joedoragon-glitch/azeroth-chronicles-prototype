'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const D = Campaign.data,
  R = Campaign.rules;
const boss = (id) => D.bosses.find((b) => b.id === id);
const rules = (id) => R.attacks[id];

assert.equal(boss('crypt').name, 'Lifebinder');
assert.equal(boss('crypt').id, 'crypt', 'existing save key must remain stable');
assert.equal(boss('crypt').hp, 650, 'first boss base HP unchanged');
assert.equal(boss('crypt').damage, 16, 'first boss damage unchanged');
assert.equal(rules('crypt')[2].attendant, true);
assert.equal(rules('crypt')[2].kind, 'summon');
assert.equal(rules('crypt')[3].count, 4);
assert.equal(rules('warlord')[1].count, 6);
assert.equal(R.bossSummoning.overrides.crypt.normalCap, 12);
assert.equal(R.bossSummoning.overrides.crypt.trueCap, 6);
assert.equal(boss('mire').hp, 1100);
assert.equal(boss('warlord').hp, 4300);

const game = new Campaign('normal', 'ranger', () => 0.87);
game.enter('crypt');
const e = game.bossEnemy(boss('crypt'), 'normal', { x: 1050, y: 1100 });
game.zone().enemies = [e];
const plan = game.trueSummonPlan(e);
assert.equal(plan.attendant, true);
let added = game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(added, 3, 'first Call the Attendants produces exactly three');
added = game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(added, 3, 'second call adds another three instead of replacing the first shift');
const attendants = game.bossOwnedSummons(e);
assert.equal(attendants.length, 6);
assert(
  attendants.every(
    (u) => u.estateAttendant && u.name === 'Estate attendant' && u.visualScale === 0.78,
  ),
);
for (let i = 0; i < 4; i++) game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(game.bossOwnedSummons(e).length, 12, 'population stops at safety ceiling');
assert.equal(game.summonBossAdds(e, plan, game.bossSummonCap(e)), 0);

const trueBoss = game.bossEnemy(boss('crypt'), 'true', { x: 1050, y: 1100 });
assert.equal(trueBoss.name, 'Lifebinder TRUE');
assert.equal(
  game.bossSummonCap(trueBoss),
  6,
  'TRUE initial entourage retains established six-person composition',
);

assert.equal(R.dungeonArchitecture.crypt.version, 4);
for (const kind of ['estate-hearth', 'estate-rug', 'estate-lounge'])
  assert(
    R.dungeonDecor.crypt.some(([, , name]) => name === kind),
    kind + ' is included in the estate',
  );
assert.equal(rules('archive')[4].sabotage, true);
assert.equal(rules('archive')[4].warning, 1.5);
assert.equal(rules('ridge')[1].cargo, true);
assert.equal(rules('ridge')[1].kind, 'line');
assert.equal(rules('mire')[0].kind, 'cone');
assert.equal(rules('mire')[2].persistent, true);
assert.equal(
  game.attackPatches({ ...rules('crypt')[3], index: 3, name: 'Groundwork', x: 800, y: 1000 })
    .length,
  4,
);
assert.equal(game.attackPatches({ ...rules('warlord')[1], index: 1, x: 800, y: 1000 }).length, 6);

const ash = new Campaign('normal', 'ranger', () => 0.87);
ash.enter('frontier');
const wa = ash.bossEnemy(boss('warlord'), 'normal', { x: ash.hero.x + 40, y: ash.hero.y });
ash.zone().enemies = [wa];
ash.engage(wa);
assert.equal(wa.ashCloud.expires - ash.s.time, 6);
assert.equal(wa.ashNextAt - ash.s.time, 18);
assert.equal(ash.ashMovementFactor(ash.hero), 0.7);
assert.equal(boss('warlord').damage, 48);
assert.equal(ash.bossEnemy(boss('warlord'), 'true', { x: 500, y: 500 }).baseDamage, 60);

const ridge = new Campaign('normal', 'ranger', () => 0.87);
ridge.enter('highlands');
const ty = ridge.bossEnemy(boss('ridge'), 'normal', { x: ridge.hero.x + 45, y: ridge.hero.y });
ridge.zone().enemies = [ty];
ridge.engage(ty);
assert.equal(ty.ledgerOpen, true);
assert.equal(ty.ledgerNextAt - ridge.s.time, 12);
assert.equal(boss('ridge').hp, 2400);
assert.equal(boss('ridge').damage, 36);

const mire = new Campaign('normal', 'ranger', () => 0.87);
const u = mire.hero;
u.mireBogExposure = 4;
u.mireBogLastAt = mire.s.time;
assert.equal(mire.mireBogMovementFactor(u), 0.35);
mire.s.time += 2.1;
assert.equal(mire.mireBogMovementFactor(u), 1);
assert.equal(boss('mire').damage, 24);

const oldCryptVersion = game.zone().dungeonVersion;
game.zone().dungeonVersion = 3;
game.decorateDungeon(game.zone());
assert.equal(game.zone().dungeonVersion, 4, 'historical crypt decor must migrate');
assert.equal(
  game.zone().props.filter((p) => p.decorative && p.structure === 'estate-hearth').length >= 1,
  true,
);
assert.equal(oldCryptVersion, 4);

function arena(id) {
  const c = new Campaign('normal', 'ranger', () => 0.87);
  c.enter(boss(id).kind === 'dungeon' ? id : boss(id).region);
  const e = c.bossEnemy(boss(id), 'normal', { x: 500, y: 500 });
  c.zone().enemies = [e];
  c.hero.x = 555;
  c.hero.y = 500;
  c.hero.immune = 0;
  for (const member of c.s.party) {
    member.x = 555;
    member.y = 500;
    member.immune = 0;
  }
  c.line = () => true;
  c.safe = (x, y) => ({ x, y });
  c.clearSegment = () => true;
  c.hitParty = (unit, damage) => {
    unit.hp = Math.max(1, unit.hp - damage);
    return true;
  };
  return { c, e };
}
{
  const { c, e } = arena('mire');
  const jaw = {
    ...rules('mire')[0],
    kind: 'cone',
    index: 0,
    x: e.x,
    y: e.y,
    fromX: e.x,
    fromY: e.y,
    angle: 0,
    radius: 190,
  };
  const beforeBite = new Map(c.combatTargets().map((u) => [u === c.hero ? 'hero' : u.id, u.hp]));
  c.resolveArea(e, jaw);
  assert(e.deathRoll, 'one victim enters the roll on a landed jaw');
  const victim =
    e.deathRoll.victim === 'hero' ? c.hero : c.s.party.find((u) => u.id === e.deathRoll.victim);
  assert(victim.deathRollHeld);
  assert.equal(
    victim.hp,
    beforeBite.get(victim === c.hero ? 'hero' : victim.id),
    'roll victim does not receive an extra upfront Jaw Snap',
  );
  for (let i = 0; i < 3; i++) c.updateEnemies(0.5);
  assert.equal(e.deathRoll, null);
  assert.equal(victim.deathRollHeld, false);
  assert(victim.slow > 0, 'release imposes a two-second slow');
}
{
  const { c, e } = arena('archive');
  const archer = c.s.party.find((u) => u.type === 'archer');
  assert(archer);
  const anchor = {
    ...rules('archive')[0],
    kind: 'cone',
    index: 0,
    x: e.x,
    y: e.y,
    fromX: e.x,
    fromY: e.y,
    angle: 0,
    radius: 190,
  };
  c.resolveArea(e, anchor);
  assert.equal(e.hookedVictim, archer.id, 'Anchor Swing prioritizes the healer');
  assert.equal(archer.keeperHeld, e.id);
  archer.healCd = 4;
  c.startAttack(e, c.hero, 0);
  assert.equal(archer.keeperHeld, null, 'anchor reuse releases the held healer');
  assert.equal(e.hookedVictim, null);
  e.telegraph = {
    ...rules('archive')[4],
    index: 4,
    x: archer.x,
    y: archer.y,
    fromX: e.x,
    fromY: e.y,
    radius: 155,
    count: 1,
    kind: 'circle',
  };
  c.resolveAttack(e);
  assert.equal(archer.healCd, 7, 'sabotage adds exactly 3 seconds to archer heal');
}
{
  const { c, e } = arena('ridge');
  c.engage(e);
  assert.equal(e.ledgerOpen, true);
  e.telegraph = {
    ...rules('ridge')[1],
    index: 1,
    kind: 'line',
    cargo: true,
    fromX: e.x,
    fromY: e.y,
    x: c.hero.x,
    y: c.hero.y,
  };
  c.resolveAttack(e);
  assert(
    c.s.projectiles.some((p) => p.style === 'cargo'),
    'Rolling Cargo creates a real projectile',
  );
}
console.log('PASS boss pit-stop combat mechanics and estate regression contracts');
