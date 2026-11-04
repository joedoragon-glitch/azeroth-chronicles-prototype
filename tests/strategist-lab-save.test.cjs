'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const codec = require('../src/prototype/strategist-lab-save.js');
const Campaign = require('../src/prototype/engine.js');
const copy = (obj) => JSON.parse(JSON.stringify(obj));
const field = () => {
  const worker = {
    id: 'ally-1', type:'soldier', x:100,y:100,hp:100,active:false,
    fieldLabTrained:true,fieldLabJob:'strategist-lab-3',
    order:{type:'strategist-field-lab',id:'strategist-lab-3'},
  };
  const lab = {
    id:'strategist-lab-3',kind:'strategist-field-lab',name:'Field Lab',
    zoneId:'vale',x:200,y:100,progress:4,workSeconds:20,
    windmill:true,productionPriority:'acid',processSeconds:0,
  };
  const zones = Object.fromEntries(['vale','march','highlands','frontier','crown']
    .map(x=>[x,{id:x,buildings:x==='vale' ? [
      {id:'barracks-2',kind:'barracks',x:10,y:10,progress:0}, lab] : []}]));
  const job = {
    workerId:worker.id,labId:lab.id,zoneId:'vale',position:{x:100,y:100},
    material:'wood',phase:'station',path:[{x:200,y:100}],waypoint:0,
    sampleLeft:0,carries:false,retryAt:50,target:null,sourceId:null,wasActive:false,
  };
  return {
    version:4,time:50,hero:{class:'strategist'},challenge:{succession:false,fallen:[]},
    party:[worker],zones,strategistAcidBottles:0,
    strategistLabEconomy:{
      foundedByStrategist:true,alchemyRank:0,
      samples:{water:0,wood:2,mineral:1,fire:0},
      products:{waterReagent:0,woodEssence:0,mineralCatalyst:0,fireElixir:0},
      jobs:{'ally-1':job},
    },
  };
};
test('valid future v4 Lab record round-trips without creating a second Acid wallet', () => {
  const raw = field(), encoded = JSON.stringify(raw), restored = JSON.parse(encoded);
  assert.equal(codec.validate(restored),true);
  assert.deepEqual(restored,raw);
  assert.equal(restored.strategistLabEconomy.fieldLabAcid,undefined);
});
test('old v4 state without Lab fields is optional and remains unchanged', () => {
  const s = { zones:{vale:{buildings:[]}},party:[{}] };
  assert.equal(codec.validate(copy(s)),false);
  const prev=copy(s);assert.deepEqual(s,prev);
});
test('reject cross-class injected wallet and unauthenticated succession claims', () => {
  const s=field();s.hero.class='paladin';
  assert.throws(()=>codec.validate(s),/hero provenance/);
  s.challenge.succession=true;
  assert.throws(()=>codec.validate(s),/hero provenance/);
  s.challenge.fallen=['strategist'];
  assert.equal(codec.validate(s),true,'verified future Succession basis only');
});
test('reject duplicated Labs, renamed fake Barracks and out-of-region source', () => {
  const s=field();
  s.zones.vale.buildings.push({...s.zones.vale.buildings[1],id:'strategist-lab-99'});
  assert.throws(()=>codec.validate(s),/Lab count/);
  s.zones.vale.buildings.pop();
  s.zones.vale.buildings[0].id='crown-barracks';
  assert.throws(()=>codec.validate(s),/building/);
  s.zones.vale.buildings[0].id='barracks-2';
  s.strategistLabEconomy.jobs['ally-1'].zoneId='march';
  assert.throws(()=>codec.validate(s),/assignment/);
});
test('reject negative, unlimited, duplicate or forged finite products', () => {
  for(const update of [
    s => s.strategistLabEconomy.samples.wood = -1,
    s => s.strategistLabEconomy.samples.wood = 99999,
    s => s.strategistLabEconomy.products.fireElixir = 40,
    s => s.strategistAcidBottles = 9999,
    s => s.strategistLabEconomy.products.fake = 1,
    s => s.strategistLabEconomy.foundedByStrategist = false,
    s => s.strategistLabEconomy.jobs['ally-1'].sourceId = 'faked',
  ]) {
    const s=field();update(s);assert.throws(()=>codec.validate(s));
  }
});
test('worker order, location, route, cost and receipt must agree with roster', () => {
  for(const update of [
    s => s.party[0].active = true,
    s => s.party[0].fieldLabJob = 'strategist-lab-500',
    s => s.party[0].order = null,
    s => s.party[0].hp = 0,
    s => s.party[0].expeditionId = 'resource-expedition-1',
    s => s.party[0].x = 600,
    s => s.strategistLabEconomy.jobs['ally-1'].path[0].y = NaN,
    s => s.strategistLabEconomy.jobs['ally-1'].waypoint = 20,
    s => s.strategistLabEconomy.jobs['ally-1'].retryAt = Infinity,
    s => s.strategistLabEconomy.jobs['ally-1'].phase = 'teleport',
  ]) {
    const s=field(); update(s); assert.throws(()=>codec.validate(s));
  }
});
test('native original four-class snapshot validation/restore unaffected by dormant codec', () => {
  Campaign.enableRoguePlaytest();
  for(const kind of ['paladin','mage','ranger','rogue']) {
    const g = new Campaign('normal',kind,()=>0.5);
    const original=g.snapshot();
    const validated=Campaign.validate(copy(original));
    assert.equal(validated.strategistLabEconomy,undefined);
    const restored=Campaign.restore(copy(original),()=>0.5);
    assert.equal(restored.hero.class,kind);
    assert.equal(restored.s.strategistLabEconomy,undefined);
    assert.deepEqual(g.snapshot(),original);
    const forged=copy(original);
    forged.strategistLabEconomy=copy(field().strategistLabEconomy);
    forged.strategistAcidBottles=0;
    forged.zones.vale.buildings.push(copy(field().zones.vale.buildings[1]));
    assert.throws(()=>Campaign.validate(forged),/Invalid (?:Field Lab save|Strategist Acid Bottle stock)/);
  }
});


test('valid E0 stock of 999 and 1000 does not consume Lab warehouse capacity', () => {
  for(const bottles of [999, 1000]) {
    const s=field();
    s.strategistAcidBottles=bottles;
    assert.equal(codec.validate(s, { maxBottles: 1000 }), true);
    assert.throws(() => codec.validate(s, { maxBottles: 36 }), /canonical Acid/);
  }
  const over=field();over.strategistAcidBottles=1001;
  assert.throws(()=>codec.validate(over, { maxBottles: 1000 }), /canonical Acid/);
});
