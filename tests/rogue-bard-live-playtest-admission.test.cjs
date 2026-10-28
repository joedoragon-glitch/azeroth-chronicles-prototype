'use strict';
// Quiet public release: the browser admits Rogue before save loading and class
// selection; isolated native fixtures preserve three-class baseline tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const World = require('../src/prototype/critical-world-native.js');
const R = Campaign.rules;

assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
assert.equal(Campaign.talentProfiles.rogue, undefined);
assert.equal(R.movementBasicClasses.rogue, undefined);
assert.throws(() => new Campaign('normal', 'rogue'), /Unknown mode or class/);
const defaults = Object.fromEntries(['paladin', 'mage', 'ranger'].map(
  (cls) => [cls, JSON.stringify(Campaign.classes[cls])],
));

try {
  assert.equal(Campaign.enableRoguePlaytest(), true);
  assert.equal(Campaign.enableRoguePlaytest(), false, 'admission is idempotent');
  assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger', 'rogue']);
  assert.deepEqual(Campaign.talentProfiles.rogue, R.rogueHeroFoundation.talents);
  assert.equal(R.movementBasicClasses.rogue, true);
  assert.equal(Campaign.classes.rogue.icon, 'jingle-bell');
  // The original emoji was a non-spherical handbell. Prevent a canon slip
  // in the registry even when the hero sprite itself remains correct.
  for (const cls of ['paladin', 'mage', 'ranger'])
    assert.equal(JSON.stringify(Campaign.classes[cls]), defaults[cls],
      'existing class definition preserved');

  for (const mode of ['normal', 'nightmare', 'developer']) {
    const g = new Campaign(mode, 'rogue', () => 0.9);
    assert.equal(g.hero.class, 'rogue');
    assert.equal(g.s.party.length, 0, 'Charm-first Rogue starts without hired allies');
    assert.equal(g.hero.skills[0], 1);
    Native.attachCampaign(g, Critical, Levels, World, { enabled: true });
    assert.equal(g._criticalPartyNative.criticalLevels().rogue, 2);
    assert.doesNotThrow(() => Campaign.validate(g.snapshot()));
    const restored = Campaign.restore(g.snapshot(), () => 0.9);
    assert.equal(restored.hero.class, 'rogue');
    assert.equal(restored.s.version, 4, 'no new save schema');
    assert.equal(JSON.stringify(g.snapshot()).includes('rogueCriticalLevels'), false);
  }

  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.xp(g.xpRequired());
  assert.equal(g.hero.level, 2);
  assert(g.talentProfile()?.power > 0);
  g.hero.talentPoints++;
  assert.doesNotThrow(() => Campaign.validate(g.snapshot()));
  // Succession class roster and v4 save validation now recognize the fourth class.
  const s = new Campaign('normal', 'paladin', () => 0.9, { succession: true });
  assert.equal(Object.keys(Campaign.classes).length, 4);
  assert.equal(s.s.challenge.succession, true);
  assert.doesNotThrow(() => Campaign.validate(s.snapshot()));
  // Production UI registration must happen before profile load and class selection.
  const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
  assert.match(app, /Campaign\.enableRoguePlaytest\(\);/);
  assert(!/roguePlaytestEnabled|roguePlaytest=1/.test(app),
    'Rogue must appear in the ordinary public game without an opt-in URL');
  assert.match(app, /automatic basic hits may Charm surviving eligible monsters/,
    'New Game should explain Charm-first labor before play');
  assert(app.indexOf('Campaign.enableRoguePlaytest()') < app.indexOf('let loaded ='),
    'preview registry must be ready before loading a Rogue save');
  assert(app.includes('rogueJingleIconSvg') &&
    app.includes("a.classId === 'rogue'") &&
    app.includes("h.class === 'rogue' ? rogueJingleIconSvg"),
    'one simple jingle-ball icon must cover class select, Succession and HUD');
  assert(app.includes('Sticky Shuffle / Briar Boogie'),
    'Skill 5 placed music station must appear in real skill controls');
  assert(!/rogueCriticalMenu|rogueCriticalLevels/.test(app),
    'playable class does not turn developer critical intensity into a player setting');
  console.log('PASS Rogue quiet public admission: normal URL, four classes, controls, v4 save, growth, Succession isolation');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
  delete R.movementBasicClasses.rogue;
}
