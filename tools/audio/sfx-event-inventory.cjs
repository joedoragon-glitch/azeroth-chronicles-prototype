'use strict';
// READ-ONLY reproducible audio source inventory for #877. Never alters gameplay.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const manifest = require(path.join(root, 'assets/audio/manifest.json'));
const hero = require(path.join(root, 'src/prototype/hero-presentation.js'));
const enemy = require(path.join(root, 'src/prototype/enemy-presentation.js'));

const entries = Object.entries(manifest.assets);
const counts = entries.reduce((acc, [, a]) => {
  acc[a.kind] = (acc[a.kind] || 0) + 1;
  return acc;
}, {});
const events = Object.entries(manifest.director.events);
const recorded = events.filter(([, rules]) => rules.length);
const unbound = events.filter(([, rules]) => !rules.length);
const materialPairs = [
  'steel','claw','bone','stone','wet','arrow','spectral','ash',
  'holy','arcane','root','dust',
].map(material => ({
  material,
  release: 'sfx-' + material + '-release',
  impact: 'sfx-' + material + '-impact',
}));
for (const pair of materialPairs) {
  assert(manifest.assets[pair.release]?.kind === 'effect', pair.release);
  assert(manifest.assets[pair.impact]?.kind === 'effect', pair.impact);
}
const heroClasses = Object.entries(hero.catalog).map(([classId, slots]) => {
  assert(slots.length === 8, classId + ' needs all eight supported skill slots');
  const basic = hero.profile({ class: classId, slot: 1, automaticBasic: true, combo: 1 });
  assert(basic?.name && basic?.material, classId + ' missing independent basic attack');
  return {
    class: classId,
    automaticBasic: { name: basic.name, motif: basic.motif, material: basic.material },
    skills: slots.map((forms, i) => ({
      slot: i + 1,
      tap: { name: forms[0][0], motif: forms[0][1], material: forms[0][2] },
      charged: { name: forms[1][0], motif: forms[1][1], material: forms[1][2] },
    })),
  };
});
assert(heroClasses.length === 4, 'Four published classes must remain supported');
assert(counts.music === 84 && counts.ambience === 34 && counts.effect === 30);
assert(events.length === 95 && recorded.length === 8 && unbound.length === 87);
const report = {
  scope: 'main-source manifest and current hero/enemy presentation source, not a verified build',
  caution: 'An unbound event-key entry can be procedural OR intentionally silent; counts do not imply missing/broken sounds. Hero profiles do not imply every possible stage produces a sound.',
  counts: { registered: entries.length, ...counts,
    manifestEventKeys: events.length, keysWithRecordedBindings: recorded.length,
    unboundProceduralOrSilentKeys: unbound.length,
    physicalRecordedEffectFiles: counts.effect, heroBasicAttackProfiles: 4,
    heroTapAndChargedProfiles: 64 },
  recordedEventKeys: recorded.map(([event, rules]) => ({
    event,
    rules: rules.map(r => ({ asset: r.asset, when: r.when, bus: r.bus, gain: r.gain })),
  })),
  unboundEventKeys: unbound.map(([key]) => key),
  recordedMaterialPairs: materialPairs,
  recordedSpecials: [
    'sfx-critical-warning','sfx-hero-steel-swing','sfx-hero-steel-impact',
    'sfx-power-strike','sfx-holy-cleave','sfx-piercing-volley',
  ],
  heroClasses,
  enemyProfileFamilies: {
    species: enemy.species, bossFamilies: enemy.families,
    captains: enemy.captains, projectileStyles: enemy.styles,
  },
  boundaries: [
    'Do not change existing 4-class behavior, ability stages, campaign or saves.',
    'No enemy hit on a miss. Windup/release/contact and warning are separate events.',
    'Recordings are conditional and cold assets use immediate procedural fallback.',
    'Never merge or publish experimental WAVs without new owner authorization.',
  ],
};
console.log(JSON.stringify(report, null, 2));
