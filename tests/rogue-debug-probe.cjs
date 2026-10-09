'use strict';
const C=require('../src/prototype/engine.js');
const fresh=()=>new C('normal','paladin',()=>.9);
for(const [family,species] of [['warlord','orc'],['ridge','wolf']]){
 const c=fresh(),e=c.bossEnemy(c.boss(family),'normal',{x:1400,y:1700});
 c.zone().enemies=[e];c.s.party=[];e.aggro=true;c.line=()=>true;
 Object.assign(c.hero,{x:1530,y:1720,hp:10000,maxHp:10000});
 const squad=Array.from({length:4},(_,j)=>{const u=c.makeEnemy({species,name:'native troop',level:10,hp:200,damage:10,gold:0,xp:0},{x:1240+j*48,y:1640});u.pack='local-'+family;u.hp=j===0?200:0;u.deathPaid=j!==0;return u;});
 const summoned=c.makeEnemy({species,name:'owned summon',level:10,hp:200,damage:10,gold:0,xp:0},{x:1470,y:1600});
 summoned.summon=true;summoned.owner=e.id;
 c.zone().enemies.push(...squad,summoned);
 c.tacticalRogueOutnumbered=()=>true;
 const snap=()=>({summoned:summoned.hp,summonAggro:summoned.aggro,unit:squad.map(x=>({hp:x.hp,aggro:x.aggro})),n:c.zone().enemies.length,hero:c.hero.hp,events:c.s.statistics.events.slice(-4).map(x=>x.type)});
 console.log('F76',family,'pre',JSON.stringify(snap()));
 c.tacticalRogueMove(e,c.hero);console.log('F76',family,'move',JSON.stringify(e.telegraph));
 c.tacticalResolveRogueMove(e,e.telegraph);console.log('F76',family,'post',JSON.stringify(snap()));
}
{
 const c=fresh(),dust=c.makeEnemy({species:'goblin',name:'Dust slinger',level:2,hp:300,damage:10,gold:0,xp:0},{x:1400,y:1700}),
 other=c.makeEnemy({species:'skeleton',name:'uncovered foe',level:2,hp:300,damage:10,gold:0,xp:0},{x:1480,y:1700}),ally=c.unit('soldier',1460,1710);
 c.zone().enemies=[dust,other];c.s.party=[ally];c.s.time=45;c.line=()=>true;Object.assign(c.hero,{x:1450,y:1700,hp:1000,maxHp:1000});
 dust.aggro=true;other.aggro=true;c.tacticalRogueOutnumbered=()=>false;
 const snap=()=>({dust:dust.hp,dustMax:dust.maxHp,dustCover:dust.rogueDustCoverUntil,other:other.hp,otherMax:other.maxHp,heroCd:c.hero.cd[0],combo:c.basicComboStep,comboId:c.basicComboTargetId,partyFocus:[...c._tacticalPartyTargets||[]],events:c.s.statistics.events.slice(-4).map(x=>x.type)});
 console.log('F78 pre',JSON.stringify(snap()));
 c.tacticalRogueMove(dust,c.hero);c.tacticalResolveRogueMove(dust,dust.telegraph);console.log('F78 dust',JSON.stringify(snap()));
 c.updateParty(.1);console.log('F78 party',JSON.stringify(snap()));
 c.hero.cd[0]=0;let success=c.cast(1,dust.id);console.log('F78 cast',success,JSON.stringify(snap()));
}
