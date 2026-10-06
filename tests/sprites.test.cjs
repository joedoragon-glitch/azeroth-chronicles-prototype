'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),Sprites=require('../src/prototype/sprites.js');

const diskManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/sprites/manifest.json'),'utf8'));
assert.deepEqual(diskManifest.sprites,{},'production manifest has no active illustrated sprites after Paladin rollback');

assert.deepEqual(Sprites.candidateKeys({renderKind:'hero',class:'paladin'}),['hero:paladin']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'ally',type:'soldier'}),['ally:soldier']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',type:'boss',family:'thorn',form:'true'}),['boss:thorn']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',species:'goblin'}),['enemy:goblin']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',species:'goblin',ranged:true}),['enemy:goblin:ranged']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',species:'goblin',ranged:true,guard:true}),['enemy:goblin:ranged-guard']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'enemy',species:'goblin',captain:true,guard:true}),['enemy:goblin:captain-guard']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'npc',kind:'cage',family:'thorn'},0,false),['cage:thorn:closed']);
assert.deepEqual(Sprites.candidateKeys({renderKind:'building',progress:4,full:false},0),['building:barracks:vale:basic']);

assert(Sprites.installManifest({version:2,sprites:{
 'hero:paladin':{src:'./assets/sprites/paladin.webp',displayWidth:84,displayHeight:108,anchorX:.5,anchorY:.88,labelHeight:96},
 'enemy:goblin':{src:'./assets/sprites/goblin.webp',displayWidth:64,displayHeight:72}
}}));
assert.equal(Sprites.definitionFor({renderKind:'hero',class:'paladin'}).key,'hero:paladin');
assert.equal(Sprites.definitionFor({renderKind:'enemy',species:'goblin'}).key,'enemy:goblin');
assert.equal(Sprites.definitionFor({renderKind:'enemy',species:'goblin',ranged:true}),null,'ranged variant must not silently use melee sprite');
assert.equal(Sprites.definitionFor({renderKind:'enemy',species:'goblin',captain:true}),null,'captain must remain procedural until captain art exists');
assert.equal(Sprites.height({renderKind:'hero',class:'paladin'},0,false,54),96);
assert.equal(Sprites.height({renderKind:'enemy',species:'goblin'},0,false,54),72*.88);
assert.equal(Sprites.height({renderKind:'enemy',species:'wolf'},0,false,54),54);
assert.equal(Sprites.entityScale({visualScale:1.18},{scale:1}),1.18);
assert.equal(Sprites.entityScale({type:'boss',form:'true'},{scale:1}),1.14);
console.log('PASS Static sprite registry preserves exact variants, anchors, scaling and procedural fallback.');
