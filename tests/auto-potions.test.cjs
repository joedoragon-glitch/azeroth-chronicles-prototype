'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine');

const combat=()=>{
 const c=new Campaign('normal','paladin',()=>.9),e=c.zone().enemies.find(e=>e.type==='mob');
 c.s.mercyTime=0;Object.assign(e,{x:c.hero.x+90,y:c.hero.y,home:{x:c.hero.x+90,y:c.hero.y},hp:100000,maxHp:100000,baseHp:100000,aggro:true,damage:0,baseDamage:0});
 c.zone().enemies=[e];c.updateEnemies=()=>{};return c;
};

{
 const c=combat(),ranger=c.s.party.find(u=>u.type==='archer'),soldier=c.s.party.find(u=>u.type==='soldier'),hp=c.hero.maxHp;
 c.hero.hp=hp*.51;soldier.hp=soldier.maxHp*.8;c.tick(.1);assert.equal(ranger.healCd,0,'Ranger waits above the 50% combat trigger');
 c.hero.hp=hp*.5;c.tick(.1);assert(ranger.healCd>9,'Ranger Heal receives its own ten-second cooldown');assert(c.hero.supportEffects.some(e=>e.type==='health'));assert(!soldier.supportEffects.length,'Heal is single-target and prioritizes the hero');
 assert.equal(c.hero.hp,hp*.5,'Heal starts recovery over time rather than instantly');
 for(let i=0;i<25;i++)c.tick(.1);assert(Math.abs(c.hero.hp-(hp*.5+30))<.01,'Rank 1 Heal restores half of its 60 HP after 2.5 seconds');
 assert.equal(ranger.manaCd,0,'Heal does not place Mana Recovery on cooldown');
 c.hero.mp=c.hero.maxMp*.35;c.tick(.1);if(Campaign.rules.resourceMode.manaEnabled){assert(ranger.manaCd>9,'same Ranger can use independent Mana Recovery');assert(c.hero.supportEffects.some(e=>e.type==='mana'));}else{assert.equal(ranger.manaCd,0,'retired mana recovery remains idle');assert(!c.hero.supportEffects.some(e=>e.type==='mana'),'no retired mana effect is created');}
}
{
 const c=combat(),first=c.s.party.find(u=>u.type==='archer'),second=c.unit('archer',c.hero.x+40,c.hero.y+40),soldier=c.s.party.find(u=>u.type==='soldier');c.s.party.push(second);
 c.hero.hp=c.hero.maxHp*.5;soldier.hp=soldier.maxHp*.4;c.tick(.1);
 assert(first.healCd>9&&second.healCd>9,'two Rangers can each spend their own Heal cooldown');
 assert(c.hero.supportEffects.some(e=>e.type==='health'),'hero receives first Heal');
 assert(soldier.supportEffects.some(e=>e.type==='health'),'second Ranger can heal another low ally in the same fight');
}
{
 const c=new Campaign(),ranger=c.s.party.find(u=>u.type==='archer'),soldier=c.s.party.find(u=>u.type==='soldier');c.zone().enemies=[];c.updateEnemies=()=>{};
 c.hero.hp=c.hero.maxHp*.9;soldier.hp=soldier.maxHp*.9;c.hero.mp=c.hero.maxMp*.8;c.tick(.1);
 assert(ranger.healCd>9,'out of combat Ranger tops off health even above the combat threshold');
 assert(c.hero.supportEffects.some(e=>e.type==='health'),'hero remains first healing priority out of combat');
 if(Campaign.rules.resourceMode.manaEnabled)assert(ranger.manaCd>9&&c.hero.supportEffects.some(e=>e.type==='mana'),'out of combat Ranger also tops off hero mana');else assert.equal(ranger.manaCd,0,'out-of-combat recovery no longer spends a mana cooldown');
 for(let i=0;i<101;i++)c.tick(.1);
 assert(soldier.supportEffects.some(e=>e.type==='health')||soldier.hp===soldier.maxHp,'after cooldown the Ranger proceeds to wounded companions');
}
{
 const c=new Campaign();c.hero.gold=500;c.s.rescued.archive=true;
 assert.equal(c.rangerSupportAmount('health'),60);assert.equal(c.rangerSupportAmount('mana'),40);
 assert(c.trainRangerSupport('health','archive'));if(Campaign.rules.resourceMode.manaEnabled)assert(c.trainRangerSupport('mana','archive'));else assert(!c.trainRangerSupport('mana','archive'),'mana training retired without spending crowns');
 assert.equal(c.rangerSupportAmount('health'),150);assert.equal(c.rangerSupportAmount('mana'),Campaign.rules.resourceMode.manaEnabled?100:40);
 assert(!c.trainRangerSupport('health','archive'),'Neri training is a one-time permanent upgrade');
}
{
 const c=combat(),soldier=c.s.party.find(u=>u.type==='soldier');soldier.hp=soldier.maxHp*.5;c.updateParty(.1);
 assert(soldier.immune>2.39&&soldier.survivalCd>13.8,'Soldier copies Paladin defense: 2.5s immunity on a 14s personal cooldown');
 const hp=soldier.hp;assert(!c.hitParty(soldier,999));assert.equal(soldier.hp,hp,'Soldier Guard prevents incoming damage while active');
}
console.log('PASS Ranger single-target sustain, per-Ranger cooldown stacking, Neri upgrades and Soldier Guard survival');
