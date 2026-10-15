'use strict';
const assert = require('node:assert/strict');
// Use the physical ending interaction in tests whose fixture already earned
// the victories. Keep the caller's location for subsequent local assertions.
module.exports = function claimThrone(c) {
  const region = c.zoneId;
  c.enter('crown');
  const throne = c.zone().npcs.find((n) => n.id === 'dark-crown-throne');
  Object.assign(c.hero, { x: throne.x, y: throne.y });
  assert(c.interact(throne), 'earned victories still require the actual throne');
  if (region !== 'crown') c.enter(region);
};
