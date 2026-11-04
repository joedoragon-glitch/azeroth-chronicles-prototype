'use strict';
// Focused real-browser owner guide acceptance, not a comprehensive campaign suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dark-crown-owner-preview.html'), 'utf8');
assert(html.includes('dark-crown-owner-preview.js') && html.includes('dark-crown-owner-preview.css'));
assert(!html.includes('{{ENTRY}}'));
const mime = {'.js':'application/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.webmanifest':'application/manifest+json',
  '.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server = http.createServer((req,res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch (_) { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (file === root) file = path.join(root,'index.html');
  fs.readFile(file, (error,bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  });
});
async function main() {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const url = 'http://127.0.0.1:'+server.address().port+
      '/dark-crown-owner-preview.html?developer=1';
    for (const [device, viewport] of [
      ['desktop', {width:1200,height:800}],
      ['narrow', {width:390,height:680}]
    ]) {
      const context = await browser.newContext({viewport, serviceWorkers:'block'});
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(90000);
        const errors = [];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
        await page.waitForFunction(() => {
          const title = document.getElementById('title-screen');
          return title && !title.hidden && document.getElementById('startup-update').hidden;
        }, null, {timeout:90000});

        // Onboarding can be inspected without interrupting the title screen.
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-dialog').isVisible(),true);
        assert.equal(await page.locator('[data-owner-destination=arrival]').isDisabled(),true);
        assert.match(await page.locator('#crown-review-current').innerText(),/New Game/);
        await page.locator('.crown-review-close').click();
        assert.equal(await page.locator('#crown-review-backdrop').isHidden(),true);

        // Native title New Game path and all four original playable classes.
        await page.locator('#title-new').click();
        await page.getByRole('button',{name:'New Developer Mode run'}).click();
        await page.getByRole('button',{name:/^English/}).click();
        await page.getByRole('button',{name:/Paladin/}).click();
        await page.waitForFunction(() => window.Prototype?.started === true,null,{timeout:90000});
        assert.equal(await page.evaluate(()=>Prototype.game.s.mode),'developer');
        assert.deepEqual(await page.evaluate(()=>Object.keys(Campaign.classes).sort()),
          ['mage','paladin','ranger','rogue']);

        // The review guide MUST pause real gameplay while the owner reads.
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.evaluate(()=>Prototype.paused),true);
        const beforeTime = await page.evaluate(()=>Prototype.game.s.time);
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(()=>Prototype.game.s.time),beforeTime,
          'encounters must not run beneath destination guide');
        const sizes = await page.evaluate(() => {
          const dialog = document.getElementById('crown-review-dialog').getBoundingClientRect();
          const close = document.querySelector('.crown-review-close').getBoundingClientRect();
          return {dialogLeft:dialog.left, dialogRight:dialog.right, dialogBottom:dialog.bottom,
            closeWidth:close.width,closeHeight:close.height,viewW:innerWidth,viewH:innerHeight};
        });
        assert(sizes.dialogLeft >= 0 && sizes.dialogRight <= sizes.viewW+1);
        assert(sizes.dialogBottom <= sizes.viewH+1);
        assert(sizes.closeWidth >= 44 && sizes.closeHeight >= 44);
        fs.mkdirSync(path.join(root,'test-artifacts','crown-owner-review'),{recursive:true});
        await page.screenshot({path:path.join(root,'test-artifacts','crown-owner-review',device+'.png')});

        // Search, category chips, one-tap visits and original world landings.
        await page.locator('#crown-review-search').fill('foundry');
        assert.equal(await page.locator('[data-owner-destination]').count(),2);
        await page.locator('#crown-review-search').fill('');
        await page.locator('[data-owner-category=industry]').click();
        const categoryDiagnostic = await page.evaluate(() => ({
          active: [...document.querySelectorAll('[data-owner-category]')].map(el =>
            [el.dataset.ownerCategory, el.getAttribute('aria-pressed')]),
          groups: [...document.querySelectorAll('.crown-review-group-title')].map(el => el.textContent),
          cards: document.querySelectorAll('[data-owner-destination]').length,
          body: document.body.className
        }));
        console.log('CATEGORY DIAGNOSTIC', JSON.stringify(categoryDiagnostic), 'pageErrors', errors);
        const domClickDiagnostic = await page.evaluate(() => {
          const target = document.querySelector('[data-owner-category=industry]');
          target.click();
          return {active: [...document.querySelectorAll('[data-owner-category]')].map(el =>
              [el.dataset.ownerCategory, el.getAttribute('aria-pressed')]),
            cards:document.querySelectorAll('[data-owner-destination]').length};
        });
        console.log('CATEGORY AFTER DOM CLICK', JSON.stringify(domClickDiagnostic), 'pageErrors', errors);
        assert.equal(await page.locator('[data-owner-destination]').count(),4);
        await page.locator('[data-owner-category=all]').click();
        assert.equal(await page.locator('[data-owner-destination]').count(),16);
        await page.locator('[data-owner-destination=arrival]').click();
        assert.equal(await page.locator('#crown-review-backdrop').isHidden(),true);
        assert.equal(await page.evaluate(()=>Prototype.paused),false);
        const crown = await page.evaluate(()=>({
          zone:Prototype.game.zoneId,
          hero:{x:Prototype.game.hero.x,y:Prototype.game.hero.y},
          dev:localStorage.getItem('azeroth-v4-developer'),
          normal:localStorage.getItem('azeroth-v4-normal')
        }));
        assert.equal(crown.zone,'crown');
        assert(crown.dev && JSON.parse(crown.dev).zone==='crown');
        assert.equal(crown.normal,null);
        assert(Math.hypot(crown.hero.x-690,crown.hero.y-430)<300);

        // Return to the actual previous position, not a fake screenshot point.
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-back').isDisabled(),false);
        await page.locator('#crown-review-back').click();
        assert.equal(await page.evaluate(()=>Prototype.game.zoneId),'vale');
        await page.locator('#crown-review-launcher').click();
        await page.locator('[data-owner-destination=foundry-in]').click();
        const foundry = await page.evaluate(()=>({
          zone:Prototype.game.zoneId,enemies:Prototype.game.zone().enemies.length
        }));
        assert.deepEqual(foundry,{zone:'side-crown-foundry',enemies:14});
        await page.locator('#crown-review-launcher').click();
        await page.locator('[data-owner-destination=fortress]').click();
        assert.equal(await page.evaluate(()=>Prototype.game.zoneId),'crown');

        // Language updates are read from the live page, without a second game.
        await page.evaluate(()=>document.documentElement.lang='es-419');
        await page.locator('#crown-review-launcher').click();
        assert.equal(await page.locator('#crown-review-title').innerText(),'Explorar Corona Oscura');
        assert.equal(await page.locator('[data-owner-category=all]').innerText(),'Todos');
        assert.equal(await page.locator('[data-owner-destination=arrival]').innerText(),
          'Visitar este lugar');
        await page.locator('.crown-review-done').click();
        assert.equal(await page.locator('#crown-review-backdrop').isHidden(),true);
        assert.deepEqual(errors.slice(0,3),[]);
        console.log('PASS '+device+': title onboarding, paused guide, search, category, 16 places, '+
          'real Crown/Foundry/fortress, return, bilingual labels, saved developer run');
      } finally {
        await context.close();
      }
    }
  } finally { await browser.close(); }
}
main().then(()=>server.close(), error=>{
  console.error(error); server.close(); process.exitCode=1;
});
