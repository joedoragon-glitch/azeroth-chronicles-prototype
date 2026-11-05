'use strict';
// Priority 3: original Campaign plus real app/persistence entrypoints.
// Deliberately scoped to admission, v4 ownership and public-class isolation.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const P = require('../src/prototype/persistence.js');
const { shell } = require('./helpers/production-shell.cjs');
const copy = (value) => JSON.parse(JSON.stringify(value));
const location = (search = '') => ({ protocol: 'file:', hostname: '', search });
const storageFor = (values) => ({
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
});
const click = (app, prefix) => {
  const button = app.elements.get('modal-actions').children
    .find((item) => item.textContent.startsWith(prefix));
  assert(button, 'Missing action: ' + prefix);
  button.click();
};

assert.deepEqual(Object.keys(C.classes), ['paladin', 'mage', 'ranger']);
assert.throws(() => new C('developer', 'strategist'), /Unknown mode or class/);

// Execute actual production app initialization without the preview URL.
// Rogue registers independently; there are exactly four public classes.
const publicApp = shell('en', 'paladin', {
  stayOnTitle: true, seedSave: false, location: location(),
});
const publicClasses = ['paladin', 'mage', 'ranger', 'rogue'];
assert.deepEqual(Object.keys(C.classes), publicClasses);
publicApp.elements.get('title-new').click();
assert(!publicApp.elements.get('modal-actions').children.some((a) =>
  a.textContent.includes('Developer Mode')));
click(publicApp, 'New Normal game');
click(publicApp, 'Standard death');
const publicOptions = publicApp.elements.get('modal-actions').children
  .map((a) => a.textContent);
assert.equal(publicOptions.filter((v) =>
  /Paladin|Mage|Ranger|Rogue/.test(v)).length, 4,
  'normal New Game has exactly four public class actions');
assert(publicOptions.some((v) => v.includes('Rogue')));
assert(!publicOptions.some((v) => v.includes('Strategist')));

// Exercise real v4 class constructors and round trips with both registrations
// present; public identities and initial company rules must stay unchanged.
const publicSnapshots = new Map();
for (const id of publicClasses) {
  const g = new C('normal', id, () => 0.9);
  assert.deepEqual(g.s.party.map((u) => u.type),
    id === 'rogue' ? [] : ['soldier', 'archer']);
  const saved = g.snapshot();
  publicSnapshots.set(id, saved);
  assert.equal(C.validate(saved).version, 4);
  assert.equal(C.restore(copy(saved), () => 0.9).hero.class, id);
}

const preview = shell('en', 'paladin', {
  stayOnTitle: true, seedSave: false, location: location('?developer=1'),
});
assert.deepEqual(Object.keys(C.classes).filter((id) => id !== 'strategist'),
  publicClasses, 'preview must not replace or mutate four public classes');
assert.equal(C.classes.strategist !== undefined, true);
preview.elements.get('title-new').click();
click(preview, 'New Developer Mode run');
const devOptions = preview.elements.get('modal-actions').children
  .map((a) => a.textContent);
assert(devOptions.some((s) => s.includes('Strategist (Playtest)')));
const strategistAction = preview.elements.get('modal-actions').children
  .find((item) => item.textContent.includes('Strategist (Playtest)'));
assert(strategistAction, 'Developer chooser has the actual Strategist preview action');
strategistAction.click();
const dev = preview.scope.Prototype.game;
assert.equal(dev.hero.class, 'strategist');
assert.equal(dev.s.mode, 'developer');
assert.deepEqual(dev.s.party.map((u) => u.type), ['soldier', 'archer']);
assert.deepEqual(dev.hero.skills, [1, 1, 1, 0, 0, 0, 0, 0]);
assert.equal(dev.s.companionCombatTraining, 1);
assert.equal(dev.companionSecondSkillUnlocked(), false);
assert.equal(dev.s.strategistAcidBottles, 0);
const devBytes = preview.storage.get(P.saveKey('developer'));
assert(devBytes, 'real Developer New Game must write the dedicated v4 slot');
assert.equal(JSON.parse(devBytes).hero.class, 'strategist');

// An explicit Developer preview may not leak into the normal class chooser.
const publicWithPreviewRegistered = shell('en', 'paladin', {
  stayOnTitle: true, seedSave: false, location: location('?developer=1'),
});
publicWithPreviewRegistered.elements.get('title-new').click();
click(publicWithPreviewRegistered, 'New Normal game');
click(publicWithPreviewRegistered, 'Standard death');
assert(!publicWithPreviewRegistered.elements.get('modal-actions').children.some((a) =>
  a.textContent.includes('Strategist')));
for (const mode of ['normal', 'nightmare', 'arena']) {
  assert.throws(() => new C(mode, 'strategist'), /Unknown mode or class/);
  const forged = copy(dev.snapshot());
  forged.mode = mode;
  assert.throws(() => C.restore(forged), /Invalid save/);
}
assert.throws(() => new C('developer', 'strategist', () => 0.9,
  { succession: true }), /Unknown mode or class/);
{
  const forgery = copy(dev.snapshot());
  forgery.challenge.succession = true;
  assert.throws(() => C.validate(forgery), /Invalid save/);
  const succession = new C('normal', 'mage', () => 0.9, { succession: true });
  succession.hero.hp = 0;
  succession.s.challenge.fallen = ['mage'];
  succession.s.challenge.pending = true;
  assert.equal(succession.successor('strategist'), false);
  assert.equal(succession.hero.class, 'mage');
}

// Legal starter rank improvements remain available, but no unrelated
// companion-training entitlement is conferred by the Ogre's Mineral skill.
dev.hero.gold = 500000;
dev.s.rescued.thorn = true;
assert.equal(dev.upgrade(1, 'thorn'), true);
assert.equal(dev.hero.skills[0], 2);
assert.equal(dev.s.companionCombatTraining, 1);
for (const [slot, teacher] of [
  [4, 'mire'], [5, 'ridge'], [6, 'ridge'],
  [7, 'warlord'], [8, 'citadel'],
]) {
  dev.s.rescued[teacher] = true;
  const before = dev.hero.gold;
  assert.equal(dev.skillRevealed(slot), false, 'unimplemented slot hidden ' + slot);
  assert.equal(dev.learn(slot, teacher), false, 'unimplemented lesson refused ' + slot);
  assert.equal(dev.hero.skills[slot - 1], 0);
  assert.equal(dev.hero.gold, before, 'no crowns spent on locked slot ' + slot);
  const forged = copy(dev.snapshot());
  forged.hero.skills[slot - 1] = 1;
  assert.throws(() => C.validate(forged), /Strategist skill progression/,
    'import cannot inject unimplemented Ogre skill ' + slot);
}
{
  const missingStarter = copy(dev.snapshot());
  missingStarter.hero.skills[1] = 0;
  assert.throws(() => C.validate(missingStarter), /Strategist skill progression/);
  const advanced = dev.hero.skills.slice();
  dev.hero.skills[3] = 1;
  assert.equal(dev.upgrade(4, 'mire'), false,
    'direct class method cannot upgrade unpublished Ogre lessons');
  dev.hero.skills = advanced;
}
const ordinary = new C('normal', 'mage', () => 0.9);
ordinary.s.rescued.mire = true;
ordinary.hero.gold = 500000;
assert.equal(ordinary.learn(4, 'mire'), true,
  'existing class teacher progression remains available');
assert.doesNotThrow(() => C.validate(ordinary.snapshot()));

// Actual v4 snapshot/restore and browser persistence retain legal inventory,
// skills, CD debt and companion ownership, but no transient attack work.
dev.s.strategistAcidBottles = 2;
dev.hero.cd[0] = 2.5;
dev.hero.chargedCd[1] = 4;
const soldier = dev.s.party[0].id, archer = dev.s.party[1].id;
dev.s.projectiles.push({ id: 'unsaved-preview-shot' });
dev.s.hazards.push({ id: 'unsaved-preview-hazard' });
const snap = dev.snapshot();
assert.deepEqual(snap.projectiles, []);
assert.deepEqual(snap.hazards, []);
assert.equal(snap.version, 4);
const restored = C.restore(copy(snap), () => 0.9);
assert.equal(restored.s.strategistAcidBottles, 2);
assert.deepEqual(restored.hero.skills, dev.hero.skills);
assert.equal(restored.hero.cd[0], 2.5);
assert.equal(restored.hero.chargedCd[1], 4);
assert.deepEqual(restored.s.party.map((u) => u.id), [soldier, archer]);
assert.deepEqual(restored.s.projectiles, []);
assert.deepEqual(restored.s.hazards, []);
assert.equal(restored.basicComboStep, 0);
assert.equal(restored.attemptStrategistReversalCommand(), false);
const importedTransient = copy(snap);
importedTransient.projectiles.push({ id: 'forged-old-flight' });
importedTransient.hazards.push({ id: 'forged-old-hazard' });
const normalized = C.restore(importedTransient, () => 0.9);
assert.deepEqual(normalized.s.projectiles, []);
assert.deepEqual(normalized.s.hazards, []);
for (const invalidStock of [-1, 0.2, 1001, null, '2']) {
  const forged = copy(snap);
  forged.strategistAcidBottles = invalidStock;
  assert.throws(() => C.validate(forged), /Acid Bottle/);
}
for (const saved of publicSnapshots.values()) {
  const forged = copy(saved);
  forged.strategistAcidBottles = 1;
  assert.throws(() => C.validate(forged), /Acid Bottle/);
}
const values = new Map(), io = storageFor(values);
const adapter = P.create({ storage: io, Campaign: C });
assert(adapter.save(restored, { activeMode: 'normal' }));
const priorBytes = values.get(P.saveKey('developer'));
assert(priorBytes);
assert.equal(P.create({ storage: io, Campaign: C }).load('developer')
  .s.strategistAcidBottles, 2);
const exported = P.prepareExternalExport(restored, C,
  new Date('2026-11-04T12:00:00Z'));
assert.equal(C.restore(JSON.parse(exported.text)).hero.class, 'strategist');
assert.equal(JSON.parse(exported.text).strategistAcidBottles, 2);
restored.s.strategistAcidBottles = -1;
assert.equal(adapter.save(restored, { activeMode: 'normal' }), false);
assert.equal(values.get(P.saveKey('developer')), priorBytes,
  'a rejected save cannot overwrite the last valid Developer campaign');

// Save and travel cannot reanimate a stationary Mineral face.
const face = new C('developer', 'strategist', () => 0.9);
Object.assign(face.hero, { x: 500, y: 500 });
face.formationHeading = { x: 1, y: 0 };
face.zone().props = [];
face.zone().buildings = [];
face.zone().npcs = [];
assert(face.placeStrategistFacet(), 'actual Campaign can place a physical face');
const shot = { id: 'future-stone', source: 'enemy', style: 'stone' };
const from = { x: 600, y: 500 }, to = { x: 450, y: 500 };
assert.equal(C.restore(face.snapshot(), () => 0.9)
  .strategistInterceptPhysicalProjectile(shot, from, to), false,
  'unsaved Mineral face does not survive load');
assert(face.enter('march') && face.enter('vale'));
assert.equal(face.strategistInterceptPhysicalProjectile(shot, from, to), false,
  'cross-zone round trip cannot resurrect the old face');
assert(face.placeStrategistFacet());
face.die();
assert.equal(face.strategistInterceptPhysicalProjectile(shot, from, to), false,
  'death cannot leave active physical interception in the next life');

// Public browser with a real saved preview in the same process still cannot
// load, list, or import the developer identity without the URL opt-in.
(async () => {
  const originalNormal = JSON.stringify(publicSnapshots.get('mage'));
  const savedSlots = new Map([
    [P.saveKey('normal'), originalNormal],
    [P.saveKey('developer'), devBytes],
  ]);
  const ordinaryBrowser = shell('en', 'mage', {
    stayOnTitle: true, storage: savedSlots, location: location(),
  });
  assert.equal(ordinaryBrowser.scope.Prototype.game.s.mode, 'normal');
  ordinaryBrowser.elements.get('title-saves').click();
  assert(!ordinaryBrowser.elements.get('modal-actions').children.some((a) =>
    a.textContent.startsWith('Developer')));
  const input = ordinaryBrowser.elements.get('import-file');
  await input.onchange({ target: {
    files: [{ size: devBytes.length, text: async () => devBytes }],
    value: 'preview-import',
  } });
  assert.equal(savedSlots.get(P.saveKey('normal')), originalNormal);
  assert.equal(savedSlots.get(P.saveKey('developer')), devBytes);
  assert(!ordinaryBrowser.elements.get('modal-actions').children.some((a) =>
    a.textContent === 'Confirm import'));

  const badSave = copy(snap);
  badSave.hero.skills[3] = 1;
  const before = preview.storage.get(P.saveKey('developer'));
  await preview.elements.get('import-file').onchange({ target: {
    files: [{ size: 500, text: async () => JSON.stringify(badSave) }],
    value: 'bad-preview',
  } });
  assert.equal(preview.storage.get(P.saveKey('developer')), before);
  console.log('PASS Strategist Priority 3 native Campaign, Developer browser, v4 persistence, public isolation and lifecycle');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
