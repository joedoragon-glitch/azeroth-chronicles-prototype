'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const adapterFactory = require('./native-sprite-adapter.js');
const gpu = require('./native-webgl2-core.js');
const manifest = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../../assets/sprites/manifest.json'), 'utf8'
));
const goblin = manifest.sprites['enemy:goblin'];
const ranger = manifest.sprites['hero:ranger'];

function harness(entries = {}, extras = {}) {
  let clockMs = 0;
  const imageSource = {
    definitionFor(entity) {
      if (entity.renderKind === 'hero' && ['paladin', 'mage'].includes(entity.class))
        return null; // Production specifically rejects their outdated rasters.
      const key = entity.renderKind === 'enemy' ? 'enemy:goblin' :
        entity.renderKind === 'hero' ? 'hero:ranger' : null;
      if (!key) return null;
      return {key,entry:entries[key]||manifest.sprites[key]};
    },
    frameFor(clip, elapsed) {
      const total=clip.frames.reduce((sum,f)=>sum+f.durationMs,0);
      let t=clip.loop?elapsed%total:Math.min(elapsed,total-0.001);
      for(const f of clip.frames){
        if(t<f.durationMs)return f;
        t-=f.durationMs;
      }
      return clip.frames.at(-1);
    },
    variant(_entity,entry){return entry;},
    entityScale(_entity,entry){return entry.scale||1;},
    timeMs(){return clockMs;}
  };
  const adapter=adapterFactory.create({
    sprites:imageSource,gpuCore:gpu,clock:()=>clockMs,
    ...extras
  });
  return {adapter,advance(ms){clockMs+=ms},sprites:imageSource};
}

test('live goblin animation atlas uses actual approved source, clipped pixels and pivots',()=>{
  const {adapter}=harness();
  const goblinBody={renderKind:'enemy',id:'goblin-1',species:'goblin',x:30,y:40,hp:50};
  const selected=adapter.commandFor(goblinBody,{x:280,y:240},{region:0,facing:1});
  assert.equal(selected.supported,true);
  assert.equal(selected.key,'enemy:goblin');
  const frame=goblin.clips.idle.frames[0];
  assert.equal(selected.texture.src,frame.src);
  assert.equal(selected.texture.width,frame.width);
  assert.equal(selected.texture.height,frame.height);
  assert.deepEqual(selected.command.sourceRect,frame.rect);
  assert.equal(selected.command.width,Math.round(goblin.displayWidth));
  assert.equal(selected.command.height,Math.round(goblin.displayHeight));
  assert.equal(selected.command.textureId,selected.texture.id);
  assert.deepEqual(selected.animation,{name:'idle',elapsedMs:0,frameSource:frame.src});
});

test('real goblin sprite animation advances frames, not frozen prepared screenshots',()=>{
  const {adapter,advance}=harness();
  const actor={renderKind:'enemy',id:'enemy-23',species:'goblin',x:5,y:6,hp:10};
  let snapshot=adapter.commandFor(actor,{x:100,y:100});
  assert.equal(snapshot.texture.src,goblin.clips.idle.frames[0].src);
  advance(goblin.clips.idle.frames[0].durationMs);
  snapshot=adapter.commandFor(actor,{x:100,y:100});
  assert.equal(snapshot.texture.src,goblin.clips.idle.frames[1].src);
  advance(goblin.clips.idle.frames[1].durationMs);
  snapshot=adapter.commandFor(actor,{x:100,y:100});
  assert.equal(snapshot.texture.src,goblin.clips.idle.frames[0].src);
  assert.equal(adapter.counts().animatedFrames,3);
});

test('moving actor motion selects walk pose; manually assigned clip has precedence',()=>{
  const source={
    ...goblin,
    clips:{
      ...goblin.clips,
      walk:{loop:true,frames:[{...goblin.clips.idle.frames[0],durationMs:100}]},
      'walk:east':{loop:true,frames:[{...goblin.clips.idle.frames[1],durationMs:100}]}
    }
  };
  const {adapter,advance}=harness({'enemy:goblin':source});
  const entity={renderKind:'enemy',id:'enemy-move',x:0,y:0,hp:10};
  adapter.commandFor(entity,{x:40,y:40});
  advance(50);
  entity.x+=5;
  const walk=adapter.commandFor(entity,{x:40,y:40},{facing:-1});
  assert.equal(walk.animation.name,'walk:east');
  assert.equal(walk.command.flipX,true);
  assert.equal(walk.texture.src,goblin.clips.idle.frames[1].src);
  assert.equal(walk.command.x,
    80-(Math.round(40-(source.displayWidth||0)*.5)+Math.round(source.displayWidth||0)));
  entity.spriteClip='idle';
  const explicit=adapter.commandFor(entity,{x:40,y:40});
  assert.equal(explicit.animation.name,'idle');
});

test('protected procedural bodies stay explicit blockers instead of vanishing',()=>{
  const {adapter}=harness();
  const hero={renderKind:'hero',class:'paladin',x:0,y:0,hp:50};
  const answer=adapter.commandFor(hero,{x:200,y:200});
  assert.equal(answer.supported,false);
  assert.equal(answer.reason,'original-game-procedural-art');
  assert.equal(answer.requires,'independent-native-WebGL-procedural-body');
  assert.equal(adapter.counts().proceduralRequired,1);
  assert.equal(adapter.counts().supported,0);
});

test('reduced motion selects the canonical static resource, not idle animated frames',()=>{
  const {adapter}=harness({}, {isReducedMotion:()=>true});
  const actor={renderKind:'enemy',id:'goblin-still',x:2,y:4,hp:10};
  const answer=adapter.commandFor(actor,{x:150,y:250});
  assert.equal(answer.texture.src,goblin.src);
  assert.equal(answer.animation.frameSource,null);
  assert.deepEqual(answer.command.sourceRect,[0,0,goblin.width,goblin.height]);
});

test('full original sprite selection remains delegated; no mutation of campaign entities',()=>{
  const {adapter}=harness();
  const actor={renderKind:'hero',class:'ranger',id:'hero',x:12,y:34,hp:40};
  const before=JSON.stringify(actor);
  const resolved=adapter.commandFor(actor,{x:100,y:100});
  assert.equal(resolved.supported,true);
  assert.equal(resolved.key,'hero:ranger');
  assert.equal(resolved.texture.src,ranger.src);
  assert.equal(JSON.stringify(actor),before);
});

test('event state selects canonical attack clip, while unsupported event falls back visibly',()=>{
  const custom={
    ...goblin,
    clips:{...goblin.clips,attack:{loop:false,frames:[
      {...goblin.clips.idle.frames[1],durationMs:100}
    ]}}
  };
  const {adapter,advance}=harness({'enemy:goblin':custom});
  const actor={renderKind:'enemy',id:'special-1',x:2,y:1,hp:10};
  adapter.commandFor(actor,{x:60,y:60});
  adapter.noteEvents([{type:'swing',actor:'special-1'}]);
  advance(25);
  let attack=adapter.commandFor(actor,{x:60,y:60});
  assert.equal(attack.animation.name,'attack');
  assert.equal(attack.texture.src,custom.clips.attack.frames[0].src);
  advance(200);
  attack=adapter.commandFor(actor,{x:60,y:60});
  assert.equal(attack.animation.name,'idle');
  assert.ok(adapter.counts().pendingEvents>0);
  advance(11000);
  adapter.noteEvents([]);
  assert.equal(adapter.counts().pendingEvents,0);
});

test('broken original clip/resource rejects a missing image explicitly',()=>{
  const bad={...goblin,clips:{idle:{loop:true,frames:[{...goblin.clips.idle.frames[0],src:''}]}}};
  const {adapter}=harness({'enemy:goblin':bad});
  const selected=adapter.commandFor({renderKind:'enemy',x:3,y:4,hp:10},
    {x:20,y:30});
  assert.equal(selected.supported,false);
  assert.equal(selected.reason,'missing-approved-image-resource');
});
