const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
function fresh(){
  const handlers={},cache=new Map(),deleted=[],state={fetches:0,offline:false,claimed:0,skipped:0};
  const scope='https://example.test/azeroth-chronicles-prototype/';
  const caches={async open(){return {async addAll(urls){for(const url of urls){const file=url===scope?'index.html':url.slice(scope.length);assert(fs.existsSync(path.join(__dirname,'..',file)),file);cache.set(url,new Response('cached:'+file))}},async match(key){return cache.get(key)}}},async keys(){return ['unrelated-cache','azeroth-app-old','azeroth-app-v0.4.1']},async delete(key){deleted.push(key);return true}};
  const self={registration:{scope},addEventListener(k,fn){handlers[k]=fn},clients:{async claim(){state.claimed++}},skipWaiting(){state.skipped++}};
  vm.runInNewContext(source,{self,caches,URL,Response,fetch:async()=>{state.fetches++;if(state.offline)throw Error('offline');return new Response('network')},console});
  return {state,cache,deleted,scope,async emit(name,props={}){let pending,response;handlers[name]({...props,waitUntil(p){pending=p},respondWith(p){response=p}});if(pending)await pending;return response?await response:undefined}};
}
let passed=0;async function test(name,fn){try{await fn();passed++;console.log('PASS '+name)}catch(e){process.exitCode=1;console.error('FAIL '+name+': '+e.stack)}}
(async()=>{
  await test('Precache uses the project subpath and includes every offline asset',async()=>{const w=fresh();await w.emit('install');assert.equal(w.cache.size,16);assert(w.cache.has(w.scope+'src/game.js'));assert.equal(w.state.skipped,0)});
  await test('Activation deletes only obsolete game caches and claims clients',async()=>{const w=fresh();await w.emit('activate');assert.deepEqual(w.deleted,['azeroth-app-old']);assert.equal(w.state.claimed,1)});
  await test('Offline navigation and versioned assets return cached app resources',async()=>{const w=fresh();await w.emit('install');w.state.offline=true;const page=await w.emit('fetch',{request:{url:w.scope+'?launch=installed',method:'GET',mode:'navigate'}});assert.equal(await page.text(),'cached:index.html');const js=await w.emit('fetch',{request:{url:w.scope+'src/game.js?v=3',method:'GET',mode:'cors'}});assert.equal(await js.text(),'cached:src/game.js');const rts=await w.emit('fetch',{request:{url:w.scope+'rts.html',method:'GET',mode:'navigate'}});assert.equal(await rts.text(),'cached:rts.html');assert.equal(w.state.fetches,0)});
  await test('Foreign origins, sibling apps, unknown assets and POST bypass this cache',async()=>{const w=fresh();for(const url of ['https://other.test/x', 'https://example.test/other-app/',w.scope+'unknown.png'])assert.equal(await w.emit('fetch',{request:{url,method:'GET',mode:'cors'}}),undefined);assert.equal(await w.emit('fetch',{request:{url:w.scope,method:'POST',mode:'navigate'}}),undefined)});
  await test('Missing cache falls back to network or a clear offline response',async()=>{const w=fresh();let response=await w.emit('fetch',{request:{url:w.scope,method:'GET',mode:'navigate'}});assert.equal(await response.text(),'network');w.state.offline=true;response=await w.emit('fetch',{request:{url:w.scope,method:'GET',mode:'navigate'}});assert.equal(response.status,503)});
  await test('Waiting update activates only on an explicit SKIP_WAITING message',async()=>{const w=fresh();await w.emit('message',{data:{type:'ignored'}});assert.equal(w.state.skipped,0);await w.emit('message',{data:{type:'SKIP_WAITING'}});assert.equal(w.state.skipped,1)});
  console.log(`\n${passed} offline checks passed.`);
})();
