const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
const code = fs.readFileSync(require('path').join(__dirname, '../src/controls.js'), 'utf8') + '\n' + fs.readFileSync(require('path').join(__dirname, '../src/classes.js'), 'utf8')+'\n'+fs.readFileSync(require('path').join(__dirname, '../src/game.js'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

function fresh({ deniedStorage = false, saved = null, controls = null } = {}) {
  const elements = new Map(), events = {}, docEvents = {}, frames = [], drawings = [];
  const storage = new Map(saved ? [['azeroth-chronicles-prototype-save-v2', saved]] : []);
  if(controls) storage.set('azeroth-keyboard-controls-v1',controls);
  const ctx = new Proxy({}, { get(target, name) {
    if (name in target) return target[name];
    if (name === 'measureText') return text => ({width: String(text).length * 7});
    return (...args) => {
      for (const n of args) if (typeof n === 'number') assert(Number.isFinite(n), `Canvas ${name}: ${n}`);
      if (name === 'fillText') assert(typeof args[0] === 'string', 'Floating text must be a string');
      drawings.push({name, args});
    };
  }});
  function element(tagName = 'DIV') {
    const classes = new Set();
    return { tagName, children: [], style: {}, attributes: {}, parentElement: {clientWidth:600, clientHeight:288}, hidden:false,
      _text:'', _html:'', className:'', width:1280,height:720,
      classList: {add(...items){items.forEach(i=>classes.add(i));},remove(...items){items.forEach(i=>classes.delete(i));},toggle(i,on){on ? classes.add(i) : classes.delete(i);},contains(i){return classes.has(i);}},
      get innerText(){return this._text;},set innerText(v){this._text=String(v);},
      get textContent(){return this._text;},set textContent(v){this._text=String(v);this.children=[];},
      get innerHTML(){return this._html;},set innerHTML(v){this._html=v;this.children=[];},
      get firstChild(){return this.children[0];},
      appendChild(item){this.children.push(item);},removeChild(item){this.children.splice(this.children.indexOf(item),1);},
      setAttribute(name,value){this.attributes[name]=value;},getContext(){return ctx;},click(){if(this.onclick)this.onclick();}
    };
  }
  for(const id of ids) { const el=element(); el.id=id; elements.set(id,el); }
  elements.get('install-button').hidden=true; elements.get('update-button').hidden=true;
  const window = {innerWidth:1280,innerHeight:720,addEventListener(name,fn){(events[name]??=[]).push(fn);},confirm(){return true;},
    localStorage: {getItem(key){if(deniedStorage)throw Error('Storage blocked');return storage.get(key)||null;},setItem(key,value){if(deniedStorage)throw Error('Storage blocked');storage.set(key,value);}}};
  const document = {hidden:false,body:element(),getElementById(id){assert(elements.has(id),`Missing HTML element ${id}`);return elements.get(id);},createElement:element,
    addEventListener(name,fn){(docEvents[name]??=[]).push(fn);}};
  const sandbox={window,document,performance:{now(){return 0;}},requestAnimationFrame(fn){frames.push(fn);},setTimeout(){},Blob,
    URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){}}, console};
  vm.createContext(sandbox);vm.runInContext(code,sandbox,{timeout:2000});
  function run(body){return vm.runInContext(`(()=>{${body}})()`,sandbox,{timeout:5000});}
  function emit(name,properties={}){for(const fn of events[name]||[])fn({code:'',key:'',repeat:false,preventDefault(){},...properties});}
  function docEmit(name){for(const fn of docEvents[name]||[])fn();}
  window.onload();
  return {run,emit,docEmit,sandbox,elements,storage,drawings,document};
}

let passed=0;
function test(name,fn){try{fn();passed++;console.log(`PASS ${name}`);}catch(e){console.error(`FAIL ${name}: ${e.stack}`);process.exitCode=1;}}
function eq(actual,expected){assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);}
function ready(options){const g=fresh(options);g.run(`closeAllWindows();`);return g;}

test('Offline bootstrap, help, HUD and finite canvas rendering',()=>{
  const g=fresh();assert(g.run(`return activeWindow==='help' && isGamePaused();`));g.run(`drawScene();renderMapUI();`);
  assert(!/(?:src|href)=['"]https?:/.test(html));assert(g.drawings.length>0);
});
test('Re-equipping and swapping weapons preserves one bonus',()=>{
  const g=ready();eq(g.run(`openWindow('inventory');menuIndex=2;executeMenuSelection();executeMenuSelection();executeMenuSelection();const first=player.spellPower;
    inventory.push({...shopCatalog[2]});menuIndex=3;executeMenuSelection();const second=player.spellPower;menuIndex=2;executeMenuSelection();return [first,second,player.spellPower];`),[28,36,28]);
});
test('Lethal sword attack awards exactly one drop without null-target crash',()=>{
  const g=ready();eq(g.run(`player.wx=700;player.wy=650;const e=enemies[0];e.hp=1;selectedTarget=e;castSpell(1);handleEnemyDeath(e);drawScene();return [e.hp,groundLoot.length,player.xp];`),[0,1,35]);
});
test('Interaction targets enemies without missing function',()=>{
  const g=ready();assert(g.run(`player.wx=700;player.wy=650;interactWithNearby();return selectedTarget===enemies[0];`));
});
test('Invalid spells, full-health heal and distant target spend no resources',()=>{
  const g=ready();eq(g.run(`selectedTarget=enemies[0];castSpell(1);castSpell(2);castSpell(3);castSpell(5);castSpell(99);return [player.mp,...Object.values(player.cds),activeProjectiles.length];`),[60,0,0,0,0,0,0,0]);
});
test('Fireball retargets a nearby enemy instead of a stale distant target',()=>{
  const g=ready();assert(g.run(`player.wx=700;player.wy=650;selectedTarget=enemies[4];castSpell(2);return activeProjectiles[0].targetEnemy===enemies[0] && player.mp===45;`));
});
test('Full-resource potions are conserved and equipment purchase is not duplicated',()=>{
  const g=ready();eq(g.run(`openWindow('inventory');menuIndex=0;executeMenuSelection();menuIndex=1;executeMenuSelection();const count=inventory.length;
    openWindow('shop');player.gold=200;menuIndex=2;executeMenuSelection();executeMenuSelection();return [count,inventory.length,player.gold];`),[3,4,120]);
});
test('Trainer adds 25 percent of base power per rank and caps upgrades',()=>{
  const g=ready();eq(g.run(`openWindow('trainer');menuIndex=1;player.gold=1000;executeMenuSelection();const scale=spellScale(2);player.spellLevels[2]=5;const gold=player.gold;executeMenuSelection();return [scale,player.spellLevels[2],player.gold===gold];`),[1.25,5,true]);
});
test('Talent speed description matches the applied improvement',()=>{
  const g=ready();eq(g.run(`openWindow('talents');player.talentPoints=1;menuIndex=3;executeMenuSelection();return [player.maxSpeed,player.acceleration,player.talentPoints];`),[340,1050,0]);
});
test('Menus pause enemies, mana, cooldowns, projectiles and respawns',()=>{
  const g=ready();assert(g.run(`player.wx=700;player.wy=650;player.mp=10;player.cds[2]=1;enemies[1].hp=0;enemies[1].respawnRemaining=4;openWindow('inventory');const before=JSON.stringify(saveSnapshot());updateGame(5);return before===JSON.stringify(saveSnapshot());`));
});
test('Manual pause and focus loss clear keys and freeze the game',()=>{
  const g=ready();g.emit('keydown',{code:'KeyD'});g.run(`updateGame(.1);togglePause();`);assert(g.run(`return !keys.KeyD && isGamePaused() && player.vx===0;`));
  g.run(`togglePause();`);g.emit('blur');assert(g.run(`return isGamePaused();`));g.emit('focus');assert(g.run(`return !isGamePaused();`));
});
test('Repeated menu hotkeys do not flicker open and closed',()=>{
  const g=ready();g.emit('keydown',{code:'KeyI'});g.emit('keydown',{code:'KeyI',repeat:true});assert(g.run(`return activeWindow==='inventory';`));
});
test('Village interaction is required to accept and claim a quest',()=>{
  const g=ready();eq(g.run(`player.wx=1000;player.wy=1000;handleQuestAction();const remote=questState.active;player.wx=280;player.wy=380;handleQuestAction();return [remote,questState.active];`),[false,true]);
});
test('Mission counts ordinary enemies, excludes the boss, reward pays once',()=>{
  const g=ready();eq(g.run(`player.wx=280;player.wy=380;handleQuestAction();handleEnemyDeath(enemies[4]);const afterBoss=questState.currentKills;
    for(let i=0;i<5;i++){const e=enemies[0];e.respawnRemaining=0;e.hp=1;handleEnemyDeath(e);}player.wx=280;player.wy=380;const gold=player.gold;
    handleQuestAction();handleQuestAction();return [afterBoss,questState.currentKills,questState.rewardClaimed,player.gold-gold];`),[0,5,true,60]);
});
test('Large XP awards process every earned level',()=>{
  const g=ready();eq(g.run(`addXp(350);return [player.level,player.xp,player.nextXp,player.talentPoints];`),[3,100,225,2]);
});
test('Mob and boss respawns use game time and their original spawn locations',()=>{
  const g=ready();assert(g.run(`const e=enemies[0];e.wx=1200;e.wy=900;handleEnemyDeath(e);updateEnemies(7.9);const dead=e.hp===0;updateEnemies(.2);
    const boss=enemies[4];handleEnemyDeath(boss);updateEnemies(8);return dead && e.hp===e.maxHp && e.wx===e.spawnWx && boss.hp===0 && boss.respawnRemaining===22;`));
});
test('Held movement reaches advertised speed and W moves upward on screen',()=>{
  const g=ready();const result=g.run(`player.wx=1900;player.wy=1900;keys.KeyW=true;const start=worldToIso(player.wx,player.wy);
    for(let i=0;i<120;i++)updateGame(1/60);const end=worldToIso(player.wx,player.wy);return [player.currentSpeed,end.y-start.y,end.x-start.x];`);
  assert(result[0]>299 && result[1]<0 && Math.abs(result[2])<20, JSON.stringify(result));
});
test('Release friction is stable at different frame rates',()=>{
  const g=ready();const values=g.run(`player.vx=200;player.vy=0;for(let i=0;i<60;i++)updateGame(1/60);const a=player.vx;
    player.vx=200;player.vy=0;for(let i=0;i<30;i++)updateGame(1/30);return [a,player.vx];`);assert(Math.abs(values[0]-values[1])<1);
});
test('Scenery blocks both player and hostile units',()=>{
  const g=ready();assert(g.run(`const prop=sceneryProps[0];player.wx=prop.wx;player.wy=prop.wy;resolveSceneryCollision(player);return Math.hypot(player.wx-prop.wx,player.wy-prop.wy)>=22*prop.scale+14-.00001;`));
});
test('Projectiles cannot overshoot, skip a neighbor, or duplicate kill rewards',()=>{
  const g=ready();eq(g.run(`const e=enemies[0];e.hp=10;activeProjectiles=[0,1,2].map(i=>({wx:e.wx-21,wy:e.wy,targetEnemy:e,damage:20,speed:450}));updateGame(.1);drawScene();return [activeProjectiles.length,groundLoot.length,e.hp];`),[0,1,0]);
});
test('Safe village restores resources, recent damage delays healing',()=>{
  const g=ready();eq(g.run(`player.hp=60;player.mp=0;updateGame(1);const first=[player.hp,player.mp];lastDamageTimer=5;updateGame(1);return [first,player.hp];`),[[68,6],68]);
});
test('Boss warning can be dodged, shielded, or cause real damage',()=>{
  const g=ready();assert(g.run(`const e=enemies[4];player.wx=e.wx-100;player.wy=e.wy;e.smashCd=0;updateEnemies(.01);const warning=!!e.telegraph;
    player.wx+=300;updateEnemies(1.3);const dodged=player.hp===120;
    e.aggro=true;e.telegraph={wx:player.wx,wy:player.wy,radius:105,remaining:.1};player.shieldActive=true;updateEnemies(.2);const blocked=player.hp===120;
    player.shieldActive=false;e.telegraph={wx:player.wx,wy:player.wy,radius:105,remaining:.1};updateEnemies(.2);drawScene();return warning&&dodged&&blocked&&player.hp<120;`));
});
test('Death restores the hero and ends enemy attacks for that update',()=>{
  const g=ready();eq(g.run(`player.wx=700;player.wy=650;player.hp=1;player.mp=0;enemies.forEach(e=>{e.wx=700;e.wy=650;e.aggro=true;});updateEnemies(.1);return [player.wx,player.wy,player.hp,player.mp];`),[300,300,120,60]);
});
test('Collected ground gold disappears and cannot pay twice',()=>{
  const g=ready();eq(g.run(`spawnLoot(player.wx,player.wy,12);updateGame(.01);interactWithNearby();updateGame(.01);return [player.gold,groundLoot.length];`),[42,0]);
});
test('Save round-trip preserves progression, equipment, quest, loot and enemy timer',()=>{
  const g=ready();assert(g.run(`openWindow('inventory');menuIndex=2;executeMenuSelection();closeAllWindows();player.wx=280;player.wy=380;handleQuestAction();handleEnemyDeath(enemies[0]);player.hp=95;player.mp=23;
    const before=saveSnapshot();applySave(JSON.parse(JSON.stringify(before)));const after=saveSnapshot();return JSON.stringify(before)===JSON.stringify(after) && equippedWeapon===inventory[2];`));
});
test('Expired shield never writes an invalid negative timer',()=>{
  const g=ready();assert(g.run(`player.shieldActive=true;player.shieldTimer=.01;updateGame(.1);const data=saveSnapshot();applySave(data);return !player.shieldActive && player.shieldTimer===0;`));
});
test('Malformed or unknown imported items leave the current game intact',()=>{
  const g=ready();assert(g.run(`const before=JSON.stringify(saveSnapshot());const bad=saveSnapshot();bad.inventory[0]='<img src=x onerror=alert(1)>';try{applySave(bad);}catch(_){}return before===JSON.stringify(saveSnapshot());`));
});
test('Unavailable storage and corrupt saved JSON do not prevent playing',()=>{
  const g=ready({deniedStorage:true});g.run(`updateGame(.1);castSpell(2);drawScene();`);assert(g.run(`return saveGame()===false;`));
  const h=fresh({saved:'{"broken":'});assert(h.run(`return player.level===1 && activeWindow==='help';`));
});
test('Browser reload restores saved game and avoids repeating onboarding',()=>{
  const g=ready();g.run(`player.gold=125;saveGame();`);const h=fresh({saved:[...g.storage.values()][0]});assert(h.run(`return player.gold===125 && activeWindow===null;`));
});
test('Reset clears all progress and opens the starting help',()=>{
  const g=ready();eq(g.run(`player.gold=999;bossDefeated=true;talents[0].points=3;newGame();return [player.gold,bossDefeated,talents[0].points,activeWindow];`),[30,false,0,'help']);
});
test('Every existing menu renders and offers clickable selections where applicable',()=>{
  const g=ready();g.run(`for(const win of ['inventory','talents','spells','shop','trainer','quest','map','help'])openWindow(win);closeAllWindows();`);
  assert(g.elements.get('shop-item-list').children.every(e=>typeof e.onclick==='function'));
});
test('End-to-end mission, reward, purchasing, training and boss victory',()=>{
  const g=ready();assert(g.run(`player.wx=280;player.wy=380;handleQuestAction();
    for(let i=0;i<5;i++){const e=enemies[i%4];e.hp=e.maxHp;e.respawnRemaining=0;e.returning=false;player.wx=e.wx-60;player.wy=e.wy;selectedTarget=e;
      for(let n=0;n<30&&e.hp>0;n++){player.cds[1]=0;castSpell(1);}interactWithNearby();}
    player.wx=280;player.wy=380;handleQuestAction();openWindow('shop');menuIndex=2;executeMenuSelection();
    openWindow('inventory');menuIndex=inventory.findIndex(i=>i.name==='Martillo del Juicio');executeMenuSelection();openWindow('trainer');menuIndex=1;executeMenuSelection();closeAllWindows();
    const boss=enemies[4];player.wx=boss.wx-60;player.wy=boss.wy;selectedTarget=boss;
    for(let n=0;n<30&&boss.hp>0;n++){player.cds[1]=0;castSpell(1);}saveGame();drawScene();
    return questState.rewardClaimed && player.level>=3 && equippedWeapon.name==='Martillo del Juicio' && player.spellLevels[2]===2 && bossDefeated && boss.hp===0;`));
});

 test('Analog touch movement respects direction and speed, and pauses clear it',()=>{
  const g=ready();const result=g.run(`player.wx=1900;player.wy=1900;touchInput.y=-.5;const start=worldToIso(player.wx,player.wy);for(let i=0;i<60;i++)updateGame(1/60);const end=worldToIso(player.wx,player.wy);const speed=player.currentSpeed;openWindow('appmenu');return [speed,end.y-start.y,end.x-start.x,touchInput.x,touchInput.y,touchInput.attack,isGamePaused()];`);
  assert(Math.abs(result[0]-150)<1 && result[1]<0 && Math.abs(result[2])<10);eq(result.slice(3),[0,0,false,true]);
 });
 test('Held touch sword obeys cooldown and stops on release without idle feedback spam',()=>{
  const g=ready();const result=g.run(`player.wx=700;player.wy=650;const e=enemies[0];e.hp=e.maxHp=1000;touchInput.attack=true;updateGame(.1);const first=e.hp;for(let i=0;i<4;i++)updateGame(.1);const during=e.hp;for(let i=0;i<2;i++)updateGame(.1);const after=e.hp;touchInput.attack=false;for(let i=0;i<10;i++)updateGame(.1);const released=e.hp;player.wx=1900;player.wy=1900;touchInput.attack=true;const count=floatingTexts.length;updateGame(.01);return [first,during,after,released,floatingTexts.length<=count];`);
  assert(result[0]===result[1] && result[2]<result[1] && result[3]===result[2] && result[4]);
 });

test('Mission-to-boss combat works with real cooldowns, mana, damage and respawns',()=>{
  const g=ready();const result=g.run(`
    openWindow('inventory');menuIndex=2;executeMenuSelection();closeAllWindows();
    player.wx=280;player.wy=380;handleQuestAction();closeAllWindows();
    let elapsed=0, deaths=0;
    function tick(dt){const before=player.hp;updateGame(dt);elapsed+=dt;if(player.hp>before&&player.wx===300&&player.wy===300)deaths++;}
    for(let kill=0;kill<5;kill++){
      const enemy=enemies[kill%4];
      if(enemy.hp<=0){player.wx=300;player.wy=300;for(let wait=0;wait<200&&enemy.hp<=0;wait++)tick(.05);}
      player.wx=enemy.wx-60;player.wy=enemy.wy;selectedTarget=enemy;touchInput.attack=true;
      for(let step=0;step<400&&enemy.hp>0;step++){if(player.hp<player.maxHp*.5)castSpell(3);tick(.05);}
      touchInput.attack=false;
      if(enemy.hp>0)throw Error('Combat stalled');
      player.wx=enemy.wx;player.wy=enemy.wy;tick(.05);
    }
    player.wx=280;player.wy=380;handleQuestAction();
    openWindow('shop');menuIndex=2;executeMenuSelection();openWindow('inventory');menuIndex=inventory.findIndex(i=>i.name==='Martillo del Juicio');executeMenuSelection();
    openWindow('trainer');menuIndex=1;executeMenuSelection();closeAllWindows();
    player.wx=300;player.wy=300;for(let rest=0;rest<400;rest++)tick(.05);
    const boss=enemies[4];player.wx=boss.wx-60;player.wy=boss.wy;selectedTarget=boss;castSpell(4);touchInput.attack=true;
    for(let step=0;step<800&&boss.hp>0;step++){if(player.hp<player.maxHp*.5)castSpell(3);tick(.05);}
    return {reward:questState.rewardClaimed,equipped:equippedWeapon.name,trained:player.spellLevels[2],won:bossDefeated,deaths,elapsed};
  `);
  assert(result.reward && result.equipped==='Martillo del Juicio' && result.trained===2 && result.won && result.deaths===0,JSON.stringify(result));
});
test('WASD can remain held while all five keyboard abilities cast',()=>{
  const g=ready();g.run(`player.wx=700;player.wy=650;player.hp=40;player.mp=player.maxMp=300;enemies[0].hp=enemies[0].maxHp=1000;`);
  g.emit('keydown',{code:'KeyW'});
  for(const code of ['Digit1','Digit2','Digit3','Digit4','Digit5'])g.emit('keydown',{code});
  assert(g.run(`return keys.KeyW && [1,2,3,4,5].every(n=>player.cds[n]>0) && player.hp>40 && player.shieldActive && activeProjectiles.length===1;`));
  g.run(`updateGame(.05);`);assert(g.run(`return player.isMoving && keys.KeyW;`));
});
test('Left-hand confirm and return work through onboarding, menus, equipment and map',()=>{
  const g=fresh();g.emit('keydown',{code:'KeyF'});assert(g.run(`return !isGamePaused();`));
  g.emit('keydown',{code:'KeyQ'});assert(g.run(`return activeWindow==='appmenu' && menuIndex===0;`));
  g.emit('keydown',{code:'KeyS'});assert(g.run(`return menuIndex===2;`));
  g.elements.get('menu-spells').onclick=()=>g.run(`openWindow('spells');`);
  g.emit('keydown',{code:'KeyF'});assert(g.run(`return activeWindow==='spells';`));g.emit('keydown',{code:'KeyF'});
  g.emit('keydown',{code:'KeyR'});g.emit('keydown',{code:'KeyD'});g.emit('keydown',{code:'KeyD'});g.emit('keydown',{code:'KeyF'});assert(g.run(`return equippedWeapon===inventory[2];`));
  g.emit('keydown',{code:'KeyQ'});assert(g.run(`return activeWindow==='appmenu';`));g.emit('keydown',{code:'KeyQ'});assert(g.run(`return !activeWindow;`));
  g.emit('keydown',{code:'KeyZ'});assert(g.run(`return activeWindow==='map';`));g.emit('keydown',{code:'KeyF'});assert(g.run(`return !activeWindow;`));
  g.emit('keydown',{code:'KeyV'});assert(g.run(`return manualPaused;`));g.emit('keydown',{code:'KeyV'});assert(g.run(`return !manualPaused;`));
});
test('Keyboard bindings stay fixed despite old preferences; browser modifier shortcuts remain',()=>{
 const g=ready({controls:'{"version":1,"bindings":{"moveUp":"KeyU"}}'});assert(g.run(`return KeyboardControls.bindings.moveUp==='KeyW';`));g.emit('keydown',{code:'KeyR',ctrlKey:true});g.emit('keydown',{code:'KeyW',metaKey:true});assert(g.run(`return !activeWindow && !keys.KeyW;`));assert(!html.includes('Personalizar teclas'));
});
test('Mage and ranger classes have unique weapons, abilities and saved progression',()=>{
 const mage=fresh();assert(mage.run(`return chooseHeroClass('mage') && inventory[2].name==='Bastón de Escarcha' && player.maxMp===100;`));mage.run(`closeAllWindows();player.mp=20;castSpell(3);`);assert(mage.run(`return player.mp===55 && player.cds[3]===6 && !chooseHeroClass('ranger');`));mage.run(`player.wx=700;player.wy=650;player.mp=100;castSpell(2);updateGame(.1);updateGame(.1);`);assert(mage.run(`return enemies[0].slowTimer>0;`));mage.run(`saveGame();`);const load=ready({saved:mage.storage.get('azeroth-chronicles-prototype-save-v2')});assert(load.run(`return player.heroClass==='mage'&&inventory[2].name==='Bastón de Escarcha';`));
 const ranger=fresh();assert(ranger.run(`return chooseHeroClass('ranger') && inventory[2].name==='Arco de Exploradora';`));ranger.run(`closeAllWindows();player.wx=700;player.wy=650;castSpell(2);castSpell(4);`);assert(ranger.run(`return activeProjectiles.length===2&&player.hasteTimer===6;`));ranger.run(`updateGame(6);`);assert(ranger.run(`return player.hasteTimer===0&&player.maxSpeed===320;`));
});
test('Sixth power validates targets and mana, pays once and pauses its long cooldown',()=>{
 const g=ready();g.run(`castSpell(6);`);assert(g.run(`return player.mp===60&&player.cds[6]===0;`));g.run(`player.wx=700;player.wy=650;castSpell(6);castSpell(6);`);assert(g.run(`return player.mp===10&&player.cds[6]===90;`));g.run(`openWindow('inventory');updateGame(5);`);assert(g.run(`return player.cds[6]===90;`));
});
test('Older RPG saves without classes or a sixth cooldown still restore',()=>{
 const g=ready();const raw=g.run(`const s=saveSnapshot();delete s.player.heroClass;delete s.player.classChosen;delete s.player.hasteTimer;delete s.player.cds[6];delete s.player.spellLevels[6];return JSON.stringify(s);`);const old=ready({saved:raw});assert(old.run(`return player.heroClass==='paladin'&&player.cds[6]===0&&player.spellLevels[6]===1;`));
});
console.log(`\n${passed} gameplay checks passed${process.exitCode ? '; failures remain' : ''}.`);
