const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const inventory=require('../scripts/site-assets.cjs');
const currentCache=source.match(/const CACHE_VERSION = ["']([^"']+)["']/)[1];
const fixtures=require('./helpers/sprite-fixtures.cjs');
function fresh({manifest=fixtures.manifest(false),missing=[],failures=[],malformed=false}={}){
  const handlers={},stores=new Map(),deleted=[],requests=[],state={fetches:0,offline:false,claimed:0,skipped:0};
  const scope='https://example.test/azeroth-chronicles-prototype/';
  stores.set('unrelated-cache',new Map([['keep',new Response('unrelated')]]));
  stores.set('azeroth-app-old',new Map([[scope+'index.html',new Response('previous build')]]));
  const store=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name)};
  async function network(request){
    state.fetches++;const url=typeof request==='string'?request:request.url;requests.push(url);
    const file=url===scope?'index.html':url.slice(scope.length).split('?')[0];
    if(state.offline||failures.includes(file))throw Error('fetch failed');
    if(missing.includes(file))return new Response('missing',{status:404});
    if(file==='assets/sprites/manifest.json')return new Response(malformed?'invalid JSON':JSON.stringify(manifest),{headers:{'Content-Type':'application/json'}});
    if(fixtures.images.has(file))return new Response(fixtures.images.get(file),{headers:{'Content-Type':'image/png'}});
    const disk=path.join(__dirname,'..',file);return fs.existsSync(disk)?new Response(fs.readFileSync(disk)):new Response('missing',{status:404});
  }
  const caches={async open(name){const cache=store(name);return {
    async addAll(urls){const ready=[];for(const request of urls){assert.equal(request.cache,'reload','Precache must bypass HTTP cache');const response=await network(request);if(!response.ok)throw Error('cache.addAll failed: '+request.url);ready.push([request.url,response]);}for(const [url,response]of ready)cache.set(url,response)},
    async put(key,response){cache.set(typeof key==='string'?key:key.url,response)},async match(key){return cache.get(typeof key==='string'?key:key.url)?.clone()}
  }},async keys(){return [...stores.keys()]},async delete(key){deleted.push(key);return stores.delete(key)}};
  const self={registration:{scope},addEventListener(k,fn){handlers[k]=fn},clients:{async claim(){state.claimed++}},skipWaiting(){state.skipped++}};
  vm.runInNewContext(source,{self,caches,URL,Request,Response,fetch:network,console});
  return {state,stores,cache:store(currentCache),requests,deleted,scope,async emit(name,props={}){let pending,response;handlers[name]({...props,waitUntil(p){pending=p},respondWith(p){response=p}});if(pending)await pending;return response?await response:undefined}};
}
let passed=0;async function test(name,fn){try{await fn();passed++;console.log('PASS '+name)}catch(e){process.exitCode=1;console.error('FAIL '+name+': '+e.stack)}}
(async()=>{
  await test('App asset edits use the current versioned offline cache',async()=>{assert(currentCache.includes('v'+require('../package.json').version));});
  await test('Precache uses the project subpath, includes every offline asset and activates the newest tester build',async()=>{const w=fresh();await w.emit('install');assert.equal(w.cache.size,inventory.core.length+1);for(const file of inventory.core)assert(w.cache.has(w.scope+file),file);for(const file of inventory.legacy)assert(!w.cache.has(w.scope+file),'Historical downloads stay optional: '+file);assert(w.cache.has(w.scope+'src/sprint.js'));assert(w.cache.has(w.scope+'src/prototype/engine.js'));assert(w.cache.has(w.scope+'src/prototype/audio.js'));assert(w.cache.has(w.scope+'src/prototype/visuals.js'));assert(w.cache.has(w.scope+'src/prototype/combat-visuals.js'));assert(w.cache.has(w.scope+'src/prototype/sprites.js'));assert(w.cache.has(w.scope+'assets/sprites/manifest.json'));assert.equal(w.state.skipped,1)});
  await test('Frame/variant-only resources survive offline and missing atlas rejects install',async()=>{
    const manifest=fixtures.animatedManifest(),w=fresh({manifest}); await w.emit('install');
    for(const [file,bytes] of fixtures.images){assert(w.cache.has(w.scope+file));w.state.offline=true;const response=await w.emit('fetch',{request:{url:w.scope+file,method:'GET',mode:'cors'}});assert(Buffer.from(await response.arrayBuffer()).equals(bytes));}
    const missing=[...fixtures.images.keys()][1],broken=fresh({manifest,missing:[missing]});await assert.rejects(broken.emit('install'));assert(broken.stores.has('azeroth-app-old'));
  });
  await test('Activation deletes only obsolete game caches and claims clients',async()=>{const w=fresh();await w.emit('activate');assert.deepEqual(w.deleted,['azeroth-app-old']);assert.equal(w.state.claimed,1)});
  await test('Offline navigation and versioned assets return cached app resources',async()=>{const w=fresh();await w.emit('install');w.state.offline=true;const fetches=w.state.fetches;const page=await w.emit('fetch',{request:{url:w.scope+'?launch=installed',method:'GET',mode:'navigate'}});assert.equal(await page.text(),fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));const js=await w.emit('fetch',{request:{url:w.scope+'src/prototype/engine.js?v=3',method:'GET',mode:'cors'}});assert.equal(await js.text(),fs.readFileSync(path.join(__dirname,'../src/prototype/engine.js'),'utf8'));const phone=await w.emit('fetch',{request:{url:w.scope+'phone.html?launch=installed',method:'GET',mode:'navigate'}});assert.equal(await phone.text(),fs.readFileSync(path.join(__dirname,'../phone.html'),'utf8'));assert.equal(w.state.fetches,fetches)});
  await test('Historical games load only on demand and remain offline after first use',async()=>{const w=fresh();await w.emit('install');const request={url:w.scope+'rts.html',method:'GET',mode:'navigate'};const online=await w.emit('fetch',{request});assert.equal(await online.text(),fs.readFileSync(path.join(__dirname,'../rts.html'),'utf8'));for(const file of inventory.legacy)assert(w.cache.has(w.scope+file),file);w.state.offline=true;assert.equal(await (await w.emit('fetch',{request})).text(),fs.readFileSync(path.join(__dirname,'../rts.html'),'utf8'));});
  await test('Foreign origins, sibling apps, unknown assets and POST bypass this cache',async()=>{const w=fresh();for(const url of ['https://other.test/x', 'https://example.test/other-app/',w.scope+'unknown.png'])assert.equal(await w.emit('fetch',{request:{url,method:'GET',mode:'cors'}}),undefined);assert.equal(await w.emit('fetch',{request:{url:w.scope,method:'POST',mode:'navigate'}}),undefined)});
  await test('Missing cache falls back to network or a clear offline response',async()=>{const w=fresh();let response=await w.emit('fetch',{request:{url:w.scope,method:'GET',mode:'navigate'}});assert.equal(await response.text(),fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));const empty=fresh();empty.state.offline=true;response=await empty.emit('fetch',{request:{url:empty.scope,method:'GET',mode:'navigate'}});assert.equal(response.status,503)});
  await test('Tester updates auto-activate while the explicit SKIP_WAITING compatibility message still works',async()=>{const w=fresh();await w.emit('install');assert.equal(w.state.skipped,1);await w.emit('message',{data:{type:'ignored'}});assert.equal(w.state.skipped,1);await w.emit('message',{data:{type:'SKIP_WAITING'}});assert.equal(w.state.skipped,2)});
  await test('Phone app install metadata and prototype install flow are present',async()=>{const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.webmanifest'),'utf8')),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),app=fs.readFileSync(path.join(__dirname,'../src/prototype/app.js'),'utf8');assert.equal(manifest.start_url,'./phone.html');assert.equal(manifest.lang,'en');assert.equal(manifest.display,'standalone');assert(manifest.display_override.includes('fullscreen'));assert.equal(manifest.prefer_related_applications,false);assert(html.includes('apple-mobile-web-app-capable'));assert(html.includes('apple-touch-icon'));assert(app.includes('beforeinstallprompt'));assert(/action\(\s*["']Install on phone["']/.test(app));assert(app.includes('appinstalled'));assert(app.includes('hadServiceWorkerController'));assert(/if\s*\(hadServiceWorkerController\)\s*\{\s*appReloadRequested\s*=\s*false/.test(app));assert(!/hadServiceWorkerController\s*\|\|\s*appReloadRequested/.test(app));assert(/reg\.update\(\)\.catch/.test(app));});
  for (const populated of [false,true]) await test('Real '+(populated?'populated':'empty')+' JSON manifest and images precache and survive offline query URLs',async()=>{
    const manifest=fixtures.manifest(populated),w=fresh({manifest});await w.emit('install');
    const images=[...new Set(Object.values(manifest.sprites).map(e=>e.src.slice(2)))];
    assert.equal(w.cache.size,inventory.core.length+1+images.length);
    assert.deepEqual(await w.cache.get(w.scope+'assets/sprites/manifest.json').clone().json(),manifest);
    for(const file of images)assert.equal(w.requests.filter(url=>url===w.scope+file).length,1,'duplicate references fetch once');
    await w.emit('activate');assert.deepEqual(w.deleted,['azeroth-app-old']);assert(w.stores.get('unrelated-cache').has('keep'));
    w.state.offline=true;const fetches=w.state.fetches;
    for(const file of ['assets/sprites/manifest.json','src/prototype/progression.js','src/prototype/save.js','src/prototype/menus.js',...images]){
      const response=await w.emit('fetch',{request:{url:w.scope+file+'?v=fixture#hash',method:'GET',mode:'cors'}});assert.equal(response.status,200);
      if(fixtures.images.has(file)){assert.equal(response.headers.get('Content-Type'),'image/png');assert(Buffer.from(await response.arrayBuffer()).equals(fixtures.images.get(file)));}
      else if(file.endsWith('.json'))assert.deepEqual(await response.json(),manifest);
      else assert.equal(await response.text(),fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
    }
    assert.equal(w.state.fetches,fetches,'all responses come from current cache');
  });
  for(const failure of ['missing','network'])await test(failure+' sprite rejects install and retains previous cache',async()=>{
    const file=[...fixtures.images.keys()][1],w=fresh({manifest:fixtures.manifest(),missing:failure==='missing'?[file]:[],failures:failure==='network'?[file]:[]});
    await assert.rejects(w.emit('install'));assert.equal(w.state.skipped,0);assert.equal(w.state.claimed,0);assert.deepEqual(w.deleted,[]);
    assert.equal(await w.stores.get('azeroth-app-old').get(w.scope+'index.html').clone().text(),'previous build');
    assert(!w.cache.has(w.scope+[...fixtures.images.keys()][0]),'failed sprite batch is atomic');
    w.state.offline=true;assert.equal((await w.emit('fetch',{request:{url:w.scope+file,method:'GET',mode:'cors'}})).status,503);
  });
  await test('Malformed optional JSON keeps the existing procedural installation policy',async()=>{const w=fresh({malformed:true});await w.emit('install');assert.equal(w.cache.size,inventory.core.length+1);assert.equal(w.state.skipped,1)});
  console.log(`\n${passed} offline checks passed.`);
})();
