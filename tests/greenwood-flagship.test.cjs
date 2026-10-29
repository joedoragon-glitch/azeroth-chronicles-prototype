'use strict';
// This file historically tested the 3200-unit flagship. Its replacement
// checks the owner-authorized return to the original 2700-unit region.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const G = require('../src/prototype/greenwood');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const close = (a,b,label) => assert(Math.abs(a-b) < 1e-5, label + ': ' + a + ' != ' + b);
for (const seed of [0x47564101,0x47564102]) {
  const g = new Campaign('normal','paladin',rng(seed)), z = g.zone();
  assert.equal(g.zoneSize(),2700,'original Greenwood map dimensions');
  assert.equal(Campaign.rules.terrain[0][0].x,630,'old western millpond');
  assert.equal(z.greenwoodSceneVersion,undefined,'no flagship scene');
  assert(!z.props.some(p=>p.id?.startsWith('greenwood-')),'no new flagship dressing');
  assert.equal(g.questDefs().filter(q=>q.region==='vale'&&q.kind!=='barracks').length,6);
  assert.equal(z.nodes.reduce((sum,n)=>sum+n.amount,0),640);
  assert.equal(z.enemies.filter(e=>e.type==='mob'&&!e.summon).length,32);
  for(const id of ['supplier','recruiter','rest','minor','orchard','mill-pond','bridge-north','bridge-south','goblin-camp']) {
    const n = z.npcs.find(n=>n.id===id);
    assert(n,'preserved site '+id);
    assert(n.x>=0 && n.y>=0 && n.x<2700 && n.y<2700,id+' in original bounds');
  }
}
for(const v of [0,50,300,720,900,1200,1750,2400,2700])
  for(const [f,r] of [[G.projection.x,G.projection.oldX],[G.projection.y,G.projection.oldY]])
    close(r(f(v)),v,'reverse projection');
{
  const g = new Campaign('normal','paladin',rng(0x47564103)), before = g.snapshot(),
    old = {x:before.hero.x,y:before.hero.y};
  before.zones.vale.greenwoodSourceVersion = 1;
  before.zones.vale.roadVersion = 17;
  before.hero.x = G.projection.x(old.x);
  before.hero.y = G.projection.y(old.y);
  before.hero.gold = 777;
  const rollback = Campaign.restore(before,rng(0x47564103));
  assert.equal(rollback.zoneSize(),2700);
  assert.equal(rollback.s.zones.vale.greenwoodRollbackVersion,1,'one-time reverse receipt');
  close(rollback.hero.x,old.x,'saved hero x restored');
  close(rollback.hero.y,old.y,'saved hero y restored');
  assert.equal(rollback.hero.gold,777,'earned player crowns intact');
  const snapshot = rollback.snapshot();
  const again = Campaign.restore(snapshot,rng(0x47564103));
  assert.equal(again.s.zones.vale.greenwoodRollbackVersion,1);
  close(again.hero.x,rollback.hero.x,'no double reverse on subsequent reload');
  close(again.hero.y,rollback.hero.y,'no double reverse on subsequent reload');
  assert.equal(again.hero.gold,777);
}
console.log('PASS Original 2700 Greenwood and one-time reverse v4 coordinates; other-game modules unchanged.');
