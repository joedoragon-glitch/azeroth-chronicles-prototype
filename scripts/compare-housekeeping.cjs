'use strict';
// Run with an untouched checkout: node scripts/compare-housekeeping.cjs ../baseline
// Add --exact-methods for extraction-only passes that preserve every method body.
// Native Canvas is a verification-only dependency, never a shipped game dependency.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
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
  baseline: cp
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: baseline, encoding: 'utf8' })
    .trim(),
  scenarios: [],
  scenes: [],
};
const babel = require('prettier/plugins/babel'),
  vm = require('node:vm');
// Method ownership may change; parameters, bodies and property descriptors may not.
const semanticTree = (node) => {
  if (Array.isArray(node)) return node.map(semanticTree);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(
        ([key]) =>
          ![
            'start',
            'end',
            'loc',
            'range',
            'extra',
            'leadingComments',
            'trailingComments',
            'innerComments',
            'comments',
            'tokens',
          ].includes(key),
      )
      .map(([key, value]) => [key, semanticTree(value)]),
  );
};
evidence.publicApi = [];
for (const [owner, before, after] of [
  ['instance', A.prototype, B.prototype],
  ['static', A, B],
]) {
  for (const name of Object.getOwnPropertyNames(before)) {
    if (name === 'constructor') continue;
    const old = Object.getOwnPropertyDescriptor(before, name);
    if (![old.value, old.get, old.set].some((fn) => typeof fn === 'function')) continue;
    const next = Object.getOwnPropertyDescriptor(after, name);
    assert(next, owner + '.' + name + ' retained');
    for (const key of ['enumerable', 'configurable', 'writable'])
      assert.equal(next[key], old[key], owner + '.' + name + ' descriptor ' + key);
    for (const key of ['value', 'get', 'set'])
      if (typeof old[key] === 'function') {
        assert.equal(typeof next[key], 'function', owner + '.' + name + ' ' + key);
        assert.equal(next[key].length, old[key].length, owner + '.' + name + ' argument count');
      }
    evidence.publicApi.push({ owner, name });
  }
}
evidence.methods = [];
if (process.argv.includes('--exact-methods')) {
  const constructorTree = (C) =>
    semanticTree(
      babel.parsers.babel
        .parse(C.toString())
        .program.body[0].body.body.find((node) => node.kind === 'constructor'),
    );
  assert.deepEqual(constructorTree(B), constructorTree(A), 'Campaign constructor parameters/body');
  evidence.constructor = hash(constructorTree(B));
  for (const [owner, before, after] of [
    ['instance', A.prototype, B.prototype],
    ['static', A, B],
  ]) {
    const methodNames = (object) =>
      Object.getOwnPropertyNames(object)
        .filter((name) => {
          if (name === 'constructor') return false;
          const d = Object.getOwnPropertyDescriptor(object, name);
          return [d.value, d.get, d.set].some((fn) => typeof fn === 'function');
        })
        .sort();
    assert.deepEqual(methodNames(after), methodNames(before), owner + ' public method set');
    for (const name of methodNames(before)) {
      const old = Object.getOwnPropertyDescriptor(before, name),
        next = Object.getOwnPropertyDescriptor(after, name);
      for (const key of ['enumerable', 'configurable', 'writable'])
        assert.equal(next[key], old[key], owner + '.' + name + ' ' + key);
      for (const key of ['value', 'get', 'set']) {
        if (typeof old[key] !== 'function') continue;
        const parse = (fn) =>
          semanticTree(
            babel.parsers.babel.parse('class Contract { ' + fn.toString() + ' }').program.body[0]
              .body.body[0],
          );
        assert.deepEqual(
          parse(next[key]),
          parse(old[key]),
          owner + '.' + name + ' ' + key + ' parameters/body',
        );
        evidence.methods.push({ owner, name, kind: key, digest: hash(parse(next[key])) });
      }
    }
  }
}
const declarations = [];
for (const name of ['engine', 'combat', 'hero-combat']) {
  const file = path.join(baseline, 'src/prototype', name + '.js');
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const collect = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator') declarations.push({ node, source });
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') collect(value);
    }
  };
  collect(babel.parsers.babel.parse(source));
}
evidence.configuration = [];
for (const [name, owner] of Object.entries({
  classes: 'classes',
  talentMaxRanks: 'disciplines.maxRanks',
  talentProfiles: 'disciplines.profiles',
  ceilings: 'instructors.skillCeilings',
  expeditionCeilings: 'instructors.expeditionCeilings',
  pursuitBurstSeconds: 'pursuit.burstSeconds',
  pursuitBurstMultiplier: 'pursuit.burstMultiplier',
  mercyStartRadius: 'pursuit.mercyStartRadius',
  costs: 'skills.costs',
  cooldowns: 'skills.cooldowns',
})) {
  const declaration = declarations.find(({ node }) => node.id.name === name);
  assert(declaration, 'Missing baseline configuration ' + name);
  const before = json(
    vm.runInNewContext(
      '(' + declaration.source.slice(declaration.node.init.start, declaration.node.init.end) + ')',
      { R: A.rules },
    ),
  );
  const after = owner.split('.').reduce((node, key) => node[key], B.rules.balance);
  assert.equal(JSON.stringify(after), JSON.stringify(before), name + ' values/indices/order');
  evidence.configuration.push({ name, owner: 'rules.balance.' + owner, before, after });
}
// Compare parsed CSS, retaining selector/declaration order, string contents and numeric values.
const postcss = require('prettier/plugins/postcss');
const cssTree = (node) => {
  if (Array.isArray(node)) return node.map(cssTree);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(
        ([key]) =>
          ![
            'raws',
            'source',
            'parent',
            'start',
            'end',
            'loc',
            'range',
            'id',
            'sourceIndex',
            'spaces',
            'after',
            'before',
            'text',
          ].includes(key) && !(key === 'value' && node.nodes),
      )
      .map(([key, value]) => [
        key,
        key === 'value' && node.type === 'value-number'
          ? Number(value)
          : key === 'value' && node.type === 'selector-attribute' && typeof value === 'string'
            ? value.replace(/^['"]|['"]$/g, '')
            : cssTree(value),
      ]),
  );
};
evidence.styles = [];
for (const name of ['prototype', 'desktop', 'phone']) {
  const parse = (root) =>
    cssTree(
      postcss.parsers.css.parse(fs.readFileSync(path.join(root, 'styles', name + '.css'), 'utf8')),
    );
  assert.deepEqual(parse(current), parse(baseline), name + ' parsed CSS');
  evidence.styles.push({ name, digest: hash(parse(current)) });
}
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
    for (const slot of charged ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]) {
      step((charged ? 'charged' : 'ordinary') + '-' + slot, (c) => {
        c.hero.cd.fill(0);
        c.hero.mp = 1000;
        c.hero.hp = c.hero.maxHp / 2;
        c.s.party.forEach((u) => (u.hp = u.maxHp / 2));
        Object.assign(c.hero, { x: 500, y: 500 });
        Object.assign(c.zone().enemies[0], { x: 570, y: 500 });
        assert(c.cast(slot, c.zone().enemies[0].id, charged));
        const timeline = [live(c)];
        for (let i = 0; i < 8; i++) {
          c.tick(0.05, { x: 0, y: 0 });
          timeline.push(live(c));
        }
        return timeline;
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
evidence.bossAttacks = [];
for (const mode of ['normal', 'nightmare'])
  for (const boss of A.data.bosses)
    for (const form of ['normal', 'true'])
      for (let index = 0; index < A.rules.attacks[boss.id].length; index++) {
        const run = (C) => {
          const c = new C(mode, 'mage', rng());
          c.enter('crypt');
          c.zone().props = [];
          c.s.mercyTime = 0;
          Object.assign(c.hero, { x: 500, y: 500, hp: 100000, maxHp: 100000, immune: 0 });
          c.s.party.forEach((u, i) =>
            Object.assign(u, { x: 500 + 25 * i, y: 530, hp: 100000, maxHp: 100000 }),
          );
          const e = c.bossEnemy(c.boss(boss.id), form, { x: 700, y: 500 });
          c.zone().enemies = [e];
          const timeline = [];
          for (const ratio of [1, 0.4]) {
            e.hp = e.maxHp * ratio;
            const weights = c.bossAttackWeights(e),
              selected = c.chooseBossAttack(e);
            assert(c.startAttack(e, c.hero, index));
            timeline.push({ weights, selected, state: live(c) });
            c.resolveAttack(e);
            for (let i = 0; i < 12; i++) {
              c.advanceMotion(e, 0.1);
              c.updateProjectiles(0.1);
              timeline.push(live(c));
            }
          }
          return timeline;
        };
        const before = run(A),
          after = run(B);
        assert.deepEqual(after, before, mode + '/' + boss.id + '/' + form + '/attack-' + index);
        evidence.bossAttacks.push({ mode, family: boss.id, form, index, digest: hash(after) });
        comparisons++;
      }
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
assert.equal(JSON.stringify(B.data), JSON.stringify(A.data), 'content ordering');
const newRules = { ...B.rules, balance: { ...B.rules.balance } };
for (const group of ['economy', 'rewards'])
  if (!A.rules.balance?.[group]) delete newRules.balance[group];
if (!A.rules.balance) delete newRules.balance;
assert.deepEqual(newRules, A.rules, 'existing rule values, ordering and formulas');
assert.equal(JSON.stringify(newRules), JSON.stringify(A.rules), 'existing rule ordering');
for (const key of ['classes', 'talentProfiles', 'talentMaxRanks', 'mercyStartRadius'])
  assert.deepEqual(B[key], A[key], key);
const economyReplay = require('../tests/helpers/economy-scenarios.cjs');
evidence.economy = [];
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const succession of [false, true]) {
      const before = economyReplay(A, mode, cls, succession),
        after = economyReplay(B, mode, cls, succession);
      assert.deepEqual(after, before, 'economy action replay ' + [mode, cls, succession].join('/'));
      comparisons += after.length;
      evidence.economy.push({
        mode,
        cls,
        succession,
        checkpoints: after.map((record) => ({ name: record.name, digest: hash(record) })),
      });
    }
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
