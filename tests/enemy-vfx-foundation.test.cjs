'use strict';

const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const VFX = require('../src/prototype/enemy-vfx.js');
const manifest = require('../assets/vfx/manifest.json');

const R = C.rules;
assert.deepEqual(VFX.validateManifest(manifest), []);
assert.deepEqual(VFX.STAGES, [
  'windup', 'release', 'travel', 'impact', 'linger', 'spawn', 'phase',
]);

// Audit coverage is derived from the current authoritative movesets rather
// than copied skill-name strings or a list that goes stale after rogue edits.
assert.equal(C.data.bosses.length, 11);
for (const boss of C.data.bosses) {
  const plans = R.attacks[boss.id];
  assert(plans?.length >= 4, boss.id + ' has authored moves');
  for (const [index, plan] of plans.entries()) {
    const before = JSON.stringify(plan);
    const normal = VFX.describe(
      { type: 'boss', family: boss.id, form: 'normal' },
      { ...plan, index, name: 'Label can change' },
    );
    const trueForm = VFX.describe(
      { type: 'boss', family: boss.id, form: 'true' },
      { ...plan, index, name: 'Renamed in another language' },
    );
    assert.equal(normal.id, 'boss/' + boss.id + '/' + index);
    assert.equal(trueForm.id, normal.id, 'TRUE does not double the art keys');
    assert.equal(normal.variant, 'normal');
    assert.equal(trueForm.variant, 'true');
    assert.equal(JSON.stringify(plan), before, 'resolver never changes authored combat');
    for (const stage of ['windup', 'release', 'impact']) {
      assert.equal(VFX.select(manifest, normal, stage).mode, 'procedural');
    }
  }
}
const captainProfiles = Object.entries(R.roomCaptains);
assert.equal(captainProfiles.length, 5);
for (const [captain, profile] of captainProfiles) {
  for (const [index, plan] of profile.attacks.entries()) {
    const id = VFX.describe(
      { roomCaptain: true, captainProfile: captain, species: 'orc' },
      { ...plan, index },
    );
    assert.equal(id.id, 'captain/' + captain + '/' + index);
    assert.equal(id.tier, 'captain');
  }
}
for (const [species, move] of [['wraith', 'drain'], ['stalker', 'pounce']]) {
  assert(R.nightEnemyCombat[species]);
  assert.equal(
    VFX.describe({ species }, { nightSkill: move, kind: 'circle' }).id,
    'night/' + species + '/' + move,
  );
}
for (const [species, profile] of Object.entries(R.rangedProfiles)) {
  assert.equal(
    VFX.projectile({ species }, { style: profile.projectileStyle }).id,
    'projectile/' + species + '/' + profile.projectileStyle,
  );
}

// PR #146 may expand the rogue repertoire before integration. Keys depend on
// real tier/role and basic-vs-signature, NOT mutable display names, geometry
// or whether the rogue signature uses scatter, sweep, bind, pivot or rally.
for (const [enemy, key] of [
  [{ type: 'boss', family: 'thorn', form: 'normal' }, 'rogue/boss/thorn'],
  [{ type: 'boss', family: 'thorn', form: 'true' }, 'rogue/boss/thorn'],
  [{ captain: true, captainProfile: 'supply-vale' }, 'rogue/captain/supply-vale'],
  [{ species: 'wolf', form: 'ringleader', ranged: false }, 'rogue/ringleader/melee/wolf'],
  [{ species: 'wolf', form: 'ringleader', ranged: true }, 'rogue/ringleader/ranged/wolf'],
  [{ species: 'goblin', guard: true, ranged: true }, 'rogue/guardian/ranged/goblin'],
  [{ species: 'mireling', ranged: false }, 'rogue/ordinary/melee/mireling'],
]) {
  for (const signature of [false, true]) {
    const move = { rogueMove: true, rogueSignature: signature, kind: 'circle', name: 'old label' };
    const first = VFX.describe(enemy, move);
    assert.equal(first.id, key + '/' + (signature ? 'signature' : 'basic'));
    assert.equal(
      VFX.describe(enemy, { ...move, name: 'new label', kind: 'cone', radius: 900 }).id,
      first.id,
    );
  }
}
assert.equal(
  VFX.describe({ type: 'boss', family: 'thorn' }, { rogueMove: true, kind: 'circle' }).id,
  'rogue/boss/thorn/basic',
);

// This becomes an automatic 40-signature coverage gate as soon as the
// concurrent rogue-repertoire PR lands. Old main intentionally has no table.
const tactics = R.tacticalFoundation;
for (const [role, speciesProfiles] of Object.entries(tactics.rogueRingleaderSignatures || {})) {
  for (const [species, profile] of Object.entries(speciesProfiles)) {
    const signature = VFX.describe(
      { form: 'ringleader', species, ranged: role === 'ranged' },
      { rogueMove: true, rogueSignature: true, kind: 'circle', name: profile.name },
    );
    assert.equal(signature.id, 'rogue/ringleader/' + role + '/' + species + '/signature');
  }
}
for (const [kind, profiles] of Object.entries(tactics.rogueSignatures || {})) {
  for (const [id, profile] of Object.entries(profiles)) {
    const actor =
      kind === 'boss' ? { type: 'boss', family: id } : { roomCaptain: true, captainProfile: id };
    const signature = VFX.describe(actor, {
      rogueMove: true, rogueSignature: true, kind: 'circle', name: profile.name,
    });
    assert.equal(signature.id, 'rogue/' + (kind === 'boss' ? 'boss/' : 'captain/') + id + '/signature');
  }
}

// Future sprite/animated asset replacement occurs per stage. Missing stages,
// missing TRUE override, malformed assets and hostile paths must fail closed.
const boss = VFX.describe({ type: 'boss', family: 'thorn', form: 'true' }, { kind: 'cone', index: 0 });
const image = { type: 'sprite', spriteKey: 'vfx:thorn-pounce-windup' };
const sheet = { type: 'sprite', spriteKey: 'vfx:thorn-pounce-impact', clip: 'impact' };
const pilot = {
  version: 1,
  effects: {
    'boss/thorn/0': {
      stages: { windup: image, impact: sheet },
      variants: { true: { impact: { ...sheet, spriteKey: 'vfx:thorn-true-impact' } } },
    },
  },
};
const availableSprites = {
  'vfx:thorn-pounce-windup': {},
  'vfx:thorn-pounce-impact': { clips: { impact: { loop: false, frames: [] } } },
  'vfx:thorn-true-impact': { clips: { impact: { loop: false, frames: [] } } },
};
assert.deepEqual(VFX.validateManifest(pilot), []);
assert.equal(VFX.select(pilot, boss, 'windup', availableSprites).mode, 'sprite');
assert.equal(
  VFX.select(pilot, boss, 'impact', availableSprites).asset.spriteKey,
  'vfx:thorn-true-impact',
);
assert.equal(VFX.select(pilot, boss, 'travel', availableSprites).mode, 'procedural');
assert.equal(
  VFX.select(pilot, { ...boss, variant: 'normal' }, 'impact', availableSprites).asset.spriteKey,
  'vfx:thorn-pounce-impact',
);
assert.equal(VFX.select(pilot, boss, 'impact').mode, 'procedural', 'registry not ready');
assert.equal(VFX.select(pilot, boss, 'impact', {}).mode, 'procedural', 'unregistered resource');
assert.equal(
  VFX.select(pilot, boss, 'impact', { 'vfx:thorn-true-impact': { clips: {} } }).mode,
  'procedural',
  'missing approved clip',
);
for (const bad of [
  { ...image, spriteKey: '../sprites/exploit.png' },
  { ...image, spriteKey: 'https://example.com/bad.png' },
  { ...image, spriteKey: 'sprites:external' },
  { ...sheet, clip: '../run' },
  { ...sheet, scale: 0 },
  { ...sheet, frames: 200 },
  { ...image, src: 'assets/vfx/unapproved.png' },
]) {
  assert(!VFX.validAsset(bad));
  const broken = { version: 1, effects: { 'boss/thorn/0': { stages: { impact: bad } } } };
  assert(VFX.validateManifest(broken).length);
  assert.equal(VFX.select(broken, boss, 'impact', availableSprites).mode, 'procedural');
}
assert.equal(VFX.select(pilot, null, 'impact').mode, 'procedural');
assert.equal(VFX.describe(null, null), null);

console.log('PASS VFX foundation: authored boss/captain/night/ranged inventory; rogue-ready stable IDs; stage and sprite/animation fallback');
