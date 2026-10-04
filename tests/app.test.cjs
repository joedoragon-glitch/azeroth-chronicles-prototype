const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
function fresh({coarse = true, preference = null, storageDenied = false, controlled = true} = {}) {
  const elements = new Map(), winEvents = {}, swEvents = {}, mediaEvents = {}, loadEvents = [];
  const input = {x:0,y:0,attack:false}, state = {paused:false,casts:[],interactions:0,saves:0,reloads:0,audio:0};
  function element() {
    const handlers = {}, captures = new Set(), classes = new Set();
    return {hidden:true,disabled:false,style:{},textContent:'',attributes:{},offsetWidth:54,
      classList:{add(c){classes.add(c)},remove(c){classes.delete(c)},contains(c){return classes.has(c)},toggle(c,on){on?classes.add(c):classes.delete(c)}},
      setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){(handlers[k]??=[]).push(fn)},
      setPointerCapture(id){captures.add(id)},hasPointerCapture(id){return captures.has(id)},releasePointerCapture(id){captures.delete(id);this.emit('lostpointercapture',{pointerId:id})},
      getBoundingClientRect(){return {left:10,top:20,width:136,height:136}},
      emit(k,properties={}){for(const fn of handlers[k]||[])fn({button:0,preventDefault(){},...properties})},
    };
  }
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of html.matchAll(/\bid="([^"]+)"/g))elements.set(match[1],element());
  const media={matches:coarse,addEventListener(k,fn){(mediaEvents[k]??=[]).push(fn)}};
  const window={isSecureContext:true,localStorage:{getItem(){if(storageDenied)throw Error('denied');return preference},setItem(k,v){if(storageDenied)throw Error('denied');preference=v}},
    matchMedia(){return media},addEventListener(k,fn){(winEvents[k]??=[]).push(fn)},location:{reload(){state.reloads++}}};
  const registration={waiting:null,installing:null,addEventListener(k,fn){(loadEvents[k]??=[]).push(fn)}};
  const serviceWorker={controller:controlled?{}:null,addEventListener(k,fn){(swEvents[k]??=[]).push(fn)},register:async(url,options)=>{assert.equal(url,'./sw.js');assert.equal(options.scope,'./');return registration},ready:Promise.resolve()};
  const sandbox={window,document:{body:element(),getElementById(id){assert(elements.has(id),id);return elements.get(id)}},navigator:{serviceWorker},touchInput:input,
    isGamePaused(){return state.paused},AudioSys:{init(){state.audio++}},castSpell(n){state.casts.push(n)},interactWithNearby(){state.interactions++},manualPaused:false,
    saveGame(){state.saves++},togglePause(){sandbox.manualPaused=!sandbox.manualPaused;state.paused=sandbox.manualPaused;window.resetTouchControls()},closeAllWindows(){},console};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  function emit(k,event={}) {return Promise.all((winEvents[k]||[]).map(fn=>fn(event)))}
  return {elements,input,state,sandbox,window,registration,media,emit,controllerChange(){for(const fn of swEvents.controllerchange||[])fn()},async settle(){await new Promise(resolve=>setImmediate(resolve))}};
}
let passed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS '+name)}catch(e){process.exitCode=1;console.error('FAIL '+name+': '+e.stack)}}
(async()=>{
  await test('Manifest, app resources and maskable PNG sizes are valid',()=>{
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest')));
    assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');assert.equal(manifest.orientation,'any');
    for(const icon of manifest.icons){const png=fs.readFileSync(path.join(root,icon.src));const size=Number(icon.sizes.split('x')[0]);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert(icon.purpose.includes('maskable'))}
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g))assert(fs.existsSync(path.join(root,match[1])));
  });
  await test('Joystick captures one finger, clamps input and ignores other fingers',()=>{
    const a=fresh(),stick=a.elements.get('joystick');stick.emit('pointerdown',{pointerId:7,clientX:119,clientY:88});assert.equal(a.input.x,1);assert.equal(a.input.y,0);assert(stick.hasPointerCapture(7));
    stick.emit('pointerdown',{pointerId:8,clientX:0,clientY:0});stick.emit('pointermove',{pointerId:8,clientX:0,clientY:0});assert.equal(a.input.x,1);
    stick.emit('pointermove',{pointerId:7,clientX:1000,clientY:1000});assert(Math.abs(Math.hypot(a.input.x,a.input.y)-1)<1e-9);
    stick.emit('pointerup',{pointerId:8});assert(stick.hasPointerCapture(7));stick.emit('pointerup',{pointerId:7});assert.equal(a.input.x,0);assert(!stick.hasPointerCapture(7));
  });
  await test('Joystick dead zone, cancellation and lost capture reset movement',()=>{
    for(const event of ['pointercancel','lostpointercapture']){const a=fresh(),stick=a.elements.get('joystick');stick.emit('pointerdown',{pointerId:1,clientX:79,clientY:88});assert.equal(a.input.x,0);stick.emit('pointermove',{pointerId:1,clientX:100,clientY:88});assert(a.input.x>0&&a.input.x<1);stick.emit(event,{pointerId:1});assert.equal(a.input.x,0)}
  });
  await test('Two-thumb input supports movement and held sword; pause resets both',()=>{
    const a=fresh(),stick=a.elements.get('joystick'),sword=a.elements.get('slot-1');stick.emit('pointerdown',{pointerId:1,clientX:119,clientY:88});sword.emit('pointerdown',{pointerId:2});assert.equal(a.input.x,1);assert(a.input.attack);assert.deepEqual(a.state.casts,[1]);
    a.window.resetTouchControls();assert.deepEqual(a.input,{x:0,y:0,attack:false});assert(!stick.hasPointerCapture(1));assert(!sword.hasPointerCapture(2));
    a.state.paused=true;stick.emit('pointerdown',{pointerId:1,clientX:119,clientY:88});sword.emit('pointerdown',{pointerId:2});a.elements.get('interact-button').emit('click');assert.equal(a.input.x,0);assert.equal(a.state.interactions,0);
  });
  await test('Sword release/cancel and synthesized clicks do not duplicate casts',async()=>{
    const a=fresh(),sword=a.elements.get('slot-1');await a.emit('load');sword.emit('pointerdown',{pointerId:2});sword.emit('pointerup',{pointerId:2});assert(!a.input.attack);sword.onclick({detail:1});assert.deepEqual(a.state.casts,[1]);sword.onclick({detail:0});assert.deepEqual(a.state.casts,[1,1]);sword.emit('pointerdown',{pointerId:3});sword.emit('pointercancel',{pointerId:3});assert(!a.input.attack);
  });
  await test('Touch controls default to device input and respect a saved preference',()=>{
    const desktop=fresh({coarse:false});assert(!desktop.sandbox.document.body.classList.contains('touch-mode'));
    const a=fresh({coarse:true,preference:'off'});assert(!a.sandbox.document.body.classList.contains('touch-mode'));a.elements.get('touch-toggle').emit('click');assert(a.sandbox.document.body.classList.contains('touch-mode'));
    assert(fresh({storageDenied:true}).sandbox.document.body.classList.contains('touch-mode'));
  });
  await test('Install prompt runs only from an explicit install-button click',async()=>{
    const a=fresh();let prompted=0;await a.emit('beforeinstallprompt',{preventDefault(){},prompt:async()=>{prompted++},userChoice:Promise.resolve({outcome:'accepted'})});assert(!a.elements.get('install-button').hidden);assert.equal(prompted,0);a.elements.get('install-button').emit('click');await a.settle();assert.equal(prompted,1);await a.emit('appinstalled');assert(a.elements.get('install-button').hidden);
  });
  await test('App update saves, pauses and reloads once; first activation does not reload',async()=>{
    const a=fresh();let messages=[];a.registration.waiting={postMessage(m){messages.push(m.type)}};await a.settle();assert(!a.elements.get('update-button').hidden);a.elements.get('update-button').emit('click');assert.deepEqual(messages,['SKIP_WAITING']);assert(a.sandbox.manualPaused);assert(a.state.saves>0);a.controllerChange();a.controllerChange();assert.equal(a.state.reloads,1);
    const b=fresh({controlled:false});b.controllerChange();assert.equal(b.state.reloads,0);b.controllerChange();assert.equal(b.state.reloads,1);
  });
  console.log(`\n${passed} app checks passed.`);
})();
