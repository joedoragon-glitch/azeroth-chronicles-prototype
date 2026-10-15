'use strict';
// A frozen renderer comparison uses one current Campaign/content graph with
// three different renderer/cache pipelines. Never load the old Campaign graph
// against a current engine that requires owners absent from that old release.
const inventory = require('./site-assets.cjs').scripts;
const campaign = inventory.slice(1, inventory.indexOf('src/prototype/engine.js') + 1);
const presentation = [
  'visuals',
  'combat-visuals',
  'hero-presentation',
  'enemy-vfx-art',
  'sprite-format',
  'sprites',
  'material-contract',
  'materials',
  'ground-cache',
  'renderer',
].map((n) => 'src/prototype/' + n + '.js');
module.exports = { campaign, files: campaign.concat(presentation) };
