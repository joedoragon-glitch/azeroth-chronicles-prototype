/* Five region-specific procedural Lab bodies + small game-clock windmill rotor.
 * Pure rendering: reads lab state/time only, never writes to Campaign, routes or stock.
 * Dormant until a Canvas/Pixi composition owner explicitly integrates both layers.
 */
(function(root) {
  'use strict';
  const PALETTE = Object.freeze({
    vale: {wall:'#9d8c61',roof:'#537653',edge:'#d3b97b',base:'#6d6549',trim:'#d6d19e',detail:'#3e704d',symbol:'leaf'},
    march: {wall:'#647d79',roof:'#426661',edge:'#b5bca0',base:'#435750',trim:'#adcfc0',detail:'#749e8f',symbol:'reed'},
    highlands: {wall:'#929389',roof:'#5f666d',edge:'#c0a077',base:'#69675d',trim:'#b5bac2',detail:'#aa8758',symbol:'ore'},
    frontier: {wall:'#8a7866',roof:'#65534f',edge:'#d3aa75',base:'#5f4b45',trim:'#c2a289',detail:'#a86e4b',symbol:'ember'},
    crown: {wall:'#696276',roof:'#353748',edge:'#9b84aa',base:'#494353',trim:'#b3a5c3',detail:'#8078aa',symbol:'crescent'},
  });
  const valid = (lab,zoneId) => !!PALETTE[zoneId] &&
    lab?.kind === 'strategist-field-lab' && lab.zoneId === zoneId;
  const rotorFrame = (gameTime, speed = 2.1) =>
    Number.isFinite(gameTime) ? Math.floor(Math.max(0,gameTime)*speed) % 8 : 0;
  function shape(ctx, points, color) {
    ctx.fillStyle=color;ctx.beginPath();
    for(let i=0;i<points.length;i++){
      if(!i)ctx.moveTo(points[i][0],points[i][1]);
      else ctx.lineTo(points[i][0],points[i][1]);
    }
    ctx.closePath();ctx.fill();
  }
  function ring(ctx,x,y,r,color) {
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
  }
  function body(ctx,lab,zoneId) {
    if(!valid(lab,zoneId))return false;
    const p=PALETTE[zoneId],building=lab.progress>=4;
    ctx.save();
    ctx.fillStyle=p.base;ctx.fillRect(-37,8,74,10);
    if(!building){
      ctx.fillStyle=p.wall;
      for(const x of [-24,-2,20])ctx.fillRect(x,-24,5,31);
      shape(ctx,[[-35,-22],[0,-41],[35,-22],[35,-15],[0,-34],[-35,-15]],p.edge);
      ctx.fillStyle=p.trim;ctx.fillRect(-21,0,42,3);
      ctx.restore();return true;
    }
    // Walls and roof share a silhouette across regions, while material accents,
    // floor supports, source vessels and roof ornaments distinguish each place.
    ctx.fillStyle=p.wall;ctx.fillRect(-30,-28,60,37);
    shape(ctx,[[-37,-28],[0,-47],[38,-28],[33,-20],[0,-39],[-33,-20]],p.roof);
    ctx.strokeStyle=p.edge;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-34,-25);ctx.lineTo(0,-44);ctx.lineTo(34,-25);ctx.stroke();
    ctx.fillStyle=p.trim;ctx.fillRect(-5,-12,12,21);
    ctx.fillStyle=p.detail;ctx.fillRect(-22,-20,11,12);ctx.fillRect(13,-20,11,12);
    ctx.strokeStyle=p.edge;ctx.lineWidth=1;
    for(const x of [-18,18]){
      ctx.beginPath();ctx.moveTo(x,-20);ctx.lineTo(x,-8);ctx.stroke();
    }
    // Small visible alchemy vessels deliberately remain modest and low cost.
    ctx.fillStyle=p.base;ctx.fillRect(-28,3,57,5);
    ring(ctx,-20,-5,4,p.trim);ring(ctx,20,-5,4,p.detail);
    if(zoneId==='vale'){
      // Living timber rafters and climbing green.
      ctx.strokeStyle='#47734f';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-29,5);ctx.lineTo(-24,-32);ctx.stroke();
      ring(ctx,-25,-30,5,'#6b9c69');ring(ctx,-20,-25,4,'#7ea879');
    } else if(zoneId==='march'){
      ctx.fillStyle='#344e4b';
      for(const x of [-27,27])ctx.fillRect(x,9,5,16);
      ctx.strokeStyle='#c0c6a4';ctx.lineWidth=1.5;
      for(const x of [-30,-25,30]){ctx.beginPath();ctx.moveTo(x,8);ctx.lineTo(x-3,-3);ctx.stroke();}
    } else if(zoneId==='highlands'){
      ctx.fillStyle='#ae9c79';ctx.fillRect(-33,-3,6,18);ctx.fillRect(28,-3,6,18);
      shape(ctx,[[10,-37],[17,-46],[23,-33]],'#b6c0cd');
    } else if(zoneId==='frontier'){
      ctx.fillStyle='#4f4546';ctx.fillRect(16,-48,8,16);
      ring(ctx,20,-53,3,'#bd8054');
      ctx.fillStyle='#b38a64';ctx.fillRect(-32,0,10,6);
    } else if(zoneId==='crown'){
      ctx.strokeStyle='#b9a3d5';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-13,-35);ctx.lineTo(-7,-42);ctx.lineTo(-1,-35);ctx.stroke();
      ring(ctx,-28,-35,3,'#9085b9');
    }
    ctx.restore();return true;
  }
  function rotor(ctx,lab,zoneId,gameTime) {
    if(!valid(lab,zoneId) || lab.progress<4 || lab.windmill!==true)return false;
    const p=PALETTE[zoneId],frame=rotorFrame(gameTime);
    ctx.save();
    // Compact shaft and hub in front of the side turbine house.
    ctx.fillStyle=p.base;ctx.fillRect(33,-26,9,33);
    ctx.strokeStyle=p.trim;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(37,-22);ctx.lineTo(37,-9);ctx.stroke();
    ctx.translate(37,-27);ctx.rotate(frame*Math.PI/4);
    for(let i=0;i<4;i++){
      ctx.rotate(Math.PI/2);
      shape(ctx,[[-2,-3],[-6,-17],[0,-23],[6,-17],[2,-3]],p.trim);
      ctx.strokeStyle=p.edge;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,-5);ctx.stroke();
    }
    ring(ctx,0,0,4,p.base);ring(ctx,0,0,2,p.edge);
    ctx.restore();return true;
  }
  const api=Object.freeze({ body, rotor, rotorFrame, PALETTE });
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistFieldLabVisuals=api;
})(typeof window !== 'undefined' ? window : globalThis);
