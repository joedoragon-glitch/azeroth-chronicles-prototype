/* Optional graphics renderer controller. Keep the original Canvas safe.
 * The 15-second selection is a TRIAL until confirmed.
 * A dedicated Canvas surface must remain alive beneath/alongside WebGL2.
 * This module does NOT assert that a complete WebGL renderer exists.
 */
(function(root){
  'use strict';
  const PREFERENCE_KEY='azeroth-renderer-choice-v1';
  const PENDING_KEY='azeroth-renderer-trial-pending-v1';
  const DURATION_MS=15000;
  const defaultMode='canvas2d';
  const read=(storage,key)=>{
    try{return storage?.getItem(key)??null;}catch(_){return null;}
  };
  const write=(storage,key,value)=>{
    try{if(!storage?.setItem)return false;storage.setItem(key,value);return true;}catch(_){return false;}
  };
  const remove=(storage,key)=>{
    try{if(!storage?.removeItem)return false;storage.removeItem(key);return true;}catch(_){return false;}
  };
  function startupChoice(storage){
    // Interrupted trial or crash: discard WebGL preference before initializing
    // ANY graphics contexts. A failed trial can never strand a player.
    if(read(storage,PENDING_KEY)==='pending'){
      write(storage,PREFERENCE_KEY,defaultMode);
      remove(storage,PENDING_KEY);
      return {renderer:defaultMode,reason:'interrupted-trial'};
    }
    const saved=read(storage,PREFERENCE_KEY);
    return {
      renderer:saved==='webgl2'?'webgl2':defaultMode,
      reason:saved==='webgl2'?'confirmed-preference':'canvas-default'
    };
  }
  function armConfirmedBoot(storage) {
    // Only attempt a saved WebGL choice if a crash-recovery marker can be
    // stored BEFORE creating the GPU context. Otherwise boot with Canvas.
    if(read(storage,PREFERENCE_KEY)!=='webgl2'||
       read(storage,PENDING_KEY)==='pending')return false;
    return write(storage,PENDING_KEY,'pending');
  }
  function finishConfirmedBoot(storage){
    // The integration must call this only after its first COMPLETE, validated
    // WebGL scene frame and accessible DOM settings are visible.
    if(read(storage,PREFERENCE_KEY)!=='webgl2'||
       read(storage,PENDING_KEY)!=='pending')return false;
    return remove(storage,PENDING_KEY);
  }
  function create({
    storage=null,
    prepareWebGL,
    showWebGL,
    showCanvas,
    notify=()=>{},
    getFailureDetails=()=>null,
    now=()=>performance.now(),
    schedule=(callback,ms)=>setTimeout(callback,ms),
    unschedule=timer=>clearTimeout(timer)
  }={}){
    if(typeof prepareWebGL!=='function'||typeof showWebGL!=='function'||
       typeof showCanvas!=='function')
      throw Error('WebGL preparation, atomic reveal, and reliable Canvas fallback hooks are required');
    let mode='canvas2d',phase='canvas',deadline=0,timer=null,serial=0,closed=false;
    let lastFallbackReason='',lastFailure=null;
    const failures=new Set([
      'webgl-preparation-failed','confirmed-webgl-preparation-failed',
      'webgl-error','confirmed-webgl-error','webgl-context-or-render-failure',
      'confirmed-webgl-boot-not-acknowledged','webgl-persistence-unavailable'
    ]);
    function recordFailure(reason,detail){
      if(!failures.has(reason))return;
      const input=detail&&typeof detail==='object'?detail:{};
      const defaults={
        'webgl-preparation-failed':'preparation-failed',
        'confirmed-webgl-preparation-failed':'preparation-failed',
        'webgl-context-or-render-failure':'unknown-webgl-failure'
      };
      const bounded=(v,max)=>typeof v==='string'?v.slice(0,max):'';
      const count=(n)=>Number.isFinite(n)&&n>=0?Math.round(n):0;
      const resources=input.resources&&typeof input.resources==='object'
        ? {
            proceduralTextures:count(input.resources.proceduralTextures),
            proceduralBytes:count(input.resources.proceduralBytes),
            loadedTextures:count(input.resources.loadedTextures)
          } : null;
      lastFailure=Object.freeze({
        type:bounded(input.type,64)||defaults[reason]||'renderer-failure',
        stage:bounded(input.stage,64)||reason,
        message:bounded(input.message,240)||reason,
        timestampMs:Number.isFinite(input.timestampMs)?input.timestampMs:Date.now(),
        resources
      });
    }
    function remaining(){
      return phase==='trial'?Math.max(0,Math.ceil((deadline-now())/1000)):0;
    }
    function snapshot(reason=''){
      return Object.freeze({mode,phase,secondsRemaining:remaining(),reason,lastFallbackReason,lastFailure});
    }
    function announce(reason=''){notify(snapshot(reason));}
    function clearTimer(){
      if(timer!==null){unschedule(timer);timer=null;}
    }
    function persistCanvas(){
      write(storage,PREFERENCE_KEY,defaultMode);
      remove(storage,PENDING_KEY);
    }
    function fallback(reason='manual-revert',details=null){
      if(closed) return false;
      recordFailure(reason,details);
      ++serial;clearTimer();
      // Canvas owns an independent 2D surface. The integration hook MUST
      // expose it before destroying/hiding the failing GPU canvas.
      try{showCanvas(reason);}finally{
        persistCanvas();
        phase='canvas';mode=defaultMode;deadline=0;
        lastFallbackReason=reason;
        announce(reason);
      }
      return true;
    }
    function pulse(){
      timer=null;
      if(phase!=='trial'||closed)return;
      if(now()>=deadline){fallback('confirmation-timeout');return;}
      announce('awaiting-confirmation');
      timer=schedule(pulse,Math.min(1000,Math.max(1,deadline-now())));
    }
    async function requestWebGL(){
      if(closed||phase!=='canvas')return false;
      const own=++serial;
      phase='preparing';mode='canvas2d';
      // Written BEFORE trying any GPU work. A reload or crash before
      // confirmation forces Canvas on the next startup.
      write(storage,PENDING_KEY,'pending');
      announce('preparing-webgl');
      let stage='preparation';
      try{
        const ready=await prepareWebGL();
        if(closed||own!==serial||phase!=='preparing')return false;
        if(ready!==true){fallback('webgl-preparation-failed',getFailureDetails());return false;}
        // Preparation MUST occur on an invisible separate GPU canvas. Only
        // this synchronous hook may reveal it after resources are ready.
        stage='reveal';
        showWebGL();
        phase='trial';mode='webgl2';deadline=now()+DURATION_MS;
        announce('awaiting-confirmation');
        timer=schedule(pulse,1000);
        return true;
      }catch(error){
        if(!closed&&own===serial)fallback('webgl-error',{
          type:'controller-error',stage,message:String(error?.message||error)
        });
        return false;
      }
    }

    // Only a PREVIOUSLY confirmed choice can resume without a new countdown.
    // Keep Canvas live until its first completed GPU scene and visible controls.
    async function resumeConfirmedWebGL(){
      if(closed||phase!=='canvas'||!armConfirmedBoot(storage))return false;
      const own=++serial;
      phase='preparing';mode=defaultMode;
      announce('restoring-confirmed-webgl');
      let stage='preparation';
      try{
        if(await prepareWebGL()!==true){
          if(own===serial&&!closed)
            fallback('confirmed-webgl-preparation-failed',getFailureDetails());
          return false;
        }
        if(closed||own!==serial||phase!=='preparing')return false;
        stage='reveal';
        showWebGL();
        // Setting mode before committing allows the usual fallback on failure.
        mode='webgl2';
        if(!finishConfirmedBoot(storage)){
          fallback('confirmed-webgl-boot-not-acknowledged');
          return false;
        }
        phase='confirmed';announce('confirmed-webgl-restored');
        return true;
      }catch(error){
        if(!closed&&own===serial)fallback('confirmed-webgl-error',{
          type:'controller-error',stage,message:String(error?.message||error)
        });
        return false;
      }
    }
    function confirm(){
      if(closed||phase!=='trial')return false;
      if(now()>=deadline){fallback('confirmation-timeout');return false;}
      clearTimer();
      // Commit preference only on deliberate Keep WebGL2 confirmation.
      // Write preference BEFORE removing crash marker; failure between
      // these steps causes next startup to choose Canvas safely.
      const committed=write(storage,PREFERENCE_KEY,'webgl2');
      if(committed&&!remove(storage,PENDING_KEY)){
        fallback('webgl-persistence-unavailable');
        return false;
      }
      phase='confirmed';mode='webgl2';deadline=0;announce(
        committed?'user-confirmed':'confirmed-this-session-only');
      return true;
    }
    function check(){
      if(phase==='trial'&&now()>=deadline)
        fallback('confirmation-timeout');
      return snapshot();
    }
    function visibilityChanged(hidden){
      if(hidden&&(phase==='preparing'||phase==='trial'))
        fallback('trial-interrupted');
      else check();
    }
    function webglFailed(details=null){
      if(closed)return false;
      if(mode==='webgl2'||phase==='preparing')
        return fallback('webgl-context-or-render-failure',details||getFailureDetails());
      return false;
    }
    function dispose(){
      if(closed)return;
      if(phase==='trial'||phase==='preparing')fallback('unconfirmed-session-ended');
      clearTimer();closed=true;++serial;
    }
    announce('canvas-default');
    return Object.freeze({
      requestWebGL,resumeConfirmedWebGL,confirm,revert:()=>fallback('user-chose-canvas'),
      check,visibilityChanged,webglFailed,dispose,status:()=>snapshot()
    });
  }
  const api=Object.freeze({
    create,startupChoice,armConfirmedBoot,finishConfirmedBoot,
    PREFERENCE_KEY,PENDING_KEY,DURATION_MS
  });
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.AzerothRendererSwitchGuard=api;
})(typeof window!=='undefined'?window:globalThis);
