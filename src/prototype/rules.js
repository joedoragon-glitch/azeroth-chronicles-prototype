/* Explicit authored mechanics. Names and prose never determine gameplay behavior. */
(function(root){
'use strict';
const attack=(kind,warning,recovery,extra={})=>({kind,warning,recovery,coefficient:1,...extra});
const attacks={
 thorn:[attack('cone',.8,.8),attack('circle',1.3,1.5,{landing:true,coefficient:1.4}),attack('line',1.2,1,{slow:true}),attack('summon',1.5,1.5,{species:'wolf',ranged:false})],
 crypt:[attack('cone',1,1),attack('volley',1.2,1.4),attack('summon',1.6,1.4,{species:'skeleton',ranged:false}),attack('circle',1.6,1.4,{persistent:true,manaDrain:.05})],
 mire:[attack('cone',.9,1),attack('line',1.4,1.5,{charge:true,coefficient:1.4}),attack('circle',1.5,1.4,{count:3,persistent:true,slow:true}),attack('summon',1.6,1.5,{species:'mireling',ranged:false})],
 archive:[attack('cone',1.1,1),attack('line',1.5,1.5,{count:2,manaDrain:.08}),attack('circle',1.5,1.5,{slow:true,persistent:true,manaDrain:.04}),attack('summon',1.7,1.5,{species:'wraith',ranged:true})],
 ridge:[attack('cone',1,1),attack('circle',1.5,1.5,{coefficient:1.4}),attack('line',1.5,2,{charge:true,coefficient:1.4}),attack('summon',1.8,1.5,{species:'archer',ranged:true})],
 mine:[attack('circle',1.6,2.5,{coefficient:1.4,opening:2.5}),attack('circle',1.7,1.5,{count:3,coefficient:1.4}),attack('ring',1.6,1.6),attack('line',1.7,3,{charge:true,coefficient:1.4,opening:3}),attack('summon',1.8,1.5,{species:'ogre',ranged:false})],
 warlord:[attack('cone',1.2,1.5,{combo:true}),attack('circle',1.8,1.5,{count:2}),attack('summon',1.8,1.5,{species:'orc',ranged:false}),attack('line',1.6,2.5,{charge:true,coefficient:1.4})],
 abyss:[attack('cone',1.5,1.5,{manaDrain:.08}),attack('ring',1.7,1.6,{manaDrain:.10}),attack('circle',1.8,2,{count:2,sequential:true,landing:true,coefficient:1.4}),attack('summon',2,1.6,{species:'ashbeast',ranged:false})],
 citadel:[attack('circle',1.6,3,{coefficient:1.4,opening:3}),attack('line',1.8,1.6,{count:2,manaDrain:.08}),attack('line',1.8,2.5,{charge:true,advance:true,coefficient:1.4}),attack('circle',2,1.5,{count:3,sequential:true,persistent:true,manaDrain:.10}),attack('summon',1.9,1.5,{species:'crownguard',ranged:true})],
 darklord:[attack('cone',1.3,1.5,{combo:true,manaDrain:.08}),attack('circle',1.9,1.6,{count:3,sequential:true,manaDrain:.10}),attack('summon',2,1.6,{species:'crownguard',ranged:true}),attack('sector',2,2,{sequential:true,count:3,manaDrain:.12})]
};
const sites=[
 [['bridge-north','Mill bridge',1200,750],['bridge-south','Southern footbridge',1200,1750],['orchard','Abandoned orchard',1050,740],['den-ruins','Orchard den ruins',800,1280],['mill-pond','Mill pond',710,1260],['cache','Woodland supply cache',1550,1150]],
 [['night-site','Lantern shore',1700,900],['wagon','Stranded supply wagon',1000,1150],['watch','Causeway watch platform',1700,1300],['dock','Sunken dock',2050,1800]],
 [['bridge-north','Stone bridge',1300,950],['bridge-south','Timber crossing',1300,1870],['lookout','Highland lookout',1800,600],['ore','Stonecross ore vein',1100,650],['tower','Ruined watchtower',1900,800]],
 [['bridge-north','Guarded ravine bridge',1450,750],['bridge-south','Burned forest crossing',1450,2160],['shrine','Ruined shrine',1100,1080],['overlook','Ravine overlook',1350,1800],['checkpoint','Occupied checkpoint',1750,1400],['convoy','Supply convoy',1200,950]],
 [['bridge-north','Lava ridge bridge',1350,1000],['bridge-south','Southern stone crossing',1350,2400],['foundry','Ruined foundry',850,1800],['shelf','Crystal shelf',1100,2100],['siege','Siege camp',2250,1850],['fortress-gate','Dark fortress gate',2350,2450]]
];
// Explicit destinations for supplies and finite worker expeditions. No town nodes.
const expeditions=[
 {resource:'cache',supplies:['orchard','den-ruins','cache'],name:'Woodland timber'},
 {resource:'wagon',supplies:['wagon','watch','dock'],name:'Salvaged provisions'},
 {resource:'ore',supplies:['ore','lookout','tower'],name:'Stonecross ore'},
 {resource:'shrine',supplies:[],name:'Shrine salvage'},
 {resource:'foundry',supplies:['foundry','shelf','siege'],name:'Foundry crystals'}
];
// Two quest supplies are stored inside a nearby building; the first stays outdoors.
const supplyRooms=[
 {id:'supply-vale',region:'vale',site:'orchard',name:'Orchard watchtower cellar',objective:'Recover one orchard crate and two from the watchtower cellar'},
 {id:'supply-march',region:'march',site:'wagon',name:'Stranded wagon hold',objective:'Recover one wagon bundle and two from its guarded hold'},
 {id:'supply-highlands',region:'highlands',site:'ore',name:'Quarry storehouse',objective:'Recover one quarry bundle and two from the storehouse'},
 {id:'supply-crown',region:'crown',site:'foundry',name:'Foundry storeroom',objective:'Recover one foundry cache and two from the storeroom'}
];
const miniPlans=[
 {field:'Orchard den stockade',resource:'Woodland cache ruins',theme:'stockade'},
 {field:'Mirejaw island redoubt',resource:'Stranded wagon enclosure',theme:'palisade'},
 {field:'Mountain watchtower yard',resource:'Abandoned quarry works',theme:'stonewall'},
 {field:'Warlord checkpoint',resource:'Ruined shrine courtyard',theme:'stonewall'},
 {field:'Dark fortress courtyard',resource:'Ruined foundry works',theme:'stonewall'}
];
const quest=(kind,target,sites=[])=>({kind,target,sites});
const quests=[
 quest('rescue','thorn'),quest('patrol',5),quest('bundles',3),quest('rescue','crypt'),quest('sites',null,['bridge-north','port']),quest('sites',null,['den-ruins','bridge-south']),
 quest('rescue','mire'),quest('patrol',6),quest('rescue','archive'),quest('bundles',3),quest('night',2,['night-site']),quest('sites',null,['port']),
 quest('rescue','ridge'),quest('patrol',7),quest('rescue','mine'),quest('bundles',3),quest('sites',null,['bridge-north','bridge-south']),quest('sites',null,['port']),
 quest('rescue','warlord'),quest('escort'),quest('rescue','abyss'),quest('patrol',8),quest('sites',null,['shrine','minor','overlook']),quest('sites',null,['port']),
 quest('rescue','citadel'),quest('patrol',8),quest('rescue','darklord'),quest('bundles',3),quest('sites',null,['foundry','shelf','siege']),quest('sites',null,['fortress-gate'])
];
for(const [index,family]of [[0,'thorn'],[6,'mire'],[12,'ridge'],[18,'warlord'],[26,'darklord']])quests[index].clear='field-'+family;
// The renderer and collision engine share these exact boundaries and crossing gaps.
const barriers=[
 {kind:'water',bounds:[1160,1240,60,2300],gaps:[[660,840],[1660,1840]]},
 {kind:'water',bounds:[1120,1690,1450,2070],gaps:[[1710,1850]]},
 {kind:'ravine',bounds:[1250,1350,120,2400],gaps:[[860,1100],[1770,1980]]},
 {kind:'ravine',bounds:[1400,1510,200,2450],gaps:[[630,870],[2070,2250]]},
 {kind:'lava',bounds:[1300,1410,300,2810],gaps:[[850,1150],[2260,2510]]}
];
const terrain=[
 [{x:630,y:1320,r:125}],[],[{x1:520,x2:650,y1:430,y2:1050}], [{x1:1740,x2:1810,y1:1020,y2:1220}], [{x1:2110,x2:2190,y1:2000,y2:2720,gaps:[[2260,2520]]}]
];
const dungeonWalls={crypt:[710,780,[[480,680],[870,1060]]],archive:[650,730,[[400,620],[980,1200]]],mine:[800,870,[[480,730],[1020,1250]]],abyss:[610,690,[[600,830],[1040,1260]]],citadel:[750,830,[[430,680],[900,1150]]]};
const pillars={crypt:[[430,620],[1010,480]],archive:[[420,740],[1060,620]],mine:[[480,950],[1120,380]],abyss:[[420,530],[980,890]],citadel:[[400,750],[1080,450]]};
const guardPosts=[[350,430],[490,700],[420,1030],[990,420],[1110,680],[1000,900],[1000,1200],[550,1190],[900,240],[1250,480],[380,850],[1190,950],[560,390]];
const dungeonTraps={
 crypt:[[520,470,'spikes'],[630,610,'spikes'],[1020,540,'spikes'],[930,850,'seal'],[1080,1010,'spikes'],[1190,1210,'seal'],[360,560,'spikes'],[520,900,'seal'],[860,370,'spikes'],[840,1080,'spikes'],[1240,700,'seal'],[830,1230,'spikes']],
 archive:[[500,430,'jet'],[560,680,'seal'],[770,520,'jet'],[900,720,'seal'],[1040,470,'jet'],[1150,890,'jet'],[1030,1040,'seal'],[1200,1220,'jet'],[330,560,'seal'],[480,970,'jet'],[820,330,'seal'],[830,1080,'jet'],[1240,620,'seal'],[1280,780,'jet'],[850,1260,'seal'],[360,1180,'jet']],
 mine:[[500,500,'spikes'],[640,750,'spikes'],[930,600,'spikes'],[1030,370,'jet'],[600,1030,'spikes'],[1040,840,'jet'],[1270,980,'spikes'],[1060,1190,'spikes'],[900,1210,'seal'],[360,650,'spikes'],[520,880,'jet'],[700,420,'seal'],[730,1150,'spikes'],[960,480,'seal'],[1180,560,'jet'],[1260,720,'spikes'],[720,1320,'jet'],[430,1210,'seal']],
 abyss:[[440,450,'jet'],[560,690,'jet'],[770,740,'seal'],[980,460,'jet'],[440,950,'seal'],[900,940,'jet'],[1120,800,'jet'],[1250,1020,'seal'],[1040,1220,'jet'],[1290,1190,'jet'],[330,650,'seal'],[420,790,'jet'],[520,1120,'jet'],[760,460,'seal'],[800,900,'jet'],[940,650,'seal'],[1180,560,'jet'],[1270,700,'seal'],[820,1240,'jet'],[1320,860,'jet']],
 citadel:[[500,450,'spikes'],[660,530,'jet'],[870,610,'seal'],[1030,430,'jet'],[530,850,'seal'],[650,1060,'spikes'],[940,1010,'jet'],[1100,790,'seal'],[1300,960,'jet'],[1020,1210,'spikes'],[1270,1190,'seal'],[930,750,'jet'],[340,430,'spikes'],[470,680,'seal'],[520,1180,'jet'],[650,780,'spikes'],[690,1240,'seal'],[890,390,'jet'],[980,520,'spikes'],[1190,520,'seal'],[1260,680,'jet'],[850,900,'spikes'],[880,1220,'seal'],[1320,820,'spikes']]
};
// Curated occupied spaces: each dungeon has an entrance, work/ritual zone, command markers and a boss approach.
const dungeonDecor={
 crypt:[[300,330,'torch'],[430,330,'torch'],[350,520,'coffin'],[470,520,'coffin'],[350,660,'coffin'],[470,660,'coffin'],[580,780,'bones'],[620,850,'bones'],[930,320,'banner'],[1120,320,'banner'],[980,480,'torch'],[1220,480,'torch'],[930,980,'coffin'],[1040,1040,'bones'],[1180,980,'coffin'],[1000,1190,'torch'],[1280,1190,'torch'],[1110,1240,'banner'],[1300,1240,'banner'],[870,820,'bones']],
 archive:[[300,330,'torch'],[500,330,'torch'],[330,520,'shelf'],[330,650,'shelf'],[520,520,'shelf'],[520,650,'shelf'],[900,340,'banner'],[1080,340,'banner'],[930,520,'shelf'],[1160,520,'shelf'],[850,760,'water'],[1040,760,'water'],[1220,760,'water'],[890,930,'rune'],[1120,930,'rune'],[980,1120,'torch'],[1240,1120,'torch'],[1070,1230,'shelf'],[1260,1230,'shelf'],[720,850,'rune']],
 mine:[[280,330,'torch'],[480,330,'torch'],[300,530,'crate'],[410,530,'crate'],[520,530,'crate'],[650,760,'rail'],[650,860,'rail'],[650,960,'rail'],[930,330,'crystal'],[1080,330,'crystal'],[1230,330,'crystal'],[960,600,'banner'],[1200,600,'banner'],[970,820,'crate'],[1080,820,'crate'],[1190,820,'crate'],[960,1050,'crystal'],[1180,1050,'crystal'],[1080,1220,'torch'],[1280,1220,'torch']],
 abyss:[[300,340,'torch'],[500,340,'torch'],[350,560,'chain'],[500,560,'chain'],[820,360,'banner'],[1060,360,'banner'],[930,570,'ember'],[1120,570,'ember'],[850,780,'chain'],[1080,780,'chain'],[1250,780,'chain'],[860,960,'ember'],[1060,960,'ember'],[1260,960,'ember'],[900,1140,'banner'],[1180,1140,'banner'],[980,1240,'torch'],[1260,1240,'torch'],[700,850,'chain'],[1140,860,'torch']],
 citadel:[[300,330,'torch'],[500,330,'torch'],[340,520,'armor'],[500,520,'armor'],[900,340,'banner'],[1120,340,'banner'],[870,560,'rune'],[1000,650,'rune'],[1130,560,'rune'],[860,820,'armor'],[1140,820,'armor'],[900,980,'banner'],[1120,980,'banner'],[940,1130,'rune'],[1080,1130,'rune'],[980,1240,'torch'],[1240,1240,'torch'],[1260,600,'armor'],[780,1020,'banner'],[1260,1020,'banner']]
};
const dungeonTrapTuning={
 crypt:{cycle:6.8,warning:1.4,active:.8,damage:.11,radius:44,sealRadius:60,jetLength:150,jetHalfWidth:30,slow:2.5,offset:1.10},
 archive:{cycle:6.4,warning:1.35,active:.85,damage:.12,radius:45,sealRadius:62,jetLength:165,jetHalfWidth:31,slow:2.75,offset:1.05},
 mine:{cycle:6.0,warning:1.30,active:.90,damage:.135,radius:47,sealRadius:64,jetLength:175,jetHalfWidth:32,slow:3.0,offset:1.00},
 abyss:{cycle:5.7,warning:1.25,active:.95,damage:.15,radius:49,sealRadius:66,jetLength:185,jetHalfWidth:33,slow:3.25,offset:.95},
 citadel:{cycle:5.4,warning:1.20,active:1.0,damage:.17,radius:51,sealRadius:68,jetLength:195,jetHalfWidth:34,slow:3.5,offset:.90}
};
const dungeonReinforcement={delay:18,targetFraction:.5,engagedLimit:3,minGroup:2,maxGroup:4,bossMinGroup:1,bossMaxGroup:2,spawnDistance:320};
const outdoorMiniTrapTuning={
 vale:dungeonTrapTuning.crypt,
 march:dungeonTrapTuning.archive,
 highlands:dungeonTrapTuning.mine,
 frontier:dungeonTrapTuning.abyss,
 crown:dungeonTrapTuning.citadel
};
const outdoorMiniTrapKinds={
 vale:['spikes','spikes'],
 march:['spikes','seal'],
 highlands:['spikes','jet'],
 frontier:['jet','seal'],
 crown:['jet','seal']
};
const rangedProfiles={goblin:{variant:'slinger',shotRange:240,shotSpeed:240,projectileStyle:'stone'},skeleton:{variant:'bow guard',shotRange:290,shotSpeed:280,projectileStyle:'arrow'},reedbeast:{variant:'spitter',hybrid:true,shotRange:250,shotSpeed:220,projectileStyle:'spit',projectileSlow:1.6},mireling:{variant:'spitter',hybrid:true,shotRange:230,shotSpeed:230,projectileStyle:'spit',projectileSlow:1.6},ogre:{variant:'stone thrower',hybrid:true,shotRange:260,shotSpeed:220,projectileStyle:'stone'},orc:{variant:'axe thrower',hybrid:true,shotRange:260,shotSpeed:250,projectileStyle:'axe'},ashbeast:{variant:'cinder spitter',hybrid:true,shotRange:270,shotSpeed:240,projectileStyle:'cinder'}};
const forests=[[[470,850,210,280],[1850,1050,250,320],[550,1800,260,180]],[[650,1650,240,200],[1950,1000,200,300],[2050,2300,230,170]],[[850,600,150,210],[1900,1500,240,350],[650,2100,230,200]],[[600,1300,250,250],[2100,1900,270,260],[1100,2300,200,160]],[[800,1100,230,250],[1850,1600,240,300],[2400,1050,170,200]]];
const teachers={thorn:{learn:[2],train:[1,2],maxRank:2},mire:{learn:[3,4,6],train:[1,2,3,4,6],maxRank:3},ridge:{learn:[5],train:[1,2,3,4,5,6],maxRank:4},warlord:{learn:[7],train:[1,2,3,4,5,6,7],maxRank:6},citadel:{learn:[8],train:[1,2,3,4,5,6,7,8],maxRank:8}};
const expeditionSupportSkills={
 sharedTraining:{name:'Shared Training',trainers:{mire:1,ridge:2,warlord:3,citadel:4},maxRank:4,costs:[0,150,250,400,600],detail:'Companions inherit talent-derived HP and damage.'},
 sharedStrength:{name:'Shared Strength',trainers:{crypt:4,mine:4,abyss:4,darklord:4},maxRank:4,costs:[0,250,400,600,850],detail:'Companions inherit other bonus HP and damage plus armor-tier and reforge defense bonuses.'}
};
const progression={ordinaryXpMultiplier:.5,levelGapRewards:[1,.75,.4,.1,0]};
const ordinaryMeleeScaling=[{hp:1.25,damage:1.15},{hp:1.4,damage:1.25},{hp:1.65,damage:1.4},{hp:1.9,damage:1.6},{hp:2.2,damage:1.8}];
const ordinaryRangedScaling=[{hp:1.05,damage:1.0},{hp:1.10,damage:1.05},{hp:1.20,damage:1.10},{hp:1.35,damage:1.20},{hp:1.55,damage:1.35}];
const guardianLegacyScaling=[{hp:1.15,damage:1.1},{hp:1.3,damage:1.2},{hp:1.5,damage:1.3},{hp:1.7,damage:1.45},{hp:1.9,damage:1.6}];
const guardianScaling=[{hp:1.65,damage:1.35},{hp:1.85,damage:1.5},{hp:2.15,damage:1.65},{hp:2.45,damage:1.85},{hp:2.85,damage:2.1}];
const awakenedGuardianScaling={hp:1.35,damage:1.25};
const summonScaling=[{hp:1.35,damage:1.15},{hp:1.5,damage:1.25},{hp:1.7,damage:1.4},{hp:1.9,damage:1.55},{hp:2.2,damage:1.75}];
const bossSummoning={normalCap:3,trueCap:6,normalCooldown:7,trueCooldown:5.5,pressureFloor:2,overrides:{warlord:{normalCap:4,trueCap:8,minions:6,captains:2}}};
const bossBehavior={
 thorn:{close:[0],far:[1,2],heroTarget:[1,2],phasePreferred:[2,1],combos:[{from:2,to:1,phase:'low',chance:.45}]},
 crypt:{close:[0],far:[1,3],heroTarget:[1,3],phasePreferred:[3,1],combos:[{from:3,to:1,phase:'low',chance:.45}]},
 mire:{close:[0],far:[1,2],heroTarget:[1,2],phasePreferred:[2,1],combos:[{from:2,to:1,phase:'low',chance:.45}]},
 archive:{close:[0],far:[1,2],heroTarget:[1,2],phasePreferred:[2,1],combos:[{from:2,to:1,phase:'low',chance:.45}]},
 ridge:{close:[0],far:[1,2],heroTarget:[1,2],phasePreferred:[1,2],combos:[{from:1,to:2,phase:'low',chance:.45}]},
 mine:{close:[0,2],far:[1,3],heroTarget:[1,3],phasePreferred:[2,1],combos:[{from:2,to:1,phase:'low',chance:.45}]},
 warlord:{close:[0],far:[1,3],heroTarget:[1,3],phasePreferred:[2,1,3],combos:[{from:2,to:0,phase:'low',chance:.45},{from:1,to:3,phase:'low',chance:.35}]},
 abyss:{close:[0,1],far:[2],heroTarget:[2],phasePreferred:[0,1,2],combos:[{from:0,to:1,phase:'low',chance:.4},{from:2,to:3,phase:'low',chance:.35}]},
 citadel:{close:[0],far:[1,2,3],heroTarget:[1,2,3],phasePreferred:[1,2,4],combos:[{from:1,to:2,phase:'low',chance:.45}]},
 darklord:{close:[0,3],far:[1,2,3],heroTarget:[0,1,3],phasePreferred:[3,1,2],combos:[{from:1,to:0,phase:'high',chance:.4}]}
};
const trueBossSummons={cap:6,minions:4,captains:2,minionScaling:{hp:1.5,damage:1.25},families:{
 thorn:{species:'wolf',ranged:false},crypt:{species:'skeleton',ranged:false},
 mire:{species:'mireling',ranged:false},archive:{species:'wraith',ranged:true},
 ridge:{species:'archer',ranged:true},mine:{species:'ogre',ranged:false},
 warlord:{species:'orc',ranged:false},abyss:{species:'ashbeast',ranged:false},
 citadel:{species:'crownguard',ranged:true},darklord:{species:'crownguard',ranged:true}
}};
const ringleaderScaling={hp:2.5,damage:1.5,pursuit:1.2,frenzyThreshold:.5,frenzyCooldown:.6,frenzyAim:.75};
const nightEnemyCombat={
 wraith:{hp:2.4,damage:1.8,skillCooldown:4.8,warning:.85,radius:210,coefficient:1.15,slow:2.5,heal:.08,manaDrain:.12},
 stalker:{hp:2.6,damage:2.0,skillCooldown:4.2,warning:.7,radius:78,coefficient:1.6,pounceSpeed:560,slow:3}
};
const manaBalance={
 perLevel:5,
 regen:{combat:1,outOfCombat:2.5,talentCombat:.25,talentOutOfCombat:.5},
 rankCostGrowth:.08,
 mageRecovery:{base:22,perRank:3},
 rangedDrain:{wraith:.06,ashbeast:.04}
};
const autoPotionThresholds={health:.35,mana:.35};
// Boss telegraphs stay readable, but idle gaps are short and basic attacks only interrupt sustained special pressure occasionally.
const bossCadence={specialRecoveryMultiplier:.25,basicCooldown:.75,skillsPerBasic:4,specialRange:560};
const rangedEnemyCombat={projectileMultiplier:1.7,aimTime:.35,cooldown:1.15,retreatFraction:.5,retreatSpeed:165,ringleaderRetreatMultiplier:1.2,ringleaderHybridMeleeRange:100,guardianScreenRange:220};
// Flip Mage or Ranger independently if movement attacks prove too strong in playtests.
const movementBasicClasses={paladin:true,mage:true,ranger:true};
const R={bossCadence,bossSummoning,bossBehavior,rangedEnemyCombat,ordinaryMeleeScaling,ordinaryRangedScaling,guardianLegacyScaling,guardianScaling,awakenedGuardianScaling,summonScaling,trueBossSummons,ringleaderScaling,nightEnemyCombat,manaBalance,dungeonTrapTuning,dungeonReinforcement,outdoorMiniTrapTuning,outdoorMiniTrapKinds,dungeonDecor,autoPotionThresholds,movementBasicClasses,enemyProjectileMultiplier:1.15,progression,supplyRooms,miniPlans,expeditions,teachers,expeditionSupportSkills,rangedProfiles,guardPosts,dungeonTraps,forests,attacks,sites,quests,barriers,terrain,dungeonWalls,pillars};
if(typeof module!=='undefined')module.exports=R;else root.PrototypeRules=R;
})(typeof window!=='undefined'?window:globalThis);
