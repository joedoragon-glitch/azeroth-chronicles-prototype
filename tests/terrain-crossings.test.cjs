'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine'),R=require('../src/prototype/rules');
let crossings=0;
for(const region of C.data.regions){
 const c=new C();c.enter(region.id);c.zone().props=[];const {bounds:[a,b,l,h],gaps}=R.barriers[c.regionIndex()];
 let bankY=l+45;assert(c.blocked((a+b)/2,bankY,c.zoneId,0),region.id+' channel blocks off-bridge movement');
 for(const [lo,hi]of gaps){
  const y=(lo+hi)/2;
  assert(c.clearSegment({x:a-35,y},{x:b+35,y}),region.id+' complete bridge width stays open');
  assert(c.blocked((a+b)/2,lo+5),region.id+' crossing edge allows actor clearance');
  for(const reverse of [false,true]){const actor={x:reverse?b+35:a-35,y},target={x:reverse?a-35:b+35,y};for(let j=0;j<200&&Math.abs(actor.x-target.x)>2;j++)c.follow(actor,target,300,.1,1);assert(Math.abs(actor.x-target.x)<2,region.id+' bridge traversal '+reverse);}
  crossings++;
 }
 const saved=C.restore(c.snapshot());assert(saved.blocked((a+b)/2,bankY,saved.zoneId,0));for(const [lo,hi]of gaps)assert(!saved.blocked((a+b)/2,(lo+hi)/2),region.id+' old save crossing unchanged');
}
assert.equal(crossings,9);
console.log('PASS all nine crossings in both directions, visible-bank collision clearance and restored saves');
