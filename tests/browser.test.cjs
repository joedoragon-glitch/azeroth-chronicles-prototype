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
        // Complete menu flow with left-side keys, including a persisted rebind.
        await page.keyboard.press('q');assert.equal(await page.evaluate(()=>activeWindow),'appmenu');
        await page.keyboard.press('s');await page.keyboard.press('f');assert.equal(await page.evaluate(()=>activeWindow),'spells');
        await page.keyboard.press('q');await page.keyboard.press('q');
        await page.keyboard.press('r');await page.keyboard.press('d');await page.keyboard.press('d');await page.keyboard.press('f');
        assert.equal(await page.evaluate(()=>equippedWeapon===inventory[2]),true);
        await page.keyboard.press('q');await page.keyboard.press('q');
        assert.equal(await page.getByRole('button',{name:'Personalizar teclas',exact:true}).count(),0);
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
      // The RTS is a separate page in the same installable app and cache.
      await context.setOffline(false);await page.goto(base+'rts.html');
      await page.getByRole('button',{name:'Jugar / continuar',exact:true}).click();
      assert((await page.locator('#rts-field').boundingBox()).height>=100,'RTS field too small: '+size.name);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'RTS overflow');
      const primary=await page.locator('#rts-primary').boundingBox(),order=await page.locator('#rts-order').boundingBox(),stick=await page.locator('#rts-joystick').boundingBox();
      assert(primary.x+primary.width/2<size.width/2,'primary action must stay left');
      assert(order.x>size.width/2,'orders must stay right');assert(!overlap(stick,primary)&&!overlap(stick,order),'RTS input overlap');
      if(size.touch){
        await page.touchscreen.tap(primary.x+primary.width/2,primary.y+primary.height/2);
        assert.match(await page.locator('#rts-stats').innerText(),/0 seleccionadas/,'one tap must not select');
        await page.touchscreen.tap(primary.x+primary.width/2,primary.y+primary.height/2);
        await page.waitForFunction(()=>document.querySelector('#rts-stats').textContent.includes('1 seleccionadas'));
        const session=await context.newCDPSession(page),move={x:stick.x+stick.width*.8,y:stick.y+stick.height*.5,id:1},command={x:order.x+order.width/2,y:order.y+order.height/2,id:2};
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move,command]});
        await page.waitForFunction(()=>document.querySelector('#rts-knob').style.transform.includes('translate'));
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForFunction(()=>document.querySelector('#rts-knob').style.transform==='');await session.detach();
      }else{
        await page.keyboard.press('e');assert.match(await page.locator('#rts-stats').innerText(),/1 seleccionadas/);
        await page.keyboard.press('1');assert.match(await page.locator('#rts-stats').innerText(),/3 seleccionadas/);
        await page.keyboard.press('f');assert.match(await page.locator('#rts-message').innerText(),/Orden: mover/);
      }
      await page.getByRole('button',{name:'Abrir menú RTS',exact:true}).click();
      await page.getByRole('button',{name:'Jugar / continuar',exact:true}).click();
      await page.screenshot({path:path.join(root,'test-results','rts-'+size.name+'.png')});
      await context.setOffline(true);await page.reload();assert.match(await page.title(),/RTS/);
      await page.getByRole('button',{name:'Jugar / continuar',exact:true}).click();
      assert.match(await page.locator('#rts-stats').innerText(),/3\/12 tropas/);assert.deepEqual(errors,[],size.name+' RTS errors');
      console.log('PASS Chromium RTS '+size.name+': virtual cursor, left selection, right orders and offline reload');
      await context.close();
    }
  } catch(error){console.error(error.stack);process.exitCode=1}
  finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})();
