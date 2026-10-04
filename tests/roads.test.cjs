'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine.js');
let routes=0;
for(const region of Campaign.data.regions){const c=new Campaign();c.enter(region.id);const z=c.zone();for(const path of z.roads){for(let j=1;j<path.length;j++){assert(c.clearSegment(path[j-1],path[j]),region.id+' road intersects collision');const a=path[j-1],b=path[j],d=Math.hypot(b.x-a.x,b.y-a.y);for(let n=0;n<=d;n+=10){const p={x:a.x+(b.x-a.x)*n/d,y:a.y+(b.y-a.y)*n/d};assert(!z.props.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<q.r+40),region.id+' road edge obstructed');}}
 for(const reverse of [false,true]){const points=reverse?[...path].reverse():path;c.hero.x=points[0].x;c.hero.y=points[0].y;const target=points.at(-1);delete c.hero.path;c.hero.routeAge=0;for(let frame=0;frame<1800&&Math.hypot(c.hero.x-target.x,c.hero.y-target.y)>25;frame++)c.follow(c.hero,target,300,.1,20);assert(Math.hypot(c.hero.x-target.x,c.hero.y-target.y)<=25,region.id+' route stalls '+JSON.stringify(target));routes++;}
 }
 const s=c.snapshot();delete s.zones[region.id].roadVersion;s.zones[region.id].roads=[];s.hero.gold=777;const restored=Campaign.restore(s);assert.equal(restored.hero.gold,777);assert.equal(restored.zone().roadVersion,3);assert(restored.zone().roads.length);}
// A clear destination across an obstructed cell edge must never create a route through it.
const c=new Campaign();c.zone().props.push({id:'test-obstacle',x:350,y:350,r:24,icon:'🪨'});const a={x:300,y:350},b={x:400,y:350},path=c.route(a,b);let prev=a;assert(path.length);for(const p of path){assert(c.clearSegment(prev,p));prev=p;}const actor={...a};for(let n=0;n<200;n++)c.follow(actor,b,300,.1,10);assert(Math.hypot(actor.x-b.x,actor.y-b.y)<=10+1e-6);
console.log('PASS '+routes+' main-road journeys in both directions, clear road edges, legacy-road migration and obstacle-edge movement');
