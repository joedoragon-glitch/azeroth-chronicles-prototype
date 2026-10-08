'use strict';
// Run with an untouched checkout: node scripts/compare-housekeeping.cjs ../baseline
// Native Canvas is a verification-only dependency, never a shipped game dependency.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const crypto = require('node:crypto');
const baseline = path.resolve(process.argv[2] || '');
assert(process.argv[2], 'Supply the untouched baseline checkout');
const current = path.resolve(__dirname, '..');
const load = (root, name) => require(path.join(root, 'src/prototype', name + '.js'));
const A = load(baseline, 'engine'),
  B = load(current, 'engine');
const json = (x) => JSON.parse(JSON.stringify(x));
const hash = (x) =>
  crypto
    .createHash('sha256')
    .update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x))
    .digest('hex');
const evidence = {
  baseline: 'fd66875f5cbb68a291398652797aa0a31b68ed6f',
  scenarios: [],
  scenes: [],
};
const rng = () => {
  let x = 912345;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
};
const live = (c) => json({ ...c, random: undefined, snapshot: c.snapshot() });
let comparisons = 0;
function pair(mode, cls, succession) {
  const a = new A(mode, cls, rng(), { succession }),
    b = new B(mode, cls, rng(), { succession });
  const tag = [mode, cls, succession ? 'succession' : 'standard'].join('/');
  const checkpoints = [];
  const step = (name, fn) => {
    const ar = fn(a),
      br = fn(b);
    assert.deepEqual(br, ar, tag + ' result ' + name);
    assert.deepEqual(live(b), live(a), tag + ' live/transient state ' + name);
    checkpoints.push({ name, digest: hash(live(b)) });
    comparisons++;
    return br;
  };
  step('fresh', () => true);
  step('movement-autoattack', (c) => {
    c.enter('crypt');
    c.zone().props = [];
    c.zone().enemies = [];
    c.s.mercyTime = 0;
    Object.assign(c.hero, { x: 500, y: 500, skills: Array(8).fill(1), mp: 1000, maxMp: 1000 });
    c.s.party.forEach((u) => Object.assign(u, { x: 480, y: 500 }));
    const e = c.makeEnemy(
      { species: 'goblin', name: 'Fixture target', level: 1, hp: 10000, damage: 8, gold: 1, xp: 1 },
      { x: 570, y: 500 },
    );
    c.zone().enemies = [e];
    for (let i = 0; i < 20; i++) {
      c.tick(0.05, { x: 1, y: 0 });
      c.cast(1);
    }
    assert(c.s.statistics.events.length > 0 && e.hp < e.maxHp);
    return c.s.statistics.events.length;
  });
  for (const charged of [false, true])
    for (const slot of [1, 2, 3]) {
      step((charged ? 'charged' : 'ordinary') + '-' + slot, (c) => {
        c.hero.cd.fill(0);
        c.hero.mp = 1000;
        c.hero.hp = c.hero.maxHp / 2;
        c.s.party.forEach((u) => (u.hp = u.maxHp / 2));
        Object.assign(c.hero, { x: 500, y: 500 });
        Object.assign(c.zone().enemies[0], { x: 570, y: 500 });
        assert(c.cast(slot, c.zone().enemies[0].id, charged));
        for (let i = 0; i < 8; i++) c.tick(0.05, { x: 0, y: 0 });
        return c.effects;
      });
    }
  step('manual-ranger-health-and-mana', (c) => {
    c.zone().enemies = [];
    c.hero.hp = c.hero.maxHp / 2;
    c.hero.mp = 0;
    c.hero.supportEffects = [];
    c.s.party.forEach((u) => {
      u.supportEffects = [];
      u.healCd = 0;
      u.manaCd = 0;
    });
    assert(c.rangerSupport('health'));
    assert(c.rangerSupport('mana'));
    c.updateRangerSupport(1);
    return c.hero.supportEffects;
  });
  step('automatic-ranger-companion-heal', (c) => {
    c.hero.hp = c.hero.maxHp;
    c.hero.mp = c.hero.maxMp;
    c.hero.supportEffects = [];
    c.s.party.forEach((u) => {
      u.supportEffects = [];
      u.hp = u.maxHp / 4;
      u.healCd = 0;
    });
    c.autoRangerSupport();
    assert(c.s.party.some((u) => u.supportEffects.length));
    c.updateRangerSupport(1);
    return c.s.party.map((u) => u.hp);
  });
  step('party-recall-reserve-and-fallen', (c) => {
    c.s.party[0].order = { type: 'gather', id: 'fixture' };
    c.recallParty();
    assert(c.restCompanion(c.s.party[0].id));
    c.s.party[1].hp = 0;
    c.hero.gold = 1000;
    assert(c.recover());
    return c.activeParty().length;
  });
  step('progression-rescue-and-ceilings', (c) => {
    c.enter('vale');
    c.hero.gold = 100000;
    assert.equal(c.learn(2, 'thorn'), false);
    c.s.keys.thorn = true;
    assert(c.rescue('thorn'));
    c.hero.skills[1] = 0;
    assert(c.learn(2, 'thorn'));
    assert.equal(c.learn(3, 'thorn'), false);
    assert(c.trainExpedition('thorn'));
    assert.equal(c.trainExpedition('thorn'), false);
    c.xp(700);
    c.hero.talentPoints = 4;
    for (let i = 0; i < 4; i++) assert(c.talent(i));
    assert(c.freeResetTalents());
    assert(c.trainExpeditionSupport('sharedTraining', 'thorn'));
    c.s.keys.crypt = true;
    assert(c.rescue('crypt'));
    assert(c.gear('crypt', 'weapon'));
    assert(c.trainExpeditionSupport('sharedStrength', 'crypt'));
    return { level: c.hero.level, gold: c.hero.gold, stats: c.power() };
  });
  step('enemy-attack-and-pressure', (c) => {
    c.enter('crypt');
    c.s.party = [];
    c.zone().props = [];
    c.s.mercyTime = 0;
    Object.assign(c.hero, { x: 500, y: 500, hp: c.hero.maxHp, immune: 0 });
    const e = c.makeEnemy(
      {
        species: 'goblin',
        name: 'Fixture attacker',
        level: 1,
        hp: 1000,
        damage: 8,
        gold: 0,
        xp: 0,
      },
      { x: 560, y: 500 },
    );
    c.zone().enemies = [e];
    c.engage(e);
    c.startAttack(e, c.hero);
    for (let i = 0; i < 35; i++) c.tick(0.05, { x: 0, y: 0 });
    return { hp: c.hero.hp, effects: c.effects };
  });
  step('save-restore', (c) => {
    const restored = c.constructor.restore(c.snapshot(), rng());
    return live(restored);
  });
  step('death-and-successor', (c) => {
    c.hero.gold = 103;
    c.hero.hp = 0;
    c.die();
    assert.equal(c.hero.gold, 82);
    if (succession) assert(c.successor(cls === 'paladin' ? 'mage' : 'paladin'));
    return c.snapshot();
  });
  evidence.scenarios.push({ tag, checkpoints });
}
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const succession of [false, true]) pair(mode, cls, succession);
for (const cls of ['paladin', 'mage', 'ranger']) {
  const old = {
    version: 2,
    player: {
      heroClass: cls,
      level: 5,
      gold: 245,
      maxHp: 150,
      hp: 98,
      maxMp: 100,
      mp: 25,
      spellPower: 30,
      armor: 8,
      maxSpeed: 320,
      xp: 20,
      spellLevels: { 1: 2, 2: 1 },
      wx: 100,
    },
    talents: [1, 1, 1, 1],
    inventory: ['Espada de Cruzado'],
    equipped: 0,
    dungeonCleared: { crypt: true },
    squad: { units: [{ type: 'worker', hp: 20, maxHp: 80, carry: 4 }], buildings: [], nodes: [] },
  };
  assert.deepEqual(
    live(B.migrate(old, rng())),
    live(A.migrate(old, rng())),
    'legacy migration ' + cls,
  );
  comparisons++;
}
assert.deepEqual(load(current, 'data'), load(baseline, 'data'), 'parsed content');
const newRules = { ...B.rules };
delete newRules.balance;
assert.deepEqual(newRules, A.rules, 'existing rule values, ordering and formulas');
for (const key of ['classes', 'talentProfiles', 'talentMaxRanks', 'mercyStartRadius'])
  assert.deepEqual(B[key], A[key], key);
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => 16000 },
  configurable: true,
});
const { createCanvas } = require(process.env.CANVAS_MODULE || '@napi-rs/canvas');
for (const zone of [...A.data.regions.map((r) => r.id), ...A.dungeonIds])
  for (const [width, height] of [
    [1280, 800],
    [375, 812],
  ]) {
    const draw = (root) => {
      const C = load(root, 'engine'),
        c = new C('normal', 'paladin', rng());
      c.enter(zone);
      c.s.clock = 430;
      Object.assign(c.hero, c.safe(800, 800));
      const canvas = createCanvas(width, height),
        ctx = canvas.getContext('2d');
      const renderer = load(root, 'renderer').create({
        getGame: () => c,
        canvas: { width, height },
        ctx,
        platform: { cameraAnchor: () => ({ x: width * 0.6, y: height * 0.5 }) },
        Campaign: C,
        PrototypeVisuals: load(root, 'visuals'),
        PrototypeCombatVisuals: load(root, 'combat-visuals'),
        now: () => 16000,
        chargePresentation: () => null,
        isPaused: () => false,
      });
      renderer.draw();
      return {
        pixels: Buffer.from(ctx.getImageData(0, 0, width, height).data),
        png: canvas.toBuffer('image/png'),
      };
    };
    const a = draw(baseline),
      b = draw(current);
    assert(a.pixels.equals(b.pixels), zone + ' native Canvas pixels ' + width);
    evidence.scenes.push({ zone, width, height, pixelsSHA256: hash(b.pixels) });
    if (zone === 'vale') {
      fs.mkdirSync(path.join(current, 'test-results'), { recursive: true });
      fs.writeFileSync(
        path.join(current, 'test-results', 'housekeeping-scene-' + width + '.png'),
        b.png,
      );
    }
  }
evidence.liveComparisons = comparisons;
fs.mkdirSync(path.join(current, 'test-results'), { recursive: true });
fs.writeFileSync(
  path.join(current, 'test-results/housekeeping-equivalence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(
  'PASS ' +
    comparisons +
    ' live/transient/snapshot comparisons, parsed content/configuration and ' +
    evidence.scenes.length +
    ' pixel-identical native Canvas scenes',
);
