/* One adventure: direct hero control and left-hand squad commands share the RPG world/save. */
const Squad = (() => {
    const types={worker:{name:'Trabajador',icon:'👷',cost:35,hp:85,damage:4,speed:230},soldier:{name:'Soldado',icon:'⚔️',cost:70,hp:140,damage:12,speed:250},archer:{name:'Arquera',icon:'🏹',cost:100,hp:100,damage:15,speed:250}};
    let units=[],buildings=[],nodes=[],selected=['hero'],nextId=1,active=false,heroOrder=null,lastTap=null;
    const cursor={x:0,y:0},gridCache=new Map();
    const all=()=>[{id:'hero',...player},...units.filter(u=>u.hp>0)];
    const cap=6;
    function offset(){return {x:canvas.width*(document.body.classList.contains('touch-mode')?.7:.5),y:canvas.height/2};}
    function screen(entity){const a=worldToIso(entity.wx,entity.wy),c=worldToIso(camera.wx,camera.wy),o=offset();return {x:a.x-c.x+o.x,y:a.y-c.y+o.y};}
    function point(){const c=worldToIso(camera.wx,camera.wy),o=offset(),x=cursor.x-o.x+c.x,y=cursor.y-o.y+c.y;return {wx:(x/Math.cos(Math.PI/6)+y/.3)/2,wy:(y/.3-x/Math.cos(Math.PI/6))/2};}
    function props(){return [...sceneryProps.filter(inRegion),...buildings.filter(inRegion).map(b=>({...b,scale:1,icon:'🏗️'}))];}
    function valid(p){const size=regionSize();return p.wx>=30&&p.wy>=30&&p.wx<=size-30&&p.wy<=size-30&&!props().some(s=>Math.hypot(p.wx-s.wx,p.wy-s.wy)<(s.icon==='🏛️'?48:22)*s.scale+17);}
    function cell(p){const n=Math.ceil(regionSize()/60);return {x:Math.max(0,Math.min(n-1,Math.floor(p.wx/60))),y:Math.max(0,Math.min(n-1,Math.floor(p.wy/60))),n};}
    function nearest(p){if(valid(p))return p;for(let r=30;r<=300;r+=30)for(let i=0;i<16;i++){const a=i*Math.PI/8,q={wx:p.wx+Math.cos(a)*r,wy:p.wy+Math.sin(a)*r};if(valid(q))return q;}return {wx:240,wy:240};}
    function route(start,end){
        const from=cell(start),to=cell(nearest(end)),n=from.n,key=activeRegion+':'+buildings.length;
        let openCells=gridCache.get(key);if(!openCells){openCells=Array.from({length:n*n},(_,i)=>valid({wx:(i%n)*60+30,wy:Math.floor(i/n)*60+30}));gridCache.set(key,openCells);}
        const src=from.y*n+from.x,dst=to.y*n+to.x,queue=[{id:src,score:0}],cost=new Map([[src,0]]),parent=new Map();
        const push=item=>{queue.push(item);let i=queue.length-1;while(i>0){const p=(i-1)>>1;if(queue[p].score<=item.score)break;queue[i]=queue[p];i=p;}queue[i]=item;};
        const pop=()=>{const top=queue[0],last=queue.pop();if(queue.length){let i=0;while(i*2+1<queue.length){let c=i*2+1;if(c+1<queue.length&&queue[c+1].score<queue[c].score)c++;if(queue[c].score>=last.score)break;queue[i]=queue[c];i=c;}queue[i]=last;}return top;};
        let found=false,visited=0;
        while(queue.length&&visited++<n*n*3){const item=pop(),id=item.id,x=id%n,y=Math.floor(id/n);if(id===dst){found=true;break;}
            for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx,yy=y+dy,j=yy*n+xx;if(xx<0||yy<0||xx>=n||yy>=n||!openCells[j]||(dx&&dy&&(!openCells[y*n+xx]||!openCells[yy*n+x])))continue;
                const value=cost.get(id)+(dx&&dy?1.414:1);if(value>=(cost.get(j)??Infinity))continue;cost.set(j,value);parent.set(j,id);push({id:j,score:value+Math.hypot(xx-to.x,yy-to.y)});
            }
        }
        if(!found)return [];
        const points=[];for(let id=dst;id!==src;id=parent.get(id)){if(id===undefined)return [];points.push({wx:(id%n)*60+30,wy:Math.floor(id/n)*60+30});}
        points.reverse();points.push(nearest(end));return points;
    }
    function move(u,p,dt,stop=25){if(Math.hypot(u.wx-p.wx,u.wy-p.wy)<=stop)return true;
        u.routeTimer=(u.routeTimer||0)-dt;
        if(!u.path?.length||u.routeTimer<=0){u.path=route(u,p);u.routeTimer=1.2;}
        const target=u.path?.[0];if(!target)return false;
        moveEnemyToward(u,target.wx,target.wy,types[u.type].speed,dt,0);if(Math.hypot(u.wx-target.wx,u.wy-target.wy)<15)u.path.shift();return false;
    }
    function spawn(type,p){const spec=types[type],q=nearest(p);return {id:'unit-'+nextId++,type,name:spec.name,icon:spec.icon,wx:q.wx,wy:q.wy,region:activeRegion,hp:spec.hp+player.level*12,maxHp:spec.hp+player.level*12,cd:0,order:null,path:[],routeTimer:0,carry:0,trapHits:{}};}
    function reset(){units=[];buildings=[];selected=['hero'];nextId=1;heroOrder=null;active=false;gridCache.clear();
        units.push(spawn('soldier',{wx:240,wy:330}),spawn('worker',{wx:350,wy:320}));
        nodes=[{id:'wood',icon:'🪵',name:'Bosque de provisiones',wx:580,wy:300,amount:300},{id:'ore',icon:'⛏️',name:'Veta de la frontera',wx:2250,wy:1150,amount:600},{id:'crystal',icon:'💎',name:'Cristales de las cumbres',wx:3200,wy:1400,amount:900}].map(n=>({...n,region:'world'}));hud();
    }
    function toggle(force){active=force??!active;heroOrder=null;lastTap=null;clearMovement();if(active){const p=screen(player);cursor.x=p.x;cursor.y=p.y;}hud();}
    function selectAll(){selected=all().map(u=>u.id);hud();}
    function under(list,r){const p=point();return list.filter(inRegion).filter(e=>Math.hypot(e.wx-p.wx,e.wy-p.wy)<=r).sort((a,b)=>Math.hypot(a.wx-p.wx,a.wy-p.wy)-Math.hypot(b.wx-p.wx,b.wy-p.wy))[0];}
    function pick(){if(!active||isGamePaused())return;
        const ally=under([{id:'hero',...player,region:activeRegion},...units.filter(u=>u.hp>0)],60);
        const enemy=under(enemies.filter(e=>e.hp>0),60);
        if(ally)selected=[ally.id];else if(enemy){selectedTarget=enemy;addFloatingText('Objetivo: '+enemy.name,enemy.wx,enemy.wy,'#fde047');}else selected=[];hud();updateHUDUI();
    }
    function order(){if(!active||isGamePaused())return;
        const p=point(),enemy=under(enemies.filter(e=>e.hp>0),70),npc=under(npcs,65),node=under(nodes.filter(n=>n.amount>0),65),b=under(buildings,65);
        if(!selected.length){addFloatingText('Selecciona una unidad o el grupo (`).',player.wx,player.wy,'#fde047');return;}
        if(enemy)selectedTarget=enemy;
        const living=units.filter(u=>u.hp>0&&selected.includes(u.id));
        living.forEach((u,i)=>{u.path=[];u.routeTimer=0;u.order=enemy?{type:'attack',id:enemy.id}:u.type==='worker'&&node?{type:'gather',id:node.id}:u.type==='worker'&&b&&b.progress<4?{type:'build',id:b.id}:{type:'move',...nearest({wx:p.wx+(i%3-1)*40,wy:p.wy+Math.floor(i/3)*40})};});
        if(selected.includes('hero'))heroOrder=enemy?{type:'attack',id:enemy.id}:npc?{type:'interact',id:npc.id}: {type:'move',...nearest(p)};
        addFloatingText(enemy?'Escuadrón: atacar':node?'Trabajadores: recolectar':npc?'Héroe: interactuar':'Escuadrón: mover',player.wx,player.wy,'#9de0ff');hud();
    }
    function hire(type){if(isGamePaused()&&activeWindow!=='squad')return;const spec=types[type];if(!spec)return;
        if(!isInTown()){addFloatingText('Recluta desde un refugio.',player.wx,player.wy,'#fde047');return;}
        if(units.filter(u=>u.hp>0).length+buildings.filter(b=>b.queue>0).length>=cap||units.length>=24){addFloatingText('Máximo 6 subordinados.',player.wx,player.wy,'#fde047');return;}
        if(player.gold<spec.cost){addFloatingText(`Necesitas ${spec.cost}g.`,player.wx,player.wy,'#fde047');return;}
        player.gold-=spec.cost;units.push(spawn(type,{wx:player.wx+60,wy:player.wy+30}));saveGame();hud();if(activeWindow==='squad')render();
    }
    function revive(){if(!isInTown()){addFloatingText('Recupera aliados desde un refugio.',player.wx,player.wy,'#fde047');return;}if(player.gold<40){addFloatingText('Recuperar: 40g.',player.wx,player.wy,'#fde047');return;}if(units.filter(u=>u.hp>0).length+buildings.filter(b=>b.queue>0).length>=cap){addFloatingText('Máximo 6 subordinados, incluyendo reclutas en cola.',player.wx,player.wy,'#fde047');return;}const dead=units.find(u=>u.hp<=0);if(!dead)return;player.gold-=40;Object.assign(dead,spawn(dead.type,{wx:player.wx+50,wy:player.wy}));saveGame();render();}
    function build(){if(!active||isGamePaused())return;
        const worker=units.find(u=>u.hp>0&&u.type==='worker'&&selected.includes(u.id));const p=point();
        if(activeRegion!=='world'){addFloatingText('Los cuarteles se construyen en el mundo exterior.',player.wx,player.wy,'#fde047');return;}
        if(!worker||player.gold<120||!valid(p)||buildings.some(b=>Math.hypot(b.wx-p.wx,b.wy-p.wy)<100)||npcs.some(n=>inRegion(n)&&Math.hypot(n.wx-p.wx,n.wy-p.wy)<100)||nodes.some(n=>Math.hypot(n.wx-p.wx,n.wy-p.wy)<100)){addFloatingText('Cuartel: trabajador seleccionado, 120g y terreno libre.',player.wx,player.wy,'#fde047');return;}
        if(buildings.length>=4){addFloatingText('Máximo 4 cuarteles.',player.wx,player.wy,'#fde047');return;}
        player.gold-=120;const b={id:'building-'+nextId++,wx:p.wx,wy:p.wy,region:'world',icon:'🏗️',name:'Cuartel',progress:0,queue:0};buildings.push(b);worker.order={type:'build',id:b.id};worker.path=[];gridCache.clear();hud();saveGame();
    }
    function train(){const b=under(buildings.filter(b=>b.progress>=4),75);if(!b||b.queue>0)return;
        if(units.length+buildings.filter(b=>b.queue>0).length>=24||player.gold<60||units.filter(u=>u.hp>0).length+buildings.filter(b=>b.queue>0).length>=cap){addFloatingText('Reclutar: 60g y espacio en el escuadrón.',player.wx,player.wy,'#fde047');return;}
        player.gold-=60;b.queue=4;saveGame();hud();
    }
    function heroVector(){if(!heroOrder)return null;
        const target=heroOrder.type==='attack'?enemies.find(e=>e.id===heroOrder.id&&inRegion(e)&&e.hp>0):heroOrder.type==='interact'?npcs.find(n=>n.id===heroOrder.id&&inRegion(n)):heroOrder;
        if(!target){heroOrder=null;return null;}
        const dist=Math.hypot(player.wx-target.wx,player.wy-target.wy),stop=heroOrder.type==='attack'?(player.heroClass==='paladin'?90:340):heroOrder.type==='interact'?75:25;
        if(dist<=stop){if(heroOrder.type==='attack')castSpell(1);else if(heroOrder.type==='interact'){heroOrder=null;interactWithNearby();}else heroOrder=null;return {x:0,y:0};}
        // Commanded hero uses the same reachable grid path as its companions.
        if(!heroOrder.path?.length){heroOrder.path=route(player,target);heroOrder.pathAt={wx:target.wx,wy:target.wy};}
        if(heroOrder.pathAt&&Math.hypot(heroOrder.pathAt.wx-target.wx,heroOrder.pathAt.wy-target.wy)>80){heroOrder.path=[];return {x:0,y:0};}
        const p=heroOrder.path?.[0];if(!p){heroOrder=null;return {x:0,y:0};}
        if(Math.hypot(player.wx-p.wx,player.wy-p.wy)<20)heroOrder.path.shift();
        const x=(p.wx-player.wx-(p.wy-player.wy))*Math.cos(Math.PI/6),y=(p.wx-player.wx+p.wy-player.wy)*.3,m=Math.hypot(x,y);return {x:m?x/m:0,y:m?y/m:0};
    }
    function update(dt){
        if(active){let x=touchInput.x+(keys.KeyD?1:0)-(keys.KeyA?1:0),y=touchInput.y+(keys.KeyS?1:0)-(keys.KeyW?1:0);const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}
            cursor.x=Math.max(20,Math.min(canvas.width-20,cursor.x+x*280*dt));cursor.y=Math.max(30,Math.min(canvas.height-30,cursor.y+y*280*dt));
            const sx=cursor.x<25&&x<0?-180*dt:cursor.x>canvas.width-25&&x>0?180*dt:0,sy=cursor.y<35&&y<0?-180*dt:cursor.y>canvas.height-35&&y>0?180*dt:0;
            camera.wx=Math.max(60,Math.min(regionSize()-60,camera.wx+(sx/Math.cos(Math.PI/6)+sy/.3)/2));camera.wy=Math.max(60,Math.min(regionSize()-60,camera.wy+(sy/.3-sx/Math.cos(Math.PI/6))/2));
        }
        for(const u of units.filter(u=>u.hp>0&&inRegion(u))){
            const hp=types[u.type].hp+player.level*12;if(hp!==u.maxHp){u.hp=Math.min(hp,u.hp+hp-u.maxHp);u.maxHp=hp;}u.cd=Math.max(0,u.cd-dt);
            if(isInTown(u.wx,u.wy))u.hp=Math.min(u.maxHp,u.hp+10*dt);
            if(u.order?.type==='gather'){
                const node=nodes.find(n=>n.id===u.order.id),town=[{wx:300,wy:300},{wx:2100,wy:900},{wx:3050,wy:1050}].sort((a,b)=>Math.hypot(a.wx-u.wx,a.wy-u.wy)-Math.hypot(b.wx-u.wx,b.wy-u.wy))[0];
                if(u.carry>=20||!node||node.amount<=0){if(move(u,town,dt,100)){player.gold+=u.carry;u.carry=0;if(!node||node.amount<=0)u.order=null;}}
                else if(move(u,node,dt,50)){u.gather=(u.gather||0)+dt;if(u.gather>=1){u.gather-=1;const amount=Math.min(5,node.amount);node.amount-=amount;u.carry+=amount;}}continue;
            }
            if(u.order?.type==='build'){const b=buildings.find(b=>b.id===u.order.id);if(!b){u.order=null;continue;}if(move(u,b,dt,75)){b.progress=Math.min(4,b.progress+dt);if(b.progress>=4){u.order=null;addFloatingText('Cuartel listo: cursor encima y R para reclutar.',b.wx,b.wy,'#9de0ff');}}continue;}
            let enemy=u.order?.type==='attack'?enemies.find(e=>e.id===u.order.id&&inRegion(e)&&e.hp>0):null;
            if(u.order?.type==='move'){if(move(u,u.order,dt,20)){u.order={type:'hold',wx:u.wx,wy:u.wy};}continue;}
            if(u.type!=='worker'&&!enemy)enemy=enemies.filter(inRegion).filter(e=>e.hp>0&&!e.returning&&!isInTown(u.wx,u.wy)&&Math.hypot(u.wx-e.wx,u.wy-e.wy)<230).sort((a,b)=>Math.hypot(u.wx-a.wx,u.wy-a.wy)-Math.hypot(u.wx-b.wx,u.wy-b.wy))[0];
            if(enemy){const range=u.type==='archer'?280:65;if(Math.hypot(u.wx-enemy.wx,u.wy-enemy.wy)>range)move(u,enemy,dt,range-10);else if(u.cd<=0){u.cd=u.type==='archer'?1.3:1;damageEnemy(enemy,types[u.type].damage+player.level*2,'#a8dcff');}continue;}
            if(u.order?.type==='attack')u.order=null;
            if(!u.order){const i=units.indexOf(u),p={wx:player.wx-60+(i%3)*50,wy:player.wy+70+Math.floor(i/3)*50};if(Math.hypot(u.wx-p.wx,u.wy-p.wy)>115)move(u,p,dt,70);}
        }
        for(const b of buildings.filter(inRegion)){if(b.queue>0){b.queue=Math.max(0,b.queue-dt);if(b.queue===0)units.push(spawn('soldier',{wx:b.wx+75,wy:b.wy}));}}
    }
    function target(enemy){return [player,...units.filter(u=>u.hp>0&&inRegion(u)&&!isInTown(u.wx,u.wy))].sort((a,b)=>Math.hypot(a.wx-enemy.wx,a.wy-enemy.wy)-Math.hypot(b.wx-enemy.wx,b.wy-enemy.wy))[0];}
    function hurt(u,amount){if(u.hp<=0)return;u.hp=Math.max(0,u.hp-amount);if(!u.hp){u.order=null;u.carry=0;selected=selected.filter(id=>id!==u.id);addFloatingText(u.name+' cayó. Recupéralo en un refugio (40g).',u.wx,u.wy,'#fca5a5');}}
    function area(p,r,damage){for(const u of units.filter(u=>u.hp>0&&inRegion(u)))if(Math.hypot(u.wx-p.wx,u.wy-p.wy)<=r)hurt(u,damage);}
    function traps(t,cycle){for(const u of units.filter(u=>u.hp>0&&inRegion(u))){const id=t.wx+':'+t.wy;if(u.trapHits[id]!==cycle&&Math.hypot(u.wx-t.wx,u.wy-t.wy)<=t.radius){u.trapHits[id]=cycle;hurt(u,u.maxHp*t.fraction);}}}
    function region(){heroOrder=null;selected=['hero'];units.forEach((u,i)=>{const p=nearest({wx:player.wx+40+(i%3)*35,wy:player.wy+45+Math.floor(i/3)*35});u.region=activeRegion;u.wx=p.wx;u.wy=p.wy;u.order=null;u.path=[];u.trapHits={};});const p=screen(player);cursor.x=p.x;cursor.y=p.y;hud();}
    function render(){const container=document.getElementById('squad-options');if(!container)return;container.innerHTML='';
        const actions=[['Grupo completo · `',selectAll],['Control directo / cursor · Tab',()=>{closeAllWindows();toggle();}],...Object.entries(types).map(([type,t])=>[`${t.icon} Reclutar ${t.name} · ${t.cost}g`,()=>hire(type)]),['Recuperar subordinado caído · 40g',revive],['Construir cuartel en el cursor · 120g',()=>{closeAllWindows();if(!active)toggle(true);build();}],['Reclutar en el cuartel del cursor · 60g',()=>{closeAllWindows();if(!active)toggle(true);train();}],['Seguir al héroe',()=>{units.forEach(u=>u.order=null);heroOrder=null;}],['Volver al juego',closeAllWindows]];
        menuIndex=Math.max(0,Math.min(actions.length-1,menuIndex));actions.forEach(([label,fn],i)=>{const b=document.createElement('button');b.textContent=label;b.className='wow-btn';b.style.minHeight='44px';b.classList.toggle('keyboard-selected',i===menuIndex);b.onclick=fn;container.appendChild(b);});
        document.getElementById('squad-summary').textContent=`${units.filter(u=>u.hp>0).length}/${cap} subordinados vivos. Recluta en refugios; trabajadores reúnen oro del bosque/minas. En órdenes: E selecciona, F manda, C construye cuartel (120g), R recluta sobre un cuartel (60g). En móvil, selecciona trabajador y sitúa el cursor; usa Construir/Reclutar en este menú. Todos entran contigo en las mazmorras.`;
    }
    function execute(){document.getElementById('squad-options').children[menuIndex]?.click();}
    function hud(){const el=document.getElementById('squad-status');if(!el)return;el.textContent=`${active?'Cursor RTS':'Héroe WASD'} · ${units.filter(u=>u.hp>0).length}/${cap} aliados · ${selected.length} seleccionados`;document.getElementById('tactics-toggle').setAttribute('aria-pressed',String(active));document.getElementById('tactics-toggle').innerHTML=active?'🛡️<span>Héroe · Tab</span>':'🎯<span>Órdenes · Tab</span>';document.getElementById('joystick-label').textContent=active?'Cursor':'Mover';document.getElementById('interact-button').innerHTML=active?'📍<span>Ordenar · F</span>':'🤝<span>Interactuar</span>';document.body.classList.toggle('tactics-active',active);}
    function draw(){if(!active)return;ctx.save();ctx.fillStyle='#fceca8';ctx.strokeStyle='#221d10';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cursor.x,cursor.y);ctx.lineTo(cursor.x,cursor.y+20);ctx.lineTo(cursor.x+6,cursor.y+14);ctx.lineTo(cursor.x+13,cursor.y+14);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    function snapshot(){return {version:1,nextId,units:units.map(u=>({id:u.id,type:u.type,wx:u.wx,wy:u.wy,hp:u.hp,maxHp:u.maxHp,region:u.region,carry:u.carry})),buildings:buildings.map(b=>({...b})),nodes:nodes.map(n=>({...n}))};}
    function validate(data,level,regionId){if(!data)return null;const finite=(v,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)throw Error('Escuadrón inválido');return v;};
        if(data.version!==1||!Array.isArray(data.units)||data.units.length>24||!Array.isArray(data.buildings)||data.buildings.length>4||!Array.isArray(data.nodes)||data.nodes.length!==3)throw Error('Escuadrón inválido');
        const ids=new Set();function id(v){if(typeof v!=='string'||v.length>40||ids.has(v))throw Error('Unidad inválida');ids.add(v);return v;}
        const restoredUnits=data.units.map(u=>{if(!types[u.type]||u.region!==regionId)throw Error('Unidad inválida');const max=types[u.type].hp+level*12;return {id:id(u.id),type:u.type,name:types[u.type].name,icon:types[u.type].icon,region:validateRegion(u.region),wx:finite(u.wx,30,regionId==='world'?MAP_WORLD_SIZE-30:1170),wy:finite(u.wy,30,regionId==='world'?MAP_WORLD_SIZE-30:1170),hp:finite(u.hp,0,max),maxHp:max,carry:finite(u.carry,0,24),cd:0,order:null,path:[],trapHits:{}};});
        if(restoredUnits.filter(u=>u.hp>0).length>cap)throw Error('Grupo demasiado grande');
        const restoredBuildings=data.buildings.map(b=>({id:id(b.id),wx:finite(b.wx,30,MAP_WORLD_SIZE-30),wy:finite(b.wy,30,MAP_WORLD_SIZE-30),region:'world',name:'Cuartel',icon:'🏗️',progress:finite(b.progress,0,4),queue:finite(b.queue,0,4)}));
        if(restoredBuildings.filter(b=>b.queue>0).length+restoredUnits.filter(u=>u.hp>0).length>cap)throw Error('Reclutas inválidos');
        const template=[{id:'wood',icon:'🪵',name:'Bosque de provisiones',wx:580,wy:300,amount:300},{id:'ore',icon:'⛏️',name:'Veta de la frontera',wx:2250,wy:1150,amount:600},{id:'crystal',icon:'💎',name:'Cristales de las cumbres',wx:3200,wy:1400,amount:900}];
        const restoredNodes=template.map((n,i)=>({...n,region:'world',amount:finite(data.nodes[i].amount,0,n.amount)}));
        return {units:restoredUnits,buildings:restoredBuildings,nodes:restoredNodes,nextId:finite(data.nextId,1,1e9)};
    }
    function restore(data){if(!data){reset();region();return;}units=data.units;buildings=data.buildings;nodes=data.nodes;nextId=data.nextId;active=false;heroOrder=null;selected=['hero'];gridCache.clear();hud();}
    function init(){reset();document.getElementById('tactics-toggle').addEventListener('click',()=>toggle());document.getElementById('tactics-select').addEventListener('click',e=>{if(e.pointerType==='touch'){const now=performance.now();if(lastTap!==null&&now-lastTap<400){lastTap=null;pick();}else lastTap=now;}else pick();});document.getElementById('squad-all').addEventListener('click',selectAll);}
    return {init,reset,restore,validate,snapshot,toggle,pick,order,build,train,hire,revive,update,heroVector,target,hurt,area,traps,region,render,execute,hud,draw,offset,screen,point,route,valid,selectAll,get active(){return active;},get units(){return units;},get buildings(){return buildings;},get nodes(){return nodes;},get selected(){return selected;},get cursor(){return cursor;}};
})();
