'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine');
const fresh=()=>new C('normal','paladin',()=>.9),kill=(c,e,hero=false)=>{e.hp=0;e.heroParticipated=hero;c.kill(e);};
let passed=0;function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){process.exitCode=1;console.error('FAIL '+name+' '+e.stack);}}

for(const [i,r]of C.data.regions.entries())test(r.id+' keeps one field-boss compound while tribute and creature strongholds remain separate systems',()=>{
 const c=fresh();c.enter(r.id);const z=c.zone(),fieldBoss=C.data.bosses.find(b=>b.region===r.id&&b.kind==='field');
 assert.equal(z.minis.length,1,r.id+' has exactly one outdoor mini-compound');
 const m=z.minis[0];assert.equal(m.type,'field');assert.equal(m.family,fieldBoss.id);assert.equal(m.id,'field-'+fieldBoss.id);
 assert(!z.minis.some(x=>x.type==='resource'),'resource mini-fort is retired');
 assert(z.nodes.length===4&&z.nodes.every(n=>n.tribute&&!n.mini),'tribute is outdoor labor, not mini-dungeon loot');
 const walls=z.props.filter(p=>p.mini===m.id);assert(walls.length>=3,r.id+' field compound has cover');
 const wall=walls[0];assert(c.blocked(wall.x,wall.y));assert(!c.line({x:wall.x-60,y:wall.y},{x:wall.x+60,y:wall.y}));
 const guards=z.enemies.filter(e=>e.mini===m.id);assert(guards.length>=3,r.id+' field compound has guardians');
 guards.forEach(e=>{assert(e.guard);assert.equal(e.gold,Math.max(1,Math.floor((r.gold_range[0]+r.gold_range[1])/2*.35)));assert.equal(e.xp,r.guard_xp);assert(c.route(c.hero,e.home).length,r.id+' guardian route '+e.id);});
 const marker=z.npcs.find(n=>n.mini===m.id&&n.kind==='mini');assert(marker&&c.route(c.hero,marker).length);assert(c.miniStatus(m.id).includes('guardians'));
 const strongholds=(C.rules.creatureStrongholds||[]).filter(s=>s.region===r.id);assert(strongholds.length>=1,r.id+' has ordinary-monster territorial strongholds');
});

test('Field compound guardians and the captive remain part of the regional specialist quest',()=>{
 for(const r of C.data.regions){const c=fresh();c.enter(r.id);const z=c.zone(),m=z.minis[0],q=c.questDefs().find(q=>q.clear===m.id),boss=z.enemies.find(e=>e.family===m.family&&e.form==='normal'),captive=z.npcs.find(n=>n.kind==='cage'&&n.family===m.family);assert(q&&boss&&captive,r.id+' field progression authored');kill(c,boss);Object.assign(c.hero,captive);assert(c.interact(captive));assert(!c.s.quests[q.id].done,'boss and captive alone do not clear guarded compound');const gold=c.hero.gold;for(const e of z.enemies.filter(e=>e.mini===m.id))kill(c,e);assert(m.cleared);assert(c.s.quests[q.id].done&&c.s.quests[q.id].paid);assert.equal(c.hero.gold,gold+q.gold);const restored=C.restore(c.snapshot());assert(restored.zone().minis[0].cleared);assert(!restored.traps().some(t=>t.miniId===m.id));}
});

test('Pending field-compound ringleaders prevent clear and retain mini identity with reduced rewards',()=>{
 const c=new C('normal','paladin',()=>.2),z=c.zone(),m=z.minis[0],guards=z.enemies.filter(e=>e.mini===m.id),counts=new Map();for(const e of guards)counts.set(e.species,(counts.get(e.species)||0)+1);const species=[...counts].find(([,n])=>n>=2)?.[0],pair=guards.filter(e=>e.species===species).slice(0,2);assert.equal(pair.length,2);
 pair.forEach(e=>kill(c,e,true));assert(Object.values(c.s.pending).some(p=>p.base.mini===m.id));for(const e of guards.filter(e=>e.hp>0))kill(c,e,false);c.checkMinis();assert(!m.cleared,'pending guardian ringleader keeps compound contested');
 c.updateElites(3);const elites=z.enemies.filter(e=>e.form==='ringleader'&&e.mini===m.id);assert(elites.length>=1);elites.forEach(e=>{assert(e.guard);assert(e.gold<=Math.floor((4+8)/2*.35)*1.5+1e-9);assert(e.xp<=4*1.5+1e-9);kill(c,e,false);});c.updateElites(.1);c.checkMinis();assert(m.cleared);
});

test('Old saves with a retired resource mini normalize to one field compound without losing regional progress',()=>{
 const c=fresh();c.enter('highlands');const s=c.snapshot(),z=s.zones.highlands,field=z.minis[0];
 z.minis.push({id:'resource-highlands',type:'resource',family:null,site:'ore',name:'Abandoned quarry works',x:1100,y:650,cleared:true,trapPosts:[]});
 z.npcs.push({id:'mini-resource-highlands',name:'Abandoned quarry works',kind:'mini',mini:'resource-highlands',x:1080,y:630,icon:'🏚️'});
 z.props.push({id:'mini-wall-resource-highlands-0',x:1000,y:650,r:27,structure:'stonewall',mini:'resource-highlands'});
 delete z.resourceMiniRetiredVersion;delete z.minisVersion;
 s.normal.ridge=true;s.victories['ridge:normal']=true;s.rescued.ridge=true;s.keys.ridge=true;s.gathered.highlands=363;
 const r=C.restore(s),rz=r.zone();assert.equal(rz.minis.length,1);assert.equal(rz.minis[0].id,field.id);assert(rz.minis[0].cleared,'proven field progress remains cleared');assert(!rz.npcs.some(n=>n.mini==='resource-highlands'));assert(!rz.props.some(p=>p.mini==='resource-highlands'));assert.equal(r.s.gathered.highlands,363);assert.equal(rz.nodes.reduce((sum,n)=>sum+n.amount,0),277);
 const next=C.restore(r.snapshot());assert.deepEqual(next.zone().minis,rz.minis);
});

test('Outdoor mini traps belong only to the field compound and stop after it is cleared',()=>{
 const map={vale:'crypt',march:'archive',highlands:'mine',frontier:'abyss',crown:'citadel'};
 for(const region of Object.keys(map)){const c=fresh();c.enter(region);const z=c.zone(),m=z.minis[0],cfg=C.rules.outdoorMiniTrapTuning[region],indoor=C.rules.dungeonTrapTuning[map[region]],traps=c.traps();assert.deepEqual(cfg,indoor);assert(traps.length>=1,region+' field-compound trap');assert(traps.every(t=>t.miniId===m.id&&t.cycleLength===cfg.cycle&&t.damageFraction===cfg.damage&&t.warningTime===cfg.warning));const t=traps[0];z.clock=(cfg.warning+.1-t.index*cfg.offset+cfg.cycle*30)%cfg.cycle;Object.assign(c.hero,{x:t.x,y:t.y});const hp=c.hero.hp;c.updateTraps(.1);assert(c.hero.hp<hp,region+' trap damages');for(const e of z.enemies.filter(e=>e.mini===m.id))kill(c,e);if(z.enemies.some(e=>e.family===m.family&&e.hp>0)){const b=z.enemies.find(e=>e.family===m.family&&e.hp>0);kill(c,b);}c.checkMinis();assert(!c.traps().some(t=>t.miniId===m.id));}
});

test('Side interiors replace failed resource-mini locations without becoming boss or gathering dungeons',()=>{
 const expected={vale:'Old Orchard Cellars',march:'Drowned Watchhouse',highlands:'Old Signal Keep',frontier:'Ruined Shrine',crown:'Ruined Foundry'};
 for(const [region,name]of Object.entries(expected)){const c=fresh();c.enter(region);const cfg=C.rules.sideDungeons.find(s=>s.region===region),entrance=c.zone().npcs.find(n=>n.family===cfg.id);assert(cfg&&entrance&&entrance.name===name);Object.assign(c.hero,entrance);assert(c.interact(entrance));assert.equal(c.zoneId,cfg.id);assert.equal(c.zone().nodes.length,0);assert(!c.zone().enemies.some(e=>e.type==='boss'));assert(!c.zone().npcs.some(n=>n.kind==='cage'));assert(c.zone().enemies.every(e=>e.species===cfg.species));assert(c.traps().length>=3);}
});

test('Peace leaves tribute recoverable without paying an unearned field-compound quest',()=>{
 const c=fresh();assert(c.s.quests['quest-0'].active);c.s.keys.thorn=true;c.rescue('thorn');c.trainExpedition('thorn');for(const b of C.data.bosses)c.victory(b.id,'normal');for(const id of ['darklord',...C.dungeonIds])c.victory(id,'true');c.checkEnding();assert(c.s.quests['quest-0'].closedByPeace);c.checkQuests();assert(!c.claim('quest-0'));const node=c.visibleResourceNodes()[0];assert(node&&c.gather(node.id));assert(!c.traps().length);
});

test('Malformed field-compound saves are rejected',()=>{for(const mutate of [s=>s.zones.vale.minis[0].id='bad',s=>s.zones.vale.minis[0].cleared='yes',s=>s.zones.vale.minis[0].trapPosts=[{x:NaN,y:1,kind:'spikes',index:100}]]){const s=fresh().snapshot();mutate(s);assert.throws(()=>C.restore(s));}});

console.log(passed+' field-compound, stronghold and side-interior scenarios passed.');
