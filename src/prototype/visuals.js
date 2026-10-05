/* Small, deterministic canvas drawings. Appearance only: no campaign state changes. */
(function(root){
'use strict';
const R=typeof PrototypeRules!=='undefined'?PrototypeRules:require('./rules.js');
function draw(ctx,e,p,region=0,rescued=false){
 if(e.kind==='landmark'&&e.id?.startsWith('bridge-'))return; // The full deck is drawn in world space.
 ctx.save();ctx.translate(p.x,p.y);ctx.lineJoin='round';ctx.lineCap='round';
 const ink='#25312d',bone='#e7ddbf',steel='#9eafb6',gold='#d3b46c',skin='#dfb18b';
 const poly=(v,c)=>{ctx.fillStyle=c;ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.beginPath();v.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
 const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
 const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
 const line=(v,c,w=2)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();v.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
 const eye=(x,y,c='#f5df9a')=>rect(x,y,2,2,c);
 const hash=value=>{let h=2166136261>>>0;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const variant=hash(e.id||e.name||e.species||e.family||e.kind||'azeroth'),flip=variant&1?-1:1;
 const shade=(rx=22,ry=7,a=.24)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#07110d';ctx.beginPath();ctx.ellipse(0,10,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();};
 const glint=(x,y,c='#f3d690',r=2)=>{ctx.save();ctx.globalAlpha=.85;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();};
 function wildProp(){
  const rock=e.icon==='🪨'||region===4,jitter=(variant>>>3)%7-3;
  if(rock){
   const base=region===4?'#55515c':region===2?'#7d8179':'#788579',light=region===4?'#8e8398':region===2?'#adb09f':'#9fac98';
   shade(23,7,.18);poly([[-23,9],[-19,-10],[-6,-24],[13,-20],[24,-2],[18,10]],base);poly([[-19,-10],[-6,-24],[0,-3],[-23,9]],light);poly([[0,-3],[13,-20],[24,-2],[18,10]],region===4?'#45434e':'#667268');
   line([[-7,-19],[-2,-7],[7,-11]],region===4?'#b38aa5':'#c0c5ad',1.3);
   if(region===4){poly([[7,-8],[12,-22],[17,-9]],'#8f7eb0');glint(12,-15,'#d7c1ee',1.5);}
   else if(variant%4===0){for(const [x,y] of [[-9,2],[2,4],[10,1]])oval(x,y,3,2,'#87966e');}
   return;
  }
  shade(22,6,.14);
  if(region===0){
   rect(-4,-12,8,28,'#76583b');line([[-3,-3],[9,-13]],'#8b6944',3);line([[3,-5],[-10,-16]],'#8b6944',3);
   for(const [x,y,rx,ry,c] of [[-12,-28,16,12,'#426d48'],[5,-34,19,14,'#537e52'],[15,-21,14,11,'#355f42'],[-2,-17,17,10,'#628756']])oval(x+jitter*.3,y,rx,ry,c);
   if(variant%3===0){for(const [x,c]of [[-13,'#e7d08a'],[4,'#cfa4ad'],[12,'#e9dfb2']])glint(x,5,c,1.4);}
  }else if(region===1){
   rect(-3,-10,6,24,'#6f6044');for(const [x,y]of [[-12,-24],[0,-32],[13,-22],[-5,-14],[10,-10]])oval(x,y,12,8,y<-25?'#507466':'#5d8068');
   for(const x of [-17,-11,13,18]){line([[x,10],[x+flip*3,-14]],'#71825f',2);poly([[x-3,-13],[x+3,-17],[x+5,-10]],'#879a70');}
   if(variant%4===0){oval(-8,7,5,2,'#9eb29b');oval(7,4,4,2,'#a8bbb0');glint(7,3,'#d9e6d1',1);}
  }else if(region===2){
   rect(-4,-8,8,26,'#6e5a42');for(const [y,w,c]of [[0,24,'#48624a'],[-15,20,'#587159'],[-30,15,'#6c8166'],[-42,9,'#809276']])poly([[-w,y],[0,y-26],[w,y]],c);
   line([[-4,4],[-14,12]],'#8b7654',2);line([[4,4],[14,12]],'#8b7654',2);if(variant%5===0){for(const x of [-8,6])glint(x,10,'#b9a4d5',1.5);}
  }else{
   rect(-4,-14,8,30,'#58483d');line([[0,-10],[-17,-28]],'#665046',4);line([[0,-4],[17,-23]],'#665046',4);line([[-17,-28],[-24,-35]],'#665046',2);line([[17,-23],[25,-29]],'#665046',2);
   for(const [x,y]of [[-5,-7],[4,-16],[10,-2]]){poly([[x-3,y+6],[x,y-8],[x+4,y+6]],'#7d5b47');if(variant%3===0)glint(x,y,'#d68c58',1);}
  }
 }
 function enemyFinish(){
  switch(e.species){
   case 'goblin':rect(-9,-14,18,5,'#6d5138');for(const x of [-6,0,6])glint(x,-11,x===0?'#d4b46b':'#98825b',1);if(e.ranged)line([[-13,-7],[-18,8]],'#5f4634',3);break;
   case 'skeleton':for(const y of [-12,-7,-2])line([[-7,y],[7,y]],'#c9bea5',1);if(e.guard)poly([[-12,-18],[-17,-8],[-11,1],[-5,-9]],'#665f59');glint(-3,-28,'#e7c56f',1.4);glint(3,-28,'#e7c56f',1.4);break;
   case 'wolf':line([[-16,-14],[-8,-9],[0,-15],[8,-9]],'#667873',2);for(const x of [-15,-5,7,17])line([[x,2],[x+flip*2,11]],'#d6cfb0',1);break;
   case 'mireling':for(let x=-14;x<17;x+=8)poly([[x,-9],[x+3,-15],[x+7,-9]],'#52684f');for(const x of [17,25,33])glint(x,-5,'#d8cf8c',1);break;
   case 'reedbeast':line([[-14,-4],[-6,3],[3,-4],[11,3]],'#65794f',2);for(const x of [-18,18])line([[x,8],[x+flip*5,15]],'#4e674a',3);if(e.hybrid)glint(13,-2,'#b9d6b4',1.8);break;
   case 'ogre':poly([[-15,-17],[-23,-20],[-24,-8],[-14,-9]],'#77786d');line([[-8,-24],[7,-19]],'#735a48',2);for(const y of [-19,-13])line([[20,y],[31,y+2]],'#c2b28c',1.5);break;
   case 'orc':for(const x of [-4,4])poly([[x,-23],[x+(x<0?-3:3),-18],[x,-17]],bone);rect(-11,-10,22,5,'#5d5549');line([[-8,-15],[8,-4]],'#a28c65',2);break;
   case 'archer':line([[-14,-28],[-18,-3]],'#725a3d',4);for(const y of [-22,-17,-12])line([[-17,y],[-11,y-5]],'#d9cba7',1);break;
   case 'crownguard':poly([[-13,-35],[0,-47],[13,-35],[8,-31],[-8,-31]],'#7b6877');line([[-8,-17],[8,-17]],'#c4ae7a',2);for(const x of [-7,7])glint(x,-29,'#d9a87c',1);break;
   case 'ashbeast':for(const [x,y]of [[-9,-2],[2,4],[12,-5]])line([[x-3,y],[x+3,y-4]],'#e0a06a',1.5);for(const x of [-22,22])glint(x,-13,'#efb071',1.5);break;
   case 'wraith':case 'stalker':ctx.save();ctx.globalAlpha=.35;for(const x of [-12,0,12])oval(x,7,8,4,e.species==='stalker'?'#8d6670':'#8db7b1');ctx.restore();glint(0,-24,e.species==='stalker'?'#e2a0a4':'#c6eee2',2);break;
  }
  if(e.guard){line([[-13,8],[0,12],[13,8]],'#a49573',1.5);rect(-3,-21,6,3,'#b6a373');}
 }
 function bossPolish(family){
  switch(family){
   case 'thorn':for(const side of [-1,1]){line([[side*10,-23],[side*19,-40],[side*27,-45]],'#79664c',3);line([[side*19,-39],[side*30,-35]],'#79664c',2);}for(const x of [-18,-8,4,15])poly([[x,-8],[x+4,-14],[x+8,-7]],'#58704b');break;
   case 'mire':for(let x=-18;x<20;x+=9)poly([[x,-11],[x+4,-22],[x+9,-10]],'#53694f');for(const x of [21,29,37])poly([[x,0],[x+3,4],[x+6,0]],bone);line([[-22,4],[18,5]],'#4d604b',2);break;
   case 'crypt':poly([[-17,-42],[-10,-49],[-4,-44],[0,-52],[5,-44],[12,-50],[18,-42]],'#8c826e');for(const y of [-13,-6])line([[-13,y],[13,y]],'#c9bea8',2);line([[18,-2],[31,11]],'#7f7665',2);break;
   case 'archive':ctx.save();ctx.globalAlpha=.45;for(const r of [27,34]){ctx.strokeStyle='#8fc8c5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,7,r,r*.32,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-11,0,11])oval(x,-11,2,3,'#9eb8a8');break;
   case 'ridge':poly([[-22,-19],[-31,-24],[-28,-10],[-18,-8]],'#9b9487');poly([[18,-19],[30,-24],[28,-9],[18,-8]],'#83796e');line([[-10,-35],[0,-43],[10,-35]],'#d2c8a5',2);for(const x of [24,31])glint(x,-31,'#e1d6b0',1);break;
   case 'mine':for(const [x,y]of [[-12,-27],[0,-18],[12,-28],[-7,-5],[9,0]]){line([[x-4,y+4],[x,y-4],[x+4,y+4]],'#e7c97e',1.7);glint(x,y,'#f2d58b',1);}poly([[-29,-20],[-36,-29],[-25,-31]],'#a5afa3');poly([[29,-18],[36,-27],[25,-30]],'#a5afa3');break;
   case 'warlord':poly([[-18,-17],[-30,-25],[-28,10],[-15,7]],'#74484b');for(const x of [-7,0,7])oval(x,-11,2,2,'#d2bd8b');line([[30,-37],[30,8]],'#cfb77e',2);break;
   case 'abyss':for(const side of [-1,1]){line([[side*8,-42],[side*16,-60]],'#d6c2a3',2.5);poly([[side*7,-17],[side*14,-25],[side*20,-15]],'#8f617c');}for(const y of [-18,-9,0])line([[-7,y],[7,y]],'#d6a98d',2);break;
   case 'citadel':for(const y of [-21,-12,-3])line([[-15,y],[15,y]],'#b2c0bc',2);for(const x of [-18,18])poly([[x,-11],[x+(x<0?-8:8),-18],[x+(x<0?-7:7),-5]],'#8fa3a4');glint(0,-15,'#ffc97a',3);break;
   case 'darklord':ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#bb8cc0';for(const r of [25,33]){ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,6,r,r*.28,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const [x,y]of [[-10,-17],[0,-9],[10,-17]])poly([[x-3,y],[x,y-5],[x+3,y],[x,y+5]],'#b78ab8');line([[19,-22],[27,-2]],'#dbc5dd',2);break;
  }
  if(e.form==='true'){ctx.save();ctx.globalAlpha=.4;ctx.strokeStyle='#f1d28a';ctx.lineWidth=2;for(const r of [31,39]){ctx.beginPath();ctx.ellipse(0,11,r,r*.28,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-24,24])glint(x,-34,'#f6df9f',2);}
 }
 function sword(x,y){poly([[x,y],[x+3,y-25],[x+6,y],[x+3,y+3]],steel);line([[x-3,y+3],[x+9,y+3]],gold,3);line([[x+3,y+3],[x+3,y+11]],'#75573c',3);}
 function shield(x,y,c){poly([[x-8,y-8],[x+8,y-8],[x+7,y+7],[x,y+14],[x-7,y+7]],c);line([[x,y-6],[x,y+9]],gold);}
 function bow(x,y){line([[x,y-19],[x+8,y-11],[x+10,y],[x+7,y+12],[x,y+19]],'#ba9562',3);line([[x,y-19],[x,y+19]],'#e9d7ac',1);line([[x-6,y],[x+17,y]],'#c5bb95',1.5);}
 function humanoid(color,head=skin,bulk=1){rect(-9*bulk,3,7*bulk,12,'#414744');rect(2*bulk,3,7*bulk,12,'#414744');poly([[-12*bulk,5],[-10*bulk,-18],[10*bulk,-18],[12*bulk,5]],color);oval(0,-28,8*bulk,9,head);line([[-9*bulk,-13],[-16*bulk,-1]],color,5);line([[9*bulk,-13],[15*bulk,-1]],color,5);rect(-9*bulk,-1,18*bulk,3,'#705c42');}
 function skull(x=0,y=-28,r=8){oval(x,y,r,r,bone);rect(x-r*.6,y+4,r*1.2,6,bone);oval(x-3,y,2,2,ink);oval(x+3,y,2,2,ink);line([[x-3,y+7],[x+3,y+7]],ink,1);}
 function wolf(c='#8c9998',large=false){poly([[-24,0],[-20,-15],[-2,-19],[17,-12],[20,3]],c);poly([[-20,-11],[-35,-20],[-30,-5],[-21,1]],c);for(const x of [-17,-7,10,18])line([[x,0],[x-2,13]],c,5);poly([[9,-18],[12,-30],[19,-24],[23,-31],[27,-17],[35,-12],[31,-6],[17,-7]],c);eye(24,-18);poly([[28,-9],[31,-8],[29,-4]],bone);if(large){poly([[-22,-12],[-20,-28],[-10,-21],[-5,-29],[1,-17]],'#4e6246');line([[-11,-24],[-15,-35]],'#a0ae76',3);}}
 function crocodile(c='#71886a'){poly([[-18,2],[-38,-3],[-48,4],[-22,10]],c);oval(-2,0,25,13,c);poly([[12,-10],[34,-10],[45,-4],[44,5],[16,7]],c);for(const x of [-15,7]){poly([[x,3],[x-9,12],[x+3,12]],c);poly([[x,-5],[x-7,-16],[x+5,-14]],c);}for(let x=-19;x<13;x+=8)poly([[x,-10],[x+4,-18],[x+8,-10]],'#455b47');line([[20,1],[43,1]],ink);eye(25,-9);for(let x=24;x<43;x+=6)poly([[x,1],[x+3,5],[x+4,1]],bone);}
 function dragon(c='#765080'){poly([[-9,-12],[-26,-45],[-53,-30],[-39,-8],[-25,-16]],c);poly([[10,-13],[31,-44],[55,-22],[39,-7],[25,-15]],c);line([[-10,-12],[-26,-43],[-39,-9]],'#c39783');line([[10,-13],[31,-42],[39,-8]],'#c39783');oval(0,-7,15,22,c);poly([[-7,8],[-25,21],[-37,12],[-25,26],[1,19]],c);poly([[-5,-31],[0,-48],[14,-45],[26,-34],[18,-27],[1,-26]],c);poly([[3,-43],[-3,-56],[10,-46]],bone);poly([[12,-43],[16,-55],[20,-39]],bone);eye(15,-37);line([[-9,7],[-17,21]],c,7);line([[8,9],[18,22]],c,7);line([[-5,-12],[5,-12]],'#d1b18e',3);line([[-6,-4],[6,-4]],'#d1b18e',3);}
 function human(role){const cloth=role==='mage'?'#637ca5':role==='ranger'||role==='archer'?'#5d865f':role==='worker'?'#af9063':'#708c9c';humanoid(cloth);if(role==='mage'){poly([[-13,-34],[0,-56],[13,-34]],'#677da7');poly([[-13,6],[-9,-16],[9,-16],[15,6]],'#536791');line([[17,-35],[17,14]],'#b19365',3);oval(17,-38,5,6,'#8cd2e1');rect(-3,-14,6,6,gold);}else if(role==='ranger'||role==='archer'){poly([[-10,-26],[-7,-39],[0,-44],[9,-37],[11,-26],[6,-32],[-5,-32]],'#466d4d');poly([[-11,-16],[-18,9],[-4,6]],'#43644b');bow(14,-7);line([[-15,-27],[-19,4]],'#9c7953',5);line([[-19,-29],[-14,-26]],bone,2);}else if(role==='worker'){poly([[-10,-33],[-7,-40],[6,-40],[11,-33]],'#ceab64');rect(-6,-14,12,16,'#665343');line([[17,-28],[10,14]],'#ae8c60',3);line([[9,-28],[24,-24]],steel,4);rect(-15,-3,9,10,'#af8558');}else{poly([[-9,-30],[-7,-40],[6,-40],[10,-29]],steel);line([[-7,-28],[6,-28]],ink,2);rect(-7,-17,14,14,steel);oval(-11,-17,5,4,steel);oval(11,-17,5,4,steel);shield(-16,-1,role==='paladin'?'#497694':'#6a8178');sword(15,-6);if(role==='paladin'){line([[0,-16],[0,-5]],gold,3);line([[-4,-12],[4,-12]],gold,2);poly([[8,-16],[17,8],[8,5]],'#916854');}}}
 function hero(role){
  const cape=role==='paladin'?'#785848':role==='mage'?'#394f78':'#355643';
  poly([[-10,-21],[-18,11],[-7,8],[0,13],[12,8],[16,-18]],cape);human(role);
  line([[-7,6],[-7,13]],'#b2b6a7',1);line([[5,6],[5,13]],'#b2b6a7',1);
  if(role==='paladin'){
   poly([[-12,-18],[-19,-17],[-15,-9],[-9,-10]],'#bfd0d4');poly([[10,-18],[17,-16],[15,-9],[9,-10]],'#c1d0d5');
   line([[-5,-39],[5,-39]],'#e0e9df',1.5);line([[-7,-31],[7,-31]],'#536b75',2);line([[-5,-17],[-5,-4]],'#d2dcd7',1.5);line([[6,-16],[6,-4]],'#718894',1);
   poly([[-17,-5],[-12,1],[-17,7],[-22,1]],'#e3c47e');line([[-17,-3],[-17,5]],'#f3e2ad',1);line([[18,-28],[18,-9]],'#dce8e0',1);oval(0,0,2,2,gold);
  }else if(role==='mage'){
   rect(-4,-29,2,2,'#354552');rect(3,-29,2,2,'#354552');line([[-1,-24],[2,-24]],'#ab7965',1);
   line([[-8,-35],[9,-35]],'#c6b987',2);poly([[-2,-47],[1,-42],[5,-43],[2,-39],[-2,-41]],'#e3d5a1');
   line([[-8,-13],[-10,3]],'#8bafd0',1.5);line([[7,-13],[10,3]],'#36456c',1.5);line([[-9,5],[12,5]],'#b6b88d',2);
   oval(17,-38,3,4,'#c7f0ed');line([[15,-40],[18,-40]],'#f4fff1',1);line([[14,-26],[20,-26]],gold,2);poly([[0,-12],[3,-9],[0,-6],[-3,-9]],'#a9d7e0');
  }else{
   rect(-4,-29,2,2,'#344338');rect(3,-29,2,2,'#344338');line([[-1,-24],[2,-24]],'#a47660',1);
   line([[-8,-36],[-4,-40],[2,-41]],'#91aa76',1.5);line([[-7,-16],[7,-4]],'#c3aa79',3);line([[-6,-16],[8,-4]],'#755b40',1);
   line([[-13,-10],[-15,5]],'#789a6d',1.5);line([[13,-23],[19,-15],[22,-7]],'#d8bd8a',1.5);
   for(const x of [-19,-16,-13]){line([[x,-30],[x+2,-18]],'#d9caa3',1);poly([[x,-31],[x-3,-36],[x+1,-35]],'#d2d7bd');}oval(3,-6,2,2,gold);
  }
 }
 function specialist(e){
  const style={
   thorn:{cloth:'#62856c',cape:'#435b4c',hair:'#765d43',trim:'#d0be78'},
   crypt:{cloth:'#806f60',cape:'#514b45',hair:'#504739',trim:'#bcb2a0'},
   mire:{cloth:'#538486',cape:'#355c62',hair:'#413c36',trim:'#a8ccbb'},
   archive:{cloth:'#6a8393',cape:'#455766',hair:'#746755',trim:'#c9d1b3'},
   ridge:{cloth:'#857d68',cape:'#586358',hair:'#5b5348',trim:'#c5b38a'},
   mine:{cloth:'#787a70',cape:'#4f5550',hair:'#54483e',trim:'#c5ab7a'},
   warlord:{cloth:'#936a63',cape:'#5c4147',hair:'#292d30',trim:'#d6b283'},
   abyss:{cloth:'#69637f',cape:'#47405e',hair:'#5c5862',trim:'#c6a5ba'},
   citadel:{cloth:'#77828d',cape:'#4b5765',hair:'#c7c2ae',trim:'#e2ce91'},
   darklord:{cloth:'#957866',cape:'#4c4547',hair:'#ddd0ad',trim:'#e5c381'}
  }[e.family];
  if(!style){human(e.kind==='teacher'?'mage':'worker');return;}
  const teacher=e.kind==='teacher',chemist=e.kind==='alchemist';
  poly([[-12,-18],[-18,12],[0,8],[16,12],[12,-19]],style.cape);
  humanoid(style.cloth,skin,1);
  // Each service has its own headgear and a large, readable hand-held tool.
  switch(e.family){
   case 'thorn':poly([[-10,-34],[-9,-42],[0,-46],[10,-41],[10,-34]],style.hair);line([[-10,-35],[10,-35]],style.trim,2);line([[18,-36],[18,16]],'#9f845e',3);poly([[10,-37],[18,-43],[26,-37],[18,-32]],'#b6c894');rect(-17,-10,11,17,'#b6a17a');break;
   case 'crypt':rect(-13,-18,26,28,'#5e5146');rect(-9,-10,18,13,'#826b51');line([[-12,-17],[12,-17]],style.trim,3);line([[21,-28],[15,15]],'#a38b63',4);rect(14,-32,17,8,steel);poly([[-10,-40],[10,-40],[11,-34],[-11,-34]],style.hair);break;
   case 'mire':poly([[-12,-35],[0,-51],[12,-35]],style.cape);line([[-10,-33],[10,-33]],style.trim,2);line([[17,-34],[17,15]],'#9c8e70',3);oval(17,-37,7,7,'#79bdc4');line([[13,-39],[21,-39]],'#d0e4ca');break;
   case 'archive':rect(-11,-44,22,5,style.hair);rect(-15,-39,30,4,'#647f83');rect(-18,-8,11,17,'#9c8060');oval(20,-4,7,10,'#74afb4');rect(15,-15,10,4,style.trim);line([[22,-17],[22,-11]],steel,2);break;
   case 'ridge':poly([[-13,-33],[-10,-45],[9,-45],[14,-33]],'#68695f');line([[-12,-33],[13,-33]],style.trim,3);poly([[-14,-17],[0,-23],[14,-17]],'#a6aa91');line([[19,-35],[19,16]],'#9b815b',4);poly([[11,-37],[19,-48],[26,-37]],'#a9b0a0');break;
   case 'mine':rect(-14,-20,28,30,'#5f5a4d');rect(-9,-12,18,14,'#806d53');rect(-12,-42,24,8,'#a1a59a');line([[-11,-41],[11,-41]],style.trim,2);line([[22,-27],[16,14]],'#947854',3);rect(16,-32,17,7,steel);break;
   case 'warlord':poly([[-12,-41],[0,-47],[12,-41],[10,-31],[-10,-31]],'#56575a');poly([[-17,-17],[-10,-21],[-5,-12],[-15,-9]],steel);poly([[6,-15],[12,-22],[19,-14],[14,-9]],steel);line([[19,-36],[19,16]],'#8f7059',3);poly([[12,-37],[19,-43],[26,-37],[19,-32]],style.trim);break;
   case 'abyss':poly([[-12,-39],[0,-49],[12,-39],[7,-33],[-7,-33]],style.hair);rect(-14,-10,12,18,'#765c64');line([[17,-35],[17,16]],'#928396',3);poly([[17,-44],[25,-35],[17,-27],[9,-35]],'#bd9abc');line([[17,-41],[17,-30]],'#dfc6cd',2);break;
   case 'citadel':poly([[-12,-42],[0,-54],[12,-42],[9,-32],[-9,-32]],'#9da8ad');line([[-12,-37],[12,-37]],style.trim,2);line([[18,-44],[18,16]],'#b7a986',4);oval(18,-45,7,8,'#d4b66c');poly([[-6,-15],[0,-20],[6,-15],[0,-9]],style.trim);break;
   case 'darklord':rect(-16,-18,32,28,'#665344');rect(-10,-8,20,16,'#8c694d');line([[-13,-17],[13,-17]],style.trim,3);poly([[-13,-41],[-7,-48],[10,-46],[14,-39]],'#e0d2b4');line([[20,-37],[14,16]],'#9e7f59',4);rect(14,-41,23,10,'#c0b9a4');rect(-7,-13,14,4,style.trim);break;
  }
  if(teacher){line([[-5,-16],[-5,-3]],style.trim,1.5);line([[5,-16],[5,-3]],style.trim,1.5);}
  else if(chemist){oval(-9,-15,3,3,'#9bd2cf');oval(0,-15,3,3,'#c9a6a8');}
  else{for(const x of [-5,0,5])oval(x,-13,1.5,1.5,style.trim);}
  eye(-4,-28,'#433e34');eye(3,-28,'#433e34');
 }
 function bossFinish(family){switch(family){
  case 'thorn':line([[-19,-10],[-9,-14],[-2,-12]],'#c0a378',2);line([[14,-22],[21,-19],[28,-15]],'#d2b98b',1.5);line([[18,-9],[29,-8]],'#594538',1.5);eye(24,-18,'#f2d680');poly([[-7,-17],[-4,-23],[0,-17]],'#d2bc80');break;
  case 'mire':for(const x of [-15,-5,5])poly([[x,-7],[x+4,-10],[x+7,-6],[x+3,-3]],'#9ba47b');line([[19,-8],[37,-7]],'#b0bd89',1.5);eye(25,-9,'#efcf72');line([[-24,5],[-36,5]],'#9daa76',2);break;
  case 'abyss':line([[-25,-37],[-41,-26],[-31,-15]],'#aa7698',1.5);line([[30,-35],[43,-23],[32,-14]],'#aa7698',1.5);for(const y of [-19,-10,-1])poly([[-4,y],[0,y-3],[5,y],[0,y+4]],'#c29990');eye(15,-37,'#efc690');line([[1,-42],[9,-44],[16,-40]],'#b38aab',1.5);break;
  case 'crypt':for(const y of [-15,-10,-5])line([[-7,y],[0,y+2],[7,y]],'#baaa91',1.5);line([[-7,-34],[0,-37],[7,-34]],'#f4e8ca',1.5);poly([[-18,-5],[-15,-2],[-18,2],[-21,-2]],'#d6be85');line([[21,-31],[29,-32]],'#f4e8cf',1.5);break;
  case 'archive':line([[-8,-25],[0,-42],[7,-25]],'#91b1ac',1.5);for(const x of [-7,0,7])line([[x,-12],[x+2,-8],[x,-4]],'#b4d2c5',1);line([[-9,3],[9,3]],'#a0b7a7',2);oval(23,-29,2,2,'#e9d8a1');break;
  case 'ridge':rect(-6,-29,3,2,'#403e32');rect(4,-29,3,2,'#403e32');poly([[-5,-23],[-4,-18],[-1,-23]],bone);poly([[5,-23],[4,-18],[1,-23]],bone);poly([[-20,-17],[-14,-24],[-7,-17],[-10,-10]],'#b5aca0');poly([[10,-20],[18,-24],[22,-15],[13,-12]],'#746758');line([[-9,-12],[10,-12]],'#beb39b',2);for(const x of [21,29,36])oval(x,-29,1.5,1.5,'#d1c7a7');line([[20,-34],[38,-34]],'#bcc4b5',1.5);break;
  case 'mine':poly([[-18,-28],[-12,-33],[-3,-30],[-8,-21]],'#bbc7b0');poly([[8,-30],[15,-32],[21,-21],[12,-24]],'#6a7e77');line([[-7,-18],[0,-24],[7,-18]],'#ffe0a0',1.5);line([[25,-16],[29,-8],[26,0]],'#a8bba3',2);line([[-8,-48],[7,-48]],'#d2dbc3',2);break;
  case 'warlord':poly([[-14,-19],[-23,-22],[-21,-12],[-13,-10]],'#b1b9a7');poly([[12,-20],[21,-21],[24,-11],[14,-10]],'#919e95');line([[-6,-40],[0,-43],[8,-38]],'#d0d7bd',1.5);line([[29,-28],[38,-33],[40,-20]],'#d8dfcc',2);for(const x of [-6,0,6])oval(x,-8,1.2,1.2,gold);break;
  case 'citadel':line([[-8,-47],[-8,-42]],'#d2ded7',2);line([[9,-47],[9,-42]],'#d2ded7',2);poly([[-18,-19],[-11,-24],[-6,-17],[-13,-13]],'#b3c5c2');poly([[9,-22],[18,-18],[14,-11],[7,-15]],'#9eb4b5');line([[-24,-5],[-24,7]],'#d4b97b',2);oval(0,-16,2.5,3,'#ffe0a2');line([[24,-35],[34,-37]],'#e1e6d2',2);break;
  case 'darklord':poly([[-12,-20],[-20,-25],[-21,-17],[-13,-11]],'#8990a3');poly([[11,-20],[19,-25],[21,-16],[12,-11]],'#788297');line([[-6,-39],[0,-44],[6,-39]],'#b9bdc2',1.5);poly([[0,-19],[5,-12],[0,-6],[-5,-12]],'#b48fbc');poly([[0,-16],[2,-12],[0,-9],[-2,-12]],'#e3b9df');line([[-14,8],[-9,-6]],'#6c5b83',2);line([[10,7],[13,-4]],'#6c5b83',2);eye(-5,-32,'#f0bcad');eye(3,-32,'#f0bcad');line([[24,-38],[24,-20]],'#d4d8e0',1.5);break;
 }}
 function gate(family){const colors={crypt:'#929583',archive:'#6f9897',mine:'#8e8679',abyss:'#75545b',citadel:'#6a7082'},c=colors[family]||'#9b9988';rect(-30,-32,60,44,c);rect(-17,-21,34,34,'#172727');poly([[-34,-31],[0,-56],[34,-31]],c);for(const x of [-27,20]){rect(x,-30,7,40,'#b1b1a0');line([[x,-19],[x+7,-19]],ink,1);line([[x,-7],[x+7,-7]],ink,1);}if(family==='crypt')skull(0,-39,5);else if(family==='archive'){line([[-9,-37],[0,-42],[9,-37]],'#bdd9cb');rect(-18,9,36,3,'#65969d');}else if(family==='mine'){line([[-16,-36],[16,-36]],'#bc9a6e',4);line([[-10,-44],[9,-29]],steel,3);}else{poly([[-30,-33],[-33,-48],[-22,-34]],gold);poly([[30,-33],[33,-48],[22,-34]],gold);oval(0,-40,4,6,family==='abyss'?'#d78357':'#e8b766');}}
 function building(kind){
  const wall=['#baa888','#aab1a1','#a1aaa4','#a18e7b','#929ba5'][region],roof=['#9b6350','#618789','#727a73','#76585a','#596478'][region];
  if(kind==='quests'){rect(-21,-40,42,31,'#725a42');rect(-17,-36,34,25,'#dbcba5');rect(-17,-10,4,27,'#70563c');rect(13,-10,4,27,'#70563c');line([[-17,-36],[17,-36]],'#f0ddb3',2);for(const x of [-11,0,9]){rect(x,-30,7,12,'#f2e2ba');line([[x+1,-27],[x+5,-27]],'#a38b63',1);}for(const x of [-13,13])oval(x,-34,1.5,1.5,gold);rect(-21,-41,42,3,'#bd9c65');return;}
  if(kind==='supplier'){rect(-22,-8,44,22,'#93724d');rect(-23,-33,4,24,'#786144');rect(19,-33,4,24,'#786144');poly([[-29,-27],[-19,-42],[22,-42],[29,-27]],'#ceb981');line([[-27,-27],[27,-27]],'#f1d69d',2);for(const x of [-16,-2,12])rect(x,-40,7,12,'#687f70');oval(-11,-5,6,5,'#bac481');rect(1,-9,8,10,'#c09469');oval(14,-4,4,7,'#718ba4');line([[-20,11],[21,11]],'#bd9868',2);return;}
  if(kind==='barracks'&&Number.isFinite(e.progress)&&e.progress<4){
   const timber=['#8a6a49','#7a7258','#7b6f58','#66564a','#555563'][region],base=['#6f765c','#667b78','#777a70','#65524a','#545867'][region];
   rect(-28,7,56,7,base);for(const x of [-23,0,23]){rect(x-3,-28,6,42,timber);poly([[x-4,-28],[x,-37],[x+4,-28]],roof);}
   line([[-27,-17],[27,3]],'#c1a477',3);line([[27,-17],[-27,3]],'#c1a477',3);rect(-18,-34,36,4,timber);
   if(region===1){for(const x of [-24,-8,8,24])line([[x,13],[x,22]],'#7d7255',3);line([[-29,16],[29,16]],'#9a8a65',3);}
   if(region===2){for(const x of [-25,-8,9])rect(x,10,16,7,'#777e74');}
   if(region===3){for(const x of [-24,24])line([[x,-31],[x-7,-41]],'#4f4a43',3);}
   if(region===4){for(const x of [-18,18])poly([[x-5,10],[x,-3],[x+5,10]],'#77718c');}
   return;
  }
  rect(-23,-22,46,37,wall);poly([[23,-22],[35,-15],[35,10],[23,15]],'#737f75');poly([[-29,-22],[0,-47],[30,-22]],roof);poly([[0,-47],[12,-43],[36,-15],[30,-22]],'#4b5957');line([[-26,-23],[0,-44],[27,-22]],'#dfc9a0',2);line([[30,-20],[36,-15],[36,10]],'#8c9687',1.5);rect(-7,-5,14,20,'#504d40');rect(-18,-14,8,9,'#87a7a2');rect(11,-14,8,9,'#87a7a2');for(const x of [-17,12])line([[x,-12],[x+6,-12]],'#c8d7b9',1.5);line([[-23,2],[-9,2]],'#746b56',1);line([[-22,11],[22,11]],'#897f68',2);
  if(kind==='recruiter'){rect(11,-51,3,30,'#b6a47f');poly([[14,-50],[32,-46],[14,-37]],'#768fb0');shield(0,-24,'#839a9d');return;}
  if(kind==='barracks'){
   rect(11,-54,3,33,['#8d7652','#81775d','#77766d','#62544b','#676675'][region]);
   poly([[14,-52],[34,-47],[14,-35]],[ '#738f69','#60858a','#7e856f','#825e55','#6b6178'][region]);
   shield(0,-24,['#829879','#738f91','#8d9185','#8e6f62','#767487'][region]);
   if(region===0){for(const [x,y]of [[-30,8],[-20,12]]){rect(x-8,y-6,17,7,'#826143');oval(x+9,y-3,3,3,'#c09a68');}line([[-27,-26],[-19,-38]],'#6f8c61',2);line([[-19,-38],[-13,-31]],'#6f8c61',2);}
   else if(region===1){rect(-29,11,58,5,'#756c54');for(const x of [-24,-8,8,24])line([[x,14],[x,23]],'#6e6752',3);for(const x of [-20,-10,0,10,20])line([[x,-41],[x+4,-25]],'#8b8061',1.5);line([[-33,-3],[-28,-16]],'#b6aa80',2);line([[-28,-16],[-23,-3]],'#b6aa80',2);}
   else if(region===2){for(const x of [-29,-12,5,22])rect(x,9,14,8,'#767d75');rect(-31,-20,10,18,'#837358');poly([[-28,-24],[-23,-34],[-18,-24]],'#9aa195');oval(29,7,5,4,'#a28d68');}
   else if(region===3){for(const x of [-30,29]){rect(x-3,-27,6,42,'#514a43');poly([[x-4,-27],[x,-39],[x+4,-27]],'#79604e');}rect(-30,-10,10,15,'#776f66');line([[-27,-8],[-22,2]],'#aea08d',2);for(const x of [-17,17])oval(x,11,2.5,2.5,'#bf7955');}
   else if(region===4){for(const x of [-29,24])rect(x,-27,7,42,'#5b5e6a');for(const x of [-18,18])poly([[x-6,11],[x,-7],[x+6,11]],'#77718c');poly([[-4,-34],[0,-43],[4,-34],[0,-27]],'#a18caf');line([[-19,8],[19,8]],'#8d8196',2);}
   return;
  }
  rect(14,-43,7,17,'#9a8e7c');rect(-5,-24,10,8,gold);
 }
 function decoration(kind){switch(kind){
 case 'torch':line([[0,-6],[0,16]],'#807660',4);poly([[-8,-7],[-4,-24],[0,-16],[5,-29],[9,-7]],'#d99753');poly([[-3,-7],[0,-18],[4,-7]],'#f2cf7c');break;
 case 'coffin':poly([[-18,-14],[-12,-24],[12,-24],[19,-12],[15,16],[-15,16]],'#787e75');line([[-7,-17],[7,-17]],'#b3b6a1',2);line([[0,-21],[0,3]],'#b3b6a1',2);break;
 case 'bones':skull(-9,-5,6);line([[0,5],[18,-7]],bone,4);line([[1,-6],[18,7]],bone,4);break;
 case 'banner':line([[0,-55],[0,15]],steel,3);poly([[2,-52],[27,-49],[24,-19],[14,-10],[3,-19]],region===4?'#785266':'#876c5a');line([[13,-41],[13,-24]],gold,2);break;
 case 'shelf':rect(-24,-43,48,57,'#716b53');for(const y of [-34,-16,3]){line([[-21,y+14],[21,y+14]],'#aa926a',3);for(let x=-17;x<20;x+=7)rect(x,y,5,12,x%2?'#6a8d8f':'#a28f72');}break;
 case 'water':oval(0,5,29,12,'#526e75');for(const y of [2,7])line([[-19,y],[20,y]],'#79a6a8',2);break;
 case 'rune':oval(0,5,24,11,'#738287');poly([[0,-7],[10,4],[0,14],[-10,4]],'#a6b8bc');line([[0,-1],[0,9]],'#c7d5c2',2);break;
 case 'crate':rect(-20,-16,40,30,'#9b7953');line([[-20,-16],[20,14]],'#c6aa78',3);line([[20,-16],[-20,14]],'#c6aa78',3);break;
 case 'rail':for(const y of [-10,0,10])line([[-24,y],[24,y]],'#8d7354',4);line([[-14,-18],[-14,17]],steel,3);line([[14,-18],[14,17]],steel,3);break;
 case 'crystal':for(const x of [-12,0,12])poly([[x-5,12],[x-5,-15],[x,-25],[x+5,-15],[x+5,12]],'#83a7b1');break;
 case 'chain':for(let y=-48;y<12;y+=9)oval(0,y,4,6,'#9ca59e');oval(0,13,12,7,'#6c7674');break;
 case 'ember':oval(0,5,27,12,'#4d4945');for(const x of [-13,0,13])poly([[x-5,8],[x,-9],[x+7,8]],'#b7784e');break;
 case 'armor':humanoid('#88999d',steel);rect(-25,7,50,9,'#6b756f');shield(-19,-1,'#626f79');break;
 }}
 const type=e.renderKind;
 if(type==='prop'){if(e.decorative)decoration(e.structure);else if(e.structure==='fence'){for(const x of [-18,0,18])rect(x-2,-18,4,30,'#a48c69');line([[-23,-12],[23,-12]],'#9c835e',4);line([[-23,2],[23,2]],'#9c835e',4);}else if(e.structure==='house'||e.structure==='workshop'){building(e.structure);if(e.structure==='workshop'){rect(-25,-12,12,15,'#8e7150');line([[-26,-15],[-10,-15]],steel,4);}}else if(['stonewall','stockade','palisade'].includes(e.structure)){if(e.structure==='stonewall'){rect(-28,-28,56,42,'#858d85');for(const y of [-22,-10,2])line([[-27,y],[27,y]],'#59685e',2);for(const x of [-21,-3,15]){line([[x,-27],[x,-12]],'#59685e',2);line([[x+9,-10],[x+9,3]],'#59685e',2);}for(const x of [-28,-7,14])rect(x,-35,14,10,'#9ea79b');}else{for(const x of [-24,-12,0,12,24]){rect(x-4,-28,8,42,'#977752');poly([[x-4,-28],[x,-40],[x+4,-28]],'#b49465');}line([[-27,-16],[27,-16]],'#675c40',4);line([[-27,3],[27,3]],'#675c40',4);}}else if(e.structure==='pillar'){rect(-13,-44,26,58,'#9ca49a');rect(-18,-48,36,8,'#bac0ad');rect(-18,10,36,8,'#8a9488');for(const x of [-7,0,7])line([[x,-39],[x,6]],'#747f75',1);}else if(e.icon==='🪨'){poly([[-20,7],[-18,-12],[-3,-24],[14,-17],[24,4]],'#849183');poly([[-18,-12],[-3,-24],[3,-4],[-20,7]],'#a0ad9b');line([[3,-4],[14,-17]],'#647466');}else wildProp();}else if(type==='node'){if(e.icon==='🪵'){for(const [x,y]of [[-12,2],[2,-3],[10,7]]){rect(x-12,y-8,24,10,'#836244');oval(x+12,y-3,4,5,'#c9a572');oval(x+12,y-3,2,3,'#916b44');}}else if(e.icon==='🧺'){poly([[-19,-3],[19,-3],[13,14],[-13,14]],'#aa885e');line([[-13,-3],[-8,-17],[8,-17],[13,-3]],'#bca06d',3);for(const y of [1,5,9])line([[-14,y],[14,y]],'#795f42',1);}else if(e.icon==='💎'){for(const [x,y]of [[-10,2],[0,-7],[10,4]])poly([[x-6,y],[x-5,y-20],[x,y-28],[x+6,y-18],[x+6,y]],'#a89bcf');line([[0,-32],[0,-7]],'#e5ddf6',1);}else{poly([[-18,8],[-13,-12],[0,-23],[18,-9],[22,8]],'#7d8781');for(const [x,y]of [[-7,-8],[7,-12],[12,1]])poly([[x-4,y],[x,y-5],[x+5,y],[x,y+4]],'#c1a16b');}}
 else if(type==='building'||['rest','supplier','recruiter','quests'].includes(e.kind))building(type==='building'?'barracks':e.kind);
 else if(e.kind==='cage'){rect(-20,-35,40,49,'#746c58');rect(-17,-31,34,41,'#23302b');if(!rescued)specialist({...e,kind:['archive'].includes(e.family)?'alchemist':['thorn','mire','ridge','warlord','citadel'].includes(e.family)?'teacher':'smith'});for(const x of [-16,-8,0,8,16])line([[x,-32],[x,12]],'#b3afa0',3);line([[-20,-17],[20,-17]],'#b3afa0');if(rescued){poly([[18,-32],[32,-26],[32,16],[18,12]],'#84887a');}else rect(-3,-8,7,8,gold);}
 else if(e.kind==='dungeon'||e.kind==='exit')gate(e.family);
 else if(e.kind==='transport'){if(e.icon==='🐉'||/Dragon/.test(e.name)) {dragon('#8f9470');rect(-9,-23,18,10,'#997148');}else if(e.icon==='⛵'){poly([[-39,0],[37,0],[22,17],[-24,17]],'#9a7954');line([[-31,5],[30,5]],'#c1a776');line([[0,-48],[0,2]],'#c2ab7c',3);poly([[3,-46],[3,-8],[31,-8]],'#e2d6b1');}else if(e.icon==='🐫'){oval(0,-3,27,15,'#a28d66');oval(-7,-14,10,10,'#ac9770');for(const x of [-17,13])line([[x,4],[x,25]],'#9c835e',5);line([[22,-5],[27,-33]],'#b39b6d',9);oval(32,-34,11,6,'#b39b6d');rect(-14,-25,25,13,'#876e52');rect(-24,-12,12,20,'#9d7155');}else{rect(-27,-13,54,23,'#a4845c');for(const x of [-17,17]){oval(x,12,8,8,'#4f564e');line([[x-5,12],[x+5,12]],'#b4a57d');}poly([[-30,-15],[-18,-37],[18,-37],[30,-15]],'#c9bc93');line([[-19,-35],[19,-35]],'#e1d3ab');}}
 else if(e.kind==='bundle'){rect(-15,-15,30,28,'#a78455');line([[-15,-15],[15,13]],'#d0b079',3);line([[15,-15],[-15,13]],'#d0b079',3);}
 else if(e.kind==='fountain'){oval(0,5,25,10,'#9aa7a5');oval(0,2,20,6,'#65999f');rect(-5,-24,10,26,'#adb6a9');oval(0,-23,13,5,'#bad1bd');line([[0,-38],[0,-24]],'#9ad7d4',3);}
 else if(e.kind==='mini'){rect(-24,-22,48,36,'#7e897f');rect(-12,-16,24,30,'#24372d');for(const x of [-24,12])rect(x,-37,12,50,'#9aa38e');rect(-29,-43,22,8,'#b4b99e');rect(7,-43,22,8,'#b4b99e');}else if(e.kind==='landmark'){if(/bridge|crossing/i.test(e.name)){for(const y of [-5,0,5,10])line([[-25,y],[25,y]],'#b29870',4);for(const x of [-27,27])line([[x,-20],[x,12]],'#8c7756',3);}else if(/pond|shore|dock/i.test(e.name)){oval(0,5,28,10,'#528b94');for(const x of [-16,0,16])line([[x,-6],[x,12]],'#b5a47a',3);}else if(e.icon==='🏕️')poly([[-24,12],[0,-30],[25,12]],'#b8aa7a');else{rect(-12,-25,24,38,'#999d8c');poly([[-15,-26],[0,-42],[16,-26]],'#b0b6a2');line([[-4,-22],[5,-10],[-3,3]],'#65736a');}}
 else if(type==='npc'){if(e.family&&['teacher','smith','alchemist'].includes(e.kind))specialist(e);else{const smith=['smith','alchemist'].includes(e.kind);humanoid(smith?'#8b7770':'#8b9c7b');if(smith&&e.kind==='smith'){rect(-8,-15,16,19,'#675448');line([[18,-20],[12,13]],'#b29367',3);rect(13,-24,15,7,steel);poly([[19,9],[38,9],[32,16],[22,16]],steel);}else if(e.kind==='alchemist'){rect(12,-16,8,4,'#bed3cb');oval(16,-6,7,9,'#789ba1');rect(-8,-37,16,5,'#c9d6ab');}else{line([[17,-31],[17,13]],'#baa373',3);oval(17,-33,4,4,'#c9d6ab');rect(-14,-10,8,14,'#cab483');}}}
 else if(type==='hero')hero(e.class||'paladin');
 else if(type==='ally')human(e.class||e.type||'worker');
 else if(e.type==='boss'){
 shade(e.form==='true'?42:34,e.form==='true'?13:10,e.form==='true'?.42:.32);const bossScale=(e.family==='darklord'||e.family==='mine'||e.family==='abyss'?1.36:1.3)*(e.form==='true'?1.14:1);ctx.scale(bossScale,bossScale);
 switch(e.family){
 case 'thorn':wolf('#a08864',true);break;
 case 'mire':crocodile('#6e8060');poly([[-18,-12],[-12,-29],[-5,-16],[2,-31],[10,-11]],'#b3a47c');line([[29,-8],[34,-4]],'#d7c69e',2);break;
 case 'abyss':dragon();break;
 case 'crypt':humanoid('#625f67',bone,1.15);skull(0,-30,10);poly([[-11,-19],[-20,-24],[-23,2],[-11,4]],'#74677b');shield(-18,-2,'#7b756a');line([[20,-31],[20,17]],'#a4916c',3);poly([[19,-32],[35,-36],[27,-23],[20,-22]],bone);break;
 case 'archive':humanoid('#557c7c','#9bb4a8',1.15);poly([[-12,-22],[0,-47],[13,-23]],'#4e6e75');line([[23,-29],[23,19]],steel,3);line([[14,10],[16,18],[23,23],[31,18],[33,10]],steel,4);oval(23,-29,4,4,gold);break;
 case 'ridge':humanoid('#9a775c','#adad80',1.6);poly([[-10,-35],[-16,-43],[-4,-38]],bone);poly([[10,-35],[16,-43],[4,-38]],bone);line([[29,-27],[22,18]],'#ad8f65',4);rect(17,-35,23,14,'#8f9894');rect(-13,-14,26,7,'#696b61');break;
 case 'mine':rect(-18,0,14,20,'#77847f');rect(5,0,14,20,'#77847f');poly([[-22,5],[-25,-24],[-12,-35],[15,-34],[24,-19],[20,6]],'#929b8c');rect(-11,-50,23,21,'#a3ae9e');rect(-8,-41,5,3,'#e0c785');rect(5,-41,5,3,'#e0c785');poly([[-7,-19],[0,-27],[9,-19],[0,-7]],'#edc282');poly([[-25,-22],[-39,-15],[-36,9],[-24,7]],'#7b8a82');poly([[24,-22],[38,-14],[37,9],[25,7]],'#7b8a82');line([[-15,-29],[-5,-21],[-13,-5]],'#596d67');break;
 case 'warlord':humanoid('#7c5450','#859464',1.35);poly([[-13,-24],[-15,-39],[0,-47],[15,-38],[13,-24]],steel);poly([[-13,-37],[-23,-45],[-19,-32]],bone);poly([[13,-37],[23,-45],[19,-32]],bone);rect(-10,-18,20,17,'#665c59');line([[28,-29],[22,20]],'#95764e',4);poly([[26,-30],[40,-39],[43,-17],[25,-19]],steel);poly([[-13,-18],[-25,18],[-9,12]],'#a1614e');break;
 case 'citadel':humanoid('#697c82',steel,1.45);rect(-12,-50,24,25,'#8a9c9e');poly([[-16,-49],[-16,-57],[-7,-52],[0,-58],[7,-52],[16,-57],[16,-49]],gold);rect(-8,-39,16,3,'#f1c580');shield(-24,-1,'#526970');line([[29,-42],[29,22]],'#ac976d',4);poly([[21,-39],[35,-42],[39,-27],[20,-25]],steel);poly([[-7,-16],[0,-23],[7,-16],[0,-8]],'#e8ae70');break;
 case 'darklord':poly([[-23,17],[-16,-27],[0,-41],[16,-27],[26,17]],'#423c55');humanoid('#594c65','#aaa8a7',1.15);poly([[-11,-26],[-9,-41],[0,-48],[10,-40],[11,-26]],'#596274');poly([[-13,-42],[-18,-55],[-6,-48],[0,-57],[6,-48],[18,-55],[13,-42]],gold);rect(-6,-32,4,2,'#d8a896');rect(3,-32,4,2,'#d8a896');sword(21,-17);shield(-22,-1,'#725965');break;
 default:humanoid('#897773');
 }
 bossFinish(e.family);bossPolish(e.family);
 }else{
 switch(e.species){
 case 'skeleton':skull();line([[0,-18],[0,5]],bone,3);for(const y of [-14,-9,-4])line([[-8,y],[0,y+2],[8,y]],bone,2);line([[-7,-15],[-14,-2],[-16,6]],bone,3);line([[7,-15],[14,-4],[17,3]],bone,3);line([[0,3],[-7,9],[-8,16]],bone,3);line([[0,3],[7,9],[8,16]],bone,3);if(e.ranged)bow(17,-7);else sword(15,-9);break;
 case 'wolf':wolf();break;
 case 'mireling':crocodile();ctx.scale(1,1);break;
 case 'reedbeast':oval(0,-2,19,16,'#8d9c65');oval(-11,-16,8,7,'#a5b17a');oval(11,-16,8,7,'#a5b17a');eye(-12,-18);eye(10,-18);oval(-19,9,11,6,'#738857');oval(19,9,11,6,'#738857');line([[-11,-1],[10,-1]],ink,1);break;
 case 'ashbeast':oval(0,0,20,10,'#aa7c62');for(const side of [-1,1]){for(const y of [-4,2,8])line([[side*12,y],[side*28,y+4],[side*33,y+10]],'#b18b6b',2);line([[side*15,-4],[side*24,-17]],'#c0a080',4);poly([[side*23,-19],[side*34,-25],[side*34,-15],[side*25,-13]],'#c0a080');}line([[0,7],[-7,20],[-19,12],[-23,-3],[-17,-15]],'#bd936b',5);poly([[-20,-17],[-12,-25],[-13,-13]],bone);break;
 case 'goblin':humanoid('#89745a','#9ba574',.8);poly([[-6,-29],[-18,-36],[-12,-24]],'#9ba574');poly([[6,-29],[18,-36],[12,-24]],'#9ba574');poly([[-3,-27],[0,-21],[5,-25]],'#bdba8c');if(e.ranged){line([[13,-5],[23,-21],[19,-32]],'#c0b386',2);oval(20,-29,4,4,'#8d978f');rect(-18,-7,10,12,'#775d43');}else sword(12,-3);break;
 case 'ogre':humanoid('#8d7a5f','#b2a684',1.5);rect(-12,-3,24,7,'#6b5841');line([[25,-22],[20,14]],'#96744e',6);oval(27,-25,8,15,'#816647');poly([[-4,-23],[-5,-17],[-1,-21]],bone);poly([[4,-23],[5,-17],[1,-21]],bone);break;
 case 'archer':human('archer');break;
 case 'orc':humanoid('#846e56','#89936c',1.15);poly([[-10,-14],[-15,-22],[-3,-18]],steel);poly([[10,-14],[15,-22],[3,-18]],steel);sword(17,-6);break;
 case 'crownguard':human('soldier');poly([[-12,-34],[0,-45],[12,-34]],'#6d5260');shield(-16,-1,'#7e4f56');break;
 case 'wraith':case 'stalker':case 'summon':poly([[-16,12],[-10,-24],[0,-40],[11,-25],[17,12],[8,7],[0,14],[-7,7]],e.species==='stalker'?'#877179':'#87a9a6');oval(0,-23,6,8,'#354c50');eye(-4,-25);eye(2,-25);if(e.species==='wraith'){line([[12,-10],[22,-5]],'#a6bbae');rect(18,-4,9,12,'#6b7769');rect(20,-2,5,7,'#dfc980');}break;
 default:humanoid('#919b81');
 }
  enemyFinish();
 }
 if(e.hybrid&&e.species==='reedbeast'){oval(0,0,6,3,'#628975');line([[2,1],[15,5]],'#c1a18e',2);}if(e.rangedAim){oval(0,-56,5,5,'#ead6a0');}
 if(e.form==='true'){ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=e.type==='boss'?'#fff0a6':'#e5c876';ctx.lineWidth=e.type==='boss'?3:2;for(const r of e.type==='boss'?[30,40,50]:[23,30]){ctx.beginPath();ctx.ellipse(0,11,r,r*.28,0,0,Math.PI*2);ctx.stroke();}if(e.type==='boss'){ctx.globalAlpha=.18;ctx.fillStyle='#f1c75e';ctx.beginPath();ctx.ellipse(0,-11,34,52,0,0,Math.PI*2);ctx.fill();}ctx.restore();line([[-19,18],[-8,23],[9,23],[21,17]],'#e2c36f',e.type==='boss'?3:2);for(const x of [-17,17])poly([[x,-36],[x*1.45,-54],[x*.48,-42]],'#e1bd6d');for(const x of [-11,0,11])glint(x,-47,'#ffe7a8',e.type==='boss'?2.4:1.3);if(e.type==='boss'){poly([[-22,-52],[-14,-66],[-7,-56],[0,-70],[7,-56],[14,-66],[22,-52]],'#d7ad42');for(const x of [-26,26])glint(x,-28,'#fff4bd',2.8);}}
 else if(e.form==='ringleader'){rect(-4,-47,8,8,gold);poly([[-12,-40],[-15,-49],[-5,-45],[0,-53],[5,-45],[15,-49],[12,-40]],gold);for(const x of [-16,16])line([[x,-12],[x*1.2,-24]],'#d5b36e',2);glint(0,-51,'#fff0b7',1.5);if(e.frenzy){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#ef8c63';ctx.lineWidth=2.5;for(const r of [25,32]){ctx.beginPath();ctx.ellipse(0,10,r,r*.27,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-19,19])glint(x,-21,'#ff9f6b',2);}}
 if(type==='hero'||type==='ally'||type==='enemy'){line([[-8,13],[0,15],[8,13]],type==='enemy'?'#d2aa87':'#c9d6ad',1.2);if(type==='hero')oval(0,-47,2,2,'#f6dfa0');}
 ctx.restore();
}
function height(e){if(e.type==='boss')return 102;if(e.renderKind==='hero'&&e.class==='mage'||e.renderKind==='prop')return 64;if(['dungeon','exit','transport'].includes(e.kind))return 64;return 54;}
const floorPalettes=[['#294b36','#31583e','#203e30','#95ad80'],['#26444b','#31535a','#203b42','#85ada6'],['#485447','#56614d','#3b493f','#b1b59a'],['#50413b','#5d4b42','#423732','#b9987b'],['#343644','#414351','#2c2f3c','#a09b9e']];
const dungeonFloors={crypt:['#343c39','#414945','#2b3331','#a9b1a0'],archive:['#30464a','#3b5558','#283d42','#8fb6b4'],mine:['#44433b','#524f43','#39382f','#ada88c'],abyss:['#44373b','#544349','#382f34','#c09a89'],citadel:['#3b414b','#494f59','#303640','#abb3b5']};
function groundDetail(ctx,p,seed,region,room,dungeonId,colors){
 if(seed%3===0)return;
 const dx=(seed%35)-17,dy=((seed>>>5)%15)+12,k=(seed>>>9)%8,x=p.x+dx,y=p.y+dy;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const line=(x1,y1,x2,y2,c,w=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
 const dot=(cx,cy,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();};
 if(room||dungeonId){
  if(k<3){line(x-9,y,x-2,y-3,'#171d1b55',1);line(x-2,y-3,x+5,y+1,'#171d1b55',1);line(x+5,y+1,x+10,y-2,'#171d1b55',1);}
  else if(k===3){for(const [ox,oy]of [[-5,1],[1,-2],[6,2]])dot(x+ox,y+oy,1.7,'#b0a88b88');}
  else if(k===4){line(x-7,y+2,x+6,y-2,'#76654a',2);line(x-3,y-2,x-5,y-6,'#a18c63',1);}
  else if(k===5){dot(x-3,y,2,'#776b5f');dot(x+2,y+1,1.5,'#a58e72');}
  ctx.restore();return;
 }
 if(region===0){
  if(k<3){for(const ox of [-5,0,5])line(x+ox,y+3,x+ox+(ox===0?1:-Math.sign(ox)*2),y-5-(seed%3),'#91aa78',1.2);}
  else if(k===3){line(x-7,y+2,x+7,y-3,'#8a6d49',2);line(x-2,y-1,x-5,y-5,'#6f553d',1);}
  else if(k===4){dot(x-3,y,3,'#bd9d77');dot(x-3,y-2,2,'#d2b784');line(x-3,y+2,x-3,y+5,'#7b6c4d',1);}
  else if(k===5){for(const [ox,c]of [[-4,'#d9bd7b'],[2,'#d7a5ad'],[6,'#e6dfb1']])dot(x+ox,y+(ox%3),1.5,c);}
  else {for(const [ox,oy]of [[-5,1],[0,-1],[5,2]])dot(x+ox,y+oy,1.5,'#7c8972');}
 }else if(region===1){
  if(k<3){for(const ox of [-6,-2,3,7])line(x+ox,y+4,x+ox+(ox%2),y-7-(seed%4),'#76906f',1.3);}
  else if(k===3){dot(x,y,4,'#6f8f83');dot(x+1,y-1,2.5,'#9bb7a5');}
  else if(k===4){line(x-8,y+2,x+6,y-3,'#7b6748',2);dot(x+7,y-3,1.5,'#b8b18b');}
  else {for(const [ox,oy]of [[-5,1],[1,-1],[6,2]])dot(x+ox,y+oy,1.4,'#708c83');}
 }else if(region===2){
  if(k<2){for(const ox of [-5,0,5])line(x+ox,y+3,x+ox+(ox===0?0:Math.sign(ox)*2),y-5,'#9ca681',1.2);}
  else if(k===2){for(const [ox,oy]of [[-6,1],[0,-2],[6,2]])dot(x+ox,y+oy,2,'#8b8e82');}
  else if(k===3){line(x-7,y+1,x+7,y-3,'#7d6749',2);for(const ox of [-4,0,4])line(x+ox,y-1,x+ox+2,y-4,'#a28b65',1);}
  else if(k===4){dot(x,y,2.4,'#a89bc4');dot(x-4,y+2,1.2,'#c6b7dd');}
  else {dot(x-4,y,1.5,'#9f997f');dot(x+3,y+1,1.8,'#777a72');}
 }else if(region===3){
  if(k<3){line(x-7,y+3,x-1,y-6,'#72594b',1.5);line(x-1,y-6,x+5,y+2,'#72594b',1.5);}
  else if(k===3){for(const [ox,oy]of [[-5,1],[0,-1],[5,2]])dot(x+ox,y+oy,1.6,'#4d4c45');}
  else if(k===4){line(x-8,y+2,x+8,y-2,'#4f4138',3);line(x-2,y,x+1,y-5,'#9b6b4e',1);}
  else if(k===5){dot(x,y,2.2,'#b66f49');dot(x+1,y-1,1,'#efad6e');}
  else {line(x-5,y+2,x+6,y-1,'#b8aa8a',1.3);dot(x-6,y+2,2,'#d2c7a9');}
 }else{
  if(k<3){for(const [ox,oy]of [[-6,1],[0,-2],[6,2]]){dot(x+ox,y+oy,2,'#55515d');line(x+ox-1,y+oy,x+ox+2,y+oy-3,'#8a7e96',1);}}
  else if(k===3){ctx.fillStyle='#8071a0';ctx.beginPath();ctx.moveTo(x-4,y+3);ctx.lineTo(x,y-7);ctx.lineTo(x+4,y+3);ctx.closePath();ctx.fill();dot(x,y-3,1,'#d4bfe7');}
  else if(k===4){line(x-7,y+2,x+7,y-2,'#6f5a4e',2);dot(x-8,y+2,2,'#c4b79f');}
  else {for(const [ox,oy]of [[-5,1],[1,-1],[6,2]])dot(x+ox,y+oy,1.4,'#77717d');}
 }
 ctx.restore();
}
function floor(ctx,p,x,y,region=0,room=false,dungeonId='',blocked=false){
 const colors=room?['#403d35','#4d493e','#343229','#b6a98a']:dungeonFloors[dungeonId]||floorPalettes[region];
 const tileX=Math.floor(x/80),tileY=Math.floor(y/80),seed=(Math.imul(tileX+19,73856093)^Math.imul(tileY+37,19349663))>>>0;
 const color=blocked?'#737c70':seed%7===0?colors[1]:seed%11===0?colors[2]:colors[0];
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.lineTo(p.x,p.y+43.2);ctx.lineTo(p.x-60.8,p.y+21.6);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#e7e3c614';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-60.8,p.y+21.6);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.stroke();
 ctx.strokeStyle='#0d1c1940';ctx.beginPath();ctx.moveTo(p.x-60.8,p.y+21.6);ctx.lineTo(p.x,p.y+43.2);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.stroke();
 if(!blocked)groundDetail(ctx,p,seed,region,room,dungeonId,colors);
}
// World-space surfaces avoid losing narrow barriers between coarse tile samples.
function terrain(ctx,screen,region=0){
 const {kind,bounds:[x1,x2,y1,y2]}=R.barriers[region];
 const palette=kind==='water'?['#285d70','#397f92','#84b4b3']:kind==='lava'?['#753c2e','#d16c38','#e5a55b']:['#252a2c','#394044','#93917d'];
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((q,j)=>{const p=screen(q);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
 const rect=(a,b,c,d,color)=>polygon([{x:a,y:c},{x:b,y:c},{x:b,y:d},{x:a,y:d}],color);
 const line=(a,b,color,width)=>{a=screen(a);b=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();
 rect(x1,x2,y1,y2,palette[0]);
 rect(x1+8,x2-8,y1+8,y2-8,palette[1]);
 for(const x of [x1,x2]){line({x:x+(x===x1?-10:10),y:y1},{x:x+(x===x1?-10:10),y:y2},'#16231c99',4);line({x,y:y1},{x,y:y2},palette[2],2);}
 for(let y=y1+30;y<y2-20;y+=70){const inset=Math.min(22,(x2-x1)/4);line({x:x1+inset,y},{x:x2-inset,y:y+12},palette[2],kind==='ravine'?1:2);if(kind==='water')line({x:x1+inset+8,y:y+16},{x:x1+inset+24,y:y+19},'#b8ddd055',1);else if(kind==='lava')line({x:x1+inset+3,y:y+17},{x:x2-inset-5,y:y+22},'#ffc07866',1);}
 // Other authored ponds and walls also use exact shapes, independent of props.
 for(const p of R.terrain[region]){
  if(p.r){const points=[],inner=[];for(let n=0;n<48;n++){const a=n*Math.PI/24;points.push({x:p.x+Math.cos(a)*p.r,y:p.y+Math.sin(a)*p.r});inner.push({x:p.x+Math.cos(a)*(p.r-8),y:p.y+Math.sin(a)*(p.r-8)});}polygon(points,'#9aab9866');polygon(inner,'#397f92');for(const dy of [-p.r*.25,p.r*.25])line({x:p.x-p.r*.35,y:p.y+dy},{x:p.x+p.r*.25,y:p.y+dy+8},'#a1c8bf99',1.5);}
  else {let start=p.y1;for(const [lo,hi]of p.gaps||[]){rect(p.x1,p.x2,start,lo,'#62645b');start=hi;}rect(p.x1,p.x2,start,p.y2,'#62645b');line({x:p.x1,y:p.y1},{x:p.x1,y:p.y2},'#a39e86',1);}
 }
 ctx.restore();
}
function bridges(ctx,screen,region=0){
 const {bounds:[x1,x2],gaps}=R.barriers[region],stone=region>=2;
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((q,j)=>{const p=screen(q);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
 const line=(a,b,color,width=1)=>{a=screen(a);b=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();
 for(const [lo,hi]of gaps){
  polygon([{x:x1-24,y:lo-8},{x:x2+24,y:lo-8},{x:x2+24,y:hi+8},{x:x1-24,y:hi+8}],stone?'#3b3833':'#4b3929');
  polygon([{x:x1-18,y:lo},{x:x2+18,y:lo},{x:x2+18,y:hi},{x:x1-18,y:hi}],stone?'#a6a08c':'#b49468');
  for(let x=x1-12;x<x2+18;x+=stone?40:18)line({x,y:lo},{x,y:hi},stone?'#716e61':'#705338');
  for(const y of [lo,hi]){
   line({x:x1-18,y},{x:x2+18,y},stone?'#d0cbb5':'#e0c394',3);
   for(const x of [x1-12,x2+12]){const p=screen({x,y});ctx.strokeStyle=stone?'#bdb7a4':'#c5a577';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-12);ctx.stroke();ctx.fillStyle=stone?'#e5dcc0':'#edcf91';ctx.beginPath();ctx.arc(p.x,p.y-13,3,0,Math.PI*2);ctx.fill();}
  }
  line({x:x1-13,y:(lo+hi)/2},{x:x2+13,y:(lo+hi)/2},stone?'#d4cdb166':'#f2d6a166',1);
 }
 ctx.restore();
}
function roads(ctx,paths,screen,region=0){
 const strip=R.barriers[region].bounds;
 const bridge=p=>p.x>=strip[0]-12&&p.x<=strip[1]+12&&p.y>=strip[2]&&p.y<=strip[3];
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((q,j)=>{const p=screen(q);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
 const segment=(a,b,w,color)=>{const d=Math.hypot(b.x-a.x,b.y-a.y);if(!d)return;const dx=-(b.y-a.y)/d*w,dy=(b.x-a.x)/d*w;polygon([{x:a.x+dx,y:a.y+dy},{x:b.x+dx,y:b.y+dy},{x:b.x-dx,y:b.y-dy},{x:a.x-dx,y:a.y-dy}],color);};
 const stroke=(a,b,color,width=1)=>{a=screen(a);b=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const edges=[],seen=new Set();for(const path of paths)for(let j=1;j<path.length;j++){const a=path[j-1],b=path[j],key=[a.x,a.y,b.x,b.y].join(':');if(seen.has(key))continue;seen.add(key);edges.push([a,b]);}
 ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
 // Shared shoulders and pavement form junctions before individual slab seams.
 for(const [a,b]of edges)segment(a,b,35,'#504d3c');
 for(const path of paths)for(const q of path)polygon([{x:q.x-35,y:q.y-35},{x:q.x+35,y:q.y-35},{x:q.x+35,y:q.y+35},{x:q.x-35,y:q.y+35}],'#504d3c');
 for(const [a,b]of edges)segment(a,b,29,'#a29677');
 for(const path of paths)for(const q of path)polygon([{x:q.x-29,y:q.y-29},{x:q.x+29,y:q.y-29},{x:q.x+29,y:q.y+29},{x:q.x-29,y:q.y+29}],'#a29677');
 for(const [a,b]of edges)segment(a,b,23,'#b1a586');
 const seams=new Set();for(const [a,b]of edges){const length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)continue;const ux=(b.x-a.x)/length,uy=(b.y-a.y)/length,nx=-uy,ny=ux,steps=Math.max(1,Math.ceil(length/22));
 for(let j=0;j<steps;j++){const p={x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},q={x:a.x+(b.x-a.x)*(j+1)/steps,y:a.y+(b.y-a.y)*(j+1)/steps},mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2};if(bridge(mid)){segment(p,q,28,'#b49468');for(const side of [-1,1])stroke({x:p.x+nx*side*31,y:p.y+ny*side*31},{x:q.x+nx*side*31,y:q.y+ny*side*31},'#d1b887',2);}}
 const anchor=a.x*ux+a.y*uy,first=Math.ceil(anchor/44)*44-anchor;for(let t=first;t<length;t+=44){const p={x:a.x+ux*t,y:a.y+uy*t},key=Math.round(p.x)+':'+Math.round(p.y);if(seams.has(key))continue;seams.add(key);const wood=bridge(p);stroke({x:p.x+nx*26,y:p.y+ny*26},{x:p.x-nx*26,y:p.y-ny*26},wood?'#624b34':'#7e7865',1);if(!wood){const q={x:a.x+ux*Math.min(length,t+44),y:a.y+uy*Math.min(length,t+44)};stroke(p,q,'#888370',.8);}}
 }

 ctx.restore();
}
root.PrototypeVisuals={draw,height,floor,roads,terrain,bridges};
if(typeof module!=='undefined')module.exports=root.PrototypeVisuals;
})(typeof window!=='undefined'?window:globalThis);
