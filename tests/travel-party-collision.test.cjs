'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const g = new C('normal', 'mage', () => 0.73);
g.zone().enemies = [];
g.zone().props = [];
g.zone().buildings = [];
Object.assign(g.hero, { x: 300, y: 300 });
const companion = g.unit('soldier', 330, 300);
g.s.party = [companion];
const step = () => {
  g.s.time += 0.1;
};
const acrossCompanion = { x: 360, y: 300 };
assert(g.clearSegment(g.hero, acrossCompanion));
assert(
  g.actorStepAllowed(g.hero, acrossCompanion),
  'Hero passes through a companion while traveling',
);
assert(
  g.actorStepAllowed(companion, { x: 270, y: 300 }),
  'Companion also passes through hero while traveling',
);
g.move(g.hero, acrossCompanion, 600, 0.1);
assert.equal(
  g.hero.x,
  360,
  'Actual movement reaches the intended point without a companion detour',
);
Object.assign(g.hero, { x: 300, y: 300 });
Object.assign(companion, { x: 310, y: 300 });
step();
g.separateActors(0.1);
assert.equal(companion.x, 310, 'Passive separation does not shove travel companions off the hero');
Object.assign(companion, { x: 330, y: 300 });
const enemy = g.makeEnemy(
  { species: 'goblin', name: 'Travel fixture', level: 1, hp: 100, damage: 0, gold: 0, xp: 0 },
  { x: 500, y: 300 },
);
g.zone().enemies = [enemy];
enemy.aggro = true;
step();
assert(
  !g.actorStepAllowed(g.hero, acrossCompanion),
  'Companion body blocking returns during combat',
);
assert(!g.actorStepAllowed(companion, { x: 270, y: 300 }), 'Combat blocking is symmetric');
Object.assign(companion, { x: 310, y: 300 });
step();
g.separateActors(0.1);
assert(companion.x > 310, 'Combat overlap separation remains active');
enemy.aggro = false;
Object.assign(companion, { x: 330, y: 300 });
step();
assert(g.actorStepAllowed(g.hero, acrossCompanion), 'Travel behavior returns once combat ends');
Object.assign(enemy, { x: 330, y: 300 });
step();
assert(!g.actorStepAllowed(g.hero, acrossCompanion), 'Idle hostile bodies still block movement');
enemy.aggro = true;
enemy.returning = true;
Object.assign(enemy, { x: 500, y: 300 });
step();
assert(
  g.actorStepAllowed(g.hero, acrossCompanion),
  'Retreating enemies do not keep the party in combat',
);
assert(!g.clearSegment(g.hero, { x: -100, y: -100 }), 'Travel still obeys terrain bounds');
console.log(
  'PASS travel hero/companion passage, actual movement, combat blocking/separation, combat exit, hostile blocking and terrain',
);
