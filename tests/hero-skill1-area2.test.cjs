'use strict';
// Stage 2: mechanically-derived skill copy and class-specific hero A/V receipts.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
const Skills = require('../src/prototype/skill-reference.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const Audio = require('../src/prototype/audio.js');
const Visuals = require('../src/prototype/combat-visuals.js');

function near(a,b){assert(Math.abs(a-b)<1e-7,`${a} vs ${b}`);}
for(const cls of ['paladin','mage','ranger']){
  for(const rank of [1,2,4,6,8]){
    const g = new C('normal',cls,()=>0.9);
    g.hero.skills[0]=rank;
    const info=Skills.describe(g,1);
    assert(info.auto && info.tap && info.charge,'Skill 1 has three documented forms');
    const basic=info.auto.metrics.find(m=>m.key==='basicInterval');
    near(basic.value,g.basicSkillCooldown());
    const normal=info.tap.metrics.find(m=>m.key==='cooldown');
    const charged=info.charge.metrics.find(m=>m.key==='cooldown');
    near(normal.value,3);
    near(charged.value,{paladin:8,mage:7,ranger:8}[cls]);
    const mult=1+0.15*(rank-1),base=(g.power()+12)*mult,k=Math.floor(rank/2);
    near(info.auto.metrics.find(m=>m.key==='comboDamage').value[0],base);
    if(cls==='paladin'){
      near(info.tap.metrics.find(m=>m.key==='damage').value,3*base);
      near(info.charge.metrics.find(m=>m.key==='damage').value,1.5*base);
      near(info.charge.metrics.find(m=>m.key==='reach').value,190+10*k);
      near(info.charge.metrics.find(m=>m.key==='width').value,70+8*k);
      assert.equal(info.charge.metrics.find(m=>m.key==='pulses').value,2);
    }else if(cls==='mage'){
      near(info.charge.metrics.find(m=>m.key==='damage').value,2.4*base);
      near(info.charge.metrics.find(m=>m.key==='width').value,96+8*k);
      near(info.charge.metrics.find(m=>m.key==='reach').value,440+10*k);
    }else{
      near(info.tap.metrics.find(m=>m.key==='damage').value,base);
      assert.equal(info.tap.metrics.find(m=>m.key==='arrows').value,3);
      near(info.charge.metrics.find(m=>m.key==='damage').value,2.25*base);
      near(info.charge.metrics.find(m=>m.key==='flight').value,560+15*k);
      near(info.charge.metrics.find(m=>m.key==='retreatLock').value,4+0.15*k);
    }
    if(rank<8){
      const deltas=Skills.changes(g,1,rank);
      assert.deepEqual(deltas.map(x=>x.title),['Automatic basics','Tap','Charged']);
      assert(deltas.some(x=>x.rows.length>0));
    }
  }
}
const events=[
  {type:'heroSkillArea',actor:'hero',class:'paladin',slot:1,x:200,y:150,angle:0,
    reach:190,halfWidth:35,pulse:0,hits:3},
  {type:'heroSkillArea',actor:'hero',class:'paladin',slot:1,x:200,y:150,angle:0,
    reach:190,halfWidth:35,pulse:1,hits:2},
  {type:'heroSkillArea',actor:'hero',class:'mage',slot:1,x:200,y:150,
    endX:560,endY:150,halfWidth:48,hits:4},
  {type:'heroHawk',actor:'hero',class:'ranger',slot:1,phase:'launch',x:200,y:150,targetId:'e'},
  {type:'heroHawk',actor:'hero',class:'ranger',slot:1,phase:'flight',
    x:260,y:150,fromX:200,fromY:150,angle:0,targetId:'e'},
  {type:'heroHawk',actor:'hero',class:'ranger',slot:1,phase:'impact',
    x:280,y:150,targetId:'e',landed:true,interrupted:true},
  {type:'heroHawk',actor:'hero',class:'ranger',slot:1,phase:'expire',
    x:280,y:150,targetId:'e'},
];
const pushed=[];
HeroArt.queue(events,(e,type,life,priority)=>pushed.push({...e,type,life,max:life,priority}));
assert.deepEqual(pushed.map(f=>f.stage),[
  'skill1-cross','skill1-cross','skill1-wide-beam',
  'skill1-hawk-launch','skill1-hawk-flight','skill1-hawk-impact','skill1-hawk-expire']);
const drawn=[];
const ctx=new Proxy({}, {get(target,property){
  if(property==='createLinearGradient'||property==='createRadialGradient')
    return ()=>({addColorStop(){}});
  if(!(property in target))target[property]=(...args)=>{drawn.push([property,...args]);};
  return target[property];
},set(target,key,value){target[key]=value;return true;}});
for(const fx of pushed)
  HeroArt.draw(ctx,p=>({x:p.x,y:p.y}),fx,{reduced:false,width:1280,height:720});
assert(drawn.some(x=>x[0]==='quadraticCurveTo'),'distinct original hawk silhouette');
assert(drawn.some(x=>x[0]==='fill'),'cross/beam footprints fill');
for(const cls of ['paladin','mage','ranger']){
  assert(HeroArt.profile({class:cls,slot:1,charged:true}));
  assert.notEqual(HeroArt.profile({class:cls,slot:1,charged:true}).name,
    HeroArt.profile({class:cls,slot:1,charged:false}).name);
}
// Audio uses original procedural fallback; these checks never require WebAudio,
// sound files, external decoding, or a browser playback context.
const sound=new Audio(),played=[];
sound.ctx={currentTime:1,state:'running'};
sound.paused=false;
sound.settings.muted=false;
sound.mixLevel=()=>1;
sound.voices=new Set();
sound.lastWarning=-100;
sound.allowSfx=()=>true;
sound.playSoundEvent=()=>false;
for(const method of ['tone','sweep','noiseBurst'])
  sound[method]=(...args)=>played.push([method,...args]);
for(const e of events){
  const before=played.length;
  assert.equal(sound.heroSkillEffect(e),true);
  if(e.type==='heroHawk'&&['flight','expire'].includes(e.phase))
    assert.equal(played.length,before,'no per-frame hawk voice spam');
}
assert(played.length>=10,'two cross pulses, one beam and hawk release/impact make sound');
const prior=played.length;
sound.settings.muted=true;
sound.heroSkillEffect(events[0]);
assert.equal(played.length,prior,'mute suppresses new foley');
const projected=Visuals.queue(events,new C('normal','mage',()=>0.9),[]);
assert(projected.some(f=>f.stage==='skill1-wide-beam'));
assert(projected.some(f=>f.stage==='skill1-hawk-impact'));
console.log('PASS Area 2 live rank figures, class-specific visual receipts/draw, offline foley and mute');
