'use strict';
// One focused Chromium browser smoke for Stage 5. No full-game/browser matrix.
// Use installed Chrome on Actions, or an explicitly configured local executable.
const fs = require('node:fs'), http = require('node:http'),
  path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css',
  '.json':'application/json', '.webp':'image/webp', '.png':'image/png',
  '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const server = http.createServer((req,res) => {
  try {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const file = path.resolve(root, rel || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) ||
        fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (e) { res.writeHead(500); res.end(); }
});
function overlaps(a,b) {
  if (!a || !b) return false;
  return Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 &&
    Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
}
async function startPage(browser, mode, width, height) {
  const context=await browser.newContext({ viewport:{width,height},
    hasTouch:mode!=='desktop', isMobile:mode!=='desktop' });
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto('http://127.0.0.1:'+server.address().port+
    '/phone.html?experience='+mode, {waitUntil:'domcontentloaded'});
  await require('./helpers/language-browser.cjs').selectEnglish(page);
  // Select the default standard challenge, then begin Normal adventure.
  await page.keyboard.press('f');
  await page.keyboard.press('f');
  await page.waitForFunction(() => !!window.Prototype &&
    document.querySelector('#modal').hidden);
  await page.evaluate(() => {
    const g=Prototype.game;
    g.enter('vale');
    g.zone().enemies=[];
    g.s.party=[];
    g.hero.hp=g.hero.maxHp;
    const town=g.zone().npcs.find(n=>n.kind==='rest' && n.id==='rest');
    Object.assign(g.hero,g.safe(town.x+150,town.y+120));
    // Verify the real menu/renderer; only suppress wandering simulation.
    g.tick=()=>{};
    Prototype.closeMenu();
    Prototype.updateHUD();
  });
  return { page,context };
}
async function exercise(page, mode, tag) {
  await page.keyboard.press('m');
  const modal=page.locator('#modal'),canvas=page.locator('#modal-description canvas'),
    cancel=page.locator('#cancel-navigation-button');
  assert(await modal.isVisible(), tag+' map visible via existing M shortcut');
  assert(await canvas.isVisible(), tag+' map canvas exists');
  assert(!(await cancel.isVisible()), tag+' Cancel absent on map inspection');
  const rect=await canvas.boundingBox();
  assert(rect && Math.abs(rect.width/rect.height-1.5)<0.035,
    tag+' displayed map keeps intrinsic 3:2 aspect ratio, including phone');
  const picked=await page.evaluate(({left,top,width,height})=>{
    const g=Prototype.game, list=g.mapDestinations(), size=g.zoneSize(),
      options=list.filter(p=>g.navigationTarget(p) &&
        Math.hypot(p.x-g.hero.x,p.y-g.hero.y)>250);
    const ranked=options.map(p=>({
      p, separation:Math.min(...list.filter(q=>q!==p).map(q=>
        Math.hypot((q.x-p.x)*width/size,(q.y-p.y)*height/size))),
    })).sort((a,b)=>b.separation-a.separation);
    const choice=ranked[0]?.p;
    if(!choice)return null;
    return {id:choice.id,name:choice.name,
      x:left+choice.x/size*width,y:top+choice.y/size*height,
      separation:ranked[0].separation};
  },rect);
  assert(picked && picked.separation>22,tag+' isolated real destination marker');
  if(mode==='desktop') await page.mouse.click(picked.x,picked.y);
  else await page.touchscreen.tap(picked.x,picked.y);
  const selected=page.locator('#modal-actions button.route-picked');
  assert.equal(await selected.count(),1,tag+' one marker selected');
  assert((await selected.textContent()).includes(picked.name),
    tag+' rendered marker selects its own destination after CSS scaling');
  assert.equal(await selected.getAttribute('aria-pressed'),'true',
    tag+' selected list entry is announced accessibly');
  assert(await selected.evaluate(node=>node.classList.contains('selected')),
    tag+' keyboard highlight points to the selected action, not a heading');
  assert.equal((await page.evaluate(()=>Prototype.game.hero.order)),null,
    tag+' marker selection never issues a move');
  await page.locator('#modal-actions button.route-go').click();
  assert(await modal.isHidden(),tag+' explicit Navigate leaves map');
  assert(await cancel.isVisible(),tag+' contextual cancel appears for active journey');
  const order=await page.evaluate(()=>Prototype.game.hero.order);
  assert.equal(order.type,'move',tag+' nav orders the hero to walk');
  assert.equal(order.navigation,true,tag+' move is navigation-owned');
  const cancelRect=await cancel.boundingBox();
  const hud=await page.locator('#hud').boundingBox();
  assert(!overlaps(cancelRect,hud),tag+' cancel stays clear of HUD');
  for(const selector of ['#joystick','#skills','#target-button','#recall-button']){
    const control=page.locator(selector);
    if(await control.isVisible())assert(!overlaps(cancelRect,await control.boundingBox()),
      tag+' Cancel stays clear of '+selector);
  }
  await page.keyboard.press('m');
  assert(!(await cancel.isVisible()),tag+' map menu temporarily hides contextual Cancel');
  await page.keyboard.press('Escape');
  assert(await cancel.isVisible(),tag+' cancel returns when leaving the map');
  await page.keyboard.press(mode==='desktop'?'w':'w');
  const info=await page.evaluate(()=>Prototype.navigationState);
  assert(info.active && !info.autopilot,tag+' manual movement stops only autopilot');
  assert(await cancel.isVisible(),tag+' waypoint still has explicit Cancel');
  await cancel.click();
  assert(await cancel.isHidden(),tag+' Cancel disappears after dismissal');
  assert.equal(await page.evaluate(()=>Prototype.trackedWaypoint),null,
    tag+' cleared waypoint no longer exists');
  console.log('PASS Stage 5 Chromium '+tag+' rendered marker, layout, manual control and Cancel');
}
(async()=>{
  let browser;
  try {
    await new Promise((res,rej)=>{server.once('error',rej);
      server.listen(0,'127.0.0.1',res);});
    const launch=process.env.CHROMIUM_EXECUTABLE?
      {executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,
        args:['--no-sandbox','--disable-dev-shm-usage']}:
      {channel:'chrome',headless:true,args:['--no-sandbox']};
    browser=await chromium.launch(launch);
    for(const {mode,width,height,tag} of [
      {mode:'desktop',width:1280,height:800,tag:'desktop'},
      {mode:'phone',width:375,height:800,tag:'portrait'},
      {mode:'phone',width:800,height:375,tag:'landscape'},
    ]){
      const {page,context}=await startPage(browser,mode,width,height);
      try { await exercise(page,mode,tag); }
      finally { await context.close(); }
    }
  } catch(e) { console.error(e); process.exitCode=1; }
  finally { await browser?.close(); await new Promise(res=>server.close(res)); }
})();
