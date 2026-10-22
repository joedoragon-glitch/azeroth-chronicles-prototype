/* STAGING ONLY: bounded, explicit residency for ORIGINAL approved sprite art.
   Not imported by the PWA; never edits / paints / substitutes original images. */
(function (root) {
  'use strict';
  const DEFAULT_BUDGET=64*1024*1024;
  const VALID_SOURCE=/^\.\/assets\/sprites\/[a-z0-9_-]+\.(?:png|webp)$/;
  function loadImage(src) {
    return new Promise((resolve,reject)=>{
      const image = new root.Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(Error('Original sprite image failed to load: '+src));
      image.src=src;
    });
  }
  function create({ gpu, loader = loadImage, budgetBytes=DEFAULT_BUDGET,
                    concurrency=2, maxPending=128 }={}) {
    if (!gpu?.registerTexture || !gpu?.releaseTexture || !gpu?.available)
      throw Error('GPU resource owner must support register/release/available');
    if (!Number.isSafeInteger(budgetBytes) || budgetBytes < 4 ||
        !Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 4 ||
        !Number.isSafeInteger(maxPending) || maxPending < 1 || maxPending > 512)
      throw Error('Finite asset budget and work limits required');
    const gpuBudget=gpu.metrics?.().textureBudgetBytes;
    if (Number.isFinite(gpuBudget) && gpuBudget < budgetBytes)
      throw Error('Asset memory budget exceeds its WebGL texture owner budget');
    const resident=new Map(), pending=new Map(), queue=[], pinned=new Set();
    let used=0, active=0, epoch=0, destroyed=false, clock=0;
    const counters={uploads:0,evictions:0,loadFailures:0,staleResults:0};
    function validate(d) {
      if (!d || typeof d.id!=='string' || d.id!==d.src ||
          !VALID_SOURCE.test(d.src) ||
          !Number.isSafeInteger(d.width) || !Number.isSafeInteger(d.height) ||
          d.width<=0 || d.height<=0)
        throw Error('Unapproved or invalid sprite resource descriptor');
      const bytes=d.width*d.height*4;
      if (!Number.isSafeInteger(bytes) || bytes>budgetBytes)
        throw Error('Original image exceeds bounded GPU residency');
      return { ...d, bytes };
    }
    function requireLive() {
      if(destroyed || !gpu.available())
        throw Error('GPU texture residency unavailable; restore Canvas fallback');
    }
    function beginFrame(ids = []) {
      requireLive();
      pinned.clear();
      for(const id of ids) pinned.add(id);
    }
    function touch(id) {
      const r=resident.get(id);
      if(!r)return false;
      r.lastUsed=++clock;
      pinned.add(id);
      return true;
    }
    function evictUntil(bytes, except) {
      while(used+bytes>budgetBytes) {
        const available=[...resident.entries()]
          .filter(([id])=>!pinned.has(id) && id!==except)
          .sort((a,b)=>a[1].lastUsed-b[1].lastUsed);
        if(!available.length)
          throw Error('GPU memory full: active original artwork cannot be evicted');
        const [id,item]=available[0];
        resident.delete(id);used-=item.bytes;
        gpu.releaseTexture(id);
        counters.evictions++;
      }
    }
    function pump() {
      if(destroyed)return;
      while(active<concurrency && queue.length>0) {
        const task=queue.shift();
        if(!pending.has(task.id))continue;
        active++;
        const runEpoch=epoch;
        Promise.resolve().then(()=>loader(task.src)).then((image)=>{
          if(destroyed || runEpoch!==epoch || !gpu.available()) {
            counters.staleResults++;
            throw Error('GPU context or asset generation changed during image loading');
          }
          const width=image?.naturalWidth || image?.width;
          const height=image?.naturalHeight || image?.height;
          if(width!==task.width || height!==task.height)
            throw Error('Original sprite dimensions disagree with approved manifest');
          evictUntil(task.bytes,task.id);
          const resource=gpu.registerTexture(task.id,image);
          resident.set(task.id,{bytes:task.bytes,lastUsed:++clock,
            source:task.src,width,height});
          used+=task.bytes;counters.uploads++;
          task.resolve(resource);
        }).catch((error)=>{
          counters.loadFailures++;
          task.reject(error);
        }).finally(()=>{
          if(pending.get(task.id)===task)pending.delete(task.id);
          active--;pump();
        });
      }
    }
    function ensure(descriptor) {
      try {
        requireLive();
        const d=validate(descriptor);
        const old=resident.get(d.id);
        if(old) {
          if(old.width!==d.width || old.height!==d.height ||
              old.source!==d.src)
            throw Error('Existing GPU image has conflicting approved metadata');
          touch(d.id);
          return Promise.resolve({id:d.id,width:d.width,height:d.height,bytes:d.bytes});
        }
        if(pending.has(d.id)) {
          const task=pending.get(d.id);
          if(task.width!==d.width || task.height!==d.height || task.src!==d.src)
            throw Error('Conflicting concurrent GPU texture descriptor');
          return task.promise;
        }
        if(queue.length+active>=maxPending)
          throw Error('GPU sprite decode queue is full');
        let resolve,reject;
        const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});
        const task={...d,promise,resolve,reject};
        pending.set(d.id,task);queue.push(task);pump();
        return promise;
      } catch(error) {return Promise.reject(error);}
    }
    function has(id) {
      requireLive();
      return touch(id);
    }
    function clear() {
      epoch++;
      for(const task of queue.splice(0)) {
        pending.delete(task.id);
        task.reject(Error('GPU assets invalidated before decode'));
      }
      for(const id of resident.keys()) gpu.releaseTexture(id);
      resident.clear();pinned.clear();used=0;
    }
    function destroy() {
      if(destroyed)return;
      clear();destroyed=true;
    }
    function metrics() {
      return {
        resident:resident.size,bytes:used,budgetBytes,
        pending:pending.size,decoding:active,queued:queue.length,
        ...counters,destroyed
      };
    }
    return Object.freeze({ensure,has,beginFrame,clear,destroy,metrics});
  }
  const api=Object.freeze({create,VALID_SOURCE,DEFAULT_BUDGET});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.AzerothGpuAssetResidency=api;
})(typeof window!=='undefined'?window:globalThis);
