const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
const code = fs.readFileSync(require('path').join(__dirname, '../src/controls.js'), 'utf8') + '\n' + fs.readFileSync(require('path').join(__dirname, '../src/classes.js'), 'utf8')+'\n'+fs.readFileSync(require('path').join(__dirname, '../src/world.js'), 'utf8')+'\n'+fs.readFileSync(require('path').join(__dirname, '../src/game.js'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

function fresh({ deniedStorage = false, saved = null, controls = null, withSquad = false } = {}) {
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
      setAttribute(name,value){this.attributes[name]=value;},getContext(){return ctx;},addEventListener(){},click(){if(this.onclick)this.onclick();}
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
  vm.createContext(sandbox);vm.runInContext(code+(withSquad?'\n'+fs.readFileSync(require('path').join(__dirname,'../src/squad.js'),'utf8'):''),sandbox,{timeout:2000});
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
  const g=ready();eq(g.run(`selectedTarget=enemies[0];castSpell(1);castSpell(2);castSpell(3);castSpell(5);castSpell(99);return [player.mp,...Object.values(player.cds),activeProjectiles.length];`),[60,0,0,0,0,0,0,0,0,0]);
});
test('Fireball retargets a nearby enemy instead of a stale distant target',()=>{
  const g=ready();assert(g.run(`player.wx=700;player.wy=650;selectedTarget=enemies[4];castSpell(2);return activeProjectiles[0].targetEnemy===enemies[0] && player.mp===45;`));
});
test('Full-resource potions are conserved and equipment purchase is not duplicated',()=>{
  const g=ready();eq(g.run(`openWindow('inventory');menuIndex=0;executeMenuSelection();menuIndex=1;executeMenuSelection();const count=inventory.length;
    openWindow('shop');player.gold=200;menuIndex=2;executeMenuSelection();executeMenuSelection();return [count,inventory.length,player.gold];`),[3,4,120]);
});
test('Trainer adds 25 percent of base power per rank and caps upgrades',()=>{
  const g=ready();eq(g.run(`activeTrainer='front-trainer';openWindow('trainer');menuIndex=1;player.gold=1000;executeMenuSelection();const scale=spellScale(2);player.spellLevels[2]=5;const gold=player.gold;executeMenuSelection();return [scale,player.spellLevels[2],player.gold===gold];`),[1.25,5,true]);
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
test('Browser reload preserves the save when selecting RPG mode',()=>{
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
  g.emit('keydown',{code:'Escape'});assert(g.run(`return activeWindow==='appmenu' && menuIndex===0;`));
  g.emit('keydown',{code:'KeyS'});assert(g.run(`return menuIndex===2;`));
  g.elements.get('menu-spells').onclick=()=>g.run(`openWindow('spells');`);
  g.emit('keydown',{code:'KeyF'});assert(g.run(`return activeWindow==='spells';`));g.emit('keydown',{code:'KeyF'});
  g.emit('keydown',{code:'KeyR'});g.emit('keydown',{code:'KeyD'});g.emit('keydown',{code:'KeyD'});g.emit('keydown',{code:'KeyF'});assert(g.run(`return equippedWeapon===inventory[2];`));
  g.emit('keydown',{code:'Escape'});assert(g.run(`return activeWindow==='appmenu';`));g.emit('keydown',{code:'Escape'});assert(g.run(`return !activeWindow;`));
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
test('Seventh power validates targets and mana, pays once and pauses its long cooldown',()=>{
 const g=ready();g.run(`castSpell(7);`);assert(g.run(`return player.mp===60&&player.cds[7]===0;`));g.run(`player.wx=700;player.wy=650;castSpell(7);castSpell(7);`);assert(g.run(`return player.mp===0&&player.cds[7]===90;`));g.run(`openWindow('inventory');updateGame(5);`);assert(g.run(`return player.cds[7]===90;`));
});
test('The sixth ability button and Space use the frequent power',()=>{const g=ready();g.run(`player.wx=700;player.wy=650;`);g.emit('keydown',{code:'Space'});assert(g.run(`return player.cds[6]===4&&player.mp===50;`));});
test('Older RPG saves without classes or a sixth cooldown still restore',()=>{
 const g=ready();const raw=g.run(`const s=saveSnapshot();delete s.player.heroClass;delete s.player.classChosen;delete s.player.hasteTimer;delete s.player.cds[6];delete s.player.spellLevels[6];return JSON.stringify(s);`);const old=ready({saved:raw});assert(old.run(`return player.heroClass==='paladin'&&player.cds[6]===0&&player.spellLevels[6]===1;`));
});

test('One adventure starts directly, uses Escape for menus, and leaves Q free',()=>{
 const g=ready();g.emit('keydown',{code:'KeyQ'});assert(g.run(`return activeWindow===null&&KeyboardControls.actionFor('KeyQ')===null;`));g.emit('keydown',{code:'Escape'});assert(g.run(`return activeWindow==='appmenu';`));
});
test('Every power is usable without a mouse; frequent and rare powers retain separate cooldowns',()=>{
 const g=ready();g.run(`player.wx=700;player.wy=650;enemies.filter(inRegion).forEach(e=>e.hp=e.maxHp=2000);player.mp=player.maxMp=200;`);
 for(const code of ['Space','ShiftLeft','KeyB'])g.emit('keydown',{code});eq(g.run(`return [player.cds[6],player.cds[7],player.cds[8],player.mp];`),[4,90,120,70]);g.run(`updateGame(4);`);assert(g.run(`return player.cds[6]===0&&player.cds[7]===86&&player.cds[8]===116;`));
});
test('Dungeon entry, bounds, enemies and exit are isolated from the overworld',()=>{
 const g=ready();g.run(`player.wx=1050;player.wy=550;interactWithNearby();`);assert(g.run(`return activeRegion==='crypt'&&enemies.filter(inRegion).length===4&&!isInTown();`));
 g.run(`selectedTarget=enemies[0];player.wx=700;player.wy=650;window.dungeonBefore=enemies[0].hp;castSpell(2);updateGame(.1);`);assert(g.run(`return enemies[0].hp===window.dungeonBefore&&activeProjectiles.every(p=>p.targetEnemy.region==='crypt');`));
 g.run(`player.wx=1900;player.wy=1900;updateGame(.01);`);assert(g.run(`return player.wx<=1140&&player.wy<=1140;`));
 g.run(`player.wx=160;player.wy=240;interactWithNearby();`);assert(g.run(`return activeRegion==='world'&&player.wx===960&&player.wy===550;`));
});
test('Dungeon completion rewards once, persists defeated enemies, and never marks the Dark Lord defeated',()=>{
 const g=ready();g.run(`changeRegion('mine');const foes=enemies.filter(inRegion);foes.forEach(e=>damageEnemy(e,e.maxHp,'red'));window.dungeonGold=player.gold;updateEnemies(100);foes.forEach(e=>handleEnemyDeath(e));`);
 assert(g.run(`return dungeonCleared.mine&&player.gold===window.dungeonGold&&!bossDefeated&&enemies.filter(inRegion).every(e=>e.hp===0);`));g.run(`saveGame();`);
 const loaded=ready({saved:g.storage.get('azeroth-chronicles-prototype-save-v2')});assert(loaded.run(`return activeRegion==='mine'&&dungeonCleared.mine&&enemies.filter(inRegion).every(e=>e.hp===0);`));loaded.run(`changeRegion('world');changeRegion('mine');`);assert(loaded.run(`return enemies.filter(inRegion).every(e=>e.hp===0);`));
});
test('Dungeon deaths return to town and retain progress; old five-enemy saves migrate',()=>{
 const g=ready();g.run(`changeRegion('abyss');damageEnemy(enemies.filter(inRegion)[0],99999,'red');player.hp=1;receiveDamage(100);`);assert(g.run(`return activeRegion==='world'&&isInTown()&&enemies.find(e=>e.id===120).hp===0;`));
 const raw=g.run(`const s=saveSnapshot();delete s.activeRegion;delete s.dungeonCleared;delete s.powersVersion;s.enemies=s.enemies.filter(e=>e.id<=5);s.player.cds[6]=90;delete s.player.cds[7];delete s.player.cds[8];return JSON.stringify(s);`);
 const old=ready({saved:raw});assert(old.run(`return activeRegion==='world'&&enemies.length===25&&player.cds[6]===0&&player.cds[7]===0;`));
});
test('Invalid dungeon imports are rejected before changing the current save',()=>{
 const g=ready();assert(g.run(`const old=JSON.stringify(saveSnapshot());const bad=saveSnapshot();bad.activeRegion='unknown';let failed=false;try{applySave(bad);}catch(e){failed=true;}return failed&&JSON.stringify(saveSnapshot())===old;`));
});

test('Teachers stop at their rank limits and advanced merchants gate endgame equipment',()=>{
 const g=ready();eq(g.run(`player.gold=10000;activeTrainer='trainer';openWindow('trainer');menuIndex=0;executeMenuSelection();const gold=player.gold;executeMenuSelection();return [player.spellLevels[1],player.gold===gold];`),[2,true]);
 assert(g.run(`return document.getElementById('trainer-limit').textContent.includes('Frontera');`));
 g.run(`activeTrainer='front-trainer';openWindow('trainer');menuIndex=0;for(let i=0;i<5;i++)executeMenuSelection();`);assert(g.run(`return player.spellLevels[1]===5;`));
 g.run(`activeTrainer='summit-trainer';openWindow('trainer');menuIndex=0;for(let i=0;i<5;i++)executeMenuSelection();`);assert(g.run(`return player.spellLevels[1]===8;`));
 eq(g.run(`activeMerchant='summit-merchant';openWindow('shop');menuIndex=4;const gold=player.gold;executeMenuSelection();const gated=player.gold===gold;player.level=12;executeMenuSelection();return [gated,inventory.some(i=>i.name==='Arma de las Cumbres')];`),[true,true]);
});
test('Dungeon traps give a warning, cannot one-shot healthy heroes, hit once per pulse, and pause',()=>{
 const g=ready();g.run(`changeRegion('citadel');enemies.filter(inRegion).forEach(e=>e.aggro=false);const t=dungeonTraps.find(inRegion);player.wx=t.wx;player.wy=t.wy;dungeonClock=t.cycle-1.8-t.offset;`);
 assert(g.run(`const t=dungeonTraps.find(inRegion),p=trapPhase(t);return p.phase>=t.cycle-2&&p.phase<t.cycle-.6;`));
 const hp=g.run(`updateDungeonTraps(1.3);return player.hp;`);assert(hp>0&&hp>=120*.88&&hp<120);eq(g.run(`updateDungeonTraps(.1);return player.hp;`),hp);
 g.run(`openWindow('inventory');`);assert(g.run(`const time=dungeonClock;updateGame(4);return dungeonClock===time;`));
 g.run(`closeAllWindows();player.wx=160;player.wy=240;`);const safe=g.run(`const hp=player.hp;updateDungeonTraps(8);return player.hp===hp;`);assert(safe);
});
test('Endgame boss armor opens after a dodgeable warning; fountain and expedition pay once',()=>{
 const g=ready();g.run(`changeRegion('citadel');player.wx=1000;player.wy=960;const boss=enemies.filter(inRegion).find(e=>e.type==='boss');window.endBoss=boss;const hp=boss.hp;damageEnemy(boss,100,'red');window.wardDamage=hp-boss.hp;boss.smashCd=0;updateEnemies(.01);player.wx=750;player.wy=960;updateEnemies(1.6);`);
 assert(g.run(`return window.wardDamage===45&&window.endBoss.vulnerable===2.8&&player.hp===player.maxHp;`));assert(g.run(`const b=window.endBoss,hp=b.hp;damageEnemy(b,100,'red');return hp-b.hp===100;`));
 g.run(`enemies.filter(inRegion).filter(e=>e.type!=='boss').forEach(e=>damageEnemy(e,e.hp*3,'red'));player.wx=650;player.wy=700;player.hp=10;interactWithNearby();`);
 assert(g.run(`return dungeonFountains.citadel&&player.hp>10;`));eq(g.run(`player.hp=10;interactWithNearby();return player.hp;`),10);
 g.run(`changeRegion('world');player.wx=2180;player.wy=980;interactWithNearby();handleExpeditionAction();dungeonCleared.crypt=dungeonCleared.mine=true;handleExpeditionAction();window.rewardGold=player.gold;handleExpeditionAction();`);
 assert(g.run(`return expeditionState.front.rewarded&&player.gold===window.rewardGold;`));
});
for(const heroClass of ['paladin','mage','ranger'])test('Prepared level-15 '+heroClass+' can complete endgame with real cooldowns and dodging',()=>{
 const g=fresh();g.run(`chooseHeroClass('${heroClass}');closeAllWindows();
    while(player.level<15)addXp(player.nextXp-player.xp);
    for(let n=0;n<5;n++){talents[0].points++;talents[0].apply();talents[2].points++;talents[2].apply();}
    for(let n=0;n<4;n++){talents[1].points++;talents[1].apply();}player.talentPoints=0;
    activeMerchant='summit-merchant';player.gold=12000;openWindow('shop');menuIndex=4;executeMenuSelection();openWindow('inventory');menuIndex=inventory.findIndex(i=>i.name==='Arma de las Cumbres');executeMenuSelection();
    activeTrainer='summit-trainer';openWindow('trainer');for(menuIndex=0;menuIndex<spellUpgrades.length;menuIndex++){const i=menuIndex;for(let rank=1;rank<8;rank++){menuIndex=i;executeMenuSelection();}}
    for(let i=0;i<6;i++){inventory.push({...shopCatalog.find(i=>i.id===6)});inventory.push({...shopCatalog.find(i=>i.id===7)});}
    closeAllWindows();changeRegion('citadel');
 `);
 const result=g.run(`
    let elapsed=0,death=false;const foes=enemies.filter(inRegion);
    function steer(dx,dy){let a=Math.atan2(dy,dx);const obstacle=sceneryProps.filter(inRegion).find(p=>Math.hypot(player.wx-p.wx,player.wy-p.wy)<85&&Math.cos(a)*(p.wx-player.wx)+Math.sin(a)*(p.wy-player.wy)>0);if(obstacle){a+=1.2;dx=Math.cos(a);dy=Math.sin(a);}const x=(dx-dy)*Math.cos(Math.PI/6),y=(dx+dy)*.3,m=Math.hypot(x,y);touchInput.x=m?x/m:0;touchInput.y=m?y/m:0;}
    for(const foe of foes){
        selectedTarget=foe;
        for(let step=0;step<6000&&foe.hp>0&&activeRegion==='citadel';step++){
            const dist=Math.hypot(player.wx-foe.wx,player.wy-foe.wy),desired=player.heroClass==='paladin'?85:350;
            const trap=dungeonTraps.filter(inRegion).find(t=>trapPhase(t).phase>=t.cycle-2&&Math.hypot(player.wx-t.wx,player.wy-t.wy)<t.radius+40);
            if(foe.telegraph&&Math.hypot(player.wx-foe.telegraph.wx,player.wy-foe.telegraph.wy)<foe.telegraph.radius+50){steer(player.wx-foe.telegraph.wx||1,player.wy-foe.telegraph.wy);}
            else if(trap)steer(player.wx-trap.wx||1,player.wy-trap.wy);
            else if(dist>desired+20)steer(foe.wx-player.wx,foe.wy-player.wy);
            else if(dist<desired-20&&player.heroClass!=='paladin')steer(player.wx-foe.wx,player.wy-foe.wy);
            else {touchInput.x=touchInput.y=0;}
            castSpell(1);castSpell(6);
            if(player.heroClass==='mage'?player.mp<player.maxMp-40:player.hp<player.maxHp*.6)castSpell(3);
            if(['paladin','mage'].includes(player.heroClass)&&foe.telegraph&&foe.telegraph.remaining<.8)castSpell(4);
            if(player.hp<player.maxHp*.35){const i=inventory.findIndex(i=>i.name==='Tónico de las Cumbres');if(i>=0){openWindow('inventory');menuIndex=i;executeMenuSelection();closeAllWindows();selectedTarget=foe;}}
            if(player.mp<20){const i=inventory.findIndex(i=>i.name==='Éter de las Cumbres');if(i>=0){openWindow('inventory');menuIndex=i;executeMenuSelection();closeAllWindows();selectedTarget=foe;}}
            if(foe.type!=='boss'||foe.vulnerable>0){castSpell(2);castSpell(5);if(foe.type==='boss'){castSpell(7);if(player.hp<player.maxHp*.7)castSpell(8);}}
            updateGame(.05);elapsed+=.05;if(activeRegion!=='citadel'){death=true;break;}
        }
        if(foe.hp>0)break;
        if(foe.type!=='boss'&&foes.filter(e=>e.type!=='boss').every(e=>e.hp===0)){
            touchInput.x=touchInput.y=0;player.wx=650;player.wy=700;interactWithNearby();
        }
    }
    return {elapsed,death,won:!!dungeonCleared.citadel,hp:player.hp,bossHp:foes[3].hp,mp:player.mp,position:[player.wx,player.wy],foes:foes.map(e=>({hp:e.hp,x:e.wx,y:e.wy,returning:e.returning})),sp:player.spellPower,ranks:player.spellLevels};
 `);
 assert(result.won&&!result.death&&result.elapsed>25,JSON.stringify(result));console.log('  ENDGAME '+heroClass+': '+JSON.stringify(result));
});

test('Hero and units share one world, one save, cursor orders and dungeon transitions',()=>{
 const g=ready({withSquad:true});assert(g.run(`return Squad.units.length===2&&Squad.units[0].type==='soldier'&&Squad.units[1].type==='worker';`));
 g.emit('keydown',{code:'Tab'});assert(g.run(`return Squad.active;`));
 const pos=g.run(`return [player.wx,player.wy];`);g.emit('keydown',{code:'KeyD'});g.run(`updateGame(.1);`);eq(g.run(`return [player.wx,player.wy];`),JSON.parse(JSON.stringify(pos)));g.emit('keyup',{code:'KeyD'});
 assert(g.run(`const p=Squad.screen(Squad.units[0]);Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.pick();return Squad.selected[0]===Squad.units[0].id;`));
 g.run(`const p=Squad.screen({wx:700,wy:400});Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.order();for(let n=0;n<100;n++)updateGame(.05);`);
 assert(g.run(`return Squad.units[0].order?.type==='hold'&&Math.hypot(Squad.units[0].order.wx-700,Squad.units[0].order.wy-400)<100;`),JSON.stringify(g.run(`return Squad.units[0];`)));
 g.run(`changeRegion('crypt');`);assert(g.run(`return Squad.units.every(u=>u.region==='crypt'&&u.wx<1200)&&activeRegion==='crypt';`));g.run(`saveGame();`);
 const loaded=ready({withSquad:true,saved:g.storage.get('azeroth-chronicles-prototype-save-v2')});assert(loaded.run(`return activeRegion==='crypt'&&Squad.units.length===2&&!Squad.active;`));
});
test('Workers gather and deposit finite gold, build barracks and recruit only within the cap',()=>{
 const g=ready({withSquad:true});g.run(`Squad.toggle(true);const w=Squad.units[1];let p=Squad.screen(w);Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.pick();p=Squad.screen(Squad.nodes[0]);Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.order();for(let n=0;n<500;n++)updateGame(.05);`);
 assert(g.run(`return player.gold>30&&Squad.nodes[0].amount<300;`));
 g.run(`player.gold=1000;const p=Squad.screen({wx:600,wy:50});Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.build();for(let n=0;n<300;n++)updateGame(.05);`);
 assert(g.run(`return Squad.buildings.length===1&&Squad.buildings[0].progress===4;`),JSON.stringify(g.run(`return {buildings:Squad.buildings,units:Squad.units,point:Squad.point(),selected:Squad.selected};`)));
 g.run(`const p=Squad.screen(Squad.buildings[0]);Squad.cursor.x=p.x;Squad.cursor.y=p.y;Squad.train();for(let n=0;n<100;n++)updateGame(.05);`);assert(g.run(`return Squad.units.length===3;`));
 g.run(`player.gold=10000;for(let n=0;n<10;n++)Squad.hire('soldier');`);assert(g.run(`return Squad.units.filter(u=>u.hp>0).length===6;`));
 g.run(`Squad.units[0].hp=0;Squad.hire('soldier');window.goldBeforeRevive=player.gold;Squad.revive();`);assert(g.run(`return Squad.units.filter(u=>u.hp>0).length===6&&player.gold===window.goldBeforeRevive;`));
});
test('Companions fight actual enemies, take boss/trap damage and preserve old RPG progress',()=>{
 const g=ready({withSquad:true});g.run(`player.wx=700;player.wy=650;Squad.region();const enemy=enemies[0],hp=enemy.hp;for(let n=0;n<60;n++)updateGame(.05);window.companionDamage=enemy.hp<hp;`);assert(g.run(`return window.companionDamage;`));
 g.run(`player.wx=300;player.wy=300;const s=Squad.units[0],e=enemies[0];s.wx=e.wx+20;s.wy=e.wy;e.aggro=false;e.attackCd=0;window.hpBefore=s.hp;updateGame(.05);`);assert(g.run(`return Squad.units[0].hp<window.hpBefore;`),'enemies must fight ordered units while the hero stays in town');
 g.run(`changeRegion('citadel');const u=Squad.units[0];u.wx=550;u.wy=550;const t=dungeonTraps.find(inRegion);Squad.traps(t,0);window.trapHP=u.hp;Squad.traps(t,0);`);assert(g.run(`return Squad.units[0].hp===window.trapHP&&Squad.units[0].hp>0;`));
 g.run(`Squad.area(Squad.units[0],100,10000);`);assert(g.run(`return Squad.units[0].hp===0;`));
 const raw=g.run(`const s=saveSnapshot();delete s.squad;return JSON.stringify(s);`);const old=ready({withSquad:true,saved:raw});assert(old.run(`return activeRegion==='citadel'&&Squad.units.length===2&&player.level===1;`));
});
console.log(`\n${passed} gameplay checks passed${process.exitCode ? '; failures remain' : ''}.`);
