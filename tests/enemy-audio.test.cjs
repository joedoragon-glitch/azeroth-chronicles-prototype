'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine.js'),
  V = require('../src/prototype/enemy-vfx.js'),
  P = require('../src/prototype/enemy-presentation.js'),
  B = require('../src/prototype/enemy-vfx-events.js'),
  coverage = require('../scripts/enemy-audio-coverage.cjs'),
  { audio } = require('./helpers/audio-context.cjs');
const report = coverage.audit();
assert(report.identities >= 172);
const fresh = () => {
  const c = new C('normal', 'paladin', () => 0.5);
  c.s.party = [];
  c.zone().enemies = [];
  Object.assign(c.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
  c.line = () => true;
  return c;
};
const listener = () => {
  const a = audio(),
    calls = [];
  a.tone = (...x) => calls.push(['tone', ...x]);
  a.sweep = (...x) => calls.push(['sweep', ...x]);
  a.noiseBurst = (...x) => calls.push(['noise', ...x]);
  a.duck = () => calls.push(['duck']);
  a.playSoundEvent = () => false;
  return { a, calls };
};
// All boss indices/variants flow through the actual resolution bridge, including misses.
for (const b of C.data.bosses)
  for (const form of ['normal', 'true'])
    for (let i = 0; i < C.rules.attacks[b.id].length; i++) {
      const c = fresh(),
        e = c.bossEnemy(c.boss(b.id), form, { x: 1400, y: 1700 });
      c.zone().enemies = [e];
      c.hero.x = 2400;
      c.startAttack(e, { x: 1480, y: 1700 }, i);
      c.resolveAttack(e);
      const events = c.effects.filter((x) => x.type === 'enemyVfx');
      for (const f of events) {
        assert.equal(f.skillId, 'boss/' + b.id + '/' + i);
        assert.equal(f.variant, form);
        assert(P.route(f));
        assert.equal(f.actorId, e.id);
        assert(Object.isFrozen(f.identity.presentation));
      }
      assert(events.some((x) => x.stage === 'release'));
      assert(events.filter((x) => x.stage === 'impact').every((x) => P.route(x).mode === 'silent'));
      const { a, calls } = listener();
      for (const f of c.effects) a.effect(f);
      assert.equal(
        calls.filter((x) => x[0] === 'duck').length,
        C.rules.attacks[b.id][i].kind === 'summon' ? 0 : 1,
      );
      const n = calls.length;
      for (const f of c.effects) a.effect(f);
      assert.equal(calls.length, n, 'marker and concrete replay cannot double-warn');
      assert(
        c.s.statistics.events
          .filter((x) => x.type === 'warning')
          .every((x) => !('presentationHandled' in x)),
        'audio annotation stays out of save statistics',
      );
    }
// Confirmed victim contact sounds; footprint-only expression stays silent.
{
  const c = fresh(),
    e = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 });
  c.zone().enemies = [e];
  c.startAttack(e, c.hero, 0);
  c.resolveAttack(e);
  assert(c.effects.some((f) => f.stage === 'impact' && f.contact && P.route(f).mode === 'shared'));
}
// Summons sound at actual actor cast and actual spawn points, without a damage warning/hit.
{
  const c = fresh(),
    e = c.bossEnemy(c.boss('mire'), 'normal', { x: 1400, y: 1700 });
  c.zone().enemies = [e];
  c.startAttack(e, c.hero, 3);
  c.resolveAttack(e);
  for (const f of c.effects.filter((x) => x.type === 'enemyVfx')) {
    assert(!f.dangerous);
    assert.notEqual(f.stage, 'impact');
    if (f.stage === 'spawn') {
      const u = c.zone().enemies.find((x) => x.id === f.target);
      assert.deepEqual([f.x, f.y], [u.x, u.y]);
    }
  }
}
// Captains retain authored attack slots and profile-specific phase IDs.
for (const [id, p] of Object.entries(C.rules.roomCaptains)) {
  const c = fresh(),
    e = c.makeEnemy(
      { species: 'orc', name: p.name, level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
  Object.assign(e, { captain: true, captainProfile: id, hp: 400 });
  c.zone().enemies = [e];
  c.triggerCaptainPhase(e);
  for (const f of c.effects.filter((x) => x.type === 'enemyVfx')) {
    assert(P.route(f));
    assert.equal(f.skillId, 'captain/' + id + '/phase');
  }
  for (const [i, plan] of p.attacks.entries()) {
    e.telegraph = {
      ...plan,
      index: i,
      x: 1480,
      y: 1700,
      fromX: e.x,
      fromY: e.y,
      angle: 0,
      radius: 80,
    };
    c.resolveAttack(e);
    assert(c.effects.some((f) => f.stage === 'release' && f.skillId === 'captain/' + id + '/' + i));
  }
}
// Normal ranged shots bind to shared VFX identity and suppress only their legacy cue.
{
  const c = fresh(),
    e = { id: 'orc1', type: 'mob', species: 'orc', hp: 100, x: 1400, y: 1700, ranged: true },
    p = { id: 'shot1', sourceId: 'orc1', style: 'axe', species: 'orc', x: 1400, y: 1700 };
  c.zone().enemies = [e];
  c.s.projectiles = [p];
  c.event('projectileLaunch', { actor: 'enemy', source: e.id, style: p.style, x: p.x, y: p.y });
  assert(c.effects.find((f) => f.type === 'projectileLaunch').presentationHandled);
  c.enemyVfxProjectileImpact(p, { x: 1480, y: 1700, target: 'hero' });
  c.event('projectileImpact', { actor: 'enemy', source: e.id, x: 1480, y: 1700, target: 'hero' });
  assert(c.effects.find((f) => f.type === 'projectileImpact').presentationHandled);
  assert(c.effects.some((f) => f.skillId === 'projectile/orc/axe' && f.contact));
}
// Known rogue action contracts; unknown signatures fail the acceptance gate rather than fall through.
assert(
  V.describe(
    { species: 'wolf', form: 'ringleader' },
    { rogueMove: true, rogueSignature: true, effect: 'scatter', kind: 'circle' },
  ).presentation,
);
assert.equal(
  V.describe(
    { species: 'wolf', form: 'ringleader' },
    { rogueMove: true, rogueSignature: true, effect: 'invented', kind: 'circle' },
  ).presentation,
  null,
);
assert.equal(
  P.route({
    skillId: 'different',
    identity: {
      id: 'rogue/ordinary/melee/wolf/basic',
      presentation: P.profile({ species: 'wolf' }, { rogueMove: true, style: 'dash' }),
    },
    stage: 'release',
  }),
  null,
);
// Cold/missing recording executes procedural fallback synchronously. Warm recording retains motif.
{
  const e = {
    type: 'enemyVfx',
    skillId: 'boss/crypt/1',
    identity: V.describe({ type: 'boss', family: 'crypt' }, { index: 1, kind: 'volley' }),
    stage: 'release',
    variant: 'normal',
    dangerous: true,
  };
  const { a, calls } = listener();
  a.effect(e);
  assert(calls.some((x) => x[0] === 'noise'));
  assert(calls.some((x) => x[0] === 'tone'));
  const warm = listener();
  warm.a.playSoundEvent = () => true;
  warm.a.effect({ ...e });
  assert(!warm.calls.some((x) => x[0] === 'noise'));
  assert(warm.calls.some((x) => x[0] === 'tone'));
  for (const field of ['paused', 'muted', 'menu']) {
    const quiet = listener();
    if (field === 'paused') quiet.a.paused = true;
    if (field === 'muted') quiet.a.settings.muted = true;
    if (field === 'menu') quiet.a.mixScene = 'menu';
    quiet.a.effect({ ...e });
    assert.equal(quiet.calls.length, 0);
  }
}
console.log(
  'PASS enemy audio synchronization:',
  report.identities,
  'live IDs /',
  report.stageVariants,
  'stage variants; actual warnings, misses, contacts, casts, phases, fallback, pause/menu and save isolation',
);
// Exercise every merged rogue signature through the actual emitter/resolver.
{
  const T = C.rules.tacticalFoundation,
    cases = [];
  for (const [role, profiles] of Object.entries(T.rogueRingleaderSignatures))
    for (const species of Object.keys(profiles))
      cases.push({ species, form: 'ringleader', ranged: role === 'ranged' });
  for (const family of Object.keys(T.rogueSignatures.bosses))
    for (const form of ['normal', 'true']) cases.push({ type: 'boss', family, form });
  for (const captainProfile of Object.keys(T.rogueSignatures.captains))
    cases.push({ species: 'orc', captain: true, captainProfile });
  for (const actor of cases) {
    const c = fresh(),
      e =
        actor.type === 'boss'
          ? c.bossEnemy(c.boss(actor.family), actor.form, { x: 1400, y: 1700 })
          : c.makeEnemy(
              {
                species: actor.species,
                name: 'opaque localized label',
                level: 5,
                hp: 10000,
                damage: 40,
                gold: 0,
                xp: 0,
              },
              { x: 1400, y: 1700 },
            );
    Object.assign(e, actor, { aggro: true });
    c.zone().enemies = [e];
    c.hero.level = e.level + 1;
    c.s.time = 30;
    assert(c.tacticalRogueMove(e, c.hero, true));
    assert(e.telegraph.rogueSignature);
    const a = e.telegraph,
      id = V.describe(e, a).id;
    c.resolveAttack(e);
    const events = c.effects.filter((f) => f.type === 'enemyVfx');
    assert(events.some((f) => f.stage === 'release'));
    for (const f of events) {
      assert.equal(f.skillId, id);
      assert(P.route(f));
      if (f.stage === 'windup' && a.coefficient > 0)
        assert(f.dangerous, 'rally/control damage keeps danger warning');
    }
  }
  assert.equal(cases.length, 51);
}
// Automatic TRUE births have the same existing summon slot identity, without a fake cast.
{
  const c = fresh(),
    e = c.bossEnemy(c.boss('crypt'), 'true', { x: 1400, y: 1700 });
  c.zone().enemies = [e];
  c.summonBossAdds(e, c.trueSummonPlan(e), c.bossSummonCap(e));
  const events = c.effects.filter((f) => f.type === 'enemyVfx');
  assert(events.length);
  assert(events.every((f) => f.skillId === 'boss/crypt/2' && f.stage === 'spawn' && !f.dangerous));
}
// Production bindings: real WAV fetch/hash/decode, exact variant overrides, cold
// immediate fallback, and reserved warning sources amid a full recorded crowd.
(async () => {
  const fs = require('node:fs'),
    path = require('node:path'),
    m = structuredClone(require('../assets/audio/manifest.json'));
  m.director.events['effect.enemyRelease'].unshift({
    asset: 'sfx-steel-release',
    when: { skillId: 'boss/crypt/1', stage: 'release', variant: 'true' },
    gain: 0.35,
  });
  const { a, calls } = listener();
  a.playSoundEvent = require('../src/prototype/audio.js').prototype.playSoundEvent;
  a.configureRecordings(m, {
    baseUrl: 'https://game.test/',
    fetch: async (url) =>
      new Response(fs.readFileSync(path.join(__dirname, '..', new URL(url).pathname.slice(1)))),
  });
  const e = {
    type: 'enemyVfx',
    skillId: 'boss/crypt/1',
    identity: V.describe(
      { type: 'boss', family: 'crypt', form: 'true' },
      { index: 1, kind: 'volley' },
    ),
    stage: 'release',
    variant: 'true',
    dangerous: true,
  };
  a.effect(e);
  assert(
    calls.some((x) => x[0] === 'noise'),
    'cold recording falls back in this exact frame',
  );
  const store = await a.assetsForRecordings();
  await store.load('sfx-steel-release');
  a.ctx.currentTime += 1;
  a.effect({ ...e });
  assert(
    [...a.voices].some((x) => x.id === 'sfx-steel-release'),
    'exact skill/stage/TRUE binding wins',
  );
  const arrow = await store.load('sfx-arrow-release');
  a.ctx.currentTime += 1;
  a.effect({ ...e, variant: 'normal' });
  assert(
    [...a.voices].some((x) => x.id === 'sfx-arrow-release'),
    'normal variant uses shared arrow family',
  );
  for (let i = 0; i < 100; i++)
    a.createRecording('sfx-arrow-release', arrow, store, {
      bus: 'effects',
      priority: i < 4 ? 0 : 1,
      gain: 0.2,
    });
  assert(a.voices.size <= 60);
  const critical = await store.load('sfx-critical-warning');
  for (let i = 0; i < 8; i++)
    a.createRecording('sfx-critical-warning', critical, store, {
      bus: 'effects',
      priority: 3,
      gain: 0.3,
    });
  assert(a.voices.size <= 64);
  assert([...a.voices].some((v) => v.priority === 3));
  assert(store.bytes <= 32 * 1024 * 1024);
  a.dispose();
  assert.equal(a.voices.size, 0);
  assert.equal(a.ctx, null);
  console.log(
    'PASS production SFX: exact skill/stage/variant bindings, real registered WAV recovery, 64-source warning reservation and disposal',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// Caption-less follow-up warnings still own the fresh captain stage; old motion
// context must not publish the previous attack's footprint as the next windup.
{
  const c = fresh(),
    e = c.makeEnemy(
      { species: 'orc', name: 'captain', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
  Object.assign(e, { captain: true, captainProfile: 'supply-crown', hp: 1000, aggro: true });
  c.zone().enemies = [e];
  e.telegraph = {
    ...C.rules.roomCaptains['supply-crown'].attacks[0],
    index: 0,
    x: 1500,
    y: 1720,
    radius: 78,
    timer: 1,
    total: 1,
  };
  c.event('warning', { family: null });
  assert(c.effects.find((f) => f.type === 'warning').presentationHandled);
  assert(c.effects.some((f) => f.skillId === 'captain/supply-crown/0' && f.stage === 'windup'));
  c.effects = [];
  e.telegraph = null;
  e.motion = {
    ...C.rules.roomCaptains['supply-crown'].attacks[1],
    index: 1,
    x: e.x,
    y: e.y,
    target: { x: e.x, y: e.y },
    hit: [],
    life: 0,
    speed: 1,
    recovery: 1,
  };
  e.sequence = [
    {
      ...C.rules.roomCaptains['supply-crown'].attacks[0],
      index: 0,
      x: 1550,
      y: 1725,
      radius: 78,
      timer: 1,
      total: 1,
    },
  ];
  c.advanceMotion(e, 0.01);
  const windup = c.effects.find((f) => f.stage === 'windup');
  assert.equal(windup.skillId, 'captain/supply-crown/0');
  assert.equal(windup.geometry.x, 1550);
  assert(c.effects.find((f) => f.type === 'warning').presentationHandled);
}
// Concurrent reinforcements retain their own identity and preserve all gameplay state.
function concurrentBirths(enabled, family, form = 'true', captain = false, ranged = false) {
  const c = fresh();
  c.enemyVfxEnabled = enabled;
  c.zone().props = [];
  const e = captain
    ? c.makeEnemy(
        { species: 'ashbeast', name: 'captain', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
        { x: 1400, y: 1700 },
      )
    : c.bossEnemy(c.boss(family), form, { x: 1400, y: 1700 });
  if (captain) Object.assign(e, { captain: true, captainProfile: family, ranged });
  Object.assign(e, { aggro: true, hp: e.maxHp * 0.4, cd: 100, summonCd: 100, fightStart: 0 });
  c.zone().enemies = [e];
  c.s.time = 30;
  if (captain) c.startCaptainAttack(e, c.hero);
  else c.startAttack(e, c.hero, 0);
  const pending = e.telegraph;
  assert(pending && pending.kind !== 'summon');
  const hp = c.hero.hp;
  c.updateEnemies(0.01);
  assert.equal(
    e.telegraph,
    pending,
    'reinforcement cannot resolve or replace the active telegraph',
  );
  assert.equal(c.hero.hp, hp, 'automatic births do not inflict attack damage');
  return { c, e, snapshot: c.snapshot(), births: c.effects.filter((f) => f.stage === 'spawn') };
}
for (const family of C.data.bosses.map((b) => b.id)) {
  const observed = concurrentBirths(true, family),
    baseline = concurrentBirths(false, family);
  const slot = C.rules.attacks[family].findIndex((a) => a.kind === 'summon');
  assert(slot >= 0);
  assert.deepEqual(
    observed.snapshot,
    baseline.snapshot,
    family + ' preserves counts, positions, timers and saves',
  );
  assert.equal(observed.births.length, observed.c.bossOwnedSummons(observed.e).length);
  for (const f of observed.births) {
    const born = observed.c.zone().enemies.find((u) => u.id === f.target);
    assert.equal(f.skillId, 'boss/' + family + '/' + slot);
    assert.equal(f.variant, 'true');
    assert.equal(f.stage, 'spawn');
    assert.equal(f.dangerous, false);
    assert.equal(f.at, 30);
    assert.deepEqual([f.x, f.y], [born.x, born.y]);
    assert.equal(P.route(f).key, 'enemySpawn');
  }
}
for (const ranged of [false, true]) {
  const observed = concurrentBirths(true, 'supply-crown', 'normal', true, ranged),
    baseline = concurrentBirths(false, 'supply-crown', 'normal', true, ranged);
  assert.deepEqual(observed.snapshot, baseline.snapshot);
  assert(observed.births.length);
  for (const f of observed.births) {
    assert.equal(f.skillId, 'captain/supply-crown/phase');
    assert.equal(f.role, ranged ? 'ranged' : 'melee');
    assert.equal(f.identity.role, f.role);
    assert.equal(f.dangerous, false);
    assert.equal(f.at, 30);
    const born = observed.c.zone().enemies.find((u) => u.id === f.target);
    assert.deepEqual([f.x, f.y], [born.x, born.y]);
  }
}
// Explicit captain summon resolution still owns its authored cast slot.
{
  const c = fresh(),
    id = 'supply-crown',
    plans = C.rules.roomCaptains[id].attacks,
    slot = plans.findIndex((a) => a.kind === 'summon'),
    e = c.makeEnemy(
      { species: 'ashbeast', name: 'captain', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1400, y: 1700 },
    );
  assert(slot >= 0);
  Object.assign(e, { captain: true, captainProfile: id, ranged: true });
  c.zone().enemies = [e];
  c.zone().props = [];
  e.telegraph = { ...plans[slot], index: slot, x: c.hero.x, y: c.hero.y };
  c.resolveAttack(e);
  const births = c.effects.filter((f) => f.stage === 'spawn');
  assert(births.length);
  assert(births.every((f) => f.skillId === 'captain/' + id + '/' + slot && f.role === 'ranged'));
}
// A different actor's nested summon must not inherit the resolving actor's slot.
{
  const c = fresh(),
    caster = c.bossEnemy(c.boss('mire'), 'normal', { x: 1400, y: 1700 }),
    reinforcing = c.bossEnemy(c.boss('crypt'), 'true', { x: 1800, y: 1700 }),
    original = c.summonBossAdds;
  c.zone().enemies = [caster, reinforcing];
  c.summonBossAdds = function (...args) {
    if (args[0] === caster)
      original.call(
        this,
        reinforcing,
        this.trueSummonPlan(reinforcing),
        this.bossSummonCap(reinforcing),
      );
    return original.apply(this, args);
  };
  c.startAttack(caster, c.hero, 3);
  c.resolveAttack(caster);
  const births = c.effects.filter((f) => f.stage === 'spawn');
  assert(births.some((f) => f.source === reinforcing.id));
  assert(
    births.filter((f) => f.source === reinforcing.id).every((f) => f.skillId === 'boss/crypt/2'),
  );
  assert(births.filter((f) => f.source === caster.id).every((f) => f.skillId === 'boss/mire/3'));
}
// Reject unknown stage/layers before any deliberately silent route, including melee.
for (const action of ['melee', 'circle']) {
  const presentation = { ...P.profile({ species: 'orc' }, { kind: action }) },
    event = { skillId: 'test', identity: { id: 'test', presentation }, stage: 'release' };
  assert(P.route(event));
  assert.equal(P.route({ ...event, stage: 'invented' }), null);
  for (const stage of ['release', 'travel', 'linger', 'impact'])
    for (const layer of ['material', 'personality', 'action', 'accent'])
      assert.equal(
        P.route({
          ...event,
          stage,
          identity: { id: 'test', presentation: { ...presentation, [layer]: 'invented' } },
        }),
        null,
        stage + '/' + layer,
      );
}
// The acceptance gate must also reject a personality with no authored audio texture.
{
  const inventory = require('../scripts/enemy-vfx-inventory.cjs'),
    original = inventory.audit;
  inventory.audit = () => ({
    total: 1,
    counts: {},
    rows: [
      {
        id: 'test',
        presentation: { material: 'steel', personality: 'invented' },
        stages: ['release'],
      },
    ],
  });
  try {
    assert.throws(() => coverage.audit(), /Missing audio personality/);
  } finally {
    inventory.audit = original;
  }
}
// All 99 actual rogue basics (84 stable IDs) sound at warning/release/contact.
{
  const cases = [];
  for (const species of Object.keys(C.rules.tacticalFoundation.rogueRingleaderSignatures.melee))
    for (const ranged of [false, true])
      for (const tier of ['ordinary', 'guardian', 'ringleader'])
        cases.push({
          species,
          ranged,
          guard: tier === 'guardian',
          form: tier === 'ringleader' ? tier : 'normal',
        });
  for (const captainProfile of Object.keys(C.rules.roomCaptains))
    cases.push({ species: 'orc', captain: true, captainProfile });
  for (const b of C.data.bosses)
    for (const form of ['normal', 'true']) cases.push({ type: 'boss', family: b.id, form });
  const ids = new Set();
  for (const actor of cases) {
    const c = fresh(),
      e =
        actor.type === 'boss'
          ? c.bossEnemy(c.boss(actor.family), actor.form, { x: 1400, y: 1700 })
          : c.makeEnemy(
              {
                species: actor.species,
                name: 'opaque',
                level: 5,
                hp: 10000,
                damage: 40,
                gold: 0,
                xp: 0,
              },
              { x: 1400, y: 1700 },
            );
    Object.assign(e, actor, { aggro: true });
    c.zone().enemies = [e];
    c.hero.level = e.level + 1;
    c.s.time = 30;
    assert(c.tacticalRogueMove(e, c.hero));
    const id = V.describe(e, e.telegraph).id;
    ids.add(id);
    c.resolveAttack(e);
    const events = c.effects.filter((f) => f.type === 'enemyVfx');
    assert(
      events.some((f) => f.stage === 'windup' && f.dangerous && P.route(f).key === 'enemyWindup'),
    );
    assert(events.some((f) => f.stage === 'release' && P.route(f).key === 'enemyRelease'));
    assert(
      events.some((f) => f.stage === 'impact' && f.contact && P.route(f).key === 'enemyImpact'),
    );
    assert(events.every((f) => f.skillId === id));
    const { a, calls } = listener();
    for (const f of c.effects) a.effect(f);
    assert.equal(calls.filter((x) => x[0] === 'duck').length, 1);
    const n = calls.length;
    for (const f of c.effects) a.effect(f);
    assert.equal(calls.length, n);
  }
  assert.equal(cases.length, 99);
  const liveBasics = require('../scripts/enemy-vfx-inventory.cjs')
    .audit()
    .rows.filter((r) => r.group === 'rogue-basic');
  assert.equal(liveBasics.length, 84);
  assert(
    liveBasics.every((r) => ids.has(r.id)),
    'all live basics are exercised; forced test roles may add hypothetical IDs',
  );
}
// Rally signatures warn about real damage; only actual native revival emits spawn.
for (const actor of [
  { type: 'boss', family: 'ridge', species: 'wolf', guard: true },
  { type: 'boss', family: 'warlord', species: 'orc' },
  { type: 'boss', family: 'cindermaw', species: 'ashbeast' },
  { type: 'boss', family: 'darklord', species: 'crownguard' },
  { captainProfile: 'supply-highlands', species: 'wolf', guard: true },
  { captainProfile: 'frontier-overseer', species: 'orc' },
]) {
  const c = fresh(),
    e =
      actor.type === 'boss'
        ? c.bossEnemy(c.boss(actor.family), 'normal', { x: 1400, y: 1700 })
        : c.makeEnemy(
            { species: 'orc', name: 'captain', level: 5, hp: 10000, damage: 40, gold: 0, xp: 0 },
            { x: 1400, y: 1700 },
          ),
    troop = c.makeEnemy(
      { species: actor.species, name: 'native', level: 5, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 1700, y: 1700 },
    );
  if (actor.captainProfile)
    Object.assign(e, { captain: true, captainProfile: actor.captainProfile });
  Object.assign(e, { aggro: true });
  Object.assign(troop, { hp: 0, deathPaid: true, pack: 'native', guard: !!actor.guard });
  c.zone().props = [];
  c.zone().enemies = [e, troop];
  c.hero.level = e.level + 1;
  c.s.time = 30;
  assert(c.tacticalRogueMove(e, c.hero, true));
  const move = e.telegraph;
  assert(move.coefficient > 0);
  c.resolveAttack(e);
  assert(troop.hp > 0);
  const windup = c.effects.find((f) => f.stage === 'windup'),
    births = c.effects.filter((f) => f.stage === 'spawn');
  assert(windup.dangerous);
  assert.equal(P.route(windup).key, 'enemyWindup');
  assert.equal(births.length, 1);
  assert.equal(births[0].target, troop.id);
  assert.deepEqual([births[0].x, births[0].y], [troop.home.x, troop.home.y]);
  assert.equal(P.route(births[0]).key, 'enemySpawn');
  const { a, calls } = listener();
  a.effect(births[0]);
  assert(calls.length > 0);
  c.effects = [];
  if (['warlord', 'cindermaw', 'darklord'].includes(actor.family))
    c.tacticalRogueFieldSupport(e, move);
  else c.tacticalRogueCommanderSupport(e, move);
  assert(
    !c.effects.some((f) => f.stage === 'spawn'),
    'rallying a living defender cannot replay revival sound',
  );
}
console.log(
  'PASS final synchronization audit: concurrent TRUE/phase births, actor-owned summon slots, strict routing, 99 rogue basics and 6 native revival paths',
);
// The registered warning retains two readable local pulses and all master measurements.
{
  const fs = require('node:fs'),
    path = require('node:path'),
    manifest = require('../assets/audio/manifest.json'),
    wav = fs.readFileSync(path.join(__dirname, '..', manifest.assets['sfx-critical-warning'].src));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt16LE(20), 1); // PCM
  assert.equal(wav.readUInt16LE(22), 1); // mono
  assert.equal(wav.readUInt16LE(34), 16);
  const rate = wav.readUInt32LE(24),
    rms = (from, to) => {
      let sum = 0,
        n = 0;
      for (let i = Math.round(from * rate); i < Math.round(to * rate); i++) {
        const x = wav.readInt16LE(44 + i * 2) / 32767;
        sum += x * x;
        n++;
      }
      return Math.sqrt(sum / n);
    };
  assert(
    rms(0.11, 0.185) / rms(0.005, 0.08) > 0.35,
    'second recorded danger pulse cannot disappear under a global decay',
  );
  assert.equal(
    Object.keys(require('../tools/audio/sfx-measurements.json')).length,
    30,
    'single-cue authoring preserves untouched measurements',
  );
}
// Observation cannot turn the summon API's guarded no-op into an exception.
{
  const c = fresh(),
    e = c.bossEnemy(c.boss('thorn'), 'normal', { x: 1400, y: 1700 }),
    before = c.snapshot();
  assert.equal(c.summonBossAdds(null, { species: 'wolf' }, 3), 0);
  assert.equal(c.summonBossAdds(e, null, 3), 0);
  assert.equal(c.summonBossAdds(e, { species: 'wolf' }, 0), 0);
  assert.equal(c.summonCaptainAdds(null, null), 0);
  assert.equal(c.summonCaptainAdds(e, null), 0);
  assert.equal(c.effects.length, 0);
  assert.deepEqual(c.snapshot(), before);
}
