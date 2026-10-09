'use strict';
// Read-only fight benchmark on the real Campaign tick/combat/party code.
// No stat or AI stubs: only unrelated ambient enemies are excluded to isolate each named encounter.
const C = require('../src/prototype/engine.js');
const idSpecs = {
 thorn:     {level:3, party:2, weapon:0, skills:1},
 crypt:     {level:4, party:2, weapon:0, skills:2},
 mire:      {level:6, party:3, weapon:1, skills:2},
 archive:   {level:7, party:3, weapon:1, skills:4},
 ridge:     {level:9, party:3, weapon:1, skills:4},
 mine:      {level:10,party:4, weapon:1, skills:5},
 warlord:   {level:12,party:4, weapon:2, skills:5},
 abyss:     {level:13,party:5, weapon:2, skills:7},
 cindermaw: {level:15,party:5, weapon:3, skills:7},
 citadel:   {level:16,party:5, weapon:4, skills:7},
 darklord:  {level:16,party:6, weapon:4, skills:8},
 'supply-vale':      {level:4, party:2,weapon:0,skills:2},
 'supply-march':     {level:7, party:3,weapon:1,skills:4},
 'supply-highlands': {level:10,party:4,weapon:1,skills:5},
 'frontier-overseer':{level:12,party:4,weapon:2,skills:5},
 'supply-crown':     {level:16,party:5,weapon:3,skills:7},
};
const unlocked = s => {
 // The unlocks are the abilities available BEFORE each respective encounter.
 const active = s.skills;
 const arr = Array(8).fill(0);
 const allowed=[1,2,3,4,5,6,7,8].filter(n =>
   n===1 || (n===2 && active>=2) || ([3,4,6].includes(n) && active>=4) ||
   (n===5 && active>=5) || (n===7 && active>=7) || (n===8 && active>=8));
 for(const slot of allowed)arr[slot-1]=Math.min(1+Math.floor((s.level-1)/4),slot===1?4:3);
 return arr;
};
function prepare(c,s,target,style) {
 while(c.hero.level<s.level) c.xp(c.xpRequired());
 c.hero.gold=5000;
 c.hero.weapon=s.weapon;
 c.hero.armorTier=s.weapon;
 c.hero.reforges=s.weapon>=1?{['weapon:'+s.weapon]:true,['armor:'+s.weapon]:true}:{};
 c.hero.talentPoints=s.level-1;
 for (const stat of [0,2,0,2,0,1,0,2,0,3,1,2,1,0,3,1,2])
   c.talent(stat);
 c.hero.skills=unlocked(s);
 c.hero.hp=c.hero.maxHp;
 c.hero.mp=c.hero.maxMp;
 c.s.expeditionRank=({2:1,3:2,4:4,5:5,6:6})[s.party];
 c.s.companionCombatTraining=s.level>=8?2:1;
 c.s.expeditionSkills={sharedTraining:Math.min(3,Math.floor(s.level/5)),sharedStrength:Math.min(2,Math.floor(s.level/7))};
 c.syncCompanionLevelStats();
 const home=c.safe(target.x+(c.hero.class==='paladin'?-105:-245), target.y+12);
 Object.assign(c.hero,home);
 c.s.party=Array.from({length:s.party},(_,i)=> {
   const role=i%2===0?'soldier':'archer';
   const p=c.safe(home.x+(i%3)*25-25,home.y+60+Math.floor(i/3)*25);
   return c.unit(role,p.x,p.y);
 });
 c.s.recallActive=false;
 c.s.mercyTime=0;
 c.s.clock=50;
 c.hero.potions.health=s.level>=12?5:7;
 c.hero.potions.greater_health=s.level>=12?5:0;
 c.hero.potions.mana=8;
 c.hero.potions.greater_mana=s.level>=12?4:0;
 c.hero.order={type:'attack',id:target.id};
 c.engage(target);
}
function run(kind,id,heroClass='paladin',style='tactical',late=false) {
 const s=late?{level:18,party:6,weapon:4,skills:8}:idSpecs[id];
 const c=new C('normal',heroClass,()=>.9);
 let e;
 if (kind==='boss') {
   const def=C.data.bosses.find(b=>b.id===id);
   if(!def)throw Error('Missing boss '+id);
   if(late){c.s.phase='awakening';c.s.awakeningLevel=18;}
   if(id==='darklord'){c.s.rescued.cindermaw=true;c.s.rescued.citadel=true;}
   c.enter(def.kind==='dungeon'?def.id:def.region);
   const existing=c.zone().enemies.find(x=>x.type==='boss'&&x.family===id&&x.form==='normal');
   if(!existing)throw Error('Missing real boss spawn '+id);
   if(style==='true'||late) {
     e=c.bossEnemy(def,'true',{x:existing.x,y:existing.y});
   } else e=existing;
 } else {
   c.enter(id==='frontier-overseer'?'frontier':id);
   e=c.zone().enemies.find(x=>id==='frontier-overseer'?x.fieldCaptain:x.roomCaptain);
   if(!e)throw Error('Missing captain '+id);
 }
 // Remove nearby unrelated enemies, not the boss or its own later summons.
 c.zone().enemies=[e];
 prepare(c,s,e,style);
 const startingHp=e.hp,maxTime=late?420:(style==='true'?300:240);
 let seconds=0,frames=0,skilled=0,dodges=0,previousWarning=null;
 const step=.1;
 for(;seconds<maxTime&&e.hp>0&&c.hero.hp>0&&!c.s.challenge?.pending;frames++){
   if(c.hero.hp<c.hero.maxHp*.55)c.potion('health');
   if(c.hero.mp<c.hero.maxMp*.25)c.potion('mana');
   if(c.hero.hp<c.hero.maxHp*.7&&c.hero.skills[2]&&c.hero.cd[2]<=0)
      c.cast(3,e.id);
   // A prepared player's priority: strongest learned offense when available.
   if(style!=='basic'){
     for(const slot of [8,7,6,5,2,4]){
       if(!c.hero.skills[slot-1]||c.hero.cd[slot-1]>0)continue;
       // Avoid using the Paladin's point-blank skill from an unreachable distance.
       if(c.cast(slot,e.id))skilled++;
       break;
     }
   }
   const a=e.telegraph;
   if((style==='tactical'||style==='true')&&a&&a.kind!=='summon'&&a!==previousWarning){
     previousWarning=a;
     try {
       const theta=Math.atan2(c.hero.y-e.y,c.hero.x-e.x);
       const goal=a.kind==='cone'
         ? c.safe(e.x+Math.cos(theta)*240,e.y+Math.sin(theta)*240)
         : c.safe(c.hero.x+Math.cos(theta+Math.PI/2)*190,c.hero.y+Math.sin(theta+Math.PI/2)*190);
       c.hero.order={type:'move',...goal};
       dodges++;
     } catch(_) {}
   } else if(!a||style!=='tactical') {
     previousWarning=null;
     c.hero.order={type:'attack',id:e.id};
   }
   c.tick(step);
   seconds+=step;
 }
 const party=c.s.party.filter(u=>u.hp>0&&u.active!==false);
 const out={kind,id,name:e.name,class:heroClass,style,late,level:s.level,companions:s.party,
   weapon:s.weapon,skills:s.skills,baseHp:Math.round(startingHp),seconds:+seconds.toFixed(1),
   result:e.hp<=0?'WIN':c.hero.hp<=0?'DEFEAT':'TIMEOUT',
   bossHpLeft:Math.round(e.hp),heroHpLeft:Math.round(c.hero.hp),alliesLeft:party.length,
   potionsUsed:c.s.statistics.suppliesUsed||0,casts:skilled,dodges,
   summonsSeen:c.zone().enemies.filter(x=>x.summon).length};
 console.log('ENCOUNTER_BENCH '+JSON.stringify(out));
 return out;
}
let wins=0,runs=0;
for(const heroClass of ['paladin','mage','ranger']){
 for(const b of C.data.bosses){
   const result=run('boss',b.id,heroClass,'tactical',false);runs++;if(result.result==='WIN')wins++;
 }
 for(const id of ['supply-vale','supply-march','supply-highlands','frontier-overseer','supply-crown']){
   const result=run('captain',id,heroClass,'tactical',false);runs++;if(result.result==='WIN')wins++;
 }
}
for(const b of C.data.bosses){
 const result=run('boss',b.id,'paladin','true',false);runs++;if(result.result==='WIN')wins++;
}
for(const id of C.dungeonIds){
 const result=run('boss',id,'paladin','tactical',true);runs++;if(result.result==='WIN')wins++;
}
for(const id of ['thorn','mire','ridge','warlord','darklord']){
 const result=run('boss',id,'paladin','basic',false);runs++;if(result.result==='WIN')wins++;
}
console.log('ENCOUNTER_BENCH_SUMMARY '+JSON.stringify({runs,wins,failedOrTimedOut:runs-wins,note:'isolated named encounters with production enemy AI, summons, skills, mana, movement, healing and dungeon traps'}));
