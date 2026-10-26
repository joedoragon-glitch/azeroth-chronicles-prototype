'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const Guard=require('./renderer-switch-guard.js');
function fixture({prepareWebGL=async()=>true,failReveal=false,brokenStorage=false,
  getFailureDetails=()=>null,canRecover=()=>true}={}){
 const values=new Map(),jobs=new Map(),notifications=[],events=[];
 let time=0,next=0,visible='canvas';
 const storage={
   getItem:key=>{if(brokenStorage)throw Error('storage denied');return values.get(key)??null;},
   setItem:(key,value)=>{if(brokenStorage)throw Error('storage denied');values.set(key,value);},
   removeItem:key=>{if(brokenStorage)throw Error('storage denied');values.delete(key);}
 };
 const run=Guard.create({
   storage,prepareWebGL,getFailureDetails,canRecover,
   showWebGL(){events.push('webgl-reveal');if(failReveal)throw Error('GPU reveal unavailable');visible='webgl2';},
   showCanvas(reason){events.push('canvas-reveal:'+reason);visible='canvas';},
   notify:status=>notifications.push(status),
   now:()=>time,
   schedule:(callback,delay)=>{const id=++next;jobs.set(id,{callback,at:time+delay});return id;},
   unschedule:id=>jobs.delete(id)
 });
 function advance(ms){
   time+=ms;
   for(let attempts=0;attempts<30;attempts++){
     const ready=[...jobs].filter(([,v])=>v.at<=time).sort((a,b)=>a[1].at-b[1].at);
     if(!ready.length)return;
     const [id,entry]=ready[0];jobs.delete(id);entry.callback();
   }
   throw Error('Test timer loop failed to settle');
 }
 return {run,values,storage,jobs,notifications,events,advance,get visible(){return visible}};
}
test('Canvas 2D default and a previously confirmed WebGL2 preference are distinct',()=>{
 const f=fixture();
 assert.deepEqual(Guard.startupChoice(f.storage),
   {renderer:'canvas2d',reason:'canvas-default'});
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 assert.deepEqual(Guard.startupChoice(f.storage),
   {renderer:'webgl2',reason:'confirmed-preference'});
 f.storage.setItem(Guard.PREFERENCE_KEY,'hybrid');
 assert.equal(Guard.startupChoice(f.storage).renderer,'canvas2d');
 f.run.dispose();
});
test('interrupted unconfirmed trial marker forces Canvas on next start',()=>{
 const f=fixture();
 f.storage.setItem(Guard.PENDING_KEY,'pending');
 assert.deepEqual(Guard.startupChoice(f.storage),
   {renderer:'canvas2d',reason:'interrupted-trial'});
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 f.run.dispose();
});
test('WebGL preparation keeps Canvas visible and does not save WebGL before confirmation',async()=>{
 let resolve;
 const f=fixture({prepareWebGL:()=>new Promise(ok=>{resolve=ok})});
 const trial=f.run.requestWebGL();
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.status().phase,'preparing');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),null);
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),'pending');
 resolve(true);
 assert.equal(await trial,true);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().secondsRemaining,15);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),null);
 f.run.dispose();
});
test('without explicit Keep confirmation, WebGL automatically reverts at 15 seconds',async()=>{
 const f=fixture();assert.equal(await f.run.requestWebGL(),true);
 f.advance(13000);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().secondsRemaining,2);
 f.advance(1999);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().secondsRemaining,1);
 f.advance(1);
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.status().phase,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 assert.equal(f.jobs.size,0);
 assert.equal(f.run.confirm(),false);
 f.run.dispose();
});
test('Keep WebGL2 explicitly confirms before deadline and cancels the reset',async()=>{
 const f=fixture();
 assert.equal(await f.run.requestWebGL(),true);
 f.advance(14000);
 assert.equal(f.run.confirm(),true);
 assert.equal(f.run.status().phase,'confirmed');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 f.advance(20000);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.jobs.size,0);
 f.run.dispose();
});
test('confirmation at or after expiry is rejected even when a timer was throttled',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.advance(15000);
 assert.equal(f.run.confirm(),false);
 assert.equal(f.visible,'canvas');
 f.run.dispose();
});
test('failed WebGL initialization or failed reveal automatically exposes Canvas',async()=>{
 const fails=fixture({prepareWebGL:async()=>false});
 assert.equal(await fails.run.requestWebGL(),false);
 assert.equal(fails.visible,'canvas');
 assert.equal(fails.storage.getItem(Guard.PENDING_KEY),null);
 const throws=fixture({prepareWebGL:async()=>{throw Error('compile failed')}});
 assert.equal(await throws.run.requestWebGL(),false);
 assert.equal(throws.visible,'canvas');
 const reveal=fixture({failReveal:true});
 assert.equal(await reveal.run.requestWebGL(),false);
 assert.equal(reveal.visible,'canvas');
 for(const f of [fails,throws,reveal])f.run.dispose();
});
test('confirmed WebGL context loss uses Canvas without deleting player preference',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.run.confirm();
 assert.equal(f.run.webglFailed(),true);
 assert.equal(f.visible,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.run.status().preferredRenderer,'webgl2');
 assert.equal(f.run.status().recoveryPending,true);
 assert.equal(f.run.webglFailed(),false);
 f.run.dispose();
});
test('visibility loss automatically exits the unconfirmed graphics trial',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.run.visibilityChanged(true);
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.status().reason,'');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 f.run.dispose();
});
test('a late async GPU preparation cannot re-enable WebGL after fallback',async()=>{
 let resolve;
 const f=fixture({prepareWebGL:()=>new Promise(ok=>{resolve=ok})});
 const pending=f.run.requestWebGL();
 f.run.visibilityChanged(true);
 resolve(true);
 assert.equal(await pending,false);
 assert.equal(f.visible,'canvas');
 assert.equal(f.events.some(x=>x==='webgl-reveal'),false);
 f.run.dispose();
});
test('a second WebGL request cannot restart or extend an active 15-second trial',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.advance(12000);
 assert.equal(await f.run.requestWebGL(),false);
 assert.equal(f.run.status().secondsRemaining,3);
 f.advance(3000);
 assert.equal(f.visible,'canvas');
 f.run.dispose();
});
test('manual revert resets preference and refuses a late Keep action',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.run.revert();
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.confirm(),false);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 f.run.dispose();
});
test('storage blocked: timeout still protects Canvas and next boot defaults safely',async()=>{
 const f=fixture({brokenStorage:true});
 await f.run.requestWebGL();
 f.advance(15000);
 assert.equal(f.visible,'canvas');
 assert.equal(Guard.startupChoice(f.storage).renderer,'canvas2d');
 f.run.dispose();
});
test('unconfirmed renderer is reverted when its settings controller is disposed',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.run.dispose();
 assert.equal(f.visible,'canvas');
 assert.equal(f.jobs.size,0);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 assert.equal(await f.run.requestWebGL(),false);
});

test('confirmed WebGL crash quarantines auto boot without erasing player preference',()=>{
 const f=fixture();
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 assert.equal(Guard.armConfirmedBoot(f.storage),true);
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),'pending');
 assert.equal(Guard.startupChoice(f.storage).renderer,'canvas2d');
 assert.equal(Guard.startupChoice(f.storage).reason,'confirmed-recovery-quarantined');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.storage.getItem(Guard.RECOVERY_HOLD_KEY),'interrupted-restore');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 f.run.dispose();
});
test('a completed confirmed WebGL boot clears only its crash marker',()=>{
 const f=fixture();
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 assert.equal(Guard.armConfirmedBoot(f.storage),true);
 assert.equal(Guard.finishConfirmedBoot(f.storage),true);
 assert.equal(Guard.startupChoice(f.storage).renderer,'webgl2');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 assert.equal(Guard.finishConfirmedBoot(f.storage),false);
 f.run.dispose();
});
test('if crash-marker storage is unavailable, automatic WebGL boot must be refused',()=>{
 const f=fixture({brokenStorage:true});
 assert.equal(Guard.armConfirmedBoot(f.storage),false);
 assert.equal(Guard.startupChoice(f.storage).renderer,'canvas2d');
 f.run.dispose();
});

test('a saved WebGL2 choice resumes after a verified frame without a countdown',async()=>{
 const f=fixture();
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 assert.equal(await f.run.resumeConfirmedWebGL(),true);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().phase,'confirmed');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 f.run.dispose();
});
test('failed confirmed startup keeps Canvas visible and the saved choice recoverable',async()=>{
 const f=fixture({prepareWebGL:async()=>false});
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 assert.equal(await f.run.resumeConfirmedWebGL(),false);
 assert.equal(f.visible,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.run.status().recoveryPending,true);
 f.run.dispose();
});
test('a hidden tab while preparing confirmed WebGL cannot later reveal the GPU',async()=>{
 let done;
 const f=fixture({prepareWebGL:()=>new Promise(resolve=>done=resolve)});
 f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
 const pending=f.run.resumeConfirmedWebGL();
 f.run.visibilityChanged(true);
 done(true);
 assert.equal(await pending,false);
 assert.equal(f.visible,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.run.status().recoveryPending,true);
 f.run.dispose();
});


test('Home Screen interruption cancels a pending trial and preserves fallback diagnostics',async()=>{
 const f=fixture();
 assert.equal(await f.run.requestWebGL(),true);
 f.run.visibilityChanged(true);
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.status().lastFallbackReason,'trial-interrupted');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 f.run.dispose();
});
test('confirmed renderer survives temporary Home Screen backgrounding',async()=>{
 const f=fixture();
 assert.equal(await f.run.requestWebGL(),true);
 assert.equal(f.run.confirm(),true);
 f.run.visibilityChanged(true);
 f.run.visibilityChanged(false);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().phase,'confirmed');
 assert.equal(f.run.status().lastFallbackReason,'');
 f.run.dispose();
});
test('WebGL context failure exposes Canvas and retains precise last failure for reports',async()=>{
 const f=fixture();
 await f.run.requestWebGL();
 f.run.confirm();
 f.run.webglFailed();
 assert.equal(f.run.status().lastFallbackReason,'webgl-context-or-render-failure');
 assert.equal(f.run.status().mode,'canvas2d');
 f.run.dispose();
});

test('reported context loss survives recovery with precise pre-cleanup resources',async()=>{
  const f=fixture();
  await f.run.requestWebGL();f.run.confirm();
  const info={type:'context-loss',stage:'webglcontextlost',
    message:'WebGL context lost',timestampMs:123456,
    resources:{loadedTextures:38,proceduralTextures:694,proceduralBytes:51564024}};
  assert.equal(f.run.webglFailed(info),true);
  const result=f.run.status();
  assert.equal(result.lastFallbackReason,'webgl-context-or-render-failure');
  assert.equal(result.lastFailure.type,'context-loss');
  assert.equal(result.lastFailure.stage,'webglcontextlost');
  assert.equal(result.lastFailure.timestampMs,123456);
  assert.equal(result.lastFailure.resources.proceduralTextures,694);
  assert.equal(result.lastFailure.resources.proceduralBytes,51564024);
  assert.equal(f.visible,'canvas');
  assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
  assert.equal(await f.run.requestWebGL(),true);
  assert.equal(f.run.confirm(),true);
  assert.equal(f.run.status().lastFailure.type,'context-loss',
    'last real failure remains available after retry');
  f.run.revert();
  assert.equal(f.run.status().lastFailure.type,'context-loss',
    'manual switching is not mislabeled as a GPU error');
  f.run.dispose();
});
test('late real WebGL context-loss signal refines earlier render exception without a second fallback',async()=>{
 const f=fixture();
 await f.run.requestWebGL();f.run.confirm();
 assert.equal(f.run.webglFailed({type:'render-exception',stage:'scene-render',
   message:'Failed to draw',resources:{loadedTextures:38,proceduralTextures:30,proceduralBytes:65536}}),true);
 const before=f.events.length;
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.webglFailed({type:'context-loss',stage:'webglcontextlost',
   message:'WebGL context lost',resources:{loadedTextures:0,proceduralTextures:0}}),false);
 assert.equal(f.events.length,before,'late diagnosis cannot start another fallback');
 const state=f.run.status();
 assert.equal(state.lastFailure.type,'context-loss');
 assert.equal(state.lastFailure.stage,'webglcontextlost');
 assert.equal(state.lastFailure.resources.loadedTextures,38,'retain pre-disposal evidence');
 assert.equal(state.lastFallbackReason,'webgl-context-or-render-failure');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.run.webglFailed({type:'viewport-changed',stage:'resize'}),false);
 assert.equal(f.run.status().lastFailure.type,'context-loss',
   'later unrelated events must not replace the established cause');
 f.run.dispose();
});
test('render, viewport and unexpected wrapper errors keep separate failure categories',async()=>{
  const f=fixture();
  await f.run.requestWebGL();f.run.confirm();
  assert(f.run.webglFailed({type:'render-exception',stage:'scene-render',message:'Invalid texture'}));
  assert.equal(f.run.status().lastFailure.type,'render-exception');
  assert.equal(f.run.status().lastFailure.stage,'scene-render');
  assert.equal(f.visible,'canvas');
  await f.run.requestWebGL();f.run.confirm();
  assert(f.run.webglFailed({type:'viewport-changed',stage:'resize',message:'Viewport changed'}));
  assert.equal(f.run.status().lastFailure.type,'viewport-changed');
  await f.run.requestWebGL();f.run.confirm();
  assert(f.run.webglFailed());
  assert.equal(f.run.status().lastFailure.type,'unknown-webgl-failure');
  f.run.dispose();
});
test('failed preparation copies the Pixi root error before the scene is disposed',async()=>{
  const info={type:'context-unavailable',stage:'webgl2-context',
    message:'WebGL2 context not available',timestampMs:250,
    resources:{loadedTextures:0,proceduralTextures:0,proceduralBytes:0}};
  const f=fixture({prepareWebGL:async()=>false,getFailureDetails:()=>info});
  assert.equal(await f.run.requestWebGL(),false);
  assert.equal(f.run.status().lastFallbackReason,'webgl-preparation-failed');
  assert.deepEqual(f.run.status().lastFailure,info);
  assert.equal(f.visible,'canvas');
  f.run.dispose();
  const errors=fixture({failReveal:true});
  assert.equal(await errors.run.requestWebGL(),false);
  assert.equal(errors.run.status().lastFailure.type,'controller-error');
  assert.equal(errors.run.status().lastFailure.stage,'reveal');
  assert.match(errors.run.status().lastFailure.message,/GPU reveal unavailable/);
  errors.run.dispose();
});
test('failed confirmed restore retains preparation details without exposing WebGL',async()=>{
  const f=fixture({
    prepareWebGL:async()=>false,
    getFailureDetails:()=>({type:'preparation-failed',stage:'sprite-preload',
      message:'approved sprite missing'})
  });
  f.storage.setItem(Guard.PREFERENCE_KEY,'webgl2');
  assert.equal(await f.run.resumeConfirmedWebGL(),false);
  assert.equal(f.run.status().lastFallbackReason,'confirmed-webgl-preparation-failed');
  assert.equal(f.run.status().lastFailure.stage,'sprite-preload');
  assert.equal(f.run.status().mode,'canvas2d');
  f.run.dispose();
});

test('confirmed choice automatically restores after stable idle backoff',async()=>{
 const f=fixture();
 await f.run.requestWebGL();f.run.confirm();
 f.run.webglFailed({type:'context-loss',stage:'webglcontextlost'});
 assert.equal(f.visible,'canvas');
 assert.equal(f.run.status().recoveryAttempts,0);
 assert.equal(await f.run.maybeRecover(),false,'do not immediately thrash the GPU');
 f.advance(4999);
 assert.equal(await f.run.maybeRecover(),false);
 f.advance(1);
 assert.equal(await f.run.maybeRecover(),true);
 assert.equal(f.visible,'webgl2');
 assert.equal(f.run.status().phase,'confirmed');
 assert.equal(f.run.status().recoveryPending,false);
 assert.equal(f.run.status().recoveryAttempts,1);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 assert.equal(f.storage.getItem(Guard.PENDING_KEY),null);
 assert.equal(f.run.status().lastFailure.type,'context-loss');
 f.run.dispose();
});
test('never retry while hidden or in combat; revisit safety after async preparation',async()=>{
 let safe=false,finish;
 let prepares=0;
 const f=fixture({
   canRecover:()=>safe,
   prepareWebGL:()=>++prepares===1?Promise.resolve(true):
     new Promise(done=>{finish=done})
 });
 await f.run.requestWebGL();f.run.confirm();f.run.webglFailed();
 f.advance(5000);
 assert.equal(await f.run.maybeRecover(),false,'busy scene prohibits background retry');
 safe=true;
 f.run.visibilityChanged(true);
 assert.equal(await f.run.maybeRecover(),false,'hidden iPhone must not spin GPU');
 f.run.visibilityChanged(false);
 const pending=f.run.maybeRecover();
 assert.equal(f.run.status().phase,'preparing');
 safe=false; // The hero moved into combat during async texture preparation.
 finish(true);
 assert.equal(await pending,false);
 assert.equal(f.visible,'canvas','do not reveal GPU during combat');
 assert.equal(f.run.status().recoveryPending,true);
 assert.equal(f.run.status().recoveryAttempts,0,'deferral does not consume attempt budget');
 f.run.dispose();
});
test('repeated failures stop automatic thrashing; manual Canvas cancels recovery',async()=>{
 let prepares=0;
 const f=fixture({prepareWebGL:async()=>++prepares===1});
 await f.run.requestWebGL();f.run.confirm();f.run.webglFailed();
 f.advance(5000);
 assert.equal(await f.run.maybeRecover(),false);
 assert.equal(f.run.status().recoveryAttempts,1);
 assert.equal(f.run.status().recoveryPending,true);
 f.advance(19999);
 assert.equal(await f.run.maybeRecover(),false);
 f.advance(1);
 assert.equal(await f.run.maybeRecover(),false);
 assert.equal(f.run.status().recoveryAttempts,2);
 assert.equal(f.run.status().recoveryPaused,true);
 assert.equal(f.run.status().recoveryPending,false);
 assert.equal(f.visible,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'webgl2');
 f.advance(180000);
 assert.equal(await f.run.maybeRecover(),false);
 assert.equal(prepares,3,'bounded total attempts plus initial opt-in');
 assert.equal(f.run.revert(),true);
 assert.equal(f.run.status().preferredRenderer,'canvas2d');
 assert.equal(f.run.status().recoveryPaused,false);
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 assert.equal(f.storage.getItem(Guard.RECOVERY_HOLD_KEY),null);
 f.run.dispose();
});
test('explicit Canvas choice cancels pending recovery and stale late GPU completion',async()=>{
 const f=fixture();
 await f.run.requestWebGL();f.run.confirm();
 f.run.webglFailed();
 assert.equal(f.run.status().recoveryPending,true);
 f.run.revert();
 f.advance(90000);
 assert.equal(await f.run.maybeRecover(),false);
 assert.equal(f.visible,'canvas');
 assert.equal(f.storage.getItem(Guard.PREFERENCE_KEY),'canvas2d');
 f.run.dispose();
});
test('session-only confirmation without storage cannot automatically retry',async()=>{
 const f=fixture({brokenStorage:true});
 await f.run.requestWebGL();assert.equal(f.run.confirm(),true);
 f.run.webglFailed();
 assert.equal(f.run.status().recoveryPending,false);
 assert.equal(f.run.status().mode,'canvas2d');
 f.run.dispose();
});
