'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
let retreats = 0;
for (const mode of ['normal', 'nightmare', 'developer'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const form of ['normal', 'true']) {
      const g = new C(mode, cls, () => 0.73),
        z = g.zone(),
        e = z.enemies.find((e) => e.family === 'thorn' && e.type === 'boss');
      e.form = form;
      z.enemies = [e];
      g.s.party = [];
      g.s.mercyTime = 0;
      Object.assign(g.hero, g.safe(e.x + 160, e.y));
      g.hero.maxHp = g.hero.hp = 10000;
      const enter = g.enter;
      g.enter = function (...args) {
        assert(this.s.statistics.deaths > 0, 'retreat cannot send a living hero to town');
        return enter.apply(this, args);
      };
      g.engage(e, true, false);
      for (let j = 0; j < 600; j++) {
        const h = g.hero,
          before = { x: h.x, y: h.y, deaths: g.s.statistics.deaths },
          d = Math.hypot(h.x - e.x, h.y - e.y),
          direction = d < 650 ? 1 : -1;
        g.tick(0.1, { x: (h.x - e.x) * direction, y: (h.y - e.y) * direction });
        assert.equal(g.s.statistics.deaths, 0, 'nonfatal retreat should never count as death');
        assert(
          Math.hypot(h.x - before.x, h.y - before.y) < 180,
          'no unexplained town-sized position jump',
        );
      }
      retreats++;
    }
for (const mode of ['normal', 'nightmare']) {
  const g = new C(mode, 'ranger', () => 0.73),
    e = g.zone().enemies.find((e) => e.family === 'thorn' && e.type === 'boss');
  Object.assign(g.hero, g.safe(e.x + 200, e.y));
  g.hero.hp = 10;
  g.s.mercyTime = 0;
  g.effects = [];
  g.notices = [];
  const deaths = g.s.statistics.deaths;
  assert(g.hitParty(g.hero, 1, 0, e.id, true));
  assert.equal(g.s.statistics.deaths, deaths, 'nonfatal incoming damage does not recover hero');
  assert(g.hitParty(g.hero, 99, 0, e.id, true));
  assert.equal(g.s.statistics.deaths, deaths + 1);
  const event = g.effects.find((e) => e.type === 'death');
  assert.equal(event.cause.hpBefore, 9);
  assert.equal(event.cause.source, e.id);
  assert(
    g.notices.some((n) => n.kind === 'warning' && n.text.startsWith('Defeated · Recovered')),
    'instant recovery is clearly identified as a defeat',
  );
}
{
  const g = new C('developer'),
    p = { x: g.hero.x, y: g.hero.y };
  g.hero.hp = 1;
  g.hitParty(g.hero, 9999, 0, null, true);
  assert.equal(g.s.statistics.deaths, 0);
  assert.deepEqual({ x: g.hero.x, y: g.hero.y }, p);
  assert(
    !g.notices.some((n) => n.text.startsWith('Defeated')),
    'developer immortality does not show a false death',
  );
}
console.log(
  'PASS ' +
    retreats +
    ' live Thornfang retreat pilots: no living return-to-town; fatal damage receipts and clear recovery notice; Developer immortality',
);
