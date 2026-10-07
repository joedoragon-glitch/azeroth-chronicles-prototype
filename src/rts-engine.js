/* Small deterministic RTS simulation, independent of the RPG and input device. */
(function(root) {
    const W=1400,H=900,COST=50,TRAIN=30;
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    function unit(id,type,x,y) {return {id,type,x,y,hp:type==='worker'?70:type==='hero'?220:120,maxHp:type==='worker'?70:type==='hero'?220:120,order:null,cd:0,carry:0,timer:0};}
    function create() {
        return {version:1,nextId:4,gold:80,time:0,result:null,upgrade:0,selected:[],selectedBuilding:null,selectedNPC:null,
            units:[unit(1,'worker',120,260),unit(2,'worker',160,290),unit(3,'hero',190,250)],
            base:{x:100,y:350},towns:[{id:1,x:100,y:350,owned:true},{id:2,x:900,y:660,owned:false}],npcs:[{id:'recruit',x:80,y:415,icon:'👷',name:'Capataz · trabajador 20'},{id:'heal',x:150,y:415,icon:'🧙',name:'Sanadora · curar 20'},{id:'upgrade',x:220,y:415,icon:'🔨',name:'Herrero · mejora 60'},{id:'frontHeal',x:900,y:730,icon:'🧝',name:'Médica de frontera · curar 20'},{id:'frontRecruit',x:975,y:770,icon:'⚔️',name:'Sargento · soldado 45'}],nodes:[{id:'wood',x:290,y:120,amount:500},{id:'ore',x:790,y:590,amount:700}],buildings:[],
            enemies:[{id:1,type:'goblin',icon:'🧌',x:590,y:180,hp:65,maxHp:65,cd:0},{id:2,type:'goblin',icon:'🧌',x:650,y:280,hp:65,maxHp:65,cd:0},{id:3,type:'captain',icon:'💀',x:570,y:350,hp:180,maxHp:180,cd:0},{id:4,type:'orc',icon:'👹',x:970,y:630,hp:115,maxHp:115,cd:0},{id:5,type:'orc',icon:'👹',x:1060,y:730,hp:115,maxHp:115,cd:0},{id:6,type:'boss',icon:'😈',x:1200,y:670,hp:400,maxHp:400,cd:0,burst:5,warning:0}],
            camp:{x:700,y:240,hp:180,maxHp:180},fortress:{x:1270,y:700,hp:300,maxHp:300},message:'Selecciona tus unidades azules. Reúne recursos, construye un cuartel y recupera el poblado de frontera y derrota al jefe de la fortaleza.'};
    }
    function select(s,p,add=false) {
        if(s.result)return;
        const u=s.units.filter(u=>u.hp>0&&distance(u,p)<34).sort((a,b)=>distance(a,p)-distance(b,p))[0];
        s.selectedBuilding=null;s.selectedNPC=null;
        const npc=s.npcs.find(n=>distance(n,p)<30);if(npc){s.selected=[];s.selectedNPC=npc.id;s.message=npc.name;return;}
        if(u){s.selected=add?[...new Set([...s.selected,u.id])]:[u.id];s.message=u.type==='worker'?'Trabajador: ordenar sobre el bosque recolecta recursos.':'Soldado: ordenar sobre un enemigo inicia un ataque.';}
        else {s.selected=add?s.selected:[];const b=s.buildings.find(b=>distance(b,p)<38);if(b){s.selectedBuilding=b.id;s.message=b.progress<4?'Cuartel en construcción.':'Cuartel seleccionado: puedes reclutar un soldado.';}}
    }
    function all(s){s.selected=s.units.filter(u=>u.hp>0).map(u=>u.id);s.selectedBuilding=null;s.selectedNPC=null;s.message='Grupo completo seleccionado.';}
    function stop(s){for(const u of s.units)if(s.selected.includes(u.id)){u.order=null;u.timer=0;}s.message='Unidades detenidas.';}
    function order(s,p) {
        if(s.result)return false;
        const selected=s.units.filter(u=>u.hp>0&&s.selected.includes(u.id));
        if(!selected.length){s.message='Selecciona al menos una unidad antes de dar una orden.';return false;}
        const enemy=s.enemies.find(e=>e.hp>0&&distance(e,p)<35),camp=s.camp.hp>0&&distance(s.camp,p)<45,fortress=s.fortress.hp>0&&distance(s.fortress,p)<50;
        const construction=s.buildings.find(b=>b.progress<4&&distance(b,p)<40);
        const node=s.nodes.find(n=>n.amount>0&&distance(n,p)<44);
        selected.forEach((u,i)=>{
            u.timer=0;u.route=null;u.routeGoal=null;
            if(enemy||camp||fortress)u.order={kind:'attack',target:enemy?'enemy':fortress?'fortress':'camp',id:enemy?.id};
            else if(construction&&u.type==='worker')u.order={kind:'build',id:construction.id};
            else if(node&&u.type==='worker')u.order={kind:'gather',id:node.id,phase:u.carry>=20?'deposit':'collect'};
            else {const target=walkable(p)?p:nearest(p),angle=i*2.399,radius=selected.length>1?18*Math.sqrt(i):0;let dest={x:clamp(target.x+Math.cos(angle)*radius,18,W-18),y:clamp(target.y+Math.sin(angle)*radius,18,H-18)};if(!walkable(dest))dest=nearest(dest);u.order={kind:'move',...dest};}
        });
        s.message=enemy||camp||fortress?'Orden: atacar.':node?'Trabajadores recolectando; soldados en posición.':'Orden: mover el grupo.';return true;
    }
    function build(s,p) {
        if(s.result)return false;
        const worker=s.units.find(u=>u.hp>0&&u.type==='worker'&&s.selected.includes(u.id));
        if(!worker){s.message='Selecciona un trabajador para construir.';return false;}
        if(s.buildings.length>=30){s.message='Límite del prototipo: 30 cuarteles.';return false;}
        if(s.gold<COST){s.message='El cuartel cuesta 50 crowns. Ordena recolectar en el bosque.';return false;}
        if(!walkable(p)||![-30,30].every(dx=>[-30,30].every(dy=>walkable({x:p.x+dx,y:p.y+dy})))||p.x<40||p.y<40||p.x>W-40||p.y>H-40||distance(p,s.base)<65||distance(p,s.camp)<75||distance(p,s.fortress)<85||s.nodes.some(n=>distance(p,n)<65)||s.buildings.some(b=>distance(p,b)<70)) {s.message='Busca un espacio libre para el cuartel.';return false;}
        const b={id:s.nextId++,x:p.x,y:p.y,progress:0,worker:worker.id,queue:0};s.buildings.push(b);s.gold-=COST;s.selectedNPC=null;
        worker.order={kind:'build',id:b.id};s.selectedBuilding=b.id;s.message='El trabajador irá al lugar y construirá el cuartel.';return true;
    }
    function train(s) {
        const b=s.buildings.find(b=>b.id===s.selectedBuilding&&b.progress>=4);
        if(s.result)return false;
        if(!b){s.message='Selecciona un cuartel terminado para reclutar.';return false;}
        if(b.queue>0){s.message='Ya hay un soldado en preparación.';return false;}
        if(s.gold<TRAIN){s.message='Necesitas 30 crowns para reclutar.';return false;}
        if(s.units.filter(u=>u.hp>0).length+s.buildings.filter(b=>b.queue>0).length>=12){s.message='Límite del prototipo: 12 unidades.';return false;}
        s.gold-=TRAIN;b.queue=3;s.message='Reclutando un soldado (3 segundos).';return true;
    }
    const obstacles=[{x:755,y:0,w:70,h:220},{x:755,y:300,w:70,h:250},{x:755,y:620,w:70,h:280},{x:370,y:380,w:85,h:65},{x:1080,y:390,w:100,h:80}];
    function walkable(p){return p.x>=12&&p.y>=12&&p.x<=W-12&&p.y<=H-12&&!obstacles.some(o=>p.x>o.x-12&&p.x<o.x+o.w+12&&p.y>o.y-12&&p.y<o.y+o.h+12);}
    function nearest(p){let best=null,d=Infinity;for(let y=20;y<H;y+=40)for(let x=20;x<W;x+=40){const v={x,y};if(walkable(v)&&distance(v,p)<d){best=v;d=distance(v,p);}}return best;}
    function path(from,to){
        const step=40,cols=Math.ceil(W/step),rows=Math.ceil(H/step),cell=p=>({x:clamp(Math.floor(p.x/step),0,cols-1),y:clamp(Math.floor(p.y/step),0,rows-1)}),pos=c=>({x:c.x*step+20,y:c.y*step+20}),key=c=>c.y*cols+c.x;
        const start=cell(from);let goal=cell(to);
        if(!walkable(pos(goal))){let best=null,d=Infinity;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const c={x,y};if(walkable(pos(c))&&distance(pos(c),to)<d){d=distance(pos(c),to);best=c;}}goal=best;}
        if(!goal)return [];const open=[{...start,g:0,f:distance(pos(start),pos(goal))}],seen=new Map([[key(start),0]]),parents=new Map();
        while(open.length){open.sort((a,b)=>a.f-b.f);const c=open.shift();if(key(c)===key(goal)){const result=[];let k=key(c);while(k!==key(start)){result.unshift(pos({x:k%cols,y:Math.floor(k/cols)}));k=parents.get(k);if(k===undefined)return [];}if(walkable(to))result.push({x:to.x,y:to.y});return result;}
            for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const n={x:c.x+dx,y:c.y+dy};if(n.x<0||n.y<0||n.x>=cols||n.y>=rows||!walkable(pos(n)))continue;if(dx&&dy&&(!walkable(pos({x:c.x+dx,y:c.y}))||!walkable(pos({x:c.x,y:c.y+dy}))))continue;const g=c.g+Math.hypot(dx,dy)*step,k=key(n);if(g>=(seen.get(k)??Infinity))continue;seen.set(k,g);parents.set(k,key(c));open.push({...n,g,f:g+distance(pos(n),pos(goal))});}
        }return [];
    }
    function advance(u,p,dt,range=3) {
        const d=distance(u,p);if(d<=range)return true;
        if(!u.routeGoal||distance(u.routeGoal,p)>25||!u.route){u.route=path(u,p);u.routeGoal={x:p.x,y:p.y};}
        const next=u.route[0];if(!next)return false;const nd=distance(u,next),step=Math.min(nd,(u.speed||(u.type==='worker'?90:100))*dt);
        if(nd>0){u.x=clamp(u.x+(next.x-u.x)/nd*step,12,W-12);u.y=clamp(u.y+(next.y-u.y)/nd*step,12,H-12);}if(nd<=step+.01)u.route.shift();return distance(u,p)<=range+.01;
    }
    function update(s,dt) {
        if(s.result||!Number.isFinite(dt)||dt<=0)return;
        dt=Math.min(dt,.05);s.time+=dt;
        for(const u of s.units){
            if(u.hp<=0)continue;u.cd=Math.max(0,u.cd-dt);if(!u.order&&u.type!=='worker'){const threat=s.enemies.find(e=>e.hp>0&&distance(e,u)<150);if(threat)u.order={kind:'attack',target:'enemy',id:threat.id};}const o=u.order;if(!o)continue;
            if(o.kind==='move'){if(advance(u,o,dt))u.order=null;}
            if(o.kind==='attack'){
                const t=o.target==='camp'?s.camp:o.target==='fortress'?s.fortress:s.enemies.find(e=>e.id===o.id&&e.hp>0);
                if(!t||t.hp<=0){u.order=null;continue;}
                if(advance(u,t,dt,o.target!=='enemy'?42:28)&&u.cd===0){t.hp=Math.max(0,t.hp-(u.type==='worker'?6:(u.type==='hero'?28:20)+s.upgrade*5));u.cd=.75;if(t.hp===0&&o.target==='enemy')s.gold+=10;}
            }
            if(o.kind==='gather'){
                const n=s.nodes.find(n=>n.id===o.id);if(!n){u.order=null;continue;}
                if(o.phase==='deposit'){
                    const town=s.towns.filter(t=>t.owned).sort((a,b)=>distance(a,u)-distance(b,u))[0];
                    if(advance(u,town,dt,38)){s.gold+=u.carry;u.carry=0;u.timer=0;if(n.amount>0)o.phase='collect';else u.order=null;}
                }else if(n.amount<=0){if(u.carry>0)o.phase='deposit';else u.order=null;}
                else if(advance(u,n,dt,28)){u.timer+=dt;if(u.timer>=.5){u.timer-=.5;const amount=Math.min(4,n.amount,20-u.carry);u.carry+=amount;n.amount-=amount;if(u.carry>=20)o.phase='deposit';}}
            }
            if(o.kind==='build'){
                const b=s.buildings.find(b=>b.id===o.id);if(!b){u.order=null;continue;}
                if(advance(u,b,dt,38)){b.progress=Math.min(4,b.progress+dt);if(b.progress>=4){u.order=null;s.message='Cuartel listo. Selecciónalo para reclutar soldados.';}}
            }
        }
        for(const b of s.buildings)if(b.queue>0){b.queue=Math.max(0,b.queue-dt);if(b.queue===0){const p=nearest({x:b.x+45,y:b.y});s.units.push(unit(s.nextId++,'soldier',p.x,p.y));};}
        for(const e of s.enemies){
            if(e.hp<=0)continue;e.cd=Math.max(0,e.cd-dt);
            if(e.type==='boss'&&e.warning>0){e.warning=Math.max(0,e.warning-dt);if(e.warning===0){for(const u of s.units)if(u.hp>0&&distance(u,e)<90)u.hp=Math.max(0,u.hp-35);e.burst=7;}}
            const t=s.units.filter(u=>u.hp>0&&distance(u,e)<150).sort((a,b)=>distance(a,e)-distance(b,e))[0];
            if(t){const d=distance(e,t);if(d>28){e.speed=62;advance(e,t,dt,28);}
                else if(e.cd===0){t.hp=Math.max(0,t.hp-(e.type==='boss'?16:e.type==='orc'?10:e.type==='captain'?12:7));e.cd=1;}
                if(e.type==='boss'&&e.warning===0){e.burst-=dt;if(e.burst<=0){e.warning=1.25;s.message='¡El jefe prepara un golpe de área! Aleja las tropas del círculo rojo.';}}}
        }
        for(const town of s.towns){if(!town.owned&&s.camp.hp===0&&s.units.some(u=>u.hp>0&&distance(u,town)<80)){town.owned=true;s.gold+=50;s.message='Poblado de frontera recuperado: +50 crowns y refugio para tus tropas.';}if(town.owned)for(const u of s.units)if(u.hp>0&&distance(u,town)<70&&!s.enemies.some(e=>e.hp>0&&distance(e,town)<160))u.hp=Math.min(u.maxHp,u.hp+3*dt);}
        s.selected=s.selected.filter(id=>s.units.some(u=>u.id===id&&u.hp>0));
        if(s.camp.hp===0&&s.fortress.hp===0&&!s.enemies.some(e=>e.hp>0)&&s.towns[1].owned&&s.buildings.some(b=>b.progress>=4)){s.result='victory';s.message='¡Victoria! Recuperaste la frontera y derrotaste la fortaleza.';}
        else if(!s.units.some(u=>u.hp>0)){s.result='defeat';s.message='No quedan unidades. Reinicia y reúne un grupo mayor.';}
        
    }
    function npcAction(s){
        if(s.result)return false;const id=s.selectedNPC,cost=id==='upgrade'?60:id==='frontRecruit'?45:20,town=id?.startsWith('front')?s.towns[1]:s.base;
        if(id?.startsWith('front')&&!s.towns[1].owned){s.message='Recupera primero el poblado de frontera.';return false;}
        if(!id)return false;if(id==='upgrade'&&s.upgrade){s.message='La mejora del herrero ya está activa.';return false;}
        if(s.gold<cost){s.message=`Necesitas ${cost} crowns.`;return false;}
        if(['recruit','frontRecruit'].includes(id)&&s.units.filter(u=>u.hp>0).length+s.buildings.filter(b=>b.queue>0).length>=12){s.message='Límite del prototipo: 12 unidades.';return false;}
        if(['heal','frontHeal'].includes(id)&&!s.units.some(u=>u.hp>0&&u.hp<u.maxHp&&distance(u,town)<160)){s.message='Acerca al poblado una unidad herida.';return false;}
        s.gold-=cost;if(id==='recruit'){s.units.push(unit(s.nextId++,'worker',100,450));s.message='Un trabajador se une al grupo.';}
        if(['heal','frontHeal'].includes(id)){for(const u of s.units)if(u.hp>0&&distance(u,town)<160)u.hp=u.maxHp;s.message='Las tropas cercanas recuperan su salud.';}
        if(id==='frontRecruit'){s.units.push(unit(s.nextId++,'soldier',town.x+45,town.y));s.message='Un soldado de frontera se une al grupo.';}
        if(id==='upgrade'){s.upgrade=1;s.message='Armas mejoradas: +5 de daño a todos los soldados.';}return true;
    }
    function restore(raw){
        try{const s=JSON.parse(raw);if(s.version!==1||!Number.isFinite(s.gold)||s.gold<0||s.gold>100000||!Number.isFinite(s.time)||s.time<0||!Number.isInteger(s.nextId)||s.nextId<4||s.nextId>100000||!['victory','defeat',null].includes(s.result))return null;
            if(!Array.isArray(s.units)||s.units.length>100||!Array.isArray(s.enemies)||s.enemies.length!==6||!Array.isArray(s.nodes)||s.nodes.length!==2||!Array.isArray(s.buildings)||s.buildings.length>100)return null;
            const position=v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.x<=W&&v.y>=0&&v.y<=H;
            const hp=v=>Number.isFinite(v.hp)&&Number.isFinite(v.maxHp)&&v.maxHp>0&&v.maxHp<=500&&v.hp>=0&&v.hp<=v.maxHp;
            if(!position(s.base)||!position(s.camp)||!hp(s.camp)||!position(s.fortress)||!hp(s.fortress)||![0,1].includes(s.upgrade)||!Array.isArray(s.towns)||s.towns.length!==2||!s.towns.every(t=>position(t)&&typeof t.owned==='boolean')||!Array.isArray(s.npcs)||s.npcs.length!==5||!s.npcs.every(n=>position(n)&&['recruit','heal','upgrade','frontHeal','frontRecruit'].includes(n.id))||!s.units.every(u=>position(u)&&hp(u)&&['worker','soldier','hero'].includes(u.type)&&Number.isInteger(u.id)&&Number.isFinite(u.carry)&&u.carry>=0&&u.carry<=20)||!s.enemies.every(e=>position(e)&&hp(e)&&Number.isInteger(e.id))||!s.nodes.every(n=>position(n)&&['wood','ore'].includes(n.id)&&Number.isFinite(n.amount)&&n.amount>=0&&n.amount<=700)||!s.buildings.every(b=>position(b)&&Number.isInteger(b.id)&&Number.isFinite(b.progress)&&b.progress>=0&&b.progress<=4&&Number.isFinite(b.queue)&&b.queue>=0&&b.queue<=3))return null;
            if(new Set(s.units.map(u=>u.id).concat(s.buildings.map(b=>b.id))).size!==s.units.length+s.buildings.length)return null;
            // Restore progress safely; orders are intentionally cleared on reopening.
            s.selected=[];s.selectedBuilding=null;s.selectedNPC=null;s.message='Partida RTS recuperada. Selecciona tus unidades para continuar.';
            s.units.forEach(u=>{u.order=null;u.cd=0;u.timer=0;u.route=null;u.routeGoal=null;});s.enemies.forEach(e=>{e.cd=0;e.route=null;e.routeGoal=null;if(e.type==='boss'){e.warning=0;e.burst=5;}});return s;
        }catch(_){return null;}
    }
    const api={W,H,COST,TRAIN,create,select,all,stop,order,build,train,npcAction,update,restore,obstacles,walkable,path};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RTSEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
