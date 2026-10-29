'use strict';
// Separate native critical releases for auto (including the third-hit finisher),
// manual Skill 1 tap, and manual Skill 1 charged. Rogue remains test-only.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin','mage','ranger']);
Campaign.classes.rogue = {...R.rogueHeroFoundation.stats, icon:'bell'};
Campaign.talentProfiles.rogue = {...R.rogueHeroFoundation.talents};
try {
  function arena() {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.party = [];
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    Object.assign(g.hero,{x:500,y:500,order:null});
    g.zone().props = [];
    g.zone().buildings = [];
    const primary = g.makeEnemy(
      {species:'goblin',name:'Primary',level:1,hp:100000,damage:0,gold:0,xp:0},
      {x:590,y:500});
    const secondary = g.makeEnemy(
      {species:'goblin',name:'Secondary',level:1,hp:100000,damage:0,gold:0,xp:0},
      {x:606,y:505});
    g.zone().enemies=[primary,secondary];
    return {g,primary,secondary};
  }
  function track(g) {
    const events = [], orig = g.damage;
    g.damage = function(e, amount, source, options) {
      events.push({id:e.id,amount,automatic:!!options?.automaticBasic});
      return orig.call(this,e,amount,source,options);
    };
    return events;
  }
  const original=arena(), powered=arena();
  const baseline=track(original.g), enhanced=track(powered.g);
  let rolls=0;
  const session=Native.createSession(Critical,Levels,{
    enabled:true,
    stream:{next(){rolls++;return 0;}},
  });
  powered.g._criticalPartyNative=session;
  assert.equal(session.criticalLevels().rogue,2);
  assert.equal(session.criticalLevels().hero,1);
  assert.equal(Levels.ACTIONS['hero/rogue/auto'].group,'rogue');
  assert.equal(Levels.ACTIONS['hero/rogue/1-tap'].lever,'damage');
  assert.equal(Levels.ACTIONS['hero/rogue/1-charged'].lever,'damage');
  assert.equal(rolls,0);
  for(let hit=1; hit<=3; hit++) {
    original.g.hero.basicCd=0;
    powered.g.hero.basicCd=0;
    const start=baseline.length, other=enhanced.length;
    assert.equal(original.g.castMovementBasic(),true);
    assert.equal(powered.g.castMovementBasic(),true);
    assert.equal(rolls,hit,'one Party critical roll per auto basic, including finisher');
    const oldHits=baseline.slice(start),newHits=enhanced.slice(other);
    assert.equal(oldHits.length,newHits.length);
    for(let i=0;i<oldHits.length;i++) {
      assert.equal(oldHits[i].automatic,true);
      assert.equal(newHits[i].automatic,true);
      const earlierCadence = 1 +
        (hit - 1) * R.rogueHeroFoundation.basic.criticalCadence.basicDamage;
      assert(Math.abs(newHits[i].amount-oldHits[i].amount*1.2*earlierCadence)<1e-8,
        'one Level-2 critical applies to original damage, with only earlier critical cadence on later basics');
    }
  }
  const third=powered.g.effects.filter(e=>e.type==='rogueBellBasic').at(-1);
  assert.equal(third.combo,3,'third hit stays automatic combo, not a manual song');
  assert(!powered.g.effects.some(e=>e.type==='rogueBellSkill1'));
  assert.equal(powered.g.hero.cd[0],0,'auto basic does not spend manual Skill 1 CD');
  for(const charged of [false,true]) {
    original.g.hero.cd[0]=0;
    powered.g.hero.cd[0]=0;
    const start=baseline.length,other=enhanced.length;
    const charmBefore=powered.g.s.rogueCharmRng;
    assert.equal(original.g.cast(1,original.primary.id,charged),true);
    assert.equal(powered.g.cast(1,powered.primary.id,charged),true);
    assert.equal(rolls,charged?5:4,'tap and charged Skill 1 each get own release');
    assert.equal(powered.g.s.rogueCharmRng,charmBefore,
      'manual Skill 1 never makes automatic-primary Charm attempt');
    const oldHits=baseline.slice(start),newHits=enhanced.slice(other);
    assert.equal(oldHits.length,newHits.length);
    assert(oldHits.length>=1);
    for(let i=0;i<oldHits.length;i++){
      assert.equal(oldHits[i].automatic,false);
      assert.equal(newHits[i].automatic,false);
      assert(Math.abs(newHits[i].amount-oldHits[i].amount*1.2)<1e-8,
        'one skill critical scales existing AoE only, not extra contacts');
    }
  }
  assert.deepEqual(
    powered.g.effects.filter(e=>e.type==='rogueBellSkill1').map(e=>e.form),
    ['tap','charged']);
  const noRolls=rolls;
  assert.equal(powered.g.cast(1,powered.primary.id,true),false);
  powered.g.hero.basicCd=100;
  assert.equal(powered.g.castMovementBasic(),false);
  assert.equal(rolls,noRolls,'failed/unready commands never consume critical RNG');
  assert.doesNotThrow(()=>Campaign.validate(powered.g.snapshot()));
  for(const cls of ['paladin','mage','ranger']) {
    const g=new Campaign('normal',cls,()=>0.9);
    assert.equal(g._criticalPartyNative,undefined);
  }
  console.log('PASS Rogue auto + 3rd finisher, Skill 1 tap and charged: Level-2 independent native critical releases, no extra Charm or RNG');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
