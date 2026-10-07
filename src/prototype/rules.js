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
 cindermaw:[attack('cone',1.1,1.1,{coefficient:1.15}),attack('line',1.5,1.8,{charge:true,coefficient:1.45}),attack('circle',1.6,1.5,{count:3,persistent:true,coefficient:1.05}),attack('summon',1.8,1.5,{species:'ashbeast',ranged:false})],
 darklord:[attack('cone',1.3,1.5,{combo:true,manaDrain:.08}),attack('circle',1.9,1.6,{count:3,sequential:true,manaDrain:.10}),attack('summon',2,1.6,{species:'crownguard',ranged:true}),attack('sector',2,2,{sequential:true,count:3,manaDrain:.12})]
};
const sites=[
 [['bridge-north','Mill bridge',1200,750],['bridge-south','Southern footbridge',1200,1750],['orchard','Abandoned orchard',1050,740],['den-ruins','Old Orchard Cellars',540,2220],['mill-pond','Mill pond',780,1320],['cache','Woodland supply cache',1550,1150],['goblin-camp','Goblin roadside camp',520,1050]],
 [['bridge-lake','Lake causeway',1405,1780],['night-site','Lantern shore',1700,900],['wagon','Stranded supply wagon',1000,1150],['watch','Drowned Watchhouse',2550,1480],['mire-nests','Mire nesting bank',1940,1120]],
 [['bridge-north','Stone bridge',1300,950],['bridge-south','Timber crossing',1300,1870],['lookout','Old Signal Keep',2350,1500],['ore','Stonecross ore vein',1100,650],['wolf-den','Wolf hunting ground',520,1250],['ogre-hearth','Ogre hearth camp',1980,1820]],
 [['bridge-north','Guarded ravine bridge',1450,750],['bridge-south','Burned forest crossing',1450,2160],['shrine','Ruined Shrine',1050,1850],['overlook','Ravine overlook',1750,2050],['checkpoint','Occupied checkpoint',2600,1650],['convoy','Supply convoy',1050,600],['orc-bivouac','Orc roadside bivouac',1840,420]],
 [['bridge-north','Lava ridge bridge',1350,1000],['bridge-south','Southern stone crossing',1350,2400],['foundry','Ruined Foundry',1850,2700],['shelf','Crystal shelf',1250,2350],['siege','Siege camp',2700,2250],['fortress-gate','Dark fortress gate',3060,3040],['crown-barracks','Crown field barracks',3000,1180]]
];
// Companion labor recovers finite Dark Lord Tribute from outdoor sites. Exact amounts belong in barracks operations, not the world map.
const expeditions=[
 {resource:'cache',supplies:[],name:'Dark Lord Tribute'},
 {resource:'wagon',supplies:[],name:'Dark Lord Tribute'},
 {resource:'ore',supplies:[],name:'Dark Lord Tribute'},
 {resource:'convoy',supplies:[],name:'Dark Lord Tribute'},
 {resource:'siege',supplies:[],name:'Dark Lord Tribute'}
];
const tributeTotal=640;
const legacyResourceTotals={vale:180,march:360,highlands:600,frontier:850,crown:1200};
const tributePlans={
 vale:[
  {id:'orchard-stores',site:'orchard',amount:170,hidden:false,offset:[45,260],context:'confiscated orchard stores'},
  {id:'woodland-cache',site:'cache',amount:180,hidden:false,offset:[50,-250],context:'collector cache'},
  {id:'pond-strongbox',site:'mill-pond',amount:150,hidden:true,offset:[105,-65],context:'hidden tax strongbox'},
  {id:'bridge-toll',site:'bridge-north',amount:140,hidden:true,offset:[-180,250],context:'concealed bridge toll chest'}
 ],
 march:[
  {id:'wagon-levy',site:'wagon',amount:200,hidden:false,offset:[100,70],context:'seized provisions levy'},
  {id:'causeway-toll',site:'bridge-lake',amount:150,hidden:false,offset:[105,-85],context:'causeway toll stores'},
  {id:'watchhouse-cache',site:'mire-nests',amount:160,hidden:true,offset:[-120,90],context:'marsh collector cache'},
  {id:'lantern-cache',site:'night-site',amount:130,hidden:true,offset:[115,85],context:'hidden shore strongbox'}
 ],
 highlands:[
  {id:'ore-shipment',site:'ore',amount:220,hidden:false,offset:[105,80],context:'ore tribute shipment'},
  {id:'stone-toll',site:'bridge-north',amount:160,hidden:false,offset:[-105,95],context:'bridge toll stores'},
  {id:'timber-toll',site:'bridge-south',amount:130,hidden:true,offset:[105,95],context:'concealed crossing levy'},
  {id:'ogre-cache',site:'ogre-hearth',amount:130,hidden:true,offset:[120,-80],context:'stolen collector chest'}
 ],
 frontier:[
  {id:'convoy-tribute',site:'convoy',amount:220,hidden:false,offset:[-260,-220],context:'military tribute convoy'},
  {id:'ravine-toll',site:'bridge-north',amount:150,hidden:false,offset:[220,-180],context:'ravine toll stores'},
  {id:'forest-levy',site:'bridge-south',amount:150,hidden:true,offset:[115,95],context:'abandoned collector cart'},
  {id:'overlook-cache',site:'overlook',amount:120,hidden:true,offset:[115,-80],context:'hidden command strongbox'}
 ],
 crown:[
  {id:'siege-war-chest',site:'siege',amount:220,hidden:false,offset:[110,80],context:'siege war chest'},
  {id:'crystal-shipment',site:'shelf',amount:180,hidden:false,offset:[115,90],context:'crystal tribute shipment'},
  {id:'barracks-payroll',site:'crown-barracks',amount:140,hidden:true,offset:[-115,95],context:'Crown payroll stores'},
  {id:'southern-levy',site:'bridge-south',amount:100,hidden:true,offset:[115,95],context:'concealed southern levy chest'}
 ]
};
// Field-boss compounds sit away from the main town approach instead of sharing the central traffic band.
const fieldBossCenters=[
 [760,1750],
 [2180,1120],
 [2700,700],
 [2600,1650],
 [2200,1750]
];
// Remaining ordinary patrol packs are distributed across the wider countryside.
// Local-site patrols and mini-dungeon guards keep their authored positions.
const occupationAnchors=[
 [[520,1050],[430,2050],[980,2350],[1500,420],[1930,650],[2320,1050],[1820,2180],[2400,2380],[1510,920],[870,1420],[2450,1500],[1320,2480]],
 [[620,420],[620,2050],[980,2550],[1780,420],[2200,780],[2520,1250],[2480,2450],[1510,700],[2040,1160],[880,1320],[2720,1750],[1550,2700]],
 [[480,620],[520,1250],[610,2500],[980,2920],[1720,360],[2500,520],[2860,1180],[1980,1820],[2800,2500],[1700,2860],[3070,700],[3050,2050]],
 [[620,980],[650,1940],[930,2700],[1180,430],[1840,420],[2600,760],[2940,1580],[2500,2300],[1850,2860],[1020,1460],[3060,640],[3060,2460]],
 [[610,980],[690,2290],[1080,2900],[1690,430],[2310,650],[3000,1180],[2020,1810],[3070,2200],[2050,3140],[1040,1320],[3380,780],[3380,2850],[1200,3300]]
];
// Settlements use a deliberate ring: buildings define streets while the center stays readable for NPCs and labels.
const settlementLayouts={
 major:[
  [-250,-145,'house'],[-95,-255,'house'],[120,-260,'workshop'],[270,-145,'house'],
  [-265,150,'house'],[275,185,'house'],[-120,290,'workshop'],[120,300,'house'],[-300,245,'fence']
 ],
 minor:[
  [-185,-135,'house'],[180,-125,'house'],[-195,160,'house'],[190,165,'workshop'],[0,250,'house'],[250,220,'fence']
 ],
 majorLife:[
  [-165,-15,'market'],[155,-115,'woodpile'],[-175,185,'laundry'],[110,205,'well'],
  [225,20,'barrel'],[-225,20,'cart'],[10,250,'crate'],[-35,-185,'ration']
 ],
 minorLife:[
  [-110,-10,'garden'],[115,-20,'woodpile'],[-125,120,'barrel'],[120,120,'well'],[0,195,'laundry']
 ]
};
const serviceOffsets={teacher:[-155,-150],smith:[75,-175],alchemist:[105,-155]};
// Deterministic regional nature dressing. Repeated entries are deliberate weighting.
const natureThemes=[
 ['grass','grass','bush','bush','wildflowers','sapling','stump','fallen-log'],
 ['reeds','reeds','cattails','cattails','marsh-bush','driftwood','wet-grass'],
 ['pine-sapling','pine-sapling','alpine-scrub','heather','rock-cluster','fallen-log'],
 ['dead-tree','charred-stump','ash-patch','dry-scrub','burned-log','ember-pit'],
 ['black-rock','black-rock','crystal-cluster','ash-patch','dead-shrub','fumarole','obsidian']
];
const worldLifePlans=[
 {
  civilian:[[520,420,'garden'],[600,500,'animal-pen'],[790,670,'drying-rack'],[1020,710,'market'],[760,770,'laundry'],[430,520,'tax-post']],
  habitats:[
   {id:'goblin-road-camp',center:[520,1050],props:[[-70,-30,'lean-to'],[40,-20,'cookfire'],[-15,55,'sleep-roll'],[90,45,'game-table'],[-95,55,'stolen-goods']]},
   {id:'goblin-orchard-camp',center:[1510,920],props:[[-75,-15,'lean-to'],[25,-25,'cookfire'],[75,35,'stolen-goods'],[-35,65,'sleep-roll'],[115,-20,'training-dummy']]},
   {id:'crypt-fringe',center:[2050,2050],props:[[-60,-30,'bone-pile'],[30,-20,'grave-marker'],[70,45,'bone-pile'],[-25,65,'cookfire'],[120,15,'sleep-roll']]}
  ],
  field:[[-125,-80,'thorn-bed'],[-35,-125,'bone-pile'],[65,-120,'stolen-goods'],[145,-65,'cookfire'],[-155,45,'sleep-roll'],[-70,120,'fang-trophy'],[55,125,'root-table'],[150,55,'pup-nest']]
 },
 {
  civilian:[[510,1040,'drying-rack'],[610,1160,'fish-rack'],[930,510,'fishing-net'],[1120,520,'garden'],[900,620,'laundry'],[500,1210,'tax-post']],
  habitats:[
   {id:'mire-nesting-bank',center:[1940,1120],props:[[-70,-25,'mud-nest'],[30,-35,'wallow'],[80,35,'bone-pile'],[-30,65,'reed-nest'],[115,-10,'shell-hoard']]},
   {id:'reedbeast-wallow',center:[880,1320],props:[[-65,-15,'wallow'],[25,-25,'mud-nest'],[80,35,'fish-rack'],[-25,65,'reed-nest'],[115,-5,'bone-pile']]},
   {id:'causeway-scavengers',center:[2480,2450],props:[[-65,-25,'lean-to'],[30,-25,'cookfire'],[85,30,'stolen-goods'],[-20,65,'sleep-roll'],[115,-10,'fishing-net']]}
  ],
  field:[[-140,-70,'mire-pool'],[-55,-125,'reed-nest'],[45,-125,'mud-nest'],[140,-70,'fish-rack'],[-150,45,'wallow'],[-65,120,'shell-hoard'],[50,125,'drift-seat'],[145,50,'bone-pile']]
 },
 {
  civilian:[[760,1400,'market'],[930,1420,'ore-cart'],[1490,930,'ore-crane'],[1690,960,'tool-rack'],[1560,1110,'laundry'],[720,1580,'tax-post']],
  habitats:[
   {id:'wolf-hunting-ground',center:[520,1250],props:[[-70,-25,'wolf-den'],[25,-30,'bone-pile'],[75,35,'sleep-roll'],[-25,65,'stone-marker'],[120,-10,'bone-pile']]},
   {id:'ogre-hearth',center:[1980,1820],props:[[-75,-20,'lean-to'],[25,-25,'ridge-hearth'],[85,35,'stone-seat'],[-25,65,'bone-pile'],[120,-10,'game-table']]},
   {id:'quarry-squat',center:[2860,1180],props:[[-70,-25,'lean-to'],[20,-30,'cookfire'],[80,35,'ore-cart'],[-25,65,'tool-rack'],[120,-5,'sleep-roll']]}
  ],
  field:[[-150,-80,'ridge-hearth'],[-55,-130,'weapon-rack'],[55,-130,'stone-seat'],[150,-75,'trophy-rack'],[-160,45,'sleep-roll'],[-70,125,'game-table'],[55,125,'stone-marker'],[155,45,'supply-stack']]
 },
 {
  civilian:[[350,650,'market'],[560,620,'field-kitchen'],[1080,850,'garden'],[1260,940,'woodpile'],[1130,1040,'laundry'],[620,430,'tax-post']],
  habitats:[
   {id:'orc-bivouac',center:[1840,420],props:[[-75,-25,'lean-to'],[25,-30,'field-kitchen'],[85,30,'weapon-rack'],[-25,65,'sleep-roll'],[120,-5,'game-table']]},
   {id:'raider-rest-stop',center:[2500,2300],props:[[-70,-25,'lean-to'],[25,-30,'cookfire'],[80,35,'supply-stack'],[-25,65,'sleep-roll'],[120,-5,'training-dummy']]},
   {id:'archer-drill-camp',center:[3060,640],props:[[-70,-25,'lean-to'],[25,-30,'field-kitchen'],[80,35,'weapon-rack'],[-25,65,'training-dummy'],[120,-5,'supply-stack']]}
  ],
  field:[[-160,-85,'command-tent'],[-65,-135,'field-kitchen'],[50,-135,'weapon-rack'],[155,-80,'war-table'],[-165,45,'bunk'],[-70,125,'supply-stack'],[55,125,'training-dummy'],[160,45,'banner']]
 },
 {
  civilian:[[300,760,'market'],[520,760,'forge'],[900,1430,'garden'],[1080,1540,'field-kitchen'],[910,1630,'laundry'],[620,570,'tax-post']],
  habitats:[
   {id:'ashbeast-roost',center:[1800,3300],props:[[-70,-25,'roost'],[25,-30,'bone-pile'],[80,35,'ember-pit'],[-25,65,'sleep-roll'],[120,-5,'obsidian']]},
   {id:'crown-barracks',center:[3000,1180],props:[[-80,-25,'command-tent'],[20,-30,'field-kitchen'],[85,35,'weapon-rack'],[-25,70,'bunk'],[125,-5,'supply-stack']]},
   {id:'fortress-work-camp',center:[3070,2200],props:[[-75,-25,'forge'],[25,-30,'field-kitchen'],[85,35,'supply-stack'],[-25,65,'bunk'],[120,-5,'training-dummy']]},
   {id:'dark-fortress-court',center:[3250,3200],props:[[-165,-90,'dark-throne'],[-70,-140,'dark-brazier'],[50,-140,'war-table'],[160,-85,'weapon-rack'],[-170,45,'bunk'],[-75,130,'supply-stack'],[55,130,'forge'],[165,45,'crown-banner']]}
  ],
  field:[[-160,-80,'roost'],[-70,-135,'ember-pit'],[40,-135,'bone-pile'],[150,-80,'obsidian'],[-165,45,'sleep-roll'],[-70,125,'treasure-hoard'],[55,125,'roost'],[160,45,'bone-pile']]
 }
];
// Ashen Frontier gets a dedicated consolidation layer: civilians are rebuilding inside a functioning occupation corridor.
// These are procedural road/livelihood details only; they do not change combat, rewards, progression or sprite policy.
const frontierRoutes=[
 {id:'convoy-service',role:'supply',point:[900,600],props:[[-85,55,'cart'],[55,55,'supply-stack'],[0,0,'road-ruts'],[95,105,'watchpost']]},
 {id:'north-ravine-works',role:'road-repair',point:[1320,760],props:[[-95,50,'tool-rack'],[45,45,'stacked-lumber'],[0,0,'road-patch'],[105,105,'barricade']]},
 {id:'inspection-spur',role:'administration',point:[1900,1250],props:[[-90,50,'watchpost'],[50,50,'war-table'],[-10,105,'inspection-marker'],[115,100,'supply-stack']]},
 {id:'checkpoint-logistics',role:'military-staging',point:[2250,1650],props:[[-95,50,'weapon-rack'],[45,50,'supply-stack'],[-15,105,'checkpoint-standard'],[110,105,'banner']]},
 {id:'bastion-cordon',role:'dragon-logistics',point:[3000,2400],props:[[-90,50,'chain'],[50,50,'warm-brazier'],[-15,105,'chain-anchor'],[110,105,'barricade']]}
];
const frontierDistricts=[
 {id:'emberwatch-livelihood',role:'controlled-civilian',center:[650,620],props:[
  [-165,-90,'market',0],[-45,-125,'field-kitchen',0],[100,-105,'supply-stack',0],[-150,70,'woodpile',0],[-10,110,'cart',0],[135,65,'watchpost',0],[70,135,'patched-fence',0],[15,-55,'road-patch',0]
 ]},
 {id:'burned-hamlet-recovery',role:'rebuilding-civilian',center:[1240,1080],props:[
  [-175,-95,'charred-foundation',0],[-70,-130,'ash-patch',0],[95,-110,'tool-rack',0],[-160,70,'stacked-lumber',0],[-35,120,'broken-cart',0],[140,70,'field-kitchen',0],[55,15,'supply-stack',0],[-105,20,'repair-brace',0],[125,-20,'replacement-stakes',0]
 ]},
 {id:'roadworks-yard',role:'transport-repair',center:[1080,700],props:[
  [-155,-75,'cart',0],[-45,-115,'tool-rack',0],[90,-95,'stacked-lumber',0],[-145,70,'supply-stack',0],[-10,110,'barricade',0],[125,55,'watchpost',0],[65,105,'wagon-wheel',0],[5,-20,'road-ruts',0]
 ]},
 {id:'inspection-yard',role:'occupation-administration',center:[1720,1360],props:[
  [-150,-80,'watchpost',0],[-35,-120,'war-table',0],[95,-90,'weapon-rack',0],[-140,70,'supply-stack',0],[-10,110,'training-dummy',0],[125,55,'barricade',0],[45,20,'inspection-marker',0]
 ]},
 {id:'checkpoint-support',role:'military-support',center:[2300,1650],props:[
  [-160,-85,'command-tent',0],[-45,-125,'field-kitchen',0],[100,-95,'weapon-rack',0],[-150,75,'bunk',0],[-15,115,'supply-stack',0],[125,60,'war-table',0],[55,15,'checkpoint-standard',0]
 ]},
 {id:'bastion-cordon',role:'dragon-containment',center:[3000,2420],props:[
  [-160,-80,'chain',0],[-50,-125,'warm-brazier',0],[95,-95,'supply-stack',0],[-150,75,'roost',0],[-15,115,'bone-pile',0],[125,60,'barricade',0],[35,10,'watchpost',0],[145,-20,'chain-anchor',0]
 ]}
];

// Dark Crown gets a dedicated political/logistical layout layer instead of relying only on generic regional dressing.
// These remain procedural structures and road targets; they do not change combat, progression, rewards or sprite policy.
const crownRoutes=[
 {id:'frontier-return',role:'administrative',point:[620,220],travelHub:{name:'Crown dragon platform',icon:'🐉',visibleVehicle:true},props:[[-70,45,'watchpost'],[70,45,'crown-banner'],[0,95,'supply-stack']]},
 {id:'levy-road',role:'labor-supply',point:[180,1600],travelHub:{name:'Crown levy caravan',icon:'🐎',visibleVehicle:false},props:[[55,-70,'cart'],[65,65,'tax-post'],[120,10,'supply-stack']]},
 {id:'military-gate',role:'military',point:[3570,980],travelHub:{name:'Crown military transit',icon:'🚩',visibleVehicle:false},props:[[-70,60,'crown-banner'],[-90,-55,'weapon-rack'],[-25,105,'watchpost']]},
 {id:'ash-track',role:'monster-wilds',point:[1650,3580],props:[[-75,-35,'black-rock'],[35,-70,'roost'],[80,45,'ember-pit']]},
 {id:'fortress-service',role:'elite-logistics',point:[3570,2480],travelHub:{name:'Crown fortress convoy',icon:'📦',visibleVehicle:false},props:[[-75,-45,'crown-banner'],[-20,90,'dark-brazier'],[-120,35,'command-tent']]}
];
const crownDistricts=[
 {id:'labor-quarter',role:'civilian-labor',center:[720,900],props:[
  [-180,-120,'crown-ash-house',32],[-20,-145,'crown-forgehouse',32],[150,-90,'cart',0],[-145,65,'field-kitchen',0],[20,105,'supply-stack',0],[165,80,'bunk',0],[70,-10,'tax-post',0]
 ]},
 {id:'citadel-command',role:'military-command',center:[2580,900],props:[
  [-170,-85,'crown-wall',26],[-40,-130,'watchpost',0],[115,-100,'crown-banner',0],[-155,80,'weapon-rack',0],[-20,115,'war-table',0],[130,75,'training-dummy',0]
 ]},
 {id:'cindermaw-domain',role:'ash-beast-domain',center:[2580,1900],props:[
  [-150,-70,'roost',0],[-35,-125,'ember-pit',0],[100,-90,'bone-pile',0],[-135,75,'obsidian',0],[10,110,'sleep-roll',0],[135,55,'warm-brazier',0]
 ]},
 {id:'fortress-logistics',role:'military-logistics',center:[3050,2320],props:[
  [-175,-85,'forge',0],[-45,-130,'supply-stack',0],[110,-105,'field-kitchen',0],[-155,80,'bunk',0],[-20,115,'war-table',0],[135,70,'weapon-rack',0]
 ]},
 {id:'fortress-approach',role:'ultimate-authority',center:[3220,2860],props:[
  [-185,-90,'crown-wall',26],[-60,-140,'dark-brazier',0],[85,-120,'crown-banner',0],[-170,75,'barricade',0],[-20,120,'weapon-rack',0],[135,70,'watchpost',0]
 ]}
];

// Field-boss supply objectives are actual Treasury raids: every required cache is kept inside the boss's Treasury.
const supplyRooms=[
 {id:'supply-vale',region:'vale',boss:'thorn',count:2,entryOffset:[255,-170],name:"Thornfang's Treasury",objective:"Recover two caches from Thornfang's Treasury"},
 {id:'supply-march',region:'march',boss:'mire',count:3,entryOffset:[260,-165],name:"Mirejaw's Treasury",objective:"Recover three caches from Mirejaw's Treasury"},
 {id:'supply-highlands',region:'highlands',boss:'ridge',count:3,entryOffset:[-265,185],name:"Ridge Tyrant's Treasury",objective:"Recover three caches from Ridge Tyrant's Treasury"},
 {id:'supply-crown',region:'crown',boss:'cindermaw',count:3,entryOffset:[285,-185],name:"Cindermaw's Treasury",objective:"Recover three caches from Cindermaw's Treasury"}
];
const treasuryWalls={
 'supply-vale':[
  {axis:'y',x1:405,x2:465,y1:175,y2:820,gaps:[[280,420],[630,770]]}
 ],
 'supply-march':[
  {axis:'x',x1:185,x2:835,y1:435,y2:495,gaps:[[285,430],[635,790]]}
 ],
 'supply-highlands':[
  {axis:'y',x1:385,x2:455,y1:150,y2:830,gaps:[[390,555],[675,790]]},
  {axis:'x',x1:455,x2:805,y1:535,y2:590,gaps:[[570,690]]}
 ],
 'supply-crown':[
  {axis:'y',x1:420,x2:480,y1:145,y2:830,gaps:[[285,405],[635,755]]},
  {axis:'x',x1:220,x2:790,y1:485,y2:540,gaps:[[315,425],[600,715]]}
 ]
};
const treasuryDecor={
 'supply-vale':[
  [155,690,'thorn-bed',28],[265,205,'fang-trophy',0],[690,205,'treasure-hoard',22],[665,500,'root-table',22],[175,445,'warm-brazier',16],[785,760,'boss-chest',20],
  [365,705,'pup-nest',0],[470,195,'stolen-goods',0],[560,690,'sleep-roll',0],[745,405,'bone-pile',0],[330,460,'game-table',0]
 ],
 'supply-march':[
  [165,690,'mire-pool',0],[275,205,'fish-rack',18],[690,205,'reed-nest',26],[665,500,'shell-hoard',22],[175,445,'drift-seat',18],[785,760,'boss-chest',20],
  [360,700,'mud-nest',0],[470,205,'fishing-net',0],[560,690,'wallow',0],[745,405,'bone-pile',0],[330,460,'sleep-roll',0]
 ],
 'supply-highlands':[
  [165,690,'ridge-hearth',24],[275,205,'weapon-rack',18],[690,205,'stone-seat',28],[665,500,'treasure-hoard',22],[175,445,'trophy-rack',18],[785,760,'boss-chest',20],
  [365,700,'sleep-roll',0],[470,205,'tool-rack',0],[555,690,'ore-cart',0],[745,405,'bone-pile',0],[330,460,'game-table',0]
 ],
 'supply-crown':[
  [165,690,'ember-pit',18],[275,205,'treasure-hoard',22],[690,205,'roost',28],[665,500,'bone-pile',0],[175,445,'obsidian',0],[785,760,'boss-chest',20],
  [365,700,'roost',0],[470,205,'supply-stack',0],[555,690,'warm-brazier',0],[745,405,'bone-pile',0],[330,460,'sleep-roll',0]
 ]
};
// Creature strongholds are centers of ordinary-monster life and territorial power, not resource wrappers.
// Named sites reuse existing map destinations; unmarked holds fill quiet territory without adding map clutter.
const creatureStrongholds=[
 {id:'goblin-road-fort',region:'vale',site:'goblin-camp',species:'goblin',wall:'stockade',guardCount:4,
  props:[[-105,-55,'lean-to'],[-45,-105,'cookfire'],[50,-100,'sleep-roll'],[110,-45,'game-table'],[105,60,'stolen-goods'],[10,110,'training-dummy'],[-90,70,'ration']]},
 {id:'skeleton-watch',region:'vale',center:[1820,2260],species:'skeleton',wall:'stonewall',guardCount:3,unmarked:true,
  props:[[-90,-55,'grave-marker'],[-35,-105,'bone-pile'],[55,-90,'grave-lamp'],[100,-25,'caretaker-table'],[70,75,'sleep-roll'],[-55,95,'ossuary']]},

 {id:'mire-nest-hold',region:'march',site:'mire-nests',species:'mireling',wall:'palisade',guardCount:4,
  props:[[-105,-45,'mud-nest'],[-45,-105,'reed-nest'],[55,-95,'fish-rack'],[110,-35,'shell-hoard'],[90,70,'wallow'],[-20,105,'drift-seat'],[-95,65,'bone-pile']]},
 {id:'reedbeast-wallow-hold',region:'march',center:[880,1320],species:'reedbeast',wall:'palisade',guardCount:3,unmarked:true,
  props:[[-100,-45,'wallow'],[-35,-100,'mud-nest'],[55,-90,'fish-rack'],[105,-20,'reed-nest'],[75,75,'bone-pile'],[-60,95,'fishing-net']]},
 {id:'lantern-wraith-hold',region:'march',site:'night-site',nightSpecies:'wraith',wall:'stonewall',night:true,
  props:[[-95,-50,'grave-marker'],[-35,-105,'grave-lamp'],[55,-95,'bone-pile'],[105,-25,'ritual-table'],[75,80,'grave-marker'],[-65,90,'cattails']]},

 {id:'wolf-packhold',region:'highlands',site:'wolf-den',species:'wolf',wall:'stonewall',guardCount:4,
  props:[[-105,-50,'wolf-den'],[-45,-105,'bone-pile'],[50,-95,'sleep-roll'],[105,-35,'stone-marker'],[85,70,'bone-pile'],[-15,105,'trophy-rack'],[-90,65,'heather']]},
 {id:'ogre-hearth-fort',region:'highlands',site:'ogre-hearth',species:'ogre',wall:'stonewall',guardCount:4,
  props:[[-105,-50,'lean-to'],[-45,-105,'ridge-hearth'],[50,-100,'stone-seat'],[110,-35,'tool-rack'],[90,70,'game-table'],[-10,110,'ore-cart'],[-90,65,'sleep-roll']]},

 {id:'orc-road-fort',region:'frontier',site:'orc-bivouac',species:'orc',wall:'stockade',guardCount:4,
  props:[[-105,-50,'command-tent'],[-45,-105,'field-kitchen'],[50,-100,'weapon-rack'],[110,-35,'sleep-roll'],[90,70,'game-table'],[-10,110,'training-dummy'],[-90,65,'supply-stack']]},
 {id:'raider-drill-redoubt',region:'frontier',center:[3060,640],species:'archer',wall:'stockade',guardCount:4,unmarked:true,
  props:[[-105,-50,'lean-to'],[-45,-105,'field-kitchen'],[50,-100,'weapon-rack'],[110,-35,'training-dummy'],[90,70,'supply-stack'],[-10,110,'sleep-roll'],[-90,65,'barricade']]},
 {id:'stalker-cinder-hold',region:'frontier',site:'overlook',nightSpecies:'stalker',wall:'stonewall',night:true,
  props:[[-95,-50,'ash-patch'],[-35,-105,'bone-pile'],[55,-95,'roost'],[105,-25,'ember-pit'],[75,80,'burned-log'],[-65,90,'black-rock']]},

 {id:'ashbeast-roost-hold',region:'crown',center:[1800,3300],species:'ashbeast',wall:'stonewall',guardCount:4,unmarked:true,
  props:[[-105,-50,'roost'],[-45,-105,'bone-pile'],[50,-100,'ember-pit'],[110,-35,'obsidian'],[90,70,'sleep-roll'],[-10,110,'roost'],[-90,65,'black-rock']]},
 {id:'crown-field-barracks-hold',region:'crown',site:'crown-barracks',species:'crownguard',wall:'stonewall',guardCount:4,
  props:[[-105,-50,'command-tent'],[-45,-105,'field-kitchen'],[50,-100,'weapon-rack'],[110,-35,'bunk'],[90,70,'supply-stack'],[-10,110,'training-dummy'],[-90,65,'war-table'],[170,110,'forge'],[190,-120,'bunk']]},
 {id:'crown-toll-redoubt',region:'crown',center:[3370,1820],species:'crownguard',wall:'stonewall',guardCount:3,unmarked:true,
  props:[[-105,-50,'command-tent'],[-45,-105,'weapon-rack'],[55,-95,'bunk'],[110,-30,'supply-stack'],[85,75,'war-table'],[-55,100,'training-dummy']]}
];

// Optional occupied interiors consolidate weak overlapping landmarks. They intentionally have no boss, captive, quest reward or gatherable resource yet.
const sideDungeons=[
 {id:'side-vale-cellars',region:'vale',site:'den-ruins',name:'Old Orchard Cellars',size:1100,enemyCount:6,theme:'cellar',species:'goblin',lore:'Goblin households have turned the abandoned fruit cellars into a warm communal hideout: sleeping rolls, stolen preserves, games and pup nests occupy the rooms the farmers once used for winter stores.',
  decor:[[190,210,'crate'],[300,230,'ration'],[430,190,'stolen-goods'],[670,220,'root-table'],[830,240,'thorn-bed'],[230,520,'sleep-roll'],[390,560,'pup-nest'],[620,520,'bone-pile'],[815,565,'warm-brazier'],[360,835,'crate'],[700,830,'game-table']],
  walls:[[470,180,28],[470,260,28],[470,340,28],[470,720,28],[470,800,28],[470,880,28],[760,440,28],[840,440,28]],
  traps:[[350,405,'spikes'],[575,405,'spikes'],[690,700,'seal']]},
 {id:'side-march-watchhouse',region:'march',site:'watch',name:'Drowned Watchhouse',size:1100,enemyCount:8,theme:'flooded',species:'reedbeast',lore:'Reed beasts have claimed the half-flooded watchhouse as a dry nesting structure. Fish racks and shell piles matter to them more than whatever military purpose the building once had.',
  decor:[[180,210,'fish-rack'],[300,220,'fishing-net'],[455,210,'reed-nest'],[700,215,'shell-hoard'],[835,235,'drift-seat'],[210,540,'mud-nest'],[390,570,'wallow'],[635,535,'water'],[820,560,'sleep-roll'],[330,835,'bone-pile'],[720,825,'reed-nest']],
  walls:[[455,180,28],[455,260,28],[455,340,28],[455,760,28],[455,840,28],[720,455,28],[800,455,28]],
  traps:[[315,410,'seal'],[600,410,'jet'],[710,720,'seal']]},
 {id:'side-highlands-signal',region:'highlands',site:'lookout',name:'Old Signal Keep',size:1100,enemyCount:10,theme:'keep',species:'ogre',lore:'Ogres have rebuilt the dead signal keep around a communal hearth. Stone seats, scavenged quarry tools and a game table make the ruin look less like a battlefield and more like a rough household.',
  decor:[[180,215,'ridge-hearth'],[305,210,'weapon-rack'],[455,225,'stone-seat'],[690,210,'trophy-rack'],[835,235,'tool-rack'],[210,550,'sleep-roll'],[390,555,'game-table'],[640,535,'ore-cart'],[825,565,'bone-pile'],[335,835,'stone-marker'],[720,825,'supply-stack']],
  walls:[[430,180,30],[430,260,30],[430,340,30],[430,760,30],[430,840,30],[730,455,30],[810,455,30]],
  traps:[[315,420,'spikes'],[600,420,'jet'],[705,715,'spikes']]},
 {id:'side-frontier-shrine',region:'frontier',site:'shrine',name:'Ruined Shrine',size:1100,enemyCount:12,theme:'shrine',species:'orc',lore:'Orcs have converted the old shrine into a barracks without bothering to erase all of its former identity. Cooking, sleeping, drills and gambling now share space with the broken ritual furniture.',
  decor:[[180,215,'ritual-table'],[315,210,'field-kitchen'],[455,220,'weapon-rack'],[690,210,'stolen-goods'],[835,235,'training-dummy'],[210,550,'sleep-roll'],[390,555,'game-table'],[640,535,'bone-pile'],[825,565,'command-tent'],[335,835,'supply-stack'],[720,825,'cookfire']],
  walls:[[445,180,30],[445,260,30],[445,340,30],[445,760,30],[445,840,30],[735,455,30],[815,455,30]],
  traps:[[315,420,'jet'],[600,420,'seal'],[710,715,'jet']]},
 {id:'side-crown-foundry',region:'crown',site:'foundry',name:'Ruined Foundry',size:1100,enemyCount:14,theme:'foundry',species:'crownguard',lore:'Crown soldiers use the damaged foundry as a working barracks and repair hall. Bunks and meals sit beside active forge space; the place exists for their daily work, not as a treasure room for adventurers.',
  decor:[[180,215,'forge'],[315,210,'supply-stack'],[455,220,'weapon-rack'],[690,210,'war-table'],[835,235,'bunk'],[210,550,'ember-pit'],[390,555,'field-kitchen'],[640,535,'roost'],[825,565,'bone-pile'],[335,835,'training-dummy'],[720,825,'crown-banner']],
  walls:[[450,180,30],[450,260,30],[450,340,30],[450,760,30],[450,840,30],[740,455,30],[820,455,30]],
  traps:[[315,420,'jet'],[600,420,'seal'],[710,715,'jet'],[540,805,'seal']]}
];
const sideDungeonTrapTuning={cycle:7.2,warning:1.45,active:.7,damage:.09,radius:44,sealRadius:58,jetLength:150,jetHalfWidth:29,slow:2.2,offset:1.2};

const miniPlans=[
 {field:'Orchard den stockade',resource:'Woodland cache ruins',theme:'stockade'},
 {field:'Mirejaw island redoubt',resource:'Stranded wagon enclosure',theme:'palisade'},
 {field:'Mountain watchtower yard',resource:'Abandoned quarry works',theme:'stonewall'},
 {field:'Warlord checkpoint',resource:'Ruined shrine courtyard',theme:'stonewall'},
 {field:"Cindermaw's roosting compound",resource:'Ruined foundry works',theme:'stonewall'}
];
const quest=(kind,target,sites=[])=>({kind,target,sites});
const quests=[
 quest('rescue','thorn'),quest('patrol',5),quest('bundles',2),quest('rescue','crypt'),quest('sites',null,['bridge-north','port']),quest('sites',null,['goblin-camp','den-ruins','bridge-south']),
 quest('rescue','mire'),quest('patrol',6),quest('rescue','archive'),quest('bundles',3),quest('night',2,['night-site']),quest('sites',null,['port']),
 quest('rescue','ridge'),quest('patrol',7),quest('rescue','mine'),quest('bundles',3),quest('sites',null,['bridge-north','wolf-den','ogre-hearth','bridge-south']),quest('sites',null,['port']),
 quest('rescue','warlord'),quest('sites',null,['convoy','bridge-north','checkpoint']),quest('rescue','abyss'),quest('patrol',8),quest('sites',null,['shrine','minor','orc-bivouac','overlook']),quest('sites',null,['port']),
 quest('rescue','citadel'),quest('patrol',8),quest('rescue','cindermaw'),quest('bundles',3),quest('sites',null,['foundry','shelf','crown-barracks','siege']),quest('sites',null,['fortress-gate'])
];
for(const [index,family]of [[0,'thorn'],[6,'mire'],[12,'ridge'],[18,'warlord'],[26,'cindermaw']])quests[index].clear='field-'+family;
quests[29].requiresRescues=['cindermaw','citadel'];
// The renderer and collision engine share these exact boundaries and crossing gaps.
const barriers=[
 {kind:'water',bounds:[1160,1240,0,2700],gaps:[[660,840],[1660,1840]]},
 {kind:'water',bounds:[1120,1690,1450,2070],gaps:[[1710,1850]]},
 {kind:'ravine',bounds:[1250,1350,120,2400],gaps:[[860,1100],[1770,1980]]},
 {kind:'ravine',bounds:[1400,1510,200,2450],gaps:[[630,870],[2070,2250]]},
 {kind:'lava',bounds:[1300,1410,300,2810],gaps:[[850,1150],[2260,2510]]}
];
const terrain=[
 [
  {kind:'water',x:630,y:1320,r:125},
  {kind:'water',x:2050,y:1180,r:150}
 ],
 [
  {kind:'water',x:690,y:1980,r:175},
  {kind:'water',x:2380,y:1540,r:145}
 ],
 [
  {kind:'cliff',x1:520,x2:650,y1:430,y2:1050},
  {kind:'cliff',x1:2220,x2:2350,y1:1360,y2:2060,gaps:[[1640,1800]]},
  {kind:'cliff',x1:3000,x2:3150,y1:1050,y2:1700,gaps:[[1320,1450]]}
 ],
 [
  {kind:'ravine',x1:1740,x2:1810,y1:1020,y2:1220},
  {kind:'ravine',x1:2720,x2:2860,y1:1850,y2:2550,gaps:[[2160,2320]]},
  {kind:'rock',x:850,y:2850,r:145}
 ],
 [
  {kind:'lava',x1:2110,x2:2190,y1:2000,y2:2940,gaps:[[2260,2520]]},
  {kind:'lava',x1:2850,x2:2950,y1:450,y2:1500,gaps:[[980,1160]]},
  {kind:'obsidian',x:1850,y:3150,r:165}
 ]
];
const landforms=[
 [
  {kind:'meadow',shape:'ellipse',x:620,y:520,rx:430,ry:300},
  {kind:'orchard-slope',shape:'rect',x1:720,y1:520,x2:1180,y2:910},
  {kind:'wooded-rise',shape:'poly',points:[[160,1480],[620,1260],[980,1530],[730,2040],[250,2100]]},
  {kind:'river-bank',shape:'rect',x1:1030,y1:120,x2:1160,y2:2280}
 ],
 [
  {kind:'wet-basin',shape:'ellipse',x:1430,y:1750,rx:760,ry:600},
  {kind:'mudflat',shape:'poly',points:[[1580,720],[2180,560],[2670,920],[2380,1380],[1800,1260]]},
  {kind:'reed-islands',shape:'ellipse',x:760,y:2050,rx:420,ry:300},
  {kind:'shore-shelf',shape:'rect',x1:1900,y1:350,x2:2860,y2:920}
 ],
 [
  {kind:'high-terrace',shape:'poly',points:[[1450,180],[3280,180],[3280,1180],[2150,1260],[1550,920]]},
  {kind:'middle-terrace',shape:'poly',points:[[1460,1250],[3300,1180],[3300,2240],[2500,2300],[1900,1960]]},
  {kind:'quarry-shelf',shape:'ellipse',x:1700,y:1020,rx:520,ry:350},
  {kind:'pine-basin',shape:'ellipse',x:850,y:2450,rx:650,ry:480}
 ],
 [
  {kind:'burn-scar',shape:'poly',points:[[760,720],[1600,520],[2170,980],[1840,1440],[1030,1390]]},
  {kind:'ravine-shelf',shape:'poly',points:[[1540,260],[3280,260],[3280,1120],[2400,1260],[1650,980]]},
  {kind:'ash-lowland',shape:'ellipse',x:980,y:2500,rx:720,ry:520},
  {kind:'war-road',shape:'rect',x1:1750,y1:1250,x2:3180,y2:1900}
 ],
 [
  {kind:'ash-plateau',shape:'poly',points:[[1500,180],[3620,180],[3620,1500],[2860,1650],[1850,1300]]},
  {kind:'obsidian-shelf',shape:'poly',points:[[1540,1650],[3650,1520],[3650,3550],[2650,3560],[2040,2860]]},
  {kind:'crystal-field',shape:'ellipse',x:1180,y:2200,rx:560,ry:440},
  {kind:'fortress-apron',shape:'ellipse',x:3080,y:3090,rx:600,ry:520}
 ]
];
// Small authored arrival harbors supplement the region-scale barriers. Their dock rectangles are walkable over the water.
const harbors={
 march:{
  id:'reedport-ferry',
  water:{x1:2140,x2:3000,y1:470,y2:900},
  dock:{x1:2075,x2:2255,y1:615,y2:735},
  arrival:{x:2115,y:675},
  boat:{x:2200,y:735},
  shore:{x:2140,y:675},
  name:'Reedport Mangrove Ferry',
  vegetation:'mangrove'
 },
 highlands:{
  id:'stonecross-ferry',
  water:{x1:0,x2:390,y1:1740,y2:2190},
  dock:{x1:325,x2:470,y1:1845,y2:1955},
  arrival:{x:425,y:1900},
  boat:{x:340,y:1960},
  shore:{x:390,y:1900},
  name:'Stonecross Ferry Landing',
  vegetation:'pine'
 }
};
const travelArrivals={
 'march>highlands':{x:425,y:1900},
 'highlands>march':{x:2115,y:675}
};
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
 crypt:[[300,330,'torch'],[430,330,'torch'],[350,520,'coffin'],[470,520,'coffin'],[350,660,'coffin'],[470,660,'coffin'],[580,780,'bones'],[620,850,'bones'],[930,320,'banner'],[1120,320,'banner'],[980,480,'torch'],[1220,480,'torch'],[930,980,'coffin'],[1040,1040,'bones'],[1180,980,'coffin'],[1000,1190,'torch'],[1280,1190,'torch'],[1110,1240,'banner'],[1300,1240,'banner'],[870,820,'bones'],[760,300,'grave-marker'],[820,430,'ossuary'],[860,1030,'ritual-table'],[1170,1110,'grave-lamp'],[1260,1080,'bone-pile'],[1080,880,'caretaker-table'],[560,1120,'sleep-roll'],[350,900,'tool-rack']],
 archive:[[300,330,'torch'],[500,330,'torch'],[330,520,'shelf'],[330,650,'shelf'],[520,520,'shelf'],[520,650,'shelf'],[900,340,'banner'],[1080,340,'banner'],[930,520,'shelf'],[1160,520,'shelf'],[850,760,'water'],[1040,760,'water'],[1220,760,'water'],[890,930,'rune'],[1120,930,'rune'],[980,1120,'torch'],[1240,1120,'torch'],[1070,1230,'shelf'],[1260,1230,'shelf'],[720,850,'rune'],[720,330,'scribe-desk'],[760,520,'scroll-stack'],[820,1120,'fish-rack'],[1190,1040,'mud-nest'],[1260,870,'drift-seat'],[560,1080,'sleep-roll'],[690,980,'fishing-net'],[1290,650,'shell-hoard']],
 mine:[[280,330,'torch'],[480,330,'torch'],[300,530,'crate'],[410,530,'crate'],[520,530,'crate'],[650,760,'rail'],[650,860,'rail'],[650,960,'rail'],[930,330,'crystal'],[1080,330,'crystal'],[1230,330,'crystal'],[960,600,'banner'],[1200,600,'banner'],[970,820,'crate'],[1080,820,'crate'],[1190,820,'crate'],[960,1050,'crystal'],[1180,1050,'crystal'],[1080,1220,'torch'],[1280,1220,'torch'],[720,330,'ore-cart'],[760,520,'tool-rack'],[790,1120,'forge'],[1180,1160,'stone-seat'],[1270,930,'ore-crane'],[540,1120,'sleep-roll'],[890,970,'supply-stack'],[1320,520,'stone-marker']],
 abyss:[[300,340,'torch'],[500,340,'torch'],[350,560,'chain'],[500,560,'chain'],[820,360,'banner'],[1060,360,'banner'],[930,570,'ember'],[1120,570,'ember'],[850,780,'chain'],[1080,780,'chain'],[1250,780,'chain'],[860,960,'ember'],[1060,960,'ember'],[1260,960,'ember'],[900,1140,'banner'],[1180,1140,'banner'],[980,1240,'torch'],[1260,1240,'torch'],[700,850,'chain'],[1140,860,'torch'],[720,330,'roost'],[760,520,'bone-pile'],[810,1120,'treasure-hoard'],[1190,1110,'ember-pit'],[1280,1080,'roost'],[560,1120,'sleep-roll'],[890,1010,'hatchery'],[1310,600,'supply-stack']],
 citadel:[[300,330,'torch'],[500,330,'torch'],[340,520,'armor'],[500,520,'armor'],[900,340,'banner'],[1120,340,'banner'],[870,560,'rune'],[1000,650,'rune'],[1130,560,'rune'],[860,820,'armor'],[1140,820,'armor'],[900,980,'banner'],[1120,980,'banner'],[940,1130,'rune'],[1080,1130,'rune'],[980,1240,'torch'],[1240,1240,'torch'],[1260,600,'armor'],[780,1020,'banner'],[1260,1020,'banner'],[720,330,'war-table'],[760,520,'bunk'],[800,1120,'field-kitchen'],[1190,1110,'weapon-rack'],[1280,1080,'supply-stack'],[560,1120,'training-dummy'],[880,1030,'forge'],[1320,520,'tax-post']]
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
const forests=[[[470,850,210,280],[1850,1050,250,320],[550,1800,260,180]],[[650,1650,240,200],[1950,1000,200,300],[2050,2300,230,170]],[[850,600,150,210],[1900,1500,240,350],[650,2100,230,200],[1200,2700,260,180],[2750,1750,220,240]],[[600,1300,250,250],[2100,1900,270,260],[1100,2300,200,160]],[[800,1100,230,250],[1850,1600,240,300],[2400,1050,170,200]]];
const resourceDepositCounts=[4,4,4,4,4];
const teachers={thorn:{learn:[2],train:[1,2],maxRank:2},mire:{learn:[3,4,6],train:[1,2,3,4,6],maxRank:3},ridge:{learn:[5],train:[1,2,3,4,5,6],maxRank:4},warlord:{learn:[7],train:[1,2,3,4,5,6,7],maxRank:6},citadel:{learn:[8],train:[1,2,3,4,5,6,7,8],maxRank:8}};
const expeditionSupportSkills={
 sharedTraining:{name:'Shared Training',trainers:{thorn:1,mire:2,ridge:3,warlord:4,citadel:5},maxRank:5,costs:[0,140,140,140,140,140],detail:'Companions inherit applicable discipline-training HP, damage and movement speed.'},
 sharedStrength:{name:'Shared Strength',trainers:{crypt:1,mine:2,abyss:3,cindermaw:4},laterTrainerCap:4,maxRank:4,costs:[0,125,200,300,425],detail:'Companions inherit other bonus HP and damage plus armor-tier and reforge defense bonuses.'}
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
 cindermaw:{close:[0],far:[1,2],heroTarget:[1,2],phasePreferred:[2,1],combos:[{from:2,to:1,phase:'low',chance:.45}]},
 darklord:{close:[0,3],far:[1,2,3],heroTarget:[0,1,3],phasePreferred:[3,1,2],combos:[{from:1,to:0,phase:'high',chance:.4}]}
};
const trueBossSummons={cap:6,minions:4,captains:2,minionScaling:{hp:1.5,damage:1.25},families:{
 thorn:{species:'wolf',ranged:false},crypt:{species:'skeleton',ranged:false},
 mire:{species:'mireling',ranged:false},archive:{species:'wraith',ranged:true},
 ridge:{species:'archer',ranged:true},mine:{species:'ogre',ranged:false},
 warlord:{species:'orc',ranged:false},abyss:{species:'ashbeast',ranged:false},
 cindermaw:{species:'ashbeast',ranged:false},citadel:{species:'crownguard',ranged:true},darklord:{species:'crownguard',ranged:true}
}};
const ringleaderScaling={hp:2.5,damage:1.5,pursuit:1.2,frenzyThreshold:.5,frenzyCooldown:.6,frenzyAim:.75};
const nightEnemyCombat={
 wraith:{hp:2.4,damage:1.8,skillCooldown:4.8,warning:.85,radius:210,coefficient:1.15,slow:2.5,heal:.08,manaDrain:.12},
 stalker:{hp:2.6,damage:2.0,skillCooldown:4.2,warning:.7,radius:78,coefficient:1.6,pounceSpeed:560,slow:3}
};
const roomCaptains={
 'supply-vale':{
  mentor:'thorn',name:'Scornfang',visualScale:1.16,specialRange:420,specialCooldown:4.2,
  phase:{threshold:.42,name:"Scavenger's Nerve",kind:'scramble'},
  attacks:[
   {name:'Hookfang Rush',kind:'line',warning:.9,recovery:1.15,coefficient:1.15,charge:true},
   {name:'Briar Pot',kind:'circle',warning:1.15,recovery:1.15,coefficient:.75,persistent:true,slow:true,radius:82},
   {name:'Pocket Sand',kind:'cone',warning:.7,recovery:.95,coefficient:.55,slow:true,radius:135}
  ]
 },
 'supply-march':{
  mentor:'mire',name:'Direjaw',visualScale:1.18,specialRange:390,specialCooldown:4.4,
  phase:{threshold:.45,name:'Sloughskin',kind:'molt'},
  attacks:[
   {name:'Bog Skitter',kind:'line',warning:.9,recovery:1.2,coefficient:1.2,charge:true},
   {name:'Spatter Fan',kind:'cone',warning:1.0,recovery:1.05,coefficient:.8,slow:true,radius:150},
   {name:'Silt Slick',kind:'circle',warning:1.2,recovery:1.1,coefficient:.65,persistent:true,slow:true,radius:88}
  ]
 },
 'supply-highlands':{
  mentor:'ridge',name:'Crag Tyrant',visualScale:1.2,specialRange:430,specialCooldown:4.1,
  phase:{threshold:.44,name:'Lone Howl',kind:'howl'},
  attacks:[
   {name:'Shoulder Rush',kind:'line',warning:.95,recovery:1.25,coefficient:1.25,charge:true},
   {name:'Scree Kick',kind:'circle',warning:1.15,recovery:1.05,coefficient:1.15,radius:86},
   {name:'Ridge Feint',kind:'cone',warning:.8,recovery:1.0,coefficient:.85,radius:145}
  ]
 },
 'supply-crown':{
  mentor:'cindermaw',visualIdol:'darklord',name:'Dreadmaw',visualScale:1.19,specialRange:440,specialCooldown:4.0,
  phase:{threshold:.45,name:'Ash Carapace',kind:'carapace'},
  attacks:[
   {name:'Cinder Mark',kind:'circle',warning:1.15,recovery:1.0,coefficient:1.0,count:2,sequential:true,radius:78},
   {name:'Blackline Rush',kind:'line',warning:1.0,recovery:1.2,coefficient:1.2,charge:true},
   {name:'Ember Veil',kind:'cone',warning:.85,recovery:1.0,coefficient:.75,slow:true,radius:155}
  ]
 },
 'frontier-overseer':{
  mentor:'warlord',name:'Cinder Warlord',visualScale:1.18,specialRange:440,specialCooldown:4.0,patrolSpeed:82,inspectionPause:2.4,
  patrol:[[1200,950],[1660,1390],[1350,1800],[1100,1080],[1740,1050]],
  phase:{threshold:.45,name:'Mandatory Overtime',kind:'overtime'},
  attacks:[
   {name:'Inspection Cleave',kind:'cone',warning:.85,recovery:1.0,coefficient:1.0,radius:150},
   {name:'Violation Marker',kind:'circle',warning:1.15,recovery:1.0,coefficient:.95,count:2,sequential:true,radius:76},
   {name:'Compliance Charge',kind:'line',warning:1.0,recovery:1.2,coefficient:1.2,charge:true}
  ]
 }
};
const manaBalance={
 perLevel:5,
 regen:{combat:1,outOfCombat:2.5,talentCombat:.25,talentOutOfCombat:.5},
 rankCostGrowth:.08,
 rangedDrain:{wraith:.06,ashbeast:.04}
};
const idleWander={
 ordinary:{radius:58,speed:34,minPause:2.4,maxPause:6.5},
 ranged:{radius:52,speed:31,minPause:2.8,maxPause:7},
 guardian:{radius:38,speed:28,minPause:3,maxPause:7.5},
 captain:{radius:34,speed:30,minPause:2.4,maxPause:6},
 ringleader:{radius:52,speed:38,minPause:2,maxPause:5},
 boss:{radius:32,speed:24,minPause:3.2,maxPause:7.5},
 night:{radius:54,speed:36,minPause:2.2,maxPause:5.5},
 summon:{radius:28,speed:30,minPause:2,maxPause:5}
};
const autoPotionThresholds={health:.5,mana:.35};
const rangerSupport={healThreshold:.5,manaThreshold:.35,cooldown:10,duration:5,healAmounts:[60,150],manaAmounts:[40,100],healUpgradeCost:50,manaUpgradeCost:40};
// Boss telegraphs stay readable, but idle gaps are short and basic attacks only interrupt sustained special pressure occasionally.
const bossCadence={specialRecoveryMultiplier:.25,basicCooldown:.75,skillsPerBasic:4,specialRange:560};
const rangedEnemyCombat={projectileMultiplier:1.7,aimTime:.35,cooldown:1.15,retreatFraction:.5,retreatSpeed:165,ringleaderRetreatMultiplier:1.2,ringleaderHybridMeleeRange:100,guardianScreenRange:220};
const chargedSkills={holdSeconds:.65,tapSeconds:.20,basicDamageMultiplier:3,manaFractions:{1:.20,2:.30,3:.35},third:{effect:'party-heal'},second:{paladin:{shape:'cone',range:185,halfAngle:.8,effect:'holy-cleave'},mage:{shape:'circle',radius:160,effect:'frost-burst',slow:4},ranger:{shape:'line',range:480,halfWidth:55,effect:'piercing-volley'}}};
const basicAttackCombo={steps:3,resetSeconds:4,multipliers:[1,1.1,1.2],finisher:{secondaryMultiplier:.55,paladin:{range:150,halfAngle:.65,effect:'cross-cleave'},mage:{range:210,halfAngle:.6,effect:'arcane-wave'},ranger:{range:260,halfAngle:.5,effect:'arrow-fan'}}};
const companionSkills={globalCooldown:1.5,first:{cooldown:8,multiplier:3,soldier:{name:'Power Strike'},archer:{name:'Triple Shot'}},second:{cooldown:12,unlockHeroSlot:2,soldier:{name:'Holy Cleave',shape:'cone',range:185,halfAngle:.8,multiplier:2.2,effect:'holy-cleave'},archer:{name:'Piercing Volley',shape:'line',range:480,halfWidth:55,multiplier:2.4,effect:'piercing-volley'}}};
// Flip Mage or Ranger independently if movement attacks prove too strong in playtests.
const movementBasicClasses={paladin:true,mage:true,ranger:true};
const R={bossCadence,bossSummoning,bossBehavior,rangedEnemyCombat,chargedSkills,basicAttackCombo,companionSkills,ordinaryMeleeScaling,ordinaryRangedScaling,guardianLegacyScaling,guardianScaling,awakenedGuardianScaling,summonScaling,trueBossSummons,ringleaderScaling,nightEnemyCombat,roomCaptains,manaBalance,dungeonTrapTuning,dungeonReinforcement,outdoorMiniTrapTuning,outdoorMiniTrapKinds,dungeonDecor,idleWander,autoPotionThresholds,rangerSupport,movementBasicClasses,enemyProjectileMultiplier:1.15,progression,supplyRooms,treasuryWalls,treasuryDecor,creatureStrongholds,sideDungeons,sideDungeonTrapTuning,tributeTotal,legacyResourceTotals,tributePlans,miniPlans,expeditions,fieldBossCenters,occupationAnchors,settlementLayouts,serviceOffsets,natureThemes,worldLifePlans,frontierRoutes,frontierDistricts,crownRoutes,crownDistricts,teachers,expeditionSupportSkills,rangedProfiles,guardPosts,dungeonTraps,forests,resourceDepositCounts,attacks,sites,quests,barriers,terrain,landforms,harbors,travelArrivals,dungeonWalls,pillars};
if(typeof module!=='undefined')module.exports=R;else root.PrototypeRules=R;
})(typeof window!=='undefined'?window:globalThis);
