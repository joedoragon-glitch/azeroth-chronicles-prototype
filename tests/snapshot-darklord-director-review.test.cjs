'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/combat-visuals.js');
const boss = Campaign.data.bosses.find((b) => b.id === 'darklord');

function encounter(mode, heroClass, form = 'normal') {
  const c = new Campaign(mode, heroClass, () => 0.9);
  assert(c.enter('crown'));
  const lord = c.bossEnemy(boss, form, { x: 1100, y: 1100 });
  c.zone().enemies = [lord];
  Object.assign(c.hero, { x: 1200, y: 1100, maxHp: 100000, hp: 100000 });
  c.line = () => true;
  c.tacticalRogueLeashAllows = () => true;
  return { c, lord };
}

function renderCast(a) {
  const calls = [];
  const ctx = new Proxy({
    canvas: { width: 1200, height: 720 },
    getTransform: () => ({ a: 1 }),
    measureText: (s) => ({ width: String(s).length * 7 }),
  }, {
    get: (obj, key) => key in obj ? obj[key] : (...args) => calls.push({ key, args }),
    set: (obj, key, value) => { obj[key] = value; return true; },
  });
  const e = { family: 'darklord', type: 'boss', hp: 100, x: 600, y: 450, telegraph: a };
  const zone = { enemies: [e], props: [] };
  Visuals.ground(ctx, (p) => p, {
    zone: () => zone, traps: () => [], attackPatches: () => [],
    hero: { x: 900, y: 900, hp: 100 }, activeLivingParty: () => [],
    s: { time: 0, hazards: [], projectiles: [] },
  }, 'cue', 0);
  return calls;
}

for (const mode of ['normal', 'nightmare'])
  for (const heroClass of Object.keys(Campaign.classes)) {
    const { c, lord } = encounter(mode, heroClass);
    const kit = c.buildBossAttack(lord, 0, c.hero);
    const casts = [kit.first, ...kit.sequence];
    assert.deepEqual(casts.map((x) => x.timer), [1.1, 0.5, 0.8]);
    assert(casts.every((x) => x.anonymousCast));
    for (const a of casts) {
      const calls = renderCast(a);
      assert(calls.some((x) => x.key === 'fillText' && x.args[0] === 'Preparing…'));
      assert(!calls.some((x) => x.key === 'lineTo'),
        'anonymous cast cannot show a spatial danger footprint');
    }
    const finisher = c.buildBossAttack(lord, 4, c.hero).first;
    assert(finisher.anonymousCast);
    assert.equal(finisher.timer, 1.5);
    assert(renderCast(finisher).some((x) =>
      x.key === 'fillText' && x.args[0] === 'Preparing…'));
    const visible = c.buildBossAttack(lord, 1, c.hero).first;
    assert(!visible.anonymousCast, 'other boss attack warnings remain visible');

    const muster = c.buildBossAttack(lord, 2, c.hero).first;
    lord.telegraph = muster;
    c.resolveAttack(lord);
    const guards = c.bossOwnedSummons(lord);
    assert.equal(guards.length, 4, 'four Normal guards, never global summon-cap changes');
    assert(guards.every((g) => g.royalFormationUntil === c.s.time + 6));
    assert.equal(c.bossSummonCap(lord), 4);
    assert(Campaign.restore(c.snapshot()), 'no v4 save incompatibility');

    const trueBoss = encounter(mode, heroClass, 'true');
    assert.equal(trueBoss.c.bossSummonCap(trueBoss.lord), 6,
      'the existing TRUE summon cap remains six');
  }

// Use actual boss targeting and damage functions; party-size fixtures provide
// nearby living combat actors without spawning or changing real saved parties.
for (const partySize of [1, 2, 3, 4]) {
  const { c, lord } = encounter('normal', 'ranger');
  const allies = Array.from({ length: partySize - 1 }, (_, i) => ({
    id: 'test-party-' + i, hp: 100, x: 1190, y: 1110 + i * 5,
  }));
  c.activeLivingParty = () => allies;
  lord.telegraph = c.buildBossAttack(lord, 5, c.hero).first;
  c.resolveAttack(lord);
  const tax = lord.royalTaxation;
  assert.equal(tax.marked.length, partySize);
  assert.equal(tax.expires - c.s.time, 10);
  assert(!tax.marked.some((id) => id === 'escort'));

  // For four attackers, each must contribute; with fewer, everyone must
  // contribute and the levy still demands four total damaging hits.
  const sources = ['hero', ...allies.map((u) => u.id)];
  const firstFour = [
    ...sources,
    ...Array.from({ length: 4 - sources.length }, () => 'hero'),
  ];
  for (let i = 0; i < firstFour.length; i++) {
    assert(c.damage(lord, 40, firstFour[i]));
    if (i < 3) assert(!lord.royalTaxShield);
  }
  assert.equal(lord.royalTaxShield, lord.maxHp * 0.12);
  assert.equal(lord.royalTaxation, null);
  const shield = lord.royalTaxShield;
  const hp = lord.hp;
  c.damage(lord, 80, 'hero');
  assert.equal(lord.hp, hp, 'new shield absorbs later damage');
  assert.equal(lord.royalTaxShield, shield - 80);
}

// Four strikes from the same member must not satisfy a multi-member levy.
const duo = encounter('normal', 'paladin');
duo.c.activeLivingParty = () => [{ id: 'partner', hp: 100, x: 1190, y: 1110 }];
duo.lord.telegraph = duo.c.buildBossAttack(duo.lord, 5, duo.c.hero).first;
duo.c.resolveAttack(duo.lord);
for (let i = 0; i < 4; i++) duo.c.damage(duo.lord, 30, 'hero');
assert(!duo.lord.royalTaxShield, 'partner must contribute to the four hits');
duo.c.damage(duo.lord, 30, 'partner');
assert.equal(duo.lord.royalTaxShield, duo.lord.maxHp * 0.12);

// No late triggers; no reward from attacks entirely absorbed by an older
// active Royal shield.
const expired = encounter('normal', 'mage');
expired.lord.telegraph = expired.c.buildBossAttack(expired.lord, 5, expired.c.hero).first;
expired.c.resolveAttack(expired.lord);
expired.c.s.time = expired.lord.royalTaxation.expires + 0.01;
for (let i = 0; i < 4; i++) expired.c.damage(expired.lord, 30, 'hero');
assert(!expired.lord.royalTaxShield);
const blocked = encounter('normal', 'mage');
blocked.lord.royalTaxShield = 500;
blocked.lord.telegraph = blocked.c.buildBossAttack(blocked.lord, 5, blocked.c.hero).first;
blocked.c.resolveAttack(blocked.lord);
for (let i = 0; i < 4; i++) blocked.c.damage(blocked.lord, 30, 'hero');
assert.equal(blocked.lord.royalTaxation.hits, 0, 'shielded hits are not damaging');
assert.equal(blocked.lord.royalTaxShield, 380);

console.log('PASS anonymous cast bar and four/six Muster, six-second guard DR, ten-second four-source/solo 12% Royal Taxation, expiration and v4 saves');
