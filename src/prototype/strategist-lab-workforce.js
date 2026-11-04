/* Dormant native Field Lab worker-origin authority.
 * A reserve's saved x/y is NOT zone provenance. Only a native Rest or a
 * tracked Lab release can establish a region-position receipt.
 */
(function (root) {
  'use strict';
  const REGIONS=Object.freeze(['vale','march','highlands','frontier','crown']);
  const point=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<=0.02;
  function owned(game,worker){
    if(!game?.s?.party?.includes(worker) ||
       game.s.party.filter(u=>u.id===worker?.id).length!==1 ||
       !['soldier','archer','pet'].includes(worker.type) ||
       !Number.isFinite(worker.hp)||worker.hp<=0 ||
       worker.expeditionId||worker.keeperHeld||worker.deathRollHeld)
      return false;
    if(worker.charmOrigin &&
       (typeof game.isCharmedCompanion!=='function' ||
        !game.isCharmedCompanion(worker)))return false;
    if(worker.type==='pet' &&
       (typeof game.petDefinition!=='function'||!game.petDefinition(worker)||
        (typeof game.petUnlocked==='function' &&
         !game.petUnlocked(worker.petFamily))))return false;
    return true;
  }
  function legalPoint(game,zoneId,worker){
    return REGIONS.includes(zoneId)&&point(worker)&&
      game?.s?.zones?.[zoneId]?.id===zoneId &&
      typeof game.blocked==='function' &&
      game.blocked(worker.x,worker.y,zoneId,15)===false;
  }
  function authenticatedLocation(game,worker){
    if(!owned(game,worker)||worker.order||worker.fieldLabJob||
       worker.fieldLabTrained!==true||game?.hero?.class!=='strategist')
      return null;
    if(worker.active!==false){
      const zoneId=game.s.zone;
      if(!legalPoint(game,zoneId,worker))return null;
      return {zoneId,point:{x:worker.x,y:worker.y},kind:'active'};
    }
    const receipt=worker.strategistLabRest;
    if(!receipt||!REGIONS.includes(receipt.zoneId)||
       !point(receipt)||!near(receipt,worker)||
       !legalPoint(game,receipt.zoneId,worker))return null;
    return {zoneId:receipt.zoneId,point:{x:worker.x,y:worker.y},
      kind:'native-rest'};
  }
  function recordNativeRest(game,worker){
    if(!owned(game,worker)||worker.active===false||
       worker.order||worker.fieldLabJob||worker.fieldLabTrained!==true||
       game.hero?.class!=='strategist'||
       !legalPoint(game,game.s.zone,worker)){
      if(worker)delete worker.strategistLabRest;
      return false;
    }
    worker.strategistLabRest={zoneId:game.s.zone,x:worker.x,y:worker.y};
    return true;
  }
  function install(Campaign){
    // No existing class receives a new mechanic.
    Campaign.prototype.captureLabReserveLocation=function(worker){
      return recordNativeRest(this,worker);
    };
    return Object.freeze({authenticatedLocation,owned,recordNativeRest});
  }
  const api=Object.freeze({install,authenticatedLocation,owned,recordNativeRest});
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistLabWorkforce=api;
})(typeof window!=='undefined'?window:globalThis);
