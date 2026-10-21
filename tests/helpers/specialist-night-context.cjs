'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../../src/prototype/engine');

// A fresh Nightmare campaign is sunset, even when a fixture advances enemies.
// Keep all three Nightmare entry contracts explicit in specialist matrices.
const contexts = ['normal', 'nightmare-grace', 'nightmare-night', 'nightmare-legacy'];
function campaign(context = 'normal', heroClass = 'mage', random = () => 0.9, options = {}) {
  assert(contexts.includes(context), 'explicit specialist phase: ' + context);
  const nightmare = context !== 'normal';
  let c = new Campaign(nightmare ? 'nightmare' : 'normal', heroClass, random, options);
  if (nightmare) {
    assert.equal(c.s.nightmareIntroRemaining, Campaign.rules.dayCycle.twilightSeconds);
    assert.equal(c.night(), false, 'fresh Nightmare begins in grace');
    if (context === 'nightmare-night') c.advanceDaylight(c.s.nightmareIntroRemaining);
    if (context === 'nightmare-legacy') {
      const saved = c.snapshot();
      delete saved.nightmareIntroRemaining;
      delete saved.victoryDawnRemaining;
      c = Campaign.restore(saved, random);
      assert(c, 'legacy specialist save restores');
    }
  }
  const night = context === 'nightmare-night' || context === 'nightmare-legacy';
  assert.equal(c.night(), night, context + ' has the intended phase');
  assert.equal(c.daylightPhase().phase, nightmare ? (night ? 'night' : 'sunset') : 'day');
  assert.equal(c.s.nightmareIntroRemaining, context === 'nightmare-grace' ? 30 : 0);
  assert.equal(c.multipliers().hp, night ? 1.1 : 1);
  assert.equal(c.multipliers().damage, night ? 1.15 : 1);
  assert.equal(c.nightTempo(), night ? 1.1 : 1);
  return c;
}
module.exports = { contexts, campaign };
