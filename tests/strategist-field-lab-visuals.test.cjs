'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const visual=require('../src/prototype/strategist-field-lab-visuals.js');
function ctx(){
  const calls=[];
  const surface=new Proxy({calls},{set(target,key,value){target[key]=value;calls.push([key,value]);return true;}});
  for(const method of ['save','restore','fillRect','beginPath','moveTo','lineTo','closePath','fill','stroke','arc','translate','rotate'])
    surface[method]=(...args)=>{calls.push([method,...args]);};
  return surface;
}
test('five regions use different physically drawn Lab material palettes',()=>{
  const drawings=[];
  for(const zone of ['vale','march','highlands','frontier','crown']){
    const c=ctx();
    const lab={kind:'strategist-field-lab',zoneId:zone,progress:4,windmill:false};
    assert.equal(visual.body(c,lab,zone),true);
    drawings.push(c.calls.filter(x=>x[0]==='fillStyle').map(x=>x[1]).join('|'));
    assert.equal(visual.rotor(c,lab,zone,1),false);
  }
  assert.equal(new Set(drawings).size,5);
});
test('windmill rotor changes on game simulation clock only',()=>{
  const lab={kind:'strategist-field-lab',zoneId:'vale',progress:4,windmill:true};
  const first=ctx(),second=ctx();
  visual.rotor(first,lab,'vale',0);
  visual.rotor(second,lab,'vale',0.5);
  const rotations=c=>c.calls.filter(x=>x[0]==='rotate').map(x=>x[1]);
  assert.notDeepEqual(rotations(first),rotations(second));
  assert.equal(visual.rotorFrame(0.5),visual.rotorFrame(0.5));
  assert.equal(visual.rotorFrame(NaN),0);
  assert.equal(lab.rotorPhase,undefined,'renderer may not modify saved state');
});
test('unfinished Labs or non-Labs never render powered rotors',()=>{
  const c=ctx(), baseline=c.calls.length;
  assert.equal(visual.rotor(c,{kind:'strategist-field-lab',zoneId:'march',progress:1,windmill:true},'march',10),false);
  assert.equal(visual.body(c,{kind:'barracks',zoneId:'march',progress:4},'march'),false);
  assert.equal(c.calls.length,baseline,'rejected visuals issue no paint operations');
});
