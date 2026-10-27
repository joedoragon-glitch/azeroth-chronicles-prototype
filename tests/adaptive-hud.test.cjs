'use strict';
// Focused presentation-only contract for optional Adaptive mobile HUD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Input = require('../src/prototype/input');
const { shell } = require('./helpers/production-shell.cjs');

const low = Input.adaptiveHudLowHealth;
assert.equal(low(37, 180), true, 'injured Ranger at Millhaven is visibly at low HP');
assert.equal(low(54, 180), true, '30% enters low HP');
assert.equal(low(60, 180, true), true, 'low HP persists until above 35%');
assert.equal(low(64, 180, true), false, '35% recovery exits low HP');
assert.equal(low(100, 180), false);
assert.equal(low(1, 0), false, 'invalid maximum cannot produce false urgency');

const classify = Input.adaptiveHudPresentation;
const idle = classify({ hp: 160, maxHp: 180 }, null, 0);
assert.equal(idle.context, 'explore');
assert.equal(idle.pressure, false);
assert.equal(idle.target, false);
const nearNPC = classify({ hp: 37, maxHp: 180, interactable: true }, idle, 100);
assert.equal(nearNPC.context, 'interact');
assert.equal(nearNPC.lowHP, true, 'low health coexists with friendly interaction');
assert.equal(nearNPC.pressure, false);
const danger = classify({ hp: 37, maxHp: 180, threat: true, interactable: true }, nearNPC, 200);
assert.equal(danger.context, 'combat', 'threat beats interaction for visual priority');
assert.equal(danger.pressure, true);
const after = classify({ hp: 37, maxHp: 180 }, danger, 1200);
assert.equal(after.pressure, true, 'danger styling does not instantly flicker away');
assert.equal(classify({ hp: 37, maxHp: 180 }, after, 2300).pressure, false);
for (const key of ['target', 'targetLocked', 'charging', 'queued', 'targetPress']) {
  const active = classify({ hp: 180, maxHp: 180, [key]: true }, null, 0);
  assert(active.pressure, key + ' keeps learned combat controls prominent');
}
assert.equal(classify({ hp: 180, maxHp: 180, navigation: true }, null, 0).context, 'travel');
assert.equal(classify({ hp: 180, maxHp: 180, navigation: true, menu: true }, null, 0).context, 'menu');
assert.equal(classify({ hp: 180, maxHp: 180, tutorialRecall: true }, null, 0).recall, true);

// Exercise the production HUD code in its phone presentation, not just helpers.
const storage = new Map([['azeroth-screen-v1', 'phone']]);
const { scope, elements } = shell('en', 'ranger', { storage });
const g = scope.Prototype.game;
assert.equal(scope.Prototype.input.preferences.hudStyle, 'classic', 'Classic remains the default');
scope.Prototype.input.select('hudStyle', 'adaptive');
scope.document.body.dataset.hudStyle = 'adaptive';
g.zone().enemies = [];
g.zone().npcs = [];
g.zone().nodes = [];
g.zone().buildings = [];
g.s.projectiles = [];
g.s.hazards = [];
g.hero.hp = 37;
g.hero.maxHp = 180;
scope.Prototype.updateHUD();
assert.equal(scope.document.body.dataset.hudPressure, 'quiet');
assert.equal(scope.document.body.dataset.hudLowHp, 'true');
assert((elements.get('hero-stats').innerHTML || '').includes('LOW HP'), 'visible textual low-HP label');
assert.equal(elements.get('skill-1').disabled, false, 'idle ATK is never disabled');
assert.equal(elements.get('target-button').hidden, false, 'target command is still available');
assert.equal(elements.get('recall-button').hidden, false, 'recall command is still available');
assert.equal(elements.get('menu-button').hidden, false, 'Menu remains one tap away');
g.hero.hp = 80;
scope.Prototype.updateHUD();
assert.equal(scope.document.body.dataset.hudLowHp, 'false', 'recovery removes warning');

const css = fs.readFileSync(path.join(__dirname, '../styles/phone.css'), 'utf8');
const adaptiveCss = css.slice(css.indexOf('/* Phase 2 adaptive HUD'));
assert(adaptiveCss.includes("[data-hud-style='adaptive']"), 'all new styling gated behind opt-in');
assert(!/^\s*(?:display|visibility|pointer-events|position|left|right|top|bottom|width|height|transform|padding)\s*:/m.test(adaptiveCss),
  'adaptive styling changes emphasis, not geometry, visibility or touch ownership');
console.log('PASS Adaptive HUD contexts, thresholds, hysteresis, phone readout and non-destructive styles');
