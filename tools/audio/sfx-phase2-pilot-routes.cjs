'use strict';
// Observation-only Phase 2 audition selector. Never imported by Campaign or audio facade.
// These committed receipts come from real game owners; the previews are NOT registered.
const byId=new Set([
  'rogue-bell-basic','rogue-bell-emphatic','mage-orb-release','thorn-tripwire',
  'charmed-wraith-heritage','lifebinder-cold-ring','quest-complete','barracks-complete'
]);
function identify(event){
  if(!event||typeof event!=='object')return null;
  let id=null, existing=null, owner=null, policy=null;
  if(event.class==='rogue' &&
     ['rogueBellBasic','rogueBellSkill1','rogueBellPerformance'].includes(event.type)){
    const emphasized=event.form==='charged'||(event.type==='rogueBellBasic'&&event.combo===3);
    id=emphasized?'rogue-bell-emphatic':'rogue-bell-basic';
    existing='Rogue procedural bell shell/rattle';
    owner='audio-hero.js:heroSkillEffect Rogue branch';
    policy='replace_when_warm_else_synthesize';
  }else if(event.type==='heroSkillCast'&&event.class==='mage'&&
    event.slot===1&&event.automaticBasic===true&&event.charged!==true){
    id='mage-orb-release';existing='hero arcane combo procedural foley';
    owner='audio-hero.js:heroSkillEffect / hero-combat.js committed automatic basic';
    policy='replace_one_release_not_contact';
  }else if(event.type==='petSkill'&&event.petFamily==='thorn'&&
    event.slot===2&&event.stage==='release'){
    id='thorn-tripwire';existing='generic companion skill cast; petSkill currently visual-only';
    owner='party-pets.js:petSkillEvent; explicit one-owner replacement required';
    policy='replace_generic_cast_on_commit_no_impact_assumption';
  }else if(event.type==='spell'&&event.actor==='companion'&&
    event.kind==='charmHeritage'&&event.species==='wraith'){
    id='charmed-wraith-heritage';existing='one magicCast from spell';
    owner='audio-effects.js:soundKind spell/charmHeritage';
    policy='replace_generic_spell_not_extra_charmHeritage_voice';
  }else if(event.type==='enemyVfx'&&event.family==='crypt'&&
    event.skillId==='boss/crypt/4'&&event.stage==='release'){
    id='lifebinder-cold-ring';existing='material enemyRelease + personality motif';
    owner='enemy-vfx-events.js + audio-enemy.js, skillId-specific recorded binding';
    policy='replace_release_but_keep_global_critical_warning_no_hp_impact';
  }else if(event.type==='questComplete'){
    id='quest-complete';existing='questComplete note plus subsequent quest note';
    owner='rewards.js:checkQuests paired questComplete/quest';
    policy='one_success_sound_silence_legacy_quest_duplicate';
  }else if(event.type==='construction'){
    id='barracks-complete';existing='construction note';
    owner='party.js:construction only at committed build completion';
    policy='replace_only_finished_barracks_confirmation';
  }
  if(!id||!byId.has(id))return null;
  return Object.freeze({id,existing,owner,policy});
}
module.exports={identify,byId};
