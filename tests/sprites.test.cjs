'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),Sprites=require('../src/prototype/sprites.js'),Visuals=require('../src/prototype/visuals.js');

const diskManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/sprites/manifest.json'),'utf8'));
assert.deepEqual(diskManifest.sprites,{},'production manifest stays empty until a canon-faithful sprite is approved');
assert.match(diskManifest.artDirection,/canonical procedural visuals/i,'manifest names the procedural renderer as canon');
assert.doesNotMatch(diskManifest.artDirection,/Warcraft|Ragnarok/i,'sprite direction cannot depend on external style references');
assert.equal(typeof Visuals.atmosphere,'function','procedural graphics expose regional atmosphere without sprite assets');
const promptCatalog=fs.readFileSync(path.join(__dirname,'../docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'),'utf8');
const promptAudit=fs.readFileSync(path.join(__dirname,'../docs/GRAPHICS_CANON_SPRITE_PROMPT_AUDIT.md'),'utf8');
assert.match(promptCatalog,/generate exactly one sprite per request/i,'sprite production is locked to one asset at a time');
assert.match(promptCatalog,/never generate sheets, comparisons, multiple options, turnarounds, scenes, or old\/new boards/i,'batch/comparison image generation is explicitly forbidden');
assert.equal((promptCatalog.match(/\*\*Image-generation prompt:\*\*/g)||[]).length,122,'audited catalog has 122 sprite-generation prompts');
assert.equal((promptCatalog.match(/KEEP PROCEDURAL — DO NOT GENERATE A SPRITE/g)||[]).length,9,'audited catalog has 9 explicit procedural-only entries');
assert.doesNotMatch(promptCatalog,/Warcraft|Ragnarok/i,'prompt catalog cannot reintroduce superseded outside-style direction');
assert(promptAudit.includes('mechanical distinction alone does not justify a new sprite'),'audit preserves canon-over-mechanics rule');
assert(promptAudit.includes('Drowned Watchhouse')&&promptAudit.includes('Old Signal Keep'),'audit protects named-place markers from literal redesign');


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
