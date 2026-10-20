from pathlib import Path
import json,base64,re,copy,io
from PIL import Image
root=Path(__file__).resolve().parent/'approved-art-pass';data=json.loads((root/'asset-assessment.json').read_text());images={}
def add(im):
 p=im['path'];images[p]='data:image/webp;base64,'+base64.b64encode((root/p).read_bytes()).decode()
compact=[]
for i,r in enumerate(data['cases'],1):
 for im in r['images']+r['afterImages']:add(im)
 a=r['assessment'];keys=['label','path','width','height','mode','scale']
 compact.append({'number':i,'id':r['id'],'name':r['title'],'category':r['category'],'priority':r['priority'],'verdict':('refine' if r.get('retentionOverride') else a['verdict']),'observation':a['observation'],'plan':a['plan'],'benefit':a['benefit'],'preserve':r['preserve'],'usage':r['usageNote'],'source':r.get('sourceCommit',data['workingReference']),'owner':r.get('owner'),'variants':r['variantNotes'],'images':[{k:v for k,v in im.items()if k in keys}for im in r['images']],'afterImages':[{k:v for k,v in im.items()if k in keys}for im in r['afterImages']],'status':r['implementationStatus'],'implementation':r['implementationNote'],'accepted':r.get('resultAppearanceAccepted',False),'resultReviewStatus':r.get('resultReviewStatus','')})
scenes=[]
for device in [1280,375]:
 for scene in ['vale-town','march-mire','highlands-town','frontier-orcs','crown-lineages','captive-forge','royal-mage','royal-ranger','crown-night']:
  pair=[]
  for stage in ['before','after']:
   source=root/'native-scenes'/f'{stage}-{scene}-{device}.png';dest=source.with_suffix('.webp');im=Image.open(source if source.exists() else dest);
   if source.exists():
    buffer=io.BytesIO();im.save(buffer,'WEBP',quality=90,method=6);dest.write_bytes(buffer.getvalue());
   meta={'path':str(dest.relative_to(root)),'width':im.width,'height':im.height,'mode':'native','label':stage.title()+' · '+str(device)+' px browser layout'};add(meta);pair.append(meta)
  scenes.append({'title':scene.replace('-',' ').title()+(' · desktop'if device==1280 else' · phone browser'),'images':pair})
payload=json.dumps({'cases':compact,'images':images,'baseline':data['baseline'],'workingReference':data['workingReference'],'limits':data['limitations'],'afterSource':data['implementation']['sourceCommit'],'sourceSHA':data['implementation']['visualSourceSHA256'],'scenes':scenes,'approval':data['approval']},ensure_ascii=False).replace('</',r'<\/')
template=(Path(__file__).resolve().parent/'assessment-original-template.html').read_text()
def replace(old,new):
 global template
 assert old in template,old[:90];template=template.replace(old,new,1)
template=template.replace('<title>Procedural Art — Asset Review</title>','<title>Procedural Art — Before &amp; After Review</title>')
template=template.replace('grid-template-columns:minmax(0,1fr) 130px','grid-template-columns:repeat(2,minmax(0,1fr))').replace('grid-template-columns:minmax(0,1fr) 95px','grid-template-columns:repeat(2,minmax(0,1fr))')
template=template.replace('A visual worklist for bringing the whole world toward the rounded anatomy, coherent equipment and material finish of the latest Ogre and Orc work.','The completed procedural pass, with the original assessment and paired images for your asset-by-asset review.')
template=template.replace('Procedural art, asset by asset','Procedural art · before &amp; after').replace('Your decisions','Result reviews')
# Preserve the original catalog's familiar card and navigation layout.
a=template.index('<section class="guide">');b=template.index('</section>',a)+len('</section>')
template=template[:a]+'''<section class="guide"><p><strong>All 513 plans approved · 465 refinements/rebuilds implemented · 46 appearances protected · 1 formerly retained smith overhauled at owner request · 1 effects context retained.</strong></p><p>Every card keeps the original assessment and adds the finished procedural drawing at the default <strong>150% camera</strong>. Open additional states to compare each indexed variant. Protected raster images and textures remain unchanged.</p><p>Your approval of the plans is recorded for every entry. The controls below are for your <strong>review of the finished results</strong>: accept a result, prefer its before version, or leave a quick adjustment note. Export carries those notes into the next session.</p><small>Candidate 0.9.1+snapshot.dev.81 · committed locally · not merged or deployed. Nine selected native scenes are also included in desktop and phone browser layouts.</small></section><details class="guide" id="native"><summary><strong>In-game comparisons · 18 desktop/phone pairs</strong></summary><p>Same selected scene fixtures before and after, at 150%. Click an image to inspect it.</p><div id="nativeGrid"></div></details>'''+template[b:]
replace("try{decisions=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}", "try{decisions=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}")
replace("key='procedural-art-review-20261019-v1'", "key='procedural-art-result-review-20261019-v2'")
# Native comparison helper also serves all the additional state pairs.
a=template.index('function img(');b=template.index('\nfunction render()',a)
template=template[:a]+r'''function img(im,name,prefix=''){return '<figure><img loading="lazy" src="'+D.images[im.path]+'" style="width:'+Math.round(im.width/(im.mode==='native'?1:2))+'px" alt="'+esc(prefix+' '+name+' — '+im.label)+'" data-zoom="'+esc(im.path)+'" data-title="'+esc(prefix+' · '+name)+'"><figcaption><strong>'+esc(prefix)+'</strong> · '+esc(im.label)+'</figcaption></figure>'}
function pair(before,after,name){return '<div class="visuals">'+img(before,name,'Before')+img(after,name,'After')+'</div>'}
function card(r){const d=decisions[r.id]||{},extra=r.images.slice(1);return '<article class="card" id="asset-'+r.number+'"><div class="cardhead"><div class="num">'+String(r.number).padStart(3,'0')+' / '+rows.length+' · '+esc(categoryNames[r.category]||r.category)+'</div><h2>'+esc(r.name)+'</h2><div class="chips"><span class="chip '+r.verdict+'">'+labels[r.verdict]+'</span><span class="chip">Plan approved · '+esc(r.status)+'</span><span class="chip">'+r.priority+'</span></div></div>'+pair(r.images[0],r.afterImages[0],r.name)+'<div class="body"><h3>Before assessment</h3><p>'+esc(r.observation)+'</p><h3>Approved plan</h3><p>'+esc(r.plan)+'</p><p class="benefit">'+esc(r.benefit)+'</p><p>'+esc(r.implementation)+'</p>'+(extra.length?'<details><summary>'+extra.length+' additional before / after state pairs</summary>'+extra.map((im,i)=>pair(im,r.afterImages[i+1],r.name+' · '+im.label)).join('')+'</details>':'')+(r.variants.length?'<details><summary>Variant requirements</summary>'+r.variants.map(v=>'<p><strong>'+esc(v.state)+':</strong> '+esc(v.plan)+'</p>').join('')+'</details>':'')+'<details><summary>Identity, usage and source</summary><p>'+esc(r.preserve)+'</p><p>'+esc(r.usage)+'</p><p>Stable ID: <code>'+esc(r.id)+'</code><br>Owner: <code>'+esc(r.owner)+'</code><br>Before source: <code>'+esc(r.source)+'</code><br>After source: <code>'+esc(D.afterSource)+'</code></p></details></div><div class="decision"><label for="decision-'+r.number+'">Your review of the result</label><select id="decision-'+r.number+'" data-choice="'+esc(r.id)+'"><option value="">Result still to review</option><option value="approve" '+(d.choice==='approve'?'selected':'')+'>Accept this result</option><option value="keep" '+(d.choice==='keep'?'selected':'')+'>Prefer the before version</option><option value="change" '+(d.choice==='change'?'selected':'')+'>Request an adjustment</option></select><textarea data-note="'+esc(r.id)+'" aria-label="Note for '+esc(r.name)+'" placeholder="A quick note, if needed…">'+esc(d.note||'')+'</textarea></div></article>'}
''' +template[b:]
replace('Still to review</option>','Results still to review</option>')
replace('Approved plans</option>','Accepted results</option>')
replace('Keep as is</option>','Prefer before</option>')
replace('Change direction</option>','Needs adjustment</option>')
replace('Asset_Review_Decisions.json','Asset_After_Review_Decisions.json')
replace("workingReference:D.workingReference,exported:","workingReference:D.workingReference,afterSource:D.afterSource,bulkPlanApproval:D.approval,exported:")
replace("const fields=['number','id','name','category','priority','verdict','observation','plan','benefit'];", "const fields=['number','id','name','category','priority','verdict','status','observation','plan','benefit','implementation'];")
# Click-to-enlarge also works for the selected live game contexts.
replace("$('close').onclick=()=>$('zoom').close();", "$('close').onclick=()=>$('zoom').close();$('nativeGrid').addEventListener('click',e=>{if(e.target.dataset.zoom){$('zoomImage').src=D.images[e.target.dataset.zoom];$('zoomTitle').textContent=e.target.dataset.title;$('zoom').showModal()}});let nativeLoaded=false;$('native').addEventListener('toggle',()=>{if($('native').open&&!nativeLoaded){$('nativeGrid').innerHTML=D.scenes.map(s=>'<h3>'+esc(s.title)+'</h3>'+pair(s.images[0],s.images[1],s.title)).join('');nativeLoaded=true}});")
a=template.index('<details><summary>Source references and how to resume</summary>');b=template.index('</details>',a)+len('</details>')
template=template[:a]+'''<details><summary>Source references and implementation status</summary><p>Original published baseline: <code id="baseline"></code><br>Original drawing snapshot: <code id="reference"></code><br>After source: <code>'''+data['implementation']['sourceCommit']+'''</code><br>Candidate: <code>0.9.1+snapshot.dev.81</code>. The new branch builds on merged Frontier fixes.</p><p>The original 426-contract inventory is expanded into 513 review entries, including royal classes, actual Crown lineages, cavalry, captivity, 20 actual appointments, registered images and textures. All 605 original before images are preserved. The implementation changes drawings and comparison receipts; gameplay geometry, saves and combat owners remain unchanged.</p><p>The work is committed locally. Automatic approval review rejected the GitHub branch push as outside the authorized scope. No merge or deployment has occurred.</p></details>'''+template[b:]
replace("$('scope').textContent='513 review entries cover the complete 426-contract body/prop/environment index plus explicit character states and current raster/texture registrations. Shared recipes and aliases remain visible so none silently drop out.';", "$('scope').textContent='513 reviewed entries · 621 before/after references per side · 465 implemented targets · 46 identical protected primaries · 1 owner-requested smith overhaul · 36 selected desktop/phone scene captures. Result appearance review remains yours.';")
# Distinguish the total plan approval from optional result-review notes.
template=template.replace('Saved decisions','Result reviews').replace('saved decisions','result reviews')
template=template.replace('0.9.1+snapshot.dev.81', data['implementation']['version'])
template=template.replace('Your approval of the plans is recorded for every entry. The controls below are for your <strong>review of the finished results</strong>: accept a result, prefer its before version, or leave a quick adjustment note. Export carries those notes into the next session.', 'Your acceptance of the remaining artwork is recorded. The <strong>requested character and environment corrections are implemented</strong>, including their shared variants. You can still leave a result note or export decisions for later use.')
template=template.replace('Result appearance review remains yours.', 'Owner acceptance of unchanged results is recorded; requested corrections are implemented.')
template=template.replace("try{decisions=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}", "try{decisions=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){};for(const r of rows)if(r.accepted&&!decisions[r.id])decisions[r.id]={choice:'approve',authority:'Owner accepted the remaining artwork for this pass, 19 October 2026'};")
template=template.replace('__DATA__',payload)
(root/'Procedural_Art_Review.html').write_text(template,encoding='utf-8')
print(json.dumps({'htmlBytes':len(template.encode()),'embeddedImages':len(images),'cases':len(compact),'nativePairs':len(scenes)}))
