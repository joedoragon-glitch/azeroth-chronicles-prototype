'use strict';
// Focused native owner-guide acceptance (not a full game or physical iPhone suite).
// PR #793 supplies the landscape-only phone CONTRACT; this draft preview
// independently applies it to its own guide until the game-wide Stage 3 merges.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'dark-crown-owner-preview.html'),'utf8');
const guide = fs.readFileSync(path.join(root,'tools/dark-crown-owner-preview.js'),'utf8');
const css = fs.readFileSync(path.join(root,'tools/dark-crown-owner-preview.css'),'utf8');
assert(html.includes('dark-crown-owner-preview.js') && html.includes('dark-crown-owner-preview.css'));
assert(!html.includes('{{ENTRY}}'));
assert(css.includes('@media (orientation: landscape) and (min-width: 560px) and (max-height: 560px)'));
assert(css.includes("body[data-experience='phone']"));
assert(!css.includes('transform: rotate('), 'do not rotate the entire game with CSS');
assert(guide.includes('crown-review-rotate'), 'preview must provide a phone rotation guard');
const mime = {'.js':'application/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.webmanifest':'application/manifest+json',
  '.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server = http.createServer((req,res)=>{
  let file;
  try { file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch (_) { res.writeHead(400).end(); return; }
  if(file !== root && !file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  if(file===root) file=path.join(root,'index.html');
  fs.readFile(file,(error,bytes)=>{
    if(error){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:bytes);
  });
});
const artifactDir=path.join(root,'test-artifacts','crown-owner-review');
function approxContains(inner,outer,msg){
  assert(inner.x>=outer.x-2 && inner.y>=outer.y-2 &&
    inner.x+inner.width <= outer.x+outer.width+2 &&
    inner.y+inner.height <= outer.y+outer.height+2,msg);
}
async function capture(page,name){
  fs.mkdirSync(artifactDir,{recursive:true});
  await page.screenshot({path:path.join(artifactDir,name+'.png')});
}
async function guideGeometry(page,device){
  const dimensions=await page.evaluate(()=>{
    const bbox=(selector)=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
    const cats=getComputedStyle(document.querySelector('.crown-review-categories'));
    return {
      viewport:{x:0,y:0,width:innerWidth,height:innerHeight},
      dialog:bbox('#crown-review-dialog'),close:bbox('.crown-review-close'),
      search:bbox('#crown-review-search'),footer:bbox('.crown-review-footer'),
      back:bbox('#crown-review-back'),done:bbox('.crown-review-done'),
      category:bbox('[data-owner-category=all]'),
      visit:bbox('[data-owner-destination=arrival]'),
      categoryDirection:cats.flexDirection,
      mainColumns:getComputedStyle(document.querySelector('.crown-review-main')).gridTemplateColumns,
      bodyMode:document.body.getAttribute('data-experience'),
      noHorizontalOverflow:document.documentElement.scrollWidth <= innerWidth+2
    };
  });
  approxContains(dimensions.dialog,dimensions.viewport,device+' guide must fit landscape');
  for(const name of ['close','search','footer','back','done','category','visit'])
    approxContains(dimensions[name],dimensions.viewport,device+' '+name+' must be onscreen');
  const mandatoryTouch = device.startsWith('landscape')
    ? ['close','search','back','done','category','visit']
    : ['close','search','back','done','visit'];
  for(const name of mandatoryTouch)
    assert(dimensions[name].height>=43.5,device+' '+name+' remains at least 44px high');
  assert(dimensions.noHorizontalOverflow,device+' should not horizontally scroll document');
  if(device.startsWith('landscape')){
    assert.equal(dimensions.bodyMode,'phone');
    assert.equal(dimensions.categoryDirection,'column',device+' categories use landscape side rail');
    assert.equal(dimensions.mainColumns.split(' ').length,2,device+' has two main guide columns');
  } else {
    assert.equal(dimensions.bodyMode,'desktop');
  }
}
function chromiumExecutable() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      return execFileSync('which', [command], {encoding:'utf8', stdio:['ignore','pipe','ignore']}).trim();
    } catch {}
  }
  return undefined;
}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(),args:['--no-sandbox']});
  try {
    const origin='http://127.0.0.1:'+server.address().port+
      '/dark-crown-owner-preview.html?developer=1';
    const cases=[
      {name:'desktop',viewport:{width:1200,height:800},phone:false},
      {name:'landscape-800x375',viewport:{width:800,height:375},phone:true},
      {name:'landscape-844x390',viewport:{width:844,height:390},phone:true}
    ];
    for(const testCase of cases){
      const {name,viewport,phone}=testCase;
      const context=await browser.newContext({
        viewport,
        isMobile:phone,
        hasTouch:phone,
        serviceWorkers:'block'
      });
      try{
        const page=await context.newPage();
        page.setDefaultTimeout(90000);
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        const url=origin+(phone?'&experience=phone':'&experience=desktop');
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
        await page.waitForFunction(()=>document.getElementById('startup-update')?.hidden);
        if(await page.locator('#language-welcome').isVisible())
          await page.locator('#language-welcome [data-language="en"]').click();
        await page.locator('#title-screen').waitFor({state:'visible'});
        assert.equal(await page.locator('#crown-review-rotate').isHidden(),true);
        if(phone){
          // Landscape launch should present all five original title options.
          const screen=await page.evaluate(()=>({width:innerWidth,height:innerHeight,
            items:[...document.querySelectorAll('#title-screen nav button')].map(x=>{
              const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
            })}));
          assert.equal(screen.items.length,5);
          for(const b of screen.items){
            assert(b.h>=43.5,name+' title button finger size');
            assert(b.y>=0 && b.y+b.h<=screen.height+2,name+' title actions visible');
          }
          // An upright phone must show ONLY the bilingual rotation surface.
          await page.setViewportSize({width:375,height:800});
          await page.waitForFunction(()=>!document.querySelector('#crown-review-rotate').hidden);
          assert.match(await page.locator('#crown-review-rotate-title').innerText(),/Rotate your phone/);
          assert.match(await page.locator('#crown-review-rotate-title').innerText(),/Gira tu teléfono/);
          assert.equal(await page.locator('#crown-review-launcher').isVisible(),true);
          await capture(page,name+'-portrait-rotation');
          await page.setViewportSize(viewport);
          await page.waitForFunction(()=>document.querySelector('#crown-review-rotate').hidden);
          assert.equal(await page.locator('#title-screen').isVisible(),true);
        }
        // Guide is also usable as noninteractive help BEFORE creating a run.
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-dialog').isVisible(),true);
        assert.equal(await page.locator('[data-owner-destination=arrival]').isDisabled(),true);
        await guideGeometry(page,name);
        await page.locator('.crown-review-close').click();
        assert.equal(await page.locator('#crown-review-backdrop').isHidden(),true);

        // Use the current first-run title flow and explicitly opt into Developer.
        await page.locator('#title-new').click();
        await page.getByRole('button',{name:'New Developer Mode run'}).click();
        await page.getByRole('button',{name:/Paladin/}).click();
        await page.waitForFunction(()=>window.Prototype?.started===true,null,{timeout:90000});
        assert.equal(await page.evaluate(()=>Prototype.game.s.mode),'developer');
        assert.deepEqual(await page.evaluate(()=>Object.keys(Campaign.classes).sort()),
          ['mage','paladin','ranger','rogue']);
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.evaluate(()=>Prototype.paused),true);
        const time=await page.evaluate(()=>Prototype.game.s.time);
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(()=>Prototype.game.s.time),time);
        await guideGeometry(page,name);
        await capture(page,name);

        // Search/category/16 cards with actual click events, no synthetic DOM clicks.
        await page.locator('#crown-review-search').fill('foundry');
        assert.equal(await page.locator('[data-owner-destination]').count(),2);
        await page.locator('#crown-review-search').fill('');
        await page.locator('[data-owner-category=industry]').click();
        assert.equal(await page.locator('[data-owner-destination]').count(),4);
        await page.locator('[data-owner-category=all]').click();
        assert.equal(await page.locator('[data-owner-destination]').count(),16);
        await page.locator('[data-owner-destination=arrival]').click();
        assert.equal(await page.locator('#crown-review-backdrop').isHidden(),true);
        assert.equal(await page.evaluate(()=>Prototype.paused),false);
        const crown=await page.evaluate(()=>({zone:Prototype.game.zoneId,
          hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
          dev:localStorage.getItem('azeroth-v4-developer'),
          normal:localStorage.getItem('azeroth-v4-normal')}));
        assert.equal(crown.zone,'crown');
        assert(crown.dev && JSON.parse(crown.dev).zone==='crown');
        assert.equal(crown.normal,null);
        assert(Math.hypot(crown.hero.x-690,crown.hero.y-430)<300);

        if(phone){
          // The preview protects the native combat clock when rotated upright.
          const before=await page.evaluate(()=>({
            zone:Prototype.game.zoneId,x:Prototype.game.hero.x,y:Prototype.game.hero.y
          }));
          await page.setViewportSize({width:390,height:844});
          await page.waitForFunction(()=>!document.querySelector('#crown-review-rotate').hidden);
          assert.equal(await page.evaluate(()=>Prototype.paused),true);
          const clock=await page.evaluate(()=>Prototype.game.s.time);
          await page.waitForTimeout(320);
          assert.equal(await page.evaluate(()=>Prototype.game.s.time),clock);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#crown-review-rotate').isHidden(),false,
            'Escape must not bypass rotation guard');
          await page.setViewportSize(viewport);
          await page.waitForFunction(()=>document.querySelector('#crown-review-rotate').hidden);
          assert.equal(await page.evaluate(()=>Prototype.paused),false,
            'orientation-owned pause must resume on landscape');
          const after=await page.evaluate(()=>({
            zone:Prototype.game.zoneId,x:Prototype.game.hero.x,y:Prototype.game.hero.y
          }));
          assert.equal(after.zone,before.zone);
          assert(Math.hypot(after.x-before.x,after.y-before.y)<20,
            'rotation never teleports hero');

          // Also preserve an ALREADY OPEN guide across rotation.
          await page.locator('#crown-review-launcher').click();
          assert.equal(await page.evaluate(()=>Prototype.paused),true);
          await page.setViewportSize({width:390,height:844});
          await page.waitForFunction(()=>!document.querySelector('#crown-review-rotate').hidden);
          await page.setViewportSize(viewport);
          await page.waitForFunction(()=>document.querySelector('#crown-review-rotate').hidden);
          assert.equal(await page.locator('#crown-review-dialog').isVisible(),true);
          assert.equal(await page.evaluate(()=>Prototype.paused),true);
          await page.locator('.crown-review-done').click();
          assert.equal(await page.evaluate(()=>Prototype.paused),false);
        }

        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-back').isDisabled(),false);
        await page.locator('#crown-review-back').click();
        assert.equal(await page.evaluate(()=>Prototype.game.zoneId),'vale',
          'Return to previous spot must use native zone transition');
        await page.locator('#crown-review-launcher').click();
        await page.locator('[data-owner-destination=foundry-in]').click();
        assert.deepEqual(await page.evaluate(()=>({
          zone:Prototype.game.zoneId,enemies:Prototype.game.zone().enemies.length
        })),{zone:'side-crown-foundry',enemies:14});
        await page.locator('#crown-review-launcher').click();
        await page.locator('[data-owner-destination=fortress]').click();
        assert.equal(await page.evaluate(()=>Prototype.game.zoneId),'crown');

        await page.evaluate(()=>document.documentElement.lang='es-419');
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-title').innerText(),'Explorar Corona Oscura');
        assert.equal(await page.locator('[data-owner-category=all]').innerText(),'Todos');
        assert.equal(await page.locator('[data-owner-destination=arrival]').innerText(),'Visitar este lugar');
        await page.locator('.crown-review-done').click();
        assert.deepEqual(errors.slice(0,3),[]);
        console.log('PASS '+name+': landscape review, native pause, developer scene entry, rotation recovery,'+
          ' location search/categories, bilingual text and v4 Developer save');
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
run().then(()=>server.close(),error=>{console.error(error);server.close();process.exitCode=1;});
