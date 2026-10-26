'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Visuals=require('../src/prototype/visuals.js');
const HeroArt=require('../src/prototype/hero-presentation.js');

function recording(){
  const actions=[];
  const ctx=new Proxy({
    canvas:{width:192,height:192},
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
  assert(stroke(acts,'#b99a67'),name+' requires visible two-cord sling');
  assert(fill(acts,'#735036'),name+' requires spare-stone satchel');
  assert(fill(acts,'#b4b1a1'),name+' must have a stone in the sling cup');
  assert(!stroke(acts,'#ba9562'),name+' must not carry an archer bow');
}
const archer=draw({renderKind:'ally',type:'archer'});
assert(stroke(archer,'#ba9562'),'friendly Archer keeps his bow');
assert(!stroke(archer,'#b99a67'),'friendly Archer does not inherit hostile sling');
const melee=draw({renderKind:'enemy',type:'mob',species:'goblin',ranged:false});
assert(!stroke(melee,'#b99a67'),'melee Goblin remains sword-equipped');
assert(!fill(melee,'#735036'),'melee Goblin has no stone satchel');

// Once launched, Ranger Skill 1 should draw the SAME independent straight
// shaft irrespective of where the caster moves later.
const arrow={source:'hero',style:'arrow',x:230,y:180,dx:1,dy:0,
  slot:1,charged:false,combo:2,delay:0};
const screen=p=>({x:p.x,y:p.y});
const a=recording(),b=recording();
assert(HeroArt.projectile(a.ctx,screen,arrow,'ranger',false,{x:180,y:170,hp:10}));
assert(HeroArt.projectile(b.ctx,screen,arrow,'ranger',false,{x:320,y:320,hp:10}));
assert.deepEqual(a.actions,b.actions,'Skill 1 arrows do not chase a moving caster');
assert(!a.actions.some(v=>v.op==='quadraticCurveTo'),
  'Ranger Skill 1 shaft must not bend');

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
