'use strict';
// Read-only source diagnostic. Capture why the original pet-priority test fails
// on unchanged main; do not alter existing fixtures or assertions.
const C = require('../src/prototype/engine.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function scene(family='thorn',count=2){
 const g=new C('normal','paladin',()=>0.9);
 completeFieldOpening(g);
 const z=g.zone();
 for (const key of ['props','npcs','nodes','buildings','enemies']) z[key]=[];
 Object.assign(g.hero,{x:1380,y:1700});
 g.s.mercyTime=0;g.s.time=30;g.s.companionCombatTraining=2;
 g.s.normal[family]=g.s.true[family]=true;
 const u=g.unit('pet',1400,1700,family);g.s.party=[u];
 const enemies=Array.from({length:count},(_,i)=>g.makeEnemy(
 {species:'goblin',name:'Scheduling target',level:1,hp:100000,damage:0,xp:0,gold:0},
 {x:u.x+80+i*15,y:u.y}));
 z.enemies=enemies;g.engage(enemies[0]);return {g,u,enemies};
}
for(const family of ['thorn','crypt','mire']) {
 const {g,u,enemies}=scene(family);
 const second=g.petSkillTargets(u,enemies[0],2);
 const d={family,hero:{x:g.hero.x,y:g.hero.y},pet:{x:u.x,y:u.y,skill1Cd:u.skill1Cd,skill2Cd:u.skill2Cd},
 enemies:enemies.map(e=>({x:e.x,y:e.y,id:e.id,aggro:e.aggro,neutral:e.neutral,returning:e.returning,
 line:g.line(u,e),direct:g.tacticalDirectTargetable(e),range:g.distanceToSegment?.(e,u,enemies[0])})),
 firstSupport:g.petSupportSkillNeeded(u,1),secondSupport:g.petSupportSkillNeeded(u,2),
 secondTargets:second.map(e=>e.id), secondUnlocked:g.companionSecondSkillUnlocked(),
 phase:g.s.phase,peace:g.peace,
 firstCandidates:g.petSkillTargets(u,enemies[0],1).map(e=>e.id)};
 const did=g.companionTrySkill(u,enemies[0]);
 d.after={did,cd1:u.skill1Cd,cd2:u.skill2Cd,charged:g._companionCharges?.has(u.id)||false};
 console.log('PET_681_DIAG '+JSON.stringify(d));
}
console.log('PASS diagnostic captured unchanged source mechanics; original regression remains separate');
