'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const dragon = C.data.bosses.find((b) => b.id === 'abyss');
assert.deepEqual(dragon.attacks.map((s) => s.split(':')[0]),
  ['Compressor Surge', 'Wake Vortex', 'Lazy Eight', 'Scramble Order']);
assert.equal(C.rules.bossRecovery.abyss.name, 'Go-Around');
assert.equal(C.rules.tacticalFoundation.rogueMoves.bosses.abyss.name, 'Abyss Dragon’s High Yo-Yo');
assert.equal(C.rules.tacticalFoundation.rogueSignatures.bosses.abyss.name, 'Abyss Dragon’s Wingover');

for (const mode of ['normal', 'nightmare']) for (const form of ['normal', 'true']) {
  const c = new C(mode, 'paladin', () => 0.9);
  c.enter('abyss');
  c.s.party = [];
  const boss = c.bossEnemy(c.boss('abyss'), form, { x: 1150, y: 1120 });
  c.zone().enemies = [boss];
  Object.assign(c.hero, { x: 980, y: 1040, immune: 100, hp: c.hero.maxHp });
  assert.equal(c.bossSummonCap(boss), form === 'true' ? 6 : 3);
  assert.equal(c.startAttack(boss, c.hero, 2), true);
  assert.equal(boss.telegraph.name, 'Lazy Eight');
  assert(boss.telegraph.flightPath?.length >= 1);
  const first = { x: boss.x, y: boss.y };
  c.resolveAttack(boss);
  assert(boss.motion && boss.motion.flightPath);
  boss.telegraph = null;
  for (let n = 0; n < 380 && boss.motion; n++) {
    c.advanceMotion(boss, 0.02);
    assert(!c.blocked(boss.x, boss.y, 'abyss', 15), 'flight remains on valid arena floor');
  }
  assert.equal(boss.motion, null, 'first landing terminates');
  assert(Math.hypot(first.x - boss.x, first.y - boss.y) > 0, 'boss physically moves');
  assert(boss.telegraph && boss.telegraph.name === 'Lazy Eight',
    'second landing retains its separate warning');

  // The real rogue AI requires sight; place the test hero in an unobstructed lane.
  Object.assign(c.hero, { x: boss.x, y: boss.y });
  assert(c.line(boss, c.hero));
  const strike = { rogueMove: true, rogueSignature: false, style: 'dash',
    targetId: 'hero', x: c.hero.x, y: c.hero.y, radius: 105,
    coefficient: 0.25, recovery: 0.8 };
  boss.telegraph = null;
  c.tacticalResolveRogueMove(boss, strike);
  assert.equal(boss.motion?.aerial, 'high-yo-yo');
  for (let n = 0; n < 300 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'High Yo-Yo finishes');

  const wing = { rogueMove: true, rogueSignature: true, effect: 'scatter',
    kind: 'circle', targetId: 'hero', x: boss.x, y: boss.y, angle: 0,
    radius: 205, coefficient: 0.09, push: 110, sidestep: 90, recovery: 1.05 };
  c.tacticalResolveRogueMove(boss, wing);
  assert.equal(boss.motion?.aerial, 'wingover');
  for (let n = 0; n < 300 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'Wingover finishes');

  boss.hp = boss.maxHp * 0.3;
  boss.telegraph = null;
  boss.healCd = 0;
  assert(c.startBossRecovery(boss));
  assert.equal(boss.telegraph.name, 'Go-Around');
  const beforeHeal = boss.hp;
  c.resolveAttack(boss);
  boss.telegraph = null;
  assert.equal(boss.motion?.aerial, 'go-around');
  for (let n = 0; n < 160 && boss.motion; n++) c.advanceMotion(boss, 0.02);
  assert.equal(boss.motion, null, 'Go-Around terminates');
  assert(boss.hp > beforeHeal && boss.hp <= boss.maxHp,
    'withdrawal completes before bounded recovery');
  // A blocked retreat is not a completed maneuver and cannot heal for free.
  const retryHp = boss.maxHp * 0.3;
  boss.hp = retryHp;
  boss.healCd = 0;
  const originalSegment = c.clearSegment.bind(c);
  c.clearSegment = () => false;
  assert.equal(c.startBossRecovery(boss), false,
    'AI must not initiate a recovery without any navigable retreat');
  assert.equal(boss.healCd, 0, 'rejected recovery does not consume cooldown');
  c.clearSegment = originalSegment;
  assert(c.startBossRecovery(boss), 'recovery becomes available once retreat is clear');
  c.resolveAttack(boss);
  assert.equal(boss.motion?.aerial, 'go-around');
  const originalMove = c.move.bind(c);
  c.move = () => false;
  c.advanceMotion(boss, 0.02);
  c.move = originalMove;
  assert.equal(boss.motion, null, 'blocked withdrawal terminates safely');
  assert.equal(boss.hp, retryHp, 'blocked or unfinished Go-Around never grants healing');

  console.log('PASS ' + mode + '/' + form + ' aviation paths, warnings, capped summons and recovery');
}

// Source attribution and same-object revival must survive the new aerial approach.
let fatalCases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare'])
    for (const succession of [false, true]) for (const form of ['normal','true']) {
      const c = new C(mode, cls, () => 0.9, { succession });
      c.enter('abyss'); c.s.party = [];
      const e = c.bossEnemy(c.boss('abyss'), form, { x: 1150, y: 1120 });
      c.zone().enemies = [e]; Object.assign(c.hero, {x:e.x, y:e.y, hp:1, immune:0});
      const move = {rogueMove:true,rogueSignature:false,style:'dash',targetId:'hero',x:e.x,y:e.y,radius:105,coefficient:0.25,recovery:0.8};
      const deaths = c.s.statistics.deaths;
      c.tacticalResolveRogueMove(e, move);
      for(let i=0;i<350 && e.motion;i++) c.advanceMotion(e,0.02);
      assert.equal(c.s.statistics.deaths,deaths+1,'real aerial strike must cause one death');
      assert(!e.motion && !e.telegraph,'fatal approach is canceled immediately');
      assert.equal(c.hero.slow,0,'old flight may not slow the revived same hero');
      assert.equal(c.s.projectiles.length,0);assert.equal(c.s.hazards.length,0);
      fatalCases++;
    }
console.log('PASS '+fatalCases+' actual High Yo-Yo fatal class/mode/Succession boundaries');

// Controlled high-health observation pilots use the unforced live scheduler.
// Party pressure chooses Wingover; a separate advantaged solo encounter chooses
// High Yo-Yo. These are boss-AI pilots, not full campaign/playability acceptance.
let pilots = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare'])
    for (const form of ['normal', 'true']) {
      const combined = new Set();
      for (const opposition of ['party', 'solo']) {
        const c = new C(mode, cls, () => 0.53);
        c.enter('abyss'); c.s.mercyTime = 0;
        const e = c.bossEnemy(c.boss('abyss'), form, {x:1150,y:1120});
        e.maxHp = 1e6; e.hp = 4e5; c.zone().enemies = [e];
        c.hero.level = e.level + (opposition === 'solo' ? 3 : 0);
        c.hero.hp = c.hero.maxHp = 1e6; c.hero.immune = 1e6;
        c.s.party = opposition === 'party' ? [c.unit('soldier',1140,1110),c.unit('archer',1130,1100)] : [];
        for(const u of c.s.party)u.immune=1e6;
        c.engage(e,true,false); let seed=12345;
        c.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
        for(let i=0;i<1800;i++) {
          // Clearing owned support through its real death path creates the
          // authored depleted-support condition without changing rogue rules.
          for(const u of [...c.zone().enemies]) if(u.summon&&u.owner===e.id){u.hp=0;c.kill(u);}
          if(i%10===0){c.hero.immune=1e6;for(const u of c.s.party)u.immune=1e6;c.damage(e,5,'hero');}
          c.tick(.1);
          if(e.telegraph?.name)combined.add(e.telegraph.name);
          if(e.motion?.aerial)combined.add(e.motion.aerial);
          Object.assign(c.hero,c.safe(e.x+85,e.y));
        }
        pilots++;
      }
      for(const name of ['Compressor Surge','Wake Vortex','Lazy Eight','Scramble Order','high-yo-yo','wingover','go-around'])
        assert(combined.has(name),cls+'/'+mode+'/'+form+' natural scheduler uses '+name);
    }
console.log('PASS '+pilots+' actual unforced solo/party aviation scheduler pilots across classes/modes/forms');
