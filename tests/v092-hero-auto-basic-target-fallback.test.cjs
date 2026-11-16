'use strict';
// Owner-approved v0.9.2: a manually selected enemy beyond BASIC range must
// not suppress lawful nearby passive fire. Selection/LOCK and manual skills
// remain directed at the chosen enemy. Engine-native, no game-save edits.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
Campaign.enableRoguePlaytest();

const classes = ['paladin', 'mage', 'ranger', 'rogue'];
const basicRanges = { paladin: 120, mage: 400, ranger: 450, rogue: 220 };
let checks = 0;
const close = (a,b,tolerance=1e-8) => assert(Math.abs(a-b)<=tolerance, a+' differs from '+b);

function arena(cls, distance = basicRanges[cls] + 25) {
  const g = new Campaign('normal', cls, () => 0.99);
  const z = g.zone();
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.mercyTime = 0;
  g.s.party = [];
  z.props = []; z.buildings = []; z.npcs = [];
  Object.assign(g.hero, { x:500, y:500, order:null, basicCd:0, immune:0, hp:1000, maxHp:1000 });
  g.hero.skills[0] = 1;
  const make = (name,x) => {
    const e = g.makeEnemy({ species:'goblin',name,level:1,
      hp:1000000,damage:0,gold:0,xp:0 }, {x,y:500});
    e.aggro = true;
    e.returning = false;
    e.home = {x:e.x,y:e.y};
    return e;
  };
  const near = make('Near legal defender',575);
  const far = make('Chosen distant enemy',500+distance);
  z.enemies = [near,far];
  // Do not let independent Rogue Charm remove a target during this selection test.
  g.rogueCharmAttempt = () => false;
  return {g,near,far};
}
function select(g,far,held) {
  g.manualHeroTargetId = far.id;
  g.manualHeroTargetZone = g.zoneId;
  g.manualHeroTargetLocked = held;
  g.s.heroTarget = far.id;
}
function insistSelection(g,far,held,label) {
  assert.equal(g.selectedHeroTarget()?.id,far.id,label+' selected enemy');
  assert.equal(g.manualHeroTargetId,far.id,label+' target id');
  assert.equal(g.manualHeroTargetLocked,held,label+' held flag');
  assert.equal(g.s.heroTarget,far.id,label+' UI/squad focus');
}
function ensurePrimaryBasic(g,near,far, label) {
  const nearHp=near.hp,farHp=far.hp;
  assert(g.castMovementBasic(),label+' passive has eligible near foe');
  assert(g.hero.basicCd>0,label+' basic timer begins only on success');
  assert.equal(g.basicComboTargetId,near.id,label+' basic actually aimed near');
  assert.equal(far.hp,farHp,label+' selected out-of-range foe untouched');
  if(['mage','ranger'].includes(g.hero.class))
    assert(g.s.projectiles.some(p=>p.source==='hero' && p.target===near.id && p.automaticBasic),
      label+' ranged projectile is aimed at nearby foe');
  else assert(near.hp<nearHp,label+' melee/bell damages nearby foe');
}
// The core regression is valid for both a selected target and a held LOCK.
for(const cls of classes)for(const held of [false,true]) {
  const {g,near,far}=arena(cls);
  select(g,far,held);
  ensurePrimaryBasic(g,near,far,cls+'/held='+held);
  insistSelection(g,far,held,'post auto basic');
  assert.equal(g.hero.order,null,'fallback never initiates pursuit');
  assert.equal(g.castMovementBasic(),false,'separate basic cooldown prevents double-attack');
  insistSelection(g,far,held,'post cooldown rejection');
  checks++;
}
// A selected foe takes priority again as soon as it genuinely returns to
// basic range, without cycling Target or losing the held lock.
for(const cls of classes)for(const held of [false,true]) {
  const {g,near,far}=arena(cls);
  select(g,far,held);
  ensurePrimaryBasic(g,near,far,'initial covering fire '+cls);
  g.hero.basicCd=0;
  far.x=g.hero.x+basicRanges[cls]-5;
  assert(g.castMovementBasic(),cls+' selects returned chosen enemy');
  assert.equal(g.basicComboTargetId,far.id,'original selection retakes basic priority');
  insistSelection(g,far,held,'returned target');
  checks++;
}
// Explicitly targeted automatic engine calls never silently retarget.
for(const cls of classes){
  const {g,near,far}=arena(cls);
  select(g,far,true);
  const nearHp=near.hp;
  assert.equal(g.cast(1,far.id,false,null,true),false,cls+' explicit target cannot redirect');
  assert.equal(g.hero.basicCd,0,'failed explicit basic never spends timer');
  assert.equal(near.hp,nearHp);
  insistSelection(g,far,true,'explicit basic request');
  checks++;
}
// Only OUT-OF-BASIC-RANGE selections permit this fallback; a blocked line
// inside range is still a deliberate target (no hidden LoS target switch).
for(const cls of classes){
  const {g,near,far}=arena(cls,basicRanges[cls]-10);
  select(g,far,true);
  const oldLine=g.line.bind(g),oldRanged=g.rangedLine.bind(g);
  g.line=(a,b)=>b===far?false:oldLine(a,b);
  g.rangedLine=(a,b)=>b===far?false:oldRanged(a,b);
  assert.equal(g.castMovementBasic(),false,cls+' in-range but obstructed lock is not replaced');
  assert.equal(g.hero.basicCd,0,'no cooldown for blocked line');
  insistSelection(g,far,true,'obstructed in range');
  checks++;
}
// Manual Skill 1 is still aimed at the distant selected enemy, establishes
// its legitimate approach order, then releases there without replacing LOCK.
for(const cls of ['paladin','mage','ranger'])for(const held of [false,true]){
  const {g,near,far}=arena(cls);
  select(g,far,held);
  ensurePrimaryBasic(g,near,far,'pre manual approach '+cls);
  const nearHp=near.hp;
  assert(g.cast(1,null,false),cls+' explicit manual skill starts approach');
  assert.equal(g.hero.order?.type,'skill-approach');
  assert.equal(g.hero.order.id,far.id);
  assert.equal(g.hero.cd[0],0,'approach does not consume skill prematurely');
  insistSelection(g,far,held,'queued skill approach');
  // A pending deliberate approach still suppresses cover fire.
  g.hero.basicCd=0;
  assert.equal(g.castMovementBasic(),false,'approach cannot be displaced by auto basic');
  g.updateEnemies=()=>{};g.updateParty=()=>{};g.updateProjectiles=()=>{};
  let released=false;
  for(let i=0;i<180;i++){
    g.tick(1/60);
    if(g.hero.cd[0]>0){released=true;break;}
  }
  assert(released,cls+' reaches and releases at the explicitly selected foe');
  assert.equal(near.hp,nearHp,'manual skill did not hit closer enemy');
  insistSelection(g,far,held,'manual skill released');
  checks++;
}
// Mage and Ranger Skill 2 can already reach a selected target beyond their
// shorter automatic basic reach. The new fallback must not alter that.
for(const cls of ['mage','ranger'])for(const held of [false,true]){
  const {g,near,far}=arena(cls);
  select(g,far,held);
  ensurePrimaryBasic(g,near,far,'pre ranged manual skill '+cls);
  g.hero.skills[1]=1;
  const nearHp=near.hp;
  assert(g.cast(2,null,false),cls+' manual Skill 2 fires at distant selection');
  assert.notEqual(g.hero.order?.type,'skill-approach');
  assert(g.hero.cd[1]>0,'manual Skill 2 spent own timer');
  assert(g.s.projectiles.some(p=>p.source==='hero' && p.target===far.id && p.slot===2),
    'manual projectile targets selected distant foe');
  assert.equal(near.hp,nearHp,'nearby fallback target is not silently promoted for Skill 2');
  insistSelection(g,far,held,'manual ranged skill');
  checks++;
}
// The Rogue's original self-centered performance must still not chase or
// redirect when the chosen enemy is outside performance range.
for(const held of [false,true]){
  const {g,near,far}=arena('rogue');
  select(g,far,held);
  ensurePrimaryBasic(g,near,far,'pre Rogue song');
  assert.equal(g.cast(1,null,false),false,'out-of-range Rogue song does not retarget near');
  assert.notEqual(g.hero.order?.type,'skill-approach','Rogue song never starts chase');
  insistSelection(g,far,held,'Rogue song declined');
  checks++;
}
// Existing status effects, Cooldown Training and expired selections remain
// unchanged by the fallback. Basic cooldown must still slow after impact.
for(const cls of classes){
  const {g,near,far}=arena(cls);
  g.hero.talents[1]=5;
  select(g,far,true);
  ensurePrimaryBasic(g,near,far,'training '+cls);
  close(g.hero.basicCd,g.basicSkillCooldown());
  const initial=g.hero.basicCd;
  assert(g.applySlow(g.hero,2),'Slow applies to active hero basic');
  assert(g.hero.basicCd>initial,'impact-time Slow debt remains active');
  const after=g.hero.basicCd;
  const recovered=g.cooldownRecoveryElapsed(g.hero,0.1);
  g.updateEnemies=()=>{};g.updateParty=()=>{};g.updateProjectiles=()=>{};
  g.tick(0.1);
  close(g.hero.basicCd,after-recovered);
  insistSelection(g,far,true,'post Slow');
  checks++;
}
for(const cls of classes){
  const {g,near,far}=arena(cls,1500);
  far.aggro=false;
  select(g,far,true);
  assert.equal(g.selectedHeroTarget(),null,'expired selection cleared by native boundary');
  assert(g.castMovementBasic(),'nearby auto still works after selection expires');
  assert.equal(g.manualHeroTargetId,null);
  checks++;
}
// No valid nearby target means no free cooldown and no illegal attack.
for(const cls of classes){
  const {g,near,far}=arena(cls);
  select(g,far,true);
  near.neutral=true;
  assert.equal(g.castMovementBasic(),false,'neutral nearby enemy not attacked');
  assert.equal(g.hero.basicCd,0);
  near.neutral=false;
  near.returning=true;
  assert.equal(g.castMovementBasic(),false,'retreating nearby enemy not attacked');
  assert.equal(g.hero.basicCd,0);
  near.returning=false;
  near.rogueDustCoverUntil=g.s.time+10;
  assert.equal(g.castMovementBasic(),false,'Dust-covered nearby enemy not attacked');
  assert.equal(g.hero.basicCd,0);
  insistSelection(g,far,true,'all targets invalid');
  checks++;
}
// Hero onboarding's deliberate first-hit condition remains authoritative.
for(const cls of classes){
  const {g,near,far}=arena(cls);
  g.s.valeFieldAwakened=false;
  g.s.thornHeroInitiated=false;
  select(g,far,true);
  assert(g.awaitsHeroAttack(near));
  assert.equal(g.castMovementBasic(),false,'tutorial hero-first protection cannot be bypassed');
  assert.equal(g.hero.basicCd,0);
  checks++;
}
console.log('PASS hero nearby fallback '+checks+
  ' four-class selected/held/return/explicit-target/LoS/manual-skill/Slow/field protections');
