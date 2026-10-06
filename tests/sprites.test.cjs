'use strict';
const assert=require('node:assert/strict'),Sprites=require('../src/prototype/sprites.js');

assert.deepEqual(Sprites.candidateKeys({renderKind:'hero',class:'paladin'}),['hero:paladin']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'ally',type:'soldier'}),['ally:soldier']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',type:'boss',family:'thorn',form:'true'}),['boss:thorn']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',species:'goblin',ranged:true,guard:true}),['enemy:goblin:ranged-guard','enemy:goblin:ranged','enemy:goblin:guard','enemy:goblin']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'npc',kind:'cage',family:'thorn'},0,false),['cage:thorn:closed']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'building',progress:4,full:true},0),['building:barracks:vale:full','building:barracks:vale','building:barracks']);

assert(Sprites.installManifest({version:2,sprites:{
 'hero:paladin':{src:'./assets/sprites/paladin.webp',displayWidth:90,displayHeight:120,anchorX:.5,anchorY:.88,labelHeight:108},
 'enemy:goblin':{src:'./assets/sprites/goblin.webp',displayWidth:64,displayHeight:72}
}}));
assert.equal(Sprites.definitionFor({renderKind:'hero',class:'paladin'}).key,'hero:paladin');
assert.equal(Sprites.definitionFor({renderKind:'enemy',species:'goblin',ranged:true}).key,'enemy:goblin');
assert.equal(Sprites.height({renderKind:'hero',class:'paladin'},0,false,54),108);
assert.equal(Sprites.height({renderKind:'enemy',species:'goblin'},0,false,54),72*.88);
assert.equal(Sprites.definitionFor({renderKind:'enemy',species:'wolf'}),null);
assert.equal(Sprites.height({renderKind:'enemy',species:'wolf'},0,false,54),54);
console.log('PASS Static sprite registry resolves canonical keys, variants, anchors and legacy fallback heights.');
