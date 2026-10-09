'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

const c = new C('normal','paladin',()=>0.9);
const status = () => c.actionFeedback?.text;
assert.equal(c.actionFeedback,null);
c.hero.gold=0;
assert.equal(c.spend(70),false);
assert.equal(status(),'Not enough crowns.');
assert.equal(c.rescue('thorn'),false);
assert.equal(status(),'Defeat Thornfang first.');
const captive = new C('normal','paladin',()=>0.9);
captive.enter('crypt');
const cage = captive.zone().npcs.find(n=>n.kind==='cage'&&n.family==='crypt');
assert(cage);
Object.assign(captive.hero,{x:cage.x,y:cage.y});
assert.equal(captive.interact(cage),false);
assert.equal(captive.actionFeedback.text,'Defeat Crypt Guardian first.');
const rest = c.zone().npcs.find(n=>n.kind==='rest');
assert(rest);
Object.assign(c.hero,{x:rest.x,y:rest.y});
const enemy=c.zone().enemies.find(e=>e.hp>0&&e.type==='mob');
Object.assign(enemy,{x:rest.x+60,y:rest.y+60,aggro:true});
assert.equal(c.rest(),false);
assert.equal(status(),'Too dangerous to rest.');
enemy.aggro=false;
assert(c.rest());
c.hero.gold=2000;
c.s.rescued.crypt=true;
let opened;
const menus=Menus.create({
  getGame:()=>c,
  Campaign:C,
  D:C.data,
  action:(label,action,detail='',disabled=false)=>({label,action,detail,disabled}),
  openMenu:(title,description,actions)=>(opened={title,description,actions}),
  closeMenu(){},
  recallSquad(){},
  showMap(){},
  finaleMenu(){},
});
const oldNotices=c.notices.length;
menus.smith({family:'crypt',name:'Borin'});
const weapon=opened.actions.find(a=>a.label.startsWith('Weapon tier 1'));
assert(weapon&&!weapon.disabled);
weapon.action();
assert.equal(status(),'Weapon equipped · Tier 1');
assert.equal(c.hero.weapon,1);
assert.notEqual(c.hero.legacyEquipped,true,'purchased tier is active without a legacy weapon');
const armor=opened.actions.find(a=>a.label.startsWith('Armor tier 1'));
assert(armor&&!armor.disabled);
armor.action();
assert.equal(status(),'Armor equipped · Tier 1');
assert.equal(c.hero.armorTier,1);
assert.equal(c.notices.length,oldNotices,'equipment change uses short feedback, not amber');
c.s.rescued.thorn=true;
c.learn(2,'thorn');
assert.equal(c.notices.length,oldNotices,'skill learning stays in teacher menu');
c.s.rescued.archive=true;
assert(c.purchasePreparationTonic());
assert(c.usePreparationTonic());
assert.equal(c.notices.length,oldNotices,'tonic stays off amber');
c.hero.xp=0;
c.xp(120*c.hero.level);
assert(c.notices.some(n=>n.text.includes('LEVEL')),'level-up stays on amber');
const dungeon = new C('normal', 'paladin', () => 0.9);
dungeon.enter('archive');
const scene = dungeon.zone();
scene.enemies.filter(e => e.guard).forEach(e => { e.hp = 0; });
const boss = scene.enemies.find(e => e.family === 'archive' && e.form === 'normal');
assert(boss);
boss.hp = 0;
dungeon.kill(boss);
assert(dungeon.notices.some(n => n.text.includes('Drowned Keeper') && n.text.includes('falls')));
assert(dungeon.notices.some(n => n.text.includes('The last guardian falls')));
const notices = dungeon.notices.length;
dungeon.checkClear();
assert.equal(dungeon.notices.length, notices, 'first-clear notice only once');

console.log('PASS actionable transient failures, equipped gear, and separate boss/dungeon milestones');
