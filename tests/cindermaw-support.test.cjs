'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const FX = require('../src/prototype/combat-visuals');
const { createCanvas } = require('@napi-rs/canvas');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function scene(mode = 'normal', cls = 'mage', form = 'normal', succession = false) {
  const c = new C(mode, cls, () => 0.9, { succession });
  c.enter('crown');
  c.s.mercyTime = 0;
  c.s.party = [];
  const original = c.zone().enemies.find((e) => e.family === 'cindermaw');
  const e = form === 'normal' ? original : c.bossEnemy(c.boss('cindermaw'), form, original.home);
  c.zone().enemies = c.zone().enemies.filter((u) => u.type !== 'boss');
  c.zone().enemies.push(e);
  c.hero.hp = c.hero.maxHp = 1e6;
  c.hero.immune = 1e6;
  Object.assign(c.hero, c.safe(e.x + 70, e.y));
  c.engage(e, true, false);
  e.cd = 1e6;
  e.summonCd = 1e6;
  c._tacticalRogueNext = new Map([[e.id, 1e6]]);
  return { c, e };
}
function roar(c, e) {
  assert(c.tacticalRogueMove(e, c.hero, true));
  assert(e.telegraph.rogueSignature);
  assert.equal(e.telegraph.radius, 1200);
  assert.equal(e.telegraph.total, 1.5);
  assert.equal(e.telegraph.anonymousCast, true);
  return e.telegraph;
}

for (const mode of ['normal', 'nightmare'])
  for (const form of ['normal', 'true']) {
    const { c, e } = scene(mode, 'mage', form);
    assert.equal(C.rules.tacticalFoundation.supportRadius, 195);
    assert.equal(c.bossSummonCap(e), form === 'true' ? 8 : 6);
    c.summonBossAdds(e, c.trueSummonPlan(e), c.bossSummonCap(e));
    assert.equal(c.bossOwnedSummons(e).length, form === 'true' ? 8 : 6);
    if (form === 'true') {
      assert.equal(c.bossOwnedSummons(e).filter((u) => u.trueSummonRole === 'minion').length, 6);
      assert.equal(c.bossOwnedSummons(e).filter((u) => u.trueSummonRole === 'captain').length, 2);
    }
    c.summonBossAdds(e, c.trueSummonPlan(e), c.bossSummonCap(e));
    assert.equal(
      c.bossOwnedSummons(e).length,
      form === 'true' ? 8 : 6,
      'repeat calls respect the same cap',
    );
    const a = roar(c, e),
      ids = c.zone().enemies.map((u) => u.id),
      homes = new Map(c.zone().enemies.map((u) => [u.id, { ...u.home }]));
    c.resolveAttack(e);
    e.telegraph = null;
    assert.equal(
      c._tacticalCinderResponses.size,
      6,
      'six real ordinary records enroll independently of magical personnel',
    );
    const admitted = [...c._tacticalCinderResponses.keys()];
    assert(
      admitted.every(
        (id) =>
          distance(
            c.zone().enemies.find((u) => u.id === id),
            e,
          ) > 195,
      ),
    );
    assert.deepEqual(
      c.zone().enemies.map((u) => u.id),
      ids,
      'no new native spawn objects',
    );
    c.cinderNativeResponse(e, a);
    assert.equal(c._tacticalCinderResponses.size, 6, 'repeated roar never admits more than six');
    let joined = 0;
    for (let n = 0; n < 320; n++) {
      const before = new Map(
        admitted.map((id) => {
          const u = c.zone().enemies.find((u) => u.id === id);
          return [id, { x: u.x, y: u.y }];
        }),
      );
      c.s.time += 0.05;
      c.updateEnemies(0.05);
      for (const id of admitted) {
        const u = c.zone().enemies.find((u) => u.id === id);
        assert(distance(before.get(id), u) < 17, 'responses use bounded physical steps');
        assert(!c.blocked(u.x, u.y, c.zoneId, 12), 'response stays on real authored floor');
        assert.deepEqual(u.home, homes.get(id), 'original respawn home is unchanged');
      }
      joined = admitted.filter((id) => c._tacticalCinderResponses.get(id)?.joined).length;
      if (joined === 6) break;
    }
    assert.equal(joined, 6, 'all six distant existing native responders really arrive');
    for (const id of admitted) {
      const u = c.zone().enemies.find((u) => u.id === id);
      u.cd = 2;
      u.pursuitBurst = 0;
    }
    c.cinderNativeResponse(e, a);
    for (const id of admitted) {
      const u = c.zone().enemies.find((u) => u.id === id);
      assert.equal(u.pursuitBurst, 1.9, 'repeat Roar preserves the original native rally duration');
      assert.equal(u.cd, 0.5, 'repeat Roar preserves the original readiness bound');
    }

    const save = c.snapshot(),
      restored = C.restore(save, () => 0.9);
    assert(!JSON.stringify(save).includes('CinderResponses'), 'response orders are not serialized');
    assert(!restored._tacticalCinderResponses?.size);
    assert.equal(c._tacticalCinderResponses.size, 6, 'snapshot does not cancel the live encounter');
    c.cancelEncounter(e);
    assert.equal(c._tacticalCinderResponses.size, 0);
    assert(admitted.every((id) => !c.zone().enemies.find((u) => u.id === id).telegraph));
    assert.equal(c.bossOwnedSummons(e).length, 0);
    console.log(
      'PASS ' +
        mode +
        '/' +
        form +
        ' independent staffing, six actual native arrivals, exact caps, homes, cancellation and save',
    );
  }

// An enrolled response must not carry a frozen old warning across the map.
{
  const { c, e } = scene();
  roar(c, e);
  const troop = c
    .zone()
    .enemies.filter(
      (u) => u.type === 'mob' && u.species === 'ashbeast' && u.form === 'normal' && !u.guard,
    )
    .sort((a, b) => distance(a, e) - distance(b, e))[0];
  Object.assign(c.hero, c.safe(troop.x + 55, troop.y));
  troop.aggro = true;
  assert(c.tacticalRogueMove(troop, c.hero), 'actual native rogue attack prepares');
  const warning = troop.telegraph,
    timer = warning.timer;
  c.resolveAttack(e);
  e.telegraph = null;
  assert(
    !c._tacticalCinderResponses.has(troop.id),
    'currently casting native is ineligible for remote response',
  );
  assert.equal(troop.telegraph, warning, 'its own current attack remains intact');
  c.s.time += 0.05;
  c.updateEnemies(0.05);
  assert.equal(
    warning.timer,
    timer - 0.05,
    'original native warning advances normally instead of freezing during travel',
  );
  console.log(
    'PASS busy native keeps its actual advancing warning and is not forced into a response route',
  );
}

// Solid geometry decides safety, including distant targets within the new radius.
{
  const { c, e } = scene();
  c.zone().props = [];
  Object.assign(e, { x: 2400, y: 2000 });
  e.home = { x: e.x, y: e.y };
  Object.assign(c.hero, { x: 2450, y: 2000, immune: 0, hp: 1000, maxHp: 1000 });
  const a = roar(c, e);
  Object.assign(c.hero, { x: 3300, y: 2000 });
  assert(c.line(e, c.hero));
  c.tacticalResolveRogueMove(e, a);
  assert(c.hero.hp < 1000, 'real distant open-lane target is hit');
  c.hero.hp = 1000;
  c.hero.immune = 0;
  c.zone().props.push({ kind: 'rock', x: 2900, y: 2000, r: 100 });
  assert(!c.line(e, c.hero), 'solid cover really blocks navigation LOS');
  const pos = { x: c.hero.x, y: c.hero.y };
  c.tacticalResolveRogueMove(e, a);
  assert.equal(c.hero.hp, 1000, 'covered target takes no blast damage');
  assert.deepEqual({ x: c.hero.x, y: c.hero.y }, pos, 'cover prevents displacement too');
  c.zone().props = [];
  c.hero.x = 3650;
  c.tacticalResolveRogueMove(e, a);
  assert.equal(c.hero.hp, 1000, 'outside 1200 remains safe');
  console.log('PASS true 1200-unit coverage, real solid cover and outside-radius safety');
}

for (const boundary of ['disengage', 'death', 'travel', 'blocked']) {
  const { c, e } = scene();
  const a = roar(c, e);
  c.resolveAttack(e);
  e.telegraph = null;
  assert.equal(c._tacticalCinderResponses.size, 6);
  if (boundary === 'disengage') c.disengage(e, 0);
  if (boundary === 'death') {
    e.hp = 0;
    c.kill(e);
  }
  if (boundary === 'travel') c.enter('vale');
  if (boundary === 'blocked') {
    c.move = () => false;
    for (let n = 0; n < 6; n++)
      for (const id of [...c._tacticalCinderResponses.keys()])
        c.updateCinderResponse(
          c.zone().enemies.find((u) => u.id === id),
          0.5,
        );
  }
  assert.equal(c._tacticalCinderResponses.size, 0, boundary + ' cancels response orders');
  console.log('PASS native response ' + boundary + ' cleanup');
}

// The existing renderer must show a timed anonymous bar, without a named/ground warning.
{
  const { c, e } = scene();
  const a = roar(c, e);
  const ctx = createCanvas(375, 800).getContext('2d'),
    labels = [],
    fill = ctx.fillText.bind(ctx);
  ctx.fillText = (text, ...args) => {
    labels.push(String(text));
    fill(text, ...args);
  };
  const options = {
    game: c,
    screen: (u) => ({ x: 180 + (u.x - e.x) * 0.2, y: 400 + (u.y - e.y) * 0.2 }),
    time: 0,
    cue: true,
  };
  FX.ground(ctx, options.screen, c, 'cue', 0);
  assert(labels.includes('Preparing…'));
  assert(!labels.some((t) => t.includes('Broodscreen') || t.includes('SIGNATURE')));
  assert(e.telegraph.anonymousCast);
  assert.equal(e.telegraph.timer, 1.5);
  console.log('PASS actual 375px Canvas anonymous preparation bar; spatial/name warning absent');
}

let fatalities = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare'])
    for (const form of ['normal', 'true'])
      for (const succession of [false, true]) {
        const { c, e } = scene(mode, cls, form, succession);
        const a = roar(c, e);
        c.hero.hp = 1;
        c.hero.immune = 0;
        const deaths = c.s.statistics.deaths;
        c.resolveAttack(e);
        assert.equal(c.s.statistics.deaths, deaths + 1);
        assert(
          !c._tacticalCinderResponses?.size,
          'fatal blast cannot start new support after revival',
        );
        assert(!e.telegraph && !e.motion);
        assert.equal(c.hero.slow || 0, 0);
        fatalities++;
      }
console.log('PASS ' + fatalities + ' fatal Broodscreen class/mode/form/Succession outcomes');
