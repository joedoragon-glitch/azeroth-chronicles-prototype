'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Campaign=require('../src/prototype/engine.js');
const Workforce=require('../src/prototype/strategist-lab-workforce.js');
const Codec=require('../src/prototype/strategist-lab-save.js');
const actors=Workforce.install(Campaign);
const point=u=>({x:u.x,y:u.y});
function create(){
  const g=new Campaign('normal','paladin',()=>0.57);
  const u=g.s.party[0];
  assert.ok(u&&u.active!==false&&u.hp>0);
  g.hero.class='strategist'; // Dormant test-only guard; NOT class registration.
  g.hero.gold=5000;
  g.s.strategistAcidBottles=0;
  g.fieldLabNetwork?.(true);
  u.fieldLabTrained=true;
  return {g,u};
}
test('active native companion is authenticated only in its real currently loaded region',()=>{
  const {g,u}=create();assert.equal(actors.owned(g,u),true);
  const got=actors.authenticatedLocation(g,u);
  assert.deepEqual(got,{zoneId:g.s.zone,point:point(u),kind:'active'});
  assert.equal(actors.authenticatedLocation(g,{...u}),null,'matching ID is not an owned object');
  g.s.party.push({...u});assert.equal(actors.authenticatedLocation(g,u),null,'duplicate IDs are not authority');
  g.s.party.pop();
  u.expeditionId='expedition';assert.equal(actors.authenticatedLocation(g,u),null);
  delete u.expeditionId;
  u.keeperHeld=true;assert.equal(actors.authenticatedLocation(g,u),null);
  delete u.keeperHeld;
  u.order={type:'build',id:'barracks-1'};assert.equal(actors.authenticatedLocation(g,u),null);
});
test('actual native Rest stamps specific region and position; old unproved reserve is refused',()=>{
  const {g,u}=create(),home=g.zoneId,original=point(u);
  assert.equal(g.restCompanion(u.id),true);
  assert.equal(u.active,false);
  assert.deepEqual(u.strategistLabRest,{zoneId:home,...original});
  assert.deepEqual(actors.authenticatedLocation(g,u),{
    zoneId:home,point:original,kind:'native-rest'});
  g.s.zone='march';g.zone();
  assert.equal(actors.authenticatedLocation(g,u)?.zoneId,home,
    'off-region worker keeps actual original zone, not current map');
  u.strategistLabRest.x+=10;
  assert.equal(actors.authenticatedLocation(g,u),null,'moved/forged rest point denied');
  delete u.strategistLabRest;
  assert.equal(actors.authenticatedLocation(g,u),null,'legacy reserve has no place of origin');
});
test('native Barracks activation replaces stale reserve provenance without teleporting the Lab worker',()=>{
  const {g,u}=create();
  assert.equal(g.restCompanion(u.id),true);
  const b={id:'barracks-987',x:u.x+80,y:u.y+90,kind:'barracks',progress:4};
  g.zone().buildings.push(b);
  assert.equal(g.activateCompanion(u.id,b.id),true);
  assert.equal(u.strategistLabRest,undefined);
  assert.equal(u.active,true);
  assert.equal(actors.authenticatedLocation(g,u)?.kind,'active');
});
test('reserve receipts must be exact v4 attestations, never orphaned or cross-region guesses',()=>{
  const lab={id:'strategist-lab-3',kind:'strategist-field-lab',name:'Field Lab',
    zoneId:'vale',x:400,y:400,progress:4,workSeconds:20,
    windmill:false,processSeconds:0};
  const state={
    version:4,time:20,hero:{class:'strategist'},challenge:{succession:false,fallen:[]},
    party:[{id:'ally-1',type:'soldier',x:350,y:350,hp:100,active:false,
      order:null,fieldLabTrained:true,
      strategistLabRest:{zoneId:'vale',x:350,y:350}}],
    zones:Object.fromEntries(['vale','march','highlands','frontier','crown'].map(id=>
      [id,{id,buildings:id==='vale'?
        [{id:'barracks-2',kind:'barracks',x:200,y:200},lab]:[]} ])),
    strategistAcidBottles:0,strategistLabEconomy:{
      foundedByStrategist:true,alchemyRank:0,
      samples:{water:0,wood:0,mineral:0,fire:0},
      products:{waterReagent:0,woodEssence:0,mineralCatalyst:0,fireElixir:0},
      jobs:{},
    },
  };
  const copy=()=>JSON.parse(JSON.stringify(state));
  assert.equal(Codec.validate(copy()),true);
  for(const mutate of [
    x=>x.party[0].strategistLabRest.zoneId='march',
    x=>x.party[0].strategistLabRest.x+=30,
    x=>x.party[0].active=true,
    x=>x.party[0].order={type:'build',id:'barracks-2'},
    x=>x.party[0].fieldLabTrained=false,
    x=>x.party[0].strategistLabRest.unknown=true,
    x=>x.hero.class='paladin',
  ]){const x=copy();mutate(x);assert.throws(()=>Codec.validate(x));}
  const orphan=copy();delete orphan.strategistLabEconomy;
  assert.throws(()=>Codec.validate(orphan),/orphan data/);
});
test('normal four-class Rest does not mint a Strategist receipt',()=>{
  for(const kind of ['paladin','mage','ranger']){
    const g=new Campaign('normal',kind,()=>0.57);
    const u=g.s.party[0];
    if(!u)continue;
    u.fieldLabTrained=true;
    g.restCompanion(u.id);
    assert.equal(u.strategistLabRest,undefined);
  }
});
