'use strict';
const nightContext = require('./helpers/specialist-night-context.cjs');
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const fresh = () => {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  assert(game.enter('mine'));
  const boss = game.zone().enemies.find((e) => e.type === 'boss' && e.family === 'mine');
  assert(boss && boss.hp > 0);
  return { game, boss };
};

const { game: builder, boss: mason } = fresh();
const collapse = builder.buildBossAttack(mason, 1, { x: 910, y: 1100 });
assert.equal(collapse.first.kind, 'circle');
assert.equal(collapse.first.count, 1);
assert.equal(collapse.first.warning, 1.7);
assert.equal(
  collapse.sequence.length,
  2,
  'three separate damage warnings, not one simultaneous volley',
);
assert(collapse.sequence.every((stage) => stage.kind === 'circle' && stage.count === 1));
assert(collapse.sequence[0].x !== collapse.sequence[1].x);
assert(builder.startAttack(mason, { x: 910, y: 1100 }, 1));
const previews = builder.zone().props.filter((p) => p.garunPreview);
assert(previews.length >= 1 && previews.length <= 2, 'safe construction sites are previewed');
assert(previews.every((p) => p.decorative && p.r === 0));
assert(!builder.snapshot().zones.mine.props.some((p) => p.garunPreview));
let impacts = 0;
while (mason.telegraph && impacts < 5) {
  const plan = mason.telegraph;
  assert.equal(plan.index, 1);
  builder.resolveAttack(mason);
  impacts++;
  mason.telegraph = mason.sequence.shift() || null;
}
assert.equal(impacts, 3);
assert.equal(builder.zone().props.filter((p) => p.garunPreview).length, 0);
const supports = builder.zone().props.filter((p) => p.garunTemporary);
assert(supports.length >= 1 && supports.length <= 2);
assert(supports.every((p) => p.r === 24 && builder.blocked(p.x, p.y, 'mine', 12)));
assert(
  supports.every((p) => previews.some((mark) => mark.x === p.x && mark.y === p.y)),
  'finished supports occupy the marked sites rather than an unannounced replacement',
);
assert(!builder.snapshot().zones.mine.props.some((p) => p.garunTemporary));
assert.equal(builder.zone().enemies.filter((e) => e.guard).length, 18);
assert.equal(builder.traps().length, 18);
console.log(
  'PASS Progressive Collapse sequential warnings, visible previews and capped solid supports',
);

// Occupying a reserved construction site between warning and impact must cancel
// that support, not create a new solid wall somewhere never previewed.
const { game: contestedGame, boss: contestedBoss } = fresh();
assert(contestedGame.startAttack(contestedBoss, { x: 910, y: 1100 }, 1));
const reserved = contestedGame.zone().props
  .filter((p) => p.garunPreview)
  .map((p) => ({ x: p.x, y: p.y }));
assert(reserved.length);
Object.assign(contestedGame.hero, reserved[0]);
while (contestedBoss.telegraph) {
  contestedGame.resolveAttack(contestedBoss);
  contestedBoss.telegraph = contestedBoss.sequence.shift() || null;
}
const finished = contestedGame.zone().props.filter((p) => p.garunTemporary);
assert(
  finished.every((p) => reserved.some((mark) => mark.x === p.x && mark.y === p.y)),
  'a rejected site must not be replaced at a different unmarked location',
);
assert(!finished.some((p) => p.x === reserved[0].x && p.y === reserved[0].y));
assert(!contestedGame.blocked(contestedGame.hero.x, contestedGame.hero.y, 'mine', 12));
assert.equal(contestedGame.zone().props.filter((p) => p.garunPreview).length, 0);
console.log('PASS occupied support sites cancel safely without creating surprise barriers');

const { game: waveGame, boss: waveBoss } = fresh();
const compaction = waveGame.buildBossAttack(waveBoss, 2, { x: waveBoss.x, y: waveBoss.y });
assert.equal(compaction.first.kind, 'ring');
assert.equal(compaction.first.warning, 1.6);
assert.equal(compaction.sequence.length, 1);
assert.equal(compaction.sequence[0].timer, 0.7);
assert.equal(compaction.first.slowDuration, 1.5);
waveBoss.telegraph = compaction.first;
waveGame.resolveAttack(waveBoss);
waveBoss.telegraph = compaction.sequence[0];
waveGame.resolveAttack(waveBoss);
const rings = waveGame.s.hazards.filter((h) => h.family === 'mine' && h.kind === 'ring');
assert.equal(rings.length, 2);
assert(rings.every((h) => h.slowDuration === 1.5 && h.damage === waveBoss.damage));
console.log('PASS Dynamic Compaction launches two full-damage slowing waves');

const { game: slabGame, boss: engineer } = fresh();
let position;
for (let y = 930; y <= 1250 && !position; y += 40)
  for (let x = 900; x <= 1270 && !position; x += 40) {
    const a = { x, y };
    const finish = { x: x + 100, y };
    if (
      !slabGame.blocked(x, y, 'mine', 12) &&
      !slabGame.blocked(finish.x, finish.y, 'mine', 12) &&
      slabGame.clearSegment(a, finish, 12) &&
      slabGame.line(engineer, a) &&
      Math.hypot(x - engineer.x, y - engineer.y) < 350
    )
      position = a;
  }
assert(position, 'Mine provides a safe lateral displacement lane');
Object.assign(slabGame.hero, position);
slabGame.hero.immune = 0;
const beforeHp = slabGame.hero.hp,
  beforeX = slabGame.hero.x;
assert.equal(Campaign.rules.tacticalFoundation.rogueMoves.bosses.mine.warning, 1.3);
slabGame.tacticalResolveRogueMove(engineer, {
  rogueMove: true,
  rogueSignature: false,
  kind: 'line',
  style: 'slab',
  targetId: 'hero',
  fromX: position.x - 60,
  fromY: position.y,
  x: position.x + 100,
  y: position.y,
  radius: 105,
  coefficient: 0.6,
});
assert(slabGame.hero.hp < beforeHp, 'lateral slab deals real damage');
assert(slabGame.hero.x > beforeX + 70, 'slab displaces sideways, not radially from the boss');
console.log('PASS Lateral Load Transfer damages and physically pushes across a warned lane');

// The warning belongs to the physical lane, not exclusively its initial mark:
// a dodging hero cannot nullify a hit on a companion still standing in it.
const { game: laneGame, boss: laneBoss } = fresh();
laneGame.zone().enemies = [laneBoss];
Object.assign(laneGame.hero, position);
const soldier = laneGame.unit('soldier', position.x, position.y);
laneGame.s.party = [soldier];
laneGame.hero.immune = 0;
soldier.immune = 0;
const soldierBefore = { hp: soldier.hp, x: soldier.x };
const heroBefore = laneGame.hero.hp;
laneGame.hero.y += 200;
laneGame.tacticalResolveRogueMove(laneBoss, {
  rogueMove: true,
  rogueSignature: false,
  kind: 'line',
  style: 'slab',
  targetId: 'hero',
  fromX: position.x - 60,
  fromY: position.y,
  x: position.x + 100,
  y: position.y,
  radius: 105,
  coefficient: 0.6,
});
assert.equal(laneGame.hero.hp, heroBefore, 'hero who leaves the marked lane is unharmed');
assert(soldier.hp < soldierBefore.hp, 'remaining companion is still hit by the slab');
assert(soldier.x > soldierBefore.x + 70, 'surviving companion is pushed by the slab');
console.log('PASS lateral slab keeps its real multi-target geometry after target dodge');

// Abandoning the fight clears all transient engineering geometry immediately.
const { game: resetGame, boss: resetBoss } = fresh();
assert(resetGame.startAttack(resetBoss, { x: 910, y: 1100 }, 1));
assert(resetGame.zone().props.some((p) => p.garunPreview));
resetGame.disengage(resetBoss, 0.1);
assert(!resetGame.zone().props.some((p) => p.garunPreview || p.garunTemporary));
console.log('PASS Garun encounter reset removes pending construction warnings');

for (const form of ['normal', 'true']) {
  const { game, boss } = fresh();
  boss.form = form;
  boss.motion = {
    target: { x: boss.x, y: boss.y },
    charge: true,
    hit: [],
    life: 0.1,
    coefficient: 1.4,
    recovery: 3,
    opening: 3,
  };
  game.advanceMotion(boss, 0.1);
  assert.equal(boss.motion, null);
  assert.equal(boss.open, 3, 'charge terminates with unconditional three-second opening');
}
assert.equal(Campaign.rules.attacks.mine[0].opening, 2.5);
assert.equal(Campaign.rules.attacks.mine[0].coefficient, 1.4);
assert.equal(Campaign.rules.tacticalFoundation.rogueSignatures.bosses.mine.coefficient, 0.1);
assert.equal(Campaign.rules.tacticalFoundation.rogueSignatures.bosses.mine.push, 95);
assert.equal(Campaign.rules.attacks.mine[4].species, 'ogre');
assert.equal(Campaign.rules.bossSummoning.normalCap, 3);
assert.equal(Campaign.rules.bossSummoning.trueCap, 6);
console.log('PASS core exposure, defensive sweep and Ogre summons retain locked contracts');

let cases = 0;
for (const cls of ['paladin','mage','ranger']) for (const mode of nightContext.contexts) for (const succession of [false,true]) {
 const c = nightContext.campaign(mode,cls,()=>0.9); c.enter('mine'); c.s.party=[]; c.s.challenge.succession=succession;
 const e=c.zone().enemies.find(e=>e.type==='boss'&&e.family==='mine'); c.zone().enemies=[e];
 assert(c.startAttack(e,{x:910,y:1100},1)); const previews=c.zone().props.filter(p=>p.garunPreview); assert(previews.length);
 const raw=JSON.parse(JSON.stringify(c.s)); assert(Campaign.restore(raw).zone().props.every(p=>!p.garunTemporary&&!p.garunPreview));
 const last=e.sequence.at(-1); e.sequence=[]; e.telegraph=last; Object.assign(c.hero,c.safe(last.x,last.y)); c.hero.immune=0; c.hero.hp=1;
 const before=c.s.statistics.deaths; c.resolveAttack(e); assert.equal(c.s.statistics.deaths,before+1);
 assert(c.zone().props.every(p=>!p.garunTemporary&&!p.garunPreview),'fatal Collapse cannot construct after recovery');
 assert(!e.telegraph); assert.equal(e.sequence.length,0); cases++;
}
console.log('PASS '+cases+' Garun real fatal Collapse, immediate geometry cleanup and raw restore boundaries');
