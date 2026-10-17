'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');

const plans = {
  // The safe-placement owner deliberately skips the burned-hamlet willow (10)
  // during initial world construction. Settled v4 geometry admits it on migration.
  frontier: { target: 49, authored: 50, migrated: 50, skipped: [10], kind: 'regionalRecovery', types: 6 },
  crown: { target: 15, authored: 15, migrated: 15, skipped: [], kind: 'thermalPurpose', types: 7 },
};
for (const mode of ['normal', 'nightmare']) {
  for (const [region, goal] of Object.entries(plans)) {
    const game = new Campaign(mode, 'paladin', () => 0.9);
    game.enter(region);
    const zone = game.zone(),
      additions = zone.props.filter((p) => p.id.startsWith('recovery-heat-'));
    const authored = region === 'frontier' ? Campaign.rules.frontierRecoveryScenes : Campaign.rules.crownThermalWorksScenes;
    assert.equal(authored.length, goal.authored, 'the complete authored plan is retained');
    assert.deepEqual(authored.flatMap((_, j) => additions.some(p => p.id === 'recovery-heat-' + region + '-' + j) ? [] : [j]), goal.skipped,
      'only the specifically reviewed unsafe initial placement may be skipped');
    assert.equal(additions.length, goal.target, region + ': authored world scenes all placed');
    assert.equal(additions.filter((p) => p[goal.kind]).length, goal.target);
    assert.equal(new Set(additions.map((p) => p.structure)).size, goal.types);
    assert.equal(new Set(additions.map((p) => p.id)).size, goal.target);
    assert(additions.every((p) =>
      p.decorative && p.r === 0 && !game.blocked(p.x, p.y, region, 17, true)),
    region + ': no solid plants or lava-adjacent furnaces inside impassable terrain');
    assert(additions.every((p) => game.distanceToRoad(zone, p) >= 56),
      region + ': recovery does not spill onto the road');
    const before = additions.map((p) => [p.id, p.x, p.y]);
    game.zone();
    assert.deepEqual(zone.props.filter((p) => p.id.startsWith('recovery-heat-'))
      .map((p) => [p.id, p.x, p.y]), before, 'region reads are stable');

    // An existing v4 zone without this cosmetic version acquires only scene
    // dressing. Preserve the hero, collected resources, and defeated enemies.
    const old = game.snapshot(), z = old.zones[region];
    const dead = z.enemies.find((e) => e.hp > 0);
    if (dead) { dead.hp = 0; dead.deathPaid = true; }
    z.props = z.props.filter((p) => !p.id.startsWith('recovery-heat-'));
    delete z.recoveryAndHeatVersion;
    const copy = Campaign.restore(old);
    copy.enter(region);
    const upgraded = copy.zone();
    assert.equal(upgraded.props.filter((p) => p.id.startsWith('recovery-heat-')).length,
      goal.migrated, 'v4 migration fills scene dressing exactly once');
    assert.equal(upgraded.enemies.find((e) => e.id === dead?.id)?.hp, dead?.hp,
      'historical kills are not resurrected');
    assert.equal(copy.hero.gold, game.hero.gold, 'heatworks do not mint new money');
    assert.equal(copy.hero.xp, game.hero.xp, 'heatworks do not grant XP');
    const stable = JSON.stringify(upgraded.props.filter((p) =>
      p.id.startsWith('recovery-heat-')));
    copy.zone();
    assert.equal(JSON.stringify(upgraded.props.filter((p) =>
      p.id.startsWith('recovery-heat-'))), stable);
  }
}

const frontier = Campaign.rules.frontierRecoveryScenes;
assert(frontier.filter((p) => p[2] === 'battlefield-poppies').length >= 10,
  'red poppies are a deliberate recovering battlefield feature');
assert(frontier.some((p) => p[2] === 'regrowth-birch') &&
  frontier.some((p) => p[2] === 'regrowth-willow') &&
  frontier.some((p) => p[2] === 'pioneer-grasses') &&
  frontier.some((p) => p[2] === 'mossy-basalt'),
  'war-torn landscape keeps heterogeneous natural succession');
const heat = Campaign.rules.crownThermalWorksScenes;
assert(heat.some((p) => p[2] === 'heated-washhouse') &&
  heat.some((p) => p[2] === 'geothermal-heat-intake') &&
  heat.some((p) => p[2] === 'crown-glass-kiln') &&
  heat.some((p) => p[2] === 'crown-ceramic-kiln'),
  'practical industry and public benefit co-exist');
for (const [, , structure] of [...frontier, ...heat]) {
  let fills = 0, strokes = 0;
  const brush = {
    save() {}, restore() {}, translate() {}, scale() {}, beginPath() {},
    moveTo() {}, lineTo() {}, bezierCurveTo() {}, quadraticCurveTo() {}, closePath() {}, ellipse() {}, arc() {},
    fill() { fills++; }, stroke() { strokes++; },
  };
  Visuals.draw(brush, { id: structure, renderKind: 'prop', structure,
    decorative: true, r: 0 }, { x: 80, y: 100 }, 3);
  assert(fills > 0 && strokes > 0, structure + ': actual illustrated body');
}
const renderer = fs.readFileSync(path.join(__dirname,
  '../src/prototype/renderer.js'), 'utf8');
assert(renderer.includes('thermal.test(structure)') &&
  /const nightSources = !nightNow\s*\? \[\]/.test(renderer),
  'heatworks share bounded night-only work lighting without daytime glows');
console.log('PASS 50 authored regrowth scenes (49 safe initial / 50 migrated), Crown thermal works (15), safe routes, artwork, old saves and night-only lighting');
