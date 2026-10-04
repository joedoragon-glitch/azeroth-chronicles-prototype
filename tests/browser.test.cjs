/* Real Chromium smoke tests. CI installs Playwright; runtime app has no dependencies. */
const {chromium}=require('playwright');
const http=require('http'), fs=require('fs'), path=require('path'), assert=require('assert/strict');
const root=path.resolve(__dirname,'..'), prefix='/azeroth-chronicles-prototype/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  if(!url.pathname.startsWith(prefix)){response.writeHead(404);response.end();return}
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return}
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(response);
});
function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y}
(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}${prefix}`;
    browser=await chromium.launch();fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    const sizes=[{name:'desktop',width:1280,height:800,touch:false},{name:'chromebook-touch',width:1366,height:768,touch:true},{name:'phone',width:390,height:844,touch:true},{name:'small-phone',width:320,height:568,touch:true},{name:'landscape',width:844,height:390,touch:true}];
    for(const size of sizes){
      const context=await browser.newContext({viewport:{width:size.width,height:size.height},hasTouch:size.touch,isMobile:size.touch&&size.width<900});
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
      await page.goto(base);await page.getByRole('button',{name:'Jugar [Enter / ESC]',exact:true}).click();
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      assert.equal(await page.evaluate(()=>document.body.classList.contains('touch-mode')),size.touch,size.name);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow: '+size.name);
      if(size.touch){
        const joystick=await page.locator('#joystick').boundingBox(),bar=await page.locator('#action-bar').boundingBox();
        assert(joystick&&bar&&!overlap(joystick,bar),'thumb controls overlap: '+size.name);
        for(const rect of [joystick,bar])assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=size.width+1&&rect.y+rect.height<=size.height+1,'controls outside viewport: '+size.name);
        // Real two-finger input gives the browser active pointer IDs for capture.
        const session=await context.newCDPSession(page),sword=await page.locator('#slot-1').boundingBox();
        const move={x:joystick.x+joystick.width*.8,y:joystick.y+joystick.height*.5,id:1};
        const attack={x:sword.x+sword.width*.5,y:sword.y+sword.height*.5,id:2};
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move,attack]});
        await page.waitForFunction(()=>touchInput.x>0&&touchInput.attack);
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForFunction(()=>touchInput.x===0&&!touchInput.attack);
        await session.detach();
      } else {
        const before=await page.evaluate(()=>[player.wx,player.wy]);await page.keyboard.down('d');await page.waitForFunction(([x,y])=>Math.hypot(player.wx-x,player.wy-y)>12,before);await page.keyboard.up('d');
      }
      await page.getByRole('button',{name:'Abrir menú del juego',exact:true}).click();
      assert.equal(await page.evaluate(()=>isGamePaused()),true);
      await page.getByRole('button',{name:'🎒 Mochila',exact:true}).click();
      await page.getByRole('button',{name:'Cerrar',exact:true}).click();
      await page.getByRole('button',{name:'Abrir menú del juego',exact:true}).click();
      await page.getByRole('button',{name:'🗺️ Mapa',exact:true}).click();
      assert((await page.locator('#mapCanvas').boundingBox()).height>0);
      await page.keyboard.press('Escape');
      await page.getByRole('button',{name:'Abrir menú del juego',exact:true}).click();
      await page.locator('#win-appmenu').getByRole('button',{name:'Guardar',exact:true}).click();
      await page.getByRole('button',{name:'Volver al juego',exact:true}).click();
      await page.screenshot({path:path.join(root,'test-results',size.name+'.png')});
      await context.setOffline(true);await page.reload();
      assert.equal(await page.evaluate(()=>typeof updateGame),'function');
      assert.equal(await page.evaluate(()=>activeWindow),null,'saved game should restore without help');
      assert.deepEqual(errors,[],size.name+' browser errors');
      console.log('PASS Chromium '+size.name+': input, menus, layout and offline reload');
      await context.close();
    }
  } catch(error){console.error(error.stack);process.exitCode=1}
  finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})();
