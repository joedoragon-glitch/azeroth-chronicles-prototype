/* Dormant, zone-explicit Field Lab ordinary-enemy encounter bridge.
 * Live-region enemies use unchanged Campaign.updateEnemies/combatTargets.
 * Off-region ordinary melee uses exact native enemy actors, awareness,
 * melee range, route collision, native enemyStartBasic cooldowns and
 * native hitParty damage/death. Unsupported boss/captain/ranged/special
 * casts stay unsafe/suspended; NEVER fabricate projectiles or victories.
 */
(function(root){
  'use strict';
  const regions=['vale','march','highlands','frontier','crown'];
  const sessions=new WeakMap();
  const SCAN_SECONDS=0.4, ROUTE_SECONDS=0.8, MAX_ACTORS=14;
  const point=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function create({navigation,rules}={}){
    if(!navigation||typeof navigation.route!=='function'||
       typeof navigation.passable!=='function'||!rules?.balance)
      throw Error('Native zone-explicit movement and rules required');
    function eligible(g,e,zoneId){
      return e?.type==='mob'&&e.hp>0&&!e.neutral&&!e.returning&&
        !e.captain&&!e.roomCaptain&&!e.fieldCaptain&&!e.summon&&
        !e.hybrid&&!e.rangedAim&&!e.telegraph&&!e.motion&&
        !e.deathRoll&&!e.owner&&!g.enemyRanged(e)&&
        point(e)&&point(e.home)&&typeof e.id==='string'&&
        g.s.zones[zoneId]?.enemies?.includes(e);
    }
    function advanceEnemyDanger(game,jobs,dt){
      if(game?.hero?.class!=='strategist'||game.peace||
         !Number.isFinite(dt)||dt<=0||dt>0.1||
         typeof game.enemyStartBasic!=='function'||
         typeof game.hitParty!=='function'||
         typeof game.cooldownRecoveryElapsed!=='function'||
         typeof game.enemyAcquisitionRange!=='function'||
         typeof game.enemyMeleeBasicRange!=='function')
        return false; // No fake combat on absent native owner.
      const workers=new Map();
      for(const job of Object.values(jobs||{})){
        if(!regions.includes(job?.zoneId)||job.zoneId===game.s.zone||
           !point(job.position)||!game.s.zones[job.zoneId])continue;
        const u=game.s.party?.find(a=>a.id===job.workerId);
        if(!u||u.hp<=0||u.active!==false||u.fieldLabJob!==job.labId||
           u.order?.type!=='strategist-field-lab'||
           u.order.id!==job.labId||!point(u)||dist(u,job.position)>0.02)
          continue;
        if(!workers.has(job.zoneId))workers.set(job.zoneId,[]);
        workers.get(job.zoneId).push({u,job});
      }
      let state=sessions.get(game);
      if(!state){state=new Map();sessions.set(game,state);}
      const now=game.s.time||0;
      let pathSearches=0;
      for(const [zoneId,group] of workers){
        const zone=game.s.zones[zoneId];
        if(!Array.isArray(zone.enemies))continue;
        const token=state.get(zoneId)||{at:-Infinity,encounters:new Map()};
        if(now>=token.at||now<token.at-SCAN_SECONDS){
          const next=new Map();let accepted=0;
          for(const e of zone.enemies){
            if(!eligible(game,e,zoneId))continue;
            let closest=null,distance=Infinity;
            for(const item of group){
              const gap=dist(item.job.position,e);
              if(gap>=distance||gap>game.enemyAcquisitionRange(e))continue;
              if(!navigation.passable(game,zoneId,e,item.job.position,
                navigation.budget?.(0,110)))continue;
              // Respect the native ordinary leash and actual home coordinate.
              if(dist(item.job.position,e.home)>500)continue;
              closest=item;distance=gap;
            }
            if(!closest)continue;
            if(++accepted>MAX_ACTORS)break;
            const prev=token.encounters.get(e.id);
            next.set(e.id,{enemy:e,target:closest.u.id,
              path:prev?.target===closest.u.id?prev.path:[],
              step:prev?.target===closest.u.id?prev.step:0,
              plannedAt:prev?.plannedAt??-Infinity});
          }
          token.encounters=next;token.at=now+SCAN_SECONDS;
        }
        for(const entry of token.encounters.values()){
          const e=entry.enemy;
          const item=group.find(x=>x.u.id===entry.target);
          if(!item||!eligible(game,e,zoneId))continue;
          const u=item.u,reach=game.enemyMeleeBasicRange(e),
            gap=dist(e,u);
          const recovery=game.cooldownRecoveryElapsed(e,dt,true);
          if(Number.isFinite(recovery)&&recovery>=0)
            e.cd=Math.max(0,(e.cd||0)-recovery);
          if(gap<=reach&&
             navigation.passable(game,zoneId,e,u,navigation.budget?.(0,110))){
            if(e.cd<=0)game.enemyStartBasic(e,u,false,{zoneId,enemy:e});
            continue;
          }
          // Replan only on the native simulation clock. Position moves in
          // small collision-checked steps: no off-screen teleport.
          if(now>=entry.plannedAt+ROUTE_SECONDS&&pathSearches<2){
            pathSearches++;
            entry.path=navigation.route(game,zoneId,e,u);
            entry.step=0;entry.plannedAt=now;
          }
          if(!Array.isArray(entry.path)||entry.step>=entry.path.length)continue;
          const destination=entry.path[entry.step],d=dist(e,destination);
          if(d<0.001){entry.step++;continue;}
          const speed=rules.balance.enemyOrdinaryMeleePursuitSpeed;
          if(!Number.isFinite(speed)||speed<=0)continue;
          const fraction=Math.min(1,(speed*dt)/d);
          const next={x:e.x+(destination.x-e.x)*fraction,
            y:e.y+(destination.y-e.y)*fraction};
          if(dist(e.home,next)>500||
             navigation.passable(game,zoneId,e,next)!==true){
            entry.path=[];entry.plannedAt=now;
            continue;
          }
          e.x=next.x;e.y=next.y;
          if(fraction>=1)entry.step++;
        }
        state.set(zoneId,token);
      }
      return true;
    }
    function invalidate(game){sessions.delete(game);}
    return Object.freeze({advanceEnemyDanger,invalidate});
  }
  const api=Object.freeze({create,SCAN_SECONDS,ROUTE_SECONDS,MAX_ACTORS});
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistLabCombat=api;
})(typeof window!=='undefined'?window:globalThis);
