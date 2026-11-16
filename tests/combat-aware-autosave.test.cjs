'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.resolve(__dirname, '../src/prototype/app.js'), 'utf8');
const begin=app.indexOf('  const saveDiagnostics = {');
const stop=app.indexOf('  // Live game shell only.',begin);
assert(begin>=0&&stop>begin,'real save policy found');
const create=new Function('game','profile','persistence','performance','backupAdvisor',
  'started','combatSavePreference',app.slice(begin,stop)+
  '\nreturn {save, combatSaveBlocked, saveDiagnostics};');
let clock=0,writes=0,backups=0;
const game={zoneId:'vale',hero:{level:2},
  s:{mode:'normal',time:20,squadEngagement:null,projectiles:[]},
  heroThreatened:false,manaCombatActive(){return this.heroThreatened;}};
const persistence={save(){writes++;clock+=9;return true;}};
const timer={now:()=>clock},advisor={due(){backups++;}};
const defaultSave=create(game,{},persistence,timer,advisor,true,'off');
const optedIn=create(game,{},persistence,timer,advisor,true,'on');
const periodicStart=app.indexOf('      saveTimer += dt;');
const periodicEnd=app.indexOf('    }\n    const eventAt',periodicStart);
assert(periodicStart>=0&&periodicEnd>periodicStart);
const tick=new Function('save','dt','saveTimer',
  app.slice(periodicStart,periodicEnd)+'\nreturn saveTimer;');
let countdown=0;
function advance(n,save){for(let i=0;i<n;i++)countdown=tick(save,1,countdown);}
game.s.squadEngagement='field';
advance(10,defaultSave.save);
assert.equal(writes,0,'five-second checks skip while engaged');
assert.equal(countdown,0,'no save backlog');
assert.equal(defaultSave.saveDiagnostics.skippedCombat.periodic,2);
game.s.squadEngagement=null;
game.heroThreatened=true;
advance(5,defaultSave.save);
assert.equal(writes,0,'hero aggro blocks saves');
game.heroThreatened=false;
game.s.projectiles=[{source:'enemy'}];
advance(5,defaultSave.save);
assert.equal(writes,0,'enemy projectile blocks saves');
game.s.projectiles=[];
advance(5,defaultSave.save);
assert.equal(writes,1,'next out-of-combat interval saves');
advance(5,defaultSave.save);
assert.equal(writes,2,'cadence remains five seconds');
assert.equal(defaultSave.saveDiagnostics.maxSaveMs,9,'duration measured on real writes');
const eventStart=app.indexOf('    if (\n      events.some((e) =>\n        [');
const eventEnd=app.indexOf("    if (events.some((e) => e.type === 'peace'))",eventStart);
assert(eventStart>=0&&eventEnd>eventStart);
const milestone=new Function('events','save',app.slice(eventStart,eventEnd));
game.s.squadEngagement='boss';
for(const type of ['level','bossDefeat','questComplete','travel','successor']){
  const old=writes;milestone([{type}],defaultSave.save);
  assert.equal(writes,old,type+' deferred during combat');
}
assert.equal(defaultSave.saveDiagnostics.skippedCombat.milestone,5);
milestone([{type:'death'}],defaultSave.save);
assert.equal(writes,3,'death safeguards preserved');
milestone([{type:'gameOver'}],defaultSave.save);
assert.equal(writes,4,'game-over safeguards preserved');
assert.equal(defaultSave.save(),false,'action-triggered save also deferred');
assert.equal(defaultSave.saveDiagnostics.skippedCombat.action,1);
assert.equal(defaultSave.save('safety',true),true,'exit/update/recovery force save');
assert.equal(optedIn.save('periodic'),true,'opt-in allows combat saves');
assert.equal(writes,6);assert.equal(backups,6);
game.s.squadEngagement=null;
milestone([{type:'bossDefeat'}],defaultSave.save);
assert.equal(writes,7,'progression saves resume outside combat');
milestone([{type:'swing'}],defaultSave.save);
assert.equal(writes,7,'normal combat effect does not trigger saving');
assert(app.includes("if (value === '60')"),'explicit 60 FPS opt-in');
assert(app.includes("combatSaveKey, 'on'"),'60 FPS opt-in stored');
assert(app.includes("tr('Save during combat')"),'bilingual setting');
assert(app.includes('saveDiagnostics: {'),'diagnostics export');
for(let i=0;i<10;i++)defaultSave.save('safety',true);
assert.equal(defaultSave.saveDiagnostics.recent.length,8,'ledger bounded');
console.log('PASS combat-aware autosaves, milestones, recovery, setting, diagnostics');
