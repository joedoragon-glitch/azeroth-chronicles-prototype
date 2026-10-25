'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const Input = require('../src/prototype/input.js');

function arena(language = 'en', cls = 'mage') {
  let now = 0;
  const h = shell(language, cls, { now: () => now });
  for (const b of h.elements.get('skills').children) h.elements.set(b.id, b);
  const { scope: s, elements: ui, events } = h,
    api = s.Prototype,
    g = api.game;
  completeFieldOpening(g);
  Object.assign(g.hero, { x: 500, y: 500, order: null, hp: 1000, maxHp: 1000 });
  g.hero.skills.fill(1);
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  const foe = g.makeEnemy(
    { species: 'goblin', name: 'Queue target', level: 1, hp: 100000, damage: 0, xp: 0, gold: 0 },
    { x: 580, y: 500 },
  );
  g.zone().enemies = [foe];
  g.damage(foe, 1, 'hero');
  g.updateEnemies = g.updateParty = g.updatePacks = g.updateElites = () => {};
  g.updateNight = () => {};
  const casts = [],
    cast = g.cast;
  g.cast = function (slot, target, charged, ...rest) {
    const ok = cast.call(this, slot, target, charged, ...rest);
    if (ok)
      casts.push({
        slot,
        charged: !!charged,
        time: now,
        normal: this.hero.cd[slot - 1],
        lock: this.hero.chargedCd[slot - 1],
      });
    return ok;
  };
  const step = (seconds) => {
    for (let left = seconds; left > 1e-7; left -= 0.025) {
      now += Math.min(left, 0.025) * 1000;
      h.frame(now);
    }
    api.updateHUD();
  };
  const pointer = (slot, method, id = 10) =>
    ui.get('skill-' + slot)[method]({
      pointerId: id,
      pointerType: 'touch',
      button: 0,
      preventDefault() {},
    });
  const press = (slot = 2, hold = 0.05, id = 10) => {
    pointer(slot, 'onpointerdown', id);
    step(hold);
    pointer(slot, 'onpointerup', id);
  };
  const queue = () =>
    Array.from(api.queuedChargePresentation(), (r) => `${r.slot}:${r.charged ? 'C' : 'N'}`);
  step(0.025);
  return { ...h, api, g, foe, ui, events, casts, step, press, pointer, queue };
}

for (const language of ['en', 'es']) {
  const h = arena(language),
    { g, step, press, queue, casts, ui } = h;
  g.hero.cd[1] = 3;
  g.hero.chargedCd[1] = 6;
  press(2, 0.3);
  press();
  assert.deepEqual(queue(), ['2:C', '2:N']);
  const label = ui.get('skill-2').getAttribute('aria-label');
  assert(label.includes(language === 'es' ? '1. CARGADA' : '1. CHARGED'));
  assert(label.includes('2. NORMAL'));
  assert.equal(ui.get('skill-2').dataset.queue, 'charged,normal');
  const ids = Array.from(h.api.queuedChargePresentation(), (r) => r.id);
  assert.equal(new Set(ids).size, 2, 'stable separate request identities');
  step(3.1);
  assert.equal(
    casts.filter((c) => c.slot === 2).length,
    0,
    'normal must not overtake blocked charged',
  );
  step(3.5);
  assert.deepEqual(
    casts.filter((c) => c.slot === 2).map((c) => c.charged),
    [true],
  );
  assert.deepEqual(queue(), ['2:N'], 'charged release consumes just its own request');
  step(3.1);
  const releases = casts.filter((c) => c.slot === 2);
  assert.deepEqual(
    releases.map((c) => c.charged),
    [true, false],
  );
  assert(releases[1].time - releases[0].time >= 3000 - 1);
  assert(releases[1].lock > 2 && releases[1].lock < 3.1, 'normal leaves ongoing charged recovery');
  assert.deepEqual(queue(), []);
}
{
  const h = arena();
  h.g.hero.chargedCd[1] = 5;
  h.press(2, 0.3);
  h.press();
  h.press(2, 0.3);
  h.press();
  assert.deepEqual(h.queue(), ['2:C', '2:N', '2:C', '2:N']);
  h.step(3);
  assert.deepEqual(h.queue(), ['2:C', '2:N', '2:C', '2:N']);
  // An unrelated ready skill keeps the existing independent dispatch.
  h.press(8);
  assert(h.casts.some((c) => c.slot === 8));
  h.step(17);
  assert.deepEqual(
    h.casts.filter((c) => c.slot === 2).map((c) => c.charged),
    [true, false, true, false],
  );
}
{
  const h = arena();
  h.g.hero.cd[1] = 20;
  h.g.hero.chargedCd[1] = 20;
  h.press();
  h.press();
  assert.deepEqual(h.queue(), ['2:N', '2:N'], 'identical presses remain separate');
  h.press(2, 0.225);
  assert.equal(h.queue().length, 2, 'ambiguous release cancels only new contact');
  h.pointer(2, 'onpointerdown', 45);
  h.step(0.3);
  h.pointer(2, 'onpointercancel', 45);
  assert.deepEqual(h.queue(), ['2:N', '2:N'], 'pointer cancel preserves older entries');
  for (let i = 0; i < 14; i++) h.press();
  assert.equal(h.queue().length, 16);
  h.press();
  assert.equal(h.queue().length, 16);
  assert(h.ui.get('status').textContent.includes('Queue full'), 'explicit capacity rejection');
  h.ui.get('menu-button').click();
  assert.equal(h.queue().length, 0, 'opening a menu visibly cancels transient requests');
}
{
  const h = arena('en', 'paladin');
  h.g.hero.chargedCd[2] = 5;
  h.press(3, 0.3);
  h.g.hero.shieldStance = 10;
  h.press(3);
  assert.equal(h.g.hero.shieldStance, 0, 'normal tap lowers stance immediately');
  assert.deepEqual(h.queue(), ['3:C'], 'lowering does not discard older Bash');
}
{
  const h = arena();
  h.g.hero.cd[1] = 2;
  h.g.hero.chargedCd[1] = 4;
  const key = (type) =>
    h.events[type].forEach((fn) => fn({ code: 'KeyK', repeat: false, preventDefault() {} }));
  key('keydown');
  h.step(0.3);
  key('keyup');
  key('keydown');
  h.step(0.05);
  key('keyup');
  assert.deepEqual(h.queue(), ['2:C', '2:N'], 'keyboard uses the same FIFO');
  h.events.blur.forEach((fn) => fn());
  assert.equal(h.queue().length, 0, 'focus loss clears input');
}
{
  const q = Input.createSkillQueue(),
    a = { slot: 2 },
    b = { slot: 2 },
    c = { slot: 8 };
  for (const r of [a, b, c]) assert(q.append(r));
  assert.deepEqual(q.heads(), [a, c]);
  q.remove(b);
  assert(q.contains(a));
  assert(q.contains(c));
}
{
  const h = arena();
  h.g.hero.cd[1] = 0.3;
  h.press();
  h.g.zone().enemies = [];
  h.step(0.4);
  assert.equal(h.queue().length, 0, 'impossible target is consumed instead of blocking forever');
  assert.equal(h.casts.filter((c) => c.slot !== 1).length, 0);
}
{
  const h = arena();
  h.g.hero.chargedCd[1] = 0.3;
  h.press(2, 0.3);
  h.press();
  h.step(0.1);
  assert(h.api.chargePresentation()?.state === 'charging');
  h.g.hitParty(h.g.hero, 100, 0, null, true);
  h.step(0.2);
  assert.deepEqual(h.queue(), [], 'interruption removes only charged; ready normal can release');
  assert.deepEqual(
    h.casts.filter((c) => c.slot === 2).map((c) => c.charged),
    [false],
  );
}
{
  const h = arena('es', 'ranger');
  h.g.hero.cd[2] = 0.3;
  h.press(3);
  h.g.hero.hp = h.g.hero.maxHp;
  h.step(0.4);
  assert.equal(h.queue().length, 0, 'no-heal request fails once and leaves no stuck head');
  assert.equal(h.casts.filter((c) => c.slot !== 1).length, 0);
}
{
  const h = arena();
  h.g.hero.cd[1] = 10;
  h.press();
  h.g.enter('march');
  h.step(0.05);
  assert.equal(h.queue().length, 0, 'zone transfer invalidates transient input');
}
console.log(
  'PASS Area 3 bilingual live-shell FIFO, cooldown sequencing, input boundaries, independent slots, capacity, cancellation and stance',
);
