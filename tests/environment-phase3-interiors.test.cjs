'use strict';
// Phase 3 native real-game interior photo evidence, NOT concept sketches.
// All five main dungeons, all five still-established side interiors and all
// four captain Treasuries. Gameplay state is never mutated by drawing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');
const Campaign=require('../src/prototype/engine.js');
const Renderer=require('../src/prototype/renderer.js');
const Visuals=require('../src/prototype/visuals.js');
const Combat=require('../src/prototype/combat-visuals.js');
const output=path.join(__dirname,'..','test-artifacts','environment-phase3','native');
fs.mkdirSync(output,{recursive:true});
const width=880,height=560;
const specs=[
  ['crypt','main','Forest Crypt',[[1140,450],[510,1230]]],
  ['archive','main','Sunken Archive',[[790,540],[490,1120]]],
  ['mine','main','Colossus Mine',[[500,535],[490,1140]]],
  ['abyss','main','Abyss Bastion',[[715,690],[1320,1250]]],
  ['citadel','main','Dark Citadel',[[630,955],[1120,1170]]],
  ['side-vale-cellars','side','Old Orchard Cellars',[[330,225],[680,810]]],
  ['side-march-watchhouse','side','Drowned Watchhouse',[[330,275],[740,780]]],
  ['side-highlands-signal','side','Old Signal Keep',[[330,250],[780,765]]],
  ['side-frontier-shrine','side','Ruined Shrine',[[330,265],[740,755]]],
  ['side-crown-foundry','side','Ruined Foundry',[[330,260],[745,755]]],
  ['supply-vale','treasury',"Scornfang's Treasury",[[400,255],[700,775]]],
  ['supply-march','treasury',"Mirejaw's Treasury",[[365,280],[705,755]]],
  ['supply-highlands','treasury',"Ridge Tyrant's Treasury",[[360,225],[740,760]]],
  ['supply-crown','treasury',"Cindermaw's Treasury",[[535,350],[1100,1030]]],
];
assert.equal(specs.filter(s=>s[1]==='main').length,5);
assert.equal(specs.filter(s=>s[1]==='side').length,5);
assert.equal(specs.filter(s=>s[1]==='treasury').length,4);
const records=[], ids=new Set();
for(const [id,category,title,positions] of specs){
  assert(!ids.has(id),'Unique canonical interior identity');ids.add(id);
  const game=new Campaign('normal','paladin',()=>.73);
  assert(game.enter(id),'Native Campaign interior must be enterable '+id);
  const z=game.zone(),intro={x:game.hero.x,y:game.hero.y};
  const config=category==='side'?Campaign.rules.sideDungeons.find(p=>p.id===id)
    :category==='treasury'?Campaign.rules.supplyRooms.find(p=>p.id===id):null;
  if(config)assert.equal(config.name,title,'Owner-established interior name');
  const provenance=z.props.map(p=>p.id);
  const canonicalExpected=category==='side' ? config.decor.map(p=>p[2])
    :category==='main' ? (Campaign.rules.dungeonDecor[id]||[]).map(p=>p[2]) : [];
  for(const [label,point] of [['entry',[intro.x,intro.y]],['work',positions[0]],['deep',positions[1]]]){
    game.s.clock=285;
    const safe=label==='entry'?intro:game.safe(point[0],point[1],id);
    assert(safe&&Number.isFinite(safe.x)&&Number.isFinite(safe.y));
    Object.assign(game.hero,safe);
    const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
    const state=JSON.stringify(game.s);
    const painter=Renderer.create({canvas:{width,height},ctx,getGame:()=>game,
      platform:{cameraZoom:1.5,cameraAnchor:(w,h)=>({x:w*.56,y:h*.52})},
      Campaign,PrototypeVisuals:Visuals,PrototypeCombatVisuals:Combat,
      chargePresentation:()=>null,isPaused:()=>false,now:()=>16000});
    painter.setOptimizationMode(false);painter.draw();
    assert.equal(JSON.stringify(game.s),state,'Drawing cannot alter real save '+id+'/'+label);
    const bytes=canvas.toBuffer('image/png');
    assert(bytes.length>10000,'Must paint a real room '+id+'/'+label);
    const near=arr=>(arr||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)
      &&Math.hypot(p.x-game.hero.x,p.y-game.hero.y)<430);
    const p=near(z.props),npc=near(z.npcs),foes=near(z.enemies.filter(e=>e.hp>0));
    const pix=ctx.getImageData(0,0,width,height).data;
    let dark=0,samples=0;
    for(let y=0;y<height;y+=12)for(let x=0;x<width;x+=12){
      const k=(y*width+x)*4,lum=(pix[k]+pix[k+1]+pix[k+2])/3;
      if(lum<32)dark++;samples++;
    }
    const file=id+'-'+label+'.png';
    fs.writeFileSync(path.join(output,file),bytes);
    records.push({id,category,title,label,x:Math.round(game.hero.x),y:Math.round(game.hero.y),
      zoneProps:z.props.length,zoneEnemies:z.enemies.length,zoneNpc:z.npcs.length,
      propsWithin430:p.length,npcWithin430:npc.map(n=>n.id),
      enemiesWithin430:foes.length,
      nearestProps:p.map(o=>({id:o.id,kind:o.structure||null,x:Math.round(o.x),y:Math.round(o.y),
        range:Math.round(Math.hypot(o.x-game.hero.x,o.y-game.hero.y))}))
        .sort((a,b)=>a.range-b.range).slice(0,22),
      darkFraction:Number((dark/samples).toFixed(3)),zoom:1.5,optimized:false,canvasOnly:true,
      pngBytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  assert.deepEqual(z.props.map(p=>p.id),provenance,'No image pass mutates room objects');
  if(canonicalExpected.length)
    assert(z.props.length>=4,id+' must have actual native furnishing objects');
  const exit=z.npcs.find(n=>n.kind==='exit');
  assert(exit,'Existing return point remains available in '+id);
  if(category==='side')
    assert(!z.enemies.some(e=>e.type==='boss'),'No fabricated boss in '+id);
}
const report={phase:3,baseline:'current checkout',status:'real Canvas interior art references; aesthetic acceptance must be human',
  count:records.length,rooms:specs.length,records};
fs.writeFileSync(path.join(output,'scene-index.json'),JSON.stringify(report,null,2)+'\n');
assert.equal(records.length,42);
console.log('PASS Phase 3: 14 native real interiors, 42 views, five side dungeons, zero draw mutation');
for(const r of records)console.log('ROOM '+r.id+'/'+r.label+' '+r.x+','+r.y+
  ' props='+r.propsWithin430+' enemies='+r.enemiesWithin430+' dark='+r.darkFraction);
