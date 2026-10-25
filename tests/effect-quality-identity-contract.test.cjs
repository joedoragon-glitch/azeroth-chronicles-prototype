'use strict';
// Stage 5.2 Phase B — source-authored identity protection register.
// This TEST-ONLY inventory does not add a runtime graphics quality setting,
// select an optional effect, reduce particle budgets, or alter gameplay.
// Audited ability/action identity != every drawable particle: submotifs may
// later be approved as optional only after separate pixel/meaning evidence.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Hero = require('../src/prototype/hero-presentation.js');
const EnemyArt = require('../src/prototype/enemy-vfx-art.js');

const heroClasses = ['paladin', 'mage', 'ranger'];
const bossNames = Campaign.data.bosses.map(({ id }) => id);
const captainNames = [
  'supply-vale', 'supply-march', 'supply-highlands',
  'supply-crown', 'frontier-overseer',
];
const ordinarySpecies = [
  'wolf', 'goblin', 'skeleton', 'reedbeast', 'mireling', 'ogre',
  'orc', 'archer', 'crownguard', 'ashbeast', 'wraith', 'stalker',
];
const registered = new Map();
function protect(identity, category, metadata) {
  assert(!registered.has(identity), 'duplicate authored VFX identity: ' + identity);
  assert(metadata && typeof metadata === 'object',
    'no existing source material for ' + identity);
  // IMPORTANT: classify the whole *action*, not its ornamental particles.
  registered.set(identity, Object.freeze({
    category,
    admission: 'protected',
    optionalWholeEffect: false,
    optionalDetail: 'unreviewed',
  }));
}

// Three classes, eight slots, tap/charged: all 48 ability forms.
// The cast stage of a real ability may deliberately paint nothing: its
// projectile, area or persistent state is still information-critical.
for (const cls of heroClasses) {
  const rows = Hero.catalog[cls];
  assert.equal(rows?.length, 8, cls + ' did not have eight authored skills');
  for (let slot = 1; slot <= 8; slot++) {
    assert.equal(rows[slot - 1].length, 2,
      cls + ' slot ' + slot + ' missing normal/charged visual identity');
    for (const charged of [false, true]) {
      const p = Hero.profile({ class: cls, slot, charged });
      assert(p?.motif && p?.colors?.length === 2,
        cls + '/' + slot + '/' + charged + ' has no material profile');
      protect('hero/' + cls + '/' + slot + '/' + (charged ? 'charged' : 'normal'),
        'hero-ability', p);
    }
  }
}

// All 11 boss-families retain *both* pet skill identities. A future
// Performance tier may trim separately reviewed interior particles, but not
// suppress the pet's real release/contact, ward/heal or physical projectile.
assert.equal(bossNames.length, 11, 'pet family inventory changed: review explicitly');
for (const id of bossNames) {
  for (let slot = 1; slot <= 2; slot++) {
    const material = EnemyArt.petRecipe(id, slot);
    assert(material?.action && material?.colors?.length === 2,
      id + ' pet slot ' + slot + ' is missing the existing material');
    protect('pet/' + id + '/' + slot, 'pet-ability', material);
  }
}

// Inspect *every currently authored visual form*, including non-damaging
// phases/calls/seals. A boss's visual form is NOT necessarily a ground
// warning or damage attack and must not be represented as one.
assert.deepEqual(Object.keys(EnemyArt.boss).sort(), [...bossNames].sort(),
  'boss-art identities and canonical boss families drifted');
for (const [family, rows] of Object.entries(EnemyArt.boss)) {
  for (let i = 0; i < rows.length; i++) {
    const identity = 'boss/' + family + '/' + i;
    const material = EnemyArt.recipe({ id: identity, variant: 'normal' });
    assert(material?.action && material?.colors?.length === 2,
      identity + ' has no existing visual recipe');
    protect(identity, 'boss-authored-form', material);
  }
  protect('boss/' + family + '/basic', 'boss-basic',
    EnemyArt.recipe({ id: 'boss/' + family + '/basic' }));
}

// The five named captain rosters, their basics and phases all retain their
// authored identities. Do not infer their attack timing from an art row.
assert.deepEqual(Object.keys(EnemyArt.captains).sort(), [...captainNames].sort(),
  'captain-art identities changed; review before allowing suppression');
for (const [family, rows] of Object.entries(EnemyArt.captains)) {
  for (let i = 0; i < rows.length; i++) {
    const identity = 'captain/' + family + '/' + i;
    const material = EnemyArt.recipe({ id: identity });
    assert(material?.action && material?.colors?.length === 2,
      identity + ' has no existing visual recipe');
    protect(identity, 'captain-authored-form', material);
  }
  for (const stage of ['basic', 'phase']) {
    const identity = 'captain/' + family + '/' + stage;
    protect(identity, 'captain-' + stage, EnemyArt.recipe({ id: identity }));
  }
}

// These ordinary species use discrete authored action/material recipes. A
// generic impact flash or priority=1 does NOT authorize deletion of all
// corresponding enemy feedback. Coverage here is of listed basic species,
// not the combinatorial enemy-stage, rogue, night or projectile catalog.
for (const species of ordinarySpecies) {
  const identity = 'enemy/' + species + '/basic';
  const material = EnemyArt.recipe({ id: identity });
  assert(material?.action && material?.colors?.length === 2,
    identity + ' has no existing material');
  protect(identity, 'ordinary-basic', material);
}

// Direct gameplay-owned channels never become optional just because they
// lack a queued transient identity or because quality prefers less ornament.
const directState = [
  'attack-warning-boundary', 'attack-warning-safe-gap',
  'active-hazard-footprint', 'trap-active-area', 'actual-projectile-flight',
  'projectile-contact-timing', 'cast-progress-clock',
  'silence-status', 'taunt-status', 'slow-status', 'selected-target-status',
  'ward-status', 'rally-status', 'healing-recipient-feedback',
];
for (const identity of directState)
  protect('state/' + identity, 'direct-state-information', { source: 'combat state' });

// Prospective policy must be conservative: an unknown cue is not decorative,
// and neither a lower event priority nor its owner is permission to suppress.
function decision(identity, proposedReason = '') {
  const row = registered.get(identity);
  if (row) return row;
  return Object.freeze({
    category: 'unclassified',
    admission: 'protected-until-reviewed',
    optionalWholeEffect: false,
    optionalDetail: 'unreviewed',
    proposedReason,
  });
}
for (const value of [
  'enemy/unknownSpecies/1', 'rogue/captain/new/2', 'projectile/newSpecies/spit',
  'hero/mage/9/normal', 'pet/unseen/1', 'enemyVfx',
]) {
  const result = decision(value, 'low priority or unrecognized');
  assert.equal(result.admission, 'protected-until-reviewed',
    'unknown cue was incorrectly designated optional');
  assert.equal(result.optionalWholeEffect, false,
    'unreviewed visual cannot be suppressed wholesale');
}
for (const [id, row] of registered) {
  assert.equal(decision(id), row);
  assert.equal(row.optionalWholeEffect, false,
    id + ' was accidentally approved for whole-identity suppression');
}
const count = (prefix) => [...registered.keys()].filter(x => x.startsWith(prefix)).length;
assert.equal(count('hero/'), 48);
assert.equal(count('pet/'), 22);
assert.equal(count('state/'), directState.length);
assert.equal(count('enemy/'), 12);
assert([...registered.keys()].some(s => s.startsWith('captain/')));
assert([...registered.keys()].some(s => s.startsWith('boss/')));
console.log('PASS Stage 5.2 Phase B source identity protection baseline ' +
  JSON.stringify({
    heroForms: count('hero/'),
    petSkillForms: count('pet/'),
    bossVisualFormsAndBasics: count('boss/'),
    captainVisualFormsBasicsAndPhases: count('captain/'),
    ordinaryBasicSpecies: count('enemy/'),
    directStateChannels: count('state/'),
    totalProtected: registered.size,
    optionalWholeEffectsApproved: 0,
    unrecognizedPolicy: 'protected-until-reviewed',
  }) +
  '. Test-only authoring catalog, not a graphics-tier feature, every enemy ' +
  'variant, visual pixel comparison or real-device performance result.');
