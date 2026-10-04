'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js');
const source=fs.readFileSync(__dirname+'/game.test.cjs','utf8').split('let passed=0;')[0],scope={require,__dirname,Blob,console};vm.createContext(scope);vm.runInContext(source,scope);const g=scope.fresh({withSquad:true});
const legacy=g.run("player.level=7;player.gold=456;player.xp=33;player.spellLevels[2]=3;dungeonCleared.crypt=true;return saveSnapshot();");const copy=JSON.stringify(legacy),c=Campaign.migrate(legacy,()=>.9);
assert.equal(c.hero.level,7);assert.equal(c.hero.gold,456);assert.equal(c.hero.xp,33);assert.equal(c.hero.skills[1],3);assert(c.s.normal.crypt);assert(c.s.rescued.crypt);assert(c.s.paid['clear:crypt']);assert.equal(JSON.stringify(legacy),copy);c.enter('crypt');assert(!c.zone().enemies.some(e=>e.guard||e.type==='boss'));Campaign.restore(c.snapshot());
console.log('PASS Actual v2 save migration preserves progression and retains the original export unchanged.');
