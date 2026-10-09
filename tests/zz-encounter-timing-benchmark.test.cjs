'use strict';
// Reproducible, non-gating combat simulation: executes the real Campaign.tick,
// movement, summons, class skills, companion AI, tactics, potions and damage rules.
// All cases isolate the named encounter after its approach has been cleared.
// Deliberately does not grant extra levels or companions above the region's stage.
const C=require('../src/prototype/engine');
const D=C.data, dt=0.1, limit=180;
const regions={
  vale:{level:4,weapon:0,companions:3,capRank:2,rank:2,slots:[1,2]},
  march:{level:7,weapon:1,companions:3,capRank:3,rank:3,slots:[1,2,3,4,6]},
  highlands:{level:10,weapon:1,companions:4,capRank:4,rank:4,slots:[1,2,3,4,5,6]},
  frontier:{level:13,weapon:2,companions:5,capRank:5,rank:5,slots:[1,2,3,4,5,6,7]},
  crown:{level:16,weapon:3,companions:5,capRank:5,rank:6,slots:[1,2,3,4,5,6,7]},
};
const bosses=[
  ['thorn','vale',2,0,1],['crypt','vale',3,0,2],
  ['mire','march',3,1,2],['archive','march',3,1,3],
  ['ridge','highlands',3,1,3],['mine','highlands',4,1,4],
  ['warlord','frontier',4,2,4],['abyss','frontier',5,2,5],
  ['cindermaw','crown',5,3,6],['citadel','crown',5,3,6],
  ['darklord','crown',6,4,8],
];
const captains=[
  ['supply-vale','vale',3,0,2],['supply-march','march',3,1,3],
  ['supply-highlands','highlands',4,1,4],
  ['frontier-overseer','frontier',5,2,5],
  ['supply-crown','crown',5,3,6],
];
const preparation=(c,region,partyCount,weapon,skillRank,id)=>{
 const preset=regions[region],hero=c.hero;
 c.xp(60*preset.level*(preset.level-1));
 c.s.expeditionRank=Math.max(1,Math.min(6,partyCount===6?6:partyCount===5?5:partyCount===4?4:partyCount===3?2:1));
 const distribution=[0,2,0,2,0,2,3,1,2,3,1,3,2,1,3];
 for(const t of distribution){if(!hero.talentPoints)break;c.talent(t);}
 hero.weapon=weapon;hero.armorTier=weapon;
 const enabled=region==='vale'?(id==='thorn'?[1]:[1,2]):preset.slots;
 hero.skills=Array(8).fill(0);
 for(const slot of enabled) hero.skills[slot-1]=Math.min(skillRank,slot===8?2:slot===7?4:6);
 hero.hp=hero.maxHp;hero.mp=hero.maxMp;
 hero.gold=2500;
 const early=region==='vale';
 hero.potions.health=early?5:8;
 hero.potions.greater_health=early?0:6;
 hero.potions.mana=early?2:6;
 hero.potions.greater_mana=early?0:6;
 c.s.companionCombatTraining=early?1:2;
 c.s.companionVitalityRank=region==='vale'?0:region==='march'?1:2;
 c.s.expeditionSkills.sharedTraining=region==='vale'?0:region==='march'?1:2;
 c.s.expeditionSkills.sharedStrength=region==='vale'?0:region==='march'?0:1;
 c.syncCompanionLevelStats();
};
function chooseStart(c,e){
 const offsets=[[130,0],[-130,0],[0,145],[0,-145],[165,95],[-165,-95],[200,0],[-200,0]];
 for(const [x,y] of offsets){let p;try{p=c.safe(e.x+x,e.y+y);}catch(_){continue;}
   if(Math.hypot(p.x-e.x,p.y-e.y)>315)continue;
   if(c.route(p,e).length)return p;
 }
 return c.safe(e.x+190,e.y+90);
}
function run(id,region,count,weapon,rank,cls,form='normal',kind='boss',style='tactical'){
 const result={id,region,class:cls,level:regions[region].level,companions:count,form,kind,style};
 try{
   const c=new C('normal',cls,()=>.87);
   c.enter(kind==='captain'&&id!=='frontier-overseer'?id:region);
   preparation(c,region,count,weapon,rank,id);
   const z=c.zone(); let e=null;
   if(kind==='captain') e=z.enemies.find(u=>u.hp>0 && (id==='frontier-overseer'?u.fieldCaptain:u.roomCaptain));
   else {
     const def=D.bosses.find(b=>b.id===id);
     if(!def)throw Error('unknown boss');
     e=z.enemies.find(u=>u.type==='boss' && u.family===id && u.form==='normal' && u.hp>0);
     if(form==='true'){
       const home=e?.home || c.safe((D.fields[c.regionIndex()]||[1250,1050])[0],(D.fields[c.regionIndex()]||[1250,1050])[1]);
       e=c.bossEnemy(def,'true',{x:home.x,y:home.y});
     }else if(!e){
       const [x,y]=D.fields[c.regionIndex()] || [1250,1050];e=c.bossEnemy(def,'normal',c.safe(x,y));
     }
   }
   if(!e) throw Error('Missing encounter');
   z.enemies=[e];
   const start=chooseStart(c,e);Object.assign(c.hero,start);
   c.s.party=Array.from({length:count},(_,i)=>{
     const p=c.safe(start.x+(i%3)*34+42,start.y+Math.floor(i/3)*36+40);
     return c.unit(i%2?'archer':'soldier',p.x,p.y);
   });
   c.syncCompanionLevelStats();
   c.s.mercyTime=0;
   const initial={hp:e.hp,heroHp:c.hero.hp,partyHp:c.s.party.reduce((s,u)=>s+u.hp,0)};
   c.hero.order={type:'attack',id:e.id};
   c.engage(e);
   let t=0,dodgeUntil=0,dodgeMark=null,maxAdds=0,spent=0,skillUses=0,nextManualAt=0;
   while(t<limit&&e.hp>0&&c.s.statistics.deaths===0&&c.zoneId===z.id){
     const h=c.hero;
     const warnings=e.telegraph;
     if(style==='tactical' && warnings && warnings.kind!=='summon' && warnings!==dodgeMark && Math.hypot(h.x-e.x,h.y-e.y)<460){
       dodgeMark=warnings;
       const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;
       const ux=dy/d,uy=-dx/d;
       const destinations=[[h.x+ux*175,h.y+uy*175],[h.x-ux*175,h.y-uy*175],[h.x+(dx/d)*170,h.y+(dy/d)*170]];
       for(const [x,y] of destinations){let pos;try{pos=c.safe(x,y);}catch(_){continue;}if(Math.hypot(pos.x-e.x)>900||!c.route(h,pos).length)continue;h.order={type:'move',x:pos.x,y:pos.y};dodgeUntil=t+1.5;break;}
     }
     if((!warnings || t>=dodgeUntil)&&h.order?.type!=='attack'){h.order={type:'attack',id:e.id};dodgeMark=null;}
     if(h.hp>0){
       const additions=z.enemies.filter(u=>u.hp>0&&u.summon).length;
       maxAdds=Math.max(maxAdds,additions);
       // One deliberate keypress at most every 0.4 seconds. Basic attacks keep
       // their normal engine cooldown and may fire automatically through attack orders.
       if(t>=nextManualAt){
         let used=false;
         if(h.hp<h.maxHp*.58 && h.skills[2])used=c.cast(3,e.id);
         if(!used && h.hp<h.maxHp*.62 && h.skills[3])used=c.cast(4,e.id);
         if(!used && style!=='basic'){
           for(const slot of [8,7,6,5,2]){
             if(slot===5 && additions<2)continue;
             if(h.skills[slot-1]&&c.cast(slot,e.id)){used=true;break;}
           }
         }
         if(used){skillUses++;nextManualAt=t+0.4;}
       }
       if(h.hp<h.maxHp*.45)c.potion('health');
       if(h.mp<h.maxMp*.25)c.potion('mana');
     }
     c.tick(dt);t+=dt;
   }
   const survivors=c.s.party.filter(u=>u.hp>0).length;
   return {...result,name:e.name,seconds:+t.toFixed(1),outcome:e.hp<=0?'victory':c.s.statistics.deaths?'defeat':c.zoneId!==z.id?'retreat':'timeout',bossRemainingHp:Math.round(e.hp),bossInitialHp:Math.round(initial.hp),heroHp:Math.round(c.hero.hp),heroMaxHp:Math.round(initial.heroHp),survivingCompanions:survivors,peakAdds:maxAdds,skillCasts:skillUses,suppliesUsed:c.s.statistics.suppliesUsed};
 }catch(e){return {...result,outcome:'error',error:String(e.stack||e).slice(0,220)}}
}
// Main representative class for both normal and TRUE fights.
for(const [id,region,n,weapon,rank] of bosses){
  console.log('BOSS_BENCH '+JSON.stringify(run(id,region,n,weapon,rank,'paladin','normal')));
  console.log('BOSS_BENCH '+JSON.stringify(run(id,region,Math.min(n+1,id==='darklord'?6:regions[region].companions),weapon,rank,'paladin','true')));
}
for(const [id,region,n,weapon,rank] of captains)
 console.log('BOSS_BENCH '+JSON.stringify(run(id,region,n,weapon,rank,'paladin','normal','captain')));
for(const cls of ['mage','ranger']){
 for(const [id,region,n,weapon,rank] of bosses)
   console.log('BOSS_BENCH '+JSON.stringify(run(id,region,n,weapon,rank,cls,'normal')));
 for(const [id,region,n,weapon,rank] of captains)
   console.log('BOSS_BENCH '+JSON.stringify(run(id,region,n,weapon,rank,cls,'normal','captain')));
}
console.log('PASS scenario-driven level/party-limited campaign combat timing benchmark; inspect BOSS_BENCH lines for results');
