'use strict';
// The page runs entirely from an extracted local folder. No telemetry,
// network calls, game save, or artistic approval is performed automatically.
(()=> {
 const d=window.ENV727_DATA;
 if(!d||d.rows?.length!==18)throw Error('Source-verified Stage 7 comparison metadata absent');
 const $=id=>document.getElementById(id),amb=$('amb'),score=$('score'),warning=$('warning');
 const scene=$('scene'),status=$('status'),notes=$('notes'),decision=$('decision');
 let current=0,mode='old',feedback={};
 function store(){
   const r=d.rows[current];if(r)feedback[r.rule]={choice:decision.value,notes:notes.value};
 }
 function silence(){
   for(const item of [amb,score,warning]){item.pause();item.currentTime=0;}
 }
 function setStatus(t){status.textContent=t;}
 function volume(){
   amb.volume=Number($('bed-volume').value)/100;
   score.volume=Number($('music-volume').value)/100;
   warning.volume=Math.min(1,Number($('warning-volume').value)/100);
 }
 function show(i){
   if(d.rows[current])store();
   silence();current=i;mode='old';
   const r=d.rows[i],f=feedback[r.rule]||{};
   $('label').textContent=r.title;
   $('identity').textContent='Scene: '+r.zone+' | Existing: '+r.old.id+' | Candidate: '+
     (r.proposal?.id||'none — retain original')+' | In-game environment gain '+r.gain;
   $('music-identity').textContent='Published soundtrack: '+r.music.id;
   $('creative').textContent=r.keep?'Retention decision: no new recording was necessary.':
     r.alternative?'Unselected Crown alternate: compare but do not assume improvement.':
     'Unapproved new source: compare against the currently registered sound, not against silence.';
   decision.value=f.choice||'undecided';notes.value=f.notes||'';
   $('candidate').disabled=!r.proposal;
   $('candidate').textContent=r.proposal?'Play preview':'No new preview';
   amb.src=r.old.src;score.src=r.music.src;warning.src=d.critical.src;
   $('music').checked=false;
   setStatus('Ready. Select original or preview to listen; enabling music is optional.');
 }
 async function play(which){
   const r=d.rows[current],chosen=which==='new'?r.proposal:r.old;
   if(!chosen){setStatus('This room intentionally keeps its original recording.');return;}
   mode=which;amb.pause();amb.src=chosen.src;amb.loop=true;amb.currentTime=0;
   volume();
   try{
     await amb.play();
     setStatus('Listening to '+(which==='new'?'PREVIEW: ':'ORIGINAL: ')+chosen.id+
       '. This is a local comparison, not the real game audio mix.');
     if($('music').checked){score.currentTime=0;await score.play();}
   }catch(e){setStatus('Browser blocked audio: '+e.message+' — press play in the audio controls.');}
 }
 scene.replaceChildren(...d.rows.map((r,i)=>{
   const x=document.createElement('option');x.value=String(i);x.textContent=r.title;
   return x;
 }));
 scene.addEventListener('change',()=>show(Number(scene.value)));
 $('original').addEventListener('click',()=>play('old'));
 $('candidate').addEventListener('click',()=>play('new'));
 $('pause').addEventListener('click',()=>{amb.pause();score.pause();setStatus('Paused both sources.');});
 $('music').addEventListener('change',async()=>{
   volume();if(!$('music').checked){score.pause();return;}
   try{score.currentTime=0;await score.play();}
   catch(e){setStatus('Music playback: '+e.message);}
 });
 $('critical').addEventListener('click',async()=>{
   warning.currentTime=0;volume();
   try{await warning.play();}catch(e){setStatus('Warning sample: '+e.message);}
 });
 for(const id of ['bed-volume','music-volume','warning-volume'])
   $(id).addEventListener('input',volume);
 decision.addEventListener('change',store);notes.addEventListener('input',store);
 $('export').addEventListener('click',()=>{
   store();
   const lines=['SIBDLP #727 Stage 7 — human listening notes',
     'This is a manually supplied preference record; not a merged/deployed/device-verified result.',
     'Current published score; independent preview room, not game compressor.', ''];
   for(const r of d.rows){
     const v=feedback[r.rule]||{};
     lines.push(r.title+' | old '+r.old.id+' | preview '+(r.proposal?.id||'none')+
       ' | '+(v.choice||'undecided'));
     if(v.notes?.trim())lines.push('  '+v.notes.trim().replace(/\r?\n/g,' / '));
   }
   const file=new Blob([lines.join('\n')+'\n'],{type:'text/plain'});
   const url=URL.createObjectURL(file),a=document.createElement('a');
   a.href=url;a.download='SIBDLP-environmental-listening-decisions.txt';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
   setStatus('Exported one decision sheet with all eighteen comparisons.');
 });
 show(0);
})();
