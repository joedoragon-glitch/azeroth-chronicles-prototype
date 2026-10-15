'use strict';
const assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  Sprites = require('../src/prototype/sprites');
for (const [structure, cfg] of Object.entries(C.rules.ambientLife)) {
  const e = { id: 'ambient-check-' + structure, structure, renderKind: 'prop', decorative: true };
  if (structure === 'mire-nests') {
    e.id = structure;
    e.kind = 'landmark';
    e.renderKind = 'npc';
    delete e.structure;
    delete e.decorative;
  }
  let moves = 0,
    rests = 0,
    last;
  for (let i = 0; i < 600; i++) {
    const pose = V.ambientAnimalPose(e, 0, i * 0.1);
    assert.deepEqual(
      pose,
      V.ambientAnimalPose(e, 0, i * 0.1),
      'same presentation time is stable, including pause',
    );
    assert(
      Math.abs(pose.x) <= cfg.radius * 1.52 + 0.001 &&
        Math.abs(pose.y) <= cfg.radius * 0.54 + 0.001,
      'roaming stays in its home patch',
    );
    if (last) {
      const d = Math.hypot(pose.x - last.x, pose.y - last.y);
      if (d < 1e-9) rests++;
      else moves++;
      assert(d < 3, 'short continuous walking, no teleporting');
    }
    last = pose;
  }
  assert(moves > 40 && rests > 40, structure + ' alternates actual travel with resting');
  assert.notDeepEqual(
    V.ambientAnimalPose(e, 0, 5),
    V.ambientAnimalPose(e, 1, 5),
    'individual animals have independent phases',
  );
  assert.deepEqual(
    Sprites.candidateKeys(e),
    [],
    'a flattened static sprite cannot replace animated individuals',
  );
  const canvas = createCanvas(200, 120),
    ctx = canvas.getContext('2d');
  V.draw(ctx, { ...e, ambientTime: 0 }, { x: 100, y: 70 });
  const first = Buffer.from(ctx.getImageData(0, 0, 200, 120).data);
  ctx.clearRect(0, 0, 200, 120);
  V.draw(ctx, { ...e, ambientTime: 7 }, { x: 100, y: 70 });
  assert(
    !first.equals(Buffer.from(ctx.getImageData(0, 0, 200, 120).data)),
    structure + ' actually changes drawing position',
  );
}
const c = new C('normal', 'paladin', () => 0.99);
const animals = c.zone().props.filter((p) => C.rules.ambientLife[p.structure]);
assert(
  animals.some((p) => p.structure === 'pasture-sheep') &&
    animals.some((p) => p.structure === 'poultry-yard'),
);
const enemies = c.zone().enemies.map((e) => e.id);
c.zone().enemies = [];
c.s.party = [];
c.hero.skills.fill(1);
for (const p of animals) {
  assert(!('hp' in p), 'livestock has no damageable health record');
  assert(!c.combatTargets().includes(p));
  const before = JSON.stringify(p);
  Object.assign(c.hero, { x: p.x + 30, y: p.y });
  for (let slot = 1; slot <= 8; slot++) {
    c.hero.cd.fill(0);
    c.cast(slot, p.id);
  }
  assert.equal(
    JSON.stringify(p),
    before,
    'direct attacks and area skills cannot harm or alter livestock',
  );
}
assert.deepEqual(c.zone().enemies, [], 'animals never become enemy actors');
const ids = animals.map((p) => p.id);
const restored = C.restore(c.snapshot(), () => 0.99);
assert.deepEqual(
  restored
    .zone()
    .props.filter((p) => C.rules.ambientLife[p.structure])
    .map((p) => p.id),
  ids,
  'historical scene identities survive reload without duplicate animals',
);
console.log(
  'PASS five harmless ambient families: independent bounded walk/rest motion, paused/deterministic draws, no hit targets, all hero skill slots and save identity',
);
