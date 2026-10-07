'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine'),Audio=require('../src/prototype/audio');
const arena=()=>{const c=new C('normal','paladin',()=>.9);c.enter('crypt');c.zone().props=[];c.zone().enemies=[];Object.assign(c.hero,{x:500,y:500});c.s.party=[];return c;};

const c=arena(),e=c.makeEnemy({species:'goblin',name:'Target',level:1,hp:1000,damage:8,gold:1,xp:1},{x:540,y:500});c.zone().enemies.push(e);
assert(c.cast(1,e.id));
const heroMelee=c.effects.find(e=>e.type==='melee');assert(heroMelee);assert.equal(heroMelee.actor,'hero');assert.equal(heroMelee.class,'paladin');assert.equal(heroMelee.weapon,'sword');
c.effects=[];e.cd=0;c.updateEnemies(.1);
const enemyMelee=c.effects.find(e=>e.type==='melee');assert(enemyMelee);assert.equal(enemyMelee.actor,'enemy');assert.equal(enemyMelee.species,'goblin');
c.effects=[];e.cd=10;c.s.party=[c.unit('soldier',530,500)];c.updateParty(.1);
const soldierMelee=c.effects.find(e=>e.type==='melee');assert(soldierMelee);assert.equal(soldierMelee.actor,'companion');assert.equal(soldierMelee.role,'soldier');assert.equal(soldierMelee.weapon,'sword');
c.effects=[];c.hero.immune=10;c.hitParty(c.hero,10);assert(!c.effects.some(e=>e.type==='melee'));
console.log('PASS landed hero, companion and enemy melee attacks retain actor/weapon identity');

for(const species of ['goblin','skeleton','reedbeast','mireling','ogre','orc','ashbeast','archer','crownguard','wraith']){
 const a=arena(),foe=a.makeEnemy({species,name:'Shooter',level:1,hp:1000,damage:10,gold:1,xp:1},{x:700,y:500});a.configureEnemy(foe,5);foe.aggro=true;foe.rangedAim={x:500,y:500,timer:0};a.zone().enemies.push(foe);a.updateEnemies(.1);
 const p=a.s.projectiles.find(p=>p.source==='enemy');assert(p,species);assert(Math.abs(p.speed-(foe.shotSpeed||260)*C.rules.rangedEnemyCombat.projectileMultiplier)<1e-8);assert(Math.abs(p.speed*p.life-(foe.shotSpeed||260)*2.5)<1e-8,'projectile range stays fixed');
 const launch=a.effects.find(e=>e.type==='projectileLaunch');assert(launch,species+' launch event');assert.equal(launch.actor,'enemy');assert.equal(launch.species,species);
 const base=foe.shotSpeed,saved=C.restore(a.snapshot());assert.equal(saved.zone().enemies[0].shotSpeed,base);
}
const b=arena(),boss=b.bossEnemy(b.boss('crypt'),'normal',{x:700,y:500});b.zone().enemies.push(boss);boss.attackIndex=0;b.startAttack(boss,b.hero,1);const warning=boss.telegraph.total;b.resolveAttack(boss);assert.equal(warning,1.2);assert.equal(b.s.projectiles.length,3);assert(b.s.projectiles.every(p=>Math.abs(p.speed-299)<1e-8));assert(b.effects.some(e=>e.type==='projectileLaunch'&&e.actor==='enemy'&&e.boss));
console.log('PASS ranged attacks retain launch identity without changing projectile timing or range');

const a=new Audio();
assert.equal(a.soundKind({type:'melee',actor:'hero',class:'paladin'}),'heroSteelImpact');
assert.equal(a.soundKind({type:'melee',actor:'companion',role:'soldier'}),'soldierSteelImpact');
assert.equal(a.soundKind({type:'melee',actor:'enemy',species:'wolf'}),'creatureImpact');
assert.equal(a.soundKind({type:'melee',actor:'enemy',species:'skeleton'}),'enemyWeaponImpact');
assert.equal(a.soundKind({type:'projectileLaunch',actor:'hero',class:'ranger',style:'arrow'}),'heroBow');
assert.equal(a.soundKind({type:'projectileLaunch',actor:'companion',role:'archer',style:'arrow'}),'bow');
assert.equal(a.soundKind({type:'projectileLaunch',actor:'hero',class:'mage',style:'magic'}),'magicLaunch');
assert.equal(a.soundKind({type:'projectileImpact',style:'arrow'}),'arrowImpact');
assert.equal(a.soundKind({type:'projectileImpact',style:'magic'}),'magicImpact');
assert.equal(a.soundKind({type:'hit'}),null);

const calls=[];a.ctx={currentTime:1};a.steelImpact=(now,hero)=>calls.push(['steel',hero]);a.effect({type:'melee',actor:'hero',class:'paladin'});assert.deepEqual(calls,[['steel',true]]);
a.ctx.currentTime+=.01;a.effect({type:'melee',actor:'hero',class:'paladin'});assert.equal(calls.length,1,'hero steel layer is crowd-throttled without deleting other sound families');
a.ctx.currentTime+=.03;a.effect({type:'melee',actor:'hero',class:'paladin'});assert.equal(calls.length,2);
a.settings.muted=true;a.ctx.currentTime+=1;a.effect({type:'melee',actor:'hero',class:'paladin'});assert.equal(calls.length,2);
a.settings.muted=false;a.paused=true;a.effect({type:'melee',actor:'hero',class:'paladin'});assert.equal(calls.length,2);
console.log('PASS contextual SFX routing gives Paladin steel, bows and magic distinct identities and obeys pause/mute');
