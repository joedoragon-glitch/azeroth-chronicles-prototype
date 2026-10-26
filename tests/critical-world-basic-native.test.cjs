'use strict';
// Real Campaign World basic combat owners; opt-in session never installed in PWA.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const World = require('../src/prototype/critical-world-native.js');
const Party = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena(ranged = false) {
  const g = new Campaign('normal', 'ranger', () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  for (const key of ['props','buildings','npcs','enemies']) g.zone()[key] = [];
  Object.assign(g.hero, { x: 650, y: 500, hp: 2000, maxHp: 2000, immune: 0 });
  g.s.party = [];
  const e = g.makeEnemy(
    { species: ranged ? 'archer' : 'goblin', name: 'Native World attacker',
      level: 1, hp: 10000, damage: 140, gold: 0, xp: 0 },
    { x: ranged ? 510 : 610, y: 500 },
  );
  e.damage = 140;
  e.ranged = ranged;
  e.aggro = true;
  e.cd = 0;
  e.supportHealCd = 100;
  g.zone().enemies = [e];
  return {g,e};
}
function attach(g, level = 1, roll = 0) {
  let rolls = 0;
  const session = World.createSession(Critical, Levels, {
    enabled: true, stream: { next() { rolls++; return roll; } },
  });
  session.setCriticalLevel('world', level);
  g._criticalWorldNative = session;
  return {count:()=>rolls, session};
}
function close(a,b,msg) {
  assert(Math.abs(a-b)<1e-6,msg + ': ' + a + ' != ' + b);
}
assert.equal(Campaign.prototype._criticalWorldNative, undefined);
assert.equal(World.createSession(Critical,Levels,{enabled:false}).release(), null);
assert.throws(()=>World.createSession(Critical,Levels,{enabled:true}), /isolated random/);
for(const level of [1,2,3]) {
  const a=arena(), b=arena(), tally=attach(b.g,level);
  const hpA=a.g.hero.hp, hpB=b.g.hero.hp;
  a.g.enemyStartBasic(a.e,a.g.hero,false);
  b.g.enemyStartBasic(b.e,b.g.hero,false);
  assert.equal(tally.count(),1,'world melee exactly one committed action');
  assert(hpA-a.g.hero.hp>0,'real melee contact');
  assert(hpB-b.g.hero.hp>hpA-a.g.hero.hp,'world melee stronger at level '+level);
  close(a.e.cd,b.e.cd,'no cooldown change');
  assert.equal(b.g.s.projectiles.length,0,'no phantom ranged shots');
  const base=arena(true), crit=arena(true), tally2=attach(crit.g,level);
  base.g.enemyStartBasic(base.e,base.g.hero,true);
  crit.g.enemyStartBasic(crit.e,crit.g.hero,true);
  assert.equal(tally2.count(),0,'aim must not roll');
  assert(base.e.rangedAim && crit.e.rangedAim,'real aim pending');
  base.g.updateEnemies(1);
  crit.g.updateEnemies(1);
  assert.equal(tally2.count(),1,'ranged releases only on real shot');
  assert.equal(base.g.s.projectiles.length,1);
  assert.equal(crit.g.s.projectiles.length,1,'no added enemy missiles');
  const shot=crit.g.s.projectiles[0], original=base.g.s.projectiles[0];
  assert.equal(shot.criticalExecution.key,'world/basic/ranged');
  assert.equal(shot.criticalExecution.domain,'world');
  assert.equal(shot.criticalExecution.intensity,level);
  assert(Object.isFrozen(shot.criticalExecution));
  close(shot.damage,original.damage*Levels.LEVERS.damage.values[level-1],
    'world ranged damage retains release level');
  assert.equal(shot.speed,original.speed);
  assert.equal(shot.life,original.life);
  const releaseReceipt=shot.criticalExecution;
  tally2.session.setCriticalLevel('world',3);
  for(let i=0;i<10;i++){
    base.g.updateProjectiles(.1);
    crit.g.updateProjectiles(.1);
  }
  assert.equal(tally2.count(),1,'flight and impact do not reroll');
  assert.strictEqual(shot.criticalExecution,releaseReceipt);
  assert(crit.g.hero.hp<base.g.hero.hp,'native ranged impact carries increased damage');
}
{
  const a=arena(true), tally=attach(a.g);
  a.g.enemyStartBasic(a.e,a.g.hero,true);
  assert.equal(tally.count(),0);
  // Withheld legal line at actual release: no shot, cooldown change only.
  a.g.enemyRangedLine=()=>false;
  a.g.updateEnemies(1);
  assert.equal(tally.count(),0,'blocked ranged aim is not a committed shot');
  assert.equal(a.g.s.projectiles.length,0);
}
{
  const a=arena(), tally=attach(a.g,2,0.99);
  const b=arena();
  a.g.enemyStartBasic(a.e,a.g.hero,false);
  b.g.enemyStartBasic(b.e,b.g.hero,false);
  assert.equal(tally.count(),1);
  close(a.g.hero.hp,b.g.hero.hp,'world non-critical hit is identical');
}
{
  const a=arena(), tally=attach(a.g);
  assert.throws(()=>tally.session.release(a.g,'world/unknown/special',a.e.id),/Unknown/);
  assert.throws(()=>tally.session.release(a.g,'hero/ranger/auto',a.e.id),/Unknown/);
  assert.throws(()=>tally.session.setCriticalLevel('hero',2),/World session/);
  assert.equal(tally.count(),0,'rejected world actions never consume RNG');
  const party=Party.createSession(Critical,Levels,{
    enabled:true,stream:{next(){return 0.99;}},
  });
  party.setCriticalLevel('companion',3);
  assert.equal(tally.session.criticalLevels().companion,1,
    'independent World and Party intensity controllers');
}
console.log('PASS native World melee/ranged: three levels, LOS admission, aimed release, flight, separate pool and OFF contract');
