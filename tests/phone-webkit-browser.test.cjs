// WebKit engine regression coverage; real iOS system callouts still need device playtesting.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,decodeURIComponent((req.url||'/').split('?')[0].replace(/^\//,''))||'phone.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{let browser,activePage;try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await webkit.launch();
 for(const size of [{width:375,height:800},{width:393,height:852},{width:800,height:375},{width:844,height:390}]){
 const page=await browser.newPage({viewport:size,hasTouch:true,isMobile:true}),errors=[];activePage=page;page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/phone.html');await page.waitForFunction(()=>!!window.Prototype);
 await page.keyboard.press('f');await page.keyboard.press('f');await page.waitForFunction(()=>document.querySelector('#modal').hidden);
 await page.evaluate(()=>{const c=Prototype.game;c.enter('vale');c.zone().enemies=[];c.zone().props=[];c.s.party=[];Object.assign(c.hero,{x:600,y:900,order:null});Prototype.updateHUD();});
 const hud=await page.locator('#hud').boundingBox(),skills=await page.locator('#skills').boundingBox();
 assert(hud.height<=60,'WebKit HUD stays compact');assert(skills.y+skills.height>=size.height-12,'WebKit combat rests at bottom right');
 for(const selector of ['#hero-stats','#skill-1','#joystick','#menu-button'])assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).webkitUserSelect),'none',selector+' blocks selection');
 assert.equal(await page.locator('#import-file').evaluate(el=>getComputedStyle(el).webkitUserSelect),'text','form input retains text behavior');
 assert(await page.locator('#location').isHidden());assert(await page.locator('#skill-2').isHidden());assert(await page.locator('#touch-interact-button').isHidden());
 const readout=await page.locator('#hero-stats .resource-line span').first().boundingBox();
 await page.touchscreen.tap(readout.x+readout.width/2,readout.y+readout.height/2);assert(await page.locator('#modal').isHidden(),'readout tap cannot activate a menu');assert.equal(await page.evaluate(()=>Prototype.game.hero.order),null);
 await page.mouse.move(readout.x+4,readout.y+readout.height/2);await page.mouse.down();await page.waitForTimeout(700);await page.mouse.move(readout.x+readout.width-4,readout.y+readout.height/2,{steps:8});await page.mouse.up();
 assert.equal(await page.evaluate(()=>getSelection().toString()),'','readout hold/drag cannot select game text');
 await page.evaluate(()=>{const c=Prototype.game;Object.assign(c.hero,{mp:1000,maxMp:1000,power:18,weapon:0,legacyWeaponPower:0,legacyEquipped:false,talents:[0,0,0,0]});c.hero.cd[0]=0;c.s.mercyTime=0;const e=c.makeEnemy({species:'goblin',level:1,hp:10000,damage:0,gold:0,xp:0},{x:680,y:900});c.zone().enemies=[e];c.s.heroTarget=e.id;Prototype.updateHUD();});
 const skill=await page.locator('#skill-1').boundingBox();await page.mouse.move(skill.x+skill.width/2,skill.y+skill.height/2);await page.mouse.down();
 await page.waitForFunction(()=>document.querySelector('#skill-1 small').textContent==='CHARGED',null,{timeout:2500});await page.mouse.up();
 await page.waitForFunction(()=>{const e=Prototype.game.zone().enemies[0];return e.hp<e.maxHp;});assert.equal(await page.evaluate(()=>{const e=Prototype.game.zone().enemies[0];return e.maxHp-e.hp;}),90,'WebKit release casts once');assert.equal(await page.evaluate(()=>getSelection().toString()),'');
 await page.evaluate(()=>{const c=Prototype.game;c.zone().enemies=[];c.s.projectiles=[];c.hero.skills=Array(8).fill(1);const u=c.unit('archer',1100,1050);c.s.party=[u];Prototype.updateHUD();});
 for(let i=1;i<=8;i++)assert(await page.locator('#skill-'+i).isVisible());assert(await page.locator('#health-potion').isVisible());await page.evaluate(()=>Prototype.game.s.party[0].order={type:'wait'});await page.locator('#recall-button').tap();assert(await page.evaluate(()=>Prototype.game.s.recallActive&&Prototype.game.s.party.every(u=>u.order===null)),'WebKit Recall stays directly available');
 const all=await page.locator('#skills').boundingBox(),joy=await page.locator('#joystick').boundingBox();assert(all.y>hud.y+hud.height,'all learned controls stay below HUD');assert(all.x>=joy.x+joy.width,'all learned controls avoid joystick');assert(all.y+all.height<=size.height);
 const npc=await page.evaluate(()=>{const c=Prototype.game,n=c.zone().npcs.find(n=>n.kind==='quests');c.zone().npcs=[n];c.zone().nodes=[];c.zone().buildings=[];Object.assign(c.hero,{x:n.x,y:n.y});Prototype.updateHUD();return {x:n.x,y:n.y};});
 const prompt=await page.locator('#touch-interact-button').boundingBox();assert(prompt.x+prompt.width<=all.x||prompt.y+prompt.height<=all.y||prompt.y>=all.y+all.height,'contextual Interact stays clear of all learned controls');
 await page.locator('#touch-interact-button').tap();assert((await page.locator('#modal-title').textContent())==='Local quests');await page.keyboard.press('Escape');
 await page.evaluate(n=>{Object.assign(Prototype.game.hero,{x:n.x+116,y:n.y});Prototype.updateHUD();},npc);assert(await page.locator('#touch-interact-button').isHidden());
 await page.keyboard.press('g');assert.equal(await page.locator('#modal').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');
 const scroll=await page.locator('#modal-content').evaluate(el=>{el.scrollTop=80;return {top:el.scrollTop,max:el.scrollHeight-el.clientHeight};});assert(scroll.max===0||scroll.top>0,'compact help fits or scrolls while Back remains visible');
 await page.keyboard.press('Escape');await page.locator('#menu-button').tap();await page.getByRole('button',{name:'Talents',exact:true}).tap();assert.equal(await page.locator('#modal-title').textContent(),'Talents');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await page.evaluate(()=>{Prototype.closeMenu();Prototype.game.hero.order=null;Prototype.openMenu('Outside dismissal test','Tap outside',[{label:'Stay',action:()=>{}}]);});await page.touchscreen.tap(4,Math.round(size.height/2));assert(await page.locator('#modal').isHidden(),'WebKit outside tap dismisses dialog');assert.equal(await page.evaluate(()=>Prototype.game.hero.order),null,'dismissal does not start movement');
 await page.evaluate(()=>Prototype.save());assert(!(await page.locator('#status').textContent()).includes('Saved locally'));
 await require('./helpers/camera-browser.cjs').verifyCamera(page,path.join(root,'test-results'),'webkit-'+size.width+'x'+size.height,true,size.width===375);
 await require('./helpers/ironroot-browser.cjs').verifyIronroot(page,path.join(root,'test-results'),'webkit-'+size.width+'x'+size.height,size.width===375);
 await require('./helpers/regional-browser.cjs').verifyRegional(page,path.join(root,'test-results'),'webkit-'+size.width+'x'+size.height,size.width===375);
 assert.deepEqual(errors,[]);await page.screenshot({path:path.join(root,'test-results','webkit-phone-'+size.width+'x'+size.height+'.png')});
 console.log('PASS WebKit phone input, selection, compact HUD, learned controls, interaction and menu access '+size.width+'x'+size.height);await page.close();
 }
}catch(e){await activePage?.screenshot({path:path.join(root,'test-results','webkit-failure.png')}).catch(()=>{});throw e;}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
