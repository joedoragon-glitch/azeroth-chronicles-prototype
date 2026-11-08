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
  const events = {}, registrationEvents = {}, messages = [];
  let updates = 0, reloads = 0, backgroundChecks = 0;
  const worker = {
    state: 'installed',
    postMessage(value) { messages.push(value.type); },
  };
  const registration = {
    waiting: waiting ? worker : null,
    installing: null,
    addEventListener(name, fn) { (registrationEvents[name] ??= []).push(fn); },
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
    onInterval() { backgroundChecks++; },
  });
  return {
    ...app, registration, events, registrationEvents, worker, messages,
    get updates() { return updates; },
    get reloads() { return reloads; },
    get backgroundChecks() { return backgroundChecks; },
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
    assert.equal(a.backgroundChecks, 0, 'no timed update polling during gameplay');
    for (const fn of a.events.focus || []) fn();
    for (const fn of a.events.online || []) fn();
    for (const fn of a.documentEvents.visibilitychange || []) fn();
    await flush();
    assert.equal(a.updates, 1, 'focus, online and visible do not check for updates');
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
  // Browser-driven updatefound can still surface a ready update without polling.
  {
    const a = startup();
    await flush();
    assert.equal(a.updates, 1, 'launch checked once');
    a.registration.waiting = a.worker;
    for (const fn of a.registrationEvents.updatefound || []) fn();
    assert.equal(a.elements.get('update-button').hidden, false,
      'a browser-discovered waiting update remains visible without a timer');
    assert.equal(a.reloads, 0, 'a notice never activates the update');
    assert.equal(a.updates, 1, 'showing the notice does not poll');
  }
  // A controller change outside an explicit update must NOT reload live play.
  // The player can deliberately install the newly controlled version later.
  {
    const a = startup();
    await flush();
    a.elements.get('title-continue').click();
    a.frame(0);
    await flush();
    a.frame(0);
    assert.equal(a.scope.Prototype.started, true, 'test entered gameplay');
    a.controllerChange();
    assert.equal(a.reloads, 0, 'unexpected service-worker takeover does not evict a campaign');
    assert.equal(a.scope.Prototype.started, true, 'the same campaign remains active');
    assert.equal(a.elements.get('update-button').hidden, false, 'update becomes opt-in');
    a.elements.get('update-button').click();
    await flush();
    assert.equal(a.reloads, 1, 'a deliberate update reloads once');
  }
  // History navigation should require a second deliberate Back gesture.
  // Do not register beforeunload: it can harm browser back/forward caching.
  {
    let pushes = 0, backs = 0;
    const history = {
      pushState() { pushes++; },
      back() { backs++; },
    };
    const a = shell('en', 'ranger', {
      location: { protocol: 'file:', hostname: '', href: 'file:///prototype/index.html' },
      history,
    });
    await flush();
    a.frame(0);
    assert.equal(a.scope.Prototype.started, true);
    assert.equal(pushes, 1, 'one history guard for a running campaign');
    for (const fn of a.events.popstate || []) fn();
    assert.equal(pushes, 2, 'accidental Back is intercepted once');
    assert.equal(backs, 0);
    for (const fn of a.events.popstate || []) fn();
    assert.equal(backs, 1, 'a deliberate second Back can leave');
    assert.equal((a.events.beforeunload || []).length, 0,
      'no unload prompt that can cause reload or interfere with BFCache');
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
  // On a true first launch, pick a language only after the update gate.
  // The display preference must not be written just to construct the app.
  {
    const storage = new Map();
    const originalSet = storage.set;
    let suppressInitialLanguageSeed = true;
    storage.set = function (key, value) {
      if (key === 'azeroth-display-language-v1' && suppressInitialLanguageSeed) {
        suppressInitialLanguageSeed = false;
        return this;
      }
      return originalSet.call(this, key, value);
    };
    const a = shell('en', 'paladin', { storage, stayOnTitle: true });
    await flush();
    assert.equal(storage.has('azeroth-display-language-v1'), false);
    assert.equal(a.elements.get('title-screen').hidden, true);
    const welcome = a.scope.document.body.children.find(
      (element) => element.id === 'language-welcome',
    );
    assert(welcome && !welcome.hidden, 'first-time welcome visible after update');
    const choices = welcome.children[0].children.find(
      (element) => element.className === 'language-welcome-choices',
    );
    assert.equal(choices.children.length, 2);
    const saved = storage.get('azeroth-v4-normal');
    choices.children[1].click();
    assert.equal(storage.get('azeroth-display-language-v1'), 'es');
    assert.equal(storage.get('azeroth-v4-normal'), saved, 'language does not rewrite save');
    assert.equal(welcome.hidden, true);
    assert.equal(a.elements.get('title-screen').hidden, false);
    a.elements.get('title-help').click();
    const about = a.elements.get('modal-actions').children.find(
      (item) => item.textContent.startsWith('Acerca de, versión y créditos'),
    );
    assert(about, 'Spanish Help exposes its About and Credits section');
    about.click();
    const credits = a.elements.get('modal-actions').children.find(
      (item) => item.textContent.startsWith('Créditos y contacto'),
    );
    assert(credits, 'Spanish Help contains creator credits, not control customization');
    credits.click();
    assert(a.elements.get('modal-description').textContent.includes('joedoragon@gmail.com'),
      'owner-approved public email appears in localized Credits');
    assert(a.elements.get('modal-description').textContent.includes('fcuba.net/members/282-nomura'),
      'verified forum profile appears in localized Credits');
    assert(a.elements.get('modal-actions').children.some(
      (item) => item.textContent.startsWith('Escribir al creador')),
      'Credits offers a user-initiated email action');
    a.elements.get('close-button').click();
    a.elements.get('close-button').click();
    a.elements.get('close-button').click();
    a.elements.get('title-new').click();
    assert.notEqual(a.elements.get('modal-title').textContent, 'Choose your language');
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
