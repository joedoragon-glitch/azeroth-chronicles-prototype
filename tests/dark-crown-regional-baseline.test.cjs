'use strict';
// Dark Crown overhaul Stage 0. Native Campaign/Canvas evidence, not a
// proposed art render, Pixi acceptance, physical-phone check, or lore change.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const Visuals = require('../src/prototype/visuals.js');
const Combat = require('../src/prototype/combat-visuals.js');

const root = path.join(__dirname, '..', 'test-artifacts', 'environment-708', 'dark-crown-707');
fs.mkdirSync(root, { recursive: true });
// Dedicated generated-evidence directory: never retain stale frames in a
// local rerun's new scene index or screenshot archive.
for (const filename of fs.readdirSync(root)) {
  if (filename.endsWith('.png') || filename === 'scene-index.json') {
    fs.unlinkSync(path.join(root, filename));
  }
}
// GitHub Actions often tests PRs at a synthetic merge SHA; record the actual
// feature-branch and base heads independently when the event file is present.
let prHeadSha = null;
let prBaseSha = null;
try {
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    prHeadSha = event.pull_request?.head?.sha || null;
    prBaseSha = event.pull_request?.base?.sha || null;
  }
} catch (error) {
  console.warn('Dark Crown provenance: event metadata unreadable:', error.message);
}
const rules = Campaign.rules;
assert.equal(Campaign.data.regions[4].id, 'crown', 'Keep the original fifth-region ID');
const crownSites = rules.sites[4];
assert.deepEqual(
  crownSites.filter(s => s[0].startsWith('bridge-')).map(s => s[0]).sort(),
  ['bridge-north', 'bridge-south'],
  'The two canonical volcanic crossing site IDs remain distinct',
);
assert(crownSites.some(s => s[0] === 'foundry' && s[2] === 1850 && s[3] === 2700),
  'Original Foundry arrival site is a protected baseline, not a new entrance');
const foundry = rules.sideDungeons.find(s => s.id === 'side-crown-foundry');
assert(foundry && foundry.region === 'crown' && foundry.site === 'foundry');
assert.equal(foundry.size, 1100, 'Foundry original internal floor envelope');
assert.equal(foundry.enemyCount, 14, 'Record current combat configuration; not worker population');
assert.equal(rules.crownThermalWorksScenes.length, 15,
  'Existing heatworks are fifteen authored objects, not a proved pipe network');

const candidates = [
  // First-visit city, home, heat, freight, geology, crossings and regime.
  ['arrival', 'crown', 690, 430, 245],
  ['ridge-skyline', 'crown', 1040, 240, 245],
  ['civic-court', 'crown', 600, 700, 245],
  ['courtyard-housing-baseline', 'crown', 720, 900, 245],
  ['ash-refuge', 'crown', 1030, 1840, 245],
  ['east-heat-intake', 'crown', 2770, 710, 245],
  ['west-glassworks', 'crown', 2290, 2130, 245],
  ['bridge-north', 'crown', 1350, 1000, 245],
  ['bridge-south', 'crown', 1350, 2400, 245],
  ['market-freight', 'crown', 850, 1400, 245],
  ['foundry-exterior', 'crown', 1850, 2700, 245],
  ['cindermaw-ministry', 'crown', 740, 520, 245],
  ['cindermaw-den', 'crown', 2580, 1900, 245],
  ['crystal-dispatch', 'crown', 1250, 2350, 245],
  ['orrery', 'crown', 1850, 3150, 245],
  ['fortress-logistics', 'crown', 3060, 3040, 245],
  // Night variants: civilian comfort, industrial heat, official control.
  ['civic-night', 'crown', 600, 700, 480],
  ['heatworks-night', 'crown', 2770, 710, 480],
  ['fortress-night', 'crown', 3060, 3040, 480],
  // Interior production and circulation are not yet aesthetically accepted.
  ['foundry-entry', 'side-crown-foundry', 330, 260, 245],
  ['foundry-workfloor', 'side-crown-foundry', 745, 755, 245],
  ['citadel-academy', 'citadel', 630, 955, 245],
  ['cindermaw-treasury', 'supply-crown', 535, 350, 245],
];
const records = [];
for (const [label, zoneId, x, y, clock] of candidates) {
  const game = new Campaign('normal', 'paladin', () => 0.73);
  assert(game.enter(zoneId), 'Existing zone is enterable: ' + zoneId);
  const zone = game.zone();
  game.s.clock = clock;
  // Collision-safe teleport for CAMERA RECONNAISSANCE only. It does not
  // demonstrate that a player can reach this point through normal gameplay.
  const safe = game.safe(x, y, zoneId);
  assert(safe && Number.isFinite(safe.x) && Number.isFinite(safe.y),
    'Native collision-safe photographic camera point: ' + label);
  Object.assign(game.hero, safe);
  for (const [viewport, width, height] of [['desktop', 880, 560], ['narrow', 390, 680]]) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const before = JSON.stringify(game.s);
    const painter = Renderer.create({
      canvas: { width, height }, ctx, getGame: () => game,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: (w, h) => ({ x: w * 0.56, y: h * 0.52 }),
      },
      Campaign, PrototypeVisuals: Visuals, PrototypeCombatVisuals: Combat,
      chargePresentation: () => null, isPaused: () => false, now: () => 16000,
    });
    painter.setOptimizationMode(false);
    painter.draw();
    assert.equal(JSON.stringify(game.s), before,
      'Native screenshot render must never mutate gameplay/save: ' + label);
    const bytes = canvas.toBuffer('image/png');
    assert(bytes.length > 5000, 'Real scene should paint at ' + label + '/' + viewport);
    const filename = label + '-' + viewport + '.png';
    fs.writeFileSync(path.join(root, filename), bytes);
    const nearby = objects => (objects || []).filter(o =>
      Number.isFinite(o.x) && Number.isFinite(o.y) &&
      Math.hypot(o.x - safe.x, o.y - safe.y) <= 430);
    records.push({
      label, zoneId, viewport, width, height, zoom: 1.5, clock,
      requestedFocus: [x, y], actualCamera: [safe.x, safe.y],
      viewNameIsIntentNotVerifiedLandmark: true,
      traversedToView: false, compositionReviewedByTest: false,
      focusDisplacement: Math.round(Math.hypot(x - safe.x, y - safe.y)),
      nearbyProps: nearby(zone.props).length,
      nearbyNpcs: nearby(zone.npcs).map(n => n.id),
      nearbyEnemies: nearby(zone.enemies.filter(e => e.hp > 0)).length,
      pngBytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      renderer: 'native Canvas2D', phoneScaleOnly: viewport === 'narrow',
    });
  }
}
assert.equal(records.length, candidates.length * 2);

const room = new Campaign('normal', 'paladin', () => 0.73);
assert(room.enter('side-crown-foundry'));
const existing = room.zone();
const enemyIds = existing.enemies.map(e => e.id).sort();
const wallIds = existing.props.filter(p => p.id.startsWith('side-wall-')).map(p => p.id).sort();
assert.equal(wallIds.length, foundry.walls.length, 'Preserve current Foundry collision columns');
const restored = Campaign.restore(room.snapshot());
assert(restored.enter('side-crown-foundry'));
assert.deepEqual(restored.zone().enemies.map(e => e.id).sort(), enemyIds,
  'Original interior enemy identities survive save/restore');
assert.deepEqual(restored.zone().props.filter(p => p.id.startsWith('side-wall-'))
  .map(p => p.id).sort(), wallIds, 'Original Foundry obstacles survive save/restore');

fs.writeFileSync(path.join(root, 'scene-index.json'), JSON.stringify({
  source: 'Dark Crown PR #707; actual game Campaign and Canvas2D code',
  status: 'Unverified candidate viewpoints for BEFORE-state reconnaissance; not final design boards or composition coverage proof',
  pixelDeterminismVerified: false,
  pngSha256Meaning: 'per-run evidence integrity only; do not use as a cross-run pixel equality assertion',
  provenance: {
    githubCheckoutSha: process.env.GITHUB_SHA || null,
    githubPrHeadSha: prHeadSha,
    githubPrBaseSha: prBaseSha,
    githubWorkflowRunId: process.env.GITHUB_RUN_ID || null,
    localRunWithoutCiMetadata: !process.env.GITHUB_SHA,
  },
  captureMethod: 'collision-safe hero teleport, fixed initial RNG and clock, Canvas2D, custom 150% camera anchor, optimization mode disabled; no cross-run pixel identity, player traversal, Pixi, image-content assertion or physical phone',
  regionSourceId: 'crown', foundrySourceId: 'side-crown-foundry',
  scenes: candidates.length, captures: records.length, records,
}, null, 2) + '\n');
console.log('PASS Dark Crown Stage 0: ' + candidates.length +
  ' Canvas2D candidate camera positions x 2 viewports, Foundry ID/walls/enemies preserved');
