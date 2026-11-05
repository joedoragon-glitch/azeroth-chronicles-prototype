'use strict';
const assert=require('node:assert/strict'),Campaign=require('../src/prototype/engine'),{completeFieldOpening}=require('./helpers/field-opening.cjs');
// Original sight-radius assertions apply after the native first hero-involved kill,
// and the river sight fixture must straddle today's projected Greenwood banks,
// when ordinary Greenwood enemies are permitted to initiate combat.
const setup=(ex,ey,hx,hy)=>{const c=new Campaign();c.s.mercyTime=0;c.enter('vale');c.zone().props=[];c.zone().enemies=[];c.s.party=[];Object.assign(c.hero,{x:hx,y:hy});completeFieldOpening(c);const e=c.makeEnemy({species:'goblin',name:'Sentry',level:1,hp:100,damage:5,gold:1,xp:1},{x:ex,y:ey});c.zone().enemies.push(e);return {c,e};};
let {c,e}=setup(850,900,600,900);assert(c.line(e,c.hero));c.updateEnemies(.016);assert(e.aggro,'visible enemy at 250 units spots the hero');
({c,e}=setup(900,900,600,900));assert.equal(c.enemyAcquisitionRange(e),286,'approved ordinary-melee awareness is 260 × 1.1');c.updateEnemies(.016);assert(!e.aggro,'enemy outside the current 286-unit awareness band stays idle');
const [riverWest,riverEast]=Campaign.rules.barriers[0].bounds;
({c,e}=setup(riverEast+70,1200,riverWest-70,1200));assert(!c.line(e,c.hero),'river blocks sight');c.updateEnemies(.016);assert(!e.aggro,'enemy cannot see through terrain');
({c,e}=setup(540,350,330,350));c.updateEnemies(.016);assert(!e.aggro,'town protection remains active');
console.log('PASS increased sight radius preserves terrain sight and town protection');
