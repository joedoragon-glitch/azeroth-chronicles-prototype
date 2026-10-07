'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),Sprites=require('../src/prototype/sprites.js'),Visuals=require('../src/prototype/visuals.js');

const diskManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/sprites/manifest.json'),'utf8'));
assert.deepEqual(diskManifest.sprites,{},'production manifest stays empty until a canon-faithful sprite is approved');
assert.match(diskManifest.artDirection,/canonical procedural visuals/i,'manifest names the procedural renderer as canon');
assert.doesNotMatch(diskManifest.artDirection,/Warcraft|Ragnarok/i,'sprite direction cannot depend on external style references');
assert.equal(typeof Visuals.atmosphere,'function','procedural graphics expose regional atmosphere without sprite assets');
assert.equal(Visuals.allyBodyKind({renderKind:'ally',type:'archer'}),'goblin-archer','companion Archer no longer borrows the hero Ranger body');
assert.equal(Visuals.allyBodyKind({renderKind:'ally',type:'soldier'}),'soldier','Soldier companion keeps its armored human body');
assert.equal(Visuals.barracksVisualState({progress:2,full:false}),'construction','unfinished Barracks keep construction visuals');
assert.equal(Visuals.barracksVisualState({progress:4,full:false}),'basic','Basic Barracks use the cozy field-camp body');
assert.equal(Visuals.barracksVisualState({progress:4,full:true}),'full','Full Barracks use the expanded expedition-camp body');
for(const species of ['mireling','ogre','orc','ashbeast']){
 assert.equal(Visuals.enemyBodyKind({species,ranged:false}),species,species+' melee body key');
 assert.equal(Visuals.enemyBodyKind({species,ranged:true}),species+':ranged',species+' ranged class has a distinct procedural body');
}

const promptCatalog=fs.readFileSync(path.join(__dirname,'../docs/GRAPHICS_CANON_SPRITE_PROMPTS.md'),'utf8');
const promptAudit=fs.readFileSync(path.join(__dirname,'../docs/GRAPHICS_CANON_SPRITE_PROMPT_AUDIT.md'),'utf8');
const promptCoverage=fs.readFileSync(path.join(__dirname,'../docs/GRAPHICS_CANON_SPRITE_COVERAGE.md'),'utf8');
assert.match(promptCatalog,/generate exactly one sprite per request/i,'sprite production is locked to one asset at a time');
assert.match(promptCatalog,/never generate sheets, comparisons, multiple options, turnarounds, scenes, or old\/new boards/i,'batch/comparison image generation is explicitly forbidden');
assert.doesNotMatch(promptCatalog,/Warcraft|Ragnarok/i,'prompt catalog cannot reintroduce superseded outside-style direction');

const headings=[...promptCatalog.matchAll(/^### (\d{3}) — ([^\n]+)$/gm)];
assert.equal(headings.length,227,'audited catalog has 227 classified numbered entries');
assert.equal(new Set(headings.map(m=>m[1])).size,227,'catalog IDs are unique');
assert(headings.every((m,i)=>Number(m[1])===i+1),'catalog IDs remain continuous from 001 through 227');
let generated=0,aliases=0,procedural=0;
for(let i=0;i<headings.length;i++){
 const section=promptCatalog.slice(headings[i].index,i+1<headings.length?headings[i+1].index:promptCatalog.length);
 const states=[
  section.includes('**Image-generation prompt:**'),
  section.includes('ALIAS — do not generate a new image'),
  section.includes('KEEP PROCEDURAL — DO NOT GENERATE A SPRITE')
 ];
 assert.equal(states.filter(Boolean).length,1,'entry '+headings[i][1]+' has exactly one production status');
 if(states[0])generated++;else if(states[1])aliases++;else procedural++;
}
assert.deepEqual({generated,aliases,procedural},{generated:217,aliases:0,procedural:10},'final audited sprite-production partition');
assert(promptCatalog.match(/### 005 — Companion — Archer \/ Ranger support[\s\S]*allied goblin scout/i),'companion Archer follows the allied-goblin procedural canon');
assert(promptCatalog.match(/### 023 — Raider Archer[\s\S]*human\('archer'\)[\s\S]*Image-generation prompt/),'hostile Raider Archer has its own simpler canonical body prompt');
assert(promptCatalog.match(/### 131 — Occupied side-interior entrance[\s\S]*default `gate\(\)`/),'side-interior entrance uses the actual default gate renderer');
assert(promptCatalog.includes('### 161 — Citadel preparation fountain'),'unique Citadel fountain is covered');
assert(promptCatalog.includes('### 162 — Field-boss compound marker'),'field-compound marker is covered');
assert(promptCatalog.includes('### 163 — Dark Lord Tribute cache'),'active tribute cache is covered');

assert.match(promptAudit,/ranged classes are visual classes|renderer, not a semantic name.*wins every conflict/i,'audit follows corrected procedural canon');
assert(promptAudit.includes('Drowned Watchhouse')&&promptAudit.includes('Old Signal Keep'),'audit protects named-place markers from literal redesign');

const visualsSource=fs.readFileSync(path.join(__dirname,'../src/prototype/visuals.js'),'utf8');
function casesBetween(a,b){
 const s=visualsSource.slice(visualsSource.indexOf(a),visualsSource.indexOf(b,visualsSource.indexOf(a)));
 return [...s.matchAll(/case '([^']+)'/g)].map(m=>m[1]);
}
for(const kind of casesBetween('function decoration(kind)','function landmark()'))assert(promptCoverage.includes('| `'+kind+'` |'),'coverage audit classifies decoration '+kind);
for(const kind of casesBetween('function landmark()','const type=e.renderKind'))assert(promptCoverage.includes('| `'+kind+'` |'),'coverage audit classifies landmark '+kind);
for(const kind of casesBetween('function settlementBuilding(kind)','function decoration(kind)'))assert(promptCoverage.includes('| `'+kind+'` |'),'coverage audit classifies settlement structure '+kind);


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
