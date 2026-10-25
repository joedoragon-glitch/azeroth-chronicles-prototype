'use strict';
// Three intentionally scoped real-shell Chromium captures, NOT the game browser matrix.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  try {
    const relative = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (e) {res.writeHead(500);res.end(String(e));}
});
const overlaps = (a,b) => a && b && Math.max(a.x,b.x) < Math.min(a.x+a.width,b.x+b.width)-1 && Math.max(a.y,b.y) < Math.min(a.y+a.height,b.y+b.height)-1;
const box = async (page,id) => page.locator(id).isVisible() ? page.locator(id).boundingBox() : null;
async function capture(page,label) {
  const png = await page.screenshot({type:'png',animations:'disabled'});
  const jpg = await sharp(png).resize({width:1050,withoutEnlargement:true}).jpeg({quality:66}).toBuffer();
  // Small deterministic chunks let the review read the actual rendered frames from the focused CI log.
  const base64 = jpg.toString('base64'), chunk = 1800;
  for (let i=0;i<base64.length;i+=chunk) console.log('AZ_HUD_IMAGE_PART '+label+' '+Math.floor(i/chunk)+' '+base64.slice(i,i+chunk));
  console.log('AZ_HUD_IMAGE_END '+label+' '+Math.ceil(base64.length/chunk));
}
(async()=>{
  let browser;
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const executablePath=process.env.CHROMIUM_EXECUTABLE ||
      ['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
    browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    for(const config of [
      {name:'desktop-1280x800',width:1280,height:800,phone:false},
      {name:'phone-800x375',width:800,height:375,phone:true},
      {name:'phone-844x390-left',width:844,height:390,phone:true,left:true}
    ]) {
      const page=await browser.newPage({viewport:{width:config.width,height:config.height},isMobile:config.phone,hasTouch:config.phone});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.goto('http://127.0.0.1:'+server.address().port+(config.phone?'/phone.html':'/index.html'),{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.Prototype?.game,{timeout:30000});
        await require('./helpers/language-browser.cjs').selectEnglish(page);
        await page.keyboard.press('f');await page.keyboard.press('f');
        await page.waitForFunction(()=>document.querySelector('#modal').hidden,{timeout:25000});
        await page.evaluate(({left})=>{
          const g=Prototype.game;
          g.tick=()=>{};
          g.enter('vale');
          Object.assign(g.hero,{class:'ranger',x:600,y:900,hp:750,maxHp:1000,order:null});
          g.hero.skills=Array(8).fill(1);
          g.s.party=[g.unit('archer',650,900)];
          g.zone().enemies=[];
          if(left){Prototype.input.select('phoneLayout','left-hand');document.body.dataset.phoneLayout='left-hand';}
          Prototype.updateHUD();
        },{left:!!config.left});
        for(let n=1;n<=8;n++) assert(await page.locator('#skill-'+n).isVisible(),config.name+' skill '+n+' must remain usable');
        assert(await page.locator('#health-potion').isVisible(),config.name+' Ranger Heal command remains');
        const controls={};
        for(const id of ['#hud','#menu-button','#skills','#joystick','#recall-button','#target-button','#touch-interact-button','#squad-button','#health-potion']) controls[id]=await box(page,id);
        const m=controls['#menu-button'];assert(m,config.name+' Menu present');
        assert(m.x>=0&&m.y>=0&&m.x+m.width<=config.width+1&&m.y+m.height<=config.height+1,config.name+' Menu inside screen');
        if(config.phone){
          assert(m.width>=90&&m.height>=44,config.name+' readable touch Menu size');
          assert((await page.locator('#menu-button').textContent()).toLowerCase().includes('menu'),config.name+' Menu label present');
          assert(!overlaps(m,controls['#hud']),config.name+' Menu and HP dock separate');
          assert(!overlaps(controls['#skills'],controls['#joystick']),config.name+' skill grid avoids joystick');
          assert(!overlaps(controls['#skills'],controls['#recall-button']),config.name+' skill grid avoids Recall');
          assert(!overlaps(controls['#skills'],controls['#target-button']),config.name+' skill grid avoids Target');
          const update=await page.locator('#update-button').evaluate(el=>{el.hidden=false;return {display:getComputedStyle(el).display};});
          assert.notEqual(update.display,'none',config.name+' update visible for collision probe');
          const u=await box(page,'#update-button');
          assert(!overlaps(u,m),config.name+' update prompt cannot cover Menu');
          await page.locator('#update-button').evaluate(el=>el.hidden=true);
        } else {
          assert((await page.locator('#objective').evaluate(el=>getComputedStyle(el).display))==='none','PC objective is menu-owned');
          assert((await page.locator('#hero-stats .wallet').evaluate(el=>getComputedStyle(el).display))==='none','PC wallet is menu-owned');
          assert(!overlaps(controls['#skills'],controls['#hud']),'PC skill bar and HUD dock separate');
        }
        assert.equal(errors.length,0,config.name+' no page exceptions: '+errors.join(' | '));
        console.log('AZ_HUD_GEOMETRY '+config.name+' '+JSON.stringify(controls));
        await capture(page,config.name);
        if(config.phone) await page.locator('#menu-button').tap(); else await page.locator('#menu-button').click();
        assert(await page.locator('#modal').isVisible(),config.name+' Menu opens');
        assert(await page.getByRole('button',{name:'Quest journal',exact:true}).isVisible(),config.name+' quest journal in Menu');
        await page.getByRole('button',{name:'Quest journal',exact:true}).click();
        assert((await page.locator('#modal-title').textContent()).includes('Quest'),config.name+' journal opens');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        console.log('PASS Option B rendered controls and menu access '+config.name);
      } finally {await page.close();}
    }
  } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
