'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const D = Campaign.data, R = Campaign.rules;
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
const e = game.bossEnemy(boss('crypt'), 'normal', {x: 1050, y: 1100});
game.zone().enemies = [e];
const plan = game.trueSummonPlan(e);
assert.equal(plan.attendant, true);
let added = game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(added, 3, 'first Call the Attendants produces exactly three');
added = game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(added, 3, 'second call adds another three instead of replacing the first shift');
const attendants = game.bossOwnedSummons(e);
assert.equal(attendants.length, 6);
assert(attendants.every(u => u.estateAttendant && u.name === 'Estate attendant' && u.visualScale === 0.78));
for(let i=0;i<4;i++) game.summonBossAdds(e, plan, game.bossSummonCap(e));
assert.equal(game.bossOwnedSummons(e).length, 12, 'population stops at safety ceiling');
assert.equal(game.summonBossAdds(e, plan, game.bossSummonCap(e)), 0);

const trueBoss = game.bossEnemy(boss('crypt'), 'true', {x: 1050, y: 1100});
assert.equal(trueBoss.name, 'TRUE Lifebinder');
assert.equal(game.bossSummonCap(trueBoss), 6, 'TRUE initial entourage retains established six-person composition');

assert.equal(R.dungeonArchitecture.crypt.version, 4);
for (const kind of ['estate-hearth', 'estate-rug', 'estate-lounge'])
  assert(R.dungeonDecor.crypt.some(([,,name]) => name === kind), kind + ' is included in the estate');
assert.equal(rules('archive')[4].sabotage, true);
assert.equal(rules('archive')[4].warning, 1.5);
assert.equal(rules('ridge')[1].cargo, true);
assert.equal(rules('ridge')[1].kind, 'line');
assert.equal(rules('mire')[0].kind, 'cone');
assert.equal(rules('mire')[2].persistent, true);
assert.equal(game.attackPatches({...rules('crypt')[3],index:3,name:'Groundwork',x:800,y:1000}).length,4);
assert.equal(game.attackPatches({...rules('warlord')[1],index:1,x:800,y:1000}).length,6);

const ash = new Campaign('normal', 'ranger', () => 0.87);
ash.enter('frontier');
const wa = ash.bossEnemy(boss('warlord'), 'normal', {x:ash.hero.x+40,y:ash.hero.y});
ash.zone().enemies = [wa];
ash.engage(wa);
assert.equal(wa.ashCloud.expires - ash.s.time,6);
assert.equal(wa.ashNextAt - ash.s.time,18);
assert.equal(ash.ashMovementFactor(ash.hero), 0.7);
assert.equal(boss('warlord').damage,48);
assert.equal(ash.bossEnemy(boss('warlord'),'true',{x:500,y:500}).baseDamage,60);

const ridge = new Campaign('normal','ranger',()=>0.87);
ridge.enter('highlands');
const ty = ridge.bossEnemy(boss('ridge'),'normal',{x:ridge.hero.x+45,y:ridge.hero.y});
ridge.zone().enemies = [ty];
ridge.engage(ty);
assert.equal(ty.ledgerOpen,true);
assert.equal(ty.ledgerNextAt - ridge.s.time,12);
assert.equal(boss('ridge').hp,2400);
assert.equal(boss('ridge').damage,36);

const mire = new Campaign('normal','ranger',()=>0.87);
const u = mire.hero;
u.mireBogExposure = 4;
u.mireBogLastAt = mire.s.time;
assert.equal(mire.mireBogMovementFactor(u),0.35);
mire.s.time += 2.1;
assert.equal(mire.mireBogMovementFactor(u),1);
assert.equal(boss('mire').damage,24);

const oldCryptVersion = game.zone().dungeonVersion;
game.zone().dungeonVersion = 3;
game.decorateDungeon(game.zone());
assert.equal(game.zone().dungeonVersion,4,'historical crypt decor must migrate');
assert.equal(game.zone().props.filter(p=>p.decorative && p.structure==='estate-hearth').length>=1,true);
assert.equal(oldCryptVersion,4);

console.log('PASS boss pit-stop identity, positioning, scaling, summons, estate and movement contracts');
