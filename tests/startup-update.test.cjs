'use strict';
// Focused startup gate contract: atomic activation before menu, no graphics
// or save writes while checking, and clear offline / failed-check fallback.
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
function startup({ online = true, controller = true, waiting = false,
                   updateError = false, onUpdate = null } = {}) {
  const events = {}, messages = [];
  let updates = 0, reloads = 0;
  const worker = {
    state: 'installed',
    postMessage(value) { messages.push(value.type); },
  };
  const registration = {
    waiting: waiting ? worker : null,
    installing: null,
    addEventListener() {},
    async update() {
      updates++;
      if (updateError) throw Error('network failed');
      onUpdate?.(registration, worker);
    },
  };
  const sw = {
    controller: controller ? {} : null,
    addEventListener(name, fn) { (events[name] ??= []).push(fn); },
    async getRegistration() { return registration; },
    async register() { return registration; },
  };
  const app = shell('en', 'ranger', {
    stayOnTitle: true,
    location: { protocol: 'http:', hostname: 'localhost', search: '',
                reload() { reloads++; } },
    navigator: { serviceWorker: sw, onLine: online },
  });
  return {
    ...app, registration, events, messages,
    get updates() { return updates; },
    get reloads() { return reloads; },
    controllerChange() {
      for (const fn of events.controllerchange || []) fn();
    },
  };
}
(async () => {
  // An actual installed PWA starts with the update screen, not an
  // interactive menu or the player's rendering loop.
  {
    const a = startup({ onUpdate() {} });
    assert.equal(a.elements.get('startup-update').hidden, false);
    assert.equal(a.elements.get('title-screen').hidden, true);
    assert.equal(a.elements.get('title-continue').disabled, true);
    const saved = a.storage.get('azeroth-v4-normal');
    await flush();
    assert.equal(a.updates, 1, 'one freshness check before title');
    assert.equal(a.elements.get('startup-update').hidden, true);
    assert.equal(a.elements.get('title-screen').hidden, false);
    assert.equal(a.elements.get('title-continue').disabled, false);
    assert.equal(a.scope.Prototype.started, false);
    assert.equal(a.storage.get('azeroth-v4-normal'), saved, 'no save rewritten');
  }
  // The old menu must never be exposed while the new worker is waiting.
  {
    const a = startup({ waiting: true });
    const saved = a.storage.get('azeroth-v4-normal');
    await flush();
    assert.equal(a.updates, 0, 'a ready update needs no network');
    assert.deepEqual(a.messages, ['SKIP_WAITING']);
    assert.equal(a.elements.get('startup-update').hidden, false);
    assert.equal(a.elements.get('title-screen').hidden, true);
    assert.equal(a.scope.Prototype.started, false);
    assert.equal(a.storage.get('azeroth-v4-normal'), saved);
    a.controllerChange();
    a.controllerChange();
    assert.equal(a.reloads, 1, 'coherent new shell reloads once');
  }
  {
    const a = startup({
      onUpdate(reg, worker) { reg.waiting = worker; },
    });
    await flush();
    assert.deepEqual(a.messages, ['SKIP_WAITING']);
    assert.equal(a.elements.get('title-screen').hidden, true);
  }
  // Offline status is visible on the *main menu*, without preventing play.
  {
    const a = startup({ online: false });
    await flush();
    assert.equal(a.updates, 0, 'no pointless offline network update');
    assert.equal(a.elements.get('title-screen').hidden, false);
    const warning = a.elements.get('startup-update-notice');
    assert.equal(warning.hidden, false);
    assert.match(warning.textContent, /offline.*could not check/i);
    assert.equal(a.elements.get('title-continue').disabled, false);
  }
  {
    const a = startup({ online: true, updateError: true });
    await flush();
    assert.equal(a.updates, 1);
    assert.equal(a.elements.get('title-screen').hidden, false);
    assert.match(a.elements.get('startup-update-notice').textContent,
      /could not check for updates/i);
    assert.equal(a.elements.get('title-continue').disabled, false);
    assert.equal(a.messages.length, 0);
  }
  {
    const a = startup({ online: false, waiting: true });
    await flush();
    assert.deepEqual(a.messages, ['SKIP_WAITING'],
      'already downloaded version activates offline');
    assert.equal(a.elements.get('title-screen').hidden, true);
  }
  // The original local/portable presentation stays available without SW.
  {
    const a = shell('es', 'paladin', { stayOnTitle: true, seedSave: false });
    assert.equal(a.elements.get('startup-update').hidden, true);
    assert.equal(a.elements.get('title-screen').hidden, false);
    assert.equal(a.elements.get('title-new').disabled, false);
  }
  console.log('PASS automatic startup updates, coherent reload, offline status, save safety');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
