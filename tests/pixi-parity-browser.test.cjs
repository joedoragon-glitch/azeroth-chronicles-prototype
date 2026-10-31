'use strict';
// #748: one Campaign, actual GPU + Canvas composition, deterministic presentation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.PARITY_OUT || path.join(root, 'test-artifacts/parity-748'));
const scripts = require('../scripts/site-assets.cjs').scripts.filter(p => !p.endsWith('/app.js'));
const html = '<meta charset="utf-8"><style>body{margin:0;background:#000}canvas{position:fixed;inset:0}#world{z-index:2}</style><canvas id="world" width="912" height="600"></canvas>' + scripts.map(p => '<script src="/' + p + '"></script>').join('');
const server = http.createServer((req,res) => {
  const rel = new URL(req.url,'http://local').pathname;
  if(rel === '/') { res.setHeader('Content-Type','text/html'); return res.end(html); }
  const file = path.resolve(root,'.' + decodeURIComponent(rel));
  if(!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',({'.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function main() {
  fs.mkdirSync(out,{recursive:true});
  let browser;
  try {
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    browser=await chromium.launch({...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:912,height:600},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.evaluate(async()=>{
      window.g = new Campaign('normal','paladin',()=>0.73);
      window.clock=0;
      PrototypeSprites.timeMs=()=>window.clock;
      const canvas=document.querySelector('#world');
      window.platform={cameraZoom:1.5,cameraAnchor:()=>({x:456,y:330})};
      window.opts={canvas,ctx:canvas.getContext('2d'),getGame:()=>g,platform,
        chargePresentation:()=>null,isPaused:()=>false,Campaign,PrototypeVisuals,
        PrototypeCombatVisuals,PrototypeSprites,PrototypeMaterials,now:()=>clock};
      window.painter=PrototypeRenderer.create(opts);
      painter.setOptimizationMode(true);
      await PrototypeSprites.preload();
      await PrototypeSprites.warm(Object.keys((await (await fetch('/assets/sprites/manifest.json')).json()).sprites),{variants:true,clips:true});
    });
    const rows=[];
    for(const fixture of (process.env.PARITY_FIXTURES || 'warlord,ridge,regalia,cover,registered,wildlife,lamp').split(',')) {
      await page.evaluate(name=>{
        const family=name==='ridge'?'ridge':'warlord';
        g.enter(g.boss(family).region);
        const z=g.zone(), b=z.enemies.find(e=>e.family===family && e.type==='boss');
        if(!b && ['warlord','ridge','regalia'].includes(name))throw Error('Native boss missing: '+family);z.props=[];z.buildings=[];z.npcs=[];z.enemies=[];g.s.party=[];
        g.s.loot=[];g.s.projectiles=[];g.s.clock=120;g.s.time=100;
        Object.assign(g.hero,{x:1000,y:1000,path:[],order:null});
        if(['warlord','ridge','regalia'].includes(name)) {
          Object.assign(b,{x:1080,y:960,hp:b.maxHp,aggro:true});z.enemies=[b];
          b.ashCloud=null;b.ledgerMarkUntil=0;
          if(name==='warlord') b.ashCloud={x:1000,y:1000,expires:106};
          if(name==='ridge') {b.ledgerMarkedId='hero';b.ledgerMarkUntil=106;b.ledgerOpen=true;}
          if(name==='regalia') {b.form='true';b.rangedAim=true;}
        }
        if(name==='registered') {
          g.enter('vale');Object.assign(g.hero,{x:1000,y:1000,path:[],order:null});const v=g.zone();
          const e=v.enemies.find(e=>PrototypeSprites.definitionFor({...e,renderKind:'enemy'},0,false));
          if(!e)throw Error('No native registered enemy');
          v.enemies=[e];v.props=[];v.buildings=[];v.npcs=[];
          Object.assign(e,{x:1080,y:960,form:'true',rangedAim:{x:1000,y:1000},frenzy:true});
        }
        if(name==='cover')z.props=[{id:'parity-cover',structure:'dead-tree',x:1020,y:1020,r:28,decorative:true}];
        if(name==='wildlife')z.props=[{id:'parity-sheep',structure:'pasture-sheep',x:1040,y:1000,decorative:true}];
        if(name==='lamp'){g.s.clock=480;z.props=[{id:'parity-lamp',structure:'roadside-lantern',x:1040,y:1000,decorative:true}];}
        window.clock=0;
      },fixture);
      console.log('PREPARE '+fixture);
      await page.evaluate(async()=>{
        window.gpu=PrototypePixiExperimental.create({worldCanvas:opts.canvas,viewport:opts.canvas,platform,getGame:()=>g,canvasRenderer:painter,getOptimizationMode:()=>true,getRendererOptions:()=>opts,onFailure:e=>{throw Error(JSON.stringify(e));}});
        if(!await gpu.prepare())throw Error(JSON.stringify(gpu.status()));
      });
      for(const mode of ['canvas','pixi']) {
        await page.evaluate(mode=>{if(mode==='canvas'){gpu.deactivate();painter.setRenderLayer('full');}else{gpu.activate();painter.setRenderLayer('overlay');}},mode);
        for(const time of [0,7000]) {
          const status=await page.evaluate(({mode,time})=>{
            window.clock=time;
            // Time changes presentation only; gameplay expiration is a separate state fixture.
            if(mode==='pixi')gpu.draw();painter.draw();
            return {zone:g.zoneId,hero:{x:g.hero.x,y:g.hero.y},time:g.s.time,clock,
              zoom:platform.cameraZoom,renderer:mode,gpu:gpu.status(),canvas:painter.metrics()};
          },{mode,time});
          if(mode==='pixi')assert(status.gpu.active && !status.gpu.lastError,'No GPU fallback');
          const name=fixture+'-'+mode+'-'+time+'.png';
          await page.screenshot({path:path.join(out,name)});rows.push({fixture,mode,time,file:name,status});
        }
        await page.evaluate(()=>{window.clock=0;});
      }
      await page.evaluate(()=>gpu.dispose());
      console.log('CAPTURED '+fixture);
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({head:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),engine:await browser.version(),rows,errors},null,2));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
