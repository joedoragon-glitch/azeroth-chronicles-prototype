'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine.js'),D=C.data;
const kill=(c,e)=>{e.hp=0;e.heroParticipated=false;c.kill(e);};
for(const [gap,m]of [[-2,1],[0,1],[1,.75],[2,.4],[3,.1],[4,0],[8,0]]){const c=new C();c.hero.level=10;assert.deepEqual(c.reward(100,100,10-gap),{gold:100*m,xp:100*m});}
console.log('PASS lower-level XP and gold scale from the first level gap and stop at four');
for(const region of D.regions){const c=new C('normal','paladin',()=>.9);c.enter(region.id);const e=c.zone().enemies.find(e=>e.type==='mob'&&!e.guard&&!e.nightOnly);c.hero.level=e.level;c.hero.xp=0;const gold=e.gold,xp=e.xp;kill(c,e);assert.equal(c.hero.xp,Math.floor(xp*.5));assert.equal(c.s.loot.at(-1).gold,gold);const restored=C.restore(c.snapshot()),r=restored.zone().enemies.find(saved=>saved.id===e.id);assert.equal(r.xp,xp,'saved reward base must not compound the nerf');restored.hero.level=r.level;restored.hero.xp=0;r.hp=0;r.deathPaid=false;kill(restored,r);assert.equal(restored.hero.xp,Math.floor(xp*.5));}
console.log('PASS ordinary kills give half XP in every region and saved bases do not decay on reload');
{
 const c=new C('normal','paladin',()=>.9),g=c.zone().enemies.find(e=>e.guard),e=c.zone().enemies.find(e=>e.type==='mob'&&!e.guard);c.hero.level=e.level;
 const elite={...e,form:'ringleader',level:e.level+2,xp:e.xp*1.5};assert.equal(c.enemyReward(elite).xp,Math.floor(e.xp*1.5));assert(c.enemyReward(elite).xp>=3*c.enemyReward(e).xp);c.hero.level=g.level;assert.equal(c.enemyReward(g).xp,g.xp);assert.equal(c.enemyReward({...g,form:'ringleader',level:g.level+2,xp:g.xp*1.5}).xp,Math.floor(g.xp*1.5));
 const b=c.bossEnemy(c.boss('darklord'),'normal',{x:1000,y:1000});assert.equal(b.level,16);c.hero.level=16;assert.equal(c.enemyReward(b).xp,b.xp);c.hero.level=20;assert.deepEqual(c.enemyReward(b),{gold:0,xp:0});c.hero.xp=0;c.xp(120*20);assert.equal(c.hero.level,21,'future content is not limited by a level cap');assert.equal(c.reward(100,100,23).xp,100);
}
console.log('PASS ringleaders and bosses retain challenge rewards, guardians stay reduced, future levels remain open');
{
 const c=new C(),e=c.zone().enemies.find(e=>e.type==='mob'&&!e.guard);c.hero.level=e.level+4;c.hero.xp=0;const loot=c.s.loot.length;for(let i=0;i<100;i++){e.deathPaid=false;kill(c,e);}assert.equal(c.hero.xp,0);assert.equal(c.s.loot.length,loot,'zero-reward farming produces no gold piles');
 c.hero.level=20;c.hero.xp=0;c.accept('quest-4');c.discover('bridge-north');c.discover('port');const q=c.questDefs().find(q=>q.id==='quest-4');assert(c.s.quests[q.id].done);assert(c.claim(q.id));assert.equal(c.hero.xp,q.xp);assert(!c.claim(q.id));
 const questXP=D.quests.reduce((n,q)=>n+q[4],0),mobXP=D.regions.reduce((n,r)=>n+r.enemy_count*Math.floor(r.enemy_xp*.5),0);assert(questXP>mobXP*1.5);
}
console.log('PASS trivial farming pays nothing and one-time quests dominate a complete ordinary population sweep');
