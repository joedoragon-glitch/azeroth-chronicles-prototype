'use strict';
const assert=require('node:assert/strict'),C=require('../src/prototype/engine.js');let passed=0;
const fresh=(cls='paladin',mode='normal',opts={})=>new C(mode,cls,()=>.9,opts);
const boss=c=>c.zone().enemies.find(e=>e.type==='boss');
const kill=(c,e)=>{e.heroParticipated=true;e.hp=0;c.kill(e);};
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){process.exitCode=1;console.error('FAIL '+name+' '+e.stack);}}
test('F01 normal-normal-TRUE cycle uses the five-second remote transition and leaves one normal field boss',()=>{const c=fresh(),e=boss(c);c.zone().enemies=[e];kill(c,e);c.updateEnemies(121);kill(c,e);c.updateElites(4.9);assert(!c.zone().enemies.some(x=>x.form==='true'&&x.hp>0));c.updateElites(.2);const t=c.zone().enemies.find(x=>x.form==='true'&&x.hp>0);assert(t);kill(c,t);c.updateEnemies(121);assert.equal(c.zone().enemies.filter(x=>x.hp>0&&!x.summon).length,1);});
test('F02 sealed boss resets and no attack shape damages through terrain',()=>{const c=fresh(),e=boss(c);c.s.party=[];c.zone().enemies=[e];Object.assign(e,{x:1100,y:1000,home:{x:1100,y:1000}});Object.assign(c.hero,{x:1300,y:1000});c.zone().props.push({x:1100,y:930,r:45},{x:1100,y:1070,r:45},{x:1030,y:1000,r:45});c.engage(e);const hp=c.hero.hp;for(const kind of ['circle','line','cone','sector'])c.resolveArea(e,{kind,x:1300,y:1000,fromX:1100,fromY:1000,angle:0,radius:400,coefficient:1});assert.equal(c.hero.hp,hp);const original=c.follow;c.follow=()=>false;for(let i=0;i<140;i++)c.updateEnemies(.1);c.follow=original;assert(c.s.statistics.events.some(x=>x.type==='reset'));assert(!e.aggro);});
test('F03 TRUE crypt volleys stagger and family follow-ups retain full warnings',()=>{for(const [id,index]of [['crypt',1],['archive',1],['mine',1],['abyss',0]]){const c=fresh();c.enter(id);const e=c.bossEnemy(c.boss(id),'true',{x:1050,y:1100});c.zone().enemies=[e];Object.assign(c.hero,{x:1200,y:1100});e.attackIndex=0;c.startAttack(e,c.hero,index);if(id==='crypt'){c.resolveAttack(e);assert.deepEqual(c.s.projectiles.map(x=>x.delay),[0,.35,.7]);assert.equal(c.s.hazards.length,0);}else{assert(e.sequence.length);assert(e.sequence.every(a=>a.timer>=1.5));if(id==='abyss')assert(e.sequence.some(a=>a.kind==='circle'&&a.persistent));}}});
test('F04 rejects fractional equipment and missing Nightmare victory records before restore',()=>{const c=fresh('mage','nightmare');for(const mutate of [s=>s.hero.weapon=.5,s=>delete s.victories,s=>delete s.pending]){const s=c.snapshot();mutate(s);assert.throws(()=>C.restore(s));}C.restore(c.snapshot());});
test('F06 class effects retain ice, double shot, haste, distinct burst and final protection',()=>{for(const cls of ['mage','ranger','paladin']){const c=fresh(cls),e=c.makeEnemy({name:'fixture',species:'goblin',level:1,hp:10000,damage:1,gold:0,xp:0},{x:350,y:350});c.zone().enemies=[e];c.hero.skills=Array(8).fill(1);c.hero.maxMp=c.hero.mp=1000;c.cast(2,e.id);assert.equal(c.s.projectiles.length,cls==='ranger'?2:cls==='mage'?1:0);for(let i=0;i<10;i++)c.updateProjectiles(.1);if(cls==='mage')assert.equal(e.slow,4);c.cast(6,e.id);if(cls==='ranger')assert(c.hero.haste>0);c.hero.hp=1;c.cast(8,e.id);assert(c.hero.hp>1);assert(c.hero.immune>=3);}});
test('F07 fortress objective requires both Crown specialists and night observation needs its site',()=>{const c=fresh();c.enter('crown');c.accept('quest-29');c.discover('port');assert(!c.s.quests['quest-29'].done);c.discover('fortress-gate');assert(!c.s.quests['quest-29'].done,'fortress gate alone does not bypass the two Crown specialist rescues');c.s.keys.cindermaw=true;assert(c.rescue('cindermaw'));assert(!c.s.quests['quest-29'].done,'Vera alone is not enough');c.s.keys.citadel=true;assert(c.rescue('citadel'));assert(c.s.quests['quest-29'].done,'both Crown specialists plus the fortress gate complete the approach');c.enter('march');c.accept('quest-10');c.s.clock=500;c.updateNight();c.s.quests['quest-10'].count=2;c.checkQuests();assert(!c.s.quests['quest-10'].done);c.discover('night-site');assert(c.s.quests['quest-10'].done);});
test('F08 barracks queues create reserves beyond the active cap without losing paid recruits',()=>{const c=fresh();c.hero.gold=10000;c.s.rescued.thorn=true;c.trainExpedition('thorn');c.zone().buildings.push({id:'test',x:300,y:350,progress:4,queue:0,queueType:null,full:false,upgradeProgress:0,upgradePaid:false});for(let i=0;i<5;i++){assert(c.train('test'));c.updateParty(4.1);}assert.equal(c.rosterCount(),7);assert.equal(c.activeParty().length,3);assert.equal(c.s.party.filter(u=>u.active===false).length,4);c.s.party[0].hp=0;const g=c.hero.gold;assert(c.recover());assert.equal(c.hero.gold,g-40);assert.equal(c.rosterCount(),7);});
test('F09 companion presence prevents patrol respawn',()=>{const c=fresh(),e=c.zone().enemies.find(e=>e.pack),members=c.zone().enemies.filter(x=>x.pack===e.pack);members.forEach(x=>kill(c,x));Object.assign(c.s.party[0],e.home);Object.assign(c.hero,{x:300,y:350});c.updatePacks(61);assert(members.every(x=>x.hp===0));});
test('F10 minor refuge survives death and reload',()=>{const c=fresh();Object.assign(c.hero,{x:900,y:700});c.rest();const r=C.restore(c.snapshot());r.die();assert.deepEqual([r.hero.x,r.hero.y],[900,700]);});
test('F11 Succession preserves a recovery crossing after paid outward travel',()=>{const c=fresh('paladin','normal',{succession:true});c.hero.gold=25;assert(c.travel(1));c.die();c.successor('mage');assert(c.travel(1));assert.equal(c.hero.gold,0);});
test('F12 ranged basics aim and fire faster while remaining dodgeable and terrain-blocked',()=>{const c=fresh();c.enter('frontier');const e=c.zone().enemies.find(e=>e.species==='archer');c.s.party=[];c.zone().enemies=[e];Object.assign(e,{x:1600,y:750,home:{x:1600,y:750}});Object.assign(c.hero,{x:1760,y:750});c.engage(e);const hp=c.hero.hp;c.updateEnemies(.1);assert(e.rangedAim);assert.equal(e.rangedAim.timer,C.rules.rangedEnemyCombat.aimTime);for(let i=0;i<4;i++)c.updateEnemies(.1);assert(c.s.projectiles.length);assert.equal(c.hero.hp,hp);const p=c.s.projectiles[0];assert.equal(p.speed,e.shotSpeed*C.rules.rangedEnemyCombat.projectileMultiplier);assert.equal(e.cd,C.rules.rangedEnemyCombat.cooldown);c.zone().props.push({x:p.x+p.dx*35,y:p.y+p.dy*35,r:24});c.updateProjectiles(.3);assert.equal(c.s.projectiles.length,0);assert.equal(c.hero.hp,hp);const b=c.bossEnemy(c.boss('crypt'),'normal',{x:1000,y:1000});b.attackIndex=0;c.zone().enemies=[b];Object.assign(c.hero,{x:1200,y:1000});c.startAttack(b,c.hero,1);c.resolveAttack(b);assert.equal(c.s.projectiles[0].speed,260*C.rules.enemyProjectileMultiplier);});
test('F13 boss specials chain rapidly while warnings stay authored and every fourth special yields one fast basic',()=>{const c=fresh(),e=boss(c);c.s.party=[];c.zone().enemies=[e];Object.assign(c.hero,{x:e.x+60,y:e.y,maxHp:100000,hp:100000});c.engage(e);e.attackIndex=2;c.startAttack(e,c.hero,2);const warning=e.telegraph.total,hp=c.hero.hp;c.resolveAttack(e);assert(Math.abs(hp-c.hero.hp-7.2)<1e-8);assert.equal(warning,1.2);e.telegraph.timer=0;c.updateEnemies(.1);assert.equal(e.cd,.25);assert.equal(e.basicDue,false);e.cd=0;c.updateEnemies(.1);assert(e.telegraph,'boss immediately begins another warned special');e.telegraph=null;e.motion=null;e.sequence=[];e.attackIndex=3;e.cd=0;e.basicDue=false;c.startAttack(e,c.hero,3);e.telegraph.timer=0;c.updateEnemies(.1);assert(e.basicDue,'fourth special schedules one basic');e.cd=0;c.updateEnemies(.1);assert.equal(e.telegraph,null);assert.equal(e.basicDue,false);assert.equal(e.cd,.75);assert.equal(C.rules.bossCadence.specialRange,600);});
test('F14 pounce moves to its mark, mine openings increase output, and Dark Lord Crown phase becomes weighted rather than scripted',()=>{const c=fresh(),e=boss(c);c.zone().props=[];c.s.party=[];c.zone().enemies=[e];Object.assign(c.hero,{x:e.x+150,y:e.y});e.attackIndex=0;c.startAttack(e,c.hero,1);const mark={x:e.telegraph.x,y:e.telegraph.y};c.resolveAttack(e);for(let i=0;i<10&&e.motion;i++)c.advanceMotion(e,.1);assert(Math.hypot(e.x-mark.x,e.y-mark.y)<20);c.enter('mine');const m=boss(c);Object.assign(c.hero,c.safe(m.x-60,m.y));m.open=0;const h=m.hp;c.damage(m,100);const closed=h-m.hp;m.open=3;const h2=m.hp;c.damage(m,100);assert(m.hp<h2-closed);c.enter('crown');const d=c.bossEnemy(c.boss('darklord'),'normal',{x:3250,y:3200});c.zone().enemies=[d];const crownRangeTarget={x:d.x+210,y:d.y};d.hp=d.maxHp*.8;assert.equal(c.bossAttackWeights(d,crownRangeTarget)[3],0);d.hp=d.maxHp*.4;const low=c.bossAttackWeights(d,crownRangeTarget);assert(low[3]>0);d.lastAttackIndex=3;assert.equal(c.bossAttackWeights(d,c.hero)[3],0,'Crown phase cannot immediately repeat itself');});
test('F16 arrival failure rolls back fare, ticket and destination even after mutation',()=>{const c=fresh();c.hero.gold=25;const before=c.snapshot();c.enter=()=>{c.s.zone='march';c.hero.gold=0;throw Error('arrival');};assert(!c.travel(1));assert.deepEqual(c.snapshot(),before);});
test('F17 idle night health preserves fraction; F19 full barracks are valid resource deposits',()=>{const c=fresh(),e=c.zone().enemies.find(x=>x.type==='mob');c.zone().enemies=[e];e.hp=e.baseHp/2;c.s.clock=500;c.updateEnemies(.1);assert(Math.abs(e.hp/e.maxHp-.5)<1e-9);assert(e.maxHp>e.baseHp);c.s.rescued.ridge=true;while(c.s.expeditionRank<4)c.trainExpedition('ridge');c.hero.gold=1000;assert(c.build());const b=c.zone().buildings.at(-1);for(let i=0;i<50;i++)c.updateParty(.1);assert.equal(b.full,false,'Rank 4 build still starts Basic');assert(c.upgradeBarracks(b.id));for(let i=0;i<50;i++)c.updateParty(.1);assert(b.full,'deposit behavior requires the optional Full upgrade');const u=c.activeLivingParty()[0];Object.assign(u,{x:b.x+10,y:b.y+10,carry:35,order:{type:'deposit'}});const g=c.hero.gold;c.updateParty(.1);assert.equal(c.hero.gold,g+35);});
test('F20 legacy region and regional buildings survive while retired potion stock is safely discarded',()=>{const legacy={version:2,activeRegion:'world',player:{heroClass:'mage',level:7,gold:500,wx:3200,maxHp:500,hp:10,maxMp:500,mp:10},inventory:['Arma de las Cumbres','Tónico de las Cumbres','Éter de las Cumbres','Poción de Maná Grande'],squad:{buildings:[{wx:2250,wy:1000,progress:4,queue:0}],units:[],nodes:[]}};const c=C.migrate(legacy);assert.equal(c.zoneId,'crown');assert.equal(c.s.zones.frontier.buildings.length,1);assert(c.equipLegacy('Arma de las Cumbres'));assert.equal(c.power(),c.hero.power+70);assert(!c.equipLegacy('unknown'));assert.deepEqual(c.hero.potions,{health:0,mana:0,greater_health:0,greater_mana:0});assert.deepEqual(c.hero.legacyPotions,[],'legacy potion inventory is retired without affecting the rest of the save');assert(Math.abs(c.hero.mp-2.6)<1e-9,'legacy MP percentage is normalized to the new curve');const restored=C.restore(c.snapshot());assert.equal(restored.zoneId,'crown');assert.equal(restored.s.zones.frontier.buildings.length,1);});
test('F21 area kill sequence is independent of enemy array order',()=>{const outcomes=[];for(const reverse of [false,true]){const c=fresh();c.hero.skills[4]=1;const a=['goblin','goblin','skeleton'].map((species,i)=>c.makeEnemy({species,name:species,level:1,hp:1,damage:1,gold:0,xp:0},{x:350+i*10,y:350}));c.zone().enemies=reverse?a.reverse():a;c.cast(5);outcomes.push({streak:c.s.streak,pending:Object.keys(c.s.pending)});}assert.deepEqual(outcomes[0],outcomes[1]);});
test('F23 every authored landmark is reachable, towns have solid structures and dungeon walls differ',()=>{const wallSignatures=[];for(const r of C.data.regions){const c=fresh();c.enter(r.id);const z=c.zone();assert(z.props.some(p=>p.roadBlocker),'regional settlement keeps solid street-defining structures');assert(z.props.some(p=>String(p.id).startsWith('settlement-')&&p.roadBlocker&&!/(?:fence|wall|boardwalk|palisade)$/.test(String(p.structure))),'regional settlement keeps inhabited region-specific buildings');for(const n of z.npcs.filter(n=>n.kind==='landmark')){assert(!c.blocked(n.x,n.y));assert(c.route(c.hero,n).length,r.id+' '+n.name);}}for(const id of C.dungeonIds){const c=fresh();c.enter(id);wallSignatures.push(Array.from({length:100},(_,i)=>c.blocked(600+(i%10)*35,250+Math.floor(i/10)*110,c.zoneId,0)).join());assert(c.route(c.hero,boss(c)).length);}assert(new Set(wallSignatures).size>=3);});
test('F24 tactical foundation enables AI while keeping burst compression inactive',()=>{const c=fresh(),e=boss(c),cfg=C.rules.tacticalFoundation;assert.equal(cfg.enabled,true);assert.equal(cfg.burstCompression.enabled,false);c.zone().enemies=[e];c.s.party=[];Object.assign(c.hero,{x:e.x+100,y:e.y});c.hero.level=e.level-3;assert.equal(c.tacticalRogueEligibility(e,6),false);c.hero.level=e.level+1;assert.equal(c.tacticalRogueEligibility(e,0),true);c.hero.level=e.level;assert.equal(c.tacticalRogueEligibility(e,2),false);e.summonCd=3;assert.equal(c.tacticalRogueEligibility(e,2),true);assert.equal(c.tacticalProtectionTier(e),'boss');});
test('F25 tactical telemetry and extended awareness do not trigger aggro',()=>{const c=fresh(),e=boss(c);const ally=c.makeEnemy({species:'wolf',name:'ally',level:2,hp:100,damage:1,gold:0,xp:0},{x:e.x+620,y:e.y});const distant=c.makeEnemy({species:'wolf',name:'distant',level:2,hp:100,damage:1,gold:0,xp:0},{x:e.x+900,y:e.y});c.zone().enemies=[e,ally,distant];assert(c.tacticalRegroupCandidates(e).includes(ally));assert(!c.tacticalRegroupCandidates(e).includes(distant));assert.equal(ally.aggro,false);c.tacticalRecordHit(e,'hero',12);assert.equal(c.tacticalThreatSnapshot(e)[0].damage,12);assert.equal(e.aggro,false);c.s.time+=7;assert.equal(c.tacticalThreatSnapshot(e).length,0);});
test('F26 threat records expire old hits independently and never carry through travel',()=>{
const c=fresh(),e=boss(c);c.zone().enemies=[e];c.s.party=[];c.s.time=0;c.tacticalRecordHit(e,'hero',100);c.s.time=5;c.tacticalRecordHit(e,'hero',10);assert.equal(c.tacticalThreatSnapshot(e)[0].damage,110);c.s.time=7;assert.equal(c.tacticalThreatSnapshot(e)[0].damage,10,'old damage must expire even after a fresh hit');c.tacticalRecordHit(e,'hero',5);assert.equal(c.tacticalThreatSnapshot(e)[0].damage,15);c.enter('march');assert.deepEqual(c.tacticalThreatSnapshot(e),[],'zone transitions purge cached threat');assert(!Object.hasOwn(c.snapshot(),'_tacticalThreat'),'telemetry is not persisted');
});
test('F27 threat cache cleans up on death and disengagement',()=>{
const c=fresh(),e=c.makeEnemy({species:'wolf',name:'test wolf',level:1,hp:15,damage:2,gold:0,xp:0},{x:500,y:500});c.zone().enemies=[e];c.tacticalRecordHit(e,'hero',10);assert.equal(c.tacticalThreatSnapshot(e).length,1);e.aggro=true;c.disengage(e,.1);assert.deepEqual(c.tacticalThreatSnapshot(e),[]);e.returning=0;e.deathPaid=false;e.hp=0;c.tacticalRecordHit(e,'hero',10);c.kill(e);assert.deepEqual(c.tacticalThreatSnapshot(e),[]);
});
test('F28 non-cunning boss eligibility distinguishes level boundaries and owned support',()=>{
const c=fresh(),e=c.bossEnemy(c.boss('crypt'),'normal',{x:1400,y:1700});c.zone().enemies=[e];Object.assign(c.hero,{x:e.x+100,y:e.y});c.hero.level=e.level;const summon=(i)=>{const u=c.makeEnemy({species:'wolf',name:'summon',level:e.level,hp:10,damage:1,gold:0,xp:0},{x:e.x+50+i*15,y:e.y});u.summon=true;u.owner=e.id;return u;};const a=summon(0),b=summon(1);c.zone().enemies.push(a,b);e.summonCd=3;assert.equal(c.tacticalRogueEligibility(e,2),false,'two owned summons protect an equal-level boss');b.hp=0;assert.equal(c.tacticalRogueEligibility(e,2),true,'one summon plus cooldown permits pressure');e.summonCd=0;assert.equal(c.tacticalRogueEligibility(e,2),false,'ready summon does not permit this exception');e.summonCd=3;assert.equal(c.tacticalRogueEligibility(e,1),false,'one attacker cannot create numerical pressure');c.hero.level=e.level-1;assert.equal(c.tacticalRogueEligibility(e,2),true,'one level stronger enemy remains eligible when pressured');c.hero.level=e.level-2;assert.equal(c.tacticalRogueEligibility(e,2),true);c.hero.level=e.level-3;assert.equal(c.tacticalRogueEligibility(e,9),false,'three levels stronger always disables rogue');c.hero.level=e.level+1;assert.equal(c.tacticalRogueEligibility(e,0),true,'hero level advantage independently enables eligibility');
});
test('F29 regroup assessment finds larger cross-pack groups without engaging them',()=>{
const c=fresh(),e=boss(c);const add=(id,pack,x,y)=>{const u=c.makeEnemy({species:'wolf',name:id,level:1,hp:40,damage:2,gold:0,xp:0},{x,y});u.pack=pack;return u;};const packA=[add('a1','group-a',e.x+500,e.y),add('a2','group-a',e.x+530,e.y),add('a3','group-a',e.x+560,e.y)],packB=[add('b1','group-b',e.x-200,e.y),add('b2','group-b',e.x-230,e.y)],far=add('far','far',e.x+900,e.y);c.zone().enemies=[e,...packA,...packB,far];const groups=c.tacticalRegroupGroups(e);assert.equal(groups[0].key,'group-b','closer allies win over distant larger packs');assert.equal(groups[0].members.length,2);assert.equal(groups[1].key,'group-a');assert.equal(groups[1].members.length,3);assert(!groups.some(g=>g.key==='far'));assert(c.zone().enemies.every(u=>!u.aggro),'awareness must not pull additional packs');
});

test('F30 explicit rogue regroup keeps original home while approaching separate pack and its anchor',()=>{const c=fresh();c.s.party=[];const e=c.makeEnemy({species:'wolf',name:'scout',level:1,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),a=c.makeEnemy({species:'wolf',name:'ally',level:1,hp:100,damage:1,gold:0,xp:0},{x:1950,y:1700});e.pack='scouts';a.pack='second-pack';e.aggro=true;c.zone().enemies=[e,a];Object.assign(c.hero,{x:1400,y:1700,level:3});c.route=()=>[{x:a.x,y:a.y}];c.line=()=>true;c.follow=(unit,goal,speed,dt,stop)=>{unit.x=Math.min(goal.x,unit.x+speed*dt);return true;};const home={...e.home};assert(c.tacticalBeginRogueRegroup(e,a,0));for(let i=0;i<7;i++)c.updateEnemies(.5);assert.equal(c.tacticalRogueRegroup(e)?.phase,'anchored');assert.deepEqual(e.home,home,'regroup must not overwrite respawn home');assert.equal(e.aggro,true);assert.equal(a.aggro,false,'approach alone does not create chain aggro');Object.assign(c.hero,{x:1950,y:1700});c.updateEnemies(.1);assert.equal(e.aggro,true,'being outside original leash must not reset a valid regroup');assert(c.tacticalRogueRegroup(e));const restored=C.restore(c.snapshot());assert.equal(restored.tacticalRogueRegroup(restored.zone().enemies.find(u=>u.id===e.id)),null,'transient retreat anchor cannot survive save restore');});
test('F31 real escape or protected-town approach always ends rogue leash exception',()=>{for(const protectedTown of [false,true]){const c=fresh(),e=c.makeEnemy({species:'wolf',name:'scout',level:1,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),a=c.makeEnemy({species:'wolf',name:'ally',level:1,hp:100,damage:1,gold:0,xp:0},{x:1950,y:1700});c.zone().enemies=[e,a];c.s.party=[];e.aggro=true;c.hero.level=3;Object.assign(c.hero,{x:1400,y:1700});c.route=()=>[{x:a.x,y:a.y}];assert(c.tacticalBeginRogueRegroup(e,a));Object.assign(c.hero,protectedTown?{x:300,y:350}:{x:2600,y:1700});c.updateEnemies(.1);assert(e.returning>0,'escape must trigger normal disengagement');assert.equal(c.tacticalRogueRegroup(e),null);}});
test('F32 rogue regroup rejects blocked or town-crossing routes and forbids retreat chaining',()=>{const c=fresh(),e=c.makeEnemy({species:'wolf',name:'scout',level:1,hp:100,damage:1,gold:0,xp:0},{x:110,y:350}),a=c.makeEnemy({species:'wolf',name:'ally',level:1,hp:100,damage:1,gold:0,xp:0},{x:620,y:350});e.aggro=true;c.s.party=[];c.zone().enemies=[e,a];c.hero.level=3;c.route=()=>[];assert.equal(c.tacticalBeginRogueRegroup(e,a),false,'unreachable regroup cannot start');c.route=()=>[{x:a.x,y:a.y}];assert.equal(c.tacticalBeginRogueRegroup(e,a),false,'route through protected settlement is prohibited');Object.assign(e,{x:1400,y:1700,home:{x:1400,y:1700}});Object.assign(a,{x:1950,y:1700,home:{x:1950,y:1700}});Object.assign(c.hero,{x:1400,y:1700});assert(c.tacticalBeginRogueRegroup(e,a));c.tacticalStopRogueRegroup(e);assert.equal(c.tacticalBeginRogueRegroup(e,a),false,'one regroup per engagement prevents infinite retreat loops');c.tacticalClearRogueRegroup(e);assert(c.tacticalBeginRogueRegroup(e,a));c.tacticalClearRogueRegroup(e);assert.equal(c.tacticalRogueRegroup(e),null);});
test('F33 failed retreat safely expires without suppressing later normal leash',()=>{const c=fresh(),e=c.makeEnemy({species:'wolf',name:'scout',level:1,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),a=c.makeEnemy({species:'wolf',name:'ally',level:1,hp:100,damage:1,gold:0,xp:0},{x:1950,y:1700});c.zone().enemies=[e,a];c.s.party=[];e.aggro=true;Object.assign(c.hero,{x:1400,y:1700,level:3});c.route=()=>[{x:a.x,y:a.y}];c.line=()=>true;assert(c.tacticalBeginRogueRegroup(e,a));c.follow=()=>false;for(let i=0;i<5;i++)c.updateEnemies(.6);assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking','stalled route reconsiders other tactics instead of repeating the same route');assert.equal(c.tacticalBeginRogueRegroup(e,a),false,'failed route cannot immediately repeat the same ally group');Object.assign(c.hero,{x:2600,y:1700});c.updateEnemies(.1);assert(e.returning>0,'normal leash must resume after invalidated retreat');});

test('F34 a single nearby companion is sufficient for a voluntary regroup',()=>{const c=fresh();const e=c.makeEnemy({species:'wolf',name:'solitary',level:1,hp:80,damage:1,gold:0,xp:0},{x:1400,y:1700}),near=c.makeEnemy({species:'wolf',name:'one ally',level:1,hp:80,damage:1,gold:0,xp:0},{x:1520,y:1700}),far=[0,1,2].map(i=>c.makeEnemy({species:'wolf',name:'distant wolf',level:1,hp:80,damage:1,gold:0,xp:0},{x:1950+i*25,y:1700}));for(const f of far)f.pack='distant-pack';e.aggro=true;c.s.party=[];Object.assign(c.hero,{x:e.x,y:e.y,level:2});c.zone().enemies=[e,near,...far];c.route=()=>[{x:near.x,y:near.y}];const groups=c.tacticalRegroupGroups(e);assert.equal(groups[0].members.length,1,'nearest lone ally remains a valid group');assert.equal(groups[0].members[0],near);assert(c.tacticalBeginRogueRegroup(e,near,0),'one ally is sufficient without any 3-member minimum');assert.equal(near.aggro,false,'awareness and route setup do not recruit an ally');});

test('F35 rogue regroup travel halves incoming hero and companion damage only while in transit',()=>{const c=fresh(),e=c.makeEnemy({species:'wolf',name:'regrouper',level:1,hp:1000,damage:1,gold:0,xp:0},{x:1400,y:1700}),ally=c.makeEnemy({species:'wolf',name:'support',level:1,hp:100,damage:1,gold:0,xp:0},{x:1950,y:1700}),archer=c.unit('archer',1400,1700);c.zone().enemies=[e,ally];c.s.party=[archer];e.aggro=true;c.hero.level=3;Object.assign(c.hero,{x:1400,y:1700});c.route=()=>[{x:ally.x,y:ally.y}];c.line=()=>true;assert(c.tacticalBeginRogueRegroup(e,ally));const initial=e.hp;assert(c.damage(e,100));assert.equal(initial-e.hp,50,'hero damage is reduced by 50% during travel');const afterHero=e.hp;assert(c.damage(e,100,archer.id));assert.equal(afterHero-e.hp,50,'companion damage is reduced by 50% during travel');assert.equal(c.tacticalThreatSnapshot(e).reduce((sum,v)=>sum+v.damage,0),100,'threat records actual post-reduction damage');Object.assign(e,{x:1900,y:1700});Object.assign(archer,{x:1900,y:1700});Object.assign(c.hero,{x:1900,y:1700});const atDistance=e.hp;assert(c.damage(e,100,archer.id),'regrouper remains damageable beyond normal home distance');assert.equal(atDistance-e.hp,50,'50% reduction persists through distant portion of valid travel');c.tacticalAdvanceRogueRegroup(e,c.hero,.1);assert.equal(c.tacticalRogueRegroup(e)?.phase,'anchored');const afterArrival=e.hp;assert(c.damage(e,100));assert.equal(afterArrival-e.hp,100,'reduction ends immediately on regroup arrival');c.tacticalStopRogueRegroup(e);const afterStop=e.hp;assert(c.damage(e,100));assert.equal(afterStop-e.hp,100,'cancelled regroup grants no lingering resistance');});
test('F36 rogue damage protection is never active for normal engaged enemies',()=>{const c=fresh(),e=c.makeEnemy({species:'wolf',name:'ordinary wolf',level:1,hp:1000,damage:1,gold:0,xp:0},{x:1400,y:1700});c.zone().enemies=[e];e.aggro=true;Object.assign(c.hero,{x:1400,y:1700,level:3});c.line=()=>true;const hp=e.hp;assert(c.damage(e,120));assert.equal(hp-e.hp,120,'normal combat damage remains unchanged');});

test('F37 all normal and TRUE boss families preserve warnings while gaining modest reach',()=>{
  const R=C.rules,scale=R.bossCadence.areaRangeMultiplier;
  assert.equal(scale,1.15);assert.equal(R.bossCadence.specialRange,600);
  for(const def of C.data.bosses)for(const form of ['normal','true']){
    const c=fresh(),e=c.bossEnemy(def,form,{x:1100,y:1250});
    c.zone().enemies=[e];c.s.party=[];c.line=()=>true;
    Object.assign(c.hero,{x:e.x+160,y:e.y,maxHp:100000,hp:100000});
    for(let i=0;i<R.attacks[def.id].length;i++){
      const plan=R.attacks[def.id][i];
      assert(c.startAttack(e,c.hero,i),def.id+' '+form+' explicit move can begin');
      const a=e.telegraph;
      assert.equal(a.total,plan.warning,def.id+' '+form+' keeps warning time');
      assert.equal(a.recovery,plan.recovery,def.id+' '+form+' keeps recovery time');
      const kind=plan.kind==='sector'&&e.hp>e.maxHp*.5?'cone':plan.kind;
      if(kind==='cone')assert.equal(a.radius,165*scale,def.id+' '+form+' cone');
      if(kind==='sector')assert.equal(a.radius,280*scale,def.id+' '+form+' sector');
      if(kind==='ring'){
        c.s.hazards=[];c.resolveAttack(e);
        assert.equal(c.s.hazards.at(-1).life,R.combatGeometry.ringLife*scale,def.id+' '+form+' actual expanding ring duration');
      }
      if(a.count>1&&kind==='circle'){
        assert.equal(c.attackPatches(a)[0].radius,75*scale,def.id+' '+form+' multi-target reach');
      }
    }
  }
});
test('F38 all captains reject useless distant cones but can still threaten a ranged opponent',()=>{
  const R=C.rules,scale=R.bossCadence.areaRangeMultiplier;
  const older={'supply-vale':420,'supply-march':390,'supply-highlands':430,'supply-crown':440,'frontier-overseer':440};
  for(const [key,oldRange] of Object.entries(older)){
    const c=fresh(),zone=key==='frontier-overseer'?'frontier':key;
    c.enter(zone);c.s.party=[];c.line=()=>true;
    const e=c.zone().enemies.find(u=>u.captainProfile===key && (u.captain||u.roomCaptain));
    assert(e,key+' captain exists');
    const cfg=R.roomCaptains[key];assert(cfg.specialRange>oldRange,key+' activation increased');
    e.captainOpeningSummon=true;c.random=()=>0;
    const far={x:e.x+cfg.specialRange-8,y:e.y};
    assert(c.startCaptainAttack(e,far),key+' has a viable distant special');
    assert.notEqual(e.telegraph.kind,'cone',key+' cannot waste distant cone');
    const cone=cfg.attacks.find(p=>p.kind==='cone');
    if(cone){
      // Even a currently unused close cone gains a measurable but bounded reach.
      assert((cone.radius||145)*scale<(cfg.specialRange-8),key+' melee cone remains distinct from acquisition range');
    }
  }
});
test('F39 boss selection respects actual ring reach, anti-repeat fallbacks and Dark Lord phases',()=>{
  const c=fresh(),R=C.rules,ringReach=R.combatGeometry.ringSpeed*R.combatGeometry.ringLife*R.bossCadence.areaRangeMultiplier;
  const m=c.bossEnemy(c.boss('mine'),'normal',{x:1100,y:1200});
  c.zone().enemies=[m];c.s.party=[];c.line=()=>true;m.lastAttackIndex=-1;
  assert(ringReach>R.combatGeometry.ringSpeed*R.combatGeometry.ringLife);
  assert(c.bossAttackWeights(m,{x:m.x+320,y:m.y})[2]>0,'wave is available inside actual sweep');
  assert.equal(c.bossAttackWeights(m,{x:m.x+380,y:m.y})[2],0,'wave not selected beyond actual sweep');
  const thorn=c.bossEnemy(c.boss('thorn'),'normal',{x:1100,y:1200});
  c.zone().enemies=[thorn];thorn.summonCd=100;
  assert.equal(c.bossAttackWeights(thorn,{x:thorn.x+400,y:thorn.y})[0],0,'short bite excluded at range');
  assert.equal(c.chooseBossAttack(thorn,{x:thorn.x+620,y:thorn.y}),-1,'no imaginary long-distance melee');
  assert.equal(c.startAttack(thorn,{x:thorn.x+620,y:thorn.y}),false,'invalid selection does not start a telegraph');
  const lord=c.bossEnemy(c.boss('darklord'),'normal',{x:1100,y:1200});
  c.zone().enemies=[lord];lord.summonCd=100;lord.lastAttackIndex=1;lord.hp=lord.maxHp*.8;
  assert.equal(c.chooseBossAttack(lord,{x:lord.x+440,y:lord.y}),1,'repeat the only usable special rather than wasting a cone');
  lord.hp=lord.maxHp*.4;lord.lastAttackIndex=-1;
  assert(c.bossAttackWeights(lord,{x:lord.x+240,y:lord.y})[3]>0,'Crown sector available at low health');
});
test('F40 distant follow-up combos cannot materialize short-range arcs on backline',()=>{
  const c=fresh();c.random=()=>0;c.line=()=>true;c.s.party=[];
  const e=c.bossEnemy(c.boss('darklord'),'normal',{x:1100,y:1200});
  c.zone().enemies=[e];e.hp=e.maxHp*.8;
  Object.assign(c.hero,{x:e.x+440,y:e.y});
  assert(c.startAttack(e,c.hero,1));assert(!e.sequence.some(a=>a.kind==='cone'),'distant bombardment cannot chain ineffective cleave');
  Object.assign(c.hero,{x:e.x+140,y:e.y});
  assert(c.startAttack(e,c.hero,1));assert(e.sequence.some(a=>a.kind==='cone'),'same authored combo remains available in melee range');
});
test('F41 backline targeting preserves close-attack geometry and terrain checks',()=>{
  const c=fresh(),e=c.bossEnemy(c.boss('ridge'),'normal',{x:1100,y:1200});
  c.zone().enemies=[e];c.s.party=[];
  const front={x:e.x+100,y:e.y};
  Object.assign(c.hero,{x:e.x+420,y:e.y});
  c.line=()=>true;
  assert.equal(c.bossAttackTarget(e,front,0),front,'short-range strike does not warp to distant hero');
  assert.equal(c.bossAttackTarget(e,front,1),c.hero,'ranged circle can pressure hero behind frontline');
  c.line=()=>false;
  assert.equal(c.bossAttackTarget(e,front,1),front,'cover blocks forced hero marks');
});
test('F42 captain ground marks pressure backline only with a clear targeting line',()=>{
  const c=fresh();c.enter('supply-highlands');const e=c.zone().enemies.find(u=>u.roomCaptain);
  assert(e);c.s.party=[];
  const frontline={x:e.x+90,y:e.y};
  Object.assign(c.hero,{x:e.x+360,y:e.y});
  c.random=()=>0;c.line=()=>true;e.lastCaptainAttack=0;
  assert(c.startCaptainAttack(e,frontline));
  assert.equal(e.telegraph.kind,'circle');
  assert.equal(e.telegraph.x,c.hero.x);
  assert.equal(e.telegraph.radius,86*C.rules.bossCadence.areaRangeMultiplier);
  c.line=(a,b)=>b!==c.hero;e.lastCaptainAttack=0;
  assert(c.startCaptainAttack(e,frontline));
  assert.equal(e.telegraph.x,frontline.x,'blocked hero must not be targeted through cover');
});

test('F43 real target pressure counts active companions, not nearby idle party members',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'test wolf',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700});
  const soldier=c.unit('soldier',1450,1700),archer=c.unit('archer',1470,1700);
  c.zone().enemies=[e];c.s.party=[soldier,archer];
  Object.assign(c.hero,{level:2,x:1400,y:1700});e.aggro=true;c.line=()=>true;
  assert.equal(c.tacticalActiveTargetCount(e),0,'nearby heroes and companions alone do not create numerical pressure');
  c.s.heroTarget=e.id;assert.equal(c.tacticalActiveTargetCount(e),0,'old target ID alone is not active hero intent');c.hero.order={type:'attack',id:e.id};assert.equal(c.tacticalActiveTargetCount(e),1);
  c._tacticalPartyTargets=new Map([[soldier.id,e.id]]);assert.equal(c.tacticalActiveTargetCount(e),2);
  assert(c.tacticalRogueEligibility(e,c.tacticalActiveTargetCount(e)),'equal-level pressured mob is eligible');
  soldier.order={type:'gather',id:'some-node'};assert.equal(c.tacticalActiveTargetCount(e),1,'busy companion cannot contribute target pressure');
  soldier.order=null;c.s.recallActive=true;assert.equal(c.tacticalActiveTargetCount(e),1,'recall cancels active focus');
  c.s.recallActive=false;c.hero.level=1;e.level=4;assert.equal(c.tacticalRogueEligibility(e,3),false,'level +3 protection dominates pressure');
});
test('F44 autonomous rogue initiation finds a single ally across packs without chained aggro',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'lone wolf',level:1,hp:120,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    ally=c.makeEnemy({species:'wolf',name:'near wolf',level:1,hp:120,damage:1,gold:0,xp:0},{x:1700,y:1700}),
    other=c.makeEnemy({species:'wolf',name:'remote member',level:1,hp:120,damage:1,gold:0,xp:0},{x:2050,y:1700});
  c.zone().enemies=[e,ally,other];c.s.party=[];Object.assign(c.hero,{x:1400,y:1700,level:3});
  e.pack='lone';ally.pack='ally-pack';other.pack='ally-pack';e.aggro=true;c.line=()=>true;c.route=()=>[{x:ally.x,y:ally.y}];
  assert(c.tacticalAutoRogue(e,c.hero));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,1));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'travel');
  assert.equal(ally.aggro,false);assert.equal(other.aggro,false);
  assert(!c.tacticalAutoRogue(e,c.hero),'one retreat decision per engagement');
  assert(C.rules.tacticalFoundation.burstCompression.enabled===false);
});
test('F45 arrived rogue recruits only immediate support and executes one low damage telegraphed feint',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'regrouper',level:1,hp:180,damage:12,gold:0,xp:0},{x:1400,y:1700}),
    ally=c.makeEnemy({species:'wolf',name:'friend',level:1,hp:180,damage:6,gold:0,xp:0},{x:1650,y:1700}),
    remote=c.makeEnemy({species:'wolf',name:'far friend',level:1,hp:180,damage:6,gold:0,xp:0},{x:2180,y:1700});
  c.s.party=[];c.zone().enemies=[e,ally,remote];e.aggro=true;ally.pack=remote.pack='third-pack';
  Object.assign(c.hero,{x:1400,y:1700,level:3,hp:100,maxHp:100});c.line=()=>true;c.route=()=>[{x:ally.x,y:ally.y}];
  assert(c.tacticalBeginRogueRegroup(e,ally));
  Object.assign(e,{x:1640,y:1700});Object.assign(c.hero,{x:1640,y:1700});
  c.tacticalAdvanceRogueRegroup(e,c.hero,.1);
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'anchored');
  assert(ally.aggro,'nearby support joins after hero pursues to the regroup location');
  assert(!remote.aggro,'far same-pack allies are not chained into the encounter');
  assert(e.telegraph?.rogueMove,'regrouper makes one readable special');
  const hp=c.hero.hp,move=e.telegraph;
  c.tacticalResolveRogueMove(e,move);
  assert(c.hero.hp<hp&&c.hero.hp>hp-5,'rogue move deals only modest damage');
  assert((c.hero.slow||0)>0,'species-appropriate disruption applies without hard stun');
  e.telegraph=null;c.tacticalAdvanceRogueRegroup(e,c.hero,.1);
  assert(!e.telegraph,'rogue move cannot spam inside a single encounter');
  c.disengage(e,.1);assert.equal(c.tacticalRogueRegroup(e),null);
});
test('F46 without allies, rogue tactics use one named move then resume ordinary AI',()=>{
  const c=fresh(),e=c.makeEnemy({species:'goblin',name:'isolated goblin',level:1,hp:150,damage:10,gold:0,xp:0},{x:1400,y:1700});
  c.zone().enemies=[e];c.s.party=[];e.aggro=true;
  Object.assign(c.hero,{x:1450,y:1700,level:3});c.line=()=>true;
  assert(c.tacticalAutoRogue(e,c.hero));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,1));
  assert.equal(c.tacticalRogueRegroup(e),null);
  assert.equal(e.telegraph.name,'Blinding Dust');
  assert.equal(e.telegraph.style,'snare');
  assert(!c.tacticalAutoRogue(e,c.hero),'direct move has a one-engagement latch');
});
test('F47 cunning summoners trigger depleted-support rogue pressure but not level-suppressed',()=>{
  const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700});
  c.zone().enemies=[e];e.aggro=true;e.summonCd=4;Object.assign(c.hero,{x:e.x+100,y:e.y});c.hero.level=e.level;c.line=()=>true;
  assert(c.tacticalRogueEligibility(e,0),'authored cunning boss can respond while unable to resummon');
  e.summonCd=0;assert(!c.tacticalRogueEligibility(e,0),'ready summon does not qualify');
  e.summonCd=4;c.hero.level=e.level-3;assert(!c.tacticalRogueEligibility(e,8),'high level immunity still applies');
  c.hero.level=e.level;const u=c.makeEnemy({species:'wolf',name:'summon',level:e.level,hp:15,damage:1,gold:0,xp:0},{x:e.x+20,y:e.y});u.summon=true;u.owner=e.id;const v={...u,id:'second-summon',hp:15};c.zone().enemies.push(u,v);
  assert(!c.tacticalRogueEligibility(e,0),'two surviving owned summons block rogue condition');
});

test('F48 named rogue attacks prioritize actual high-threat archer over a closer hero',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'ambusher',level:2,hp:300,damage:12,gold:0,xp:0},{x:1400,y:1700}),
    archer=c.unit('archer',1510,1700);c.zone().enemies=[e];c.s.party=[archer];
  Object.assign(c.hero,{x:1450,y:1700,level:3});e.aggro=true;c.line=()=>true;
  c.s.time=1;c.tacticalRecordHit(e,'hero',20);c.tacticalRecordHit(e,archer.id,85);
  assert.equal(c.tacticalHighestThreatTarget(e,c.hero),archer);
  assert(c.tacticalRogueMove(e,c.hero));
  assert.equal(e.telegraph.targetId,archer.id,'a high-damage archer can be the tactical target');
  assert.equal(e.telegraph.name,'Flanking Snap');
  e.telegraph=null;c.s.time=8;
  assert.equal(c.tacticalHighestThreatTarget(e,c.hero),c.hero,'expired threat no longer outweighs nearest fallback');
});
test('F49 TRUE bosses remain protected by the three-level immunity and no burst compression',()=>{
  const c=fresh(),b=c.boss('thorn'),e=c.bossEnemy(b,'true',{x:1400,y:1700});
  c.zone().enemies=[e];Object.assign(c.hero,{x:1450,y:1700,level:e.level-3});
  c.line=()=>true;e.aggro=true;c.s.time=10;
  assert.equal(c.tacticalProtectionTier(e),'trueBoss');
  assert.equal(c.tacticalRogueEligibility(e,7),false);
  assert.equal(c.tacticalAutoRogue(e,c.hero),false,'rogue immunity holds even if pressured by seven attackers');
  assert.equal(C.rules.tacticalFoundation.burstCompression.enabled,false,'phase-three defense remains disabled');
});
test('F50 interrupted rogue retreat sheds its protection and cannot chain',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'retreater',level:1,hp:1000,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    ally=c.makeEnemy({species:'wolf',name:'backup',level:1,hp:100,damage:1,gold:0,xp:0},{x:1650,y:1700});
  c.zone().enemies=[e,ally];c.s.party=[];e.aggro=true;c.line=()=>true;
  Object.assign(c.hero,{x:1420,y:1700,level:3});c.route=()=>[{x:ally.x,y:ally.y}];
  assert(c.tacticalBeginRogueRegroup(e,ally));
  const start=e.hp;assert(c.damage(e,100));assert.equal(start-e.hp,50);
  ally.hp=0;c.tacticalAdvanceRogueRegroup(e,c.hero,.1);
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking','dead support triggers another tactical evaluation');
  const after=e.hp;assert(c.damage(e,100));assert.equal(after-e.hp,50,'re-evaluating a failed retreat retains temporary protection');
  ally.hp=100;
  assert.equal(c.tacticalBeginRogueRegroup(e,ally),false,'unlimited retry is prohibited even when the ally returns');
});

test('F51 wounded ordinary, guardian and ringleader mobs gain independent rogue eligibility below 30%',()=>{
  const c=fresh();c.s.party=[];c.line=()=>true;c.hero.level=2;
  for(const tier of ['ordinary','guardian','ringleader']){
    const e=c.makeEnemy({species:'wolf',name:tier,level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700});
    if(tier==='guardian')e.guard=true;
    if(tier==='ringleader')e.form='ringleader';
    e.aggro=true;c.zone().enemies=[e];Object.assign(c.hero,{x:1430,y:1700});
    assert.equal(c.tacticalRogueEligibility(e,0),false,tier+' healthy solo mob does not need to withdraw');
    e.hp=30;assert.equal(c.tacticalRogueWounded(e),false,tier+' 30% exact threshold does not fire');
    e.hp=29;assert.equal(c.tacticalRogueWounded(e),true,tier+' below 30% is a disadvantage');
    assert.equal(c.tacticalRogueEligibility(e,0),true,tier+' wounded solo can request allies');
    c.hero.level=e.level-3;assert.equal(c.tacticalRogueEligibility(e,3),false,tier+' stronger-by-three immune even wounded');
    c.hero.level=e.level;
  }
});
test('F52 wound trigger excludes bosses and captains and never activates tiered burst compression',()=>{
  const c=fresh();c.s.party=[];c.line=()=>true;
  const bossUnit=c.bossEnemy(c.boss('crypt'),'normal',{x:1400,y:1700});
  const captain=c.makeEnemy({species:'wolf',name:'captain',level:3,hp:100,damage:1,gold:0,xp:0},{x:1450,y:1700});
  captain.roomCaptain=true;
  const ordinary=c.makeEnemy({species:'wolf',name:'summoned mob',level:3,hp:100,damage:1,gold:0,xp:0},{x:1470,y:1700});
  ordinary.summon=true;
  for(const e of [bossUnit,captain,ordinary]){e.hp=e.maxHp*.29;assert.equal(c.tacticalRogueWounded(e),e===ordinary);}
  assert.equal(C.rules.tacticalFoundation.burstCompression.enabled,false);
});
test('F53 wounded monster thinks under 50% protection then seeks a single ally',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'wounded scout',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    ally=c.makeEnemy({species:'goblin',name:'support',level:2,hp:80,damage:1,gold:0,xp:0},{x:1650,y:1700});
  c.zone().enemies=[e,ally];c.s.party=[];c.line=()=>true;c.route=()=>[{x:ally.x,y:ally.y}];
  Object.assign(c.hero,{x:1440,y:1700,level:2});e.hp=29;e.aggro=true;
  assert(c.tacticalAutoRogue(e,c.hero),'wound starts rogue deliberation even during first second');
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  const before=e.hp;assert(c.damage(e,10));assert.equal(before-e.hp,5,'thinking wounded monster gets temporary 50%');
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,1));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'travel','first choice is an ally, not the named maneuver');
  assert.equal(ally.aggro,false,'discovery alone never auto-pulls');
  assert(C.rules.tacticalFoundation.enabled);
});
test('F54 woundedness can trigger after an earlier rogue response and is limited until reset',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'second wind',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    ally=c.makeEnemy({species:'wolf',name:'support',level:2,hp:80,damage:1,gold:0,xp:0},{x:1580,y:1700});
  c.zone().enemies=[e,ally];c.s.party=[];c.line=()=>true;c.route=()=>[{x:ally.x,y:ally.y}];
  Object.assign(c.hero,{x:1400,y:1700,level:2});e.aggro=true;
  c._tacticalRegroupUsed=new Set([e.id]);c._tacticalRogueNext=new Map([[e.id,c.s.time+50]]);
  assert.equal(c.tacticalAutoRogue(e,c.hero),false,'old attempt blocks healthy monster');
  e.hp=29;assert(c.tacticalAutoRogue(e,c.hero),'new wound overrides previous one-response latch');
  assert(c._tacticalWoundedUsed.has(e.id));
  c.tacticalStopRogueRegroup(e);
  assert.equal(c.tacticalAutoRogue(e,c.hero),false,'same wound cannot spawn infinite immediate retries');
  c.tacticalClearRogueRegroup(e);
  assert(!c._tacticalWoundedUsed.has(e.id),'disengagement clears wound latch for next encounter');
});

test('F55 companions can independently trigger wounded monster retreat without the hero nearby',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'companion target',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700});
  const ally=c.unit('soldier',1430,1700);c.zone().enemies=[e];c.s.party=[ally];c.line=()=>true;
  Object.assign(c.hero,{x:200,y:250,level:2});e.aggro=true;e.hp=29;
  assert.equal(c.tacticalPresentOpponents(e),1,'living present Soldier counts even though hero is far away');
  assert(c.tacticalRogueEligibility(e,0),'wounded monster responds to one companion alone');
  assert(c.tacticalAutoRogue(e,ally),'companion can cause an autonomous rogue retreat decision');
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  c.tacticalClearRogueRegroup(e);
  ally.active=false;assert.equal(c.tacticalRogueEligibility(e,0),false,'absent companion no longer provides encounter pressure');
});

test('F56 isolated engaged monster recognizes numerical pressure from living present party',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'outnumbered foe',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700});
  const companions=[0,1,2].map((i)=>c.unit(i%2?'archer':'soldier',1410+i*20,1700));
  c.zone().enemies=[e];c.s.party=companions;c.hero.level=e.level;
  Object.assign(c.hero,{x:1450,y:1700});e.aggro=true;c.line=()=>true;
  assert.equal(c.tacticalActiveTargetCount(e),0,'none of the party has selected this monster');
  assert.equal(c.tacticalPresentOpponents(e),4,'hero and three living companions are individual opponents');
  assert(c.tacticalRogueOutnumbered(e),'four opponents overwhelm a solitary defender');
  assert(c.tacticalAutoRogue(e,c.hero),'numerical disadvantage initiates autonomous planning');
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  c.tacticalClearRogueRegroup(e);
  e.level=c.hero.level+3;
  assert.equal(c.tacticalAutoRogue(e,c.hero),false,'three-level immunity wins even against a whole squad');
});

test('F57 every monster faction can seek nearby bosses regardless of their levels',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'worried wolf',level:1,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    leader=c.bossEnemy(c.boss('thorn'),'normal',{x:1760,y:1700});
  leader.level=20;c.zone().enemies=[e,leader];c.s.party=[];e.aggro=true;
  Object.assign(c.hero,{x:1400,y:1700,level:3});c.line=()=>true;c.route=()=>[{x:leader.x,y:leader.y}];
  assert(c.tacticalRegroupCandidates(e).includes(leader),'boss counts as allied support even at a different level');
  assert(c.tacticalBeginRogueRegroup(e,leader));
  assert.equal(c.tacticalRogueRegroup(e)?.allyId,leader.id);
  assert.equal(leader.aggro,false,'finding a boss does not itself start a fight');
});
test('F58 sustained player pursuit can trigger successive bounded cross-pack retreats',()=>{
  const c=fresh(),make=(name,x)=>c.makeEnemy({species:'wolf',name,level:2,hp:180,damage:1,gold:0,xp:0},{x,y:1700});
  const e=make('scout',1400),a=make('first ally',1570),b=make('next pack',1900);
  a.pack='first-pack';b.pack='next-pack';c.zone().enemies=[e,a,b];e.aggro=true;
  c.s.party=[0,1,2].map(i=>c.unit('soldier',1430+i*20,1700));
  Object.assign(c.hero,{x:1430,y:1700,level:2});c.line=()=>true;c.route=(from,to)=>[{x:to.x,y:to.y}];
  assert(c.tacticalRogueOutnumbered(e));
  assert(c.tacticalAutoRogue(e,c.hero));
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,1));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'travel');
  Object.assign(e,{x:1540,y:1700});Object.assign(c.hero,{x:1540,y:1700});
  for(const [i,u] of c.s.party.entries())Object.assign(u,{x:1525+i*20,y:1700});
  c.tacticalAdvanceRogueRegroup(e,c.hero,.1);
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'anchored','reaching allies anchors the encounter');
  assert(a.aggro,'nearby first ally joins when player pursues');
  e.telegraph=null;c.s.time=7;
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,.1));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking','continued outnumbering prompts a second decision');
  assert(c.tacticalAdvanceRogueRegroup(e,c.hero,1));
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'travel','same monster may seek a second pack');
  assert.equal(c.tacticalRogueRegroup(e)?.allyId,b.id,'visitation prevents circling straight back to prior pack');
  assert.equal(b.aggro,false,'the next pack is not recruited until the player follows');
});

test('F59 two present adventurers outnumber one defender; another monster restores parity',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'defender',level:2,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),
    soldier=c.unit('soldier',1420,1700),friend=c.makeEnemy({species:'goblin',name:'fellow defender',level:2,hp:100,damage:1,gold:0,xp:0},{x:1460,y:1700});
  c.s.party=[soldier];c.zone().enemies=[e];c.hero.level=2;Object.assign(c.hero,{x:1400,y:1700});
  assert.equal(c.tacticalPresentOpponents(e),2);
  assert(c.tacticalRogueOutnumbered(e),'two living adventurers outnumber one defender');
  c.zone().enemies.push(friend);
  assert(!c.tacticalRogueOutnumbered(e),'two local defenders match two adventurers');
  soldier.hp=0;assert(!c.tacticalRogueOutnumbered(e),'fallen companion does not increase pressure');
});
test('F60 wounded monsters three levels above an underleveled hero never retreat or gain damage reduction',()=>{
  const c=fresh(),e=c.makeEnemy({species:'wolf',name:'dangerous monster',level:7,hp:1000,damage:9,gold:5,xp:200},{x:1400,y:1700});
  c.s.party=[c.unit('soldier',1410,1700)];c.zone().enemies=[e];c.line=()=>true;
  Object.assign(c.hero,{x:1450,y:1700,level:4});e.hp=290;e.aggro=true;
  assert(c.tacticalRogueWounded(e),'a severely hurt monster is still classified as wounded');
  assert.equal(c.tacticalRogueEligibility(e,3),false,'outlevel protection overrides wounds and numbers');
  assert.equal(c.tacticalAutoRogue(e,c.hero),false,'underleveled player cannot trigger wounded retreat');
  const before=e.hp,reward=c.enemyReward(e);
  assert(c.damage(e,100));assert.equal(before-e.hp,100,'normal damage applies, without tactical mitigation');
  assert.deepEqual(c.enemyReward(e),reward,'woundedness does not alter earned XP or gold');
});

test('F61 isolated boss or captain with no usable rogue response defends territory instead of endlessly resetting',()=>{
  const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700});
  c.zone().enemies=[e];c.s.party=[];c.line=()=>true;
  Object.assign(c.hero,{x:1920,y:1700,level:e.level+1});e.aggro=true;
  assert(c.tacticalAutoRogue(e,c.hero),'disadvantaged field boss can deliberate');
  assert.equal(c.tacticalRogueRegroup(e)?.phase,'thinking');
  assert.equal(c.tacticalAdvanceRogueRegroup(e,c.hero,1),false);
  assert.equal(c.tacticalRogueRegroup(e),null,'no unsupported infinite fallback state');
  assert(!e.returning&&e.aggro,'field boss remains an opponent, not a perpetually resetting coward');
  assert(c._tacticalRegroupUsed.has(e.id),'failed direct maneuver cannot repeat in the same fight');
});
test('F62 chained retreat leash follows current hop, never the original spawn line',()=>{
 const c=fresh(),e=c.makeEnemy({species:'wolf',name:'chained scout',level:1,hp:100,damage:1,gold:0,xp:0},{x:1400,y:1700}),
  ally=c.makeEnemy({species:'goblin',name:'next ally',level:1,hp:100,damage:1,gold:0,xp:0},{x:2150,y:2450});
 const home={...e.home};Object.assign(e,{x:1400,y:2450,aggro:true});
 Object.assign(c.hero,{x:1420,y:2450,level:3});
 c.zone().enemies=[e,ally];c.s.party=[];c.route=()=>[{x:ally.x,y:ally.y}];
 assert(c.tacticalBeginRogueRegroup(e,ally));
 const state=c.tacticalRogueRegroup(e);
 assert.deepEqual(state.retreatOrigin,{x:1400,y:2450},'current hop begins at current monster position');
 assert.deepEqual(e.home,home,'respawn home remains unchanged');
 assert(c.distanceToSegment(c.hero,e.home,state.destination)>500,'old global home-to-destination corridor would incorrectly reset');
 assert.equal(c.tacticalRogueLeashAllows(e,c.hero,500),true,'player following the actual retreat corridor preserves engagement');
 Object.assign(c.hero,{x:3200,y:3100});
 assert.equal(c.tacticalRogueLeashAllows(e,c.hero,500),false,'genuine escape still ends the encounter');
});

test('F63 melee and ranged ringleaders retain role basics and species-specific elite signatures',()=>{
 const cfg=C.rules.tacticalFoundation;
 for(const role of ['melee','ranged'])for(const [species,def] of Object.entries(cfg.rogueRingleaderSignatures[role])){
  const c=fresh(),e=c.makeEnemy({species,name:species+' ringleader',level:2,hp:300,damage:12,gold:0,xp:0},{x:1400,y:1700});
  e.form='ringleader';e.ranged=role==='ranged';e.aggro=true;c.zone().enemies=[e];c.s.party=[];c.line=()=>true;
  Object.assign(c.hero,{x:1470,y:1700,hp:1000,maxHp:1000});
  c.tacticalRogueOutnumbered=()=>false;c.tacticalRogueWounded=()=>false;
  assert(c.tacticalRogueMove(e,c.hero),species+' basic');
  const basic=e.telegraph;
  assert.equal(basic.name,role==='ranged'?(cfg.rogueMoves.ranged[species]||cfg.rogueMoves.rangedFallback).name:(cfg.rogueMoves.species[species]||cfg.rogueMoves.ordinary).name);
  assert(!basic.rogueSignature);
  e.telegraph=null;c.tacticalRogueOutnumbered=()=>true;
  assert(c.tacticalRogueMove(e,c.hero),species+' signature');
  assert.equal(e.telegraph.name,def.name);
  assert(e.telegraph.rogueSignature);
  assert.notEqual(e.telegraph.name,basic.name,'signature cannot repeat the basic');
  assert.notEqual(e.telegraph.name,'Ringleader Ambush');
 }
});
test('F64 all five captains have a basic move plus an individually authored rogue signature',()=>{
 const signatures=C.rules.tacticalFoundation.rogueSignatures.captains;
 const basics=C.rules.tacticalFoundation.rogueMoves.captains;
 assert.equal(Object.keys(signatures).length,5);
 for(const id of Object.keys(basics)){
  const c=fresh(),e=c.makeEnemy({species:'goblin',name:id,level:5,hp:1000,damage:20,gold:0,xp:0},{x:1400,y:1700});
  e.roomCaptain=true;e.captainProfile=id;e.aggro=true;c.zone().enemies=[e];c.s.party=[];c.line=()=>true;
  Object.assign(c.hero,{x:1500,y:1700,hp:100000,maxHp:100000});
  c.tacticalRogueOutnumbered=()=>false;
  assert(c.tacticalRogueMove(e,c.hero),id+' basic move exists');
  assert.equal(e.telegraph.name,basics[id].name);
  assert(!e.telegraph.rogueSignature);
  e.telegraph=null;c.tacticalRogueOutnumbered=()=>true;
  assert(c.tacticalRogueMove(e,c.hero),id+' signature is usable under pressure');
  const a=e.telegraph;
  assert.equal(a.name,signatures[id].name);
  assert(a.rogueSignature&&a.total>=1.1&&a.radius>=110,id+' distinct legible special');
  assert(['bind','scatter','rally','pivot','sweep'].includes(a.effect));
  assert(a.coefficient<=0.12,'rogue special is not a second boss nuke');
 }
});
test('F65 every normal and TRUE boss has both rogue choices without altering boss attack profiles',()=>{
 const signatures=C.rules.tacticalFoundation.rogueSignatures.bosses,
  basics=C.rules.tacticalFoundation.rogueMoves.bosses;
 assert.equal(Object.keys(signatures).length,11);
 for(const def of C.data.bosses)for(const form of ['normal','true']){
  const c=fresh(),e=c.bossEnemy(def,form,{x:1400,y:1700});
  c.zone().enemies=[e];c.s.party=[];e.aggro=true;c.line=()=>true;
  Object.assign(c.hero,{x:1500,y:1700,hp:100000,maxHp:100000});
  c.tacticalRogueOutnumbered=()=>false;
  assert(c.tacticalRogueMove(e,c.hero),def.id+' basic choice');
  assert.equal(e.telegraph.name,basics[def.id].name);
  assert(!e.telegraph.rogueSignature);
  e.telegraph=null;c.tacticalRogueOutnumbered=()=>true;
  assert(c.tacticalRogueMove(e,c.hero),def.id+' special choice');
  const a=e.telegraph;
  assert.equal(a.name,signatures[def.id].name,def.id+' case-by-case identity');
  assert(a.rogueSignature&&a.total>=1.2&&a.radius>=120);
  assert.equal(a.kind,def.id==='mine'?'cone':'circle');
  assert(a.coefficient<=0.12);
  assert(C.rules.attacks[def.id].length>=4,'base boss rotation is untouched');
 }
});
test('F66 rogue binding warnings use their actual hit circle and respect cover',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('mire'),'normal',{x:1400,y:1700});
 e.aggro=true;c.zone().enemies=[e];c.s.party=[];c.line=()=>true;c.tacticalRogueOutnumbered=()=>true;
 Object.assign(c.hero,{x:1490,y:1700,hp:1000,maxHp:1000,slow:0});
 assert(c.tacticalRogueMove(e,c.hero));const move=e.telegraph;
 assert(move.rogueSignature&&move.effect==='bind'&&move.total>=1.4);
 const hp=c.hero.hp;
 c.hero.x+=move.radius+30;c.tacticalResolveRogueMove(e,move);
 assert.equal(c.hero.hp,hp,'stepping outside the visible mark avoids the hit');
 c.hero.x=move.x;c.line=()=>false;c.tacticalResolveRogueMove(e,move);
 assert.equal(c.hero.hp,hp,'solid cover negates the mark');
 c.line=()=>true;c.tacticalResolveRogueMove(e,move);
 assert(c.hero.hp<hp&&c.hero.slow>0,'remaining inside the readable mark gets modest snare');
});
test('F67 Thornfang scatter forces living attackers apart with transient terrain-safe movement',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700}),
  soldier=c.unit('soldier',1450,1700);
 c.zone().enemies=[e];c.s.party=[soldier];e.aggro=true;c.line=()=>true;
 c.tacticalRogueOutnumbered=()=>true;
 Object.assign(c.hero,{x:1450,y:1745,hp:1000,maxHp:1000});
 assert(c.tacticalRogueMove(e,c.hero));const a=e.telegraph;
 const before=c.hero.hp,allyHp=soldier.hp,enemyCount=c.zone().enemies.length;
 c.tacticalResolveRogueMove(e,a);
 assert(c.hero.hp<before&&soldier.hp<allyHp);
 assert(c.tacticalScatterState(c.hero)&&c.tacticalScatterState(soldier),'both attackers forcibly scattered');
 const pos={x:c.hero.x,y:c.hero.y},allyPos={x:soldier.x,y:soldier.y};
 c.tacticalAdvanceScatter(c.hero,.1);c.tacticalAdvanceScatter(soldier,.1);
 assert(Math.hypot(c.hero.x-pos.x,c.hero.y-pos.y)>0);
 assert(Math.hypot(soldier.x-allyPos.x,soldier.y-allyPos.y)>0);
 assert.equal(c.zone().enemies.length,enemyCount,'scatter cannot manufacture summons');
});
test('F68 captain orders rally existing defenders without recruiting distant packs',()=>{
 const c=fresh(),e=c.makeEnemy({species:'orc',name:'Cinder Warlord',level:10,hp:1000,damage:20,gold:0,xp:0},{x:1400,y:1700}),
  guard=c.makeEnemy({species:'orc',name:'engaged guard',level:10,hp:100,damage:7,gold:0,xp:0},{x:1460,y:1730}),
  idle=c.makeEnemy({species:'orc',name:'nearby guard',level:10,hp:100,damage:7,gold:0,xp:0},{x:1480,y:1740}),
  distant=c.makeEnemy({species:'orc',name:'distant pack',level:10,hp:100,damage:7,gold:0,xp:0},{x:2350,y:1700});
 e.captain=true;e.captainProfile='frontier-overseer';e.aggro=true;guard.aggro=true;
 c.zone().enemies=[e,guard,idle,distant];c.s.party=[];c.line=()=>true;c.tacticalRogueOutnumbered=()=>true;
 Object.assign(c.hero,{x:1500,y:1700,hp:1000,maxHp:1000});
 assert(c.tacticalRogueMove(e,c.hero));
 assert.equal(e.telegraph.effect,'rally');
 const count=c.zone().enemies.length,previous=guard.pursuitBurst||0;
 c.tacticalResolveRogueMove(e,e.telegraph);
 assert(guard.pursuitBurst>previous,'already fighting soldier rallied');
 assert(idle.pursuitBurst>0,'nearby existing troops also rallied');
 assert(!distant.aggro&&!(distant.pursuitBurst>0),'distant pack not conscripted');
 assert.equal(c.zone().enemies.length,count,'no artificial guard summons');
});
test('F69 rogue telegraphs do not advance or fabricate normal boss basic-attack cadence',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700});
 c.zone().enemies=[e];c.s.party=[];e.aggro=true;e.attackIndex=4;e.basicDue=false;
 Object.assign(c.hero,{x:1490,y:1700,hp:10000,maxHp:10000});
 c.line=()=>true;c.tacticalRogueOutnumbered=()=>true;
 assert(c.tacticalRogueMove(e,c.hero),'signature starts');
 const before=e.attackIndex;
 e.telegraph.timer=0.01;c.updateEnemies(.1);
 assert.equal(e.attackIndex,before,'rogue special does not count as a boss rotation skill');
 assert.equal(e.basicDue,false,'rogue special does not schedule a free follow-up basic attack');
});
test('F70 the regroup anchor retains signature eligibility when the local squad reaches parity',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('warlord'),'normal',{x:1400,y:1700});
 c.zone().enemies=[e];c.s.party=[];e.aggro=true;c.line=()=>true;
 Object.assign(c.hero,{x:1480,y:1700,hp:10000,maxHp:10000});
 c.tacticalRogueOutnumbered=()=>false;
 assert(c.tacticalRogueMove(e,c.hero,true),'a maintained regroup anchor counts as tactical pressure');
 assert.equal(e.telegraph.name,'Ashen Warlord’s Shielded Withdrawal');
 assert(e.telegraph.rogueSignature);
});
test('F71 lengthy rogue warning labels stay inside zoomed narrow-screen canvas',()=>{
 const fx=require('../src/prototype/combat-visuals.js'),boxes=[];
 const ctx={
  canvas:{width:375,height:600},
  getTransform(){return {a:1.5};},
  save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},
  fill(){},setLineDash(){},strokeRect(){},
  fillRect(x,y,w,h){boxes.push({x,y,w,h});},
  measureText(value){return {width:value.length*6.8};},
  fillText(){}
 };
 const a={name:'Ashen Warlord’s Shielded Withdrawal',rogueMove:true,rogueSignature:true,
  kind:'circle',radius:145,timer:1.4,x:1400,y:1700};
 const game={traps(){return [];},zone(){return {enemies:[{telegraph:a}]}},
  attackPatches(){return [a]},s:{hazards:[]}};
 fx.ground(ctx,()=>({x:5,y:5}),game,'cue',0);
 assert.equal(boxes.length,1,'one readable label box accompanies rogue mark');
 const b=boxes[0],logicalW=250,logicalH=400;
 assert(b.x>=0&&b.y>=0&&b.x+b.w<=logicalW&&b.y+b.h<=logicalH,
  'label must not extend past zoomed phone viewport edges');
});

test('F72 close-range boss signatures are not wasted against distant backline pressure',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('thorn'),'normal',{x:1400,y:1700});
 c.zone().enemies=[e];c.s.party=[];e.aggro=true;c.line=()=>true;
 c.tacticalRogueOutnumbered=()=>true;
 Object.assign(c.hero,{x:1770,y:1700,hp:10000,maxHp:10000});
 assert(c.tacticalRogueMove(e,c.hero));
 assert.equal(e.telegraph.name,'Thornfang’s Pack Feint','a distant lone target receives basic ranged disruption');
 assert(!e.telegraph.rogueSignature,'no point-blank howl against an empty nearby area');
 e.telegraph=null;
 const soldier=c.unit('soldier',1470,1700);c.s.party=[soldier];
 c.tacticalHighestThreatTarget=()=>c.hero;
 assert(c.tacticalRogueMove(e,c.hero));
 assert.equal(e.telegraph.name,'Thornfang’s Packbreaker Howl');
 assert.equal(e.telegraph.targetId,soldier.id,'a close soldier is selected over an unreachable high-threat hero');
 assert(e.telegraph.rogueSignature,'the local circle can affect at least one attacker');
});
test('F73 rogue targeting resolves escorts as active combat participants',()=>{
 const c=fresh(),e=c.makeEnemy({species:'goblin',name:'escort harasser',level:2,hp:100,damage:20,gold:0,xp:0},{x:1400,y:1700});
 const escort={id:'test-escort',type:'escort',x:1480,y:1700,hp:100,maxHp:100,slow:0};
 c.zone().enemies=[e];c.zone().escort=escort;c.s.party=[];e.aggro=true;c.line=()=>true;
 Object.assign(c.hero,{x:200,y:250,hp:1000,maxHp:1000});
 c.tacticalRogueOutnumbered=()=>false;
 assert(c.tacticalRogueMove(e,escort),'an escort within reach is a valid fallback target');
 assert.equal(e.telegraph.targetId,escort.id);
 const before=escort.hp;
 c.tacticalResolveRogueMove(e,e.telegraph);
 assert(escort.hp<before,'the named rogue move resolves against its marked escort');
 assert(escort.slow>0,'the intended disruption effect also applies to the escort');
});
test('F74 goblin dust cancels active hero locks, squad targeting and homing projectiles',()=>{
 const c=fresh(),g=c.makeEnemy({species:'goblin',name:'Slinger',level:1,hp:3000,damage:20,gold:0,xp:0},{x:1400,y:1700}),
  other=c.makeEnemy({species:'skeleton',name:'Other attacker',level:1,hp:3000,damage:15,gold:0,xp:0},{x:1450,y:1710}),
  soldier=c.unit('soldier',1460,1700);
 c.zone().enemies=[g,other];c.s.party=[soldier];g.aggro=true;other.aggro=true;c.line=()=>true;
 Object.assign(c.hero,{x:1460,y:1750,hp:1000,maxHp:1000});
 c.s.heroTarget=g.id;c.hero.order={type:'attack',id:g.id};
 c.basicComboTargetId=g.id;c._tacticalPartyTargets=new Map([[soldier.id,g.id]]);
 c.s.projectiles.push({id:'pending-shot',target:g.id,source:soldier.id,x:1460,y:1700,speed:450,damage:10});
 c.tacticalRogueOutnumbered=()=>false;
 assert(c.tacticalRogueMove(g,c.hero));
 assert.equal(g.telegraph.name,'Blinding Dust');
 const hp=c.hero.hp;c.tacticalResolveRogueMove(g,g.telegraph);
 assert(c.hero.hp<hp&&c.hero.slow>=1.65,'dust hits and slows');
 assert.equal(c.tacticalDirectTargetable(g),false);
 assert.equal(c.s.heroTarget,null,'hero target lock cleared');
 assert.equal(c.hero.order,null,'held auto-attack order stopped');
 assert.notEqual(c.basicComboTargetId,g.id,'basic combo lock reset');
 assert(![...c._tacticalPartyTargets.values()].includes(g.id),'companion targeting lock cleared');
 assert(!c.s.projectiles.some(p=>p.target===g.id),'existing homing shots cancelled');
 assert(!c.squadThreats().includes(g),'companions cannot auto-reacquire covered goblin');
 assert(c.squadThreats().includes(other),'other enemies remain eligible');
 const before=g.hp;
 assert.equal(c.damage(g,20),false,'direct hero damage rejected by resolver');
 assert.equal(c.damage(g,20,soldier.id),false,'direct companion damage rejected');
 assert.equal(g.hp,before);
 c.hero.cd[0]=0;c.cast(1,g.id);
 assert.equal(g.hp,before,'hero basic selects someone else instead of protected goblin');
 c.updateParty(.1);
 assert(![...c._tacticalPartyTargets.values()].includes(g.id),'companions retarget or return to follow');
 const areaStart=g.hp;
 assert(c.damage(g,20,'hero',{area:true}),'area effect still lands');
 assert(g.hp<areaStart,'dust is not invulnerability');
 c.hero.order={type:'attack',id:g.id};c.tick(.1,{x:0,y:0});
 assert.equal(c.hero.order,null,'newly issued auto-follow also drops covered target');
 c.s.time+=1.66;
 assert(c.tacticalDirectTargetable(g),'direct targeting naturally resumes after 1.65 s');
});
test('F75 boss rogue repositions protect encounters without preventing genuine escape',()=>{
 const c=fresh(),e=c.bossEnemy(c.boss('archive'),'normal',{x:1400,y:1700});
 c.zone().enemies=[e];c.s.party=[];e.aggro=true;e.hp=e.maxHp*.45;
 Object.assign(c.hero,{x:1490,y:1700,hp:10000,maxHp:10000});
 c.line=()=>true;c.tacticalRogueOutnumbered=()=>true;
 assert(c.tacticalRogueMove(e,c.hero));const a=e.telegraph;
 assert.equal(a.effect,'pivot');
 c.tacticalResolveRogueMove(e,a);
 assert(e.hp<e.maxHp,'boss remains wounded');
 const p=c._tacticalRepositions?.get(e.id);
 assert(p,'reposition is recorded');
 assert(c.tacticalRogueLeashAllows(e,c.hero,500),'nearby hero remains engaged during relocation');
 Object.assign(c.hero,{x:3200,y:3300});
 assert.equal(c.tacticalRogueLeashAllows(e,c.hero,500),false,'real escape remains possible');
});
test('F76 field commander revives existing local soldier spawns but no summons or new identities',()=>{
 for(const [family,species] of [['warlord','orc'],['ridge','wolf']]){
  const c=fresh(),e=c.bossEnemy(c.boss(family),'normal',{x:1400,y:1700});
  c.zone().enemies=[e];c.s.party=[];e.aggro=true;c.line=()=>true;
  Object.assign(c.hero,{x:1530,y:1720,hp:10000,maxHp:10000});
  const squad=Array.from({length:4},(_,j)=>{
   const u=c.makeEnemy({species,name:'native troop',level:10,hp:200,damage:10,gold:0,xp:0},{x:1240+j*48,y:1640});
   u.pack='local-'+family;u.hp=j===0?200:0;u.deathPaid=j!==0;
   return u;
  });
  const summoned=c.makeEnemy({species,name:'owned summon',level:10,hp:200,damage:10,gold:0,xp:0},{x:1470,y:1600});
  summoned.summon=true;summoned.owner=e.id;
  c.zone().enemies.push(...squad,summoned);
  c.tacticalRogueOutnumbered=()=>true;
  assert(c.tacticalRogueMove(e,c.hero));
  const ids=c.zone().enemies.map(x=>x.id),move=e.telegraph;
  assert.equal(move.effect,'rally');
  c.tacticalResolveRogueMove(e,move);
  assert.deepEqual(c.zone().enemies.map(x=>x.id),ids,'only original monster records survive');
  assert.equal(squad.filter(u=>u.hp>0).length,3,'restore defenders to a 3-member cap');
  assert.equal(summoned.hp,200,'personal boss summon is not counted/replaced');
  e.telegraph=null;squad[3].hp=0;squad[3].deathPaid=true;
  const previous=squad.filter(u=>u.hp>0).length;
  assert.equal(previous,3);
  c.tacticalRogueFieldSupport(e,move);
  assert.equal(squad.filter(u=>u.hp>0).length,3,'three local defenders means no new rally spawn');
 }
});
console.log(passed+' audit regression scenarios passed.');
