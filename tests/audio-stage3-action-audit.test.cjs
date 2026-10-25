'use strict';
// Stage 3: runtime gameplay receipts -> installed audio facade, never visual
// presence as a substitute for a scheduled source. Does not use audio hardware.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Audio = require('../src/prototype/audio.js');
const Art = require('../src/prototype/hero-presentation.js');
const Enemy = require('../src/prototype/enemy-presentation.js');
const coverage = require('../scripts/enemy-audio-coverage.cjs');
const manifest = require('../assets/audio/manifest.json');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function observe(receipts) {
  const a = new Audio(), rows = [];
  a.ctx = { currentTime: 1, state: 'running' };
  const sourceMethods = ['tone','sweep','noiseBurst','bowRelease','rapidBow',
    'steelImpact','magicLaunch','comboFinisher','heavyProjectile',
    'organicProjectile','beam','creatureImpact'];
  let sourceCount = 0;
  for (const name of sourceMethods)
    if (typeof a[name] === 'function') a[name] = () => { sourceCount++; };
  let requested = [];
  a.playSoundEvent = (key, details = {}) => {
    const bindings = manifest.director.events[key] || [];
    const matched = bindings.find((b) =>
      Object.entries(b.when || {}).every(([k, v]) => details[k] === v));
    requested.push({ key, bound: !!matched, asset: matched?.asset || null });
    // Cold playback is required to use synthesis immediately. The recorded
    // store's actual fetch/decoder behavior is tested in separate suites.
    return false;
  };
  for (const receipt of receipts) {
    a.ctx.currentTime += 0.11;
    const before = sourceCount;
    requested = [];
    a.effect(receipt);
    const procedural = sourceCount > before;
    let mode = procedural ? 'procedural' : 'no_source_observed';
    if (receipt.type === 'enemyVfx' && Enemy.route(receipt)?.mode === 'silent')
      mode = 'intentionally_silent';
    else if (receipt.presentationHandled || ['companionSkill','petSkill','hit','actionFailed',
      'attackPlacementFailed','skill1Tap','hawkRetreatInterrupted','heroDisplace'].includes(receipt.type))
      if (!procedural) mode = 'bookkeeping_or_owned_elsewhere';
    rows.push({type:receipt.type, stage:receipt.stage || receipt.phase || null,
      slot:receipt.slot || null, actor:receipt.actor || null, class:receipt.class || null,
      special:receipt.special || null, route:mode, candidates:requested.filter((v)=>v.bound)});
  }
  return rows;
}
const voiced = (rows) => rows.filter((x) => x.route === 'procedural').length;
const sum = (rows) => ({
  receipts: rows.length,
  procedural: voiced(rows),
  recordedCandidates: rows.filter((x)=>x.candidates.length).length,
  silence: rows.filter((x)=>x.route === 'intentionally_silent').length,
  bookkeeping: rows.filter((x)=>x.route === 'bookkeeping_or_owned_elsewhere').length,
  noSourceObserved: rows.filter((x)=>x.route === 'no_source_observed').length,
});
function heroArena(cls) {
  const g = new Campaign('normal', cls, () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  Object.assign(g.hero, {x:500,y:500,order:null,slow:0,immune:0});
  g.hero.skills = Array(8).fill(1);
  g.hero.cd = Array(8).fill(0);
  g.hero.hp = g.hero.maxHp / 2;
  const z = g.zone();
  z.props = [];z.buildings = [];z.npcs = [];
  const e = g.makeEnemy({species:'goblin', name:'Audio impact target',level:1,
    hp:100000,damage:20,gold:0,xp:0},{x:570,y:500});
  z.enemies = [e];
  g.s.party = [g.unit('soldier',520,500)];
  g.s.companionCombatTraining = 2;
  return {g,e};
}
const hero = [];
for (const cls of ['paladin','mage','ranger'])
  for (let slot=1;slot<=8;slot++)
    for (const charged of [false,true]) {
      const {g,e}=heroArena(cls);
      if (cls === 'mage' && slot === 3 && !charged)
        e.rangedAim={remaining:0.4,max:0.4,targetId:'hero'};
      assert(g.cast(slot,e.id,charged), cls + '/' + slot + '/' + charged + ': real cast must succeed');
      const cast = g.effects.find((x) => x.type === 'heroSkillCast' && x.slot === slot);
      assert(cast && cast.charged === charged);
      const receipts=[...g.effects];g.effects=[];
      for (let step=0;step<24;step++) {
        g.updateProjectiles(0.05);
        receipts.push(...g.effects);
        g.effects=[];
      }
      const rows=observe(receipts),metrics=sum(rows);
      assert(metrics.procedural>0, cls + '/' + slot + '/' + charged + ': no procedural source from real cast/flight/impact');
      hero.push({class:cls,slot,charged,skill:Art.profile(cast).name,...metrics,
        heardTypes:[...new Set(rows.filter((r)=>r.route==='procedural').map((r)=>r.type))],
        silentTypes:[...new Set(rows.filter((r)=>r.route==='bookkeeping_or_owned_elsewhere').map((r)=>r.type))]});
    }
console.log('PASS Stage 3 hero: 48 actual casts (3 classes × 8 skills × tap/charged) reach procedural source attempts');

// Real auto-combat with trained roster, including all eleven pet families.
function companionArena(type,family) {
  const g=new Campaign('normal','paladin',()=>0.9);
  completeFieldOpening(g); // unlock actual target admission before autonomous combat
  const z=g.zone();
  z.props=[];z.npcs=[];z.nodes=[];z.buildings=[];z.enemies=[];
  g.s.mercyTime=0;
  g.s.expeditionRank=6;
  g.s.companionCombatTraining=2;
  Object.assign(g.hero, g.safe(1500, 1500), { order: null });
  g.hero.skills[1]=1;
  if(family)g.s.normal[family]=g.s.true[family]=true;
  if(family==='darklord')g.s.phase='awakening';
  const u=g.unit(type,g.hero.x,g.hero.y,family);
  g.s.party=[u];
  let origin;
  for(const x of [400,900,1600,2200]) {
    for(const y of [400,900,1600,2200]) {
      if(g.blocked(x,y))continue;
      Object.assign(g.hero,{x,y});
      const p=g.partyFollowPoint(u);
      if([0,80,150,230,305,410].every(dx=>
        !g.blocked(p.x+dx,p.y)&&g.line(p,{x:p.x+dx,y:p.y}))) {
        origin=p;break;
      }
    }
    if(origin)break;
  }
  assert(origin,'unobstructed audio combat lane');
  Object.assign(u,origin);
  const ranged=type==='archer'||(type==='pet'&&g.petDefinition(u).role==='ranged');
  const e=g.makeEnemy({species:'goblin',name:'Audio training target',
    level:1,hp:100000,damage:0,xp:0,gold:0},
    {x:u.x+(ranged?230:55),y:u.y});
  z.enemies.push(e);
  return {g,u,e};
}
const companions=[];
for(const [type,family] of [
  ['soldier',null],['archer',null],
  ...Campaign.data.bosses.map((b)=>['pet',b.id]),
]) {
  // Match the actual persisted companion lifecycle used by roster regression:
  // real combat skills are rehydrated into the active game on restore.
  const {g: original}=companionArena(type,family);
  const g=Campaign.restore(original.snapshot(),()=>0.9);
  const u=g.s.party[0],e=g.zone().enemies[0];
  g.updateEnemies=()=>{};
  g.updateNight=g.updatePacks=g.updateGuardianReinforcements=g.updateElites=()=>{};
  assert(!g.awaitsHeroAttack(e), 'companion fixture must not be tutorial protected');
  assert(g.engage(e), 'companion fixture must enter a real encounter');
  // Preserve the established game's 100-tick autonomous skill acceptance
  // fixture; inspect its emitted receipts after the combat decision loop.
  for(let tick=0;tick<100;tick++) g.tick(0.05);
  const receipts=[...g.effects];
  assert(u.skill1Cd>0, type+'/'+family+': autonomous first skill (cd='+u.skill1Cd+', effects='+receipts.length+')');
  assert(u.skill2Cd>0, type+'/'+family+': autonomous second skill');
  const rows=observe(receipts),metrics=sum(rows);
  assert(metrics.procedural>0,type+'/'+family+': no combat source for actual action stream');
  companions.push({type,family,...metrics,
    heardTypes:[...new Set(rows.filter((r)=>r.route==='procedural').map((r)=>r.type))],
    bookkeepingTypes:[...new Set(rows.filter((r)=>r.route==='bookkeeping_or_owned_elsewhere').map((r)=>r.type))]});
}
console.log('PASS Stage 3 companions: Soldier, Archer and 11 boss-pet families use two autonomous skills with combat-source attempts');

// Actual boss attack resolvers (both forms, every authored attack index).
const bosses=[];
for(const b of Campaign.data.bosses)
  for(const form of ['normal','true']) {
    let total=0,audible=0,deliberate=0;
    for(let slot=0;slot<Campaign.rules.attacks[b.id].length;slot++) {
      const g=new Campaign('normal','paladin',()=>0.5);
      const z=g.zone();
      z.enemies=[];
      Object.assign(g.hero,{x:2400,y:1700,hp:100000,maxHp:100000});
      g.line=()=>true;
      const e=g.bossEnemy(g.boss(b.id),form,{x:1400,y:1700});
      z.enemies=[e];
      g.startAttack(e,{x:1480,y:1700},slot);
      g.resolveAttack(e);
      const receipts=g.effects.filter((x)=>x.type==='enemyVfx');
      assert(receipts.some((x)=>x.stage==='release'),b.id+'/'+form+'/'+slot);
      const rows=observe(receipts),metrics=sum(rows);
      total+=rows.length;audible+=metrics.procedural;deliberate+=metrics.silence;
      assert(metrics.procedural>0,b.id+'/'+form+'/'+slot+': no sound for actual boss release stages');
    }
    bosses.push({family:b.id,form,receipts:total,procedural:audible,silent:deliberate});
  }
const enemyCoverage=coverage.audit();
assert(enemyCoverage.identities>=172);
console.log('PASS Stage 3 enemies: boss/TRUE authored resolver stages retain audio paths; '+enemyCoverage.identities+' catalog identities and '+enemyCoverage.stageVariants+' stage variants cross-checked');

const result={
  schemaVersion:1,
  scope:'real engine action receipts -> cold fallback audio source attempts',
  limitations:'No actual speaker, codec, perceptibility or phone listening guarantee; repeated crowd throttles may suppress sources',
  counts:{heroForms:hero.length,companions:companions.length,
    bossForms:bosses.length,bossAttackReceipts:bosses.reduce((n,b)=>n+b.receipts,0),
    enemyIdentities:enemyCoverage.identities,enemyStageVariants:enemyCoverage.stageVariants},
  hero,companions,bosses,
};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
else console.log('PASS Stage 3 audio action audit '+JSON.stringify(result.counts));
