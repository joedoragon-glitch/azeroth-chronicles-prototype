'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Visuals=require('../src/prototype/visuals.js');
const HeroArt=require('../src/prototype/hero-presentation.js');

function recording(){
  const actions=[];
  const ctx=new Proxy({
    canvas:{width:192,height:192},globalAlpha:1,
    measureText:t=>({width:String(t).length*6}),
    createLinearGradient:()=>({addColorStop(){}}),
    createRadialGradient:()=>({addColorStop(){}})
  },{
    get(obj,k){
      if(k in obj)return obj[k];
      return (...args)=>{
        if(['stroke','fill','moveTo','lineTo','quadraticCurveTo','arc','ellipse'].includes(k))
          actions.push({op:k,args,stroke:obj.strokeStyle,fill:obj.fillStyle});
      };
    },
    set(obj,k,v){obj[k]=v;return true;}
  });
  return {ctx,actions};
}
const draw=e=>{
  const {ctx,actions}=recording();
  Visuals.draw(ctx,e,{x:96,y:110},0);
  return actions;
};
const stroke=(acts,c)=>acts.some(a=>a.op==='stroke'&&a.stroke===c);
const fill=(acts,c)=>acts.some(a=>a.op==='fill'&&a.fill===c);
const slingers=[
  ['ordinary',draw({renderKind:'enemy',type:'mob',species:'goblin',ranged:true})],
  ['Ringleader',draw({renderKind:'enemy',type:'mob',species:'goblin',ranged:true,captain:true})],
  ['Crown',draw({renderKind:'enemy',type:'mob',species:'goblin',ranged:true,crownTroop:true})]
];
for(const [name,acts] of slingers){
  assert(stroke(acts,'#c0a175'),name+' requires visible two-cord sling');
  assert(fill(acts,'#65503c'),name+' requires spare-stone satchel');
  assert(fill(acts,'#8e9487'),name+' must have a stone in the sling cup');
  assert(!stroke(acts,'#ba9562'),name+' must not carry an archer bow');
}
const archer=draw({renderKind:'ally',type:'archer'});
assert(stroke(archer,'#ba9562'),'friendly Archer keeps his bow');
assert(!stroke(archer,'#c0a175'),'friendly Archer does not inherit hostile sling');
const melee=draw({renderKind:'enemy',type:'mob',species:'goblin',ranged:false});
assert(!stroke(melee,'#c0a175'),'melee Goblin remains sword-equipped');
assert(!fill(melee,'#65503c'),'melee Goblin has no stone satchel');

// Auto-attacks (all combo stages) and all three staggered normal Skill 1
// shots must share one rigid projectile silhouette independent of caster.
const screen=p=>({x:p.x,y:p.y});
function paintArrow(arrow,hero,reduced=false,cls='ranger'){
  const {ctx,actions}=recording();
  assert(HeroArt.projectile(ctx,screen,arrow,cls,reduced,hero));
  return actions;
}
for(const kind of ['auto','skill']){
  for(const n of [1,2,3]){
    const arrow={source:'hero',style:'arrow',x:230,y:180,dx:0.8,dy:0.6,
      slot:1,charged:false,combo:kind==='auto'?n:0,
      rapid:kind==='skill',automaticBasic:kind==='auto',delay:0};
    const a=paintArrow(arrow,{x:180,y:170,hp:10});
    const b=paintArrow(arrow,{x:330,y:340,hp:10});
    const reduced=paintArrow(arrow,{x:330,y:340,hp:10},true);
    assert.deepEqual(a,b,kind+n+' shaft cannot follow a moving caster');
    assert.deepEqual(b,reduced,kind+n+' rigid arrow does not use animated motion');
    assert(!a.some(v=>v.op==='quadraticCurveTo'),kind+n+' no curved arrow');
    assert(a.some(v=>v.op==='fill'&&v.fill==='#c3c5b2'),
      kind+n+' has a recognizable filled physical tip');
    assert(a.some(v=>v.op==='stroke'&&v.stroke==='#57462f'),
      kind+n+' has a single rigid contrasting shaft');
  }
}
const delayed={source:'hero',style:'arrow',x:230,y:180,
  dx:1,dy:0,slot:1,delay:0,rangerDelayedLaunch:true};
assert.deepEqual(paintArrow(delayed,{x:180,y:170,hp:10}),[],
  'scheduled arrow must not appear before its real subrelease');
const charged={source:'hero',style:'arrow',x:230,y:180,
  dx:1,dy:0,slot:1,delay:0,charged:true};
assert(!paintArrow(charged,{x:330,y:340,hp:10}).some(a=>a.op==='quadraticCurveTo'),
  'charged Ranger arrows also have rigid shafts');
// The Mage's spell is deliberately exceptional and remains caster tethered.
const mage={source:'hero',style:'beam',x:230,y:180,dx:1,dy:0,slot:1,
  originX:160,originY:170,mageSkill1Homing:true,trailPoints:[{x:160,y:170}],
  traveled:70,beamWidthScale:2,delay:0};
const mageA=paintArrow(mage,{x:180,y:170,hp:10},false,'mage');
const mageB=paintArrow(mage,{x:310,y:300,hp:10},false,'mage');
assert.notDeepEqual(mageA,mageB,'Mage retains intentional caster tether');

// Shared Canvas projectile owner draws companion basic and combo shafts.
// Inspect only that arrow branch; other materials legitimately draw curves.
const renderer=fs.readFileSync(path.join(__dirname,'../src/prototype/renderer.js'),'utf8');
const start=renderer.indexOf("} else if (style === 'arrow') {"),
  end=renderer.indexOf("} else if (style === 'axe') {",start);
assert(start>=0&&end>start);
const branch=renderer.slice(start,end);
assert(!branch.includes('quadraticCurveTo'),
  'shared arrow shafts/trails must have no curved path commands');
assert(branch.includes('ctx.lineTo('),'arrow trail remains a velocity-aligned straight stroke');
console.log('PASS Goblin slinger equipment, friendly Archer preservation and straight independent Ranger/Archer arrows');
