'use strict';
// #708 Wraith carried-lantern parity, including the small daylight glass bloom.
// Tests source functions, not a proxy assertion that claims browser/device pixels.
const assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Renderer=require('../src/prototype/renderer.js');
const Core=require('../tools/webgl-pilot/native-webgl2-core.js');
const lamp={kind:'carried-lantern',id:'wraith-1',x:210,y:185};
const at=(darkness)=>Core.lampGlowCommands([lamp],1,{darkness,hero:null});
const night=at(1), day=at(0), twilight=at(.5);
assert.equal(night.length,2,'night glass emits wide ground light and inner glass');
assert.deepEqual(night.map(x=>x.radius),[64,10]);
assert.equal(day.length,1,'Canvas retains weak glass bloom in daylight');
assert.equal(day[0].radius,22);
assert.equal(day[0].alpha,.12);
assert.equal(twilight.length,3,'twilight blends night and daytime carried light');
assert.deepEqual(twilight.map(x=>x.radius),[64,10,22]);
assert(twilight.every(x=>x.rgb.every(Number.isFinite)&&Number.isFinite(x.alpha)));
assert.equal(Core.lampGlowCommands([{...lamp,kind:'window'}],1,{darkness:0}).length,0,
  'daylight must not invent civic lamp light');
assert.equal(Core.lampGlowCommands([],1,{darkness:1}).length,0);
const capped=Core.lampGlowCommands(Array.from({length:50},(_,i)=>({
  ...lamp,id:'w'+i,x:i*10
})),1,{darkness:1});
assert.equal(capped.length,72,'at most 36 original lamp sources are processed');
for(const zoom of [1,1.5]) {
  const game=new Campaign('normal','paladin',()=>.73);
  game.enter('march');
  game.s.clock=480;
  const e=game.makeEnemy({species:'wraith',name:'Lantern wraith',
    level:1,hp:1000,damage:0,gold:0,xp:0}, {x:game.hero.x+36,y:game.hero.y+30});
  game.zone().enemies=[e];
  const w=900,h=620;
  const r=Renderer.create({
    canvas:{width:w,height:h},ctx:{},
    getGame:()=>game,
    platform:{cameraZoom:zoom,cameraAnchor:()=>({x:w*.55,y:h*.48})},
    Campaign,PrototypeVisuals:require('../src/prototype/visuals.js'),
    PrototypeCombatVisuals:require('../src/prototype/combat-visuals.js'),
    now:()=>10000,
  });
  const saved=JSON.stringify(game.s);
  const visual=r.presentEntity(e,'enemy');
  const raw=r.screen(e);
  const positioned=r.visualPositionFor(visual);
  const facing=r.facingFor(visual);
  assert([raw.x,raw.y,positioned.x,positioned.y].every(Number.isFinite));
  assert(Math.abs(positioned.x-raw.x)<=.36*zoom,
    'glass anchor must inherit Canvas idle horizontal position');
  assert(Math.abs(positioned.y-raw.y)<=1.2*zoom,
    'glass anchor must inherit Canvas idle bob');
  const glass={
    x:positioned.x+facing*22.5*zoom,
    y:positioned.y+1.5*zoom,
  };
  assert(Number.isFinite(glass.x)&&Number.isFinite(glass.y));
  assert.equal(JSON.stringify(game.s),saved,
    'presentation coordinate/facing lookup does not write campaign state');
}
console.log('PASS #708 native Wraith night/day/twilight GPU light semantics, source budget, Canvas live position and pure state');
