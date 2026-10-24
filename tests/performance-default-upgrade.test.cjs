'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { shell } = require('./helpers/production-shell.cjs');

const migrationKey = 'azeroth-performance-defaults-dev170-v1';
for (const language of ['en', 'es']) {
  const storage = new Map();
  const original = new Campaign('normal', 'mage', () => 0.5).snapshot();
  const savedCampaign = JSON.stringify(original);
  storage.set('azeroth-v4-normal', savedCampaign);
  storage.set('azeroth-fps-v1', language === 'en' ? '60' : 'auto60');
  storage.set('azeroth-adaptive-frame-skip-v1', 'off');
  storage.set('azeroth-render-resolution-v1', '50');
  storage.set('azeroth-optimization-mode-v1', 'on');
  storage.set('azeroth-camera-v2', JSON.stringify({ desktop: 1, phone: 1.75 }));
  storage.set('azeroth-screen-v1', 'phone');
  storage.set('unrelated-device-preference', 'keep-me');

  const first = shell(language, 'paladin', { storage });
  assert.equal(storage.get(migrationKey), 'applied', 'Upgrade is recorded once');
  assert.equal(first.scope.Prototype.fps.preference, 'auto');
  assert.equal(first.scope.Prototype.fps.target, 30);
  assert.equal(first.scope.Prototype.frameSkip.enabled, true);
  assert.equal(first.scope.Prototype.renderResolution.preference, 'auto');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'off');
  assert.equal(first.scope.Prototype.platform.preference, 'phone');
  assert.equal(first.scope.Prototype.platform.cameraZoom, 1.5);
  first.scope.Prototype.platform.select('desktop');
  assert.equal(first.scope.Prototype.platform.cameraZoom, 1.5);
  assert.equal(storage.get('azeroth-camera-v2'), '{"desktop":1.5,"phone":1.5}');
  assert.equal(storage.get('azeroth-v4-normal'), savedCampaign, 'v4 campaign remains byte-for-byte untouched');
  assert.equal(storage.get('unrelated-device-preference'), 'keep-me');
  assert.equal(storage.get('azeroth-display-language-v1'), language);

  // The renderer trial remains a separate, accessible opt-in decision.
  const panel = first.scope.document.body.children.find((node) => node.id === 'gpu-renderer-trial');
  assert(panel && panel.hidden, 'Trial is hidden until requested');
  assert(panel.style.cssText.includes('max-width:calc(100vw - 32px)'));
  const [title, hint, actions] = panel.children;
  assert(title && hint && actions);
  assert(actions.style.cssText.includes('gap:14px'), 'Actions need visible separation');
  assert.equal(actions.children.length, 2);
  for (const button of actions.children) {
    assert(button.style.cssText.includes('min-height:52px'), 'Large phone-safe touch target');
    assert(button.style.cssText.includes('width:100%'), 'Full-width, separately stacked action');
    assert.equal(typeof button.onclick, 'function', 'Both actions remain functional');
  }
  assert(hint.textContent.includes(language === 'en' ? 'run faster' : 'acelerar el juego'));

  // Once upgraded, later manual choices must survive every ordinary relaunch.
  storage.set('azeroth-fps-v1', '60');
  storage.set('azeroth-adaptive-frame-skip-v1', 'off');
  storage.set('azeroth-render-resolution-v1', '80');
  storage.set('azeroth-optimization-mode-v1', 'on');
  storage.set('azeroth-camera-v2', JSON.stringify({ desktop: 1, phone: 1.75 }));
  storage.set('azeroth-screen-v1', 'phone');
  // Simulate a clean previous shutdown, not the unrelated crash-rescue path.
  storage.delete('azeroth-active-play-recovery-v1');
  const second = shell(language, 'paladin', { storage });
  assert.equal(second.scope.Prototype.fps.preference, '60');
  assert.equal(second.scope.Prototype.frameSkip.enabled, false);
  assert.equal(second.scope.Prototype.renderResolution.preference, '80');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'on');
  assert.equal(second.scope.Prototype.platform.cameraZoom, 1.75);
  second.scope.Prototype.platform.select('desktop');
  assert.equal(second.scope.Prototype.platform.cameraZoom, 1);
  assert.equal(storage.get('azeroth-v4-normal'), savedCampaign);
  assert.equal(storage.get(migrationKey), 'applied');
}
console.log('PASS one-time returning-player performance baseline, v4 save safety and WebGL2 trial touch layout');
