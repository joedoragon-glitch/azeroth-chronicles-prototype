'use strict';
// Phase 7 one-browser technical acceptance: real MP3 bytes, Web Audio decode,
// title→game→boss/TRUE→Succession→Finale→peace. Not a listening-room review,
// broad browser/device matrix, or claim of audible aesthetic certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const manifest = require('../assets/audio/manifest.json');
const evidenceFile = path.join(root, 'tools/audio/phase7-integration-evidence.json');
if (!fs.existsSync(evidenceFile)) {
  console.log('PENDING Phase 7 browser playback: 65 recordings not yet installed in draft catalog');
  process.exit(0);
}
const evidence = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
assert.equal(evidence.candidateCount, 65);
const ids = evidence.recordings.map((r) => r.id);
assert.equal(new Set(ids).size, 65);
for (const id of ids) assert.equal(manifest.assets[id].sha256,
  evidence.recordings.find((r) => r.id === id).sha256);
const prefix = '/azeroth-chronicles-prototype/';
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const rel = name.startsWith(prefix) ? name.slice(prefix.length) : null;
  const file = rel === null ? '' : path.resolve(root, rel || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true,
      args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']});
    const context = await browser.newContext({viewport:{width:1024,height:800},
      serviceWorkers:'block'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const url = 'http://127.0.0.1:' + server.address().port + prefix;
    await page.goto(url);
    await page.waitForFunction((hash) => {
      const a = window.Prototype?.audio;
      return a && a.recordingManifest?.assets?.title?.sha256 === hash &&
        document.querySelector('#title-screen:not([hidden])') &&
        !document.querySelector('#startup-update:not([hidden])');
    }, manifest.assets.title.sha256, {timeout:30000});
    assert.equal(await page.evaluate(() => Prototype.audio.ctx), null,
      'first title music obeys browser gesture gate');
    await page.locator('#title-heading').click();
    await page.waitForFunction(() => {
      const a = Prototype.audio;
      return a.ctx?.state === 'running' && a.recordedScore?.id === 'title' &&
        a.context?.started === false;
    }, null, {timeout:40000});
    const title = await page.evaluate(() => {
      const a = Prototype.audio, score = a.recordedScore;
      return {id: score.id, voices:score.voices.length, paused:a.paused,
        state:a.ctx.state, duration:score.duration};
    });
    assert.equal(title.id, 'title');
    assert.equal(title.voices, 1);
    assert.equal(title.paused, false);
    assert(title.duration > 40 && title.duration < 43,
      'actual recorded theme plays at title, not the old 22s prototype');

    // Suppress only the app's repeat frame selection so the same live audio
    // facade can receive controlled real Campaign scenes; preserve all audio
    // routing/recordings methods, including error recovery and mixing.
    await page.evaluate(() => {
      const a = Prototype.audio;
      window.phase7RealUpdate = Object.getPrototypeOf(a).update.bind(a);
      a.update = () => {};
    });
    const decoded = await page.evaluate(async (all) => {
      const a = Prototype.audio, assets = await a.assetsForRecordings();
      let count = 0, peakBytes = 0;
      for (const id of all) {
        const item = await assets.load(id);
        if (item.buffer.numberOfChannels !== 2 ||
            item.buffer.duration < item.entry.loop.end ||
            Math.abs(item.buffer.duration - item.entry.duration) > 0.08)
          throw Error('Browser decoded invalid stereo MP3: ' + id);
        const samples = item.buffer.getChannelData(0);
        let power = 0;
        for (let k=0; k<samples.length; k+=997) power += samples[k]*samples[k];
        if (!(power > .00001)) throw Error('MP3 decoded silence: ' + id);
        if (assets.bytes > assets.budget) throw Error('Decoded cache over 96-MiB budget');
        peakBytes = Math.max(peakBytes, assets.bytes);
        count++;
      }
      return {count, peakBytes, budget:assets.budget};
    }, ids);
    assert.equal(decoded.count, 65, 'all 65 real MP3s decoded and hash verified in Chromium');
    assert.equal(decoded.budget, 96*1024*1024);

    const feed = async (zone, boss = null) => page.evaluate(({zone, boss}) => {
      const a = Prototype.audio, c = new Campaign('normal', 'paladin', () => .43);
      c.enter(zone);
      if (boss) c.zone().enemies.push({
        id:'phase7-game-boss', type:'boss',family:boss.family,form:boss.form,
        hp:1000,maxHp:1000,aggro:true,neutral:false,name:'Audio QA boss'
      });
      window.phase7Campaign=c;
      window.phase7RealUpdate(c,false,{started:true});
      return {scene:a.context,selector:a.productionCue(a.context)?.id};
    }, {zone,boss});
    const first = await feed('vale');
    assert.equal(first.selector, 'place-vale');
    await page.waitForFunction(() => Prototype.audio.recordedScore?.id==='place-vale',
      null,{timeout:30000});
    await page.waitForFunction(() => ![...Prototype.audio.voices].some(
      (v) => v.recordedScore?.id === 'title'),null,{timeout:8000});
    const normal = await feed('crypt',{family:'crypt',form:'normal'});
    assert.equal(normal.selector,'boss-crypt');
    await page.waitForFunction(() => Prototype.audio.recordedScore?.id==='boss-crypt' &&
      Prototype.audio.recordedScore.voices.length===2,null,{timeout:30000});
    const normalMix=await page.evaluate(() => {
      const a=Prototype.audio;return {
        ids:a.recordedScore.voices.map(v=>v.id),
        baseStart:a.recordedScore.voices[0].at,
        layerStart:a.recordedScore.voices[1].at,
        baseDuration:a.recordedScore.voices[0].item.entry.loop.end -
          a.recordedScore.voices[0].item.entry.loop.start,
        layerDuration:a.recordedScore.voices[1].item.entry.loop.end -
          a.recordedScore.voices[1].item.entry.loop.start,
        activeLayer:a.recordedScore.voices[1].targetGain
      };
    });
    assert.equal(normalMix.baseStart,normalMix.layerStart,'same-clock boss stems');
    assert(Math.abs(normalMix.baseDuration-normalMix.layerDuration)<1/44100);
    assert.equal(normalMix.activeLayer,.12);
    const trueMix=await page.evaluate(() => {
      const c=window.phase7Campaign,a=Prototype.audio;
      const enemy=c.zone().enemies.find(e=>e.id==='phase7-game-boss');
      enemy.form='true';
      window.phase7RealUpdate(c,false,{started:true});
      return {form:a.context.boss?.form,layer:a.recordedScore?.voices[1].targetGain};
    });
    assert.equal(trueMix.form,'true');
    assert.equal(trueMix.layer,.55,'TRUE layer intensifies without losing shared clock');

    const succession=await page.evaluate(() => {
      const c=new Campaign('normal','paladin',()=>.43,{succession:true}),a=Prototype.audio;
      c.die();
      const types=c.effects.map(e=>e.type);
      for(const e of c.effects.splice(0))a.effect(e);
      window.phase7Campaign=c;
      window.phase7RealUpdate(c,false,{started:true,menu:true});
      return {pending:c.s.challenge.pending,gameOver:c.s.challenge.gameOver,
        types,score:a.productionCue(a.context)?.id,mix:a.mixScene};
    });
    assert(succession.pending && !succession.gameOver);
    assert(succession.types.includes('death'));
    assert.equal(succession.score,'defeat');
    assert.equal(succession.mix,'world');
    await page.waitForFunction(()=>Prototype.audio.recordedScore?.id==='defeat',
      null,{timeout:30000});

    const ending=await page.evaluate(() => {
      const c=new Campaign('normal','paladin',()=>.43),a=Prototype.audio;
      c.s.true.darklord=true; c.s.throneClaimed=true;
      for(const id of Campaign.dungeonIds)c.s.true[id]=true;
      c.checkEnding();
      const types=c.effects.map(e=>e.type);
      for(const e of c.effects.splice(0))a.effect(e);
      window.phase7Campaign=c;
      window.phase7RealUpdate(c,false,{started:true});
      return {peace:c.peace,types,window:a.finaleUntil-a.ctx.currentTime,
        score:a.productionCue(a.context)?.id};
    });
    assert(ending.peace && ending.types.includes('peace'));
    assert.equal(ending.score,'finale');
    assert(ending.window>47 && ending.window<49);
    await page.waitForFunction(()=>Prototype.audio.recordedScore?.id==='finale',
      null,{timeout:30000});
    const warning=await page.evaluate(()=>{
      const a=Prototype.audio;
      a.effect('warning');
      return {ducked:a.duckUntil>a.ctx.currentTime,
        sound:a.recordedScore?.id,
        bytes:a.recordingAssets?.bytes,
        budget:a.recordingAssets?.budget,
        error:a.recordingError};
    });
    assert(warning.ducked,'real warning must duck both music and ambience');
    assert.equal(warning.sound,'finale');
    assert(warning.bytes<=warning.budget);
    assert.equal(warning.error,null);

    // End-to-end actual playback lifecycle: Finale's 48s phrase must finish
    // before an authored location-specific peace recording takes over.
    await page.waitForFunction(() => Prototype.audio.ctx.currentTime >
      Prototype.audio.finaleUntil+.12,null,{timeout:65000});
    await page.evaluate(()=>window.phase7RealUpdate(window.phase7Campaign,false,{started:true}));
    await page.waitForFunction(()=>Prototype.audio.recordedScore?.id==='peace-vale',
      null,{timeout:35000});
    const final = await page.evaluate(()=>{
      const a=Prototype.audio;return {
        score:a.recordedScore.id,bytes:a.recordingAssets.bytes,
        budget:a.recordingAssets.budget,voices:a.voices.size,
        recordingError:a.recordingError,environmentError:a.environmentError};
    });
    assert.equal(final.score,'peace-vale');
    assert(final.bytes<=final.budget && final.voices<=64);
    assert.equal(final.recordingError,null);
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS Phase7 one real Chromium game entrypoint: 65 real encoded MP3 hash/decode, title gesture and exit, boss TRUE sync, Succession loss, warning duck, 48s Finale→peace, 96MiB cache');
    console.log(JSON.stringify({decoded, title,normalMix,trueMix,succession,
      finaleWindow:ending.window,warning,final,heard:false,
      deviceVerified:false}));
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve)=>server.close(resolve));
  }
}
main().catch((error)=>{ console.error(error); process.exitCode=1; });
