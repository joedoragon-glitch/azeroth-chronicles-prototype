'use strict';
// Existing deterministic combat fixtures assert the authored hit geometry,
// cooldowns, damage and status effects independent of the newly added Dodge
// probability. This switch is scoped to the test process, never production.
module.exports = function isolateSkillEvasionForLegacySuite() {
  const Campaign = require('../../src/prototype/engine.js');
  if (typeof Campaign.prototype.skillEvades !== 'function')
    throw Error('Missing skill evasion resolver in legacy combat fixture');
  Campaign.prototype.skillEvades = () => false;
};
