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
 function building(kind){const wall=['#baa888','#aab1a1','#a1aaa4','#a18e7b','#929ba5'][region],roof=['#9b6350','#618789','#727a73','#76585a','#596478'][region];if(kind==='quests'){rect(-19,-38,38,28,'#7f6344');rect(-16,-35,32,22,'#d4c6a0');rect(-17,-10,4,25,'#7f6344');rect(13,-10,4,25,'#7f6344');for(const x of [-11,0,9])rect(x,-30,7,12,'#ede0b7');return;}if(kind==='supplier'){rect(-22,-8,44,22,'#93724d');rect(-23,-33,4,24,'#786144');rect(19,-33,4,24,'#786144');poly([[-29,-27],[-19,-42],[22,-42],[29,-27]],'#ceb981');for(const x of [-16,-2,12])rect(x,-40,7,12,'#687f70');oval(-11,-5,6,5,'#bac481');rect(1,-9,8,10,'#c09469');oval(14,-4,4,7,'#718ba4');return;}rect(-23,-22,46,37,wall);poly([[23,-22],[35,-15],[35,10],[23,15]],'#737f75');poly([[-29,-22],[0,-47],[30,-22]],roof);poly([[0,-47],[12,-43],[36,-15],[30,-22]],'#4b5957');rect(-7,-5,14,20,'#504d40');rect(-18,-14,8,9,'#87a7a2');rect(11,-14,8,9,'#87a7a2');line([[-23,2],[-9,2]],'#746b56',1);if(kind==='recruiter'||kind==='barracks'){rect(11,-51,3,30,'#b6a47f');poly([[14,-50],[32,-46],[14,-37]],'#768fb0');shield(0,-24,'#839a9d');}else{rect(14,-43,7,17,'#9a8e7c');rect(-5,-24,10,8,gold);}}
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
 if(type==='prop'){if(e.decorative)decoration(e.structure);else if(e.structure==='fence'){for(const x of [-18,0,18])rect(x-2,-18,4,30,'#a48c69');line([[-23,-12],[23,-12]],'#9c835e',4);line([[-23,2],[23,2]],'#9c835e',4);}else if(e.structure==='house'||e.structure==='workshop'){building(e.structure);if(e.structure==='workshop'){rect(-25,-12,12,15,'#8e7150');line([[-26,-15],[-10,-15]],steel,4);}}else if(['stonewall','stockade','palisade'].includes(e.structure)){if(e.structure==='stonewall'){rect(-28,-28,56,42,'#858d85');for(const y of [-22,-10,2])line([[-27,y],[27,y]],'#59685e',2);for(const x of [-21,-3,15]){line([[x,-27],[x,-12]],'#59685e',2);line([[x+9,-10],[x+9,3]],'#59685e',2);}for(const x of [-28,-7,14])rect(x,-35,14,10,'#9ea79b');}else{for(const x of [-24,-12,0,12,24]){rect(x-4,-28,8,42,'#977752');poly([[x-4,-28],[x,-40],[x+4,-28]],'#b49465');}line([[-27,-16],[27,-16]],'#675c40',4);line([[-27,3],[27,3]],'#675c40',4);}}else if(e.structure==='pillar'){rect(-13,-44,26,58,'#9ca49a');rect(-18,-48,36,8,'#bac0ad');rect(-18,10,36,8,'#8a9488');for(const x of [-7,0,7])line([[x,-39],[x,6]],'#747f75',1);}else if(e.icon==='🪨'){poly([[-20,7],[-18,-12],[-3,-24],[14,-17],[24,4]],'#849183');poly([[-18,-12],[-3,-24],[3,-4],[-20,7]],'#a0ad9b');line([[3,-4],[14,-17]],'#647466');}else{rect(-4,-12,8,26,'#76583b');for(const [y,w,c]of [[-3,25,'#355b40'],[-19,21,'#426e49'],[-34,16,'#628450']])poly([[-w,y],[0,y-29],[w,y]],region===3?'#655e48':c);}}else if(type==='node'){if(e.icon==='🪵'){for(const [x,y]of [[-12,2],[2,-3],[10,7]]){rect(x-12,y-8,24,10,'#836244');oval(x+12,y-3,4,5,'#c9a572');oval(x+12,y-3,2,3,'#916b44');}}else if(e.icon==='🧺'){poly([[-19,-3],[19,-3],[13,14],[-13,14]],'#aa885e');line([[-13,-3],[-8,-17],[8,-17],[13,-3]],'#bca06d',3);for(const y of [1,5,9])line([[-14,y],[14,y]],'#795f42',1);}else if(e.icon==='💎'){for(const [x,y]of [[-10,2],[0,-7],[10,4]])poly([[x-6,y],[x-5,y-20],[x,y-28],[x+6,y-18],[x+6,y]],'#a89bcf');line([[0,-32],[0,-7]],'#e5ddf6',1);}else{poly([[-18,8],[-13,-12],[0,-23],[18,-9],[22,8]],'#7d8781');for(const [x,y]of [[-7,-8],[7,-12],[12,1]])poly([[x-4,y],[x,y-5],[x+5,y],[x,y+4]],'#c1a16b');}}
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
 ctx.scale(1.25,1.25);
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
 bossFinish(e.family);
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
 }
 if(e.hybrid&&e.species==='reedbeast'){oval(0,0,6,3,'#628975');line([[2,1],[15,5]],'#c1a18e',2);}if(e.rangedAim){oval(0,-56,5,5,'#ead6a0');}
 if(e.form==='true'){line([[-17,18],[-7,22],[9,22],[20,16]],'#d5b873',2);for(const x of [-15,15])poly([[x,-37],[x*1.5,-52],[x*.5,-41]],'#d9b678');}
 else if(e.form==='ringleader'){rect(-3,-46,6,7,gold);poly([[-9,-40],[-12,-47],[-4,-44],[0,-50],[4,-44],[12,-47],[9,-40]],gold);}
 ctx.restore();
}
function height(e){if(e.type==='boss')return 85;if(e.renderKind==='hero'&&e.class==='mage'||e.renderKind==='prop')return 64;if(['dungeon','exit','transport'].includes(e.kind))return 64;return 54;}
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
 for(const x of [x1,x2])line({x,y:y1},{x,y:y2},palette[2],2);
 for(let y=y1+30;y<y2-20;y+=70){const inset=Math.min(22,(x2-x1)/4);line({x:x1+inset,y},{x:x2-inset,y:y+12},palette[2],kind==='ravine'?1:2);}
 // Other authored ponds and walls also use exact shapes, independent of props.
 for(const p of R.terrain[region]){
  if(p.r){const points=[];for(let n=0;n<48;n++){const a=n*Math.PI/24;points.push({x:p.x+Math.cos(a)*p.r,y:p.y+Math.sin(a)*p.r});}polygon(points,'#397f92');}
  else {let start=p.y1;for(const [lo,hi]of p.gaps||[]){rect(p.x1,p.x2,start,lo,'#62645b');start=hi;}rect(p.x1,p.x2,start,p.y2,'#62645b');}
 }
 ctx.restore();
}
function bridges(ctx,screen,region=0){
 const {bounds:[x1,x2],gaps}=R.barriers[region],stone=region>=2;
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((q,j)=>{const p=screen(q);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
 const line=(a,b,color,width=1)=>{a=screen(a);b=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();
 for(const [lo,hi]of gaps){
  polygon([{x:x1-18,y:lo},{x:x2+18,y:lo},{x:x2+18,y:hi},{x:x1-18,y:hi}],stone?'#a6a08c':'#b49468');
  for(let x=x1-12;x<x2+18;x+=stone?40:18)line({x,y:lo},{x,y:hi},stone?'#716e61':'#705338');
  for(const y of [lo,hi]){
   line({x:x1-18,y},{x:x2+18,y},stone?'#d0cbb5':'#e0c394',3);
   for(const x of [x1-12,x2+12]){const p=screen({x,y});ctx.strokeStyle=stone?'#bdb7a4':'#c5a577';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-12);ctx.stroke();}
  }
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
 const seams=new Set();for(const [a,b]of edges){const length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)continue;const ux=(b.x-a.x)/length,uy=(b.y-a.y)/length,nx=-uy,ny=ux,steps=Math.max(1,Math.ceil(length/22));
 for(let j=0;j<steps;j++){const p={x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},q={x:a.x+(b.x-a.x)*(j+1)/steps,y:a.y+(b.y-a.y)*(j+1)/steps},mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2};if(bridge(mid)){segment(p,q,28,'#b49468');for(const side of [-1,1])stroke({x:p.x+nx*side*31,y:p.y+ny*side*31},{x:q.x+nx*side*31,y:q.y+ny*side*31},'#d1b887',2);}}
 const anchor=a.x*ux+a.y*uy,first=Math.ceil(anchor/44)*44-anchor;for(let t=first;t<length;t+=44){const p={x:a.x+ux*t,y:a.y+uy*t},key=Math.round(p.x)+':'+Math.round(p.y);if(seams.has(key))continue;seams.add(key);const wood=bridge(p);stroke({x:p.x+nx*26,y:p.y+ny*26},{x:p.x-nx*26,y:p.y-ny*26},wood?'#624b34':'#7e7865',1);if(!wood){const q={x:a.x+ux*Math.min(length,t+44),y:a.y+uy*Math.min(length,t+44)};stroke(p,q,'#888370',.8);}}
 }

 ctx.restore();
}
root.PrototypeVisuals={draw,height,roads,terrain,bridges};
if(typeof module!=='undefined')module.exports=root.PrototypeVisuals;
})(typeof window!=='undefined'?window:globalThis);
