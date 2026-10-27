'use strict';
// Phase 3 notification contrast and precedence; no game rules, saves or lore text.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shell } = require('./helpers/production-shell.cjs');

const css = fs.readFileSync(path.join(__dirname, '../styles/phone.css'), 'utf8');
const segment = css.slice(css.indexOf('/* Phase 3: high-contrast notification'));
assert(segment.startsWith('/* Phase 3:'), 'contrast contract is present');
const textColors = [
  ['#102a34', '#f2f4e8', 'routine receipt'],
  ['#45291e', '#fff1d4', 'urgent technical status'],
  ['#edcb7e', '#211908', 'milestone title'],
  ['#edcb7e', '#4c3422', 'milestone detail'],
  ['#ffe0a7', '#30180c', 'warning title'],
  ['#ffe0a7', '#3b2312', 'warning detail'],
  ['#162a30', '#f8efd9', 'story text'],
  ['#162a30', '#e4ddca', 'story detail'],
  ['#122b36', '#f7f2e5', 'feedback title'],
  ['#122b36', '#e4e7e0', 'feedback detail'],
];
function luminance(hex) {
  const parts = hex.match(/[0-9a-f]{2}/gi);
  const channels = parts.map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function ratio(a, b) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}
for (const [background, foreground, role] of textColors) {
  assert(segment.includes(background) && segment.includes(foreground), role + ' palette declared');
  assert(ratio(background, foreground) >= 7, role + ' needs stronger than AA contrast');
}
assert(/#status\.notice-deferred\s*\{\s*visibility: hidden;/.test(segment),
  'routine status yields to important active announcements');
assert(segment.includes("data-notice-tier='critical'"), 'urgent technical receipts are separate');
assert(segment.includes("prefers-reduced-motion: reduce"), 'honor motion preferences');
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes("text === 'Performance recovered: combat resumed.' ? 1750"),
  'performance recovery receipt must be brief');
assert(app.includes("shortPhone ? 320 : 310"), 'phone amber notices remain bounded');
assert(app.includes("const deferRoutine = state.active.length > 0 && !urgent"),
  'warning/announcement takes precedence over a routine receipt');

for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language, 'ranger', {
    storage: new Map([['azeroth-screen-v1', 'phone']]),
  });
  const g = scope.Prototype.game, banner = elements.get('message');
  g.notices.length = 0;
  g.zone().enemies = [];
  g.s.projectiles = [];
  g.s.hazards = [];
  g.notice('A small routine event', 2, '', 'feedback');
  scope.Prototype.updateHUD();
  assert(banner.children[0].className.includes('notice-feedback'),
    language + ': routine feedback uses the muted visual tier');
  g.notice('Immediate danger', 0.5, 'Avoid the attack.', 'warning');
  scope.Prototype.updateHUD();
  assert(banner.children.some((n) => n.className.includes('notice-warning')),
    language + ': warning preempts feedback even on a one-card phone');
  assert.equal(banner.children[0].getAttribute('role'), 'alert',
    language + ': danger is accessible as an alert');
  assert(!elements.get('menu-button').hidden, language + ': Menu remains reachable');
  assert(!elements.get('recall-button').hidden, language + ': Recall remains reachable');
}
console.log('PASS phone high-contrast palettes (all 10 >= 7:1), notice priority, reduced motion and EN/ES shell');
