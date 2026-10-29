'use strict';
// Three intentionally scoped real-shell Chromium captures, NOT the game browser matrix.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
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
  // Ordinary CI logs must not contain base64 screenshot payloads. The full
  // native gameplay capture remains in local test-results for a scoped rerun.
  const output=path.join(root,'test-results','hud-option-b-'+label+'.png');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  await page.screenshot({path:output,animations:'disabled'});
  console.log('AZ_HUD_CAPTURE '+label+' '+path.relative(root,output));
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
      {name:'phone-375x800-es',width:375,height:800,phone:true,spanish:true},
      {name:'phone-844x390-left',width:844,height:390,phone:true,left:true}
    ]) {
      const page=await browser.newPage({viewport:{width:config.width,height:config.height},isMobile:config.phone,hasTouch:config.phone});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.goto('http://127.0.0.1:'+server.address().port+(config.phone?'/phone.html':'/index.html'),{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.Prototype?.game,{timeout:30000});
        // The game now opens on a title screen. Enter a real new campaign:
        // merely dismissing two menus leaves skills hidden behind the title.
        await require('./helpers/language-browser.cjs').selectEnglish(page);
        await page.locator('#title-new').click();
        await page.getByRole('button',{name:'New Normal game',exact:true}).click();
        await page.getByRole('button',{name:config.spanish?/^Español(?: ✓)?$/:/^English(?: ✓)?$/}).click();
        await page.getByRole('button',{name:config.spanish?'Muerte normal y recuperación en refugio':'Standard death and refuge recovery',exact:true}).click();
        await page.getByRole('button',{name:/Palad[ií]n/i}).first().click();
        await page.waitForFunction(()=>window.Prototype?.started &&
          document.querySelector('#title-screen')?.hidden &&
          document.querySelector('#scene-loading')?.hidden !== false,{timeout:60000});
        await page.evaluate(({left})=>{
          const g=Prototype.game;
          g.tick=()=>{};
          g.enter('vale');
          Object.assign(g.hero,{class:'ranger',x:600,y:900,hp:750,maxHp:1000,gold:42424,order:null});
          g.hero.skills=Array(8).fill(1);
          g.s.party=[g.unit('archer',650,900)];
          g.zone().enemies=[];
          if(left){Prototype.input.select('phoneLayout','left-hand');document.body.dataset.phoneLayout='left-hand';}
          Prototype.updateHUD();
        },{left:!!config.left});
        for(let n=1;n<=8;n++) assert(await page.locator('#skill-'+n).isVisible(),config.name+' skill '+n+' must remain usable');
        assert(await page.locator('#health-potion').isVisible(),config.name+' Ranger Heal command remains');
        // The balance must appear on the HP text row at every viewport, with no
        // additional dock height as the amount grows.
        const balance=page.locator('#hero-stats .hud-crowns');
        assert(await balance.isVisible(),config.name+' Crown counter is visible');
        assert((await balance.textContent()).includes(config.spanish?'42.424':'42,424'),config.name+' localized exact Crown count');
        // Compare the icon's browser-rendered source against a fresh image
        // from the *actual* world-loot painter, not a generic CSS emoji or an
        // independently redrawn approximation.
        const portrait=await balance.evaluate(el=>{
          const icon=getComputedStyle(el,'::before');
          const coin=document.createElement('canvas');
          coin.width=coin.height=56;
          const ink=coin.getContext('2d');
          ink.setTransform(2,0,0,2,0,0);
          PrototypeRenderer.drawCrownLoot(ink,{x:14,y:14});
          const edgeClear=y=>{
            const pixels=ink.getImageData(0,y,coin.width,1).data;
            for(let i=3;i<pixels.length;i+=4) if(pixels[i]) return false;
            return true;
          };
          const parent=el.getBoundingClientRect();
          // The absolutely positioned pseudo-element is NOT clipped by the
          // shorter text line: its 19px box can extend beyond the baseline.
          const iconTop=parent.top+parent.height/2-parseFloat(icon.height)/2;
          return {image:icon.backgroundImage,expected:coin.toDataURL('image/png'),
            size:icon.height,position:icon.position,contents:icon.content,
            padding:getComputedStyle(el).paddingLeft,
            overflow:getComputedStyle(el).overflow,
            edgeClear:edgeClear(0)&&edgeClear(1)&&edgeClear(54)&&edgeClear(55),
            iconTop,iconBottom:iconTop+parseFloat(icon.height)};
        });
        assert(portrait.image.includes(portrait.expected),config.name+' coin pixels match the in-world Crown painter');
        assert(portrait.edgeClear,config.name+' full minted coin and shadow have transparent top/bottom margins');
        assert.equal(portrait.position,'absolute',config.name+' coin not clipped by text line height');
        assert.equal(portrait.size,'19px',config.name+' coin remains readable and compact');
        assert.equal(portrait.padding,'20px',config.name+' portrait badge reserves horizontal room only');
        assert.equal(portrait.overflow,'visible',config.name+' text label does not clip coin icon');
        const hpText=await box(page,'#hero-stats .hp-count');
        const crownText=await box(page,'#hero-stats .hud-crowns');
        const hpDock=await box(page,'#hud');
        assert(portrait.iconTop>=hpDock.y && portrait.iconBottom<=hpDock.y+hpDock.height,
          config.name+' complete coin artwork stays inside original HUD height');
        assert(!overlaps(hpText,crownText),config.name+' Crowns do not overlap HP numerals');
        assert(crownText.x>=hpDock.x&&crownText.x+crownText.width<=hpDock.x+hpDock.width+1,config.name+' Crowns stay inside the dock');
        await page.evaluate(()=>{Prototype.game.hero.gold=999999;Prototype.updateHUD();});
        const grownDock=await box(page,'#hud');
        assert.equal(grownDock.height,hpDock.height,config.name+' larger balance must not grow HUD');
        const grownCrown=await box(page,'#hero-stats .hud-crowns');
        assert(grownCrown.x>=grownDock.x&&grownCrown.x+grownCrown.width<=grownDock.x+grownDock.width+1,config.name+' six-digit balance fits the dock');
        await page.evaluate(()=>{Prototype.game.hero.gold=42424;Prototype.updateHUD();});
        const controls={};
        for(const id of ['#hud','#menu-button','#skills','#joystick','#recall-button','#target-button','#touch-interact-button','#squad-button','#health-potion']) controls[id]=await box(page,id);
        const m=controls['#menu-button'];assert(m,config.name+' Menu present');
        assert(m.x>=0&&m.y>=0&&m.x+m.width<=config.width+1&&m.y+m.height<=config.height+1,config.name+' Menu inside screen');
        if(config.phone){
          assert(m.width>=90&&m.height>=44,config.name+' readable touch Menu size');
          assert((await page.locator('#menu-button').textContent()).toLowerCase().includes(config.spanish?'menú':'menu'),config.name+' localized Menu label present');
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
        if(!config.spanish) {
          assert(await page.getByRole('button',{name:'Quest journal',exact:true}).isVisible(),config.name+' quest journal in Menu');
          await page.getByRole('button',{name:'Quest journal',exact:true}).click();
          assert((await page.locator('#modal-title').textContent()).includes('Quest'),config.name+' journal opens');
        }
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        console.log('PASS Option B rendered controls and menu access '+config.name);
      } finally {await page.close();}
    }
  } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
