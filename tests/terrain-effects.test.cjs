'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../src/prototype/engine'),V=require('../src/prototype/visuals'),FX=require('../src/prototype/combat-visuals'),R=C.rules;
const inside=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
const iso=p=>({x:(p.x-p.y)*.76,y:(p.x+p.y)*.27});
// Reproduce the formerly misleading point: safely outside the old ellipse, inside real damage.
const c=new C(),trap={kind:'seal',x:0,y:0,radius:100},point={x:90/Math.sqrt(2),y:-90/Math.sqrt(2)};
assert(c.trapContains(trap,point));assert(Math.abs(iso(point).x)>76);
assert(inside(iso(point),FX.circlePoints(trap,trap.radius).map(iso)));
for(const kind of ['line','cone','sector','circle']){
 const a={kind,x:300,y:200,fromX:100,fromY:200,angle:0,radius:100,count:1};
 const points=FX.warningShapes(a,c.attackPatches(a));assert(points.length);
 const test=kind==='line'?{x:180,y:240}:kind==='circle'?{x:a.x+point.x,y:a.y+point.y}:{x:350,y:200};assert(points.some(poly=>inside(test,poly)),kind+' damage point is visibly warned');
}
const charge={kind:'line',charge:true,x:400,y:0,fromX:0,fromY:0,angle:0,count:1};
for(const point of [{x:200,y:50},{x:430,y:20}]){assert(c.distanceToSegment(point,{x:0,y:0},charge)<R.combatGeometry.chargeHalfWidth);assert(inside(point,FX.warningShapes(charge,[])[0]),'charge width and rounded end agree with swept collision');}
const ring=FX.warningShapes({kind:'ring',fromX:0,fromY:0},[])[0];assert(inside({x:R.combatGeometry.ringLife*R.combatGeometry.ringSpeed+20,y:0},ring),'ring preview covers its eventual outer damage edge');
console.log('PASS projected circle, charge corridor/endcaps and expanding-ring warning agree with collision');

const arena=cls=>{const g=new C('normal',cls,()=>.9);g.enter('crypt');g.zone().enemies=[];g.zone().props=[];g.s.party=[];Object.assign(g.hero,{x:500,y:500,skills:Array(8).fill(1),mp:1000,maxMp:1000});const e=g.makeEnemy({species:'goblin',name:'Target',level:1,hp:10000,damage:8,gold:1,xp:1},{x:570,y:500});g.zone().enemies.push(e);g.effects=[];return {g,e};};
for(const cls of ['paladin','mage','ranger'])for(const slot of [5,7,8]){if(cls==='ranger'&&slot===7)continue;const {g,e}=arena(cls);assert(g.cast(slot,e.id));const visuals=FX.queue(g.effects,g),effect=visuals.find(f=>f.type==='ability');assert(effect,cls+' slot '+slot+' expresses its area action');assert.equal(effect.radius,slot===5?350:500);assert.equal(effect.class,cls);}
for(const [cls,slot,effect]of [['mage',2,'frost'],['ranger',7,'piercing-shot']]){const {g,e}=arena(cls);assert(g.cast(slot,e.id));assert.equal(g.s.projectiles[0].effect,effect);g.updateProjectiles(1);assert(FX.queue(g.effects,g).some(f=>f.type==='contact'&&f.effect===effect),'projectile carries identity into contact');}
const {g}=arena('mage');g.s.party=[g.unit('archer',350,500)];g.hero.hp*=.5;assert(g.rangerSupport('health'));const heal=FX.queue(g.effects,g).find(f=>f.type==='heal');assert.equal(heal.x,g.hero.x);assert.equal(heal.y,g.hero.y);assert.equal(g.effects.find(e=>e.type==='heal').fromX,350);
g.s.party.push(g.unit('soldier',550,500));g.s.party.forEach(u=>u.hp*=.5);g.hero.gold=100;g.effects=[];assert(g.treatCompanions());const restored=FX.queue(g.effects,g).filter(f=>f.type==='heal');assert.equal(restored.length,2);for(const f of restored){const u=g.s.party.find(u=>u.id===f.target);assert.equal(f.x,u.x);assert.equal(f.y,u.y);}
const impacts=FX.queue([{type:'hit',x:1,y:2},{type:'projectileImpact',x:1,y:2,style:'stone'}],g);assert.equal(impacts.length,1);assert.equal(impacts[0].type,'contact');
let busy=FX.queue([{type:'spell',class:'mage',slot:5,radius:350,x:0,y:0},{type:'heal',target:'hero'}],g);busy=FX.queue(Array.from({length:100},(_,j)=>({type:'hit',x:j,y:j})),g,busy);assert.equal(busy.length,40);assert(busy.some(f=>f.type==='ability'));assert(busy.some(f=>f.type==='heal'));
console.log('PASS normal abilities, projectile contacts, recipient recovery and bounded high-priority cues');

const source=fs.readFileSync(__dirname+'/../src/prototype/app.js','utf8'),drawSource=source.slice(source.indexOf('function visualPhase'),source.indexOf('function frame'));
function recordContext(w,h){let depth=0;const methods=[],ctx=new Proxy({canvas:{width:w,height:h},measureText:text=>({width:text.length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(target,key){if(key in target)return target[key];return (...args)=>{for(const value of args)if(typeof value==='number')assert(Number.isFinite(value),'finite canvas '+key);if(key==='save')depth++;if(key==='restore'){depth--;assert(depth>=0);}methods.push([key,...args]);};},set(target,key,value){target[key]=value;return true;}});return {ctx,methods,depth:()=>depth};}
for(const id of [...C.data.regions.map(r=>r.id),...C.dungeonIds])for(const w of [375,900]){
 const game=new C();game.enter(id);const before=JSON.stringify(game.s),h=650,{ctx,depth}=recordContext(w,h),layers=[],wallCalls=[];
 const visuals={...V,atmosphere(...args){layers.push('atmosphere');V.atmosphere(...args);},dungeonArchitecture(...args){wallCalls.push(args[2]);V.dungeonArchitecture(...args);}},combat={...FX,ground(...args){layers.push(args[3]);FX.ground(...args);}};
 const scope={game,canvas:{width:w,height:h},ctx,screen:e=>({x:w*.6+(e.x-e.y-game.hero.x+game.hero.y)*.76,y:h*.5+(e.x+e.y-game.hero.x-game.hero.y)*.27}),Campaign:C,PrototypeVisuals:visuals,PrototypeCombatVisuals:combat,performance:{now:()=>16000},visualFx:[],chargePresentation:()=>null,paused:false,focused:true,document:{hidden:false},worldLabelVisible:()=>true};vm.createContext(scope);vm.runInContext(drawSource,scope);scope.draw();assert.equal(depth(),0,id+' canvas state balanced');assert.equal(JSON.stringify(game.s),before,id+' render does not alter campaign');assert.deepEqual(layers,['fill','atmosphere','cue']);if(C.dungeonIds.includes(id))assert.deepEqual(wallCalls,[id],'every main dungeon draws exact walls');
}
for(const id of C.dungeonIds){const layout=V.dungeonLayout(id,1470);assert(layout.partitions.length);const edges=V.dungeonEdges(id,1470);assert(edges.length);for(const [a,b]of edges){const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy),left={x:mid.x-dy/n*.1,y:mid.y+dx/n*.1},right={x:mid.x+dy/n*.1,y:mid.y-dx/n*.1},inFloor=p=>layout.walkable.some(({bounds:[x1,x2,y1,y2]})=>p.x>x1&&p.x<x2&&p.y>y1&&p.y<y2);assert.notEqual(inFloor(left),inFloor(right),'footprint edge borders floor and void, never an overlapping-room seam');}}
console.log('PASS desktop/mobile rendering is pure, complete and protects cues after atmosphere; dungeon edges follow the exact floor union');
