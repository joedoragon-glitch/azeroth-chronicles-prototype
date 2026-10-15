'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
for (const cls of ['paladin','mage','ranger'])
  for (const succession of [false,true])
    for (const kind of ['board','canister','charge']) {
      const c = new C('normal',cls,()=>0.8,{succession});
      c.enter('citadel'); c.s.party=[]; c.s.mercyTime=0;
      const e=c.zone().enemies.find(u=>u.family==='citadel'&&u.type==='boss');
      c.zone().enemies=[e]; c.engage(e);
      Object.assign(c.hero,{hp:1,immune:0,slow:0}); c.hero.order=null; e.damage=1500;
      if(kind==='board'){
        e.board={x:e.home.x,y:e.home.y,size:112,beat:0,phase:'warn',timer:0.01};
        const tile=c.sentinelBoardCells(e).find(cell=>cell.selected);
        Object.assign(c.hero,{x:tile.x,y:tile.y}); c.sentinelUpdateBoard(e,0.05);
      }else if(kind==='canister'){
        Object.assign(c.hero,{x:e.x+43,y:e.y});
        e.telegraph=c.buildBossAttack(e,0,c.hero).first;
        c.resolveAttack(e); c.updateProjectiles(0.1);
      }else{
        Object.assign(c.hero,{x:e.x+48,y:e.y});
        e.telegraph=c.buildBossAttack(e,2,c.hero).first;
        c.resolveAttack(e); c.advanceMotion(e,0.1);
      }
      assert.equal(c.s.statistics.deaths,1,cls+'/'+succession+'/'+kind);
      assert.equal(c.s.projectiles.length,0,'no orphan pellets');
      assert.equal(c.s.hazards.length,0,'no orphan hazards');
      assert(!e.board,'death clears persistent board');
      assert(!c.hero.keeperHeld&&!c.hero.deathRollHeld);
    }
console.log('PASS 18 integrated Veyra fatal board/canister/charge boundaries');
