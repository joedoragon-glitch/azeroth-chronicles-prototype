/* Cursor-first controls for a small RTS; the RPG remains on its own page. */
(() => {
    'use strict';
    const $=id=>document.getElementById(id),E=RTSEngine,canvas=$('rts-canvas'),ctx=canvas.getContext('2d'),dialog=$('rts-dialog');
    const saveKey='azeroth-rts-save-v1',speedKey='azeroth-rts-cursor-speed-v1';
    let state=E.create(),speed=325,saved=false,storageOK=true;
    try {const raw=localStorage.getItem(saveKey);const restored=E.restore(raw);if(restored){state=restored;saved=true;}const pref=Number(localStorage.getItem(speedKey));if(pref>=100&&pref<=600)speed=pref;}catch(_){storageOK=false;}
    const cursor={x:160,y:160},camera={x:0,y:60},input={x:0,y:0},keys=new Set();
    const trees=Array.from({length:70},(_,i)=>({x:35+(i*137%670),y:30+(i*97%850)})).filter(p=>!state.units.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<65)&&!state.npcs.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<45)&&!state.towns.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<90));
    let width=1,height=1,scale=1,paused=true,add=false,placing=false,pointerId=null,tap=null,lastTap=null,worker=null,lastTime=null,saveTimer=0,hudTimer=0,previousMessage='';
    function clearInput(){keys.clear();input.x=input.y=0;pointerId=null;tap=null;lastTap=null;$('rts-knob').style.transform='';}
    function save(){try{localStorage.setItem(saveKey,JSON.stringify(state));storageOK=true;}catch(_){storageOK=false;}$('rts-save-status').textContent=storageOK?'Progreso RTS guardado en este dispositivo. Las órdenes se detienen al volver a abrirlo.':'El navegador no permite guardar. La partida funciona durante esta sesión.';}
    function menu(){paused=true;clearInput();save();if(!dialog.open)dialog.showModal();}
    function resume(){dialog.close();clearInput();paused=false;lastTime=null;}
    function point(){return {x:camera.x+cursor.x/scale,y:camera.y+cursor.y/scale};}
    function pick(){if(paused||state.result)return;if(placing){if(E.build(state,point()))placing=false;}else E.select(state,point(),add);hud();}
    function command(){if(paused)return;if(placing){placing=false;state.message='Construcción cancelada.';}else E.order(state,point());hud();}
    function buildAction(){if(paused)return;if(state.selectedNPC){E.npcAction(state);hud();return;}if(state.selectedBuilding!==null){const b=state.buildings.find(b=>b.id===state.selectedBuilding);if(b?.progress>=4){E.train(state);hud();return;}}
        if(!state.units.some(u=>u.hp>0&&u.type==='worker'&&state.selected.includes(u.id))){state.message='Selecciona un trabajador para construir.';hud();return;}
        placing=!placing;state.message=placing?'Coloca el cursor en terreno libre y da dos toques a la izquierda. Ordenar cancela.':'Construcción cancelada.';hud();}
    function label(){const p=point(),u=state.units.find(u=>u.hp>0&&Math.hypot(u.x-p.x,u.y-p.y)<34),enemy=state.enemies.find(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<35),npc=state.npcs.find(n=>Math.hypot(n.x-p.x,n.y-p.y)<30),b=state.buildings.find(b=>Math.hypot(b.x-p.x,b.y-p.y)<38),n=state.nodes.find(n=>Math.hypot(n.x-p.x,n.y-p.y)<44);
        return placing?'Colocar cuartel · 50 crowns':npc?npc.name:u?`${u.type==='worker'?'👷 Trabajador':u.type==='hero'?'🛡️ Paladín':'⚔️ Soldado'} · ${Math.ceil(u.hp)} vida`:enemy?`${enemy.icon} ${enemy.type==='boss'?'Señor Demonio':enemy.type==='orc'?'Orco':enemy.type==='captain'?'Capitán esqueleto':'Goblin'} · ${Math.ceil(enemy.hp)} vida`:b?b.progress>=4?'🏗️ Cuartel · reclutar 30 crowns':'🏗️ Construyendo':n?`🌲 Recursos: ${n.amount}`:'Terreno · mover';}
    function hud(){
        $('rts-stats').textContent=`🪙 ${state.gold} crowns · ${state.units.filter(u=>u.hp>0).length}/12 tropas · ${state.selected.length} seleccionadas`;
        $('rts-objective').textContent=state.result==='victory'?'¡Victoria! Frontera recuperada.':state.result==='defeat'?'Derrota · reinicia desde el menú.':state.camp.hp>0?'1 · Reúne recursos, construye un cuartel y toma el campamento.':!state.towns[1].owned?'2 · Lleva tropas al poblado de frontera (bandera amarilla).':'3 · Derrota al jefe y destruye la fortaleza del sureste.';
        if(previousMessage!==state.message){$('rts-message').textContent=state.message;previousMessage=state.message;}
        const b=state.buildings.find(b=>b.id===state.selectedBuilding),names={recruit:'Trabajador<br><small>2 · 20 crowns</small>',heal:'Curar<br><small>2 · 20 crowns</small>',upgrade:'Mejora<br><small>2 · 60 crowns</small>',frontHeal:'Curar<br><small>2 · 20 crowns</small>',frontRecruit:'Soldado<br><small>2 · 45 crowns</small>'};
        $('rts-build').innerHTML=names[state.selectedNPC]||(b?.progress>=4?'Soldado<br><small>2 · 30 crowns</small>':'Cuartel<br><small>2 · 50 crowns</small>');
        $('rts-build').classList.toggle('armed',placing);
        for(const id of ['rts-order','rts-build','rts-all','rts-primary','rts-stop'])$(id).disabled=!!state.result;
    }
    function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.max(.65,Math.min(1.3,width/850));cursor.x=Math.max(22,Math.min(width-22,cursor.x));cursor.y=Math.max(36,Math.min(height-36,cursor.y));clampCamera();}
    function clampCamera(){camera.x=Math.max(0,Math.min(Math.max(0,E.W-width/scale),camera.x));camera.y=Math.max(0,Math.min(Math.max(0,E.H-height/scale),camera.y));}
    function screen(p){return {x:(p.x-camera.x)*scale,y:(p.y-camera.y)*scale};}
    function circle(p,r,color){const q=screen(p);ctx.beginPath();ctx.arc(q.x,q.y,r*scale,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
    function emoji(p,icon,size=22){const q=screen(p);if(q.x<-50||q.y<-50||q.x>width+50||q.y>height+50)return;ctx.font=`${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icon,q.x,q.y);}
    function health(p,size=30){const q=screen(p);ctx.fillStyle='#07161d';ctx.fillRect(q.x-size/2,q.y-22,size,4);ctx.fillStyle=p.hp/p.maxHp>.4?'#a3d580':'#ec847b';ctx.fillRect(q.x-size/2,q.y-22,size*p.hp/p.maxHp,4);}
    function draw(){
        ctx.clearRect(0,0,width,height);ctx.fillStyle='#203e39';ctx.fillRect(0,0,width,height);
        const boundary=screen({x:700,y:0});ctx.fillStyle='#343a30';ctx.fillRect(Math.max(0,boundary.x),0,width,height);
        ctx.strokeStyle='#a1b99112';ctx.lineWidth=1;
        for(let x=0;x<=E.W;x+=80){const a=screen({x,y:0});ctx.beginPath();ctx.moveTo(a.x,0);ctx.lineTo(a.x,height);ctx.stroke();}
        for(let y=0;y<=E.H;y+=80){const a=screen({x:0,y});ctx.beginPath();ctx.moveTo(0,a.y);ctx.lineTo(width,a.y);ctx.stroke();}
        ctx.strokeStyle='#8c845250';ctx.lineWidth=24*scale;ctx.beginPath();for(const [i,p]of [state.base,state.camp,state.towns[1],state.fortress].entries()){const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();
        for(const o of E.obstacles){const p=screen(o);ctx.fillStyle=o.x===755?'#355f79':'#555b55';ctx.fillRect(p.x,p.y,o.w*scale,o.h*scale);}
        for(const y of [260,585]){const p=screen({x:755,y:y-18});ctx.fillStyle='#aa9165';ctx.fillRect(p.x,p.y,70*scale,36*scale);}
        trees.forEach(p=>emoji(p,'🌲',18));
        for(const p of [{x:408,y:410},{x:1120,y:425}])emoji(p,'⛰️',32);
        for(const t of state.towns){circle(t,70,t.owned?'#62a5a026':'#ddb86a1c');emoji(t,t.owned?'🏘️':'🏚️',32);emoji({x:t.x,y:t.y-45},t.owned?'🚩':'⚑',20);}
        for(const n of state.nodes){circle(n,32,n.amount?'#4e7843':'#535444');emoji(n,n.id==='wood'?'🌲':'⛏️',30);}
        for(const b of state.buildings){circle(b,30,b.progress>=4?'#73a7be66':'#bcaa5466');emoji(b,'🏗️',30);if(b.id===state.selectedBuilding){const q=screen(b);ctx.strokeStyle='#ffd37a';ctx.strokeRect(q.x-25,q.y-25,50,50);}if(b.progress<4){const q=screen(b);ctx.fillStyle='#f9df90';ctx.fillRect(q.x-20,q.y+22,b.progress/4*40,4);}if(b.queue>0){const q=screen(b);ctx.fillStyle='#89caff';ctx.fillRect(q.x-20,q.y+28,(1-b.queue/3)*40,4);}}
        for(const [p,icon]of [[state.camp,'⛺'],[state.fortress,'🏰']]){if(p.hp>0){emoji(p,icon,36);health(p,42);}else emoji(p,'🔥',24);}
        for(const npc of state.npcs)if(!npc.id.startsWith('front')||state.towns[1].owned)emoji(npc,npc.icon);
        for(const u of state.units){if(u.hp<=0)continue;circle(u,18,state.selected.includes(u.id)?'#e3c669aa':'#448ace77');emoji(u,u.type==='worker'?'👷':u.type==='hero'?'🛡️':'⚔️',22);health(u);if(u.carry){const q=screen(u);ctx.font='9px system-ui';ctx.fillStyle='#ffe6a2';ctx.fillText('🪙'+u.carry,q.x,q.y+22);}}
        for(const e of state.enemies){if(e.hp<=0)continue;if(e.warning>0){circle(e,90,'#ec49494d');const q=screen(e);ctx.strokeStyle='#ff6854';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,90*scale,0,Math.PI*2);ctx.stroke();}circle(e,e.type==='boss'?25:18,'#c3454766');emoji(e,e.icon,e.type==='boss'?32:23);health(e,e.type==='boss'?45:30);}
        // Minimap is read-only; edge movement with the left joystick pans the field.
        const mx=width-108,my=42,mw=98,mh=63;ctx.lineWidth=1;ctx.fillStyle='#0c1b23e8';ctx.fillRect(mx,my,mw,mh);ctx.strokeStyle='#69817d';ctx.strokeRect(mx,my,mw,mh);
        const dot=(p,c,r=2)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(mx+p.x/E.W*mw,my+p.y/E.H*mh,r,0,Math.PI*2);ctx.fill();};
        state.towns.forEach(t=>dot(t,t.owned?'#81d0ce':'#e6bf69',3));state.units.filter(u=>u.hp>0).forEach(u=>dot(u,'#89bcf0'));state.enemies.filter(e=>e.hp>0).forEach(e=>dot(e,'#f4756b'));ctx.strokeStyle='#ece0af';ctx.strokeRect(mx+camera.x/E.W*mw,my+camera.y/E.H*mh,Math.min(mw,width/scale/E.W*mw),Math.min(mh,height/scale/E.H*mh));
        ctx.strokeStyle=placing?'#ffc65c':'#fff9d0';ctx.fillStyle='#17222dee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cursor.x,cursor.y);ctx.lineTo(cursor.x+1,cursor.y+21);ctx.lineTo(cursor.x+7,cursor.y+15);ctx.lineTo(cursor.x+13,cursor.y+15);ctx.closePath();ctx.fill();ctx.stroke();
        if(placing){ctx.setLineDash([5,4]);ctx.strokeRect(cursor.x-24,cursor.y-24,48,48);ctx.setLineDash([]);}
        $('rts-cursor-label').textContent=label();$('rts-cursor-label').style.left=Math.max(8,Math.min(width-185,cursor.x+20))+'px';$('rts-cursor-label').style.top=Math.max(36,Math.min(height-48,cursor.y+22))+'px';
        if(paused&&!dialog.open){ctx.fillStyle='#0a142599';ctx.fillRect(0,0,width,height);ctx.fillStyle='#f1e5bd';ctx.font='18px system-ui';ctx.fillText('Pausa · abre el menú para continuar',width/2,height/2);}
    }
    function frame(now){const dt=lastTime===null?0:Math.min((now-lastTime)/1000,.05);lastTime=now;
        if(!paused&&!document.hidden){
            let x=input.x+(keys.has(KeyboardControls.bindings.moveRight)?1:0)-(keys.has(KeyboardControls.bindings.moveLeft)?1:0),y=input.y+(keys.has(KeyboardControls.bindings.moveDown)?1:0)-(keys.has(KeyboardControls.bindings.moveUp)?1:0);const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}
            cursor.x=Math.max(20,Math.min(width-20,cursor.x+x*speed*dt));cursor.y=Math.max(36,Math.min(height-36,cursor.y+y*speed*dt));
            if(cursor.x<=24&&x<0)camera.x-=speed/scale*dt;if(cursor.x>=width-24&&x>0)camera.x+=speed/scale*dt;if(cursor.y<=40&&y<0)camera.y-=speed/scale*dt;if(cursor.y>=height-40&&y>0)camera.y+=speed/scale*dt;clampCamera();
            E.update(state,dt);saveTimer+=dt;if(saveTimer>5){save();saveTimer=0;}
        }
        hudTimer+=dt;if(hudTimer>.1){hud();hudTimer=0;}draw();requestAnimationFrame(frame);
    }
    function joystick(event){const r=$('rts-joystick').getBoundingClientRect(),radius=r.width*.32;let x=(event.clientX-r.left-r.width/2)/radius,y=(event.clientY-r.top-r.height/2)/radius,m=Math.hypot(x,y);if(m>1){x/=m;y/=m;m=1;}if(m<.12){x=y=0;}else {const strength=Math.pow((m-.12)/.88,1.6);x=x/m*strength;y=y/m*strength;}input.x=x;input.y=y;$('rts-knob').style.transform=`translate(${x*radius}px,${y*radius}px)`;}
    $('rts-joystick').addEventListener('pointerdown',e=>{if(paused||pointerId!==null)return;e.preventDefault();pointerId=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);joystick(e);});
    $('rts-joystick').addEventListener('pointermove',e=>{if(e.pointerId===pointerId){e.preventDefault();joystick(e);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])$('rts-joystick').addEventListener(type,e=>{if(e.pointerId===pointerId){pointerId=null;input.x=input.y=0;$('rts-knob').style.transform='';}});
    $('rts-primary').addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||paused||tap)return;e.preventDefault();tap={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};e.currentTarget.setPointerCapture(e.pointerId);});
    $('rts-primary').addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||!tap||tap.id!==e.pointerId)return;e.preventDefault();const now=performance.now(),valid=now-tap.time<300&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<14;tap=null;if(!valid){lastTap=null;return;}if(lastTap&&now-lastTap.time<380&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<25){lastTap=null;pick();}else {lastTap={time:now,x:e.clientX,y:e.clientY};state.message='Un toque más para seleccionar en el cursor.';hud();}});
    $('rts-primary').addEventListener('pointercancel',()=>{tap=lastTap=null;});
    $('rts-primary').addEventListener('click',e=>{if(e.detail===0||e.pointerType!=='touch')pick();});
    $('rts-order').addEventListener('click',command);$('rts-build').addEventListener('click',buildAction);
    $('rts-all').addEventListener('click',()=>{if(!paused){placing=false;E.all(state);hud();}});$('rts-stop').addEventListener('click',()=>{if(!paused){E.stop(state);hud();}});
    $('rts-add').addEventListener('click',()=>{add=!add;$('rts-add').setAttribute('aria-pressed',String(add));$('rts-add').textContent='Añadir a selección: '+(add?'sí':'no');});
    $('rts-menu').addEventListener('click',menu);$('rts-resume').addEventListener('click',resume);
    dialog.addEventListener('cancel',e=>{e.preventDefault();resume();});
    $('rts-reset').addEventListener('click',()=>{if(!confirm('¿Reiniciar solo la prueba RTS?'))return;state=E.create();placing=false;camera.x=0;camera.y=60;cursor.x=120*scale;cursor.y=(260-60)*scale;save();hud();resume();});
    $('rts-speed').value=speed;$('rts-speed-value').textContent=speed;$('rts-speed').addEventListener('input',e=>{speed=Number(e.target.value);$('rts-speed-value').textContent=speed;try{localStorage.setItem(speedKey,String(speed));}catch(_){}});
    const keyLabel=id=>KeyboardControls.label(KeyboardControls.bindings[id]);
    $('rts-key-guide').textContent=`Teclado: ${['moveUp','moveLeft','moveDown','moveRight'].map(keyLabel).join('/')}: cursor; ${keyLabel('interact')}: seleccionar; ${keyLabel('confirm')}: ordenar; ${keyLabel('spell1')}: grupo; ${keyLabel('spell2')}: construir/reclutar; ${keyLabel('spell3')}: detener; ${keyLabel('menu')}: menú. Ratón: clic izquierdo selecciona, derecho ordena. Las acciones principales quedan a la izquierda.`;
    window.addEventListener('keydown',e=>{
        if(e.ctrlKey||e.altKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;const a=KeyboardControls.actionFor(e.code);
        if(a==='menu'||e.code==='Escape'){e.preventDefault();if(!e.repeat){dialog.open?resume():menu();}return;}
        if(paused)return;if(e.target.tagName==='BUTTON'&&['Enter','Space'].includes(e.code))return;
        if(a?.startsWith('move')){e.preventDefault();keys.add(e.code);return;}
        const acts={interact:pick,confirm:command,spell1:()=>{placing=false;E.all(state);hud();},spell2:buildAction,spell3:()=>{E.stop(state);hud();}};
        if(acts[a]){e.preventDefault();if(!e.repeat)acts[a]();}
    });window.addEventListener('keyup',e=>keys.delete(e.code));
    canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!paused){const r=canvas.getBoundingClientRect();cursor.x=Math.max(20,Math.min(width-20,e.clientX-r.left));cursor.y=Math.max(36,Math.min(height-36,e.clientY-r.top));}});
    canvas.addEventListener('click',e=>{if(e.pointerType!=='touch')pick();});canvas.addEventListener('contextmenu',e=>{e.preventDefault();command();});
    window.addEventListener('resize',resize);window.addEventListener('blur',menu);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)menu();});
    if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
        const waiting=()=>{if(reg.waiting)$('rts-update').hidden=false;};waiting();reg.addEventListener('updatefound',()=>{const pending=reg.installing;if(pending)pending.addEventListener('statechange',waiting);});worker=reg;
    }).catch(()=>{$('rts-save-status').textContent='Modo sin conexión todavía no preparado. El juego funciona con conexión.';});
    let updating=false;navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(updating)location.reload();});$('rts-update').addEventListener('click',()=>{save();updating=true;worker?.waiting?.postMessage({type:'SKIP_WAITING'});});
    }
    resize();cursor.x=120*scale;cursor.y=(260-60)*scale;hud();if(!saved)state.message='👷 Dos trabajadores y 🛡️ un paladín esperan tus órdenes. El cursor empieza sobre un trabajador.';menu();requestAnimationFrame(frame);
})();
