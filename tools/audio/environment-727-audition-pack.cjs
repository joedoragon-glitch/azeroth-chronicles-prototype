'use strict';
// #727 Stage 7: generate a single source-verified offline listening packet.
// The packet is for OWNER CREATIVE COMPARISON ONLY. It does not register audio,
// reproduce the game's compressor, publish a preview site or make a hearing claim.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const original=read('_site-env727-baseline/assets/audio/manifest.json');
const report=read('test-results/environment-727-stage6-trial.json');
assert.equal(Object.keys(original.assets).length,131,'Reference must be the published 131-ID score/ambience catalog');
assert.equal(report.studies.length,16);
assert.equal(report.trialsSelected.length,15);
assert.equal(report.retainedTreasuries.length,2);
const archive=fs.existsSync(path.join(root,'tools/audio/frozen-preview'))
  ?path.join(root,'tools/audio/frozen-preview'):path.join(root,'tools/audio/.stage6-artifacts');
const target=path.join(root,'test-results/environment-727-listening-room');
fs.rmSync(target,{recursive:true,force:true});
fs.mkdirSync(target,{recursive:true});
const SHA=(b)=>crypto.createHash('sha256').update(b).digest('hex');
const copied=new Map();
function addAsset(id,folder){
  const item=original.assets[id];
  assert(item && ['music','ambience','effect'].includes(item.kind),'Missing current-game asset '+id);
  const src=item.src.slice(2);
  assert(item.src.startsWith('./assets/audio/')&& !src.split('/').includes('..') && /\.mp3$/.test(src));
  const bytes=fs.readFileSync(path.join(root,src));
  assert.equal(SHA(bytes),item.sha256,'Published-reference hash changed: '+id);
  const rel='audio/'+folder+'/'+id+'.mp3';
  if(!copied.has(rel)){fs.mkdirSync(path.dirname(path.join(target,rel)),{recursive:true});fs.writeFileSync(path.join(target,rel),bytes);copied.set(rel,bytes.length);}
  return {id,src:rel,title:item.title||id,sha256:item.sha256,bytes:bytes.length};
}
const trials=new Map(report.studies.map(x=>[x.id,x]));
function addTrial(id){
  const item=trials.get(id);
  assert(item,'Unrecognized frozen preview '+id);
  const file=path.join(archive,id+'.mp3');
  assert(fs.existsSync(file),'Missing actual physical Stage 2-5 master: '+file);
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.length,item.bytes,'Changed frozen preview size: '+id);
  assert.equal(SHA(bytes),item.sha256,'Changed frozen preview SHA-256: '+id);
  const rel='audio/preview/'+id+'.mp3';
  if(!copied.has(rel)){fs.mkdirSync(path.dirname(path.join(target,rel)),{recursive:true});fs.writeFileSync(path.join(target,rel),bytes);copied.set(rel,bytes.length);}
  return {id,src:rel,title:id,sha256:item.sha256,bytes:bytes.length};
}
const labels={
 'vale':'Greenwood Vale — day','vale-night':'Greenwood Vale — night',
 'march':'Flooded Marches — day','march-night':'Flooded Marches — night',
 'crown':'Dark Crown — open courtyard','crown-alt':'Dark Crown — enclosed wind alternative',
 'crypt':'Forest Crypt','archive':'Sunken Archive','mine':'Colossus Mine',
 'abyss':'Abyss Bastion','citadel':'Citadel of Ashes',
 'side-vale-cellars':'Old Orchard Cellars','side-march-watchhouse':'Drowned Watchhouse',
 'side-crown-foundry':'Ruined Foundry','supply-vale':'Scornfang Treasury — retain original',
 'supply-march':'Mirejaw Treasury','supply-highlands':'Ridge Tyrant Treasury — retain original',
 'supply-crown':'Cindermaw Treasury'};
function zoneFor(rule){return rule.startsWith('stage6-')?rule.slice(7):
    rule.endsWith('-night')?rule.slice(0,-6):rule;}
function soundtrack(zone,rule){
  const dir=original.director.places[zone];
  assert(dir,'Unknown current-game music scene '+zone);
  return addAsset(rule.endsWith('-night') ? dir.night : dir.base,'music');
}
function row({rule,original:oldId,trial,gain,keep=false,alternative=false}){
  const zone=zoneFor(rule);
  return {rule,zone,title:labels[rule]||zone,old:addAsset(oldId,'original'),
    proposal:trial?addTrial(trial):null,
    music:soundtrack(zone,rule),
    gain,keep,alternative};
}
const rows=report.trialsSelected.map(t=>row(t));
rows.push(row({rule:'crown-alt',original:'env-crown-courtyard',trial:'study-crown-enclosed-727',
  gain:report.originalRouting.find(r=>r.id==='crown').gain,alternative:true}));
for(const zone of report.retainedTreasuries){
  assert(['supply-vale','supply-highlands'].includes(zone),'Unexpected keep choice');
  rows.push(row({rule:zone,original:'env-home',gain:report.originalRouting.find(r=>r.id==='homes').gain,keep:true}));
}
assert.equal(rows.length,18);
assert.equal(rows.filter(r=>r.proposal).length,16);
assert.equal(new Set(rows.filter(r=>r.proposal).map(r=>r.proposal.id)).size,16);
const critical=addAsset('sfx-critical-warning','effects');
const metadata={
 title:'So I Became the Dark Lord’s Problem — Environmental Sound Stage 7',
 caveat:'Offline listening reference, NOT the actual game mixer. Owner hearing/creative acceptance not yet performed.',
 recordingCount:16,placeCount:13,
 rows,critical,
 sourceHead:report.sourceBase,
 baseCatalogAssets:Object.keys(original.assets).length,
 sourceLedgers:report.studies.map(s=>({id:s.id,stage:s.stage,referenceBed:s.referenceBed,sha256:s.sha256,bytes:s.bytes}))
};
const dir=path.join(root,'tools/audio/environment-727-audition');
for(const file of ['index.html','player.js'])fs.copyFileSync(path.join(dir,file),path.join(target,file));
const safe=JSON.stringify(metadata).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
fs.writeFileSync(path.join(target,'data.js'),'window.ENV727_DATA='+safe+';\n');
fs.writeFileSync(path.join(target,'README.txt'),
  'SIBDLP / #727 ENVIRONMENTAL LISTENING ROOM — OWNER-ONLY CREATIVE COMPARISON\n\n'+
  'Open index.html in a desktop browser after downloading and extracting the entire artifact.\n'+
  'Select each room, switch Old / Preview, listen through long loops, then optionally enable the current soundtrack.\n'+
  'Two Treasuries intentionally have no candidate; the second Crown exterior is an unselected alternate.\n'+
  'The page is fully local. It does not update the game, save data, use network services, or prove real game mixer levels.\n'+
  'Choose Keep / Prefer preview / Undecided and Export notes to return one compact creative verdict.\n'+
  'Do not mistake the in-page warning sample for an in-game combat warning test.\n'+
  'Source provenance: issue #727, staged drafts #731 #734 #741 #743 #744; all 16 MP3s SHA-verified against frozen stage ledgers.\n'+
  'No stage source has been approved, registered as playable, merged into the game catalog, or device-verified by this bundle.\n');
const stats=[...copied.values()].reduce((x,y)=>x+y,0);
assert(stats<256*1024*1024);
console.log('PASS #727 Stage7 isolated OWNER listening packet: 18 comparisons, 16 source-verified preview MP3s, '+
  '2 retained originals, '+copied.size+' unique original/preview/music/warning files, '+
  (stats/1048576).toFixed(2)+' MiB encoded. ZERO playable audio registrations.');
