'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const menus=require('../src/prototype/strategist-lab-menus.js');
function setup(locale='en'){
  let current, closed=false, notices=[],lang=locale;
  const lab={id:'strategist-lab-5',kind:'strategist-field-lab',zoneId:'vale',
    x:100,y:100,progress:4,windmill:false};
  const g={
    hero:{class:'strategist',gold:200,x:100,y:100},
    s:{zone:'vale',rescued:{archive:false},strategistAcidBottles:0,party:[]},
    fieldLab(zone){return zone==='vale'?lab:null;},
    fieldLabCanManage(zone){return zone==='vale'&&this.hero.class==='strategist';},
    fieldLabs(){return [{zoneId:'vale',lab}];},
    fieldLabNetwork(){return {
      alchemyRank:0,
      samples:{water:0,wood:0,mineral:0,fire:0},
      products:{waterReagent:0,woodEssence:0,mineralCatalyst:0,fireElixir:0},
      jobs:{},
    };},
    fieldLabWorkerLimit(){return 1;},
    fieldLabStorageLimit(){return 36;},
    fieldLabStockCount(){return 0;},
    fieldLabConfig(){return {rankCrowns:[60,90,130],maxRank:3,trainingCrowns:20,windmillCrowns:75};},
    trainFieldLabWorker(){return false;},
    fieldLabWorkerEligible(){return false;},
    upgradeFieldLabWindmill(){this.s.strategistAcidBottles=0;lab.windmill=true;return true;},
    learnAdvancedLabAlchemy(){return false;},
    setFieldLabProductionPriority(){return true;},
  };
  const ui=menus.create({
    getGame:()=>g, language:()=>lang,
    action:(label,callback,description,disabled)=>({label,callback,description,disabled}),
    openMenu:(title,description,actions,back)=>{current={title,description,actions,back};},
    closeMenu:()=>{closed=true;},
    status:(s)=>notices.push(s),
  });
  return {ui,g,lab,get screen(){return current;},get closed(){return closed;},
    get notices(){return notices;}, setLanguage(v){lang=v;}};
}
test('bilingual menus show actual local/remote and central-stock state',()=>{
  const s=setup('en');
  s.ui.openLab(s.lab); assert.match(s.screen.title,/Field Lab/);
  assert.match(s.screen.description,/36/);
  s.setLanguage('es');
  s.ui.openLab(s.lab); assert.match(s.screen.title,/laboratorios/);
  assert.match(s.screen.description,/Almacén/);
});
test('windmill button operates only through guarded Campaign action',()=>{
  const s=setup();
  s.ui.openLab(s.lab);
  s.screen.actions.find(a=>a.label.includes('Regional')).callback();
  s.screen.actions[0].callback();
  const button=s.screen.actions.find(a=>a.label.includes('Build windmill'));
  assert.ok(button);
  assert.equal(button.disabled,false);
  button.callback();
  assert.equal(s.lab.windmill,true);
  assert.ok(s.screen.actions.find(a=>a.label.includes('Build windmill')).disabled);
});
test('stale Lab or wrong class closes rather than dispatches a mutation',()=>{
  const s=setup();
  s.ui.openLab(s.lab);
  s.g.hero.class='paladin';
  assert.equal(s.ui.openLab(s.lab),undefined);
  assert.equal(s.closed,true);
  assert.equal(s.lab.windmill,false);
});
test('English/Spanish labels are complete for both languages',()=>{
  const keys=Object.keys(menus.LABELS.en).sort();
  assert.deepEqual(keys,Object.keys(menus.LABELS.es).sort());
  for(const key of keys)
    assert.ok(typeof menus.LABELS.en[key]==='string'&&menus.LABELS.es[key]);
});
