'use strict';
// Detect overt cross-region changes on one-region PRs. Runtime negative controls
// and owner review must also establish that shared code has no indirect effects.
const cp = require('node:child_process');
const aliases = {
  vale: ['greenwood','vale'],
  highlands: ['ironroot','highlands','stonecross','ogre-hearth','quarry'],
  march: ['flooded','marches','march','reedport'],
  frontier: ['ashen','frontier','emberwatch'],
  crown: ['crown','cindermaw'],
};
const owned = {
  'src/prototype/greenwood.js':'vale',
  'src/prototype/highlands.js':'highlands',
  'tests/ironroot-highlands.test.cjs':'highlands',
};
const geography = /^src\/prototype\/(?:world|rules|data|visuals|renderer|materials|ground-cache|navigation|save|engine|greenwood|highlands)\.js$/;
function named(text) {
  const s = String(text || '').toLowerCase(), matches = new Set();
  for (const [id, labels] of Object.entries(aliases))
    for (const label of labels)
      if (new RegExp('(^|[^a-z])' + label + '(?=$|[^a-z])').test(s)) matches.add(id);
  return [...matches];
}
function parse(diff) {
  const out = [];
  let cur;
  for (const line of String(diff).split('\n')) {
    const head = /^diff --git a\/(.*?) b\/(.*)$/.exec(line);
    if (head) { cur = {path:head[2], adds:[]}; out.push(cur); }
    else if (cur && line.startsWith('+++ b/')) cur.path=line.slice(6);
    else if (cur && line.startsWith('+') && !line.startsWith('+++')) cur.adds.push(line.slice(1));
  }
  return out;
}
function audit({branch,title,diff}) {
  const b=named(branch), t=named(title), errors=[];
  if(b.length>1) errors.push('Branch names more than one region: '+b.join(','));
  if(!b.length && t.length>1) errors.push('Title names multiple regions; declare one region in branch');
  const scope=b[0]||t[0]||null, entries=parse(diff);
  if(!scope) {
    const touched=entries.filter(e=>owned[e.path]);
    if(touched.length) errors.push('Regional module edited without naming one authorized region: '+touched.map(e=>e.path).join(','));
  }
  if(scope) for(const e of entries) {
    if(owned[e.path] && owned[e.path]!==scope) {
      errors.push(e.path+' belongs to '+owned[e.path]+' not '+scope);
      continue;
    }
    if(!geography.test(e.path)) continue;
    for(const line of e.adds) {
      const foreign=named(line).filter(id=>id!==scope);
      if(foreign.length) errors.push(e.path+': added source references '+foreign.join(',')+': '+line.trim().slice(0,160));
    }
  }
  return {scope, errors};
}
function main() {
  const branch=process.env.PR_HEAD_REF||'', title=process.env.PR_TITLE||'';
  if(!branch&&!title) return console.log('Region scope: not a PR');
  const base=process.env.CI_BASE_SHA;
  if(!base || !/^[a-f0-9]{7,40}$/i.test(base)) throw Error('Missing exact PR base SHA');
  const diff=cp.execFileSync('git', ['diff','--no-ext-diff','--unified=0',base+'...HEAD','--','src/prototype','tests'],{encoding:'utf8',maxBuffer:12*1024*1024});
  const result=audit({branch,title,diff});
  if(result.errors.length) {
    console.error('SCOPE VIOLATION ('+(result.scope||'undeclared')+')\n'+result.errors.join('\n'));
    console.error('Park other-region findings and obtain the owner’s prior permission.');
    process.exitCode=1;
  } else console.log('Region source-scope check passed; indirect effects still require negative-control tests.');
}
if(require.main===module) main();
module.exports={audit,named,parse};
