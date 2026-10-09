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
