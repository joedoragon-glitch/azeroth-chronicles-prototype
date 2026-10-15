'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Visuals = require('../src/prototype/visuals.js');

// Test the actual night painter, not an imaginary lighting flag. The same
// daytime scene must not emit lantern/window light or nighttime glows.
function render(night) {
  const events = { gradients: 0, windows: 0, lanterns: 0, rects: 0 };
  const gradient = () => ({ addColorStop() {} });
  const ctx = {
    save() {}, restore() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {}, strokeRect() {},
    createLinearGradient() { return gradient(); },
    createRadialGradient() { events.gradients++; return gradient(); },
    fillRect() {
      events.rects++;
      if (this.fillStyle === '#f2cb81') events.windows++;
      if (this.fillStyle === '#f4c57e') events.lanterns++;
    },
  };
  Visuals.atmosphere(ctx, { width: 375, height: 800 }, 0, {
    night, optimized: true,
    hero: { x: 210, y: 410 },
    lights: [
      { x: 110, y: 300, kind: 'window' },
      { x: 190, y: 350, kind: 'lantern' },
      { x: 260, y: 370, kind: 'fire' },
    ],
  });
  return events;
}
const day = render(false), night = render(true);
assert.equal(day.gradients, 0, 'daytime does not create artificial nocturnal glows');
assert.equal(day.windows, 0, 'house lights extinguish in daytime');
assert.equal(day.lanterns, 0, 'service lanterns do not overpaint the daylight scene');
assert(night.gradients >= 4, 'hero, living window, lantern and hearth each have light pools');
assert(night.windows >= 2, 'occupied windows look illuminated');
assert(night.lanterns >= 1, 'cozy hanging lanterns provide the primary civic light');
// Existing, location-appropriate fires remain supported without blanket
// torch generation or new physics and save objects.
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(renderer.includes('const nightSources = ['), 'light sources derive from actual existing entities');
assert(renderer.includes("kind: 'lantern'"), 'settlement and service lanterns are allowed');
assert(renderer.includes("kind: 'window'"), 'residential/barracks windows supply light');
assert(renderer.includes('game.visibleNPCs()'), 'only present interactable services contribute lamps');
assert(renderer.includes('lights: nightSources'), 'actual nearby sources reach atmosphere');
console.log('PASS day/night lighting contrast, inhabited windows, cozy lanterns and real-source glow');
