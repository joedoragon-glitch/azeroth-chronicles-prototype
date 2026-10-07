/* Small, deterministic canvas drawings. Appearance only: no campaign state changes. */
(function(root){
'use strict';
const R=typeof PrototypeRules!=='undefined'?PrototypeRules:require('./rules.js');
function allyBodyKind(e){return e?.type==='archer'?'goblin-archer':(e?.class||e?.type||'worker');}
function barracksVisualState(e){return Number.isFinite(e?.progress)&&e.progress<4?'construction':e?.full?'full':'basic';}
function draw(ctx,e,p,region=0,rescued=false){
 if(e.kind==='landmark'&&e.id?.startsWith('bridge-'))return; // The full deck is drawn in world space.
 ctx.save();ctx.translate(p.x,p.y);ctx.lineJoin='round';ctx.lineCap='round';
 const ink='#25312d',bone='#e7ddbf',steel='#9eafb6',gold='#d3b46c',skin='#dfb18b';
 const poly=(v,c)=>{ctx.fillStyle=c;ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.beginPath();v.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
 const fillPoly=(v,c,a=1)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();v.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.restore();};
 const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
 const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
 const fillOval=(x,y,rx,ry,c,a=1)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();};
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
   case 'goblin':rect(-9,-14,18,5,'#6d5138');fillPoly([[-9,-14],[0,-14],[0,-9],[-9,-9]],'#2e3427',.2);for(const x of [-6,0,6])glint(x,-11,x===0?'#d4b46b':'#98825b',1);line([[-7,-25],[-3,-24]],'#e2d99d',1);line([[3,-24],[7,-25]],'#e2d99d',1);rect(-5,-3,5,5,'#785b40');if(e.ranged)line([[-13,-7],[-18,8]],'#5f4634',3);break;
   case 'skeleton':for(const y of [-12,-7,-2])line([[-7,y],[7,y]],'#c9bea5',1);line([[-6,-16],[5,-16]],'#fff2cf',1);fillOval(-2,-29,7,7,'#fff4d2',.08);if(e.guard)poly([[-12,-18],[-17,-8],[-11,1],[-5,-9]],'#665f59');glint(-3,-28,'#e7c56f',1.4);glint(3,-28,'#e7c56f',1.4);break;
   case 'wolf':line([[-16,-14],[-8,-9],[0,-15],[8,-9]],'#667873',2);line([[-28,-14],[-18,-18],[-7,-15]],'#c4c6ad',1.4);line([[8,-12],[20,-16],[29,-12]],'#bfc4ab',1.2);for(const x of [-15,-5,7,17])line([[x,2],[x+flip*2,11]],'#d6cfb0',1);break;
   case 'mireling':for(let x=-14;x<17;x+=8)poly([[x,-9],[x+3,-15],[x+7,-9]],e.ranged?'#68725a':'#52684f');for(const x of [-14,-4,6,16])fillOval(x,0,3,2,e.ranged?'#d2b786':'#b2c28e',.18);for(const x of [17,25,33])glint(x,-5,e.ranged?'#efbc75':'#d8cf8c',1);if(e.ranged){line([[-18,-8],[10,7]],'#8d7352',3);rect(-3,-3,9,8,'#745d45');line([[20,-8],[34,-5]],'#c2a97c',2);}break;
   case 'reedbeast':line([[-14,-4],[-6,3],[3,-4],[11,3]],'#65794f',2);for(const x of [-18,18])line([[x,8],[x+flip*5,15]],'#4e674a',3);if(e.hybrid)glint(13,-2,'#b9d6b4',1.8);break;
   case 'ogre':poly([[-15,-17],[-23,-20],[-24,-8],[-14,-9]],e.ranged?'#686d65':'#77786d');line([[-8,-24],[7,-19]],e.ranged?'#8b755d':'#735a48',2);line([[-11,-31],[-3,-26],[5,-31]],'#d1c49d',1.3);line([[-5,-15],[7,-8]],e.ranged?'#9b8060':'#684d44',1.5);if(e.ranged){rect(-23,-2,11,12,'#725d49');for(const [x,y,r]of [[-19,-4,4],[-14,2,3],[-21,6,3]])oval(x,y,r,r*.7,'#898980');line([[15,-27],[28,-9]],'#ad8f65',2);}else for(const y of [-19,-13])line([[20,y],[31,y+2]],'#c2b28c',1.5);break;
   case 'orc':for(const x of [-4,4])poly([[x,-23],[x+(x<0?-3:3),-18],[x,-17]],bone);rect(-11,-10,22,5,e.ranged?'#6c493f':'#5d5549');fillPoly([[-11,-10],[0,-10],[0,-5],[-11,-5]],'#2b302b',.2);line([[-8,-15],[8,-4]],e.ranged?'#c38a62':'#a28c65',e.ranged?3:2);for(const x of [-8,8])glint(x,-18,e.ranged?'#e2a168':'#d8c28d',1);if(e.ranged){rect(-16,-5,7,10,'#775344');line([[-13,-10],[11,4]],'#8c604a',2);}break;
   case 'archer':line([[-14,-28],[-18,-3]],'#725a3d',4);for(const y of [-22,-17,-12])line([[-17,y],[-11,y-5]],'#d9cba7',1);break;
   case 'crownguard':poly([[-13,-35],[0,-47],[13,-35],[8,-31],[-8,-31]],'#7b6877');fillPoly([[-13,-35],[0,-47],[0,-32],[-8,-31]],'#302d3b',.24);line([[-8,-17],[8,-17]],'#c4ae7a',2);line([[-10,-13],[10,-5]],'#d6c39a',1);for(const x of [-7,7])glint(x,-29,'#d9a87c',1);break;
   case 'ashbeast':for(const [x,y]of [[-9,-2],[2,4],[12,-5]])line([[x-3,y],[x+3,y-4]],e.ranged?'#f0b070':'#e0a06a',1.5);for(const x of [-22,22])glint(x,-13,e.ranged?'#ffd08a':'#efb071',1.5);if(e.ranged){poly([[-11,-9],[-3,-17],[4,-12],[11,-18],[17,-8],[8,-4],[-7,-4]],'#695466');for(const x of [-9,0,9])glint(x,-8,'#df8b5f',1.5);}break;
   case 'wraith':case 'stalker':ctx.save();ctx.globalAlpha=.35;for(const x of [-12,0,12])oval(x,7,8,4,e.species==='stalker'?'#8d6670':'#8db7b1');ctx.restore();glint(0,-24,e.species==='stalker'?'#e2a0a4':'#c6eee2',2);break;
  }
  if(e.guard){line([[-13,8],[0,12],[13,8]],'#a49573',1.5);rect(-3,-21,6,3,'#b6a373');}
 }
 function militaryRingleaderFinish(){
  switch(e.species){
   case 'crownguard':
    // Crown officers keep the same uniform and body size; rank is shown through a crested helm, command sash and gold-edged pauldrons.
    poly([[-11,-38],[-7,-49],[0,-55],[8,-48],[12,-38],[7,-41],[-7,-41]],'#806177');poly([[-2,-55],[0,-64],[3,-55]],'#d1ae72');
    for(const side of [-1,1])poly([[side*10,-18],[side*22,-20],[side*18,-9],[side*9,-8]],'#8e858b');
    line([[-10,-15],[10,1]],'#c39a67',4);for(const y of [-10,-4,2])line([[10,y],[19,y-2]],'#d9bf83',1.5);line([[22,-29],[22,10]],'#a58a65',3);poly([[24,-27],[38,-23],[24,-15]],'#76586e');break;
   case 'orc':
    // Occupation officers use warlord-style authority marks rather than a universal monster crown.
    poly([[-14,-18],[-24,-22],[-21,-8],[-11,-7]],'#85877d');poly([[14,-18],[24,-22],[21,-8],[11,-7]],'#74776f');
    line([[-11,-14],[10,1]],'#9b5d52',4);line([[24,-32],[24,9]],'#8e704f',3);poly([[26,-30],[41,-25],[26,-18]],'#9a5c54');for(const y of [-6,0,6])line([[-4,y],[6,y+1]],'#d3bb7f',1.5);break;
   case 'archer':
    // Raider-archer leaders stay recognizably archers but gain a command hood crest, sash and marked quiver.
    poly([[-10,-35],[-5,-47],[0,-52],[6,-46],[11,-35],[5,-39],[-5,-39]],'#6f554e');poly([[0,-52],[3,-59],[6,-51]],'#c8a16c');
    line([[-10,-15],[8,-2]],'#c39b67',3);rect(-19,-5,8,10,'#7b5c45');for(const y of [-26,-20,-14])line([[-22,y],[-13,y-5]],'#e4c98c',1.5);poly([[-24,-30],[-18,-35],[-12,-29]],'#a36959');break;
  }
  ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle='#d4b36f';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,11,25,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 function captainFinish(){
  if(!(e.captain||e.roomCaptain))return;
  switch(e.captainVisualIdol||e.captainMentor){
   case 'thorn':
    // Goblin disciple: wolf trophies and claw marks, but still unmistakably goblin.
    poly([[-14,-18],[-19,-28],[-11,-26],[-6,-18]],'#8f8063');for(const [x,y]of [[-8,-8],[0,-10],[8,-8]])poly([[x-2,y],[x,y-5],[x+2,y]],bone);
    line([[-10,-3],[9,2]],'#5f7b50',2);line([[-8,1],[11,6]],'#5f7b50',2);glint(14,-16,'#d9c173',1.5);break;
   case 'mire':
    // Mireling disciple: heavier jaw-band and Mirejaw-like dorsal trophies, no foreign anatomy.
    for(const x of [-16,-5,6])poly([[x,-8],[x+5,-18],[x+10,-8]],'#7c765b');line([[16,-7],[35,-5]],'#b9aa78',2);
    for(const x of [19,27,35])glint(x,-3,'#d9c984',1.2);break;
   case 'ridge':
    // Wolf disciple: quarry-metal collar and stone brow plates instead of humanoid armor.
    line([[-20,-8],[18,-7]],'#938b78',4);for(const x of [-11,0,11])rect(x-3,-11,6,6,'#6f7470');
    poly([[10,-23],[18,-28],[25,-22],[18,-18]],'#9a9b8d');line([[19,-26],[27,-31]],'#c9c3a4',2);break;
   case 'darklord':
    // Dreadmaw preserves his original Dark Lord fanboy identity even though Cindermaw is now his combat mentor: obsidian harness and Crown sigil on the Ash-beast carapace.
    poly([[-16,-9],[-7,-18],[0,-12],[7,-18],[16,-9],[10,-3],[-10,-3]],'#51495c');
    poly([[0,-16],[5,-10],[0,-4],[-5,-10]],'#9f79aa');line([[-11,2],[0,7],[11,2]],'#b39272',2);for(const x of [-18,18])glint(x,-12,'#d29ab5',1.5);break;
   case 'warlord':
    // Orc disciple: Warlord-style red authority marks, shoulder plates and tally-board trophies.
    poly([[-15,-17],[-23,-21],[-20,-10],[-12,-8]],'#8f8f82');poly([[12,-18],[22,-22],[23,-10],[14,-8]],'#777b73');
    line([[-9,-13],[10,-2]],'#9b5d52',4);rect(14,-5,13,16,'#806548');for(const y of [-1,4,9])line([[16,y],[24,y]],'#d7c69c',1);
    line([[23,-30],[23,7]],'#8e704f',2);poly([[24,-29],[37,-25],[24,-17]],'#9a5c54');break;
  }
  ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#e0b96f';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,11,25,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
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
 function humanoid(color,head=skin,bulk=1){
  rect(-9*bulk,2,7*bulk,13,'#39423e');rect(2*bulk,2,7*bulk,13,'#39423e');
  fillPoly([[-9*bulk,7],[-2*bulk,7],[-2*bulk,15],[-10*bulk,15]],'#17201d',.24);fillPoly([[2*bulk,7],[9*bulk,7],[10*bulk,15],[3*bulk,15]],'#dbe3d0',.08);
  poly([[-12*bulk,5],[-10*bulk,-18],[10*bulk,-18],[12*bulk,5]],color);
  fillPoly([[-12*bulk,5],[-10*bulk,-18],[0,-18],[0,5]],'#14211c',.18);fillPoly([[0,-17],[8*bulk,-17],[10*bulk,1],[0,1]],'#fff2c7',.09);
  oval(0,-28,8*bulk,9,head);fillOval(-2.5*bulk,-31,3*bulk,4,'#fff3dc',.22);fillOval(3*bulk,-25,3*bulk,3,'#7c4f43',.08);
  line([[-9*bulk,-13],[-16*bulk,-1]],color,5);line([[9*bulk,-13],[15*bulk,-1]],color,5);
  line([[-8*bulk,-12],[-14*bulk,-2]],'#f6e7c7',1);rect(-9*bulk,-1,18*bulk,3,'#705c42');line([[-7*bulk,1],[7*bulk,1]],'#b59563',1);
 }
 function skull(x=0,y=-28,r=8){oval(x,y,r,r,bone);rect(x-r*.6,y+4,r*1.2,6,bone);oval(x-3,y,2,2,ink);oval(x+3,y,2,2,ink);line([[x-3,y+7],[x+3,y+7]],ink,1);}
 function wolf(c='#8c9998',large=false){poly([[-24,0],[-20,-15],[-2,-19],[17,-12],[20,3]],c);poly([[-20,-11],[-35,-20],[-30,-5],[-21,1]],c);for(const x of [-17,-7,10,18])line([[x,0],[x-2,13]],c,5);poly([[9,-18],[12,-30],[19,-24],[23,-31],[27,-17],[35,-12],[31,-6],[17,-7]],c);eye(24,-18);poly([[28,-9],[31,-8],[29,-4]],bone);if(large){poly([[-22,-12],[-20,-28],[-10,-21],[-5,-29],[1,-17]],'#4e6246');line([[-11,-24],[-15,-35]],'#a0ae76',3);}}
 function crocodile(c='#71886a'){poly([[-18,2],[-38,-3],[-48,4],[-22,10]],c);oval(-2,0,25,13,c);poly([[12,-10],[34,-10],[45,-4],[44,5],[16,7]],c);for(const x of [-15,7]){poly([[x,3],[x-9,12],[x+3,12]],c);poly([[x,-5],[x-7,-16],[x+5,-14]],c);}for(let x=-19;x<13;x+=8)poly([[x,-10],[x+4,-18],[x+8,-10]],'#455b47');line([[20,1],[43,1]],ink);eye(25,-9);for(let x=24;x<43;x+=6)poly([[x,1],[x+3,5],[x+4,1]],bone);}
 function dragon(c='#765080'){poly([[-9,-12],[-26,-45],[-53,-30],[-39,-8],[-25,-16]],c);poly([[10,-13],[31,-44],[55,-22],[39,-7],[25,-15]],c);line([[-10,-12],[-26,-43],[-39,-9]],'#c39783');line([[10,-13],[31,-42],[39,-8]],'#c39783');oval(0,-7,15,22,c);poly([[-7,8],[-25,21],[-37,12],[-25,26],[1,19]],c);poly([[-5,-31],[0,-48],[14,-45],[26,-34],[18,-27],[1,-26]],c);poly([[3,-43],[-3,-56],[10,-46]],bone);poly([[12,-43],[16,-55],[20,-39]],bone);eye(15,-37);line([[-9,7],[-17,21]],c,7);line([[8,9],[18,22]],c,7);line([[-5,-12],[5,-12]],'#d1b18e',3);line([[-6,-4],[6,-4]],'#d1b18e',3);}
 function human(role){
  const cloth=role==='mage'?'#637ca5':role==='ranger'?'#6e9468':role==='archer'?'#5d865f':role==='worker'?'#af9063':'#708c9c';humanoid(cloth);
  if(role==='mage'){
   poly([[-13,-34],[0,-56],[13,-34]],'#677da7');fillPoly([[-13,-34],[0,-56],[0,-34]],'#263b62',.24);poly([[-13,6],[-9,-16],[9,-16],[15,6]],'#536791');line([[-9,-11],[10,1]],'#89a6ca',1.4);line([[17,-35],[17,14]],'#b19365',3);oval(17,-38,5,6,'#8cd2e1');fillOval(15.5,-40,2,2,'#eaffff',.75);rect(-3,-14,6,6,gold);
  }else if(role==='ranger'||role==='archer'){
   const hood=role==='ranger'?'#557a52':'#466d4d',cloak=role==='ranger'?'#587653':'#43644b';
   poly([[-10,-26],[-7,-39],[0,-44],[9,-37],[11,-26],[6,-32],[-5,-32]],hood);fillPoly([[-10,-26],[-7,-39],[0,-44],[0,-27]],'#1c3328',.22);
   poly([[-11,-16],[-18,9],[-4,6]],cloak);fillPoly([[-11,-15],[-18,8],[-11,6]],'#21392c',.25);line([[-12,-12],[-6,5]],'#90aa78',1);
   bow(14,-7);line([[-15,-27],[-19,4]],'#9c7953',5);line([[-19,-29],[-14,-26]],bone,2);for(const y of [-28,-23,-18])line([[-20,y],[-13,y-5]],'#e6d7ae',1);
   if(role==='ranger'){oval(-10,-7,5,7,'#7aa99a');line([[-10,-14],[-10,-19]],'#d6c98a',2);poly([[-3,-18],[0,-24],[3,-18],[0,-14]],'#d8c47a');line([[6,-12],[10,-6]],'#a8d4b5',2);glint(10,-5,'#d8f2df',1.2);fillOval(-10,-7,2.5,4,'#b7ddd1',.2);}
  }else if(role==='worker'){
   poly([[-10,-33],[-7,-40],[6,-40],[11,-33]],'#ceab64');rect(-6,-14,12,16,'#665343');line([[17,-28],[10,14]],'#ae8c60',3);line([[9,-28],[24,-24]],steel,4);rect(-15,-3,9,10,'#af8558');
  }else{
   poly([[-9,-30],[-7,-40],[6,-40],[10,-29]],steel);fillPoly([[-9,-30],[-7,-40],[0,-40],[0,-29]],'#4e6268',.25);line([[-7,-28],[6,-28]],ink,2);
   rect(-7,-17,14,14,steel);fillPoly([[-7,-17],[0,-17],[0,-3],[-7,-3]],'#53676d',.22);line([[-5,-13],[5,-13]],'#d8e1dc',1);
   oval(-11,-17,5,4,steel);oval(11,-17,5,4,steel);shield(-16,-1,role==='paladin'?'#497694':'#6a8178');sword(15,-6);
   if(role==='paladin'){line([[0,-16],[0,-5]],gold,3);line([[-4,-12],[4,-12]],gold,2);poly([[8,-16],[17,8],[8,5]],'#916854');}
   else{poly([[-3,-41],[0,-47],[3,-41]],'#b99c68');line([[-4,-8],[5,-1]],'#a98a61',2);line([[5,-8],[-4,-1]],'#a98a61',2);}
  }
 }
 function goblinArcher(){
  // Companion Archer: an allied goblin scout. This keeps the established companion bow/quiver role
  // while making the party visibly include a normally-hostile species without borrowing the hero Ranger body.
  humanoid('#6f7f5d','#9ba574',.82);
  // Goblin anatomy stays unmistakable: long ears and compact semi-human proportions.
  poly([[-6,-29],[-18,-36],[-12,-24]],'#9ba574');poly([[6,-29],[18,-36],[12,-24]],'#9ba574');
  poly([[-3,-27],[0,-21],[5,-25]],'#c1bd8d');
  // Scout hood/cape keep the old companion-Archer readability without Ranger-specific flask/utility ornaments.
  poly([[-10,-26],[-7,-39],[0,-44],[9,-37],[11,-26],[6,-32],[-5,-32]],'#5b7157');
  fillPoly([[-10,-26],[-7,-39],[0,-44],[0,-27]],'#1f3429',.22);
  poly([[-11,-16],[-18,9],[-4,6]],'#4f654d');fillPoly([[-11,-15],[-18,8],[-11,6]],'#21382c',.25);
  // Existing companion role language: bow on screen-right, quiver/arrows on screen-left/back.
  bow(14,-7);line([[-15,-27],[-19,4]],'#9c7953',5);line([[-19,-29],[-14,-26]],bone,2);
  for(const y of [-28,-23,-18])line([[-20,y],[-13,y-5]],'#e6d7ae',1);
  // Simple travel strap/pouch and warm ally knot distinguish this scout from hostile goblins and Raider Archers.
  line([[-9,-14],[7,-2]],'#b39768',2);rect(-15,-4,8,9,'#785d43');
  poly([[-4,-18],[0,-23],[4,-18],[0,-14]],'#d0b36f');
 }
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
   cindermaw:{cloth:'#957866',cape:'#4c4547',hair:'#ddd0ad',trim:'#e5c381'},
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
   case 'cindermaw':case 'darklord':rect(-16,-18,32,28,'#665344');rect(-10,-8,20,16,'#8c694d');line([[-13,-17],[13,-17]],style.trim,3);poly([[-13,-41],[-7,-48],[10,-46],[14,-39]],'#e0d2b4');line([[20,-37],[14,16]],'#9e7f59',4);rect(14,-41,23,10,'#c0b9a4');rect(-7,-13,14,4,style.trim);break;
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
  case 'cindermaw':for(const [x,y]of [[-18,-12],[-7,-18],[6,-16],[18,-10]])glint(x,y,'#efb071',1.8);for(const side of [-1,1])poly([[side*18,-15],[side*27,-28],[side*34,-18],[side*24,-8]],'#6d5360');line([[-14,6],[0,11],[14,6]],'#d19469',2);break;
  case 'citadel':line([[-8,-47],[-8,-42]],'#d2ded7',2);line([[9,-47],[9,-42]],'#d2ded7',2);poly([[-18,-19],[-11,-24],[-6,-17],[-13,-13]],'#b3c5c2');poly([[9,-22],[18,-18],[14,-11],[7,-15]],'#9eb4b5');line([[-24,-5],[-24,7]],'#d4b97b',2);oval(0,-16,2.5,3,'#ffe0a2');line([[24,-35],[34,-37]],'#e1e6d2',2);break;
  case 'darklord':poly([[-12,-20],[-20,-25],[-21,-17],[-13,-11]],'#8990a3');poly([[11,-20],[19,-25],[21,-16],[12,-11]],'#788297');line([[-6,-39],[0,-44],[6,-39]],'#b9bdc2',1.5);poly([[0,-19],[5,-12],[0,-6],[-5,-12]],'#b48fbc');poly([[0,-16],[2,-12],[0,-9],[-2,-12]],'#e3b9df');line([[-14,8],[-9,-6]],'#6c5b83',2);line([[10,7],[13,-4]],'#6c5b83',2);eye(-5,-32,'#f0bcad');eye(3,-32,'#f0bcad');line([[24,-38],[24,-20]],'#d4d8e0',1.5);break;
 }}
 function gate(family){const colors={crypt:'#929583',archive:'#6f9897',mine:'#8e8679',abyss:'#75545b',citadel:'#6a7082'},c=colors[family]||'#9b9988';rect(-30,-32,60,44,c);rect(-17,-21,34,34,'#172727');poly([[-34,-31],[0,-56],[34,-31]],c);for(const x of [-27,20]){rect(x,-30,7,40,'#b1b1a0');line([[x,-19],[x+7,-19]],ink,1);line([[x,-7],[x+7,-7]],ink,1);}if(family==='crypt')skull(0,-39,5);else if(family==='archive'){line([[-9,-37],[0,-42],[9,-37]],'#bdd9cb');rect(-18,9,36,3,'#65969d');}else if(family==='mine'){line([[-16,-36],[16,-36]],'#bc9a6e',4);line([[-10,-44],[9,-29]],steel,3);}else{poly([[-30,-33],[-33,-48],[-22,-34]],gold);poly([[30,-33],[33,-48],[22,-34]],gold);oval(0,-40,4,6,family==='abyss'?'#d78357':'#e8b766');}}
 function treasuryEntrance(boss){
  const wall=['#baa888','#aab1a1','#a1aaa4','#a18e7b','#929ba5'][region],roof=['#9b6350','#618789','#727a73','#76585a','#596478'][region],wood=['#765b40','#6c6652','#69665d','#5e4d46','#51515e'][region],trim=['#d8bd83','#abd0c0','#c8c4a3','#c69a75','#b6a5c2'][region];
  if(boss==='thorn'){rect(-31,-22,62,37,wall);poly([[-37,-22],[0,-51],[37,-22]],roof);rect(-15,-15,30,30,'#25362b');for(const x of [-25,25])line([[x,9],[x,-30]],wood,4);for(const x of [-18,-7,5,16])poly([[x,-29],[x+4,-38],[x+8,-29]],'#61784f');poly([[-8,-34],[-4,-44],[0,-36],[5,-45],[9,-34]],bone);line([[-28,8],[28,8]],trim,2);}
  else if(boss==='mire'){for(const x of [-27,27])line([[x,14],[x,-25]],wood,5);rect(-31,-19,62,31,wall);poly([[-37,-18],[-26,-40],[27,-40],[37,-18]],roof);rect(-15,-12,30,24,'#29413c');for(const x of [-31,-20,-9,3,15,27])line([[x,-38],[x+3,-49]],'#7a8d67',2);for(const x of [-11,0,11])poly([[x,-23],[x+4,-31],[x+8,-23]],'#6c7b59');line([[-28,9],[28,9]],trim,2);}
  else if(boss==='ridge'){rect(-34,-25,68,40,wall);for(const x of [-32,22])rect(x,-31,10,46,'#7b7f76');poly([[-38,-26],[0,-54],[38,-26]],roof);rect(-16,-15,32,30,'#262f2c');line([[-28,-22],[28,-22]],trim,3);poly([[-13,-35],[-19,-46],[-6,-40]],bone);poly([[13,-35],[19,-46],[6,-40]],bone);for(const x of [-25,25])oval(x,6,5,4,'#77796f');}
  else if(boss==='cindermaw'){shade(35,9,.22);for(const [x,y,r,c]of [[-25,-5,14,'#4a4652'],[-10,-20,17,'#5a5160'],[9,-24,18,'#514a59'],[27,-5,14,'#45434d']])oval(x,y,r,r*.72,c);poly([[-28,11],[-23,-12],[-12,-31],[0,-39],[13,-31],[25,-12],[30,11]],'#4e4a54');poly([[-16,10],[-12,-7],[0,-20],[13,-7],[17,10]],'#211f26');for(const side of [-1,1])poly([[side*19,-8],[side*27,-24],[side*31,-7]],'#77615b');for(const x of [-16,0,16])glint(x,5,'#d78357',1.8);line([[-27,10],[27,10]],trim,2);}
  else{rect(-35,-27,70,42,wall);for(const x of [-33,24])rect(x,-38,9,53,'#686875');poly([[-40,-28],[0,-58],[40,-28]],roof);rect(-16,-17,32,32,'#21232c');poly([[0,-48],[7,-37],[0,-26],[-7,-37]],'#a18caf');for(const x of [-24,24])poly([[x-5,-28],[x,-43],[x+5,-28]],'#72637f');line([[-30,8],[30,8]],trim,2);glint(0,-39,'#dfc6e8',2);}
 }
 function building(kind){
  const wall=['#baa888','#aab1a1','#a1aaa4','#a18e7b','#929ba5'][region],roof=['#9b6350','#618789','#727a73','#76585a','#596478'][region],timber=['#806044','#71654f','#71695b','#614f46','#555563'][region],trim=['#d8bd83','#abd0c0','#c8c4a3','#c69a75','#b6a5c2'][region],dark=['#594b3b','#465a57','#54574f','#4d403a','#454653'][region];
  const utilityFrame=()=>{
   if(region===0){for(const x of [-31,31])line([[x,13],[x,-26]],timber,3);for(const x of [-24,24])oval(x,10,6,3,'#6c8a58');}
   else if(region===1){for(const x of [-29,-14,14,29])line([[x,12],[x,27]],timber,4);line([[-34,15],[34,15]],'#867557',4);for(const x of [-29,-18,-7,5,17,29])line([[x,-39],[x+4,-50]],'#82946c',1.6);}
   else if(region===2){rect(-36,7,72,9,'#777b73');for(const x of [-31,-13,8,27])rect(x,8,16,7,'#929389');rect(23,-48,9,28,'#74756d');}
   else if(region===3){for(const x of [-35,35]){rect(x-3,-29,6,44,'#604f45');poly([[x-4,-29],[x,-39],[x+4,-29]],'#8a6b54');}line([[-36,7],[36,-3]],'#785d4f',3);}
   else{for(const x of [-35,-22,22,35])rect(x-3,-31,6,46,'#555762');for(const x of [-29,29])poly([[x-5,-30],[x,-44],[x+5,-30]],'#71697e');poly([[-6,-44],[0,-54],[6,-44],[0,-35]],'#9b87ad');}
  };
  if(kind==='quests'){utilityFrame();for(const x of [-20,20])rect(x-2,-38,4,52,timber);rect(-25,-38,50,5,roof);rect(-22,-32,44,31,wall);line([[-22,-27],[22,-27]],trim,2);for(const [x,y]of [[-16,-23],[-3,-25],[10,-22],[-11,-9],[5,-10]]){rect(x,y,10,9,'#e7d7ad');line([[x+2,y+3],[x+8,y+3]],'#8f765a',1);}for(const x of [-18,18])glint(x,-29,trim,1.5);return;}
  if(kind==='supplier'){utilityFrame();for(const x of [-25,25])rect(x-2,-28,4,43,timber);poly([[-31,-27],[-22,-45],[22,-45],[31,-27]],roof);rect(-28,-7,56,20,wall);line([[-27,-6],[27,-6]],trim,2);rect(-19,-18,13,11,dark);oval(0,-12,7,5,trim);rect(10,-20,13,13,timber);for(const x of [-17,0,17])oval(x,7,4,3,x===0?trim:'#8b9c72');return;}
  if(kind==='recruiter'){utilityFrame();rect(-29,5,58,9,dark);for(const x of [-25,25])rect(x-3,-34,6,40,timber);poly([[-31,-33],[-18,-48],[20,-48],[32,-33]],roof);line([[-26,-31],[26,-31]],trim,2);shield(-13,-10,wall);line([[8,-27],[8,9]],steel,3);line([[17,-27],[17,9]],timber,3);poly([[6,-29],[12,-42],[18,-29]],trim);rect(-3,-17,7,22,timber);return;}
  if(kind==='rest'){utilityFrame();rect(-30,-20,60,35,wall);poly([[-35,-21],[0,-50],[35,-21]],roof);rect(-8,-5,16,20,dark);rect(19,-42,8,23,timber);for(const y of [-39,-33])line([[20,y],[26,y]],'#d4c5a2',1);line([[-25,-16],[25,-16]],trim,2);oval(-18,-8,5,5,'#d6b56f');rect(-21,-7,6,12,timber);if(region===1){for(const x of [-28,-18,18,28])line([[x,14],[x,23]],timber,3);}else if(region===2){for(const x of [-25,-12,12,25])rect(x-3,7,6,8,'#85877f');}else if(region===3){for(const x of [-24,24])poly([[x-4,-20],[x,-31],[x+4,-20]],'#8c674f');}else if(region===4){poly([[-5,-34],[0,-43],[5,-34],[0,-27]],'#9b87ad');}return;}
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
  if(kind==='barracks'){
   // Barracks are expedition camps, not shops or houses. Basic is a cozy field camp;
   // Full is the same camp grown into a larger, more capable expedition base.
   const full=!!e.full,campScale=1.18; // Basic and Full reserve the same visual footprint; upgrades change contents, never site size.
   ctx.save();ctx.scale(campScale,campScale);
   const canvas=['#927554','#6b7867','#77766a','#75594f','#555463'][region];
   const canvasLight=['#b29a72','#859483','#949184','#947166','#6e6b7c'][region];
   const bedding=['#8b6b55','#627b75','#777064','#7f5f58','#686171'][region];
   const ground=['#6f684f','#55665f','#69695f','#625149','#4d4b57'][region];
   const fireRing=['#777367','#66746e','#73756d','#665b54','#5c5963'][region];

   // Soft camp footprint and scattered sleeping gear make the site feel inhabited.
   shade(full?48:39,full?12:10,.18);
   fillOval(0,10,45,12,ground,.28);

   // Main low expedition tent. Open flap stays readable as shelter rather than storefront.
   const tentW=37,tentH=43;
   poly([[-tentW,8],[0,-tentH],[tentW,8]],canvas);
   fillPoly([[0,-tentH],[tentW,8],[0,8]],canvasLight,.23);
   poly([[-12,8],[0,-18],[12,8]],dark);
   line([[0,-tentH+3],[0,9]],timber,2);
   for(const side of [-1,1])line([[side*(tentW-4),6],[side*(tentW+10),15]],timber,2);
   line([[-tentW+3,8],[tentW-3,8]],trim,1.5);

   // Bedrolls/blankets beside the tent, deliberately visible in the world.
   rect(-31,5,18,7,bedding);line([[-28,7],[-16,7]],trim,1);
   if(full){rect(-10,9,18,7,bedding);line([[-7,11],[5,11]],trim,1);}
   oval(-29,4,5,3,canvasLight);

   // Communal cookfire: the visual heart of both camp tiers.
   for(const [x,y]of [[21,9],[27,11],[33,8],[27,5]])oval(x,y,4,2.5,fireRing);
   line([[20,8],[34,3]],timber,3);line([[21,3],[34,9]],timber,3);
   for(const x of [24,28,32])poly([[x-3,7],[x, -5-(x%2)*2],[x+3,7]],'#c77b48');
   glint(28,-2,region===4?'#d7a0ba':'#f0bd72',2);
   if(region===1){oval(28,0,7,3,'#5f7772');}
   if(region===4){poly([[25,3],[28,-7],[31,3]],'#8c6677');}

   // Small supply/gear corner; practical clutter rather than a counter or storefront.
   rect(15,-7,13,11,timber);line([[16,-6],[27,3]],trim,1);
   line([[37,-29],[37,10]],timber,3);for(const y of [-24,-13,-2])line([[33,y],[45,y]],steel,1.7);
   shield(-39,-2,wall);

   // Region-specific camp identity.
   if(region===0){
    for(const x of [-39,-34,-29])glint(x,12,x===-34?'#d7b47a':'#8ea16d',1.2);
    line([[-42,-8],[-47,-20]],'#75573e',2);
   }else if(region===1){
    for(const x of [-43,-37,-31])line([[x,13],[x+2,-9]],'#7e936c',1.5);
    line([[-45,15],[45,15]],'#8f7c59',2);
   }else if(region===2){
    for(const [x,y,r]of [[-41,10,5],[-35,7,4],[42,9,5]])oval(x,y,r,r*.55,'#777a72');
    line([[-38,-6],[-30,-14]],'#b3aa8e',1.5);
   }else if(region===3){
    line([[-42,9],[-35,-15]],'#4d433d',3);line([[-36,12],[-27,-10]],'#4d433d',2);
    for(const x of [23,28,33])glint(x,4,'#c77b53',1.2);
   }else{
    for(const x of [-42,42])poly([[x-5,12],[x,-2],[x+5,12]],'#706b82');
    poly([[-4,-33],[0,-40],[4,-33],[0,-27]],'#9b87ad');
   }

   // Simple camp banner/lantern reads as "our base" without making the camp a fort.
   line([[44,-35],[44,12]],timber,3);poly([[46,-33],[58,-30],[46,-22]],trim);
   glint(44,-37,region===4?'#d8c2ea':'#efd28a',1.8);

   if(full){
    // Full Barracks = established expedition base: second sleeping tent, command canopy,
    // extra bunks/supplies, and more warm lived-in detail while remaining unmistakably a camp.
    poly([[-58,10],[-44,-23],[-26,10]],canvas);fillPoly([[-44,-23],[-26,10],[-44,10]],canvasLight,.22);
    poly([[-49,10],[-44,-7],[-38,10]],dark);
    line([[-44,-21],[-44,11]],timber,2);
    rect(-58,11,20,6,bedding);line([[-55,13],[-41,13]],trim,1);

    // Open command canopy and low map table, not a shop counter.
    for(const x of [-12,12])line([[x,-13],[x,-37]],timber,3);
    poly([[-18,-35],[0,-46],[18,-35],[12,-27],[-12,-27]],canvasLight);
    rect(-15,-18,30,7,timber);line([[-11,-15],[10,-13]],'#c9b284',1);
    for(const [x,y]of [[-8,-15],[2,-16],[9,-13]])glint(x,y,trim,1);

    // More supplies and seating establish permanence/coziness.
    rect(48,-5,15,12,timber);rect(51,-17,12,11,canvas);
    oval(15,14,7,3,bedding);oval(33,15,7,3,bedding);
    line([[15,12],[15,19]],timber,2);line([[33,12],[33,19]],timber,2);
    for(const x of [-18,0,18])glint(x,16,region===4?'#c8a8d8':'#d7bc7c',1.2);

    // A second warm lamp makes Full camps feel welcoming at a glance.
    line([[-62,-20],[-62,13]],timber,2);glint(-62,-22,region===4?'#d7b4e4':'#f2cc7f',2);
   }
   ctx.restore();
   return;
  }
  rect(-23,-22,46,37,wall);poly([[23,-22],[35,-15],[35,10],[23,15]],'#737f75');poly([[-29,-22],[0,-47],[30,-22]],roof);poly([[0,-47],[12,-43],[36,-15],[30,-22]],'#4b5957');line([[-26,-23],[0,-44],[27,-22]],'#dfc9a0',2);line([[30,-20],[36,-15],[36,10]],'#8c9687',1.5);rect(-7,-5,14,20,'#504d40');rect(-18,-14,8,9,'#87a7a2');rect(11,-14,8,9,'#87a7a2');for(const x of [-17,12])line([[x,-12],[x+6,-12]],'#c8d7b9',1.5);line([[-23,2],[-9,2]],'#746b56',1);line([[-22,11],[22,11]],'#897f68',2);
  rect(14,-43,7,17,'#9a8e7c');rect(-5,-24,10,8,gold);
 }
 function settlementBuilding(kind){
  const wood=['#806044','#71654f','#71695b','#614f46','#555563'][region],stone=['#9b9c8f','#7e8780','#85877f','#766c64','#666775'][region],roof=['#9b6350','#617f79','#727a73','#76585a','#596478'][region],trim=['#d8bd83','#abd0c0','#c8c4a3','#c69a75','#b6a5c2'][region],dark=['#594b3b','#465a57','#54574f','#4d403a','#454653'][region];
  switch(kind){
   case 'vale-cottage':
    rect(-27,-18,54,33,'#c0ad8d');poly([[-34,-19],[0,-48],[34,-19]],'#a8684d');for(const x of [-20,0,20])line([[x,-18],[x,12]],wood,3);rect(-8,-4,16,19,dark);rect(14,-12,8,9,'#8aa2a0');line([[-24,-15],[24,-15]],trim,2);for(const x of [-18,17])glint(x,-11,'#e8d889',1.4);return;
   case 'vale-workshop':
    rect(-31,-13,62,28,'#ad956f');for(const x of [-27,-8,11,28])rect(x-3,-32,6,47,wood);poly([[-36,-31],[-18,-47],[25,-43],[36,-29]],'#8f5d47');rect(-18,-7,36,22,'#574b3d');line([[-28,-10],[28,-10]],trim,2);rect(18,-25,12,14,'#816245');return;
   case 'vale-fence':
    for(const x of [-22,-7,8,23])rect(x-2,-17,4,30,wood);line([[-27,-10],[28,-10]],'#a98a61',4);line([[-27,2],[28,2]],'#a98a61',4);return;
   case 'march-stilt-house':
    for(const x of [-23,-8,8,23])line([[x,11],[x,27]],wood,4);rect(-30,-14,60,27,'#9e9f84');poly([[-35,-15],[-22,-39],[24,-39],[35,-15]],'#6f8a76');for(const x of [-28,-18,-8,3,14,25])line([[x,-37],[x+4,-49]],'#83956d',2);rect(-9,-3,18,16,dark);line([[-26,9],[26,9]],'#c4b986',2);return;
   case 'march-boathouse':
    for(const x of [-28,-12,12,28])line([[x,12],[x,29]],wood,4);rect(-35,-9,70,23,'#8e947d');poly([[-39,-10],[-24,-34],[26,-34],[39,-10]],'#607d72');rect(-17,-5,34,18,'#40534e');line([[-30,-5],[30,-5]],trim,2);for(const x of [-25,-8,9,26])line([[x,-32],[x+3,-43]],'#8fa071',1.7);return;
   case 'march-boardwalk':
    rect(-31,2,62,12,'#897354');for(let x=-27;x<=27;x+=11)line([[x,2],[x,14]],'#5f513f',2);for(const x of [-25,25])line([[x,11],[x,24]],wood,3);return;
   case 'highland-stone-house':
    rect(-30,-19,60,34,'#8c8e84');for(const y of [-15,-4,7])line([[-28,y],[28,y]],'#656a64',1.4);poly([[-35,-20],[0,-48],[35,-20]],'#6d746f');rect(-8,-4,16,19,'#444741');rect(17,-43,8,23,'#77766d');line([[-26,-17],[26,-17]],trim,2);return;
   case 'highland-smithy':
    rect(-34,-17,68,32,'#777b75');for(const y of [-12,0,11])line([[-32,y],[32,y]],'#585e59',1.5);poly([[-37,-18],[-22,-40],[23,-40],[37,-18]],'#616a66');rect(16,-49,11,31,'#696a63');rect(-14,-5,28,20,'#454842');oval(20,8,8,4,'#4b443c');glint(20,4,'#e19c5e',1.7);return;
   case 'highland-wall':
    rect(-31,-14,62,28,'#777c75');for(const y of [-9,2,12])line([[-30,y],[30,y]],'#555d57',2);for(const x of [-22,-4,15])line([[x,-13],[x,0]],'#555d57',1.5);return;
   case 'frontier-patched-house':
    rect(-30,-19,60,34,'#9c826d');poly([[-36,-20],[-20,-43],[8,-48],[36,-20]],'#6f514d');rect(-8,-4,16,19,'#493f39');for(const [x,y]of [[-20,-12],[12,-14],[19,1]])rect(x,y,9,7,'#725f52');line([[-25,-16],[25,-16]],'#bd8f6f',2);line([[-29,-25],[-20,-38]],'#443d38',3);
    if(variant%3===0){line([[19,-16],[29,8]],'#5a4439',4);rect(18,-37,8,17,'#635149');}
    else if(variant%3===1){for(const x of [-20,-10,0])line([[x,13],[x+13,7]],'#7d6048',3);rect(-27,-31,12,7,'#8f6d55');}
    else {line([[-25,-2],[-11,10]],'#6d5141',4);line([[10,-43],[25,-30]],'#9a735a',3);glint(21,-10,'#d18b5a',1.3);}return;
   case 'frontier-workshop':
    for(const x of [-30,30])rect(x-3,-31,6,46,wood);poly([[-35,-30],[-19,-44],[23,-41],[36,-28]],'#654a47');rect(-31,-8,62,23,'#846e61');rect(-15,-8,30,23,dark);line([[-27,-7],[27,-7]],trim,2);oval(23,7,8,4,'#4b423c');for(const x of [19,23,27])glint(x,3,'#c77b53',1.3);
    if(variant%3===0){for(const x of [-20,-10,0])line([[x,13],[x+14,7]],'#765742',3);line([[-31,-20],[-18,-31]],'#9b765b',2);}
    else if(variant%3===1){rect(-28,-18,12,9,'#6d584c');line([[26,-8],[35,-20]],'#7e5f48',4);oval(36,-20,5,5,'#514842');}
    else {line([[-26,-30],[-12,-43]],'#ae8061',3);rect(15,-35,10,8,'#765950');glint(-20,5,'#d69a64',1.2);}return;
   case 'frontier-palisade':
    for(const x of [-24,-12,0,12,24]){rect(x-4,-28,8,42,'#665248');poly([[x-4,-28],[x,-40],[x+4,-28]],'#8b6f55');}line([[-27,-16],[27,-16]],'#54463e',4);return;
   case 'crown-ash-house':
    rect(-32,-21,64,36,'#666875');for(const x of [-29,-13,14,29])rect(x-3,-29,6,44,'#50515d');poly([[-37,-29],[-22,-47],[24,-47],[38,-29]],'#515a69');rect(-10,-7,20,22,'#2d2f38');poly([[-5,-37],[0,-45],[5,-37],[0,-29]],'#9b87ad');line([[-28,-18],[28,-18]],trim,2);glint(20,-9,'#d5a074',1.4);return;
   case 'crown-forgehouse':
    rect(-35,-20,70,35,'#5b5e69');for(const x of [-31,-14,5,24])rect(x,-14,13,10,'#737481');poly([[-38,-21],[-24,-42],[25,-42],[39,-21]],'#4f5867');rect(19,-52,11,32,'#555762');rect(-14,-8,28,23,'#2d3038');oval(24,7,8,4,'#3f3b43');for(const x of [20,24,28])glint(x,3,'#c88962',1.4);return;
   case 'crown-wall':
    rect(-32,-16,64,30,'#555762');for(const y of [-10,1,12])line([[-31,y],[31,y]],'#3c3e48',2);for(const x of [-23,-5,14])line([[x,-15],[x,0]],'#777381',1.5);for(const x of [-24,24])poly([[x-5,-16],[x,-27],[x+5,-16]],'#6d6878');return;
  }
 }
 function decoration(kind){const localWood=['#806044','#71654f','#71695b','#614f46','#555563'][region];switch(kind){
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
 case 'thorn-bed':oval(0,7,29,12,'#6f7f55');for(const [x,y]of [[-18,-2],[-8,-8],[4,-6],[16,-1]])poly([[x-5,y+8],[x,y-8],[x+6,y+8]],'#5e744d');for(const x of [-17,17])line([[x,6],[x+(x<0?-7:7),-5]],'#806543',3);break;
 case 'fang-trophy':line([[0,-41],[0,13]],localWood,3);for(const y of [-31,-18,-5]){poly([[-11,y],[-5,y-8],[-2,y]],bone);poly([[11,y],[5,y-8],[2,y]],bone);}break;
 case 'root-table':oval(0,3,27,10,'#74563d');for(const x of [-17,17])line([[x,6],[x,17]],'#604831',4);for(const [x,c]of [[-9,'#d0a85e'],[0,'#b98555'],[10,'#8c9a69']])oval(x,-1,4,3,c);break;
 case 'warm-brazier':oval(0,8,16,6,'#5a4a3b');for(const x of [-7,0,7])poly([[x-4,7],[x,-8],[x+4,7]],'#c87946');glint(0,-5,'#ffd27e',2);break;
 case 'treasure-hoard':for(const [x,y,r]of [[-15,6,7],[-5,1,8],[7,5,9],[16,8,6],[2,-5,6]])oval(x,y,r,r*.55,'#c59a4f');for(const [x,y]of [[-8,-2],[4,1],[13,4]])glint(x,y,'#f3dc8a',1.5);break;
 case 'boss-chest':rect(-23,-10,46,23,'#806144');poly([[-23,-10],[-17,-23],[17,-23],[23,-10]],'#9d7950');line([[0,-22],[0,12]],gold,3);rect(-5,-8,10,8,gold);break;
 case 'mire-pool':oval(0,7,30,12,'#4d7470');for(const x of [-22,-14,18,25])line([[x,12],[x,-8]],'#71865e',2);for(const [x,y]of [[-9,4],[6,1],[14,8]])oval(x,y,4,2,'#829c75');break;
 case 'fish-rack':for(const x of [-20,20])line([[x,12],[x,-34]],localWood,3);line([[-21,-30],[21,-30]],localWood,3);for(const x of [-14,0,14]){line([[x,-28],[x,-13]],'#d5c9a5',1);poly([[x-7,-12],[x,-17],[x+7,-12],[x,-7]],'#8fa197');}break;
 case 'reed-nest':oval(0,7,29,12,'#7d8060');for(let x=-25;x<=25;x+=8)line([[x,10],[x+4,-4]],'#a0986d',2);oval(0,3,18,7,'#556e5a');break;
 case 'shell-hoard':for(const [x,y]of [[-15,5],[-7,-1],[2,5],[11,0],[18,7]]){oval(x,y,7,4,'#b9ad8f');line([[x-4,y],[x+4,y]],'#806f5f',1);}for(const x of [-8,8])glint(x,-5,'#d9cfac',1.3);break;
 case 'drift-seat':line([[-24,8],[22,-2]],'#76654e',8);line([[-13,4],[-16,16]],'#665440',4);line([[12,0],[16,13]],'#665440',4);for(const x of [-12,2,14])line([[x,3],[x+3,-6]],'#9b8b6c',1);break;
 case 'ridge-hearth':rect(-25,-10,50,23,'#7d7f76');rect(-18,-27,36,17,'#666960');oval(0,4,17,6,'#4d4841');for(const x of [-8,0,8])poly([[x-4,5],[x,-9],[x+4,5]],'#c27e4c');break;
 case 'weapon-rack':for(const x of [-22,22])line([[x,13],[x,-38]],localWood,3);line([[-23,-30],[23,-30]],localWood,3);for(const x of [-13,0,13]){line([[x,-28],[x,10]],steel,2);poly([[x-5,-28],[x,-39],[x+5,-28]],'#aaa891');}break;
 case 'stone-seat':rect(-24,-12,48,27,'#777a72');rect(-18,-34,36,23,'#898b82');for(const x of [-17,17])rect(x-6,-4,12,19,'#686b65');line([[-14,-26],[14,-26]],'#aaa68f',2);break;
 case 'trophy-rack':for(const x of [-20,20])line([[x,13],[x,-36]],localWood,3);line([[-21,-31],[21,-31]],localWood,3);for(const x of [-12,0,12]){poly([[x-6,-27],[x,-37],[x+6,-27]],bone);line([[x,-26],[x,-8]],'#9b8e73',2);}break;
 case 'dark-brazier':oval(0,8,18,7,'#4c4652');for(const x of [-9,0,9])poly([[x-5,7],[x,-11],[x+5,7]],'#9c5f58');for(const x of [-5,5])glint(x,-4,'#d5a074',1.5);break;
 case 'dark-throne':rect(-24,-11,48,27,'#555461');poly([[-20,-10],[-17,-39],[0,-51],[17,-39],[20,-10]],'#64616f');poly([[0,-39],[6,-29],[0,-19],[-6,-29]],'#9b82aa');for(const x of [-18,18])rect(x-5,-3,10,19,'#464752');break;
 case 'war-table':oval(0,4,29,11,'#5e554f');for(const x of [-18,18])line([[x,7],[x,18]],'#493f3b',4);line([[-18,-1],[18,7]],'#ad8b6d',1);for(const [x,y]of [[-10,0],[3,2],[12,5]])glint(x,y,'#d7b46d',1.3);break;
 case 'crown-banner':line([[0,-50],[0,14]],steel,3);poly([[3,-47],[27,-43],[23,-13],[12,-6],[3,-15]],'#71586f');poly([[14,-37],[20,-28],[14,-19],[8,-28]],'#a78ab1');break;
 case 'crown-levy-yard':
  shade(42,10,.18);rect(-38,-5,48,18,'#765b47');for(const x of [-28,0])oval(x,13,7,7,'#45474a');line([[8,-2],[28,-18]],localWood,4);
  rect(15,-3,22,17,'#8d6d4b');rect(25,-18,20,16,'#7c6047');line([[16,-2],[36,13]],'#b99566',2);line([[26,-17],[44,-3]],'#b99566',2);
  oval(-3,-16,12,5,'#4c4652');for(const x of [-7,-1,5])poly([[x-3,-15],[x,-27],[x+3,-15]],'#a76149');line([[-45,-28],[-45,12]],steel,3);poly([[-43,-26],[-22,-23],[-26,-7],[-43,-11]],'#71586f');break;
 case 'crown-command-post':
  shade(44,10,.18);rect(-34,-8,68,18,'#5e5a61');for(const x of [-28,28])line([[x,9],[x,-28]],steel,4);line([[-30,-25],[30,-25]],steel,3);
  line([[0,-55],[0,11]],steel,3);poly([[3,-52],[31,-48],[26,-18],[13,-10],[3,-18]],'#71586f');poly([[15,-39],[21,-30],[15,-21],[9,-30]],'#a78ab1');
  for(const x of [-21,21]){line([[x,-22],[x,7]],'#aeb6b2',2);poly([[x-4,-23],[x,-34],[x+4,-23]],'#c2b48d');}rect(-9,-15,18,18,'#4b4651');break;
 case 'ashbeast-roost-scene':
  shade(46,11,.16);oval(0,7,38,15,'#544a4b');for(let x=-34;x<=34;x+=10)line([[x,11],[x+5,-3]],'#78634f',3);oval(0,4,25,9,'#6d5a4e');
  for(const [x,h]of [[-34,22],[28,28],[40,18]])poly([[x-5,9],[x,-h],[x+6,9]],'#514c59');for(const [x,y]of [[-20,-1],[16,1],[7,-7]])line([[x-5,y+3],[x+5,y-3]],bone,3);
  oval(-28,12,11,5,'#4b403d');for(const x of [-32,-27,-22])poly([[x-3,11],[x,-3],[x+3,11]],'#b06b4d');break;
 case 'crown-logistics-bay':
  shade(46,11,.18);poly([[-43,-2],[-25,-34],[25,-34],[44,-2]],'#57515f');line([[-24,-31],[-24,13]],localWood,4);line([[24,-31],[24,13]],localWood,4);
  rect(-35,-4,27,20,'#806144');rect(-10,-10,25,24,'#8b6b49');rect(14,-2,25,18,'#745945');for(const [x,y]of [[-26,-8],[4,-14],[26,-6]])glint(x,y,'#b99468',1);
  oval(-28,-17,13,5,'#4d4642');for(const x of [-34,-28,-22])poly([[x-3,-16],[x,-30],[x+3,-16]],'#b96f47');for(const x of [5,15,25])line([[x,-31],[x,7]],steel,2);break;
 case 'crown-fortress-checkpoint':
  shade(48,11,.2);for(const x of [-38,38]){oval(x,5,13,5,'#4c4652');for(const dx of [-5,0,5])poly([[x+dx-3,4],[x+dx,-12],[x+dx+3,4]],'#9c5f58');}
  for(const x of [-32,-16,0,16,32])line([[x,13],[x,-8]],'#6e5d55',5);line([[-39,-4],[39,-4]],steel,3);
  line([[0,-56],[0,12]],steel,3);poly([[3,-53],[29,-49],[24,-19],[12,-10],[3,-18]],'#71586f');poly([[14,-40],[20,-31],[14,-22],[8,-31]],'#b08db9');for(const x of [-20,20])line([[x,-7],[x,-32]],'#b7b8b0',2);break;
 case 'animal-pen':for(const x of [-23,23])line([[x,12],[x,-18]],localWood,3);line([[-24,-13],[24,-13]],localWood,3);line([[-24,2],[24,2]],localWood,3);for(const [x,y]of [[-9,5],[7,7]])oval(x,y,7,4,'#8c8062');break;
 case 'drying-rack':for(const x of [-22,22])line([[x,12],[x,-34]],localWood,3);line([[-23,-29],[23,-29]],localWood,3);for(const x of [-14,0,14]){line([[x,-28],[x,-10]],'#cdbf9f',1);rect(x-5,-10,10,12,x===0?'#8da0a0':'#a1846f');}break;
 case 'tax-post':line([[0,-48],[0,14]],localWood,4);rect(-18,-43,36,25,'#8a7357');for(const y of [-37,-31,-25])line([[-13,y],[12,y]],'#d3c298',1);rect(7,-14,12,10,'#6f5541');break;
 case 'lean-to':for(const x of [-24,24])line([[x,13],[x,-27]],localWood,4);poly([[-31,-25],[-12,-41],[28,-32],[31,-20]],'#8a7359');rect(-22,-5,44,17,'#665848');break;
 case 'cookfire':for(const a of [-15,0,15])line([[-18,a/5+7],[18,a/5-4]],'#70543d',4);oval(0,7,16,6,'#4b443c');for(const x of [-8,0,8])poly([[x-4,6],[x,-9],[x+4,6]],'#c97d48');glint(0,-5,'#efbd72',2);break;
 case 'sleep-roll':rect(-25,-8,50,18,'#7b6c58');line([[-23,-5],[23,-5]],'#b6a17d',2);oval(-18,-7,7,4,'#9b8566');break;
 case 'game-table':oval(0,2,24,9,'#705740');for(const x of [-15,15])line([[x,5],[x,17]],localWood,4);for(const [x,y,c]of [[-7,0,'#d2bd7d'],[2,-2,'#8fa0a0'],[8,3,'#aa7c6f']])oval(x,y,2.5,2,c);break;
 case 'stolen-goods':rect(-20,-10,24,23,'#8b6b49');rect(3,-5,21,18,'#9a7752');poly([[-8,-12],[-1,-25],[7,-13]],'#8d9b76');line([[12,-4],[22,-17]],steel,2);break;
 case 'training-dummy':line([[0,-40],[0,15]],localWood,5);line([[-20,-24],[20,-24]],localWood,4);oval(0,-48,9,9,'#9b8060');rect(-12,-18,24,24,'#77614d');break;
 case 'bone-pile':for(const [x,y]of [[-13,4],[-4,-1],[6,5],[14,0]]){line([[x-7,y-4],[x+7,y+4]],bone,3);oval(x+6,y+4,2.5,2.5,bone);}skull(-2,-7,5);break;
 case 'grave-marker':rect(-11,-29,22,42,'#7a7f78');poly([[-13,-28],[0,-42],[13,-28]],'#8f958b');line([[0,-25],[0,2]],'#b5b5a5',2);line([[-6,-16],[6,-16]],'#b5b5a5',2);break;
 case 'pup-nest':oval(0,7,28,11,'#7d7657');for(let x=-24;x<=24;x+=8)line([[x,10],[x+5,-2]],'#a28d62',2);for(const [x,y]of [[-8,3],[8,4]])oval(x,y,5,3,'#8c775d');break;
 case 'fishing-net':for(const x of [-22,22])line([[x,13],[x,-31]],localWood,3);for(let y=-28;y<9;y+=8)line([[-20,y],[20,y+4]],'#b4b39a',1);for(let x=-18;x<=18;x+=9)line([[x,-29],[x+5,10]],'#b4b39a',1);break;
 case 'mud-nest':oval(0,7,28,12,'#675e4b');oval(0,4,20,8,'#4d6655');for(const x of [-19,-8,10,21])line([[x,9],[x+4,-4]],'#7d7357',2);break;
 case 'wallow':oval(0,7,29,12,'#5d6254');oval(0,5,23,8,'#4f6f69');for(const [x,y]of [[-9,3],[7,5],[13,1]])oval(x,y,3,2,'#7c8972');break;
 case 'ore-cart':rect(-23,-11,46,18,'#806548');for(const x of [-15,15])oval(x,10,7,7,'#4f514c');for(const [x,y]of [[-12,-12],[0,-16],[12,-11]])oval(x,y,8,5,'#858880');line([[21,-7],[34,-15]],localWood,3);break;
 case 'ore-crane':for(const x of [-25,25])line([[x,14],[x,-42]],localWood,5);line([[-27,-39],[28,-39]],localWood,4);line([[20,-38],[20,-5]],steel,2);oval(20,-2,6,4,'#777b75');line([[-25,-30],[25,-39]],'#9c805a',3);break;
 case 'tool-rack':for(const x of [-22,22])line([[x,13],[x,-35]],localWood,3);line([[-23,-29],[23,-29]],localWood,3);for(const x of [-13,0,13]){line([[x,-27],[x,8]],steel,2);line([[x-5,-20],[x+5,-20]],'#9b805e',3);}break;
 case 'stone-marker':for(const [x,y,r]of [[0,7,12],[-2,-8,9],[1,-20,6]])oval(x,y,r,r*.55,'#797d75');line([[-5,-9],[5,-13]],'#b4aa8e',1.5);break;
 case 'field-kitchen':rect(-25,-8,50,21,'#7a6249');oval(0,-5,16,7,'#4e4840');for(const x of [-8,0,8])poly([[x-4,-2],[x,-16],[x+4,-2]],'#b96f47');line([[-30,-20],[30,-20]],localWood,3);for(const x of [-24,24])line([[x,13],[x,-28]],localWood,3);if(region===3&&variant%2===0){oval(-18,-17,7,4,'#5a5046');line([[-24,-18],[-12,-18]],'#a88964',2);}break;
 case 'supply-stack':for(const [x,y]of [[-17,0],[5,2],[-6,-14],[15,-13]]){rect(x-10,y-8,20,17,'#8d6d4b');line([[x-9,y-7],[x+9,y+7]],'#b89565',2);}if(region===3){if(variant%3===0)oval(22,6,9,6,'#8a765e');else if(variant%3===1)rect(-30,-4,13,16,'#725942');else line([[-24,-18],[20,-21]],'#c6a477',2);}break;
 case 'command-tent':poly([[-35,12],[0,-47],[36,12]],region===4?'#5d5668':'#7c5e53');line([[0,-44],[0,14]],localWood,4);rect(-12,-2,24,17,region===4?'#33313a':'#54463f');line([[-29,9],[29,9]],'#b79573',2);if(region===3){if(variant%2===0){rect(-24,-22,13,8,'#956f60');line([[-34,11],[-45,19]],'#6a5141',2);}else{line([[22,-18],[34,-26]],'#9e735d',3);rect(18,-3,10,8,'#6d5144');}}break;
 case 'bunk':rect(-27,-8,54,18,'#6d5947');rect(-24,-6,48,10,'#837561');for(const x of [-23,23])line([[x,8],[x,17]],localWood,3);rect(-20,-5,11,7,'#b09a78');break;
 case 'forge':rect(-26,-12,52,27,'#696863');rect(-18,-29,36,18,'#77736b');oval(0,4,16,6,'#403b38');for(const x of [-8,0,8])poly([[x-4,5],[x,-9],[x+4,5]],'#bd7148');rect(19,-42,9,31,'#5b5855');break;
 case 'roost':oval(0,7,30,12,'#62594f');for(const x of [-24,-12,0,12,24])line([[x,10],[x+5,-6]],'#806a4e',2);for(const [x,y]of [[-9,1],[8,4]])poly([[x-5,y+6],[x,y-8],[x+5,y+6]],'#676b62');break;
 case 'hatchery':oval(0,7,30,12,'#5a5049');for(const [x,y]of [[-12,3],[0,-1],[12,4]])oval(x,y,6,8,'#8d826d');for(const x of [-22,22])line([[x,10],[x+4,-7]],'#7b6750',2);break;
 case 'scribe-desk':rect(-27,-8,54,17,'#725d47');for(const x of [-21,21])line([[x,6],[x,18]],localWood,3);rect(-18,-18,36,11,'#c5b88f');line([[-14,-14],[12,-14]],'#776b58',1);break;
 case 'scroll-stack':for(const [x,y]of [[-13,5],[0,1],[13,6],[-5,-8],[8,-9]]){rect(x-8,y-3,16,6,'#c5b78e');oval(x-8,y,2,3,'#927a5e');}break;
 case 'ossuary':rect(-24,-17,48,31,'#747872');for(const [x,y]of [[-12,-8],[0,-10],[12,-7],[-7,4],[8,3]])skull(x,y,4);line([[-22,-14],[22,-14]],'#a5aa9d',2);break;
 case 'ritual-table':oval(0,3,27,10,'#6d5e50');for(const x of [-18,18])line([[x,6],[x,18]],localWood,4);poly([[-7,-3],[0,-11],[7,-3],[0,5]],'#9b8a73');glint(0,-6,'#d9bf86',1.5);break;
 case 'grave-lamp':line([[0,-35],[0,13]],steel,3);poly([[-8,-33],[0,-43],[8,-33],[6,-18],[-6,-18]],'#7c7260');glint(0,-27,'#e0bd72',2);break;
 case 'caretaker-table':rect(-24,-7,48,16,'#6f5a45');for(const x of [-18,18])line([[x,7],[x,18]],localWood,3);rect(-17,-14,15,7,'#9a8669');oval(10,-10,6,4,'#83725a');break;
 case 'grass':for(const x of [-7,0,7])line([[x,8],[x+(x?Math.sign(x)*3:1),-8-(variant%5)]],'#739266',1.5);break;
 case 'wet-grass':for(const x of [-8,-3,3,8])line([[x,9],[x+(x%3),-10-(variant%6)]],'#688c70',1.6);break;
 case 'bush':for(const [x,y,r]of [[-8,2,9],[0,-5,11],[9,2,8]])oval(x,y,r,r*.7,'#58784f');break;
 case 'marsh-bush':for(const [x,y,r]of [[-8,3,8],[0,-4,10],[9,2,8]])oval(x,y,r,r*.65,'#5d7662');for(const x of [-5,5])glint(x,-4,'#b7c69d',1);break;
 case 'wildflowers':for(const [x,c]of [[-8,'#d8b47a'],[-2,'#d6a4b1'],[5,'#ded9a6'],[10,'#b8c9d4']]){line([[x,9],[x,-3]],'#6f8b62',1);glint(x,-5,c,1.8);}break;
 case 'sapling':rect(-2,-8,4,20,'#74583e');for(const [x,y]of [[-7,-15],[3,-20],[9,-11]])oval(x,y,9,7,'#52794f');break;
 case 'stump':rect(-8,-5,16,15,'#76563c');oval(0,-6,9,4,'#b38b5d');line([[-4,-6],[3,-4]],'#75573e',1);break;
 case 'fallen-log':line([[-22,8],[20,-5]],'#76563c',8);oval(21,-5,5,5,'#b79061');for(const x of [-9,3])line([[x,2],[x-5,-6]],'#5f4b38',2);break;
 case 'reeds':for(const x of [-10,-6,-1,4,9])line([[x,10],[x+(x%2),-15-(variant+x)%7]],'#748c62',1.6);break;
 case 'cattails':for(const x of [-9,-3,4,10]){line([[x,10],[x,-16]],'#71875e',1.5);oval(x,-17,2.2,5,'#796245');}break;
 case 'driftwood':line([[-20,8],[19,-2]],'#776752',5);line([[-5,3],[-11,-6]],'#776752',2);line([[7,1],[14,-7]],'#776752',2);break;
 case 'mangrove':rect(-4,-5,8,22,'#625442');for(const [x,y]of [[-13,-14],[-3,-21],[10,-15],[3,-8]])oval(x,y,12,8,'#4d735f');for(const side of [-1,1]){line([[side*2,9],[side*11,17]],'#6c5b45',2);line([[side*1,9],[side*6,20]],'#6c5b45',1.5);}for(const x of [-8,7])glint(x,-14,'#91b69a',1);break;
 case 'dock-post':rect(-3,-25,6,38,'#6b543d');oval(0,-25,4,2,'#9b7954');line([[-2,-17],[2,-17]],'#b89669',1);break;
 case 'pine-sapling':rect(-2,-4,4,16,'#65533d');for(const [y,w]of [[1,12],[-7,10],[-15,7]])poly([[-w,y],[0,y-15],[w,y]],'#526c50');break;
 case 'alpine-scrub':for(const [x,y,r]of [[-7,3,7],[1,-1,8],[8,4,6]])oval(x,y,r,r*.55,'#778166');break;
 case 'heather':for(const x of [-8,-3,2,7]){line([[x,9],[x,-5]],'#778067',1);glint(x,-6,x%2?'#b79ab9':'#a99bc6',1.6);}break;
 case 'rock-cluster':for(const [x,y,r,c]of [[-9,4,8,'#797d75'],[2,-2,10,'#90928a'],[11,5,7,'#666b66']])oval(x,y,r,r*.55,c);break;
 case 'dead-tree':rect(-3,-14,6,28,'#5f4b40');line([[0,-8],[-14,-24]],'#5f4b40',4);line([[0,-5],[13,-21]],'#5f4b40',4);line([[-13,-24],[-18,-29]],'#5f4b40',2);break;
 case 'charred-stump':rect(-8,-5,16,15,'#4a403a');oval(0,-6,9,4,'#6c5545');line([[-3,-7],[4,-4]],'#2e2c29',2);break;
 case 'ash-patch':ctx.save();ctx.globalAlpha=.55;oval(0,6,18,7,'#55504d');for(const [x,y]of [[-8,5],[1,2],[9,7]])glint(x,y,'#8d8179',1);ctx.restore();break;
 case 'dry-scrub':for(const x of [-8,-3,3,8]){line([[x,9],[x+(x<0?-4:4),-7]],'#78614f',1.5);line([[x,1],[x+(x<0?4:-4),-3]],'#78614f',1);}break;
 case 'burned-log':line([[-22,8],[21,-4]],'#4a403a',8);for(const x of [-8,6])line([[x,3],[x-4,-6]],'#2f2d2b',2);break;
 case 'ember-pit':oval(0,6,17,7,'#49423e');for(const x of [-7,0,7]){poly([[x-4,7],[x,-6],[x+4,7]],'#a55f42');glint(x,-2,'#efb36d',1.3);}break;
 case 'black-rock':for(const [x,y,r,c]of [[-8,4,9,'#4e4a54'],[3,-2,11,'#625a69'],[11,5,7,'#403f48']])oval(x,y,r,r*.55,c);break;
 case 'crystal-cluster':for(const [x,h,c]of [[-9,20,'#766a91'],[0,28,'#9382ac'],[10,17,'#6f6488']])poly([[x-5,10],[x-4,10-h],[x,5-h],[x+5,10-h],[x+5,10]],c);glint(0,-21,'#d8c7e9',1.5);break;
 case 'dead-shrub':for(const x of [-8,-3,3,8]){line([[x,9],[x+(x<0?-3:3),-6]],'#62534e',1.3);line([[x,0],[x+(x<0?4:-4),-4]],'#62534e',1);}break;
 case 'fumarole':oval(0,7,13,5,'#4d484f');ctx.save();ctx.globalAlpha=.35;for(const [x,y,r]of [[-3,-4,5],[3,-13,7],[-1,-23,9]])oval(x,y,r,r*.7,'#b9aebb');ctx.restore();break;
 case 'obsidian':poly([[-12,9],[-9,-10],[0,-23],[11,-8],[14,9]],'#373740');line([[-7,-8],[0,-19],[5,-7]],'#8b789a',1.5);break;
 case 'market':rect(-24,3,48,11,'#8d704d');for(const x of [-20,20])rect(x-2,-25,4,29,'#776043');poly([[-27,-23],[-17,-37],[19,-37],[27,-23]],region===3?'#8c6259':'#c4ad77');for(const x of [-13,0,13])oval(x,0,4,3,'#8f9d69');break;
 case 'woodpile':for(const [x,y]of [[-13,5],[0,2],[12,6],[-7,-3],[7,-5]]){line([[x-10,y],[x+10,y]],'#806044',6);oval(x+10,y,3,3,'#c09a68');}break;
 case 'laundry':for(const x of [-19,19])line([[x,12],[x,-30]],'#75654e',3);line([[-19,-21],[19,-21]],'#d7c8a0',1);rect(-13,-20,9,13,'#8ba0a2');rect(1,-20,11,15,'#a77f74');break;
 case 'well':oval(0,7,20,9,'#858b80');oval(0,4,15,6,'#3f6d73');for(const x of [-15,15])line([[x,5],[x,-28]],'#806a4d',3);poly([[-20,-26],[0,-39],[20,-26]],'#9a7355');break;
 case 'barrel':oval(0,-8,9,5,'#a48158');rect(-9,-8,18,20,'#8b6b49');oval(0,12,9,5,'#72573e');for(const y of [-5,7])line([[-8,y],[8,y]],'#b7aa8a',2);break;
 case 'cart':rect(-22,-9,44,17,'#987752');for(const x of [-14,14])oval(x,10,7,7,'#53564f');line([[20,-5],[34,-13]],'#80654a',3);rect(-15,-19,30,10,'#b08b5d');if(region===3){if(variant%3===0){for(const x of [-11,0,11])line([[x,-19],[x+5,-28]],'#765642',4);}else if(variant%3===1){rect(-14,-28,28,8,'#8d6c4e');line([[-20,-7],[-7,-18]],'#5e493c',2);}else{oval(-14,10,4,4,'#b79664');line([[14,10],[25,16]],'#6e5541',3);}}break;
 case 'ration':for(const [x,y]of [[-10,3],[4,5],[-2,-7]]){rect(x-8,y-7,16,13,'#96734d');line([[x-7,y-6],[x+7,y+5]],'#c1a170',2);}break;
 case 'garden':for(const x of [-14,-7,0,7,14]){line([[x,9],[x,-3]],'#66845d',1.4);oval(x,-5,3,2,x%2?'#bb966d':'#799b68');}line([[-20,11],[20,11]],'#755c43',2);break;
 case 'watchpost':for(const x of [-13,13])line([[x,12],[x,-27]],'#776047',4);rect(-18,-29,36,8,'#997954');poly([[-20,-30],[0,-43],[20,-30]],'#84644b');line([[0,-29],[0,-48]],'#ad9a72',2);if(region===3){rect(-6,-34,12,7,'#8c5d54');if(variant%2===0)line([[15,-27],[24,-18]],'#6e5141',3);}break;
 case 'barricade':for(const x of [-18,-6,6,18]){rect(x-3,-11,6,24,'#665248');poly([[x-3,-11],[x,-21],[x+3,-11]],'#8b6f55');}line([[-22,-4],[22,5]],'#8a6d53',4);if(region===3){line([[-20,4],[18,-7]],'#5b4439',3);if(variant%2===0)rect(-5,-9,11,5,'#955d50');}break;
 case 'road-ruts':ctx.save();ctx.globalAlpha=.5;for(const y of [-7,7]){line([[-30,y],[30,y+flip*2]],'#493b34',3);line([[-22,y+3],[24,y+4]],'#796151',1);}for(const x of [-18,4,22])oval(x,2+(x%3),2,1.4,'#8d735d');ctx.restore();break;
 case 'road-patch':ctx.save();ctx.globalAlpha=.65;poly([[-27,-9],[-9,-13],[10,-10],[28,-5],[22,10],[1,13],[-22,8]],'#766257');for(const [x,y]of [[-15,-4],[-3,5],[10,-2],[19,5]])oval(x,y,2.5,1.7,'#a2866e');line([[-19,0],[17,4]],'#4d4039',1.2);ctx.restore();break;
 case 'stacked-lumber':for(const [y,w]of [[7,25],[0,22],[-7,19]]){line([[-w,y],[w,y-2]],'#7d5b43',6);oval(w,y-2,3,3,'#b2875e');}for(const x of [-18,18])line([[x,11],[x-3,-12]],'#5f4739',2);break;
 case 'repair-brace':for(const x of [-18,18])line([[x,13],[x,-34]],'#745641',4);line([[-18,7],[18,-28]],'#9a7455',5);line([[-18,-18],[18,-18]],'#6a4f3f',3);break;
 case 'broken-cart':rect(-23,-8,39,15,'#7d5d46');oval(-13,10,7,7,'#4b4b45');oval(15,10,7,7,'#4b4b45');line([[15,10],[29,18]],'#684c3a',3);line([[12,-5],[31,-17]],'#7a5842',3);line([[-19,-13],[-2,-22]],'#9a7150',4);break;
 case 'wagon-wheel':oval(0,0,15,15,'#5a5147');oval(0,0,11,11,'#8a684c');for(let a=0;a<Math.PI;a+=Math.PI/4)line([[Math.cos(a)*2,Math.sin(a)*2],[Math.cos(a)*12,Math.sin(a)*12]],'#c09968',2);break;
 case 'charred-foundation':ctx.save();ctx.globalAlpha=.75;for(const [x1,y1,x2,y2]of [[-27,-12,24,-12],[24,-12,27,12],[27,12,-22,12],[-22,12,-27,-12]])line([[x1,y1],[x2,y2]],'#4b423e',6);for(const [x,y]of [[-18,-6],[8,7],[20,-4]])oval(x,y,4,2,'#66534a');ctx.restore();break;
 case 'replacement-stakes':for(const x of [-22,-11,0,11,22]){rect(x-2,-17,4,30,'#8a684d');poly([[x-2,-17],[x,-24],[x+2,-17]],'#b38a60');}line([[-24,0],[24,0]],'#6d513f',3);break;
 case 'patched-fence':for(const x of [-22,-7,8,23])rect(x-2,-17,4,30,x===8?'#9a7656':'#6d5342');line([[-27,-10],[28,-8]],'#8e6d50',4);line([[-27,3],[28,0]],'#a17b58',4);rect(3,-6,12,8,'#76584a');break;
 case 'inspection-marker':line([[0,-35],[0,14]],'#745942',4);rect(-15,-31,30,20,'#7b644f');for(const y of [-26,-20,-14])line([[-10,y],[9,y]],'#d0bc91',1);rect(8,-8,9,8,'#8f5c52');break;
 case 'checkpoint-standard':line([[0,-49],[0,15]],'#6b5543',4);poly([[3,-46],[24,-41],[20,-23],[3,-27]],'#965b53');line([[7,-37],[18,-34]],'#d4b988',2);for(const x of [-16,16])line([[x,11],[x,-12]],'#675044',3);break;
 case 'chain-anchor':poly([[-12,11],[-9,-8],[0,-18],[10,-8],[13,11]],'#5d5b56');for(let x=-24;x<=24;x+=8)oval(x,3+Math.abs(x)/10,4,3,'#85877f');line([[-20,2],[-9,-1]],'#9a9b91',2);line([[10,-1],[22,3]],'#9a9b91',2);break;
 }}
 function landmark(){
  switch(e.id){
   case 'orchard':for(const x of [-18,0,18]){rect(x-2,-9,4,21,'#76573d');oval(x,-18,10,8,'#58794f');glint(x+3,-18,'#cf8a67',1.6);}line([[-30,12],[30,12]],'#8f7656',2);break;
   case 'den-ruins':rect(-24,-12,15,26,'#878b80');rect(8,-22,17,36,'#777d76');line([[-25,-13],[-12,-26],[0,-16],[14,-29],[27,-18]],'#a3a895',3);break;
   case 'mill-pond':case 'night-site':oval(0,7,31,12,'#538c94');for(const x of [-23,-15,17,24])line([[x,10],[x,-9]],'#718b66',2);if(e.id==='night-site'){line([[0,-4],[0,-30]],'#9b835d',3);glint(0,-33,'#e7c46f',3);}break;
   case 'cache':rect(-17,-12,34,25,'#8f704d');line([[-17,-12],[17,13]],'#c1a170',3);line([[17,-12],[-17,13]],'#c1a170',3);line([[-29,10],[-8,2]],'#75583f',6);break;
   case 'wagon':case 'convoy':rect(-28,-10,56,19,'#987752');for(const x of [-18,18])oval(x,11,8,8,'#4f534d');poly([[-25,-12],[-17,-31],[18,-31],[26,-12]],'#b9a274');line([[26,-5],[41,-14]],'#80654a',3);break;
   case 'watch':for(const x of [-20,20])line([[x,13],[x,-34]],'#796246',4);rect(-27,-37,54,9,'#a3845d');line([[-24,-19],[24,-19]],'#a3845d',3);line([[0,-36],[0,-55]],'#c0a979',2);break;
   case 'dock':oval(-20,9,18,7,'#527f87');for(const y of [-6,1,8])line([[-6,y],[30,y]],'#a0835c',4);for(const x of [-5,30])line([[x,-10],[x,13]],'#765f48',3);break;
   case 'lookout':for(const [x,y,r]of [[-9,6,9],[2,-1,11],[12,6,8]])oval(x,y,r,r*.55,'#7f8278');line([[0,-10],[0,-45]],'#8e7b5d',3);poly([[2,-44],[24,-40],[2,-28]],'#8c765c');break;
   case 'ore':for(const [x,y]of [[-12,4],[0,-5],[12,5]])poly([[x-7,y+7],[x-5,y-11],[x,y-19],[x+7,y-8],[x+8,y+7]],'#8b8c82');for(const x of [-11,2,12])glint(x,-4,'#c2a878',1.4);break;
   case 'tower':rect(-18,-34,36,49,'#858b83');rect(-23,-42,13,11,'#a0a493');rect(9,-42,14,11,'#a0a493');poly([[-8,-33],[5,-47],[17,-31],[7,-20]],'#536157');break;
   case 'shrine':rect(-23,-16,46,30,'#746e69');for(const x of [-17,11])rect(x,-34,7,22,'#8c877e');poly([[-26,-18],[0,-42],[27,-18]],'#8d8172');line([[-6,-17],[7,-5],[-5,7]],'#a26d57',2);break;
   case 'overlook':for(const x of [-24,0,24])line([[x,13],[x,-16]],'#85715b',3);line([[-26,-12],[26,-12]],'#b29b73',3);for(const [x,y,r]of [[-10,7,7],[5,4,8]])oval(x,y,r,r*.5,'#6d6a63');break;
   case 'checkpoint':for(const x of [-26,-9,9,26]){rect(x-3,-14,6,29,'#665048');poly([[x-3,-14],[x,-25],[x+3,-14]],'#896a53');}line([[-30,-5],[30,5]],'#a48462',5);line([[21,-23],[21,-47]],'#9a825f',3);poly([[23,-45],[42,-41],[23,-31]],'#8b5f58');break;
   case 'foundry':rect(-26,-15,52,30,'#67645f');rect(-19,-30,15,18,'#80776c');rect(7,-37,14,25,'#746f69');oval(0,6,19,7,'#4f4742');for(const x of [-8,0,8])glint(x,1,'#db8751',2);break;
   case 'shelf':for(const [x,h,c]of [[-14,23,'#776a91'],[0,34,'#9a87b3'],[15,19,'#6b6384']])poly([[x-6,12],[x-5,12-h],[x,7-h],[x+6,12-h],[x+6,12]],c);glint(0,-25,'#d9c8e8',2);break;
   case 'siege':poly([[-27,13],[0,-34],[28,13]],'#8a6e60');line([[0,-31],[0,12]],'#5e5048',3);rect(19,-13,22,26,'#665047');line([[30,-13],[30,-40]],'#9b805b',3);poly([[31,-39],[48,-34],[31,-25]],'#795463');break;
   case 'fortress-gate':rect(-34,-35,68,50,'#565966');rect(-18,-23,36,38,'#252830');for(const x of [-31,24])rect(x,-45,8,60,'#707381');poly([[-38,-37],[0,-62],[38,-37]],'#656674');break;
   case 'goblin-camp':poly([[-28,12],[-6,-29],[12,12]],'#8e7455');poly([[-5,12],[17,-24],[32,12]],'#756349');oval(-16,9,9,4,'#4e463d');glint(-16,5,'#e5a75e',1.6);rect(17,-2,15,13,'#8b6b49');break;
   case 'mire-nests':oval(0,8,31,13,'#586a58');for(let x=-26;x<=26;x+=8)line([[x,10],[x+4,-4]],'#82785e',2);oval(-8,3,7,5,'#7c876d');oval(9,4,6,4,'#6f7c66');break;
   case 'wolf-den':poly([[-31,11],[-22,-16],[-5,-32],[16,-25],[31,10]],'#747970');poly([[-17,10],[-12,-9],[0,-19],[14,-7],[19,10]],'#2e3732');for(const [x,y]of [[-23,5],[22,6]])oval(x,y,7,4,'#8c8978');break;
   case 'ogre-hearth':oval(0,8,25,9,'#5a5147');for(const x of [-11,0,11])poly([[x-5,7],[x,-10],[x+5,7]],'#bd7b4f');rect(-30,-8,14,23,'#777a72');rect(18,-10,15,25,'#777a72');break;
   case 'orc-bivouac':poly([[-30,12],[0,-39],[31,12]],'#77584f');line([[0,-36],[0,13]],'#614f46',3);rect(16,-8,20,20,'#665047');line([[26,-12],[26,-41]],'#9a825f',3);poly([[28,-39],[43,-35],[28,-28]],'#8b5f58');break;
   case 'ash-roost':oval(0,8,31,13,'#4f4a51');for(const x of [-23,-11,0,12,24])line([[x,10],[x+4,-7]],'#6a5a50',2);poly([[-7,4],[0,-15],[8,4]],'#7a6d83');glint(0,-8,'#c58d67',1.6);break;
   case 'crown-barracks':rect(-33,-19,66,34,'#5b5d68');for(const x of [-30,-14,14,30])rect(x-3,-29,6,44,'#4d4e59');poly([[-38,-28],[-22,-47],[24,-47],[38,-28]],'#505969');rect(-13,-8,26,23,'#2d3038');poly([[-5,-37],[0,-45],[5,-37],[0,-29]],'#9b87ad');break;
   default:if(/pond|shore|dock/i.test(e.name)){oval(0,5,28,10,'#528b94');for(const x of [-16,0,16])line([[x,-6],[x,12]],'#b5a47a',3);}else if(e.icon==='🏕️')poly([[-24,12],[0,-30],[25,12]],'#b8aa7a');else{rect(-12,-25,24,38,'#999d8c');poly([[-15,-26],[0,-42],[16,-26]],'#b0b6a2');line([[-4,-22],[5,-10],[-3,3]],'#65736a');}
  }
 }
 const type=e.renderKind;
 if(type==='prop'){if(e.treasuryBoss)decoration(e.structure);else if(e.decorative)decoration(e.structure);else if(/^(vale-|march-|highland-|frontier-|crown-)/.test(e.structure||'')){settlementBuilding(e.structure);}else if(e.structure==='fence'){for(const x of [-18,0,18])rect(x-2,-18,4,30,'#a48c69');line([[-23,-12],[23,-12]],'#9c835e',4);line([[-23,2],[23,2]],'#9c835e',4);}else if(e.structure==='house'||e.structure==='workshop'){building(e.structure);if(e.structure==='workshop'){rect(-25,-12,12,15,'#8e7150');line([[-26,-15],[-10,-15]],steel,4);}}else if(['stonewall','stockade','palisade'].includes(e.structure)){if(e.structure==='stonewall'){rect(-28,-28,56,42,'#858d85');for(const y of [-22,-10,2])line([[-27,y],[27,y]],'#59685e',2);for(const x of [-21,-3,15]){line([[x,-27],[x,-12]],'#59685e',2);line([[x+9,-10],[x+9,3]],'#59685e',2);}for(const x of [-28,-7,14])rect(x,-35,14,10,'#9ea79b');}else{for(const x of [-24,-12,0,12,24]){rect(x-4,-28,8,42,'#977752');poly([[x-4,-28],[x,-40],[x+4,-28]],'#b49465');}line([[-27,-16],[27,-16]],'#675c40',4);line([[-27,3],[27,3]],'#675c40',4);}}else if(e.structure==='pillar'){rect(-13,-44,26,58,'#9ca49a');rect(-18,-48,36,8,'#bac0ad');rect(-18,10,36,8,'#8a9488');for(const x of [-7,0,7])line([[x,-39],[x,6]],'#747f75',1);}else if(e.icon==='🪨'){poly([[-20,7],[-18,-12],[-3,-24],[14,-17],[24,4]],'#849183');poly([[-18,-12],[-3,-24],[3,-4],[-20,7]],'#a0ad9b');line([[3,-4],[14,-17]],'#647466');}else wildProp();}else if(type==='node'){if(e.tribute||e.icon==='🪙'){rect(-22,-10,44,22,'#765536');poly([[-22,-10],[-16,-23],[16,-23],[22,-10]],'#8e6742');line([[0,-22],[0,11]],gold,3);rect(-5,-8,10,8,gold);for(const [x,y]of [[-14,5],[11,4],[0,-15]])glint(x,y,'#f0d88a',1.6);}else if(e.icon==='🪵'){for(const [x,y]of [[-12,2],[2,-3],[10,7]]){rect(x-12,y-8,24,10,'#836244');oval(x+12,y-3,4,5,'#c9a572');oval(x+12,y-3,2,3,'#916b44');}}else if(e.icon==='🧺'){poly([[-19,-3],[19,-3],[13,14],[-13,14]],'#aa885e');line([[-13,-3],[-8,-17],[8,-17],[13,-3]],'#bca06d',3);for(const y of [1,5,9])line([[-14,y],[14,y]],'#795f42',1);}else if(e.icon==='💎'){for(const [x,y]of [[-10,2],[0,-7],[10,4]])poly([[x-6,y],[x-5,y-20],[x,y-28],[x+6,y-18],[x+6,y]],'#a89bcf');line([[0,-32],[0,-7]],'#e5ddf6',1);}else{poly([[-18,8],[-13,-12],[0,-23],[18,-9],[22,8]],'#7d8781');for(const [x,y]of [[-7,-8],[7,-12],[12,1]])poly([[x-4,y],[x,y-5],[x+5,y],[x,y+4]],'#c1a16b');}}
 else if(type==='building'||['rest','supplier','recruiter','quests'].includes(e.kind))building(type==='building'?'barracks':e.kind);
 else if(e.kind==='cage'){rect(-20,-35,40,49,'#746c58');rect(-17,-31,34,41,'#23302b');if(!rescued)specialist({...e,kind:['archive'].includes(e.family)?'alchemist':['thorn','mire','ridge','warlord','citadel'].includes(e.family)?'teacher':'smith'});for(const x of [-16,-8,0,8,16])line([[x,-32],[x,12]],'#b3afa0',3);line([[-20,-17],[20,-17]],'#b3afa0');if(rescued){poly([[18,-32],[32,-26],[32,16],[18,12]],'#84887a');}else rect(-3,-8,7,8,gold);}
 else if(e.kind==='dungeon'&&e.treasury)treasuryEntrance(e.treasuryBoss);else if(e.kind==='dungeon'||e.kind==='exit')gate(e.family);
 else if(e.kind==='transport'){if(e.icon==='🐉'||/Dragon/.test(e.name)) {dragon('#8f9470');rect(-9,-23,18,10,'#997148');}else if(e.icon==='⛵'){poly([[-39,0],[37,0],[22,17],[-24,17]],'#9a7954');line([[-31,5],[30,5]],'#c1a776');line([[0,-48],[0,2]],'#c2ab7c',3);poly([[3,-46],[3,-8],[31,-8]],'#e2d6b1');}else if(e.icon==='🐫'){oval(0,-3,27,15,'#a28d66');oval(-7,-14,10,10,'#ac9770');for(const x of [-17,13])line([[x,4],[x,25]],'#9c835e',5);line([[22,-5],[27,-33]],'#b39b6d',9);oval(32,-34,11,6,'#b39b6d');rect(-14,-25,25,13,'#876e52');rect(-24,-12,12,20,'#9d7155');}else{rect(-27,-13,54,23,'#a4845c');for(const x of [-17,17]){oval(x,12,8,8,'#4f564e');line([[x-5,12],[x+5,12]],'#b4a57d');}poly([[-30,-15],[-18,-37],[18,-37],[30,-15]],'#c9bc93');line([[-19,-35],[19,-35]],'#e1d3ab');}}
 else if(e.kind==='bundle'){rect(-15,-15,30,28,'#a78455');line([[-15,-15],[15,13]],'#d0b079',3);line([[15,-15],[-15,13]],'#d0b079',3);}
 else if(e.kind==='fountain'){oval(0,5,25,10,'#9aa7a5');oval(0,2,20,6,'#65999f');rect(-5,-24,10,26,'#adb6a9');oval(0,-23,13,5,'#bad1bd');line([[0,-38],[0,-24]],'#9ad7d4',3);}
 else if(e.kind==='mini'){rect(-24,-22,48,36,'#7e897f');rect(-12,-16,24,30,'#24372d');for(const x of [-24,12])rect(x,-37,12,50,'#9aa38e');rect(-29,-43,22,8,'#b4b99e');rect(7,-43,22,8,'#b4b99e');}else if(e.kind==='landmark'){landmark();}
 else if(type==='npc'){if(e.family&&['teacher','smith','alchemist'].includes(e.kind))specialist(e);else{const smith=['smith','alchemist'].includes(e.kind);humanoid(smith?'#8b7770':'#8b9c7b');if(smith&&e.kind==='smith'){rect(-8,-15,16,19,'#675448');line([[18,-20],[12,13]],'#b29367',3);rect(13,-24,15,7,steel);poly([[19,9],[38,9],[32,16],[22,16]],steel);}else if(e.kind==='alchemist'){rect(12,-16,8,4,'#bed3cb');oval(16,-6,7,9,'#789ba1');rect(-8,-37,16,5,'#c9d6ab');}else{line([[17,-31],[17,13]],'#baa373',3);oval(17,-33,4,4,'#c9d6ab');rect(-14,-10,8,14,'#cab483');}}}
 else if(type==='hero')hero(e.class||'paladin');
 else if(type==='ally'){const role=allyBodyKind(e);if(role==='goblin-archer')goblinArcher();else human(role);}
 else if(e.type==='boss'){
 shade(e.form==='true'?42:34,e.form==='true'?13:10,e.form==='true'?.42:.32);const bossScale=(e.family==='darklord'||e.family==='cindermaw'||e.family==='mine'||e.family==='abyss'?1.36:1.3)*(e.form==='true'?1.14:1);ctx.scale(bossScale,bossScale);
 switch(e.family){
 case 'thorn':wolf('#a08864',true);break;
 case 'mire':crocodile('#6e8060');poly([[-18,-12],[-12,-29],[-5,-16],[2,-31],[10,-11]],'#b3a47c');line([[29,-8],[34,-4]],'#d7c69e',2);break;
 case 'abyss':dragon();break;
 case 'crypt':humanoid('#625f67',bone,1.15);skull(0,-30,10);poly([[-11,-19],[-20,-24],[-23,2],[-11,4]],'#74677b');shield(-18,-2,'#7b756a');line([[20,-31],[20,17]],'#a4916c',3);poly([[19,-32],[35,-36],[27,-23],[20,-22]],bone);break;
 case 'archive':humanoid('#557c7c','#9bb4a8',1.15);poly([[-12,-22],[0,-47],[13,-23]],'#4e6e75');line([[23,-29],[23,19]],steel,3);line([[14,10],[16,18],[23,23],[31,18],[33,10]],steel,4);oval(23,-29,4,4,gold);break;
 case 'ridge':humanoid('#9a775c','#adad80',1.6);poly([[-10,-35],[-16,-43],[-4,-38]],bone);poly([[10,-35],[16,-43],[4,-38]],bone);line([[29,-27],[22,18]],'#ad8f65',4);rect(17,-35,23,14,'#8f9894');rect(-13,-14,26,7,'#696b61');break;
 case 'mine':rect(-18,0,14,20,'#77847f');rect(5,0,14,20,'#77847f');poly([[-22,5],[-25,-24],[-12,-35],[15,-34],[24,-19],[20,6]],'#929b8c');rect(-11,-50,23,21,'#a3ae9e');rect(-8,-41,5,3,'#e0c785');rect(5,-41,5,3,'#e0c785');poly([[-7,-19],[0,-27],[9,-19],[0,-7]],'#edc282');poly([[-25,-22],[-39,-15],[-36,9],[-24,7]],'#7b8a82');poly([[24,-22],[38,-14],[37,9],[25,7]],'#7b8a82');line([[-15,-29],[-5,-21],[-13,-5]],'#596d67');break;
 case 'warlord':humanoid('#7c5450','#859464',1.35);poly([[-13,-24],[-15,-39],[0,-47],[15,-38],[13,-24]],steel);poly([[-13,-37],[-23,-45],[-19,-32]],bone);poly([[13,-37],[23,-45],[19,-32]],bone);rect(-10,-18,20,17,'#665c59');line([[28,-29],[22,20]],'#95764e',4);poly([[26,-30],[40,-39],[43,-17],[25,-19]],steel);poly([[-13,-18],[-25,18],[-9,12]],'#a1614e');break;
 case 'cindermaw':oval(0,-2,27,14,'#9a6657');for(const side of [-1,1]){for(const y of [-8,0,8])line([[side*15,y],[side*35,y+5],[side*43,y+13]],'#a87b63',3);line([[side*18,-5],[side*31,-24]],'#bd8d6f',5);poly([[side*29,-27],[side*43,-34],[side*43,-19],[side*31,-17]],'#bd8d6f');}line([[0,9],[-9,27],[-25,17],[-31,-5],[-22,-22]],'#b78567',7);poly([[-25,-25],[-15,-37],[-16,-18]],bone);poly([[10,-14],[17,-29],[23,-13]],'#6f5260');break;
 case 'citadel':humanoid('#697c82',steel,1.45);rect(-12,-50,24,25,'#8a9c9e');poly([[-16,-49],[-16,-57],[-7,-52],[0,-58],[7,-52],[16,-57],[16,-49]],gold);rect(-8,-39,16,3,'#f1c580');shield(-24,-1,'#526970');line([[29,-42],[29,22]],'#ac976d',4);poly([[21,-39],[35,-42],[39,-27],[20,-25]],steel);poly([[-7,-16],[0,-23],[7,-16],[0,-8]],'#e8ae70');break;
 case 'darklord':poly([[-23,17],[-16,-27],[0,-41],[16,-27],[26,17]],'#423c55');humanoid('#594c65','#aaa8a7',1.15);poly([[-11,-26],[-9,-41],[0,-48],[10,-40],[11,-26]],'#596274');poly([[-13,-42],[-18,-55],[-6,-48],[0,-57],[6,-48],[18,-55],[13,-42]],gold);rect(-6,-32,4,2,'#d8a896');rect(3,-32,4,2,'#d8a896');sword(21,-17);shield(-22,-1,'#725965');break;
 default:humanoid('#897773');
 }
 bossFinish(e.family);bossPolish(e.family);
 }else{
 if(e.captain||e.roomCaptain){const s=e.visualScale||1.18;ctx.scale(s,s);}
 switch(e.species){
 case 'skeleton':skull();line([[0,-18],[0,5]],bone,3);for(const y of [-14,-9,-4])line([[-8,y],[0,y+2],[8,y]],bone,2);line([[-7,-15],[-14,-2],[-16,6]],bone,3);line([[7,-15],[14,-4],[17,3]],bone,3);line([[0,3],[-7,9],[-8,16]],bone,3);line([[0,3],[7,9],[8,16]],bone,3);if(e.ranged)bow(17,-7);else sword(15,-9);break;
 case 'wolf':wolf();break;
 case 'mireling':if(e.ranged){crocodile('#687a61');line([[-20,-8],[13,7]],'#8d7352',3);rect(-4,-4,10,9,'#745d45');poly([[18,-10],[28,-13],[34,-7],[27,-3]],'#9a8660');}else crocodile();break;
 case 'reedbeast':oval(0,-2,19,16,'#8d9c65');oval(-11,-16,8,7,'#a5b17a');oval(11,-16,8,7,'#a5b17a');eye(-12,-18);eye(10,-18);oval(-19,9,11,6,'#738857');oval(19,9,11,6,'#738857');line([[-11,-1],[10,-1]],ink,1);break;
 case 'ashbeast':{const ranged=e.ranged,body=ranged?'#8f655f':'#aa7c62',leg=ranged?'#9d7569':'#b18b6b',claw=ranged?'#b78d80':'#c0a080',tail=ranged?'#aa7a69':'#bd936b';oval(0,0,20,10,body);for(const side of [-1,1]){for(const y of [-4,2,8])line([[side*12,y],[side*28,y+4],[side*33,y+10]],leg,2);line([[side*15,-4],[side*24,-17]],claw,4);poly([[side*23,-19],[side*34,-25],[side*34,-15],[side*25,-13]],claw);}line([[0,7],[-7,20],[-19,12],[-23,-3],[-17,-15]],tail,5);poly([[-20,-17],[-12,-25],[-13,-13]],bone);if(ranged){poly([[-13,-9],[-5,-18],[3,-13],[10,-19],[17,-8],[8,-3],[-8,-3]],'#665166');oval(8,-10,5,4,'#a95f4d');oval(-5,-9,4,3,'#ba6d50');glint(8,-11,'#f0a36d',1.5);}}break;
 case 'goblin':humanoid('#89745a','#9ba574',.8);poly([[-6,-29],[-18,-36],[-12,-24]],'#9ba574');poly([[6,-29],[18,-36],[12,-24]],'#9ba574');poly([[-3,-27],[0,-21],[5,-25]],'#bdba8c');if(e.ranged){line([[13,-5],[23,-21],[19,-32]],'#c0b386',2);oval(20,-29,4,4,'#8d978f');rect(-18,-7,10,12,'#775d43');}else sword(12,-3);break;
 case 'ogre':if(e.ranged){humanoid('#777469','#b2a684',1.5);rect(-12,-3,24,7,'#80664d');poly([[-17,-18],[-25,-12],[-21,3],[-11,-4]],'#6f655d');line([[-18,-8],[13,3]],'#a08461',4);rect(-27,-2,14,17,'#705946');for(const [x,y,r]of [[-22,-6,5],[-17,1,4],[-24,7,4]])oval(x,y,r,r*.7,'#85867f');line([[18,-29],[30,-11]],'#b69a70',2);poly([[27,-13],[34,-17],[36,-10],[29,-7]],'#81796d');}else{humanoid('#8d7a5f','#b2a684',1.5);rect(-12,-3,24,7,'#6b5841');line([[25,-22],[20,14]],'#96744e',6);oval(27,-25,8,15,'#816647');}poly([[-4,-23],[-5,-17],[-1,-21]],bone);poly([[4,-23],[5,-17],[1,-21]],bone);break;
 case 'archer':human('archer');break;
 case 'orc':if(e.ranged){humanoid('#765e4f','#89936c',1.15);poly([[-10,-14],[-16,-22],[-4,-18]],'#7b6a5d');poly([[9,-14],[14,-20],[4,-18]],'#8a7463');line([[-11,-15],[10,-1]],'#b07855',4);rect(-17,-5,8,11,'#704b3e');line([[16,-28],[25,-8]],'#79573f',3);poly([[19,-29],[30,-34],[27,-23]],steel);line([[11,-20],[19,-1]],'#79573f',3);poly([[14,-22],[25,-27],[22,-16]],steel);}else{humanoid('#846e56','#89936c',1.15);poly([[-10,-14],[-15,-22],[-3,-18]],steel);poly([[10,-14],[15,-22],[3,-18]],steel);sword(17,-6);}break;
 case 'crownguard':{
  const cloth=e.guard?'#51495d':'#62566e',metal=e.guard?'#aab2b5':'#939fa7';humanoid(cloth,metal,1.03);
  poly([[-12,-32],[-9,-42],[0,-47],[10,-41],[13,-31],[7,-35],[-7,-35]],'#6d5260');fillPoly([[-12,-32],[-9,-42],[0,-47],[0,-32]],'#2f2938',.28);line([[-7,-29],[7,-29]],'#d2b77b',2);
  rect(-8,-17,16,15,metal);fillPoly([[-8,-17],[0,-17],[0,-2],[-8,-2]],'#2e3440',.18);
  if(e.ranged){bow(17,-7);line([[-15,-29],[-19,5]],'#7b604f',5);for(const y of [-29,-23,-17])line([[-20,y],[-13,y-5]],'#e5d4ad',1);poly([[-11,-14],[-18,8],[-6,6]],'#4d4259');}
  else{shield(-17,-1,'#7e4f56');sword(16,-6);}
  if(e.guard){poly([[-13,-19],[-22,-18],[-18,-10],[-10,-11]],'#858e91');poly([[13,-19],[22,-18],[18,-10],[10,-11]],'#858e91');line([[-8,-24],[8,-24]],'#e0c989',2);}
 }break;
 case 'wraith':case 'stalker':case 'summon':poly([[-16,12],[-10,-24],[0,-40],[11,-25],[17,12],[8,7],[0,14],[-7,7]],e.species==='stalker'?'#877179':'#87a9a6');oval(0,-23,6,8,'#354c50');eye(-4,-25);eye(2,-25);if(e.species==='wraith'){line([[12,-10],[22,-5]],'#a6bbae');rect(18,-4,9,12,'#6b7769');rect(20,-2,5,7,'#dfc980');}break;
 default:humanoid('#919b81');
 }
  enemyFinish();captainFinish();
 }
 if(e.hybrid&&e.species==='reedbeast'){oval(0,0,6,3,'#628975');line([[2,1],[15,5]],'#c1a18e',2);}if(e.rangedAim){oval(0,-56,5,5,'#ead6a0');}
 if(e.form==='true'){ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=e.type==='boss'?'#fff0a6':'#e5c876';ctx.lineWidth=e.type==='boss'?3:2;for(const r of e.type==='boss'?[30,40,50]:[23,30]){ctx.beginPath();ctx.ellipse(0,11,r,r*.28,0,0,Math.PI*2);ctx.stroke();}if(e.type==='boss'){ctx.globalAlpha=.18;ctx.fillStyle='#f1c75e';ctx.beginPath();ctx.ellipse(0,-11,34,52,0,0,Math.PI*2);ctx.fill();}ctx.restore();line([[-19,18],[-8,23],[9,23],[21,17]],'#e2c36f',e.type==='boss'?3:2);for(const x of [-17,17])poly([[x,-36],[x*1.45,-54],[x*.48,-42]],'#e1bd6d');for(const x of [-11,0,11])glint(x,-47,'#ffe7a8',e.type==='boss'?2.4:1.3);if(e.type==='boss'){poly([[-22,-52],[-14,-66],[-7,-56],[0,-70],[7,-56],[14,-66],[22,-52]],'#d7ad42');for(const x of [-26,26])glint(x,-28,'#fff4bd',2.8);}}
 else if(e.form==='ringleader'){const military=['orc','archer','crownguard'].includes(e.species);if(military)militaryRingleaderFinish();else{rect(-4,-47,8,8,gold);poly([[-12,-40],[-15,-49],[-5,-45],[0,-53],[5,-45],[15,-49],[12,-40]],gold);for(const x of [-16,16])line([[x,-12],[x*1.2,-24]],'#d5b36e',2);glint(0,-51,'#fff0b7',1.5);}if(e.frenzy){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#ef8c63';ctx.lineWidth=2.5;for(const r of [25,32]){ctx.beginPath();ctx.ellipse(0,10,r,r*.27,0,0,Math.PI*2);ctx.stroke();}ctx.restore();for(const x of [-19,19])glint(x,-21,'#ff9f6b',2);}}
 if(type==='hero'||type==='ally'||type==='enemy'){line([[-8,13],[0,15],[8,13]],type==='enemy'?'#d2aa87':'#c9d6ad',1.2);if(type==='hero')oval(0,-47,2,2,'#f6dfa0');}
 ctx.restore();
}
function height(e){if(e.type==='boss')return 102;if(e.captain||e.roomCaptain)return 68;if(e.renderKind==='building'&&e.kind==='barracks')return 88;if(e.renderKind==='prop'&&['crown-levy-yard','crown-command-post','ashbeast-roost-scene','crown-logistics-bay','crown-fortress-checkpoint'].includes(e.structure))return 76;if(e.renderKind==='hero'&&e.class==='mage'||e.renderKind==='prop')return 64;if(['dungeon','exit','transport'].includes(e.kind))return 64;return 54;}
const floorPalettes=[['#294b36','#31583e','#203e30','#95ad80'],['#26444b','#31535a','#203b42','#85ada6'],['#485447','#56614d','#3b493f','#b1b59a'],['#50413b','#5d4b42','#423732','#b9987b'],['#343644','#414351','#2c2f3c','#a09b9e']];
const dungeonFloors={crypt:['#343c39','#414945','#2b3331','#a9b1a0'],archive:['#30464a','#3b5558','#283d42','#8fb6b4'],mine:['#44433b','#524f43','#39382f','#ada88c'],abyss:['#44373b','#544349','#382f34','#c09a89'],citadel:['#3b414b','#494f59','#303640','#abb3b5']};
const treasuryFloors={
 'supply-vale':['#514735','#5e523c','#433b2e','#bca978'],
 'supply-march':['#3f5149','#4b6258','#33443f','#9fb69c'],
 'supply-highlands':['#55534b','#636056','#46443e','#b9ae91'],
 'supply-crown':['#44404b','#514b59','#37343e','#aa96b0']
};
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
 const colors=room?(treasuryFloors[dungeonId]||['#403d35','#4d493e','#343229','#b6a98a']):dungeonFloors[dungeonId]||floorPalettes[region];
 const tileX=Math.floor(x/80),tileY=Math.floor(y/80),seed=(Math.imul(tileX+19,73856093)^Math.imul(tileY+37,19349663))>>>0;
 const color=blocked?'#737c70':seed%7===0?colors[1]:seed%11===0?colors[2]:colors[0];
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.lineTo(p.x,p.y+43.2);ctx.lineTo(p.x-60.8,p.y+21.6);ctx.closePath();ctx.fill();
 // Painterly tile plane: a faint warm/cool face break gives the isometric ground volume without obvious grid noise.
 ctx.save();ctx.globalAlpha=blocked?.055:.035;ctx.fillStyle=colors[3]||'#d8d2aa';ctx.beginPath();ctx.moveTo(p.x,p.y+1);ctx.lineTo(p.x+58,p.y+21.6);ctx.lineTo(p.x,p.y+25);ctx.lineTo(p.x-58,p.y+21.6);ctx.closePath();ctx.fill();ctx.restore();
 ctx.strokeStyle='#f0ead01a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-60.8,p.y+21.6);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.stroke();
 ctx.strokeStyle='#08161145';ctx.beginPath();ctx.moveTo(p.x-60.8,p.y+21.6);ctx.lineTo(p.x,p.y+43.2);ctx.lineTo(p.x+60.8,p.y+21.6);ctx.stroke();
 if(blocked&&seed%4===0){ctx.strokeStyle='#303a3566';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-14,p.y+18);ctx.lineTo(p.x-4,p.y+14);ctx.lineTo(p.x+5,p.y+19);ctx.lineTo(p.x+14,p.y+15);ctx.stroke();}
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
 const landformPalettes={
  meadow:['#557144','#78905b'], 'orchard-slope':['#5b7348','#8a9a60'], 'wooded-rise':['#425f42','#6f8456'], 'river-bank':['#5a7352','#87936f'],
  'wet-basin':['#365f62','#6f8b7e'], mudflat:['#596353','#87866a'], 'reed-islands':['#46675a','#7d9272'], 'shore-shelf':['#4c6964','#82958a'],
  'high-terrace':['#596054','#858779'], 'middle-terrace':['#4f584e','#787f70'], 'quarry-shelf':['#68675c','#989284'], 'pine-basin':['#44554b','#6e7863'],
  'burn-scar':['#684d42','#926b55'], 'ravine-shelf':['#554944','#776159'], 'ash-lowland':['#5c5048','#857064'], 'war-road':['#60504a','#8b7468'],
  'ash-plateau':['#494957','#6d6977'], 'obsidian-shelf':['#3d3e49','#5d5968'], 'crystal-field':['#49485b','#756b87'], 'fortress-apron':['#454650','#696672']
 };
 const drawLandform=(f)=>{
  const colors=landformPalettes[f.kind]||['#555','#777'],pts=f.shape==='ellipse'?Array.from({length:40},(_,n)=>{const a=n*Math.PI/20;return{x:f.x+Math.cos(a)*f.rx,y:f.y+Math.sin(a)*f.ry};}):f.shape==='rect'?[{x:f.x1,y:f.y1},{x:f.x2,y:f.y1},{x:f.x2,y:f.y2},{x:f.x1,y:f.y2}]:(f.points||[]).map(([x,y])=>({x,y}));
  if(pts.length<3)return;
  const elevated=/terrace|shelf|plateau|rise|apron|quarry/.test(f.kind),cx=f.x??pts.reduce((a,p)=>a+p.x,0)/pts.length,cy=f.y??pts.reduce((a,p)=>a+p.y,0)/pts.length;
  const inset=(amount)=>pts.map(q=>({x:q.x+(cx-q.x)*amount,y:q.y+(cy-q.y)*amount}));
  ctx.save();
  // Landforms are terrain texture, not painted polygons. Feather the tint inward so boundaries disappear into the base tiles.
  ctx.globalAlpha=elevated?.07:.045;polygon(pts,colors[0]);
  ctx.globalAlpha=elevated?.05:.035;polygon(inset(.06),colors[0]);
  ctx.globalAlpha=elevated?.03:.025;polygon(inset(.14),colors[1]);
  // Only raised geography keeps a restrained contour cue; flat basins/meadows/mudflats have no hard outline at all.
  if(elevated){
   ctx.globalAlpha=.14;for(let j=0;j<pts.length;j+=Math.max(2,Math.floor(pts.length/6))){const a=pts[j],b=pts[(j+1)%pts.length];line(a,b,colors[1],.9);}
   ctx.globalAlpha=.11;for(let j=0;j<pts.length;j+=2){const a=pts[j],b=pts[(j+1)%pts.length];line({x:a.x,y:a.y+12},{x:b.x,y:b.y+12},'#202522',1.25);}
  }
  ctx.restore();
 };
 // Large-scale landforms guide authored placement only; visible geography comes from terrain, vegetation, roads and structures.
 rect(x1,x2,y1,y2,palette[0]);
 rect(x1+8,x2-8,y1+8,y2-8,palette[1]);
 for(const x of [x1,x2]){line({x:x+(x===x1?-10:10),y:y1},{x:x+(x===x1?-10:10),y:y2},'#16231c99',4);line({x,y:y1},{x,y:y2},palette[2],2);}
 const t=(typeof performance!=='undefined'?performance.now():0)/1000;
 for(let y=y1+30;y<y2-20;y+=70){const inset=Math.min(22,(x2-x1)/4),wave=kind==='ravine'?0:Math.sin(t*1.35+y*.027)*5;line({x:x1+inset,y:y+wave},{x:x2-inset,y:y+12+wave},palette[2],kind==='ravine'?1:2);if(kind==='water')line({x:x1+inset+8,y:y+16-wave*.25},{x:x1+inset+24,y:y+19-wave*.25},'#c5ebe066',1);else if(kind==='lava')line({x:x1+inset+3,y:y+17+wave*.2},{x:x2-inset-5,y:y+22+wave*.2},'#ffc07877',1);}
 // Authored arrival harbors make ferry travel physically continuous between regions.
 const harbor=R.harbors?.[['vale','march','highlands','frontier','crown'][region]];
 if(harbor){
  const w=harbor.water,d=harbor.dock,waterBase=region===1?'#315f67':'#426e79',waterInner=region===1?'#3f7a7c':'#527f8c',shore=region===1?'#6e806b':'#7c8177';
  rect(w.x1-10,w.x2+10,w.y1-10,w.y2+10,shore);rect(w.x1,w.x2,w.y1,w.y2,waterBase);rect(w.x1+10,w.x2-10,w.y1+10,w.y2-10,waterInner);
  for(let y=w.y1+35;y<w.y2-20;y+=55){const wave=Math.sin(t*1.4+y*.025)*5;line({x:w.x1+24,y:y+wave},{x:w.x2-28,y:y+8+wave},region===1?'#9ed0c788':'#b6d4d188',1.4);}
  // Dock deck is world-space so collision and artwork agree about where the hero can walk over water.
  rect(d.x1,d.x2,d.y1,d.y2,'#6a5139');rect(d.x1+4,d.x2-4,d.y1+4,d.y2-4,region===1?'#a1855c':'#968265');
  const horizontal=(d.x2-d.x1)>=(d.y2-d.y1),step=horizontal?24:22;
  if(horizontal)for(let x=d.x1+10;x<d.x2-6;x+=step)line({x,y:d.y1+4},{x,y:d.y2-4},'#6f563d',1);
  else for(let y=d.y1+10;y<d.y2-6;y+=step)line({x:d.x1+4,y},{x:d.x2-4,y},'#6f563d',1);
  line({x:d.x1,y:d.y1},{x:d.x2,y:d.y1},'#d0b17a',2);line({x:d.x1,y:d.y2},{x:d.x2,y:d.y2},'#5a4534',2);
  for(const q of [{x:d.x1+10,y:d.y1+10},{x:d.x1+10,y:d.y2-10},{x:d.x2-10,y:d.y1+10},{x:d.x2-10,y:d.y2-10}]){const p=screen(q);ctx.strokeStyle='#5d4735';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y+7);ctx.lineTo(p.x,p.y-12);ctx.stroke();ctx.fillStyle='#a17b55';ctx.beginPath();ctx.arc(p.x,p.y-12,2.5,0,Math.PI*2);ctx.fill();}
 }
 // Other authored ponds and walls also use exact shapes, independent of props.
 for(const p of R.terrain[region]){
  const feature=p.kind||'cliff';
  if(p.r){
   const points=[],inner=[];for(let n=0;n<48;n++){const a=n*Math.PI/24;points.push({x:p.x+Math.cos(a)*p.r,y:p.y+Math.sin(a)*p.r});inner.push({x:p.x+Math.cos(a)*(p.r-8),y:p.y+Math.sin(a)*(p.r-8)});}
   const circular=feature==='water'?['#8fa79766','#397f92','#a1c8bf99']:feature==='obsidian'?['#46434f','#302f39','#8c7e99']:['#70685f','#514b46','#9e9488'];
   polygon(points,circular[0]);polygon(inner,circular[1]);
   if(feature==='water')for(const dy of [-p.r*.25,p.r*.25])line({x:p.x-p.r*.35,y:p.y+dy},{x:p.x+p.r*.25,y:p.y+dy+8},circular[2],1.5);
   else for(let a=0;a<Math.PI*2;a+=Math.PI/3)line({x:p.x+Math.cos(a)*p.r*.25,y:p.y+Math.sin(a)*p.r*.25},{x:p.x+Math.cos(a)*p.r*.7,y:p.y+Math.sin(a)*p.r*.7},circular[2],1.2);
  } else {
   const colors=feature==='lava'?['#723d31','#d06c3c','#f0ae68']:feature==='ravine'?['#292b2d','#42464a','#85827a']:['#5d625b','#777c73','#aaa795'];
   let start=p.y1;for(const [lo,hi]of p.gaps||[]){rect(p.x1,p.x2,start,lo,colors[0]);rect(p.x1+8,p.x2-8,start+8,lo-8,colors[1]);start=hi;}rect(p.x1,p.x2,start,p.y2,colors[0]);if(p.y2-start>16)rect(p.x1+8,p.x2-8,start+8,p.y2-8,colors[1]);
   for(const x of [p.x1,p.x2])line({x,y:p.y1},{x,y:p.y2},colors[2],1.5);
   if(feature==='lava')for(let y=p.y1+35;y<p.y2-20;y+=90)line({x:p.x1+18,y},{x:p.x2-18,y:y+10},'#ffc07877',1.2);
  }
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
 const strip=R.barriers[region].bounds,palettes=[
  {shoulder:'#564834',base:'#8e7758',inner:'#a18b68',seam:'#6f604c'},
  {shoulder:'#4b5043',base:'#83775e',inner:'#9c8e70',seam:'#6b6b58'},
  {shoulder:'#4e4d46',base:'#87857a',inner:'#aaa695',seam:'#6e6d66'},
  {shoulder:'#51443e',base:'#7c6c61',inner:'#978678',seam:'#625750'},
  {shoulder:'#3f3d45',base:'#66636e',inner:'#87818e',seam:'#55525d'}
 ],road=palettes[region]||palettes[0];
 const bridge=p=>p.x>=strip[0]-12&&p.x<=strip[1]+12&&p.y>=strip[2]&&p.y<=strip[3];
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((q,j)=>{const p=screen(q);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
 const segment=(a,b,w,color)=>{const d=Math.hypot(b.x-a.x,b.y-a.y);if(!d)return;const dx=-(b.y-a.y)/d*w,dy=(b.x-a.x)/d*w;polygon([{x:a.x+dx,y:a.y+dy},{x:b.x+dx,y:b.y+dy},{x:b.x-dx,y:b.y-dy},{x:a.x-dx,y:a.y-dy}],color);};
 const stroke=(a,b,color,width=1)=>{a=screen(a);b=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const edges=[],seen=new Set();for(const path of paths)for(let j=1;j<path.length;j++){const a=path[j-1],b=path[j],key=[a.x,a.y,b.x,b.y].join(':');if(seen.has(key))continue;seen.add(key);edges.push([a,b]);}
 ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
 // Shared shoulders and pavement form junctions before individual slab seams.
 for(const [a,b]of edges)segment(a,b,35,road.shoulder);
 for(const path of paths)for(const q of path)polygon([{x:q.x-35,y:q.y-35},{x:q.x+35,y:q.y-35},{x:q.x+35,y:q.y+35},{x:q.x-35,y:q.y+35}],road.shoulder);
 for(const [a,b]of edges)segment(a,b,29,road.base);
 for(const path of paths)for(const q of path)polygon([{x:q.x-29,y:q.y-29},{x:q.x+29,y:q.y-29},{x:q.x+29,y:q.y+29},{x:q.x-29,y:q.y+29}],road.base);
 for(const [a,b]of edges)segment(a,b,23,road.inner);
 const seams=new Set();for(const [a,b]of edges){const length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)continue;const ux=(b.x-a.x)/length,uy=(b.y-a.y)/length,nx=-uy,ny=ux,steps=Math.max(1,Math.ceil(length/22));
 for(let j=0;j<steps;j++){const p={x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},q={x:a.x+(b.x-a.x)*(j+1)/steps,y:a.y+(b.y-a.y)*(j+1)/steps},mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2};if(bridge(mid)){segment(p,q,28,'#b49468');for(const side of [-1,1])stroke({x:p.x+nx*side*31,y:p.y+ny*side*31},{x:q.x+nx*side*31,y:q.y+ny*side*31},'#d1b887',2);}}
 const anchor=a.x*ux+a.y*uy,first=Math.ceil(anchor/44)*44-anchor;for(let t=first;t<length;t+=44){const p={x:a.x+ux*t,y:a.y+uy*t},key=Math.round(p.x)+':'+Math.round(p.y);if(seams.has(key))continue;seams.add(key);const wood=bridge(p);stroke({x:p.x+nx*26,y:p.y+ny*26},{x:p.x-nx*26,y:p.y-ny*26},wood?'#624b34':road.seam,1);if(!wood){const q={x:a.x+ux*Math.min(length,t+44),y:a.y+uy*Math.min(length,t+44)};stroke(p,q,road.seam,.8);}}
 }

 ctx.restore();
}
function atmosphere(ctx,canvas,region=0,opts={}){
 const night=!!opts.night,peace=!!opts.peace,dungeon=!!opts.dungeon,room=!!opts.room,hero=opts.hero||null,lights=opts.lights||[],time=(typeof performance!=='undefined'?performance.now():0)/1000;
 ctx.save();
 // Regional color grade: gentle enough to preserve combat readability, strong enough to make each zone feel authored.
 const dayTints=['rgba(213,229,163,.045)','rgba(150,206,205,.05)','rgba(221,219,184,.045)','rgba(215,157,120,.05)','rgba(166,146,196,.05)'];
 const nightTints=['rgba(8,18,38,.64)','rgba(8,28,40,.61)','rgba(15,22,38,.62)','rgba(26,14,30,.62)','rgba(20,12,36,.66)'];
 if(night){
  const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,nightTints[region]||nightTints[0]);g.addColorStop(1,peace?'rgba(22,31,49,.36)':'rgba(3,8,20,.72)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
  // Warm pools around the hero and inhabited field structures make night readable without flattening the whole scene.
  ctx.globalCompositeOperation='screen';
  const glow=(p,r=120,a=.22,c='255,218,151')=>{if(!p)return;const q=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);q.addColorStop(0,`rgba(${c},${a})`);q.addColorStop(.35,`rgba(${c},${a*.48})`);q.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=q;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);};
  glow(hero,145,peace?.24:.2,region===4?'215,186,238':'255,221,158');for(const p of lights.slice(0,12))glow(p,88,.16,region===1?'180,226,211':region===4?'204,170,229':'255,198,125');
  ctx.globalCompositeOperation='source-over';
 }else{
  ctx.fillStyle=dayTints[region]||dayTints[0];ctx.fillRect(0,0,canvas.width,canvas.height);
  const sun=ctx.createLinearGradient(0,0,canvas.width,canvas.height);sun.addColorStop(0,'rgba(255,244,203,.07)');sun.addColorStop(.45,'rgba(255,255,255,0)');sun.addColorStop(1,region>=3?'rgba(97,56,55,.035)':'rgba(22,55,42,.025)');ctx.fillStyle=sun;ctx.fillRect(0,0,canvas.width,canvas.height);
 }
 // Atmospheric motes are screen-space and intentionally sparse: pollen, marsh mist, alpine dust, ash and Crown sparks.
 const moteColors=night?['#dcefa8','#b7e2d5','#dbe4df','#e6a170','#c7a4df']:['#eadf9e','#b8d8ca','#dedcc7','#b98569','#aa8ec0'],count=dungeon||room?8:region===3||region===4?18:14;
 ctx.globalAlpha=night?.24:.18;ctx.fillStyle=moteColors[region]||moteColors[0];
 for(let j=0;j<count;j++){const seed=(j+1)*91+region*137,x=((seed*37+time*(region>=3?10:5))%(canvas.width+80))-40,y=((seed*53+Math.sin(time*.7+j)*22+time*(region===3?5:1.5))%(canvas.height+70))-35,r=region>=3?(j%3===0?1.8:1):region===1?(j%4===0?2.5:1.2):1.15;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;
 // Soft vignette gives the miniature scene depth and focuses attention toward play space.
 const v=ctx.createRadialGradient(canvas.width*.5,canvas.height*.48,Math.min(canvas.width,canvas.height)*.18,canvas.width*.5,canvas.height*.5,Math.max(canvas.width,canvas.height)*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,night?'rgba(0,0,0,.24)':'rgba(5,15,10,.12)');ctx.fillStyle=v;ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.restore();
}
function enemyBodyKind(e){if(!e?.species)return 'unknown';const rangedClass=e.ranged&&['mireling','ogre','orc','ashbeast','crownguard'].includes(e.species);return e.species+(rangedClass?':ranged':'');}
root.PrototypeVisuals={draw,height,floor,roads,terrain,bridges,atmosphere,allyBodyKind,enemyBodyKind,barracksVisualState};
if(typeof module!=='undefined')module.exports=root.PrototypeVisuals;
})(typeof window!=='undefined'?window:globalThis);
