'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const P = require('../src/prototype/persistence');
const { shell } = require('./helpers/production-shell.cjs');
function memory() {
  const values = new Map();
  return {
    values,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
  };
}
for (const original of ['{broken', JSON.stringify({ ...new C().snapshot(), version: 999 })]) {
  const storage = new Map([[P.saveKey('normal'), original]]);
  const app = shell('en', 'paladin', { storage });
  assert.equal(app.scope.Prototype.started, false);
  assert.equal(app.elements.get('title-continue').disabled, true);
  app.elements.get('title-saves').click();
  app.elements.get('modal-actions').children.find((x) => x.textContent.startsWith('Try recovery')).click();
  assert.equal(app.elements.get('modal-title').textContent, 'Saved run could not be opened');
  app.scope.Prototype.save();
  for (const fn of app.events.blur || []) fn();
  app.scope.document.hidden = true;
  for (const fn of app.documentEvents.visibilitychange || []) fn();
  for (const fn of app.events.pagehide || []) fn();
  assert.equal(
    storage.get(P.saveKey('normal')),
    original,
    'all startup lifecycle paths preserve original bytes',
  );
  const io = { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) };
  const adapter = P.create({ storage: io, Campaign: C });
  assert.equal(adapter.load('normal'), null);
  assert.equal(
    adapter.save(new C(), {}),
    false,
    'adapter refuses implicit failed-slot replacement',
  );
  assert(adapter.writeCandidate(new C()));
  assert.equal(storage.get(P.saveKey('normal') + '-unreadable-backup'), original);
  assert(C.restore(JSON.parse(storage.get(P.saveKey('normal')))));
}
// A missing selected mode must not overwrite a valid other-mode slot from title.
{
  const original = JSON.stringify(new C().snapshot());
  const storage = new Map([
    [P.saveKey('normal'), original],
    [P.profileKey, JSON.stringify({ activeMode: 'nightmare' })],
  ]);
  const app = shell('en', 'paladin', { storage });
  for (const fn of app.events.blur || []) fn();
  assert.equal(storage.get(P.saveKey('normal')), original);
}
// Failed validation and quota failures keep the last valid checkpoint.
{
  const storage = memory(),
    p = P.create({ storage, Campaign: C });
  const g = new C();
  assert(p.save(g, {}));
  const original = storage.getItem(P.saveKey('normal'));
  g.hero.cd[0] = Infinity;
  assert.equal(p.save(g, {}), false);
  assert.equal(storage.getItem(P.saveKey('normal')), original);
  const quota = P.create({
    storage: {
      getItem: storage.getItem,
      setItem() {
        throw Error('quota');
      },
    },
    Campaign: C,
  });
  assert.throws(() => quota.writeCandidate(new C()));
  assert.equal(storage.getItem(P.saveKey('normal')), original);
}


console.log(
  'PASS protected failed-load originals, startup lifecycle, explicit replacement backup and rejected writes',
);

(async () => {
  const original = '{broken';
  const app = shell('en', 'paladin', { storage: new Map([[P.saveKey('normal'), original]]) });
  const click = (prefix) => {
    const button = app.elements
      .get('modal-actions')
      .children.find((item) => item.textContent.startsWith(prefix));
    assert(button, prefix);
    button.click();
  };
  let exported;
  app.scope.URL.createObjectURL = (blob) => {
    exported = blob;
    return '';
  };
  app.elements.get('title-saves').click();
  click('Try recovery');
  click('Export original save');
  assert.equal(await exported.text(), original, 'Export retains the exact unreadable bytes');
  click('Start a new Normal run');
  // The saved language is reused; a new campaign does not choose language again.
  click('Choose Hero');
  app.scope.confirm = () => false;
  click('🛡');
  assert.equal(
    app.storage.get(P.saveKey('normal')),
    original,
    'Cancelling replacement preserves the original',
  );
  app.scope.confirm = () => true;
  const setItem = app.scope.localStorage.setItem;
  app.scope.localStorage.setItem = (key, value) => {
    if (key === P.saveKey('normal')) throw Error('quota');
    setItem(key, value);
  };
  const before = app.scope.Prototype.game;
  click('🛡');
  assert.equal(
    app.scope.Prototype.game,
    before,
    'A failed new-run write cannot replace the live run',
  );
  assert.equal(app.storage.get(P.saveKey('normal')), original);
  const candidate = new C();
  candidate.hero.gold = 321;
  const input = {
    files: [{ size: 100, text: async () => JSON.stringify(candidate.snapshot()) }],
    value: 'import',
  };
  await app.elements.get('import-file').onchange({ target: input });
  assert.equal(app.scope.Prototype.game, before, 'File selection cannot overwrite a save');
  click('Confirm import');
  assert.equal(
    app.scope.Prototype.game,
    before,
    'A failed confirmed import write preserves the live run',
  );
  assert.equal(app.storage.get(P.saveKey('normal')), original);
  app.scope.localStorage.setItem = setItem;
  await app.elements.get('import-file').onchange({ target: input });
  assert.equal(app.scope.Prototype.game, before, 'Selection still needs confirmation');
  click('Confirm import');
  assert.equal(app.scope.Prototype.game.hero.gold, 321);
  assert.equal(app.storage.get(P.saveKey('normal') + '-unreadable-backup'), original);
  assert.equal(app.elements.get('title-screen').hidden, false,
    'successful import deliberately returns to the title');
  assert.equal(app.elements.get('title-import-feedback').hidden, false,
    'title must visibly confirm import instead of hiding the HUD status');
  assert.match(app.elements.get('title-import-feedback').textContent,
    /Import successful.*Continue Adventure/);
  // Import button embeds a native file input directly in its visible row. File selection
  // should visibly confirm success, identify the loaded save, and preserve a
  // separate Continue step. Cancellation does not pretend to have imported.
  for (const language of ['en', 'es']) {
    const candidate = new C('normal', 'mage', () => 0.5);
    candidate.hero.gold = 777;
    const app = shell(language, 'mage', { stayOnTitle: true });
    const input = app.elements.get('import-file');
    app.elements.get('title-saves').click();
    const pickerRow = app.elements.get('modal-actions').children.find(
      (item) => item.textContent === (language === 'es' ? 'Importar partida' : 'Import save'),
    );
    assert(pickerRow, 'title save manager must expose import');
    assert(pickerRow.children.includes(input),
      'native file input must be part of the visible import action');
    assert.equal(input.hidden, false, 'import input must not remain hidden');
    assert.equal(app.elements.get('modal').hidden, false,
      'import dialog stays open until a file has been selected');
    const selection = {
      files: [{ size: 100, text: async () => JSON.stringify(candidate.snapshot()) }],
      value: 'import',
    };
    const original = app.storage.get(P.saveKey('normal'));
    await input.onchange({ target: selection });
    assert.equal(app.storage.get(P.saveKey('normal')), original,
      'Validated preview cannot change the stored primary');
    const confirm = app.elements.get('modal-actions').children.find(
      (item) => item.textContent ===
        (language === 'es' ? 'Confirmar importación' : 'Confirm import'),
    );
    assert(confirm, 'Import preview requires a bilingual confirmation action');
    confirm.click();
    assert.equal(app.scope.Prototype.game.hero.gold, 777);
    assert.equal(app.elements.get('title-screen').hidden, false);
    assert.equal(app.elements.get('title-import-feedback').hidden, false);
    assert.match(
      app.elements.get('title-import-feedback').textContent,
      language === 'es' ? /Importación completada.*Continuar aventura/ :
        /Import successful.*Continue Adventure/,
    );
    assert.match(app.elements.get('title-preview').textContent,
      language === 'es' ? /Nivel 1/ : /Level 1/);
    app.elements.get('title-continue').click();
    app.frame(60);
    assert.equal(app.scope.Prototype.started, true,
      'Continue must activate the imported save');
  }
  console.log(
    'PASS original export, cancelled replacement, quota-safe new run/import and explicit recovery',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// External exports are validated v4 round trips with meaningful filenames.
{
  const game = new C('nightmare', 'mage', () => 0.5);
  const prepared = P.prepareExternalExport(game, C, new Date('2026-11-03T12:34:00Z'));
  assert.match(prepared.filename, /^SIBDLP_nightmare_mage_L1_2026-11-03-12-34.json$/);
  assert.equal(C.restore(JSON.parse(prepared.text)).hero.class, 'mage');
  game.hero.cd[0] = Infinity;
  assert.throws(() => P.prepareExternalExport(game, C));
}
// Backup reminders store only bounded per-mode metadata, and survive denied
// metadata writes without creating additional local save copies.
{
  let clock = 1700000000000;
  const stored = new Map();
  const adapter = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
  const advisor = P.createBackupAdvisor({ storage: adapter, now: () => clock });
  assert.equal(advisor.due('normal', 1), false);
  assert.equal(advisor.due('normal', 6), true, 'Five new levels merit a reminder');
  advisor.shown('normal', 6);
  assert.equal(advisor.due('normal', 6), false, 'Reminder is dismissible/rate-limited');
  clock += 25 * 60 * 60 * 1000;
  advisor.downloadStarted('normal', 6);
  assert.equal(advisor.due('normal', 6), false);
  assert.equal(advisor.due('normal', 11), true);
  assert([...stored.keys()].every((key) => key.startsWith(P.externalReminderKey)));
  const blocked = P.createBackupAdvisor({
    storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } },
    now: () => clock,
  });
  assert.equal(blocked.due('normal', 1), false);
  assert.equal(blocked.due('normal', 6), true);
}
// Persistent-storage requests happen only in an explicit click handler.
(async () => {
  for (const granted of [true, false]) {
    let requests = 0;
    const app = shell('en', 'mage', {
      stayOnTitle: true,
      navigator: { storage: {
        persisted: async () => false,
        persist: async () => { requests++; return granted; },
      } },
    });
    assert.equal(requests, 0, 'Startup cannot request persistence');
    app.elements.get('title-saves').click();
    const button = app.elements.get('modal-actions').children.find(
      (item) => item.textContent === 'Request persistent storage',
    );
    assert(button, 'Only supported browsers offer an explicit persistence request');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(requests, 1);
    assert.equal(app.storage.has('azeroth-v4-normal'), true);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Campaign autosaves establish reminder age without opening a disruptive dialog.
{
  const app = shell('en', 'paladin');
  assert.equal(app.scope.Prototype.started, true);
  assert.equal(app.scope.Prototype.save(), true);
  const metadata = app.storage.get(P.externalReminderKey + '-normal');
  assert(metadata, 'First successful save anchors the advisory interval');
  const saved = JSON.parse(metadata);
  assert.equal(saved.version, 1);
  assert.equal(saved.firstSeenLevel, 1);
  assert.equal(app.elements.get('modal')?.hidden ?? true, true,
    'Autosaving must not create or open a backup modal');
}

// An aged reminder appears on the paused title, never as a combat interruption,
// and disappears after initiating a download without pretending it was retained.
for (const language of ['en', 'es']) {
  const savedGame = new C('normal', 'mage', () => 0.5);
  const storage = new Map([
    [P.saveKey('normal'), JSON.stringify(savedGame.snapshot())],
    [P.externalReminderKey + '-normal', JSON.stringify({
      version: 1,
      firstSeenAt: Date.now() - 3 * 3600000,
      firstSeenLevel: 1,
      downloadStartedAt: 0,
      downloadLevel: 1,
      lastShownAt: 0,
    })],
  ]);
  const app = shell(language, 'mage', { storage, stayOnTitle: true });
  assert.match(
    app.elements.get('title-preview').textContent,
    language === 'en' ? /external backup/ : /copia externa/,
    'Due reminder is visible while the campaign is paused at the title',
  );
  app.elements.get('title-saves').click();
  const exportAction = app.elements.get('modal-actions').children.find(
    (item) => item.textContent ===
      (language === 'en' ? 'Export normal' : 'Exportar normal'),
  );
  assert(exportAction, 'The title exposes a direct mode-specific export action');
  exportAction.click();
  const metadata = JSON.parse(storage.get(P.externalReminderKey + '-normal'));
  assert(metadata.downloadStartedAt > 0);
  assert.doesNotMatch(app.elements.get('title-preview').textContent,
    language === 'en' ? /external backup/ : /copia externa/);
}
