/* Dormant cross-region Field Lab threat observation.
 * Authoritative existing zone.enemies only; no fabricated spawn, combat stat,
 * immunity, damage timer or off-screen AI. Real combat belongs to native owners.
 */
(function(root){
  'use strict';
  const sessions=new WeakMap();
  const INTERVAL=0.4;
  const isPoint=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function create({sight, nearestRadius=null}={}) {
    function inspect(game,zoneId,workerPoint) {
      if(!game?.s?.zones?.[zoneId]||!isPoint(workerPoint) ||
         typeof game.enemyAcquisitionRange!=='function' ||
         typeof sight!=='function')
        return {safe:false,threatId:null,reason:'unverified'};
      let perGame=sessions.get(game);
      if(!perGame){perGame=new Map();sessions.set(game,perGame);}
      const key=zoneId+':'+(workerPoint.workerId||'');
      const previous=perGame.get(key),now=game.s.time;
      if(previous && now>=previous.at && now-previous.at<INTERVAL &&
        dist(workerPoint,previous.position)<22) return previous.result;
      const zone=game.s.zones[zoneId];
      let threat=null,nearest=Infinity;
      for(const enemy of zone.enemies||[]) {
        if(!enemy || !isPoint(enemy) || !(enemy.hp>0) ||
           enemy.neutral || enemy.returning || enemy.summon) continue;
        const radius=game.enemyAcquisitionRange(enemy);
        if(!Number.isFinite(radius)||radius<=0) {
          return {safe:false,threatId:null,reason:'unverified'};
        }
        const reach=nearestRadius===null?radius:Math.max(radius,nearestRadius);
        const d=dist(enemy,workerPoint);
        if(d>reach || d>=nearest)continue;
        // This genuine geometry check must accept the source owner's
        // water-transparent line-of-sight, not fake a walkable water route.
        if(sight(game,zoneId,workerPoint,enemy)!==true)continue;
        threat=enemy;nearest=d;
      }
      const result=threat?{safe:false,threatId:threat.id,reason:'hostile'}:
        {safe:true,threatId:null,reason:''};
      perGame.set(key,{at:now,position:{x:workerPoint.x,y:workerPoint.y},result});
      return result;
    }
    function safeFromThreat(game,zoneId,position,worker) {
      return inspect(game,zoneId,{...position,workerId:worker?.id}).safe;
    }
    function invalidate(game) {sessions.delete(game);}
    return Object.freeze({inspect,safeFromThreat,invalidate});
  }
  const api=Object.freeze({create,INTERVAL});
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistLabThreats=api;
})(typeof window!=='undefined'?window:globalThis);
