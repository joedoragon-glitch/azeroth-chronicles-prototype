'use strict';
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
assert.equal(collapse.sequence.length, 2, 'three separate damage warnings, not one simultaneous volley');
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
assert(!builder.snapshot().zones.mine.props.some((p) => p.garunTemporary));
assert.equal(builder.zone().enemies.filter((e) => e.guard).length, 18);
assert.equal(builder.traps().length, 18);
console.log('PASS Progressive Collapse sequential warnings, visible previews and capped solid supports');

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
