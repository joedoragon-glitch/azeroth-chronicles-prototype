'use strict';
// Art Catalog #321: genuine Campaign death→reward→pickup regression.
// Uses the production Campaign.kill, awardEnemyReward and tick collection
// without manipulating drop arrays by hand or changing gameplay implementation.
// This is the native lifecycle gate, distinct from the Pixi screenshot gate.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

function preparedGame() {
  const g = new Campaign('normal', 'ranger', () => 0.5);
  g.hero.gold = 0;
  g.hero.hp = g.hero.maxHp;
  g.s.party = [];
  g.zone().enemies = [];
  return g;
}
function earnDrop(g, gold) {
  const enemy = g.makeEnemy({
    species: 'goblin', type: 'mob', name: 'Art 321 earned reward test',
    level: 1, hp: 1, damage: 0, gold, xp: 0,
  }, {x:g.hero.x + 140,y:g.hero.y});
  enemy.heroParticipated = true;
  g.zone().enemies.push(enemy);
  const wanted = g.enemyReward(enemy).gold;
  assert(wanted > 0,'Fixture must earn a real positive reward');
  const priorKills = g.s.statistics.kills,
    priorNextId = g.s.nextId;
  enemy.hp = 0;
  g.kill(enemy);
  assert.equal(enemy.deathPaid,true,'Death must be resolved once');
  assert.equal(g.s.statistics.kills,priorKills+1);
  assert.equal(g.s.nextId,priorNextId+1,
    'Canonical drop must use the live ID allocator');
  const drops = g.s.loot.filter(l=>l.zone===g.zoneId);
  assert.equal(drops.length,1,'Production kill() must create one Crown drop');
  const drop = drops[0];
  assert.equal(drop.id,'loot-'+priorNextId);
  assert.equal(drop.gold,wanted);
  assert.equal(drop.x,enemy.x);
  assert.equal(drop.y,enemy.y);
  assert.equal(g.hero.gold,0,'Death must not directly grant Crown coin value');
  g.kill(enemy);
  assert.equal(g.s.loot.length,1,'Repeated kill cannot double-pay');
  return drop;
}

// Day and authored night; night appearance must not affect reward collection.
for(const clock of [0,420]){
  const g=preparedGame();
  g.s.clock=clock;
  const drop=earnDrop(g,17);
  assert.equal(g.night(),clock===420);
  const saved=g.snapshot(),savedId=drop.id;
  g.tick(0.01);
  assert(g.s.loot.some(l=>l.id===savedId),
    'Far reward must survive real ticking until approached');
  assert.equal(g.hero.gold,0);
  const restored=Campaign.restore(saved,()=>0.5);
  const resurrectedDrop=restored.s.loot.find(l=>l.id===savedId);
  assert(resurrectedDrop,'v4 snapshot must retain earned world Crown loot');
  assert.equal(resurrectedDrop.gold,drop.gold);
  restored.hero.x=resurrectedDrop.x;
  restored.hero.y=resurrectedDrop.y;
  const before=restored.hero.gold;
  restored.tick(0.01);
  assert.equal(restored.s.loot.some(l=>l.id===savedId),false,
    'Actual Campaign tick must remove collected reward');
  assert.equal(restored.hero.gold,before+drop.gold,
    'Collected Crown reward must be credited exactly once');
  restored.tick(0.01);
  assert.equal(restored.hero.gold,before+drop.gold,
    'Collected drop cannot pay twice');
}
console.log('PASS Art321 native earned Crown drop: kill→loot→save/restore→radius pickup, daytime/nighttime, exactly-once rewards');
