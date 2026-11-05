'use strict';
// Priority 4: actual Campaign, production app/menu shell and shared renderer
// contracts. These are native/DOM tests, NOT WebKit or physical-iPhone proof.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Ref = require('../src/prototype/skill-reference.js');
const { shell } = require('./helpers/production-shell.cjs');
const location = (search = '') => ({ protocol: 'file:', hostname: '', search });
const click = (app, text) => {
  const button = app.elements.get('modal-actions').children
    .find((item) => item.textContent.includes(text));
  assert(button, 'Missing menu action: ' + text);
  button.click();
};
const key = (app, code) => {
  for (const fn of app.events.keydown || [])
    fn({ code, target: {}, repeat: false, preventDefault() {} });
};
const publicApp = shell('en', 'paladin', {
  stayOnTitle: true, seedSave: false, location: location(),
});
assert.equal(publicApp.elements.get('developer-reversal').hidden, true);
assert.equal(Ref.card(publicApp.scope.Prototype.game, 1)?.name, 'Radiant Strike');
const app = shell('en', 'paladin', {
  stayOnTitle: true, seedSave: false, location: location('?developer=1'),
});
app.elements.get('title-new').click();
click(app, 'New Developer Mode run');
click(app, 'Strategist (Playtest)');
const g = app.scope.Prototype.game;
assert.equal(app.scope.Prototype.started, true);
assert.equal(g.s.mode, 'developer');
assert.equal(g.hero.class, 'strategist');
assert.deepEqual(g.hero.skills, [1, 1, 1, 0, 0, 0, 0, 0]);
const reversal = app.elements.get('developer-reversal');
assert.equal(reversal.hidden, false);
assert.equal(reversal.getAttribute('aria-label'), 'Strategist Reversal');
assert(app.elements.get('quick-items').classList.contains('has-rangers'),
  'Developer Reversal lives in the visible desktop quick-action dock');
for (const unit of g.s.party) {
  unit.hp = 0;
  unit.active = false;
}
app.scope.Prototype.updateHUD();
assert.equal(reversal.hidden, false);
assert(app.elements.get('quick-items').classList.contains('has-rangers'),
  'Reversal cannot disappear when the initial Archer falls');

// The actual menu collection previously dereferenced a nonexistent card.name.
key(app, 'KeyX');
assert.equal(app.elements.get('modal-title').textContent, 'Skill journal');
const entries = app.elements.get('modal-actions').children;
for (const label of ['Rinsing Cut', 'Stone Facet', 'Flash Temper'])
  assert(entries.some((entry) => entry.textContent.includes(label)), label);
assert(!entries.some((entry) => /Skill [4-8] ·/.test(entry.textContent)));
click(app, 'Rinsing Cut');
assert(app.elements.get('modal-title').textContent.includes('Rinsing Cut'));
const journalDescription = app.elements.get('modal-description').textContent;
assert(!/undefined|null/.test(journalDescription));
app.scope.Prototype.closeMenu();

let reversals = 0;
g.attemptStrategistReversalCommand = () => { reversals++; return true; };
key(app, 'KeyT');
assert.equal(reversals, 1, 'unbound T performs exactly one guarded Reversal');
reversal.click();
assert.equal(reversals, 2, 'independent touch action uses the same native command');
assert.equal(app.scope.Prototype.input.rebind('skill1', 'KeyT'), null);
key(app, 'KeyT');
assert.equal(reversals, 2, 'Reversal does not steal a player-customized key');

// Read-only reference of actual v3.2 implementation, never an earlier draft.
const before = JSON.stringify(g.snapshot());
for (const slot of [1, 2, 3]) {
  const info = Ref.describe(g, slot);
  assert(info?.tap?.effect && info?.charge?.effect, 'starter pair ' + slot);
  assert(Ref.changes(g, slot), 'rank preview ' + slot);
  assert(info.tap.metrics.some((m) => m.key === 'source'));
  assert(info.tap.metrics.some((m) => m.key === 'cooldown'));
}
assert.equal(Ref.describe(g, 4), null);
assert.equal(Ref.card(g, 8), null);
assert.equal(JSON.stringify(g.snapshot()), before, 'reference never mutates save');
assert.equal(Ref.describe(g, 2).tap.metrics.find((m) => m.key === 'opening').value, 0);
assert.equal(Ref.describe(g, 2).charge.metrics.find((m) => m.key === 'opening').value,
  C.rules.strategistFacet.notchHalfWidth * 2);
const originalDocument = global.document;
try {
  global.document = { documentElement: { lang: 'es-419' } };
  assert(Ref.card(g, 1).name.includes('Corte de lavado'));
  assert(Ref.describe(g, 2).charge.title === 'Cargada');
} finally {
  if (originalDocument === undefined) delete global.document;
  else global.document = originalDocument;
}

// The same native collision face is the ONLY owner of renderer geometry.
Object.assign(g.hero, { x: 500, y: 500, hp: 135, order: null });
g.formationHeading = { x: 1, y: 0 };
g.zone().props = []; g.zone().buildings = []; g.zone().npcs = [];
assert.equal(g.strategistFacetPresentation(), null);
assert(g.placeStrategistFacet(false));
const face = g.strategistFacetPresentation();
assert(face && face.notch === 0);
assert.equal(face.half, C.rules.strategistFacet.halfWidth);
g.clearStrategistFacet();
assert.equal(g.strategistFacetPresentation(), null);
assert(g.placeStrategistFacet(true));
assert.equal(g.strategistFacetPresentation().notch,
  C.rules.strategistFacet.notchHalfWidth);
g.s.time += C.rules.strategistFacet.seconds + 0.01;
assert.equal(g.strategistFacetPresentation(), null, 'expired face not painted');
assert.equal(C.restore(g.snapshot(), () => 0.9).strategistFacetPresentation(), null,
  'old face never appears in save/restore');
assert.equal(new C('normal', 'paladin').strategistFacetPresentation(), null,
  'public classes do not expose a Strategist face');
console.log('PASS Strategist Priority 4: Developer menu, Reversal, truthful bilingual skill reference and native face projection');
