'use strict';
// Existing deterministic combat fixtures assert the authored hit geometry,
// cooldowns, damage and status effects independent of the newly added Block
// probability. This switch is scoped to the test process, never production.
module.exports = function isolateSkillBlockForLegacySuite() {
  const Campaign = require('../../src/prototype/engine.js');
  if (typeof Campaign.prototype.skillBlocks !== 'function')
    throw Error('Missing skill block resolver in legacy combat fixture');
  Campaign.prototype.skillBlocks = () => false;
};
